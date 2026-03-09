/**
 * @agentos/cognition — Agent Cognitive Architecture
 *
 * The cognitive layer that transforms agents from simple prompt→response
 * systems into reasoning, self-reflecting, deliberating entities with
 * long-horizon planning and hallucination suppression.
 *
 * Components:
 * 1. Reasoning Loops — iterative think→act→observe cycles
 * 2. Self-Reflection — metacognitive output evaluation
 * 3. Task Decomposition — recursive goal decomposition
 * 4. Long-Horizon Planning — multi-step planning with horizon management
 */

// ---------------------------------------------------------------------------
// Reasoning Loop
// ---------------------------------------------------------------------------

export type ReasoningPhase = 'think' | 'plan' | 'act' | 'observe' | 'reflect' | 'decide';

export interface ReasoningStep {
    phase: ReasoningPhase;
    thought: string;
    action?: { tool: string; args: Record<string, unknown> };
    observation?: string;
    reflection?: string;
    confidence: number;
    timestamp: Date;
}

export interface ReasoningLoopConfig {
    maxIterations: number;
    confidenceThreshold: number;
    enableReflection: boolean;
    enableDebate: boolean;
    reflectionFrequency: number; // reflect every N steps
}

export const DEFAULT_REASONING_CONFIG: ReasoningLoopConfig = {
    maxIterations: 10,
    confidenceThreshold: 0.85,
    enableReflection: true,
    enableDebate: false,
    reflectionFrequency: 3,
};

/**
 * Iterative reasoning loop: Think → Plan → Act → Observe → Reflect → Decide
 */
export class ReasoningLoop {
    private steps: ReasoningStep[] = [];
    private iteration = 0;

    constructor(
        private config: ReasoningLoopConfig = DEFAULT_REASONING_CONFIG,
        private llm: CognitiveLLM
    ) { }

    /**
     * Execute the full reasoning loop for a task.
     */
    async reason(task: string, context: string): Promise<ReasoningResult> {
        const startTime = Date.now();

        while (this.iteration < this.config.maxIterations) {
            this.iteration++;

            // THINK — generate reasoning about the current state
            const thought = await this.think(task, context);
            this.steps.push({ phase: 'think', thought, confidence: 0, timestamp: new Date() });

            // PLAN — determine next action
            const plan = await this.plan(task, thought);

            // ACT — execute the planned action
            if (plan.action) {
                const observation = await this.act(plan.action);
                this.steps.push({
                    phase: 'observe',
                    thought: `Observed: ${observation}`,
                    observation,
                    confidence: 0,
                    timestamp: new Date(),
                });
            }

            // REFLECT — periodically evaluate own reasoning
            if (this.config.enableReflection && this.iteration % this.config.reflectionFrequency === 0) {
                const reflection = await this.reflect();
                this.steps.push({
                    phase: 'reflect',
                    thought: reflection.assessment,
                    reflection: reflection.assessment,
                    confidence: reflection.confidence,
                    timestamp: new Date(),
                });

                // Check if reflection suggests course correction
                if (reflection.shouldBacktrack) {
                    await this.backtrack(reflection.backtrackReason!);
                }
            }

            // DECIDE — check if we have a satisfactory answer
            const decision = await this.decide(task);
            if (decision.isComplete && decision.confidence >= this.config.confidenceThreshold) {
                return {
                    answer: decision.answer!,
                    confidence: decision.confidence,
                    steps: this.steps,
                    iterations: this.iteration,
                    durationMs: Date.now() - startTime,
                    backtracks: this.steps.filter((s) => s.phase === 'reflect' && s.reflection?.includes('backtrack')).length,
                };
            }
        }

        // Max iterations reached — return best effort
        return {
            answer: await this.synthesizeBestEffort(task),
            confidence: 0.5,
            steps: this.steps,
            iterations: this.iteration,
            durationMs: Date.now() - startTime,
            backtracks: 0,
        };
    }

    // -------------------------------------------------------------------------
    // Reasoning Phases
    // -------------------------------------------------------------------------

    private async think(task: string, context: string): Promise<string> {
        const history = this.formatStepHistory();
        return this.llm.generate({
            system: `You are reasoning step-by-step about a task. Think carefully about what you know, what you don't know, and what information you need.`,
            user: `Task: ${task}\n\nContext: ${context}\n\nPrevious reasoning:\n${history}\n\nWhat should you think about next?`,
            maxTokens: 500,
        });
    }

    private async plan(task: string, thought: string): Promise<{ action?: { tool: string; args: Record<string, unknown> } }> {
        const response = await this.llm.generate({
            system: `Based on your reasoning, decide on the next action. Respond with JSON: { "action": { "tool": "name", "args": {} } } or { "action": null } if no action needed.`,
            user: `Task: ${task}\n\nCurrent thought: ${thought}`,
            maxTokens: 300,
        });

        try {
            return JSON.parse(response);
        } catch {
            return {};
        }
    }

    private async act(action: { tool: string; args: Record<string, unknown> }): Promise<string> {
        // TODO: Integrate with ToolRegistry for actual tool execution
        return `[Result of ${action.tool}(${JSON.stringify(action.args)})]`;
    }

