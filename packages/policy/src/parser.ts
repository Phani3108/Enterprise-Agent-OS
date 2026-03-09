/**
 * @agentos/policy — Policy DSL Parser
 *
 * Parses YAML-based policy definitions into Policy objects.
 * This is the bridge between human-authored policy files and the runtime engine.
 */

import type {
    Policy,
    PolicyScope,
    PolicyCondition,
    PolicyAction,
} from './types.js';

/**
 * Raw YAML policy structure (before parsing into typed objects).
 */
interface RawPolicy {
    name: string;
    description?: string;
    enabled?: boolean;
    priority?: number;
    scope: {
        type: string;
        cluster?: string;
        worker?: string;
        tool?: string;
        workflow?: string;
    };
    condition: RawCondition;
    action: {
        type: string;
        reason?: string;
        approvers?: string[];
        timeout_minutes?: number;
        escalation?: string;
        max_per_minute?: number;
        transformer?: string;
    };
    metadata?: {
        author?: string;
        version?: number;
        tags?: string[];
    };
}

type RawCondition =
    | { field: string; equals?: unknown; not_equals?: unknown; in?: unknown[]; not_in?: unknown[]; greater_than?: number; less_than?: number; matches?: string; exists?: boolean }
    | { all: RawCondition[] }
    | { any: RawCondition[] }
    | { not: RawCondition };

/**
 * Parse a raw YAML policy object into a typed Policy.
 *
 * @param raw - Raw policy object (from YAML.parse())
 * @returns Parsed Policy object
 * @throws Error if the policy is invalid
 */
export function parsePolicy(raw: RawPolicy): Policy {
    // Validate required fields
    if (!raw.name) throw new PolicyParseError('Policy must have a name');
    if (!raw.scope) throw new PolicyParseError('Policy must have a scope');
    if (!raw.condition) throw new PolicyParseError('Policy must have a condition');
    if (!raw.action) throw new PolicyParseError('Policy must have an action');

    return {
        id: generatePolicyId(raw.name),
        name: raw.name,
        description: raw.description ?? '',
        scope: parseScope(raw.scope),
        priority: raw.priority ?? 100,
        condition: parseCondition(raw.condition),
        action: parseAction(raw.action),
        enabled: raw.enabled ?? true,
        metadata: {
            author: raw.metadata?.author ?? 'system',
            createdAt: new Date(),
            version: raw.metadata?.version ?? 1,
            tags: raw.metadata?.tags,
        },
    };
}

/**
 * Parse multiple policy definitions from a YAML file content.
 *
 * Expects either a single policy object or an array of policies.
 */
export function parsePolicies(raw: RawPolicy | RawPolicy[]): Policy[] {
    const policies = Array.isArray(raw) ? raw : [raw];
    return policies.map(parsePolicy);
}

// ---------------------------------------------------------------------------
// Internal parsers
// ---------------------------------------------------------------------------

function parseScope(raw: RawPolicy['scope']): PolicyScope {
    const validTypes = ['global', 'cluster', 'worker', 'tool', 'workflow'];
    if (!validTypes.includes(raw.type)) {
        throw new PolicyParseError(
            `Invalid scope type: '${raw.type}'. Must be one of: ${validTypes.join(', ')}`
        );
    }

    return {
        type: raw.type as PolicyScope['type'],
        cluster: raw.cluster,
        worker: raw.worker,
        tool: raw.tool,
        workflow: raw.workflow,
    };
}

function parseCondition(raw: RawCondition): PolicyCondition {
    // Compound: ALL
    if ('all' in raw && Array.isArray((raw as any).all)) {
        return {
            all: (raw as { all: RawCondition[] }).all.map(parseCondition),
        };
    }

    // Compound: ANY
    if ('any' in raw && Array.isArray((raw as any).any)) {
        return {
            any: (raw as { any: RawCondition[] }).any.map(parseCondition),
        };
    }

    // Compound: NOT
    if ('not' in raw && (raw as any).not) {
        return {
            not: parseCondition((raw as { not: RawCondition }).not),
        };
    }

    // Field condition
    if ('field' in raw) {
        const fieldRaw = raw as {
            field: string;
            equals?: unknown;
            not_equals?: unknown;
            in?: unknown[];
            not_in?: unknown[];
            greater_than?: number;
            less_than?: number;
            matches?: string;
            exists?: boolean;
        };

        return {
            field: fieldRaw.field,
            equals: fieldRaw.equals,
            notEquals: fieldRaw.not_equals,
            in: fieldRaw.in,
            notIn: fieldRaw.not_in,
            greaterThan: fieldRaw.greater_than,
            lessThan: fieldRaw.less_than,
            matches: fieldRaw.matches,
            exists: fieldRaw.exists,
        };
    }

    throw new PolicyParseError(
        `Invalid condition: must be a field condition, 'all', 'any', or 'not'`
    );
}

function parseAction(raw: RawPolicy['action']): PolicyAction {
    const validTypes = ['allow', 'deny', 'require_approval', 'rate_limit', 'transform'];
    if (!validTypes.includes(raw.type)) {
        throw new PolicyParseError(
            `Invalid action type: '${raw.type}'. Must be one of: ${validTypes.join(', ')}`
        );
    }

    return {
        type: raw.type as PolicyAction['type'],
        reason: raw.reason,
        approvers: raw.approvers,
        timeoutMinutes: raw.timeout_minutes,
        escalation: raw.escalation,
        maxPerMinute: raw.max_per_minute,
        transformer: raw.transformer,
    };
}

function generatePolicyId(name: string): string {
    return `policy-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class PolicyParseError extends Error {
    constructor(message: string) {
        super(`Policy parse error: ${message}`);
        this.name = 'PolicyParseError';
    }
}
