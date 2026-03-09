/**
 * Approval Engine — Policy-driven approval for sensitive operations
 *
 * Before EOS executes high-impact actions (creating Jira tickets, posting
 * to Slack, modifying CRM), the approval engine checks whether automatic
 * execution is allowed or human approval is required.
 *
 * Policies are rules that map (action, sensitivity, user) → approval requirement.
 * Approvals flow through channels: in-app, Slack DM, Teams, or email.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'auto_approved';

export interface ApprovalRequest {
    id: string;
    /** What action requires approval */
    action: ApprovalAction;
    /** Who initiated */
    requestedBy: string;
    /** When requested */
    requestedAt: Date;
    /** Approval chain */
    approvers: string[];
    /** Current status */
    status: ApprovalStatus;
    /** Who approved/rejected */
    resolvedBy?: string;
    resolvedAt?: Date;
    reason?: string;
    /** Expires automatically */
    expiresAt: Date;
    /** Escalation chain */
    escalationChain: string[];
    currentEscalationLevel: number;
}

export interface ApprovalAction {
    type: string; // e.g., 'jira.create_ticket', 'slack.post_message', 'crm.update'
    description: string;
    metadata: Record<string, unknown>;
    sensitivity: 'low' | 'medium' | 'high' | 'critical';
    reversible: boolean;
}

export interface ApprovalPolicy {
    id: string;
    name: string;
    /** Match conditions */
    conditions: PolicyCondition[];
    /** What approval is needed */
    requirement: PolicyRequirement;
    /** Priority (higher = checked first) */
    priority: number;
    enabled: boolean;
}

export interface PolicyCondition {
    field: 'action_type' | 'sensitivity' | 'user_role' | 'domain' | 'cost_usd';
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
    value: unknown;
}

