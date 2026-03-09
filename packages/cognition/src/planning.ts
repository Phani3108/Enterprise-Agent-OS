/**
 * @agentos/cognition — Long-Horizon Planning Module
 *
 * Decomposes long-horizon goals into a hierarchy of plans spanning
 * different time horizons:
 *
 * Strategic (weeks-months) → Tactical (days-weeks) → Operational (minutes-hours)
 *
 * Plans are continuously revised based on observations, using a
 * model-predictive control approach adapted for LLM agents.
 */

import type { CognitiveLLM } from './reasoning.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanHorizon = 'strategic' | 'tactical' | 'operational';

export interface Plan {
    id: string;
    horizon: PlanHorizon;
    goal: string;
    steps: PlanStep[];
    assumptions: string[];
    risks: string[];
    revisedAt: Date;
    revisionCount: number;
    status: 'active' | 'completed' | 'failed' | 'revised';
    parent?: string;
    children: string[];
}

export interface PlanStep {
    id: string;
    description: string;
    requiredCapabilities: string[];
    estimatedDuration: string;
    status: 'pending' | 'active' | 'completed' | 'failed' | 'skipped';
    dependencies: string[];
    milestones: string[];
    checkpoints: PlanCheckpoint[];
}

export interface PlanCheckpoint {
    condition: string;
    action: 'continue' | 'revise' | 'abort';
    description: string;
}

export interface PlanRevision {
    planId: string;
    reason: string;
    oldSteps: PlanStep[];
    newSteps: PlanStep[];
    revisedAt: Date;
    trigger: 'observation' | 'failure' | 'new_information' | 'checkpoint' | 'manual';
}

// ---------------------------------------------------------------------------
// Long-Horizon Planner
// ---------------------------------------------------------------------------

export class LongHorizonPlanner {
    private plans = new Map<string, Plan>();
    private revisions: PlanRevision[] = [];

    constructor(private llm: CognitiveLLM) { }

    /**
     * Create a hierarchical plan from a high-level goal.
     */
    async createPlan(goal: string, context?: string): Promise<Plan> {
        // Generate strategic plan
        const strategicPlan = await this.generatePlan(goal, 'strategic', context);
        this.plans.set(strategicPlan.id, strategicPlan);

        // Decompose into tactical plans
        for (const step of strategicPlan.steps) {
            const tacticalPlan = await this.generatePlan(
                step.description,
                'tactical',
                context
            );
            tacticalPlan.parent = strategicPlan.id;
            this.plans.set(tacticalPlan.id, tacticalPlan);
            strategicPlan.children.push(tacticalPlan.id);

            // Decompose into operational plans
            for (const tactStep of tacticalPlan.steps) {
                const opsPlan = await this.generatePlan(
                    tactStep.description,
                    'operational',
                    context
                );
                opsPlan.parent = tacticalPlan.id;
                this.plans.set(opsPlan.id, opsPlan);
                tacticalPlan.children.push(opsPlan.id);
            }
        }

        return strategicPlan;
    }

    /**
     * Revise a plan based on new observations.
     */
    async revisePlan(planId: string, observation: string, trigger: PlanRevision['trigger']): Promise<Plan> {
        const plan = this.plans.get(planId);
        if (!plan) throw new Error(`Plan not found: ${planId}`);

        const oldSteps = [...plan.steps];

        const response = await this.llm.generate({
            system: `You are revising a ${plan.horizon} plan based on new information.
Maintain the original goal but update steps to account for the observation.
Keep completed steps, revise pending/active steps as needed.

Respond with JSON: { "steps": [...], "assumptions": [...], "risks": [...] }`,
            user: `Goal: ${plan.goal}\n\nCurrent plan:\n${JSON.stringify(plan.steps, null, 2)}\n\nNew observation: ${observation}`,
            maxTokens: 2000,
        });

        try {
            const parsed = JSON.parse(response);
            plan.steps = parsed.steps;
            plan.assumptions = parsed.assumptions ?? plan.assumptions;
            plan.risks = parsed.risks ?? plan.risks;
        } catch {
            // Keep existing plan if revision fails
        }

        plan.revisedAt = new Date();
        plan.revisionCount++;
        plan.status = 'revised';

        this.revisions.push({
            planId,
            reason: observation,
            oldSteps,
            newSteps: plan.steps,
            revisedAt: new Date(),
            trigger,
        });

        return plan;
    }

