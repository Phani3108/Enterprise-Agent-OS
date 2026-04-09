/**
 * ProtocolMonitor — Real-time dashboard for UTCP, A2A, MCP, and Agent Runtime.
 * Shows protocol packets, agent messages, tool executions, and runtime states.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import DemoPreviewBanner from './shared/DemoPreviewBanner';

const API = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

// ── SevenLabs Demo Data ─────────────────────────────────────
const DEMO_UTCP: UTCPTask[] = [
  { task_id: 'utcp-demo-001', workflow_id: 'wf-launch', function: 'cross-functional', stage: 'executing', intent: 'Launch Credit Card Modernization v2 for community banks', status: 'executing', confidence: 0.88, progress: 65, created_at: '2026-04-09T09:00:00Z', updated_at: '2026-04-09T10:15:00Z' },
  { task_id: 'utcp-demo-002', workflow_id: 'wf-pr-review', function: 'engineering', stage: 'reviewing', intent: 'Review PR #847 — payment gateway integration', status: 'completed', confidence: 0.94, progress: 100, created_at: '2026-04-09T08:30:00Z', updated_at: '2026-04-09T08:42:00Z' },
  { task_id: 'utcp-demo-003', workflow_id: 'wf-jd', function: 'ta', stage: 'completed', intent: 'Generate JD for Senior Backend Engineer — Payments Team', status: 'completed', confidence: 0.91, progress: 100, created_at: '2026-04-08T14:00:00Z', updated_at: '2026-04-08T14:08:00Z' },
  { task_id: 'utcp-demo-004', workflow_id: 'wf-incident', function: 'engineering', stage: 'completed', intent: 'Triage and resolve Payments API 503 spike', status: 'completed', confidence: 0.95, progress: 100, created_at: '2026-04-08T14:25:00Z', updated_at: '2026-04-08T14:45:00Z' },
  { task_id: 'utcp-demo-005', workflow_id: 'wf-roadmap', function: 'product', stage: 'planning', intent: 'Score and prioritize Q3 roadmap initiatives', status: 'pending', confidence: 0, progress: 0, created_at: '2026-04-09T10:00:00Z', updated_at: '2026-04-09T10:00:00Z' },
];
const DEMO_A2A: A2AMsg[] = [
  { message_id: 'a2a-d1', type: 'delegate', sender: { name: 'Colonel Chronos', persona: 'Program' }, receiver: { name: 'Captain Odin', persona: 'Product' }, status: 'responded', priority: 'high', timestamps: { sent: '2026-04-09T09:01:00Z' } },
  { message_id: 'a2a-d2', type: 'review', sender: { name: 'Captain Prometheus', persona: 'Engineering' }, receiver: { name: 'Colonel Atlas', persona: 'Engineering' }, status: 'responded', priority: 'medium', timestamps: { sent: '2026-04-09T08:35:00Z' } },
  { message_id: 'a2a-d3', type: 'approve', sender: { name: 'Colonel Atlas', persona: 'Engineering' }, receiver: { name: 'Captain Prometheus', persona: 'Engineering' }, status: 'responded', priority: 'high', timestamps: { sent: '2026-04-09T08:40:00Z' } },
  { message_id: 'a2a-d4', type: 'delegate', sender: { name: 'Colonel Hyperion', persona: 'Marketing' }, receiver: { name: 'Captain Iris', persona: 'Marketing' }, status: 'processing', priority: 'medium', timestamps: { sent: '2026-04-09T09:15:00Z' } },
  { message_id: 'a2a-d5', type: 'query', sender: { name: 'Colonel Rhea', persona: 'HR' }, receiver: { name: 'Captain Prometheus', persona: 'Engineering' }, status: 'responded', priority: 'medium', timestamps: { sent: '2026-04-08T15:00:00Z' } },
  { message_id: 'a2a-d6', type: 'escalate', sender: { name: 'Captain Prometheus', persona: 'Engineering' }, receiver: { name: 'Colonel Atlas', persona: 'Engineering' }, status: 'responded', priority: 'critical', timestamps: { sent: '2026-04-08T14:30:00Z' } },
];
const DEMO_MCP: MCPLog[] = [
  { action_id: 'mcp-d1', tool_id: 'jira', action: 'create', status: 'success', latency_ms: 340, metadata: { request_at: '2026-04-09T09:05:00Z' } },
  { action_id: 'mcp-d2', tool_id: 'github', action: 'read', status: 'success', latency_ms: 180, metadata: { request_at: '2026-04-09T08:31:00Z' } },
  { action_id: 'mcp-d3', tool_id: 'hubspot', action: 'create', status: 'success', latency_ms: 520, metadata: { request_at: '2026-04-09T09:20:00Z' } },
  { action_id: 'mcp-d4', tool_id: 'slack', action: 'create', status: 'success', latency_ms: 95, metadata: { request_at: '2026-04-08T14:45:00Z' } },
];
const DEMO_MCP_STATS: Record<string, ToolStat> = {
  jira: { calls: 24, success: 23, errors: 1, avg_latency_ms: 310 },
  github: { calls: 18, success: 18, errors: 0, avg_latency_ms: 165 },
  hubspot: { calls: 12, success: 11, errors: 1, avg_latency_ms: 480 },
  slack: { calls: 31, success: 31, errors: 0, avg_latency_ms: 88 },
  confluence: { calls: 9, success: 9, errors: 0, avg_latency_ms: 220 },
};
const DEMO_RUNTIMES: AgentRT[] = [
  { runtime_id: 'rt-d1', agent_id: 'iris', agent_name: 'Captain Iris', regiment: 'Titan', persona: 'Marketing', type: 'persistent', state: 'thinking', reasoning: { current_iteration: 3, total_confidence: 0.85 }, metrics: { total_executions: 14, success_rate: 0.93, total_cost_usd: 3.41 } },
  { runtime_id: 'rt-d2', agent_id: 'prometheus', agent_name: 'Captain Prometheus', regiment: 'Olympian', persona: 'Engineering', type: 'persistent', state: 'acting', reasoning: { current_iteration: 2, total_confidence: 0.91 }, metrics: { total_executions: 22, success_rate: 0.96, total_cost_usd: 5.82 } },
  { runtime_id: 'rt-d3', agent_id: 'odin', agent_name: 'Captain Odin', regiment: 'Asgard', persona: 'Product', type: 'persistent', state: 'idle', reasoning: { current_iteration: 0, total_confidence: 0 }, metrics: { total_executions: 8, success_rate: 0.88, total_cost_usd: 1.94 } },
];
const DEMO_COSTS: CostMeter = {
  totalCostUsd: 12.47, totalCalls: 47, costByProvider: { anthropic: 9.20, openai: 3.27 },
  costByModel: { 'claude-sonnet-4-6': 7.80, 'claude-haiku': 1.40, 'gpt-4o-mini': 3.27 },
  costByPersona: { marketing: 5.10, engineering: 4.80, ta: 1.47, product: 1.10 },
  hourlyCostUsd: 3.82, hourlyBudgetUsd: 50, budgetUtilization: 7.6,
};

// ── Types ───────────────────────────────────────────────────────
type Tab = 'utcp' | 'a2a' | 'mcp' | 'runtime' | 'costs';

interface UTCPTask { task_id: string; workflow_id: string; function: string; stage: string; intent: string; status: string; confidence: number; progress: number; created_at: string; updated_at: string }
interface A2AMsg { message_id: string; type: string; sender: { name: string; persona: string }; receiver: { name: string; persona: string }; status: string; priority: string; timestamps: { sent: string } }
interface MCPLog { action_id: string; tool_id: string; action: string; status: string; latency_ms: number; metadata: { request_at: string } }
interface AgentRT { runtime_id: string; agent_id: string; agent_name: string; regiment: string; persona: string; type: string; state: string; reasoning: { current_iteration: number; total_confidence: number }; metrics: { total_executions: number; success_rate: number; total_cost_usd: number } }
interface CostMeter { totalCostUsd: number; totalCalls: number; costByProvider: Record<string, number>; costByModel: Record<string, number>; costByPersona: Record<string, number>; hourlyCostUsd: number; hourlyBudgetUsd: number; budgetUtilization: number }
interface ToolStat { calls: number; success: number; errors: number; avg_latency_ms: number }

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-neutral', planning: 'badge-info', executing: 'badge-info',
  reviewing: 'badge-warning', completed: 'badge-success', failed: 'badge-danger',
  awaiting_approval: 'badge-warning', cancelled: 'badge-neutral',
  sent: 'badge-info', received: 'badge-info', processing: 'badge-warning',
  responded: 'badge-success', success: 'badge-success', error: 'badge-danger',
  idle: 'badge-neutral', thinking: 'badge-info', acting: 'badge-warning',
  observing: 'badge-info', terminated: 'badge-neutral',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-slate-500', medium: 'text-blue-600', high: 'text-orange-600', critical: 'text-red-600',
};

// ═══════════════════════════════════════════════════════════════
export default function ProtocolMonitor() {
  const [tab, setTab] = useState<Tab>('utcp');
  const [utcpTasks, setUtcpTasks] = useState<UTCPTask[]>([]);
  const [a2aMessages, setA2aMessages] = useState<A2AMsg[]>([]);
  const [mcpLog, setMcpLog] = useState<MCPLog[]>([]);
  const [mcpStats, setMcpStats] = useState<Record<string, ToolStat>>({});
  const [runtimes, setRuntimes] = useState<AgentRT[]>([]);
  const [costMeter, setCostMeter] = useState<CostMeter | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [utcp, a2a, mcp, mcpS, rt, costs] = await Promise.all([
        fetch(`${API}/api/utcp/tasks?limit=30`).then(r => r.json()).catch(() => ({ tasks: [] })),
        fetch(`${API}/api/a2a/messages?limit=30`).then(r => r.json()).catch(() => ({ messages: [] })),
        fetch(`${API}/api/mcp/log?limit=30`).then(r => r.json()).catch(() => ({ log: [] })),
        fetch(`${API}/api/mcp/stats`).then(r => r.json()).catch(() => ({ stats: {} })),
        fetch(`${API}/api/runtime/agents`).then(r => r.json()).catch(() => ({ agents: [] })),
        fetch(`${API}/api/costs/meter`).then(r => r.json()).catch(() => null),
      ]);
      const hasData = (utcp.tasks?.length || a2a.messages?.length || mcp.log?.length || rt.agents?.length);
      if (hasData) {
        setUtcpTasks(utcp.tasks || []); setA2aMessages(a2a.messages || []);
        setMcpLog(mcp.log || []); setMcpStats(mcpS.stats || {});
        setRuntimes(rt.agents || []); setCostMeter(costs); setIsDemo(false);
      } else {
        setUtcpTasks(DEMO_UTCP); setA2aMessages(DEMO_A2A);
        setMcpLog(DEMO_MCP); setMcpStats(DEMO_MCP_STATS);
        setRuntimes(DEMO_RUNTIMES); setCostMeter(DEMO_COSTS); setIsDemo(true);
      }
    } catch {
      setUtcpTasks(DEMO_UTCP); setA2aMessages(DEMO_A2A);
      setMcpLog(DEMO_MCP); setMcpStats(DEMO_MCP_STATS);
      setRuntimes(DEMO_RUNTIMES); setCostMeter(DEMO_COSTS); setIsDemo(true);
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);
  // Auto-refresh every 10s
  useEffect(() => { const t = setInterval(refresh, 10000); return () => clearInterval(t); }, []);

  const TABS: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: 'utcp', label: 'UTCP Tasks', icon: '📋', count: utcpTasks.length },
    { id: 'a2a', label: 'A2A Messages', icon: '🔗', count: a2aMessages.length },
    { id: 'mcp', label: 'MCP Tools', icon: '🔌', count: mcpLog.length },
    { id: 'runtime', label: 'Agent Runtime', icon: '🤖', count: runtimes.length },
    { id: 'costs', label: 'Cost Meter', icon: '💰', count: 0 },
  ];

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Protocol Monitor</h1>
            <p className="page-subtitle">Real-time visibility into UTCP, A2A, MCP, and Agent Runtime</p>
          </div>
          <button onClick={refresh} disabled={loading} className="btn btn-secondary btn-sm">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {isDemo && <DemoPreviewBanner pageName="Protocol Monitor" steps={[
          'Start the gateway — protocols track every execution in real-time',
          'Execute a skill in any workspace or launch a swarm',
          'Watch UTCP packets, A2A agent messages, and MCP tool calls appear live',
        ]} />}

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              <span>{t.icon}</span>
              {t.label}
              {t.count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-700 text-white text-[9px]">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* ═══ UTCP TAB ═══ */}
        {tab === 'utcp' && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <span className="card-title">UTCP Task Packets</span>
              <span className="text-xs text-slate-500">{utcpTasks.length} packets</span>
            </div>
            <div className="divide-y divide-slate-100">
              {utcpTasks.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No UTCP packets yet. Execute a skill or launch a swarm to generate packets.</div>}
              {utcpTasks.map(t => (
                <div key={t.task_id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-slate-500 font-mono">{t.task_id.slice(0, 20)}...</code>
                      <span className={`badge ${STATUS_COLORS[t.status] || 'badge-neutral'}`}>{t.status}</span>
                      <span className="badge badge-neutral">{t.function}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-slate-800 truncate">{t.intent}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span>Stage: {t.stage}</span>
                    <span>Confidence: {(t.confidence * 100).toFixed(0)}%</span>
                    <span>Progress: {t.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ A2A TAB ═══ */}
        {tab === 'a2a' && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <span className="card-title">Agent-to-Agent Messages</span>
              <span className="text-xs text-slate-500">{a2aMessages.length} messages</span>
            </div>
            <div className="divide-y divide-slate-100">
              {a2aMessages.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No A2A messages yet. Launch a swarm or start a meeting to see agent communication.</div>}
              {a2aMessages.map(m => (
                <div key={m.message_id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STATUS_COLORS[m.status] || 'badge-neutral'}`}>{m.type}</span>
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[m.priority] || ''}`}>{m.priority}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(m.timestamps.sent).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-blue-700">{m.sender?.name}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium text-violet-700">{m.receiver?.name}</span>
                  </div>
                  <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                    <span>{m.sender?.persona}</span>
                    <span>→</span>
                    <span>{m.receiver?.persona}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MCP TAB ═══ */}
        {tab === 'mcp' && (
          <div className="space-y-5">
            {/* Tool Stats */}
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(mcpStats).map(([toolId, stat]) => (
                <div key={toolId} className="card p-4">
                  <h4 className="text-xs font-semibold text-slate-900 mb-2">{toolId}</h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span className="text-slate-500">Calls:</span> <span className="font-mono font-bold">{stat.calls}</span></div>
                    <div><span className="text-slate-500">Success:</span> <span className="font-mono font-bold text-emerald-600">{stat.success}</span></div>
                    <div><span className="text-slate-500">Errors:</span> <span className="font-mono font-bold text-red-600">{stat.errors}</span></div>
                    <div><span className="text-slate-500">Latency:</span> <span className="font-mono font-bold">{stat.avg_latency_ms}ms</span></div>
                  </div>
                </div>
              ))}
              {Object.keys(mcpStats).length === 0 && <div className="col-span-4 card p-8 text-center text-sm text-slate-400">No MCP tool calls yet.</div>}
            </div>

            {/* Recent calls */}
            <div className="card overflow-hidden">
              <div className="card-header">
                <span className="card-title">Recent Tool Calls</span>
              </div>
              <div className="divide-y divide-slate-100">
                {mcpLog.map(l => (
                  <div key={l.action_id} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${STATUS_COLORS[l.status] || 'badge-neutral'}`}>{l.status}</span>
                      <span className="text-sm font-medium text-slate-900">{l.tool_id}</span>
                      <span className="text-xs text-slate-500">{l.action}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">{l.latency_ms}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ RUNTIME TAB ═══ */}
        {tab === 'runtime' && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <span className="card-title">Agent Runtimes</span>
              <span className="text-xs text-slate-500">{runtimes.filter(r => r.state !== 'idle' && r.state !== 'terminated').length} active</span>
            </div>
            <div className="divide-y divide-slate-100">
              {runtimes.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No agent runtimes created yet. Launch a swarm to spawn ephemeral agents.</div>}
              {runtimes.map(r => (
                <div key={r.runtime_id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.state === 'idle' ? 'bg-slate-300' : r.state === 'terminated' ? 'bg-red-400' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className="text-sm font-semibold text-slate-900">{r.agent_name}</span>
                      <span className={`badge ${STATUS_COLORS[r.state] || 'badge-neutral'}`}>{r.state}</span>
                      <span className="badge badge-neutral">{r.type}</span>
                    </div>
                    <span className="text-xs text-slate-500">{r.regiment} &middot; {r.persona}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1">
                    <span>Iterations: {r.reasoning.current_iteration}</span>
                    <span>Confidence: {(r.reasoning.total_confidence * 100).toFixed(0)}%</span>
                    <span>Executions: {r.metrics.total_executions}</span>
                    <span>Success: {(r.metrics.success_rate * 100).toFixed(0)}%</span>
                    <span>Cost: ${r.metrics.total_cost_usd.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ COSTS TAB ═══ */}
        {tab === 'costs' && costMeter && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-2xl font-bold text-slate-800">${costMeter.totalCostUsd.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Total Cost</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-slate-800">{costMeter.totalCalls}</p>
                <p className="text-xs text-slate-500 mt-1">Total LLM Calls</p>
              </div>
              <div className="card p-4">
                <p className={`text-2xl font-bold ${costMeter.budgetUtilization > 80 ? 'text-red-600' : costMeter.budgetUtilization > 50 ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {costMeter.budgetUtilization.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Budget Used (Hourly)</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-slate-800">${costMeter.hourlyCostUsd.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">This Hour / ${costMeter.hourlyBudgetUsd}</p>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-3 gap-5">
              <div className="card p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Provider</h3>
                {Object.entries(costMeter.costByProvider).map(([provider, cost]) => (
                  <div key={provider} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700">{provider}</span>
                    <span className="text-sm font-mono font-bold text-slate-900">${cost.toFixed(3)}</span>
                  </div>
                ))}
                {Object.keys(costMeter.costByProvider).length === 0 && <p className="text-xs text-slate-400">No cost data yet</p>}
              </div>
              <div className="card p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Model</h3>
                {Object.entries(costMeter.costByModel).map(([model, cost]) => (
                  <div key={model} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700 truncate">{model}</span>
                    <span className="text-sm font-mono font-bold text-slate-900">${cost.toFixed(3)}</span>
                  </div>
                ))}
                {Object.keys(costMeter.costByModel).length === 0 && <p className="text-xs text-slate-400">No cost data yet</p>}
              </div>
              <div className="card p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Persona</h3>
                {Object.entries(costMeter.costByPersona).map(([persona, cost]) => (
                  <div key={persona} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-700">{persona}</span>
                    <span className="text-sm font-mono font-bold text-slate-900">${cost.toFixed(3)}</span>
                  </div>
                ))}
                {Object.keys(costMeter.costByPersona).length === 0 && <p className="text-xs text-slate-400">No cost data yet</p>}
              </div>
            </div>
          </div>
        )}
        {tab === 'costs' && !costMeter && (
          <div className="card p-8 text-center text-sm text-slate-400">Cost meter unavailable. Gateway may not be running.</div>
        )}
      </div>
    </div>
  );
}
