/**
 * @agentos/events — Package entrypoint
 */

// Types
export type {
    EventEnvelope,
    EventHandler,
    SubscriptionOptions,
    DeadLetterEntry,
    RetryConfig,
    BusHealth,
} from './types.js';

// Bus
export type { EventBus } from './bus.js';
export { InMemoryEventBus } from './bus.js';

// Contracts
export type {
    TaskCreatedData,
    TaskScheduledData,
    TaskStartedData,
    TaskCompletedData,
    TaskFailedData,
    TaskRetryingData,
    WorkerSpawnedData,
    WorkerReadyData,
    WorkerBusyData,
    WorkerIdleData,
    WorkerFailedData,
    WorkerTerminatedData,
    WorkflowStartedData,
    WorkflowStepCompletedData,
    WorkflowCompletedData,
    WorkflowFailedData,
    PolicyEvaluatedData,
    ApprovalRequestedData,
    ApprovalGrantedData,
    ApprovalDeniedData,
    SystemHealthData,
    SystemAlertData,
    EventTypeMap,
} from './contracts.js';
export { createEvent } from './contracts.js';

// Retry
export { withRetry, calculateDelay, DEFAULT_RETRY_CONFIG } from './retry.js';

// Idempotency
export type { IdempotencyStore } from './idempotency.js';
export {
    InMemoryIdempotencyStore,
    generateIdempotencyKey,
    withIdempotency,
} from './idempotency.js';
