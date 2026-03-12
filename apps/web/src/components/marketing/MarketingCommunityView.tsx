/**
 * Marketing Community — Playbooks, Workflows, Skills, Tool Integrations, Studio Tips
 * AgentOS remains the orchestration platform; external tools perform execution.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

const COMMUNITY_SECTIONS = [
  {
    id: 'playbooks',
    label: 'Playbooks',
    icon: '📘',
    description: 'Reusable campaign playbooks and templates',
    items: [
      'Webinar Launch Playbook',
      'Product Launch Playbook',
      'ABM Campaign Playbook',
      'Paid Media Playbook',
      'Content Syndication Playbook',
    ],
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: '⚡',
    description: 'Pre-built marketing workflows',
    items: [
      '30 marketing workflows by cluster',
      'Campaign, Content, Creative, Event, Research, Analytics, Sales',
      'Customize steps, agents, tools',
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: '🔧',
    description: 'Agent skills for marketing tasks',
    items: [
      'Campaign Strategy',
      'ICP Analysis',
      'Copywriting',
      'Creative Design',
      'Ad Setup',
      'Analytics',
    ],
  },
  {
    id: 'tool-integrations',
    label: 'Tool Integrations',
    icon: '🔌',
    description: 'Connect external tools for execution',
    items: [
      'HubSpot',
      'Salesforce',
      'LinkedIn Ads',
      'Canva',
      'WordPress',
      'Blogin',
      'Google Drive',
    ],
  },
  {
    id: 'studio-tips',
    label: 'Studio Tips',
    icon: '💡',
    description: 'Best practices and tips',
    items: [
      'Use simulation mode when tools are not connected',
      'Pre-check tool connections before running workflows',
      'Campaign Graph tracks dependencies and execution',
      'Tasks support SLA, owner, and delay tracking',
    ],
  },
];

export function MarketingCommunityView() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Marketing Community</h2>
      <p className="text-sm text-slate-600">
        Playbooks, workflows, skills, tool integrations, and studio tips. AgentOS orchestrates; external tools execute.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMUNITY_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{section.icon}</span>
              <h3 className="text-sm font-bold text-slate-900">{section.label}</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">{section.description}</p>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item} className="text-xs text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
