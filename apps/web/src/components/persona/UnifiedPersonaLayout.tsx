/**
 * UnifiedPersonaLayout — Shared 4-tab sidebar for all workspace hubs.
 * Run → Library → Pipelines → History.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Navigation items — same for all personas
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: 'run',       label: 'Run',       icon: '⚡' },
  { id: 'library',   label: 'Library',   icon: '📚' },
  { id: 'pipelines', label: 'Pipelines', icon: '🔀' },
  { id: 'history',   label: 'History',   icon: '📦' },
] as const;

export type PersonaSection = (typeof SECTIONS)[number]['id'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UnifiedPersonaLayoutProps {
  persona: string;          // Display label: "Marketing", "Engineering", "Product"
  accentColor: string;      // Tailwind class for active button bg, e.g. "bg-blue-600"
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function UnifiedPersonaLayout({
  persona,
  accentColor,
  activeSection,
  onSectionChange,
  children,
}: UnifiedPersonaLayoutProps) {
  return (
    <div className="flex h-full">
      {/* Sub-sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-slate-200 bg-slate-50/60 flex flex-col py-4">
        <div className="px-4 mb-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{persona}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                activeSection === item.id
                  ? `${accentColor} text-white shadow-sm`
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer tip */}
        <div className="px-4 mt-4">
          <div className="rounded-lg bg-slate-100 p-2.5">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-600">Flow:</span> Run a skill → Browse library → View pipeline DAG → Check execution history.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
