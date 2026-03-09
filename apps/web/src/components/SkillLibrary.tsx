'use client';

interface Skill {
    id: string;
    name: string;
    domain: 'Engineering' | 'Marketing' | 'Leadership' | 'Learning';
    description: string;
    usageCount: number;
    successRate: number;
    avgLatency: string;
}

const DOMAIN_COLORS: Record<string, string> = {
    Engineering: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20',
    Marketing: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    Leadership: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    Learning: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
};

const SKILLS: Skill[] = [
    { id: 'marketing.campaign_strategy', name: 'Campaign Strategy', domain: 'Marketing', description: 'Generate full campaign with ICP, messaging, channels, calendar, KPIs', usageCount: 142, successRate: 0.91, avgLatency: '18s' },
    { id: 'engineering.incident_root_cause', name: 'Incident Analysis', domain: 'Engineering', description: 'Root cause analysis from logs, metrics, and past incidents', usageCount: 89, successRate: 0.87, avgLatency: '12s' },
    { id: 'engineering.pr_architecture_review', name: 'PR Architecture Review', domain: 'Engineering', description: 'Review PRs for architecture, security, and patterns', usageCount: 234, successRate: 0.93, avgLatency: '8s' },
    { id: 'marketing.icp_analysis', name: 'ICP Analysis', domain: 'Marketing', description: 'Define ideal customer profiles with firmographic and behavioral data', usageCount: 67, successRate: 0.89, avgLatency: '14s' },
    { id: 'leadership.strategy_analysis', name: 'Strategy Analysis', domain: 'Leadership', description: 'SWOT, Porter\'s Five Forces, scenario planning for executive decisions', usageCount: 31, successRate: 0.85, avgLatency: '20s' },
    { id: 'learning.rag_tutorial', name: 'RAG Tutorial', domain: 'Learning', description: 'Build RAG pipelines using internal stack with runnable examples', usageCount: 56, successRate: 0.94, avgLatency: '15s' },
    { id: 'engineering.runbook_generation', name: 'Runbook Generation', domain: 'Engineering', description: 'Generate operational runbooks from architecture and incident history', usageCount: 45, successRate: 0.88, avgLatency: '22s' },
    { id: 'learning.prompt_engineering', name: 'Prompt Engineering', domain: 'Learning', description: 'Comprehensive prompt engineering guide with internal library examples', usageCount: 78, successRate: 0.96, avgLatency: '10s' },
];

export function SkillLibrary() {
    return (
        <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">🧩 Skill Library</h3>

            <div className="grid grid-cols-2 gap-3">
                {SKILLS.map((skill) => (
                    <div
                        key={skill.id}
                        className={`p-4 rounded-xl bg-gradient-to-br ${DOMAIN_COLORS[skill.domain]} border cursor-pointer hover:scale-[1.02] transition-transform`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400">
                                {skill.domain}
                            </span>
                            <span className={`text-xs font-mono ${skill.successRate >= 0.9 ? 'text-success' : 'text-warning'}`}>
                                {(skill.successRate * 100).toFixed(0)}%
                            </span>
                        </div>
                        <h4 className="text-sm font-medium text-white mb-1">{skill.name}</h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 mb-3">{skill.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500">
                            <span>{skill.usageCount} uses</span>
                            <span>~{skill.avgLatency}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
