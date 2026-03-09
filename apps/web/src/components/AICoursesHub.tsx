'use client';

import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseProvider {
    name: string;
    url: string;
    color: string;
    bgGradient: string;
    letter: string;
    tagline: string;
}

interface RoadmapDay {
    day: number;
    title: string;
    pages: number;
    hook: string;
    description: string;
    url: string;
}

interface Course {
    id: number;
    title: string;
    url: string;
    category: string;
    likes: number;
    dislikes: number;
    pins: number;
    views: number;
    isPinned: boolean;
}

// ---------------------------------------------------------------------------
// Data — AI Course Providers
// ---------------------------------------------------------------------------

const PROVIDERS: CourseProvider[] = [
    { name: 'Anthropic', url: 'https://anthropic.skilljar.com', color: '#d4a574', bgGradient: 'from-[#d4a574]/15 to-[#c4956a]/10', letter: 'A', tagline: 'Claude & Constitutional AI' },
    { name: 'Google', url: 'https://grow.google/ai', color: '#4285f4', bgGradient: 'from-[#4285f4]/15 to-[#34a853]/10', letter: 'G', tagline: 'Gemini & Cloud AI' },
    { name: 'Meta', url: 'https://ai.meta.com/resources', color: '#0668E1', bgGradient: 'from-[#0668E1]/15 to-[#0059D6]/10', letter: 'M', tagline: 'Llama & Open Source' },
    { name: 'NVIDIA', url: 'https://developer.nvidia.com/training', color: '#76B900', bgGradient: 'from-[#76B900]/15 to-[#5a9600]/10', letter: 'N', tagline: 'GPU Computing & CUDA' },
    { name: 'Microsoft', url: 'https://learn.microsoft.com/training', color: '#00a4ef', bgGradient: 'from-[#00a4ef]/15 to-[#7fba00]/10', letter: 'MS', tagline: 'Azure AI & Copilot' },
    { name: 'OpenAI', url: 'https://academy.openai.com', color: '#10a37f', bgGradient: 'from-[#10a37f]/15 to-[#0d8c6c]/10', letter: 'O', tagline: 'GPT & Assistants API' },
    { name: 'IBM', url: 'https://skillsbuild.org', color: '#0530AD', bgGradient: 'from-[#0530AD]/15 to-[#BE95FF]/10', letter: 'IBM', tagline: 'Watson & Enterprise AI' },
    { name: 'AWS', url: 'https://skillbuilder.aws', color: '#FF9900', bgGradient: 'from-[#FF9900]/15 to-[#232F3E]/10', letter: 'AWS', tagline: 'Bedrock & SageMaker' },
    { name: 'DeepLearning.AI', url: 'https://deeplearning.ai', color: '#FF6F61', bgGradient: 'from-[#FF6F61]/15 to-[#e25749]/10', letter: 'DL', tagline: 'Andrew Ng Courses' },
    { name: 'Hugging Face', url: 'https://huggingface.co/learn', color: '#FFD21E', bgGradient: 'from-[#FFD21E]/15 to-[#ff9d00]/10', letter: 'HF', tagline: 'Transformers & Diffusers' },
];

// ---------------------------------------------------------------------------
// Data — 5-Day Agent Roadmap
// ---------------------------------------------------------------------------

const ROADMAP: RoadmapDay[] = [
    { day: 1, title: 'Introduction to AI Agents', pages: 50, hook: 'Most agent demos fail in production.', description: 'The 5 levels of AI agents, from basic reasoning to self-evolving systems, plus security and architecture patterns that scale.', url: 'https://lnkd.in/gN9JaXgR' },
    { day: 2, title: 'Agent Tools and MCP', pages: 50, hook: 'MCP servers can add new tools without your approval.', description: 'Tool design, the Model Context Protocol, and hidden security risks. Your poetry bot suddenly gains purchasing power overnight.', url: 'https://lnkd.in/gRWDSjBr' },
    { day: 3, title: 'Context Engineering and Memory', pages: 70, hook: 'Agents with zero long-term memory treat every session like meeting you for the first time.', description: 'Build memory systems that actively curate context, not just save conversations.', url: 'https://lnkd.in/gbgWJ4kH' },
    { day: 4, title: 'Agent Quality', pages: 50, hook: "Traditional QA doesn't work for agents. You can't unit test judgment.", description: 'The 4 pillars of agent quality (effectiveness, efficiency, robustness, safety) and how to evaluate reasoning.', url: 'https://lnkd.in/g6DHcZDx' },
    { day: 5, title: 'Prototype to Production', pages: 40, hook: 'Building an agent takes 2 weeks. Trusting it in production takes 6 months.', description: 'Evaluation gates, circuit breakers, and evolution loops that close the gap.', url: 'https://lnkd.in/gYTakhAK' },
];