export interface PolicyRequirement {
    type: 'auto_approve' | 'single_approval' | 'multi_approval' | 'block';
    approverRoles?: string[];
    specificApprovers?: string[];
    minApprovals?: number;
    timeoutMinutes: number;
    escalateAfterMinutes?: number;
    escalateTo?: string[];
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ApprovalEngine {
    private policies: ApprovalPolicy[] = [];
    private pendingRequests: Map<string, ApprovalRequest> = new Map();
    private auditLog: AuditEntry[] = [];

    /**
     * Register an approval policy.
     */
    addPolicy(policy: ApprovalPolicy): void {
        this.policies.push(policy);
        this.policies.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Check if an action requires approval and create a request if needed.
     */
    async checkAndRequest(action: ApprovalAction, requestedBy: string): Promise<ApprovalDecision> {
        const policy = this.findMatchingPolicy(action, requestedBy);

        if (!policy) {
            // No policy matches → auto-approve (default permissive)
            this.audit(action, requestedBy, 'auto_approved', 'No matching policy');
            return { approved: true, requestId: undefined, reason: 'No policy applies' };
        }

        if (policy.requirement.type === 'auto_approve') {
            this.audit(action, requestedBy, 'auto_approved', policy.name);
            return { approved: true, requestId: undefined, reason: `Auto-approved by policy: ${policy.name}` };
        }

        if (policy.requirement.type === 'block') {
            this.audit(action, requestedBy, 'rejected', `Blocked by policy: ${policy.name}`);
            return { approved: false, requestId: undefined, reason: `Blocked by policy: ${policy.name}` };
        }

        // Needs approval → create request
        const request = this.createRequest(action, requestedBy, policy);
        this.pendingRequests.set(request.id, request);
        this.audit(action, requestedBy, 'pending', `Approval required: ${policy.name}`);

        // Notify approvers (in production: send to Slack/Teams/email)
        await this.notifyApprovers(request);

        return {
            approved: false,
            requestId: request.id,
            reason: `Awaiting approval from: ${request.approvers.join(', ')}`,
            expiresAt: request.expiresAt,
        };
    }

    /**
     * Resolve an approval request.
     */
    resolve(requestId: string, resolvedBy: string, approved: boolean, reason?: string): ApprovalDecision {
        const request = this.pendingRequests.get(requestId);
        if (!request) return { approved: false, reason: 'Request not found' };

        if (request.status !== 'pending') {
            return { approved: false, reason: `Request already ${request.status}` };
        }

        if (!request.approvers.includes(resolvedBy) && !request.escalationChain.includes(resolvedBy)) {
            return { approved: false, reason: 'Not an authorized approver' };
        }

        request.status = approved ? 'approved' : 'rejected';
        request.resolvedBy = resolvedBy;
        request.resolvedAt = new Date();
        request.reason = reason;

        this.audit(request.action, request.requestedBy, request.status, `${resolvedBy}: ${reason ?? 'no reason'}`);

        return {
            approved,
            requestId,
            reason: reason ?? (approved ? 'Approved' : 'Rejected'),
        };
    }

    /**
     * Check and escalate timed-out requests.
     */
    processEscalations(): void {
        const now = new Date();
        for (const [, request] of this.pendingRequests) {
            if (request.status !== 'pending') continue;

            // Check expiry
            if (now >= request.expiresAt) {
                request.status = 'expired';
                this.audit(request.action, request.requestedBy, 'expired', 'Approval timed out');
                continue;
            }

            // Check escalation
            if (request.escalationChain.length > request.currentEscalationLevel) {
                const nextEscalation = request.escalationChain[request.currentEscalationLevel];
                if (nextEscalation && !request.approvers.includes(nextEscalation)) {
                    request.approvers.push(nextEscalation);
                    request.currentEscalationLevel++;
                }
            }
        }
    }

    /**
     * Get pending requests for a user.
     */
    getPendingForUser(userId: string): ApprovalRequest[] {
        return [...this.pendingRequests.values()]
            .filter(r => r.status === 'pending' && r.approvers.includes(userId));
    }

    /**
     * Get audit trail.
     */
    getAuditLog(limit: number = 100): AuditEntry[] {
        return this.auditLog.slice(-limit);
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    private findMatchingPolicy(action: ApprovalAction, user: string): ApprovalPolicy | undefined {
        return this.policies.find(policy => {
            if (!policy.enabled) return false;
            return policy.conditions.every(cond => {
                const value = this.getConditionValue(cond.field, action, user);
                return this.evaluateCondition(value, cond.operator, cond.value);
            });
        });
    }

    private getConditionValue(field: string, action: ApprovalAction, user: string): unknown {
        switch (field) {
            case 'action_type': return action.type;
            case 'sensitivity': return action.sensitivity;
            case 'user_role': return user; // In production: resolve role from user service
            case 'domain': return action.type.split('.')[0];
            case 'cost_usd': return action.metadata.estimatedCostUsd ?? 0;
            default: return undefined;
        }
    }

    private evaluateCondition(value: unknown, operator: string, target: unknown): boolean {
        switch (operator) {
            case 'equals': return value === target;
            case 'contains': return String(value).includes(String(target));
            case 'gt': return Number(value) > Number(target);
            case 'lt': return Number(value) < Number(target);
            case 'in': return Array.isArray(target) && target.includes(value);
            default: return false;
        }
    }

    private createRequest(action: ApprovalAction, requestedBy: string, policy: ApprovalPolicy): ApprovalRequest {
        return {
            id: `apr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            action,
            requestedBy,
            requestedAt: new Date(),
            approvers: policy.requirement.specificApprovers ?? [],
            status: 'pending',
            expiresAt: new Date(Date.now() + (policy.requirement.timeoutMinutes ?? 60) * 60_000),
            escalationChain: policy.requirement.escalateTo ?? [],
            currentEscalationLevel: 0,
        };
    }

    private async notifyApprovers(_request: ApprovalRequest): Promise<void> {
        // In production: send Slack DM, Teams message, or email to each approver
    }

    private audit(action: ApprovalAction, user: string, status: string, details: string): void {
        this.auditLog.push({
            timestamp: new Date(),
            actionType: action.type,
            actionDescription: action.description,
            user,
            status,
            details,
            sensitivity: action.sensitivity,
        });
    }
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ApprovalDecision {
    approved: boolean;
    requestId?: string;
    reason: string;
    expiresAt?: Date;
}

interface AuditEntry {
    timestamp: Date;
    actionType: string;
    actionDescription: string;
    user: string;
    status: string;
    details: string;
    sensitivity: string;
}

// ---------------------------------------------------------------------------
// Default policies
// ---------------------------------------------------------------------------

export const DEFAULT_POLICIES: ApprovalPolicy[] = [
    {
        id: 'read-only-auto',
        name: 'Auto-approve read-only actions',
        conditions: [{ field: 'action_type', operator: 'contains', value: 'search' }],
        requirement: { type: 'auto_approve', timeoutMinutes: 0 },
        priority: 100,
        enabled: true,
    },
    {
        id: 'critical-write-block',
        name: 'Block critical writes without approval',
        conditions: [
            { field: 'sensitivity', operator: 'equals', value: 'critical' },
        ],
        requirement: {
            type: 'multi_approval',
            minApprovals: 2,
            approverRoles: ['admin', 'team-lead'],
            timeoutMinutes: 60,
            escalateAfterMinutes: 30,
            escalateTo: ['engineering-director'],
        },
        priority: 90,
        enabled: true,
    },
    {
        id: 'jira-create',
        name: 'Approve Jira ticket creation',
        conditions: [{ field: 'action_type', operator: 'equals', value: 'jira.create_ticket' }],
        requirement: { type: 'single_approval', timeoutMinutes: 120 },
        priority: 50,
        enabled: true,
    },
    {
        id: 'slack-post',
        name: 'Approve Slack channel posts',
        conditions: [{ field: 'action_type', operator: 'equals', value: 'slack.post_message' }],
        requirement: { type: 'single_approval', timeoutMinutes: 30 },
        priority: 50,
        enabled: true,
    },
    {
        id: 'low-sensitivity-auto',
        name: 'Auto-approve low sensitivity actions',
        conditions: [{ field: 'sensitivity', operator: 'equals', value: 'low' }],
        requirement: { type: 'auto_approve', timeoutMinutes: 0 },
        priority: 10,
        enabled: true,
    },
];
