'use client';
/**
 * BudgetIntelligence — CFO dashboard with per-agent budget tracking,
 * burn-rate projections, cost alerts, and spend analytics.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface AgentBudget {
  agentId: string; agentName: string; regiment: string;
  period: string; allocatedUsd: number; spentUsd: number;
  tokenCount: number; taskCount: number; alertThresholdPct: number;
  alertFired: boolean; periodStart: string; periodEnd: string;
}

interface BurnRate {
  agentId: string; dailyAvgUsd: number; weeklyAvgUsd: number;
  projectedMonthEndUsd: number; daysUntilBudgetExhausted: number | null;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface CostAlert {
  id: string; type: string; severity: 'info' | 'warning' | 'critical';
  agentId: string; message: string; acknowledged: boolean; createdAt: string;
}

interface SpendEntry {
  id: string; agentId: string; taskDescription: string; tokenCount: number;
  costUsd: number; model: string; provider: string; latencyMs: number; createdAt: string;
}

interface CFODashboard {
  totalBudgetUsd: number; totalSpentUsd: number; totalTokens: number; totalTasks: number;
  budgetUtilizationPct: number;
  byRegiment: { regiment: string; allocated: number; spent: number; agents: number }[];
  topSpenders: { agentId: string; agentName: string; spentUsd: number; pct: number }[];
  activeAlerts: number;
  costByProvider: { provider: string; totalUsd: number; tokenCount: number }[];
  costByModel: { model: string; totalUsd: number; tokenCount: number }[];
}

type Tab = 'overview' | 'budgets' | 'spend' | 'alerts';

/* ── Constants ─────────────────────────────────────────────────────────── */

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700',
};
const TREND_ICONS: Record<string, string> = { increasing: '📈', stable: '➡️', decreasing: '📉' };

/* ── Component ────────────────────────────────────────────────────────── */

