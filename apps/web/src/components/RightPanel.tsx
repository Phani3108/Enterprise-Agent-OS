'use client';

import { useState, useEffect, useRef } from 'react';
import { useEAOSStore } from '../store/eaos-store';

/** Pages where Live Execution panel is relevant (execution flows, observability) */
const LIVE_EXECUTION_SECTIONS = ['ws-marketing', 'library-skills', 'ops-executions'];

interface TimelineStep {
  id: string;
  name: string;
  stepType: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
  agentName?: string;
  toolName?: string;
  startedAt?: string;
  durationMs?: number;
}

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  createdAt: string;
}

const SEED_STEPS: TimelineStep[] = [
  { id: 's1', name: 'Intent Detected', stepType: 'intent', status: 'completed', startedAt: new Date(Date.now() - 12000).toISOString(), durationMs: 180 },
  { id: 's2', name: 'Marketing Agent', stepType: 'agent', status: 'completed', agentName: 'Campaign Strategist', startedAt: new Date(Date.now() - 11000).toISOString(), durationMs: 4200 },
  { id: 's3', name: 'Campaign Strategy Skill', stepType: 'skill', status: 'completed', startedAt: new Date(Date.now() - 6000).toISOString(), durationMs: 3100 },
  { id: 's4', name: 'HubSpot Tool', stepType: 'tool', status: 'running', toolName: 'HubSpot CRM', startedAt: new Date(Date.now() - 2000).toISOString() },
  { id: 's5', name: 'Output Generation', stepType: 'output', status: 'queued' },
];

const SEED_LOGS: LogEntry[] = [
  { id: 'l1', level: 'info', message: 'Intent routing completed — confidence 0.92', createdAt: new Date(Date.now() - 11500).toISOString() },
  { id: 'l2', level: 'info', message: 'Marketing agent activated for campaign workflow', createdAt: new Date(Date.now() - 10800).toISOString() },
  { id: 'l3', level: 'info', message: 'Skill: Campaign Strategy v2.1 loaded', createdAt: new Date(Date.now() - 5800).toISOString() },
  { id: 'l4', level: 'info', message: 'Tool: HubSpot CRM — querying CRM data', createdAt: new Date(Date.now() - 1800).toISOString() },
  { id: 'l5', level: 'warn', message: 'HubSpot API rate limit at 80% — throttling', createdAt: new Date(Date.now() - 900).toISOString() },
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-500',
  running: 'bg-blue-500 animate-pulse',
  failed: 'bg-red-500',
  queued: 'bg-gray-300',
  skipped: 'bg-gray-300',
};

const STEP_ICON: Record<string, string> = {
  intent: '🎯',
  agent: '🤖',
  tool: '🔌',
  skill: '🔧',
  workflow: '⚡',
  approval: '✋',
  output: '📄',
};

const LOG_COLOR: Record<string, string> = {
  debug: 'text-gray-400',
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
};

