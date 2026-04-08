/**
 * WorkflowCanvas — Visual workflow builder and flagship workflow launcher.
 * Browse cross-functional workflow templates, visualize DAG steps, and launch executions.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import { useEAOSStore } from '../store/eaos-store';

const API = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

// ── Types ───────────────────────────────────────────────────────
interface WorkflowStep {
  id: string; name: string; agent: string; agentPersona: string; tool?: string;
  outputKey: string; description: string; requiresApproval?: boolean; dependsOn?: string[];
}
interface WorkflowTemplate {
  id: string; slug: string; name: string; description: string; icon: string;
  type: string; personas: string[]; complexity: string; estimatedTime: string;
  inputs: { id: string; label: string; type: string; required?: boolean; placeholder?: string }[];
  steps: WorkflowStep[]; outputs: string[]; tools: string[]; tags: string[];
}

const PERSONA_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  engineering: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  marketing: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  product: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  hr: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  ta: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  program: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const COMPLEXITY_BADGE: Record<string, string> = {
  moderate: 'badge-info', complex: 'badge-warning', critical: 'badge-danger',
};

// ═══════════════════════════════════════════════════════════════
export default function WorkflowCanvas() {
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [selected, setSelected] = useState<WorkflowTemplate | null>(null);
  const [filterPersona, setFilterPersona] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/workflows/flagship`)
      .then(r => r.json())
      .then(d => { setWorkflows(d.workflows || []); if (d.workflows?.length) setSelected(d.workflows[0]); })
      .catch(() => {});
  }, []);

  const filtered = filterPersona
    ? workflows.filter(w => w.personas.includes(filterPersona))
    : workflows;

  const allPersonas = Array.from(new Set(workflows.flatMap(w => w.personas)));

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title">Workflow Canvas</h1>
            <p className="page-subtitle">Cross-functional workflow templates — visualize, configure, and launch</p>
          </div>
          <button onClick={() => setActiveSection('platform-swarms')} className="btn btn-secondary btn-sm">
            View Active Swarms
          </button>
        </div>

        {/* Persona filter */}
        <div className="flex gap-1.5 mb-5">
          <button onClick={() => setFilterPersona(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filterPersona ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            All ({workflows.length})
          </button>
          {allPersonas.map(p => (
            <button key={p} onClick={() => setFilterPersona(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filterPersona === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left — Workflow list */}
          <div className="col-span-1 space-y-3">
            {filtered.map(wf => (
              <button key={wf.id} onClick={() => setSelected(wf)}
                className={`card p-4 w-full text-left transition-all ${selected?.id === wf.id ? 'border-blue-500 shadow-md' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{wf.icon}</span>
                  <span className="text-sm font-semibold text-slate-900">{wf.name}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2 line-clamp-2">{wf.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${COMPLEXITY_BADGE[wf.complexity] || 'badge-neutral'}`}>{wf.complexity}</span>
                  <span className="text-[10px] text-slate-400">{wf.estimatedTime}</span>
                  {wf.personas.map(p => {
                    const c = PERSONA_COLORS[p] || PERSONA_COLORS.engineering;
                    return <span key={p} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{p}</span>;
                  })}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="card p-8 text-center text-sm text-slate-400">No workflows match the filter.</div>
            )}
          </div>

          {/* Right — Workflow detail + DAG visualization */}
          <div className="col-span-2">
            {selected ? (
              <div className="space-y-5">
                {/* Header card */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selected.icon}</span>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                        <p className="text-sm text-slate-500">{selected.description}</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveSection('platform-swarms')} className="btn btn-primary">
                      Launch as Swarm
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <span><strong>Type:</strong> {selected.type}</span>
                    <span><strong>Complexity:</strong> {selected.complexity}</span>
                    <span><strong>Time:</strong> {selected.estimatedTime}</span>
                    <span><strong>Steps:</strong> {selected.steps.length}</span>
                    <span><strong>Tools:</strong> {selected.tools.join(', ')}</span>
                  </div>
                </div>

                {/* DAG Visualization */}
                <div className="card p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Workflow DAG</h3>
                  <div className="space-y-1">
                    {selected.steps.map((step, i) => {
                      const colors = PERSONA_COLORS[step.agentPersona.toLowerCase()] || PERSONA_COLORS.engineering;
                      const hasDeps = step.dependsOn && step.dependsOn.length > 0;
                      return (
                        <div key={step.id} className="flex gap-4">
                          {/* Step number + connector */}
                          <div className="flex flex-col items-center w-8">
                            <div className={`w-7 h-7 rounded-full ${colors.dot} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                              {i + 1}
                            </div>
                            {i < selected.steps.length - 1 && (
                              <div className="w-px flex-1 bg-slate-200 my-1" />
                            )}
                          </div>

                          {/* Step card */}
                          <div className={`flex-1 rounded-xl border p-4 mb-2 ${step.requiresApproval ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">{step.name}</span>
                                {step.requiresApproval && (
                                  <span className="badge badge-warning text-[9px]">Approval Gate</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                  {step.agent}
                                </span>
                                {step.tool && (
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{step.tool}</span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{step.description}</p>
                            {hasDeps && (
                              <p className="text-[10px] text-slate-400 mt-1">
                                Depends on: {step.dependsOn!.map(d => {
                                  const depStep = selected.steps.find(s => s.id === d);
                                  return depStep ? depStep.name : d;
                                }).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inputs */}
                <div className="card p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Required Inputs</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.inputs.map(inp => (
                      <div key={inp.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">{inp.label}</span>
                          {inp.required && <span className="text-red-500 text-xs">*</span>}
                        </div>
                        <p className="text-[10px] text-slate-400">{inp.placeholder || inp.type}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outputs */}
                <div className="card p-6">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Expected Outputs</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.outputs.map(out => (
                      <span key={out} className="badge badge-success text-[10px]">{out.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <span className="text-4xl block mb-4">🔄</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Workflow</h3>
                <p className="text-sm text-slate-500">Choose a cross-functional workflow template to visualize its DAG and launch a swarm.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
