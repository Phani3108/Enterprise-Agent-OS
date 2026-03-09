/**
 * @agentos/graph — Execution Graph Engine
 *
 * A runtime DAG engine that manages the execution of task graphs with
 * parallel execution, dependency tracking, conditional edges, cycle
 * detection, and real-time graph state.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';

export interface GraphNode<T = unknown> {
    id: string;
    label: string;
    status: NodeStatus;
    dependsOn: string[];
    condition?: string;
    input?: T;
    output?: unknown;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
    durationMs?: number;
    metadata: Record<string, unknown>;
}

export interface GraphEdge {
    from: string;
    to: string;
    condition?: string;
    label?: string;
}

export interface GraphStats {
    totalNodes: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
    skipped: number;
    parallelism: number;
    criticalPathMs: number;
}

// ---------------------------------------------------------------------------
// Execution Graph
// ---------------------------------------------------------------------------

/**
 * A live execution graph that tracks the state of a task DAG.
 */
export class ExecutionGraph {
    private nodes = new Map<string, GraphNode>();
    private edges: GraphEdge[] = [];
    private adjacency = new Map<string, Set<string>>();
    private reverseAdj = new Map<string, Set<string>>();

    constructor(readonly id: string, readonly name: string) { }

    // -------------------------------------------------------------------------
    // Graph Construction
    // -------------------------------------------------------------------------

    addNode(node: Omit<GraphNode, 'status'>): void {
        if (this.nodes.has(node.id)) {
            throw new Error(`Duplicate node: ${node.id}`);
        }

        this.nodes.set(node.id, { ...node, status: 'pending' });

        if (!this.adjacency.has(node.id)) this.adjacency.set(node.id, new Set());
        if (!this.reverseAdj.has(node.id)) this.reverseAdj.set(node.id, new Set());

        for (const dep of node.dependsOn) {
            this.addEdge({ from: dep, to: node.id });
        }
    }

    addEdge(edge: GraphEdge): void {
        this.edges.push(edge);
        if (!this.adjacency.has(edge.from)) this.adjacency.set(edge.from, new Set());
        this.adjacency.get(edge.from)!.add(edge.to);

        if (!this.reverseAdj.has(edge.to)) this.reverseAdj.set(edge.to, new Set());
        this.reverseAdj.get(edge.to)!.add(edge.from);
    }

    /**
     * Validate the graph — check for cycles and missing dependencies.
     */
    validate(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check for missing dependencies
        for (const [nodeId, node] of this.nodes) {
            for (const dep of node.dependsOn) {
                if (!this.nodes.has(dep)) {
                    errors.push(`Node '${nodeId}' depends on unknown node '${dep}'`);
                }
            }
        }

        // Check for cycles
        const cycle = this.detectCycle();
        if (cycle) {
            errors.push(`Cycle detected: ${cycle.join(' → ')}`);
        }

        return { valid: errors.length === 0, errors };
    }

    // -------------------------------------------------------------------------
    // Execution
    // -------------------------------------------------------------------------

    /**
     * Get all nodes that are ready to execute (dependencies satisfied).
     */
    getReadyNodes(): GraphNode[] {
        const ready: GraphNode[] = [];

        for (const [id, node] of this.nodes) {
            if (node.status !== 'pending') continue;

            const deps = node.dependsOn;
            const allDepsComplete = deps.every((dep) => {
                const depNode = this.nodes.get(dep);
                return depNode?.status === 'completed' || depNode?.status === 'skipped';
            });

            const anyDepFailed = deps.some((dep) => {
                const depNode = this.nodes.get(dep);
                return depNode?.status === 'failed';
            });

            if (anyDepFailed) {
                node.status = 'skipped';
                continue;
            }

            if (allDepsComplete) {
                node.status = 'ready';
                ready.push(node);
            }
        }

        return ready;
    }

    /**
     * Mark a node as running.
     */
    markRunning(nodeId: string): void {
        const node = this.getNode(nodeId);
        node.status = 'running';
        node.startedAt = new Date();
    }

    /**
     * Mark a node as completed with output.
     */
    markCompleted(nodeId: string, output: unknown): void {
        const node = this.getNode(nodeId);
        node.status = 'completed';
        node.output = output;
        node.completedAt = new Date();
        node.durationMs = node.startedAt
            ? node.completedAt.getTime() - node.startedAt.getTime()
            : 0;
    }

    /**
     * Mark a node as failed.
     */
    markFailed(nodeId: string, error: string): void {
        const node = this.getNode(nodeId);
        node.status = 'failed';
        node.error = error;
        node.completedAt = new Date();
        node.durationMs = node.startedAt
            ? node.completedAt.getTime() - node.startedAt.getTime()
            : 0;
    }

