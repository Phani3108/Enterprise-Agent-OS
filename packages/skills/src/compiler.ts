/**
 * Skills Compiler — Transforms raw skills into executable runtime skills
 *
 * Raw skill (YAML/JSON) → Validated → Variables resolved → Tools bound →
 * Memory hooks attached → Guardrails applied → Compiled runtime skill
 *
 * This is NOT a prompt formatter. It's a compilation pipeline that produces
 * a complete execution plan from a skill definition.
 */

import type { Skill, SkillVariable, SkillToolBinding, MemoryHook, Guardrail } from './schema.js';
import { validateSkill } from './schema.js';

// ---------------------------------------------------------------------------
// Compiled Skill — Ready for execution
// ---------------------------------------------------------------------------

export interface CompiledSkill {
    skillId: string;
    version: string;
    systemPrompt: string;
    userPrompt: string;
    tools: BoundTool[];
    memoryPlan: MemoryRetrievalPlan;
    guardrails: ActiveGuardrail[];
    modelHints: ModelHints;
    outputExpectations: OutputExpectations;
    compiledAt: Date;
    compilationDurationMs: number;
}

export interface BoundTool {
    id: string;
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    permissions: string[];
    sandboxed: boolean;
}

export interface MemoryRetrievalPlan {
    queries: Array<{
        type: 'vector' | 'keyword' | 'graph' | 'structured';
        namespaces: string[];
        knowledgeTypes: string[];
        maxResults: number;
        minRelevance: number;
    }>;
    totalTokenBudget: number;
    deduplication: boolean;
}

export interface ActiveGuardrail {
    type: string;
    check: (input: unknown, output: unknown) => GuardrailResult;
    action: 'block' | 'warn' | 'log';
}

export interface GuardrailResult {
    passed: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModelHints {
    minCapability: string;
    preferredModels: string[];
    maxTokens: number;
    temperature: number;
    requiresStructuredOutput: boolean;
}

export interface OutputExpectations {
    typeName: string;
    schema: Record<string, unknown>;
    requiresSources: boolean;
    minGroundingScore: number;
    renderingFormat: string;
}

// ---------------------------------------------------------------------------
// Compiler
// ---------------------------------------------------------------------------

export class SkillCompiler {
    private toolRegistry: Map<string, BoundTool> = new Map();

    registerTool(id: string, tool: BoundTool): void {
        this.toolRegistry.set(id, tool);
    }

    compile(skill: Skill, inputs: Record<string, unknown>): CompilationResult {
        const startTime = Date.now();
        const errors: string[] = [];

        // Stage 1: Validate
        const validation = validateSkill(skill);
        if (!validation.valid) {
            return { success: false, errors: validation.errors, warnings: validation.warnings };
        }

        // Stage 2: Resolve variables
        const resolvedVars = this.resolveVariables(skill.definition.variables, inputs);
        if (resolvedVars.errors.length > 0) {
            return { success: false, errors: resolvedVars.errors, warnings: [] };
        }

        // Stage 3: Compile prompts
        const systemPrompt = this.resolveTemplate(skill.definition.systemPrompt, resolvedVars.values);
        const userPrompt = this.resolveTemplate(skill.definition.userPromptTemplate, resolvedVars.values);

        // Stage 4: Bind tools
        const tools = this.bindTools(skill.definition.tools);
        const missingTools = skill.definition.tools
            .filter(t => t.required && !this.toolRegistry.has(t.toolId))
            .map(t => t.toolId);
        if (missingTools.length > 0) {
            errors.push(`Missing required tools: ${missingTools.join(', ')}`);
        }

        // Stage 5: Memory plan
        const memoryPlan = this.buildMemoryPlan(skill.definition.memoryHooks, skill.requirements.model.maxTokens);

        // Stage 6: Guardrails
        const guardrails = this.activateGuardrails(skill.definition.guardrails);

        // Stage 7: Model hints
        const modelHints: ModelHints = {
            minCapability: skill.requirements.model.minCapability,
            preferredModels: skill.requirements.model.preferredModels ?? [],
            maxTokens: skill.requirements.model.maxTokens,
            temperature: skill.requirements.model.temperature ?? 0.3,
            requiresStructuredOutput: skill.requirements.model.requiresStructuredOutput,
        };

        // Stage 8: Output expectations
        const outputExpectations: OutputExpectations = {
            typeName: skill.output.typeName,
            schema: skill.output.schema,
            requiresSources: skill.output.requiresSources,
            minGroundingScore: skill.output.minGroundingScore,
            renderingFormat: skill.output.renderingHints.format,
        };

        if (errors.length > 0) {
            return { success: false, errors, warnings: validation.warnings };
        }

        const compiled: CompiledSkill = {
            skillId: skill.id,
            version: skill.version,
            systemPrompt,
            userPrompt,
            tools,
            memoryPlan,
            guardrails,
            modelHints,
            outputExpectations,
            compiledAt: new Date(),
            compilationDurationMs: Date.now() - startTime,
        };

        return { success: true, compiled, errors: [], warnings: validation.warnings };
    }

