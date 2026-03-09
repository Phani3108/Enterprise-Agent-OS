'use client';

/**
 * Zustand store for EAOS Mission Control state.
 */
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EAOSState {
    // Navigation
    activeSection: string;
    sidebarCollapsed: boolean;
    setActiveSection: (section: string) => void;
    toggleSidebar: () => void;

    // Sessions
    activeSessions: Session[];
    addSession: (session: Session) => void;
    updateSession: (id: string, updates: Partial<Session>) => void;

    // Notifications
    notifications: Notification[];
    addNotification: (notification: Notification) => void;
    dismissNotification: (id: string) => void;

    // Command
    commandOpen: boolean;
    setCommandOpen: (open: boolean) => void;
}

interface Session {
    id: string;
    goal: string;
    domain: string;
    status: 'planning' | 'executing' | 'reflecting' | 'complete' | 'failed';
    progress: number;
    confidence: number;
    startedAt: Date;
}

interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEAOSStore = create<EAOSState>((set) => ({
    // Navigation
    activeSection: 'home',
    sidebarCollapsed: false,
    setActiveSection: (section) => set({ activeSection: section }),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    // Sessions
    activeSessions: [],
    addSession: (session) =>
        set((s) => ({ activeSessions: [...s.activeSessions, session] })),
    updateSession: (id, updates) =>
        set((s) => ({
            activeSessions: s.activeSessions.map((sess) =>
                sess.id === id ? { ...sess, ...updates } : sess
            ),
        })),

    // Notifications
    notifications: [
        {
            id: 'n1',
            type: 'success',
            title: 'Campaign strategy delivered',
            message: 'Community banks card modernization campaign is ready for review.',
            timestamp: new Date(Date.now() - 60_000),
            read: false,
            actionUrl: '#',
        },
        {
            id: 'n2',
            type: 'info',
            title: 'PR #456 auto-reviewed',
            message: 'Architecture: 91%, Security: 88%. 2 inline suggestions posted.',
            timestamp: new Date(Date.now() - 900_000),
            read: false,
        },
        {
            id: 'n3',
            type: 'warning',
            title: 'Incident INC-342 detected',
            message: '503 spike on payments-api. Auto-analysis started.',
            timestamp: new Date(Date.now() - 180_000),
            read: true,
        },
    ],
    addNotification: (notification) =>
        set((s) => ({ notifications: [notification, ...s.notifications] })),
    dismissNotification: (id) =>
        set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
        })),

    // Command
    commandOpen: false,
    setCommandOpen: (open) => set({ commandOpen: open }),
}));
