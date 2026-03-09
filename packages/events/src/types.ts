/**
 * @agentos/events — Event Types
 *
 * Shared type definitions for the event bus system.
 */

/**
 * Event envelope conforming to the AgentOS event schema.
 */
export interface EventEnvelope<T = unknown> {
    id: string;
    type: string;
    source: string;
    subject?: string;
    time: Date;
    specVersion: '1.0';
    dataContentType: 'application/json';
    data: T;
    traceId: string;
    tenantId: string;
    executionId?: string;
    idempotencyKey: string;
    metadata: Record<string, string>;
}

/**
 * Subscription handler function.
 */
export type EventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void>;

/**
 * Subscription options.
 */
export interface SubscriptionOptions {
    /** Consumer group name for load-balanced consumption */
    group?: string;
    /** Start from the beginning of the stream */
    fromBeginning?: boolean;
    /** Maximum number of concurrent message processing */
    concurrency?: number;
    /** Acknowledgement timeout in ms */
    ackTimeoutMs?: number;
}

/**
 * Dead-letter entry for events that failed processing.
 */
export interface DeadLetterEntry<T = unknown> {
    originalEvent: EventEnvelope<T>;
    consumer: string;
    failureCount: number;
    lastError: string;
    firstFailedAt: Date;
    lastFailedAt: Date;
    status: 'pending_review' | 'reprocessing' | 'discarded';
}

/**
 * Retry configuration for event processing.
 */
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

/**
 * Bus health status.
 */
export interface BusHealth {
    connected: boolean;
    latencyMs: number;
    pendingMessages: number;
    failedMessages: number;
    uptime: number;
}