// ---------------------------------------------------------------------------
// Data — 24 Must-Learn Courses
// ---------------------------------------------------------------------------

const COURSES: Course[] = [
    { id: 1, title: 'Multi AI Agent Systems with crewAI', url: 'https://lnkd.in/dTudrD55', category: 'Multi-Agent', likes: 234, dislikes: 5, pins: 42, views: 1820, isPinned: false },
    { id: 2, title: 'Practical Multi AI Agents and Advanced Use Cases with CrewAI', url: 'https://lnkd.in/dQmTTWmK', category: 'Multi-Agent', likes: 198, dislikes: 3, pins: 38, views: 1540, isPinned: false },
    { id: 3, title: 'Serverless Agentic Workflows with Amazon Bedrock', url: 'https://lnkd.in/dENcD795', category: 'Cloud', likes: 156, dislikes: 8, pins: 29, views: 1230, isPinned: false },
    { id: 4, title: 'AI Agents in LangGraph', url: 'https://lnkd.in/dJbGHaV2', category: 'Frameworks', likes: 312, dislikes: 4, pins: 67, views: 2890, isPinned: true },
    { id: 5, title: 'AI Agentic Design Patterns with AutoGen', url: 'https://lnkd.in/dzDAA-J4', category: 'Design Patterns', likes: 189, dislikes: 6, pins: 35, views: 1670, isPinned: false },
    { id: 6, title: 'Event-Driven Agentic Document Workflows with LlamaIndex', url: 'https://lnkd.in/d7vJEH4H', category: 'Workflows', likes: 145, dislikes: 2, pins: 28, views: 1120, isPinned: false },
    { id: 7, title: 'Long-Term Agentic Memory with LangGraph', url: 'https://lnkd.in/dKJ-B3ks', category: 'Memory', likes: 267, dislikes: 3, pins: 52, views: 2340, isPinned: true },
    { id: 8, title: "Build Apps with Windsurf's AI Coding Agents", url: 'https://lnkd.in/dTqjjt4Q', category: 'Coding', likes: 134, dislikes: 7, pins: 24, views: 980, isPinned: false },
    { id: 9, title: 'Building AI Applications with Haystack', url: 'https://lnkd.in/d7WnTvTr', category: 'Frameworks', likes: 112, dislikes: 4, pins: 19, views: 870, isPinned: false },
    { id: 10, title: 'Improving Accuracy of LLM Applications', url: 'https://lnkd.in/dcJvY6kg', category: 'Quality', likes: 178, dislikes: 2, pins: 33, views: 1450, isPinned: false },
    { id: 11, title: 'Evaluating AI Agents', url: 'https://lnkd.in/dvTNKSaq', category: 'Quality', likes: 203, dislikes: 1, pins: 45, views: 1780, isPinned: false },
    { id: 12, title: 'Event-Driven Agentic Document Workflows', url: 'https://lnkd.in/d7vJEH4H', category: 'Workflows', likes: 98, dislikes: 3, pins: 17, views: 760, isPinned: false },
    { id: 13, title: 'Building AI Browser Agents', url: 'https://lnkd.in/ddKzmvmW', category: 'Coding', likes: 167, dislikes: 5, pins: 31, views: 1340, isPinned: false },
    { id: 14, title: 'Building Code Agents with Hugging Face', url: 'https://lnkd.in/dhx73Kbn', category: 'Coding', likes: 145, dislikes: 3, pins: 26, views: 1180, isPinned: false },
    { id: 15, title: 'Building AI Voice Agents for Production', url: 'https://lnkd.in/dHiRTWFf', category: 'Production', likes: 189, dislikes: 4, pins: 37, views: 1560, isPinned: false },
    { id: 16, title: 'DsPy: Build and Optimize Agentic Apps', url: 'https://lnkd.in/d4-3bidJ', category: 'Frameworks', likes: 134, dislikes: 6, pins: 22, views: 1090, isPinned: false },
    { id: 17, title: 'MCP: Build Rich-Context AI Apps with Anthropic', url: 'https://lnkd.in/digapx-H', category: 'MCP', likes: 278, dislikes: 2, pins: 56, views: 2560, isPinned: true },
    { id: 18, title: 'Function-Calling and Data Extraction with LLMs', url: 'https://lnkd.in/dCRaFMPu', category: 'Fundamentals', likes: 156, dislikes: 3, pins: 29, views: 1340, isPinned: false },
    { id: 19, title: 'LangChain for LLM Application Development', url: 'https://lnkd.in/dCEw5_9M', category: 'Frameworks', likes: 289, dislikes: 8, pins: 61, views: 3120, isPinned: false },
    { id: 20, title: 'Building Your Own Database Agent', url: 'https://lnkd.in/d3pk3ftQ', category: 'Coding', likes: 123, dislikes: 4, pins: 21, views: 960, isPinned: false },
    { id: 21, title: 'Building and Evaluating Advanced RAG Applications', url: 'https://lnkd.in/dyMg8eV9', category: 'RAG', likes: 245, dislikes: 3, pins: 48, views: 2180, isPinned: true },
    { id: 22, title: 'Building Agentic RAG with LlamaIndex', url: 'https://lnkd.in/dFyCD_B7', category: 'RAG', likes: 198, dislikes: 2, pins: 39, views: 1760, isPinned: false },
    { id: 23, title: 'Claude Code (Anthropic)', url: 'https://lnkd.in/dKbmE8vZ', category: 'Coding', likes: 312, dislikes: 1, pins: 72, views: 3450, isPinned: true },
    { id: 24, title: 'Functions, Tools and Agents with LangChain', url: 'https://lnkd.in/d6gpJ2Bs', category: 'Fundamentals', likes: 167, dislikes: 5, pins: 30, views: 1390, isPinned: false },
];

