'use client';
/**
 * InnovationLabs — Experiment sandbox, hackathon management, and graduation
 * pipeline with C-Suite innovation backlog overview.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';
import DemoPreviewBanner from './shared/DemoPreviewBanner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/* ── Types ─────────────────────────────────────────────────────────────── */

type ExperimentStatus = 'draft' | 'active' | 'evaluating' | 'graduated' | 'archived';
type ExperimentCategory = 'agent' | 'skill' | 'workflow' | 'integration' | 'process';

interface ExperimentResult { id: string; metric: string; value: number; unit: string; notes?: string; recordedAt: string }
interface Experiment {
  id: string; title: string; description: string; category: ExperimentCategory; status: ExperimentStatus;
  hypothesis: string; successCriteria: string[]; createdBy: string; assignedAgents: string[];
  targetRegiment?: string; tags: string[]; results: ExperimentResult[]; score?: number;
  hackathonId?: string; startedAt?: string; completedAt?: string; createdAt: string; updatedAt: string;
}
interface Hackathon {
  id: string; title: string; description: string; status: 'planned' | 'active' | 'completed';
  durationMs: number; startedAt?: string; endsAt?: string; completedAt?: string;
  experimentIds: string[]; createdAt: string;
}
interface GraduationRequest {
  id: string; experimentId: string; targetRegiment: string; proposedBy: string;
  status: 'pending' | 'approved' | 'rejected'; reviewedBy?: string; reviewNotes?: string;
  createdAt: string; reviewedAt?: string;
}
interface InnovationBacklog {
  total: number; byStatus: Record<ExperimentStatus, number>; byCategory: Record<ExperimentCategory, number>;
  activeHackathons: number; pendingGraduations: number; avgScore: number; recentExperiments: Experiment[];
}

type Tab = 'experiments' | 'hackathons' | 'graduations' | 'backlog';

/* ── Constants ─────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<ExperimentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600', active: 'bg-blue-100 text-blue-700',
  evaluating: 'bg-amber-100 text-amber-700', graduated: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};
const CATEGORY_ICONS: Record<ExperimentCategory, string> = {
  agent: '🤖', skill: '⚡', workflow: '🔄', integration: '🔌', process: '📋',
};
const HACK_STATUS: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700',
};

/* ── Component ────────────────────────────────────────────────────────── */

