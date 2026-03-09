/**
 * @agentos/cognition — Multi-Agent Debate System
 *
 * Implements structured debate between multiple LLM "personas" to
 * improve reasoning quality. Used for complex decisions, risk assessment,
 * and reducing single-model bias.
 */

import type { CognitiveLLM } from './reasoning.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DebateConfig {
    /** Number of debate rounds */
    rounds: number;
    /** Minimum number of debaters */
    minDebaters: number;
    /** Maximum number of debaters */
    maxDebaters: number;
    /** Whether debaters can change their position */
    allowPositionChange: boolean;
    /** Confidence threshold to end debate early */
    consensusThreshold: number;
}

export const DEFAULT_DEBATE_CONFIG: DebateConfig = {
    rounds: 3,
    minDebaters: 2,
    maxDebaters: 5,
    allowPositionChange: true,
    consensusThreshold: 0.9,
};

export interface Debater {
    id: string;
    persona: string;
    perspective: string;
    model?: string; // optional different model for diversity
}

export interface DebateArgument {
    debaterId: string;
    round: number;
    position: string;
    reasoning: string;
    confidence: number;
    agreesWithPrevious: boolean;
    counterpoints: string[];
}

export interface DebateResult {
    question: string;
    consensus: string | null;
    consensusConfidence: number;
    winner?: string;
    arguments: DebateArgument[];
    rounds: number;
    reachedConsensus: boolean;
    dissenting: string[];
}

// ---------------------------------------------------------------------------
// Debate Engine
// ---------------------------------------------------------------------------

export class DebateEngine {
    constructor(
        private config: DebateConfig = DEFAULT_DEBATE_CONFIG,
        private llm: CognitiveLLM
    ) { }

    /**
     * Run a structured debate on a question.
     */
    async debate(question: string, debaters: Debater[], context?: string): Promise<DebateResult> {
        const allArguments: DebateArgument[] = [];

        for (let round = 1; round <= this.config.rounds; round++) {
            const roundArguments: DebateArgument[] = [];

            for (const debater of debaters) {
                const previousArgs = allArguments.filter((a) => a.debaterId !== debater.id);
                const ownPrevious = allArguments.filter((a) => a.debaterId === debater.id);

                const argument = await this.generateArgument(
                    question,
                    debater,
                    round,
                    previousArgs,
                    ownPrevious,
                    context
                );

                roundArguments.push(argument);
            }

            allArguments.push(...roundArguments);

            // Check for early consensus
            const consensus = this.checkConsensus(roundArguments);
            if (consensus.reached) {
                return {
                    question,
                    consensus: consensus.position!,
                    consensusConfidence: consensus.confidence,
                    arguments: allArguments,
                    rounds: round,
                    reachedConsensus: true,
                    dissenting: [],
                };
            }
        }

        // No consensus — synthesize final answer
        const synthesis = await this.synthesize(question, allArguments, debaters);

        return {
            question,
            consensus: synthesis.answer,
            consensusConfidence: synthesis.confidence,
            winner: synthesis.strongestDebater,
            arguments: allArguments,
            rounds: this.config.rounds,
            reachedConsensus: false,
            dissenting: synthesis.dissenting,
        };
    }

    // -------------------------------------------------------------------------
    // Argument Generation
    // -------------------------------------------------------------------------

    private async generateArgument(
        question: string,
        debater: Debater,
        round: number,
        previousArgs: DebateArgument[],
        ownPrevious: DebateArgument[],
        context?: string
    ): Promise<DebateArgument> {
        const previousSummary = previousArgs
            .map((a) => `[${a.debaterId}] (confidence: ${a.confidence}): ${a.reasoning}`)
            .join('\n');

        const ownSummary = ownPrevious
            .map((a) => `Round ${a.round}: ${a.reasoning}`)
            .join('\n');

        const response = await this.llm.generate({
            system: `You are ${debater.persona}. Your perspective: ${debater.perspective}.

You are participating in round ${round} of a structured debate. ${this.config.allowPositionChange
                    ? 'You may update your position based on compelling arguments.'
                    : 'Maintain and defend your position.'
                }

Respond with JSON:
{
  "position": "your current position statement",
  "reasoning": "detailed reasoning",
  "confidence": 0-1,
  "agreesWithPrevious": bool,
  "counterpoints": ["responses to opposing arguments"]
}`,
            user: `Question: ${question}
${context ? `\nContext: ${context}` : ''}
${previousSummary ? `\nOther debaters' arguments:\n${previousSummary}` : ''}
${ownSummary ? `\nYour previous arguments:\n${ownSummary}` : ''}`,
            maxTokens: 800,
        });

        try {
            const parsed = JSON.parse(response);
            return { debaterId: debater.id, round, ...parsed };
        } catch {
            return {
                debaterId: debater.id,
                round,
                position: response,
                reasoning: response,
                confidence: 0.5,
                agreesWithPrevious: false,
                counterpoints: [],
            };
        }
    }

    // -------------------------------------------------------------------------
    // Consensus Check
    // -------------------------------------------------------------------------

    private checkConsensus(roundArgs: DebateArgument[]): {
        reached: boolean;
        position?: string;
        confidence: number;
    } {
        if (roundArgs.length < 2) return { reached: false, confidence: 0 };

        const agreeing = roundArgs.filter((a) => a.agreesWithPrevious);
        const avgConfidence = roundArgs.reduce((s, a) => s + a.confidence, 0) / roundArgs.length;

        const consensusRatio = agreeing.length / roundArgs.length;

        if (consensusRatio >= this.config.consensusThreshold && avgConfidence >= 0.7) {
            return {
                reached: true,
                position: roundArgs[0].position,
                confidence: avgConfidence,
            };
        }

        return { reached: false, confidence: avgConfidence };
    }

    // -------------------------------------------------------------------------
    // Synthesis
    // -------------------------------------------------------------------------

    private async synthesize(
        question: string,
        allArgs: DebateArgument[],
        debaters: Debater[]
    ): Promise<{
        answer: string;
        confidence: number;
        strongestDebater?: string;
        dissenting: string[];
    }> {
        const summary = allArgs
            .map((a) => `[${a.debaterId}, R${a.round}] (${a.confidence}): ${a.reasoning}`)
            .join('\n');

        const response = await this.llm.generate({
            system: `You are a neutral judge synthesizing a debate. Evaluate all arguments, identify the strongest reasoning, and produce a final answer.

Respond with JSON: { "answer": "...", "confidence": 0-1, "strongestDebater": "id", "dissenting": ["ids of debaters who disagree"] }`,
            user: `Question: ${question}\n\nDebate transcript:\n${summary}`,
            maxTokens: 1000,
        });

        try {
            return JSON.parse(response);
        } catch {
            return { answer: response, confidence: 0.5, dissenting: [] };
        }
    }
}
