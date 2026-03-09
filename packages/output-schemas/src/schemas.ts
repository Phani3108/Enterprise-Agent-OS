/**
 * @agentos/output-schemas — Structured Output Schemas
 *
 * EAOS outputs are STRUCTURED AND ACTIONABLE, not essays.
 * Every domain has defined output schemas that enforce consistency.
 *
 * Bad: "Here are some ideas for your campaign..."
 * Good: { icp, messaging, channels, contentPlan, budget, kpis }
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export interface EAOSOutput<T = unknown> {
    /** Structured domain output */
    data: T;
    /** Confidence score (0-1) */
    confidence: number;
    /** Whether all claims are grounded in evidence */
    grounded: boolean;
    /** Grounding score (0-1) */
    groundingScore: number;
    /** Evidence sources */
    sources: EvidenceSource[];
    /** Tool calls made */
    toolCalls: ToolCallEvidence[];
    /** Processing metadata */
    meta: OutputMeta;
}

export interface EvidenceSource {
    title: string;
    type: 'confluence' | 'jira' | 'github' | 'grafana' | 'kibana' | 'analytics' | 'document' | 'transcript' | 'blog' | 'microsite';
    url?: string;
    excerpt: string;
    relevance: number;
    retrievedAt: Date;
}

export interface ToolCallEvidence {
    tool: string;
    status: 'success' | 'failed';
    summary: string;
    recordsAffected?: number;
}

export interface OutputMeta {
    durationMs: number;
    tokensUsed: number;
    model: string;
    workerId: string;
    skillId: string;
    traceId: string;
}

// ---------------------------------------------------------------------------
// Engineering Outputs
// ---------------------------------------------------------------------------

export interface IncidentAnalysisOutput {
    title: string;
    rootCause: string;
    blastRadius: {
        services: string[];
        usersAffected: string;
        revenueImpact: string;
    };
    severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
    timeline: Array<{
        time: string;
        event: string;
    }>;
    immediateActions: string[];
    longTermFixes: string[];
    relatedIncidents: Array<{
        key: string;
        summary: string;
        similarity: number;
    }>;
    preventionRecommendations: string[];
}

export interface PRReviewOutput {
    summary: string;
    overallScore: number;
    architecture: {
        score: number;
        findings: string[];
        suggestions: string[];
    };
    security: {
        score: number;
        findings: string[];
        vulnerabilities: Array<{ severity: string; description: string; file: string }>;
    };
    patterns: {
        score: number;
        findings: string[];
        antiPatterns: string[];
    };
    performance: {
        concerns: string[];
    };
    inlineComments: Array<{
        file: string;
        line: number;
        suggestion: string;
        severity: 'info' | 'warning' | 'error';
    }>;
    approvalRecommendation: 'approve' | 'request_changes' | 'comment';
}

export interface RunbookOutput {
    serviceName: string;
    purpose: string;
    architecture: {
        components: string[];
        dependencies: string[];
        dataFlow: string;
    };
    monitoring: {
        dashboards: Array<{ name: string; url: string }>;
        alerts: Array<{ name: string; condition: string; severity: string }>;
        keyMetrics: Array<{ name: string; normalRange: string; unit: string }>;
    };
    procedures: {
        healthCheck: string[];
        restart: string[];
        scaleUp: string[];
        rollback: string[];
        emergencyShutdown: string[];
    };
    troubleshooting: Array<{
        symptom: string;
        possibleCause: string;
        resolution: string;
    }>;
    contacts: Array<{ role: string; team: string; escalation: string }>;
}

// ---------------------------------------------------------------------------
// Marketing Outputs
// ---------------------------------------------------------------------------

export interface CampaignStrategyOutput {
    campaignName: string;
    objective: string;
    icp: {
        segment: string;
        firmographics: Record<string, string>;
        painPoints: string[];
        buyingSignals: string[];
    };
    messaging: {
        headline: string;
        subheadline: string;
        pillars: Array<{ theme: string; message: string; proofPoint: string }>;
        cta: string;
    };
    channels: Array<{
        channel: string;
        budget: string;
        expectedReach: string;
        kpi: string;
    }>;
    contentPlan: Array<{
        asset: string;
        type: string;
        dueDate: string;
        owner: string;
    }>;
    budget: {
        total: string;
        breakdown: Record<string, string>;
    };
    kpis: Array<{
        metric: string;
        target: string;
        measurement: string;
    }>;
    calendar: Array<{
        week: string;
        activities: string[];
    }>;
}

export interface ICPAnalysisOutput {
    segments: Array<{
        name: string;
        size: string;
        firmographics: Record<string, string>;
        painPoints: string[];
        buyingProcess: string;
        decisionMakers: string[];
        churnRisk: string;
    }>;
    recommendations: string[];
    dataGaps: string[];
}

// ---------------------------------------------------------------------------
// Leadership Outputs
// ---------------------------------------------------------------------------

export interface StrategyAnalysisOutput {
    question: string;
    recommendation: string;
    confidence: number;
    swot: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
    scenarios: Array<{
        name: string;
        probability: string;
        outcome: string;
        actions: string[];
    }>;
    financialImplications: {
        investment: string;
        expectedReturn: string;
        timeline: string;
        risks: string[];
    };
    nextSteps: Array<{
        action: string;
        owner: string;
        deadline: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
    }>;
}

export interface MeetingSummaryOutput {
    title: string;
    date: string;
    attendees: string[];
    executiveSummary: string;
    keyDecisions: Array<{
        decision: string;
        rationale: string;
        owner: string;
    }>;
    actionItems: Array<{
        action: string;
        assignee: string;
        dueDate: string;
        status: 'new';
    }>;
    openQuestions: string[];
    followUp: string;
}
