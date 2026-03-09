/**
 * @agentos/sandbox — Tool Sandboxing with Risk Tiers
 *
 * Enforces safety boundaries around tool invocations based on risk classification.
 * Tools are assigned to risk tiers, and each tier has different execution constraints.
 */

// ---------------------------------------------------------------------------
// Risk Tiers
// ---------------------------------------------------------------------------

/**
 * Risk tiers from lowest to highest.
 */
export type RiskTier = 'read-only' | 'low' | 'medium' | 'high' | 'critical';

export interface RiskTierConfig {
    tier: RiskTier;
    requiresApproval: boolean;
    requiresAuditLog: boolean;
    maxCallsPerMinute: number;
    maxCallsPerTask: number;
    timeoutMs: number;
    allowedInSimulation: boolean;
    rollbackSupported: boolean;
}

export const RISK_TIER_DEFAULTS: Record<RiskTier, RiskTierConfig> = {
    'read-only': {
        tier: 'read-only',
        requiresApproval: false,
        requiresAuditLog: false,
        maxCallsPerMinute: 100,
        maxCallsPerTask: 50,
        timeoutMs: 10_000,
        allowedInSimulation: true,
        rollbackSupported: false,
    },
    low: {
        tier: 'low',
        requiresApproval: false,
        requiresAuditLog: true,
        maxCallsPerMinute: 60,
        maxCallsPerTask: 30,
        timeoutMs: 30_000,
        allowedInSimulation: true,
        rollbackSupported: false,
    },
    medium: {
        tier: 'medium',
        requiresApproval: false,
        requiresAuditLog: true,
        maxCallsPerMinute: 30,
        maxCallsPerTask: 15,
        timeoutMs: 60_000,
        allowedInSimulation: true,
        rollbackSupported: true,
    },
    high: {
        tier: 'high',
        requiresApproval: true,
        requiresAuditLog: true,
        maxCallsPerMinute: 10,
        maxCallsPerTask: 5,
        timeoutMs: 120_000,
        allowedInSimulation: false,
        rollbackSupported: true,
    },
    critical: {
        tier: 'critical',
        requiresApproval: true,
        requiresAuditLog: true,
        maxCallsPerMinute: 3,
        maxCallsPerTask: 2,
        timeoutMs: 300_000,
        allowedInSimulation: false,
        rollbackSupported: true,
    },
};

// ---------------------------------------------------------------------------
// Tool Classification
// ---------------------------------------------------------------------------

export interface ToolClassification {
    toolName: string;
    tier: RiskTier;
    reason: string;
    overrideAllowed: boolean;
}

/**
 * Default tool risk classifications.
 */
export const DEFAULT_TOOL_CLASSIFICATIONS: ToolClassification[] = [
    // Read-only
    { toolName: 'file.read', tier: 'read-only', reason: 'Read file contents', overrideAllowed: false },
    { toolName: 'github.pull_request.read', tier: 'read-only', reason: 'Read PR data', overrideAllowed: false },
    { toolName: 'analytics.query', tier: 'read-only', reason: 'Query analytics', overrideAllowed: false },
    { toolName: 'jira.query', tier: 'read-only', reason: 'JQL search', overrideAllowed: false },

    // Low risk
    { toolName: 'file.write', tier: 'low', reason: 'Write to filesystem', overrideAllowed: true },
    { toolName: 'git.commit', tier: 'low', reason: 'Create git commit', overrideAllowed: true },
    { toolName: 'github.pull_request.comment', tier: 'low', reason: 'Comment on PR', overrideAllowed: true },
    { toolName: 'slack.post', tier: 'low', reason: 'Post Slack message', overrideAllowed: true },

    // Medium risk
    { toolName: 'shell.exec', tier: 'medium', reason: 'Execute shell command', overrideAllowed: true },
    { toolName: 'jira.issue.create', tier: 'medium', reason: 'Create Jira issue', overrideAllowed: true },
    { toolName: 'email.send', tier: 'medium', reason: 'Send email externally', overrideAllowed: true },
    { toolName: 'github.pull_request.review', tier: 'medium', reason: 'Submit PR review', overrideAllowed: true },

    // High risk
    { toolName: 'docker.build', tier: 'high', reason: 'Build container image', overrideAllowed: false },
    { toolName: 'k8s.apply', tier: 'high', reason: 'Apply K8s manifest', overrideAllowed: false },
    { toolName: 'database.write', tier: 'high', reason: 'Write to database', overrideAllowed: false },

    // Critical
    { toolName: 'k8s.delete', tier: 'critical', reason: 'Delete K8s resources', overrideAllowed: false },
    { toolName: 'database.migrate', tier: 'critical', reason: 'Run DB migration', overrideAllowed: false },
    { toolName: 'secrets.rotate', tier: 'critical', reason: 'Rotate secrets', overrideAllowed: false },
];

