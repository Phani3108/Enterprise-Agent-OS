/**
 * @agentos/policy — Policy Types
 *
 * Type definitions for the policy engine.
 */

// ---------------------------------------------------------------------------
// Policy Definition
// ---------------------------------------------------------------------------

export type PolicyScopeType = 'global' | 'cluster' | 'worker' | 'tool' | 'workflow';

export interface PolicyScope {
    type: PolicyScopeType;
    cluster?: string;
    worker?: string;
    tool?: string;
    workflow?: string;
}

export type PolicyActionType = 'allow' | 'deny' | 'require_approval' | 'rate_limit' | 'transform';

export interface PolicyAction {
    type: PolicyActionType;
    reason?: string;
    approvers?: string[];
    timeoutMinutes?: number;
    escalation?: string;
    maxPerMinute?: number;
    transformer?: string;
}

export interface Policy {
    id: string;
    name: string;
    description: string;
    scope: PolicyScope;
    priority: number;
    condition: PolicyCondition;
    action: PolicyAction;
    enabled: boolean;
    metadata: {
        author: string;
        createdAt: Date;
        version: number;
        tags?: string[];
    };
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export type PolicyCondition =
    | FieldCondition
    | AllCondition
    | AnyCondition
    | NotCondition;

export interface FieldCondition {
    field: string;
    equals?: unknown;
    notEquals?: unknown;
    in?: unknown[];
    notIn?: unknown[];
    greaterThan?: number;
    lessThan?: number;
    matches?: string;
    exists?: boolean;
}

export interface AllCondition {
    all: PolicyCondition[];
}

export interface AnyCondition {
    any: PolicyCondition[];
}

export interface NotCondition {
    not: PolicyCondition;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export type PolicyDecision = 'allow' | 'deny' | 'escalate';

export interface PolicyEvaluationResult {
    decision: PolicyDecision;
    matchedPolicies: PolicyMatch[];
    reason?: string;
    evaluationTimeMs: number;
}

export interface PolicyMatch {
    policyId: string;
    policyName: string;
    priority: number;
    action: PolicyAction;
}

/**
 * The context against which policies are evaluated.
 * Contains information about who is doing what.
 */
export interface EvaluationContext {
    /** Worker performing the action */
    workerId: string;
    /** Cluster the worker belongs to */
    cluster: string;
    /** Type of action being performed */
    actionType: string;
    /** Tool being invoked (if applicable) */
    toolName?: string;
    /** Workflow being executed (if applicable) */
    workflowId?: string;
    /** Action-specific arguments */
    args: Record<string, unknown>;
    /** Tenant context */
    tenantId: string;
    /** Additional context */
    metadata: Record<string, unknown>;
}
