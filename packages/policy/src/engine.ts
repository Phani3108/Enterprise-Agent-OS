/**
 * @agentos/policy — Policy Engine
 *
 * Evaluates policies against an action context to produce allow/deny/escalate decisions.
 * Policies are matched by scope, sorted by priority, and conditions are evaluated
 * using a composable condition tree (AND/OR/NOT/field comparisons).
 */

import type {
    Policy,
    PolicyCondition,
    FieldCondition,
    AllCondition,
    AnyCondition,
    NotCondition,
    PolicyEvaluationResult,
    PolicyDecision,
    PolicyMatch,
    EvaluationContext,
} from './types.js';

/**
 * Policy evaluation engine.
 *
 * Evaluates a set of policies against an execution context to determine
 * whether an action should be allowed, denied, or escalated for approval.
 *
 * ## Evaluation Rules
 * 1. Collect all policies matching the action's scope
 * 2. Sort by priority (highest first)
 * 3. Evaluate conditions against the context
 * 4. First `deny` → action denied (short-circuit)
 * 5. Any `require_approval` → escalate
 * 6. All `allow` (or no matching policies) → allowed
 */
export class PolicyEngine {
    private policies: Policy[] = [];

    /**
     * Load policies into the engine.
     */
    loadPolicies(policies: Policy[]): void {
        this.policies = policies.filter((p) => p.enabled);
        // Sort by priority descending (highest evaluated first)
        this.policies.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Add a single policy.
     */
    addPolicy(policy: Policy): void {
        if (policy.enabled) {
            this.policies.push(policy);
            this.policies.sort((a, b) => b.priority - a.priority);
        }
    }

    /**
     * Remove a policy by ID.
     */
    removePolicy(policyId: string): void {
        this.policies = this.policies.filter((p) => p.id !== policyId);
    }

    /**
     * Evaluate all matching policies against the given context.
     */
    evaluate(context: EvaluationContext): PolicyEvaluationResult {
        const startTime = Date.now();
        const matchedPolicies: PolicyMatch[] = [];
        let decision: PolicyDecision = 'allow';
        let reason: string | undefined;

        // Find policies matching the context's scope
        const applicablePolicies = this.policies.filter((p) =>
            this.matchesScope(p, context)
        );

        for (const policy of applicablePolicies) {
            // Evaluate the policy's condition tree
            const conditionMet = this.evaluateCondition(policy.condition, context);

            if (!conditionMet) continue;

            // Condition matched — record the policy
            matchedPolicies.push({
                policyId: policy.id,
                policyName: policy.name,
                priority: policy.priority,
                action: policy.action,
            });

            // Apply the action
            switch (policy.action.type) {
                case 'deny':
                    // Deny short-circuits — immediately return
                    return {
                        decision: 'deny',
                        matchedPolicies,
                        reason: policy.action.reason ?? `Denied by policy: ${policy.name}`,
                        evaluationTimeMs: Date.now() - startTime,
                    };

                case 'require_approval':
                    // Escalate — continue evaluating but mark decision
                    decision = 'escalate';
                    reason = `Approval required by policy: ${policy.name}`;
                    break;

                case 'rate_limit':
                    // Rate limit is handled externally — mark but don't change decision
                    break;

                case 'allow':
                case 'transform':
                    // Explicit allow or transform — continue evaluating
                    break;
            }
        }

        return {
            decision,
            matchedPolicies,
            reason,
            evaluationTimeMs: Date.now() - startTime,
        };
    }

    /**
     * Get all policies (for debugging / admin).
     */
    listPolicies(): Policy[] {
        return [...this.policies];
    }

    // -------------------------------------------------------------------------
    // Scope Matching
    // -------------------------------------------------------------------------

    /**
     * Check if a policy's scope matches the evaluation context.
     */
    private matchesScope(policy: Policy, context: EvaluationContext): boolean {
        switch (policy.scope.type) {
            case 'global':
                return true;

            case 'cluster':
                return policy.scope.cluster === context.cluster;

            case 'worker':
                return policy.scope.worker === context.workerId;

            case 'tool':
                return policy.scope.tool === context.toolName;

            case 'workflow':
                return policy.scope.workflow === context.workflowId;

            default:
                return false;
        }
    }

    // -------------------------------------------------------------------------
    // Condition Evaluation
    // -------------------------------------------------------------------------

    /**
     * Recursively evaluate a condition tree.
     */
    evaluateCondition(
        condition: PolicyCondition,
        context: EvaluationContext
    ): boolean {
        // Compound: ALL (AND)
        if ('all' in condition) {
            return (condition as AllCondition).all.every((c) =>
                this.evaluateCondition(c, context)
            );
        }

        // Compound: ANY (OR)
        if ('any' in condition) {
            return (condition as AnyCondition).any.some((c) =>
                this.evaluateCondition(c, context)
            );
        }

        // Compound: NOT
        if ('not' in condition) {
            return !this.evaluateCondition((condition as NotCondition).not, context);
        }

        // Field condition
        if ('field' in condition) {
            return this.evaluateFieldCondition(condition as FieldCondition, context);
        }

        return false;
    }

    /**
     * Evaluate a single field condition against the context.
     */
    private evaluateFieldCondition(
        condition: FieldCondition,
        context: EvaluationContext
    ): boolean {
        const value = this.resolveField(condition.field, context);

        if (condition.exists !== undefined) {
            return condition.exists ? value !== undefined : value === undefined;
        }

        if (condition.equals !== undefined) {
            return value === condition.equals;
        }

        if (condition.notEquals !== undefined) {
            return value !== condition.notEquals;
        }

        if (condition.in !== undefined) {
            return condition.in.includes(value);
        }

        if (condition.notIn !== undefined) {
            return !condition.notIn.includes(value);
        }

        if (condition.greaterThan !== undefined) {
            return typeof value === 'number' && value > condition.greaterThan;
        }

        if (condition.lessThan !== undefined) {
            return typeof value === 'number' && value < condition.lessThan;
        }

        if (condition.matches !== undefined) {
            return typeof value === 'string' && new RegExp(condition.matches).test(value);
        }

        return false;
    }

    /**
     * Resolve a dot-path field reference against the evaluation context.
     *
     * Supported root paths:
     * - `args.*` — action arguments
     * - `worker` — worker ID
     * - `cluster` — cluster name
     * - `tool` — tool name
     * - `workflow` — workflow ID
     * - `metadata.*` — additional metadata
     */
    private resolveField(path: string, context: EvaluationContext): unknown {
        const parts = path.split('.');

        // Map root segments to context fields
        const rootMap: Record<string, unknown> = {
            args: context.args,
            worker: context.workerId,
            cluster: context.cluster,
            tool: context.toolName,
            workflow: context.workflowId,
            actionType: context.actionType,
            tenantId: context.tenantId,
            metadata: context.metadata,
        };

        if (parts.length === 1) {
            return rootMap[parts[0]];
        }

        // Navigate into nested objects
        let current: unknown = rootMap[parts[0]];
        for (let i = 1; i < parts.length; i++) {
            if (current == null || typeof current !== 'object') return undefined;
            current = (current as Record<string, unknown>)[parts[i]];
        }

        return current;
    }
}
