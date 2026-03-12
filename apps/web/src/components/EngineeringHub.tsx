/**
 * EngineeringHub — AI Engineering Assistant inside AgentOS
 * Command Center, Skills, Timeline, and Integrations for software engineering teams.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useEngineeringStore, type PersonaExecution, type PersonaExecutionStep } from '../store/persona-store';
import { ExecutionTimeline } from './marketing/ExecutionTimeline';
import { PersonaWorkflowForm, type SkillInputField, type SkillToolRef } from './persona/PersonaWorkflowForm';
import type { ExecutionStepEvent } from '../store/marketing-store';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
const POLL_INTERVAL_MS = 2000;

// ---------------------------------------------------------------------------
// Types (matching gateway response)
// ---------------------------------------------------------------------------

interface SkillStep {
  id: string;
  order: number;
  name: string;
  agent: string;
  tool?: string;
  outputKey: string;
  requiresApproval?: boolean;
}

interface SkillDef {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  cluster: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: string;
  inputs: SkillInputField[];
  steps: SkillStep[];
  outputs: string[];
  requiredTools: string[];
  optionalTools: string[];
  tags: string[];
}

// Tool connection state for the engineering persona
const ENG_TOOL_STATUS: Record<string, SkillToolRef> = {
  claude:     { id: 'claude',     name: 'Claude',     icon: '🤖', connected: true  },
  github:     { id: 'github',     name: 'GitHub',     icon: '🐙', connected: false },
  jira:       { id: 'jira',       name: 'Jira',       icon: '🟦', connected: false },
  confluence: { id: 'confluence', name: 'Confluence', icon: '📘', connected: false },
  sentry:     { id: 'sentry',     name: 'Sentry',     icon: '🛡️', connected: false },
  datadog:    { id: 'datadog',    name: 'Datadog',    icon: '📊', connected: false },
  pagerduty:  { id: 'pagerduty', name: 'PagerDuty',  icon: '🚨', connected: false },
};

function buildToolStrip(skill: SkillDef): SkillToolRef[] {
  const ids = [...skill.requiredTools, ...skill.optionalTools];
  return ids.map((id) => ENG_TOOL_STATUS[id] ?? { id, name: id, icon: '🔧', connected: false });
}

// ---------------------------------------------------------------------------
// Command Center
// ---------------------------------------------------------------------------

function EngineeringCommandCenter() {
  const [skills, setSkills] = useState<SkillDef[]>([]);
  const [clusters, setClusters] = useState<Record<string, SkillDef[]>>({});
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);
  const [executing, setExecuting] = useState(false);

  const activeExecution = useEngineeringStore((s) => s.activeExecution);
  const addExecution = useEngineeringStore((s) => s.addExecution);
  const updateExecution = useEngineeringStore((s) => s.updateExecution);
  const updateExecutionStep = useEngineeringStore((s) => s.updateExecutionStep);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/engineering/skills`)
      .then((r) => r.json())
      .then((data) => {
        if (data.skills) setSkills(data.skills);
        if (data.clusters) setClusters(data.clusters);
      })
      .catch(() => {});
  }, []);

  // Poll active execution
  useEffect(() => {
    if (!activeExecution || ['completed', 'failed'].includes(activeExecution.status)) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/engineering/executions/${activeExecution.id}`);
        if (!res.ok) return;
        const { execution } = await res.json();
        if (!execution) return;
        updateExecution(activeExecution.id, { status: execution.status, completedAt: execution.completedAt, outputs: execution.outputs ?? {} });
        for (const step of execution.steps ?? []) {
          updateExecutionStep(activeExecution.id, step.stepId, { status: step.status, startedAt: step.startedAt, completedAt: step.completedAt, outputPreview: step.outputPreview, error: step.error });
        }
        if (['completed', 'failed'].includes(execution.status)) {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL_MS);
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [activeExecution?.id, activeExecution?.status]);

  const handleExecute = async (inputs: Record<string, string>, simulate: boolean) => {
    if (!selectedSkill) return;
    setExecuting(true);
    try {
      const res = await fetch(`${GATEWAY_URL}/api/engineering/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: selectedSkill.id, inputs, simulate }),
      });
      if (!res.ok) throw new Error('Execution failed');
      const { execution } = await res.json();
      const stepEvents = (execution.steps ?? []).map((s: { stepId: string; stepName: string; agent: string; tool?: string; status: string; outputKey?: string }) => ({
        id: `evt-${s.stepId}`,
        stepId: s.stepId,
        stepName: s.stepName,
        agent: s.agent,
        tool: s.tool,
        status: s.status as PersonaExecutionStep['status'],
        outputKey: s.outputKey,
      }));
      addExecution({ id: execution.id, persona: 'engineering', skillId: execution.skillId, skillName: execution.skillName, status: execution.status ?? 'queued', steps: stepEvents, outputs: execution.outputs ?? {}, startedAt: execution.startedAt });
      setSelectedSkill(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const timelineSteps: ExecutionStepEvent[] = (activeExecution?.steps ?? []).map((s) => ({
    id: `evt-${s.stepId}`,
    stepId: s.stepId,
    stepName: s.stepName,
    agent: s.agent,
    tool: s.tool,
    status: s.status,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    outputKey: s.outputKey,
    outputPreview: s.outputPreview,
    error: s.error,
  }));

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Engineering Command Center</h2>
        <p className="text-sm text-slate-500 mt-0.5">Run AI-powered engineering skills. Select a skill → fill inputs → execute.</p>
      </div>

      {/* Active execution */}
      {activeExecution && !selectedSkill && (
        <ExecutionTimeline
          steps={timelineSteps}
          workflowName={activeExecution.skillName}
          status={activeExecution.status}
          outputs={activeExecution.outputs}
        />
      )}

      {/* Skill selector */}
      {!selectedSkill ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">10 Engineering Skills</h3>
          <div className="grid gap-4">
            {Object.entries(clusters).map(([cluster, clusterSkills]) => (
              <div key={cluster} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800 mb-3">{cluster}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clusterSkills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white text-left transition-all"
                    >
                      <span>{skill.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{skill.name}</p>
                        <p className="text-[10px] text-slate-400">{skill.estimatedTime}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedSkill.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedSkill.name}</h3>
                  <p className="text-[11px] text-slate-500">{selectedSkill.description}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSkill(null)} className="text-xs text-slate-400 hover:text-slate-600">← Back</button>
            </div>
            <PersonaWorkflowForm
              fields={selectedSkill.inputs}
              tools={buildToolStrip(selectedSkill)}
              accentClass="bg-slate-900"
              accentHoverClass="hover:bg-slate-800"
              onExecute={handleExecute}
              onCancel={() => setSelectedSkill(null)}
              executing={executing}
            />
          </div>
          {/* Steps preview */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Skill Steps</h4>
              <ol className="space-y-2">
                {selectedSkill.steps.map((step, i) => (
                  <li key={step.id} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{step.name}</p>
                      <p className="text-[10px] text-slate-400">{step.agent} Agent{step.tool ? ` · ${step.tool}` : ''}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-500"><span className="font-semibold">Complexity:</span> {selectedSkill.complexity}</p>
                <p className="text-[10px] text-slate-500"><span className="font-semibold">Est. time:</span> {selectedSkill.estimatedTime}</p>
                <p className="text-[10px] text-slate-500"><span className="font-semibold">Required:</span> {selectedSkill.requiredTools.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills Marketplace (read-only catalog view)
// ---------------------------------------------------------------------------

function EngineeringSkillsView() {
  const [skills, setSkills] = useState<SkillDef[]>([]);
  const setActiveSection = useEngineeringStore((s) => s.setActiveSection);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/engineering/skills`)
      .then((r) => r.json())
      .then((data) => { if (data.skills) setSkills(data.skills); })
      .catch(() => {});
  }, []);

  const COMPLEXITY_BADGE: Record<string, string> = {
    simple: 'bg-emerald-100 text-emerald-700',
    moderate: 'bg-amber-100 text-amber-700',
    complex: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Engineering Skills</h2>
          <p className="text-sm text-slate-500 mt-0.5">10 AI-powered skills for software engineering teams</p>
        </div>
        <button
          onClick={() => setActiveSection('command-center')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          Run a Skill →
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <div key={skill.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{skill.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{skill.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${COMPLEXITY_BADGE[skill.complexity]}`}>{skill.complexity}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{skill.description}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{skill.cluster}</span>
                  <span className="text-[10px] text-slate-400">{skill.estimatedTime}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Execution Timeline History
// ---------------------------------------------------------------------------

function EngineeringTimelineView() {
  const executions = useEngineeringStore((s) => s.executions);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Execution Timeline</h2>
        <p className="text-sm text-slate-500 mt-0.5">Recent engineering skill executions and their outputs.</p>
      </div>
      {executions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400 text-sm">No executions yet. Run a skill from the Command Center.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {executions.map((exec) => {
            const steps: ExecutionStepEvent[] = exec.steps.map((s) => ({
              id: `evt-${s.stepId}`,
              stepId: s.stepId,
              stepName: s.stepName,
              agent: s.agent,
              tool: s.tool,
              status: s.status,
              startedAt: s.startedAt,
              completedAt: s.completedAt,
              outputKey: s.outputKey,
              outputPreview: s.outputPreview,
              error: s.error,
            }));
            return (
              <ExecutionTimeline
                key={exec.id}
                steps={steps}
                workflowName={exec.skillName}
                status={exec.status}
                outputs={exec.outputs}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integrations (tool strip for Engineering tools)
// ---------------------------------------------------------------------------

const ENG_TOOLS = [
  { id: 'claude', name: 'Claude', icon: '🤖', category: 'AI', connected: true },
  { id: 'github', name: 'GitHub', icon: '🐙', category: 'Code', connected: false },
  { id: 'jira', name: 'Jira', icon: '🟦', category: 'Planning', connected: false },
  { id: 'sentry', name: 'Sentry', icon: '🛡️', category: 'Monitoring', connected: false },
  { id: 'datadog', name: 'Datadog', icon: '📊', category: 'Observability', connected: false },
  { id: 'pagerduty', name: 'PagerDuty', icon: '🚨', category: 'Incidents', connected: false },
];

function EngineeringIntegrationsView() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Engineering Integrations</h2>
        <p className="text-sm text-slate-500 mt-0.5">Connect tools used by engineering skills.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENG_TOOLS.map((tool) => (
          <div key={tool.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tool.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{tool.name}</p>
                <p className="text-[11px] text-slate-400">{tool.category}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${tool.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`text-[10px] font-semibold ${tool.connected ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {tool.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
            {!tool.connected && (
              <button className="mt-3 w-full px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                Connect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar nav
// ---------------------------------------------------------------------------

const ENG_NAV = [
  { id: 'command-center' as const, label: 'Command Center', icon: '⚡' },
  { id: 'skills' as const, label: 'Skills', icon: '🧠' },
  { id: 'timeline' as const, label: 'Timeline', icon: '📋' },
  { id: 'integrations' as const, label: 'Integrations', icon: '🔗' },
];

// ---------------------------------------------------------------------------
// Main Hub
// ---------------------------------------------------------------------------

export function EngineeringHub() {
  const activeSection = useEngineeringStore((s) => s.activeSection);
  const setActiveSection = useEngineeringStore((s) => s.setActiveSection);

  return (
    <div className="flex h-full" data-tour="engineering-hub">
      {/* Sub-sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-slate-200 bg-slate-50/60 flex flex-col py-4">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engineering</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {ENG_NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              data-tour={`eng-${item.id}`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                activeSection === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'command-center' && <EngineeringCommandCenter />}
        {activeSection === 'skills' && <EngineeringSkillsView />}
        {activeSection === 'timeline' && <EngineeringTimelineView />}
        {activeSection === 'integrations' && <EngineeringIntegrationsView />}
      </div>
    </div>
  );
}
