/**
 * Program Management — Cross-functional workstream tracker
 * Tracks campaigns/events holistically: design, dev, copywriting, QA status,
 * dates, story points (Jira-extractable), and final deliverables.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState } from 'react';

// --- Types ---
type WorkstreamStatus = 'not-started' | 'in-progress' | 'review' | 'completed' | 'blocked';
type ProgramType = 'campaign' | 'event' | 'launch' | 'initiative';

interface Workstream {
  id: string;
  name: string;       // e.g. "Design", "Copywriting", "Development"
  owner: string;
  status: WorkstreamStatus;
  startDate: string;
  dueDate: string;
  storyPoints: number;
  completedPoints: number;
  jiraEpic?: string;  // e.g. "MKT-142"
  tasks: { name: string; status: WorkstreamStatus; points: number }[];
}

interface Deliverable {
  id: string;
  name: string;
  type: string;       // e.g. "Landing Page", "Ad Set", "Email Sequence"
  status: 'draft' | 'in-review' | 'approved' | 'live';
  url?: string;
}

interface Program {
  id: string;
  name: string;
  type: ProgramType;
  status: 'planning' | 'active' | 'review' | 'completed';
  startDate: string;
  targetDate: string;
  owner: string;
  workstreams: Workstream[];
  deliverables: Deliverable[];
}

// --- Sample Data ---
const SAMPLE_PROGRAMS: Program[] = [
  {
    id: 'pgm-1',
    name: 'Q2 Product Launch Campaign',
    type: 'launch',
    status: 'active',
    startDate: '2026-02-15',
    targetDate: '2026-04-01',
    owner: 'Sarah Chen',
    workstreams: [
      {
        id: 'ws-1', name: 'Copywriting', owner: 'Alex R.', status: 'completed',
        startDate: '2026-02-15', dueDate: '2026-03-01', storyPoints: 13, completedPoints: 13, jiraEpic: 'MKT-142',
        tasks: [
          { name: 'Landing page copy', status: 'completed', points: 5 },
          { name: 'Email sequence (5 drips)', status: 'completed', points: 5 },
          { name: 'Social post variants', status: 'completed', points: 3 },
        ],
      },
      {
        id: 'ws-2', name: 'Design', owner: 'Maya L.', status: 'in-progress',
        startDate: '2026-02-20', dueDate: '2026-03-10', storyPoints: 21, completedPoints: 13, jiraEpic: 'MKT-143',
        tasks: [
          { name: 'Landing page mockup', status: 'completed', points: 8 },
          { name: 'Ad banners (6 sizes)', status: 'in-progress', points: 5 },
          { name: 'Email templates', status: 'completed', points: 5 },
          { name: 'Infographics', status: 'not-started', points: 3 },
        ],
      },
      {
        id: 'ws-3', name: 'Development', owner: 'Dev Team', status: 'in-progress',
        startDate: '2026-03-01', dueDate: '2026-03-20', storyPoints: 34, completedPoints: 8, jiraEpic: 'MKT-144',
        tasks: [
          { name: 'Landing page build', status: 'in-progress', points: 13 },
          { name: 'Form & CRM integration', status: 'not-started', points: 8 },
          { name: 'UTM tracking setup', status: 'completed', points: 5 },
          { name: 'A/B test variants', status: 'not-started', points: 8 },
        ],
      },
      {
        id: 'ws-4', name: 'Ad Setup', owner: 'Priya K.', status: 'not-started',
        startDate: '2026-03-15', dueDate: '2026-03-25', storyPoints: 8, completedPoints: 0, jiraEpic: 'MKT-145',
        tasks: [
          { name: 'LinkedIn campaign setup', status: 'not-started', points: 3 },
          { name: 'Google Ads campaign', status: 'not-started', points: 3 },
          { name: 'Audience targeting', status: 'not-started', points: 2 },
        ],
      },
      {
        id: 'ws-5', name: 'QA & Review', owner: 'Team', status: 'not-started',
        startDate: '2026-03-20', dueDate: '2026-03-28', storyPoints: 5, completedPoints: 0,
        tasks: [
          { name: 'Cross-browser testing', status: 'not-started', points: 2 },
          { name: 'Stakeholder review', status: 'not-started', points: 2 },
          { name: 'Legal compliance check', status: 'not-started', points: 1 },
        ],
      },
    ],
    deliverables: [
      { id: 'd-1', name: 'Product Launch Landing Page', type: 'Landing Page', status: 'draft' },
      { id: 'd-2', name: '5-Email Nurture Sequence', type: 'Email Sequence', status: 'in-review' },
      { id: 'd-3', name: 'LinkedIn + Google Ad Sets', type: 'Ad Set', status: 'draft' },
      { id: 'd-4', name: 'Product Infographic', type: 'Infographic', status: 'draft' },
    ],
  },
  {
    id: 'pgm-2',
    name: 'Annual User Conference 2026',
    type: 'event',
    status: 'planning',
    startDate: '2026-03-01',
    targetDate: '2026-06-15',
    owner: 'James O.',
    workstreams: [
      {
        id: 'ws-6', name: 'Copywriting', owner: 'Content Team', status: 'in-progress',
        startDate: '2026-03-01', dueDate: '2026-04-15', storyPoints: 18, completedPoints: 5, jiraEpic: 'EVT-201',
        tasks: [
          { name: 'Event website copy', status: 'completed', points: 5 },
          { name: 'Speaker bios & abstracts', status: 'in-progress', points: 5 },
          { name: 'Invitation email series', status: 'not-started', points: 5 },
          { name: 'Press release', status: 'not-started', points: 3 },
        ],
      },
      {
        id: 'ws-7', name: 'Design', owner: 'Creative Team', status: 'not-started',
        startDate: '2026-03-15', dueDate: '2026-05-01', storyPoints: 26, completedPoints: 0, jiraEpic: 'EVT-202',
        tasks: [
          { name: 'Event branding package', status: 'not-started', points: 8 },
          { name: 'Event website design', status: 'not-started', points: 8 },
          { name: 'Social media assets', status: 'not-started', points: 5 },
          { name: 'Signage & printed materials', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'ws-8', name: 'Development', owner: 'Dev Team', status: 'not-started',
        startDate: '2026-04-01', dueDate: '2026-05-15', storyPoints: 21, completedPoints: 0, jiraEpic: 'EVT-203',
        tasks: [
          { name: 'Event registration page', status: 'not-started', points: 8 },
          { name: 'Agenda builder', status: 'not-started', points: 8 },
          { name: 'Speaker portal', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'ws-9', name: 'Logistics', owner: 'Ops Team', status: 'in-progress',
        startDate: '2026-03-01', dueDate: '2026-06-01', storyPoints: 15, completedPoints: 3,
        tasks: [
          { name: 'Venue booking', status: 'completed', points: 3 },
          { name: 'Catering & AV setup', status: 'not-started', points: 5 },
          { name: 'Speaker travel coordination', status: 'not-started', points: 4 },
          { name: 'Sponsor coordination', status: 'not-started', points: 3 },
        ],
      },
    ],
    deliverables: [
      { id: 'd-5', name: 'Event Registration Site', type: 'Website', status: 'draft' },
      { id: 'd-6', name: 'Event Branding Package', type: 'Brand Kit', status: 'draft' },
      { id: 'd-7', name: 'Sponsor Deck', type: 'Presentation', status: 'in-review' },
    ],
  },
  {
    id: 'pgm-3',
    name: 'Brand Refresh Initiative',
    type: 'initiative',
    status: 'active',
    startDate: '2026-01-10',
    targetDate: '2026-03-30',
    owner: 'Sarah Chen',
    workstreams: [
      {
        id: 'ws-10', name: 'Copywriting', owner: 'Alex R.', status: 'completed',
        startDate: '2026-01-10', dueDate: '2026-02-10', storyPoints: 13, completedPoints: 13, jiraEpic: 'BRD-100',
        tasks: [
          { name: 'Brand messaging guide', status: 'completed', points: 5 },
          { name: 'Tagline exploration', status: 'completed', points: 3 },
          { name: 'Website copy refresh', status: 'completed', points: 5 },
        ],
      },
      {
        id: 'ws-11', name: 'Design', owner: 'Maya L.', status: 'review',
        startDate: '2026-01-20', dueDate: '2026-03-01', storyPoints: 21, completedPoints: 18, jiraEpic: 'BRD-101',
        tasks: [
          { name: 'Logo redesign', status: 'completed', points: 8 },
          { name: 'Color palette & typography', status: 'completed', points: 5 },
          { name: 'Brand guidelines PDF', status: 'review', points: 5 },
          { name: 'Template library', status: 'completed', points: 3 },
        ],
      },
      {
        id: 'ws-12', name: 'Development', owner: 'Dev Team', status: 'in-progress',
        startDate: '2026-02-15', dueDate: '2026-03-20', storyPoints: 13, completedPoints: 8, jiraEpic: 'BRD-102',
        tasks: [
          { name: 'Website reskin', status: 'in-progress', points: 8 },
          { name: 'Email template update', status: 'completed', points: 3 },
          { name: 'Social profile updates', status: 'not-started', points: 2 },
        ],
      },
    ],
    deliverables: [
      { id: 'd-8', name: 'Brand Guidelines v2.0', type: 'Document', status: 'in-review' },
      { id: 'd-9', name: 'Refreshed Website', type: 'Website', status: 'draft' },
      { id: 'd-10', name: 'New Template Library', type: 'Template Kit', status: 'approved' },
    ],
  },
];

// --- Helpers ---
const STATUS_STYLES: Record<WorkstreamStatus, { bg: string; text: string; label: string }> = {
  'not-started': { bg: 'bg-slate-100',   text: 'text-slate-600',   label: 'Not Started' },
  'in-progress': { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'In Progress' },
  'review':      { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'In Review' },
  'completed':   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  'blocked':     { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Blocked' },
};

const DELIVERABLE_STYLES: Record<string, { bg: string; text: string }> = {
  'draft':     { bg: 'bg-slate-100',   text: 'text-slate-600' },
  'in-review': { bg: 'bg-amber-100',   text: 'text-amber-700' },
  'approved':  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'live':      { bg: 'bg-blue-100',    text: 'text-blue-700' },
};

const TYPE_ICONS: Record<ProgramType, string> = {
  campaign:   '📡',
  event:      '🎪',
  launch:     '🚀',
  initiative: '🎯',
};

function pct(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// --- Components ---
function StatusBadge({ status }: { status: WorkstreamStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
}

function ProgressBar({ completed, total, className = '' }: { completed: number; total: number; className?: string }) {
  const p = pct(completed, total);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${p === 100 ? 'bg-emerald-500' : p > 50 ? 'bg-blue-500' : p > 0 ? 'bg-amber-500' : 'bg-slate-200'}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-slate-500 tabular-nums w-8 text-right">{p}%</span>
    </div>
  );
}

function WorkstreamRow({ ws }: { ws: Workstream }) {
  const [expanded, setExpanded] = useState(false);
  const days = daysUntil(ws.dueDate);
  const overdue = days < 0 && ws.status !== 'completed';

  return (
    <div className="border border-slate-100 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="text-[10px] text-slate-400">{expanded ? '▼' : '▶'}</span>
        <span className="text-sm font-semibold text-slate-800 w-28 flex-shrink-0">{ws.name}</span>
        <StatusBadge status={ws.status} />
        <ProgressBar completed={ws.completedPoints} total={ws.storyPoints} className="flex-1 max-w-[180px]" />
        <span className="text-[11px] text-slate-500 tabular-nums w-20 text-right">{ws.completedPoints}/{ws.storyPoints} pts</span>
        <span className="text-[11px] text-slate-400 w-20 text-right">{ws.owner}</span>
        {ws.jiraEpic && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">{ws.jiraEpic}</span>
        )}
        <span className={`text-[10px] w-16 text-right font-medium ${overdue ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-slate-400'}`}>
          {ws.status === 'completed' ? '✓ Done' : overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
        </span>
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-50">
          <div className="space-y-1.5">
            {ws.tasks.map((task, i) => {
              const ts = STATUS_STYLES[task.status];
              return (
                <div key={i} className="flex items-center gap-3 text-[12px] pl-4">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.status === 'in-progress' ? 'bg-blue-500' :
                    task.status === 'review' ? 'bg-violet-500' :
                    task.status === 'blocked' ? 'bg-red-500' :
                    'bg-slate-300'
                  }`} />
                  <span className="flex-1 text-slate-700">{task.name}</span>
                  <span className={`${ts.text} text-[10px] font-medium`}>{ts.label}</span>
                  <span className="text-slate-400 tabular-nums w-12 text-right">{task.points} pts</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 pl-4">
            <span>📅 {ws.startDate} → {ws.dueDate}</span>
            {ws.jiraEpic && <span>🔗 Jira: {ws.jiraEpic}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program, isSelected, onSelect }: { program: Program; isSelected: boolean; onSelect: () => void }) {
  const totalPoints = program.workstreams.reduce((s, w) => s + w.storyPoints, 0);
  const donePoints = program.workstreams.reduce((s, w) => s + w.completedPoints, 0);
  const days = daysUntil(program.targetDate);
  const completedStreams = program.workstreams.filter(w => w.status === 'completed').length;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{TYPE_ICONS[program.type]}</span>
        <h3 className="text-sm font-bold text-slate-900 flex-1">{program.name}</h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          program.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
          program.status === 'active' ? 'bg-blue-100 text-blue-700' :
          program.status === 'review' ? 'bg-violet-100 text-violet-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {program.status}
        </span>
      </div>
      <ProgressBar completed={donePoints} total={totalPoints} className="mb-2" />
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{completedStreams}/{program.workstreams.length} workstreams done</span>
        <span>{donePoints}/{totalPoints} pts</span>
        <span className={days < 0 ? 'text-red-600 font-medium' : days <= 14 ? 'text-amber-600' : ''}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d to target`}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
        <span>👤 {program.owner}</span>
        <span className="mx-1">•</span>
        <span>Target: {program.targetDate}</span>
      </div>
    </button>
  );
}

export function ProgramManagement() {
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const selected = SAMPLE_PROGRAMS.find(p => p.id === selectedId) ?? SAMPLE_PROGRAMS[0];

  const totalPoints = selected.workstreams.reduce((s, w) => s + w.storyPoints, 0);
  const donePoints = selected.workstreams.reduce((s, w) => s + w.completedPoints, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Program Management</h2>
        <p className="text-sm text-slate-600 mt-1">
          Track campaigns, events, and initiatives across workstreams — design, dev, copywriting, QA. Monitor dates, story points, and deliverables.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Programs', value: SAMPLE_PROGRAMS.filter(p => p.status === 'active').length, color: 'text-blue-600' },
          { label: 'Total Story Points', value: SAMPLE_PROGRAMS.reduce((s, p) => s + p.workstreams.reduce((s2, w) => s2 + w.storyPoints, 0), 0), color: 'text-slate-900' },
          { label: 'Points Completed', value: SAMPLE_PROGRAMS.reduce((s, p) => s + p.workstreams.reduce((s2, w) => s2 + w.completedPoints, 0), 0), color: 'text-emerald-600' },
          { label: 'Deliverables', value: SAMPLE_PROGRAMS.reduce((s, p) => s + p.deliverables.length, 0), color: 'text-violet-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Program selector + detail */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: program cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Programs</h3>
          {SAMPLE_PROGRAMS.map(pgm => (
            <ProgramCard
              key={pgm.id}
              program={pgm}
              isSelected={pgm.id === selectedId}
              onSelect={() => setSelectedId(pgm.id)}
            />
          ))}
        </div>

        {/* Right: workstreams + deliverables */}
        <div className="col-span-2 space-y-4">
          {/* Selected program header */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{TYPE_ICONS[selected.type]}</span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">{selected.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {selected.startDate} → {selected.targetDate} • {selected.owner} • {pct(donePoints, totalPoints)}% complete
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900 tabular-nums">{donePoints}<span className="text-slate-400 font-normal">/{totalPoints}</span></p>
                <p className="text-[10px] text-slate-500">story points</p>
              </div>
            </div>
            <ProgressBar completed={donePoints} total={totalPoints} />
          </div>

          {/* Workstreams */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Workstreams</h3>
            <div className="space-y-2">
              {selected.workstreams.map(ws => (
                <WorkstreamRow key={ws.id} ws={ws} />
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Final Deliverables</h3>
            <div className="grid grid-cols-2 gap-2">
              {selected.deliverables.map(d => {
                const ds = DELIVERABLE_STYLES[d.status] ?? DELIVERABLE_STYLES['draft'];
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-100 bg-white">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.type}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ds.bg} ${ds.text}`}>
                      {d.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jira sync hint */}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 flex items-center gap-3">
            <span className="text-lg">🔗</span>
            <div>
              <p className="text-xs font-medium text-slate-700">Jira Integration Available</p>
              <p className="text-[11px] text-slate-500">
                Connect Jira to auto-sync epics, story points, and sprint progress. Workstream data updates in real-time.
              </p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-medium flex-shrink-0">
              Connect Jira →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
