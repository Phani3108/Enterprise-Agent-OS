/**
 * Workflow Engine — DAG-based workflow orchestration
 *
 * Workflows are directed acyclic graphs where each node is a step
 * (skill execution, tool call, approval gate, condition, or sub-workflow).
 * The engine handles: execution ordering, parallel branches, condition gates,
 * error handling, retries, checkpointing, and live progress streaming.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepStatus = 'pending' | 'ready' | 'running' | 'complete' | 'failed' | 'skipped' | 'waiting_approval';

export interface Workflow {
    id: string;
    name: string;
    description: string;
    version: string;
    steps: WorkflowStep[];
    edges: WorkflowEdge[];
    variables: Record<string, unknown>;
    triggers: WorkflowTrigger[];
    metadata: { createdBy: string; createdAt: Date; domain: string };
    /** Template metadata — present when this workflow is a reusable template */
    template?: WorkflowTemplate;
}

/** Metadata for workflows that act as reusable templates users can fork & customize */
export interface WorkflowTemplate {
    /** Persona this template belongs to */
    persona: 'engineering' | 'marketing' | 'product' | 'leadership' | 'learning';
    /** Visual grouping */
    category: string;
    /** Icon for UI display */
    icon: string;
    /** Skill IDs this workflow composes */
    composedSkillIds: string[];
    /** Prompt IDs linked to this workflow */
    promptIds: string[];
    /** Whether users can fork / customize before running */
    forkable: boolean;
    /** If forked, the original template ID */
    forkedFrom?: string;
    /** Usage & rating */
    usageCount: number;
    rating: number;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: 'skill' | 'tool' | 'approval' | 'condition' | 'parallel' | 'sub_workflow' | 'transform';

    /** What to execute */
    config: StepConfig;

    /** Retry policy */
    retry: { maxAttempts: number; backoffMs: number };

    /** Timeout */
    timeoutMs: number;

    /** Error handling */
    onError: 'fail' | 'skip' | 'retry' | 'fallback';
    fallbackStepId?: string;
}

export type StepConfig =
    | { type: 'skill'; skillId: string; inputs: Record<string, unknown> }
    | { type: 'tool'; toolId: string; params: Record<string, unknown> }
    | { type: 'approval'; action: string; sensitivity: string }
    | { type: 'condition'; expression: string; trueEdge: string; falseEdge: string }
    | { type: 'parallel'; stepIds: string[] }
    | { type: 'sub_workflow'; workflowId: string; inputs: Record<string, unknown> }
    | { type: 'transform'; expression: string };

export interface WorkflowEdge {
    from: string;
    to: string;
    condition?: string; // expression that must be true
}

export interface WorkflowTrigger {
    type: 'manual' | 'event' | 'schedule' | 'webhook';
    config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Execution state
// ---------------------------------------------------------------------------

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'running' | 'complete' | 'failed' | 'paused';
    startedAt: Date;
    completedAt?: Date;
    stepStates: Map<string, StepState>;
    variables: Record<string, unknown>;
    errors: WorkflowError[];
    checkpoints: Checkpoint[];
}

export interface StepState {
    stepId: string;
    status: StepStatus;
    startedAt?: Date;
    completedAt?: Date;
    attempts: number;
    output?: unknown;
    error?: string;
}

