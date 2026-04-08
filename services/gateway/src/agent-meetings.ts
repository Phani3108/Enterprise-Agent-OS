/**
 * Agent Meetings — Orchestration module for agent standups, sprint planning,
 * retrospectives, design reviews, and war rooms.
 * Agents discuss, propose, vote, and produce action items autonomously.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { randomUUID } from 'crypto';
import {
  createMeeting, storeMeeting, getMeeting, getRecentMeetings, getActiveMeetings,
  type AgentMeeting, type MeetingEntry, type MeetingDecision, type A2AAgent, type MeetingType,
} from './a2a-protocol.js';

// ═══════════════════════════════════════════════════════════════
// Meeting Templates
// ═══════════════════════════════════════════════════════════════

export interface MeetingTemplate {
  type: MeetingType;
  title: string;
  defaultAgenda: string[];
  defaultDurationMin: number;
  requiredRoles: string[];
  description: string;
}

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    type: 'standup',
    title: 'Daily Standup',
    defaultAgenda: ['What did each agent accomplish?', 'What is each agent working on next?', 'Are there any blockers?'],
    defaultDurationMin: 15,
    requiredRoles: ['Colonel', 'Captain'],
    description: 'Quick sync — each agent reports status, blockers, and next steps.',
  },
  {
    type: 'sprint_planning',
    title: 'Sprint Planning',
    defaultAgenda: ['Review backlog items', 'Estimate effort for each item', 'Assign agents to tasks', 'Set sprint goal', 'Identify dependencies'],
    defaultDurationMin: 60,
    requiredRoles: ['Colonel', 'Captain', 'Corporal'],
    description: 'Plan the next sprint — prioritize, estimate, assign, and set goals.',
  },
  {
    type: 'retrospective',
    title: 'Sprint Retrospective',
    defaultAgenda: ['What went well?', 'What could be improved?', 'Action items for next sprint'],
    defaultDurationMin: 45,
    requiredRoles: ['Colonel', 'Captain', 'Corporal'],
    description: 'Reflect on the sprint — celebrate wins, identify improvements.',
  },
  {
    type: 'design_review',
    title: 'Design Review',
    defaultAgenda: ['Present proposed approach', 'Technical feasibility assessment', 'Risk analysis', 'Decision and next steps'],
    defaultDurationMin: 30,
    requiredRoles: ['Captain', 'Corporal'],
    description: 'Review a technical or product design — critique, validate, decide.',
  },
  {
    type: 'war_room',
    title: 'War Room',
    defaultAgenda: ['Incident status', 'Impact assessment', 'Root cause hypotheses', 'Remediation plan', 'Communication draft'],
    defaultDurationMin: 90,
    requiredRoles: ['Colonel', 'Captain', 'Corporal'],
    description: 'Urgent cross-functional response to a critical incident.',
  },
  {
    type: 'debrief',
    title: 'Execution Debrief',
    defaultAgenda: ['Review execution outputs', 'Quality assessment', 'What the agents learned', 'Improvement recommendations'],
    defaultDurationMin: 20,
    requiredRoles: ['Captain'],
    description: 'Post-execution review — assess quality, capture learnings.',
  },
];

// ═══════════════════════════════════════════════════════════════
// Agent Roster (available agents for meetings)
// ═══════════════════════════════════════════════════════════════

const AGENT_ROSTER: A2AAgent[] = [
  // Titan Regiment (Marketing)
  { agent_id: 'hyperion', name: 'Colonel Hyperion', regiment: 'Titan', rank: 'Colonel', persona: 'Marketing' },
  { agent_id: 'iris', name: 'Captain Iris', regiment: 'Titan', rank: 'Captain', persona: 'Marketing' },
  { agent_id: 'nova', name: 'Corporal Nova', regiment: 'Titan', rank: 'Corporal', persona: 'Marketing' },
  { agent_id: 'apollo', name: 'Captain Apollo', regiment: 'Titan', rank: 'Captain', persona: 'Marketing' },
  // Olympian Regiment (Engineering)
  { agent_id: 'atlas', name: 'Colonel Atlas', regiment: 'Olympian', rank: 'Colonel', persona: 'Engineering' },
  { agent_id: 'prometheus', name: 'Captain Prometheus', regiment: 'Olympian', rank: 'Captain', persona: 'Engineering' },
  { agent_id: 'mercury', name: 'Corporal Mercury', regiment: 'Olympian', rank: 'Corporal', persona: 'Engineering' },
  { agent_id: 'vulcan', name: 'Sergeant Vulcan', regiment: 'Olympian', rank: 'Sergeant', persona: 'Engineering' },
  // Asgard Regiment (Product)
  { agent_id: 'themis', name: 'Colonel Themis', regiment: 'Asgard', rank: 'Colonel', persona: 'Product' },
  { agent_id: 'odin', name: 'Captain Odin', regiment: 'Asgard', rank: 'Captain', persona: 'Product' },
  { agent_id: 'freya', name: 'Corporal Freya', regiment: 'Asgard', rank: 'Corporal', persona: 'Product' },
  // Explorer Regiment (HR)
  { agent_id: 'rhea', name: 'Colonel Rhea', regiment: 'Explorer', rank: 'Colonel', persona: 'HR' },
  { agent_id: 'demeter', name: 'Captain Demeter', regiment: 'Explorer', rank: 'Captain', persona: 'HR' },
  // Program
  { agent_id: 'chronos', name: 'Colonel Chronos', regiment: 'Vanguard', rank: 'Colonel', persona: 'Program' },
  { agent_id: 'hermes', name: 'Captain Hermes', regiment: 'Vanguard', rank: 'Captain', persona: 'Program' },
];

// ═══════════════════════════════════════════════════════════════
// Meeting Orchestration
// ═══════════════════════════════════════════════════════════════

/** Start a meeting from a template with auto-selected agents */
export function startMeetingFromTemplate(
  templateType: MeetingType,
  persona?: string,
  customAgenda?: string[],
  taskRef?: string,
): AgentMeeting {
  const template = MEETING_TEMPLATES.find(t => t.type === templateType) || MEETING_TEMPLATES[0];

  // Auto-select agents based on persona and required roles
  let candidates = persona
    ? AGENT_ROSTER.filter(a => a.persona === persona)
    : AGENT_ROSTER;

  // For cross-functional meetings (war room), pull from multiple regiments
  if (templateType === 'war_room') {
    candidates = AGENT_ROSTER.filter(a => ['Colonel', 'Captain'].includes(a.rank));
  }

  // Limit to 6 participants max
  const participants = candidates.slice(0, 6);

  const meeting = createMeeting({
    type: templateType,
    title: template.title,
    participants,
    agenda: customAgenda || template.defaultAgenda,
    task_ref: taskRef,
  });

  // Start the meeting immediately
  meeting.status = 'in_progress';
  meeting.started_at = new Date().toISOString();

  // Simulate the meeting discussion
  simulateMeetingDiscussion(meeting, template);

  storeMeeting(meeting);
  return meeting;
}

