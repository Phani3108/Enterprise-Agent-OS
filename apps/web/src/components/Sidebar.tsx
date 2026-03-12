'use client';

import { useState } from 'react';
import { useEAOSStore } from '../store/eaos-store';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'CORE',
    items: [
      { id: 'home',      label: 'Command Center', icon: '⌂' },
      { id: 'personas',  label: 'Personas',        icon: '👥' },
      { id: 'agents',    label: 'Agents',           icon: '🤖' },
      { id: 'workflows', label: 'Workflows',        icon: '⚡' },
    ],
  },
  {
    label: 'SKILLS',
    items: [
      { id: 'marketplace', label: 'Marketplace',    icon: '🛒' },
      { id: 'builder',     label: 'Skill Builder',  icon: '🔧' },
      { id: 'prompts',     label: 'Prompt Library', icon: '✨' },
      { id: 'knowledge',   label: 'Knowledge',      icon: '📚' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { id: 'tools',     label: 'Tools',     icon: '🔌' },
      { id: 'scheduler', label: 'Scheduler', icon: '⏰' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { id: 'control',      label: 'Control Plane', icon: '📡' },
      { id: 'memory',       label: 'Memory Graph',  icon: '🧠' },
      { id: 'acp',          label: 'Agent Collab',  icon: '🔗' },
      { id: 'observability',label: 'Observability', icon: '🔍' },
      { id: 'governance',   label: 'Governance',    icon: '🏛️' },
    ],
  },
  {
    label: 'PERSONAS',
    items: [
      { id: 'marketing',   label: 'Marketing',   icon: '📣' },
      { id: 'engineering', label: 'Engineering',  icon: '⚙️' },
      { id: 'product',     label: 'Product',      icon: '🗺️' },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { id: 'forum',    label: 'Discussions', icon: '💬' },
      { id: 'blog',     label: 'Blog',        icon: '✍️' },
      { id: 'learning', label: 'Learning',    icon: '🎓' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️' },
      { id: 'about',    label: 'About',    icon: 'ℹ️' },
    ],
  },
];

export function Sidebar() {
  const activeSection = useEAOSStore(s => s.activeSection);
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? 'w-14' : 'w-[220px]';

  return (
    <aside
      className={`${width} flex-shrink-0 flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200 overflow-hidden`}
      data-tour="sidebar"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-gray-200 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          A
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-gray-900 tracking-tight truncate">AgentOS</span>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    data-tour={`sidebar-${item.id}`}
                    onClick={() => setActiveSection(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-all text-left group ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-shrink-0 w-4 text-center leading-none">{item.icon}</span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: status + collapse */}
      <div className="flex-shrink-0 border-t border-gray-200 px-2 py-2 space-y-1">
        {!collapsed && (
          <GatewayStatusBadge />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-all"
        >
          <span className="text-[10px]">{collapsed ? '→' : '←'}</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function GatewayStatusBadge() {
  // Read gateway status from the store or use a local poll
  // Simple approach: derive from page-level check (passed via context or re-polled here)
  const [status, setStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');

  // Poll on mount
  useState(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/health');
        setStatus(res.ok ? 'connected' : 'offline');
      } catch {
        setStatus('offline');
      }
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  });

  const color = status === 'connected' ? 'bg-emerald-500' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-500';
  const label = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting' : 'Offline';

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[11px] text-gray-500 truncate">{label}</span>
    </div>
  );
}
