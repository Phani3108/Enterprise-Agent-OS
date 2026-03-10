'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TraceSpan {
  id: string;
  name: string;
  kind: 'workflow' | 'task' | 'llm_call' | 'tool_call' | 'memory_retrieval' | 'policy_check' | 'reflection';
  status: 'running' | 'completed' | 'failed';
  durationMs: number;
  depth: number;
  model?: string;
  tokens?: number;
  error?: string;
}

interface WorkflowExecution {
  id: string;
  name: string;
  skillName: string;
  persona: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  durationMs: number;
  agentCount: number;
  toolCalls: number;
  tokensUsed: number;
  cost: number;
  spans: TraceSpan[];
}

interface AgentActivity {
  id: string;
  agentName: string;
  agentType: string;
  action: string;
  status: 'active' | 'idle' | 'error';
  skillName: string;
  startedAt: string;
  durationMs: number;
  model: string;
  tokensIn: number;
  tokensOut: number;
  persona: string;
}

interface ApiLog {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  userId: string;
  requestSize: number;
  responseSize: number;
  error?: string;
}

interface SystemMetric {
  ts: string;
  cpu: number;
  memory: number;
  requests: number;
  latency: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Sample Data
// ---------------------------------------------------------------------------

function generateSpans(name: string): TraceSpan[] {
  return [
    { id: 's1', name, kind: 'workflow', status: 'completed', durationMs: 18200 + Math.floor(Math.random() * 5000), depth: 0 },
    { id: 's2', name: 'ICP Analysis', kind: 'task', status: 'completed', durationMs: 3200, depth: 1 },
    { id: 's3', name: 'Memory Retrieval: CRM', kind: 'memory_retrieval', status: 'completed', durationMs: 420, depth: 2 },
    { id: 's4', name: 'LLM: Analyze segments', kind: 'llm_call', status: 'completed', durationMs: 2100, depth: 2, model: 'claude-sonnet-4-6', tokens: 3200 },
    { id: 's5', name: 'Market Research', kind: 'task', status: 'completed', durationMs: 4100, depth: 1 },
    { id: 's6', name: 'Tool: GA4 Query', kind: 'tool_call', status: 'completed', durationMs: 1200, depth: 2 },
    { id: 's7', name: 'LLM: Interpret signals', kind: 'llm_call', status: 'completed', durationMs: 1800, depth: 2, model: 'claude-haiku-4-5', tokens: 1500 },
    { id: 's8', name: 'Policy Check', kind: 'policy_check', status: 'completed', durationMs: 45, depth: 2 },
    { id: 's9', name: 'Strategy Generation', kind: 'task', status: 'completed', durationMs: 5400, depth: 1 },
    { id: 's10', name: 'LLM: Generate strategy', kind: 'llm_call', status: 'completed', durationMs: 4200, depth: 2, model: 'claude-opus-4-6', tokens: 6100 },
    { id: 's11', name: 'Hallucination Check', kind: 'reflection', status: 'completed', durationMs: 1800, depth: 2 },
  ];
}

const SAMPLE_EXECUTIONS: WorkflowExecution[] = [
  {
    id: 'exec-1', name: 'Campaign Strategy', skillName: 'Campaign Strategy Generator', persona: 'Marketing',
    status: 'completed', startedAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 18200,
    agentCount: 4, toolCalls: 6, tokensUsed: 10800, cost: 0.054,
    spans: generateSpans('Campaign Strategy'),
  },
  {
    id: 'exec-2', name: 'PR Architecture Review', skillName: 'PR Architecture Review', persona: 'Engineering',
    status: 'completed', startedAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 62400,
    agentCount: 2, toolCalls: 3, tokensUsed: 8200, cost: 0.041,
    spans: generateSpans('PR Architecture Review'),
  },
  {
    id: 'exec-3', name: 'Incident Root Cause', skillName: 'Incident Root Cause Analysis', persona: 'Engineering',
    status: 'failed', startedAt: new Date(Date.now() - 1800000).toISOString(), durationMs: 30000,
    agentCount: 3, toolCalls: 2, tokensUsed: 4100, cost: 0.021,
    spans: [
      { id: 's1', name: 'Incident RCA', kind: 'workflow', status: 'failed', durationMs: 30000, depth: 0 },
      { id: 's2', name: 'Log Retrieval', kind: 'tool_call', status: 'completed', durationMs: 1200, depth: 1 },
      { id: 's3', name: 'LLM: Analyze logs', kind: 'llm_call', status: 'failed', durationMs: 30000, depth: 1, model: 'claude-sonnet-4-6', error: 'Context window exceeded' },
    ],
  },
  {
    id: 'exec-4', name: 'Sprint Planning', skillName: 'Sprint Planning', persona: 'Engineering',
    status: 'running', startedAt: new Date(Date.now() - 120000).toISOString(), durationMs: 120000,
    agentCount: 3, toolCalls: 4, tokensUsed: 5400, cost: 0.027,
    spans: [
      { id: 's1', name: 'Sprint Planning', kind: 'workflow', status: 'running', durationMs: 120000, depth: 0 },
      { id: 's2', name: 'Jira Backlog Fetch', kind: 'tool_call', status: 'completed', durationMs: 800, depth: 1 },
      { id: 's3', name: 'LLM: Prioritize stories', kind: 'llm_call', status: 'running', durationMs: 0, depth: 1, model: 'claude-sonnet-4-6' },
    ],
  },
  {
    id: 'exec-5', name: 'ICP Analysis', skillName: 'ICP Analysis', persona: 'Marketing',
    status: 'completed', startedAt: new Date(Date.now() - 14400000).toISOString(), durationMs: 15600,
    agentCount: 2, toolCalls: 5, tokensUsed: 7200, cost: 0.036,
    spans: generateSpans('ICP Analysis'),
  },
];

const SAMPLE_AGENTS: AgentActivity[] = [
  { id: 'a1', agentName: 'Research Agent', agentType: 'research', action: 'Analyzing market segments', status: 'active', skillName: 'Campaign Strategy', startedAt: new Date(Date.now() - 45000).toISOString(), durationMs: 45000, model: 'claude-haiku-4-5', tokensIn: 2400, tokensOut: 1800, persona: 'Marketing' },
  { id: 'a2', agentName: 'Content Agent', agentType: 'generation', action: 'Generating campaign copy', status: 'active', skillName: 'Campaign Strategy', startedAt: new Date(Date.now() - 12000).toISOString(), durationMs: 12000, model: 'claude-opus-4-6', tokensIn: 3200, tokensOut: 4100, persona: 'Marketing' },
  { id: 'a3', agentName: 'PR Review Agent', agentType: 'review', action: 'Idle — waiting for PR trigger', status: 'idle', skillName: 'PR Architecture Review', startedAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 0, model: 'claude-sonnet-4-6', tokensIn: 0, tokensOut: 0, persona: 'Engineering' },
  { id: 'a4', agentName: 'Sprint Agent', agentType: 'planning', action: 'Prioritizing backlog items', status: 'active', skillName: 'Sprint Planning', startedAt: new Date(Date.now() - 90000).toISOString(), durationMs: 90000, model: 'claude-sonnet-4-6', tokensIn: 5400, tokensOut: 2800, persona: 'Engineering' },
  { id: 'a5', agentName: 'Security Agent', agentType: 'security', action: 'Last scan: 2h ago', status: 'idle', skillName: 'PR Architecture Review', startedAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 0, model: 'claude-sonnet-4-6', tokensIn: 0, tokensOut: 0, persona: 'Engineering' },
  { id: 'a6', agentName: 'Jira Agent', agentType: 'integration', action: 'Error: rate limit hit', status: 'error', skillName: 'Sprint Planning', startedAt: new Date(Date.now() - 300000).toISOString(), durationMs: 300000, model: 'claude-haiku-4-5', tokensIn: 1200, tokensOut: 0, persona: 'Engineering' },
];

const SAMPLE_API_LOGS: ApiLog[] = [
  { id: 'req-1', method: 'POST', path: '/api/marketplace/skills/sprint-planner/run', status: 200, durationMs: 124, timestamp: new Date(Date.now() - 5000).toISOString(), userId: 'user-1', requestSize: 512, responseSize: 2048 },
  { id: 'req-2', method: 'GET', path: '/api/personas', status: 200, durationMs: 18, timestamp: new Date(Date.now() - 8000).toISOString(), userId: 'user-1', requestSize: 0, responseSize: 4096 },
  { id: 'req-3', method: 'POST', path: '/api/intent/route', status: 200, durationMs: 89, timestamp: new Date(Date.now() - 12000).toISOString(), userId: 'user-2', requestSize: 256, responseSize: 1024 },
  { id: 'req-4', method: 'GET', path: '/api/marketplace/skills', status: 200, durationMs: 32, timestamp: new Date(Date.now() - 18000).toISOString(), userId: 'user-3', requestSize: 0, responseSize: 8192 },
  { id: 'req-5', method: 'POST', path: '/api/marketplace/skills/incident-rca/run', status: 500, durationMs: 30124, timestamp: new Date(Date.now() - 1800000).toISOString(), userId: 'user-1', requestSize: 1024, responseSize: 256, error: 'Context window exceeded' },
  { id: 'req-6', method: 'GET', path: '/api/memory/recommendations', status: 200, durationMs: 44, timestamp: new Date(Date.now() - 25000).toISOString(), userId: 'user-2', requestSize: 0, responseSize: 2048 },
  { id: 'req-7', method: 'POST', path: '/api/marketplace/skills/campaign-strategy/vote', status: 201, durationMs: 28, timestamp: new Date(Date.now() - 40000).toISOString(), userId: 'user-4', requestSize: 128, responseSize: 512 },
  { id: 'req-8', method: 'GET', path: '/api/health', status: 200, durationMs: 4, timestamp: new Date(Date.now() - 50000).toISOString(), userId: 'system', requestSize: 0, responseSize: 256 },
  { id: 'req-9', method: 'POST', path: '/api/tools/registry', status: 201, durationMs: 56, timestamp: new Date(Date.now() - 3600000).toISOString(), userId: 'user-1', requestSize: 512, responseSize: 1024 },
  { id: 'req-10', method: 'GET', path: '/api/prompts', status: 200, durationMs: 22, timestamp: new Date(Date.now() - 65000).toISOString(), userId: 'user-5', requestSize: 0, responseSize: 16384 },
];

function generateMetrics(): SystemMetric[] {
  const metrics: SystemMetric[] = [];
  for (let i = 29; i >= 0; i--) {
    metrics.push({
      ts: new Date(Date.now() - i * 60000).toISOString(),
      cpu: 20 + Math.random() * 40 + (i < 5 ? 20 : 0),
      memory: 45 + Math.random() * 25,
      requests: Math.floor(Math.random() * 80) + 10,
      latency: 30 + Math.random() * 100 + (i < 3 ? 150 : 0),
      errors: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
    });
  }
  return metrics;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KIND_COLORS: Record<string, { bg: string; text: string }> = {
  workflow: { bg: 'bg-gray-100', text: 'text-gray-600' },
  task: { bg: 'bg-blue-50', text: 'text-blue-600' },
  llm_call: { bg: 'bg-purple-50', text: 'text-purple-600' },
  tool_call: { bg: 'bg-amber-50', text: 'text-amber-600' },
  memory_retrieval: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  policy_check: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  reflection: { bg: 'bg-pink-50', text: 'text-pink-600' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

// ---------------------------------------------------------------------------
// Waterfall Chart
// ---------------------------------------------------------------------------

function WaterfallChart({ spans }: { spans: TraceSpan[] }) {
  const totalMs = spans[0]?.durationMs ?? 1;

  return (
    <div className="space-y-1">
      {spans.map((span, idx) => {
        const c = KIND_COLORS[span.kind] ?? { bg: 'bg-gray-50', text: 'text-gray-500' };
        const barWidth = Math.min(100, Math.max(2, (span.durationMs / totalMs) * 100));

        return (
          <div key={idx} className="flex items-center gap-2 group"
            style={{ paddingLeft: `${span.depth * 20}px` }}>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono uppercase whitespace-nowrap ${c.bg} ${c.text}`}>
              {span.kind.replace(/_/g, ' ')}
            </span>
            <span className={`text-[11px] flex-1 truncate ${
              span.status === 'failed' ? 'text-red-500' :
              span.status === 'running' ? 'text-blue-500 animate-pulse' : 'text-gray-700'
            }`}>
              {span.name}
              {span.error && <span className="ml-1 text-red-400">— {span.error}</span>}
            </span>
            {span.model && (
              <span className="text-[9px] text-gray-400 font-mono hidden group-hover:inline">{span.model}</span>
            )}
            {span.tokens && (
              <span className="text-[9px] text-gray-400 font-mono">{span.tokens}tok</span>
            )}
            <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
              <div
                className={`h-full rounded-full transition-all ${
                  span.status === 'failed' ? 'bg-red-400' :
                  span.status === 'running' ? 'bg-blue-400 animate-pulse' :
                  span.kind === 'llm_call' ? 'bg-purple-400' :
                  span.kind === 'tool_call' ? 'bg-amber-400' :
                  span.kind === 'memory_retrieval' ? 'bg-cyan-400' :
                  'bg-gray-400'
                }`}
                style={{ width: `${span.status === 'running' ? 60 : barWidth}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 font-mono w-10 text-right flex-shrink-0">
              {span.status === 'running' ? '…' : formatMs(span.durationMs)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = 'executions' | 'agents' | 'api' | 'metrics';

// ---------------------------------------------------------------------------
// Workflow Executions Tab
// ---------------------------------------------------------------------------

function WorkflowExecutionsTab() {
  const [selected, setSelected] = useState<WorkflowExecution | null>(null);

  const totalTokens = SAMPLE_EXECUTIONS.reduce((s, e) => s + e.tokensUsed, 0);
  const totalCost = SAMPLE_EXECUTIONS.reduce((s, e) => s + e.cost, 0);
  const successRate = Math.round(
    (SAMPLE_EXECUTIONS.filter((e) => e.status === 'completed').length / SAMPLE_EXECUTIONS.length) * 100
  );
  const avgDuration = SAMPLE_EXECUTIONS.reduce((s, e) => s + e.durationMs, 0) / SAMPLE_EXECUTIONS.length;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List */}
      <div className={`${selected ? 'w-1/2' : 'w-full'} overflow-y-auto border-r border-gray-100`}>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
          {[
            { label: 'Executions', value: String(SAMPLE_EXECUTIONS.length) },
            { label: 'Success Rate', value: `${successRate}%` },
            { label: 'Avg Duration', value: formatMs(avgDuration) },
            { label: 'Total Cost', value: `$${totalCost.toFixed(3)}` },
          ].map((s) => (
            <div key={s.label} className="bg-white px-4 py-3">
              <div className="text-sm font-bold text-gray-800">{s.value}</div>
              <div className="text-[10px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="p-3 space-y-2">
          {SAMPLE_EXECUTIONS.map((exec) => (
            <div
              key={exec.id}
              onClick={() => setSelected(selected?.id === exec.id ? null : exec)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                selected?.id === exec.id
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
              }`}
              data-testid={`exec-row-${exec.id}`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                exec.status === 'completed' ? 'bg-emerald-400' :
                exec.status === 'failed' ? 'bg-red-400' : 'bg-blue-400 animate-pulse'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{exec.skillName}</div>
                <div className="text-[10px] text-gray-400">{exec.persona} · {relativeTime(exec.startedAt)}</div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-shrink-0">
                <span>{exec.agentCount} agents</span>
                <span>{exec.toolCalls} tools</span>
                <span className="font-mono">{formatMs(exec.durationMs)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                  exec.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                  exec.status === 'failed' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>{exec.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="w-1/2 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{selected.skillName}</h3>
              <div className="text-xs text-gray-400 mt-0.5">{selected.persona} · {relativeTime(selected.startedAt)}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Duration', value: formatMs(selected.durationMs) },
              { label: 'Agents', value: String(selected.agentCount) },
              { label: 'Tool Calls', value: String(selected.toolCalls) },
              { label: 'Tokens', value: selected.tokensUsed.toLocaleString() },
              { label: 'Cost', value: `$${selected.cost.toFixed(4)}` },
              { label: 'Status', value: selected.status },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-2.5">
                <div className="text-[9px] text-gray-400">{s.label}</div>
                <div className={`text-xs font-semibold mt-0.5 ${
                  s.label === 'Status' && selected.status === 'failed' ? 'text-red-600' :
                  s.label === 'Status' && selected.status === 'running' ? 'text-blue-600' :
                  'text-gray-800'
                }`}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Execution Trace</div>
          <WaterfallChart spans={selected.spans} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Activity Tab
// ---------------------------------------------------------------------------

function AgentActivityTab() {
  const [agents, setAgents] = useState<AgentActivity[]>(SAMPLE_AGENTS);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) => prev.map((a) =>
        a.status === 'active'
          ? { ...a, durationMs: a.durationMs + 5000, tokensIn: a.tokensIn + Math.floor(Math.random() * 100) }
          : a
      ));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const active = agents.filter((a) => a.status === 'active').length;
  const idle = agents.filter((a) => a.status === 'idle').length;
  const errors = agents.filter((a) => a.status === 'error').length;
  const totalTokens = agents.reduce((s, a) => s + a.tokensIn + a.tokensOut, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
        {[
          { label: 'Active', value: String(active), color: 'text-emerald-600' },
          { label: 'Idle', value: String(idle), color: 'text-gray-500' },
          { label: 'Errors', value: String(errors), color: 'text-red-600' },
          { label: 'Tokens Used', value: totalTokens.toLocaleString(), color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3">
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {agents.map((agent) => (
          <div key={agent.id}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all"
            data-testid={`agent-row-${agent.id}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
              agent.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
              agent.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {agent.agentType === 'research' ? '🔍' : agent.agentType === 'generation' ? '✍️' :
               agent.agentType === 'review' ? '🔎' : agent.agentType === 'planning' ? '📋' :
               agent.agentType === 'security' ? '🛡️' : '🔌'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-gray-800">{agent.agentName}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  agent.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                  agent.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {agent.status === 'active' ? '● active' : agent.status === 'error' ? '● error' : '○ idle'}
                </span>
              </div>
              <div className={`text-[10px] ${agent.status === 'active' ? 'text-gray-600' : 'text-gray-400'}`}>
                {agent.action}
              </div>
              <div className="text-[9px] text-gray-400 mt-0.5">{agent.skillName} · {agent.persona}</div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-gray-400 flex-shrink-0">
              <div className="text-right">
                <div className="font-mono text-gray-600 text-[9px]">{agent.model}</div>
                <div>model</div>
              </div>
              {agent.status === 'active' && (
                <div className="text-right">
                  <div className="text-gray-600 font-mono">{formatMs(agent.durationMs)}</div>
                  <div>running</div>
                </div>
              )}
              <div className="text-right">
                <div className="text-purple-600 font-mono">{(agent.tokensIn + agent.tokensOut).toLocaleString()}</div>
                <div>tokens</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Logs Tab
// ---------------------------------------------------------------------------

function ApiLogsTab() {
  const [logs, setLogs] = useState<ApiLog[]>(SAMPLE_API_LOGS);
  const [filter, setFilter] = useState<'all' | 'errors'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const addRandomLog = useCallback(() => {
    const paths = ['/api/health', '/api/personas', '/api/marketplace/skills', '/api/intent/route', '/api/prompts'];
    const methods: ApiLog['method'][] = ['GET', 'POST', 'GET', 'GET', 'GET'];
    const idx = Math.floor(Math.random() * paths.length);
    const isError = Math.random() > 0.9;
    const newLog: ApiLog = {
      id: `req-${Date.now()}`,
      method: methods[idx],
      path: paths[idx],
      status: isError ? 500 : 200,
      durationMs: Math.floor(Math.random() * 200) + 5,
      timestamp: new Date().toISOString(),
      userId: `user-${Math.ceil(Math.random() * 5)}`,
      requestSize: Math.floor(Math.random() * 1024),
      responseSize: Math.floor(Math.random() * 8192),
      error: isError ? 'Internal server error' : undefined,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(addRandomLog, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, addRandomLog]);

  const filtered = filter === 'errors' ? logs.filter((l) => l.status >= 400) : logs;

  const totalReqs = logs.length;
  const errors = logs.filter((l) => l.status >= 400).length;
  const avgLatency = Math.round(logs.reduce((s, l) => s + l.durationMs, 0) / logs.length);
  const p99 = [...logs].sort((a, b) => b.durationMs - a.durationMs)[Math.floor(logs.length * 0.01)]?.durationMs ?? 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100 flex-shrink-0">
        {[
          { label: 'Requests', value: String(totalReqs) },
          { label: 'Errors', value: String(errors), color: errors > 0 ? 'text-red-600' : undefined },
          { label: 'Avg Latency', value: `${avgLatency}ms` },
          { label: 'P99', value: `${p99}ms` },
        ].map((s) => (
          <div key={s.label} className="bg-white px-4 py-3">
            <div className={`text-sm font-bold ${s.color ?? 'text-gray-800'}`}>{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1">
          {(['all', 'errors'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>{f}</button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-3.5 h-3.5 accent-gray-900" />
          <span className="text-[10px] text-gray-500">Live</span>
          {autoRefresh && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
        </label>
      </div>

      {/* Log table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {['Method', 'Path', 'Status', 'Latency', 'Size', 'User', 'Time'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors" data-testid={`api-log-${log.id}`}>
                <td className="px-3 py-2">
                  <span className={`font-mono font-medium ${
                    log.method === 'GET' ? 'text-emerald-600' :
                    log.method === 'POST' ? 'text-blue-600' :
                    log.method === 'DELETE' ? 'text-red-600' : 'text-amber-600'
                  }`}>{log.method}</span>
                </td>
                <td className="px-3 py-2 font-mono text-gray-700 max-w-[200px] truncate">{log.path}</td>
                <td className="px-3 py-2">
                  <span className={`font-mono font-medium ${
                    log.status < 300 ? 'text-emerald-600' :
                    log.status < 400 ? 'text-amber-600' : 'text-red-600'
                  }`}>{log.status}</span>
                </td>
                <td className="px-3 py-2 font-mono text-gray-600">{log.durationMs}ms</td>
                <td className="px-3 py-2 text-gray-400">{formatBytes(log.responseSize)}</td>
                <td className="px-3 py-2 text-gray-400 font-mono">{log.userId}</td>
                <td className="px-3 py-2 text-gray-400">{relativeTime(log.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System Metrics Tab
// ---------------------------------------------------------------------------

function SystemMetricsTab() {
  const [metrics, setMetrics] = useState<SystemMetric[]>(generateMetrics);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const newPoint: SystemMetric = {
          ts: new Date().toISOString(),
          cpu: 20 + Math.random() * 50,
          memory: 45 + Math.random() * 25,
          requests: Math.floor(Math.random() * 80) + 10,
          latency: 30 + Math.random() * 100,
          errors: Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0,
        };
        return [...prev.slice(1), newPoint];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const last = metrics[metrics.length - 1];
  const maxVal = (arr: number[]) => Math.max(...arr, 1);

  function MiniChart({ values, color, height = 40 }: { values: number[]; color: string; height?: number }) {
    const max = maxVal(values);
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = height - (v / max) * (height - 4);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { label: 'CPU Usage', value: `${last.cpu.toFixed(1)}%`, values: metrics.map((m) => m.cpu), color: '#3b82f6', warn: last.cpu > 70 },
          { label: 'Memory', value: `${last.memory.toFixed(1)}%`, values: metrics.map((m) => m.memory), color: '#8b5cf6', warn: last.memory > 80 },
          { label: 'Requests/min', value: String(last.requests), values: metrics.map((m) => m.requests), color: '#10b981', warn: false },
          { label: 'Avg Latency', value: `${last.latency.toFixed(0)}ms`, values: metrics.map((m) => m.latency), color: '#f59e0b', warn: last.latency > 200 },
        ].map((metric) => (
          <div key={metric.label} className={`p-4 rounded-2xl border ${metric.warn ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{metric.label}</span>
              <span className={`text-lg font-bold ${metric.warn ? 'text-amber-600' : 'text-gray-800'}`}>{metric.value}</span>
            </div>
            <MiniChart values={metric.values} color={metric.warn ? '#f59e0b' : metric.color} />
          </div>
        ))}
      </div>

      {/* Error timeline */}
      <div className="p-4 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-700">Error Rate (last 30 min)</span>
          <span className="text-xs text-gray-400">{metrics.filter((m) => m.errors > 0).length} intervals with errors</span>
        </div>
        <div className="flex items-end gap-0.5 h-12">
          {metrics.map((m, i) => (
            <div key={i} className="flex-1" style={{ height: `${Math.min(100, (m.errors / 5) * 100)}%` }}>
              <div className={`w-full h-full rounded-sm ${m.errors > 0 ? 'bg-red-400' : 'bg-gray-100'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
          <span>30m ago</span>
          <span>now</span>
        </div>
      </div>

      {/* Service health */}
      <div className="mt-4 p-4 rounded-2xl border border-gray-100">
        <div className="text-xs font-semibold text-gray-700 mb-3">Service Health</div>
        <div className="space-y-2">
          {[
            { name: 'Gateway API', status: 'healthy', latency: '4ms', uptime: '99.98%' },
            { name: 'Agent Runtime', status: 'healthy', latency: '12ms', uptime: '99.94%' },
            { name: 'Tool Executor', status: 'degraded', latency: '340ms', uptime: '98.12%' },
            { name: 'Memory Graph', status: 'healthy', latency: '8ms', uptime: '99.99%' },
            { name: 'Skill Marketplace', status: 'healthy', latency: '22ms', uptime: '99.96%' },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                svc.status === 'healthy' ? 'bg-emerald-400' :
                svc.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <span className="text-xs text-gray-700 flex-1">{svc.name}</span>
              <span className="text-[10px] font-mono text-gray-400">{svc.latency}</span>
              <span className="text-[10px] text-gray-400">{svc.uptime}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                svc.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' :
                svc.status === 'degraded' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
              }`}>{svc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ObservabilityPanel
// ---------------------------------------------------------------------------

export function ObservabilityPanel() {
  const [tab, setTab] = useState<Tab>('executions');

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'executions', label: 'Workflow Executions', icon: '⚡' },
    { id: 'agents', label: 'Agent Activity', icon: '🤖' },
    { id: 'api', label: 'API Logs', icon: '📡' },
    { id: 'metrics', label: 'System Metrics', icon: '📊' },
  ];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden" data-testid="observability-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Observability</h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time platform monitoring and execution traces</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-4 border-b border-gray-100 flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs border-b-2 transition-colors ${
              tab === t.id
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
            data-testid={`obs-tab-${t.id}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'executions' && <WorkflowExecutionsTab />}
        {tab === 'agents' && <AgentActivityTab />}
        {tab === 'api' && <ApiLogsTab />}
        {tab === 'metrics' && <SystemMetricsTab />}
      </div>
    </div>
  );
}
