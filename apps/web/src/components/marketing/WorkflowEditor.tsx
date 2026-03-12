/**
 * Workflow Editor — Add, remove, reorder steps; change tools/agents; version skills
 * Flexible workflow builder for evolving marketing processes.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState } from 'react';
import type { WorkflowDef, WorkflowStep } from '../../lib/marketing-workflows';

interface WorkflowEditorProps {
  workflow: WorkflowDef;
  onSave?: (updated: WorkflowDef) => void;
  onDuplicate?: (workflow: WorkflowDef) => void;
  onRetire?: (workflow: WorkflowDef) => void;
}

const AVAILABLE_AGENTS = ['Strategy', 'Copy', 'Design', 'Research', 'Competitor', 'Campaign', 'Analytics', 'Email', 'SEO', 'Landing'];
const AVAILABLE_TOOLS = ['Claude', 'Perplexity', 'HubSpot', 'LinkedIn Ads', 'Google Ads', 'Canva', 'WordPress', 'Salesforce', 'GA4'];

export function WorkflowEditor({ workflow, onSave, onDuplicate, onRetire }: WorkflowEditorProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([...workflow.steps]);
  const [version, setVersion] = useState(workflow.version);

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSteps.length) return;
    [newSteps[index], newSteps[target]] = [newSteps[target], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `s${steps.length + 1}`,
      order: steps.length + 1,
      name: 'New Step',
      agent: 'Copy',
      tool: 'Claude',
      description: '',
      inputRefs: [],
      outputKey: `output_${steps.length + 1}`,
      estimatedSeconds: 15,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleSave = () => {
    const [major, minor] = version.split('.').map(Number);
    const newVersion = `${major}.${(minor ?? 0) + 1}`;
    onSave?.({
      ...workflow,
      steps,
      version: newVersion,
    });
    setVersion(newVersion);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{workflow.name} — v{version}</h3>
        <div className="flex gap-2">
          <button onClick={addStep} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
            + Add Step
          </button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">
            Save & Version
          </button>
          {onDuplicate && (
            <button onClick={() => onDuplicate(workflow)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200">
              Duplicate
            </button>
          )}
          {onRetire && (
            <button onClick={() => onRetire(workflow)} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200">
              Retire
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveStep(i, 'up')} disabled={i === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">▲</button>
              <button onClick={() => moveStep(i, 'down')} disabled={i === steps.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">▼</button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                value={step.name}
                onChange={(e) => updateStep(i, { name: e.target.value })}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded"
                placeholder="Step name"
              />
              <select
                value={step.agent}
                onChange={(e) => updateStep(i, { agent: e.target.value })}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded"
              >
                {AVAILABLE_AGENTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select
                value={step.tool ?? ''}
                onChange={(e) => updateStep(i, { tool: e.target.value || undefined })}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded"
              >
                <option value="">—</option>
                {AVAILABLE_TOOLS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                value={step.outputKey}
                onChange={(e) => updateStep(i, { outputKey: e.target.value })}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded"
                placeholder="Output key"
              />
            </div>
            <button onClick={() => removeStep(i)} className="px-2 py-1 text-red-600 text-xs font-semibold hover:bg-red-50 rounded">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
