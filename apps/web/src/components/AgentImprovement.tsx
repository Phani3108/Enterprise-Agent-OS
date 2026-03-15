'use client';
/**
 * AgentImprovement — Performance reviews, improvement plans, feedback loops,
 * and training exemplar management for continuous agent upskilling.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/* ── Types ─────────────────────────────────────────────────────────────── */

interface PerformanceReview {
  id: string; agentId: string; reviewedBy: string; period: string;
  metrics: { successRate: number; avgLatencyMs: number; avgTokenCost: number; taskCount: number; qualityScore: number };
  scores: { reliability: number; efficiency: number; quality: number; collaboration: number; costEffectiveness: number; overall: number };
  outcome: 'exceeds' | 'meets' | 'needs-improvement' | 'underperforming';
  notes: string; createdAt: string;
}

interface ImprovementPlan {
  id: string; agentId: string; status: 'active' | 'completed' | 'abandoned';
  objectives: { id: string; description: string; metric: string; current: number; target: number; achieved: boolean; notes: string }[];
  createdBy: string; createdAt: string; completedAt: string | null;
}

interface FeedbackEntry {
  id: string; agentId: string; submittedBy: string;
  type: 'positive' | 'negative' | 'correction';
  category: string; message: string; executionId: string | null; createdAt: string;
}

interface TrainingExemplar {
  id: string; agentId: string; rating: 'exemplary' | 'good' | 'cautionary';
  executionId: string; taskDescription: string; notes: string; createdAt: string;
}

interface HealthReport {
  totalReviews: number; avgOverallScore: number;
  outcomeDistribution: Record<string, number>;
  activePlans: number; completedPlans: number;
  feedbackSentiment: { positive: number; negative: number; correction: number };
  agentsNeedingAttention: { agentId: string; reason: string }[];
}

type Tab = 'reviews' | 'plans' | 'feedback' | 'exemplars' | 'health';

/* ── Constants ─────────────────────────────────────────────────────────── */

const OUTCOME_COLORS: Record<string, string> = {
  exceeds: 'bg-emerald-100 text-emerald-700', meets: 'bg-blue-100 text-blue-700',
  'needs-improvement': 'bg-amber-100 text-amber-700', underperforming: 'bg-red-100 text-red-700',
};
const FEEDBACK_ICONS: Record<string, string> = { positive: '👍', negative: '👎', correction: '🔧' };

/* ── Component ────────────────────────────────────────────────────────── */

