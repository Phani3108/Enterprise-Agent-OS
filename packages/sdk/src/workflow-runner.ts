/**
 * @agentos/sdk — Workflow Runner
 *
 * Executes DAG-based workflows by resolving dependencies, evaluating conditions,
 * dispatching tasks to workers, and handling retries and approval gates.
 */

import type {
    WorkflowDefinition,
    WorkflowStep,
    WorkflowExecution,
    TaskResult,
    RetryConfig,
} from './types.js';

// ---------------------------------------------------------------------------
// Workflow Runner
// ---------------------------------------------------------------------------

/**
 * Executes a workflow definition as a DAG of tasks.
 */
export class WorkflowRunner {
    constructor(
        private readonly dispatcher: TaskDispatcher,
        private readonly conditionEvaluator: ConditionEvaluator,
        private readonly approvalManager: ApprovalManager
    ) { }

    /**
     * Execute a workflow from a definition and trigger data.
     */
    async execute(
        workflow: WorkflowDefinition,
        trigger: unknown
    ): Promise<WorkflowExecution> {
        const executionId = crypto.randomUUID();
        const stepResults = new Map<string, TaskResult>();

        const execution: WorkflowExecution = {
            id: executionId,
            workflowId: workflow.name,
            status: 'running',
            trigger,
            stepResults,
            startedAt: new Date(),
        };

        try {
            // Build the execution plan (topological sort)
            const executionOrder = this.resolveExecutionOrder(workflow.steps);

            // Execute steps in order, respecting dependencies
            for (const step of executionOrder) {
                // Check if dependencies are met
                const depsReady = this.areDependenciesMet(step, stepResults);
                if (!depsReady) {
                    continue; // skip — dependency failed or was skipped
                }

                // Evaluate condition
                if (step.condition) {
                    const conditionMet = await this.conditionEvaluator.evaluate(
                        step.condition,
                        { trigger, steps: this.buildStepContext(stepResults) }
                    );
                    if (!conditionMet) {
                        continue; // skip this step
                    }
                }

                // Handle approval gate
                if (step.approval?.required) {
                    const approved = await this.approvalManager.requestApproval({
                        stepId: step.id,
                        executionId,
                        workflowId: workflow.name,
                        approvers: step.approval.approvers,
                        timeoutMinutes: step.approval.timeoutMinutes,
                        escalation: step.approval.escalation,
                    });

                    if (!approved) {
                        execution.status = 'failed';
                        execution.error = `Approval denied for step '${step.id}'`;
                        break;
                    }
                }

                // Resolve input templates
                const resolvedInput = this.resolveTemplates(
                    step.input ?? {},
                    { trigger, steps: this.buildStepContext(stepResults) }
                );

                // Dispatch task to worker with retry
                const result = await this.executeStepWithRetry(
                    step,
                    executionId,
                    resolvedInput,
                    step.retry ?? workflow.retry
                );

                stepResults.set(step.id, result);

                if (result.status === 'failure') {
                    execution.status = 'failed';
                    execution.error = `Step '${step.id}' failed: ${result.error?.message}`;
                    break;
                }
            }

            if (execution.status === 'running') {
                execution.status = 'completed';
            }
        } catch (err) {
            execution.status = 'failed';
            execution.error = (err as Error).message;
        }

        execution.completedAt = new Date();
        return execution;
    }

    // -------------------------------------------------------------------------
    // DAG Resolution
    // -------------------------------------------------------------------------

    /**
     * Topological sort of workflow steps based on `dependsOn`.
     */
    private resolveExecutionOrder(steps: WorkflowStep[]): WorkflowStep[] {
        const stepMap = new Map(steps.map((s) => [s.id, s]));
        const visited = new Set<string>();
        const order: WorkflowStep[] = [];

        const visit = (stepId: string) => {
            if (visited.has(stepId)) return;
            visited.add(stepId);

            const step = stepMap.get(stepId);
            if (!step) throw new Error(`Unknown step: ${stepId}`);

            for (const dep of step.dependsOn ?? []) {
                visit(dep);
            }

            order.push(step);
        };

        for (const step of steps) {
            visit(step.id);
        }

        return order;
    }

