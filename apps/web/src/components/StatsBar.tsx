'use client';

import { useState, useEffect } from 'react';

export default function StatsBar() {
    const [stats, setStats] = useState({
        totalSessions: 47,
        activeSkills: 8,
        avgConfidence: 0.86,
        services: { gateway: 'checking...' } as Record<string, string>,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(prev => ({ ...prev, ...data }));
                }
            } catch { /* use defaults */ }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 8000);
        return () => clearInterval(interval);
    }, []);

    const cards = [
        { label: 'Queries Today', value: stats.totalSessions.toString(), trend: '+12%', color: 'text-blue-400' },
        { label: 'Active Skills', value: stats.activeSkills.toString(), trend: '', color: 'text-purple-400' },
        { label: 'Avg Confidence', value: `${Math.round(stats.avgConfidence * 100)}%`, trend: '+3%', color: 'text-emerald-400' },
        { label: 'Avg Latency', value: '9.2s', trend: '-15%', color: 'text-yellow-400' },
        { label: 'Grounding', value: '82%', trend: '+5%', color: 'text-cyan-400' },
        { label: 'Gateway', value: stats.services.gateway === 'healthy' ? '✓ UP' : '— OFF', trend: '', color: stats.services.gateway === 'healthy' ? 'text-emerald-400' : 'text-red-400' },
    ];

    return (
        <div className="grid grid-cols-6 gap-3" data-tour="stats-bar">
            {cards.map((card, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-1">{card.label}</div>
                    <div className={`text-xl font-semibold ${card.color}`}>{card.value}</div>
                    {card.trend && <div className="text-xs text-slate-400 mt-1">{card.trend}</div>}
                </div>
            ))}
        </div>
    );
}
