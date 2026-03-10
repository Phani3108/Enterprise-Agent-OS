'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetricTile {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
  color: string;
  sparkline: number[];
}

interface AgentRow {
  id: string;
  name: string;
  persona: string;
  model: string;
  status: 'active' | 'idle' | 'running' | 'beta';
  tokensUsed: number;
  lastAction: string;
  lastActionAt: string;
  successRate: number;
}

interface RouteDecision {
  id: string;
  query: string;
  persona: string;
  skill: string;
  confidence: number;
  latencyMs: number;
  time: string;
}

interface LogRow {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  createdAt: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  service?: string;
  time: string;
  resolved: boolean;
}

interface ServiceRow {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptime: number;
}

// ---------------------------------------------------------------------------
// Mini SVG Sparkline
// ---------------------------------------------------------------------------

function Sparkline({ values, color = '#10b981', height = 32 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_AGENTS: AgentRow[] = [
  { id: 'a1', name: 'Campaign Strategist',    persona: 'Marketing',    model: 'claude-sonnet-4-6', status: 'running', tokensUsed: 48200, lastAction: 'Generating campaign brief',       lastActionAt: '30s ago', successRate: 0.92 },
  { id: 'a2', name: 'PR Reviewer',            persona: 'Engineering',  model: 'claude-sonnet-4-6', status: 'active',  tokensUsed: 31400, lastAction: 'Reviewing architecture patterns', lastActionAt: '3m ago',  successRate: 0.95 },
  { id: 'a3', name: 'Incident Analyst',       persona: 'Engineering',  model: 'claude-sonnet-4-6', status: 'running', tokensUsed: 19700, lastAction: 'Analyzing 503 spike on payments', lastActionAt: '12m ago', successRate: 0.88 },
  { id: 'a4', name: 'Product PRD Agent',      persona: 'Product',      model: 'claude-opus-4-6',   status: 'active',  tokensUsed: 62100, lastAction: 'Drafting Q3 product roadmap',    lastActionAt: '8m ago',  successRate: 0.91 },
  { id: 'a5', name: 'Resume Screener',        persona: 'HR',           model: 'claude-haiku-4-5',  status: 'idle',    tokensUsed: 8900,  lastAction: 'Screened 14 applications',       lastActionAt: '18m ago', successRate: 0.87 },
  { id: 'a6', name: 'Finance Forecaster',     persona: 'Finance',      model: 'claude-sonnet-4-6', status: 'idle',    tokensUsed: 14300, lastAction: 'Budget variance analysis',        lastActionAt: '25m ago', successRate: 0.79 },
  { id: 'a7', name: 'Legal Compliance Bot',   persona: 'Legal',        model: 'claude-opus-4-6',   status: 'active',  tokensUsed: 29800, lastAction: 'GDPR policy review completed',   lastActionAt: '31m ago', successRate: 0.96 },
  { id: 'a8', name: 'Sales Intelligence',     persona: 'Sales',        model: 'claude-sonnet-4-6', status: 'idle',    tokensUsed: 22100, lastAction: 'Pipeline signal detected',        lastActionAt: '45m ago', successRate: 0.83 },
];

const SEED_ROUTES: RouteDecision[] = [
  { id: 'r1', query: 'Generate campaign for Q4 launch',              persona: 'Marketing',   skill: 'Campaign Strategy',     confidence: 0.94, latencyMs: 92,  time: '2m ago' },
  { id: 'r2', query: 'Review this PR for security issues',           persona: 'Engineering', skill: 'PR Architecture Review',confidence: 0.97, latencyMs: 78,  time: '5m ago' },
  { id: 'r3', query: 'Create a product roadmap for next quarter',    persona: 'Product',     skill: 'PRD Generator',          confidence: 0.91, latencyMs: 114, time: '8m ago' },
  { id: 'r4', query: 'Analyze the 503 errors on payments service',   persona: 'Engineering', skill: 'Incident Root Cause',    confidence: 0.88, latencyMs: 98,  time: '12m ago' },
  { id: 'r5', query: 'Screen these resumes for senior engineer role',persona: 'HR',          skill: 'Resume Screening',       confidence: 0.93, latencyMs: 65,  time: '18m ago' },
  { id: 'r6', query: 'Forecast next quarter budget variance',        persona: 'Finance',     skill: 'Budget Forecasting',     confidence: 0.76, latencyMs: 104, time: '24m ago' },
];

const SEED_LOGS: LogRow[] = [
  { id: 'l1', level: 'info',  message: 'Gateway started on :3000 — 12 routes registered',                            service: 'gateway',   createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: 'l2', level: 'info',  message: 'Scheduler tick — 0 jobs due',                                                service: 'scheduler', createdAt: new Date(Date.now() - 240000).toISOString() },
  { id: 'l3', level: 'info',  message: 'Skill executed: Campaign Strategy — success, 18.2s, $0.024',                 service: 'runtime',   createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'l4', level: 'warn',  message: 'HubSpot API rate limit at 80% — throttling requests',                        service: 'tools',     createdAt: new Date(Date.now() - 80000).toISOString() },
  { id: 'l5', level: 'info',  message: 'PR Architecture Review completed — 2 suggestions posted',                    service: 'runtime',   createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: 'l6', level: 'error', message: 'Budget Forecast skill failed — timeout after 3.1s (token limit exceeded)',   service: 'runtime',   createdAt: new Date(Date.now() - 40000).toISOString() },
  { id: 'l7', level: 'info',  message: 'Memory graph updated — 8 new edges added from last 3 executions',            service: 'memory',    createdAt: new Date(Date.now() - 20000).toISOString() },
  { id: 'l8', level: 'warn',  message: 'Incident analysis still running — 12m elapsed (timeout: 60m)',               service: 'runtime',   createdAt: new Date(Date.now() - 10000).toISOString() },
];

const SEED_ALERTS: Alert[] = [
  { id: 'al1', severity: 'warning', title: 'HubSpot Rate Limit',        message: 'HubSpot API is at 80% of rate limit. Requests being throttled.', service: 'HubSpot Tool',  time: '1m ago',  resolved: false },
  { id: 'al2', severity: 'error',   title: 'Budget Forecast Failed',     message: 'Finance Forecaster skill timed out after 3s. Token budget exceeded.', service: 'Finance Agent', time: '24m ago', resolved: false },
  { id: 'al3', severity: 'info',    title: 'Memory Graph Compacted',     message: '127 stale edges pruned from memory graph during nightly maintenance.', service: 'Memory',       time: '2h ago',  resolved: true },
  { id: 'al4', severity: 'warning', title: 'Long-running Execution',     message: 'Incident Root Cause analysis has been running for 12 minutes.', service: 'Engineering Agent',time: '12m ago', resolved: false },
  { id: 'al5', severity: 'info',    title: 'New Skill Published',        message: 'PR Architecture Review v2.3 promoted to production tier.', service: 'Marketplace',   time: '6h ago',  resolved: true },
];

const SEED_SERVICES: ServiceRow[] = [
  { name: 'Gateway (API)',     status: 'healthy',  latencyMs: 12,  uptime: 99.97 },
  { name: 'Scheduler',         status: 'healthy',  latencyMs: 4,   uptime: 99.99 },
  { name: 'Memory Graph',      status: 'healthy',  latencyMs: 8,   uptime: 99.95 },
  { name: 'Tool Registry',     status: 'healthy',  latencyMs: 6,   uptime: 99.98 },
  { name: 'Skill Marketplace', status: 'healthy',  latencyMs: 11,  uptime: 99.96 },
  { name: 'Blog Service',      status: 'healthy',  latencyMs: 5,   uptime: 100.00 },
  { name: 'Forum Service',     status: 'healthy',  latencyMs: 7,   uptime: 99.94 },
  { name: 'Intent Engine',     status: 'healthy',  latencyMs: 22,  uptime: 99.91 },
];

const METRIC_TILES: MetricTile[] = [
  { label: 'Agents Active',   value: 8,      sub: '3 running · 5 idle', icon: '🤖', color: 'text-blue-600',    sparkline: [4,5,6,7,6,7,8,8,7,8] },
  { label: 'Skills / Hour',   value: 14,     sub: '+23% vs last hour',   icon: '🔧', color: 'text-emerald-600', sparkline: [8,9,11,10,12,11,13,14,12,14] },
  { label: 'Tool Calls / Hr', value: 87,     sub: '4 tools active',      icon: '🔌', color: 'text-orange-600',  sparkline: [60,65,70,68,72,80,84,87,82,87] },
  { label: 'Error Rate',      value: '2.1%', sub: '↓ 0.4% vs yesterday', icon: '⚠', color: 'text-red-500',     sparkline: [3.2,2.8,2.5,2.7,2.4,2.2,2.5,2.1,2.3,2.1] },
];

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  idle: 'bg-gray-100 text-gray-500',
  running: 'bg-blue-100 text-blue-700',
  beta: 'bg-amber-100 text-amber-700',
  healthy: 'bg-emerald-100 text-emerald-700',
  degraded: 'bg-amber-100 text-amber-700',
  down: 'bg-red-100 text-red-700',
};

const LOG_COLOR: Record<string, string> = {
  debug: 'text-gray-400', info: 'text-blue-600', warn: 'text-amber-600', error: 'text-red-600',
};

const ALERT_COLOR: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50/40',
  warning: 'border-amber-200 bg-amber-50/40',
  error: 'border-red-200 bg-red-50/40',
  critical: 'border-red-300 bg-red-100/40',
};

