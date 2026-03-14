/**
 * MemoryView — System learning, execution insights, and skill improvement suggestions.
 * Shows what the AI has learned from past executions and recommends improvements.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryInsight {
  id: string;
  skill: string;
  insight: string;
  type: 'improvement' | 'pattern' | 'preference' | 'warning';
  confidence: number;   // 0-100
  learnedAt: string;
  runsAnalyzed: number;
}

interface MemoryViewProps {
  persona: string;
  accentColor: string;     // Tailwind base e.g. 'blue-600'
  totalRuns: number;
  insights?: MemoryInsight[];
}

// ---------------------------------------------------------------------------
// Default insights per persona (demo data)
// ---------------------------------------------------------------------------

const DEFAULT_INSIGHTS: Record<string, MemoryInsight[]> = {
  marketing: [
    { id: 'mi-1', skill: 'Campaign Strategy', insight: 'Including competitive positioning data increases output quality by ~40%. The system now auto-suggests competitive analysis as a prerequisite step.', type: 'improvement', confidence: 92, learnedAt: '2026-02-28', runsAnalyzed: 23 },
    { id: 'mi-2', skill: 'Content Generation', insight: 'Long-form content performs best when tone is set to "professional but conversational". This matches 78% of approved outputs.', type: 'preference', confidence: 78, learnedAt: '2026-03-01', runsAnalyzed: 45 },
    { id: 'mi-3', skill: 'SEO Optimization', insight: 'Keyword clusters with 3-5 related terms produce more actionable content briefs than single-keyword targeting.', type: 'pattern', confidence: 85, learnedAt: '2026-03-05', runsAnalyzed: 18 },
    { id: 'mi-4', skill: 'Email Sequences', insight: 'Sequences with 5 emails have 2x higher completion rate than 7-email sequences for this audience. Consider shortening by default.', type: 'improvement', confidence: 71, learnedAt: '2026-03-10', runsAnalyzed: 12 },
    { id: 'mi-5', skill: 'Ad Copy', insight: 'LinkedIn ads with question-based headlines outperform statement-based by 35% in CTR.', type: 'pattern', confidence: 88, learnedAt: '2026-03-08', runsAnalyzed: 31 },
  ],
  engineering: [
    { id: 'ei-1', skill: 'PR Review', insight: 'Reviews that include architecture context catch 60% more design-level issues. Auto-including related ADRs is recommended.', type: 'improvement', confidence: 89, learnedAt: '2026-03-02', runsAnalyzed: 56 },
    { id: 'ei-2', skill: 'Test Generation', insight: 'Unit tests targeting boundary conditions and error paths have 3x higher defect detection rate than happy-path-only tests.', type: 'pattern', confidence: 94, learnedAt: '2026-03-06', runsAnalyzed: 38 },
    { id: 'ei-3', skill: 'Incident Triage', insight: 'Incidents linked to recent deployments resolve 45% faster when deploy diff is included in triage context.', type: 'improvement', confidence: 82, learnedAt: '2026-03-04', runsAnalyzed: 15 },
    { id: 'ei-4', skill: 'Documentation', insight: 'API docs generated with code examples have 70% higher developer adoption. Always include examples.', type: 'preference', confidence: 91, learnedAt: '2026-03-07', runsAnalyzed: 22 },
    { id: 'ei-5', skill: 'Security Scan', insight: 'Dependency vulnerability scans should exclude dev-only dependencies to reduce noise by ~50%.', type: 'warning', confidence: 76, learnedAt: '2026-03-09', runsAnalyzed: 19 },
  ],
  product: [
    { id: 'pi-1', skill: 'PRD Generation', insight: 'PRDs that include competitive context and user quotes receive approval 2x faster. Auto-pulling research data is recommended.', type: 'improvement', confidence: 87, learnedAt: '2026-03-01', runsAnalyzed: 14 },
    { id: 'pi-2', skill: 'User Research', insight: 'Interview synthesis with 8+ participants reveals stable themes. Below 6 participants, confidence drops significantly.', type: 'pattern', confidence: 83, learnedAt: '2026-03-05', runsAnalyzed: 9 },
    { id: 'pi-3', skill: 'Roadmap Planning', insight: 'Quarterly roadmaps with max 4 P0 items have 80% completion rate vs 45% for 6+ P0 items.', type: 'warning', confidence: 90, learnedAt: '2026-03-08', runsAnalyzed: 7 },
    { id: 'pi-4', skill: 'Competitive Analysis', insight: 'Including pricing comparison data leads to more actionable positioning recommendations.', type: 'improvement', confidence: 79, learnedAt: '2026-03-10', runsAnalyzed: 11 },
    { id: 'pi-5', skill: 'Launch Planning', insight: 'Launches with readiness score below 70% have 3x higher risk of delays. Suggest gating launches at 75%+.', type: 'pattern', confidence: 86, learnedAt: '2026-03-12', runsAnalyzed: 8 },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  improvement: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Improvement', icon: '💡' },
  pattern:     { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Pattern',     icon: '🔄' },
  preference:  { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Preference',  icon: '⭐' },
  warning:     { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Warning',     icon: '⚠️' },
};

export function MemoryView({ persona, accentColor, totalRuns, insights }: MemoryViewProps) {
  const allInsights = insights ?? DEFAULT_INSIGHTS[persona.toLowerCase()] ?? [];
  const [filter, setFilter] = useState<string | null>(null);
  const filtered = filter ? allInsights.filter(i => i.type === filter) : allInsights;
  const types = Array.from(new Set(allInsights.map(i => i.type)));

  const avgConfidence = allInsights.length > 0
    ? Math.round(allInsights.reduce((s, i) => s + i.confidence, 0) / allInsights.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Memory & Learning</h2>
        <p className="text-sm text-slate-600">
          Insights learned from {totalRuns} past executions. The system continuously improves skill quality based on results.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Runs Analyzed', value: totalRuns, color: 'text-slate-900' },
          { label: 'Insights Learned', value: allInsights.length, color: `text-${accentColor}` },
          { label: 'Avg Confidence', value: `${avgConfidence}%`, color: 'text-emerald-600' },
          { label: 'Auto-Applied', value: allInsights.filter(i => i.confidence >= 85).length, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
        <h3 className="text-xs font-bold text-slate-700 mb-2">How Memory Works</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { step: '1', label: 'Execute Skills', desc: 'Run skills with real data' },
            { step: '2', label: 'Analyze Results', desc: 'System evaluates output quality' },
            { step: '3', label: 'Extract Patterns', desc: 'Identify what works best' },
            { step: '4', label: 'Improve Skills', desc: 'Auto-adjust prompts & defaults' },
          ].map(s => (
            <div key={s.step} className="text-center">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mx-auto mb-1.5">{s.step}</div>
              <p className="text-[11px] font-semibold text-slate-800">{s.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter(null)}
          className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${!filter ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All ({allInsights.length})
        </button>
        {types.map(t => {
          const st = TYPE_STYLES[t];
          return (
            <button key={t} onClick={() => setFilter(t === filter ? null : t)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${filter === t ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {st.icon} {st.label} ({allInsights.filter(i => i.type === t).length})
            </button>
          );
        })}
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {filtered.map(insight => {
          const st = TYPE_STYLES[insight.type];
          return (
            <div key={insight.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{st.icon}</span>
                  <span className="text-sm font-bold text-slate-900">{insight.skill}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-700">{insight.confidence}%</p>
                    <p className="text-[10px] text-slate-400">confidence</p>
                  </div>
                  {insight.confidence >= 85 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">Auto-applied</span>
                  )}
                </div>
              </div>
              <p className="text-[12px] text-slate-700 leading-relaxed">{insight.insight}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>📊 {insight.runsAnalyzed} runs analyzed</span>
                <span>📅 Learned {insight.learnedAt}</span>
              </div>
            </div>
          );
        })}
      </div>

      {allInsights.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-3xl mb-3">🧠</p>
          <p className="text-slate-500 text-sm font-medium">No insights yet</p>
          <p className="text-slate-400 text-xs mt-1">Run skills to start building memory. The system improves with every execution.</p>
        </div>
      )}
    </div>
  );
}
