/**
 * @agentos/cognition — Hallucination Suppression Pipeline
 *
 * Multi-stage pipeline that detects, prevents, and corrects LLM
 * hallucinations before they reach production outputs.
 *
 * Stages:
 * 1. Source Grounding — verify claims against provided context
 * 2. Self-Consistency — check multiple samples for agreement
 * 3. Citation Verification — validate cited sources exist
 * 4. Confidence Calibration — flag low-confidence claims
 * 5. Fact Extraction — isolate factual claims for verification
 */

import type { CognitiveLLM } from './reasoning.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HallucinationCheckResult {
    isGrounded: boolean;
    overallScore: number; // 0-1 (1 = fully grounded)
    claims: FactualClaim[];
    ungroundedClaims: FactualClaim[];
    suggestedFixes: string[];
    checkedAt: Date;
    durationMs: number;
}

export interface FactualClaim {
    claim: string;
    source?: string;
    verified: boolean;
    confidence: number;
    category: 'statistic' | 'attribution' | 'process' | 'technical' | 'opinion' | 'temporal';
}

export interface HallucinationConfig {
    /** Minimum grounding score to pass (0-1) */
    minGroundingScore: number;
    /** Number of samples for self-consistency check */
    consistencySamples: number;
    /** Whether to auto-fix ungrounded claims */
    autoFix: boolean;
    /** Categories that require strict verification */
    strictCategories: FactualClaim['category'][];
}

export const DEFAULT_HALLUCINATION_CONFIG: HallucinationConfig = {
    minGroundingScore: 0.8,
    consistencySamples: 3,
    autoFix: true,
    strictCategories: ['statistic', 'attribution', 'technical'],
};

// ---------------------------------------------------------------------------
// Hallucination Suppression Pipeline
// ---------------------------------------------------------------------------

export class HallucinationPipeline {
    constructor(
        private config: HallucinationConfig = DEFAULT_HALLUCINATION_CONFIG,
        private llm: CognitiveLLM
    ) { }

    /**
     * Run the full hallucination check pipeline on an LLM output.
     */
    async check(output: string, context: string[]): Promise<HallucinationCheckResult> {
        const startTime = Date.now();

        // Stage 1: Extract factual claims
        const claims = await this.extractClaims(output);

        // Stage 2: Source grounding — verify each claim against context
        const groundedClaims = await this.groundClaims(claims, context);

        // Stage 3: Self-consistency check
        const consistentClaims = await this.checkConsistency(groundedClaims, output, context);

        // Stage 4: Citation verification
        const verifiedClaims = await this.verifyCitations(consistentClaims, context);

        // Stage 5: Calculate scores
        const ungrounded = verifiedClaims.filter((c) => !c.verified);
        const score = verifiedClaims.length > 0
            ? verifiedClaims.filter((c) => c.verified).length / verifiedClaims.length
            : 1.0;

        // Stage 6: Generate fixes if needed
        let fixes: string[] = [];
        if (score < this.config.minGroundingScore && this.config.autoFix) {
            fixes = await this.generateFixes(ungrounded, context);
        }

        return {
            isGrounded: score >= this.config.minGroundingScore,
            overallScore: score,
            claims: verifiedClaims,
            ungroundedClaims: ungrounded,
            suggestedFixes: fixes,
            checkedAt: new Date(),
            durationMs: Date.now() - startTime,
        };
    }

    /**
     * Fix an output by replacing ungrounded claims.
     */
    async fix(output: string, checkResult: HallucinationCheckResult, context: string[]): Promise<string> {
        if (checkResult.isGrounded) return output;

        const ungroundedList = checkResult.ungroundedClaims
            .map((c) => `- "${c.claim}"`)
            .join('\n');

        return this.llm.generate({
            system: `Rewrite the text to remove or correct ungrounded claims. Replace unverifiable facts with information from the provided context. If a claim cannot be verified, either remove it or add a disclaimer.`,
            user: `Original text:\n${output}\n\nUngrounded claims:\n${ungroundedList}\n\nAvailable context:\n${context.join('\n---\n')}`,
            maxTokens: 2000,
        });
    }

