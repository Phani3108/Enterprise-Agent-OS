/**
 * @agentos/sdk — Execution Context
 *
 * Provides workers with access to memory, event publishing, tool invocation,
 * delegation, and context broadcasting during task execution.
 */

import type {
    ToolInvocation,
    ToolResult,
    DelegationRequest,
    DelegationResponse,
    VectorDocument,
    Episode,
    MemoryQuery,
    EventEnvelope,
} from './types.js';
import { ToolRegistry, invokeTool } from './tool.js';
import type { ToolContext } from './tool.js';

/**
 * Execution context provided to workers during task execution.
 *
 * This is the primary interface through which workers interact with
 * the AgentOS runtime — invoking tools, querying memory, publishing
 * events, and delegating to other workers.
 */
export class ExecutionContext {
    private _tokensUsed = 0;
    private _toolCallCount = 0;
    private _maxTokens: number;
    private _maxToolCalls: number;

    constructor(
        private readonly executionId: string,
        private readonly taskId: string,
        private readonly workerId: string,
        private readonly tenantId: string,
        private readonly traceId: string,
        private readonly toolRegistry: ToolRegistry,
        private readonly memoryClient: MemoryClient,
        private readonly eventPublisher: EventPublisher,
        private readonly delegationClient: DelegationClient,
        maxTokens: number = 8000,
        maxToolCalls: number = 20
    ) {
        this._maxTokens = maxTokens;
        this._maxToolCalls = maxToolCalls;
    }

    // -------------------------------------------------------------------------
    // Tool Invocation
    // -------------------------------------------------------------------------

    /**
     * Invoke a tool by name with typed arguments.
     *
     * ```ts
     * const result = await ctx.invokeTool('github.pr.comment', {
     *   owner: 'myorg', repo: 'myrepo', pr_number: 42, body: 'LGTM!'
     * });
     * ```
     */
    async invokeTool<T = unknown>(
        toolName: string,
        args: Record<string, unknown>
    ): Promise<ToolResult<T>> {
        // Enforce sandbox limits
        if (this._toolCallCount >= this._maxToolCalls) {
            return {
                toolName,
                status: 'failure',
                error: `Tool call limit exceeded (max: ${this._maxToolCalls})`,
                durationMs: 0,
            };
        }

        this._toolCallCount++;

        const invocation: ToolInvocation = { toolName, args };
        const context: ToolContext = {
            traceId: this.traceId,
            tenantId: this.tenantId,
            workerId: this.workerId,
            auth: { type: 'none' }, // resolved by runtime
            signal: AbortSignal.timeout(30_000),
        };

        return invokeTool(this.toolRegistry, invocation, context) as Promise<ToolResult<T>>;
    }

    // -------------------------------------------------------------------------
    // Memory
    // -------------------------------------------------------------------------

    /**
     * Search the vector store for relevant documents.
     */
    async searchMemory(query: string, options?: Partial<MemoryQuery>): Promise<VectorDocument[]> {
        return this.memoryClient.search({
            query,
            namespace: options?.namespace,
            topK: options?.topK ?? 5,
            filter: options?.filter,
            minSimilarity: options?.minSimilarity ?? 0.7,
        });
    }

    /**
     * Store a document in the vector store.
     */
    async storeMemory(doc: Omit<VectorDocument, 'id' | 'embedding'>): Promise<string> {
        return this.memoryClient.upsert(doc);
    }

    /**
     * Retrieve past episodes for learning / few-shot context.
     */
    async getEpisodes(filter: {
        workerId?: string;
        executionId?: string;
        limit?: number;
    }): Promise<Episode[]> {
        return this.memoryClient.queryEpisodes(filter);
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /**
     * Publish an event to the event bus.
     */
    async publishEvent<T>(type: string, data: T): Promise<void> {
        const event: EventEnvelope<T> = {
            id: crypto.randomUUID(),
            type,
            source: `worker:${this.workerId}`,
            time: new Date(),
            specVersion: '1.0',
            dataContentType: 'application/json',
            data,
            traceId: this.traceId,
            tenantId: this.tenantId,
            executionId: this.executionId,
            idempotencyKey: `${this.executionId}:${this.taskId}:${type}:${Date.now()}`,
            metadata: {},
        };

        await this.eventPublisher.publish(event);
    }

    // -------------------------------------------------------------------------
    // Context Broadcasting
    // -------------------------------------------------------------------------

    /**
     * Broadcast context to all workers in the current execution.
     */
    async broadcast(key: string, data: unknown): Promise<void> {
        await this.eventPublisher.broadcast(this.executionId, key, data);
    }

    /**
     * Register a handler for context updates.
     */
    onContext(pattern: string, handler: (data: unknown) => void): void {
        this.eventPublisher.subscribe(`ctx:${this.executionId}:${pattern}`, handler);
    }

    // -------------------------------------------------------------------------
    // Delegation
    // -------------------------------------------------------------------------

    /**
     * Delegate a sub-task to another worker and await the result.
     *
     * ```ts
     * const review = await ctx.delegate('code-reviewer', {
     *   type: 'review-pr',
     *   input: { diff: prDiff },
     * });
     * ```
     */
    async delegate(
        targetWorker: string,
        options: { type: string; input: unknown; priority?: 'low' | 'normal' | 'high' | 'critical'; timeout?: number }
    ): Promise<DelegationResponse> {
        const request: DelegationRequest = {
            id: crypto.randomUUID(),
            sourceWorker: this.workerId,
            targetWorker,
            taskType: options.type,
            input: options.input,
            priority: options.priority ?? 'normal',
            timeout: options.timeout ?? 60_000,
            parentTaskId: this.taskId,
            parentExecutionId: this.executionId,
            contextSnapshot: {},
        };

        return this.delegationClient.delegate(request);
    }

    // -------------------------------------------------------------------------
    // Token Tracking
    // -------------------------------------------------------------------------

    /**
     * Record token usage from an LLM call.
     */
    recordTokenUsage(tokens: number): void {
        this._tokensUsed += tokens;
        if (this._tokensUsed > this._maxTokens) {
            throw new TokenLimitExceededError(this._tokensUsed, this._maxTokens);
        }
    }

    getTokensUsed(): number {
        return this._tokensUsed;
    }

    getToolCallCount(): number {
        return this._toolCallCount;
    }
}

// ---------------------------------------------------------------------------
// Interfaces for injected dependencies (implemented by runtime)
// ---------------------------------------------------------------------------

export interface MemoryClient {
    search(query: MemoryQuery): Promise<VectorDocument[]>;
    upsert(doc: Omit<VectorDocument, 'id' | 'embedding'>): Promise<string>;
    queryEpisodes(filter: {
        workerId?: string;
        executionId?: string;
        limit?: number;
    }): Promise<Episode[]>;
}

export interface EventPublisher {
    publish<T>(event: EventEnvelope<T>): Promise<void>;
    broadcast(executionId: string, key: string, data: unknown): Promise<void>;
    subscribe(channel: string, handler: (data: unknown) => void): void;
}

export interface DelegationClient {
    delegate(request: DelegationRequest): Promise<DelegationResponse>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class TokenLimitExceededError extends Error {
    constructor(used: number, max: number) {
        super(`Token limit exceeded: ${used} used, ${max} maximum`);
        this.name = 'TokenLimitExceededError';
    }
}
