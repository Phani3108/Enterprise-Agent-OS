/**
 * Prompt Builder — 4-Layer Prompt Assembly System
 *
 * Composes the final prompt for each agent execution by layering:
 *   Layer 1: Agent Personality  — system prompt, identity, critical rules
 *   Layer 2: Skill Instructions — domain expertise, guardrails, evaluation criteria
 *   Layer 3: Execution Context  — shared state, memory, previous agent outputs
 *   Layer 4: User Overrides     — feedback instructions, retry context, custom directives
 *
 * This replaces the previous ad-hoc prompt construction scattered across
 * persona-api.ts, marketing-api.ts, and gateway-orchestrator.ts with a
 * single, composable, testable prompt assembly pipeline.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/** Agent definition (subset needed for prompt building) */
export interface AgentDef {
    agent_id: string;
    name: string;
    system_prompt: string;
    identity?: {
        personality?: string;
        vibe?: string;
        communication_style?: string;
        memory?: { retains?: string[]; learns_from?: string[] };
    };
    mission?: string[];
    critical_rules?: string[];
    quality_gates?: Array<{ gate: string; criteria: string }>;
    handoff_output_schema?: Array<{ field: string; type: string; description: string }>;
}

/** Skill definition (loaded from skills/*.yaml) */
export interface SkillDef {
    skill_id: string;
    name: string;
    system_prompt?: string;
    guardrails?: string[];
    evaluation_criteria?: string[];
    output_format?: string;
}

/** Full context for prompt assembly */
export interface PromptContext {
    /** The agent being executed */
    agentDefinition: AgentDef;

    /** Optional skill to overlay */
    skillDefinition?: SkillDef;

    /** Shared state from the pipeline (data written by upstream agents) */
    sharedState?: Record<string, unknown>;

    /** Memory context from long-term storage */
    memoryContext?: Record<string, unknown>;

    /** The overall pipeline intent */
    pipelineIntent?: string;

    /** Outputs from direct dependency agents */
    previousOutputs?: Record<string, string>;

    /** Feedback instruction from optimization loops */
    feedbackInstruction?: string;

    /** Retry context — what went wrong and what to fix */
    retryContext?: {
        attempt: number;
        maxAttempts: number;
        previousOutput: string;
        failureReasons: string[];
        retryInstructions: string;
    };

    /** User-provided overrides or additional instructions */
    userOverrides?: string;

    /** Brand guidelines or org-level constraints */
    organizationContext?: {
        brandVoice?: string;
        companyName?: string;
        industry?: string;
        constraints?: string[];
    };
}

