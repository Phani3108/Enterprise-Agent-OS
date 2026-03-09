/**
 * @agentos/sdk — Base Worker
 *
 * Abstract base class for all AgentOS workers. Provides lifecycle management,
 * task execution framework, and integration with the runtime.
 */

import type {
    Task,
    TaskResult,
    TaskError,
    WorkerConfig,
    WorkerStatus,
    ToolInvocation,
    ToolResult,
} from './types.js';
import { ExecutionContext } from './context.js';

/**
 * Abstract base class for AgentOS workers.
 *
 * Subclass this to create a worker:
 * ```ts
 * class MyWorker extends BaseWorker {
 *   async onTask(task: Task, ctx: ExecutionContext): Promise<unknown> {
 *     const result = await ctx.invokeTool('file.read', { path: task.input.path });
 *     return { content: result.data };
 *   }
 * }
 * ```
 */
export abstract class BaseWorker {
    readonly config: WorkerConfig;
    private _status: WorkerStatus = 'initializing';
    private _currentTask: Task | null = null;
    private _taskCount = 0;
    private _errorCount = 0;

    constructor(config: WorkerConfig) {
        this.config = config;
    }

    // -------------------------------------------------------------------------
    // Status
    // -------------------------------------------------------------------------

    get status(): WorkerStatus {
        return this._status;
    }

    get stats() {
        return {
            taskCount: this._taskCount,
            errorCount: this._errorCount,
            currentTask: this._currentTask?.id ?? null,
        };
    }

    // -------------------------------------------------------------------------
    // Lifecycle — override in subclasses
    // -------------------------------------------------------------------------

    /**
     * Called once when the worker is spawned.
     * Use for loading models, connecting to services, warming caches.
     */
    async onInit(): Promise<void> {
        // Override in subclass
    }

    /**
     * Main task handler. Receives a task and execution context.
     * Must return the task output or throw an error.
     */
    abstract onTask(task: Task, ctx: ExecutionContext): Promise<unknown>;

    /**
     * Called before a tool is invoked. Use for validation, logging, or interception.
     * Return the (possibly modified) invocation, or throw to block.
     */
    async onToolCall(invocation: ToolInvocation): Promise<ToolInvocation> {
        return invocation; // pass through by default
    }

    /**
     * Called after a tool returns. Use for transformation, caching, or auditing.
     */
    async onToolResult(invocation: ToolInvocation, result: ToolResult): Promise<ToolResult> {
        return result; // pass through by default
    }

    /**
     * Called after a task completes successfully. Use for cleanup or metrics.
     */
    async onComplete(result: TaskResult): Promise<void> {
        // Override in subclass
    }

    /**
     * Called when a task fails. Return true to retry, false to fail permanently.
     */
    async onError(task: Task, error: TaskError): Promise<boolean> {
        return error.retryable;
    }

    /**
     * Called when the worker is shutting down.
     * Use for releasing resources, flushing state.
     */
    async onShutdown(): Promise<void> {
        // Override in subclass
    }

    // -------------------------------------------------------------------------
    // Runtime — called by the worker runtime (not subclasses)
    // -------------------------------------------------------------------------

    /**
     * Initialize the worker. Called by the runtime on spawn.
     * @internal
     */
    async _initialize(): Promise<void> {
        try {
            await this.onInit();
            this._status = 'ready';
        } catch (error) {
            this._status = 'failed';
            throw error;
        }
    }

    /**
     * Execute a task. Called by the runtime when a task is dispatched.
     * @internal
     */
    async _executeTask(task: Task, ctx: ExecutionContext): Promise<TaskResult> {
        this._status = 'executing';
        this._currentTask = task;
        this._taskCount++;

        const startTime = Date.now();
        let tokensUsed = 0;
        let toolCallCount = 0;

        try {
            // Enforce sandbox limits
            this._validateSandboxLimits(task);

            // Execute the task
            const output = await this.onTask(task, ctx);

            // Build result
            const result: TaskResult = {
                taskId: task.id,
                status: 'success',
                output,
                durationMs: Date.now() - startTime,
                tokensUsed: ctx.getTokensUsed(),
                toolCallCount: ctx.getToolCallCount(),
            };

            await this.onComplete(result);
            this._status = 'ready';
            this._currentTask = null;

            return result;
        } catch (err) {
            this._errorCount++;
            const taskError: TaskError = {
                code: (err as any)?.code ?? 'WORKER_ERROR',
                message: (err as Error).message,
                stack: (err as Error).stack,
                retryable: (err as any)?.retryable ?? false,
            };

            const shouldRetry = await this.onError(task, taskError);

            const result: TaskResult = {
                taskId: task.id,
                status: 'failure',
                error: taskError,
                durationMs: Date.now() - startTime,
                tokensUsed: ctx.getTokensUsed(),
                toolCallCount: ctx.getToolCallCount(),
            };

            this._status = 'ready';
            this._currentTask = null;

            if (shouldRetry && task.retryCount < task.maxRetries) {
                taskError.retryable = true;
            }

            return result;
        }
    }

    /**
     * Shut down the worker. Called by the runtime.
     * @internal
     */
    async _shutdown(): Promise<void> {
        this._status = 'draining';
        await this.onShutdown();
        this._status = 'terminated';
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private _validateSandboxLimits(task: Task): void {
        if (task.timeoutMs > this.config.sandbox.timeoutMs) {
            throw new Error(
                `Task timeout ${task.timeoutMs}ms exceeds sandbox limit ${this.config.sandbox.timeoutMs}ms`
            );
        }
    }
}
