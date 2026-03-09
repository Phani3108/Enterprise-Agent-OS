'use client';

import { useState } from 'react';

interface KnowledgeResult {
    title: string;
    type: 'confluence' | 'jira' | 'github' | 'blogin' | 'transcript' | 'microsite';
    excerpt: string;
    relevance: number;
    url: string;
    updatedAt: string;
}

const TYPE_COLORS: Record<string, string> = {
    confluence: 'bg-blue-500/10 text-blue-400',
    jira: 'bg-cyan-500/10 text-cyan-400',
    github: 'bg-purple-500/10 text-purple-400',
    blogin: 'bg-amber-500/10 text-amber-400',
    transcript: 'bg-emerald-500/10 text-emerald-400',
    microsite: 'bg-pink-500/10 text-pink-400',
};

const DEMO_RESULTS: KnowledgeResult[] = [
    { title: 'Card Authorization Service — Architecture', type: 'confluence', excerpt: 'The card auth service processes payment authorizations through a 3-stage pipeline: risk scoring, balance check, and network routing...', relevance: 0.94, url: '#', updatedAt: '2 days ago' },
    { title: 'payments-api repository', type: 'github', excerpt: 'Core payment processing microservice handling card authorizations, settlements, and reversals. 47 contributors.', relevance: 0.89, url: '#', updatedAt: '4 hours ago' },
    { title: 'INC-1183: Authorization latency spike', type: 'jira', excerpt: 'Root cause: connection pool exhaustion in the risk engine during peak traffic. Resolved with circuit breaker pattern.', relevance: 0.82, url: '#', updatedAt: '3 weeks ago' },
    { title: 'How Digital Card Authorization Works', type: 'blogin', excerpt: 'A deep dive into the real-time authorization flow from card tap to merchant notification...', relevance: 0.78, url: '#', updatedAt: '1 month ago' },
    { title: 'Engineering Office Hours — Auth Discussion', type: 'transcript', excerpt: 'Ramki: "We should consider moving the risk engine to a dedicated service to reduce blast radius..."', relevance: 0.71, url: '#', updatedAt: '5 days ago' },
];

export function KnowledgeExplorer() {
    const [query, setQuery] = useState('card authorization architecture');

    return (
        <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">📚 Knowledge Explorer</h3>

            {/* Search */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search internal knowledge..."
                className="w-full px-4 py-2.5 rounded-lg bg-surface border border-white/[0.06] text-sm text-white placeholder:text-neutral-600 focus:border-accent focus:outline-none mb-4"
            />

            {/* Source Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {['All', 'Confluence', 'GitHub', 'Jira', 'Blogin', 'Transcripts'].map((filter) => (
                    <button
                        key={filter}
                        className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${filter === 'All'
                                ? 'bg-accent/20 text-accent border border-accent/30'
                                : 'bg-white/[0.04] text-neutral-400 border border-white/[0.06] hover:text-white'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="space-y-3">
                {DEMO_RESULTS.map((result, idx) => (
                    <a
                        key={idx}
                        href={result.url}
                        className="block p-3 rounded-lg bg-surface hover:bg-surface-overlay transition-colors border border-transparent hover:border-white/[0.06]"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${TYPE_COLORS[result.type]}`}>
                                {result.type}
                            </span>
                            <span className="text-xs font-medium text-white">{result.title}</span>
                            <span className="ml-auto text-[10px] text-neutral-600">{result.updatedAt}</span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{result.excerpt}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-white/[0.04] rounded-full">
                                <div className="h-full bg-accent/50 rounded-full" style={{ width: `${result.relevance * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-neutral-500">{(result.relevance * 100).toFixed(0)}%</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