export default function BudgetIntelligence() {
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<CFODashboard | null>(null);
  const [budgets, setBudgets] = useState<AgentBudget[]>([]);
  const [spend, setSpend] = useState<SpendEntry[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [burnRate, setBurnRate] = useState<BurnRate | null>(null);

  // Budget form
  const [showForm, setShowForm] = useState(false);
  const [fAgentId, setFAgentId] = useState('');
  const [fAgentName, setFAgentName] = useState('');
  const [fRegiment, setFRegiment] = useState('');
  const [fPeriod, setFPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [fAllocated, setFAllocated] = useState('');

  /* ── Fetching ───────────────────────────────────────────────────────── */
  const fetchAll = () => {
    fetch(`${API}/api/budget/dashboard`).then(r => r.json()).then(d => setDashboard(d)).catch(() => {});
    fetch(`${API}/api/budget/agents`).then(r => r.json()).then(d => setBudgets(d.budgets ?? [])).catch(() => {});
    fetch(`${API}/api/budget/spend?limit=200`).then(r => r.json()).then(d => setSpend(d.entries ?? [])).catch(() => {});
    fetch(`${API}/api/budget/alerts`).then(r => r.json()).then(d => setAlerts(d.alerts ?? [])).catch(() => {});
  };
  useEffect(fetchAll, []);

  useEffect(() => {
    if (!selectedAgent) { setBurnRate(null); return; }
    fetch(`${API}/api/budget/agents/${encodeURIComponent(selectedAgent)}/burn-rate`)
      .then(r => r.json()).then(setBurnRate).catch(() => {});
  }, [selectedAgent]);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const addBudget = async () => {
    await fetch(`${API}/api/budget/agents`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: fAgentId, agentName: fAgentName, regiment: fRegiment, period: fPeriod, allocatedUsd: parseFloat(fAllocated) }),
    });
    setFAgentId(''); setFAgentName(''); setFRegiment(''); setFAllocated('');
    setShowForm(false); fetchAll();
  };

  const ackAlert = async (id: string) => {
    await fetch(`${API}/api/budget/alerts/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' });
    fetchAll();
  };

  const pct = (spent: number, allocated: number) => allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const pctColor = (p: number) => p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'CFO Dashboard', icon: '💰' },
    { key: 'budgets', label: 'Agent Budgets', icon: '📊' },
    { key: 'spend', label: 'Spend Log', icon: '📋' },
    { key: 'alerts', label: 'Alerts', icon: '🚨' },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Budget Intelligence</h1>
        <p className="text-emerald-200 mb-6">Per-agent cost tracking, burn-rate projections & CFO analytics</p>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">${(dashboard?.totalBudgetUsd ?? 0).toFixed(0)}</div>
            <div className="text-sm text-emerald-200">Total Budget</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">${(dashboard?.totalSpentUsd ?? 0).toFixed(2)}</div>
            <div className="text-sm text-emerald-200">Total Spent</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{(dashboard?.totalTokens ?? 0).toLocaleString()}</div>
            <div className="text-sm text-emerald-200">Tokens Used</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{dashboard?.activeAlerts ?? 0}</div>
            <div className="text-sm text-emerald-200">Active Alerts</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────── */}
      {tab === 'overview' && dashboard && (
        <div className="space-y-6">
          {/* Utilization bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium dark:text-white">Budget Utilization</h3>
              <span className="text-sm font-bold dark:text-white">{dashboard.budgetUtilizationPct}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div className={`h-4 rounded-full transition-all ${pctColor(dashboard.budgetUtilizationPct)}`} style={{ width: `${Math.min(100, dashboard.budgetUtilizationPct)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* By Regiment */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium dark:text-white mb-4">Spend by Regiment</h3>
              <div className="space-y-3">
                {dashboard.byRegiment.map(r => (
                  <div key={r.regiment}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="dark:text-gray-300 capitalize">{r.regiment}</span>
                      <span className="dark:text-white font-medium">${r.spent.toFixed(2)} / ${r.allocated.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full ${pctColor(pct(r.spent, r.allocated))}`} style={{ width: `${Math.min(100, pct(r.spent, r.allocated))}%` }} />
                    </div>
                  </div>
                ))}
                {dashboard.byRegiment.length === 0 && <p className="text-sm text-gray-500">No regiment budgets set</p>}
              </div>
            </div>

            {/* Top Spenders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium dark:text-white mb-4">Top Spenders</h3>
              <div className="space-y-2">
                {dashboard.topSpenders.map(s => (
                  <div key={s.agentId} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm dark:text-gray-300">{s.agentName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium dark:text-white">${s.spentUsd.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${pct(s.pct, 100) >= 80 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{s.pct}%</span>
                    </div>
                  </div>
                ))}
                {dashboard.topSpenders.length === 0 && <p className="text-sm text-gray-500">No spend data</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* By Provider */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium dark:text-white mb-4">Cost by Provider</h3>
              {dashboard.costByProvider.length === 0 ? <p className="text-sm text-gray-500">No provider data</p> :
                dashboard.costByProvider.map(p => (
                  <div key={p.provider} className="flex justify-between py-1 text-sm">
                    <span className="dark:text-gray-300 capitalize">{p.provider}</span>
                    <span className="dark:text-white">${p.totalUsd.toFixed(2)} ({p.tokenCount.toLocaleString()} tokens)</span>
                  </div>
                ))
              }
            </div>
            {/* By Model */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium dark:text-white mb-4">Cost by Model</h3>
              {dashboard.costByModel.length === 0 ? <p className="text-sm text-gray-500">No model data</p> :
                dashboard.costByModel.map(m => (
                  <div key={m.model} className="flex justify-between py-1 text-sm">
                    <span className="dark:text-gray-300">{m.model}</span>
                    <span className="dark:text-white">${m.totalUsd.toFixed(2)} ({m.tokenCount.toLocaleString()} tokens)</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Budgets Tab ───────────────────────────────────────────────── */}
      {tab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Agent Budgets</h2>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">+ Set Budget</button>
          </div>

          {showForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent ID</label>
                  <input value={fAgentId} onChange={e => setFAgentId(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. zeus" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent Name</label>
                  <input value={fAgentName} onChange={e => setFAgentName(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Zeus" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regiment</label>
                  <input value={fRegiment} onChange={e => setFRegiment(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Olympian" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                  <select value={fPeriod} onChange={e => setFPeriod(e.target.value as any)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (USD)</label>
                  <input type="number" value={fAllocated} onChange={e => setFAllocated(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="100" />
                </div>
              </div>
              <button onClick={addBudget} disabled={!fAgentId || !fAllocated} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">Set Budget</button>
            </div>
          )}

          {/* Burn rate detail */}
          {burnRate && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-emerald-300 dark:border-emerald-700">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium dark:text-white">Burn Rate — {selectedAgent}</h3>
                <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold dark:text-white">${burnRate.dailyAvgUsd.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Daily Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold dark:text-white">${burnRate.weeklyAvgUsd.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Weekly Avg</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold dark:text-white">${burnRate.projectedMonthEndUsd.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">Projected Month-End</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold dark:text-white">{burnRate.daysUntilBudgetExhausted ?? '∞'}</div>
                  <div className="text-xs text-gray-500">Days Until Exhausted</div>
                </div>
              </div>
              <div className="text-center mt-3">
                <span className="text-lg">{TREND_ICONS[burnRate.trend]}</span>
                <span className="text-sm text-gray-500 ml-1 capitalize">{burnRate.trend}</span>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {budgets.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No budgets set. Allocate budgets to start tracking agent costs.</div>}
            {budgets.map(b => {
              const p = pct(b.spentUsd, b.allocatedUsd);
              return (
                <div key={b.agentId} onClick={() => setSelectedAgent(b.agentId)} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-pointer hover:ring-2 hover:ring-emerald-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium dark:text-white">{b.agentName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{b.regiment} · {b.period} · {b.taskCount} tasks</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold dark:text-white">${b.spentUsd.toFixed(2)} <span className="text-gray-400 font-normal">/ ${b.allocatedUsd.toFixed(0)}</span></div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${p >= 100 ? 'bg-red-100 text-red-700' : p >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{p}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${pctColor(p)}`} style={{ width: `${Math.min(100, p)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Spend Tab ─────────────────────────────────────────────────── */}
      {tab === 'spend' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Spend Log</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Task</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Agent</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Model</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Tokens</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Cost</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {spend.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No spend entries yet.</td></tr>}
                {spend.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 dark:text-white truncate max-w-xs">{s.taskDescription}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.agentId}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.model}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.tokenCount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium dark:text-white">${s.costUsd.toFixed(4)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Alerts Tab ────────────────────────────────────────────────── */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Cost Alerts</h2>
            <button onClick={fetchAll} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white">Refresh</button>
          </div>
          <div className="grid gap-3">
            {alerts.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No cost alerts. All agents within budget.</div>}
            {alerts.map(a => (
              <div key={a.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm ${a.acknowledged ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                    <span className="text-xs text-gray-400 uppercase">{a.type.replace(/_/g, ' ')}</span>
                  </div>
                  {!a.acknowledged && (
                    <button onClick={() => ackAlert(a.id)} className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white">Acknowledge</button>
                  )}
                </div>
                <p className="text-sm dark:text-white">{a.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
