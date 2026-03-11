/**
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ToolRegistryEntry } from '../lib/api';

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
    filesystem: { label: 'Filesystem', icon: '📁', color: 'from-blue-50 to-cyan-50 border-blue-200' },
    shell: { label: 'Shell', icon: '💻', color: 'from-emerald-50 to-teal-50 border-emerald-200' },
    github: { label: 'GitHub', icon: '🐙', color: 'from-purple-50 to-indigo-50 border-purple-200' },
    http: { label: 'HTTP / APIs', icon: '🌐', color: 'from-orange-50 to-amber-50 border-orange-200' },
    messaging: { label: 'Messaging', icon: '💬', color: 'from-pink-50 to-rose-50 border-pink-200' },
    deployment: { label: 'Deployment', icon: '🚀', color: 'from-sky-50 to-blue-50 border-sky-200' },
    database: { label: 'Database', icon: '🗄️', color: 'from-amber-50 to-yellow-50 border-amber-200' },
    analytics: { label: 'Analytics', icon: '📊', color: 'from-violet-50 to-purple-50 border-violet-200' },
    custom: { label: 'Custom', icon: '🔧', color: 'from-gray-50 to-gray-100 border-gray-200' },
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
        <div className="bg-gray-50 min-h-full p-6 space-y-6 max-w-[1400px] mx-auto" data-tour="tools-registry">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Tools Registry</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Internal tools and connectors used by AgentOS workers and skills at runtime.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'}`}>
                        Grid
                    </button>
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'}`}>
                        Table
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total Tools', value: filtered.length, color: 'text-gray-900' },
                    { label: 'Active', value: activeCount, color: 'text-emerald-600' },
                    { label: 'Total Invocations', value: totalUsage.toLocaleString(), color: 'text-blue-600' },
                    { label: 'Avg Success Rate', value: `${(avgSuccess * 100).toFixed(1)}%`, color: avgSuccess >= 0.95 ? 'text-emerald-600' : 'text-yellow-600' },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-[11px] text-gray-600 uppercase tracking-wider font-medium">{stat.label}</div>
                        <div className={`text-xl font-semibold mt-1 ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-600 font-medium mr-1">Category:</span>
                <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1 rounded-full text-xs transition-colors ${!selectedCategory ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'}`}>
                    All
                </button>
                {allCategories.map(cat => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.custom;
                    return (
                        <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                            className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedCategory === cat ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900'}`}
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
                            <div key={tool.id} className={`p-4 rounded-xl bg-gradient-to-br ${meta.color} border transition-transform hover:scale-[1.02] shadow-sm`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                        {meta.icon} {meta.label}
                                    </span>
                                    <span className={`w-2 h-2 rounded-full ${tool.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} title={tool.isActive ? 'Active' : 'Inactive'} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mb-0.5">{tool.name}</h4>
                                <p className="text-[11px] text-gray-700 font-medium line-clamp-2 mb-3">{tool.description}</p>
                                <code className="text-[10px] text-blue-600 font-mono block mb-3">{tool.id}</code>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-[10px] text-gray-600 font-medium">Uses</div>
                                        <div className="text-xs text-gray-900 font-mono font-semibold">{tool.usageCount}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-600 font-medium">Latency</div>
                                        <div className="text-xs text-gray-900 font-mono font-semibold">{formatLatency(tool.avgLatencyMs)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-600 font-medium">Success</div>
                                        <div className={`text-xs font-mono font-semibold ${tool.successRate >= 0.95 ? 'text-emerald-600' : tool.successRate >= 0.90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {(tool.successRate * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600 font-medium">{AUTH_LABELS[tool.authType] || tool.authType}</span>
                                    {tool.connector && <span className="text-[10px] text-blue-700 font-medium bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">via {tool.connector}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table view */
                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-700">Tool</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-700">Category</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-700">Auth</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-gray-700">Uses</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-gray-700">Latency</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-gray-700">Success</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(tool => {
                                const meta = CATEGORY_META[tool.category] || CATEGORY_META.custom;
                                return (
                                    <tr key={tool.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium">{tool.name}</div>
                                            <code className="text-[10px] text-blue-600 font-mono">{tool.id}</code>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 text-xs font-medium">{meta.icon} {meta.label}</td>
                                        <td className="px-4 py-3 text-gray-700 text-xs font-medium">{AUTH_LABELS[tool.authType]}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-mono text-xs font-semibold">{tool.usageCount}</td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-mono text-xs font-semibold">{formatLatency(tool.avgLatencyMs)}</td>
                                        <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${tool.successRate >= 0.95 ? 'text-emerald-600' : tool.successRate >= 0.90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {(tool.successRate * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block w-2 h-2 rounded-full ${tool.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
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