export function RightPanel() {
  const rightPanelOpen = useEAOSStore(s => s.rightPanelOpen);
  const activeExecutionId = useEAOSStore(s => s.activeExecutionId);
  const activeSection = useEAOSStore(s => s.activeSection);
  const isRelevantPage = LIVE_EXECUTION_SECTIONS.includes(activeSection);
  const visible = activeExecutionId !== null || (rightPanelOpen && isRelevantPage);

  const [tab, setTab] = useState<'timeline' | 'logs' | 'actions'>('timeline');
  const [steps, setSteps] = useState<TimelineStep[]>(SEED_STEPS);
  const [logs, setLogs] = useState<LogEntry[]>(SEED_LOGS);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate live log additions
  useEffect(() => {
    if (!visible) return;
    const MESSAGES = [
      { level: 'info' as const, message: 'Agent heartbeat — status nominal' },
      { level: 'info' as const, message: 'Memory graph updated with execution context' },
      { level: 'warn' as const, message: 'Token budget at 65% for current execution' },
      { level: 'info' as const, message: 'Tool call completed in 340ms' },
      { level: 'debug' as const, message: 'Routing confidence recalculated: 0.88' },
    ];
    const t = setInterval(() => {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setLogs(prev => [...prev.slice(-40), {
        id: `l-${Date.now()}`,
        level: msg.level,
        message: msg.message,
        createdAt: new Date().toISOString(),
      }]);
    }, 4000);
    return () => clearInterval(t);
  }, [visible]);

  // Auto-scroll logs
  useEffect(() => {
    if (tab === 'logs') logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, tab]);

  if (!visible) return null;

  return (
    <aside className="w-[288px] flex-shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-900">Live Execution</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] text-gray-400">Running</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {(['timeline', 'logs', 'actions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11px] font-medium capitalize transition-colors ${
              tab === t ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'timeline' && (
          <div className="p-3 space-y-1">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-2.5">
                {/* Connector line */}
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[step.status]}`} />
                  {idx < steps.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]" />
                  )}
                </div>
                <div className="min-w-0 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{STEP_ICON[step.stepType] ?? '•'}</span>
                    <span className="text-xs font-medium text-gray-900 truncate">{step.name}</span>
                  </div>
                  {(step.agentName || step.toolName) && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {step.agentName ?? step.toolName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {step.startedAt && (
                      <span className="text-[10px] text-gray-400">{relativeTime(step.startedAt)}</span>
                    )}
                    {step.durationMs && (
                      <span className="text-[10px] text-gray-400">· {step.durationMs}ms</span>
                    )}
                    {step.status === 'running' && (
                      <span className="text-[10px] text-blue-500 font-medium">running…</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'logs' && (
          <div className="p-3 space-y-1.5">
            {logs.map(log => (
              <div key={log.id} className="flex gap-2 text-[11px]">
                <span className={`flex-shrink-0 font-mono uppercase text-[9px] font-semibold mt-0.5 w-8 ${LOG_COLOR[log.level]}`}>
                  {log.level}
                </span>
                <span className="text-gray-600 leading-relaxed min-w-0">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {tab === 'actions' && (
          <div className="p-3 space-y-2">
            <ActionCard
              icon="🤖"
              title="Campaign Strategist"
              action="Generating ICP analysis from HubSpot data"
              status="running"
            />
            <ActionCard
              icon="🔌"
              title="HubSpot CRM"
              action="Querying contact segments — 847 matched"
              status="running"
            />
            <ActionCard
              icon="⚡"
              title="Campaign Workflow"
              action="Awaiting tool output to continue"
              status="waiting"
            />
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-700 mb-2">Recent completions</p>
              <ActionCard icon="🎯" title="Intent Router" action="Routed to Marketing persona" status="done" />
              <ActionCard icon="🔧" title="Campaign Strategy Skill" action="Skill context loaded v2.1" status="done" />
            </div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2 bg-gray-50/60">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-gray-400">Steps</p>
            <p className="text-xs font-semibold text-gray-900">4 / 5</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Duration</p>
            <p className="text-xs font-semibold text-gray-900">12.4s</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400">Cost</p>
            <p className="text-xs font-semibold text-gray-900">$0.024</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ActionCard({ icon, title, action, status }: {
  icon: string; title: string; action: string;
  status: 'running' | 'waiting' | 'done';
}) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
      status === 'running' ? 'border-blue-100 bg-blue-50/40' :
      status === 'waiting' ? 'border-amber-100 bg-amber-50/30' :
      'border-gray-100 bg-gray-50/50 opacity-60'
    }`}>
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        <p className="text-gray-500 text-[10px] mt-0.5 truncate">{action}</p>
      </div>
      <div className="flex-shrink-0 mt-1">
        {status === 'running' && <span className="w-2 h-2 rounded-full bg-blue-500 block animate-pulse" />}
        {status === 'waiting' && <span className="w-2 h-2 rounded-full bg-amber-400 block" />}
        {status === 'done' && <span className="text-emerald-500 text-[10px]">✓</span>}
      </div>
    </div>
  );
}
