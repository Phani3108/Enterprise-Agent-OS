'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketingAgent {
    id: string;
    name: string;
    icon: string;
    role: string;
    tools: string[];
    status: 'idle' | 'running' | 'waiting' | 'done';
    color: string;
}

interface MarketingSkill {
    id: string;
    name: string;
    description: string;
    agents: string[];
    tools: string[];
    checkpoints: string[];
}

interface ToolConnector {
    id: string;
    name: string;
    category: string;
    icon: string;
    connected: boolean;
    authType: 'oauth' | 'api_key' | 'mcp';
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const AGENTS: MarketingAgent[] = [
    { id: 'orchestrator', name: 'Marketing Orchestrator', icon: '🧠', role: 'Intent detection, skill mapping, agent deployment, checkpoint handling', tools: ['Claude', 'Internal Knowledge'], status: 'idle', color: 'from-accent/15 to-indigo-500/10 border-accent/25' },
    { id: 'strategy', name: 'Strategy Agent', icon: '🎯', role: 'Campaign strategy, positioning, messaging themes, audience targeting', tools: ['Claude', 'Perplexity', 'Internal Knowledge'], status: 'idle', color: 'from-purple-500/15 to-violet-500/10 border-purple-500/25' },
    { id: 'research', name: 'Research Agent', icon: '🔍', role: 'Market research, trend detection, audience insights, competitive landscape', tools: ['Perplexity', 'Semrush', 'Google', 'Crunchbase'], status: 'idle', color: 'from-blue-500/15 to-cyan-500/10 border-blue-500/25' },
    { id: 'competitor', name: 'Competitor Agent', icon: '📊', role: 'Competitor analysis, product positioning, campaign benchmarking', tools: ['Perplexity', 'Semrush', 'Ahrefs'], status: 'idle', color: 'from-sky-500/15 to-blue-500/10 border-sky-500/25' },
    { id: 'copy', name: 'Copy Agent', icon: '✍️', role: 'Ads, emails, landing pages, blogs, social posts', tools: ['Claude', 'GPT', 'Brand Voice DB'], status: 'idle', color: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/25' },
    { id: 'design', name: 'Design Agent', icon: '🎨', role: 'Ad creatives, banners, social graphics, visual assets', tools: ['Nano Banana', 'DALL-E', 'Midjourney', 'Canva', 'Figma'], status: 'idle', color: 'from-pink-500/15 to-rose-500/10 border-pink-500/25' },
    { id: 'landing', name: 'Landing Page Agent', icon: '🌐', role: 'Landing pages, conversion optimization, A/B layouts', tools: ['Lovable', 'Framer', 'Webflow', 'Next.js'], status: 'idle', color: 'from-orange-500/15 to-amber-500/10 border-orange-500/25' },
    { id: 'campaign', name: 'Campaign Agent', icon: '📢', role: 'Ad campaign setup, budget allocation, scheduling, launch', tools: ['LinkedIn Ads', 'Google Ads', 'Meta Ads', 'HubSpot'], status: 'idle', color: 'from-red-500/15 to-orange-500/10 border-red-500/25' },
    { id: 'analytics', name: 'Analytics Agent', icon: '📈', role: 'Performance tracking, attribution, optimization recommendations', tools: ['GA4', 'HubSpot', 'Salesforce', 'Amplitude'], status: 'idle', color: 'from-amber-500/15 to-yellow-500/10 border-amber-500/25' },
    { id: 'seo', name: 'SEO Agent', icon: '🔗', role: 'Keyword research, on-page optimization, technical SEO audits', tools: ['Ahrefs', 'Semrush', 'Google Search Console'], status: 'idle', color: 'from-lime-500/15 to-green-500/10 border-lime-500/25' },
    { id: 'email', name: 'Email Agent', icon: '📧', role: 'Email sequences, drip campaigns, newsletter content', tools: ['HubSpot', 'Salesforce', 'Mailchimp'], status: 'idle', color: 'from-violet-500/15 to-purple-500/10 border-violet-500/25' },
    { id: 'optimization', name: 'Optimization Agent', icon: '🔄', role: 'Performance analysis, A/B test design, budget reallocation, creative rotation, audience refinement', tools: ['GA4', 'HubSpot', 'Claude', 'Campaign Memory'], status: 'idle', color: 'from-amber-500/15 to-orange-500/10 border-amber-500/25' },
];

const SKILLS: MarketingSkill[] = [
    { id: 'campaign_builder', name: 'Campaign Builder', description: 'End-to-end campaign creation from research to launch', agents: ['research', 'strategy', 'copy', 'design', 'campaign'], tools: ['Perplexity', 'Claude', 'Nano Banana', 'Canva', 'LinkedIn Ads'], checkpoints: ['Approve messaging', 'Approve creatives', 'Approve campaign launch', 'Approve budget'] },
    { id: 'content_creation', name: 'Content Creation', description: 'Blog posts, articles, social content, and thought leadership', agents: ['research', 'copy', 'design'], tools: ['Claude', 'Perplexity', 'Canva'], checkpoints: ['Approve outline', 'Approve draft', 'Approve final'] },
    { id: 'creative_design', name: 'Creative Design', description: 'Visual assets — ads, banners, social graphics, presentations', agents: ['copy', 'design'], tools: ['Nano Banana', 'DALL-E', 'Canva', 'Figma'], checkpoints: ['Approve concept', 'Approve final design'] },
    { id: 'landing_page_builder', name: 'Landing Page Builder', description: 'Conversion-optimized landing pages with copy and visuals', agents: ['copy', 'design', 'landing'], tools: ['Claude', 'Lovable', 'Framer'], checkpoints: ['Approve copy', 'Approve design', 'Approve publish'] },
    { id: 'seo_optimizer', name: 'SEO Optimizer', description: 'Keyword research, content optimization, technical SEO', agents: ['seo', 'research', 'copy'], tools: ['Ahrefs', 'Semrush', 'Claude'], checkpoints: ['Approve keyword strategy'] },
    { id: 'competitor_research', name: 'Competitor Research', description: 'Competitive analysis, positioning, campaign benchmarking', agents: ['competitor', 'research', 'analytics'], tools: ['Perplexity', 'Semrush', 'Crunchbase'], checkpoints: ['Approve analysis'] },
    { id: 'analytics_reporting', name: 'Analytics Reporting', description: 'Campaign performance, attribution, ROI analysis', agents: ['analytics'], tools: ['GA4', 'HubSpot', 'Salesforce'], checkpoints: [] },
    { id: 'email_automation', name: 'Email Automation', description: 'Email sequences, drip campaigns, newsletter workflows', agents: ['copy', 'email', 'analytics'], tools: ['HubSpot', 'Claude'], checkpoints: ['Approve sequence', 'Approve send'] },
    { id: 'social_media', name: 'Social Media Manager', description: 'Content calendar, posts, engagement, scheduling', agents: ['copy', 'design', 'analytics'], tools: ['Claude', 'Canva', 'Buffer'], checkpoints: ['Approve posts', 'Approve schedule'] },
    { id: 'event_marketing', name: 'Event Marketing', description: 'Webinar promotion, event pages, attendee follow-up', agents: ['strategy', 'copy', 'design', 'campaign', 'email'], tools: ['Claude', 'Canva', 'HubSpot', 'LinkedIn Ads'], checkpoints: ['Approve event page', 'Approve promo campaign'] },
];

const TOOL_CONNECTORS: ToolConnector[] = [
    { id: 'canva', name: 'Canva', category: 'Design', icon: '🎨', connected: true, authType: 'oauth' },
    { id: 'figma', name: 'Figma', category: 'Design', icon: '🖌️', connected: false, authType: 'oauth' },
    { id: 'nano-banana', name: 'Nano Banana', category: 'Design', icon: '🍌', connected: true, authType: 'api_key' },
    { id: 'dalle', name: 'DALL-E', category: 'Design', icon: '🖼️', connected: true, authType: 'api_key' },
    { id: 'midjourney', name: 'Midjourney', category: 'Design', icon: '🎭', connected: false, authType: 'api_key' },
    { id: 'lovable', name: 'Lovable', category: 'Landing Pages', icon: '💜', connected: false, authType: 'oauth' },
    { id: 'hubspot', name: 'HubSpot', category: 'Marketing', icon: '🟠', connected: true, authType: 'oauth' },
    { id: 'salesforce', name: 'Salesforce', category: 'Marketing', icon: '☁️', connected: false, authType: 'oauth' },
    { id: 'linkedin-ads', name: 'LinkedIn Ads', category: 'Ads', icon: '💼', connected: true, authType: 'oauth' },
    { id: 'google-ads', name: 'Google Ads', category: 'Ads', icon: '🔍', connected: false, authType: 'oauth' },
    { id: 'meta-ads', name: 'Meta Ads', category: 'Ads', icon: '📘', connected: false, authType: 'oauth' },
    { id: 'ahrefs', name: 'Ahrefs', category: 'SEO', icon: '🔗', connected: true, authType: 'api_key' },
    { id: 'semrush', name: 'Semrush', category: 'SEO', icon: '📊', connected: false, authType: 'api_key' },
    { id: 'perplexity', name: 'Perplexity', category: 'Research', icon: '🧭', connected: true, authType: 'api_key' },
    { id: 'gdrive', name: 'Google Drive', category: 'Storage', icon: '📁', connected: true, authType: 'oauth' },
    { id: 's3', name: 'AWS S3', category: 'Storage', icon: '🪣', connected: false, authType: 'api_key' },
];

// ---------------------------------------------------------------------------
// Simulated execution timeline
// ---------------------------------------------------------------------------

interface ExecutionStep {
    step: number;
    label: string;
    tool: string;
    status: 'done' | 'running' | 'waiting' | 'checkpoint';
}

const DEMO_EXECUTION: ExecutionStep[] = [
    { step: 1, label: 'Research ICP & Market', tool: 'Perplexity', status: 'done' },
    { step: 2, label: 'Define Campaign Strategy', tool: 'Claude', status: 'done' },
    { step: 3, label: 'Generate Messaging & Copy', tool: 'Claude', status: 'done' },
    { step: 4, label: 'Generate Ad Creatives', tool: 'Nano Banana', status: 'running' },
    { step: 5, label: 'Layout Ads in Canva', tool: 'Canva', status: 'waiting' },
    { step: 6, label: 'Approve Creatives', tool: 'Human', status: 'checkpoint' },
    { step: 7, label: 'Setup LinkedIn Campaign', tool: 'LinkedIn Ads API', status: 'waiting' },
    { step: 8, label: 'Approve Campaign Launch', tool: 'Human', status: 'checkpoint' },
];

const STATUS_STYLES: Record<string, string> = {
    done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waiting: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
    checkpoint: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MarketingHub() {
    const [activeTab, setActiveTab] = useState<'agents' | 'skills' | 'tools' | 'execute' | 'optimize'>('agents');
    const [connectors, setConnectors] = useState(TOOL_CONNECTORS);
    const [queryText, setQueryText] = useState('');
    const [optimizationMode, setOptimizationMode] = useState<'manual' | 'assisted' | 'autonomous'>('manual');

    const toggleConnect = (id: string) => {
        setConnectors(prev => prev.map(t => t.id === id ? { ...t, connected: !t.connected } : t));
    };

    const connectedCount = connectors.filter(t => t.connected).length;
    const toolCategories = Array.from(new Set(connectors.map(t => t.category)));

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-tour="marketing-hub">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Marketing Agent Graph</h2>
                        <p className="text-sm text-neutral-400 mt-1">
                            Self-optimizing AI agents that replace human marketing tasks — orchestrating tools, learning from outcomes.
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        {(['agents', 'skills', 'tools', 'execute', 'optimize'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-3 py-2 rounded-lg text-xs transition-colors ${activeTab === tab ? 'bg-accent/20 text-accent' : 'bg-white/[0.04] text-neutral-400 hover:text-white'}`}>
                                {tab === 'agents' ? 'Agent Network' : tab === 'skills' ? 'Skills' : tab === 'tools' ? 'Marketplace' : tab === 'execute' ? 'Execute' : 'Optimize'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Architecture flow */}
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 py-2 overflow-x-auto">
                    {['Intent', 'Skill', 'Agents', 'Tools', 'Execute', 'Checkpoints', 'Analytics', 'Optimize', 'Loop'].map((step, i) => (
                        <span key={step} className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded border ${i >= 6 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/[0.04] border-white/[0.06]'}`}>{step}</span>
                            {i < 8 && <span className="text-accent">&#x2192;</span>}
                        </span>
                    ))}
                </div>
            </div>

            {/* ================================================================ */}
            {/* TAB: Agent Network                                               */}
            {/* ================================================================ */}
            {activeTab === 'agents' && (
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Specialized marketing agents that collaborate through shared state — not sequential pipelines.</p>

                    {/* Agent graph visualization */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                        <div className="text-center mb-4">
                            <span className="text-xs text-neutral-500 uppercase tracking-wider">Agent Collaboration Graph</span>
                        </div>
                        <pre className="text-xs text-accent/80 font-mono text-center leading-relaxed whitespace-pre">
{`                  Marketing Orchestrator
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
Research Agent      Strategy Agent        Analytics Agent
      │                    │                    │
      ├────────────┐       │       ┌────────────┤
      │            │       │       │            │
 SEO Agent   Competitor    │   Copy Agent   Campaign Agent
              Agent        │       │
                           │  Design Agent
                           │       │
                      Email Agent  Landing Page Agent`}
                        </pre>
                    </div>

                    {/* Agent cards */}
                    <div className="grid grid-cols-3 gap-3">
                        {AGENTS.map(agent => (
                            <div key={agent.id} className={`rounded-xl bg-gradient-to-br ${agent.color} border p-4 hover:scale-[1.02] transition-transform`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{agent.icon}</span>
                                    <h4 className="text-sm font-medium text-white">{agent.name}</h4>
                                </div>
                                <p className="text-[11px] text-neutral-400 mb-3 line-clamp-2">{agent.role}</p>
                                <div className="flex flex-wrap gap-1">
                                    {agent.tools.map(tool => (
                                        <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-500">{tool}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: Skill Registry                                              */}
            {/* ================================================================ */}
            {activeTab === 'skills' && (
                <div className="space-y-4">
                    <p className="text-sm text-neutral-400">Marketing skills define what tasks agents can perform — each skill maps to agents, tools, and human checkpoints.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {SKILLS.map(skill => (
                            <div key={skill.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.12] transition-colors">
                                <h4 className="text-sm font-medium text-white mb-1">{skill.name}</h4>
                                <p className="text-[11px] text-neutral-400 mb-3">{skill.description}</p>

                                <div className="space-y-2">
                                    <div>
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Agents</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {skill.agents.map(a => {
                                                const agent = AGENTS.find(ag => ag.id === a);
                                                return <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{agent?.icon} {agent?.name.replace(' Agent', '')}</span>;
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Tools</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {skill.tools.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400">{t}</span>)}
                                        </div>
                                    </div>
                                    {skill.checkpoints.length > 0 && (
                                        <div>
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Checkpoints</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {skill.checkpoints.map(c => <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">&#x23F8; {c}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: Tool Marketplace                                            */}
            {/* ================================================================ */}
            {activeTab === 'tools' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-neutral-400">Connect your marketing tools — agents orchestrate them at runtime. {connectedCount}/{connectors.length} connected.</p>
                    </div>

                    {toolCategories.map(category => (
                        <div key={category}>
                            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{category}</h3>
                            <div className="grid grid-cols-4 gap-3">
                                {connectors.filter(t => t.category === category).map(tool => (
                                    <div key={tool.id} className={`rounded-xl border p-4 transition-all duration-200 ${tool.connected ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{tool.icon}</span>
                                                <span className="text-sm font-medium text-white">{tool.name}</span>
                                            </div>
                                            <span className={`w-2 h-2 rounded-full ${tool.connected ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-neutral-500">{tool.authType === 'oauth' ? 'OAuth 2.0' : tool.authType === 'api_key' ? 'API Key' : 'MCP'}</span>
                                            <button onClick={() => toggleConnect(tool.id)}
                                                className={`px-3 py-1 rounded-lg text-xs transition-colors ${tool.connected ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-accent/20 text-accent hover:bg-accent/30'}`}>
                                                {tool.connected ? 'Disconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] p-6 text-center">
                        <span className="text-2xl block mb-2">&#x2795;</span>
                        <h4 className="text-sm font-medium text-white mb-1">Add Custom Tool</h4>
                        <p className="text-xs text-neutral-500">Connect any tool with an API URL, auth type, and capability description.</p>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: Execute                                                     */}
            {/* ================================================================ */}
            {activeTab === 'execute' && (
                <div className="space-y-4">
                    {/* Search bar */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <label className="text-xs text-neutral-500 uppercase tracking-wider block mb-2">What do you want to do?</label>
                        <div className="flex gap-3">
                            <input type="text" value={queryText} onChange={e => setQueryText(e.target.value)}
                                placeholder="e.g., Create LinkedIn ads for our AI webinar..."
                                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent/40 transition-colors" />
                            <button className="px-6 py-3 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-colors whitespace-nowrap">
                                Deploy Agents
                            </button>
                        </div>
                        <div className="flex gap-2 mt-3">
                            {['Create LinkedIn campaign', 'Write blog post', 'Build landing page', 'Analyze performance', 'Research competitors'].map(q => (
                                <button key={q} onClick={() => setQueryText(q)}
                                    className="px-3 py-1 rounded-full bg-white/[0.04] text-neutral-400 text-xs hover:text-white hover:bg-white/[0.08] transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Demo execution timeline */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-xs font-medium text-white">Agent Execution: "Create LinkedIn ads for our AI webinar"</span>
                            </div>
                            <span className="text-[10px] text-neutral-500">Skill: campaign_builder</span>
                        </div>

                        <div className="p-4 space-y-2">
                            {DEMO_EXECUTION.map(step => (
                                <div key={step.step} className="flex items-center gap-3 py-2">
                                    <span className="text-xs font-mono text-neutral-500 w-8">#{step.step}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[step.status]}`}>
                                        {step.status === 'done' ? '&#x2713; Done' : step.status === 'running' ? '&#x25CB; Running' : step.status === 'checkpoint' ? '&#x23F8; Checkpoint' : '&#x2026; Waiting'}
                                    </span>
                                    <span className="text-sm text-white flex-1">{step.label}</span>
                                    <span className="text-xs text-neutral-500">{step.tool}</span>
                                    {step.status === 'checkpoint' && (
                                        <button className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/30 transition-colors">
                                            Approve
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* State graph */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { key: 'state.market', label: 'Market Insights', status: 'populated', agent: 'Research' },
                            { key: 'state.strategy', label: 'Campaign Strategy', status: 'populated', agent: 'Strategy' },
                            { key: 'state.messaging', label: 'Messaging & Copy', status: 'populated', agent: 'Copy' },
                            { key: 'state.creatives', label: 'Creative Assets', status: 'in_progress', agent: 'Design' },
                        ].map(state => (
                            <div key={state.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                <code className="text-[10px] text-accent/60 font-mono">{state.key}</code>
                                <div className="text-sm text-white mt-1">{state.label}</div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-neutral-500">by {state.agent}</span>
                                    <span className={`w-2 h-2 rounded-full ${state.status === 'populated' ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: Self-Optimizing Loop (SOMAN)                                */}
            {/* ================================================================ */}
            {activeTab === 'optimize' && (
                <div className="space-y-5">
                    {/* SOMAN Header */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🔄</span>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Self-Optimizing Marketing Agent Network</h3>
                                <p className="text-xs text-neutral-400">Agents learn from campaign outcomes and adapt automatically — continuous improvement without manual iteration.</p>
                            </div>
                        </div>

                        {/* SOMAN loop visualization */}
                        <div className="flex items-center justify-center gap-2 py-4 text-[11px] flex-wrap">
                            {[
                                { label: 'Campaign', icon: '📢', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
                                { label: 'Performance Signals', icon: '📊', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
                                { label: 'Analytics Agent', icon: '📈', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
                                { label: 'Optimization Agent', icon: '🔄', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
                                { label: 'Strategy Adjust', icon: '🎯', color: 'bg-pink-500/15 text-pink-400 border-pink-500/25' },
                                { label: 'Creative Regen', icon: '🎨', color: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
                                { label: 'New Campaign', icon: '🚀', color: 'bg-accent/15 text-accent border-accent/25' },
                            ].map((step, i) => (
                                <span key={step.label} className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-lg border ${step.color} flex items-center gap-1.5`}>
                                        <span>{step.icon}</span> {step.label}
                                    </span>
                                    {i < 6 && <span className="text-amber-400 font-bold">&#x2192;</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Optimization Mode Selector */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                        <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Optimization Mode</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { mode: 'manual' as const, icon: '👤', title: 'Manual', desc: 'Analytics agent suggests changes. Human approves every action.' },
                                { mode: 'assisted' as const, icon: '🤝', title: 'Assisted', desc: 'Agents propose updates. Auto-approve below risk threshold.' },
                                { mode: 'autonomous' as const, icon: '🤖', title: 'Autonomous', desc: 'Agents optimize continuously with circuit breakers and guardrails.' },
                            ]).map(opt => (
                                <button key={opt.mode} onClick={() => setOptimizationMode(opt.mode)}
                                    className={`p-4 rounded-xl border text-left transition-all ${optimizationMode === opt.mode ? 'border-accent/40 bg-accent/[0.05]' : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12]'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{opt.icon}</span>
                                        <span className={`text-sm font-medium ${optimizationMode === opt.mode ? 'text-accent' : 'text-white'}`}>{opt.title}</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Performance Signals Dashboard */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                        <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Live Performance Signals</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { metric: 'CTR', value: '2.4%', trend: '-0.3%', status: 'warning', benchmark: '2.8%' },
                                { metric: 'Conversion Rate', value: '4.1%', trend: '+0.5%', status: 'good', benchmark: '3.5%' },
                                { metric: 'CPA', value: '$23.40', trend: '+$2.10', status: 'warning', benchmark: '$20.00' },
                                { metric: 'ROAS', value: '3.2x', trend: '+0.4x', status: 'good', benchmark: '2.5x' },
                                { metric: 'Engagement Rate', value: '6.8%', trend: '+1.2%', status: 'good', benchmark: '5.0%' },
                                { metric: 'Bounce Rate', value: '42%', trend: '+5%', status: 'warning', benchmark: '35%' },
                                { metric: 'Email Open Rate', value: '28%', trend: '-2%', status: 'warning', benchmark: '30%' },
                                { metric: 'Time on Page', value: '1m 42s', trend: '+12s', status: 'good', benchmark: '1m 30s' },
                            ].map(signal => (
                                <div key={signal.metric} className={`rounded-lg border p-3 ${signal.status === 'good' ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-amber-500/20 bg-amber-500/[0.03]'}`}>
                                    <div className="text-[10px] text-neutral-500 uppercase">{signal.metric}</div>
                                    <div className="text-lg font-semibold text-white mt-0.5">{signal.value}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-mono ${signal.status === 'good' ? 'text-emerald-400' : 'text-amber-400'}`}>{signal.trend}</span>
                                        <span className="text-[9px] text-neutral-500">bench: {signal.benchmark}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optimization Actions */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs text-neutral-500 uppercase tracking-wider">Optimization Suggestions</h4>
                            <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">3 actions recommended</span>
                        </div>
                        <div className="space-y-2">
                            {[
                                { action: 'Regenerate headline', reason: 'CTR below benchmark for 48h', agent: 'Copy Agent', priority: 'high', impact: 'Expected +0.5% CTR' },
                                { action: 'Refresh ad creative', reason: 'Creative fatigue detected — frequency > 3.0', agent: 'Design Agent', priority: 'high', impact: 'Expected -15% CPA' },
                                { action: 'Narrow audience targeting', reason: 'Bounce rate 42% vs 35% benchmark', agent: 'Strategy Agent', priority: 'medium', impact: 'Expected +8% conversion' },
                                { action: 'Shift 20% budget to top performer', reason: 'Ad Set B has 2x ROAS vs average', agent: 'Campaign Agent', priority: 'low', impact: 'Expected +0.3x ROAS' },
                            ].map((action, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] transition-colors">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${action.priority === 'high' ? 'bg-red-400' : action.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white">{action.action}</div>
                                        <div className="text-[11px] text-neutral-500 mt-0.5">{action.reason}</div>
                                    </div>
                                    <span className="text-[10px] text-neutral-500 whitespace-nowrap">{action.agent}</span>
                                    <span className="text-[10px] text-emerald-400 whitespace-nowrap">{action.impact}</span>
                                    {optimizationMode === 'manual' ? (
                                        <button className="px-3 py-1 rounded-lg bg-accent/20 text-accent text-xs hover:bg-accent/30 transition-colors whitespace-nowrap">
                                            Approve
                                        </button>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Auto</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Campaign Memory */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                        <h4 className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Campaign Memory — Learning History</h4>
                        <div className="space-y-2">
                            {[
                                { campaign: 'AI Webinar Promo v3', change: 'Headline regenerated', before: 'CTR 1.8%', after: 'CTR 3.1%', date: '2 days ago' },
                                { campaign: 'Product Launch Q1', change: 'Audience narrowed', before: 'CPA $31', after: 'CPA $19', date: '5 days ago' },
                                { campaign: 'Blog Amplification', change: 'Creative refreshed', before: 'Engagement 4.2%', after: 'Engagement 7.8%', date: '1 week ago' },
                            ].map((entry, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
                                    <span className="text-emerald-400 text-sm">&#x2713;</span>
                                    <div className="flex-1">
                                        <span className="text-xs text-white">{entry.campaign}</span>
                                        <span className="text-[11px] text-neutral-500 ml-2">{entry.change}</span>
                                    </div>
                                    <span className="text-[10px] text-red-400 line-through">{entry.before}</span>
                                    <span className="text-[10px] text-emerald-400">{entry.after}</span>
                                    <span className="text-[10px] text-neutral-500">{entry.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
