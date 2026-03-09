'use client';

/**
 * Tour Overlay — Dims background and highlights the current tour target
 */

import { useEffect, useState, useCallback } from 'react';
import { useTour } from './TourProvider';
import TourStepCard from './TourStepCard';

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export default function TourOverlay() {
    const { isActive, currentStep } = useTour();
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const [cardPosition, setCardPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const findAndMeasureTarget = useCallback(() => {
        if (!currentStep) return;

        const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
        if (!el) {
            // Target missing — show card centered
            setTargetRect(null);
            setCardPosition({
                top: window.innerHeight / 2 - 150,
                left: window.innerWidth / 2 - 200,
            });
            return;
        }

        const rect = el.getBoundingClientRect();
        const padding = 8;
        setTargetRect({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
        });

        // Position card based on placement
        const placement = currentStep.placement ?? 'bottom';
        const cardWidth = 400;
        const cardHeight = 320;
        let top = 0;
        let left = 0;

        switch (placement) {
            case 'right':
                top = rect.top;
                left = rect.right + 16;
                // Viewport collision — if card goes off right edge, try left
                if (left + cardWidth > window.innerWidth - 20) {
                    left = rect.left - cardWidth - 16;
                }
                break;
            case 'left':
                top = rect.top;
                left = rect.left - cardWidth - 16;
                if (left < 20) {
                    left = rect.right + 16;
                }
                break;
            case 'bottom':
                top = rect.bottom + 16;
                left = rect.left + rect.width / 2 - cardWidth / 2;
                if (top + cardHeight > window.innerHeight - 20) {
                    top = rect.top - cardHeight - 16;
                }
                break;
            case 'top':
                top = rect.top - cardHeight - 16;
                left = rect.left + rect.width / 2 - cardWidth / 2;
                if (top < 20) {
                    top = rect.bottom + 16;
                }
                break;
        }

        // Clamp to viewport
        left = Math.max(20, Math.min(left, window.innerWidth - cardWidth - 20));
        top = Math.max(20, Math.min(top, window.innerHeight - cardHeight - 20));

        setCardPosition({ top, left });
    }, [currentStep]);

    useEffect(() => {
        if (!isActive || !currentStep) return;
        // Small delay for DOM to paint before measuring
        const timer = setTimeout(findAndMeasureTarget, 50);
        window.addEventListener('resize', findAndMeasureTarget);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', findAndMeasureTarget);
        };
    }, [isActive, currentStep, findAndMeasureTarget]);

    if (!isActive || !currentStep) return null;

    return (
        <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Guided Tour">
            {/* Dark overlay with cutout */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left}
                                y={targetRect.top}
                                width={targetRect.width}
                                height={targetRect.height}
                                rx="12"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0" y="0" width="100%" height="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#tour-mask)"
                />
            </svg>

            {/* Highlight border around target */}
            {targetRect && (
                <div
                    className="absolute rounded-xl border-2 border-accent/60 shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-300"
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Click trap — prevents clicking outside tour */}
            <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

            {/* Step card */}
            <div
                className="absolute transition-all duration-300 ease-out"
                style={{ top: cardPosition.top, left: cardPosition.left, zIndex: 10000 }}
            >
                <TourStepCard />
            </div>
        </div>
    );
}
