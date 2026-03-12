'use client';
/**
 * TopBar — breadcrumb, command trigger, create menu, notifications, user.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
import { useState } from 'react';
import { useEAOSStore } from '../store/eaos-store';

const NAV_LABELS: Record<string, string> = {
  home:                   'Command Center',
  'ws-marketing':         'Marketing Workspace',
  'ws-engineering':       'Engineering Workspace',
  'ws-product':           'Product Workspace',
  'conn-ai-models':       'AI Models',
  'conn-storage':         'Storage & Docs',
  'conn-design':          'Design Tools',
  'conn-crm':             'CRM & Ads',
  'conn-devtools':        'Dev Tools',
  'conn-cms':             'CMS & Publishing',
  'conn-messaging':       'Messaging',
  'conn-data':            'Data & Infra',
  'library-skills':       'Skills Library',
  'library-workflows':    'Workflows',
  'library-prompts':      'Prompt Library',
  'library-templates':    'Templates',
  'library-agents':       'Agents',
  'ops-integrations':     'Tool Registry',
  'ops-executions':       'Executions',
  'ops-projects':         'Projects',
  'learning-courses':     'Courses',
  'learning-playbooks':   'Playbooks',
  'community-discussions':'Discussions',
  'community-blogs':      'Blogs',
  'admin-governance':     'Governance',
  'admin-usage':          'Usage & Monitoring',
  'admin-settings':       'Settings',
};

// Breadcrumb group label
const GROUP_LABELS: Record<string, string> = {
  home:            '',
  'ws-marketing':  'Workspaces',  'ws-engineering': 'Workspaces',  'ws-product': 'Workspaces',
  'conn-ai-models':'Connections', 'conn-storage':'Connections',    'conn-design':'Connections',
  'conn-crm':'Connections',       'conn-devtools':'Connections',   'conn-cms':'Connections',
  'conn-messaging':'Connections', 'conn-data':'Connections',
  'library-skills':'Library',     'library-workflows':'Library',   'library-prompts':'Library',
  'library-templates':'Library',  'library-agents':'Library',
  'ops-integrations':'Operations','ops-executions':'Operations',   'ops-projects':'Operations',
  'learning-courses':'Learning',  'learning-playbooks':'Learning',
  'community-discussions':'Community','community-blogs':'Community',
  'admin-governance':'Admin',     'admin-usage':'Admin',            'admin-settings':'Admin',
};

const LIVE_EXECUTION_SECTIONS = ['ws-marketing', 'library-skills', 'ops-executions'];

const CREATE_ITEMS = [
  { label: 'New Skill',     icon: '🔧', section: 'library-skills'    },
  { label: 'New Workflow',  icon: '⚡', section: 'library-workflows'  },
  { label: 'New Prompt',    icon: '✨', section: 'library-prompts'    },
  { label: 'New Blog Post', icon: '✍️', section: 'community-blogs'   },
  { label: 'New Discussion',icon: '💬', section: 'community-discussions'},
];

export function TopBar() {
  const activeSection   = useEAOSStore(s => s.activeSection);
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen  = useEAOSStore(s => s.setCommandOpen);
  const notifications   = useEAOSStore(s => s.notifications);
  const toggleRightPanel = useEAOSStore(s => s.toggleRightPanel);

  const [showCreate, setShowCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unread   = notifications.filter(n => !n.read).length;
  const title    = NAV_LABELS[activeSection] ?? activeSection;
  const group    = GROUP_LABELS[activeSection] ?? '';

  return (
    <header className="flex items-center justify-between px-5 h-12 border-b border-gray-200 bg-white flex-shrink-0 z-10">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
        <span className="text-gray-400">AgentOS</span>
        {group && <><span className="text-gray-300">/</span><span className="text-gray-400">{group}</span></>}
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold truncate">{title}</span>
      </div>

      {/* Center: command trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400 hover:border-gray-300 hover:bg-white transition-all w-64 group"
        data-tour="command-palette"
      >
        <span>🔍</span>
        <span className="flex-1 text-left">Search skills, run workflows…</span>
        <kbd className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Create */}
        <div className="relative">
          <button
            onClick={() => { setShowCreate(v => !v); setShowNotifications(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <span>＋</span><span>Create</span>
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
                    <span>{item.icon}</span><span>{item.label}</span>
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
                  {notifications.length === 0
                    ? <p className="text-xs text-gray-400 text-center py-6">No notifications</p>
                    : notifications.slice(0, 8).map(n => (
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
                  }
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right panel toggle */}
        {LIVE_EXECUTION_SECTIONS.includes(activeSection) && (
          <button onClick={toggleRightPanel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <span className="text-sm">⊟</span>
          </button>
        )}

        {/* User */}
        <button
          onClick={() => setActiveSection('admin-settings')}
          className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center hover:bg-gray-700 transition-colors"
        >P</button>
      </div>
    </header>
  );
}