const ALERT_ICON: Record<string, string> = {
  info: 'ℹ', warning: '⚠', error: '✗', critical: '🚨',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Tab = 'agents' | 'router' | 'logs' | 'alerts' | 'health';

export default function ControlPlane() {
  const [tab, setTab] = useState<Tab>('agents');
  const [logs, setLogs] = useState<LogRow[]>(SEED_LOGS);
  const [tick, setTick] = useState(0);

  // Live log simulation
  useEffect(() => {
    const LIVE_MSGS = [
      { level: 'info' as const, message: 'Intent routed → Marketing / Campaign Strategy (0.94)', service: 'intent' },
      { level: 'info' as const, message: 'Skill execution started: Resume Screening (HR agent)', service: 'runtime' },
      { level: 'debug' as const, message: 'Memory graph sync: 2 new nodes, 5 edges updated', service: 'memory' },
      { level: 'warn' as const, message: 'Token usage at 72% for claude-opus-4-6 budget', service: 'runtime' },
      { level: 'info' as const, message: 'Tool call: GitHub API — list_pull_requests (200 OK, 340ms)', service: 'tools' },
      { level: 'info' as const, message: 'Scheduler tick — 0 jobs due, next in 32s', service: 'scheduler' },
    ];
    const t = setInterval(() => {
      const msg = LIVE_MSGS[tick % LIVE_MSGS.length];
      setLogs(prev => [...prev.slice(-50), {
        id: `live-${Date.now()}`,
        level: msg.level,
        message: msg.message,
        service: msg.service,
        createdAt: new Date().toISOString(),
      }]);
      setTick(n => n + 1);
    }, 3500);
    return () => clearInterval(t);
  }, [tick]);

  const fmtTime = useCallback((iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, []);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'agents', label: 'Agent Runtime' },
    { id: 'router', label: 'Skill Router' },
    { id: 'logs',   label: 'Execution Logs' },
    { id: 'alerts', label: `Alerts (${SEED_ALERTS.filter(a => !a.resolved).length})` },
    { id: 'health', label: 'Service Health' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-gray-900">Control Plane</h1>
          <p className="text-xs text-gray-500 mt-0.5">Platform-wide monitoring and agent runtime status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems nominal
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Metric tiles */}
          <div className="grid grid-cols-4 gap-4">
            {METRIC_TILES.map(tile => (
              <div key={tile.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">{tile.label}</span>
                  <span className="text-sm">{tile.icon}</span>
                </div>
                <p className={`text-2xl font-bold ${tile.color}`}>{tile.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{tile.sub}</p>
                <div className="mt-2 opacity-60">
                  <Sparkline values={tile.sparkline} color={
                    tile.color.includes('blue') ? '#3b82f6' :
                    tile.color.includes('emerald') ? '#10b981' :
                    tile.color.includes('orange') ? '#f97316' : '#ef4444'
                  } height={28} />
                </div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'text-gray-900 border-b-2 border-gray-900 -mb-px'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              {/* Agent Runtime Tab */}
              {tab === 'agents' && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Agent</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Persona</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Model</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Status</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Tokens</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Success</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Last Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {SEED_AGENTS.map(agent => (
                      <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{agent.name}</td>
                        <td className="px-4 py-3 text-gray-500">{agent.persona}</td>
                        <td className="px-4 py-3 font-mono text-gray-400 text-[10px]">{agent.model}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[agent.status]}`}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 font-mono">
                          {(agent.tokensUsed / 1000).toFixed(1)}K
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${agent.successRate >= 0.9 ? 'text-emerald-600' : agent.successRate >= 0.8 ? 'text-amber-600' : 'text-red-500'}`}>
                            {Math.round(agent.successRate * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{agent.lastAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Skill Router Tab */}
              {tab === 'router' && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Query</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Persona</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Skill</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Confidence</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Latency</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {SEED_ROUTES.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 max-w-[220px] truncate">{r.query}</td>
                        <td className="px-4 py-3 text-gray-500">{r.persona}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.skill}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${r.confidence >= 0.9 ? 'text-emerald-600' : r.confidence >= 0.8 ? 'text-amber-600' : 'text-red-500'}`}>
                            {Math.round(r.confidence * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-400">{r.latencyMs}ms</td>
                        <td className="px-4 py-3 text-gray-400">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Execution Logs Tab */}
              {tab === 'logs' && (
                <div className="p-4 space-y-1.5 font-mono text-[11px] max-h-[400px] overflow-y-auto">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span className="text-gray-300 flex-shrink-0 w-20 text-[10px]">{fmtTime(log.createdAt)}</span>
                      <span className={`font-semibold uppercase text-[9px] flex-shrink-0 w-8 mt-0.5 ${LOG_COLOR[log.level]}`}>{log.level}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0">{log.service}</span>
                      <span className="text-gray-700 leading-relaxed">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Alerts Tab */}
              {tab === 'alerts' && (
                <div className="p-4 space-y-2.5">
                  {SEED_ALERTS.map(alert => (
                    <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${ALERT_COLOR[alert.severity]} ${alert.resolved ? 'opacity-50' : ''}`}>
                      <span className="text-base flex-shrink-0 mt-0.5">{ALERT_ICON[alert.severity]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-gray-900">{alert.title}</p>
                          {alert.resolved && (
                            <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">resolved</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {alert.service && (
                            <span className="text-[10px] text-gray-400">{alert.service}</span>
                          )}
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">{alert.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Service Health Tab */}
              {tab === 'health' && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Service</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Status</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Latency</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Uptime (30d)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {SEED_SERVICES.map(svc => (
                      <tr key={svc.name} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{svc.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[svc.status]}`}>
                            {svc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">{svc.latencyMs}ms</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-emerald-600">{svc.uptime.toFixed(2)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
