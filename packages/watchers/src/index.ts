/**
 * @agentos/watchers — Package entrypoint
 */
export {
    BaseWatcher, DriftWatcher, CostWatcher, ComplianceWatcher,
    PerformanceWatcher, WatcherManager,
} from './watchers.js';
export type {
    WatcherType, WatcherSeverity, WatcherStatus, WatcherConfig,
    WatcherAlert, WatcherCheckResult,
} from './watchers.js';