/** Simulate a meeting discussion between agents */
function simulateMeetingDiscussion(meeting: AgentMeeting, template: MeetingTemplate): void {
  const participants = meeting.participants;
  if (participants.length === 0) return;

  const now = Date.now();

  // Opening by highest-ranking agent
  const leader = participants.find(p => p.rank === 'Colonel') || participants[0];
  meeting.discussion.push({
    speaker: leader.name,
    agent_id: leader.agent_id,
    message: `Opening ${template.title}. Today's agenda: ${meeting.agenda.join(', ')}.`,
    type: 'update',
    timestamp: new Date(now).toISOString(),
  });

  // Each agent gives update based on meeting type
  const responses = generateAgentResponses(meeting.type, participants);
  responses.forEach((entry, i) => {
    meeting.discussion.push({
      ...entry,
      timestamp: new Date(now + (i + 1) * 15000).toISOString(),
    });
  });

  // Generate decisions if applicable
  if (['sprint_planning', 'design_review', 'war_room'].includes(meeting.type)) {
    const decisions = generateMeetingDecisions(meeting.type, participants);
    meeting.decisions.push(...decisions);
  }

  // Generate action items
  const actions = generateActionItems(meeting.type, participants);
  meeting.action_items.push(...actions);

  // Closing
  meeting.discussion.push({
    speaker: leader.name,
    agent_id: leader.agent_id,
    message: `Closing ${template.title}. ${meeting.decisions.length} decisions made, ${meeting.action_items.length} action items assigned.`,
    type: 'update',
    timestamp: new Date(now + (responses.length + 2) * 15000).toISOString(),
  });

  // Mark complete
  meeting.status = 'completed';
  meeting.completed_at = new Date(now + (responses.length + 3) * 15000).toISOString();
  meeting.summary = `${template.title} completed with ${participants.length} agents. ${meeting.decisions.length} decisions, ${meeting.action_items.length} action items.`;
}

