'use client';

import { useEAOSStore } from '../store/eaos-store';

const NAV_SECTIONS = [
    {
        label: 'Core',
        items: [
            { id: 'home', label: 'Home', icon: '⌂' },
            { id: 'agents', label: 'Agents', icon: '🤖' },
            { id: 'workflows', label: 'Workflows', icon: '⚡' },
            { id: 'knowledge', label: 'Knowledge', icon: '📚' },
            { id: 'skills', label: 'Skills', icon: '🧩' },
            { id: 'prompts', label: 'Prompt Library', icon: '💬' },
            { id: 'projects', label: 'Projects', icon: '📋' },
        ],
    },
    {
        label: 'Domains',
        items: [
            { id: 'engineering', label: 'Engineering', icon: '🔧' },
            { id: 'marketing', label: 'Marketing', icon: '📣' },
            { id: 'learning', label: 'Learning', icon: '🎓' },
        ],
    },
    {
        label: 'Platform',
        items: [
            { id: 'tools', label: 'Tools', icon: '🔌' },
            { id: 'activity', label: 'Activity', icon: '📊' },
            { id: 'observability', label: 'Observability', icon: '🔍' },
        ],
    },
    {
        label: 'System',
        items: [
            { id: 'about', label: 'About', icon: 'ℹ️' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
        ],
    },
];

export function Sidebar() {
    const { activeSection, setActiveSection, sidebarCollapsed, toggleSidebar } = useEAOSStore();

    return (
        <nav
            className={`flex flex-col bg-surface-raised border-r border-white/[0.06] transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]" data-tour="sidebar-logo">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm glow-accent">
                    E
                </div>
                {!sidebarCollapsed && (
                    <div>
                        <div className="text-sm font-semibold text-white tracking-wide">EAOS</div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Mission Control</div>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="ml-auto text-neutral-500 hover:text-white transition-colors text-xs"
                    aria-label="Toggle sidebar"
                >
                    {sidebarCollapsed ? '→' : '←'}
                </button>
            </div>

            {/* Nav Sections */}
            <div className="flex-1 overflow-y-auto py-2">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label} className="mb-2">
                        {!sidebarCollapsed && (
                            <div className="px-4 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                                {section.label}
                            </div>
                        )}
                        {section.items.map((item) => (
                            <button
                                key={item.id}
                                data-tour={`sidebar-${item.id}`}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-all duration-150 ${activeSection === item.id
                                    ? 'text-white bg-accent/10 border-r-2 border-accent'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Status Footer */}
            <div className="px-4 py-3 border-t border-white/[0.06]">
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <span className="status-dot running" />
                        <span className="text-xs text-neutral-400">7 services running</span>
                    </div>
                )}
                {sidebarCollapsed && <span className="status-dot running mx-auto block" />}
            </div>
        </nav>
    );
}
