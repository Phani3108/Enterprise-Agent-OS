/**
 * @agentos/evaluation — Runtime Evaluation Harness
 *
 * Evaluates worker and LLM quality using LLM-as-judge, A/B testing,
 * benchmarks, and feedback loops. Feeds quality scores back into
 * the model router and worker training.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvalMethod = 'llm-judge' | 'benchmark' | 'human-review' | 'automated' | 'ab-test';

export interface EvalSuite {
    id: string;
    name: string;
    description: string;
    method: EvalMethod;
    cases: EvalCase[];
    config: Record<string, unknown>;
}

export interface EvalCase {
    id: string;
    input: unknown;
    expectedOutput?: unknown;
    rubric?: string;
    tags: string[];
    weight: number;
}

export interface EvalResult {
    suiteId: string;
    caseId: string;
    modelId: string;
    workerId?: string;
    score: number;           // 0-100
    pass: boolean;
    dimensions: {
        accuracy: number;
        completeness: number;
        reasoning: number;
        safety: number;
        latency: number;
    };
    feedback: string;
    evaluator: string;       // model used for judging
    evaluatedAt: Date;
    durationMs: number;
    costUsd: number;
}

export interface EvalSummary {
    suiteId: string;
    suiteName: string;
    modelId: string;
    totalCases: number;
    passRate: number;
    avgScore: number;
    dimensions: Record<string, number>;
    runAt: Date;
    totalCostUsd: number;
}

export interface ABTestConfig {
    id: string;
    name: string;
    variants: Array<{
        id: string;
        modelId: string;
        weight: number;           // traffic split 0-1
    }>;
    targetMetric: string;
    minSampleSize: number;
    maxDurationHours: number;
    status: 'draft' | 'running' | 'completed' | 'cancelled';
}

// ---------------------------------------------------------------------------
// Evaluation Engine
// ---------------------------------------------------------------------------

export class EvaluationEngine {
    private suites = new Map<string, EvalSuite>();
    private results: EvalResult[] = [];
    private abTests = new Map<string, ABTestConfig>();

    /**
     * Register an evaluation suite.
     */
    registerSuite(suite: EvalSuite): void {
        this.suites.set(suite.id, suite);
    }

    /**
     * Run an evaluation suite against a model.
     */
    async runSuite(
        suiteId: string,
        modelId: string,
        executor: EvalExecutor
    ): Promise<EvalSummary> {
        const suite = this.suites.get(suiteId);
        if (!suite) throw new Error(`Eval suite not found: ${suiteId}`);

        const results: EvalResult[] = [];

        for (const evalCase of suite.cases) {
            const result = await executor.evaluate(evalCase, modelId, suite.config);
            results.push(result);
            this.results.push(result);
        }

        // Calculate summary
        const passCount = results.filter((r) => r.pass).length;
        const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

        const dimensions: Record<string, number> = {};
        for (const dim of ['accuracy', 'completeness', 'reasoning', 'safety', 'latency'] as const) {
            dimensions[dim] = results.reduce((sum, r) => sum + r.dimensions[dim], 0) / results.length;
        }

        return {
            suiteId,
            suiteName: suite.name,
            modelId,
            totalCases: suite.cases.length,
            passRate: passCount / suite.cases.length,
            avgScore,
            dimensions,
            runAt: new Date(),
            totalCostUsd: results.reduce((sum, r) => sum + r.costUsd, 0),
        };
    }

    /**
     * Compare two models using the same suite.
     */
    async compareModels(
        suiteId: string,
        modelA: string,
        modelB: string,
        executor: EvalExecutor
    ): Promise<{ winner: string; summaryA: EvalSummary; summaryB: EvalSummary }> {
        const summaryA = await this.runSuite(suiteId, modelA, executor);
        const summaryB = await this.runSuite(suiteId, modelB, executor);

        return {
            winner: summaryA.avgScore >= summaryB.avgScore ? modelA : modelB,
            summaryA,
            summaryB,
        };
    }

    // -------------------------------------------------------------------------
    // A/B Testing
    // -------------------------------------------------------------------------

    createABTest(config: ABTestConfig): void {
        this.abTests.set(config.id, config);
    }

    /**
     * Route a request to an A/B test variant.
     */
    getABVariant(testId: string): string | null {
        const test = this.abTests.get(testId);
        if (!test || test.status !== 'running') return null;

        // Weighted random selection
        const rand = Math.random();
        let cumulative = 0;
        for (const variant of test.variants) {
            cumulative += variant.weight;
            if (rand < cumulative) return variant.modelId;
        }

        return test.variants[0].modelId;
    }

    // -------------------------------------------------------------------------
    // Feedback Loop
    // -------------------------------------------------------------------------

    /**
     * Get quality scores for a model (used by the router).
     */
    getModelQuality(modelId: string): number {
        const modelResults = this.results.filter((r) => r.modelId === modelId);
        if (modelResults.length === 0) return 50; // default neutral

        return modelResults.reduce((sum, r) => sum + r.score, 0) / modelResults.length;
    }

    /**
     * Get trending quality over time.
     */
    getQualityTrend(modelId: string, windowHours: number = 24): { score: number; trend: 'up' | 'down' | 'stable' } {
        const cutoff = new Date(Date.now() - windowHours * 3_600_000);
        const recent = this.results.filter(
            (r) => r.modelId === modelId && r.evaluatedAt >= cutoff
        );

        if (recent.length < 2) return { score: this.getModelQuality(modelId), trend: 'stable' };

        const half = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, half);
        const secondHalf = recent.slice(half);

        const firstAvg = firstHalf.reduce((s, r) => s + r.score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((s, r) => s + r.score, 0) / secondHalf.length;

        const delta = secondAvg - firstAvg;
        const trend = delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable';

        return { score: secondAvg, trend };
    }
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface EvalExecutor {
    evaluate(evalCase: EvalCase, modelId: string, config: Record<string, unknown>): Promise<EvalResult>;
}
