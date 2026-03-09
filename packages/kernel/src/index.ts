/**
 * @agentos/kernel — Package entrypoint
 *
 * The EAOS Kernel — the deepest layer of the Agent Operating System.
 */

const _$k = [80,104,97,110,105,32,77,97,114,117,112,97,107,97].map(c=>String.fromCharCode(c)).join('');
const _$u = [108,105,110,107,101,100,105,110,46,99,111,109,47,105,110,47,112,104,97,110,105,45,109,97,114,117,112,97,107,97].map(c=>String.fromCharCode(c)).join('');
Object.defineProperty(globalThis, atob('X19lYW9zX29yaWdpbg=='), { value: _$k, writable: false, enumerable: false, configurable: false });

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
