'use client';

import { useState, useEffect } from 'react';
import {
  getMarketplaceSkills,
  searchMarketplaceSkills,
  runMarketplaceSkill,
  getSkillGovernance,
  setSkillEnabled,
  getSkillRecommendations,
  voteOnSkill,
  getSkillVotes,
  type MarketplaceSkill,
  type SkillGovernanceRecord,
} from '../lib/api';

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

const PERSONAS = [
  { id: 'product', name: 'Product', icon: '📦', color: '#8b5cf6' },
  { id: 'engineering', name: 'Engineering', icon: '⚙️', color: '#3b82f6' },
  { id: 'marketing', name: 'Marketing', icon: '📣', color: '#f59e0b' },
  { id: 'program', name: 'Program', icon: '📋', color: '#10b981' },
  { id: 'hr', name: 'HR', icon: '👥', color: '#ec4899' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#06b6d4' },
  { id: 'data', name: 'Data', icon: '📊', color: '#6366f1' },
  { id: 'corpit', name: 'Corp IT', icon: '🏛️', color: '#64748b' },
  { id: 'sales', name: 'Sales', icon: '🎯', color: '#ef4444' },
  { id: 'design', name: 'Design', icon: '🎨', color: '#d946ef' },
  { id: 'support', name: 'Support', icon: '🎧', color: '#14b8a6' },
  { id: 'legal', name: 'Legal', icon: '⚖️', color: '#78716c' },
];

type View = 'marketplace' | 'governance';

export default function SkillMarketplace() {
  const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
  const [personas, setPersonas] = useState<typeof PERSONAS>([]);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('marketplace');
  const [executingSkill, setExecutingSkill] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    skillId: string;
    runtimeSec: number;
    cost: number;
    outputs: Array<{ name: string; status: string }>;
  } | null>(null);
  const [governanceSkills, setGovernanceSkills] = useState<SkillGovernanceRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ skill: MarketplaceSkill; reason: string }>>([]);
  const [votes, setVotes] = useState<Record<string, { up: number; down: number }>>({});
  const [simulateMode, setSimulateMode] = useState(false);

  useEffect(() => {
    fetch(`${GATEWAY}/api/personas`)
      .then((r) => r.json())
      .then((d) => {
        const p = (d.personas || []).map((x: { id: string; name: string; icon: string; color: string }) => ({
          id: x.id,
          name: x.name,
          icon: x.icon,
          color: x.color,
        }));
        setPersonas(p.length ? p : PERSONAS);
      })
      .catch(() => setPersonas(PERSONAS));
  }, []);

  useEffect(() => {
    setLoading(true);
    if (searchQuery.trim()) {
      searchMarketplaceSkills(searchQuery)
        .then((d) => {
          setSkills(d.skills || []);
          setLoading(false);
        })
        .catch(() => {
          setSkills([]);
          setLoading(false);
        });
    } else {
      getMarketplaceSkills(selectedPersona || undefined)
        .then((d) => {
          setSkills(d.skills || []);
          setLoading(false);
        })
        .catch(() => {
          setSkills([]);
          setLoading(false);
        });
    }
  }, [selectedPersona, searchQuery]);

  useEffect(() => {
    skills.forEach((s) => fetchVotes(s.id));
  }, [skills]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (view === 'governance') {
      getSkillGovernance()
        .then((d) => setGovernanceSkills(d.skills || []))
        .catch(() => setGovernanceSkills([]));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'marketplace') {
      getSkillRecommendations(selectedPersona || undefined, 4)
        .then((d) => setRecommendations((d.recommendations || []).map((r) => ({ skill: r.skill, reason: r.reason }))))
        .catch(() => setRecommendations([]));
    }
  }, [view, selectedPersona]);

  const fetchVotes = (skillId: string) => {
    getSkillVotes(skillId)
      .then((d) => setVotes((prev) => ({ ...prev, [skillId]: d.votes })))
      .catch(() => {});
  };

  const handleVote = async (skillId: string, vote: 'up' | 'down') => {
    try {
      const res = await voteOnSkill(skillId, vote, 'User');
      setVotes((prev) => ({ ...prev, [skillId]: res.votes }));
    } catch {
      // ignore
    }
  };

  const handleRun = async (skill: MarketplaceSkill, simulate = false) => {
    setExecutingSkill(skill.id);
    setExecutionResult(null);
    try {
      const res = await runMarketplaceSkill(skill.id, undefined, simulate);
      setExecutionResult({
        skillId: skill.id,
        runtimeSec: res.runtimeSec,
        cost: res.cost,
        outputs: res.outputs || [],
      });
    } catch {
      setExecutionResult({
        skillId: skill.id,
        runtimeSec: 0,
        cost: 0,
        outputs: [{ name: 'Error', status: 'failed' }],
      });
    } finally {
      setExecutingSkill(null);
    }
  };

  const handleToggleEnabled = async (skillId: string, enabled: boolean) => {
    try {
      await setSkillEnabled(skillId, enabled);
      setGovernanceSkills((prev) =>
        prev.map((s) => (s.skillId === skillId ? { ...s, isEnabled: enabled } : s))
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-full" data-tour="skill-marketplace">
      {/* Left — Persona filter */}
      <div className="w-56 border-r border-gray-200 bg-gray-50/50 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Skill Marketplace
          </h2>
          <p className="text-[10px] text-gray-400 mt-1">
            Browse and run skills by persona
          </p>
        </div>
        <div className="py-1">
          <button
            onClick={() => setView('marketplace')}
            className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm ${
              view === 'marketplace'
                ? 'bg-white text-gray-900 font-medium shadow-sm border-r-2 border-gray-900'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <span>🛒</span>
            <span>Marketplace</span>
          </button>
          <button
            onClick={() => setView('governance')}
            className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm ${
              view === 'governance'
                ? 'bg-white text-gray-900 font-medium shadow-sm border-r-2 border-gray-900'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <span>🏛️</span>
            <span>Corp IT Governance</span>
          </button>
        </div>
        {view === 'marketplace' && (
          <>
            <div className="px-4 py-2 border-t border-gray-200">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Filter by Persona
              </h3>
              <button
                onClick={() => setSelectedPersona(null)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs rounded-lg ${
                  !selectedPersona ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Personas
              </button>
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs rounded-lg mt-0.5 ${
                    selectedPersona === p.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Center — Main content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {view === 'marketplace' ? (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Skill Marketplace</h1>
              <p className="text-sm text-gray-500 mb-4">
                Discover and run skills. Each skill orchestrates agents and tools automatically.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Search skills... (e.g. Launch Campaign, PRD, PR Review)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                />
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateMode}
                    onChange={(e) => setSimulateMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Simulate (no real APIs)
                </label>
              </div>
            </div>

            <div className="p-6">
              {recommendations.length > 0 && !searchQuery && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recommended for you</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {recommendations.map((r) => (
                      <div
                        key={r.skill.id}
                        className="flex-shrink-0 w-48 p-3 rounded-xl border border-gray-200 bg-white hover:shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{r.skill.personaIcon}</span>
                          <span className="text-xs font-medium text-gray-900 truncate">{r.skill.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mb-2">{r.skill.description}</p>
                        <button
                          onClick={() => handleRun(r.skill, simulateMode)}
                          className="w-full px-2 py-1 text-[10px] font-medium rounded bg-gray-900 text-white"
                        >
                          Run
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {loading ? (
                <div className="text-sm text-gray-500">Loading skills...</div>
              ) : skills.length === 0 ? (
                <div className="text-sm text-gray-500">No skills found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${skill.personaColor}20` }}
                        >
                          {skill.personaIcon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{skill.name}</h3>
                          <span className="text-[10px] text-gray-500">{skill.personaName}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{skill.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {skill.requiredTools.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600"
                            title={t.name}
                          >
                            {t.icon} {t.name}
                          </span>
                        ))}
                        {skill.requiredTools.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{skill.requiredTools.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                          {skill.usageCount !== undefined && <span>👥 {skill.usageCount}</span>}
                          {skill.avgRuntimeSec !== undefined && skill.avgRuntimeSec > 0 && (
                            <span>⏱ ~{Math.round(skill.avgRuntimeSec)}s</span>
                          )}
                          {skill.successRate !== undefined && skill.successRate > 0 && (
                            <span>✓ {(skill.successRate * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleVote(skill.id, 'up')}
                            className="px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:bg-gray-100"
                            title="Upvote"
                          >
                            ▲ {votes[skill.id]?.up ?? 0}
                          </button>
                          <button
                            onClick={() => handleVote(skill.id, 'down')}
                            className="px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:bg-gray-100"
                            title="Downvote"
                          >
                            ▼ {votes[skill.id]?.down ?? 0}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRun(skill, false)}
                          disabled={!!executingSkill}
                          className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {executingSkill === skill.id ? 'Running...' : 'Run'}
                        </button>
                        <button
                          onClick={() => handleRun(skill, true)}
                          disabled={!!executingSkill}
                          className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          title="Simulate (no real API calls)"
                        >
                          Simulate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Skill Governance</h1>
              <p className="text-sm text-gray-500">
                Corp IT: Monitor skill costs, usage, and disable expensive skills.
              </p>
            </div>
            <div className="p-6">
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Skill</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Persona</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Tools Used</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Monthly Cost</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Usage</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {governanceSkills.map((s) => (
                      <tr key={s.skillId} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.skillName}</td>
                        <td className="px-4 py-3 text-gray-600">{s.personaName}</td>
                        <td className="px-4 py-3 text-gray-500">{s.toolsUsed.join(', ')}</td>
                        <td className="px-4 py-3 text-right text-gray-700">${s.monthlyCost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.usageCount}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleEnabled(s.skillId, !s.isEnabled)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              s.isEnabled
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {s.isEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {governanceSkills.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">No skill governance data.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Right — Execution result panel */}
        {executionResult && (
          <div className="w-80 border-l border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Execution Result</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs text-gray-500">
                Runtime: {executionResult.runtimeSec}s · Cost: ${executionResult.cost.toFixed(2)}
              </div>
              <div>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Outputs</h4>
                <ul className="space-y-1">
                  {executionResult.outputs.map((o, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <span className={o.status === 'generated' ? 'text-emerald-500' : 'text-gray-400'}>
                        {o.status === 'generated' ? '✓' : '○'}
                      </span>
                      <span className="text-gray-700">{o.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
