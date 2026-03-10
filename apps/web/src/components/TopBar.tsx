'use client';

import { useState } from 'react';
import { useEAOSStore } from '../store/eaos-store';

const NAV_LABELS: Record<string, string> = {
  home: 'Command Center',
  personas: 'Personas & Skills',
  marketplace: 'Skill Marketplace',
  builder: 'Skill Builder',
  agents: 'Agents',
  workflows: 'Workflows',
  tools: 'Tools',
  prompts: 'Prompt Library',
  knowledge: 'Knowledge Explorer',
  learning: 'AI Learning Hub',
  marketing: 'Marketing Hub',
  blog: 'Blog Editor',
  forum: 'Discussions',
  scheduler: 'Execution Scheduler',
  observability: 'Observability',
  control: 'Control Plane',
  memory: 'Memory Graph',
  acp: 'Agent Collaboration',
  governance: 'Governance',
  settings: 'Settings',
  about: 'About',
};

const CREATE_ITEMS = [
  { label: 'Create Skill',     icon: '🔧', section: 'builder' },
  { label: 'Create Workflow',  icon: '⚡', section: 'workflows' },
  { label: 'Create Prompt',    icon: '✨', section: 'prompts' },
  { label: 'New Blog Post',    icon: '✍️', section: 'blog' },
  { label: 'New Discussion',   icon: '💬', section: 'forum' },
];

export function TopBar() {
  const activeSection = useEAOSStore(s => s.activeSection);
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen = useEAOSStore(s => s.setCommandOpen);
  const notifications = useEAOSStore(s => s.notifications);
  const toggleRightPanel = useEAOSStore(s => s.toggleRightPanel);

  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unread = notifications.filter(n => !n.read).length;
  const title = NAV_LABELS[activeSection] ?? activeSection;

  return (
    <header className="flex items-center justify-between px-5 h-12 border-b border-gray-200 bg-white flex-shrink-0 z-10">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-400 text-xs">AgentOS</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium text-xs">{title}</span>
      </div>

      {/* Center: search / command trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400 hover:border-gray-300 hover:bg-white transition-all w-64 group"
        data-tour="command-palette"
      >
        <span className="text-gray-400">🔍</span>
        <span className="flex-1 text-left">Search skills, run workflows…</span>
        <kbd className="text-[10px] font-mono bg-gray-100 group-hover:bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 transition-colors">
          ⌘K
        </kbd>
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Create menu */}
        <div className="relative">
          <button
            onClick={() => { setShowCreate(v => !v); setShowNotifications(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <span>＋</span>
            <span>Create</span>
          </button>
          {showCreate && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCreate(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] z-50">
                {CREATE_ITEMS.map(item => (
                  <button
                    key={item.section}
                    onClick={() => { setActiveSection(item.section); setShowCreate(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(v => !v); setShowCreate(false); }}
            className="relative p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <span className="text-sm">🔔</span>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg w-72 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-900">Notifications</span>
                  {unread > 0 && <span className="text-[10px] text-gray-400">{unread} unread</span>}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No notifications</p>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={`px-4 py-2.5 border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className={`text-xs mt-0.5 flex-shrink-0 ${
                            n.type === 'success' ? 'text-emerald-500' :
                            n.type === 'error' ? 'text-red-500' :
                            n.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                          }`}>
                            {n.type === 'success' ? '✓' : n.type === 'error' ? '✗' : n.type === 'warning' ? '⚠' : 'ℹ'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right panel toggle */}
        <button
          onClick={toggleRightPanel}
          title="Toggle execution panel"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <span className="text-sm">⊟</span>
        </button>

        {/* User avatar */}
        <button
          onClick={() => setActiveSection('settings')}
          className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center hover:bg-gray-700 transition-colors"
          title="Settings"
        >
          P
        </button>
      </div>
    </header>
  );
}
