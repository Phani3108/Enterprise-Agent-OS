'use client';

/**
 * Settings Panel — User preferences and help access
 */

import { useState } from 'react';
import { useTour } from './tour/TourProvider';
import { resetAllPreferences, getSelectedRole } from '../lib/storage';
import { useEAOSStore } from '../store/eaos-store';

interface SettingsPanelProps {
    onRestartOnboarding?: () => void;
}

export default function SettingsPanel({ onRestartOnboarding }: SettingsPanelProps = {}) {
    const { start: startTour, isCompleted: tourCompleted } = useTour();
    const setActiveSection = useEAOSStore(s => s.setActiveSection);
    const [cleared, setCleared] = useState(false);
    const role = getSelectedRole();

    const handleResetAll = () => {
        resetAllPreferences();
        setCleared(true);
        setTimeout(() => setCleared(false), 3000);
    };

    return (
        <div className="p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-white mb-6">⚙️ Settings</h2>

            {/* Profile */}
            <section className="mb-8">
                <h3 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wider">Profile</h3>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-white">Selected Role</div>
                            <div className="text-xs text-neutral-400 mt-1">{role ? `${role.charAt(0).toUpperCase() + role.slice(1)}` : 'Not set — complete onboarding'}</div>
                        </div>
                        <button
                            onClick={onRestartOnboarding}
                            className="text-xs text-accent hover:text-accent/80 transition-colors"
                        >
                            Change Role
                        </button>
                    </div>
                </div>
            </section>

            {/* Help & Learning */}
            <section className="mb-8">
                <h3 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wider">Help & Learning</h3>
                <div className="space-y-3">
                    <button
                        onClick={() => startTour()}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
                    >
                        <span className="text-xl">🎯</span>
                        <div className="flex-1">
                            <div className="text-sm text-white">Guided Tour</div>
                            <div className="text-xs text-neutral-400">25-step walkthrough of every feature</div>
                        </div>
                        <span className="text-xs text-neutral-500">{tourCompleted ? 'Completed ✓' : 'Not started'}</span>
                    </button>

                    <button
                        onClick={onRestartOnboarding}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
                    >
                        <span className="text-xl">👋</span>
                        <div className="flex-1">
                            <div className="text-sm text-white">Onboarding</div>
                            <div className="text-xs text-neutral-400">Re-run the welcome flow and role selection</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveSection('about')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left"
                    >
                        <span className="text-xl">ℹ️</span>
                        <div className="flex-1">
                            <div className="text-sm text-white">About EOS</div>
                            <div className="text-xs text-neutral-400">Core concepts, examples, demo videos, FAQ</div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section className="mb-8">
                <h3 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wider">Keyboard Shortcuts</h3>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                    {[
                        { keys: '⌘ K', desc: 'Open Command Bar' },
                        { keys: 'Esc', desc: 'Close dialogs / overlay' },
                        { keys: '→ / Enter', desc: 'Next tour step' },
                        { keys: '←', desc: 'Previous tour step' },
                    ].map(item => (
                        <div key={item.keys} className="flex items-center justify-between">
                            <span className="text-xs text-neutral-400">{item.desc}</span>
                            <kbd className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-mono">{item.keys}</kbd>
                        </div>
                    ))}
                </div>
            </section>

            {/* Data */}
            <section>
                <h3 className="text-sm font-medium text-neutral-300 mb-3 uppercase tracking-wider">Data & Privacy</h3>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-white">Reset All Preferences</div>
                            <div className="text-xs text-neutral-400 mt-1">Clear onboarding, tour, and role data</div>
                        </div>
                        <button
                            onClick={handleResetAll}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            {cleared ? '✓ Cleared' : 'Reset'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
