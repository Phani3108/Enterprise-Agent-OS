'use client';

/**
 * Agents Panel — Overview of available autonomous agents
 */

const AGENTS = [
    {
        id: 'incident-intelligence',
        name: 'Incident Intelligence',
        domain: 'Engineering',
        status: 'active' as const,
        description: 'Analyzes production incidents by correlating metrics, logs, recent deployments, and historical incidents to identify root causes.',
        skills: ['engineering.incident.root_cause'],
        connectors: ['Grafana', 'Kibana', 'Jira', 'PagerDuty'],
        successRate: 0.87,
        icon: '🚨',
        color: 'from-red-500/10 to-orange-500/10 border-red-500/20',
    },
    {
        id: 'developer-knowledge',
        name: 'Developer Knowledge',
        domain: 'Engineering',
        status: 'active' as const,
        description: 'Searches across Confluence, GitHub, Jira, transcripts, and internal blogs to answer architecture and system questions.',
        skills: ['engineering.knowledge.search'],
        connectors: ['Confluence', 'GitHub', 'Jira'],
        successRate: 0.91,
        icon: '📖',
        color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
    },
    {
        id: 'pr-reviewer',
        name: 'PR Reviewer',
        domain: 'Engineering',
        status: 'active' as const,
        description: 'Reviews pull requests for architecture patterns, security issues, performance implications, and coding standards.',
        skills: ['engineering.pr.architecture_review'],
        connectors: ['GitHub'],
        successRate: 0.93,
        icon: '🔍',
        color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    },
    {
        id: 'campaign-strategist',
        name: 'Campaign Strategist',
        domain: 'Marketing',
        status: 'active' as const,
        description: 'Generates full marketing campaigns including ICP analysis, messaging, channel strategy, content calendar, and email sequences.',
        skills: ['marketing.campaign.strategy', 'marketing.icp.analysis'],
        connectors: ['GA4', 'CRM', 'HubSpot'],
        successRate: 0.89,
        icon: '📊',
        color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
    },
    {
        id: 'transcript-actions',
        name: 'Transcript to Actions',
        domain: 'Leadership',
        status: 'active' as const,
        description: 'Converts meeting transcripts into structured summaries with decisions, action items, owners, due dates, and draft Jira tickets.',
        skills: ['collaboration.transcript_to_actions'],
        connectors: ['Zoom', 'Jira', 'Slack'],
        successRate: 0.85,
        icon: '📋',
        color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20',
    },
    {
        id: 'learning-tutor',
        name: 'Learning Tutor',
        domain: 'Learning',
        status: 'active' as const,
        description: 'Generates structured tutorials with explanations, architecture diagrams, code examples, exercises, and internal references.',
        skills: ['learning.tutorial.rag', 'learning.prompt.engineering'],
        connectors: ['Internal Docs', 'Code Repos'],
        successRate: 0.94,
        icon: '🎓',
        color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    },
];

export default function AgentsPanel() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-white">🤖 Agents</h2>
                    <p className="text-sm text-neutral-400 mt-1">Autonomous AI agents that execute multi-step tasks</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {AGENTS.filter(a => a.status === 'active').length} active
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {AGENTS.map(agent => (
                    <div
                        key={agent.id}
                        className={`p-5 rounded-xl bg-gradient-to-br ${agent.color} border border-white/[0.06] hover:border-white/[0.12] transition-all hover:scale-[1.01]`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{agent.icon}</span>
                                <div>
                                    <h3 className="text-sm font-medium text-white">{agent.name}</h3>
                                    <span className="text-[10px] text-neutral-500">{agent.domain}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-[10px] text-neutral-500">Active</span>
                            </div>
                        </div>

                        <p className="text-xs text-neutral-400 leading-relaxed mb-3">{agent.description}</p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {agent.connectors.map(c => (
                                <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-400 font-mono">
                                    {c}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-neutral-500">
                            <span>{agent.skills.length} skill{agent.skills.length > 1 ? 's' : ''}</span>
                            <span className={agent.successRate >= 0.9 ? 'text-emerald-400' : 'text-yellow-400'}>
                                {(agent.successRate * 100).toFixed(0)}% success
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
