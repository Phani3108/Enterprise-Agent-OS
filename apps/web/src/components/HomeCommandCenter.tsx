/**
 * HomeCommandCenter — Mission Control Dashboard
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
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
  iconBg: string;
  iconColor: string;
  valueColor: string;
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

const SEED_ACTIVITY: ActivityItem[] = [
  { id: 'a1', agent: 'Campaign Strategist', action: 'executed',  target: 'Campaign Strategy skill',   time: '2m ago',  status: 'success', persona: 'Marketing' },
  { id: 'a2', agent: 'PR Reviewer',         action: 'called',    target: 'GitHub tool',               time: '5m ago',  status: 'success', persona: 'Engineering' },
  { id: 'a3', agent: 'Product PRD Agent',   action: 'generated', target: 'roadmap summary',           time: '8m ago',  status: 'success', persona: 'Product' },
  { id: 'a4', agent: 'Incident Analyst',    action: 'analyzing', target: 'payments-api 503 spike',    time: '12m ago', status: 'running', persona: 'Engineering' },
  { id: 'a5', agent: 'HR Recruiter',        action: 'screened',  target: '14 resumes',                time: '18m ago', status: 'success', persona: 'HR' },
  { id: 'a6', agent: 'Finance Forecaster',  action: 'failed',    target: 'Q3 forecast report',        time: '24m ago', status: 'failed',  persona: 'Finance' },
  { id: 'a7', agent: 'Legal Compliance',    action: 'reviewed',  target: 'GDPR checklist',            time: '31m ago', status: 'success', persona: 'Legal' },
  { id: 'a8', agent: 'Sales Forecaster',    action: 'updated',   target: 'pipeline predictions',      time: '45m ago', status: 'success', persona: 'Sales' },
];

const SEED_EXECUTIONS: RecentExec[] = [
  { id: 'e1', skill: 'Campaign Strategy',       persona: 'Marketing',   status: 'completed', duration: '18.2s', time: '2m ago' },
  { id: 'e2', skill: 'PR Architecture Review',  persona: 'Engineering', status: 'completed', duration: '8.4s',  time: '5m ago' },
  { id: 'e3', skill: 'PRD Generator',           persona: 'Product',     status: 'running',   duration: '—',     time: '8m ago' },
  { id: 'e4', skill: 'Incident Root Cause',     persona: 'Engineering', status: 'running',   duration: '—',     time: '12m ago' },
  { id: 'e5', skill: 'Resume Screening',        persona: 'HR',          status: 'completed', duration: '11.7s', time: '18m ago' },
  { id: 'e6', skill: 'Budget Forecast',         persona: 'Finance',     status: 'failed',    duration: '3.1s',  time: '24m ago' },
  { id: 'e7', skill: 'GDPR Compliance Review',  persona: 'Legal',       status: 'completed', duration: '14.9s', time: '31m ago' },
  { id: 'e8', skill: 'Pipeline Intelligence',   persona: 'Sales',       status: 'completed', duration: '9.3s',  time: '45m ago' },
];

const QUICK_ACTIONS = [
  { label: 'Run Skill',      icon: '⚙', section: 'marketplace', bg: 'bg-blue-600',    hover: 'hover:bg-blue-700' },
  { label: 'Workflow',       icon: '⚡', section: 'workflows',   bg: 'bg-violet-600',  hover: 'hover:bg-violet-700' },
  { label: 'Prompts',        icon: '✦',  section: 'prompts',     bg: 'bg-amber-500',   hover: 'hover:bg-amber-600' },
  { label: 'Agents',         icon: '◉',  section: 'agents',      bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700' },
  { label: 'Memory',         icon: '◈',  section: 'memory',      bg: 'bg-rose-500',    hover: 'hover:bg-rose-600' },
  { label: 'Governance',     icon: '⊕',  section: 'governance',  bg: 'bg-slate-700',   hover: 'hover:bg-slate-800' },
];

// Persona → color
const PERSONA_COLOR: Record<string, string> = {
  Marketing:   'bg-pink-100 text-pink-700',
  Engineering: 'bg-blue-100 text-blue-700',
  Product:     'bg-violet-100 text-violet-700',
  HR:          'bg-teal-100 text-teal-700',
  Finance:     'bg-emerald-100 text-emerald-700',
  Legal:       'bg-amber-100 text-amber-700',
  Sales:       'bg-orange-100 text-orange-700',
  'Corp IT':   'bg-slate-100 text-slate-700',
  Support:     'bg-cyan-100 text-cyan-700',
};

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-500',
  running:   'bg-blue-500 animate-pulse',
  failed:    'bg-red-500',
  success:   'bg-emerald-500',
};

const STATUS_BADGE: Record<string, string> = {
  completed: 'text-emerald-700',
  running:   'text-blue-700',
  failed:    'text-red-700',
};

export default function HomeCommandCenter() {
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen   = useEAOSStore(s => s.setCommandOpen);
  const [tiles, setTiles] = useState<StatTile[]>([
    { label: 'Active Agents',     value: 8,     sub: '3 running now', icon: '◉',  iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    valueColor: 'text-blue-700',    trend: 'up' },
    { label: 'Skills Executed',   value: 147,   sub: 'today',         icon: '⚙',  iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700', trend: 'up' },
    { label: 'Tool Calls',        value: 892,   sub: 'last 24h',      icon: '⬡',  iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  valueColor: 'text-orange-700',  trend: 'up' },
    { label: 'Workflows Running', value: 3,     sub: 'in progress',   icon: '⚡',  iconBg: 'bg-violet-100',  iconColor: 'text-violet-600',  valueColor: 'text-violet-700',  trend: 'neutral' },
    { label: 'Avg Response',      value: '8.4s',sub: 'per skill',     icon: '◷',  iconBg: 'bg-slate-100',   iconColor: 'text-slate-600',   valueColor: 'text-slate-800',   trend: 'neutral' },
    { label: 'Success Rate',      value: '94%', sub: 'last 7 days',   icon: '✓',  iconBg: 'bg-teal-100',    iconColor: 'text-teal-600',    valueColor: 'text-teal-700',    trend: 'up' },
  ]);
  const [activity] = useState<ActivityItem[]>(SEED_ACTIVITY);
  const [executions] = useState<RecentExec[]>(SEED_EXECUTIONS);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
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
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greeting}, Phani</h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-emerald-600 font-semibold">All systems operational</span>
            </p>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-3 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <span className="text-gray-400">⌕</span>
            <span>What do you want to do?</span>
            <kbd className="text-[11px] font-mono bg-white/15 px-1.5 py-0.5 rounded text-gray-300">⌘K</kbd>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-6 gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.section}
              onClick={() => setActiveSection(a.section)}
              className={`flex flex-col items-center gap-2 py-3.5 px-3 rounded-xl text-white text-xs font-semibold transition-all shadow-sm ${a.bg} ${a.hover}`}
            >
              <span className="text-xl font-light leading-none">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-6 gap-3">
          {tiles.map(tile => (
            <div key={tile.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold ${tile.iconBg} ${tile.iconColor}`}>
                  {tile.icon}
                </span>
                {tile.trend === 'up'   && <span className="text-[11px] text-emerald-600 font-bold">↑</span>}
                {tile.trend === 'down' && <span className="text-[11px] text-red-500 font-bold">↓</span>}
              </div>
              <p className={`text-2xl font-bold tracking-tight ${tile.valueColor}`}>{tile.value}</p>
              <p className="text-xs text-gray-700 mt-1 font-semibold">{tile.label}</p>
              {tile.sub && <p className="text-[11px] text-gray-500 mt-0.5">{tile.sub}</p>}
            </div>
          ))}
        </div>

        {/* Executions + Activity */}
        <div className="grid grid-cols-5 gap-4">

          {/* Recent Executions */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Recent Executions</h2>
              <button onClick={() => setActiveSection('observability')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                View all →
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {executions.map(ex => (
                <div key={ex.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[ex.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ex.skill}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PERSONA_COLOR[ex.persona] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ex.persona}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${STATUS_BADGE[ex.status] ?? 'text-gray-600'}`}>{ex.duration}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{ex.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Activity */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Agent Activity</h2>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[320px]">
              {activity.map(item => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT[item.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-800 leading-relaxed">
                      <span className="font-bold">{item.agent}</span>
                      <span className="text-gray-600"> {item.action}</span>
                      {item.target && <span className="text-gray-700 font-medium"> {item.target}</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.persona && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${PERSONA_COLOR[item.persona] ?? 'bg-gray-100 text-gray-600'}`}>
                          {item.persona}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 font-medium">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Health + Recommendations */}
        <div className="grid grid-cols-2 gap-4">

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Platform Health</h2>
              <button onClick={() => setActiveSection('control')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Control Plane →
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'Gateway',       latency: '12ms' },
                { name: 'Scheduler',     latency: '4ms' },
                { name: 'Memory Graph',  latency: '8ms' },
                { name: 'Tool Registry', latency: '6ms' },
                { name: 'Blog Service',  latency: '5ms' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                  </div>
                  <span className="text-xs text-gray-600 font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">{svc.latency}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Recommended for You</h2>
              <button onClick={() => setActiveSection('marketplace')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Marketplace →
              </button>
            </div>
            <div className="space-y-1">
              {[
                { skill: 'Sprint Planning Generator',   persona: 'Product',     reason: 'Used by your team 8× this week' },
                { skill: 'Code Review Summarizer',      persona: 'Engineering', reason: 'High success rate · 94%' },
                { skill: 'ICP Analysis',                persona: 'Marketing',   reason: 'Trending in your org' },
                { skill: 'Compliance Check Automation', persona: 'Corp IT',     reason: 'Recommended for your role' },
                { skill: 'Competitive Intelligence',    persona: 'Sales',       reason: 'Used by similar teams' },
              ].map(rec => (
                <div key={rec.skill}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setActiveSection('marketplace')}
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">⚙</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{rec.skill}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{rec.reason}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${PERSONA_COLOR[rec.persona] ?? 'bg-gray-100 text-gray-600'}`}>
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
