'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getEvalDashboard,
    getEvalAlerts,
    getEvalReport,
    getEvalDrift,
    setEvalBaseline,
    updateEvalAgent,
    type AgentEvalConfig,
    type EvalAlert,
    type CognitiveFingerprint,
} from '../lib/api';

interface DashboardData {
    totalAgents: number;
    avgHealthScore: number;
    activeAlerts: number;
    driftingAgents: number;
    agents: AgentEvalConfig[];
}

interface ReportData {
    agentId: string;
    healthScore: number;
    fingerprint: CognitiveFingerprint;
    driftScore: number;
    alerts: EvalAlert[];
    predictedFailures: Array<{ type: string; confidence: number; message: string }>;
}

interface DriftEntry {
    ts: string;
    driftScore: number;
    fingerprint: CognitiveFingerprint;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function healthColor(score: number): string {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
}

function healthBg(score: number): string {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-400';
    return 'bg-red-500';
}

function healthBgLight(score: number): string {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
}

function severityBadge(sev: EvalAlert['severity']): string {
    switch (sev) {
        case 'critical': return 'bg-red-100 text-red-700 border-red-200';
        case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'low': return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}

function severityDot(sev: EvalAlert['severity']): string {
    switch (sev) {
        case 'critical': return 'bg-red-500';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-amber-400';
        case 'low': return 'bg-slate-400';
    }
}

function fpLabel(key: keyof CognitiveFingerprint): string {
    const map: Record<keyof CognitiveFingerprint, string> = {
        accuracy: 'Accuracy',
        speed: 'Speed',
        costEfficiency: 'Cost Efficiency',
        toolUsage: 'Tool Usage',
        creativity: 'Creativity',
        consistency: 'Consistency',
        errorRate: 'Error Rate',
        satisfaction: 'Satisfaction',
    };
    return map[key];
}

function fpBarColor(key: keyof CognitiveFingerprint): string {
    const colors: Record<keyof CognitiveFingerprint, string> = {
        accuracy: 'bg-blue-500',
        speed: 'bg-violet-500',
        costEfficiency: 'bg-emerald-500',
        toolUsage: 'bg-cyan-500',
        creativity: 'bg-pink-500',
        consistency: 'bg-indigo-500',
        errorRate: 'bg-red-400',
        satisfaction: 'bg-amber-500',
    };
    return colors[key];
}

function predictionIcon(type: string): string {
    switch (type) {
        case 'drift': return '↗';
        case 'cost': return '$';
        case 'latency': return '⏱';
        case 'error_rate': return '⚠';
        case 'token_budget': return '🔤';
        default: return '●';
    }
}

function relativeTime(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, extra }: { label: string; value: string | number; extra?: React.ReactNode }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-800">{value}</span>
                {extra}
            </div>
        </div>
    );
}

