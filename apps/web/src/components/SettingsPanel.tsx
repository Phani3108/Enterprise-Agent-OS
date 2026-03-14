'use client';

/**
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

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
        <div className="p-6 max-w-2xl bg-slate-50 min-h-full">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Settings</h2>

            {/* Profile */}
            <section className="mb-8">
                <h3 className="text-sm font-medium text-slate-600 mb-3 uppercase tracking-wider">Profile</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-900">Selected Role</div>
                            <div className="text-xs text-slate-600 mt-1">{role ? `${role.charAt(0).toUpperCase() + role.slice(1)}` : 'Not set — complete onboarding'}</div>
                        </div>
                        <button
                            onClick={onRestartOnboarding}
                            className="text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                        >
                            Change Role
                        </button>
                    </div>
                </div>
            </section>

            {/* Help & Learning */}
            <section className="mb-8">
                <h3 className="text-sm font-medium text-slate-600 mb-3 uppercase tracking-wider">Help & Learning</h3>
                <div className="space-y-3">
                    <button
                        onClick={() => startTour()}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left shadow-sm"
                    >
                        <span className="text-xl">🎯</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">Guided Tour</div>
                            <div className="text-xs text-slate-600">25-step walkthrough of every feature</div>
                        </div>
                        <span className="text-xs text-slate-600">{tourCompleted ? 'Completed ✓' : 'Not started'}</span>
                    </button>

                    <button
                        onClick={onRestartOnboarding}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left shadow-sm"
                    >
                        <span className="text-xl">👋</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">Onboarding</div>
                            <div className="text-xs text-slate-600">Re-run the welcome flow and role selection</div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveSection('about')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-left shadow-sm"
                    >
                        <span className="text-xl">ℹ️</span>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">About EOS</div>
                            <div className="text-xs text-slate-600">Core concepts, examples, demo videos, FAQ</div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Keyboard Shortcuts */}
            <section className="mb-8">
                <h3 className="text-sm font-medium text-slate-600 mb-3 uppercase tracking-wider">Keyboard Shortcuts</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    {[
                        { keys: '⌘ K', desc: 'Open Command Bar' },
                        { keys: 'Esc', desc: 'Close dialogs / overlay' },
                        { keys: '→ / Enter', desc: 'Next tour step' },
                        { keys: '←', desc: 'Previous tour step' },
                    ].map(item => (
                        <div key={item.keys} className="flex items-center justify-between">
                            <span className="text-xs text-slate-700 font-medium">{item.desc}</span>
                            <kbd className="text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono">{item.keys}</kbd>
                        </div>
                    ))}
                </div>
            </section>

            {/* Data */}
            <section>
                <h3 className="text-sm font-medium text-slate-600 mb-3 uppercase tracking-wider">Data & Privacy</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-900">Reset All Preferences</div>
                            <div className="text-xs text-slate-600 mt-1">Clear onboarding, tour, and role data</div>
                        </div>
                        <button
                            onClick={handleResetAll}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
                        >
                            {cleared ? '✓ Cleared' : 'Reset'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
