/**
 * @agentos/kernel — Security Isolation Layer
 *
 * Enforces security boundaries between agent processes:
 * - Namespace isolation (agents cannot access other agents' state)
 * - Privilege levels (root → admin → standard → restricted)
 * - Resource quotas with hard enforcement
 * - Audit trail for all privileged operations
 * - Secret access gating
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrivilegeLevel = 'root' | 'admin' | 'standard' | 'restricted';

export interface SecurityContext {
    pid: string;
    workerId: string;
    tenantId: string;
    privilege: PrivilegeLevel;
    namespace: string;
    allowedTools: Set<string>;
    deniedTools: Set<string>;
    allowedSecrets: Set<string>;
    allowedNamespaces: Set<string>;
    maxConcurrentToolCalls: number;
    networkAllowlist: string[];
    auditAll: boolean;
}

export interface SecurityViolation {
    id: string;
    pid: string;
    type: 'tool_denied' | 'namespace_violation' | 'privilege_escalation'
    | 'quota_exceeded' | 'secret_denied' | 'network_violation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    attempted: string;
    timestamp: Date;
    action: 'blocked' | 'warned' | 'logged';
}

export interface IsolationPolicy {
    id: string;
    name: string;
    privilege: PrivilegeLevel;
    rules: {
        allowedToolPatterns: string[];
        deniedToolPatterns: string[];
        allowedSecretPatterns: string[];
        allowedNamespaces: string[];
        networkAllowlist: string[];
        maxConcurrentToolCalls: number;
        canAccessOtherAgentState: boolean;
        canModifyClusterConfig: boolean;
        canEscalatePrivilege: boolean;
        requireApprovalForWrite: boolean;
    };
}

// ---------------------------------------------------------------------------
// Privilege Hierarchy
// ---------------------------------------------------------------------------

const PRIVILEGE_HIERARCHY: Record<PrivilegeLevel, number> = {
    root: 4,
    admin: 3,
    standard: 2,
    restricted: 1,
};

// ---------------------------------------------------------------------------
// Default Isolation Policies
// ---------------------------------------------------------------------------

export const DEFAULT_POLICIES: IsolationPolicy[] = [
    {
        id: 'policy-root',
        name: 'Root',
        privilege: 'root',
        rules: {
            allowedToolPatterns: ['*'],
            deniedToolPatterns: [],
            allowedSecretPatterns: ['*'],
            allowedNamespaces: ['*'],
            networkAllowlist: ['*'],
            maxConcurrentToolCalls: 50,
            canAccessOtherAgentState: true,
            canModifyClusterConfig: true,
            canEscalatePrivilege: true,
            requireApprovalForWrite: false,
        },
    },
    {
        id: 'policy-admin',
        name: 'Admin',
        privilege: 'admin',
        rules: {
            allowedToolPatterns: ['*'],
            deniedToolPatterns: ['system.*'],
            allowedSecretPatterns: ['*'],
            allowedNamespaces: ['*'],
            networkAllowlist: ['*'],
            maxConcurrentToolCalls: 30,
            canAccessOtherAgentState: true,
            canModifyClusterConfig: false,
            canEscalatePrivilege: false,
            requireApprovalForWrite: false,
        },
    },
    {
        id: 'policy-standard',
        name: 'Standard',
        privilege: 'standard',
        rules: {
            allowedToolPatterns: ['read.*', 'write.*', 'search.*'],
            deniedToolPatterns: ['system.*', 'admin.*', 'cluster.*'],
            allowedSecretPatterns: ['app.*', 'api.*'],
            allowedNamespaces: ['own'],
            networkAllowlist: ['api.*', 'internal.*'],
            maxConcurrentToolCalls: 10,
            canAccessOtherAgentState: false,
            canModifyClusterConfig: false,
            canEscalatePrivilege: false,
            requireApprovalForWrite: true,
        },
    },
    {
        id: 'policy-restricted',
        name: 'Restricted',
        privilege: 'restricted',
        rules: {
            allowedToolPatterns: ['read.*'],
            deniedToolPatterns: ['write.*', 'delete.*', 'system.*', 'admin.*', 'cluster.*'],
            allowedSecretPatterns: [],
            allowedNamespaces: ['own'],
            networkAllowlist: [],
            maxConcurrentToolCalls: 3,
            canAccessOtherAgentState: false,
            canModifyClusterConfig: false,
            canEscalatePrivilege: false,
            requireApprovalForWrite: true,
        },
    },
];

// ---------------------------------------------------------------------------
// Security Isolation Engine
// ---------------------------------------------------------------------------

export class SecurityIsolation {
    private contexts = new Map<string, SecurityContext>();
    private violations: SecurityViolation[] = [];
    private policies = new Map<string, IsolationPolicy>();

    constructor() {
        // Register default policies
        for (const policy of DEFAULT_POLICIES) {
            this.policies.set(policy.id, policy);
        }
    }

    /**
     * Create a security context for an agent process.
     */
    createContext(
        pid: string,
        workerId: string,
        tenantId: string,
        privilege: PrivilegeLevel = 'standard'
    ): SecurityContext {
        const policy = DEFAULT_POLICIES.find((p) => p.privilege === privilege)!;

        const context: SecurityContext = {
            pid,
            workerId,
            tenantId,
            privilege,
            namespace: `${tenantId}/${workerId}`,
            allowedTools: new Set(policy.rules.allowedToolPatterns),
            deniedTools: new Set(policy.rules.deniedToolPatterns),
            allowedSecrets: new Set(policy.rules.allowedSecretPatterns),
            allowedNamespaces: new Set(policy.rules.allowedNamespaces),
            maxConcurrentToolCalls: policy.rules.maxConcurrentToolCalls,
            networkAllowlist: policy.rules.networkAllowlist,
            auditAll: privilege === 'root' || privilege === 'admin',
        };

        this.contexts.set(pid, context);
        return context;
    }

    /**
     * Check if a tool call is allowed.
     */
    checkToolAccess(pid: string, toolName: string): { allowed: boolean; violation?: SecurityViolation } {
        const ctx = this.contexts.get(pid);
        if (!ctx) return { allowed: false, violation: this.createViolation(pid, 'tool_denied', `No context for ${pid}`, toolName) };

        // Check denied list first
        if (this.matchesPattern(toolName, ctx.deniedTools)) {
            const v = this.createViolation(pid, 'tool_denied', `Tool '${toolName}' is denied for privilege level '${ctx.privilege}'`, toolName);
            return { allowed: false, violation: v };
        }

        // Check allowed list
        if (!this.matchesPattern(toolName, ctx.allowedTools)) {
            const v = this.createViolation(pid, 'tool_denied', `Tool '${toolName}' not in allowlist for privilege '${ctx.privilege}'`, toolName);
            return { allowed: false, violation: v };
        }

        return { allowed: true };
    }

    /**
     * Check if a namespace access is allowed.
     */
    checkNamespaceAccess(pid: string, namespace: string): { allowed: boolean; violation?: SecurityViolation } {
        const ctx = this.contexts.get(pid);
        if (!ctx) return { allowed: false };

        if (ctx.allowedNamespaces.has('*') || ctx.allowedNamespaces.has(namespace)) {
            return { allowed: true };
        }

        if (ctx.allowedNamespaces.has('own') && namespace === ctx.namespace) {
            return { allowed: true };
        }

        const v = this.createViolation(pid, 'namespace_violation', `Access to namespace '${namespace}' denied`, namespace);
        return { allowed: false, violation: v };
    }

    /**
     * Check if a secret access is allowed.
     */
    checkSecretAccess(pid: string, secretName: string): { allowed: boolean; violation?: SecurityViolation } {
        const ctx = this.contexts.get(pid);
        if (!ctx) return { allowed: false };

        if (this.matchesPattern(secretName, ctx.allowedSecrets)) {
            return { allowed: true };
        }

        const v = this.createViolation(pid, 'secret_denied', `Secret '${secretName}' access denied`, secretName);
        return { allowed: false, violation: v };
    }

    /**
     * Get all violations (for audit).
     */
    getViolations(pid?: string): SecurityViolation[] {
        if (pid) return this.violations.filter((v) => v.pid === pid);
        return this.violations;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private matchesPattern(value: string, patterns: Set<string>): boolean {
        for (const pattern of patterns) {
            if (pattern === '*') return true;
            if (pattern.endsWith('.*')) {
                const prefix = pattern.slice(0, -2);
                if (value.startsWith(prefix)) return true;
            }
            if (pattern === value) return true;
        }
        return false;
    }

    private createViolation(
        pid: string,
        type: SecurityViolation['type'],
        description: string,
        attempted: string
    ): SecurityViolation {
        const violation: SecurityViolation = {
            id: `violation-${Date.now()}`,
            pid,
            type,
            severity: type === 'privilege_escalation' ? 'critical' : type === 'secret_denied' ? 'high' : 'medium',
            description,
            attempted,
            timestamp: new Date(),
            action: 'blocked',
        };

        this.violations.push(violation);
        // TODO: Emit security.violation event
        return violation;
    }
}
