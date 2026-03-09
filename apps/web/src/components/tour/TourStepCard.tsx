'use client';

/**
 * Tour Step Card — Floating explanation card for each tour step
 */

import { useTour } from './TourProvider';

export default function TourStepCard() {
    const { currentStep, currentStepIndex, totalSteps, next, prev, skip, finish } = useTour();

    if (!currentStep) return null;

    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === totalSteps - 1;
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    return (
        <div
            className="w-[400px] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: 'rgba(18, 18, 26, 0.97)', backdropFilter: 'blur(20px)' }}
            role="tooltip"
            aria-live="polite"
        >
            {/* Progress bar */}
            <div className="h-1 bg-white/5">
                <div
                    className="h-full bg-gradient-to-r from-accent to-purple-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-5">
                {/* Step counter */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        Step {currentStepIndex + 1} of {totalSteps}
                    </span>
                    <button
                        onClick={skip}
                        className="text-[10px] text-neutral-500 hover:text-white transition-colors uppercase tracking-wider"
                        tabIndex={0}
                    >
                        Skip tour
                    </button>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-white mb-2 leading-tight">
                    {currentStep.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                    {currentStep.description}
                </p>

                {/* Example input/output */}
                {(currentStep.exampleInput || currentStep.expectedOutput) && (
                    <div className="space-y-2 mb-4">
                        {currentStep.exampleInput && (
                            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                                <div className="text-[10px] uppercase tracking-wider text-accent/80 font-semibold mb-1">
                                    Example Input
                                </div>
                                <p className="text-xs text-neutral-200 font-mono">
                                    {currentStep.exampleInput}
                                </p>
                            </div>
                        )}
                        {currentStep.expectedOutput && (
                            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                                <div className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-semibold mb-1">
                                    Expected Output
                                </div>
                                <p className="text-xs text-neutral-300">
                                    {currentStep.expectedOutput}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={prev}
                        disabled={isFirst}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${isFirst
                            ? 'text-neutral-600 cursor-not-allowed'
                            : 'text-neutral-300 hover:text-white hover:bg-white/5'
                            }`}
                        tabIndex={0}
                    >
                        ← Previous
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStepIndex ? 'bg-accent' :
                                    i < currentStepIndex ? 'bg-accent/40' : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={isLast ? finish : next}
                        className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
                        tabIndex={0}
                    >
                        {isLast ? 'Finish ✓' : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