const CATEGORY_COLORS: Record<string, string> = {
    'Multi-Agent': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    'Cloud': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    'Frameworks': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'Design Patterns': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    'Workflows': 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    'Memory': 'bg-pink-500/15 text-pink-400 border-pink-500/25',
    'Coding': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'Quality': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'Production': 'bg-red-500/15 text-red-400 border-red-500/25',
    'MCP': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    'Fundamentals': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    'RAG': 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AICoursesHub() {
    const [activeTab, setActiveTab] = useState<'providers' | 'roadmap' | 'courses'>('providers');
    const [courses, setCourses] = useState(COURSES);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'likes' | 'views' | 'pins'>('likes');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const categories = useMemo(() => Array.from(new Set(courses.map(c => c.category))), [courses]);

    const filteredCourses = useMemo(() => {
        let result = [...courses];
        if (selectedCategory) result = result.filter(c => c.category === selectedCategory);
        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b[sortBy] - a[sortBy];
        });
        return result;
    }, [courses, selectedCategory, sortBy]);

    const totalViews = courses.reduce((s, c) => s + c.views, 0);
    const totalLikes = courses.reduce((s, c) => s + c.likes, 0);
    const totalPins = courses.reduce((s, c) => s + c.pins, 0);
    const avgEngagement = courses.length > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0';

    const handleLike = (id: number) => setCourses(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
    const handleDislike = (id: number) => setCourses(prev => prev.map(c => c.id === id ? { ...c, dislikes: c.dislikes + 1 } : c));
    const handlePin = (id: number) => setCourses(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned, pins: c.isPinned ? c.pins - 1 : c.pins + 1 } : c));

    const handleCopyLink = (url: string, id: number) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShare = (title: string, url: string) => {
        if (navigator.share) {
            navigator.share({ title, url });
        } else {
            navigator.clipboard.writeText(`${title}\n${url}`);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-tour="ai-courses-hub">
            {/* Header + Stats */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">AI Learning Hub</h2>
                        <p className="text-sm text-neutral-400 mt-1">Curated courses, roadmaps, and resources for AI agent development.</p>
                    </div>
                    <div className="flex gap-2">
                        {(['providers', 'roadmap', 'courses'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === tab ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                                {tab === 'providers' ? 'Platforms' : tab === 'roadmap' ? '5-Day Roadmap' : 'Courses (24)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Global stats bar */}
                <div className="grid grid-cols-5 gap-3">
                    {[
                        { label: 'Total Courses', value: courses.length, color: 'text-white' },
                        { label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-accent' },
                        { label: 'Total Likes', value: totalLikes.toLocaleString(), color: 'text-emerald-400' },
                        { label: 'Total Pins', value: totalPins.toLocaleString(), color: 'text-amber-400' },
                        { label: 'Engagement Rate', value: `${avgEngagement}%`, color: 'text-purple-400' },
                    ].map(stat => (
                        <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{stat.label}</div>
                            <div className={`text-lg font-semibold mt-0.5 ${stat.color}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ================================================================ */}
            {/* TAB: Providers                                                    */}
            {/* ================================================================ */}
            {activeTab === 'providers' && (
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Top AI learning platforms — free and paid courses from the companies building AI.</p>
                    <div className="grid grid-cols-5 gap-4">
                        {PROVIDERS.map(p => (
                            <a key={p.name} href={p.url} target="_blank" rel="noreferrer"
                                className={`group relative rounded-xl border border-white/[0.06] bg-gradient-to-br ${p.bgGradient} p-5 hover:border-white/[0.15] hover:scale-[1.03] transition-all duration-200 cursor-pointer`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                                        style={{ backgroundColor: `${p.color}25`, color: p.color }}>
                                        {p.letter}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white">{p.name}</div>
                                        {p.name === 'NVIDIA' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#76B900]/20 text-[#76B900] font-semibold">GOATED</span>}
                                    </div>
                                </div>
                                <p className="text-[11px] text-neutral-400">{p.tagline}</p>
                                <div className="mt-3 text-[10px] text-neutral-500 group-hover:text-accent transition-colors truncate">
                                    {p.url.replace('https://', '')} &#x2197;
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: 5-Day Roadmap                                               */}
            {/* ================================================================ */}
            {activeTab === 'roadmap' && (
                <div className="space-y-4">
                    <div className="text-center mb-6">
                        <h3 className="text-base font-semibold text-white mb-1">5-Day AI Agent Mastery Roadmap</h3>
                        <p className="text-sm text-neutral-400">260 pages of concentrated knowledge — from zero to production agents.</p>
                    </div>

                    {/* Road visualization */}
                    <div className="relative">
                        {/* The road */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-accent/40 via-accent/60 to-emerald-400/40 transform -translate-x-1/2 rounded-full" />

                        {/* Journey start — car */}
                        <div className="text-center pb-6 relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm">
                                <span className="text-lg">&#x1F697;</span> Start Your Journey
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="space-y-0">
                            {ROADMAP.map((day, idx) => {
                                const isLeft = idx % 2 === 0;
                                return (
                                    <div key={day.day} className="relative flex items-center" style={{ minHeight: '180px' }}>
                                        {/* Milestone dot */}
                                        <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                                            <div className="w-10 h-10 rounded-full bg-surface-raised border-2 border-accent flex items-center justify-center text-sm font-bold text-accent shadow-lg shadow-accent/20">
                                                {day.day}
                                            </div>
                                        </div>

                                        {/* Content card */}
                                        <div className={`w-[calc(50%-40px)] ${isLeft ? 'mr-auto pr-6' : 'ml-auto pl-6'}`}>
                                            <a href={day.url} target="_blank" rel="noreferrer"
                                                className="block rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 hover:border-accent/30 hover:bg-accent/[0.03] transition-all duration-200 group">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">DAY {day.day}</span>
                                                    <span className="text-[10px] text-neutral-500">{day.pages} pages</span>
                                                </div>
                                                <h4 className="text-sm font-semibold text-white mb-2 group-hover:text-accent transition-colors">
                                                    {day.title}
                                                </h4>
                                                <p className="text-xs text-amber-400/80 italic mb-2">"{day.hook}"</p>
                                                <p className="text-[11px] text-neutral-400 leading-relaxed">{day.description}</p>
                                                <div className="mt-3 text-[10px] text-accent/60 group-hover:text-accent transition-colors">
                                                    Open resource &#x2197;
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Journey end — flag */}
                        <div className="text-center pt-6 relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm">
                                <span className="text-lg">&#x1F3C1;</span> Production-Ready Agent Engineer
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: 24 Courses                                                  */}
            {/* ================================================================ */}
            {activeTab === 'courses' && (
                <div className="space-y-4">
                    {/* Filters & Sort */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-neutral-500">Category:</span>
                            <button onClick={() => setSelectedCategory(null)}
                                className={`px-3 py-1 rounded-full text-xs transition-colors ${!selectedCategory ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                                All ({courses.length})
                            </button>
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors border ${selectedCategory === cat ? 'border-accent/40 text-accent bg-accent/10' : `${CATEGORY_COLORS[cat] || 'bg-white/[0.04] text-neutral-400'}`}`}>
                                    {cat} ({courses.filter(c => c.category === cat).length})
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">Sort:</span>
                            {(['likes', 'views', 'pins'] as const).map(s => (
                                <button key={s} onClick={() => setSortBy(s)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors ${sortBy === s ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                                    {s === 'likes' ? 'Most Liked' : s === 'views' ? 'Most Viewed' : 'Most Pinned'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Course grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {filteredCourses.map((course, idx) => (
                            <div key={course.id}
                                className={`rounded-xl border transition-all duration-200 hover:border-white/[0.15] ${course.isPinned ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Badges row */}
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-xs font-mono text-neutral-500 w-5">#{course.id}</span>
                                                {course.isPinned && <span className="text-amber-400 text-xs">&#x1F4CC;</span>}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[course.category] || 'bg-white/[0.04] text-neutral-400'}`}>
                                                    {course.category}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <a href={course.url} target="_blank" rel="noreferrer"
                                                className="text-sm font-medium text-white hover:text-accent transition-colors block mb-2">
                                                {course.title}
                                            </a>

                                            {/* Stats row */}
                                            <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                                                <span>{course.views.toLocaleString()} views</span>
                                                <span>{course.likes} likes</span>
                                                <span>{course.pins} pins</span>
                                            </div>
                                        </div>

                                        {/* Engagement bar */}
                                        <div className="flex items-center gap-1">
                                            {/* Like */}
                                            <button onClick={() => handleLike(course.id)}
                                                className="flex flex-col items-center p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors group"
                                                title="Like">
                                                <span className="text-neutral-500 group-hover:text-emerald-400 text-sm">&#x25B2;</span>
                                                <span className="text-[10px] text-neutral-500 group-hover:text-emerald-400 font-mono">{course.likes}</span>
                                            </button>

                                            {/* Dislike */}
                                            <button onClick={() => handleDislike(course.id)}
                                                className="flex flex-col items-center p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group"
                                                title="Dislike">
                                                <span className="text-neutral-500 group-hover:text-red-400 text-sm">&#x25BC;</span>
                                                <span className="text-[10px] text-neutral-500 group-hover:text-red-400 font-mono">{course.dislikes}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action bar */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                                        <div className="flex items-center gap-1.5">
                                            {/* Pin */}
                                            <button onClick={() => handlePin(course.id)}
                                                className={`px-2 py-1 rounded-lg text-xs transition-colors ${course.isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-white/[0.04] text-neutral-500 hover:text-amber-400'}`}
                                                title="Pin">
                                                &#x1F4CC; {course.pins}
                                            </button>

                                            {/* Share */}
                                            <button onClick={() => handleShare(course.title, course.url)}
                                                className="px-2 py-1 rounded-lg bg-white/[0.04] text-neutral-500 text-xs hover:text-white transition-colors"
                                                title="Share">
                                                &#x1F4E4; Share
                                            </button>

                                            {/* Copy link */}
                                            <button onClick={() => handleCopyLink(course.url, course.id)}
                                                className="px-2 py-1 rounded-lg bg-white/[0.04] text-neutral-500 text-xs hover:text-white transition-colors"
                                                title="Copy link">
                                                {copiedId === course.id ? '&#x2705; Copied!' : '&#x1F517; Copy Link'}
                                            </button>
                                        </div>

                                        <a href={course.url} target="_blank" rel="noreferrer"
                                            className="px-3 py-1 rounded-lg bg-accent/20 text-accent text-xs hover:bg-accent/30 transition-colors">
                                            Start Learning &#x2197;
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredCourses.length === 0 && (
                        <div className="text-center py-12 text-neutral-500">
                            <p className="text-sm">No courses in this category.</p>
                            <button onClick={() => setSelectedCategory(null)} className="mt-2 text-xs text-accent">Show all</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
