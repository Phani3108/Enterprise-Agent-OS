'use client';

const QUICK_ACTIONS = [
    { icon: '🚨', label: 'Analyze Incident', action: 'incident_analysis', domain: 'Engineering', color: 'from-red-500/10 to-orange-500/10 border-red-500/20' },
    { icon: '📣', label: 'Plan Campaign', action: 'campaign_planning', domain: 'Marketing', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
    { icon: '🔍', label: 'Review PR', action: 'pr_review', domain: 'Engineering', color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20' },
    { icon: '🎓', label: 'Learn Topic', action: 'tutorial', domain: 'Learning', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
    { icon: '📋', label: 'Meeting Summary', action: 'summarize', domain: 'Leadership', color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20' },
    { icon: '📚', label: 'Search Knowledge', action: 'knowledge_search', domain: 'Engineering', color: 'from-indigo-500/10 to-violet-500/10 border-indigo-500/20' },
];

export function QuickActions() {
    return (
        <div data-tour="quick-actions">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Quick Actions
            </h2>
            <div className="grid grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((action) => (
                    <button
                        key={action.action}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br ${action.color} border border-slate-200 hover:border-slate-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        <span className="text-xl">{action.icon}</span>
                        <div className="text-left">
                            <div className="text-sm font-medium text-slate-900">{action.label}</div>
                            <div className="text-[11px] text-slate-400">{action.domain}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