export default function InnovationLabs() {
  const [tab, setTab] = useState<Tab>('experiments');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [graduations, setGraduations] = useState<GraduationRequest[]>([]);
  const [backlog, setBacklog] = useState<InnovationBacklog | null>(null);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  // Forms
  const [showExpForm, setShowExpForm] = useState(false);
  const [showHackForm, setShowHackForm] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState<ExperimentCategory>('skill');
  const [expHypothesis, setExpHypothesis] = useState('');
  const [expCriteria, setExpCriteria] = useState('');
  const [hackTitle, setHackTitle] = useState('');
  const [hackDesc, setHackDesc] = useState('');
  const [hackHours, setHackHours] = useState('24');

  /* ── Fetching ───────────────────────────────────────────────────────── */
  const fetchAll = () => {
    fetch(`${API}/api/innovation/experiments`).then(r => r.json()).then(d => setExperiments(d.experiments ?? [])).catch(() => {});
    fetch(`${API}/api/innovation/hackathons`).then(r => r.json()).then(d => setHackathons(d.hackathons ?? [])).catch(() => {});
    fetch(`${API}/api/innovation/graduations`).then(r => r.json()).then(d => setGraduations(d.graduations ?? [])).catch(() => {});
    fetch(`${API}/api/innovation/backlog`).then(r => r.json()).then(d => setBacklog(d)).catch(() => {});
  };
  useEffect(fetchAll, []);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const addExperiment = async () => {
    await fetch(`${API}/api/innovation/experiments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: expTitle, description: expDesc, category: expCategory, hypothesis: expHypothesis,
        successCriteria: expCriteria.split('\n').filter(Boolean), createdBy: 'user',
      }),
    });
    setExpTitle(''); setExpDesc(''); setExpHypothesis(''); setExpCriteria('');
    setShowExpForm(false); fetchAll();
  };

  const transition = async (id: string, status: ExperimentStatus) => {
    await fetch(`${API}/api/innovation/experiments/${encodeURIComponent(id)}/transition`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    fetchAll(); setSelectedExp(null);
  };

  const addHackathon = async () => {
    await fetch(`${API}/api/innovation/hackathons`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: hackTitle, description: hackDesc, durationMs: parseFloat(hackHours) * 3_600_000 }),
    });
    setHackTitle(''); setHackDesc(''); setHackHours('24'); setShowHackForm(false); fetchAll();
  };

  const startHack = async (id: string) => {
    await fetch(`${API}/api/innovation/hackathons/${encodeURIComponent(id)}/start`, { method: 'POST' });
    fetchAll();
  };

  const completeHack = async (id: string) => {
    await fetch(`${API}/api/innovation/hackathons/${encodeURIComponent(id)}/complete`, { method: 'POST' });
    fetchAll();
  };

  const reviewGrad = async (id: string, decision: 'approved' | 'rejected') => {
    await fetch(`${API}/api/innovation/graduations/${encodeURIComponent(id)}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewedBy: 'user' }),
    });
    fetchAll();
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'experiments', label: 'Experiments', icon: '🧪' },
    { key: 'hackathons', label: 'Hackathons', icon: '🏆' },
    { key: 'graduations', label: 'Graduations', icon: '🎓' },
    { key: 'backlog', label: 'Innovation Backlog', icon: '📊' },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Innovation Labs</h1>
        <p className="text-violet-200 mb-6">Prototype, experiment, and graduate ideas across regiments</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{backlog?.total ?? 0}</div>
            <div className="text-sm text-violet-200">Experiments</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{backlog?.activeHackathons ?? 0}</div>
            <div className="text-sm text-violet-200">Active Hackathons</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{backlog?.byStatus?.graduated ?? 0}</div>
            <div className="text-sm text-violet-200">Graduated</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{backlog?.avgScore ?? 0}</div>
            <div className="text-sm text-violet-200">Avg Score</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Experiments Tab ───────────────────────────────────────────── */}
      {tab === 'experiments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Experiments</h2>
            <button onClick={() => setShowExpForm(!showExpForm)} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700">+ New Experiment</button>
          </div>

          {showExpForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input value={expTitle} onChange={e => setExpTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Multi-modal content agent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={expCategory} onChange={e => setExpCategory(e.target.value as ExperimentCategory)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="agent">Agent</option><option value="skill">Skill</option>
                    <option value="workflow">Workflow</option><option value="integration">Integration</option>
                    <option value="process">Process</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hypothesis</label>
                <input value={expHypothesis} onChange={e => setExpHypothesis(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="If we... then..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Success Criteria (one per line)</label>
                <textarea value={expCriteria} onChange={e => setExpCriteria(e.target.value)} className="w-full px-3 py-2 border rounded-md font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
              </div>
              <button onClick={addExperiment} disabled={!expTitle || !expHypothesis} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50">Create Experiment</button>
            </div>
          )}

          {/* Detail panel */}
          {selectedExp && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4 border-2 border-violet-300 dark:border-violet-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold dark:text-white">{selectedExp.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedExp.description}</p>
                </div>
                <button onClick={() => setSelectedExp(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Hypothesis:</span><p className="dark:text-white">{selectedExp.hypothesis}</p></div>
                <div><span className="text-gray-500">Score:</span><p className="text-2xl font-bold dark:text-white">{selectedExp.score ?? '—'}/100</p></div>
                <div><span className="text-gray-500">Results:</span><p className="dark:text-white">{selectedExp.results.length} recorded</p></div>
              </div>
              {selectedExp.successCriteria.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Success Criteria:</span>
                  <ul className="list-disc list-inside text-sm dark:text-gray-300 mt-1">
                    {selectedExp.successCriteria.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {selectedExp.status === 'draft' && <button onClick={() => transition(selectedExp.id, 'active')} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Activate</button>}
                {selectedExp.status === 'active' && <button onClick={() => transition(selectedExp.id, 'evaluating')} className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg">Move to Evaluation</button>}
                {selectedExp.status === 'evaluating' && <button onClick={() => transition(selectedExp.id, 'graduated')} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg">Graduate</button>}
                {selectedExp.status !== 'archived' && <button onClick={() => transition(selectedExp.id, 'archived')} className="px-3 py-1 bg-gray-400 text-white text-sm rounded-lg">Archive</button>}
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {experiments.length === 0 && <div className="px-4 py-4"><DemoPreviewBanner pageName="Innovation Experiments" steps={['Start the gateway to enable experiment tracking', 'Create an experiment with a hypothesis (e.g. "AI code review can reduce review time by 40%")', 'Track results, evaluate outcomes, and graduate successful experiments to production skills']} /></div>}
            {experiments.map(exp => (
              <div key={exp.id} onClick={() => setSelectedExp(exp)} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-pointer hover:ring-2 hover:ring-violet-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[exp.category]}</span>
                    <h3 className="font-medium dark:text-white">{exp.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[exp.status]}`}>{exp.status}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{exp.hypothesis}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {exp.score !== undefined && <span>Score: {exp.score}/100</span>}
                  <span>{exp.results.length} results</span>
                  {exp.tags.length > 0 && exp.tags.map(t => <span key={t} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hackathons Tab ────────────────────────────────────────────── */}
      {tab === 'hackathons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Hackathons</h2>
            <button onClick={() => setShowHackForm(!showHackForm)} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700">+ New Hackathon</button>
          </div>

          {showHackForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input value={hackTitle} onChange={e => setHackTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (hours)</label>
                  <input type="number" value={hackHours} onChange={e => setHackHours(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={hackDesc} onChange={e => setHackDesc(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} />
              </div>
              <button onClick={addHackathon} disabled={!hackTitle} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50">Create Hackathon</button>
            </div>
          )}

          <div className="grid gap-3">
            {hackathons.length === 0 && <div className="px-4 py-4"><DemoPreviewBanner pageName="Hackathons" steps={['Start the gateway to enable hackathon management', 'Create a hackathon event with a theme and timeline', 'Add experiments, track progress, and award results']} /></div>}
            {hackathons.map(h => (
              <div key={h.id} className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold dark:text-white text-lg">{h.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{h.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${HACK_STATUS[h.status]}`}>{h.status}</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <span>Duration: {Math.round(h.durationMs / 3_600_000)}h</span>
                  <span>Experiments: {h.experimentIds.length}</span>
                  {h.startedAt && <span>Started: {new Date(h.startedAt).toLocaleDateString()}</span>}
                  {h.endsAt && <span>Ends: {new Date(h.endsAt).toLocaleString()}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  {h.status === 'planned' && <button onClick={() => startHack(h.id)} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg">Start</button>}
                  {h.status === 'active' && <button onClick={() => completeHack(h.id)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">Complete</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Graduations Tab ───────────────────────────────────────────── */}
      {tab === 'graduations' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Graduation Pipeline</h2>
          <div className="grid gap-3">
            {graduations.length === 0 && <div className="px-4 py-4"><DemoPreviewBanner pageName="Graduations" steps={['Run experiments and mark successful ones for evaluation', 'Request graduation to promote an experiment to a production skill', 'Review and approve — graduated experiments become permanent skills in the marketplace']} /></div>}
            {graduations.map(g => (
              <div key={g.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium dark:text-white">Experiment: {g.experimentId.slice(0, 12)}...</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Target: <span className="font-medium">{g.targetRegiment}</span> regiment</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${g.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : g.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{g.status}</span>
                </div>
                {g.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => reviewGrad(g.id, 'approved')} className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg">Approve</button>
                    <button onClick={() => reviewGrad(g.id, 'rejected')} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg">Reject</button>
                  </div>
                )}
                {g.reviewNotes && <p className="text-sm text-gray-400 mt-2 italic">"{g.reviewNotes}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Backlog Tab ───────────────────────────────────────────────── */}
      {tab === 'backlog' && backlog && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold dark:text-white">Innovation Backlog</h2>
          {/* Status distribution */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.entries(backlog.byStatus) as [ExperimentStatus, number][]).map(([status, count]) => (
              <div key={status} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
                <div className="text-2xl font-bold dark:text-white">{count}</div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}>{status}</span>
              </div>
            ))}
          </div>
          {/* Category distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium dark:text-white mb-4">By Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {(Object.entries(backlog.byCategory) as [ExperimentCategory, number][]).map(([cat, count]) => (
                <div key={cat} className="text-center">
                  <div className="text-2xl mb-1">{CATEGORY_ICONS[cat]}</div>
                  <div className="text-xl font-bold dark:text-white">{count}</div>
                  <div className="text-xs text-gray-500 capitalize">{cat}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Recent experiments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium dark:text-white mb-4">Recent Experiments</h3>
            <div className="space-y-2">
              {backlog.recentExperiments.map(exp => (
                <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_ICONS[exp.category]}</span>
                    <span className="dark:text-white">{exp.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[exp.status]}`}>{exp.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
