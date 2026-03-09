'use client';

interface TraceSpan {
    name: string;
    kind: string;
    status: 'running' | 'completed' | 'failed';
    durationMs: number;
    depth: number;
    model?: string;
    tokens?: number;
}

const DEMO_TRACE: TraceSpan[] = [
    { name: 'Campaign Planning', kind: 'workflow', status: 'completed', durationMs: 18200, depth: 0 },
    { name: 'ICP Analysis', kind: 'task', status: 'completed', durationMs: 3200, depth: 1 },
    { name: 'Memory Retrieval: CRM data', kind: 'memory_retrieval', status: 'completed', durationMs: 420, depth: 2 },
    { name: 'LLM: Analyze segments', kind: 'llm_call', status: 'completed', durationMs: 2100, depth: 2, model: 'gpt-4o', tokens: 3200 },
    { name: 'Market Research', kind: 'task', status: 'completed', durationMs: 4100, depth: 1 },
    { name: 'Tool: GA4 Query', kind: 'tool_call', status: 'completed', durationMs: 1200, depth: 2 },
    { name: 'LLM: Interpret signals', kind: 'llm_call', status: 'completed', durationMs: 1800, depth: 2, model: 'gpt-4o-mini', tokens: 1500 },
    { name: 'Policy Check', kind: 'policy_check', status: 'completed', durationMs: 45, depth: 2 },
    { name: 'Strategy Generation', kind: 'task', status: 'completed', durationMs: 5400, depth: 1 },
    { name: 'LLM: Generate strategy', kind: 'llm_call', status: 'completed', durationMs: 4200, depth: 2, model: 'gpt-4o', tokens: 6100 },
    { name: 'Hallucination Check', kind: 'reflection', status: 'completed', durationMs: 1800, depth: 2 },
    { name: 'Content Calendar', kind: 'task', status: 'completed', durationMs: 3100, depth: 1 },
    { name: 'Email Sequence', kind: 'task', status: 'completed', durationMs: 2400, depth: 1 },
];

const KIND_COLORS: Record<string, string> = {
    workflow: 'bg-white/10 text-white',
    task: 'bg-accent/10 text-accent',
    llm_call: 'bg-purple-500/10 text-purple-400',
    tool_call: 'bg-amber-500/10 text-amber-400',
    memory_retrieval: 'bg-blue-500/10 text-blue-400',
    policy_check: 'bg-emerald-500/10 text-emerald-400',
    reflection: 'bg-cyan-500/10 text-cyan-400',
};

export function ObservabilityPanel() {
    const totalMs = DEMO_TRACE[0].durationMs;
    const totalTokens = DEMO_TRACE.filter((s) => s.tokens).reduce((sum, s) => sum + (s.tokens ?? 0), 0);
    const llmCalls = DEMO_TRACE.filter((s) => s.kind === 'llm_call').length;

    return (
        <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">🔍 Execution Trace</h3>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                    { label: 'Duration', value: `${(totalMs / 1000).toFixed(1)}s` },
                    { label: 'LLM Calls', value: String(llmCalls) },
                    { label: 'Tokens', value: totalTokens.toLocaleString() },
                    { label: 'Est. Cost', value: `$${(totalTokens * 0.000005).toFixed(3)}` },
                ].map((stat) => (
                    <div key={stat.label} className="px-3 py-2 rounded-lg bg-surface border border-white/[0.04]">
                        <div className="text-[10px] text-neutral-500">{stat.label}</div>
                        <div className="text-sm font-mono text-white">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Waterfall */}
            <div className="space-y-1">
                {DEMO_TRACE.map((span, idx) => (
                    <div key={idx} className="flex items-center gap-2" style={{ paddingLeft: span.depth * 20 }}>
                        {/* Kind badge */}
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase whitespace-nowrap ${KIND_COLORS[span.kind] ?? 'bg-white/5 text-neutral-400'}`}>
                            {span.kind.replace('_', ' ')}
                        </span>

                        {/* Name */}
                        <span className="text-[11px] text-neutral-300 flex-1 truncate">{span.name}</span>

                        {/* Model + tokens */}
                        {span.model && (
                            <span className="text-[9px] text-neutral-500 font-mono">{span.model}</span>
                        )}
                        {span.tokens && (
                            <span className="text-[9px] text-neutral-600 font-mono w-14 text-right">{span.tokens}tok</span>
                        )}

                        {/* Duration bar */}
                        <div className="w-24 h-3 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                                className={`h-full rounded-full ${span.kind === 'llm_call' ? 'bg-purple-500/40' :
                                        span.kind === 'tool_call' ? 'bg-amber-500/40' :
                                            span.kind === 'memory_retrieval' ? 'bg-blue-500/40' :
                                                'bg-accent/30'
                                    }`}
                                style={{ width: `${Math.min(100, (span.durationMs / totalMs) * 100 * 3)}%` }}
                            />
                        </div>

                        {/* Duration */}
                        <span className="text-[10px] text-neutral-500 font-mono w-10 text-right">
                            {span.durationMs >= 1000 ? `${(span.durationMs / 1000).toFixed(1)}s` : `${span.durationMs}ms`}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
