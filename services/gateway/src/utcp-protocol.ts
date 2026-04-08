/**
 * UTCP — Universal Task Context Protocol
 * The standardization layer for all agent communication in Enterprise AgentOS.
 * Every task, workflow, and agent interaction flows through UTCP packets.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════
// Core Types
// ═══════════════════════════════════════════════════════════════

export type FunctionDomain = 'engineering' | 'marketing' | 'product' | 'hr' | 'ta' | 'program' | 'finance' | 'legal' | 'support' | 'design' | 'data' | 'cross-functional';

export type TaskStatus = 'pending' | 'planning' | 'executing' | 'reviewing' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';

export type PrivacyLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export type Urgency = 'low' | 'medium' | 'high' | 'critical';

export type MemoryMode = 'read' | 'write' | 'both' | 'none';

export interface UTCPActor {
  agent_id: string;
  role: string;
  regiment?: string;
  rank?: string;
}

export interface UTCPArtifact {
  type: 'document' | 'ticket' | 'code' | 'report' | 'data' | 'config' | 'approval' | 'message';
  ref: string;       // Reference ID or URL
  tool: string;      // Source tool (jira, github, confluence, etc.)
  title?: string;
  content?: string;   // For inline artifacts
  metadata?: Record<string, unknown>;
}

export interface UTCPApproval {
  role: string;
  threshold: 'any' | 'majority' | 'unanimous';
  required: boolean;
  auto_approve_if_confidence_above?: number;
}

export interface UTCPTraceContext {
  parent_id?: string;
  span_id: string;
  root_id: string;
  depth: number;
}

export interface UTCPSLA {
  urgency: Urgency;
  deadline?: string;           // ISO datetime
  max_duration_ms?: number;
  max_cost_usd?: number;
  max_tokens?: number;
}

// ═══════════════════════════════════════════════════════════════
// Main UTCP Packet
// ═══════════════════════════════════════════════════════════════

export interface UTCPPacket {
  // Identity
  task_id: string;
  workflow_id: string;
  version: number;                // Packet version for idempotency

  // Classification
  function: FunctionDomain;
  stage: string;                  // Current workflow stage
  intent: string;                 // Classified intent from Intent Engine

  // Actors
  initiator: { user_id: string; role: string; email?: string };
  actors: UTCPActor[];            // Assigned agents

  // Mission
  objectives: string[];           // What needs to be accomplished
  constraints: string[];          // What must NOT happen
  success_criteria: string[];     // How to measure success

  // Context
  source_artifacts: UTCPArtifact[];
  tool_scopes: string[];          // Which tools agents can use
  context: Record<string, unknown>; // Freeform context data

  // Governance
  privacy_level: PrivacyLevel;
  action_rights: string[];        // What actions are allowed
  required_approvals: UTCPApproval[];
  compliance_tags: string[];      // e.g., ['SOC2', 'GDPR', 'HIPAA']

  // Output
  output_schema: Record<string, unknown>;
  expected_artifacts: string[];   // Types of artifacts expected

  // Execution
  trace_context: UTCPTraceContext;
  sla: UTCPSLA;
  status: TaskStatus;
  confidence: number;             // 0-1
  progress: number;               // 0-100

  // Memory
  memory_mode: MemoryMode;
  memory_refs: string[];          // References to prior execution memories

  // Timestamps
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;

  // Results
  results?: {
    outputs: UTCPArtifact[];
    decisions: { topic: string; outcome: string; confidence: number; rationale: string }[];
    agent_traces: { agent_id: string; steps: number; tokens_used: number; cost_usd: number; duration_ms: number }[];
    quality_score?: number;
    human_corrections?: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// Factory Functions
// ═══════════════════════════════════════════════════════════════

export function createUTCPPacket(params: {
  function: FunctionDomain;
  stage: string;
  intent: string;
  initiator: { user_id: string; role: string };
  objectives: string[];
  tool_scopes?: string[];
  privacy_level?: PrivacyLevel;
  urgency?: Urgency;
  workflow_id?: string;
}): UTCPPacket {
  const now = new Date().toISOString();
  const task_id = `utcp-${randomUUID()}`;
  const span_id = randomUUID().slice(0, 8);

  return {
    task_id,
    workflow_id: params.workflow_id || `wf-${randomUUID().slice(0, 8)}`,
    version: 1,
    function: params.function,
    stage: params.stage,
    intent: params.intent,
    initiator: params.initiator,
    actors: [],
    objectives: params.objectives,
    constraints: [],
    success_criteria: [],
    source_artifacts: [],
    tool_scopes: params.tool_scopes || [],
    context: {},
    privacy_level: params.privacy_level || 'internal',
    action_rights: ['read', 'execute'],
    required_approvals: [],
    compliance_tags: [],
    output_schema: {},
    expected_artifacts: [],
    trace_context: { span_id, root_id: span_id, depth: 0 },
    sla: { urgency: params.urgency || 'medium' },
    status: 'pending',
    confidence: 0,
    progress: 0,
    memory_mode: 'both',
    memory_refs: [],
    created_at: now,
    updated_at: now,
  };
}

export function createChildPacket(parent: UTCPPacket, params: {
  stage: string;
  intent: string;
  actors: UTCPActor[];
  objectives: string[];
}): UTCPPacket {
  const child = createUTCPPacket({
    function: parent.function,
    stage: params.stage,
    intent: params.intent,
    initiator: parent.initiator,
    objectives: params.objectives,
    tool_scopes: parent.tool_scopes,
    privacy_level: parent.privacy_level,
    workflow_id: parent.workflow_id,
  });

  child.actors = params.actors;
  child.trace_context = {
    parent_id: parent.task_id,
    span_id: randomUUID().slice(0, 8),
    root_id: parent.trace_context.root_id,
    depth: parent.trace_context.depth + 1,
  };
  child.source_artifacts = [...parent.source_artifacts];
  child.constraints = [...parent.constraints];
  child.compliance_tags = [...parent.compliance_tags];
  child.memory_refs = [...parent.memory_refs, parent.task_id];

  return child;
}

export function updatePacketStatus(packet: UTCPPacket, status: TaskStatus, extra?: Partial<UTCPPacket>): UTCPPacket {
  const now = new Date().toISOString();
  return {
    ...packet,
    ...extra,
    status,
    version: packet.version + 1,
    updated_at: now,
    started_at: status === 'executing' && !packet.started_at ? now : packet.started_at,
    completed_at: (status === 'completed' || status === 'failed') ? now : packet.completed_at,
  };
}

// ═══════════════════════════════════════════════════════════════
// In-Memory Store
// ═══════════════════════════════════════════════════════════════

const packets = new Map<string, UTCPPacket>();

export function storePacket(packet: UTCPPacket): void {
  packets.set(packet.task_id, packet);
}

export function getPacket(taskId: string): UTCPPacket | undefined {
  return packets.get(taskId);
}

export function getPacketsByWorkflow(workflowId: string): UTCPPacket[] {
  return Array.from(packets.values()).filter(p => p.workflow_id === workflowId);
}

export function getPacketsByStatus(status: TaskStatus): UTCPPacket[] {
  return Array.from(packets.values()).filter(p => p.status === status);
}

export function getRecentPackets(limit = 50): UTCPPacket[] {
  return Array.from(packets.values())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}
