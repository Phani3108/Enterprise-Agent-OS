/**
 * @agentos/kernel — Cluster Orchestration Primitives
 *
 * Manages clusters of agent processes:
 * - Cluster creation and configuration
 * - Auto-scaling (min/max replicas, scaling triggers)
 * - Affinity and anti-affinity scheduling
 * - Cross-cluster communication
 * - Cluster-wide health checks
 */

import { AgentLifecycleManager, type SpawnOptions, type AgentProcess } from './lifecycle.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClusterDefinition {
    name: string;
    workerType: string;
    minReplicas: number;
    maxReplicas: number;
    targetUtilization: number; // 0-1
    scalingCooldownMs: number;
    resources: {
        memoryLimitMb: number;
        cpuLimitPercent: number;
        tokenBudgetPerAgent: number;
        connectionLimitPerAgent: number;
    };
    affinityLabels: string[];
    antiAffinityRules: string[];
    restartPolicy: 'always' | 'on-failure' | 'never';
    maxRestartsPerAgent: number;
}

export interface ScalingDecision {
    cluster: string;
    currentReplicas: number;
    desiredReplicas: number;
    action: 'scale-up' | 'scale-down' | 'steady';
    reason: string;
    timestamp: Date;
}

export interface ClusterHealth {
    cluster: string;
    healthy: boolean;
    activeAgents: number;
    totalCapacity: number;
    utilization: number;
    unhealthyAgents: string[];
    lastCheck: Date;
}

// ---------------------------------------------------------------------------
// Cluster Orchestrator
// ---------------------------------------------------------------------------

export class ClusterOrchestrator {
    private clusters = new Map<string, ClusterDefinition>();
    private scalingHistory: ScalingDecision[] = [];
    private lastScaleTime = new Map<string, number>();

    constructor(private lifecycle: AgentLifecycleManager) { }

    /**
     * Register a cluster definition.
     */
    registerCluster(cluster: ClusterDefinition): void {
        this.clusters.set(cluster.name, cluster);
    }

    /**
     * Initialize a cluster — spawn minimum replicas.
     */
    async initializeCluster(name: string): Promise<AgentProcess[]> {
        const cluster = this.clusters.get(name);
        if (!cluster) throw new Error(`Cluster not found: ${name}`);

        const spawned: AgentProcess[] = [];
        for (let i = 0; i < cluster.minReplicas; i++) {
            const proc = this.lifecycle.spawn({
                workerId: `${cluster.workerType}-${i}`,
                cluster: name,
                resources: {
                    memoryLimitMb: cluster.resources.memoryLimitMb,
                    cpuLimitPercent: cluster.resources.cpuLimitPercent,
                    tokenBudget: cluster.resources.tokenBudgetPerAgent,
                    connectionLimit: cluster.resources.connectionLimitPerAgent,
                },
                priority: 1,
                affinityLabels: cluster.affinityLabels,
                restartPolicy: cluster.restartPolicy,
                maxRestarts: cluster.maxRestartsPerAgent,
            });
            spawned.push(proc);
        }

        return spawned;
    }