function AgentCard({
    agent,
    isSelected,
    onSelect,
}: {
    agent: AgentEvalConfig;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const isCritical = agent.healthScore < 60;
    const isDrifting = agent.driftScore > agent.driftThreshold;

    return (
        <button
            onClick={onSelect}
            className={`text-left w-full bg-white border rounded-xl p-4 transition-all hover:shadow-md ${
                isSelected
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm truncate pr-2">{agent.agentName}</h3>
                {isCritical ? (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">✕</span>
                ) : isDrifting ? (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-xs font-bold">!</span>
                ) : (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-xs font-bold">✓</span>
                )}
            </div>

            {/* Health bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Health</span>
                    <span className={`text-xs font-bold ${healthColor(agent.healthScore)}`}>{agent.healthScore}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${healthBg(agent.healthScore)}`}
                        style={{ width: `${Math.min(agent.healthScore, 100)}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                    Drift: <span className={agent.driftScore > agent.driftThreshold ? 'text-red-500 font-semibold' : 'text-slate-600'}>{agent.driftScore.toFixed(2)}</span>
                    <span className="text-slate-300"> / {agent.driftThreshold}</span>
                </span>
                <span className="text-slate-400">{agent.totalExecutions.toLocaleString()} runs</span>
            </div>
        </button>
    );
}

function FingerprintBars({
    current,
    baseline,
}: {
    current: CognitiveFingerprint;
    baseline?: CognitiveFingerprint;
}) {
    const keys: (keyof CognitiveFingerprint)[] = [
        'accuracy', 'speed', 'costEfficiency', 'toolUsage',
        'creativity', 'consistency', 'errorRate', 'satisfaction',
    ];

    return (
        <div className="space-y-3">
            {keys.map((key) => {
                const val = current[key];
                const baseVal = baseline?.[key];
                return (
                    <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600">{fpLabel(key)}</span>
                            <span className="text-xs text-slate-500">{val.toFixed(1)}%</span>
                        </div>
                        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            {baseVal !== undefined && (
                                <div
                                    className="absolute top-0 left-0 h-full rounded-full bg-slate-300 opacity-50"
                                    style={{ width: `${Math.min(baseVal, 100)}%` }}
                                />
                            )}
                            <div
                                className={`relative h-full rounded-full ${fpBarColor(key)} transition-all`}
                                style={{ width: `${Math.min(val, 100)}%` }}
                            />
                        </div>
                        {baseVal !== undefined && (
                            <div className="flex justify-end mt-0.5">
                                <span className="text-[10px] text-slate-400">baseline: {baseVal.toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function DriftTimeline({
    history,
    threshold,
}: {
    history: DriftEntry[];
    threshold: number;
}) {
    if (history.length === 0) {
        return <p className="text-xs text-slate-400 py-4 text-center">No drift history available.</p>;
    }

    const maxDrift = Math.max(...history.map((h) => h.driftScore), threshold, 1);

    return (
        <div className="relative">
            {/* Threshold line */}
            <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-300 z-10"
                style={{ bottom: `${(threshold / maxDrift) * 100}%` }}
            >
                <span className="absolute -top-4 right-0 text-[10px] text-red-400 font-medium">
                    threshold: {threshold}
                </span>
            </div>

            <div className="flex items-end gap-1 h-32">
                {history.slice(-30).map((entry, i) => {
                    const pct = (entry.driftScore / maxDrift) * 100;
                    const overThreshold = entry.driftScore > threshold;
                    return (
                        <div
                            key={i}
                            className="flex-1 min-w-[4px] group relative"
                            style={{ height: '100%' }}
                        >
                            <div
                                className={`absolute bottom-0 left-0 right-0 rounded-t transition-all ${
                                    overThreshold ? 'bg-red-400' : 'bg-emerald-400'
                                } hover:opacity-80`}
                                style={{ height: `${Math.max(pct, 2)}%` }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-20">
                                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow whitespace-nowrap">
                                    {entry.driftScore.toFixed(3)} — {new Date(entry.ts).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function BreakpointsTable({ agent }: { agent: AgentEvalConfig }) {
    const rows = [
        {
            type: 'Drift',
            threshold: agent.driftThreshold,
            current: agent.driftScore,
            triggered: agent.driftScore > agent.driftThreshold,
        },
        ...(agent.costThreshold !== undefined ? [{
            type: 'Cost',
            threshold: agent.costThreshold,
            current: agent.currentFingerprint.costEfficiency,
            triggered: agent.currentFingerprint.costEfficiency < agent.costThreshold,
        }] : []),
        ...(agent.latencyThresholdMs !== undefined ? [{
            type: 'Latency (ms)',
            threshold: agent.latencyThresholdMs,
            current: agent.currentFingerprint.speed,
            triggered: agent.currentFingerprint.speed < 50,
        }] : []),
        ...(agent.tokenThreshold !== undefined ? [{
            type: 'Token Budget',
            threshold: agent.tokenThreshold,
            current: 0,
            triggered: false,
        }] : []),
    ];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase">Type</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase">Threshold</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-slate-400 uppercase">Current</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.type} className="border-b border-slate-100">
                            <td className="py-2 px-3 text-slate-700 font-medium">{r.type}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{r.threshold}</td>
                            <td className="py-2 px-3 text-right text-slate-700">{typeof r.current === 'number' ? r.current.toFixed(2) : r.current}</td>
                            <td className="py-2 px-3 text-center">
                                {r.triggered ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Triggered</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">OK</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">No breakpoints configured.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AgentEvalsPanel() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [alerts, setAlerts] = useState<EvalAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [report, setReport] = useState<ReportData | null>(null);
    const [driftHistory, setDriftHistory] = useState<DriftEntry[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [baselineLoading, setBaselineLoading] = useState(false);
    const [ackingIds, setAckingIds] = useState<Set<string>>(new Set());

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [dashRes, alertsRes] = await Promise.all([
                getEvalDashboard(),
                getEvalAlerts(),
            ]);
            setDashboard(dashRes);
            setAlerts(alertsRes.alerts);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const selectAgent = useCallback(async (agentId: string) => {
        setSelectedAgentId(agentId);
        setDetailLoading(true);
        try {
            const [reportRes, driftRes] = await Promise.all([
                getEvalReport(agentId),
                getEvalDrift(agentId),
            ]);
            setReport(reportRes.report);
            setDriftHistory(driftRes.history);
        } catch {
            setReport(null);
            setDriftHistory([]);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const handleSetBaseline = useCallback(async () => {
        if (!selectedAgentId) return;
        setBaselineLoading(true);
        try {
            await setEvalBaseline(selectedAgentId);
            await selectAgent(selectedAgentId);
            await fetchDashboard();
        } catch {
            // silently fail
        } finally {
            setBaselineLoading(false);
        }
    }, [selectedAgentId, selectAgent, fetchDashboard]);

    const handleAcknowledge = useCallback(async (alert: EvalAlert) => {
        setAckingIds((prev) => new Set(prev).add(alert.id));
        try {
            await updateEvalAgent(alert.agentId, {});
            setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, acknowledged: true } : a));
        } catch {
            // silently fail
        } finally {
            setAckingIds((prev) => {
                const next = new Set(prev);
                next.delete(alert.id);
                return next;
            });
        }
    }, []);

    const selectedAgent = dashboard?.agents.find((a) => a.agentId === selectedAgentId);

    // ── Loading state ───────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Loading evaluation data…</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
                    <p className="text-red-600 font-medium mb-2">Failed to load</p>
                    <p className="text-sm text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboard}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboard) return null;

    // ── Render ───────────────────────────────────────────────────────────────

    const unackAlerts = alerts.filter((a) => !a.acknowledged);

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Agent Evaluations & Guardrails</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Cognitive fingerprinting, drift detection, and predictive monitoring</p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    ↻ Refresh
                </button>
            </div>

            {/* ── 1. Stats Row ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Agents" value={dashboard.totalAgents} />
                <StatCard
                    label="Avg Health Score"
                    value={dashboard.avgHealthScore.toFixed(1)}
                    extra={
                        <span className={`inline-block w-3 h-3 rounded-full ${healthBg(dashboard.avgHealthScore)}`} />
                    }
                />
                <StatCard
                    label="Active Alerts"
                    value={dashboard.activeAlerts}
                    extra={
                        dashboard.activeAlerts > 0 ? (
                            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{dashboard.activeAlerts}</span>
                        ) : undefined
                    }
                />
                <StatCard
                    label="Drifting Agents"
                    value={dashboard.driftingAgents}
                    extra={
                        dashboard.driftingAgents > 0 ? (
                            <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{dashboard.driftingAgents}</span>
                        ) : undefined
                    }
                />
            </div>

            {/* ── 2. Agent Health Grid ──────────────────────────────────────── */}
            <section>
                <h2 className="text-sm font-semibold text-slate-600 mb-3">Agent Health Grid</h2>
                {dashboard.agents.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                        No agents configured for evaluation.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {dashboard.agents.map((agent) => (
                            <AgentCard
                                key={agent.agentId}
                                agent={agent}
                                isSelected={agent.agentId === selectedAgentId}
                                onSelect={() => selectAgent(agent.agentId)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── 3. Selected Agent Detail ─────────────────────────────────── */}
            {selectedAgent && (
                <section className={`border rounded-xl overflow-hidden ${healthBgLight(selectedAgent.healthScore)}`}>
                    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-slate-800">{selectedAgent.agentName}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Last evaluated {relativeTime(selectedAgent.lastEvalAt)} · {selectedAgent.totalExecutions.toLocaleString()} total executions
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedAgentId(null)}
                            className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>

                    {detailLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="p-6 space-y-8 bg-white">
                            {/* Cognitive Fingerprint */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Cognitive Fingerprint
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                                    <FingerprintBars
                                        current={selectedAgent.currentFingerprint}
                                        baseline={selectedAgent.baselineFingerprint}
                                    />
                                    {selectedAgent.baselineFingerprint && (
                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200">
                                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                <span className="w-3 h-1.5 rounded bg-slate-300 opacity-50 inline-block" /> Baseline
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                <span className="w-3 h-1.5 rounded bg-blue-500 inline-block" /> Current
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Drift Monitor */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                    Drift Monitor
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                                    <DriftTimeline history={driftHistory} threshold={selectedAgent.driftThreshold} />
                                </div>
                            </div>

                            {/* Breakpoints */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Breakpoints Configuration
                                    </h3>
                                    <button
                                        onClick={handleSetBaseline}
                                        disabled={baselineLoading}
                                        className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {baselineLoading ? 'Setting…' : 'Set Current as Baseline'}
                                    </button>
                                </div>
                                <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                    <BreakpointsTable agent={selectedAgent} />
                                </div>
                            </div>

                            {/* Predictions */}
                            {report && report.predictedFailures.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        Predicted Failures
                                    </h3>
                                    <div className="space-y-2">
                                        {report.predictedFailures.map((pf, i) => (
                                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 flex items-center gap-3">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">
                                                    {predictionIcon(pf.type)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-700 truncate">{pf.message}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    pf.confidence >= 80 ? 'bg-red-400' : pf.confidence >= 50 ? 'bg-amber-400' : 'bg-slate-400'
                                                                }`}
                                                                style={{ width: `${pf.confidence}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-medium w-9 text-right">{pf.confidence}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* ── 4. Alerts Panel ──────────────────────────────────────────── */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-slate-600">Active Alerts</h2>
                    {unackAlerts.length > 0 && (
                        <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                            {unackAlerts.length}
                        </span>
                    )}
                </div>

                {alerts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                        No alerts — all agents operating within thresholds.
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`px-5 py-3 flex items-center gap-4 ${alert.acknowledged ? 'opacity-50' : ''}`}
                            >
                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${severityDot(alert.severity)}`} />
                                <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${severityBadge(alert.severity)}`}>
                                    {alert.severity}
                                </span>
                                <span className="text-xs font-medium text-slate-600 flex-shrink-0 w-28 truncate">{alert.agentName}</span>
                                <span className="text-xs text-slate-500 flex-1 truncate">{alert.message}</span>
                                <span className="text-[11px] text-slate-400 flex-shrink-0 w-16 text-right">{relativeTime(alert.ts)}</span>
                                {!alert.acknowledged && (
                                    <button
                                        onClick={() => handleAcknowledge(alert)}
                                        disabled={ackingIds.has(alert.id)}
                                        className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50 transition-colors"
                                    >
                                        {ackingIds.has(alert.id) ? '…' : 'Ack'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
