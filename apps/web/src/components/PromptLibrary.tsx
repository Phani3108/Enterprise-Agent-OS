'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PromptEntry, PromptCategory, PromptTag, RecommendationEntry } from '../lib/api';

// ---------------------------------------------------------------------------
// Static data (mirrors gateway seed — used when gateway is offline)
// ---------------------------------------------------------------------------

const FALLBACK_CATEGORIES: PromptCategory[] = [
    { id: 'cat-1', name: 'Engineering', slug: 'engineering', icon: '⚙️', order: 1 },
    { id: 'cat-2', name: 'Quality Assurance', slug: 'quality-assurance', icon: '✅', order: 2 },
    { id: 'cat-3', name: 'SRE & DevOps', slug: 'sre-devops', icon: '🔧', order: 3 },
    { id: 'cat-5', name: 'Solution Architecture', slug: 'solution-architecture', icon: '🧩', order: 5 },
    { id: 'cat-7', name: 'Program & Release', slug: 'program-release', icon: '🚀', order: 7 },
    { id: 'cat-11', name: 'Monitoring & Observability', slug: 'monitoring-observability', icon: '📡', order: 11 },
    { id: 'cat-16', name: 'Security & Compliance', slug: 'security-compliance', icon: '🛡️', order: 16 },
    { id: 'cat-17', name: 'Agent Design', slug: 'agent-design', icon: '🤖', order: 17 },
];

const FALLBACK_TAGS: PromptTag[] = [
    { id: 'tag-1', name: 'Requirements', slug: 'requirements', color: '#6366f1' },
    { id: 'tag-3', name: 'Development', slug: 'development', color: '#3b82f6' },
    { id: 'tag-4', name: 'Code Review', slug: 'code-review', color: '#0ea5e9' },
    { id: 'tag-5', name: 'Testing', slug: 'testing', color: '#14b8a6' },
    { id: 'tag-6', name: 'CI/CD', slug: 'cicd', color: '#22c55e' },
    { id: 'tag-9', name: 'Incident Response', slug: 'incident-response', color: '#ef4444' },
    { id: 'tag-11', name: 'Architecture', slug: 'architecture', color: '#ec4899' },
    { id: 'tag-13', name: 'Agent Orchestration', slug: 'agent-orchestration', color: '#06b6d4' },
    { id: 'tag-14', name: 'Prompt Engineering', slug: 'prompt-engineering', color: '#8b5cf6' },
];

const now = new Date().toISOString();

