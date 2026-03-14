'use client';

import { useState, useEffect } from 'react';
import StatsBar from './StatsBar';
import { QuickActions } from './QuickActions';
import { ExecutionCard } from './ExecutionCard';
import { useEAOSStore } from '../store/eaos-store';

const PERSONA_SECTIONS = [
    {
        label: 'Build',
        items: [
            { id: 'agents', icon: '🤖', name: 'Agents', desc: '12 autonomous workers', stat: '234 executions', color: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20' },
            { id: 'workflows', icon: '⚡', name: 'Workflows', desc: 'DAG-based pipelines', stat: '8 active', color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20' },
            { id: 'skills', icon: '🧩', name: 'Skills', desc: 'Reusable AI capabilities', stat: '8 skills', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' },
        ],
    },
    {
        label: 'Knowledge',
        items: [
            { id: 'knowledge', icon: '📚', name: 'Knowledge Base', desc: 'Search all internal docs', stat: '12k indexed', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20' },
            { id: 'prompts', icon: '💬', name: 'Prompt Library', desc: 'Curated prompts & skills', stat: '13 prompts', color: 'from-pink-500/10 to-rose-500/10 border-pink-500/20' },
            { id: 'learning', icon: '🎓', name: 'AI Courses', desc: 'Learning hub & roadmaps', stat: '24 courses', color: 'from-violet-500/10 to-purple-500/10 border-violet-500/20' },
        ],
    },
    {
        label: 'Operate',
        items: [
            { id: 'tools', icon: '🔌', name: 'Tools Registry', desc: 'Internal tool connectors', stat: '19 tools', color: 'from-sky-500/10 to-blue-500/10 border-sky-500/20' },
            { id: 'marketing', icon: '📣', name: 'Marketing Agents', desc: 'Self-optimizing campaigns', stat: '12 agents', color: 'from-red-500/10 to-orange-500/10 border-red-500/20' },
            { id: 'observability', icon: '🔍', name: 'Observability', desc: 'Traces, costs, latency', stat: 'Real-time', color: 'from-cyan-500/10 to-teal-500/10 border-cyan-500/20' },
        ],
    },
];

export default function Workspace() {
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const setActiveSection = useEAOSStore(s => s.setActiveSection);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/activity');
                if (res.ok) {
                    const data = await res.json();
                    setRecentSessions(data.sessions ?? []);
                }
            } catch { /* gateway offline — show demo data */ }
        };
        fetchActivity();
        const interval = setInterval(fetchActivity, 5000);
        return () => clearInterval(interval);
    }, []);

    const demoExecutions = [
        {
            id: 'exec-demo-1',
            goal: 'Explain card authorization service architecture',
            domain: 'Engineering',
            status: 'complete' as const,
            confidence: 0.92,
            grounded: true,
            groundingScore: 0.87,
            durationMs: 8200,
            steps: [
                { name: 'Confluence search', status: 'complete' as const, worker: 'developer-knowledge', skill: 'engineering.knowledge.search', durationMs: 1200 },
                { name: 'GitHub code search', status: 'complete' as const, worker: 'developer-knowledge', skill: 'engineering.knowledge.search', durationMs: 1800 },
                { name: 'Jira incident check', status: 'complete' as const, worker: 'developer-knowledge', skill: 'engineering.knowledge.search', durationMs: 900 },
                { name: 'LLM synthesis', status: 'complete' as const, worker: 'developer-knowledge', skill: 'engineering.knowledge.search', durationMs: 3200 },
                { name: 'Grounding validation', status: 'complete' as const, worker: 'reliability-engine', skill: 'system.validate', durationMs: 500 },
            ],
            sources: [
                { title: 'Card Auth Architecture', url: '#', type: 'confluence' },
                { title: 'payments-api/src/authorization', url: '#', type: 'github' },
                { title: 'INC-3201 Postmortem', url: '#', type: 'jira' },
            ],
        },
        {
            id: 'exec-demo-2',
            goal: 'Analyze incident INC-3421 on payments service',
            domain: 'Incident',
            status: 'complete' as const,
            confidence: 0.78,
            grounded: true,
            groundingScore: 0.72,
            durationMs: 12100,
            steps: [
                { name: 'Jira issue retrieval', status: 'complete' as const, worker: 'incident-intelligence', skill: 'engineering.incident.root_cause', durationMs: 1100 },
                { name: 'Grafana metrics pull', status: 'complete' as const, worker: 'incident-intelligence', skill: 'engineering.incident.root_cause', durationMs: 2400 },
                { name: 'GitHub deployment check', status: 'complete' as const, worker: 'incident-intelligence', skill: 'engineering.incident.root_cause', durationMs: 1800 },
                { name: 'Root cause analysis', status: 'complete' as const, worker: 'incident-intelligence', skill: 'engineering.incident.root_cause', durationMs: 4500 },
                { name: 'Remediation generation', status: 'complete' as const, worker: 'incident-intelligence', skill: 'engineering.incident.root_cause', durationMs: 2300 },
            ],
            sources: [
                { title: 'INC-3421 Jira', url: '#', type: 'jira' },
                { title: 'Payments Dashboard', url: '#', type: 'grafana' },
                { title: 'PR #1847', url: '#', type: 'github' },
            ],
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <StatsBar />

            {/* Persona-based navigation grid */}
            <div className="space-y-4">
                {PERSONA_SECTIONS.map(section => (
                    <div key={section.label}>
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{section.label}</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {section.items.map(item => (
                                <button key={item.id} onClick={() => setActiveSection(item.id)}
                                    className={`p-4 rounded-xl bg-gradient-to-br ${item.color} border text-left hover:scale-[1.02] transition-transform group`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="text-[14px] font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400">{item.stat}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Quick Actions</h2>
                <QuickActions />
            </div>

            <div data-tour="recent-executions">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recent Executions</h2>
                    {recentSessions.length > 0 && (
                        <span className="text-xs text-slate-400">{recentSessions.length} live sessions</span>
                    )}
                </div>
                <div className="space-y-4">
                    {recentSessions.map((session: any) => (
                        <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-4 border border-blue-600/20">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${session.status === 'complete' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
                                    <span className="text-sm font-medium">{session.goal}</span>
                                </div>
                                <span className="text-xs text-slate-400">{session.domain}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-slate-500">
                                <span>Confidence: {Math.round((session.confidence ?? 0) * 100)}%</span>
                                <span>Status: {session.status}</span>
                            </div>
                        </div>
                    ))}
                    {demoExecutions.map((exec) => (
                        <ExecutionCard key={exec.id} execution={exec} />
                    ))}
                </div>
            </div>
        </div>
    );
}
