/**
 * @agentos/kernel — Package entrypoint
 *
 * The EAOS Kernel — the deepest layer of the Agent Operating System.
 */

// Lifecycle
export { AgentLifecycleManager } from './lifecycle.js';
export type {
    AgentProcess, ProcessResources, LifecycleEvent, SpawnOptions,
} from './lifecycle.js';

// Cluster
export { ClusterOrchestrator } from './cluster.js';
export type {
    ClusterDefinition, ScalingDecision, ClusterHealth,
} from './cluster.js';

// Persistence
export { StatePersistenceEngine, DEFAULT_PERSISTENCE_CONFIG } from './persistence.js';
export type {
    AgentCheckpoint, PersistenceConfig,
} from './persistence.js';

// Security Isolation
export { SecurityIsolation, DEFAULT_POLICIES } from './isolation.js';
export type {
    PrivilegeLevel, SecurityContext, SecurityViolation, IsolationPolicy,
} from './isolation.js';
