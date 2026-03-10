'use client';

import { useState, useEffect } from 'react';
import { useEAOSStore } from '../store/eaos-store';
import { getStats, getActivity, getPlatformMetrics } from '../lib/api';

interface StatTile {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  target?: string;
  time: string;
  status: 'success' | 'running' | 'failed';
  persona?: string;
}

interface RecentExec {
  id: string;
  skill: string;
  persona: string;
  status: 'completed' | 'running' | 'failed';
  duration: string;
  time: string;
}

// ---------------------------------------------------------------------------
// Seed / demo data (supplements live data)
// ---------------------------------------------------------------------------

const SEED_ACTIVITY: ActivityItem[] = [
  { id: 'a1', agent: 'Campaign Strategist', action: 'executed', target: 'Campaign Strategy skill', time: '2m ago', status: 'success', persona: 'Marketing' },
  { id: 'a2', agent: 'PR Reviewer',         action: 'called',    target: 'GitHub tool',           time: '5m ago', status: 'success', persona: 'Engineering' },
  { id: 'a3', agent: 'Product PRD Agent',   action: 'generated', target: 'roadmap summary',       time: '8m ago', status: 'success', persona: 'Product' },
  { id: 'a4', agent: 'Incident Analyst',    action: 'analyzing', target: 'payments-api 503 spike',time: '12m ago',status: 'running', persona: 'Engineering' },
  { id: 'a5', agent: 'HR Recruiter',        action: 'screened',  target: '14 resumes',            time: '18m ago',status: 'success', persona: 'HR' },
  { id: 'a6', agent: 'Finance Forecaster',  action: 'failed',    target: 'Q3 forecast report',   time: '24m ago',status: 'failed',  persona: 'Finance' },
  { id: 'a7', agent: 'Legal Compliance',    action: 'reviewed',  target: 'GDPR checklist',        time: '31m ago',status: 'success', persona: 'Legal' },
  { id: 'a8', agent: 'Sales Forecaster',    action: 'updated',   target: 'pipeline predictions',  time: '45m ago',status: 'success', persona: 'Sales' },
];

const SEED_EXECUTIONS: RecentExec[] = [
  { id: 'e1', skill: 'Campaign Strategy',         persona: 'Marketing',    status: 'completed', duration: '18.2s', time: '2m ago' },
  { id: 'e2', skill: 'PR Architecture Review',    persona: 'Engineering',  status: 'completed', duration: '8.4s',  time: '5m ago' },
  { id: 'e3', skill: 'PRD Generator',             persona: 'Product',      status: 'running',   duration: '—',     time: '8m ago' },
  { id: 'e4', skill: 'Incident Root Cause',       persona: 'Engineering',  status: 'running',   duration: '—',     time: '12m ago' },
  { id: 'e5', skill: 'Resume Screening',          persona: 'HR',           status: 'completed', duration: '11.7s', time: '18m ago' },
  { id: 'e6', skill: 'Budget Forecast',           persona: 'Finance',      status: 'failed',    duration: '3.1s',  time: '24m ago' },
  { id: 'e7', skill: 'GDPR Compliance Review',    persona: 'Legal',        status: 'completed', duration: '14.9s', time: '31m ago' },
  { id: 'e8', skill: 'Pipeline Intelligence',     persona: 'Sales',        status: 'completed', duration: '9.3s',  time: '45m ago' },
];

