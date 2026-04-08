/**
 * AgentMeetingView — Live agent standup, sprint planning, retrospective, and war room meetings.
 * Shows meeting transcripts, decisions, action items, and delegation chains.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

// ── Types ───────────────────────────────────────────────────────
interface MeetingTemplate { type: string; title: string; defaultAgenda: string[]; defaultDurationMin: number; description: string }
interface A2AAgent { agent_id: string; name: string; regiment: string; rank: string; persona: string }
interface MeetingEntry { speaker: string; agent_id: string; message: string; type: string; timestamp: string }
interface MeetingDecision { topic: string; outcome: string; votes: Record<string, string>; confidence: number; rationale: string }
interface ActionItem { owner: string; agent_id: string; task: string; deadline: string; status: string }
interface AgentMeeting {
  meeting_id: string; type: string; title: string; task_ref?: string;
  participants: A2AAgent[]; agenda: string[]; discussion: MeetingEntry[];
  decisions: MeetingDecision[]; action_items: ActionItem[];
  status: string; scheduled_at: string; started_at?: string; completed_at?: string; summary?: string;
}

// ── Rank Colors ────────────────────────────────────────────────
const RANK_COLORS: Record<string, string> = {
  Colonel: 'bg-amber-100 text-amber-700 border-amber-200',
  Captain: 'bg-blue-100 text-blue-700 border-blue-200',
  Corporal: 'bg-slate-100 text-slate-700 border-slate-200',
  Sergeant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PERSONA_COLORS: Record<string, string> = {
  Marketing: 'text-orange-600', Engineering: 'text-blue-600', Product: 'text-violet-600',
  HR: 'text-pink-600', Program: 'text-emerald-600',
};

const ENTRY_ICONS: Record<string, string> = {
  update: '💬', blocker: '🚫', proposal: '💡', vote: '🗳', decision: '✅', question: '❓', answer: '💡',
};

const MEETING_ICONS: Record<string, string> = {
  standup: '☀️', sprint_planning: '📋', retrospective: '🔄', design_review: '🔍', war_room: '🚨', debrief: '📊',
};

// ═══════════════════════════════════════════════════════════════
export default function AgentMeetingView() {
  const [templates, setTemplates] = useState<MeetingTemplate[]>([]);
  const [meetings, setMeetings] = useState<AgentMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<AgentMeeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'templates' | 'history'>('templates');
  const discussionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/meetings/templates`).then(r => r.json()).then(d => setTemplates(d.templates || [])).catch(() => {});
    fetch(`${API}/api/a2a/meetings?limit=20`).then(r => r.json()).then(d => setMeetings(d.meetings || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (discussionRef.current) discussionRef.current.scrollTop = discussionRef.current.scrollHeight;
  }, [selectedMeeting]);

  const startMeeting = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/meetings/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.meeting) {
        setMeetings(prev => [data.meeting, ...prev]);
        setSelectedMeeting(data.meeting);
        setTab('history');
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Agent Meetings</h1>
            <p className="page-subtitle">Standup, sprint planning, retrospective, design review, and war room</p>
          </div>
          <div className="flex gap-1">
            {(['templates', 'history'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {t === 'templates' ? 'Start Meeting' : `History (${meetings.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left panel */}
          <div className="col-span-1 space-y-4">
            {tab === 'templates' ? (
              <>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meeting Templates</h3>
                {templates.map(t => (
                  <div key={t.type} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{MEETING_ICONS[t.type] || '📋'}</span>
                      <h4 className="text-sm font-semibold text-slate-900">{t.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{t.defaultDurationMin} min</span>
                      <button onClick={() => startMeeting(t.type)} disabled={loading}
                        className="btn btn-primary btn-sm">
                        {loading ? 'Starting...' : 'Start'}
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Meetings</h3>
                {meetings.map(m => (
                  <button key={m.meeting_id} onClick={() => setSelectedMeeting(m)}
                    className={`card p-3 w-full text-left transition-all ${selectedMeeting?.meeting_id === m.meeting_id ? 'border-blue-500 shadow-md' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{MEETING_ICONS[m.type] || '📋'}</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{m.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className={`badge ${m.status === 'completed' ? 'badge-success' : m.status === 'in_progress' ? 'badge-info' : 'badge-neutral'}`}>
                        {m.status}
                      </span>
                      <span>{m.participants.length} agents</span>
                      <span>{m.decisions.length} decisions</span>
                    </div>
                  </button>
                ))}
                {meetings.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No meetings yet. Start one from a template.</p>
                )}
              </>
            )}
          </div>

          {/* Right panel — Meeting detail */}
          <div className="col-span-2">
            {selectedMeeting ? (
              <div className="card overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{MEETING_ICONS[selectedMeeting.type] || '📋'}</span>
                        <h2 className="text-base font-semibold text-slate-900">{selectedMeeting.title}</h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedMeeting.participants.length} participants &middot; {selectedMeeting.discussion.length} messages &middot; {selectedMeeting.decisions.length} decisions
                      </p>
                    </div>
                    <span className={`badge ${selectedMeeting.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                      {selectedMeeting.status}
                    </span>
                  </div>

                  {/* Participants */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedMeeting.participants.map(p => (
                      <span key={p.agent_id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RANK_COLORS[p.rank] || 'bg-slate-100 text-slate-600'}`}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Discussion transcript */}
                <div ref={discussionRef} className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                  {selectedMeeting.discussion.map((entry, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-sm mt-0.5">{ENTRY_ICONS[entry.type] || '💬'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-bold ${PERSONA_COLORS[selectedMeeting.participants.find(p => p.agent_id === entry.agent_id)?.persona || ''] || 'text-slate-700'}`}>
                              {entry.speaker}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{entry.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Decisions */}
                {selectedMeeting.decisions.length > 0 && (
                  <div className="border-t border-slate-200 px-5 py-4 bg-emerald-50/30">
                    <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">Decisions</h3>
                    {selectedMeeting.decisions.map((d, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-900">{d.topic}</span>
                          <span className="text-[10px] text-emerald-600 font-mono">{(d.confidence * 100).toFixed(0)}% confidence</span>
                        </div>
                        <p className="text-sm text-slate-700">{d.outcome}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{d.rationale}</p>
                        <div className="flex gap-1 mt-1.5">
                          {Object.entries(d.votes).map(([agentId, vote]) => (
                            <span key={agentId} className={`text-[9px] px-1.5 py-0.5 rounded ${vote === 'agree' ? 'bg-emerald-100 text-emerald-700' : vote === 'disagree' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                              {vote}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Items */}
                {selectedMeeting.action_items.length > 0 && (
                  <div className="border-t border-slate-200 px-5 py-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Action Items</h3>
                    {selectedMeeting.action_items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'done' ? 'bg-emerald-500' : item.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">{item.task}</p>
                          <p className="text-[10px] text-slate-500">{item.owner} &middot; Due {item.deadline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-12 text-center">
                <span className="text-4xl block mb-4">🤝</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Meeting Selected</h3>
                <p className="text-sm text-slate-500">Start a meeting from a template or select one from history to view the transcript.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