export default function AgentImprovement() {
  const [tab, setTab] = useState<Tab>('health');
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [plans, setPlans] = useState<ImprovementPlan[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [exemplars, setExemplars] = useState<TrainingExemplar[]>([]);
  const [health, setHealth] = useState<HealthReport | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rAgentId, setRAgentId] = useState('');
  const [rReviewer, setRReviewer] = useState('');
  const [rPeriod, setRPeriod] = useState('');
  const [rReliability, setRReliability] = useState('7');
  const [rEfficiency, setREfficiency] = useState('7');
  const [rQuality, setRQuality] = useState('7');
  const [rCollaboration, setRCollaboration] = useState('7');
  const [rCost, setRCost] = useState('7');
  const [rNotes, setRNotes] = useState('');

  // Feedback form
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbAgentId, setFbAgentId] = useState('');
  const [fbSubmittedBy, setFbSubmittedBy] = useState('');
  const [fbType, setFbType] = useState<'positive' | 'negative' | 'correction'>('positive');
  const [fbCategory, setFbCategory] = useState('quality');
  const [fbMessage, setFbMessage] = useState('');

  /* ── Fetching ───────────────────────────────────────────────────────── */
  const fetchAll = () => {
    fetch(`${API}/api/improvement/health`).then(r => r.json()).then(setHealth).catch(() => {});
    fetch(`${API}/api/improvement/reviews`).then(r => r.json()).then(d => setReviews(d.reviews ?? [])).catch(() => {});
    fetch(`${API}/api/improvement/plans`).then(r => r.json()).then(d => setPlans(d.plans ?? [])).catch(() => {});
    fetch(`${API}/api/improvement/feedback?limit=100`).then(r => r.json()).then(d => setFeedback(d.feedback ?? [])).catch(() => {});
    fetch(`${API}/api/improvement/exemplars`).then(r => r.json()).then(d => setExemplars(d.exemplars ?? [])).catch(() => {});
  };
  useEffect(fetchAll, []);

  /* ── Handlers ───────────────────────────────────────────────────────── */
  const submitReview = async () => {
    await fetch(`${API}/api/improvement/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: rAgentId, reviewedBy: rReviewer, period: rPeriod,
        metrics: { successRate: 0, avgLatencyMs: 0, avgTokenCost: 0, taskCount: 0, qualityScore: 0 },
        scores: { reliability: +rReliability, efficiency: +rEfficiency, quality: +rQuality, collaboration: +rCollaboration, costEffectiveness: +rCost },
        notes: rNotes,
      }),
    });
    setShowReviewForm(false); fetchAll();
  };

  const submitFeedback = async () => {
    await fetch(`${API}/api/improvement/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: fbAgentId, submittedBy: fbSubmittedBy, type: fbType, category: fbCategory, message: fbMessage }),
    });
    setShowFeedbackForm(false); setFbMessage(''); fetchAll();
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'health', label: 'Health Report', icon: '🏥' },
    { key: 'reviews', label: 'Reviews', icon: '📋' },
    { key: 'plans', label: 'Improvement Plans', icon: '🎯' },
    { key: 'feedback', label: 'Feedback', icon: '💬' },
    { key: 'exemplars', label: 'Training Exemplars', icon: '⭐' },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Agent Improvement</h1>
        <p className="text-indigo-200 mb-6">Performance reviews, feedback loops & continuous upskilling</p>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{health?.totalReviews ?? 0}</div>
            <div className="text-sm text-indigo-200">Reviews</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{health?.avgOverallScore?.toFixed(1) ?? '—'}</div>
            <div className="text-sm text-indigo-200">Avg Score</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{health?.activePlans ?? 0}</div>
            <div className="text-sm text-indigo-200">Active Plans</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{health?.agentsNeedingAttention?.length ?? 0}</div>
            <div className="text-sm text-indigo-200">Need Attention</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Health Tab ────────────────────────────────────────────────── */}
      {tab === 'health' && health && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Outcome Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium dark:text-white mb-4">Outcome Distribution</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(health.outcomeDistribution).map(([k, v]) => (
                  <div key={k} className={`rounded-lg p-3 text-center ${OUTCOME_COLORS[k] ?? 'bg-gray-100'}`}>
                    <div className="text-xl font-bold">{v}</div>
                    <div className="text-xs capitalize">{k.replace(/-/g, ' ')}</div>
                  </div>
                ))}
                {Object.keys(health.outcomeDistribution).length === 0 && <p className="text-sm text-gray-500 col-span-2">No reviews yet</p>}
              </div>
            </div>

            {/* Feedback Sentiment */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-medium dark:text-white mb-4">Feedback Sentiment</h3>
              <div className="space-y-3">
                {(['positive', 'negative', 'correction'] as const).map(k => {
                  const count = health.feedbackSentiment[k] ?? 0;
                  const total = (health.feedbackSentiment.positive + health.feedbackSentiment.negative + health.feedbackSentiment.correction) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="dark:text-gray-300 capitalize">{FEEDBACK_ICONS[k]} {k}</span>
                        <span className="dark:text-white">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${k === 'positive' ? 'bg-emerald-500' : k === 'negative' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Agents Needing Attention */}
          {health.agentsNeedingAttention.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-amber-500">
              <h3 className="font-medium dark:text-white mb-3">Agents Needing Attention</h3>
              <div className="space-y-2">
                {health.agentsNeedingAttention.map(a => (
                  <div key={a.agentId} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="font-medium dark:text-white">{a.agentId}</span>
                    <span className="text-sm text-amber-600 dark:text-amber-400">{a.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reviews Tab ───────────────────────────────────────────────── */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Performance Reviews</h2>
            <button onClick={() => setShowReviewForm(!showReviewForm)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ New Review</button>
          </div>

          {showReviewForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent ID</label>
                  <input value={rAgentId} onChange={e => setRAgentId(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reviewer</label>
                  <input value={rReviewer} onChange={e => setRReviewer(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
                  <input value={rPeriod} onChange={e => setRPeriod(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="2026-Q1" />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { l: 'Reliability', v: rReliability, s: setRReliability },
                  { l: 'Efficiency', v: rEfficiency, s: setREfficiency },
                  { l: 'Quality', v: rQuality, s: setRQuality },
                  { l: 'Collaboration', v: rCollaboration, s: setRCollaboration },
                  { l: 'Cost Eff.', v: rCost, s: setRCost },
                ].map(f => (
                  <div key={f.l}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{f.l} (1-10)</label>
                    <input type="number" min="1" max="10" value={f.v} onChange={e => f.s(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={rNotes} onChange={e => setRNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <button onClick={submitReview} disabled={!rAgentId || !rReviewer} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">Submit Review</button>
            </div>
          )}

          <div className="grid gap-3">
            {reviews.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No performance reviews yet.</div>}
            {reviews.map(r => (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium dark:text-white">{r.agentId}</h3>
                    <p className="text-xs text-gray-500">{r.period} · by {r.reviewedBy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold dark:text-white">{r.scores.overall.toFixed(1)}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${OUTCOME_COLORS[r.outcome]}`}>{r.outcome.replace(/-/g, ' ')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {Object.entries(r.scores).filter(([k]) => k !== 'overall').map(([k, v]) => (
                    <div key={k} className="bg-gray-50 dark:bg-gray-700 rounded p-1">
                      <div className="font-bold dark:text-white">{v}</div>
                      <div className="text-gray-500 dark:text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>
                {r.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Plans Tab ─────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Improvement Plans</h2>
          {plans.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No improvement plans created yet.</div>}
          {plans.map(p => {
            const achieved = p.objectives.filter(o => o.achieved).length;
            const total = p.objectives.length;
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium dark:text-white">{p.agentId}</h3>
                    <p className="text-xs text-gray-500">by {p.createdBy} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm dark:text-white">{achieved}/{total} objectives</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : p.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${total > 0 ? (achieved / total) * 100 : 0}%` }} />
                </div>
                <div className="space-y-2">
                  {p.objectives.map(o => (
                    <div key={o.id} className="flex items-center gap-2 text-sm">
                      <span>{o.achieved ? '✅' : '⬜'}</span>
                      <span className="dark:text-gray-300 flex-1">{o.description}</span>
                      <span className="text-xs text-gray-500">{o.metric}: {o.current} → {o.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Feedback Tab ──────────────────────────────────────────────── */}
      {tab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Feedback Loop</h2>
            <button onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Submit Feedback</button>
          </div>

          {showFeedbackForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agent ID</label>
                  <input value={fbAgentId} onChange={e => setFbAgentId(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                  <input value={fbSubmittedBy} onChange={e => setFbSubmittedBy(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select value={fbType} onChange={e => setFbType(e.target.value as any)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="positive">Positive</option><option value="negative">Negative</option><option value="correction">Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={fbCategory} onChange={e => setFbCategory(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="quality">Quality</option><option value="speed">Speed</option><option value="accuracy">Accuracy</option>
                    <option value="handoff">Handoff</option><option value="cost">Cost</option><option value="general">General</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea value={fbMessage} onChange={e => setFbMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <button onClick={submitFeedback} disabled={!fbAgentId || !fbMessage} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">Submit</button>
            </div>
          )}

          <div className="grid gap-3">
            {feedback.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No feedback entries yet.</div>}
            {feedback.map(f => (
              <div key={f.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{FEEDBACK_ICONS[f.type]}</span>
                  <span className="font-medium dark:text-white">{f.agentId}</span>
                  <span className="text-xs text-gray-500 capitalize">· {f.category}</span>
                  <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${f.type === 'positive' ? 'bg-emerald-100 text-emerald-700' : f.type === 'negative' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{f.type}</span>
                </div>
                <p className="text-sm dark:text-gray-300">{f.message}</p>
                <p className="text-xs text-gray-400 mt-1">by {f.submittedBy} · {new Date(f.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exemplars Tab ─────────────────────────────────────────────── */}
      {tab === 'exemplars' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Training Exemplars</h2>
          {exemplars.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No training exemplars recorded yet.</div>}
          <div className="grid gap-3">
            {exemplars.map(e => (
              <div key={e.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{e.rating === 'exemplary' ? '🌟' : e.rating === 'good' ? '✅' : '⚠️'}</span>
                    <h3 className="font-medium dark:text-white">{e.taskDescription}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    e.rating === 'exemplary' ? 'bg-amber-100 text-amber-700' : e.rating === 'good' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>{e.rating}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Agent: {e.agentId} · Execution: {e.executionId}</p>
                {e.notes && <p className="text-sm dark:text-gray-300 mt-1">{e.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