    // -------------------------------------------------------------------------
    // Pipeline Stages
    // -------------------------------------------------------------------------

    private async extractClaims(output: string): Promise<FactualClaim[]> {
        const response = await this.llm.generate({
            system: `Extract all factual claims from the text. A factual claim is any statement that can be verified as true or false.

Respond with JSON array: [{ "claim": "...", "category": "statistic|attribution|process|technical|opinion|temporal" }]

Ignore opinions and subjective statements.`,
            user: output,
            maxTokens: 1500,
        });

        try {
            const parsed = JSON.parse(response);
            return parsed.map((c: { claim: string; category: string }) => ({
                ...c,
                verified: false,
                confidence: 0,
            }));
        } catch {
            return [];
        }
    }

    private async groundClaims(
        claims: FactualClaim[],
        context: string[]
    ): Promise<FactualClaim[]> {
        if (claims.length === 0 || context.length === 0) return claims;

        const contextStr = context.join('\n---\n');

        const response = await this.llm.generate({
            system: `For each claim, determine if it is supported by the provided context.

Respond with JSON array: [{ "claim": "...", "verified": bool, "confidence": 0-1, "source": "quote from context or null" }]`,
            user: `Claims:\n${claims.map((c) => `- ${c.claim}`).join('\n')}\n\nContext:\n${contextStr}`,
            maxTokens: 2000,
        });

        try {
            const verified = JSON.parse(response);
            return claims.map((claim, i) => ({
                ...claim,
                verified: verified[i]?.verified ?? false,
                confidence: verified[i]?.confidence ?? 0,
                source: verified[i]?.source,
            }));
        } catch {
            return claims;
        }
    }

    private async checkConsistency(
        claims: FactualClaim[],
        originalOutput: string,
        context: string[]
    ): Promise<FactualClaim[]> {
        // Skip if consistency check not needed
        if (this.config.consistencySamples <= 1) return claims;

        // Generate multiple samples and check agreement
        const samples: string[] = [];
        for (let i = 0; i < this.config.consistencySamples; i++) {
            const sample = await this.llm.generate({
                system: 'Regenerate the same analysis based on the provided context.',
                user: `Context: ${context.join('\n')}\n\nProvide analysis similar to: ${originalOutput.slice(0, 500)}`,
                maxTokens: 1500,
            });
            samples.push(sample);
        }

        // Check each claim against samples
        return claims.map((claim) => {
            const appearances = samples.filter((s) =>
                s.toLowerCase().includes(claim.claim.toLowerCase().slice(0, 50))
            ).length;

            const consistencyScore = appearances / samples.length;

            return {
                ...claim,
                confidence: Math.min(claim.confidence, consistencyScore),
                verified: claim.verified && consistencyScore >= 0.5,
            };
        });
    }

    private async verifyCitations(
        claims: FactualClaim[],
        context: string[]
    ): Promise<FactualClaim[]> {
        return claims.map((claim) => {
            if (!claim.source) return claim;

            // Check if the cited source text exists in the context
            const sourceExists = context.some((ctx) =>
                ctx.toLowerCase().includes(claim.source!.toLowerCase().slice(0, 100))
            );

            return {
                ...claim,
                verified: claim.verified && sourceExists,
                confidence: sourceExists ? claim.confidence : claim.confidence * 0.5,
            };
        });
    }

    private async generateFixes(
        ungrounded: FactualClaim[],
        context: string[]
    ): Promise<string[]> {
        return ungrounded.map((claim) => {
            if (this.config.strictCategories.includes(claim.category)) {
                return `Remove or replace: "${claim.claim}" — this ${claim.category} claim is not supported by available context`;
            }
            return `Flag as uncertain: "${claim.claim}" — could not verify, consider adding disclaimer`;
        });
    }
}
