/**
 * Deep Prompt Library — Cross-persona, multi-variation, LLM-compatible, editable prompt library.
 * Powers the global Library → Prompts tab. Each prompt has short/long/linkedin/enterprise variants,
 * LLM compatibility badges, and inline editing.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useMemo } from 'react';
import { usePromptStore, type Persona, type PromptVariation, type LLMProvider, type DeepPrompt } from '../store/prompt-store';

const PERSONA_META: Record<Persona, { label: string; icon: string; color: string }> = {
  marketing:   { label: 'Marketing',   icon: '📣', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  engineering: { label: 'Engineering', icon: '⚙️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  product:     { label: 'Product',     icon: '🗺️', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  hr:          { label: 'HR & TA',     icon: '👥', color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

const LLM_META: Record<LLMProvider, { label: string; color: string; icon: string }> = {
  openai:     { label: 'OpenAI',     color: 'bg-green-100 text-green-700',   icon: '🟢' },
  azure:      { label: 'Azure',      color: 'bg-blue-100 text-blue-700',     icon: '🔵' },
  claude:     { label: 'Claude',     color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  gemini:     { label: 'Gemini',     color: 'bg-cyan-100 text-cyan-700',     icon: '💎' },
  perplexity: { label: 'Perplexity', color: 'bg-purple-100 text-purple-700', icon: '🧭' },
};

const VARIATION_LABELS: Record<PromptVariation, { label: string; icon: string }> = {
  standard:          { label: 'Standard',     icon: '📝' },
  short:             { label: 'Short',        icon: '⚡' },
  long:              { label: 'Long/Deep',    icon: '📖' },
  linkedin:          { label: 'LinkedIn',     icon: '💼' },
  enterprise:        { label: 'Enterprise',   icon: '🏢' },
  email:             { label: 'Email',        icon: '📧' },
  social:            { label: 'Social',       icon: '📱' },
  'executive-summary': { label: 'Exec Summary', icon: '📊' },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[10px] text-amber-500">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

function PromptCard({ prompt }: { prompt: DeepPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeVariation, setActiveVariation] = useState<PromptVariation>(prompt.variants[0]?.variation ?? 'standard');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showLlmNotes, setShowLlmNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateVariant = usePromptStore(s => s.updatePromptVariant);
  const getEffective = usePromptStore(s => s.getEffectivePrompt);

  const effectivePrompt = getEffective(prompt.id, activeVariation);
  const activeVariant = prompt.variants.find(v => v.variation === activeVariation);
  const pMeta = PERSONA_META[prompt.persona];

  const handleCopy = () => {
    navigator.clipboard.writeText(effectivePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditText(effectivePrompt);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateVariant(prompt.id, activeVariation, editText, 'current-user');
    setIsEditing(false);
  };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? 'shadow-md border-slate-300' : 'border-slate-200 hover:border-slate-300'}`}>
      {/* Header - click to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-xl flex-shrink-0">{prompt.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{prompt.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${pMeta.color}`}>
              {pMeta.icon} {pMeta.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{prompt.agent}</span>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">{prompt.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-slate-400">{prompt.variants.length} variations</span>
            <Stars rating={prompt.rating} />
            <span className="text-[10px] text-slate-400">{prompt.usageCount} uses</span>
            {prompt.lastEditedBy && (
              <span className="text-[10px] text-slate-400">edited by {prompt.lastEditedBy}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* LLM compatibility dots */}
          <div className="flex gap-0.5">
            {prompt.llmCompatibility.map(llm => (
              <span key={llm} className="text-[10px]" title={LLM_META[llm].label}>{LLM_META[llm].icon}</span>
            ))}
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded: variation selector, prompt content, LLM notes, edit */}
      {isExpanded && (
        <div className="border-t bg-white p-4 space-y-4">
          {/* Variation selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Variation</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {prompt.variants.map(v => {
                const vMeta = VARIATION_LABELS[v.variation];
                return (
                  <button
                    key={v.variation}
                    onClick={() => { setActiveVariation(v.variation); setIsEditing(false); }}
                    className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                      v.variation === activeVariation
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {vMeta.icon} {vMeta.label}
                    {v.wordTarget && <span className="text-[9px] opacity-70 ml-1">({v.wordTarget})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags and variables */}
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap gap-1">
              {prompt.tags.map(t => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">{t}</span>
              ))}
            </div>
            {prompt.variables.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prompt.variables.map(v => (
                  <span key={v} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-mono border border-blue-200">{`{{${v}}}`}</span>
                ))}
              </div>
            )}
          </div>

          {/* LLM compatibility bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-500">Works with:</span>
            {prompt.llmCompatibility.map(llm => (
              <span key={llm} className={`text-[10px] px-2 py-0.5 rounded-full ${LLM_META[llm].color} font-medium`}>
                {LLM_META[llm].icon} {LLM_META[llm].label}
              </span>
            ))}
            {prompt.llmNotes && Object.keys(prompt.llmNotes).length > 0 && (
              <button
                onClick={() => setShowLlmNotes(!showLlmNotes)}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
              >
                {showLlmNotes ? 'Hide' : 'Show'} LLM tips
              </button>
            )}
          </div>

          {/* LLM-specific notes */}
          {showLlmNotes && prompt.llmNotes && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
              {(Object.entries(prompt.llmNotes) as [LLMProvider, string][]).map(([llm, note]) => (
                <div key={llm} className="flex items-start gap-2 text-[11px]">
                  <span className="flex-shrink-0">{LLM_META[llm].icon}</span>
                  <span className="text-slate-600"><strong className="text-slate-700">{LLM_META[llm].label}:</strong> {note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Prompt content */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {VARIATION_LABELS[activeVariation]?.label} Prompt
                </span>
                {activeVariant?.wordTarget && (
                  <span className="text-[10px] text-slate-400">Target: {activeVariant.wordTarget}</span>
                )}
                <span className="text-[10px] text-slate-400">{prompt.version}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {prompt.isEditable && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 font-medium transition-colors"
                  >
                    ✏️ Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button onClick={handleSave} className="text-[10px] px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors">
                      💾 Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="text-[10px] px-2 py-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 font-medium transition-colors">
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={handleCopy}
                  className="text-[10px] px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium transition-colors"
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full p-3 text-xs font-mono text-slate-700 bg-white leading-relaxed focus:outline-none min-h-[200px] resize-y"
                spellCheck={false}
              />
            ) : (
              <pre className="p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                {effectivePrompt}
              </pre>
            )}
          </div>

          {/* Linked skills/workflows */}
          {prompt.linkedSkillIds && prompt.linkedSkillIds.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Used by</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {prompt.linkedSkillIds.map(sid => (
                  <span key={sid} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    ⚡ {sid}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source badge */}
          {prompt.source && (
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                prompt.source === 'built-in' ? 'bg-slate-100 text-slate-600' :
                prompt.source === 'community' ? 'bg-violet-50 text-violet-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {prompt.source === 'built-in' ? '📦 Built-in' :
                 prompt.source === 'community' ? '🌐 Community' :
                 '✏️ Custom'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PromptLibrary({ personaFilter }: { personaFilter?: Persona } = {}) {
  const prompts = usePromptStore(s => s.prompts);

  const [search, setSearch] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(personaFilter ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLlm, setSelectedLlm] = useState<LLMProvider | null>(null);

  const categories = useMemo(() =>
    Array.from(new Set(prompts.map(p => p.category))).sort(),
    [prompts]
  );

  const filtered = useMemo(() => prompts.filter(p => {
    if (selectedPersona && p.persona !== selectedPersona) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedLlm && !p.llmCompatibility.includes(selectedLlm)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.title.toLowerCase().includes(q)
        && !p.description.toLowerCase().includes(q)
        && !p.agent.toLowerCase().includes(q)
        && !p.tags.some(t => t.includes(q))
        && !p.category.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [prompts, selectedPersona, selectedCategory, selectedLlm, search]);

  const personaCounts = useMemo(() => ({
    marketing: prompts.filter(p => p.persona === 'marketing').length,
    engineering: prompts.filter(p => p.persona === 'engineering').length,
    product: prompts.filter(p => p.persona === 'product').length,
    hr: prompts.filter(p => p.persona === 'hr').length,
  }), [prompts]);

  const totalVariants = useMemo(() =>
    prompts.reduce((sum, p) => sum + p.variants.length, 0),
    [prompts]
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Deep Prompt Library</h2>
        <p className="text-sm text-slate-500 mt-1">
          {prompts.length} prompts with {totalVariants} variations across all personas. Tuned for OpenAI, Azure, Claude, Gemini, and Perplexity.
          Editable by senior team members.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total Prompts', value: prompts.length, color: 'text-slate-900' },
          { label: 'Variations', value: totalVariants, color: 'text-blue-600' },
          { label: 'Marketing', value: personaCounts.marketing, color: 'text-orange-600' },
          { label: 'Engineering', value: personaCounts.engineering, color: 'text-blue-600' },
          { label: 'Product', value: personaCounts.product, color: 'text-violet-600' },
          { label: 'HR & TA', value: personaCounts.hr, color: 'text-pink-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by title, agent, category, or tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-300 transition-colors"
        />

        {/* Persona filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Persona:</span>
          <button
            onClick={() => setSelectedPersona(null)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              !selectedPersona ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({prompts.length})
          </button>
          {(Object.entries(PERSONA_META) as [Persona, typeof PERSONA_META[Persona]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedPersona(selectedPersona === key ? null : key)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                selectedPersona === key ? 'bg-slate-900 text-white border-slate-900' : `border-slate-200 text-slate-600 hover:bg-slate-50`
              }`}
            >
              {meta.icon} {meta.label} ({personaCounts[key]})
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">LLM:</span>
          {(Object.entries(LLM_META) as [LLMProvider, typeof LLM_META[LLMProvider]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedLlm(selectedLlm === key ? null : key)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                selectedLlm === key ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Category:</span>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              !selectedCategory ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {categories.map(cat => {
            const count = filtered.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="text-[11px] text-slate-400">
        Showing {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
        {selectedPersona && ` for ${PERSONA_META[selectedPersona].label}`}
        {selectedLlm && ` compatible with ${LLM_META[selectedLlm].label}`}
        {selectedCategory && ` in ${selectedCategory}`}
      </div>

      {/* Prompt cards */}
      <div className="space-y-3">
        {filtered.map(p => <PromptCard key={p.id} prompt={p} />)}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <span className="text-3xl block mb-3">🔍</span>
            <p className="text-sm">No prompts match your filters.</p>
            <button
              onClick={() => { setSearch(''); setSelectedPersona(null); setSelectedCategory(null); setSelectedLlm(null); }}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
