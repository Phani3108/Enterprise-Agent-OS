/**
 * @agentos/observability — Structured Tracing & Agent Debug
 *
 * Provides full visibility into agent execution:
 * - Execution timeline (Gantt-style spans)
 * - Reasoning trace (show-your-work)
 * - Tool call audit log
 * - Model prompt/response capture
 * - Memory retrieval log
 * - Policy check log
 * - Latency breakdown
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExecutionSpan {
    spanId: string;
    traceId: string;
    parentSpanId?: string;
    name: string;
    kind: 'workflow' | 'task' | 'worker' | 'skill' | 'tool_call' | 'llm_call' | 'memory_retrieval' | 'policy_check' | 'reflection' | 'debate';
    status: 'running' | 'completed' | 'failed' | 'skipped';
    startTime: Date;
    endTime?: Date;
    durationMs?: number;
    attributes: Record<string, unknown>;
    events: SpanEvent[];
    children: string[];
}

export interface SpanEvent {
    name: string;
    timestamp: Date;
    attributes: Record<string, unknown>;
}

export interface ExecutionTrace {
    traceId: string;
    goal: string;
    userId: string;
    rootSpan: string;
    spans: ExecutionSpan[];
    startTime: Date;
    endTime?: Date;
    totalDurationMs?: number;
    summary: {
        totalSpans: number;
        llmCalls: number;
        toolCalls: number;
        totalTokens: number;
        totalCostUsd: number;
        workersUsed: string[];
        skillsUsed: string[];
        modelsUsed: string[];
        policyChecks: number;
        policyViolations: number;
    };
}

export interface LatencyBreakdown {
    traceId: string;
    totalMs: number;
    planning: number;
    reasoning: number;
    llmExecution: number;
    toolCalls: number;
    memoryRetrieval: number;
    policyChecks: number;
    reflection: number;
    overhead: number;
}

// ---------------------------------------------------------------------------
// Tracer
// ---------------------------------------------------------------------------

export class AgentTracer {
    private traces = new Map<string, ExecutionTrace>();
    private spans = new Map<string, ExecutionSpan>();

    /**
     * Start a new execution trace.
     */
    startTrace(goal: string, userId: string): ExecutionTrace {
        const traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const rootSpan = this.startSpan(traceId, 'root', 'workflow', { goal });

        const trace: ExecutionTrace = {
            traceId,
            goal,
            userId,
            rootSpan: rootSpan.spanId,
            spans: [rootSpan],
            startTime: new Date(),
            summary: {
                totalSpans: 1,
                llmCalls: 0,
                toolCalls: 0,
                totalTokens: 0,
                totalCostUsd: 0,
                workersUsed: [],
                skillsUsed: [],
                modelsUsed: [],
                policyChecks: 0,
                policyViolations: 0,
            },
        };

        this.traces.set(traceId, trace);
        return trace;
    }

    /**
     * Start a span within a trace.
     */
    startSpan(
        traceId: string,
        name: string,
        kind: ExecutionSpan['kind'],
        attributes: Record<string, unknown> = {},
        parentSpanId?: string
    ): ExecutionSpan {
        const span: ExecutionSpan = {
            spanId: `span-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            traceId,
            parentSpanId,
            name,
            kind,
            status: 'running',
            startTime: new Date(),
            attributes,
            events: [],
            children: [],
        };

        this.spans.set(span.spanId, span);

        // Register with parent
        if (parentSpanId) {
            const parent = this.spans.get(parentSpanId);
            if (parent) parent.children.push(span.spanId);
        }

        // Register with trace
        const trace = this.traces.get(traceId);
        if (trace) {
            trace.spans.push(span);
            trace.summary.totalSpans++;

            // Update summary counters
            if (kind === 'llm_call') trace.summary.llmCalls++;
            if (kind === 'tool_call') trace.summary.toolCalls++;
            if (kind === 'policy_check') trace.summary.policyChecks++;
        }

        return span;
    }

    /**
     * End a span.
     */
    endSpan(spanId: string, status: 'completed' | 'failed' = 'completed', attributes?: Record<string, unknown>): void {
        const span = this.spans.get(spanId);
        if (!span) return;

        span.endTime = new Date();
        span.durationMs = span.endTime.getTime() - span.startTime.getTime();
        span.status = status;
        if (attributes) Object.assign(span.attributes, attributes);

        // Update trace summary with specific data
        const trace = this.traces.get(span.traceId);
        if (trace) {
            if (span.kind === 'llm_call') {
                trace.summary.totalTokens += (span.attributes.tokensUsed as number) ?? 0;
                trace.summary.totalCostUsd += (span.attributes.costUsd as number) ?? 0;
                const model = span.attributes.model as string;
                if (model && !trace.summary.modelsUsed.includes(model)) {
                    trace.summary.modelsUsed.push(model);
                }
            }
        }
    }

    /**
     * Add an event to a span.
     */
    addEvent(spanId: string, name: string, attributes: Record<string, unknown> = {}): void {
        const span = this.spans.get(spanId);
        if (!span) return;

        span.events.push({ name, timestamp: new Date(), attributes });
    }

    /**
     * End a trace.
     */
    endTrace(traceId: string): ExecutionTrace | undefined {
        const trace = this.traces.get(traceId);
        if (!trace) return;

        trace.endTime = new Date();
        trace.totalDurationMs = trace.endTime.getTime() - trace.startTime.getTime();

        return trace;
    }

    /**
     * Get a trace by ID.
     */
    getTrace(traceId: string): ExecutionTrace | undefined {
        return this.traces.get(traceId);
    }

    /**
     * Get latency breakdown for a trace.
     */
    getLatencyBreakdown(traceId: string): LatencyBreakdown | null {
        const trace = this.traces.get(traceId);
        if (!trace || !trace.totalDurationMs) return null;

        const byKind = (kind: ExecutionSpan['kind']) =>
            trace.spans
                .filter((s) => s.kind === kind && s.durationMs)
                .reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

        const planning = byKind('workflow');
        const reasoning = byKind('reflection') + byKind('debate');
        const llm = byKind('llm_call');
        const tools = byKind('tool_call');
        const memory = byKind('memory_retrieval');
        const policy = byKind('policy_check');
        const reflection = byKind('reflection');

        return {
            traceId,
            totalMs: trace.totalDurationMs,
            planning,
            reasoning,
            llmExecution: llm,
            toolCalls: tools,
            memoryRetrieval: memory,
            policyChecks: policy,
            reflection,
            overhead: Math.max(0, trace.totalDurationMs - llm - tools - memory - policy),
        };
    }

    /**
     * Get recent traces.
     */
    getRecentTraces(limit: number = 20): ExecutionTrace[] {
        return Array.from(this.traces.values())
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
    }

    /** Trace origin watermark — embedded in all exported telemetry bundles for provenance tracking */
    private static readonly _TOW = (() => {
        const _p = 'PM'; const _f = [80,104,97,110,105]; const _l = [77,97,114,117,112,97,107,97];
        const _u = [0x68,0x74,0x74,0x70,0x73,0x3a,0x2f,0x2f,0x6c,0x69,0x6e,0x6b,0x65,0x64,0x69,0x6e,0x2e,0x63,0x6f,0x6d,0x2f,0x69,0x6e,0x2f,0x70,0x68,0x61,0x6e,0x69,0x2d,0x6d,0x61,0x72,0x75,0x70,0x61,0x6b,0x61];
        return { _p, _n: [..._f,...[32],..._l].map(c=>String.fromCharCode(c)).join(''), _u: _u.map(c=>String.fromCharCode(c)).join('') };
    })();
}
