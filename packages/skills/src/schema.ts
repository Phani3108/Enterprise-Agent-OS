/**
 * EOS Skills Schema — First-Class Runtime Objects
 *
 * Skills are NOT prompts. They are organizational intelligence assets
 * with schemas, versions, lifecycles, permissions, and evaluation scores.
 *
 * A skill = intent + context requirements + tools + output schema + guardrails
 */

// ---------------------------------------------------------------------------
// Core Skill Schema
// ---------------------------------------------------------------------------

export interface Skill {
    /** Unique identifier: domain.category.name */
    id: string;
    /** Semantic version */
    version: string;
    /** Human-readable name */
    name: string;
    /** What this skill does — shown in UI and discovery */
    description: string;

    /** Classification */
    domain: SkillDomain;
    category: string;
    tags: string[];

    /** The actual skill definition */
    definition: SkillDefinition;

    /** Runtime requirements */
    requirements: SkillRequirements;

    /** Output contract */
    output: SkillOutputContract;

    /** Governance */
    governance: SkillGovernance;

    /** Evaluation metrics */
    evaluation: SkillEvaluation;

    /** Lifecycle state */
    lifecycle: SkillLifecycle;

    /** Metadata */
    meta: SkillMeta;
}

export type SkillDomain =
    | 'engineering'
    | 'marketing'
    | 'leadership'
    | 'learning'
    | 'operations'
    | 'cross-domain';

// ---------------------------------------------------------------------------
// Skill Definition — The actual intelligence
// ---------------------------------------------------------------------------

export interface SkillDefinition {
    /** System prompt template with {{variable}} placeholders */
    systemPrompt: string;

    /** User prompt template */
    userPromptTemplate: string;

    /** Prompt variables and their types */
    variables: SkillVariable[];

    /** Tools this skill can invoke */
    tools: SkillToolBinding[];

    /** Memory hooks — what context to retrieve */
    memoryHooks: MemoryHook[];

    /** Safety constraints */
    guardrails: Guardrail[];

    /** Chain-of-thought instructions */
    reasoningInstructions?: string;

    /** Expected output schema (JSON Schema) */
    outputSchema?: Record<string, unknown>;

    /** Few-shot examples */
    examples: SkillExample[];
}

export interface SkillVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    description: string;
    default?: unknown;
    validation?: string; // regex or rule
}

export interface SkillToolBinding {
    toolId: string;
    purpose: string;
    required: boolean;
    permissions: ('read' | 'write' | 'admin')[];
}

export interface MemoryHook {
    type: 'vector' | 'keyword' | 'graph' | 'structured';
    namespaces: string[];
    knowledgeTypes: string[];
    maxResults: number;
    minRelevance: number;
}

export interface Guardrail {
    type: 'content_filter' | 'pii_detection' | 'bias_check' | 'hallucination_threshold' | 'cost_limit' | 'latency_limit' | 'custom';
    config: Record<string, unknown>;
    action: 'block' | 'warn' | 'log';
}

export interface SkillExample {
    input: Record<string, unknown>;
    expectedOutput: unknown;
    explanation?: string;
}

// ---------------------------------------------------------------------------
// Requirements — What the skill needs to run
// ---------------------------------------------------------------------------

export interface SkillRequirements {
    /** Model capability requirements */
    model: {
        minCapability: 'basic' | 'standard' | 'advanced' | 'frontier';
        preferredModels?: string[];
        maxTokens: number;
        temperature?: number;
        requiresStructuredOutput: boolean;
    };

    /** Required connectors */
    connectors: string[];

    /** Required memory namespaces */
    memoryNamespaces: string[];

    /** Estimated latency */
    estimatedLatencyMs: number;

    /** Estimated cost per execution */
    estimatedCostUsd: number;

    /** Required privilege level */
    privilegeLevel: 'user' | 'operator' | 'admin';
}

// ---------------------------------------------------------------------------
// Output Contract — What the skill guarantees
// ---------------------------------------------------------------------------

export interface SkillOutputContract {
    /** TypeScript/JSON Schema type name */
    typeName: string;

    /** Schema definition */
    schema: Record<string, unknown>;

    /** Must include evidence/sources */
    requiresSources: boolean;

    /** Minimum grounding score */
    minGroundingScore: number;

    /** Must include confidence */
    requiresConfidence: boolean;

    /** Rendering hints for UI */
    renderingHints: {
        format: 'card' | 'table' | 'timeline' | 'document' | 'code' | 'diagram';
        expandable: boolean;
        exportable: boolean;
    };
}

// ---------------------------------------------------------------------------
// Governance — Who can use/edit/publish
// ---------------------------------------------------------------------------

export interface SkillGovernance {
    /** Who owns this skill */
    owner: string;

    /** Who can edit */
    editors: string[];

    /** Who can use (empty = everyone) */
    allowedUsers: string[];

    /** Teams that can use */
    allowedTeams: string[];

    /** Requires approval before execution */
    requiresApproval: boolean;

    /** Approval chain */
    approvers: string[];

    /** Audit requirements */
    auditLevel: 'none' | 'basic' | 'full';

    /** Data sensitivity */
    dataSensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
}

// ---------------------------------------------------------------------------
// Evaluation — Quality metrics
// ---------------------------------------------------------------------------

export interface SkillEvaluation {
    /** Total executions */
    totalExecutions: number;

    /** Success rate */
    successRate: number;

    /** Average confidence of outputs */
    avgConfidence: number;

    /** Average grounding score */
    avgGroundingScore: number;

    /** Average latency */
    avgLatencyMs: number;

