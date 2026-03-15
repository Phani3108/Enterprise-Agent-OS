'use client';
/**
 * VisionDashboard — Vision-down execution layer.
 * Create vision statements, decompose into objectives, cascade to regiments,
 * and track progress with PMO status reports.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface KeyResult { id: string; description: string; target: string; current: string; progress: number; }
interface OKR { id: string; objective: string; owner: string; quarter: string; status: string; keyResults: KeyResult[]; }

interface RegimentTask {
  id: string; objectiveId: string; title: string; description: string;
  assignedToColonel: string; assignedToRegiment: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'; createdAt: string;
}

interface StrategicObjective {
  id: string; title: string; description: string; assignedTo: string;
  priority: 'critical' | 'high' | 'medium'; okrs: OKR[];
  status: 'pending' | 'assigned' | 'in-progress' | 'completed';
  regimentTasks: RegimentTask[];
}

interface VisionDecomposition {
  visionId: string; strategicObjectives: StrategicObjective[];
  decomposedBy: string; decomposedAt: string; rationale: string;
}

interface VisionStatement {
  id: string; statement: string; createdBy: string; createdAt: string;
  status: 'draft' | 'decomposing' | 'active' | 'completed' | 'archived';
  decomposition?: VisionDecomposition;
}

interface PMOReport {
  generatedAt: string; generatedBy: string; activeVisions: number; activePrograms: number;
  regimentStatus: Record<string, { tasks: number; completed: number; blocked: number }>;
  risks: { id: string; description: string; severity: string; mitigation: string }[];
  escalations: string[]; summary: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  decomposing: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-slate-100 text-slate-400',
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-slate-100 text-slate-600',
};

const OFFICER_LABELS: Record<string, string> = {
  cmo: 'CMO (Hyperion)', cto: 'CTO (Atlas)', cpo: 'CPO (Themis)', chro: 'CHRO (Rhea)',
};

export default function VisionDashboard() {
  const [visions, setVisions] = useState<VisionStatement[]>([]);
  const [selected, setSelected] = useState<VisionStatement | null>(null);
  const [newVision, setNewVision] = useState('');
  const [creating, setCreating] = useState(false);
  const [decomposing, setDecomposing] = useState(false);
  const [cascading, setCascading] = useState<string | null>(null);
  const [pmoReport, setPmoReport] = useState<PMOReport | null>(null);
  const [showPMO, setShowPMO] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch(`${API}/api/vision`)
      .then(r => r.json())
      .then(data => { setVisions(data.visions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Refresh selected vision when visions change
  useEffect(() => {
    if (selected) {
      const updated = visions.find(v => v.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [visions, selected]);

  const handleCreate = async () => {
    if (!newVision.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/vision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: newVision.trim() }),
      });
      const data = await res.json();
      if (data.vision) {
        setVisions(prev => [data.vision, ...prev]);
        setSelected(data.vision);
        setNewVision('');
      }
    } finally { setCreating(false); }
  };

  const handleDecompose = async (visionId: string) => {
    setDecomposing(true);
    try {
      await fetch(`${API}/api/vision/${encodeURIComponent(visionId)}/decompose`, { method: 'POST' });
      refresh();
    } finally { setDecomposing(false); }
  };

  const handleCascade = async (visionId: string, objectiveId: string) => {
    setCascading(objectiveId);
    try {
      await fetch(`${API}/api/vision/${encodeURIComponent(visionId)}/cascade/${encodeURIComponent(objectiveId)}`, { method: 'POST' });
      refresh();
    } finally { setCascading(null); }
  };

  const handlePMOReport = async () => {
    setShowPMO(true);
    const res = await fetch(`${API}/api/pmo/status${selected ? `?visionId=${selected.id}` : ''}`);
    const data = await res.json();
    setPmoReport(data.report);
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-violet-900 to-purple-900 text-white px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">🔭</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vision & Strategy</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Vision-Down, Output-Up Architecture</p>
            </div>
          </div>
          <p className="text-indigo-300 text-sm mt-3 max-w-2xl">
            Define organizational vision. The CEO decomposes it into strategic objectives assigned to C-Suite officers.
            Officers cascade objectives to their regiment Colonels. Output flows back up through the chain of command.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handlePMOReport}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              📋 PMO Status Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Create Vision */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">New Vision Statement</h2>
          <div className="flex gap-3">
            <input
              value={newVision}
              onChange={e => setNewVision(e.target.value)}
              placeholder="e.g., Become the #1 AI-powered organizational platform in the enterprise market by Q4 2026..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newVision.trim()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {creating ? 'Creating...' : 'Set Vision'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vision List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Visions</h2>
            {loading ? (
              <div className="text-sm text-slate-400 py-4 text-center">Loading...</div>
            ) : visions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <div className="text-3xl mb-2">🔭</div>
                <p className="text-sm text-slate-400">No visions yet. Create one above to get started.</p>
              </div>
            ) : (
              visions.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    v.id === selected?.id ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-800 font-medium line-clamp-2">{v.statement}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[v.status]}`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-2">
                    {new Date(v.createdAt).toLocaleDateString()} · {v.decomposition?.strategicObjectives.length ?? 0} objectives
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Vision Detail */}
          <div className="lg:col-span-2 space-y-4">
            {selected ? (
              <>
                {/* Vision Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selected.statement}</h3>
                      <div className="text-xs text-slate-400 mt-1">Created {new Date(selected.createdAt).toLocaleString()}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[selected.status]}`}>
                      {selected.status}
                    </span>
                  </div>

                  {/* Decompose button */}
                  {selected.status === 'draft' && (
                    <button
                      onClick={() => handleDecompose(selected.id)}
                      disabled={decomposing}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {decomposing ? '🤖 CEO is decomposing...' : '👑 Decompose with CEO (Kronos)'}
                    </button>
                  )}

                  {selected.decomposition && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">CEO Rationale</div>
                      <p className="text-sm text-slate-600">{selected.decomposition.rationale}</p>
                    </div>
                  )}
                </div>

                {/* Strategic Objectives */}
                {selected.decomposition && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Strategic Objectives ({selected.decomposition.strategicObjectives.length})
                    </h3>
                    {selected.decomposition.strategicObjectives.map(obj => (
                      <div key={obj.id} className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{obj.title}</h4>
                            <p className="text-sm text-slate-500 mt-1">{obj.description}</p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[obj.priority]}`}>
                              {obj.priority}
                            </span>
                          </div>
                        </div>

                        {/* Assigned To */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-slate-400">Assigned to:</span>
                          <span className="text-xs font-medium text-indigo-600">
                            {OFFICER_LABELS[obj.assignedTo] ?? obj.assignedTo}
                          </span>
                        </div>

                        {/* OKRs */}
                        {obj.okrs.length > 0 && (
                          <div className="mb-3">
                            {obj.okrs.map(okr => (
                              <div key={okr.id}>
                                {okr.keyResults.map(kr => (
                                  <div key={kr.id} className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                    <span className="flex-1">{kr.description}</span>
                                    <span className="text-slate-400">{kr.target}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cascade button */}
                        {obj.regimentTasks.length === 0 && (
                          <button
                            onClick={() => handleCascade(selected.id, obj.id)}
                            disabled={cascading === obj.id}
                            className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
                          >
                            {cascading === obj.id ? 'Cascading to regiment...' : '⬇️ Cascade to Regiment'}
                          </button>
                        )}

                        {/* Regiment Tasks */}
                        {obj.regimentTasks.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            <div className="text-xs font-semibold text-slate-400 uppercase mb-2">
                              Regiment Tasks ({obj.regimentTasks.length})
                            </div>
                            <div className="space-y-2">
                              {obj.regimentTasks.map(task => (
                                <div key={task.id} className="bg-slate-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="text-sm font-medium text-slate-800">{task.title}</div>
                                      <div className="text-xs text-slate-500 mt-0.5">{task.description}</div>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                                      task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                      task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-1">
                                    Colonel: {task.assignedToColonel} · Regiment: {task.assignedToRegiment}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="text-4xl mb-3">🔭</div>
                <p className="text-slate-400">Select a vision to view its decomposition and execution status</p>
              </div>
            )}
          </div>
        </div>

        {/* PMO Report Modal */}
        {showPMO && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowPMO(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">📋 PMO Status Report</h2>
                <button onClick={() => setShowPMO(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {!pmoReport ? (
                <div className="text-center py-8 text-slate-400">Generating report...</div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Executive Summary</div>
                    <p className="text-sm text-slate-700">{pmoReport.summary}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-indigo-700">{pmoReport.activeVisions}</div>
                      <div className="text-xs text-indigo-500">Active Visions</div>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-violet-700">{pmoReport.activePrograms}</div>
                      <div className="text-xs text-violet-500">Active Programs</div>
                    </div>
                  </div>

                  {/* Regiment Status */}
                  {Object.keys(pmoReport.regimentStatus).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Regiment Status</div>
                      <div className="space-y-2">
                        {Object.entries(pmoReport.regimentStatus).map(([reg, status]) => (
                          <div key={reg} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-slate-700">{reg}</span>
                            <div className="flex gap-3 text-xs">
                              <span className="text-slate-500">{status.tasks} tasks</span>
                              <span className="text-emerald-600">{status.completed} done</span>
                              {status.blocked > 0 && <span className="text-red-600">{status.blocked} blocked</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Escalations */}
                  {pmoReport.escalations.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-red-500 uppercase mb-2">⚠️ Escalations</div>
                      <ul className="space-y-1">
                        {pmoReport.escalations.map((e, i) => (
                          <li key={i} className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 text-right">
                    Generated by Mnemosyne (PMO Director) at {new Date(pmoReport.generatedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