    /**
     * Evaluate scaling for a cluster based on current utilization.
     */
    evaluateScaling(clusterName: string): ScalingDecision {
        const cluster = this.clusters.get(clusterName);
        if (!cluster) throw new Error(`Cluster not found: ${clusterName}`);

        const resources = this.lifecycle.getClusterResources(clusterName);
        const current = resources.activeProcesses;
        const utilization = current > 0
            ? resources.totalCpuPercent / (current * cluster.resources.cpuLimitPercent)
            : 0;

        // Respect cooldown
        const lastScale = this.lastScaleTime.get(clusterName) ?? 0;
        if (Date.now() - lastScale < cluster.scalingCooldownMs) {
            return { cluster: clusterName, currentReplicas: current, desiredReplicas: current, action: 'steady', reason: 'Cooldown active', timestamp: new Date() };
        }

        let desired = current;
        let action: ScalingDecision['action'] = 'steady';
        let reason = 'Within target utilization';

        if (utilization > cluster.targetUtilization && current < cluster.maxReplicas) {
            // Scale up: add 1 or 25% more replicas, whichever is greater
            const increment = Math.max(1, Math.ceil(current * 0.25));
            desired = Math.min(current + increment, cluster.maxReplicas);
            action = 'scale-up';
            reason = `Utilization ${(utilization * 100).toFixed(0)}% > target ${(cluster.targetUtilization * 100).toFixed(0)}%`;
        } else if (utilization < cluster.targetUtilization * 0.5 && current > cluster.minReplicas) {
            // Scale down: remove 1 replica
            desired = Math.max(current - 1, cluster.minReplicas);
            action = 'scale-down';
            reason = `Utilization ${(utilization * 100).toFixed(0)}% < ${(cluster.targetUtilization * 50).toFixed(0)}% threshold`;
        }

        const decision: ScalingDecision = {
            cluster: clusterName,
            currentReplicas: current,
            desiredReplicas: desired,
            action,
            reason,
            timestamp: new Date(),
        };

        this.scalingHistory.push(decision);
        return decision;
    }

    /**
     * Apply a scaling decision.
     */
    async applyScaling(decision: ScalingDecision): Promise<void> {
        const cluster = this.clusters.get(decision.cluster);
        if (!cluster) return;

        if (decision.action === 'scale-up') {
            const toSpawn = decision.desiredReplicas - decision.currentReplicas;
            for (let i = 0; i < toSpawn; i++) {
                this.lifecycle.spawn({
                    workerId: `${cluster.workerType}-scale-${Date.now()}-${i}`,
                    cluster: decision.cluster,
                    resources: {
                        memoryLimitMb: cluster.resources.memoryLimitMb,
                        cpuLimitPercent: cluster.resources.cpuLimitPercent,
                        tokenBudget: cluster.resources.tokenBudgetPerAgent,
                        connectionLimit: cluster.resources.connectionLimitPerAgent,
                    },
                    priority: 1,
                    affinityLabels: cluster.affinityLabels,
                    restartPolicy: cluster.restartPolicy,
                    maxRestarts: cluster.maxRestartsPerAgent,
                });
            }
        } else if (decision.action === 'scale-down') {
            const toRemove = decision.currentReplicas - decision.desiredReplicas;
            const procs = this.lifecycle.getClusterProcesses(decision.cluster);
            // Drain the most idle agents first
            const idle = procs.filter((p) => p.state === 'idle').slice(0, toRemove);
            for (const proc of idle) {
                this.lifecycle.drain(proc.pid);
            }
        }

        this.lastScaleTime.set(decision.cluster, Date.now());
    }

    /**
     * Health check for a cluster.
     */
    checkHealth(clusterName: string): ClusterHealth {
        const cluster = this.clusters.get(clusterName);
        if (!cluster) throw new Error(`Cluster not found: ${clusterName}`);

        const procs = this.lifecycle.getClusterProcesses(clusterName);
        const stale = this.lifecycle.findStaleProcesses();
        const unhealthy = stale.filter((p) => p.cluster === clusterName).map((p) => p.pid);
        const resources = this.lifecycle.getClusterResources(clusterName);

        return {
            cluster: clusterName,
            healthy: unhealthy.length === 0,
            activeAgents: procs.length,
            totalCapacity: cluster.maxReplicas,
            utilization: procs.length > 0
                ? resources.totalCpuPercent / (procs.length * cluster.resources.cpuLimitPercent)
                : 0,
            unhealthyAgents: unhealthy,
            lastCheck: new Date(),
        };
    }

    /**
     * Get scaling history for auditing.
     */
    getScalingHistory(clusterName?: string): ScalingDecision[] {
        if (clusterName) return this.scalingHistory.filter((d) => d.cluster === clusterName);
        return this.scalingHistory;
    }
}