    private async reflect(): Promise<{
        assessment: string;
        confidence: number;
        shouldBacktrack: boolean;
        backtrackReason?: string;
    }> {
        const history = this.formatStepHistory();
        const response = await this.llm.generate({
            system: `You are reflecting on your own reasoning process. Evaluate:
1. Are you making progress toward the goal?
2. Have you made any reasoning errors?
3. Should you backtrack and try a different approach?

Respond with JSON: { "assessment": "...", "confidence": 0-1, "shouldBacktrack": bool, "backtrackReason": "..." }`,
            user: `Reasoning history:\n${history}`,
            maxTokens: 400,
        });

        try {
            return JSON.parse(response);
        } catch {
            return { assessment: response, confidence: 0.5, shouldBacktrack: false };
        }
    }

    private async decide(task: string): Promise<{
        isComplete: boolean;
        confidence: number;
        answer?: string;
    }> {
        const history = this.formatStepHistory();
        const response = await this.llm.generate({
            system: `Based on all reasoning so far, decide if you have a complete answer. Respond with JSON: { "isComplete": bool, "confidence": 0-1, "answer": "..." }`,
            user: `Task: ${task}\n\nReasoning:\n${history}`,
            maxTokens: 1000,
        });

        try {
            return JSON.parse(response);
        } catch {
            return { isComplete: false, confidence: 0 };
        }
    }

    private async backtrack(reason: string): Promise<void> {
        this.steps.push({
            phase: 'reflect',
            thought: `Backtracking: ${reason}`,
            reflection: `backtrack: ${reason}`,
            confidence: 0,
            timestamp: new Date(),
        });
    }

    private async synthesizeBestEffort(task: string): Promise<string> {
        const history = this.formatStepHistory();
        return this.llm.generate({
            system: 'Synthesize the best possible answer from the reasoning history.',
            user: `Task: ${task}\n\nReasoning:\n${history}`,
            maxTokens: 2000,
        });
    }

    private formatStepHistory(): string {
        return this.steps
            .map((s, i) => `[${i + 1}] ${s.phase.toUpperCase()}: ${s.thought}`)
            .join('\n');
    }
}

export interface ReasoningResult {
    answer: string;
    confidence: number;
    steps: ReasoningStep[];
    iterations: number;
    durationMs: number;
    backtracks: number;
}

// ---------------------------------------------------------------------------
// Task Decomposition Engine
// ---------------------------------------------------------------------------

export interface DecomposedTask {
    id: string;
    originalGoal: string;
    subTasks: SubTask[];
    decompositionDepth: number;
    estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'epic';
}

export interface SubTask {
    id: string;
    parentId?: string;
    description: string;
    type: 'atomic' | 'composite';
    requiredSkills: string[];
    requiredWorker?: string;
    dependsOn: string[];
    estimatedTokens: number;
    priority: number;
}

export class TaskDecomposer {
    constructor(
        private llm: CognitiveLLM,
        private maxDepth: number = 3
    ) { }

    /**
     * Recursively decompose a goal into atomic sub-tasks.
     */
    async decompose(goal: string, context?: string, depth: number = 0): Promise<DecomposedTask> {
        // Generate initial decomposition
        const response = await this.llm.generate({
            system: `You are a task decomposition engine. Break down the goal into sub-tasks.
Rules:
- Each sub-task should be achievable by a single worker in a single session
- Identify dependencies between sub-tasks
- Estimate token usage for each sub-task
- Specify required skills for each sub-task
- If a sub-task is still complex, mark type as "composite"

Respond with JSON: { "subTasks": [{ "id": "t1", "description": "...", "type": "atomic|composite", "requiredSkills": [...], "dependsOn": [...], "estimatedTokens": N, "priority": N }] }`,
            user: `Goal: ${goal}${context ? `\n\nContext: ${context}` : ''}`,
            maxTokens: 2000,
        });

        let subTasks: SubTask[];
        try {
            const parsed = JSON.parse(response);
            subTasks = parsed.subTasks;
        } catch {
            subTasks = [{ id: 't1', description: goal, type: 'atomic', requiredSkills: [], dependsOn: [], estimatedTokens: 4000, priority: 1 }];
        }

        // Recursively decompose composite tasks
        if (depth < this.maxDepth) {
            const refined: SubTask[] = [];
            for (const task of subTasks) {
                if (task.type === 'composite') {
                    const subDecomp = await this.decompose(task.description, context, depth + 1);
                    const childTasks = subDecomp.subTasks.map((st) => ({
                        ...st,
                        parentId: task.id,
                        id: `${task.id}.${st.id}`,
                    }));
                    refined.push(...childTasks);
                } else {
                    refined.push(task);
                }
            }
            subTasks = refined;
        }

        return {
            id: `decomp-${Date.now()}`,
            originalGoal: goal,
            subTasks,
            decompositionDepth: depth,
            estimatedComplexity: this.estimateComplexity(subTasks),
        };
    }

    private estimateComplexity(tasks: SubTask[]): DecomposedTask['estimatedComplexity'] {
        if (tasks.length <= 1) return 'trivial';
        if (tasks.length <= 3) return 'simple';
        if (tasks.length <= 6) return 'moderate';
        if (tasks.length <= 10) return 'complex';
        return 'epic';
    }
}

// ---------------------------------------------------------------------------
// LLM Interface (implemented by runtime)
// ---------------------------------------------------------------------------

export interface CognitiveLLM {
    generate(request: {
        system: string;
        user: string;
        maxTokens: number;
    }): Promise<string>;
}
