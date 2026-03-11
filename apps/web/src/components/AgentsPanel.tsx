/**
 * AgentsPanel — Autonomous AI Agents Overview
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

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
    iconBg: 'bg-red-100',
    border: 'border-red-200',
    accent: 'bg-red-50',
    domainColor: 'bg-red-100 text-red-700',
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
    iconBg: 'bg-blue-100',
    border: 'border-blue-200',
    accent: 'bg-blue-50',
    domainColor: 'bg-blue-100 text-blue-700',
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
    iconBg: 'bg-violet-100',
    border: 'border-violet-200',
    accent: 'bg-violet-50',
    domainColor: 'bg-violet-100 text-violet-700',
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
    icon: '📣',
    iconBg: 'bg-orange-100',
    border: 'border-orange-200',
    accent: 'bg-orange-50',
    domainColor: 'bg-orange-100 text-orange-700',
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
    iconBg: 'bg-amber-100',
    border: 'border-amber-200',
    accent: 'bg-amber-50',
    domainColor: 'bg-amber-100 text-amber-700',
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
    iconBg: 'bg-emerald-100',
    border: 'border-emerald-200',
    accent: 'bg-emerald-50',
    domainColor: 'bg-emerald-100 text-emerald-700',
  },
];

export default function AgentsPanel() {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agents</h2>
          <p className="text-sm text-gray-600 font-medium mt-0.5">Autonomous AI agents that execute multi-step tasks</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {AGENTS.filter(a => a.status === 'active').length} active
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {AGENTS.map(agent => (
          <div
            key={agent.id}
            className={`p-5 rounded-xl bg-white border ${agent.border} hover:shadow-md transition-all hover:-translate-y-0.5`}
          >
            {/* Agent header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${agent.iconBg}`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{agent.name}</h3>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${agent.domainColor}`}>
                    {agent.domain}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700">Active</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 font-medium leading-relaxed mb-3">{agent.description}</p>

            {/* Connectors */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {agent.connectors.map(c => (
                <span key={c} className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${agent.accent} ${agent.border} text-gray-700`}>
                  {c}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-600 font-semibold">
                {agent.skills.length} skill{agent.skills.length > 1 ? 's' : ''}
              </span>
              <span className={`text-[11px] font-bold ${agent.successRate >= 0.9 ? 'text-emerald-700' : 'text-amber-700'} ${agent.successRate >= 0.9 ? 'bg-emerald-50' : 'bg-amber-50'} px-2 py-0.5 rounded`}>
                {(agent.successRate * 100).toFixed(0)}% success
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
