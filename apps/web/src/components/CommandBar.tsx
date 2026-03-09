'use client';

import { useState, useRef, useEffect } from 'react';
import { queryEOS, type QueryResult } from '../lib/api';

export default function CommandBar() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestions = [
        { text: 'Explain the card authorization service', domain: 'Engineering', icon: '🔍' },
        { text: 'Analyze incident INC-3421', domain: 'Incident', icon: '🚨' },
        { text: 'Summarize meeting transcript and create actions', domain: 'Leadership', icon: '📋' },
        { text: 'How does the risk scoring engine work?', domain: 'Engineering', icon: '🔍' },
        { text: 'Generate Q2 campaign strategy', domain: 'Marketing', icon: '📊' },
        { text: 'Teach me how to build a RAG pipeline', domain: 'Learning', icon: '🎓' },
    ];

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape') { setIsOpen(false); setError(null); }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleSubmit = async () => {
        if (!query.trim() || loading) return;
        setLoading(true);
        setError(null);
        setLastResult(null);

        try {
            const result = await queryEOS(query.trim());
            setLastResult(result);
            setQuery('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Query failed');
        } finally {
            setLoading(false);
        }
    };

    const domainColors: Record<string, string> = {
        Engineering: 'bg-blue-500/20 text-blue-400',
        Incident: 'bg-red-500/20 text-red-400',
        Leadership: 'bg-purple-500/20 text-purple-400',
        Marketing: 'bg-orange-500/20 text-orange-400',
        Learning: 'bg-emerald-500/20 text-emerald-400',
    };

    return (
        <div className="relative px-6 py-3">
            {/* Command input */}
            <div className="glass-surface flex items-center gap-3 px-4 py-3 rounded-xl cursor-text"
                onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}>
                <span className="text-accent-primary text-lg">⚡</span>
                <input
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500"
                    placeholder="Ask EOS anything... (⌘K)"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                />
                {loading && <div className="animate-spin w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full" />}
                {!loading && query && (
                    <button onClick={handleSubmit}
                        className="px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-lg text-sm hover:bg-accent-primary/30">
                        Run ↵
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {isOpen && !loading && !lastResult && (
                <div className="absolute left-6 right-6 top-full mt-1 glass-surface rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 text-xs text-neutral-500 border-b border-white/5 px-4">Suggestions</div>
                    {suggestions.filter(s => !query || s.text.toLowerCase().includes(query.toLowerCase())).map((s, i) => (
                        <button key={i}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                            onClick={() => { setQuery(s.text); inputRef.current?.focus(); }}>
                            <span>{s.icon}</span>
                            <span className="flex-1 text-sm text-neutral-200">{s.text}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${domainColors[s.domain] ?? 'bg-white/10'}`}>{s.domain}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute left-6 right-6 top-full mt-1 glass-surface rounded-xl border border-red-500/30 p-4 z-50">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <span>⚠️</span>
                        <span>{error}</span>
                        <span className="text-xs text-neutral-500 ml-2">Is the Gateway running on localhost:3000?</span>
                    </div>
                </div>
            )}

            {/* Result card */}
            {lastResult && (
                <div className="absolute left-6 right-6 top-full mt-1 glass-surface rounded-xl border border-accent-primary/20 shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-emerald-400">✓</span>
                            <span className="text-sm font-medium">{lastResult.intent.skill}</span>
                            <span className="text-xs text-neutral-500">{lastResult.durationMs}ms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                                Confidence: {Math.round(lastResult.confidence * 100)}%
                            </span>
                            <button onClick={() => { setLastResult(null); setIsOpen(false); }} className="text-neutral-500 hover:text-white">✕</button>
                        </div>
                    </div>
                    <div className="p-4">
                        <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {JSON.stringify(lastResult.result, null, 2)}
                        </pre>
                    </div>
                    {lastResult.sources.length > 0 && (
                        <div className="p-4 border-t border-white/5">
                            <div className="text-xs text-neutral-500 mb-2">Sources</div>
                            <div className="flex flex-wrap gap-2">
                                {lastResult.sources.map((s, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded-lg bg-white/5 text-neutral-300">
                                        📄 {s.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
