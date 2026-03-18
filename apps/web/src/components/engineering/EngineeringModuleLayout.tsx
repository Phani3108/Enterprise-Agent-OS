/**
 * Engineering Module Layout — Sub-navigation for Engineering hub
 * Mirrors MarketingModuleLayout pattern with engineering-specific sections.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useEngineeringStore, type EngineeringSection } from '../../store/persona-store';

const SECTIONS: { id: EngineeringSection; label: string; icon: string }[] = [
  { id: 'run',       label: 'Run',       icon: '▶️' },
  { id: 'library',   label: 'Library',   icon: '📚' },
  { id: 'pipelines', label: 'Pipelines', icon: '🔀' },
  { id: 'history',   label: 'History',   icon: '📜' },
];

export function EngineeringModuleLayout({ children }: { children: React.ReactNode }) {
  const activeSection = useEngineeringStore((s) => s.activeSection);
  const setActiveSection = useEngineeringStore((s) => s.setActiveSection);

  return (
    <div className="flex flex-1 min-h-0 w-full" data-tour="engineering-module">
      <nav className="w-52 flex-shrink-0 border-r border-slate-200 bg-slate-50/80 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engineering</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">AI Dev Operations</p>
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
      <div className="flex-1 min-w-0 overflow-auto bg-white">{children}</div>
    </div>
  );
}
