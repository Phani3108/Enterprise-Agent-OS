/**
 * @agentos/workspace-api — Agent Workspace API
 *
 * The "product layer" — what users actually see and interact with.
 * Provides real-time visibility into agent reasoning, workflow progress,
 * tool calls, outputs, and sources.
 *
 * This is the layer that makes EAOS feel alive to users.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkspaceSession {
    id: string;
    userId: string;
    goal: string;
    status: 'planning' | 'executing' | 'reflecting' | 'complete' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    progress: WorkspaceProgress;
    reasoning: ReasoningTrace[];
    output?: unknown;
    sources: Source[];
}

interface WorkspaceProgress {
    totalSteps: number;
    completedSteps: number;
    currentStep: string;
    percentage: number;
    timeline: ProgressEvent[];
}

interface ProgressEvent {
    step: string;
    status: 'pending' | 'active' | 'complete' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    durationMs?: number;
    worker?: string;
    skill?: string;
}

interface ReasoningTrace {
    phase: string;
    thought: string;
    action?: string;
    observation?: string;
    confidence: number;
    timestamp: Date;
}

interface Source {
    title: string;
    type: 'confluence' | 'jira' | 'github' | 'document' | 'conversation' | 'analytics';
    url?: string;
    excerpt: string;
    relevance: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface WorkspaceConfig {
    port: number;
    enableWebSocket: boolean;
    maxSessionHistory: number;
    streamProgress: boolean;
}

const defaultConfig: WorkspaceConfig = {
    port: 3008,
    enableWebSocket: true,
    maxSessionHistory: 100,
    streamProgress: true,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WorkspaceApiService {
    private config: WorkspaceConfig;
    private sessions = new Map<string, WorkspaceSession>();

    constructor(config: Partial<WorkspaceConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async start(): Promise<void> {
        console.log(`💻 Workspace API starting on port ${this.config.port}...`);
        console.log('💻 Workspace API ready');
        console.log(`   WebSocket:    ${this.config.enableWebSocket ? '✅ ws://localhost:' + this.config.port : '❌'}`);
        console.log(`   Streaming:    ${this.config.streamProgress ? '✅' : '❌'}`);
    }

    /**
     * Create a new workspace session for a user goal.
     */
    createSession(userId: string, goal: string): WorkspaceSession {
        const session: WorkspaceSession = {
            id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId,
            goal,
            status: 'planning',
            startedAt: new Date(),
            progress: {
                totalSteps: 0,
                completedSteps: 0,
                currentStep: 'Analyzing request...',
                percentage: 0,
                timeline: [],
            },
            reasoning: [],
            sources: [],
        };

        this.sessions.set(session.id, session);
        return session;
    }

    /**
     * Update session progress (called by Cognitive Engine via events).
     */
    updateProgress(sessionId: string, update: Partial<WorkspaceProgress>): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        Object.assign(session.progress, update);

        // Calculate percentage
        if (session.progress.totalSteps > 0) {
            session.progress.percentage = Math.round(
                (session.progress.completedSteps / session.progress.totalSteps) * 100
            );
        }

        // TODO: Push update via WebSocket to client
    }

    /**
     * Append a reasoning step (shown to user as "agent thinking").
     */
    appendReasoning(sessionId: string, step: ReasoningTrace): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.reasoning.push(step);

        // TODO: Stream reasoning step via WebSocket
    }

    /**
     * Add a source to the session (shown as "evidence").
     */
    addSource(sessionId: string, source: Source): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.sources.push(source);
    }

    /**
     * Complete a session with final output.
     */
    completeSession(sessionId: string, output: unknown): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.status = 'complete';
        session.completedAt = new Date();
        session.output = output;
        session.progress.percentage = 100;
        session.progress.currentStep = 'Complete';

        // TODO: Push completion via WebSocket
    }

    /**
     * Get session by ID.
     */
    getSession(sessionId: string): WorkspaceSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get all sessions for a user.
     */
    getUserSessions(userId: string): WorkspaceSession[] {
        return Array.from(this.sessions.values())
            .filter((s) => s.userId === userId)
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
            .slice(0, this.config.maxSessionHistory);
    }

    async stop(): Promise<void> {
        console.log('💻 Workspace API shutting down...');
    }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Workspace API Routes:
 *
 * POST   /api/workspace/sessions             — Create session (start goal)
 * GET    /api/workspace/sessions/:id          — Get session detail
 * GET    /api/workspace/sessions/:id/progress — Get progress timeline
 * GET    /api/workspace/sessions/:id/reasoning— Get reasoning trace
 * GET    /api/workspace/sessions/:id/sources  — Get evidence sources
 * GET    /api/workspace/sessions/:id/output   — Get final output
 *
 * GET    /api/workspace/mine                  — Get my sessions
 *
 * WS     /ws/workspace/:sessionId             — Live progress stream
 *
 * --- Capability Discovery ---
 *
 * GET    /api/capabilities                    — List all capabilities by domain
 * GET    /api/capabilities/:domain            — List capabilities for a domain
 *
 * GET    /health
 */