function generateAgentResponses(type: MeetingType, agents: A2AAgent[]): Omit<MeetingEntry, 'timestamp'>[] {
  const entries: Omit<MeetingEntry, 'timestamp'>[] = [];

  for (const agent of agents) {
    switch (type) {
      case 'standup':
        entries.push({
          speaker: agent.name, agent_id: agent.agent_id,
          message: `[${agent.persona}] Completed ${Math.floor(Math.random() * 5) + 1} tasks yesterday. Working on ${agent.persona.toLowerCase()} pipeline optimization today. No blockers.`,
          type: 'update',
        });
        break;

      case 'sprint_planning':
        entries.push({
          speaker: agent.name, agent_id: agent.agent_id,
          message: `I can take ${Math.floor(Math.random() * 3) + 2} story points this sprint. Recommending we prioritize the ${agent.persona.toLowerCase()} workflow automation.`,
          type: 'proposal',
        });
        break;

      case 'retrospective':
        entries.push({
          speaker: agent.name, agent_id: agent.agent_id,
          message: `What went well: cross-agent delegation improved throughput by 23%. To improve: need better context passing in A2A handoffs.`,
          type: 'update',
        });
        break;

      case 'design_review':
        entries.push({
          speaker: agent.name, agent_id: agent.agent_id,
          message: `From a ${agent.persona.toLowerCase()} perspective, the proposed design handles ${Math.random() > 0.3 ? 'our requirements well' : 'most cases but misses edge case around approval gates'}.`,
          type: agent.rank === 'Colonel' ? 'decision' : 'update',
        });
        break;

      case 'war_room':
        entries.push({
          speaker: agent.name, agent_id: agent.agent_id,
          message: `${agent.persona} impact assessment: ${Math.random() > 0.5 ? 'No direct impact on our workflows' : 'Active executions may be affected — recommending pause on new skill runs'}.`,
          type: 'update',
        });
        break;

      case 'debrief':
        entries.push({
          speaker: agent.name, agent_id: agent.agent_id,
          message: `Execution quality score: ${(0.7 + Math.random() * 0.25).toFixed(2)}. ${Math.random() > 0.5 ? 'Output met expectations.' : 'Suggest refining the prompt contract for better structured output.'}`,
          type: 'update',
        });
        break;
    }
  }

  return entries;
}

function generateMeetingDecisions(type: MeetingType, agents: A2AAgent[]): MeetingDecision[] {
  const decisions: MeetingDecision[] = [];
  const votes: Record<string, 'agree' | 'disagree' | 'abstain'> = {};
  agents.forEach(a => { votes[a.agent_id] = Math.random() > 0.15 ? 'agree' : 'abstain'; });

  switch (type) {
    case 'sprint_planning':
      decisions.push({
        topic: 'Sprint goal',
        outcome: 'Deliver cross-functional workflow orchestration and improve agent handoff quality',
        votes, confidence: 0.88,
        rationale: 'Aligns with quarterly OKR and addresses key technical debt in A2A protocol',
      });
      break;
    case 'design_review':
      decisions.push({
        topic: 'Architecture approach',
        outcome: 'Approved with minor revisions — add circuit breaker to MCP tool calls',
        votes, confidence: 0.82,
        rationale: 'Design is sound for MVP, circuit breaker prevents cascading tool failures',
      });
      break;
    case 'war_room':
      decisions.push({
        topic: 'Remediation plan',
        outcome: 'Pause non-critical executions, roll back gateway to previous version, investigate root cause',
        votes, confidence: 0.91,
        rationale: 'Minimizes blast radius while investigation proceeds',
      });
      break;
  }

  return decisions;
}

