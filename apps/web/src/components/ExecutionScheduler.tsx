'use client';

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScheduleType = 'cron' | 'interval' | 'event' | 'one-time';
type JobStatus = 'active' | 'paused' | 'failed' | 'completed' | 'pending';

interface ScheduledJob {
  id: string;
  name: string;
  skillId: string;
  skillName: string;
  personaId: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  eventTrigger?: string;
  oneTimeAt?: string;
  status: JobStatus;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  inputs?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  tags: string[];
  logs: JobLog[];
}

interface JobLog {
  id: string;
  jobId: string;
  status: 'running' | 'success' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  output?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Sample Data
// ---------------------------------------------------------------------------

const SAMPLE_JOBS: ScheduledJob[] = [
  {
    id: 'job-1',
    name: 'Daily Sprint Digest',
    skillId: 'engineering.sprint.digest',
    skillName: 'Sprint Digest Generator',
    personaId: 'engineering',
    scheduleType: 'cron',
    cronExpression: '0 9 * * MON-FRI',
    status: 'active',
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: new Date(Date.now() + 72000000).toISOString(),
    runCount: 47,
    successCount: 45,
    failureCount: 2,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    timeout: 120,
    retries: 2,
    tags: ['engineering', 'daily'],
    logs: [
      { id: 'l1', jobId: 'job-1', status: 'success', startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3540000).toISOString(), durationMs: 58234, output: 'Sprint digest generated: 12 items, 3 blockers identified, 2 at-risk tickets.' },
      { id: 'l2', jobId: 'job-1', status: 'success', startedAt: new Date(Date.now() - 90000000).toISOString(), completedAt: new Date(Date.now() - 89940000).toISOString(), durationMs: 61100, output: 'Sprint digest generated: 15 items, 1 blocker identified.' },
      { id: 'l3', jobId: 'job-1', status: 'failed', startedAt: new Date(Date.now() - 176400000).toISOString(), durationMs: 30000, error: 'Jira API timeout after 30s. Retry 1/2 failed. Retry 2/2 failed.' },
    ],
  },
  {
    id: 'job-2',
    name: 'Campaign Performance Monitor',
    skillId: 'marketing.campaign.monitor',
    skillName: 'Campaign Performance Monitor',
    personaId: 'marketing',
    scheduleType: 'cron',
    cronExpression: '*/30 8-18 * * MON-FRI',
    status: 'active',
    lastRun: new Date(Date.now() - 1800000).toISOString(),
    nextRun: new Date(Date.now() + 1800000).toISOString(),
    runCount: 284,
    successCount: 282,
    failureCount: 2,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    timeout: 60,
    retries: 1,
    tags: ['marketing', 'monitoring'],
    logs: [
      { id: 'l4', jobId: 'job-2', status: 'success', startedAt: new Date(Date.now() - 1800000).toISOString(), completedAt: new Date(Date.now() - 1770000).toISOString(), durationMs: 28900, output: 'CTR: 2.4% (+0.3%), Impressions: 14,200. No anomalies detected.' },
    ],
  },
  {
    id: 'job-3',
    name: 'PR Merge → Auto Review',
    skillId: 'engineering.pr.architecture_review',
    skillName: 'PR Architecture Review',
    personaId: 'engineering',
    scheduleType: 'event',
    eventTrigger: 'github.pull_request.opened',
    status: 'active',
    lastRun: new Date(Date.now() - 7200000).toISOString(),
    runCount: 128,
    successCount: 126,
    failureCount: 2,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    timeout: 180,
    retries: 0,
    tags: ['engineering', 'github', 'event-driven'],
    logs: [
      { id: 'l5', jobId: 'job-3', status: 'success', startedAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7140000).toISOString(), durationMs: 62400, output: 'PR #481 reviewed. Architecture: 94%, Security: 91%. 1 suggestion posted.' },
      { id: 'l6', jobId: 'job-3', status: 'success', startedAt: new Date(Date.now() - 18000000).toISOString(), completedAt: new Date(Date.now() - 17940000).toISOString(), durationMs: 57800, output: 'PR #479 reviewed. Architecture: 88%, Security: 95%. 3 suggestions posted.' },
    ],
  },
  {
    id: 'job-4',
    name: 'Weekly Business Review Report',
    skillId: 'leadership.business.review',
    skillName: 'Business Review Generator',
    personaId: 'leadership',
    scheduleType: 'cron',
    cronExpression: '0 8 * * MON',
    status: 'paused',
    lastRun: new Date(Date.now() - 7 * 86400000).toISOString(),
    nextRun: new Date(Date.now() + 86400000).toISOString(),
    runCount: 12,
    successCount: 11,
    failureCount: 1,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    timeout: 300,
    retries: 3,
    tags: ['leadership', 'weekly'],
    logs: [],
  },
  {
    id: 'job-5',
    name: 'One-Time: Q1 Board Report',
    skillId: 'leadership.board.report',
    skillName: 'Board Report Generator',
    personaId: 'leadership',
    scheduleType: 'one-time',
    oneTimeAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    status: 'pending',
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    timeout: 600,
    retries: 2,
    tags: ['leadership', 'quarterly'],
    logs: [],
  },
];

