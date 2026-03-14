'use client';

import { useState, useEffect } from 'react';

export default function ActivityTimeline() {
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/activity');
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data.sessions ?? []);
                }
            } catch { /* gateway offline */ }
        };
        fetchActivity();
        const interval = setInterval(fetchActivity, 3000);
        return () => clearInterval(interval);
    }, []);

    const demoEvents = [
        { type: 'reasoning', message: 'Analyzing query intent → knowledge_query', time: '2s ago', status: 'complete' },
        { type: 'tool', message: 'Searching Confluence for "card authorization"', time: '4s ago', status: 'complete' },
        { type: 'tool', message: 'Searching GitHub for architecture docs', time: '3s ago', status: 'complete' },
        { type: 'tool', message: 'Checking Jira for related incidents', time: '3s ago', status: 'complete' },
        { type: 'phase', message: 'Synthesizing from 12 source documents', time: '6s ago', status: 'complete' },
        { type: 'output', message: 'KnowledgeAnswer generated — confidence 87%', time: '1s ago', status: 'complete' },
    ];

    const typeIcons: Record<string, string> = {
        reasoning: '🧠',
        tool: '🔧',
        phase: '📊',
        output: '✅',
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">Activity Stream</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400">Live</span>
                </div>
            </div>

            {/* Live sessions from Gateway */}
            {sessions.length > 0 && (
                <div className="mb-4 space-y-2">
                    <div className="text-xs text-blue-600 font-medium mb-2">Live Sessions</div>
                    {sessions.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <span className={`w-2 h-2 mt-1.5 rounded-full ${session.status === 'complete' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-700 truncate">{session.goal}</div>
                                <div className="text-xs text-slate-400 flex gap-2 mt-0.5">
                                    <span>{session.domain}</span>
                                    <span>{Math.round((session.confidence ?? 0) * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Demo event timeline */}
            <div className="text-xs text-slate-400 mb-2" data-tour="execution-pipeline">Execution Pipeline</div>
            <div className="space-y-1">
                {demoEvents.map((event, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5 relative">
                        {i < demoEvents.length - 1 && (
                            <div className="absolute left-[11px] top-6 w-px h-full bg-slate-100" />
                        )}
                        <span className="text-sm z-10">{typeIcons[event.type] ?? '📌'}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-600">{event.message}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{event.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
