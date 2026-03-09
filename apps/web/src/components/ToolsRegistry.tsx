'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ToolRegistryEntry } from '../lib/api';

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
    filesystem: { label: 'Filesystem', icon: '📁', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
    shell: { label: 'Shell', icon: '💻', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
    github: { label: 'GitHub', icon: '🐙', color: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20' },
    http: { label: 'HTTP / APIs', icon: '🌐', color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20' },
    messaging: { label: 'Messaging', icon: '💬', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20' },
    deployment: { label: 'Deployment', icon: '🚀', color: 'from-sky-500/10 to-blue-500/10 border-sky-500/20' },
    database: { label: 'Database', icon: '🗄️', color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20' },
    analytics: { label: 'Analytics', icon: '📊', color: 'from-violet-500/10 to-purple-500/10 border-violet-500/20' },
    custom: { label: 'Custom', icon: '🔧', color: 'from-neutral-500/10 to-neutral-400/10 border-neutral-500/20' },
};

const AUTH_LABELS: Record<string, string> = {
    none: 'No Auth',
    api_key: 'API Key',
    oauth2: 'OAuth 2.0',
    jwt: 'JWT',
    basic: 'Basic Auth',
};

// ---------------------------------------------------------------------------
// Fallback data (used when gateway is offline)
// ---------------------------------------------------------------------------

const FALLBACK_TOOLS: ToolRegistryEntry[] = [
    { id: 'file.read', name: 'File Read', description: 'Read files from workspace', category: 'filesystem', authType: 'none', isActive: true, usageCount: 1247, avgLatencyMs: 12, successRate: 0.99 },
    { id: 'file.write', name: 'File Write', description: 'Write or update workspace files', category: 'filesystem', authType: 'none', isActive: true, usageCount: 892, avgLatencyMs: 18, successRate: 0.98 },
    { id: 'shell.exec', name: 'Shell Execute', description: 'Run shell commands with timeout', category: 'shell', authType: 'none', isActive: true, usageCount: 634, avgLatencyMs: 2400, successRate: 0.94 },
    { id: 'github.pr.read', name: 'GitHub PR Read', description: 'Fetch PR details, diffs, comments', category: 'github', connector: 'github', authType: 'oauth2', isActive: true, usageCount: 456, avgLatencyMs: 340, successRate: 0.97 },
    { id: 'github.pr.comment', name: 'GitHub PR Comment', description: 'Post inline or general PR comments', category: 'github', connector: 'github', authType: 'oauth2', isActive: true, usageCount: 312, avgLatencyMs: 280, successRate: 0.96 },
    { id: 'jira.ticket.read', name: 'Jira Ticket Read', description: 'Fetch Jira ticket details and history', category: 'http', connector: 'jira', authType: 'api_key', isActive: true, usageCount: 234, avgLatencyMs: 450, successRate: 0.93 },
    { id: 'slack.post', name: 'Slack Post', description: 'Post messages to Slack channels', category: 'messaging', connector: 'slack', authType: 'oauth2', isActive: true, usageCount: 567, avgLatencyMs: 190, successRate: 0.98 },
    { id: 'k8s.apply', name: 'Kubernetes Apply', description: 'Apply K8s manifests to clusters', category: 'deployment', authType: 'jwt', isActive: true, usageCount: 45, avgLatencyMs: 1200, successRate: 0.92 },
    { id: 'k8s.status', name: 'Kubernetes Status', description: 'Get pod/deployment/service status', category: 'deployment', authType: 'jwt', isActive: true, usageCount: 189, avgLatencyMs: 340, successRate: 0.96 },
    { id: 'db.query', name: 'Database Query', description: 'Execute read-only SQL queries', category: 'database', authType: 'basic', isActive: true, usageCount: 156, avgLatencyMs: 85, successRate: 0.97 },
    { id: 'vector.search', name: 'Vector Search', description: 'Semantic search across knowledge embeddings', category: 'analytics', authType: 'none', isActive: true, usageCount: 678, avgLatencyMs: 120, successRate: 0.95 },
    { id: 'http.fetch', name: 'HTTP Fetch', description: 'Make HTTP requests to external APIs', category: 'http', authType: 'api_key', isActive: true, usageCount: 345, avgLatencyMs: 620, successRate: 0.93 },
    { id: 'datadog.query', name: 'Datadog Query', description: 'Query metrics, logs, and APM traces', category: 'analytics', authType: 'api_key', isActive: true, usageCount: 89, avgLatencyMs: 540, successRate: 0.92 },
    { id: 'pagerduty.incident', name: 'PagerDuty Incident', description: 'Create, ack, resolve incidents', category: 'messaging', authType: 'api_key', isActive: true, usageCount: 34, avgLatencyMs: 290, successRate: 0.96 },
    { id: 'teams.post', name: 'Teams Post', description: 'Post to Microsoft Teams channels', category: 'messaging', connector: 'teams', authType: 'oauth2', isActive: false, usageCount: 12, avgLatencyMs: 380, successRate: 0.90 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ToolsRegistry() {
    const [tools, setTools] = useState<ToolRegistryEntry[]>(FALLBACK_TOOLS);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const loadTools = useCallback(async () => {
        try {
            const qs = selectedCategory ? `?category=${selectedCategory}` : '';
            const res = await fetch(`http://localhost:3000/api/tools${qs}`);
            if (res.ok) {
                const data = await res.json();
                setTools(data.tools);
            }
        } catch { /* use fallback */ }
    }, [selectedCategory]);

    useEffect(() => { loadTools(); }, [loadTools]);

    const allCategories = Array.from(new Set(FALLBACK_TOOLS.map(t => t.category)));
    const filtered = selectedCategory ? tools.filter(t => t.category === selectedCategory) : tools;

    const totalUsage = filtered.reduce((s, t) => s + t.usageCount, 0);
    const avgSuccess = filtered.length > 0 ? filtered.reduce((s, t) => s + t.successRate, 0) / filtered.length : 0;
    const activeCount = filtered.filter(t => t.isActive).length;

    const formatLatency = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-tour="tools-registry">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Tools Registry</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                        Internal tools and connectors used by AgentOS workers and skills at runtime.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                        Grid
                    </button>
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                        Table
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total Tools', value: filtered.length, color: 'text-white' },
                    { label: 'Active', value: activeCount, color: 'text-emerald-400' },
                    { label: 'Total Invocations', value: totalUsage.toLocaleString(), color: 'text-accent' },
                    { label: 'Avg Success Rate', value: `${(avgSuccess * 100).toFixed(1)}%`, color: avgSuccess >= 0.95 ? 'text-emerald-400' : 'text-yellow-400' },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="text-[11px] text-neutral-500 uppercase tracking-wider">{stat.label}</div>
                        <div className={`text-xl font-semibold mt-1 ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-neutral-500 mr-1">Category:</span>
                <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1 rounded-full text-xs transition-colors ${!selectedCategory ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                    All
                </button>
                {allCategories.map(cat => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.custom;
                    return (
                        <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedCategory === cat ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}
                        >
                            {meta.icon} {meta.label}
                        </button>
                    );
                })}
            </div>

            {/* Grid view */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-3">
                    {filtered.map(tool => {
                        const meta = CATEGORY_META[tool.category] || CATEGORY_META.custom;
                        return (
                            <div key={tool.id} className={`p-4 rounded-xl bg-gradient-to-br ${meta.color} border transition-transform hover:scale-[1.02]`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400">
                                        {meta.icon} {meta.label}
                                    </span>
                                    <span className={`w-2 h-2 rounded-full ${tool.isActive ? 'bg-emerald-400' : 'bg-neutral-600'}`} title={tool.isActive ? 'Active' : 'Inactive'} />
                                </div>
                                <h4 className="text-sm font-medium text-white mb-0.5">{tool.name}</h4>
                                <p className="text-[11px] text-neutral-400 line-clamp-2 mb-3">{tool.description}</p>
                                <code className="text-[10px] text-accent/60 font-mono block mb-3">{tool.id}</code>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-[10px] text-neutral-500">Uses</div>
                                        <div className="text-xs text-white font-mono">{tool.usageCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-neutral-500">Latency</div>
                                        <div className="text-xs text-white font-mono">{formatLatency(tool.avgLatencyMs)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-neutral-500">Success</div>
                                        <div className={`text-xs font-mono ${tool.successRate >= 0.95 ? 'text-emerald-400' : tool.successRate >= 0.90 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {(tool.successRate * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                                    <span className="text-[10px] text-neutral-500">{AUTH_LABELS[tool.authType] || tool.authType}</span>
                                    {tool.connector && <span className="text-[10px] text-neutral-500">via {tool.connector}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table view */
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400">Tool</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400">Category</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-400">Auth</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-400">Uses</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-400">Latency</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-400">Success</th>
                                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(tool => {
                                const meta = CATEGORY_META[tool.category] || CATEGORY_META.custom;
                                return (
                                    <tr key={tool.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-white font-medium">{tool.name}</div>
                                            <code className="text-[10px] text-neutral-500 font-mono">{tool.id}</code>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-400 text-xs">{meta.icon} {meta.label}</td>
                                        <td className="px-4 py-3 text-neutral-400 text-xs">{AUTH_LABELS[tool.authType]}</td>
                                        <td className="px-4 py-3 text-right text-white font-mono text-xs">{tool.usageCount}</td>
                                        <td className="px-4 py-3 text-right text-white font-mono text-xs">{formatLatency(tool.avgLatencyMs)}</td>
                                        <td className={`px-4 py-3 text-right font-mono text-xs ${tool.successRate >= 0.95 ? 'text-emerald-400' : tool.successRate >= 0.90 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {(tool.successRate * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block w-2 h-2 rounded-full ${tool.isActive ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