    /**
     * Check if all dependencies for a step have completed successfully.
     */
    private areDependenciesMet(
        step: WorkflowStep,
        results: Map<string, TaskResult>
    ): boolean {
        if (!step.dependsOn?.length) return true;

        return step.dependsOn.every((depId) => {
            const result = results.get(depId);
            return result?.status === 'success';
        });
    }

    // -------------------------------------------------------------------------
    // Retry
    // -------------------------------------------------------------------------

    /**
     * Execute a step with retry logic.
     */
    private async executeStepWithRetry(
        step: WorkflowStep,
        executionId: string,
        input: Record<string, unknown>,
        retry?: RetryConfig
    ): Promise<TaskResult> {
        const maxAttempts = retry?.maxAttempts ?? 1;
        const initialDelay = retry?.initialDelayMs ?? 1000;
        const backoff = retry?.backoff ?? 'exponential';

        let lastResult: TaskResult | null = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            lastResult = await this.dispatcher.dispatch({
                executionId,
                stepId: step.id,
                worker: step.worker,
                action: step.action,
                input,
                timeoutMs: step.timeoutMs,
            });

            if (lastResult.status === 'success') {
                return lastResult;
            }

            // Don't retry on the last attempt
            if (attempt < maxAttempts - 1 && lastResult.error?.retryable !== false) {
                const delay = this.calculateDelay(backoff, initialDelay, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        return lastResult!;
    }

    /**
     * Calculate retry delay based on backoff strategy.
     */
    private calculateDelay(
        strategy: string,
        initialDelay: number,
        attempt: number
    ): number {
        switch (strategy) {
            case 'fixed':
                return initialDelay;
            case 'linear':
                return initialDelay * (attempt + 1);
            case 'exponential':
                return initialDelay * Math.pow(2, attempt);
            default:
                return initialDelay;
        }
    }

    // -------------------------------------------------------------------------
    // Template Resolution
    // -------------------------------------------------------------------------

    /**
     * Resolve `{{ }}` template expressions in step inputs.
     */
    private resolveTemplates(
        input: Record<string, unknown>,
        context: Record<string, unknown>
    ): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(input)) {
            if (typeof value === 'string') {
                result[key] = this.resolveTemplateString(value, context);
            } else if (typeof value === 'object' && value !== null) {
                result[key] = this.resolveTemplates(
                    value as Record<string, unknown>,
                    context
                );
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Resolve template expressions like `{{ trigger.pr_url }}`.
     */
    private resolveTemplateString(template: string, context: Record<string, unknown>): unknown {
        const match = template.match(/^\{\{\s*(.+?)\s*\}\}$/);
        if (match) {
            return this.resolvePath(match[1], context);
        }

        // Replace inline expressions
        return template.replace(/\{\{\s*(.+?)\s*\}\}/g, (_, path) => {
            const value = this.resolvePath(path, context);
            return String(value ?? '');
        });
    }

    /**
     * Resolve a dot-path expression against a context object.
     */
    private resolvePath(path: string, context: Record<string, unknown>): unknown {
        const parts = path.split('.');
        let current: unknown = context;

        for (const part of parts) {
            if (current == null || typeof current !== 'object') return undefined;
            current = (current as Record<string, unknown>)[part];
        }

        return current;
    }

    /**
     * Build a step context map from results.
     */
    private buildStepContext(results: Map<string, TaskResult>): Record<string, unknown> {
        const ctx: Record<string, unknown> = {};
        for (const [stepId, result] of results) {
            ctx[stepId] = { output: result.output, status: result.status };
        }
        return ctx;
    }
}

// ---------------------------------------------------------------------------
// Interfaces — implemented by the runtime
// ---------------------------------------------------------------------------

export interface TaskDispatcher {
    dispatch(request: {
        executionId: string;
        stepId: string;
        worker: string;
        action?: string;
        input: Record<string, unknown>;
        timeoutMs?: number;
    }): Promise<TaskResult>;
}

export interface ConditionEvaluator {
    evaluate(expression: string, context: Record<string, unknown>): Promise<boolean>;
}

export interface ApprovalManager {
    requestApproval(request: {
        stepId: string;
        executionId: string;
        workflowId: string;
        approvers: string[];
        timeoutMinutes: number;
        escalation?: string;
    }): Promise<boolean>;
}
