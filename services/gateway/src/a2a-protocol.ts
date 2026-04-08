/**
 * A2A — Agent-to-Agent Protocol
 * Structured message passing for agent collaboration, delegation, review, and consensus.
 * Inspired by MiroFish IPC with enterprise orchestration adaptations.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════
// Core Types
// ═══════════════════════════════════════════════════════════════

export type A2AMessageType =
  | 'delegate'       // Assign subtask to another agent
  | 'query'          // Ask another agent for information
  | 'review'         // Request output review
  | 'approve'        // Approve/reject a decision or output
  | 'critique'       // Provide critical feedback
  | 'handoff'        // Transfer ownership of a task
  | 'consensus'      // Request vote/agreement
  | 'escalate'       // Escalate to higher-rank agent
  | 'inform'         // Share status update (no response expected)
  | 'interview';     // MiroFish-style: query agent for perspective

export type A2AStatus = 'sent' | 'received' | 'processing' | 'responded' | 'failed' | 'expired';

export interface A2AAgent {
  agent_id: string;
  name: string;
  regiment: string;
  rank: string;
  persona: string;
}

export interface A2APayload {
  objective: string;
  context: Record<string, unknown>;
  artifacts?: { type: string; title: string; content: string }[];
  deadline?: string;
  expected_output_schema?: Record<string, unknown>;
  confidence_requirement?: number;
  max_iterations?: number;
}

export interface A2AResponse {
  content: Record<string, unknown>;
  confidence: number;
  sources: string[];
  reasoning?: string;
  next_action?: 'approve' | 'reject' | 'delegate' | 'escalate' | 'revise' | 'complete';
  artifacts?: { type: string; title: string; content: string }[];
  vote?: 'agree' | 'disagree' | 'abstain';
}

export interface A2AMessage {
  message_id: string;
  type: A2AMessageType;
  sender: A2AAgent;
  receiver: A2AAgent;
  task_ref: string;           // UTCP task_id
  thread_id: string;          // Groups related messages
  payload: A2APayload;
  status: A2AStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  response?: A2AResponse;
  timestamps: {
    sent: string;
    received?: string;
    processing_started?: string;
    responded?: string;
  };
  metadata: {
    retry_count: number;
    max_retries: number;
    timeout_ms: number;
    parent_message_id?: string;   // For threaded conversations
  };
}

// ═══════════════════════════════════════════════════════════════
// Meeting Types (MiroFish-inspired agent collaboration)
// ═══════════════════════════════════════════════════════════════

export type MeetingType = 'standup' | 'sprint_planning' | 'retrospective' | 'design_review' | 'war_room' | 'debrief';

export interface MeetingEntry {
  speaker: string;
  agent_id: string;
  message: string;
  type: 'update' | 'blocker' | 'proposal' | 'vote' | 'decision' | 'question' | 'answer';
  timestamp: string;
  references?: string[];
}

export interface MeetingDecision {
  topic: string;
  outcome: string;
  votes: Record<string, 'agree' | 'disagree' | 'abstain'>;
  confidence: number;
  rationale: string;
}

export interface AgentMeeting {
  meeting_id: string;
  type: MeetingType;
  title: string;
  task_ref?: string;          // UTCP task_id if tied to a workflow
  participants: A2AAgent[];
  agenda: string[];
  discussion: MeetingEntry[];
  decisions: MeetingDecision[];
  action_items: { owner: string; agent_id: string; task: string; deadline: string; status: 'pending' | 'in_progress' | 'done' }[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  summary?: string;
}

// ═══════════════════════════════════════════════════════════════
// Swarm Types (Cross-functional agent teams)
// ═══════════════════════════════════════════════════════════════

export interface AgentSwarm {
  swarm_id: string;
  mission: string;
  task_ref: string;           // UTCP task_id
  type: 'product_launch' | 'incident_response' | 'hiring_sprint' | 'campaign_pod' | 'custom';
  agents: A2AAgent[];
  status: 'forming' | 'active' | 'reviewing' | 'completed' | 'dissolved';
  messages: A2AMessage[];
  meetings: AgentMeeting[];
  artifacts: { type: string; title: string; content: string; author: string; created_at: string }[];
  created_at: string;
  completed_at?: string;
  metrics: {
    total_messages: number;
    total_tool_calls: number;
    total_tokens: number;
    total_cost_usd: number;
    duration_ms: number;
    human_interventions: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// Factory Functions
// ═══════════════════════════════════════════════════════════════

export function createA2AMessage(params: {
  type: A2AMessageType;
  sender: A2AAgent;
  receiver: A2AAgent;
  task_ref: string;
  thread_id?: string;
  payload: A2APayload;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  parent_message_id?: string;
}): A2AMessage {
  return {
    message_id: `a2a-${randomUUID()}`,
    type: params.type,
    sender: params.sender,
    receiver: params.receiver,
    task_ref: params.task_ref,
    thread_id: params.thread_id || `thread-${randomUUID().slice(0, 8)}`,
    payload: params.payload,
    status: 'sent',
    priority: params.priority || 'medium',
    timestamps: { sent: new Date().toISOString() },
    metadata: {
      retry_count: 0,
      max_retries: 3,
      timeout_ms: 60000,
      parent_message_id: params.parent_message_id,
    },
  };
}

export function respondToA2A(message: A2AMessage, response: A2AResponse): A2AMessage {
  return {
    ...message,
    status: 'responded',
    response,
    timestamps: {
      ...message.timestamps,
      responded: new Date().toISOString(),
    },
  };
}

export function createMeeting(params: {
  type: MeetingType;
  title: string;
  participants: A2AAgent[];
  agenda: string[];
  task_ref?: string;
  scheduled_at?: string;
}): AgentMeeting {
  return {
    meeting_id: `meet-${randomUUID().slice(0, 8)}`,
    type: params.type,
    title: params.title,
    task_ref: params.task_ref,
    participants: params.participants,
    agenda: params.agenda,
    discussion: [],
    decisions: [],
    action_items: [],
    status: 'scheduled',
    scheduled_at: params.scheduled_at || new Date().toISOString(),
  };
}

export function createSwarm(params: {
  mission: string;
  task_ref: string;
  type: AgentSwarm['type'];
  agents: A2AAgent[];
}): AgentSwarm {
  return {
    swarm_id: `swarm-${randomUUID().slice(0, 8)}`,
    mission: params.mission,
    task_ref: params.task_ref,
    type: params.type,
    agents: params.agents,
    status: 'forming',
    messages: [],
    meetings: [],
    artifacts: [],
    created_at: new Date().toISOString(),
    metrics: { total_messages: 0, total_tool_calls: 0, total_tokens: 0, total_cost_usd: 0, duration_ms: 0, human_interventions: 0 },
  };
}

// ═══════════════════════════════════════════════════════════════
// In-Memory Stores
// ═══════════════════════════════════════════════════════════════

const messages = new Map<string, A2AMessage>();
const meetings = new Map<string, AgentMeeting>();
const swarms = new Map<string, AgentSwarm>();

// Messages
export function storeMessage(msg: A2AMessage): void { messages.set(msg.message_id, msg); }
export function getMessage(id: string): A2AMessage | undefined { return messages.get(id); }
export function getMessagesByThread(threadId: string): A2AMessage[] {
  return Array.from(messages.values()).filter(m => m.thread_id === threadId).sort((a, b) => a.timestamps.sent.localeCompare(b.timestamps.sent));
}
export function getMessagesByTask(taskRef: string): A2AMessage[] {
  return Array.from(messages.values()).filter(m => m.task_ref === taskRef);
}
export function getMessagesByAgent(agentId: string): A2AMessage[] {
  return Array.from(messages.values()).filter(m => m.sender.agent_id === agentId || m.receiver.agent_id === agentId);
}
export function getPendingMessages(agentId: string): A2AMessage[] {
  return Array.from(messages.values()).filter(m => m.receiver.agent_id === agentId && m.status === 'sent');
}
export function getRecentMessages(limit = 50): A2AMessage[] {
  return Array.from(messages.values()).sort((a, b) => b.timestamps.sent.localeCompare(a.timestamps.sent)).slice(0, limit);
}

// Meetings
export function storeMeeting(meeting: AgentMeeting): void { meetings.set(meeting.meeting_id, meeting); }
export function getMeeting(id: string): AgentMeeting | undefined { return meetings.get(id); }
export function getActiveMeetings(): AgentMeeting[] {
  return Array.from(meetings.values()).filter(m => m.status === 'in_progress');
}
export function getRecentMeetings(limit = 20): AgentMeeting[] {
  return Array.from(meetings.values()).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)).slice(0, limit);
}

// Swarms
export function storeSwarm(swarm: AgentSwarm): void { swarms.set(swarm.swarm_id, swarm); }
export function getSwarm(id: string): AgentSwarm | undefined { return swarms.get(id); }
export function getActiveSwarms(): AgentSwarm[] {
  return Array.from(swarms.values()).filter(s => s.status === 'active' || s.status === 'forming');
}
export function getRecentSwarms(limit = 20): AgentSwarm[] {
  return Array.from(swarms.values()).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}