    /**
     * Check if the entire graph is complete.
     */
    isComplete(): boolean {
        return Array.from(this.nodes.values()).every(
            (n) => n.status === 'completed' || n.status === 'failed' || n.status === 'skipped'
        );
    }

    /**
     * Check if the graph has any failures.
     */
    hasFailed(): boolean {
        return Array.from(this.nodes.values()).some((n) => n.status === 'failed');
    }

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    getNode(id: string): GraphNode {
        const node = this.nodes.get(id);
        if (!node) throw new Error(`Node not found: ${id}`);
        return node;
    }

    getAllNodes(): GraphNode[] {
        return Array.from(this.nodes.values());
    }

    getEdges(): GraphEdge[] {
        return [...this.edges];
    }

    /**
     * Get downstream nodes (all that depend on a given node).
     */
    getDownstream(nodeId: string): GraphNode[] {
        const downstream: GraphNode[] = [];
        const visited = new Set<string>();
        const queue = [nodeId];

        while (queue.length > 0) {
            const current = queue.shift()!;
            const children = this.adjacency.get(current) ?? new Set();

            for (const child of children) {
                if (!visited.has(child)) {
                    visited.add(child);
                    downstream.push(this.getNode(child));
                    queue.push(child);
                }
            }
        }

        return downstream;
    }

    /**
     * Get the topological order of nodes.
     */
    topologicalSort(): GraphNode[] {
        const visited = new Set<string>();
        const order: GraphNode[] = [];

        const visit = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);
            const node = this.nodes.get(id);
            if (!node) return;

            for (const dep of node.dependsOn) {
                visit(dep);
            }
            order.push(node);
        };

        for (const id of this.nodes.keys()) {
            visit(id);
        }

        return order;
    }

    /**
     * Get execution stats.
     */
    stats(): GraphStats {
        const nodes = Array.from(this.nodes.values());
        const running = nodes.filter((n) => n.status === 'running');

        return {
            totalNodes: nodes.length,
            completed: nodes.filter((n) => n.status === 'completed').length,
            failed: nodes.filter((n) => n.status === 'failed').length,
            running: running.length,
            pending: nodes.filter((n) => n.status === 'pending' || n.status === 'ready').length,
            skipped: nodes.filter((n) => n.status === 'skipped').length,
            parallelism: running.length,
            criticalPathMs: this.calculateCriticalPath(),
        };
    }

    // -------------------------------------------------------------------------
    // Graph Algorithms
    // -------------------------------------------------------------------------

    /**
     * Detect cycles using DFS with coloring.
     */
    private detectCycle(): string[] | null {
        const WHITE = 0, GRAY = 1, BLACK = 2;
        const color = new Map<string, number>();
        const parent = new Map<string, string>();

        for (const id of this.nodes.keys()) color.set(id, WHITE);

        for (const id of this.nodes.keys()) {
            if (color.get(id) === WHITE) {
                const cycle = this.dfs(id, color, parent);
                if (cycle) return cycle;
            }
        }

        return null;
    }

    private dfs(
        node: string,
        color: Map<string, number>,
        parent: Map<string, string>
    ): string[] | null {
        color.set(node, 1); // GRAY

        for (const neighbor of this.adjacency.get(node) ?? []) {
            if (color.get(neighbor) === 1) {
                // Found cycle — reconstruct
                const cycle = [neighbor, node];
                let current = node;
                while (parent.has(current) && parent.get(current) !== neighbor) {
                    current = parent.get(current)!;
                    cycle.push(current);
                }
                return cycle.reverse();
            }

            if (color.get(neighbor) === 0) {
                parent.set(neighbor, node);
                const cycle = this.dfs(neighbor, color, parent);
                if (cycle) return cycle;
            }
        }

        color.set(node, 2); // BLACK
        return null;
    }

    /**
     * Calculate the critical path duration (longest path through completed nodes).
     */
    private calculateCriticalPath(): number {
        const completed = Array.from(this.nodes.values()).filter(
            (n) => n.status === 'completed' && n.durationMs != null
        );

        if (completed.length === 0) return 0;

        // Simple: sum of durations along the longest dependency chain
        const durations = new Map<string, number>();

        for (const node of this.topologicalSort()) {
            if (node.status !== 'completed') continue;

            let maxDep = 0;
            for (const dep of node.dependsOn) {
                maxDep = Math.max(maxDep, durations.get(dep) ?? 0);
            }
            durations.set(node.id, maxDep + (node.durationMs ?? 0));
        }

        return Math.max(...Array.from(durations.values()), 0);
    }
}