export interface AssembledPrompt {
    systemPrompt: string;
    userPrompt: string;
    metadata: {
        layers: string[];
        agentId: string;
        tokenEstimate: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Layer Builders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Layer 1: Agent Personality
 * The agent's core identity, communication style, and fundamental rules.
 */
function buildLayer1_Personality(agent: AgentDef): string {
    const parts: string[] = [];

    // Core system prompt (the agent's DNA)
    if (agent.system_prompt) {
        parts.push(agent.system_prompt);
    }

    // Identity reinforcement
    if (agent.identity) {
        const identity = agent.identity;
        if (identity.personality) {
            parts.push(`\n\nPersonality: ${identity.personality}`);
        }
        if (identity.vibe) {
            parts.push(`Vibe: ${identity.vibe}`);
        }
        if (identity.communication_style) {
            parts.push(`Communication style: ${identity.communication_style}`);
        }
    }

    // Mission
    if (agent.mission?.length) {
        parts.push(`\nMission:\n${agent.mission.map((m, i) => `${i + 1}. ${m}`).join('\n')}`);
    }

    // Critical rules (non-negotiable)
    if (agent.critical_rules?.length) {
        parts.push(`\nCritical Rules (NEVER violate):\n${agent.critical_rules.map(r => `- ${r}`).join('\n')}`);
    }

    return parts.join('\n');
}

/**
 * Layer 2: Skill Instructions
 * Domain-specific expertise, guardrails, and evaluation criteria.
 */
function buildLayer2_Skill(skill?: SkillDef): string {
    if (!skill) return '';

    const parts: string[] = [];

    if (skill.system_prompt) {
        parts.push(`\n--- Skill: ${skill.name} ---`);
        parts.push(skill.system_prompt);
    }

    if (skill.guardrails?.length) {
        parts.push(`\nGuardrails:\n${skill.guardrails.map(g => `- ${g}`).join('\n')}`);
    }

    if (skill.evaluation_criteria?.length) {
        parts.push(`\nYour output will be evaluated on:\n${skill.evaluation_criteria.map(c => `- ${c}`).join('\n')}`);
    }

    if (skill.output_format) {
        parts.push(`\nExpected output format: ${skill.output_format}`);
    }

    return parts.join('\n');
}

/**
 * Layer 3: Execution Context
 * Shared state from the pipeline, memory, and upstream agent outputs.
 */
function buildLayer3_Context(ctx: PromptContext): string {
    const parts: string[] = [];

    // Pipeline intent
    if (ctx.pipelineIntent) {
        parts.push(`## Pipeline Objective\n${ctx.pipelineIntent}`);
    }

    // Shared state from upstream agents
    if (ctx.sharedState && Object.keys(ctx.sharedState).length > 0) {
        parts.push(`\n## Available Data from Pipeline`);
        for (const [key, value] of Object.entries(ctx.sharedState)) {
            const label = key.replace('state.', '').replace(/_/g, ' ');
            const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
            // Truncate large values to prevent context overflow
            const truncated = valueStr.length > 2000 ? valueStr.slice(0, 2000) + '\n[... truncated]' : valueStr;
            parts.push(`\n### ${label}\n${truncated}`);
        }
    }

    // Direct dependency outputs
    if (ctx.previousOutputs && Object.keys(ctx.previousOutputs).length > 0) {
        parts.push(`\n## Previous Agent Outputs`);
        for (const [agentId, output] of Object.entries(ctx.previousOutputs)) {
            const truncated = output.length > 1500 ? output.slice(0, 1500) + '\n[... truncated]' : output;
            parts.push(`\n### From ${agentId}:\n${truncated}`);
        }
    }

    // Memory context
    if (ctx.memoryContext && Object.keys(ctx.memoryContext).length > 0) {
        parts.push(`\n## Historical Memory`);
        for (const [key, value] of Object.entries(ctx.memoryContext)) {
            parts.push(`- ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
        }
    }

    // Organization context
    if (ctx.organizationContext) {
        const org = ctx.organizationContext;
        const orgParts: string[] = [];
        if (org.companyName) orgParts.push(`Company: ${org.companyName}`);
        if (org.industry) orgParts.push(`Industry: ${org.industry}`);
        if (org.brandVoice) orgParts.push(`Brand Voice: ${org.brandVoice}`);
        if (org.constraints?.length) orgParts.push(`Constraints:\n${org.constraints.map(c => `- ${c}`).join('\n')}`);
        if (orgParts.length > 0) {
            parts.push(`\n## Organization Context\n${orgParts.join('\n')}`);
        }
    }

    return parts.join('\n');
}

/**
 * Layer 4: User Overrides
 * Retry instructions, feedback loops, and custom directives.
 */
function buildLayer4_Overrides(ctx: PromptContext): string {
    const parts: string[] = [];

    // Retry context
    if (ctx.retryContext) {
        const retry = ctx.retryContext;
        parts.push(`\n⚠️ RETRY ATTEMPT ${retry.attempt}/${retry.maxAttempts}`);
        parts.push(`Previous output was rejected for these reasons:`);
        parts.push(retry.failureReasons.map(r => `- ${r}`).join('\n'));
        parts.push(`\nRetry instructions: ${retry.retryInstructions}`);
        parts.push(`\nPrevious output (DO NOT repeat these mistakes):\n${retry.previousOutput.slice(0, 1000)}`);
    }

    // Feedback loop instruction
    if (ctx.feedbackInstruction) {
        parts.push(`\n🔄 OPTIMIZATION FEEDBACK`);
        parts.push(ctx.feedbackInstruction);
    }

    // User overrides
    if (ctx.userOverrides) {
        parts.push(`\n📌 ADDITIONAL INSTRUCTIONS FROM USER`);
        parts.push(ctx.userOverrides);
    }

    return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// Output Format Builder
// ═══════════════════════════════════════════════════════════════════════════

function buildOutputInstructions(agent: AgentDef): string {
    if (!agent.handoff_output_schema?.length) return '';

    const fields = agent.handoff_output_schema.map(f =>
        `  "${f.field}": "${f.type} — ${f.description}"`
    ).join(',\n');

    return `\n\n## Required Output Format\nYour response MUST include these sections/fields:\n{\n${fields}\n}\n\nEnsure every field is populated with substantive content. Missing fields will trigger a quality gate failure.`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Assembly Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the complete prompt for an agent execution.
 *
 * System prompt = Layer 1 (personality) + Layer 2 (skill) + output format
 * User prompt   = Layer 3 (context) + Layer 4 (overrides)
 *
 * This separation ensures:
 * - The agent's identity and rules are in the system prompt (strong anchoring)
 * - The execution context and data are in the user prompt (dynamic per-run)
 */
export function buildPrompt(ctx: PromptContext): AssembledPrompt {
    const layers: string[] = [];

    // System prompt layers
    const layer1 = buildLayer1_Personality(ctx.agentDefinition);
    const layer2 = buildLayer2_Skill(ctx.skillDefinition);
    const outputFormat = buildOutputInstructions(ctx.agentDefinition);

    const systemPrompt = [layer1, layer2, outputFormat].filter(Boolean).join('\n');

    if (layer1) layers.push('personality');
    if (layer2) layers.push('skill');
    if (outputFormat) layers.push('output_format');

    // User prompt layers
    const layer3 = buildLayer3_Context(ctx);
    const layer4 = buildLayer4_Overrides(ctx);

    const userPrompt = [layer3, layer4].filter(Boolean).join('\n\n---\n\n');

    if (layer3) layers.push('context');
    if (layer4) layers.push('overrides');

    // Rough token estimate (1 token ≈ 4 chars)
    const tokenEstimate = Math.ceil((systemPrompt.length + userPrompt.length) / 4);

    return {
        systemPrompt,
        userPrompt: userPrompt || 'Execute your task based on the system instructions.',
        metadata: {
            layers,
            agentId: ctx.agentDefinition.agent_id,
            tokenEstimate,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Prompt Introspection (for debugging / observability)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a human-readable summary of what layers were assembled.
 * Useful for debugging and the observability dashboard.
 */
export function describePrompt(assembled: AssembledPrompt): string {
    return [
        `Prompt for ${assembled.metadata.agentId}`,
        `Layers: ${assembled.metadata.layers.join(' → ')}`,
        `System prompt: ${assembled.systemPrompt.length} chars`,
        `User prompt: ${assembled.userPrompt.length} chars`,
        `Est. tokens: ~${assembled.metadata.tokenEstimate}`,
    ].join('\n');
}
