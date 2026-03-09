/**
 * @agentos/kernel — Agent State Persistence
 *
 * Persistent checkpoint/restore for agent processes:
 * - Execution state serialization
 * - Checkpoint creation at configurable intervals
 * - Restore from checkpoint on failure
 * - State migration across cluster nodes
 * - Garbage collection of old checkpoints
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentCheckpoint {
    id: string;
    pid: string;
    workerId: string;
    createdAt: Date;
    expiresAt: Date;
    sizeBytes: number;
    state: {
        agentState: string;
        taskId?: string;
        executionStep: number;
        contextWindow: unknown[];
        toolCallHistory: Array<{ tool: string; result: unknown; timestamp: Date }>;
        memorySnapshot: Record<string, unknown>;
        reasoningSteps: unknown[];
    };
    metadata: {
        trigger: 'periodic' | 'pre-tool' | 'pre-drain' | 'manual';
        version: string;
        nodeId: string;
    };
}

export interface PersistenceConfig {
    /** Checkpoint interval (ms) */
    checkpointIntervalMs: number;
    /** Max checkpoints to retain per agent */
    maxCheckpointsPerAgent: number;
    /** Checkpoint TTL (ms) */
    checkpointTtlMs: number;
    /** Create checkpoint before risky tool calls */
    checkpointBeforeTools: boolean;
    /** Storage backend */
    backend: 'memory' | 'filesystem' | 'postgres' | 's3';
}

export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
    checkpointIntervalMs: 60_000, // 1 minute
    maxCheckpointsPerAgent: 5,
    checkpointTtlMs: 86_400_000, // 24 hours
    checkpointBeforeTools: true,
    backend: 'memory',
};

// ---------------------------------------------------------------------------
// State Persistence Engine
// ---------------------------------------------------------------------------

export class StatePersistenceEngine {
    private checkpoints = new Map<string, AgentCheckpoint[]>(); // pid → checkpoints
    private config: PersistenceConfig;

    constructor(config: Partial<PersistenceConfig> = {}) {
        this.config = { ...DEFAULT_PERSISTENCE_CONFIG, ...config };
    }

    /**
     * Create a checkpoint for an agent process.
     */
    async createCheckpoint(
        pid: string,
        state: AgentCheckpoint['state'],
        trigger: AgentCheckpoint['metadata']['trigger'] = 'periodic'
    ): Promise<AgentCheckpoint> {
        const stateJson = JSON.stringify(state);

        const checkpoint: AgentCheckpoint = {
            id: `ckpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            pid,
            workerId: '', // resolved by caller
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.checkpointTtlMs),
            sizeBytes: stateJson.length,
            state,
            metadata: {
                trigger,
                version: '1',
                nodeId: 'local',
            },
        };

        // Store
        const existing = this.checkpoints.get(pid) ?? [];
        existing.push(checkpoint);

        // Enforce max checkpoints
        while (existing.length > this.config.maxCheckpointsPerAgent) {
            existing.shift(); // remove oldest
        }

        this.checkpoints.set(pid, existing);

        // TODO: Persist to configured backend (filesystem, postgres, s3)

        return checkpoint;
    }

    /**
     * Restore agent state from the latest checkpoint.
     */
    async restore(pid: string): Promise<AgentCheckpoint | null> {
        const checkpoints = this.checkpoints.get(pid);
        if (!checkpoints || checkpoints.length === 0) return null;

        // Return most recent non-expired checkpoint
        const now = new Date();
        const valid = checkpoints.filter((c) => c.expiresAt > now);
        if (valid.length === 0) return null;

        return valid[valid.length - 1];
    }

    /**
     * Restore from a specific checkpoint ID.
     */
    async restoreFromCheckpoint(checkpointId: string): Promise<AgentCheckpoint | null> {
        for (const [, checkpoints] of this.checkpoints) {
            const found = checkpoints.find((c) => c.id === checkpointId);
            if (found) return found;
        }
        return null;
    }

    /**
     * List all checkpoints for an agent.
     */
    listCheckpoints(pid: string): AgentCheckpoint[] {
        return this.checkpoints.get(pid) ?? [];
    }

    /**
     * Garbage collect expired checkpoints.
     */
    gc(): { removed: number; remaining: number } {
        const now = new Date();
        let removed = 0;

        for (const [pid, checkpoints] of this.checkpoints) {
            const valid = checkpoints.filter((c) => c.expiresAt > now);
            removed += checkpoints.length - valid.length;
            if (valid.length === 0) {
                this.checkpoints.delete(pid);
            } else {
                this.checkpoints.set(pid, valid);
            }
        }

        let remaining = 0;
        for (const [, checkpoints] of this.checkpoints) {
            remaining += checkpoints.length;
        }

        return { removed, remaining };
    }

    /**
     * Migrate a checkpoint to a different node (for cluster rebalancing).
     */
    async migrate(checkpointId: string, targetNodeId: string): Promise<boolean> {
        // TODO: Serialize → transfer → deserialize on target node
        const checkpoint = await this.restoreFromCheckpoint(checkpointId);
        if (!checkpoint) return false;

        checkpoint.metadata.nodeId = targetNodeId;
        return true;
    }

    /**
     * Get persistence stats.
     */
    get stats() {
        let totalCheckpoints = 0;
        let totalSizeBytes = 0;

        for (const [, checkpoints] of this.checkpoints) {
            totalCheckpoints += checkpoints.length;
            totalSizeBytes += checkpoints.reduce((s, c) => s + c.sizeBytes, 0);
        }

        return {
            agents: this.checkpoints.size,
            totalCheckpoints,
            totalSizeMb: (totalSizeBytes / 1_048_576).toFixed(2),
        };
    }
}
