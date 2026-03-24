/**
 * @agentos/skills — Skill Executor
 *
 * Executes a compiled skill within a worker context:
 * 1. Load compiled skill
 * 2. Retrieve memory context
 * 3. Assemble full prompt (skill + context + input)
 * 4. Route to optimal model
 * 5. Execute LLM
 * 6. Validate output
 * 7. Record usage
 */

import type { SkillDefinition } from './schema.js';
import type { CompiledSkill } from './compiler.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillExecutionRequest {
    skillId: string;
    input: Record<string, unknown>;
    workerId: string;
    executionId: string;
    tenantId: string;
    traceId: string;
    overrideModel?: string;
}

export interface SkillExecutionResult {
    skillId: string;
    version: string;
    output: unknown;
    structuredOutput?: Record<string, unknown>;
    success: boolean;
    error?: string;
    durationMs: number;
    tokensUsed: number;
    toolCalls: number;
    modelUsed: string;
    memoryContextSize: number;
    citations: string[];
}

export interface SkillExecutionContext {
    /** Retrieved memory documents */
    memoryContext: Array<{ content: string; source: string; similarity: number }>;
    /** Knowledge graph context */
    knowledgeContext: Array<{ label: string; type: string; description: string }>;
    /** Conversation / task history */
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ---------------------------------------------------------------------------
// Skill Executor
// ---------------------------------------------------------------------------

export class SkillExecutor {
    constructor(
        private memoryProvider: SkillMemoryProvider,
        private modelProvider: SkillModelProvider,
        private outputValidator: SkillOutputValidator
    ) { }

    /**
     * Execute a skill with full pipeline.
     */
    async execute(
        compiled: CompiledSkill,
        skill: SkillDefinition,
        request: SkillExecutionRequest
    ): Promise<SkillExecutionResult> {
        const startTime = Date.now();
        let tokensUsed = 0;
        let toolCalls = 0;

        try {
            // Step 1: Retrieve memory context
            const context = await this.retrieveContext(skill, request);

            // Step 2: Assemble full prompt
            const fullPrompt = this.assemblePrompt(compiled, context, request.input);

            // Step 3: Route to model
            const model = request.overrideModel ?? await this.modelProvider.selectModel({
                skillDomain: skill.domain,
                complexity: this.estimateComplexity(request.input),
                maxTokens: skill.guardrails.maxTokens,
            });

            // Step 4: Execute LLM
            const llmResult = await this.modelProvider.complete({
                model,
                systemPrompt: fullPrompt,
                userInput: JSON.stringify(request.input),
                maxTokens: skill.guardrails.maxTokens,
                temperature: 0.3,
            });

            tokensUsed = llmResult.tokensUsed;

            // Step 5: Validate output
            let structuredOutput: Record<string, unknown> | undefined;
            if (skill.outputSchema && skill.guardrails.enforceOutputSchema) {
                const validation = await this.outputValidator.validate(
                    llmResult.content,
                    skill.outputSchema
                );

                if (!validation.valid) {
                    return {
                        skillId: skill.id,
                        version: skill.version,
                        output: llmResult.content,
                        success: false,
                        error: `Output validation failed: ${validation.errors.join(', ')}`,
                        durationMs: Date.now() - startTime,
                        tokensUsed,
                        toolCalls,
                        modelUsed: model,
                        memoryContextSize: context.memoryContext.length,
                        citations: [],
                    };
                }

                structuredOutput = validation.parsed;
            }

            // Step 6: Extract citations
            const citations = this.extractCitations(llmResult.content);

            return {
                skillId: skill.id,
                version: skill.version,
                output: llmResult.content,
                structuredOutput,
                success: true,
                durationMs: Date.now() - startTime,
                tokensUsed,
                toolCalls,
                modelUsed: model,
                memoryContextSize: context.memoryContext.length,
                citations,
            };
        } catch (err) {
            return {
                skillId: skill.id,
                version: skill.version,
                output: null,
                success: false,
                error: (err as Error).message,
                durationMs: Date.now() - startTime,
                tokensUsed,
                toolCalls,
                modelUsed: 'unknown',
                memoryContextSize: 0,
                citations: [],
            };
        }
    }

    // -------------------------------------------------------------------------
    // Pipeline Steps
    // -------------------------------------------------------------------------

    private async retrieveContext(
        skill: SkillDefinition,
        request: SkillExecutionRequest
    ): Promise<SkillExecutionContext> {
        // Retrieve from vector memory
        const memoryContext = await this.memoryProvider.searchMemory(
            skill.memorySources,
            JSON.stringify(request.input),
            10
        );

        // Retrieve from knowledge graph
        const knowledgeContext = await this.memoryProvider.queryKnowledge(
            skill.knowledgeSources,
            request.input
        );

        return {
            memoryContext,
            knowledgeContext,
            conversationHistory: [],
        };
    }

    private assemblePrompt(
        compiled: CompiledSkill,
        context: SkillExecutionContext,
        input: Record<string, unknown>
    ): string {
        const sections: string[] = [compiled.compiledPrompt];

        // Inject memory context
        if (context.memoryContext.length > 0) {
            sections.push('\n\n## Retrieved Context\n');
            for (const doc of context.memoryContext) {
                sections.push(`[Source: ${doc.source} | Relevance: ${(doc.similarity * 100).toFixed(0)}%]`);
                sections.push(doc.content);
                sections.push('');
            }
        }

        // Inject knowledge context
        if (context.knowledgeContext.length > 0) {
            sections.push('\n\n## Institutional Knowledge\n');
            for (const node of context.knowledgeContext) {
                sections.push(`**${node.label}** (${node.type}): ${node.description}`);
            }
        }

        return sections.join('\n');
    }

    private estimateComplexity(input: Record<string, unknown>): 'low' | 'medium' | 'high' {
        const inputSize = JSON.stringify(input).length;
        if (inputSize > 5000) return 'high';
        if (inputSize > 1000) return 'medium';
        return 'low';
    }

    private extractCitations(content: string): string[] {
        // Extract [Source: ...] patterns
        const matches = content.match(/\[Source:\s*([^\]]+)\]/g) ?? [];
        return matches.map((m) => m.replace(/\[Source:\s*|\]/g, ''));
    }
}

// ---------------------------------------------------------------------------
// Provider Interfaces (implemented by runtime)
// ---------------------------------------------------------------------------

export interface SkillMemoryProvider {
    searchMemory(
        namespaces: string[],
        query: string,
        topK: number
    ): Promise<Array<{ content: string; source: string; similarity: number }>>;

    queryKnowledge(
        nodeTypes: string[],
        context: Record<string, unknown>
    ): Promise<Array<{ label: string; type: string; description: string }>>;
}

export interface SkillModelProvider {
    selectModel(request: {
        skillDomain: string;
        complexity: 'low' | 'medium' | 'high';
        maxTokens: number;
    }): Promise<string>;

    complete(request: {
        model: string;
        systemPrompt: string;
        userInput: string;
        maxTokens: number;
        temperature: number;
    }): Promise<{ content: string; tokensUsed: number }>;
}

export interface SkillOutputValidator {
    validate(
        output: string,
        schema: Record<string, unknown>
    ): Promise<{ valid: boolean; errors: string[]; parsed?: Record<string, unknown> }>;
}
