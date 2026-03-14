'use client';

import { useState } from 'react';

interface ExecutionStep {
    name: string;
    status: 'complete' | 'running' | 'pending' | 'failed';
    durationMs?: number;
    worker?: string;
    skill?: string;
}

interface Source {
    title: string;
    type: string;
    url: string;
}

interface Execution {
    id: string;
    goal: string;
    domain: string;
    status: 'running' | 'complete' | 'failed';
    confidence: number;
    grounded: boolean;
    groundingScore: number;
    durationMs: number;
    steps: ExecutionStep[];
    sources: Source[];
}

export function ExecutionCard({ execution }: { execution: Execution }) {
    const [expanded, setExpanded] = useState(execution.status === 'running');

    const statusColors = {
        running: 'text-accent',
        complete: 'text-success',
        failed: 'text-danger',
    };

    const statusIcons = {
        running: '⏳',
        complete: '✅',
        failed: '❌',
    };

    const completedSteps = execution.steps.filter((s) => s.status === 'complete').length;
    const progress = Math.round((completedSteps / execution.steps.length) * 100);

    return (
        <div
            data-tour="execution-card"
            className={`step-card cursor-pointer transition-all duration-200 ${execution.status === 'running' ? 'active' : execution.status === 'complete' ? 'complete' : ''
                }`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm ${statusColors[execution.status]}`}>
                            {statusIcons[execution.status]}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {execution.domain}
                        </span>
                    </div>
                    <h3 className="text-[14px] font-medium text-slate-900 truncate">{execution.goal}</h3>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Confidence</div>
                        <div className={`text-sm font-mono font-medium ${execution.confidence >= 0.8 ? 'text-success' : execution.confidence >= 0.6 ? 'text-warning' : 'text-danger'
                            }`}>
                            {(execution.confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Duration</div>
                        <div className="text-sm font-mono text-slate-600">
                            {(execution.durationMs / 1000).toFixed(1)}s
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${execution.status === 'running'
                            ? 'bg-accent animate-pulse-glow'
                            : execution.status === 'complete'
                                ? 'bg-success'
                                : 'bg-danger'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-slate-400">
                        {completedSteps}/{execution.steps.length} steps
                    </span>
                    <span className="text-[11px] text-slate-400">{progress}%</span>
                </div>
            </div>

            {/* Expanded: Steps + Sources */}
            {expanded && (
                <div className="mt-4 space-y-4 animate-slide-up">
                    {/* Steps */}
                    <div className="space-y-2">
                        {execution.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-1.5">
                                <span className={`status-dot ${step.status}`} />
                                <span className={`text-xs flex-1 ${step.status === 'running' ? 'text-blue-600' :
                                    step.status === 'complete' ? 'text-slate-600' :
                                        'text-slate-400'
                                    }`}>
                                    {step.name}
                                </span>
                                {step.worker && (
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-mono">
                                        {step.worker}
                                    </span>
                                )}
                                {step.durationMs && (
                                    <span className="text-[11px] text-slate-400 font-mono w-12 text-right">
                                        {(step.durationMs / 1000).toFixed(1)}s
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Trust / Grounding */}
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">{execution.grounded ? '✅' : '⚠️'}</span>
                            <span className="text-[11px] text-slate-500">
                                Grounded: {(execution.groundingScore * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs">📖</span>
                            <span className="text-[11px] text-slate-500">
                                {execution.sources.length} sources
                            </span>
                        </div>
                    </div>

                    {/* Sources */}
                    {execution.sources.length > 0 && (
                        <div className="space-y-1" data-tour="evidence-sources">
                            {execution.sources.map((src, idx) => (
                                <a
                                    key={idx}
                                    href={src.url}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-slate-500 hover:text-slate-700"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono uppercase">
                                        {src.type}
                                    </span>
                                    <span>{src.title}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
