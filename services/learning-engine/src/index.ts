/**
 * @agentos/learning-engine — Worker Learning Feedback Loop Service
 *
 * Continuous improvement pipeline that:
 * 1. Collects production execution results
 * 2. Runs evaluation analysis against ground truth
 * 3. Identifies failure patterns with clustering
 * 4. Generates prompt improvement suggestions
 * 5. Publishes improved skill versions
 * 6. Tracks quality trends over deployments
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface LearningConfig {
    port: number;
    minSamplesForAnalysis: number;
    improvementThreshold: number;
    autoPublishImprovements: boolean;
    evalWindow: number; // hours
}

const defaultConfig: LearningConfig = {
    port: 3007,
    minSamplesForAnalysis: 20,
    improvementThreshold: 0.05, // 5% improvement required
    autoPublishImprovements: false,
    evalWindow: 168, // 7 days
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutionFeedback {
    executionId: string;
    workerId: string;
    skillId: string;
    skillVersion: string;
    input: Record<string, unknown>;
    output: unknown;
    success: boolean;
    confidenceScore: number;
    groundingScore: number;
    userRating?: number;
    evaluationScore?: number;
    failureReason?: string;
    durationMs: number;
    tokensUsed: number;
    timestamp: Date;
}

interface FailureCluster {
    id: string;
    skillId: string;
    pattern: string;
    count: number;
    examples: Array<{ input: string; output: string; error: string }>;
    suggestedFix: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    firstSeen: Date;
    lastSeen: Date;
}

interface SkillImprovement {
    skillId: string;
    currentVersion: string;
    proposedVersion: string;
    currentScore: number;
    projectedScore: number;
    changes: {
        promptDiff: string;
        addedGuardrails: string[];
        removedSections: string[];
        addedExamples: string[];
    };
    evaluationResults?: {
        before: number;
        after: number;
        testCases: number;
    };
    status: 'proposed' | 'evaluating' | 'approved' | 'published' | 'rejected';
    proposedAt: Date;
}

interface QualityTrend {
    skillId: string;
    window: string;
    dataPoints: Array<{
        date: string;
        avgScore: number;
        successRate: number;
        avgConfidence: number;
        sampleSize: number;
    }>;
    trend: 'improving' | 'stable' | 'degrading';
    changeRate: number;
}

// ---------------------------------------------------------------------------
// Learning Service
// ---------------------------------------------------------------------------

class LearningEngineService {
    private config: LearningConfig;
    private feedback: ExecutionFeedback[] = [];
    private clusters: FailureCluster[] = [];
    private improvements: SkillImprovement[] = [];

    constructor(config: Partial<LearningConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async start(): Promise<void> {
        console.log(`📚 Learning Engine starting on port ${this.config.port}...`);

        // TODO: Subscribe to execution events from Event Bus
        // TODO: Initialize evaluation pipeline
        // TODO: Schedule periodic failure analysis
        // TODO: Connect to Skills Registry for version publishing

        console.log('📚 Learning Engine ready');
        console.log(`   Auto-publish:   ${this.config.autoPublishImprovements ? '✅' : '❌'}`);
        console.log(`   Eval window:    ${this.config.evalWindow}h`);
        console.log(`   Min samples:    ${this.config.minSamplesForAnalysis}`);
    }

    /**
     * Record execution feedback.
     */
    recordFeedback(entry: ExecutionFeedback): void {
        this.feedback.push(entry);

        // Triggger analysis when enough samples collected
        const skillFeedback = this.feedback.filter((f) => f.skillId === entry.skillId);
        if (skillFeedback.length % this.config.minSamplesForAnalysis === 0) {
            this.analyzeSkill(entry.skillId).catch(console.error);
        }
    }

    /**
     * Analyze a skill's performance and generate improvements.
     */
    async analyzeSkill(skillId: string): Promise<{
        trend: QualityTrend;
        clusters: FailureCluster[];
        improvement?: SkillImprovement;
    }> {
        const cutoff = new Date(Date.now() - this.config.evalWindow * 3_600_000);
        const recent = this.feedback.filter(
            (f) => f.skillId === skillId && f.timestamp >= cutoff
        );

        // Calculate trend
        const trend = this.calculateTrend(skillId, recent);

        // Cluster failures
        const failures = recent.filter((f) => !f.success);
        const clusters = this.clusterFailures(skillId, failures);
        this.clusters.push(...clusters);

        // Propose improvement if degrading
        let improvement: SkillImprovement | undefined;
        if (trend.trend === 'degrading' || clusters.some((c) => c.severity === 'critical')) {
            improvement = await this.proposeImprovement(skillId, clusters, recent);
            if (improvement) {
                this.improvements.push(improvement);
            }
        }

        return { trend, clusters, improvement };
    }

    /**
     * Get quality trends for a skill.
     */
    getQualityTrend(skillId: string): QualityTrend {
        const cutoff = new Date(Date.now() - this.config.evalWindow * 3_600_000);
        const recent = this.feedback.filter(
            (f) => f.skillId === skillId && f.timestamp >= cutoff
        );
        return this.calculateTrend(skillId, recent);
    }

    // -------------------------------------------------------------------------
    // Analysis
    // -------------------------------------------------------------------------

    private calculateTrend(skillId: string, feedback: ExecutionFeedback[]): QualityTrend {
        // Group by day
        const byDay = new Map<string, ExecutionFeedback[]>();
        for (const f of feedback) {
            const day = f.timestamp.toISOString().slice(0, 10);
            if (!byDay.has(day)) byDay.set(day, []);
            byDay.get(day)!.push(f);
        }

        const dataPoints = Array.from(byDay.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, entries]) => ({
                date,
                avgScore: entries.reduce((s, e) => s + (e.evaluationScore ?? 0), 0) / entries.length,
                successRate: entries.filter((e) => e.success).length / entries.length,
                avgConfidence: entries.reduce((s, e) => s + e.confidenceScore, 0) / entries.length,
                sampleSize: entries.length,
            }));

        // Calculate trend direction
        let trend: QualityTrend['trend'] = 'stable';
        let changeRate = 0;

        if (dataPoints.length >= 3) {
            const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
            const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

            const firstAvg = firstHalf.reduce((s, d) => s + d.successRate, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((s, d) => s + d.successRate, 0) / secondHalf.length;

            changeRate = secondAvg - firstAvg;
            trend = changeRate > 0.05 ? 'improving' : changeRate < -0.05 ? 'degrading' : 'stable';
        }

        return {
            skillId,
            window: `${this.config.evalWindow}h`,
            dataPoints,
            trend,
            changeRate,
        };
    }

    private clusterFailures(skillId: string, failures: ExecutionFeedback[]): FailureCluster[] {
        // Simple clustering by failure reason
        const byReason = new Map<string, ExecutionFeedback[]>();
        for (const f of failures) {
            const reason = f.failureReason ?? 'unknown';
            if (!byReason.has(reason)) byReason.set(reason, []);
            byReason.get(reason)!.push(f);
        }

        return Array.from(byReason.entries()).map(([pattern, entries]) => ({
            id: `cluster-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            skillId,
            pattern,
            count: entries.length,
            examples: entries.slice(0, 3).map((e) => ({
                input: JSON.stringify(e.input).slice(0, 200),
                output: String(e.output).slice(0, 200),
                error: e.failureReason ?? 'unknown',
            })),
            suggestedFix: this.suggestFix(pattern, entries),
            severity: entries.length >= 10 ? 'critical' : entries.length >= 5 ? 'high' : entries.length >= 3 ? 'medium' : 'low',
            firstSeen: entries[0].timestamp,
            lastSeen: entries[entries.length - 1].timestamp,
        }));
    }

    private suggestFix(pattern: string, entries: ExecutionFeedback[]): string {
        if (pattern.includes('schema')) return 'Add output schema examples to the skill prompt';
        if (pattern.includes('timeout')) return 'Reduce complexity or increase token budget';
        if (pattern.includes('hallucination')) return 'Strengthen citation requirements in guardrails';
        if (pattern.includes('tool')) return 'Verify tool availability and add error handling';
        return 'Review skill prompt for ambiguity and add edge case handling';
    }

    private async proposeImprovement(
        skillId: string,
        clusters: FailureCluster[],
        recent: ExecutionFeedback[]
    ): Promise<SkillImprovement | undefined> {
        const successRate = recent.filter((f) => f.success).length / recent.length;

        // TODO: Use LLM to generate prompt improvements based on failure patterns
        // TODO: Run evaluation suite on proposed improvement
        // TODO: Compare scores

        return {
            skillId,
            currentVersion: recent[0]?.skillVersion ?? 'unknown',
            proposedVersion: 'auto-proposed',
            currentScore: successRate * 100,
            projectedScore: (successRate + this.config.improvementThreshold) * 100,
            changes: {
                promptDiff: clusters.map((c) => `Address: ${c.pattern} (${c.count} occurrences)`).join('\n'),
                addedGuardrails: clusters.filter((c) => c.severity === 'critical').map((c) => c.suggestedFix),
                removedSections: [],
                addedExamples: clusters.flatMap((c) => c.examples.map((e) => e.input).slice(0, 1)),
            },
            status: 'proposed',
            proposedAt: new Date(),
        };
    }

    async stop(): Promise<void> {
        console.log('📚 Learning Engine shutting down...');
    }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Learning Engine API Routes:
 *
 * POST   /api/learning/feedback          — Record execution feedback
 * GET    /api/learning/trends/:skillId   — Get quality trends
 * GET    /api/learning/clusters/:skillId — Get failure clusters
 * GET    /api/learning/improvements      — List proposed improvements
 * POST   /api/learning/improvements/:id/approve  — Approve improvement
 * POST   /api/learning/improvements/:id/reject   — Reject improvement
 * POST   /api/learning/analyze/:skillId  — Trigger skill analysis
 *
 * GET    /health
 * GET    /metrics
 */

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const service = new LearningEngineService();
service.start().catch((err) => { console.error('Failed:', err); process.exit(1); });
process.on('SIGTERM', () => service.stop());
process.on('SIGINT', () => service.stop());

export { LearningEngineService };
export type { LearningConfig, ExecutionFeedback, FailureCluster, SkillImprovement, QualityTrend };
