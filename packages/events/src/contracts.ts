/**
 * @agentos/events — Event Contracts
 *
 * Typed event definitions for all AgentOS event types.
 * These provide compile-time type safety for event producers and consumers.
 */

import type { EventEnvelope } from './types.js';

// ---------------------------------------------------------------------------
// Task Events
// ---------------------------------------------------------------------------

export interface TaskCreatedData {
    taskId: string;
    workflowId?: string;
    executionId?: string;
    type: string;
    input: unknown;
    priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface TaskScheduledData {
    taskId: string;
    workerId: string;
    scheduledAt: Date;
}

export interface TaskStartedData {
    taskId: string;
    workerId: string;
    startedAt: Date;
}

export interface TaskCompletedData {
    taskId: string;
    output: unknown;
    durationMs: number;
    tokensUsed: number;
}

export interface TaskFailedData {
    taskId: string;
    error: {
        code: string;
        message: string;
    };
    retryCount: number;
    retryable: boolean;
}

export interface TaskRetryingData {
    taskId: string;
    attempt: number;
    nextRetryAt: Date;
    reason: string;
}

// ---------------------------------------------------------------------------
// Worker Events
// ---------------------------------------------------------------------------

export interface WorkerSpawnedData {
    workerId: string;
    cluster: string;
    model: string;
}

export interface WorkerReadyData {
    workerId: string;
    capabilities: string[];
}

export interface WorkerBusyData {
    workerId: string;
    taskId: string;
}

export interface WorkerIdleData {
    workerId: string;
}

export interface WorkerFailedData {
    workerId: string;
    error: string;
    restartCount: number;
}

export interface WorkerTerminatedData {
    workerId: string;
    reason: 'shutdown' | 'error' | 'scaling' | 'manual';
}

// ---------------------------------------------------------------------------
// Workflow Events
// ---------------------------------------------------------------------------

export interface WorkflowStartedData {
    executionId: string;
    workflowId: string;
    trigger: unknown;
}

export interface WorkflowStepCompletedData {
    executionId: string;
    stepId: string;
    output: unknown;
    durationMs: number;
}

export interface WorkflowCompletedData {
    executionId: string;
    result: unknown;
    durationMs: number;
    stepsCompleted: number;
}

export interface WorkflowFailedData {
    executionId: string;
    failedStep: string;
    error: string;
}

// ---------------------------------------------------------------------------
// Governance Events
// ---------------------------------------------------------------------------

export interface PolicyEvaluatedData {
    policyId: string;
    policyName: string;
    action: string;
    decision: 'allow' | 'deny' | 'escalate';
    reason?: string;
}

export interface ApprovalRequestedData {
    approvalId: string;
    action: string;
    description: string;
    approvers: string[];
    timeoutMinutes: number;
}

export interface ApprovalGrantedData {
    approvalId: string;
    approver: string;
    grantedAt: Date;
}

export interface ApprovalDeniedData {
    approvalId: string;
    approver: string;
    reason: string;
    deniedAt: Date;
}

// ---------------------------------------------------------------------------
// System Events
// ---------------------------------------------------------------------------

export interface SystemHealthData {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, unknown>;
}

export interface SystemAlertData {
    alertId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    source: string;
}

// ---------------------------------------------------------------------------
// Event Type Map — typed event factory
// ---------------------------------------------------------------------------

/**
 * Maps event type strings to their corresponding data types.
 * Use this for type-safe event creation and consumption.
 */
export interface EventTypeMap {
    'task.created': TaskCreatedData;
    'task.scheduled': TaskScheduledData;
    'task.started': TaskStartedData;
    'task.completed': TaskCompletedData;
    'task.failed': TaskFailedData;
    'task.retrying': TaskRetryingData;
    'worker.spawned': WorkerSpawnedData;
    'worker.ready': WorkerReadyData;
    'worker.busy': WorkerBusyData;
    'worker.idle': WorkerIdleData;
    'worker.failed': WorkerFailedData;
    'worker.terminated': WorkerTerminatedData;
    'workflow.started': WorkflowStartedData;
    'workflow.step_completed': WorkflowStepCompletedData;
    'workflow.completed': WorkflowCompletedData;
    'workflow.failed': WorkflowFailedData;
    'policy.evaluated': PolicyEvaluatedData;
    'approval.requested': ApprovalRequestedData;
    'approval.granted': ApprovalGrantedData;
    'approval.denied': ApprovalDeniedData;
    'system.health': SystemHealthData;
    'system.alert': SystemAlertData;
}

/**
 * Create a typed event envelope.
 */
export function createEvent<K extends keyof EventTypeMap>(
    type: K,
    data: EventTypeMap[K],
    context: {
        source: string;
        traceId: string;
        tenantId: string;
        executionId?: string;
        subject?: string;
    }
): EventEnvelope<EventTypeMap[K]> {
    return {
        id: crypto.randomUUID(),
        type,
        source: context.source,
        subject: context.subject,
        time: new Date(),
        specVersion: '1.0',
        dataContentType: 'application/json',
        data,
        traceId: context.traceId,
        tenantId: context.tenantId,
        executionId: context.executionId,
        idempotencyKey: `${context.traceId}:${type}:${Date.now()}`,
        metadata: {},
    };
}
