'use client';

/**
 * Personalization Dashboard — My EAOS workspace
 *
 * - Recent queries
 * - My workflows
 * - Saved knowledge
 * - Favorite skills
 * - Usage insights
 */

interface RecentQuery {
    query: string;
    domain: string;
    time: string;
    confidence: number;
}

interface SavedItem {
    title: string;
    type: 'knowledge' | 'workflow' | 'skill' | 'output';
    savedAt: string;
}

const RECENT_QUERIES: RecentQuery[] = [
    { query: 'Create campaign for community banks — card modernization', domain: 'Marketing', time: '2m ago', confidence: 0.87 },
    { query: 'Analyze incident INC-342', domain: 'Engineering', time: '5m ago', confidence: 0.74 },
    { query: 'How does card authorization work?', domain: 'Engineering', time: '1h ago', confidence: 0.92 },
    { query: 'Teach me RAG architecture', domain: 'Learning', time: '3h ago', confidence: 0.95 },
    { query: 'Summarize office hours', domain: 'Leadership', time: 'Yesterday', confidence: 0.88 },
];

const SAVED_ITEMS: SavedItem[] = [
    { title: 'Card Auth Architecture Overview', type: 'knowledge', savedAt: '2d ago' },
    { title: 'Campaign Planning Workflow', type: 'workflow', savedAt: '1w ago' },
    { title: 'Incident Analysis', type: 'skill', savedAt: '1w ago' },
    { title: 'Q4 Strategy Brief', type: 'output', savedAt: '2w ago' },
];

const TYPE_ICONS: Record<string, string> = {
    knowledge: '📚',
    workflow: '⚡',
    skill: '🧩',
    output: '📋',
};

const DOMAIN_COLORS: Record<string, string> = {
    Marketing: 'bg-blue-500/10 text-blue-400',
    Engineering: 'bg-purple-500/10 text-purple-400',
    Learning: 'bg-emerald-500/10 text-emerald-400',
    Leadership: 'bg-amber-500/10 text-amber-400',
};

export function PersonalizationDashboard() {
    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div className="glass rounded-xl p-6 bg-gradient-to-r from-accent/5 to-purple-500/5">
                <h2 className="text-lg font-semibold text-white mb-1">Welcome back 👋</h2>
                <p className="text-xs text-neutral-400">
                    You've asked <span className="text-accent font-medium">47 queries</span> today.
                    EAOS saved approximately <span className="text-success font-medium">3.5 hours</span> of manual work.
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                        { label: 'This Week', value: '142', sub: 'queries' },
                        { label: 'Time Saved', value: '18h', sub: 'estimated' },
                        { label: 'Top Domain', value: 'Eng', sub: '58% of queries' },
                        { label: 'Avg Confidence', value: '87%', sub: 'across outputs' },
                    ].map((stat) => (
                        <div key={stat.label} className="px-3 py-2 rounded-lg bg-surface/50 border border-white/[0.04]">
                            <div className="text-[10px] text-neutral-500">{stat.label}</div>
                            <div className="text-sm font-semibold text-white">{stat.value}</div>
                            <div className="text-[10px] text-neutral-600">{stat.sub}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Recent Queries */}
                <div className="glass rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                        Recent Queries
                    </h3>
                    <div className="space-y-2">
                        {RECENT_QUERIES.map((q, idx) => (
                            <button
                                key={idx}
                                className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-surface hover:bg-surface-overlay transition-colors text-left"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white truncate">{q.query}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${DOMAIN_COLORS[q.domain]}`}>
                                            {q.domain}
                                        </span>
                                        <span className="text-[10px] text-neutral-600">{q.time}</span>
                                    </div>
                                </div>
                                <span className={`text-xs font-mono ${q.confidence >= 0.85 ? 'text-success' : 'text-warning'}`}>
                                    {(q.confidence * 100).toFixed(0)}%
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Saved Items */}
                <div className="glass rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                        Saved Items
                    </h3>
                    <div className="space-y-2">
                        {SAVED_ITEMS.map((item, idx) => (
                            <button
                                key={idx}
                                className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-surface hover:bg-surface-overlay transition-colors text-left"
                            >
                                <span className="text-sm">{TYPE_ICONS[item.type]}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-white truncate">{item.title}</div>
                                    <div className="text-[10px] text-neutral-600">{item.savedAt}</div>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-500">
                                    {item.type}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Favorite Skills */}
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-4 mb-2">
                        Favorite Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {['Incident Analysis', 'Campaign Strategy', 'RAG Tutorial', 'PR Review'].map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20 cursor-pointer hover:bg-accent/20 transition-colors"
                            >
                                🧩 {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
