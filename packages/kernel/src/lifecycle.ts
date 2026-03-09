/**
 * @agentos/kernel — EAOS Kernel: Agent Lifecycle Manager
 *
 * The deepest layer of the Agent Operating System. Manages the
 * complete lifecycle of all agent processes across the cluster.
 *
 * Responsibilities:
 * - Agent process creation, supervision, and termination
 * - Health monitoring with automatic restart
 * - Resource quota enforcement
 * - Graceful drain and rolling restart
 * - Process group management
 */

import type { AgentState } from '@agentos/runtime';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentProcess {
    pid: string;
    workerId: string;
    cluster: string;
    state: AgentState;
    createdAt: Date;
    lastHeartbeat: Date;
    resources: ProcessResources;
    metadata: Record<string, unknown>;
}

export interface ProcessResources {
    memoryMb: number;
    memoryLimitMb: number;
    cpuPercent: number;
    cpuLimitPercent: number;
    tokensUsed: number;
    tokenBudget: number;
    openConnections: number;
    connectionLimit: number;
}

export interface LifecycleEvent {
    pid: string;
    event: 'spawned' | 'initialized' | 'assigned' | 'executing' | 'completed'
    | 'failed' | 'draining' | 'terminated' | 'restarted' | 'killed';
    timestamp: Date;
    details: Record<string, unknown>;
}

export interface SpawnOptions {
    workerId: string;
    cluster: string;
    resources: Partial<ProcessResources>;
    priority: number;
    affinityLabels: string[];
    restartPolicy: 'always' | 'on-failure' | 'never';
    maxRestarts: number;
}

// ---------------------------------------------------------------------------
// Agent Lifecycle Manager
// ---------------------------------------------------------------------------

export class AgentLifecycleManager {
    private processes = new Map<string, AgentProcess>();
    private events: LifecycleEvent[] = [];
    private restartCounts = new Map<string, number>();

    /**
     * Spawn a new agent process.
     */
    spawn(options: SpawnOptions): AgentProcess {
        const pid = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const process: AgentProcess = {
            pid,
            workerId: options.workerId,
            cluster: options.cluster,
            state: 'initializing',
            createdAt: new Date(),
            lastHeartbeat: new Date(),
            resources: {
                memoryMb: 0,
                memoryLimitMb: options.resources.memoryLimitMb ?? 512,
                cpuPercent: 0,
                cpuLimitPercent: options.resources.cpuLimitPercent ?? 25,
                tokensUsed: 0,
                tokenBudget: options.resources.tokenBudget ?? 100_000,
                openConnections: 0,
                connectionLimit: options.resources.connectionLimit ?? 10,
            },
            metadata: {
                priority: options.priority,
                affinityLabels: options.affinityLabels,
                restartPolicy: options.restartPolicy,
                maxRestarts: options.maxRestarts,
            },
        };

        this.processes.set(pid, process);
        this.emit(pid, 'spawned', { workerId: options.workerId, cluster: options.cluster });

        return process;
    }

    /**
     * Heartbeat from a running agent.
     */
    heartbeat(pid: string, resources: Partial<ProcessResources>): void {
        const proc = this.processes.get(pid);
        if (!proc) return;

        proc.lastHeartbeat = new Date();
        Object.assign(proc.resources, resources);

        // Enforce resource limits
        if (proc.resources.memoryMb > proc.resources.memoryLimitMb) {
            this.kill(pid, 'OOM: memory limit exceeded');
        }

        if (proc.resources.tokensUsed > proc.resources.tokenBudget) {
            this.kill(pid, 'Token budget exhausted');
        }
    }

    /**
     * Gracefully drain an agent (finish current work, reject new tasks).
     */
    drain(pid: string): void {
        const proc = this.processes.get(pid);
        if (!proc) return;

        proc.state = 'draining';
        this.emit(pid, 'draining', {});
    }

    /**
     * Terminate an agent process.
     */
    terminate(pid: string): void {
        const proc = this.processes.get(pid);
        if (!proc) return;

        proc.state = 'terminated';
        this.emit(pid, 'terminated', {});
    }

    /**
     * Force kill an agent.
     */
    kill(pid: string, reason: string): void {
        const proc = this.processes.get(pid);
        if (!proc) return;

        proc.state = 'terminated';
        this.emit(pid, 'killed', { reason });

        // Auto-restart if policy allows
        const policy = proc.metadata.restartPolicy as string;
        const maxRestarts = proc.metadata.maxRestarts as number;
        const restarts = this.restartCounts.get(pid) ?? 0;

        if (policy === 'always' || (policy === 'on-failure' && restarts < maxRestarts)) {
            this.restartCounts.set(pid, restarts + 1);
            this.emit(pid, 'restarted', { attempt: restarts + 1 });

            // Re-initialize
            proc.state = 'initializing';
            proc.resources.memoryMb = 0;
            proc.resources.cpuPercent = 0;
            proc.resources.tokensUsed = 0;
            proc.resources.openConnections = 0;
        }
    }

    /**
     * Find stale processes (no heartbeat within threshold).
     */
    findStaleProcesses(thresholdMs: number = 30_000): AgentProcess[] {
        const cutoff = new Date(Date.now() - thresholdMs);
        return Array.from(this.processes.values()).filter(
            (p) => p.state !== 'terminated' && p.lastHeartbeat < cutoff
        );
    }

    /**
     * Get all processes for a cluster.
     */
    getClusterProcesses(cluster: string): AgentProcess[] {
        return Array.from(this.processes.values()).filter(
            (p) => p.cluster === cluster && p.state !== 'terminated'
        );
    }

    /**
     * Get cluster-wide resource usage.
     */
    getClusterResources(cluster: string): {
        totalMemoryMb: number;
        totalCpuPercent: number;
        totalTokensUsed: number;
        activeProcesses: number;
    } {
        const procs = this.getClusterProcesses(cluster);
        return {
            totalMemoryMb: procs.reduce((s, p) => s + p.resources.memoryMb, 0),
            totalCpuPercent: procs.reduce((s, p) => s + p.resources.cpuPercent, 0),
            totalTokensUsed: procs.reduce((s, p) => s + p.resources.tokensUsed, 0),
            activeProcesses: procs.length,
        };
    }

    /**
     * Rolling restart all processes in a cluster.
     */
    async rollingRestart(cluster: string, batchSize: number = 1): Promise<void> {
        const procs = this.getClusterProcesses(cluster);
        for (let i = 0; i < procs.length; i += batchSize) {
            const batch = procs.slice(i, i + batchSize);
            for (const proc of batch) {
                this.drain(proc.pid);
            }
            // Wait for drain to complete (in practice, use event-driven wait)
            await new Promise((resolve) => setTimeout(resolve, 5000));
            for (const proc of batch) {
                this.kill(proc.pid, 'Rolling restart');
            }
        }
    }

    private emit(pid: string, event: LifecycleEvent['event'], details: Record<string, unknown>): void {
        this.events.push({ pid, event, timestamp: new Date(), details });
        // TODO: Publish to Event Bus
    }

    get stats() {
        const all = Array.from(this.processes.values());
        const active = all.filter((p) => p.state !== 'terminated');
        return {
            total: all.length,
            active: active.length,
            terminated: all.length - active.length,
            byState: active.reduce((acc, p) => {
                acc[p.state] = (acc[p.state] ?? 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}