// ---------------------------------------------------------------------------
// Sandbox
// ---------------------------------------------------------------------------

export interface SandboxCheckResult {
    allowed: boolean;
    tier: RiskTier;
    tierConfig: RiskTierConfig;
    violations: string[];
    requiresApproval: boolean;
}

export class ToolSandbox {
    private classifications = new Map<string, ToolClassification>();
    private callCounts = new Map<string, { perMinute: number; perTask: Map<string, number>; windowStart: Date }>();
    private simulationMode = false;

    constructor(classifications?: ToolClassification[]) {
        for (const c of classifications ?? DEFAULT_TOOL_CLASSIFICATIONS) {
            this.classifications.set(c.toolName, c);
        }
    }

    /**
     * Enable simulation mode — blocks high/critical tools.
     */
    enableSimulation(): void {
        this.simulationMode = true;
    }

    disableSimulation(): void {
        this.simulationMode = false;
    }

    /**
     * Check if a tool invocation is allowed.
     */
    check(toolName: string, taskId: string): SandboxCheckResult {
        const classification = this.classifications.get(toolName);
        const tier: RiskTier = classification?.tier ?? 'medium'; // default unclassified to medium
        const tierConfig = RISK_TIER_DEFAULTS[tier];
        const violations: string[] = [];

        // Simulation mode check
        if (this.simulationMode && !tierConfig.allowedInSimulation) {
            violations.push(`Tool '${toolName}' (${tier}) is blocked in simulation mode`);
        }

        // Rate limit check
        const counts = this.getCallCounts(toolName);
        if (counts.perMinute >= tierConfig.maxCallsPerMinute) {
            violations.push(`Rate limit exceeded: ${counts.perMinute}/${tierConfig.maxCallsPerMinute} per minute`);
        }

        const taskCalls = counts.perTask.get(taskId) ?? 0;
        if (taskCalls >= tierConfig.maxCallsPerTask) {
            violations.push(`Per-task limit exceeded: ${taskCalls}/${tierConfig.maxCallsPerTask}`);
        }

        return {
            allowed: violations.length === 0,
            tier,
            tierConfig,
            violations,
            requiresApproval: tierConfig.requiresApproval,
        };
    }

    /**
     * Record a tool invocation (call after check passes).
     */
    recordCall(toolName: string, taskId: string): void {
        const counts = this.getCallCounts(toolName);

        // Reset window if expired
        if (Date.now() - counts.windowStart.getTime() > 60_000) {
            counts.perMinute = 0;
            counts.windowStart = new Date();
        }

        counts.perMinute++;
        counts.perTask.set(taskId, (counts.perTask.get(taskId) ?? 0) + 1);
        this.callCounts.set(toolName, counts);
    }

    /**
     * Classify a new tool.
     */
    classify(toolName: string, tier: RiskTier, reason: string): void {
        this.classifications.set(toolName, {
            toolName,
            tier,
            reason,
            overrideAllowed: tier !== 'critical',
        });
    }

    /**
     * Get classification for a tool.
     */
    getClassification(toolName: string): ToolClassification | undefined {
        return this.classifications.get(toolName);
    }

    private getCallCounts(toolName: string) {
        if (!this.callCounts.has(toolName)) {
            this.callCounts.set(toolName, { perMinute: 0, perTask: new Map(), windowStart: new Date() });
        }
        return this.callCounts.get(toolName)!;
    }
}
