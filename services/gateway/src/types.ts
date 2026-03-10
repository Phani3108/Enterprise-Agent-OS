/**
 * AgentOS Gateway — Shared Data Model Types
 *
 * Backend source of truth interfaces matching the AgentOS Data Model Blueprint.
 * Re-exported for use across all gateway service modules.
 *
 * © 2025 Phani Marupaka. All rights reserved.
 */

export type UserRole = 'admin' | 'user' | 'corp_it' | 'moderator';
export type ToolAuthType = 'oauth' | 'api_key' | 'mcp' | 'manual';
export type SkillStatus = 'draft' | 'published' | 'archived';
export type SkillVisibility = 'private' | 'team' | 'organization';
export type ExecutionStatus = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
export type StepType = 'intent' | 'agent' | 'tool' | 'prompt' | 'workflow' | 'approval' | 'output';
export type StepStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type VoteType = 'up' | 'down';
export type ACPMessageStatus = 'sent' | 'received' | 'processed' | 'failed';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'pending';
export type BillingPeriod = 'monthly' | 'quarterly' | 'annual' | 'one_time';

export interface GatewayUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  personaId?: string;
}

export interface GatewayExecution {
  id: string;
  userId: string;
  personaId?: string;
  skillId?: string;
  workflowId?: string;
  status: ExecutionStatus;
  intentText?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  success?: boolean;
  errorSummary?: string;
  createdAt: string;
  steps?: GatewayExecutionStep[];
  agentsUsed?: string[];
  toolsUsed?: string[];
  tokensUsed?: number;
  costUsd?: number;
}

export interface GatewayExecutionStep {
  id: string;
  executionId: string;
  stepOrder: number;
  stepType: StepType;
  agentId?: string;
  agentName?: string;
  toolId?: string;
  toolName?: string;
  name: string;
  status: StepStatus;
  inputJson?: unknown;
  outputJson?: unknown;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
}

export interface GatewayMemoryNode {
  id: string;
  nodeType: 'user' | 'persona' | 'skill' | 'workflow' | 'agent' | 'tool' | 'execution' | 'artifact' | 'feedback';
  entityId: string;
  title?: string;
  propertiesJson?: Record<string, unknown>;
  createdAt: string;
}

export interface GatewayMemoryEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: string;
  weight?: number;
  propertiesJson?: Record<string, unknown>;
  createdAt: string;
}

export interface GatewayACPMessage {
  id: string;
  executionId: string;
  senderAgentId: string;
  senderAgentName?: string;
  targetAgentId?: string;
  targetAgentName?: string;
  eventType: string;
  payloadJson?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
  status: ACPMessageStatus;
  createdAt: string;
  processedAt?: string;
}

export interface GatewayACPExecution {
  id: string;
  name: string;
  personaName: string;
  skillName?: string;
  status: ExecutionStatus;
  startedAt: string;
  agents: Array<{
    id: string;
    name: string;
    personaName?: string;
    model: string;
    status: string;
  }>;
  messages: GatewayACPMessage[];
}

export interface GatewayAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  result: 'success' | 'failure' | 'warning';
  metadata?: Record<string, unknown>;
}

export interface GatewayCostAttribution {
  personaId: string;
  personaName: string;
  personaIcon: string;
  skillsUsed: number;
  toolCalls: number;
  estimatedCostUsd: number;
  budgetUsd: number;
  budgetPct: number;
}

export interface GatewayServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptime: number;
  lastCheckedAt: string;
}
