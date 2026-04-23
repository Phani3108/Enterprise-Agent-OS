/**
 * RightPanel — Dual-mode contextual sidebar
 *
 * Mode 1 (help): Shows contextual help for the focused input field during
 *   skill/workflow configuration — description, examples, suggested values,
 *   and related prompts from the prompt library.
 *
 * Mode 2 (execution): Shows live execution timeline, logs, and actions
 *   during skill/workflow runs (existing behavior, enhanced).
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useEAOSStore } from '../store/eaos-store';
import { useExecutionStore } from '../store/execution-store';
import { usePromptStore } from '../store/prompt-store';

// ---------------------------------------------------------------------------
// Sections where the right panel can appear
// ---------------------------------------------------------------------------

const RELEVANT_SECTIONS = [
  'ws-marketing', 'ws-engineering', 'ws-product', 'ws-hr',
  'ops-executions',
];

// ---------------------------------------------------------------------------
// Execution-mode types
// ---------------------------------------------------------------------------

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
  queued: 'bg-slate-300',
  skipped: 'bg-slate-300',
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
  debug: 'text-slate-400',
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function RightPanel() {
  const rightPanelOpen = useEAOSStore(s => s.rightPanelOpen);
  const activeExecutionId = useEAOSStore(s => s.activeExecutionId);
  const activeSection = useEAOSStore(s => s.activeSection);
  const rightPanelMode = useEAOSStore(s => s.rightPanelMode);

  const isRelevantPage = RELEVANT_SECTIONS.includes(activeSection);
  const visible = activeExecutionId !== null || (rightPanelOpen && isRelevantPage);

  // Auto-switch mode based on execution state
  const effectiveMode = activeExecutionId ? 'execution' : rightPanelMode;

  if (!visible) return null;

  return (
    <aside className="hidden md:flex w-[288px] flex-shrink-0 flex-col border-l border-slate-200 bg-white overflow-hidden">
      {effectiveMode === 'help' ? <HelpMode /> : <ExecutionMode />}
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Help Mode — Contextual help for input fields + prompt suggestions
// ═══════════════════════════════════════════════════════════════════════════

function HelpMode() {
  const selectedSkill = useExecutionStore(s => s.selectedSkill);
  const focusedFieldKey = useExecutionStore(s => s.focusedField);
  const prompts = usePromptStore(s => s.prompts);

  const fieldDef = selectedSkill?.inputFields.find(f => f.key === focusedFieldKey);

  // Find prompts related to the selected skill
  const displayPrompts = prompts.filter(p => {
    if (!selectedSkill) return false;
    if (fieldDef?.relatedPromptId && p.id === fieldDef.relatedPromptId) return true;
    if (selectedSkill.promptIds?.includes(p.id)) return true;
    return p.persona === selectedSkill.persona;
  }).slice(0, 5);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-900">
          {fieldDef ? 'Field Guide' : 'Skill Guide'}
        </span>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          Help
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Field-specific help */}
        {fieldDef ? (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">{fieldDef.label}</h3>
              <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                {fieldDef.type}{fieldDef.required ? ' · required' : ''}
              </span>
            </div>

            {fieldDef.description && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">What this means</p>
                <p className="text-[12px] text-slate-600 leading-relaxed">{fieldDef.description}</p>
              </div>
            )}

            {fieldDef.examples && fieldDef.examples.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Examples</p>
                <div className="space-y-1">
                  {fieldDef.examples.map((ex, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-2 text-[12px] text-slate-700 bg-slate-50 rounded-lg border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      title="Click to use this example"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fieldDef.suggestedValues && fieldDef.suggestedValues.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quick picks</p>
                <div className="flex flex-wrap gap-1.5">
                  {fieldDef.suggestedValues.map((val, i) => (
                    <button
                      key={i}
                      className="px-2 py-1 text-[11px] bg-blue-50 text-blue-700 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fieldDef.helpUrl && (
              <a
                href={fieldDef.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-blue-600 hover:text-blue-700"
              >
                <span>📖</span> Learn more
              </a>
            )}

            {fieldDef.hint && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-[11px] text-amber-700">{fieldDef.hint}</p>
              </div>
            )}
          </div>
        ) : selectedSkill ? (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{selectedSkill.icon}</span>
                <h3 className="text-[13px] font-semibold text-slate-900">{selectedSkill.name}</h3>
              </div>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${
                selectedSkill.executableType === 'workflow'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedSkill.executableType === 'workflow' ? '🔀 Workflow' : '⚡ Skill'}
              </span>
              <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">{selectedSkill.description}</p>
            </div>

            {selectedSkill.estimatedTime && (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <span>⏱</span> Estimated: {selectedSkill.estimatedTime}
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Steps</p>
              <div className="space-y-1.5">
                {selectedSkill.steps.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-2">
                    <span className="text-[10px] mt-0.5 w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-500">{i + 1}</span>
                    <span className="text-[12px] text-slate-600">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-600">💡 Tip:</span> Click on any input field for guidance, examples, and suggested prompts.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-slate-400 mt-8">Select a skill or workflow to see guidance here.</p>
          </div>
        )}

        {/* Prompt suggestions */}
        {displayPrompts.length > 0 && (
          <div className="border-t border-slate-100 p-4 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Suggested Prompts</p>
            <div className="space-y-2">
              {displayPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{prompt.icon}</span>
                    <span className="text-[12px] font-medium text-slate-800 truncate">{prompt.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{prompt.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">v{prompt.version}</span>
                    <span className="text-[10px] text-amber-500">{'★'.repeat(Math.round(prompt.rating))}</span>
                    <span className="text-[10px] text-slate-400">{prompt.usageCount} uses</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-100 px-4 py-2 bg-slate-50/60">
        <p className="text-[10px] text-slate-400 text-center">
          Prompts and guidance help you get better results
        </p>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Execution Mode — Live timeline, logs, actions
// ═══════════════════════════════════════════════════════════════════════════

function ExecutionMode() {
  const [tab, setTab] = useState<'timeline' | 'logs' | 'actions'>('timeline');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const activeExecution = useExecutionStore(s => s.activeExecution);

  // Derive timeline steps from the live execution store. Fall back to seed
  // data only when no execution is active (idle placeholder on first load).
  const steps: TimelineStep[] = activeExecution
    ? activeExecution.steps.map((s) => ({
        id: s.stepId,
        name: s.stepName,
        stepType: s.tool ? 'tool' : 'agent',
        status:
          s.status === 'pending' ? 'queued'
          : s.status === 'approval_required' ? 'queued'
          : (s.status as TimelineStep['status']),
        agentName: s.agent,
        toolName: s.tool,
        startedAt: s.startedAt,
        durationMs: s.durationMs,
      }))
    : SEED_STEPS;

  // Each time a step transitions state, append a log entry so users get a
  // readable trace without polling a separate logs endpoint.
  useEffect(() => {
    if (!activeExecution) return;
    const newLogs: LogEntry[] = [];
    for (const s of activeExecution.steps) {
      if (s.status === 'running') {
        newLogs.push({
          id: `log-${s.stepId}-run`,
          level: 'info',
          message: `${s.agent}: ${s.stepName} started${s.tool ? ` via ${s.tool}` : ''}`,
          createdAt: s.startedAt ?? new Date().toISOString(),
        });
      } else if (s.status === 'completed') {
        newLogs.push({
          id: `log-${s.stepId}-done`,
          level: 'info',
          message: `${s.stepName} completed${s.durationMs ? ` in ${s.durationMs}ms` : ''}`,
          createdAt: s.completedAt ?? new Date().toISOString(),
        });
      } else if (s.status === 'failed') {
        newLogs.push({
          id: `log-${s.stepId}-fail`,
          level: 'error',
          message: `${s.stepName} failed${s.error ? `: ${s.error}` : ''}`,
          createdAt: s.completedAt ?? new Date().toISOString(),
        });
      }
    }
    // Replace log state — this mirrors the execution state instead of drifting.
    setLogs(newLogs.length > 0 ? newLogs : SEED_LOGS);
  }, [activeExecution]);

  useEffect(() => {
    if (tab === 'logs') logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, tab]);

  const execType = activeExecution?.executableType ?? 'skill';
  const completedCount = activeExecution?.steps.filter(s => s.status === 'completed').length ?? 4;
  const totalCount = activeExecution?.steps.length ?? 5;
  const durationSec = activeExecution?.totalDurationMs
    ? (activeExecution.totalDurationMs / 1000).toFixed(1)
    : '12.4';
  const isRunning = activeExecution?.status === 'running';
  const isCompleted = activeExecution?.status === 'completed';
  const isFailed = activeExecution?.status === 'failed';

  return (
    <>
      <div className="flex items-center justify-between px-4 h-12 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900">Live Execution</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            execType === 'workflow' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {execType === 'workflow' ? '🔀 Workflow' : '⚡ Skill'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${
            isFailed ? 'bg-red-500' :
            isCompleted ? 'bg-emerald-500' :
            'bg-blue-500 animate-pulse'
          }`} />
          <span className="text-[11px] text-slate-400">
            {isFailed ? 'Failed' : isCompleted ? 'Completed' : isRunning ? 'Running' : 'Queued'}
          </span>
        </div>
      </div>

      <div className="flex border-b border-slate-100 flex-shrink-0">
        {(['timeline', 'logs', 'actions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11px] font-medium capitalize transition-colors ${
              tab === t ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'timeline' && (
          <div className="p-3 space-y-1">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[step.status]}`} />
                  {idx < steps.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[20px]" />
                  )}
                </div>
                <div className="min-w-0 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{STEP_ICON[step.stepType] ?? '•'}</span>
                    <span className="text-xs font-medium text-slate-900 truncate">{step.name}</span>
                  </div>
                  {(step.agentName || step.toolName) && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {step.agentName ?? step.toolName}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {step.startedAt && (
                      <span className="text-[11px] text-slate-400">{relativeTime(step.startedAt)}</span>
                    )}
                    {step.durationMs && (
                      <span className="text-[11px] text-slate-400">· {step.durationMs}ms</span>
                    )}
                    {step.status === 'running' && (
                      <span className="text-[11px] text-blue-500 font-medium">running…</span>
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
                <span className={`flex-shrink-0 font-mono uppercase text-[11px] font-semibold mt-0.5 w-8 ${LOG_COLOR[log.level]}`}>
                  {log.level}
                </span>
                <span className="text-slate-600 leading-relaxed min-w-0">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}

        {tab === 'actions' && (
          <div className="p-3 space-y-2">
            <ActionCard icon="🤖" title="Campaign Strategist" action="Generating ICP analysis from HubSpot data" status="running" />
            <ActionCard icon="🔌" title="HubSpot CRM" action="Querying contact segments — 847 matched" status="running" />
            <ActionCard icon="⚡" title="Campaign Workflow" action="Awaiting tool output to continue" status="waiting" />
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700 mb-2">Recent completions</p>
              <ActionCard icon="🎯" title="Intent Router" action="Routed to Marketing persona" status="done" />
              <ActionCard icon="🔧" title="Campaign Strategy Skill" action="Skill context loaded v2.1" status="done" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-slate-100 px-4 py-2 bg-slate-50/60">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[11px] text-slate-400">Steps</p>
            <p className="text-xs font-semibold text-slate-900">{completedCount} / {totalCount}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Duration</p>
            <p className="text-xs font-semibold text-slate-900">{durationSec}s</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Cost</p>
            <p className="text-xs font-semibold text-slate-900">
              {activeExecution?.simulate ? 'sim' : '$0.024'}
            </p>
          </div>
        </div>
      </div>
    </>
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
      'border-slate-100 bg-slate-50/50 opacity-60'
    }`}>
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="font-medium text-slate-900 truncate">{title}</p>
        <p className="text-slate-500 text-[11px] mt-0.5 truncate">{action}</p>
      </div>
      <div className="flex-shrink-0 mt-1">
        {status === 'running' && <span className="w-2 h-2 rounded-full bg-blue-500 block animate-pulse" />}
        {status === 'waiting' && <span className="w-2 h-2 rounded-full bg-amber-400 block" />}
        {status === 'done' && <span className="text-emerald-500 text-[11px]">✓</span>}
      </div>
    </div>
  );
}
