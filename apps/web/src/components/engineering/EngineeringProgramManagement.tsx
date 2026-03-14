/**
 * Engineering Program Management — Sprint, release, and tech initiative tracker
 * Adapted from marketing ProgramManagement for engineering workstreams.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState } from 'react';

type WorkstreamStatus = 'not-started' | 'in-progress' | 'review' | 'completed' | 'blocked';
type ProgramType = 'release' | 'sprint' | 'migration' | 'initiative';

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

const SAMPLE_PROGRAMS: Program[] = [
  {
    id: 'eng-pgm-1',
    name: 'Platform v3.0 Release',
    type: 'release',
    status: 'active',
    startDate: '2026-01-15',
    targetDate: '2026-03-15',
    owner: 'David Kim',
    workstreams: [
      {
        id: 'ew-1', name: 'Backend Services', owner: 'Backend Team', status: 'in-progress',
        startDate: '2026-01-15', dueDate: '2026-02-28', storyPoints: 55, completedPoints: 34, jiraEpic: 'ENG-301',
        tasks: [
          { name: 'API v3 migration', status: 'completed', points: 13 },
          { name: 'Event bus refactor', status: 'completed', points: 8 },
          { name: 'Database schema migration', status: 'in-progress', points: 13 },
          { name: 'Rate limiting implementation', status: 'in-progress', points: 8 },
          { name: 'GraphQL gateway', status: 'not-started', points: 13 },
        ],
      },
      {
        id: 'ew-2', name: 'Frontend', owner: 'Frontend Team', status: 'in-progress',
        startDate: '2026-02-01', dueDate: '2026-03-05', storyPoints: 34, completedPoints: 13, jiraEpic: 'ENG-302',
        tasks: [
          { name: 'Design system v2 components', status: 'completed', points: 8 },
          { name: 'Dashboard rebuild', status: 'in-progress', points: 13 },
          { name: 'Real-time notifications', status: 'not-started', points: 8 },
          { name: 'Accessibility audit fixes', status: 'completed', points: 5 },
        ],
      },
      {
        id: 'ew-3', name: 'DevOps & Infra', owner: 'Platform Team', status: 'in-progress',
        startDate: '2026-01-20', dueDate: '2026-02-25', storyPoints: 21, completedPoints: 13, jiraEpic: 'ENG-303',
        tasks: [
          { name: 'Kubernetes cluster upgrade', status: 'completed', points: 8 },
          { name: 'CI/CD pipeline optimization', status: 'completed', points: 5 },
          { name: 'Monitoring & alerting setup', status: 'in-progress', points: 5 },
          { name: 'Disaster recovery runbook', status: 'not-started', points: 3 },
        ],
      },
      {
        id: 'ew-4', name: 'QA & Testing', owner: 'QA Team', status: 'not-started',
        startDate: '2026-02-25', dueDate: '2026-03-10', storyPoints: 18, completedPoints: 0, jiraEpic: 'ENG-304',
        tasks: [
          { name: 'Integration test suite', status: 'not-started', points: 8 },
          { name: 'Performance benchmarks', status: 'not-started', points: 5 },
          { name: 'Security pen testing', status: 'not-started', points: 3 },
          { name: 'UAT sign-off', status: 'not-started', points: 2 },
        ],
      },
      {
        id: 'ew-5', name: 'Documentation', owner: 'Tech Writers', status: 'not-started',
        startDate: '2026-03-01', dueDate: '2026-03-12', storyPoints: 8, completedPoints: 0,
        tasks: [
          { name: 'API documentation update', status: 'not-started', points: 3 },
          { name: 'Migration guide', status: 'not-started', points: 3 },
          { name: 'Changelog & release notes', status: 'not-started', points: 2 },
        ],
      },
    ],
    deliverables: [
      { id: 'ed-1', name: 'API v3 Endpoints', type: 'API', status: 'in-review' },
      { id: 'ed-2', name: 'Platform Dashboard v2', type: 'UI', status: 'draft' },
      { id: 'ed-3', name: 'Migration Guide', type: 'Documentation', status: 'draft' },
      { id: 'ed-4', name: 'Performance Report', type: 'Report', status: 'draft' },
    ],
  },
  {
    id: 'eng-pgm-2',
    name: 'Microservices Migration',
    type: 'migration',
    status: 'active',
    startDate: '2026-01-01',
    targetDate: '2026-06-30',
    owner: 'Lisa Park',
    workstreams: [
      {
        id: 'ew-6', name: 'Service Decomposition', owner: 'Arch Team', status: 'completed',
        startDate: '2026-01-01', dueDate: '2026-02-15', storyPoints: 21, completedPoints: 21, jiraEpic: 'MIG-100',
        tasks: [
          { name: 'Domain boundary analysis', status: 'completed', points: 8 },
          { name: 'Service dependency mapping', status: 'completed', points: 5 },
          { name: 'API contract definition', status: 'completed', points: 5 },
          { name: 'Data ownership matrix', status: 'completed', points: 3 },
        ],
      },
      {
        id: 'ew-7', name: 'User Service', owner: 'Auth Team', status: 'in-progress',
        startDate: '2026-02-01', dueDate: '2026-03-30', storyPoints: 34, completedPoints: 13, jiraEpic: 'MIG-101',
        tasks: [
          { name: 'User service scaffold', status: 'completed', points: 5 },
          { name: 'Auth migration', status: 'completed', points: 8 },
          { name: 'Session management', status: 'in-progress', points: 8 },
          { name: 'RBAC implementation', status: 'not-started', points: 8 },
          { name: 'Data migration scripts', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'ew-8', name: 'Notification Service', owner: 'Platform Team', status: 'not-started',
        startDate: '2026-03-15', dueDate: '2026-05-01', storyPoints: 21, completedPoints: 0, jiraEpic: 'MIG-102',
        tasks: [
          { name: 'Event-driven architecture', status: 'not-started', points: 8 },
          { name: 'Email/SMS/Push providers', status: 'not-started', points: 5 },
          { name: 'Template engine', status: 'not-started', points: 5 },
          { name: 'Delivery tracking', status: 'not-started', points: 3 },
        ],
      },
      {
        id: 'ew-9', name: 'Integration Testing', owner: 'QA Team', status: 'not-started',
        startDate: '2026-05-01', dueDate: '2026-06-15', storyPoints: 13, completedPoints: 0,
        tasks: [
          { name: 'Contract testing setup', status: 'not-started', points: 5 },
          { name: 'End-to-end flows', status: 'not-started', points: 5 },
          { name: 'Chaos engineering tests', status: 'not-started', points: 3 },
        ],
      },
    ],
    deliverables: [
      { id: 'ed-5', name: 'Architecture Decision Records', type: 'Documentation', status: 'approved' },
      { id: 'ed-6', name: 'User Service API', type: 'API', status: 'in-review' },
      { id: 'ed-7', name: 'Service Mesh Configuration', type: 'Infrastructure', status: 'draft' },
    ],
  },
  {
    id: 'eng-pgm-3',
    name: 'Sprint 24 — Q1 Hardening',
    type: 'sprint',
    status: 'active',
    startDate: '2026-02-17',
    targetDate: '2026-02-28',
    owner: 'David Kim',
    workstreams: [
      {
        id: 'ew-10', name: 'Bug Fixes', owner: 'Core Team', status: 'in-progress',
        startDate: '2026-02-17', dueDate: '2026-02-28', storyPoints: 21, completedPoints: 8, jiraEpic: 'SPR-240',
        tasks: [
          { name: 'Fix auth token refresh race condition', status: 'completed', points: 5 },
          { name: 'Resolve memory leak in worker pool', status: 'in-progress', points: 8 },
          { name: 'Fix pagination offset bug', status: 'completed', points: 3 },
          { name: 'Resolve flaky CI tests', status: 'not-started', points: 5 },
        ],
      },
      {
        id: 'ew-11', name: 'Performance', owner: 'Perf Team', status: 'in-progress',
        startDate: '2026-02-17', dueDate: '2026-02-28', storyPoints: 13, completedPoints: 5,
        tasks: [
          { name: 'Query optimization (top 10 endpoints)', status: 'completed', points: 5 },
          { name: 'Redis caching layer', status: 'in-progress', points: 5 },
          { name: 'CDN configuration', status: 'not-started', points: 3 },
        ],
      },
      {
        id: 'ew-12', name: 'Tech Debt', owner: 'Various', status: 'in-progress',
        startDate: '2026-02-17', dueDate: '2026-02-28', storyPoints: 8, completedPoints: 3,
        tasks: [
          { name: 'Upgrade Node.js to v22', status: 'completed', points: 3 },
          { name: 'Remove deprecated API endpoints', status: 'in-progress', points: 3 },
          { name: 'Consolidate logging format', status: 'not-started', points: 2 },
        ],
      },
    ],
    deliverables: [
      { id: 'ed-8', name: 'Performance Benchmark Report', type: 'Report', status: 'draft' },
      { id: 'ed-9', name: 'Sprint Retrospective Notes', type: 'Document', status: 'draft' },
    ],
  },
];

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
  release:    '🚀',
  sprint:     '🏃',
  migration:  '🔄',
  initiative: '🎯',
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
        <span className="text-sm font-semibold text-slate-800 w-36 flex-shrink-0">{ws.name}</span>
        <StatusBadge status={ws.status} />
        <ProgressBar completed={ws.completedPoints} total={ws.storyPoints} className="flex-1 max-w-[180px]" />
        <span className="text-[11px] text-slate-500 tabular-nums w-20 text-right">{ws.completedPoints}/{ws.storyPoints} pts</span>
        <span className="text-[11px] text-slate-400 w-24 text-right truncate">{ws.owner}</span>
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
        isSelected ? 'border-slate-400 bg-slate-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
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

export function EngineeringProgramManagement() {
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_PROGRAMS[0].id);
  const selected = SAMPLE_PROGRAMS.find(p => p.id === selectedId) ?? SAMPLE_PROGRAMS[0];

  const totalPoints = selected.workstreams.reduce((s, w) => s + w.storyPoints, 0);
  const donePoints = selected.workstreams.reduce((s, w) => s + w.completedPoints, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Engineering Program Management</h2>
        <p className="text-sm text-slate-600 mt-1">
          Track releases, sprints, and migrations across workstreams — backend, frontend, DevOps, QA. Monitor velocity, story points, and deliverables.
        </p>
      </div>

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

      <div className="grid grid-cols-3 gap-6">
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
