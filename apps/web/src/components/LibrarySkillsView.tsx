'use client';
/**
 * LibrarySkillsView — canonical home for Skills, Skill Builder, Personas, and Prompts.
 * Tabbed: Browse Skills · Skill Builder · Personas · Prompts
 */
import { useState } from 'react';
import PersonaSkillsView from './PersonaSkillsView';
import SkillMarketplace from './SkillMarketplace';
import SkillBuilder from './SkillBuilder';
import { PromptLibrary } from './PromptLibraryDeep';

const TABS = [
  { id: 'marketplace', label: 'Browse Skills' },
  { id: 'personas',    label: 'By Persona'    },
  { id: 'builder',     label: 'Skill Builder' },
  { id: 'prompts',     label: 'Prompts'       },
] as const;
type Tab = typeof TABS[number]['id'];

export function LibrarySkillsView() {
  const [tab, setTab] = useState<Tab>('marketplace');
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
        {tab === 'marketplace' && <SkillMarketplace />}
        {tab === 'personas'    && <PersonaSkillsView />}
        {tab === 'builder'     && <SkillBuilder />}
        {tab === 'prompts'     && <PromptLibrary />}
      </div>
    </div>
  );
}