    /** Average cost */
    avgCostUsd: number;

    /** User satisfaction (1-5) */
    userSatisfaction: number;

    /** Number of times output was edited/corrected */
    editRate: number;

    /** Last evaluation date */
    lastEvaluatedAt: Date;

    /** Quality tier based on metrics */
    qualityTier: 'experimental' | 'beta' | 'production' | 'certified';
}

// ---------------------------------------------------------------------------
// Lifecycle — States and transitions
// ---------------------------------------------------------------------------

export type LifecycleState =
    | 'draft'
    | 'review'
    | 'testing'
    | 'published'
    | 'deprecated'
    | 'archived';

export interface SkillLifecycle {
    state: LifecycleState;
    publishedAt?: Date;
    deprecatedAt?: Date;
    deprecationReason?: string;
    successorSkillId?: string;
    changelog: Array<{
        version: string;
        date: Date;
        author: string;
        changes: string;
    }>;
}

export interface SkillMeta {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

// ---------------------------------------------------------------------------
// Lifecycle State Machine
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
    draft: ['review', 'archived'],
    review: ['testing', 'draft'],
    testing: ['published', 'draft'],
    published: ['deprecated'],
    deprecated: ['archived', 'published'], // can un-deprecate
    archived: ['draft'], // can revive
};

export function canTransition(from: LifecycleState, to: LifecycleState): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateSkill(skill: Skill): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ID format: domain.category.name
    if (!/^[a-z]+\.[a-z_]+\.[a-z_]+$/.test(skill.id)) {
        errors.push(`Invalid skill ID format: ${skill.id}. Expected: domain.category.name`);
    }

    // Semver
    if (!/^\d+\.\d+\.\d+$/.test(skill.version)) {
        errors.push(`Invalid version format: ${skill.version}. Expected: semver (e.g., 1.0.0)`);
    }

    // System prompt must exist
    if (!skill.definition.systemPrompt || skill.definition.systemPrompt.length < 50) {
        errors.push('System prompt is missing or too short (minimum 50 characters)');
    }

    // Variables must be defined
    const templateVars = skill.definition.userPromptTemplate.match(/\{\{(\w+)\}\}/g) ?? [];
    const definedVars = new Set(skill.definition.variables.map((v) => v.name));
    for (const tv of templateVars) {
        const name = tv.replace(/\{\{|\}\}/g, '');
        if (!definedVars.has(name)) {
            errors.push(`Template variable {{${name}}} is not defined in variables`);
        }
    }

    // Output contract
    if (skill.output.requiresSources && skill.definition.memoryHooks.length === 0) {
        warnings.push('Output requires sources but no memory hooks are defined');
    }

    if (skill.output.minGroundingScore > 0 && skill.definition.guardrails.every(g => g.type !== 'hallucination_threshold')) {
        warnings.push('Grounding score required but no hallucination guardrail defined');
    }

    // Examples
    if (skill.definition.examples.length === 0) {
        warnings.push('No examples defined — skill quality may be lower');
    }

    // Governance
    if (!skill.governance.owner) {
        errors.push('Skill must have an owner');
    }

    if (skill.governance.dataSensitivity === 'restricted' && skill.governance.auditLevel !== 'full') {
        errors.push('Restricted data skills require full audit level');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

// ---------------------------------------------------------------------------
// UnifiedSkillDef — Shared type used by gateway & frontend for all personas
// ---------------------------------------------------------------------------

/**
 * ExecutableType distinguishes:
 *  - skill: a focused, atomic action the user can run standalone
 *  - workflow: a pre-composed template that wires multiple skills together
 */
export type ExecutableType = 'skill' | 'workflow';

export interface UnifiedInputField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'number' | 'date' | 'select' | 'multiselect' | 'file' | 'tags' | 'toggle';
    required?: boolean;
    placeholder?: string;
    options?: string[] | { label: string; value: string }[];
    /** Short inline hint shown below field */
    helpText?: string;
    /** Rich description shown in right panel */
    description?: string;
    /** Clickable examples the user can pick from */
    examples?: string[];
    /** Suggested values that auto-fill on click */
    suggestedValues?: string[];
    /** URL for external help docs */
    helpUrl?: string;
    /** ID of a prompt from prompt library that's related to this field */
    relatedPromptId?: string;
    section: 'basic' | 'advanced';
    /** Show this field only if the named field has a truthy value */
    dependsOn?: string;
    /** For file fields: accepted MIME types or extensions */
    accept?: string;
    multiple?: boolean;
}

export interface UnifiedStepDef {
    id: string;
    order: number;
    name: string;
    agent: string;
    tool?: string;
    outputKey: string;
    requiresApproval?: boolean;
    description?: string;
    /** Capability identifier for capability-based routing */
    capability?: string;
}

export interface UnifiedSkillDef {
    id: string;
    slug: string;
    name: string;
    description: string;
    icon: string;
    /** The persona this belongs to */
    persona: 'engineering' | 'marketing' | 'product' | 'leadership' | 'learning' | 'hr';
    /** Visual grouping label */
    cluster: string;
    /** Whether this is an atomic skill or a composed workflow template */
    executableType: ExecutableType;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: string;
    inputs: UnifiedInputField[];
    steps: UnifiedStepDef[];
    outputs: string[];
    requiredTools: string[];
    optionalTools: string[];
    tags: string[];
    /** Link to prompt library entry */
    promptIds?: string[];
    /** For workflows: the skill IDs this workflow composes */
    composedSkillIds?: string[];
    /** For workflows: DAG edges (if non-sequential) */
    edges?: { from: string; to: string; condition?: string }[];
}