function generateActionItems(type: MeetingType, agents: A2AAgent[]): AgentMeeting['action_items'] {
  const items: AgentMeeting['action_items'] = [];
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  if (agents.length >= 2) {
    items.push({
      owner: agents[0].name, agent_id: agents[0].agent_id,
      task: type === 'war_room' ? 'Draft incident communication' : 'Update execution pipeline with meeting decisions',
      deadline: tomorrow, status: 'pending',
    });
    items.push({
      owner: agents[1].name, agent_id: agents[1].agent_id,
      task: type === 'retrospective' ? 'Implement top improvement item' : 'Create follow-up tasks in Jira',
      deadline: nextWeek, status: 'pending',
    });
  }
  if (agents.length >= 3) {
    items.push({
      owner: agents[2].name, agent_id: agents[2].agent_id,
      task: 'Run quality check on recent execution outputs',
      deadline: tomorrow, status: 'pending',
    });
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
// Delegation Chain (Colonel → Captain → Corporal)
// ═══════════════════════════════════════════════════════════════

export interface DelegationStep {
  from: A2AAgent;
  to: A2AAgent;
  task: string;
  reason: string;
  timestamp: string;
}

export interface DelegationChain {
  chain_id: string;
  task_ref: string;
  steps: DelegationStep[];
  current_owner: A2AAgent;
  status: 'active' | 'completed' | 'escalated';
}

const delegationChains = new Map<string, DelegationChain>();

/** Delegate a task down the chain of command */
export function delegateTask(taskRef: string, task: string, persona: string): DelegationChain {
  const agents = AGENT_ROSTER.filter(a => a.persona === persona);
  const colonel = agents.find(a => a.rank === 'Colonel');
  const captain = agents.find(a => a.rank === 'Captain');
  const corporal = agents.find(a => a.rank === 'Corporal') || agents.find(a => a.rank === 'Sergeant');

  const chain: DelegationChain = {
    chain_id: `chain-${randomUUID().slice(0, 8)}`,
    task_ref: taskRef,
    steps: [],
    current_owner: colonel || agents[0],
    status: 'active',
  };

  const now = Date.now();

  // Colonel reviews and delegates to Captain
  if (colonel && captain) {
    chain.steps.push({
      from: colonel, to: captain,
      task: `Review and decompose: ${task}`,
      reason: 'Delegating execution planning to Captain-level agent',
      timestamp: new Date(now).toISOString(),
    });
    chain.current_owner = captain;
  }

  // Captain delegates specific subtasks to Corporal
  if (captain && corporal) {
    chain.steps.push({
      from: captain, to: corporal,
      task: `Execute subtask: ${task}`,
      reason: 'Delegating hands-on execution to Corporal-level agent',
      timestamp: new Date(now + 5000).toISOString(),
    });
    chain.current_owner = corporal;
  }

  delegationChains.set(chain.chain_id, chain);
  return chain;
}

/** Escalate a task back up the chain */
export function escalateTask(chainId: string, reason: string): DelegationChain | undefined {
  const chain = delegationChains.get(chainId);
  if (!chain || chain.steps.length === 0) return undefined;

  const lastStep = chain.steps[chain.steps.length - 1];
  chain.steps.push({
    from: lastStep.to, to: lastStep.from,
    task: `Escalated: ${lastStep.task}`,
    reason,
    timestamp: new Date().toISOString(),
  });
  chain.current_owner = lastStep.from;
  chain.status = 'escalated';
  delegationChains.set(chainId, chain);
  return chain;
}

export function getDelegationChain(chainId: string): DelegationChain | undefined {
  return delegationChains.get(chainId);
}

export function getDelegationChainsByTask(taskRef: string): DelegationChain[] {
  return Array.from(delegationChains.values()).filter(c => c.task_ref === taskRef);
}

export function getAgentRoster(persona?: string): A2AAgent[] {
  return persona ? AGENT_ROSTER.filter(a => a.persona === persona) : AGENT_ROSTER;
}

export function getMeetingTemplates(): MeetingTemplate[] {
  return MEETING_TEMPLATES;
}
