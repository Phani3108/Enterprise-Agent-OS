/**
 * @agentos/orchestrator — Real Control Plane Service
 *
 * The orchestrator is the brain of AgentOS. It receives high-level goals,
 * decomposes them into task DAGs via LLM-powered planning, schedules work
 * across agent clusters, and manages the full execution lifecycle.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import type { EventEnvelope } from '@agentos/events';

// ---------------------------------------------------------------------------
// LLM Call — Claude API integration for planning
// ---------------------------------------------------------------------------

const LLM_MODEL = 'claude-sonnet-4-6-20251001';

interface LLMCallResult {
    content: string;
    inputTokens: number;
    outputTokens: number;
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<LLMCallResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return { content: '', inputTokens: 0, outputTokens: 0 };
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: LLM_MODEL,
            max_tokens: 4096,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Claude API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
        content: Array<{ text: string }>;
        usage?: { input_tokens: number; output_tokens: number };
    };

    return {
        content: data.content?.[0]?.text ?? '',
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
    };
}

function parseLLMJson<T>(content: string): T | null {
    if (!content) return null;
    let cleaned = content.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenceMatch) cleaned = fenceMatch[1].trim();
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskNode {
    id: string;
    name: string;
    description: string;
    agent: string;
    skill: string;
    dependencies: string[];
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    input: Record<string, unknown>;
    output?: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    tokensUsed?: number;
}

interface ExecutionPlan {
    goalId: string;
    goal: string;
    reasoning: string;
    tasks: TaskNode[];
    status: 'planning' | 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: string;
    completedAt?: string;
    totalTokensUsed: number;
    totalCostUsd: number;
}

// ---------------------------------------------------------------------------
// Agent Registry — Maps agent names to their capabilities
// ---------------------------------------------------------------------------

const AGENT_REGISTRY: Record<string, { skills: string[]; description: string }> = {
    'engineering-lead': {
        description: 'Senior engineering agent for architecture, code review, and technical decisions',
        skills: ['code-review', 'architecture-analysis', 'incident-analysis', 'tech-debt-assessment', 'performance-review'],
    },
    'product-strategist': {
        description: 'Product management agent for roadmaps, requirements, and stakeholder communication',
        skills: ['requirements-analysis', 'roadmap-planning', 'user-story-writing', 'competitive-analysis', 'prd-generation'],
    },
    'marketing-director': {
        description: 'Marketing agent for campaigns, content, and brand strategy',
        skills: ['campaign-planning', 'content-creation', 'audience-analysis', 'brand-messaging', 'channel-strategy'],
    },
    'knowledge-analyst': {
        description: 'Knowledge management agent for research, documentation, and information synthesis',
        skills: ['knowledge-search', 'documentation', 'research-synthesis', 'faq-generation', 'onboarding-guide'],
    },
    'devops-engineer': {
        description: 'DevOps agent for CI/CD, infrastructure, monitoring, and incident response',
        skills: ['deployment-automation', 'monitoring-setup', 'incident-response', 'infrastructure-review', 'cost-optimization'],
    },
    'data-analyst': {
        description: 'Data analysis agent for metrics, reporting, and insights',
        skills: ['data-analysis', 'report-generation', 'metric-tracking', 'trend-analysis', 'dashboard-design'],
    },
};

// ---------------------------------------------------------------------------
// Service Configuration
// ---------------------------------------------------------------------------

interface OrchestratorConfig {
    port: number;
    maxConcurrentGoals: number;
    goalTimeoutMs: number;
    retryFailedGoals: boolean;
    planner: {
        model: string;
        maxPlanningTokens: number;
        replanOnFailure: boolean;
        maxReplans: number;
    };
    scheduler: {
        algorithm: 'fifo' | 'priority' | 'fair-share' | 'deadline' | 'cost-aware';
        maxConcurrentTasks: number;
        dispatchIntervalMs: number;
        workerHealthCheckIntervalMs: number;
    };
}

const defaultConfig: OrchestratorConfig = {
    port: 3001,
    maxConcurrentGoals: 50,
    goalTimeoutMs: 300_000,
    retryFailedGoals: true,
    planner: {
        model: LLM_MODEL,
        maxPlanningTokens: 4000,
        replanOnFailure: true,
        maxReplans: 3,
    },
    scheduler: {
        algorithm: 'priority',
        maxConcurrentTasks: 100,
        dispatchIntervalMs: 100,
        workerHealthCheckIntervalMs: 5000,
    },
};

// ---------------------------------------------------------------------------
// Orchestrator — Real Implementation
// ---------------------------------------------------------------------------

class Orchestrator {
    private config: OrchestratorConfig;
    private executions = new Map<string, ExecutionPlan>();
    private eventLog: Array<{ type: string; data: unknown; time: string }> = [];

    constructor(config: Partial<OrchestratorConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async start(): Promise<void> {
        console.log(`🧠 Orchestrator starting on port ${this.config.port}...`);
        console.log(`   LLM Model: ${this.config.planner.model}`);
        console.log(`   Max concurrent goals: ${this.config.maxConcurrentGoals}`);
        console.log(`   API key configured: ${!!process.env.ANTHROPIC_API_KEY}`);

        // Start HTTP API
        await this.startAPI();

        console.log('🧠 Orchestrator ready — accepting goals');
    }

    async stop(): Promise<void> {
        console.log('🧠 Orchestrator shutting down...');
        // Mark any running executions as cancelled
        for (const [id, exec] of this.executions) {
            if (exec.status === 'running' || exec.status === 'planning') {
                exec.status = 'cancelled';
                exec.completedAt = new Date().toISOString();
            }
        }
        console.log('🧠 Orchestrator stopped');
    }

    // -----------------------------------------------------------------------
    // Goal Submission — The main entry point
    // -----------------------------------------------------------------------

    async submitGoal(goal: {
        description: string;
        context?: Record<string, unknown>;
        priority?: 'low' | 'normal' | 'high' | 'critical';
    }): Promise<{ executionId: string; plan: ExecutionPlan }> {
        const executionId = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        console.log(`📋 Goal submitted: "${goal.description}" → ${executionId}`);

        // Step 1: Plan — Use LLM to decompose goal into tasks
        const plan = await this.planGoal(executionId, goal.description, goal.context);

        // Step 2: Execute — Run tasks in topological order
        this.executeGoal(executionId, plan, goal.context).catch((err) => {
            console.error(`[orchestrator] Goal execution failed for ${executionId}:`, err);
            plan.status = 'failed';
            plan.completedAt = new Date().toISOString();
        });

        return { executionId, plan };
    }

    // -----------------------------------------------------------------------
    // LLM Planner — Decomposes goal into task DAG
    // -----------------------------------------------------------------------

    private async planGoal(
        goalId: string,
        goalDescription: string,
        context?: Record<string, unknown>
    ): Promise<ExecutionPlan> {
        const agentDescriptions = Object.entries(AGENT_REGISTRY)
            .map(([name, info]) => `- **${name}**: ${info.description} (skills: ${info.skills.join(', ')})`)
            .join('\n');

        const contextStr = context
            ? '\n\nAdditional context:\n' + Object.entries(context).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n')
            : '';

        const systemPrompt = `You are the planning engine of AgentOS, an AI operating system.
Your job is to decompose high-level goals into a sequence of concrete tasks, each assigned to the most appropriate agent.

Available agents:
${agentDescriptions}

Return your plan as valid JSON matching this structure:
{
  "reasoning": "Brief explanation of your approach",
  "tasks": [
    {
      "id": "task_1",
      "name": "Short task name",
      "description": "What this task should accomplish",
      "agent": "agent-name from the list above",
      "skill": "most relevant skill for this task",
      "dependencies": [],
      "input": {"key": "value pairs relevant to this task"}
    }
  ]
}

Rules:
- Break complex goals into 2-6 specific tasks
- Order tasks logically — later tasks can depend on earlier ones via the dependencies array
- Each task should be completable by a single agent in one pass
- Use dependency IDs to chain outputs (e.g., task_2 depends on ["task_1"])
- Be specific about what each task should produce
- Respond ONLY with valid JSON`;

        const userPrompt = `Decompose this goal into an execution plan: "${goalDescription}"${contextStr}`;

        const plan: ExecutionPlan = {
            goalId,
            goal: goalDescription,
            reasoning: '',
            tasks: [],
            status: 'planning',
            startedAt: new Date().toISOString(),
            totalTokensUsed: 0,
            totalCostUsd: 0,
        };

        this.executions.set(goalId, plan);

        const llm = await callLLM(systemPrompt, userPrompt);
        const parsed = parseLLMJson<{ reasoning: string; tasks: Array<{
            id: string; name: string; description: string; agent: string;
            skill: string; dependencies: string[]; input: Record<string, unknown>;
        }> }>(llm.content);

        if (parsed?.tasks?.length) {
            plan.reasoning = parsed.reasoning ?? 'Plan generated by LLM';
            plan.tasks = parsed.tasks.map(t => ({
                id: t.id,
                name: t.name,
                description: t.description,
                agent: t.agent,
                skill: t.skill,
                dependencies: t.dependencies ?? [],
                status: 'pending' as const,
                input: t.input ?? {},
            }));
            plan.totalTokensUsed += llm.inputTokens + llm.outputTokens;
        } else {
            // Fallback: single-task plan
            plan.reasoning = 'Direct execution (no API key or plan failed)';
            plan.tasks = [{
                id: 'task_1',
                name: goalDescription.slice(0, 60),
                description: goalDescription,
                agent: 'knowledge-analyst',
                skill: 'knowledge-search',
                dependencies: [],
                status: 'pending',
                input: { query: goalDescription },
            }];
        }

        plan.status = 'running';
        this.executions.set(goalId, plan);
        this.publishEvent('workflow.started', { executionId: goalId, workflowId: 'goal', trigger: goalDescription });

        console.log(`📋 Plan created: ${plan.tasks.length} tasks, reasoning: ${plan.reasoning.slice(0, 80)}`);
        return plan;
    }

    // -----------------------------------------------------------------------
    // Task Executor — Runs tasks in topological order
    // -----------------------------------------------------------------------

    private async executeGoal(
        goalId: string,
        plan: ExecutionPlan,
        context?: Record<string, unknown>
    ): Promise<void> {
        const taskOutputs: Record<string, string> = {};

        // Execute tasks in dependency order
        const executed = new Set<string>();

        while (executed.size < plan.tasks.length) {
            // Find next runnable tasks (all dependencies completed)
            const runnable = plan.tasks.filter(
                t => t.status === 'pending' && t.dependencies.every(d => executed.has(d))
            );

            if (runnable.length === 0 && executed.size < plan.tasks.length) {
                // Deadlock or all remaining tasks failed
                console.error(`[orchestrator] No runnable tasks found, ${plan.tasks.length - executed.size} remaining`);
                break;
            }

            // Execute runnable tasks (could be parallel, doing sequential for now)
            for (const task of runnable) {
                task.status = 'running';
                task.startedAt = new Date().toISOString();
                this.executions.set(goalId, plan);

                this.publishEvent('task.started', {
                    taskId: task.id,
                    workerId: task.agent,
                    startedAt: new Date(),
                });

                try {
                    // Build context from dependency outputs
                    const depContext = task.dependencies
                        .map(d => {
                            const depTask = plan.tasks.find(t => t.id === d);
                            return depTask?.output
                                ? `## Output from "${depTask.name}":\n${depTask.output.slice(0, 1500)}`
                                : '';
                        })
                        .filter(Boolean)
                        .join('\n\n');

                    const agentInfo = AGENT_REGISTRY[task.agent];
                    const agentDesc = agentInfo?.description ?? 'general-purpose agent';

                    const systemPrompt = `You are "${task.agent}", a ${agentDesc} working inside AgentOS.
You are executing a specific task as part of a larger goal: "${plan.goal}"

Produce high-quality, specific, immediately actionable output.
Be concrete — no generic filler. Include specific details, recommendations, and structured content.`;

                    const inputStr = Object.entries(task.input)
                        .filter(([, v]) => v !== undefined && v !== '')
                        .map(([k, v]) => `**${k}**: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                        .join('\n');

                    const userPrompt = `## Task: ${task.name}

${task.description}

${inputStr ? `## Inputs\n${inputStr}\n` : ''}${depContext ? `\n## Context from Previous Steps\n${depContext}\n` : ''}
Execute this task now. Produce comprehensive, specific output.`;

                    const llm = await callLLM(systemPrompt, userPrompt);

                    if (llm.content) {
                        task.output = llm.content;
                        task.tokensUsed = llm.inputTokens + llm.outputTokens;
                        plan.totalTokensUsed += task.tokensUsed;
                    } else {
                        task.output = `[No API key] Task "${task.name}" would be executed by ${task.agent} using ${task.skill}.\n\nDescription: ${task.description}\n\nConfigure ANTHROPIC_API_KEY for real execution.`;
                    }

                    task.status = 'completed';
                    task.completedAt = new Date().toISOString();
                    taskOutputs[task.id] = task.output;

                    this.publishEvent('task.completed', {
                        taskId: task.id,
                        output: task.output.slice(0, 500),
                        durationMs: Date.now() - new Date(task.startedAt!).getTime(),
                        tokensUsed: task.tokensUsed ?? 0,
                    });

                    console.log(`  ✅ Task ${task.id} (${task.name}) completed by ${task.agent}`);
                } catch (err) {
                    task.status = 'failed';
                    task.completedAt = new Date().toISOString();
                    task.error = err instanceof Error ? err.message : String(err);

                    this.publishEvent('task.failed', {
                        taskId: task.id,
                        error: { code: 'EXECUTION_FAILED', message: task.error },
                        retryCount: 0,
                        retryable: true,
                    });

                    console.error(`  ❌ Task ${task.id} failed: ${task.error}`);
                }

                executed.add(task.id);
                this.executions.set(goalId, plan);
            }
        }

        // Finalize
        const anyFailed = plan.tasks.some(t => t.status === 'failed');
        plan.status = anyFailed ? 'failed' : 'completed';
        plan.completedAt = new Date().toISOString();
        plan.totalCostUsd = (plan.totalTokensUsed * 3) / 1_000_000; // rough estimate
        this.executions.set(goalId, plan);

        const eventType = anyFailed ? 'workflow.failed' : 'workflow.completed';
        if (anyFailed) {
            const failedStep = plan.tasks.find(t => t.status === 'failed');
            this.publishEvent('workflow.failed', {
                executionId: goalId,
                failedStep: failedStep?.id ?? 'unknown',
                error: failedStep?.error ?? 'Unknown error',
            });
        } else {
            this.publishEvent('workflow.completed', {
                executionId: goalId,
                result: plan.tasks.map(t => ({ id: t.id, name: t.name, output: t.output?.slice(0, 200) })),
                durationMs: Date.now() - new Date(plan.startedAt).getTime(),
                stepsCompleted: plan.tasks.length,
            });
        }

        console.log(`📋 Goal ${goalId} ${plan.status}: ${plan.tasks.length} tasks, ${plan.totalTokensUsed} tokens`);
    }

    // -----------------------------------------------------------------------
    // Status & Control
    // -----------------------------------------------------------------------

    async getStatus(executionId: string): Promise<ExecutionPlan | { status: 'not_found' }> {
        return this.executions.get(executionId) ?? { status: 'not_found' as const };
    }

    async cancel(executionId: string): Promise<void> {
        const plan = this.executions.get(executionId);
        if (plan && (plan.status === 'running' || plan.status === 'planning')) {
            plan.status = 'cancelled';
            plan.completedAt = new Date().toISOString();
            // Mark pending tasks as skipped
            plan.tasks.forEach(t => {
                if (t.status === 'pending') t.status = 'skipped';
            });
            this.executions.set(executionId, plan);
            console.log(`📋 Goal ${executionId} cancelled`);
        }
    }

    listExecutions(): ExecutionPlan[] {
        return [...this.executions.values()].sort(
            (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
    }

    // -----------------------------------------------------------------------
    // Event Publishing (in-memory log for now)
    // -----------------------------------------------------------------------

    private publishEvent(type: string, data: unknown): void {
        this.eventLog.push({ type, data, time: new Date().toISOString() });
    }

    getEventLog(): Array<{ type: string; data: unknown; time: string }> {
        return this.eventLog;
    }

    // -----------------------------------------------------------------------
    // HTTP API
    // -----------------------------------------------------------------------

    private async startAPI(): Promise<void> {
        const { createServer } = await import('node:http');

        const server = createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            const url = new URL(req.url ?? '/', `http://localhost:${this.config.port}`);
            const path = url.pathname;

            try {
                // Health
                if (path === '/api/health' && req.method === 'GET') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'healthy',
                        uptime: process.uptime(),
                        activeGoals: [...this.executions.values()].filter(e => e.status === 'running').length,
                        totalGoals: this.executions.size,
                        llmConfigured: !!process.env.ANTHROPIC_API_KEY,
                    }));
                    return;
                }

                // Submit goal
                if (path === '/api/goal' && req.method === 'POST') {
                    const body = await readBody(req);
                    const { description, context, priority } = JSON.parse(body);
                    if (!description) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'description is required' }));
                        return;
                    }
                    const result = await this.submitGoal({ description, context, priority });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                    return;
                }

                // Get goal status
                if (path.startsWith('/api/goal/') && req.method === 'GET') {
                    const executionId = path.replace('/api/goal/', '');
                    const status = await this.getStatus(executionId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(status));
                    return;
                }

                // Cancel goal
                if (path.startsWith('/api/goal/') && path.endsWith('/cancel') && req.method === 'POST') {
                    const executionId = path.replace('/api/goal/', '').replace('/cancel', '');
                    await this.cancel(executionId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ cancelled: true }));
                    return;
                }

                // List all executions
                if (path === '/api/goals' && req.method === 'GET') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(this.listExecutions()));
                    return;
                }

                // Event log
                if (path === '/api/events' && req.method === 'GET') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(this.getEventLog()));
                    return;
                }

                // 404
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            } catch (err) {
                console.error('[orchestrator] HTTP error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }));
            }
        });

        server.listen(this.config.port, () => {
            console.log(`🧠 Orchestrator API listening on http://localhost:${this.config.port}`);
        });
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks).toString()));
        req.on('error', reject);
    });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const orchestrator = new Orchestrator();

orchestrator.start().catch((err) => {
    console.error('Failed to start orchestrator:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => orchestrator.stop());
process.on('SIGINT', () => orchestrator.stop());

export { Orchestrator, OrchestratorConfig, ExecutionPlan, TaskNode };
