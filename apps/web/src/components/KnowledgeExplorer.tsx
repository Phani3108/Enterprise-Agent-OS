/**
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

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
    confluence: 'bg-blue-50 text-blue-700 border border-blue-100',
    jira: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    github: 'bg-purple-50 text-purple-700 border border-purple-100',
    blogin: 'bg-amber-50 text-amber-700 border border-amber-100',
    transcript: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    microsite: 'bg-pink-50 text-pink-700 border border-pink-100',
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
        <div className="bg-slate-50 min-h-full bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Knowledge Explorer</h3>

            {/* Search */}
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search internal knowledge..."
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none mb-4 shadow-sm"
            />

            {/* Source Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {['All', 'Confluence', 'GitHub', 'Jira', 'Blogin', 'Transcripts'].map((filter) => (
                    <button
                        key={filter}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${filter === 'All'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900'
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
                        className="block p-3 rounded-lg bg-white hover:bg-slate-50 transition-colors border border-slate-200 hover:border-slate-300 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono uppercase ${TYPE_COLORS[result.type]}`}>
                                {result.type}
                            </span>
                            <span className="text-xs font-medium text-slate-900">{result.title}</span>
                            <span className="ml-auto text-[11px] text-slate-600">{result.updatedAt}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">{result.excerpt}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-slate-200 rounded-full">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${result.relevance * 100}%` }} />
                            </div>
                            <span className="text-[11px] text-slate-600">{(result.relevance * 100).toFixed(0)}%</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
