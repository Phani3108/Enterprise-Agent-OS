/**
 * Product Program Management — Feature launch, roadmap, and initiative tracker
 * Adapted from marketing ProgramManagement for product workstreams.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState } from 'react';

type WorkstreamStatus = 'not-started' | 'in-progress' | 'review' | 'completed' | 'blocked';
type ProgramType = 'feature-launch' | 'quarter-plan' | 'platform' | 'initiative';

interface Workstream {
  id: string;
  name: string;
  owner: string;
  status: WorkstreamStatus;
  startDate: string;
  dueDate: string;
  storyPoints: number;
  completedPoints: number;
  jiraEpic?: string;
  tasks: { name: string; status: WorkstreamStatus; points: number }[];
}

interface Deliverable {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'in-review' | 'approved' | 'live';
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

const SAMPLE_PROGRAMS: Program[] = [
  {
    id: 'prod-pgm-1',
    name: 'AI Copilot Feature Launch',
    type: 'feature-launch',
    status: 'active',
    startDate: '2026-01-20',
    targetDate: '2026-03-15',
    owner: 'Emma Zhang',
    workstreams: [
      {
        id: 'pw-1', name: 'Product Discovery', owner: 'Emma Zhang', status: 'completed',
        startDate: '2026-01-20', dueDate: '2026-02-05', storyPoints: 21, completedPoints: 21, jiraEpic: 'PRD-200',
        tasks: [
          { name: 'User interviews (10 customers)', status: 'completed', points: 8 },
          { name: 'Competitive analysis', status: 'completed', points: 5 },
          { name: 'PRD v1 draft', status: 'completed', points: 5 },
          { name: 'Stakeholder alignment', status: 'completed', points: 3 },
        ],
      },
      {
        id: 'pw-2', name: 'Design & Prototyping', owner: 'Design Team', status: 'completed',
        startDate: '2026-02-01', dueDate: '2026-02-20', storyPoints: 18, completedPoints: 18, jiraEpic: 'PRD-201',
        tasks: [
          { name: 'Wireframes & user flows', status: 'completed', points: 5 },
          { name: 'High-fidelity mockups', status: 'completed', points: 5 },
          { name: 'Interactive prototype', status: 'completed', points: 5 },
          { name: 'Usability testing (5 users)', status: 'completed', points: 3 },
        ],
      },
      {
        id: 'pw-3', name: 'Engineering Execution', owner: 'Eng Team', status: 'in-progress',
        startDate: '2026-02-15', dueDate: '2026-03-05', storyPoints: 42, completedPoints: 18, jiraEpic: 'PRD-202',
        tasks: [
          { name: 'Backend API development', status: 'completed', points: 13 },
          { name: 'Frontend implementation', status: 'in-progress', points: 13 },
          { name: 'AI model integration', status: 'in-progress', points: 8 },
          { name: 'Performance optimization', status: 'not-started', points: 5 },
          { name: 'Feature flags setup', status: 'completed', points: 3 },
        ],
      },
      {
        id: 'pw-4', name: 'Go-to-Market', owner: 'Marketing Team', status: 'in-progress',
        startDate: '2026-02-20', dueDate: '2026-03-10', storyPoints: 15, completedPoints: 5, jiraEpic: 'PRD-203',
        tasks: [
          { name: 'Positioning & messaging', status: 'completed', points: 3 },
          { name: 'Launch blog post', status: 'in-progress', points: 3 },
          { name: 'Demo video production', status: 'not-started', points: 5 },
          { name: 'Email announcement', status: 'not-started', points: 2 },
          { name: 'Documentation & help center', status: 'completed', points: 2 },
        ],
      },
      {
        id: 'pw-5', name: 'Beta & Launch', owner: 'Emma Zhang', status: 'not-started',
        startDate: '2026-03-05', dueDate: '2026-03-15', storyPoints: 10, completedPoints: 0,
        tasks: [
          { name: 'Private beta rollout (50 users)', status: 'not-started', points: 3 },
          { name: 'Beta feedback analysis', status: 'not-started', points: 3 },
          { name: 'Launch readiness review', status: 'not-started', points: 2 },
          { name: 'GA release', status: 'not-started', points: 2 },
        ],
      },
    ],
    deliverables: [
      { id: 'pd-1', name: 'Product Requirements Document', type: 'PRD', status: 'approved' },
      { id: 'pd-2', name: 'Design Specifications', type: 'Design', status: 'approved' },
      { id: 'pd-3', name: 'Launch Blog Post', type: 'Content', status: 'draft' },
      { id: 'pd-4', name: 'Demo Video', type: 'Video', status: 'draft' },
    ],
  },
  {
    id: 'prod-pgm-2',
    name: 'Q2 2026 Roadmap Execution',
    type: 'quarter-plan',
    status: 'planning',
    startDate: '2026-04-01',
    targetDate: '2026-06-30',
    owner: 'Emma Zhang',
    workstreams: [
      {
        id: 'pw-6', name: 'Collaboration Suite', owner: 'Team A', status: 'not-started',
        startDate: '2026-04-01', dueDate: '2026-05-15', storyPoints: 34, completedPoints: 0, jiraEpic: 'Q2-100',
        tasks: [
          { name: 'Real-time editing feature', status: 'not-started', points: 13 },
          { name: 'Comments & mentions', status: 'not-started', points: 8 },
          { name: 'Sharing & permissions', status: 'not-started', points: 8 },
          { name: 'Activity feed', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'pw-7', name: 'Analytics Dashboard', owner: 'Team B', status: 'not-started',
        startDate: '2026-04-15', dueDate: '2026-06-01', storyPoints: 26, completedPoints: 0, jiraEpic: 'Q2-101',
        tasks: [
          { name: 'Custom report builder', status: 'not-started', points: 8 },
          { name: 'Funnel visualization', status: 'not-started', points: 8 },
          { name: 'Export & scheduling', status: 'not-started', points: 5 },
          { name: 'Anomaly detection', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'pw-8', name: 'API Platform v2', owner: 'Platform Team', status: 'not-started',
        startDate: '2026-04-01', dueDate: '2026-06-15', storyPoints: 21, completedPoints: 0, jiraEpic: 'Q2-102',
        tasks: [
          { name: 'GraphQL endpoint', status: 'not-started', points: 8 },
          { name: 'Webhook management', status: 'not-started', points: 5 },
          { name: 'Rate limiting & quotas', status: 'not-started', points: 5 },
          { name: 'Developer portal', status: 'not-started', points: 3 },
        ],
      },
    ],
    deliverables: [
      { id: 'pd-5', name: 'Q2 Roadmap Deck', type: 'Presentation', status: 'in-review' },
      { id: 'pd-6', name: 'Resource Allocation Plan', type: 'Plan', status: 'draft' },
    ],
  },
  {
    id: 'prod-pgm-3',
    name: 'Enterprise Tier Launch',
    type: 'initiative',
    status: 'active',
    startDate: '2026-02-01',
    targetDate: '2026-04-30',
    owner: 'Michael Torres',
    workstreams: [
      {
        id: 'pw-9', name: 'Enterprise Features', owner: 'Eng Team', status: 'in-progress',
        startDate: '2026-02-01', dueDate: '2026-03-30', storyPoints: 55, completedPoints: 21, jiraEpic: 'ENT-300',
        tasks: [
          { name: 'SSO / SAML integration', status: 'completed', points: 13 },
          { name: 'Audit logging', status: 'completed', points: 8 },
          { name: 'Advanced RBAC', status: 'in-progress', points: 13 },
          { name: 'Data residency controls', status: 'not-started', points: 8 },
          { name: 'SLA monitoring dashboard', status: 'not-started', points: 8 },
          { name: 'Dedicated support portal', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'pw-10', name: 'Pricing & Packaging', owner: 'Product Ops', status: 'in-progress',
        startDate: '2026-02-15', dueDate: '2026-03-15', storyPoints: 13, completedPoints: 5,
        tasks: [
          { name: 'Competitive pricing analysis', status: 'completed', points: 3 },
          { name: 'Tier definition & limits', status: 'completed', points: 2 },
          { name: 'Billing system integration', status: 'in-progress', points: 5 },
          { name: 'Enterprise quote workflow', status: 'not-started', points: 3 },
        ],
      },
      {
        id: 'pw-11', name: 'Sales Enablement', owner: 'Sales Ops', status: 'not-started',
        startDate: '2026-03-15', dueDate: '2026-04-15', storyPoints: 10, completedPoints: 0,
        tasks: [
          { name: 'Enterprise pitch deck', status: 'not-started', points: 3 },
          { name: 'ROI calculator', status: 'not-started', points: 3 },
          { name: 'Case studies (3)', status: 'not-started', points: 2 },
          { name: 'Competitive battlecard', status: 'not-started', points: 2 },
        ],
      },
    ],
    deliverables: [
      { id: 'pd-7', name: 'Enterprise PRD', type: 'PRD', status: 'approved' },
      { id: 'pd-8', name: 'Pricing Matrix', type: 'Pricing', status: 'in-review' },
      { id: 'pd-9', name: 'Enterprise Sales Deck', type: 'Presentation', status: 'draft' },
    ],
  },
];

const STATUS_STYLES: Record<WorkstreamStatus, { bg: string; text: string; label: string }> = {
  'not-started': { bg: 'bg-slate-100',   text: 'text-slate-600',   label: 'Not Started' },
  'in-progress': { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'In Progress' },
  'review':      { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'In Review' },
  'completed':   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  'blocked':     { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Blocked' },
};

const DELIVERABLE_STYLES: Record<string, { bg: string; text: string }> = {
  'draft':     { bg: 'bg-slate-100',   text: 'text-slate-600' },
  'in-review': { bg: 'bg-amber-100',   text: 'text-amber-700' },
  'approved':  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'live':      { bg: 'bg-violet-100',  text: 'text-violet-700' },
};

const TYPE_ICONS: Record<ProgramType, string> = {
  'feature-launch': '🚀',
  'quarter-plan':   '📅',
  'platform':       '🏗️',
  'initiative':     '🎯',
};

function pct(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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
          className={`h-full rounded-full transition-all ${p === 100 ? 'bg-emerald-500' : p > 50 ? 'bg-violet-500' : p > 0 ? 'bg-amber-500' : 'bg-slate-200'}`}
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
        <span className="text-sm font-semibold text-slate-800 w-36 flex-shrink-0">{ws.name}</span>
        <StatusBadge status={ws.status} />
        <ProgressBar completed={ws.completedPoints} total={ws.storyPoints} className="flex-1 max-w-[180px]" />
        <span className="text-[11px] text-slate-500 tabular-nums w-20 text-right">{ws.completedPoints}/{ws.storyPoints} pts</span>
        <span className="text-[11px] text-slate-400 w-24 text-right truncate">{ws.owner}</span>
        {ws.jiraEpic && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 font-mono">{ws.jiraEpic}</span>
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
                    task.status === 'in-progress' ? 'bg-violet-500' :
                    task.status === 'review' ? 'bg-amber-500' :
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
        isSelected ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{TYPE_ICONS[program.type]}</span>
        <h3 className="text-sm font-bold text-slate-900 flex-1">{program.name}</h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          program.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
          program.status === 'active' ? 'bg-violet-100 text-violet-700' :
          program.status === 'review' ? 'bg-amber-100 text-amber-700' :
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

export function ProductProgramManagement() {
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const selected = SAMPLE_PROGRAMS.find(p => p.id === selectedId) ?? SAMPLE_PROGRAMS[0];

  const totalPoints = selected.workstreams.reduce((s, w) => s + w.storyPoints, 0);
  const donePoints = selected.workstreams.reduce((s, w) => s + w.completedPoints, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Product Program Management</h2>
        <p className="text-sm text-slate-600 mt-1">
          Track feature launches, quarterly plans, and strategic initiatives across discovery, design, engineering, and GTM workstreams.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Programs', value: SAMPLE_PROGRAMS.filter(p => p.status === 'active').length, color: 'text-violet-600' },
          { label: 'Total Story Points', value: SAMPLE_PROGRAMS.reduce((s, p) => s + p.workstreams.reduce((s2, w) => s2 + w.storyPoints, 0), 0), color: 'text-slate-900' },
          { label: 'Points Completed', value: SAMPLE_PROGRAMS.reduce((s, p) => s + p.workstreams.reduce((s2, w) => s2 + w.completedPoints, 0), 0), color: 'text-emerald-600' },
          { label: 'Deliverables', value: SAMPLE_PROGRAMS.reduce((s, p) => s + p.deliverables.length, 0), color: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Programs</h3>
          {SAMPLE_PROGRAMS.map(pgm => (
            <ProgramCard key={pgm.id} program={pgm} isSelected={pgm.id === selectedId} onSelect={() => setSelectedId(pgm.id)} />
          ))}
        </div>

        <div className="col-span-2 space-y-4">
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

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Workstreams</h3>
            <div className="space-y-2">
              {selected.workstreams.map(ws => <WorkstreamRow key={ws.id} ws={ws} />)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Deliverables</h3>
            <div className="grid grid-cols-2 gap-2">
              {selected.deliverables.map(d => {
                const ds = DELIVERABLE_STYLES[d.status] ?? DELIVERABLE_STYLES['draft'];
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-100 bg-white">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.type}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ds.bg} ${ds.text}`}>{d.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
