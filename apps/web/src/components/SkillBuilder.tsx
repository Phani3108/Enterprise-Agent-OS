'use client';

import { useState, useEffect } from 'react';
import {
  getSkillTemplates,
  getSkillTemplate,
  createMarketplaceSkill,
  getMarketplaceSkills,
  type MarketplaceSkill,
  type SkillTemplate,
  type WorkflowStep,
} from '../lib/api';

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

const PERSONAS = [
  { id: 'product', name: 'Product', icon: '📦' },
  { id: 'engineering', name: 'Engineering', icon: '⚙️' },
  { id: 'marketing', name: 'Marketing', icon: '📣' },
  { id: 'program', name: 'Program', icon: '📋' },
  { id: 'hr', name: 'HR', icon: '👥' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'data', name: 'Data', icon: '📊' },
  { id: 'corpit', name: 'Corp IT', icon: '🏛️' },
  { id: 'sales', name: 'Sales', icon: '🎯' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'support', name: 'Support', icon: '🎧' },
  { id: 'legal', name: 'Legal', icon: '⚖️' },
];

const TOOLS = [
  { id: 'jira', name: 'Jira', icon: '🔷' },
  { id: 'confluence', name: 'Confluence', icon: '📝' },
  { id: 'github', name: 'GitHub', icon: '🐙' },
  { id: 'hubspot', name: 'HubSpot', icon: '🟠' },
  { id: 'linkedin-ads', name: 'LinkedIn Ads', icon: '💼' },
  { id: 'canva', name: 'Canva', icon: '🎨' },
  { id: 'ga4', name: 'GA4', icon: '📊' },
  { id: 'notion', name: 'Notion', icon: '📓' },
  { id: 'excel', name: 'Excel', icon: '📗' },
  { id: 'snowflake', name: 'Snowflake', icon: '❄️' },
  { id: 'quickbooks', name: 'QuickBooks', icon: '💚' },
  { id: 'okta', name: 'Okta', icon: '🔐' },
  { id: 'azure-ad', name: 'Azure AD', icon: '🔷' },
  { id: 'greenhouse', name: 'Greenhouse', icon: '🌱' },
  { id: 'lever', name: 'Lever', icon: '🔩' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
];

const AGENTS = [
  { id: 'prd-agent', name: 'PRD Agent' },
  { id: 'research-agent', name: 'Research Agent' },
  { id: 'epic-generator-agent', name: 'Epic Generator Agent' },
  { id: 'roadmap-agent', name: 'Roadmap Agent' },
  { id: 'strategy-agent', name: 'Strategy Agent' },
  { id: 'code-review-agent', name: 'Code Review Agent' },
  { id: 'security-agent', name: 'Security Agent' },
  { id: 'campaign-agent', name: 'Campaign Agent' },
  { id: 'copy-agent', name: 'Copy Agent' },
  { id: 'creative-agent', name: 'Creative Agent' },
  { id: 'analytics-mkt-agent', name: 'Analytics Agent' },
  { id: 'resume-screening-agent', name: 'Resume Screening Agent' },
  { id: 'recruitment-agent', name: 'Recruitment Agent' },
  { id: 'forecasting-agent', name: 'Forecasting Agent' },
  { id: 'finance-analysis-agent', name: 'Finance Analysis Agent' },
  { id: 'access-provisioning-agent', name: 'Access Provisioning Agent' },
  { id: 'policy-enforcement-agent', name: 'Policy Enforcement Agent' },
];

const STEPS = [
  { id: 1, label: 'Choose Persona', key: 'persona' },
  { id: 2, label: 'Skill Name', key: 'name' },
  { id: 3, label: 'Required Tools', key: 'tools' },
  { id: 4, label: 'Agents', key: 'agents' },
  { id: 5, label: 'Workflow', key: 'workflow' },
  { id: 6, label: 'Prompts', key: 'prompts' },
  { id: 7, label: 'Outputs', key: 'outputs' },
  { id: 8, label: 'Publish', key: 'publish' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', desc: 'Only you' },
  { value: 'team', label: 'Team', desc: 'Your team' },
  { value: 'company', label: 'Company-wide', desc: 'Entire organization' },
];

interface DraftSkill {
  personaId: string;
  personaName: string;
  personaIcon: string;
  personaColor: string;
  name: string;
  description: string;
  requiredTools: { id: string; name: string; icon: string }[];
  agents: { id: string; name: string }[];
  workflow: WorkflowStep[];
  promptTemplates: string[];
  outputs: string[];
  visibility: 'private' | 'team' | 'company';
}

const EMPTY_DRAFT: DraftSkill = {
  personaId: '',
  personaName: '',
  personaIcon: '',
  personaColor: '',
  name: '',
  description: '',
  requiredTools: [],
  agents: [],
  workflow: [],
  promptTemplates: [],
  outputs: [],
  visibility: 'team',
};

function buildDraftFromTemplate(t: SkillTemplate): Partial<DraftSkill> {
  const p = PERSONAS.find((x) => x.id === t.personaId) || { id: t.personaId, name: t.personaId, icon: '📌' };
  const personaColors: Record<string, string> = {
    product: '#8b5cf6',
    engineering: '#3b82f6',
    marketing: '#f59e0b',
    program: '#10b981',
    hr: '#ec4899',
    finance: '#06b6d4',
    data: '#6366f1',
    corpit: '#64748b',
    sales: '#ef4444',
    design: '#d946ef',
    support: '#14b8a6',
    legal: '#78716c',
  };
  const workflow: WorkflowStep[] = t.workflowTemplate.map((w) => {
    const agent = AGENTS.find((a) => a.id === w.agentId);
    return {
      agentId: w.agentId,
      agentName: agent?.name || w.agentId,
      order: w.order,
      outputs: w.outputs,
    };
  });
  const agents = [...new Set(t.agents)].map((aid) => {
    const a = AGENTS.find((x) => x.id === aid);
    return { id: aid, name: a?.name || aid };
  });
  const requiredTools = t.requiredTools.map((tid) => {
    const t = TOOLS.find((x) => x.id === tid);
    return { id: tid, name: t?.name || tid, icon: t?.icon || '🔧' };
  });
  return {
    personaId: t.personaId,
    personaName: p.name,
    personaIcon: p.icon,
    personaColor: personaColors[t.personaId] || '#6b7280',
    name: t.name,
    description: t.description,
    requiredTools,
    agents,
    workflow,
    promptTemplates: t.promptTemplates || [],
    outputs: t.outputs || [],
  };
}

export default function SkillBuilder() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DraftSkill>({ ...EMPTY_DRAFT });
  const [templates, setTemplates] = useState<SkillTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedSkill, setPublishedSkill] = useState<MarketplaceSkill | null>(null);

  useEffect(() => {
    getSkillTemplates()
      .then((d) => setTemplates(d.templates || []))
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      getSkillTemplate(selectedTemplateId)
        .then((d) => {
          const partial = buildDraftFromTemplate(d.template);
          setDraft((prev) => ({ ...prev, ...partial }));
        })
        .catch(() => {});
    }
  }, [selectedTemplateId]);

  const canProceed = () => {
    if (step === 1) return !!draft.personaId;
    if (step === 2) return !!draft.name.trim();
    if (step === 3) return draft.requiredTools.length > 0;
    if (step === 4) return draft.agents.length > 0;
    if (step === 5) return draft.workflow.length > 0;
    if (step === 6) return true;
    if (step === 7) return draft.outputs.length > 0;
    if (step === 8) return true;
    return false;
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await createMarketplaceSkill({
        slug: draft.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: draft.name,
        personaId: draft.personaId,
        personaName: draft.personaName,
        personaIcon: draft.personaIcon,
        personaColor: draft.personaColor,
        description: draft.description || draft.name,
        requiredTools: draft.requiredTools,
        agents: draft.agents,
        workflow: draft.workflow,
        promptTemplates: draft.promptTemplates,
        outputs: draft.outputs,
        permissions: ['read', 'execute'],
        visibility: draft.visibility,
        version: '1.0.0',
        createdBy: 'current-user',
      });
      setPublishedSkill(res.skill);
    } catch {
      setPublishing(false);
    } finally {
      setPublishing(false);
    }
  };

  const addAgentToWorkflow = (agentId: string) => {
    const a = AGENTS.find((x) => x.id === agentId);
    if (!a) return;
    const order = draft.workflow.length + 1;
    setDraft((prev) => ({
      ...prev,
      workflow: [...prev.workflow, { agentId: a.id, agentName: a.name, order, outputs: [] }],
    }));
  };

  const removeWorkflowStep = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      workflow: prev.workflow.filter((_, i) => i !== idx).map((w, i) => ({ ...w, order: i + 1 })),
    }));
  };

  if (publishedSkill) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-lg mx-auto border border-emerald-200 rounded-xl p-6 bg-emerald-50/50">
          <h2 className="text-lg font-semibold text-emerald-800 mb-2">Skill Published</h2>
          <p className="text-sm text-emerald-700 mb-4">
            {publishedSkill.name} is now available in the Skill Marketplace.
          </p>
          <button
            onClick={() => {
              setPublishedSkill(null);
              setDraft({ ...EMPTY_DRAFT });
              setStep(1);
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Create Another Skill
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" data-tour="skill-builder">
      {/* Left — Steps */}
      <div className="w-56 border-r border-slate-200 bg-slate-50/50 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Builder</h2>
          <p className="text-[11px] text-slate-400 mt-1">Create custom skills</p>
        </div>
        <div className="py-2">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm ${
                step === s.id ? 'bg-white font-medium text-slate-900 shadow-sm border-r-2 border-slate-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-slate-200 text-slate-600">
                {s.id}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center — Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Choose Persona</h3>
            <p className="text-sm text-slate-500 mb-4">Select the persona this skill belongs to.</p>
            {templates.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Or start from template</h4>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(selectedTemplateId === t.id ? null : t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${
                        selectedTemplateId === t.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      personaId: p.id,
                      personaName: p.name,
                      personaIcon: p.icon,
                      personaColor: p.id === 'product' ? '#8b5cf6' : p.id === 'engineering' ? '#3b82f6' : '#6b7280',
                    }))
                  }
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    draft.personaId === p.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-sm font-medium text-slate-900">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Define Skill Name</h3>
            <p className="text-sm text-slate-500 mb-4">Give your skill a clear, descriptive name.</p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Write PRD + Create Jira Epics"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description (optional)</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this skill do?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Select Required Tools</h3>
            <p className="text-sm text-slate-500 mb-4">Choose tools this skill will use.</p>
            <div className="flex flex-wrap gap-2">
              {TOOLS.map((t) => {
                const selected = draft.requiredTools.some((x) => x.id === t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        requiredTools: selected
                          ? prev.requiredTools.filter((x) => x.id !== t.id)
                          : [...prev.requiredTools, { id: t.id, name: t.name, icon: t.icon }],
                      }))
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                      selected ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Choose Agents</h3>
            <p className="text-sm text-slate-500 mb-4">Select agents that will execute this skill.</p>
            <div className="flex flex-wrap gap-2">
              {AGENTS.map((a) => {
                const selected = draft.agents.some((x) => x.id === a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        agents: selected
                          ? prev.agents.filter((x) => x.id !== a.id)
                          : [...prev.agents, { id: a.id, name: a.name }],
                      }))
                    }
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      selected ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Define Workflow</h3>
            <p className="text-sm text-slate-500 mb-4">Arrange agents in execution order. Drag to reorder.</p>
            <div className="space-y-2 mb-4">
              {draft.workflow.map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="text-xs text-slate-400 w-6">{i + 1}</span>
                  <span className="text-sm font-medium text-slate-900">{w.agentName}</span>
                  <button
                    onClick={() => removeWorkflowStep(i)}
                    className="ml-auto text-xs text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Add agent</h4>
              <div className="flex flex-wrap gap-2">
                {AGENTS.filter((a) => !draft.workflow.some((w) => w.agentId === a.id)).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => addAgentToWorkflow(a.id)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    + {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Add Prompts</h3>
            <p className="text-sm text-slate-500 mb-4">Prompt templates for this skill.</p>
            <div className="space-y-2 mb-4">
              {draft.promptTemplates.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-500 flex-1">{p}</span>
                  <button
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        promptTemplates: prev.promptTemplates.filter((_, j) => j !== i),
                      }))
                    }
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="e.g. Write PRD for {product}"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPrompt.trim()) {
                    setDraft((prev) => ({ ...prev, promptTemplates: [...prev.promptTemplates, newPrompt.trim()] }));
                    setNewPrompt('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newPrompt.trim()) {
                    setDraft((prev) => ({ ...prev, promptTemplates: [...prev.promptTemplates, newPrompt.trim()] }));
                    setNewPrompt('');
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Define Outputs</h3>
            <p className="text-sm text-slate-500 mb-4">What outputs does this skill produce?</p>
            <div className="space-y-2 mb-4">
              {draft.outputs.map((o, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-slate-50">
                  <span className="text-xs text-slate-700 flex-1">{o}</span>
                  <button
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        outputs: prev.outputs.filter((_, j) => j !== i),
                      }))
                    }
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOutput}
                onChange={(e) => setNewOutput(e.target.value)}
                placeholder="e.g. PRD document"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newOutput.trim()) {
                    setDraft((prev) => ({ ...prev, outputs: [...prev.outputs, newOutput.trim()] }));
                    setNewOutput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newOutput.trim()) {
                    setDraft((prev) => ({ ...prev, outputs: [...prev.outputs, newOutput.trim()] }));
                    setNewOutput('');
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {step === 8 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Publish Skill</h3>
            <p className="text-sm text-slate-500 mb-4">Review and publish. Choose visibility.</p>
            <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">{draft.name}</h4>
              <p className="text-xs text-slate-500 mb-3">{draft.description || 'No description'}</p>
              <div className="flex flex-wrap gap-2">
                {draft.requiredTools.map((t) => (
                  <span key={t.id} className="px-2 py-0.5 rounded text-[11px] bg-slate-200 text-slate-700">
                    {t.icon} {t.name}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {draft.workflow.map((w, i) => (
                  <span key={i}>
                    {i > 0 && ' → '}
                    {w.agentName}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-600 mb-2">Visibility</label>
              <div className="flex gap-1">
                {VISIBILITY_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setDraft((prev) => ({ ...prev, visibility: v.value as DraftSkill['visibility'] }))}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      draft.visibility === v.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-3 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Skill'}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Back
          </button>
          {step < 8 ? (
            <button
              onClick={() => setStep((s) => Math.min(8, s + 1))}
              disabled={!canProceed()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