// Common cron presets
const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at 9am', value: '0 9 * * *' },
  { label: 'Weekdays at 9am', value: '0 9 * * MON-FRI' },
  { label: 'Weekly Monday 9am', value: '0 9 * * MON' },
  { label: 'Monthly 1st at 9am', value: '0 9 1 * *' },
];

const EVENT_TRIGGERS = [
  { value: 'github.pull_request.opened', label: 'GitHub: PR Opened' },
  { value: 'github.push.main', label: 'GitHub: Push to Main' },
  { value: 'jira.issue.created', label: 'Jira: Issue Created' },
  { value: 'jira.sprint.started', label: 'Jira: Sprint Started' },
  { value: 'jira.sprint.completed', label: 'Jira: Sprint Completed' },
  { value: 'hubspot.deal.won', label: 'HubSpot: Deal Won' },
  { value: 'hubspot.contact.created', label: 'HubSpot: Contact Created' },
  { value: 'agentos.skill.completed', label: 'AgentOS: Skill Completed' },
  { value: 'agentos.workflow.failed', label: 'AgentOS: Workflow Failed' },
  { value: 'webhook.custom', label: 'Custom Webhook' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function futureTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const config = {
    active: 'bg-emerald-50 text-emerald-600',
    paused: 'bg-amber-50 text-amber-600',
    failed: 'bg-red-50 text-red-600',
    completed: 'bg-blue-50 text-blue-600',
    pending: 'bg-gray-100 text-gray-500',
  };
  const dots = {
    active: '● ',
    paused: '◦ ',
    failed: '● ',
    completed: '✓ ',
    pending: '○ ',
  };
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${config[status]}`}>
      {dots[status]}{status}
    </span>
  );
}

function ScheduleTypeBadge({ type }: { type: ScheduleType }) {
  const config = {
    cron: 'bg-purple-50 text-purple-600',
    interval: 'bg-blue-50 text-blue-600',
    event: 'bg-orange-50 text-orange-600',
    'one-time': 'bg-gray-100 text-gray-600',
  };
  const icons = { cron: '⏰', interval: '🔄', event: '⚡', 'one-time': '🎯' };
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full ${config[type]}`}>
      {icons[type]} {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Job Detail Panel
// ---------------------------------------------------------------------------

function JobDetail({ job, onClose, onToggle, onRun }: {
  job: ScheduledJob;
  onClose: () => void;
  onToggle: () => void;
  onRun: () => void;
}) {
  const successRate = job.runCount > 0 ? Math.round((job.successCount / job.runCount) * 100) : 100;

  return (
    <div className="w-96 flex-shrink-0 border-l border-gray-100 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-800 truncate">{job.name}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status + Actions */}
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <ScheduleTypeBadge type={job.scheduleType} />
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={onRun}
              className="text-[10px] px-2.5 py-1 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
              data-testid={`run-job-${job.id}`}
            >
              ▶ Run Now
            </button>
            <button
              onClick={onToggle}
              className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors border ${
                job.status === 'active'
                  ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {job.status === 'active' ? '⏸ Pause' : '▶ Resume'}
            </button>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Schedule</div>
          {job.scheduleType === 'cron' && (
            <div className="font-mono text-xs text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
              {job.cronExpression}
            </div>
          )}
          {job.scheduleType === 'event' && (
            <div className="text-xs text-gray-700">Trigger: <strong>{job.eventTrigger}</strong></div>
          )}
          {job.scheduleType === 'interval' && (
            <div className="text-xs text-gray-700">Every {formatDuration(job.intervalMs ?? 0)}</div>
          )}
          {job.scheduleType === 'one-time' && (
            <div className="text-xs text-gray-700">
              At {job.oneTimeAt ? new Date(job.oneTimeAt).toLocaleString() : '—'}
            </div>
          )}
          {job.nextRun && (
            <div className="text-[10px] text-gray-400">Next run: {futureTime(job.nextRun)}</div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Runs', value: String(job.runCount) },
            { label: 'Success Rate', value: `${successRate}%` },
            { label: 'Successes', value: String(job.successCount) },
            { label: 'Failures', value: String(job.failureCount) },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400">{s.label}</div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Config */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Configuration</div>
          {[
            { label: 'Skill', value: job.skillName },
            { label: 'Timeout', value: `${job.timeout}s` },
            { label: 'Retries', value: String(job.retries) },
            { label: 'Created', value: new Date(job.createdAt).toLocaleDateString() },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{row.label}</span>
              <span className="text-gray-700 font-medium">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.tags.map((t) => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
            ))}
          </div>
        )}

        {/* Logs */}
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Runs</div>
          {job.logs.length === 0 ? (
            <p className="text-xs text-gray-400">No runs yet</p>
          ) : (
            <div className="space-y-2">
              {job.logs.map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border text-xs ${
                  log.status === 'success' ? 'bg-emerald-50 border-emerald-100' :
                  log.status === 'failed' ? 'bg-red-50 border-red-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${
                      log.status === 'success' ? 'text-emerald-700' :
                      log.status === 'failed' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {log.status === 'success' ? '✓' : log.status === 'failed' ? '✗' : '●'} {log.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{relativeTime(log.startedAt)}</span>
                  </div>
                  {log.durationMs && (
                    <div className="text-[10px] text-gray-500 mb-1">{formatDuration(log.durationMs)}</div>
                  )}
                  {log.output && <div className="text-[10px] text-gray-600 line-clamp-2">{log.output}</div>}
                  {log.error && <div className="text-[10px] text-red-600 font-mono">{log.error}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Job Modal
// ---------------------------------------------------------------------------

function NewJobModal({ onClose, onSave }: { onClose: () => void; onSave: (job: Partial<ScheduledJob>) => void }) {
  const [name, setName] = useState('');
  const [skillName, setSkillName] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('cron');
  const [cron, setCron] = useState('0 9 * * MON-FRI');
  const [eventTrigger, setEventTrigger] = useState(EVENT_TRIGGERS[0].value);
  const [intervalVal, setIntervalVal] = useState('60');
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>('minutes');
  const [oneTimeAt, setOneTimeAt] = useState('');
  const [timeout, setTimeout_] = useState('120');
  const [retries, setRetries] = useState('2');
  const [tags, setTags] = useState('');

  const handleSave = () => {
    if (!name.trim() || !skillName.trim()) return;
    const ms = scheduleType === 'interval'
      ? parseInt(intervalVal) * (intervalUnit === 'hours' ? 3600000 : 60000)
      : undefined;
    onSave({
      name: name.trim(),
      skillName: skillName.trim(),
      skillId: skillName.toLowerCase().replace(/\s+/g, '-'),
      scheduleType,
      cronExpression: scheduleType === 'cron' ? cron : undefined,
      intervalMs: ms,
      eventTrigger: scheduleType === 'event' ? eventTrigger : undefined,
      oneTimeAt: scheduleType === 'one-time' ? oneTimeAt : undefined,
      timeout: parseInt(timeout),
      retries: parseInt(retries),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[540px] mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">New Scheduled Job</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Job Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily Sprint Digest"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400"
                data-testid="job-name-input" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Skill *</label>
              <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Sprint Digest Generator"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
            </div>
          </div>

          {/* Schedule Type */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Schedule Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['cron', 'interval', 'event', 'one-time'] as ScheduleType[]).map((t) => (
                <button key={t}
                  onClick={() => setScheduleType(t)}
                  className={`py-2 text-xs rounded-xl border transition-colors capitalize ${
                    scheduleType === t ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {t === 'cron' ? '⏰' : t === 'interval' ? '🔄' : t === 'event' ? '⚡' : '🎯'} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Config */}
          {scheduleType === 'cron' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Cron Expression</label>
              <input value={cron} onChange={(e) => setCron(e.target.value)}
                className="w-full text-sm font-mono px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400 mb-2"
                data-testid="cron-input" />
              <div className="flex flex-wrap gap-1">
                {CRON_PRESETS.map((p) => (
                  <button key={p.value} onClick={() => setCron(p.value)}
                    className="text-[10px] px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'interval' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Interval</label>
              <div className="flex gap-2">
                <input type="number" value={intervalVal} onChange={(e) => setIntervalVal(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
                <select value={intervalUnit} onChange={(e) => setIntervalUnit(e.target.value as 'minutes' | 'hours')}
                  className="text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none bg-white">
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
          )}

          {scheduleType === 'event' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Event Trigger</label>
              <select value={eventTrigger} onChange={(e) => setEventTrigger(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none bg-white">
                {EVENT_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {scheduleType === 'one-time' && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Run At</label>
              <input type="datetime-local" value={oneTimeAt} onChange={(e) => setOneTimeAt(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Timeout (sec)</label>
              <input type="number" value={timeout} onChange={(e) => setTimeout_(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Retries</label>
              <input type="number" value={retries} onChange={(e) => setRetries(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Tags</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-gray-400" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !skillName.trim()}
            className="text-xs px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
            data-testid="save-job-btn">
            Create Job
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ExecutionScheduler Component
// ---------------------------------------------------------------------------

export function ExecutionScheduler() {
  const [jobs, setJobs] = useState<ScheduledJob[]>(SAMPLE_JOBS);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  // Simulate next-run countdown
  useEffect(() => {
    tickRef.current = setInterval(() => {
      // Force re-render to update relative times
      setJobs((prev) => [...prev]);
    }, 30000);
    return () => clearInterval(tickRef.current);
  }, []);

  const filtered = jobs.filter((j) => {
    if (filter !== 'all' && j.status !== filter) return false;
    if (search && !j.name.toLowerCase().includes(search.toLowerCase()) &&
        !j.skillName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleToggle = (jobId: string) => {
    setJobs((prev) => prev.map((j) =>
      j.id === jobId
        ? { ...j, status: j.status === 'active' ? 'paused' : 'active' }
        : j
    ));
    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => prev ? {
        ...prev, status: prev.status === 'active' ? 'paused' : 'active'
      } : prev);
    }
  };

  const handleRunNow = (jobId: string) => {
    setRunningJobs((prev) => new Set(prev).add(jobId));
    setTimeout(() => {
      setRunningJobs((prev) => { const s = new Set(prev); s.delete(jobId); return s; });
      const log: JobLog = {
        id: `l-${Date.now()}`,
        jobId,
        status: Math.random() > 0.1 ? 'success' : 'failed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Math.floor(Math.random() * 90000) + 5000,
        output: 'Manual run completed successfully.',
      };
      setJobs((prev) => prev.map((j) =>
        j.id === jobId
          ? { ...j, runCount: j.runCount + 1, successCount: j.successCount + (log.status === 'success' ? 1 : 0),
              failureCount: j.failureCount + (log.status === 'failed' ? 1 : 0),
              lastRun: new Date().toISOString(), logs: [log, ...j.logs].slice(0, 20) }
          : j
      ));
      if (selectedJob?.id === jobId) {
        setSelectedJob((prev) => prev ? {
          ...prev, runCount: prev.runCount + 1,
          lastRun: new Date().toISOString(), logs: [log, ...prev.logs].slice(0, 20)
        } : prev);
      }
    }, 2000 + Math.random() * 3000);
  };

  const handleDelete = (jobId: string) => {
    if (!confirm('Delete this scheduled job?')) return;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedJob?.id === jobId) setSelectedJob(null);
  };

  const handleNewJob = (data: Partial<ScheduledJob>) => {
    const newJob: ScheduledJob = {
      id: `job-${Date.now()}`,
      name: data.name ?? 'New Job',
      skillId: data.skillId ?? '',
      skillName: data.skillName ?? '',
      personaId: 'engineering',
      scheduleType: data.scheduleType ?? 'cron',
      cronExpression: data.cronExpression,
      intervalMs: data.intervalMs,
      eventTrigger: data.eventTrigger,
      oneTimeAt: data.oneTimeAt,
      status: 'active',
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      timeout: data.timeout ?? 120,
      retries: data.retries ?? 2,
      tags: data.tags ?? [],
      logs: [],
      nextRun: new Date(Date.now() + 3600000).toISOString(),
    };
    setJobs((prev) => [newJob, ...prev]);
  };

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === 'active').length,
    paused: jobs.filter((j) => j.status === 'paused').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden" data-testid="execution-scheduler">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Execution Scheduler</h2>
          <p className="text-xs text-gray-400 mt-0.5">Cron jobs, intervals, and event-driven triggers</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="text-xs px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
          data-testid="new-job-btn"
        >
          + New Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100 flex-shrink-0">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Active', value: stats.active, color: 'text-emerald-600' },
          { label: 'Paused', value: stats.paused, color: 'text-amber-600' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white px-5 py-3">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1">
          {(['all', 'active', 'paused', 'failed', 'pending'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-lg capitalize transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
              data-testid={`filter-${f}`}>
              {f}
            </button>
          ))}
        </div>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs…"
          className="ml-auto text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-gray-400 w-48"
          data-testid="job-search" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Job List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <div className="text-4xl">⏰</div>
              <p className="text-sm">No scheduled jobs</p>
              <button onClick={() => setShowNew(true)} className="text-xs px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700">
                Create first job
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filtered.map((job) => {
                const isRunning = runningJobs.has(job.id);
                const successRate = job.runCount > 0 ? Math.round((job.successCount / job.runCount) * 100) : 100;

                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedJob?.id === job.id
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50'
                    }`}
                    data-testid={`job-row-${job.id}`}
                  >
                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isRunning ? 'bg-blue-500 animate-pulse' :
                      job.status === 'active' ? 'bg-emerald-400' :
                      job.status === 'paused' ? 'bg-amber-400' :
                      job.status === 'failed' ? 'bg-red-400' : 'bg-gray-300'
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-800 truncate">{job.name}</span>
                        <ScheduleTypeBadge type={job.scheduleType} />
                        {isRunning && <span className="text-[9px] text-blue-500 animate-pulse">running…</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <span>{job.skillName}</span>
                        {job.scheduleType === 'cron' && <span className="font-mono">{job.cronExpression}</span>}
                        {job.scheduleType === 'event' && <span>{job.eventTrigger}</span>}
                        {job.nextRun && <span>next {futureTime(job.nextRun)}</span>}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-gray-600">{job.runCount}</div>
                        <div>runs</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono ${successRate >= 90 ? 'text-emerald-600' : successRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {successRate}%
                        </div>
                        <div>success</div>
                      </div>
                      {job.lastRun && (
                        <div className="text-right">
                          <div className="text-gray-500">{relativeTime(job.lastRun)}</div>
                          <div>last run</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRunNow(job.id)}
                        disabled={isRunning}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        title="Run now"
                      >
                        {isRunning ? <span className="animate-spin text-xs">↻</span> : '▶'}
                      </button>
                      <button
                        onClick={() => handleToggle(job.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title={job.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {job.status === 'active' ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedJob && (
          <JobDetail
            job={jobs.find((j) => j.id === selectedJob.id) ?? selectedJob}
            onClose={() => setSelectedJob(null)}
            onToggle={() => handleToggle(selectedJob.id)}
            onRun={() => handleRunNow(selectedJob.id)}
          />
        )}
      </div>

      {showNew && <NewJobModal onClose={() => setShowNew(false)} onSave={handleNewJob} />}
    </div>
  );
}

export default ExecutionScheduler;
