'use client';

/**
 * Onboarding Modal — Multi-step first-time user onboarding
 */

import { useState, useEffect, useCallback } from 'react';
import { ROLES, getUseCasesForRole, getQuickStartsForRole, type Role, type QuickStartCard } from '../../lib/onboarding-data';
import { hasCompletedOnboarding, setPreference } from '../../lib/storage';
import { useTour } from '../tour/TourProvider';
import { useEAOSStore } from '../../store/eaos-store';

interface OnboardingModalProps {
    forceOpen?: boolean;
    onClose?: () => void;
}

export default function OnboardingModal({ forceOpen, onClose }: OnboardingModalProps) {
    const [step, setStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
    const [visible, setVisible] = useState(false);
    const { start: startTour } = useTour();
    const setActiveSection = useEAOSStore(s => s.setActiveSection);

    useEffect(() => {
        if (forceOpen) {
            setVisible(true);
            setStep(0);
            setSelectedRole(null);
            setSelectedUseCases([]);
        } else if (!hasCompletedOnboarding()) {
            setVisible(true);
        }
    }, [forceOpen]);

    const handleClose = useCallback(() => {
        setVisible(false);
        setPreference('onboarding_completed', true);
        if (selectedRole) setPreference('selected_role', selectedRole);
        onClose?.();
    }, [selectedRole, onClose]);

    const handleStartTour = useCallback(() => {
        handleClose();
        setTimeout(() => startTour(), 300);
    }, [handleClose, startTour]);

    const handleQuickStart = useCallback((card: QuickStartCard) => {
        handleClose();
        if (card.query) {
            // Route to home and put query into command bar
            setActiveSection('home');
        } else if (card.domain === 'Skills') {
            setActiveSection('library-skills');
        } else if (card.domain === 'System') {
            setActiveSection('ops-executions');
        }
    }, [handleClose, setActiveSection]);

    const toggleUseCase = (id: string) => {
        setSelectedUseCases(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    if (!visible) return null;

    const selectedRoleData = ROLES.find(r => r.id === selectedRole);
    const useCases = selectedRole ? getUseCasesForRole(selectedRole) : [];
    const quickStarts = selectedRole ? getQuickStartsForRole(selectedRole) : [];

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Welcome to EOS">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div
                className="relative w-full max-w-[640px] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl animate-fade-in"
                style={{ background: 'rgba(12, 12, 18, 0.98)', backdropFilter: 'blur(20px)' }}
            >
                {/* Progress dots */}
                <div className="flex justify-center gap-2 pt-6 pb-2">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-accent' :
                                i < step ? 'bg-accent/40' : 'bg-white/10'
                                }`}
                        />
                    ))}
                </div>

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors text-sm"
                    aria-label="Close onboarding"
                >
                    ✕
                </button>

                <div className="p-8">
                    {/* ── Step 0: Welcome ── */}
                    {step === 0 && (
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                                ⚡
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Welcome to EOS</h2>
                            <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto mb-2">
                                Your Enterprise Operating System — an AI-powered platform that connects internal knowledge, automates workflows, and accelerates every team.
                            </p>
                            <p className="text-neutral-500 text-xs mb-8">
                                Let&apos;s personalize your experience in 60 seconds.
                            </p>
                            <button
                                onClick={() => setStep(1)}
                                className="px-8 py-3 rounded-xl bg-accent/20 text-accent font-medium text-sm hover:bg-accent/30 transition-colors border border-accent/20"
                            >
                                Get Started →
                            </button>
                            <div className="mt-4">
                                <button onClick={handleClose} className="text-xs text-neutral-500 hover:text-white transition-colors">
                                    Skip — I&apos;ll explore on my own
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 1: Role Selection ── */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">What&apos;s your primary role?</h2>
                            <p className="text-sm text-neutral-400 mb-6">This helps us show you the most relevant features and examples.</p>
                            <div className="grid grid-cols-1 gap-3">
                                {ROLES.map((role: Role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedRole === role.id
                                            ? `bg-gradient-to-r ${role.color} border-white/20 scale-[1.02]`
                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <span className="text-2xl">{role.icon}</span>
                                        <div>
                                            <div className="text-sm font-medium text-white">{role.label}</div>
                                            <div className="text-xs text-neutral-400">{role.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-6">
                                <button onClick={() => setStep(0)} className="text-xs text-neutral-500 hover:text-white transition-colors">← Back</button>
                                <button
                                    onClick={() => selectedRole && setStep(2)}
                                    disabled={!selectedRole}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${selectedRole
                                        ? 'bg-accent/20 text-accent hover:bg-accent/30'
                                        : 'bg-white/5 text-neutral-600 cursor-not-allowed'
                                        }`}
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Use Case Selection ── */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">What do you want to do?</h2>
                            <p className="text-sm text-neutral-400 mb-6">
                                Select the use cases most relevant to you as {selectedRoleData?.icon} <strong>{selectedRoleData?.label}</strong>.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {useCases.map(uc => (
                                    <button
                                        key={uc.id}
                                        onClick={() => toggleUseCase(uc.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedUseCases.includes(uc.id)
                                            ? 'bg-accent/10 border-accent/30'
                                            : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                                            }`}
                                    >
                                        <span className="text-lg">{uc.icon}</span>
                                        <span className="text-xs text-neutral-200">{uc.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-6">
                                <button onClick={() => setStep(1)} className="text-xs text-neutral-500 hover:text-white transition-colors">← Back</button>
                                <button
                                    onClick={() => setStep(3)}
                                    className="px-6 py-2 rounded-lg text-sm font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Quick Start Cards ── */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-1">Ready to go! Here&apos;s where to start:</h2>
                            <p className="text-sm text-neutral-400 mb-6">
                                Personalized for your role as {selectedRoleData?.icon} <strong>{selectedRoleData?.label}</strong>.
                            </p>

                            <div className="grid grid-cols-1 gap-3 mb-6">
                                {quickStarts.slice(0, 4).map((card) => (
                                    <button
                                        key={card.id}
                                        onClick={() => handleQuickStart(card)}
                                        className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${card.color} border border-white/[0.06] hover:border-white/[0.12] transition-all text-left hover:scale-[1.01]`}
                                    >
                                        <span className="text-2xl">{card.icon}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">{card.title}</div>
                                            <div className="text-xs text-neutral-400">{card.description}</div>
                                            {card.query && (
                                                <div className="mt-1 text-xs font-mono text-accent/60 truncate">&quot;{card.query}&quot;</div>
                                            )}
                                        </div>
                                        <span className="text-neutral-500">→</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 items-center border-t border-white/[0.06] pt-6">
                                <button
                                    onClick={handleStartTour}
                                    className="w-full px-6 py-3 rounded-xl bg-accent/20 text-accent font-medium text-sm hover:bg-accent/30 transition-colors border border-accent/20"
                                >
                                    🎯 Take the Guided Tour ({25} steps)
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="text-xs text-neutral-500 hover:text-white transition-colors"
                                >
                                    Jump straight into EOS →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
