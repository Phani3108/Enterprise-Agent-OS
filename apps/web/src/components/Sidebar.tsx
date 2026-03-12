'use client';
/**
 * Sidebar — AgentOS primary navigation
 * 7 top-level groups: Home · Workspaces · Library · Operations · Learning · Community · Admin
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';
import { useEAOSStore } from '../store/eaos-store';

interface NavItem { id: string; label: string; icon: string; badge?: string; }
interface NavGroup { id: string; label?: string; collapsible?: boolean; items: NavItem[]; }

const NAV: NavGroup[] = [
  {
    id: 'home-group',
    items: [{ id: 'home', label: 'Command Center', icon: '⌂' }],
  },
  {
    id: 'workspaces', label: 'Workspaces', collapsible: true,
    items: [
      { id: 'ws-marketing',   label: 'Marketing',   icon: '📣' },
      { id: 'ws-engineering', label: 'Engineering', icon: '⚙️' },
      { id: 'ws-product',     label: 'Product',     icon: '🗺️' },
    ],
  },
  {
    id: 'library', label: 'Library', collapsible: true,
    items: [
      { id: 'library-skills',    label: 'Skills',    icon: '✦'  },
      { id: 'library-workflows', label: 'Workflows', icon: '⚡' },
      { id: 'library-prompts',   label: 'Prompts',   icon: '✨' },
      { id: 'library-templates', label: 'Templates', icon: '📚' },
      { id: 'library-agents',    label: 'Agents',    icon: '🤖' },
    ],
  },
  {
    id: 'operations', label: 'Operations', collapsible: true,
    items: [
      { id: 'ops-integrations', label: 'Integrations', icon: '🔌' },
      { id: 'ops-executions',   label: 'Executions',   icon: '📋' },
      { id: 'ops-projects',     label: 'Projects',     icon: '🗂️' },
    ],
  },
  {
    id: 'learning', label: 'Learning', collapsible: true,
    items: [
      { id: 'learning-courses',   label: 'Courses',   icon: '🎓' },
      { id: 'learning-playbooks', label: 'Playbooks', icon: '📖' },
    ],
  },
  {
    id: 'community', label: 'Community', collapsible: true,
    items: [
      { id: 'community-discussions', label: 'Discussions', icon: '💬' },
      { id: 'community-blogs',       label: 'Blogs',       icon: '✍️' },
    ],
  },
  {
    id: 'admin', label: 'Admin', collapsible: true,
    items: [
      { id: 'admin-governance', label: 'Governance', icon: '🏛️' },
      { id: 'admin-usage',      label: 'Usage',      icon: '📊' },
      { id: 'admin-settings',   label: 'Settings',   icon: '⚙️' },
    ],
  },
];

function findGroupId(sectionId: string): string | null {
  for (const group of NAV) {
    if (group.items.some(i => i.id === sectionId)) return group.id;
  }
  return null;
}

export function Sidebar() {
  const activeSection = useEAOSStore(s => s.activeSection);
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(['home-group', 'workspaces'])
  );

  useEffect(() => {
    const gid = findGroupId(activeSection);
    if (gid) setOpenGroups(prev => { const n = new Set(prev); n.add(gid); return n; });
  }, [activeSection]);

  const toggleGroup = (id: string) => {
    if (id === findGroupId(activeSection)) return; // keep active group open
    setOpenGroups(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-56'} flex-shrink-0 flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200 overflow-hidden`}
      data-tour="sidebar"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-gray-200 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">A</div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-900 tracking-tight block truncate">AgentOS</span>
            <span className="text-[10px] text-gray-400">Enterprise AI OS</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV.map(group => {
          const isOpen = !group.collapsible || openGroups.has(group.id);
          return (
            <div key={group.id} className="mb-1">
              {group.label && !collapsed && (
                <button
                  onClick={() => group.collapsible && toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{group.label}</span>
                  {group.collapsible && (
                    <span className={`text-[11px] text-gray-300 leading-none transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>›</span>
                  )}
                </button>
              )}
              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        data-tour={`sidebar-${item.id}`}
                        onClick={() => setActiveSection(item.id)}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-all text-left ${
                          isActive ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex-shrink-0 w-4 text-center leading-none">{item.icon}</span>
                        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                        {!collapsed && isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-800 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 px-2 py-2 space-y-1">
        {!collapsed && <GatewayStatusBadge />}
        <button
          onClick={() => setCollapsed(c => !c)}
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
  const [status, setStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  useState(() => {
    const check = async () => {
      try { const r = await fetch('http://localhost:3000/api/health'); setStatus(r.ok ? 'connected' : 'offline'); }
      catch { setStatus('offline'); }
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  });
  const color = status === 'connected' ? 'bg-emerald-500' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-500';
  const label = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Offline';
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[11px] text-gray-500 truncate">{label}</span>
    </div>
  );
}