const FALLBACK_PROMPTS: PromptEntry[] = [
    { id: 'prompt-1', slug: 'conventional-commit-message-generator', title: 'Conventional Commit Message Generator', description: 'Generate commit messages following conventional commit convention with ticket prefix', content: '', type: 'text', categorySlug: 'engineering', tags: ['development', 'code-review'], source: 'platform', targetTools: ['cursor', 'github-copilot', 'claude', 'universal'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'system', authorName: 'AgentOS', upvotes: 87, downvotes: 2, forkCount: 14, usageCount: 342, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-2', slug: 'architectural-decision-record-generator', title: 'Architectural Decision Record (ADR) Generator', description: 'Generate structured ADR with context, options, trade-offs, and rationale', content: '', type: 'text', categorySlug: 'solution-architecture', tags: ['design', 'documentation', 'requirements'], source: 'platform', targetTools: ['universal'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'system', authorName: 'AgentOS', upvotes: 64, downvotes: 1, forkCount: 9, usageCount: 198, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-3', slug: 'unit-test-generator', title: 'Comprehensive Unit Test Generator', description: 'Production-quality unit tests — F.I.R.S.T principles, AAA pattern, boundary analysis', content: '', type: 'text', categorySlug: 'quality-assurance', tags: ['testing', 'development'], source: 'platform', targetTools: ['cursor', 'github-copilot', 'claude'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'system', authorName: 'AgentOS', upvotes: 112, downvotes: 3, forkCount: 22, usageCount: 456, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-4', slug: 'release-notes-generator', title: 'Structured Release Notes Generator', description: 'Release notes with features, fixes, deployment steps, and rollback plan', content: '', type: 'text', categorySlug: 'program-release', tags: ['deployment', 'documentation'], source: 'platform', targetTools: ['universal'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'system', authorName: 'AgentOS', upvotes: 53, downvotes: 0, forkCount: 7, usageCount: 167, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-5', slug: 'plan-driven-development', title: 'Plan-Driven Development Workflow', description: 'Break work into bite-sized tasks with verification steps — from obra/superpowers', content: '', type: 'text', categorySlug: 'engineering', tags: ['development', 'architecture'], source: 'community', sourceUrl: 'https://github.com/obra/superpowers', targetTools: ['cursor', 'claude'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'obra/superpowers', upvotes: 78, downvotes: 1, forkCount: 15, usageCount: 234, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-6', slug: 'tdd-enforcer', title: 'Test-Driven Development (TDD) Enforcer', description: 'Enforce RED-GREEN-REFACTOR cycle in all changes — from obra/superpowers', content: '', type: 'text', categorySlug: 'quality-assurance', tags: ['testing', 'development'], source: 'community', sourceUrl: 'https://github.com/obra/superpowers', targetTools: ['cursor', 'claude'], version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'obra/superpowers', upvotes: 65, downvotes: 2, forkCount: 11, usageCount: 189, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-7', slug: 'systematic-debugging', title: 'Systematic Debugging Protocol', description: '4-phase root cause analysis: reproduce, hypothesize, test, verify', content: '', type: 'text', categorySlug: 'engineering', tags: ['debugging', 'development'], source: 'community', sourceUrl: 'https://github.com/obra/superpowers', targetTools: ['cursor', 'claude'], version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'obra/superpowers', upvotes: 54, downvotes: 0, forkCount: 8, usageCount: 145, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-8', slug: 'agent-workflow-designer', title: 'Agent Workflow Designer', description: 'Design multi-agent orchestration: sequential, parallel, router, evaluator', content: '', type: 'text', categorySlug: 'agent-design', tags: ['agent-orchestration', 'architecture'], source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills', targetTools: ['universal'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills', upvotes: 91, downvotes: 1, forkCount: 18, usageCount: 267, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-9', slug: 'incident-commander', title: 'Incident Commander Playbook', description: 'Structured incident response with severity classification and post-mortems', content: '', type: 'text', categorySlug: 'sre-devops', tags: ['incident-response', 'monitoring'], source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills', targetTools: ['universal'], version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills', upvotes: 72, downvotes: 0, forkCount: 12, usageCount: 198, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-10', slug: 'pr-review-expert', title: 'PR Review Expert', description: 'Comprehensive PR review: architecture, security, performance, maintainability', content: '', type: 'text', categorySlug: 'engineering', tags: ['code-review', 'security', 'architecture'], source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills', targetTools: ['cursor', 'github-copilot', 'claude'], version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills', upvotes: 98, downvotes: 2, forkCount: 20, usageCount: 389, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-11', slug: 'security-code-review', title: 'Security-First Code Review (OWASP)', description: 'OWASP Top 10 + agentic AI security risk analysis', content: '', type: 'text', categorySlug: 'security-compliance', tags: ['security', 'code-review'], source: 'community', sourceUrl: 'https://github.com/BehiSecc/awesome-claude-skills', targetTools: ['cursor', 'claude'], version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'BehiSecc/awesome-claude-skills', upvotes: 45, downvotes: 0, forkCount: 6, usageCount: 112, flagCount: 0, createdAt: now, updatedAt: now },
    { id: 'prompt-12', slug: 'rag-pipeline-architect', title: 'RAG Pipeline Architect', description: 'Design RAG pipelines: chunking, embedding, retrieval, evaluation', content: '', type: 'text', categorySlug: 'agent-design', tags: ['architecture', 'prompt-engineering'], source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills', targetTools: ['universal'], version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false, status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills', upvotes: 47, downvotes: 0, forkCount: 7, usageCount: 134, flagCount: 0, createdAt: now, updatedAt: now },
];

// ---------------------------------------------------------------------------
// Source badge colors
// ---------------------------------------------------------------------------

const SOURCE_STYLES: Record<string, string> = {
    platform: 'bg-accent/20 text-accent',
    community: 'bg-purple-500/20 text-purple-400',
    user: 'bg-emerald-500/20 text-emerald-400',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PromptLibrary() {
    const [prompts, setPrompts] = useState<PromptEntry[]>(FALLBACK_PROMPTS);
    const [categories] = useState<PromptCategory[]>(FALLBACK_CATEGORIES);
    const [tags] = useState<PromptTag[]>(FALLBACK_TAGS);
    const [recommendations, setRecommendations] = useState<RecommendationEntry[]>([]);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'library' | 'recommendations'>('library');
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [recForm, setRecForm] = useState({ title: '', description: '', content: '', categorySlug: '' });

    const loadPrompts = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.set('category', selectedCategory);
            if (selectedTag) params.set('tag', selectedTag);
            if (selectedSource) params.set('source', selectedSource);
            if (search) params.set('q', search);
            const qs = params.toString();
            const res = await fetch(`http://localhost:3000/api/prompts${qs ? `?${qs}` : ''}`);
            if (res.ok) {
                const data = await res.json();
                setPrompts(data.prompts);
            }
        } catch { /* use fallback */ }
    }, [selectedCategory, selectedTag, selectedSource, search]);

    useEffect(() => { loadPrompts(); }, [loadPrompts]);

    const loadRecommendations = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3000/api/recommendations');
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data.recommendations);
            }
        } catch { /* offline */ }
    }, []);

    useEffect(() => { if (activeTab === 'recommendations') loadRecommendations(); }, [activeTab, loadRecommendations]);

    const filtered = prompts.filter(p => {
        if (selectedCategory && p.categorySlug !== selectedCategory) return false;
        if (selectedTag && !p.tags.includes(selectedTag)) return false;
        if (selectedSource && p.source !== selectedSource) return false;
        if (search) {
            const q = search.toLowerCase();
            if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tags.some(t => t.includes(q))) return false;
        }
        return true;
    });

    const handleVote = async (promptId: string, type: 'upvote' | 'downvote' | 'flag') => {
        try {
            await fetch(`http://localhost:3000/api/prompts/${promptId}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
            setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, upvotes: type === 'upvote' ? p.upvotes + 1 : p.upvotes, downvotes: type === 'downvote' ? p.downvotes + 1 : p.downvotes, flagCount: type === 'flag' ? p.flagCount + 1 : p.flagCount } : p));
        } catch { /* offline */ }
    };

    const handleFork = async (promptId: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/prompts/${promptId}/fork`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName: 'me' }) });
            if (res.ok) {
                const data = await res.json();
                setPrompts(prev => [data.prompt, ...prev.map(p => p.id === promptId ? { ...p, forkCount: p.forkCount + 1 } : p)]);
            }
        } catch { /* offline */ }
    };

    const handlePin = async (promptId: string) => {
        try {
            await fetch(`http://localhost:3000/api/prompts/${promptId}/pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, isPinned: !p.isPinned } : p));
        } catch { /* offline */ }
    };

    const handleUse = async (promptId: string) => {
        try {
            await fetch(`http://localhost:3000/api/prompts/${promptId}/use`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, usageCount: p.usageCount + 1 } : p));
        } catch { /* offline */ }
    };

    const handleSubmitRec = async () => {
        if (!recForm.title || !recForm.content) return;
        try {
            const res = await fetch('http://localhost:3000/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...recForm, userName: 'me' }) });
            if (res.ok) {
                const data = await res.json();
                setRecommendations(prev => [data.recommendation, ...prev]);
                setRecForm({ title: '', description: '', content: '', categorySlug: '' });
                setShowSubmitForm(false);
            }
        } catch { /* offline */ }
    };

    const handleUpvoteRec = async (recId: string) => {
        try {
            await fetch(`http://localhost:3000/api/recommendations/${recId}/upvote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, upvotes: r.upvotes + 1 } : r));
        } catch { /* offline */ }
    };

    const getCategoryName = (slug: string) => categories.find(c => c.slug === slug)?.name || slug;
    const getCategoryIcon = (slug: string) => categories.find(c => c.slug === slug)?.icon || '📄';

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-tour="prompt-library">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Prompt Library</h2>
                    <p className="text-sm text-neutral-400 mt-1">
                        Curated prompts for AI-assisted development — platform, community, and your own.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('library')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'library' ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                        Library
                    </button>
                    <button onClick={() => setActiveTab('recommendations')} className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'recommendations' ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                        Suggestions
                    </button>
                </div>
            </div>

            {activeTab === 'library' ? (
                <>
                    {/* Search & Filters */}
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="text" placeholder="Search prompts by title, description, or tag..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent/40 transition-colors"
                            />
                            <span className="absolute left-3.5 top-3.5 text-neutral-500 text-sm">&#x1F50D;</span>
                        </div>

                        {/* Source filter pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-neutral-500 mr-1">Source:</span>
                            {['all', 'platform', 'community', 'user'].map(s => (
                                <button key={s} onClick={() => setSelectedSource(s === 'all' ? null : s)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors ${(s === 'all' && !selectedSource) || selectedSource === s ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}
                                >
                                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}

                            <span className="text-neutral-600 mx-2">|</span>
                            <span className="text-xs text-neutral-500 mr-1">Category:</span>
                            <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1 rounded-full text-xs transition-colors ${!selectedCategory ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                                All
                            </button>
                            {categories.map(cat => (
                                <button key={cat.slug} onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedCategory === cat.slug ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>

                        {/* Tag filter pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-neutral-500 mr-1">Tags:</span>
                            {tags.map(tag => (
                                <button key={tag.slug} onClick={() => setSelectedTag(selectedTag === tag.slug ? null : tag.slug)}
                                    className={`px-2.5 py-0.5 rounded-full text-xs transition-colors border ${selectedTag === tag.slug ? 'border-accent/40 text-accent' : 'border-white/[0.06] text-neutral-400 hover:text-white'}`}
                                    style={selectedTag === tag.slug ? {} : { borderColor: `${tag.color}30` }}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-6 text-xs text-neutral-500">
                        <span>{filtered.length} prompt{filtered.length !== 1 ? 's' : ''}</span>
                        <span>{filtered.filter(p => p.source === 'platform').length} platform</span>
                        <span>{filtered.filter(p => p.source === 'community').length} community</span>
                        <span>{filtered.filter(p => p.isFeatured).length} featured</span>
                    </div>

                    {/* Prompt cards */}
                    <div className="space-y-3">
                        {filtered.map(prompt => (
                            <div key={prompt.id} className={`rounded-xl border transition-all duration-200 ${prompt.isPinned ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'} hover:border-white/[0.12]`}>
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                {prompt.isPinned && <span className="text-amber-400 text-xs" title="Pinned">&#x1F4CC;</span>}
                                                {prompt.isFeatured && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Featured</span>}
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_STYLES[prompt.source]}`}>{prompt.source}</span>
                                                <span className="text-xs text-neutral-500">{getCategoryIcon(prompt.categorySlug)} {getCategoryName(prompt.categorySlug)}</span>
                                            </div>
                                            <h4 className="text-sm font-medium text-white cursor-pointer hover:text-accent transition-colors" onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}>
                                                {prompt.title}
                                            </h4>
                                            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{prompt.description}</p>

                                            {/* Tags */}
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                {prompt.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-neutral-500 border border-white/[0.06]">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {prompt.targetTools.filter(t => t !== 'universal').map(tool => (
                                                    <span key={tool} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Engagement sidebar */}
                                        <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                            <button onClick={() => handleVote(prompt.id, 'upvote')} className="text-neutral-500 hover:text-emerald-400 transition-colors text-lg">&#x25B2;</button>
                                            <span className="text-sm font-mono text-white">{prompt.upvotes - prompt.downvotes}</span>
                                            <button onClick={() => handleVote(prompt.id, 'downvote')} className="text-neutral-500 hover:text-red-400 transition-colors text-lg">&#x25BC;</button>
                                        </div>
                                    </div>

                                    {/* Author & stats row */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                                            <span>by {prompt.authorName}</span>
                                            <span>{prompt.usageCount} uses</span>
                                            <span>{prompt.forkCount} forks</span>
                                            {prompt.sourceUrl && <a href={prompt.sourceUrl} target="_blank" rel="noreferrer" className="text-accent/60 hover:text-accent">source &#x2197;</a>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleUse(prompt.id)} className="px-3 py-1 rounded-lg bg-accent/20 text-accent text-xs hover:bg-accent/30 transition-colors" title="Copy to your workspace">
                                                Use
                                            </button>
                                            <button onClick={() => handleFork(prompt.id)} className="px-3 py-1 rounded-lg bg-white/[0.06] text-neutral-400 text-xs hover:text-white hover:bg-white/[0.1] transition-colors" title="Fork to your collection">
                                                Fork
                                            </button>
                                            <button onClick={() => handlePin(prompt.id)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${prompt.isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.06] text-neutral-500 hover:text-amber-400'}`} title="Pin to top">
                                                &#x1F4CC;
                                            </button>
                                            <button onClick={() => handleVote(prompt.id, 'flag')} className="px-2 py-1 rounded-lg bg-white/[0.06] text-neutral-500 text-xs hover:text-red-400 transition-colors" title="Flag for review">
                                                &#x1F6A9;
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded content */}
                                    {expandedId === prompt.id && prompt.content && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                            <pre className="text-xs text-neutral-300 whitespace-pre-wrap bg-black/20 rounded-lg p-4 max-h-[400px] overflow-y-auto font-mono leading-relaxed">
                                                {prompt.content}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-neutral-500">
                                <span className="text-3xl block mb-3">&#x1F50D;</span>
                                <p className="text-sm">No prompts match your filters.</p>
                                <button onClick={() => { setSearch(''); setSelectedCategory(null); setSelectedTag(null); setSelectedSource(null); }} className="mt-2 text-xs text-accent hover:text-accent/80">
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* ========== Recommendations Tab ========== */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-neutral-400">Community suggestions for new prompts. Upvote the best ones.</p>
                        <button onClick={() => setShowSubmitForm(!showSubmitForm)} className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors">
                            + Suggest a Prompt
                        </button>
                    </div>

                    {/* Submit form */}
                    {showSubmitForm && (
                        <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-5 space-y-3">
                            <h3 className="text-sm font-medium text-white">Submit a Prompt Suggestion</h3>
                            <input type="text" placeholder="Prompt title..." value={recForm.title} onChange={e => setRecForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent/40" />
                            <input type="text" placeholder="Brief description..." value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent/40" />
                            <textarea placeholder="Full prompt content..." value={recForm.content} onChange={e => setRecForm(f => ({ ...f, content: e.target.value }))} rows={6}
                                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent/40 font-mono" />
                            <select value={recForm.categorySlug} onChange={e => setRecForm(f => ({ ...f, categorySlug: e.target.value }))}
                                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-neutral-400 focus:outline-none focus:border-accent/40">
                                <option value="">Select category (optional)</option>
                                {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <button onClick={handleSubmitRec} className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/80 transition-colors">Submit</button>
                                <button onClick={() => setShowSubmitForm(false)} className="px-4 py-2 rounded-lg bg-white/[0.06] text-neutral-400 text-sm hover:text-white transition-colors">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Recommendation cards */}
                    {recommendations.map(rec => (
                        <div key={rec.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-colors">
                            <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center gap-1 min-w-[50px]">
                                    <button onClick={() => handleUpvoteRec(rec.id)} className="text-neutral-500 hover:text-emerald-400 transition-colors text-lg">&#x25B2;</button>
                                    <span className="text-sm font-mono text-white">{rec.upvotes}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${rec.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : rec.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : rec.status === 'promoted' ? 'bg-accent/20 text-accent' : 'bg-red-500/20 text-red-400'}`}>
                                            {rec.status}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-medium text-white">{rec.title}</h4>
                                    {rec.description && <p className="text-xs text-neutral-400 mt-1">{rec.description}</p>}
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500">
                                        <span>by {rec.submittedByName}</span>
                                        <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {recommendations.length === 0 && !showSubmitForm && (
                        <div className="text-center py-12 text-neutral-500">
                            <span className="text-3xl block mb-3">&#x1F4AC;</span>
                            <p className="text-sm">No suggestions yet. Be the first to recommend a prompt.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
