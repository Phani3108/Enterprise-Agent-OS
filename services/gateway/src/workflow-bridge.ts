/**
 * Gateway ↔ Workflow Engine bridge
 *
 * Exposes the @agentos/workflow-engine as gateway-level functions
 * for executing, resuming, and querying DAG-based workflows.
 */

import { WorkflowEngine } from '@agentos/workflow-engine';
import type { Workflow, WorkflowExecution } from '@agentos/workflow-engine';
import { callLLM } from './llm-provider.js';

// Singleton engine instance
const engine = new WorkflowEngine();

// Register a default skill executor that uses the multi-LLM provider
engine.registerExecutor('skill', {
    async execute(config, variables) {
        const skillConfig = config as { type: 'skill'; skillId: string; inputs: Record<string, unknown> };
        const response = await callLLM({
            systemPrompt: `You are executing workflow step for skill ${skillConfig.skillId}.`,
            userPrompt: `Execute this step with inputs: ${JSON.stringify({ ...skillConfig.inputs, ...variables })}`,
            maxTokens: 4096,
        });
        return { output: response.content, status: 'complete' };
    },
});

// No-op executors for other step types
engine.registerExecutor('tool', {
    async execute(config) {
        const toolConfig = config as { type: 'tool'; toolId: string };
        return { output: `Tool ${toolConfig.toolId} executed`, status: 'complete' };
    },
});

engine.registerExecutor('approval', {
    async execute(_config) {
        return { output: null, status: 'waiting_approval' };
    },
});

engine.registerExecutor('transform', {
    async execute(step, variables) {
        return { output: variables, status: 'complete' };
    },
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function executeWorkflow(workflow: Workflow, variables?: Record<string, unknown>): Promise<WorkflowExecution> {
    return engine.execute(workflow, variables);
}

export function getWorkflowExecution(id: string): WorkflowExecution | undefined {
    return engine.getExecution(id);
}

export function resumeWorkflow(executionId: string, stepId: string, result: unknown): Promise<void> {
    return engine.resume(executionId, stepId, result);
}

export { engine as workflowEngine };