interface WorkflowError { stepId: string; error: string; timestamp: Date; attempt: number }
interface Checkpoint { stepId: string; state: Record<string, unknown>; timestamp: Date }

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class WorkflowEngine {
    private executions: Map<string, WorkflowExecution> = new Map();
    private stepExecutors: Map<string, StepExecutor> = new Map();

    /**
     * Register a step executor for a step type.
     */
    registerExecutor(type: string, executor: StepExecutor): void {
        this.stepExecutors.set(type, executor);
    }

    /**
     * Start a workflow execution.
     */
    async execute(workflow: Workflow, initialVars?: Record<string, unknown>): Promise<WorkflowExecution> {
        // Validate DAG
        this.validateDAG(workflow);

        const execution: WorkflowExecution = {
            id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            workflowId: workflow.id,
            status: 'running',
            startedAt: new Date(),
            stepStates: new Map(),
            variables: { ...workflow.variables, ...initialVars },
            errors: [],
            checkpoints: [],
        };

        // Initialize all step states
        for (const step of workflow.steps) {
            execution.stepStates.set(step.id, {
                stepId: step.id,
                status: 'pending',
                attempts: 0,
            });
        }

        this.executions.set(execution.id, execution);

        // Find and execute ready steps (no dependencies)
        await this.processReadySteps(workflow, execution);

        return execution;
    }

    /**
     * Resume a paused execution (e.g., after approval).
     */
    async resume(executionId: string, stepId: string, result: unknown): Promise<void> {
        const execution = this.executions.get(executionId);
        if (!execution) throw new Error(`Execution ${executionId} not found`);

        const state = execution.stepStates.get(stepId);
        if (!state || state.status !== 'waiting_approval') throw new Error(`Step ${stepId} not waiting for approval`);

        state.status = 'complete';
        state.completedAt = new Date();
        state.output = result;

        // Find workflow and continue
        // In production: retrieve workflow from persistence
    }

    /**
     * Get execution status.
     */
    getExecution(executionId: string): WorkflowExecution | undefined {
        return this.executions.get(executionId);
    }

    // -------------------------------------------------------------------------
    // DAG processing
    // -------------------------------------------------------------------------

    private async processReadySteps(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
        const readySteps = this.findReadySteps(workflow, execution);

        if (readySteps.length === 0) {
            // Check if all steps are complete
            const allDone = [...execution.stepStates.values()].every(
                s => s.status === 'complete' || s.status === 'skipped' || s.status === 'failed'
            );
            if (allDone) {
                execution.status = execution.errors.length > 0 ? 'failed' : 'complete';
                execution.completedAt = new Date();
            }
            return;
        }

        // Execute ready steps in parallel
        await Promise.all(readySteps.map(step => this.executeStep(workflow, execution, step)));
    }

    private findReadySteps(workflow: Workflow, execution: WorkflowExecution): WorkflowStep[] {
        return workflow.steps.filter(step => {
            const state = execution.stepStates.get(step.id);
            if (!state || state.status !== 'pending') return false;

            // Check all incoming edges are satisfied
            const incomingEdges = workflow.edges.filter(e => e.to === step.id);

            // If no incoming edges, this is a root step → ready
            if (incomingEdges.length === 0) return true;

            return incomingEdges.some(edge => {
                const fromState = execution.stepStates.get(edge.from);
                if (!fromState || fromState.status !== 'complete') return false;

                // Check edge condition if any
                if (edge.condition) {
                    return this.evaluateExpression(edge.condition, execution.variables);
                }
                return true;
            });
        });
    }

    private async executeStep(workflow: Workflow, execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
        const state = execution.stepStates.get(step.id)!;
        state.status = 'running';
        state.startedAt = new Date();
        state.attempts++;

        try {
            // Handle special step types
            if (step.config.type === 'condition') {
                const result = this.evaluateExpression(step.config.expression, execution.variables);
                state.output = result;
                state.status = 'complete';
                state.completedAt = new Date();
            } else if (step.config.type === 'approval') {
                state.status = 'waiting_approval';
                execution.status = 'paused';
                return;
            } else if (step.config.type === 'parallel') {
                // Execute parallel sub-steps
                const parallelSteps = step.config.stepIds
                    .map(id => workflow.steps.find(s => s.id === id))
                    .filter((s): s is WorkflowStep => s !== undefined);

                await Promise.all(parallelSteps.map(s => this.executeStep(workflow, execution, s)));
                state.status = 'complete';
                state.completedAt = new Date();
            } else {
                // Execute via registered executor
                const executor = this.stepExecutors.get(step.config.type);
                if (!executor) throw new Error(`No executor for step type: ${step.config.type}`);

                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Step timeout')), step.timeoutMs)
                );

                const result = await Promise.race([
                    executor.execute(step.config, execution.variables),
                    timeoutPromise,
                ]);

                state.output = result;
                state.status = 'complete';
                state.completedAt = new Date();

                // Store output in variables for downstream steps
                execution.variables[`${step.id}_output`] = result;
            }

            // Create checkpoint
            execution.checkpoints.push({
                stepId: step.id,
                state: { ...execution.variables },
                timestamp: new Date(),
            });

            // Continue to next steps
            await this.processReadySteps(workflow, execution);

        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            execution.errors.push({ stepId: step.id, error: errMsg, timestamp: new Date(), attempt: state.attempts });

            if (step.onError === 'retry' && state.attempts < step.retry.maxAttempts) {
                state.status = 'pending';
                await new Promise(r => setTimeout(r, step.retry.backoffMs * state.attempts));
                await this.executeStep(workflow, execution, step);
            } else if (step.onError === 'skip') {
                state.status = 'skipped';
                state.completedAt = new Date();
                await this.processReadySteps(workflow, execution);
            } else if (step.onError === 'fallback' && step.fallbackStepId) {
                const fallback = workflow.steps.find(s => s.id === step.fallbackStepId);
                if (fallback) {
                    state.status = 'failed';
                    await this.executeStep(workflow, execution, fallback);
                }
            } else {
                state.status = 'failed';
                state.error = errMsg;
                execution.status = 'failed';
            }
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private validateDAG(workflow: Workflow): void {
        const visited = new Set<string>();
        const stack = new Set<string>();

        const hasCycle = (stepId: string): boolean => {
            if (stack.has(stepId)) return true;
            if (visited.has(stepId)) return false;
            visited.add(stepId);
            stack.add(stepId);

            const outgoing = workflow.edges.filter(e => e.from === stepId);
            for (const edge of outgoing) {
                if (hasCycle(edge.to)) return true;
            }

            stack.delete(stepId);
            return false;
        };

        for (const step of workflow.steps) {
            if (hasCycle(step.id)) {
                throw new Error(`Workflow ${workflow.id} contains a cycle at step ${step.id}`);
            }
        }
    }

    private evaluateExpression(expr: string, vars: Record<string, unknown>): boolean {
        // Simple expression evaluator for conditions
        // In production: use a proper expression parser (e.g., filtrex)
        try {
            const fn = new Function(...Object.keys(vars), `return ${expr}`);
            return Boolean(fn(...Object.values(vars)));
        } catch {
            return false;
        }
    }
}

// ---------------------------------------------------------------------------
// Step executor interface
// ---------------------------------------------------------------------------

export interface StepExecutor {
    execute(config: StepConfig, variables: Record<string, unknown>): Promise<unknown>;
}
