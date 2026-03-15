// Re-export db for gateway
export { InMemoryStore, SessionRepository, ExecutionRepository } from '../../../packages/db/src/connection.js';
export type { SessionRecord, ExecutionRecord, Store } from '../../../packages/db/src/connection.js';
export { PersistentStore } from '../../../packages/db/src/persistent-store.js';
export { PostgresStore } from '../../../packages/db/src/postgres-store.js';

// Unified execution types
export type {
  UnifiedExecution,
  UnifiedStep,
  ExecutionEdge,
  AgentKPI as UnifiedAgentKPI,
  UnifiedSkillDef,
  SkillStepDef,
  SkillInputField as UnifiedSkillInputField,
  ExecutionMode,
  ExecutableType,
  PersonaId,
  ExecutionStatus as UnifiedExecutionStatus,
  StepStatus as UnifiedStepStatus,
  PreCheckResult,
  NotificationRecord,
} from '../../../packages/db/src/unified-types.js';
