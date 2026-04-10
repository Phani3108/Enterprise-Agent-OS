/**
 * Agent Status Reconciler — Ground-truth agent state derived from executions.
 *
 * Subscribes to execution events from the event bus and maintains a live
 * map of agent status (idle/working/waiting_approval). Runs a periodic
 * ground-truth sweep to correct any drift from missed events.
 *
 * This replaces the standalone `runtimes` Map in agent-runtime.ts for
 * "who is working right now?" queries. The runtimes Map still exists for
 * ephemeral agent creation — it's just no longer the source of truth for
 * UI status.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { eventBus } from './event-bus.js';
import { getAllExecutions } from './persona-api.js';
import { getAgentIdentity } from './agent-registry.js';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type AgentState = 'idle' | 'working' | 'waiting_approval' | 'error' | 'terminated';

export interface AgentStatusRecord {
  agentId: string;
  callSign: string;
  regiment?: string;
  rank?: string;
  state: AgentState;
  currentExecId?: string;
  currentStepId?: string;
  currentSkillName?: string;
  lastActiveAt: string;
  tasksThisHour: number;
}

// ═══════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════

const statusMap = new Map<string, AgentStatusRecord>();
const subscribers: Array<(record: AgentStatusRecord) => void> = [];

// Track task counts per agent in rolling 1-hour windows
const taskCountsByAgent = new Map<string, Array<number>>(); // timestamps

function countTasksThisHour(agentId: string): number {
  const timestamps = taskCountsByAgent.get(agentId) ?? [];
  const now = Date.now();
  const oneHourAgo = now - 3600_000;
  const recent = timestamps.filter(t => t >= oneHourAgo);
  taskCountsByAgent.set(agentId, recent);
  return recent.length;
}

function recordTaskStart(agentId: string): void {
  const timestamps = taskCountsByAgent.get(agentId) ?? [];
  timestamps.push(Date.now());
  taskCountsByAgent.set(agentId, timestamps);
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

function upsertStatus(agentId: string, partial: Partial<AgentStatusRecord>): AgentStatusRecord {
  const identity = getAgentIdentity(agentId);
  const existing = statusMap.get(agentId);
  const updated: AgentStatusRecord = {
    agentId,
    callSign: identity?.callSign ?? existing?.callSign ?? agentId,
    regiment: identity?.regiment ?? existing?.regiment,
    rank: identity?.rank ?? existing?.rank,
    state: existing?.state ?? 'idle',
    lastActiveAt: new Date().toISOString(),
    tasksThisHour: countTasksThisHour(agentId),
    ...existing,
    ...partial,
  };
  statusMap.set(agentId, updated);

  // Notify subscribers
  for (const sub of subscribers) {
    try { sub(updated); } catch (err) { console.error('[status-reconciler] subscriber error:', err); }
  }

  // Emit agent.state.changed event
  eventBus.emit('agent.state.changed', {
    agentId,
    callSign: updated.callSign,
    state: updated.state,
    currentExecId: updated.currentExecId,
    currentSkillName: updated.currentSkillName,
  }).catch(() => {});

  return updated;
}

export function getAgentStatusSnapshot(): AgentStatusRecord[] {
  return Array.from(statusMap.values());
}

export function getAgentStatus(agentId: string): AgentStatusRecord | undefined {
  return statusMap.get(agentId);
}

export function subscribeToAgentStatus(cb: (record: AgentStatusRecord) => void): () => void {
  subscribers.push(cb);
  return () => {
    const idx = subscribers.indexOf(cb);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}

/**
 * Reconcile agent status against ground truth (active executions).
 * Called every 5s to correct any drift from missed events.
 */
export function reconcileAgentStatus(): void {
  const activeExecs = getAllExecutions().filter(e => e.status === 'running');
  const busyAgents = new Set<string>();
  const waitingAgents = new Set<string>();

  for (const exec of activeExecs) {
    for (const step of exec.steps) {
      if (step.status === 'running') {
        busyAgents.add(step.agent);
        upsertStatus(step.agent, {
          state: 'working',
          currentExecId: exec.id,
          currentStepId: step.stepId,
          currentSkillName: exec.skillName,
        });
      } else if (step.status === 'approval_required') {
        waitingAgents.add(step.agent);
        upsertStatus(step.agent, {
          state: 'waiting_approval',
          currentExecId: exec.id,
          currentStepId: step.stepId,
          currentSkillName: exec.skillName,
        });
      }
    }
  }

  // Any agent that's marked working/waiting but isn't in the ground truth → mark idle
  for (const [agentId, record] of statusMap) {
    if ((record.state === 'working' || record.state === 'waiting_approval')
        && !busyAgents.has(agentId)
        && !waitingAgents.has(agentId)) {
      upsertStatus(agentId, {
        state: 'idle',
        currentExecId: undefined,
        currentStepId: undefined,
        currentSkillName: undefined,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Event Bus Subscriptions
// ═══════════════════════════════════════════════════════════════

let reconcilerInitialized = false;

export function initAgentStatusReconciler(): void {
  if (reconcilerInitialized) return;
  reconcilerInitialized = true;

  // Subscribe to execution events
  eventBus.on('execution.step.started', (event) => {
    const { stepId, agent, execId } = event.data as { stepId?: string; agent?: string; execId?: string };
    if (!agent) return;
    recordTaskStart(agent);

    // Look up skill name from the execution
    const exec = getAllExecutions().find(e => e.id === execId);
    upsertStatus(agent, {
      state: 'working',
      currentExecId: execId,
      currentStepId: stepId,
      currentSkillName: exec?.skillName,
    });
  });

  eventBus.on('execution.step.completed', (event) => {
    const { agent, status } = event.data as { agent?: string; status?: string };
    if (!agent) return;

    if (status === 'approval_required') {
      upsertStatus(agent, { state: 'waiting_approval' });
    }
    // On 'completed', we leave the state alone — the sweep will clear it once
    // the full execution finishes and no other step is running for this agent.
  });

  eventBus.on('execution.completed', (event) => {
    const { execId } = event.data as { execId?: string };
    // Clear any agents that were tied to this execution
    for (const [agentId, record] of statusMap) {
      if (record.currentExecId === execId) {
        upsertStatus(agentId, {
          state: 'idle',
          currentExecId: undefined,
          currentStepId: undefined,
          currentSkillName: undefined,
        });
      }
    }
  });

  // Ground-truth sweep every 5 seconds
  setInterval(() => {
    try { reconcileAgentStatus(); } catch (err) { console.error('[status-reconciler] sweep error:', err); }
  }, 5000);

  console.log('✅ [status-reconciler] initialized');
}
