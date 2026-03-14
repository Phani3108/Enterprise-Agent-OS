'use client';
/**
 * AdminUsageView — Usage & Monitoring section.
 * Tabs: Control Plane · Memory Graph
 */
import { useState } from 'react';
import ControlPlane from './ControlPlane';
import MemoryGraphExplorer from './MemoryGraphExplorer';

const TABS = [
  { id: 'control', label: 'Control Plane' },
  { id: 'memory',  label: 'Memory Graph'  },
] as const;
type Tab = typeof TABS[number]['id'];

export function AdminUsageView() {
  const [tab, setTab] = useState<Tab>('control');
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-slate-200 bg-white flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >{t.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {tab === 'control' && <ControlPlane />}
        {tab === 'memory'  && <MemoryGraphExplorer />}
      </div>
    </div>
  );
}