const QUICK_ACTIONS = [
  { label: 'Run a skill',       icon: '🔧', section: 'marketplace', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
  { label: 'Build workflow',    icon: '⚡', section: 'workflows',   color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
  { label: 'Browse prompts',    icon: '✨', section: 'prompts',     color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
  { label: 'View agents',       icon: '🤖', section: 'agents',      color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
  { label: 'Memory graph',      icon: '🧠', section: 'memory',      color: 'bg-rose-50 hover:bg-rose-100 text-rose-700' },
  { label: 'Governance',        icon: '🏛️', section: 'governance',  color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
];

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-500',
  running:   'bg-blue-500 animate-pulse',
  failed:    'bg-red-500',
  success:   'bg-emerald-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HomeCommandCenter() {
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen   = useEAOSStore(s => s.setCommandOpen);
  const [tiles, setTiles] = useState<StatTile[]>([
    { label: 'Active Agents',      value: 8,  sub: '3 running now', icon: '🤖', color: 'text-blue-600',    trend: 'up' },
    { label: 'Skills Executed',    value: 147, sub: 'today',        icon: '🔧', color: 'text-emerald-600', trend: 'up' },
    { label: 'Tool Calls',         value: 892, sub: 'last 24h',     icon: '🔌', color: 'text-orange-600',  trend: 'up' },
    { label: 'Workflows Running',  value: 3,  sub: 'in progress',   icon: '⚡', color: 'text-purple-600',  trend: 'neutral' },
    { label: 'Avg Response',       value: '8.4s', sub: 'per skill', icon: '⚡', color: 'text-gray-600',    trend: 'neutral' },
    { label: 'Success Rate',       value: '94%',  sub: 'last 7d',  icon: '✓',  color: 'text-emerald-600', trend: 'up' },
  ]);
  const [activity] = useState<ActivityItem[]>(SEED_ACTIVITY);
  const [executions] = useState<RecentExec[]>(SEED_EXECUTIONS);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

    // Try to load live stats
    getStats().then(data => {
      if (!data) return;
      const d = data as Record<string, unknown>;
      setTiles(prev => prev.map((t, i) => {
        if (i === 0 && d.totalAgents) return { ...t, value: d.totalAgents as number };
        if (i === 1 && d.totalSkills)  return { ...t, value: `${d.totalSkills}+` };
        return t;
      }));
    }).catch(() => {});

    getPlatformMetrics().then(data => {
      if (!data) return;
      const d = data as { stats?: Record<string, unknown> };
      const s = d.stats ?? {};
      setTiles(prev => prev.map((t, i) => {
        if (i === 0 && s.activeAgents)       return { ...t, value: s.activeAgents as number };
        if (i === 1 && s.skillsExecutedToday) return { ...t, value: s.skillsExecutedToday as number };
        if (i === 2 && s.toolCallsToday)      return { ...t, value: s.toolCallsToday as number };
        if (i === 3 && s.workflowsRunning)    return { ...t, value: s.workflowsRunning as number };
        return t;
      }));
    }).catch(() => {});
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gray-50/30">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{greeting}, Phani 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}AgentOS is operating normally
            </p>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <span>🔍</span>
            <span>What do you want to do?</span>
            <kbd className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/70">⌘K</kbd>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-6 gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.section}
              onClick={() => setActiveSection(a.section)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-colors ${a.color}`}
            >
              <span className="text-lg">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-6 gap-3">
          {tiles.map(tile => (
            <div key={tile.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base">{tile.icon}</span>
                {tile.trend === 'up' && <span className="text-[10px] text-emerald-600 font-medium">↑</span>}
                {tile.trend === 'down' && <span className="text-[10px] text-red-500 font-medium">↓</span>}
              </div>
              <p className={`text-xl font-bold ${tile.color}`}>{tile.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{tile.label}</p>
              {tile.sub && <p className="text-[10px] text-gray-300 mt-0.5">{tile.sub}</p>}
            </div>
          ))}
        </div>

        {/* Main content: executions + activity */}
        <div className="grid grid-cols-5 gap-4">

          {/* Recent Executions (3 cols) */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent Executions</h2>
              <button
                onClick={() => setActiveSection('observability')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {executions.map(ex => (
                <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[ex.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{ex.skill}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{ex.persona}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">{ex.duration}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{ex.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Activity (2 cols) */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Agent Activity</h2>
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[320px]">
              {activity.map(item => (
                <div key={item.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-gray-50/50 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT[item.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-900 leading-relaxed">
                      <span className="font-medium">{item.agent}</span>
                      {' '}{item.action}
                      {item.target && <span className="text-gray-500"> {item.target}</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.persona && (
                        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                          {item.persona}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-300">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row: platform alerts + recommended */}
        <div className="grid grid-cols-2 gap-4">
          {/* Platform health */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Platform Health</h2>
              <button
                onClick={() => setActiveSection('control')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Control Plane →
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Gateway',      status: 'healthy', latency: '12ms' },
                { name: 'Scheduler',    status: 'healthy', latency: '4ms' },
                { name: 'Memory Graph', status: 'healthy', latency: '8ms' },
                { name: 'Tool Registry',status: 'healthy', latency: '6ms' },
                { name: 'Blog Service', status: 'healthy', latency: '5ms' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-gray-700">{svc.name}</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[10px]">{svc.latency}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended next actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Recommended for You</h2>
              <button
                onClick={() => setActiveSection('marketplace')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Marketplace →
              </button>
            </div>
            <div className="space-y-2">
              {[
                { skill: 'Sprint Planning Generator',    persona: 'Product',     reason: 'Used by your team 8x this week' },
                { skill: 'Code Review Summarizer',       persona: 'Engineering', reason: 'High success rate · 94%' },
                { skill: 'ICP Analysis',                 persona: 'Marketing',   reason: 'Trending in your org' },
                { skill: 'Compliance Check Automation',  persona: 'Corp IT',     reason: 'Recommended for your role' },
                { skill: 'Competitive Intelligence',     persona: 'Sales',       reason: 'Used by similar teams' },
              ].map(rec => (
                <div
                  key={rec.skill}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setActiveSection('marketplace')}
                >
                  <span className="text-sm">🔧</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{rec.skill}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{rec.reason}</p>
                  </div>
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium flex-shrink-0 self-start mt-0.5">
                    {rec.persona}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