    private resolveVariables(
        definitions: SkillVariable[],
        inputs: Record<string, unknown>
    ): { values: Record<string, unknown>; errors: string[] } {
        const values: Record<string, unknown> = {};
        const errors: string[] = [];

        for (const def of definitions) {
            const value = inputs[def.name] ?? def.default;

            if (value === undefined && def.required) {
                errors.push(`Required variable '${def.name}' is missing`);
                continue;
            }

            if (value !== undefined) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== def.type && !(def.type === 'object' && actualType === 'object')) {
                    errors.push(`Variable '${def.name}' expected ${def.type}, got ${actualType}`);
                    continue;
                }

                if (def.validation && typeof value === 'string') {
                    const regex = new RegExp(def.validation);
                    if (!regex.test(value)) {
                        errors.push(`Variable '${def.name}' failed validation: ${def.validation}`);
                        continue;
                    }
                }

                values[def.name] = value;
            }
        }

        return { values, errors };
    }

    private resolveTemplate(template: string, values: Record<string, unknown>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            const val = values[key];
            if (val === undefined) return `{{${key}}}`;
            if (typeof val === 'object') return JSON.stringify(val, null, 2);
            return String(val);
        });
    }

    private bindTools(bindings: SkillToolBinding[]): BoundTool[] {
        const bound: BoundTool[] = [];
        for (const binding of bindings) {
            const tool = this.toolRegistry.get(binding.toolId);
            if (tool) {
                bound.push({
                    ...tool,
                    permissions: binding.permissions,
                    sandboxed: binding.permissions.includes('write'),
                });
            }
        }
        return bound;
    }

    private buildMemoryPlan(hooks: MemoryHook[], maxTokens: number): MemoryRetrievalPlan {
        return {
            queries: hooks.map(hook => ({
                type: hook.type,
                namespaces: hook.namespaces,
                knowledgeTypes: hook.knowledgeTypes,
                maxResults: hook.maxResults,
                minRelevance: hook.minRelevance,
            })),
            totalTokenBudget: Math.floor(maxTokens * 0.4),
            deduplication: true,
        };
    }

    private activateGuardrails(guardrails: Guardrail[]): ActiveGuardrail[] {
        return guardrails.map(g => ({
            type: g.type,
            action: g.action,
            check: this.createGuardrailCheck(g),
        }));
    }

    private createGuardrailCheck(guardrail: Guardrail): (input: unknown, output: unknown) => GuardrailResult {
        switch (guardrail.type) {
            case 'hallucination_threshold':
                return (_input, output) => {
                    const threshold = (guardrail.config.threshold as number) ?? 0.7;
                    const score = (output as Record<string, unknown>)?.groundingScore as number ?? 0;
                    return {
                        passed: score >= threshold,
                        reason: score < threshold ? `Grounding ${score} < threshold ${threshold}` : undefined,
                        severity: score < threshold ? 'high' : undefined,
                    };
                };
            case 'pii_detection':
                return (_input, output) => {
                    const text = JSON.stringify(output);
                    const piiPatterns = [/\b\d{3}-\d{2}-\d{4}\b/, /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/];
                    const found = piiPatterns.some(p => p.test(text));
                    return { passed: !found, reason: found ? 'PII detected in output' : undefined, severity: found ? 'critical' : undefined };
                };
            default:
                return () => ({ passed: true });
        }
    }
}

export interface CompilationResult {
    success: boolean;
    compiled?: CompiledSkill;
    errors: string[];
    warnings: string[];
}