    /**
     * Check plan checkpoints and trigger revisions if needed.
     */
    async evaluateCheckpoints(planId: string, currentState: Record<string, unknown>): Promise<{
        action: 'continue' | 'revise' | 'abort';
        reason?: string;
    }> {
        const plan = this.plans.get(planId);
        if (!plan) throw new Error(`Plan not found: ${planId}`);

        const activeStep = plan.steps.find((s) => s.status === 'active');
        if (!activeStep) return { action: 'continue' };

        for (const checkpoint of activeStep.checkpoints) {
            const response = await this.llm.generate({
                system: `Evaluate if this checkpoint condition is met. Respond with JSON: { "met": bool, "explanation": "..." }`,
                user: `Condition: ${checkpoint.condition}\n\nCurrent state: ${JSON.stringify(currentState)}`,
                maxTokens: 200,
            });

            try {
                const result = JSON.parse(response);
                if (result.met && checkpoint.action !== 'continue') {
                    return { action: checkpoint.action, reason: result.explanation };
                }
            } catch {
                continue;
            }
        }

        return { action: 'continue' };
    }

    /**
     * Get the full plan hierarchy.
     */
    getPlanHierarchy(rootPlanId: string): Plan[] {
        const hierarchy: Plan[] = [];
        const queue = [rootPlanId];

        while (queue.length > 0) {
            const id = queue.shift()!;
            const plan = this.plans.get(id);
            if (plan) {
                hierarchy.push(plan);
                queue.push(...plan.children);
            }
        }

        return hierarchy;
    }

    // -------------------------------------------------------------------------
    // Plan Generation
    // -------------------------------------------------------------------------

    private async generatePlan(goal: string, horizon: PlanHorizon, context?: string): Promise<Plan> {
        const horizonGuidance = {
            strategic: 'Plan at the strategic level (weeks to months). Focus on milestones and high-level phases.',
            tactical: 'Plan at the tactical level (days to weeks). Break into concrete work streams.',
            operational: 'Plan at the operational level (minutes to hours). Create specific executable steps.',
        };

        const response = await this.llm.generate({
            system: `You are planning at the ${horizon} level. ${horizonGuidance[horizon]}

Respond with JSON:
{
  "steps": [{ "id": "s1", "description": "...", "requiredCapabilities": [...], "estimatedDuration": "...", "status": "pending", "dependencies": [...], "milestones": [...], "checkpoints": [{ "condition": "...", "action": "continue|revise|abort", "description": "..." }] }],
  "assumptions": [...],
  "risks": [...]
}`,
            user: `Goal: ${goal}${context ? `\n\nContext: ${context}` : ''}`,
            maxTokens: 2000,
        });

        let parsed;
        try {
            parsed = JSON.parse(response);
        } catch {
            parsed = {
                steps: [{ id: 's1', description: goal, requiredCapabilities: [], estimatedDuration: 'unknown', status: 'pending', dependencies: [], milestones: [], checkpoints: [] }],
                assumptions: [],
                risks: [],
            };
        }

        return {
            id: `plan-${horizon}-${Date.now()}`,
            horizon,
            goal,
            steps: parsed.steps,
            assumptions: parsed.assumptions ?? [],
            risks: parsed.risks ?? [],
            revisedAt: new Date(),
            revisionCount: 0,
            status: 'active',
            children: [],
        };
    }
}
