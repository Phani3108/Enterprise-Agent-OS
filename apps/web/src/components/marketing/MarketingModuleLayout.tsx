/**
 * Marketing Module Layout — A2UI-inspired AI control center
 * Sub-navigation: Command Center, Campaigns, Content Studio, etc.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useMarketingStore, type MarketingSection } from '../../store/marketing-store';

const SECTIONS: { id: MarketingSection; label: string; icon: string; short?: string }[] = [
  { id: 'command-center', label: 'Command Center', icon: '⌘', short: 'Command' },
  { id: 'campaigns', label: 'Campaigns', icon: '📡', short: 'Campaigns' },
  { id: 'content-studio', label: 'Content Studio', icon: '✍️', short: 'Content' },
  { id: 'creative-studio', label: 'Creative Studio', icon: '🎨', short: 'Creative' },
  { id: 'research-hub', label: 'Research Hub', icon: '🔍', short: 'Research' },
  { id: 'analytics-hub', label: 'Analytics Hub', icon: '📊', short: 'Analytics' },
  { id: 'website-seo', label: 'Website / SEO', icon: '🔗', short: 'SEO' },
  { id: 'events', label: 'Events', icon: '🎪', short: 'Events' },
  { id: 'sales-enablement', label: 'Sales Enablement', icon: '⚔️', short: 'Sales' },
  { id: 'workflows', label: 'Workflows', icon: '⚡', short: 'Workflows' },
  { id: 'skills', label: 'Skills', icon: '🔧', short: 'Skills' },
  { id: 'prompts', label: 'Prompt Library', icon: '✨', short: 'Prompts' },
  { id: 'integrations', label: 'Integrations', icon: '🔌', short: 'Tools' },
  { id: 'timeline', label: 'Execution Timeline', icon: '📋', short: 'Timeline' },
  { id: 'pipeline', label: 'Campaign Pipeline', icon: '🔄', short: 'Pipeline' },
  { id: 'projects', label: 'Projects & Graph', icon: '📊', short: 'Projects' },
  { id: 'community', label: 'Community', icon: '👥', short: 'Community' },
  { id: 'assets', label: 'Assets', icon: '📁', short: 'Assets' },
  { id: 'approvals', label: 'Approvals', icon: '✅', short: 'Approvals' },
];

export function MarketingModuleLayout({ children }: { children: React.ReactNode }) {
  const activeSection = useMarketingStore((s) => s.activeSection);
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);

  return (
    <div className="flex flex-1 min-h-0 w-full" data-tour="marketing-module">
      {/* Sub-nav — A2UI: flat, clear hierarchy */}
      <nav className="w-52 flex-shrink-0 border-r border-slate-200 bg-slate-50/80 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marketing</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">AI Agency Control</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex-shrink-0 w-5 text-center text-base">{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto bg-white">{children}</div>
    </div>
  );
}
