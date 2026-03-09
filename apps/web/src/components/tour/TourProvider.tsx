'use client';

/**
 * Tour Provider — Context + state management for the guided tour
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { TOUR_STEPS, type TourStep } from '../../lib/tour-data';
import { getPreference, setPreference } from '../../lib/storage';

interface TourContextValue {
    isActive: boolean;
    currentStepIndex: number;
    currentStep: TourStep | null;
    totalSteps: number;
    next: () => void;
    prev: () => void;
    skip: () => void;
    finish: () => void;
    start: () => void;
    goToStep: (index: number) => void;
    isCompleted: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
    const ctx = useContext(TourContext);
    if (!ctx) throw new Error('useTour must be used within TourProvider');
    return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        setIsCompleted(getPreference('tour_completed'));
    }, []);

    const currentStep = isActive ? (TOUR_STEPS[currentStepIndex] ?? null) : null;

    const finish = useCallback(() => {
        setIsActive(false);
        setCurrentStepIndex(0);
        setIsCompleted(true);
        setPreference('tour_completed', true);
    }, []);

    const next = useCallback(() => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(i => i + 1);
        } else {
            finish();
        }
    }, [currentStepIndex, finish]);

    const prev = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(i => i - 1);
        }
    }, [currentStepIndex]);

    const skip = useCallback(() => {
        finish();
    }, [finish]);

    const start = useCallback(() => {
        setCurrentStepIndex(0);
        setIsActive(true);
    }, []);

    const goToStep = useCallback((index: number) => {
        if (index >= 0 && index < TOUR_STEPS.length) {
            setCurrentStepIndex(index);
        }
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!isActive) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
            if (e.key === 'Escape') { e.preventDefault(); skip(); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isActive, next, prev, skip]);

    return (
        <TourContext.Provider value={{
            isActive, currentStepIndex, currentStep,
            totalSteps: TOUR_STEPS.length,
            next, prev, skip, finish, start, goToStep, isCompleted,
        }}>
            {children}
        </TourContext.Provider>
    );
}