// ---------------------------------------------------------------------------
// Capability Discovery
// ---------------------------------------------------------------------------

interface Capability {
    id: string;
    name: string;
    description: string;
    domain: string;
    skillIds: string[];
    exampleQueries: string[];
    estimatedLatency: string;
}

const BUILTIN_CAPABILITIES: Capability[] = [
    // Engineering
    {
        id: 'cap.eng.incident',
        name: 'Incident Analysis',
        description: 'Analyze production incidents — root cause, blast radius, remediation',
        domain: 'Engineering',
        skillIds: ['engineering.incident_root_cause'],
        exampleQueries: ['Analyze the 503 spike on the payments API', 'What caused last night\'s outage?'],
        estimatedLatency: '<30s',
    },
    {
        id: 'cap.eng.pr_review',
        name: 'Architecture Review',
        description: 'Review PRs for architecture, security, scalability, and patterns',
        domain: 'Engineering',
        skillIds: ['engineering.pr_architecture_review'],
        exampleQueries: ['Review PR #456 for security issues', 'Check if this PR follows our patterns'],
        estimatedLatency: '<20s',
    },
    {
        id: 'cap.eng.runbook',
        name: 'Runbook Generation',
        description: 'Generate operational runbooks from architecture and incident history',
        domain: 'Engineering',
        skillIds: ['engineering.runbook_generation'],
        exampleQueries: ['Generate a runbook for the payment service', 'Create an on-call guide for the auth system'],
        estimatedLatency: '<30s',
    },
    // Marketing
    {
        id: 'cap.mkt.campaign',
        name: 'Campaign Planning',
        description: 'Generate comprehensive campaign strategies with channels, messaging, and KPIs',
        domain: 'Marketing',
        skillIds: ['marketing.campaign_strategy'],
        exampleQueries: ['Create a campaign targeting credit unions for digital cards', 'Plan a Q3 awareness push for fraud prevention'],
        estimatedLatency: '<25s',
    },
    {
        id: 'cap.mkt.icp',
        name: 'ICP Analysis',
        description: 'Define and refine Ideal Customer Profiles with firmographic and behavioral data',
        domain: 'Marketing',
        skillIds: ['marketing.icp_analysis'],
        exampleQueries: ['Who is our ideal customer for the card platform?', 'Analyze our best customers and find patterns'],
        estimatedLatency: '<20s',
    },
    {
        id: 'cap.mkt.seo',
        name: 'SEO Optimization',
        description: 'Optimize content for search — keywords, meta, headers, content gaps',
        domain: 'Marketing',
        skillIds: ['marketing.seo_content_optimization'],
        exampleQueries: ['Optimize this blog post for SEO', 'What content gaps do we have vs competitors?'],
        estimatedLatency: '<15s',
    },
    // Leadership
    {
        id: 'cap.lead.strategy',
        name: 'Strategic Decision Analysis',
        description: 'SWOT, Porter\'s Five Forces, scenario planning for executive decisions',
        domain: 'Leadership',
        skillIds: ['leadership.strategy_analysis'],
        exampleQueries: ['Should we enter the neobank market?', 'Analyze the build vs buy decision for fraud detection'],
        estimatedLatency: '<25s',
    },
    {
        id: 'cap.lead.brief',
        name: 'Executive Briefing',
        description: 'Convert complex analysis into concise executive decision briefs',
        domain: 'Leadership',
        skillIds: ['leadership.decision_summary'],
        exampleQueries: ['Summarize the Q3 strategy for the board', 'Create a decision brief for the AI investment'],
        estimatedLatency: '<15s',
    },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const service = new WorkspaceApiService();
service.start().catch((err) => { console.error('Failed:', err); process.exit(1); });
process.on('SIGTERM', () => service.stop());
process.on('SIGINT', () => service.stop());

export { WorkspaceApiService, BUILTIN_CAPABILITIES };
export type { WorkspaceSession, WorkspaceProgress, ProgressEvent, ReasoningTrace, Source, Capability };
