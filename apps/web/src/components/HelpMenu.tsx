'use client';

/**
 * Help Menu — Compact dropdown for tour/onboarding/about access
 */

import { useState, useRef, useEffect } from 'react';
import { useTour } from './tour/TourProvider';
import { useEAOSStore } from '../store/eaos-store';

interface HelpMenuProps {
    onRestartOnboarding: () => void;
}

export default function HelpMenu({ onRestartOnboarding }: HelpMenuProps) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { start: startTour } = useTour();
    const setActiveSection = useEAOSStore(s => s.setActiveSection);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const items = [
        { icon: '🎯', label: 'Restart Guided Tour', action: () => { setOpen(false); startTour(); } },
        { icon: '👋', label: 'Reopen Onboarding', action: () => { setOpen(false); onRestartOnboarding(); } },
        { icon: 'ℹ️', label: 'About EOS', action: () => { setOpen(false); setActiveSection('about'); } },
        { icon: '🎬', label: 'Demo Videos', action: () => { setOpen(false); setActiveSection('about'); } },
        { icon: '⌨️', label: 'Keyboard Shortcuts', action: () => { setOpen(false); /* future */ } },
    ];

    return (
        <div ref={menuRef} className="relative" data-tour="help-menu">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Help menu"
                aria-expanded={open}
            >
                <span>❓</span>
                <span>Help</span>
            </button>

            {open && (
                <div
                    className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in"
                    style={{ background: 'rgba(18, 18, 26, 0.98)', backdropFilter: 'blur(20px)' }}
                    role="menu"
                >
                    <div className="p-1">
                        {items.map((item, i) => (
                            <button
                                key={i}
                                onClick={item.action}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
                                role="menuitem"
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
