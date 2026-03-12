/**
 * HomeCommandCenter — AgentOS start surface.
 * Continue Working · Workspace Shortcuts · Pending Attention · Suggested Next · System Status
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';
import { useEAOSStore } from '../store/eaos-store';
import { getStats, getPlatformMetrics } from '../lib/api';
import { useConnectionsStore, CONNECTOR_CATALOG } from '../store/connections-store';

// ── Types ───────────────────────────────────────────────────────────────────

interface RecentExec {
  id: string; skill: string; persona: string; workspace: string;
  status: 'completed' | 'running' | 'failed'; duration: string; time: string;
}

// ── Seed data ───────────────────────────────────────────────────────────────

const RECENT_EXECUTIONS: RecentExec[] = [
  { id: 'e1', skill: 'Campaign Strategy',      persona: 'Marketing',   workspace: 'ws-marketing',   status: 'completed', duration: '18.2s', time: '2m ago'  },
  { id: 'e2', skill: 'PR Architecture Review', persona: 'Engineering', workspace: 'ws-engineering', status: 'completed', duration: '8.4s',  time: '5m ago'  },
  { id: 'e3', skill: 'PRD Generator',          persona: 'Product',     workspace: 'ws-product',     status: 'running',   duration: '—',     time: '8m ago'  },
  { id: 'e4', skill: 'Incident RCA Draft',     persona: 'Engineering', workspace: 'ws-engineering', status: 'running',   duration: '—',     time: '12m ago' },
  { id: 'e5', skill: 'Resume Screening',       persona: 'HR',          workspace: 'ws-engineering', status: 'completed', duration: '11.7s', time: '18m ago' },
];

const PENDING_ATTENTION = [
  { id: 'p1', type: 'approval',  title: 'Review Campaign Copy', desc: 'Marketing · Campaign Strategy step 3 awaits your approval', workspace: 'ws-marketing',   icon: '📋', urgency: 'high' },
  { id: 'p2', type: 'failed',    title: 'Budget Forecast Failed', desc: 'Finance · Q3 forecast stopped at step 2',               workspace: 'ws-engineering', icon: '⚠️', urgency: 'med'  },
  { id: 'p3', type: 'approval',  title: 'Approve Jira Epics',   desc: 'Product · PRD Generator created 8 epics, push pending',   workspace: 'ws-product',     icon: '🟦', urgency: 'low'  },
];

const SUGGESTED_NEXT = [
  { id: 's1', label: 'PR Review Assistant', desc: 'You have 3 open PRs awaiting review', section: 'ws-engineering', icon: '🔍', tag: 'Engineering' },
  { id: 's2', label: 'Q3 Roadmap Builder',  desc: 'Product planning cycle is open',       section: 'ws-product',     icon: '🗺️', tag: 'Product'     },
  { id: 's3', label: 'LinkedIn Campaign',   desc: 'Trending template in Marketing',       section: 'ws-marketing',   icon: '📣', tag: 'Marketing'   },
];

const WORKSPACES = [
  {
    id: 'ws-marketing', label: 'Marketing', icon: '📣',
    desc: 'Campaigns, content, creative, analytics',
    accent: 'border-orange-200 hover:border-orange-400',
    badge: 'bg-orange-50 text-orange-700',
    stats: [{ label: 'Active workflows', value: '3' }, { label: 'Pending approval', value: '1' }],
  },
  {
    id: 'ws-engineering', label: 'Engineering', icon: '⚙️',
    desc: 'PR review, incident RCA, test gen, CI diagnosis',
    accent: 'border-slate-200 hover:border-slate-500',
    badge: 'bg-slate-100 text-slate-700',
    stats: [{ label: 'Running now', value: '2' }, { label: 'Skills available', value: '10' }],
  },
  {
    id: 'ws-product', label: 'Product', icon: '🗺️',
    desc: 'PRDs, epics, user stories, roadmaps',
    accent: 'border-violet-200 hover:border-violet-400',
    badge: 'bg-violet-50 text-violet-700',
    stats: [{ label: 'Docs generated', value: '8' }, { label: 'Jira epics', value: '12' }],
  },
];

const SYSTEM_SERVICES = [
  { name: 'Gateway',       latency: '12ms' },
  { name: 'Scheduler',     latency: '4ms'  },
  { name: 'Memory Graph',  latency: '8ms'  },
  { name: 'Tool Registry', latency: '6ms'  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-emerald-500',
  running:   'bg-blue-500 animate-pulse',
  failed:    'bg-red-500',
};

const STATUS_TEXT: Record<string, string> = {
  completed: 'text-emerald-700',
  running:   'text-blue-700',
  failed:    'text-red-600',
};

const PERSONA_COLOR: Record<string, string> = {
  Marketing:   'bg-orange-100 text-orange-700',
  Engineering: 'bg-slate-100 text-slate-700',
  Product:     'bg-violet-100 text-violet-700',
  HR:          'bg-teal-100 text-teal-700',
  Finance:     'bg-emerald-100 text-emerald-700',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeCommandCenter() {
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen   = useEAOSStore(s => s.setCommandOpen);
  const notifications    = useEAOSStore(s => s.notifications);
  const connectedCount   = useConnectionsStore(s => s.getConnectedCount());
  const [greeting, setGreeting] = useState('Good morning');
  const [platformStats, setPlatformStats] = useState({ agents: 8, skills: 147, success: '94%' });

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    getStats().catch(() => {});
    getPlatformMetrics().then((d: unknown) => {
      if (!d) return;
      const data = d as { stats?: Record<string, unknown> };
      const s = data.stats ?? {};
      setPlatformStats(prev => ({
        agents: (s.activeAgents as number) ?? prev.agents,
        skills: (s.skillsExecutedToday as number) ?? prev.skills,
        success: prev.success,
      }));
    }).catch(() => {});
  }, []);

  const pendingCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50">
      <div className="max-w-[1100px] mx-auto px-6 py-7 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greeting}, Phani</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-emerald-600 font-medium">All systems operational</span>
            </p>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="flex items-center gap-3 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <span className="text-gray-400 text-base">⌕</span>
            <span>What do you want to do?</span>
            <kbd className="text-[11px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-gray-300">⌘K</kbd>
          </button>
        </div>

        {/* ── Platform pulse (3 micro-stats) ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Agents',   value: platformStats.agents, icon: '🤖', color: 'text-blue-700',    bg: 'bg-blue-50'    },
            { label: 'Skills Today',    value: platformStats.skills, icon: '⚙️', color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Success Rate',    value: platformStats.success,icon: '✓',  color: 'text-violet-700',  bg: 'bg-violet-50'  },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 shadow-sm">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${stat.bg}`}>{stat.icon}</span>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Workspace shortcuts ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Workspaces</h2>
            <span className="text-[11px] text-gray-400">Your operating surfaces</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {WORKSPACES.map(ws => (
              <button
                key={ws.id}
                onClick={() => setActiveSection(ws.id)}
                className={`bg-white rounded-xl border-2 p-5 text-left transition-all shadow-sm hover:shadow-md ${ws.accent}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{ws.icon}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ws.badge}`}>{ws.label}</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">{ws.label} Workspace</p>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{ws.desc}</p>
                <div className="flex gap-4">
                  {ws.stats.map(s => (
                    <div key={s.label}>
                      <p className="text-base font-bold text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Continue working + Pending attention (side by side) ── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Continue Working */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Continue Working</h2>
              <button
                onClick={() => setActiveSection('ops-executions')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >View all →</button>
            </div>
            <div className="divide-y divide-gray-100">
              {RECENT_EXECUTIONS.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setActiveSection(ex.workspace as string)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[ex.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ex.skill}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PERSONA_COLOR[ex.persona] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ex.persona}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${STATUS_TEXT[ex.status]}`}>{ex.status}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{ex.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Attention */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Needs Attention</h2>
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {pendingCount} unread
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {PENDING_ATTENTION.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.workspace as string)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                    item.urgency === 'high' ? 'bg-red-500' : item.urgency === 'med' ? 'bg-amber-400' : 'bg-gray-300'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Suggested next + System status ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Suggested Next */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Suggested Next</h2>
              <button onClick={() => setActiveSection('library-skills')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Browse skills →
              </button>
            </div>
            <div className="space-y-2">
              {SUGGESTED_NEXT.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.section)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                    {s.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{s.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                    {s.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">System Status</h2>
              <button onClick={() => setActiveSection('admin-usage')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Control Plane →
              </button>
            </div>
            <div className="space-y-2.5 mb-4">
              {SYSTEM_SERVICES.map(svc => (
                <div key={svc.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded">{svc.latency}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500 font-medium">Connections</span>
                <span className="text-[11px] font-bold text-gray-700">{connectedCount} / {CONNECTOR_CATALOG.length} connected</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((connectedCount / CONNECTOR_CATALOG.length) * 100)}%` }} />
              </div>
              <button
                onClick={() => setActiveSection('conn-ai-models')}
                className="mt-2 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage connections →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
