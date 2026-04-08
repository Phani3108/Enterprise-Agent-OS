/**
 * SwarmView — Cross-functional agent swarm dashboard.
 * Launch, monitor, and manage multi-persona agent pods.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import { useEAOSStore } from '../store/eaos-store';

const API = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

// ── Types ───────────────────────────────────────────────────────
interface SwarmTemplate {
  type: string; name: string; description: string; requiredFunctions: string[];
  agentRoles: { persona: string; role: string; rank: string }[];
  defaultTools: string[];
  phases: { name: string; description: string; agents: string[] }[];
}
interface A2AAgent { agent_id: string; name: string; regiment: string; rank: string; persona: string }
interface SwarmMetrics { total_messages: number; total_tool_calls: number; total_tokens: number; total_cost_usd: number; duration_ms: number; human_interventions: number }
interface AgentSwarm {
  swarm_id: string; mission: string; task_ref: string; type: string;
  agents: A2AAgent[]; status: string; messages: unknown[]; meetings: unknown[];
  artifacts: { type: string; title: string; content: string; author: string; created_at: string }[];
  created_at: string; completed_at?: string; metrics: SwarmMetrics;
}
interface SwarmStats { active: number; completed: number; totalAgents: number; totalMessages: number }

// ── Colors ──────────────────────────────────────────────────────
const SWARM_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  product_launch:    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: '🚀' },
  incident_response: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: '🚨' },
  hiring_sprint:     { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-700',   icon: '👥' },
  campaign_pod:      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '📣' },
  custom:            { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  icon: '⚡' },
};

const STATUS_BADGE: Record<string, string> = {
  forming: 'badge-info', active: 'badge-success', reviewing: 'badge-warning',
  completed: 'badge-neutral', dissolved: 'badge-neutral',
};

// ═══════════════════════════════════════════════════════════════
export default function SwarmView() {
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const [templates, setTemplates] = useState<SwarmTemplate[]>([]);
  const [swarms, setSwarms] = useState<AgentSwarm[]>([]);
  const [stats, setStats] = useState<SwarmStats>({ active: 0, completed: 0, totalAgents: 0, totalMessages: 0 });
  const [selectedSwarm, setSelectedSwarm] = useState<AgentSwarm | null>(null);
  const [showLaunch, setShowLaunch] = useState(false);
  const [launchType, setLaunchType] = useState('product_launch');
  const [launchMission, setLaunchMission] = useState('');
  const [launching, setLaunching] = useState(false);
  const [tab, setTab] = useState<'active' | 'completed' | 'templates'>('active');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/swarms/templates`).then(r => r.json()).catch(() => ({ templates: [] })),
      fetch(`${API}/api/a2a/swarms`).then(r => r.json()).catch(() => ({ swarms: [] })),
      fetch(`${API}/api/swarms/stats`).then(r => r.json()).catch(() => ({})),
    ]).then(([t, s, st]) => {
      setTemplates(t.templates || []);
      setSwarms(s.swarms || []);
      setStats(st);
    });
  }, []);

  const launchNewSwarm = async () => {
    if (!launchMission.trim()) return;
    setLaunching(true);
    try {
      const res = await fetch(`${API}/api/swarms/launch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: launchType, mission: launchMission }),
      });
      const data = await res.json();
      if (data.swarm) {
        setSwarms(prev => [data.swarm, ...prev]);
        setSelectedSwarm(data.swarm);
        setShowLaunch(false);
        setLaunchMission('');
        setStats(prev => ({ ...prev, active: prev.active + 1, totalAgents: prev.totalAgents + (data.swarm.agents?.length || 0) }));
      }
    } catch {}
    setLaunching(false);
  };

  const advancePhase = async (swarmId: string) => {
    const res = await fetch(`${API}/api/swarms/${swarmId}/advance`, { method: 'POST' });
    const data = await res.json();
    if (data.swarm) {
      setSwarms(prev => prev.map(s => s.swarm_id === swarmId ? data.swarm : s));
      setSelectedSwarm(data.swarm);
    }
  };

  const activeSwarms = swarms.filter(s => s.status === 'active' || s.status === 'forming');
  const completedSwarms = swarms.filter(s => s.status === 'completed' || s.status === 'dissolved');

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Agent Swarms</h1>
            <p className="page-subtitle">Cross-functional agent pods for complex missions</p>
          </div>
          <button onClick={() => setShowLaunch(true)} className="btn btn-primary">Launch Swarm</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Swarms', value: stats.active, color: 'text-blue-600' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600' },
            { label: 'Total Agents', value: stats.totalAgents, color: 'text-violet-600' },
            { label: 'Total Messages', value: stats.totalMessages, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {(['active', 'completed', 'templates'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {t === 'active' ? `Active (${activeSwarms.length})` : t === 'completed' ? `Completed (${completedSwarms.length})` : 'Templates'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left — Swarm list or templates */}
          <div className="col-span-1 space-y-3">
            {tab === 'templates' ? (
              templates.map(t => {
                const colors = SWARM_COLORS[t.type] || SWARM_COLORS.custom;
                return (
                  <div key={t.type} className={`card p-4 ${colors.bg} border ${colors.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{colors.icon}</span>
                      <h4 className={`text-sm font-semibold ${colors.text}`}>{t.name}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.requiredFunctions.map(f => (
                        <span key={f} className="badge badge-neutral text-[9px]">{f}</span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t.phases.length} phases &middot; {t.agentRoles.length} agents &middot; {t.defaultTools.length} tools
                    </div>
                    <button onClick={() => { setLaunchType(t.type); setShowLaunch(true); }}
                      className="btn btn-primary btn-sm mt-3 w-full">
                      Launch This Swarm
                    </button>
                  </div>
                );
              })
            ) : (
              (tab === 'active' ? activeSwarms : completedSwarms).map(s => {
                const colors = SWARM_COLORS[s.type] || SWARM_COLORS.custom;
                return (
                  <button key={s.swarm_id} onClick={() => setSelectedSwarm(s)}
                    className={`card p-4 w-full text-left transition-all ${selectedSwarm?.swarm_id === s.swarm_id ? 'border-blue-500 shadow-md' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{colors.icon}</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{s.mission.slice(0, 50)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span className={`badge ${STATUS_BADGE[s.status] || 'badge-neutral'}`}>{s.status}</span>
                      <span>{s.agents.length} agents</span>
                      <span>{s.artifacts.length} phases</span>
                    </div>
                  </button>
                );
              })
            )}
            {tab !== 'templates' && (tab === 'active' ? activeSwarms : completedSwarms).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No {tab} swarms. Launch one from templates.</p>
            )}
          </div>

          {/* Right — Swarm detail */}
          <div className="col-span-2">
            {selectedSwarm ? (
              <div className="card overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">{selectedSwarm.mission}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className={`badge ${STATUS_BADGE[selectedSwarm.status] || 'badge-neutral'}`}>{selectedSwarm.status}</span>
                        <span>{selectedSwarm.type.replace(/_/g, ' ')}</span>
                        <span>Started {new Date(selectedSwarm.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {selectedSwarm.status === 'active' && (
                      <button onClick={() => advancePhase(selectedSwarm.swarm_id)} className="btn btn-primary btn-sm">
                        Advance Phase
                      </button>
                    )}
                  </div>
                </div>

                {/* Agents */}
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Squad Members</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSwarm.agents.map(a => (
                      <div key={a.agent_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className={`w-2 h-2 rounded-full ${selectedSwarm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-medium text-slate-700">{a.name}</span>
                        <span className="text-[9px] text-slate-400">{a.persona}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phase Progress */}
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Phase Progress</h3>
                  <div className="flex items-center gap-2">
                    {selectedSwarm.artifacts.map((phase, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium text-emerald-700">{phase.title.replace(/^Phase \d+: /, '')}</span>
                        </div>
                        {i < selectedSwarm.artifacts.length - 1 && <span className="text-slate-300">→</span>}
                      </div>
                    ))}
                    {selectedSwarm.status === 'active' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-medium text-blue-700">In Progress</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="px-5 py-4">
                  <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Execution Metrics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Messages', value: selectedSwarm.metrics.total_messages },
                      { label: 'Tool Calls', value: selectedSwarm.metrics.total_tool_calls },
                      { label: 'Tokens Used', value: selectedSwarm.metrics.total_tokens.toLocaleString() },
                      { label: 'Cost', value: `$${selectedSwarm.metrics.total_cost_usd.toFixed(2)}` },
                      { label: 'Duration', value: selectedSwarm.metrics.duration_ms > 0 ? `${(selectedSwarm.metrics.duration_ms / 1000).toFixed(0)}s` : '—' },
                      { label: 'Human Interventions', value: selectedSwarm.metrics.human_interventions },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <p className="text-lg font-bold text-slate-800">{m.value}</p>
                        <p className="text-[10px] text-slate-500">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <span className="text-4xl block mb-4">🐝</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Swarm Selected</h3>
                <p className="text-sm text-slate-500 mb-4">Launch a cross-functional swarm or select one to view details.</p>
                <button onClick={() => setShowLaunch(true)} className="btn btn-primary">Launch Your First Swarm</button>
              </div>
            )}
          </div>
        </div>

        {/* Launch Modal */}
        {showLaunch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowLaunch(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Launch Agent Swarm</h2>

              <div className="mb-4">
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Swarm Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.filter(t => t.type !== 'custom').map(t => {
                    const colors = SWARM_COLORS[t.type] || SWARM_COLORS.custom;
                    return (
                      <button key={t.type} onClick={() => setLaunchType(t.type)}
                        className={`p-3 rounded-xl border text-left transition-all ${launchType === t.type ? `${colors.bg} ${colors.border} ring-2 ring-blue-500/30` : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2">
                          <span>{colors.icon}</span>
                          <span className="text-xs font-semibold text-slate-900">{t.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{t.agentRoles.length} agents &middot; {t.phases.length} phases</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Mission Objective</label>
                <textarea
                  value={launchMission}
                  onChange={e => setLaunchMission(e.target.value)}
                  placeholder="e.g., Launch the credit card modernization feature for community banks"
                  className="input w-full h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setShowLaunch(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={launchNewSwarm} disabled={!launchMission.trim() || launching} className="btn btn-primary">
                  {launching ? 'Launching...' : 'Launch Swarm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
