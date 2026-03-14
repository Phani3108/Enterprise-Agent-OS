/**
 * Gateway Orchestrator — Embedded goal decomposition & execution
 *
 * When a user submits a high-level goal via the gateway, this module:
 * 1. Uses LLM to decompose the goal into a task DAG
 * 2. Routes tasks to appropriate agents
 * 3. Executes tasks in dependency order
 * 4. Publishes events for each lifecycle phase
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { eventBus } from './event-bus.js';

// ---------------------------------------------------------------------------
// LLM Call
// ---------------------------------------------------------------------------

const LLM_MODEL = 'claude-sonnet-4-6-20251001';

async function callLLM(systemPrompt: string, userPrompt: string): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { content: '', inputTokens: 0, outputTokens: 0 };

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
    try { return JSON.parse(cleaned) as T; } catch { return null; }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoalTask {
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

export interface GoalExecution {
    id: string;
    goal: string;
    reasoning: string;
    tasks: GoalTask[];
    status: 'planning' | 'running' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'critical';
    startedAt: string;
    completedAt?: string;
    totalTokensUsed: number;
    userId?: string;
}

// ---------------------------------------------------------------------------
// Agent Registry
// ---------------------------------------------------------------------------

const AGENT_REGISTRY: Record<string, { description: string; skills: string[] }> = {
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
// Execution Store
// ---------------------------------------------------------------------------

const goalExecutions = new Map<string, GoalExecution>();

// ---------------------------------------------------------------------------
// Goal Planner
// ---------------------------------------------------------------------------

async function planGoal(goalId: string, goalDescription: string, context?: Record<string, unknown>): Promise<GoalExecution> {
    const agentDescriptions = Object.entries(AGENT_REGISTRY)
        .map(([name, info]) => `- **${name}**: ${info.description} (skills: ${info.skills.join(', ')})`)
        .join('\n');

    const contextStr = context
        ? '\n\nAdditional context:\n' + Object.entries(context).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n')
        : '';

    const systemPrompt = `You are the planning engine of AgentOS, an AI operating system.
Decompose the goal into concrete tasks assigned to appropriate agents.

Available agents:
${agentDescriptions}

Return valid JSON:
{
  "reasoning": "Brief explanation of your approach",
  "tasks": [
    {
      "id": "task_1",
      "name": "Short task name",
      "description": "What this task should accomplish",
      "agent": "agent-name from list above",
      "skill": "relevant skill",
      "dependencies": [],
      "input": {"key": "value"}
    }
  ]
}

Rules:
- 2-6 tasks per goal
- dependency IDs chain outputs
- Be specific about deliverables
- JSON only`;

    const userPrompt = `Decompose: "${goalDescription}"${contextStr}`;

    const exec: GoalExecution = {
        id: goalId,
        goal: goalDescription,
        reasoning: '',
        tasks: [],
        status: 'planning',
        priority: 'normal',
        startedAt: new Date().toISOString(),
        totalTokensUsed: 0,
    };

    goalExecutions.set(goalId, exec);
    await eventBus.emit('goal.planning', { goalId, goal: goalDescription });

    const llm = await callLLM(systemPrompt, userPrompt);
    const parsed = parseLLMJson<{ reasoning: string; tasks: Array<{
        id: string; name: string; description: string; agent: string;
        skill: string; dependencies: string[]; input: Record<string, unknown>;
    }> }>(llm.content);

    if (parsed?.tasks?.length) {
        exec.reasoning = parsed.reasoning ?? 'Plan generated';
        exec.tasks = parsed.tasks.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            agent: t.agent,
            skill: t.skill,
            dependencies: t.dependencies ?? [],
            status: 'pending' as const,
            input: t.input ?? {},
        }));
        exec.totalTokensUsed += llm.inputTokens + llm.outputTokens;
    } else {
        exec.reasoning = 'Direct execution (no API key or plan generation failed)';
        exec.tasks = [{
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

    exec.status = 'running';
    goalExecutions.set(goalId, exec);
    await eventBus.emit('goal.planned', { goalId, taskCount: exec.tasks.length, reasoning: exec.reasoning });

    return exec;
}

// ---------------------------------------------------------------------------
// Task Executor
// ---------------------------------------------------------------------------

async function executeGoalTasks(goalId: string, exec: GoalExecution): Promise<void> {
    const executed = new Set<string>();

    while (executed.size < exec.tasks.length) {
        const runnable = exec.tasks.filter(
            t => t.status === 'pending' && t.dependencies.every(d => executed.has(d))
        );

        if (runnable.length === 0 && executed.size < exec.tasks.length) break;

        for (const task of runnable) {
            task.status = 'running';
            task.startedAt = new Date().toISOString();
            goalExecutions.set(goalId, exec);
            await eventBus.emit('task.started', { goalId, taskId: task.id, agent: task.agent });

            try {
                const depContext = task.dependencies
                    .map(d => exec.tasks.find(t => t.id === d))
                    .filter(t => t?.output)
                    .map(t => `## Output from "${t!.name}":\n${t!.output!.slice(0, 1500)}`)
                    .join('\n\n');

                const agentInfo = AGENT_REGISTRY[task.agent];
                const systemPrompt = `You are "${task.agent}", a ${agentInfo?.description ?? 'general-purpose agent'} in AgentOS.
Executing a task as part of goal: "${exec.goal}"
Produce specific, actionable output. No generic filler.`;

                const inputStr = Object.entries(task.input)
                    .filter(([, v]) => v !== undefined && v !== '')
                    .map(([k, v]) => `**${k}**: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                    .join('\n');

                const userPrompt = `## Task: ${task.name}\n\n${task.description}\n\n${inputStr ? `## Inputs\n${inputStr}\n` : ''}${depContext ? `\n## Previous Steps\n${depContext}\n` : ''}\nExecute now.`;

                const llm = await callLLM(systemPrompt, userPrompt);

                task.output = llm.content || `[No API key] Task "${task.name}" by ${task.agent}.\n\nDescription: ${task.description}\n\nSet ANTHROPIC_API_KEY for real execution.`;
                task.tokensUsed = llm.inputTokens + llm.outputTokens;
                exec.totalTokensUsed += task.tokensUsed;
                task.status = 'completed';
                task.completedAt = new Date().toISOString();

                await eventBus.emit('task.completed', { goalId, taskId: task.id, tokensUsed: task.tokensUsed });
            } catch (err) {
                task.status = 'failed';
                task.completedAt = new Date().toISOString();
                task.error = err instanceof Error ? err.message : String(err);
                await eventBus.emit('task.failed', { goalId, taskId: task.id, error: task.error });
            }

            executed.add(task.id);
            goalExecutions.set(goalId, exec);
        }
    }

    const anyFailed = exec.tasks.some(t => t.status === 'failed');
    exec.status = anyFailed ? 'failed' : 'completed';
    exec.completedAt = new Date().toISOString();
    goalExecutions.set(goalId, exec);

    await eventBus.emit(`goal.${exec.status}`, {
        goalId,
        taskCount: exec.tasks.length,
        totalTokens: exec.totalTokensUsed,
        durationMs: Date.now() - new Date(exec.startedAt).getTime(),
    });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function submitGoal(
    description: string,
    context?: Record<string, unknown>,
    priority?: 'low' | 'normal' | 'high' | 'critical',
    userId?: string
): Promise<GoalExecution> {
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const exec = await planGoal(goalId, description, context);
    exec.priority = priority ?? 'normal';
    exec.userId = userId;

    // Execute async (non-blocking)
    executeGoalTasks(goalId, exec).catch(err => {
        console.error(`[orchestrator] Goal ${goalId} execution error:`, err);
        exec.status = 'failed';
        exec.completedAt = new Date().toISOString();
        goalExecutions.set(goalId, exec);
    });

    return exec;
}

export function getGoalExecution(goalId: string): GoalExecution | undefined {
    return goalExecutions.get(goalId);
}

export function listGoalExecutions(): GoalExecution[] {
    return [...goalExecutions.values()].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
}

export async function cancelGoal(goalId: string): Promise<boolean> {
    const exec = goalExecutions.get(goalId);
    if (!exec || (exec.status !== 'running' && exec.status !== 'planning')) return false;

    exec.status = 'cancelled';
    exec.completedAt = new Date().toISOString();
    exec.tasks.forEach(t => { if (t.status === 'pending') t.status = 'skipped'; });
    goalExecutions.set(goalId, exec);

    await eventBus.emit('goal.cancelled', { goalId });
    return true;
}
