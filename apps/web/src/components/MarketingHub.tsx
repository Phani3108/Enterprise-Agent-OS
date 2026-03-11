/**
 * MarketingHub — Self-optimizing Marketing Agent Graph
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
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
    { id: 'orchestrator', name: 'Marketing Orchestrator', icon: '🧠', role: 'Intent detection, skill mapping, agent deployment, checkpoint handling', tools: ['Claude', 'Internal Knowledge'], status: 'idle', color: 'from-blue-50 to-indigo-50 border-blue-200' },
    { id: 'strategy',     name: 'Strategy Agent',         icon: '🎯', role: 'Campaign strategy, positioning, messaging themes, audience targeting',   tools: ['Claude', 'Perplexity', 'Internal Knowledge'], status: 'idle', color: 'from-purple-50 to-violet-50 border-purple-200' },
    { id: 'research',     name: 'Research Agent',          icon: '🔍', role: 'Market research, trend detection, audience insights, competitive landscape', tools: ['Perplexity', 'Semrush', 'Google', 'Crunchbase'], status: 'idle', color: 'from-sky-50 to-cyan-50 border-sky-200' },
    { id: 'competitor',   name: 'Competitor Agent',        icon: '📊', role: 'Competitor analysis, product positioning, campaign benchmarking',         tools: ['Perplexity', 'Semrush', 'Ahrefs'], status: 'idle', color: 'from-slate-50 to-gray-50 border-slate-200' },
    { id: 'copy',         name: 'Copy Agent',              icon: '✍️', role: 'Ads, emails, landing pages, blogs, social posts',                        tools: ['Claude', 'GPT', 'Brand Voice DB'], status: 'idle', color: 'from-emerald-50 to-teal-50 border-emerald-200' },
    { id: 'design',       name: 'Design Agent',            icon: '🎨', role: 'Ad creatives, banners, social graphics, visual assets',                  tools: ['Nano Banana', 'DALL-E', 'Midjourney', 'Canva', 'Figma'], status: 'idle', color: 'from-pink-50 to-rose-50 border-pink-200' },
    { id: 'landing',      name: 'Landing Page Agent',      icon: '🌐', role: 'Landing pages, conversion optimization, A/B layouts',                   tools: ['Lovable', 'Framer', 'Webflow', 'Next.js'], status: 'idle', color: 'from-orange-50 to-amber-50 border-orange-200' },
    { id: 'campaign',     name: 'Campaign Agent',          icon: '📢', role: 'Ad campaign setup, budget allocation, scheduling, launch',               tools: ['LinkedIn Ads', 'Google Ads', 'Meta Ads', 'HubSpot'], status: 'idle', color: 'from-red-50 to-orange-50 border-red-200' },
    { id: 'analytics',    name: 'Analytics Agent',         icon: '📈', role: 'Performance tracking, attribution, optimization recommendations',         tools: ['GA4', 'HubSpot', 'Salesforce', 'Amplitude'], status: 'idle', color: 'from-amber-50 to-yellow-50 border-amber-200' },
    { id: 'seo',          name: 'SEO Agent',               icon: '🔗', role: 'Keyword research, on-page optimization, technical SEO audits',           tools: ['Ahrefs', 'Semrush', 'Google Search Console'], status: 'idle', color: 'from-lime-50 to-green-50 border-lime-200' },
    { id: 'email',        name: 'Email Agent',             icon: '📧', role: 'Email sequences, drip campaigns, newsletter content',                   tools: ['HubSpot', 'Salesforce', 'Mailchimp'], status: 'idle', color: 'from-violet-50 to-purple-50 border-violet-200' },
    { id: 'optimization', name: 'Optimization Agent',      icon: '🔄', role: 'Performance analysis, A/B test design, budget reallocation, creative rotation, audience refinement', tools: ['GA4', 'HubSpot', 'Claude', 'Campaign Memory'], status: 'idle', color: 'from-amber-50 to-orange-50 border-amber-200' },
];

const SKILLS: MarketingSkill[] = [
    { id: 'campaign_builder',    name: 'Campaign Builder',       description: 'End-to-end campaign creation from research to launch',                       agents: ['research', 'strategy', 'copy', 'design', 'campaign'],            tools: ['Perplexity', 'Claude', 'Nano Banana', 'Canva', 'LinkedIn Ads'], checkpoints: ['Approve messaging', 'Approve creatives', 'Approve campaign launch', 'Approve budget'] },
    { id: 'content_creation',    name: 'Content Creation',       description: 'Blog posts, articles, social content, and thought leadership',               agents: ['research', 'copy', 'design'],                                     tools: ['Claude', 'Perplexity', 'Canva'],                                checkpoints: ['Approve outline', 'Approve draft', 'Approve final'] },
    { id: 'creative_design',     name: 'Creative Design',        description: 'Visual assets — ads, banners, social graphics, presentations',               agents: ['copy', 'design'],                                                 tools: ['Nano Banana', 'DALL-E', 'Canva', 'Figma'],                     checkpoints: ['Approve concept', 'Approve final design'] },
    { id: 'landing_page_builder',name: 'Landing Page Builder',   description: 'Conversion-optimized landing pages with copy and visuals',                   agents: ['copy', 'design', 'landing'],                                      tools: ['Claude', 'Lovable', 'Framer'],                                  checkpoints: ['Approve copy', 'Approve design', 'Approve publish'] },
    { id: 'seo_optimizer',       name: 'SEO Optimizer',          description: 'Keyword research, content optimization, technical SEO',                      agents: ['seo', 'research', 'copy'],                                        tools: ['Ahrefs', 'Semrush', 'Claude'],                                  checkpoints: ['Approve keyword strategy'] },
    { id: 'competitor_research', name: 'Competitor Research',    description: 'Competitive analysis, positioning, campaign benchmarking',                   agents: ['competitor', 'research', 'analytics'],                            tools: ['Perplexity', 'Semrush', 'Crunchbase'],                          checkpoints: ['Approve analysis'] },
    { id: 'analytics_reporting', name: 'Analytics Reporting',    description: 'Campaign performance, attribution, ROI analysis',                            agents: ['analytics'],                                                      tools: ['GA4', 'HubSpot', 'Salesforce'],                                 checkpoints: [] },
    { id: 'email_automation',    name: 'Email Automation',       description: 'Email sequences, drip campaigns, newsletter workflows',                      agents: ['copy', 'email', 'analytics'],                                     tools: ['HubSpot', 'Claude'],                                            checkpoints: ['Approve sequence', 'Approve send'] },
    { id: 'social_media',        name: 'Social Media Manager',   description: 'Content calendar, posts, engagement, scheduling',                            agents: ['copy', 'design', 'analytics'],                                    tools: ['Claude', 'Canva', 'Buffer'],                                    checkpoints: ['Approve posts', 'Approve schedule'] },
    { id: 'event_marketing',     name: 'Event Marketing',        description: 'Webinar promotion, event pages, attendee follow-up',                         agents: ['strategy', 'copy', 'design', 'campaign', 'email'],                tools: ['Claude', 'Canva', 'HubSpot', 'LinkedIn Ads'],                   checkpoints: ['Approve event page', 'Approve promo campaign'] },
];

const TOOL_CONNECTORS: ToolConnector[] = [
    { id: 'canva',       name: 'Canva',          category: 'Design',        icon: '🎨', connected: true,  authType: 'oauth' },
    { id: 'figma',       name: 'Figma',          category: 'Design',        icon: '🖌️', connected: false, authType: 'oauth' },
    { id: 'nano-banana', name: 'Nano Banana',     category: 'Design',        icon: '🍌', connected: true,  authType: 'api_key' },
    { id: 'dalle',       name: 'DALL-E',          category: 'Design',        icon: '🖼️', connected: true,  authType: 'api_key' },
    { id: 'midjourney',  name: 'Midjourney',      category: 'Design',        icon: '🎭', connected: false, authType: 'api_key' },
    { id: 'lovable',     name: 'Lovable',         category: 'Landing Pages', icon: '💜', connected: false, authType: 'oauth' },
    { id: 'hubspot',     name: 'HubSpot',         category: 'Marketing',     icon: '🟠', connected: true,  authType: 'oauth' },
    { id: 'salesforce',  name: 'Salesforce',      category: 'Marketing',     icon: '☁️', connected: false, authType: 'oauth' },
    { id: 'linkedin-ads',name: 'LinkedIn Ads',    category: 'Ads',           icon: '💼', connected: true,  authType: 'oauth' },
    { id: 'google-ads',  name: 'Google Ads',      category: 'Ads',           icon: '🔍', connected: false, authType: 'oauth' },
    { id: 'meta-ads',    name: 'Meta Ads',        category: 'Ads',           icon: '📘', connected: false, authType: 'oauth' },
    { id: 'ahrefs',      name: 'Ahrefs',          category: 'SEO',           icon: '🔗', connected: true,  authType: 'api_key' },
    { id: 'semrush',     name: 'Semrush',         category: 'SEO',           icon: '📊', connected: false, authType: 'api_key' },
    { id: 'perplexity',  name: 'Perplexity',      category: 'Research',      icon: '🧭', connected: true,  authType: 'api_key' },
    { id: 'gdrive',      name: 'Google Drive',    category: 'Storage',       icon: '📁', connected: true,  authType: 'oauth' },
    { id: 's3',          name: 'AWS S3',          category: 'Storage',       icon: '🪣', connected: false, authType: 'api_key' },
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
    { step: 1, label: 'Research ICP & Market',       tool: 'Perplexity',     status: 'done' },
    { step: 2, label: 'Define Campaign Strategy',    tool: 'Claude',          status: 'done' },
    { step: 3, label: 'Generate Messaging & Copy',   tool: 'Claude',          status: 'done' },
    { step: 4, label: 'Generate Ad Creatives',       tool: 'Nano Banana',     status: 'running' },
    { step: 5, label: 'Layout Ads in Canva',         tool: 'Canva',           status: 'waiting' },
    { step: 6, label: 'Approve Creatives',           tool: 'Human',           status: 'checkpoint' },
    { step: 7, label: 'Setup LinkedIn Campaign',     tool: 'LinkedIn Ads API',status: 'waiting' },
    { step: 8, label: 'Approve Campaign Launch',     tool: 'Human',           status: 'checkpoint' },
];

const STATUS_STYLES: Record<string, string> = {
    done:       'bg-emerald-100 text-emerald-700 border-emerald-200',
    running:    'bg-blue-100 text-blue-700 border-blue-200',
    waiting:    'bg-gray-100 text-gray-600 border-gray-200',
    checkpoint: 'bg-amber-100 text-amber-700 border-amber-200',
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
                        <h2 className="text-xl font-bold text-gray-900">Marketing Agent Graph</h2>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                            Self-optimizing AI agents that replace human marketing tasks — orchestrating tools, learning from outcomes.
                        </p>
                    </div>
                    <div className="flex gap-1.5">
                        {(['agents', 'skills', 'tools', 'execute', 'optimize'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${activeTab === tab ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}>
                                {tab === 'agents' ? 'Agent Network' : tab === 'skills' ? 'Skills' : tab === 'tools' ? 'Marketplace' : tab === 'execute' ? 'Execute' : 'Optimize'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Architecture flow */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 py-2 overflow-x-auto">
                    {['Intent', 'Skill', 'Agents', 'Tools', 'Execute', 'Checkpoints', 'Analytics', 'Optimize', 'Loop'].map((step, i) => (
                        <span key={step} className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded border font-semibold ${i >= 6 ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>{step}</span>
                            {i < 8 && <span className="text-blue-500 font-bold">&#x2192;</span>}
                        </span>
                    ))}
                </div>
            </div>

            {/* ================================================================ */}
            {/* TAB: Agent Network                                               */}
            {/* ================================================================ */}
            {activeTab === 'agents' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 font-medium">Specialized marketing agents that collaborate through shared state — not sequential pipelines.</p>

                    {/* Agent graph visualization */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
                        <div className="text-center mb-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Agent Collaboration Graph</span>
                        </div>
                        <pre className="text-xs text-blue-700 font-mono text-center leading-relaxed whitespace-pre">
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
                            <div key={agent.id} className={`rounded-xl bg-gradient-to-br ${agent.color} border p-4 hover:shadow-md hover:scale-[1.02] transition-all`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{agent.icon}</span>
                                    <h4 className="text-sm font-bold text-gray-900">{agent.name}</h4>
                                </div>
                                <p className="text-[11px] text-gray-600 font-medium mb-3 line-clamp-2">{agent.role}</p>
                                <div className="flex flex-wrap gap-1">
                                    {agent.tools.map(tool => (
                                        <span key={tool} className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700 font-medium">{tool}</span>
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
                    <p className="text-sm text-gray-600 font-medium">Marketing skills define what tasks agents can perform — each skill maps to agents, tools, and human checkpoints.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {SKILLS.map(skill => (
                            <div key={skill.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all">
                                <h4 className="text-sm font-bold text-gray-900 mb-1">{skill.name}</h4>
                                <p className="text-[11px] text-gray-600 font-medium mb-3">{skill.description}</p>

                                <div className="space-y-2">
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Agents</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {skill.agents.map(a => {
                                                const agent = AGENTS.find(ag => ag.id === a);
                                                return <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">{agent?.icon} {agent?.name.replace(' Agent', '')}</span>;
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tools</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {skill.tools.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium border border-gray-200">{t}</span>)}
                                        </div>
                                    </div>
                                    {skill.checkpoints.length > 0 && (
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Checkpoints</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {skill.checkpoints.map(c => <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold">&#x23F8; {c}</span>)}
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
                        <p className="text-sm text-gray-600 font-medium">Connect your marketing tools — agents orchestrate them at runtime. <span className="font-bold text-gray-900">{connectedCount}/{connectors.length}</span> connected.</p>
                    </div>

                    {toolCategories.map(category => (
                        <div key={category}>
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">{category}</h3>
                            <div className="grid grid-cols-4 gap-3">
                                {connectors.filter(t => t.category === category).map(tool => (
                                    <div key={tool.id} className={`rounded-xl border p-4 transition-all duration-200 ${tool.connected ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{tool.icon}</span>
                                                <span className="text-sm font-bold text-gray-900">{tool.name}</span>
                                            </div>
                                            <span className={`w-2 h-2 rounded-full ${tool.connected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-500 font-medium">{tool.authType === 'oauth' ? 'OAuth 2.0' : tool.authType === 'api_key' ? 'API Key' : 'MCP'}</span>
                                            <button onClick={() => toggleConnect(tool.id)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${tool.connected ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                                                {tool.connected ? 'Disconnect' : 'Connect'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                        <span className="text-2xl block mb-2">&#x2795;</span>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Add Custom Tool</h4>
                        <p className="text-xs text-gray-600 font-medium">Connect any tool with an API URL, auth type, and capability description.</p>
                    </div>
                </div>
            )}

            {/* ================================================================ */}
            {/* TAB: Execute                                                     */}
            {/* ================================================================ */}
            {activeTab === 'execute' && (
                <div className="space-y-4">
                    {/* Search bar */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-2">What do you want to do?</label>
                        <div className="flex gap-3">
                            <input type="text" value={queryText} onChange={e => setQueryText(e.target.value)}
                                placeholder="e.g., Create LinkedIn ads for our AI webinar..."
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors" />
                            <button className="px-6 py-3 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm">
                                Deploy Agents
                            </button>
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {['Create LinkedIn campaign', 'Write blog post', 'Build landing page', 'Analyze performance', 'Research competitors'].map(q => (
                                <button key={q} onClick={() => setQueryText(q)}
                                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Demo execution timeline */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-xs font-bold text-gray-900">Agent Execution: "Create LinkedIn ads for our AI webinar"</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">Skill: campaign_builder</span>
                        </div>

                        <div className="p-4 space-y-2">
                            {DEMO_EXECUTION.map(step => (
                                <div key={step.step} className="flex items-center gap-3 py-2">
                                    <span className="text-xs font-mono text-gray-400 w-8">#{step.step}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[step.status]}`}>
                                        {step.status === 'done' ? '✓ Done' : step.status === 'running' ? '○ Running' : step.status === 'checkpoint' ? '⏸ Checkpoint' : '… Waiting'}
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium flex-1">{step.label}</span>
                                    <span className="text-xs text-gray-500 font-medium">{step.tool}</span>
                                    {step.status === 'checkpoint' && (
                                        <button className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 hover:bg-amber-200 transition-colors">
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
                            { key: 'state.market',    label: 'Market Insights',   status: 'populated',    agent: 'Research' },
                            { key: 'state.strategy',  label: 'Campaign Strategy', status: 'populated',    agent: 'Strategy' },
                            { key: 'state.messaging', label: 'Messaging & Copy',  status: 'populated',    agent: 'Copy' },
                            { key: 'state.creatives', label: 'Creative Assets',   status: 'in_progress',  agent: 'Design' },
                        ].map(state => (
                            <div key={state.key} className="rounded-xl border border-gray-200 bg-white shadow-sm p-3">
                                <code className="text-[10px] text-blue-600 font-mono font-bold">{state.key}</code>
                                <div className="text-sm text-gray-900 font-bold mt-1">{state.label}</div>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] text-gray-500 font-medium">by {state.agent}</span>
                                    <span className={`w-2 h-2 rounded-full ${state.status === 'populated' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`} />
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
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">🔄</span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Self-Optimizing Marketing Agent Network</h3>
                                <p className="text-xs text-gray-600 font-medium">Agents learn from campaign outcomes and adapt automatically — continuous improvement without manual iteration.</p>
                            </div>
                        </div>

                        {/* SOMAN loop visualization */}
                        <div className="flex items-center justify-center gap-2 py-4 text-[11px] flex-wrap">
                            {[
                                { label: 'Campaign',           icon: '📢', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                { label: 'Performance Signals',icon: '📊', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                                { label: 'Analytics Agent',    icon: '📈', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                                { label: 'Optimization Agent', icon: '🔄', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                { label: 'Strategy Adjust',    icon: '🎯', color: 'bg-pink-100 text-pink-700 border-pink-200' },
                                { label: 'Creative Regen',     icon: '🎨', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                                { label: 'New Campaign',       icon: '🚀', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
                            ].map((step, i) => (
                                <span key={step.label} className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-lg border font-semibold ${step.color} flex items-center gap-1.5`}>
                                        <span>{step.icon}</span> {step.label}
                                    </span>
                                    {i < 6 && <span className="text-amber-600 font-bold">&#x2192;</span>}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Optimization Mode Selector */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Optimization Mode</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {([
                                { mode: 'manual' as const,     icon: '👤', title: 'Manual',     desc: 'Analytics agent suggests changes. Human approves every action.' },
                                { mode: 'assisted' as const,   icon: '🤝', title: 'Assisted',   desc: 'Agents propose updates. Auto-approve below risk threshold.' },
                                { mode: 'autonomous' as const, icon: '🤖', title: 'Autonomous', desc: 'Agents optimize continuously with circuit breakers and guardrails.' },
                            ]).map(opt => (
                                <button key={opt.mode} onClick={() => setOptimizationMode(opt.mode)}
                                    className={`p-4 rounded-xl border text-left transition-all ${optimizationMode === opt.mode ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{opt.icon}</span>
                                        <span className={`text-sm font-bold ${optimizationMode === opt.mode ? 'text-blue-700' : 'text-gray-900'}`}>{opt.title}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 font-medium">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Performance Signals Dashboard */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Live Performance Signals</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { metric: 'CTR',             value: '2.4%',   trend: '-0.3%', status: 'warning', benchmark: '2.8%' },
                                { metric: 'Conversion Rate', value: '4.1%',   trend: '+0.5%', status: 'good',    benchmark: '3.5%' },
                                { metric: 'CPA',             value: '$23.40', trend: '+$2.10',status: 'warning', benchmark: '$20.00' },
                                { metric: 'ROAS',            value: '3.2x',   trend: '+0.4x', status: 'good',    benchmark: '2.5x' },
                                { metric: 'Engagement Rate', value: '6.8%',   trend: '+1.2%', status: 'good',    benchmark: '5.0%' },
                                { metric: 'Bounce Rate',     value: '42%',    trend: '+5%',   status: 'warning', benchmark: '35%' },
                                { metric: 'Email Open Rate', value: '28%',    trend: '-2%',   status: 'warning', benchmark: '30%' },
                                { metric: 'Time on Page',    value: '1m 42s', trend: '+12s',  status: 'good',    benchmark: '1m 30s' },
                            ].map(signal => (
                                <div key={signal.metric} className={`rounded-lg border p-3 ${signal.status === 'good' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">{signal.metric}</div>
                                    <div className="text-lg font-bold text-gray-900 mt-0.5">{signal.value}</div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] font-bold font-mono ${signal.status === 'good' ? 'text-emerald-700' : 'text-amber-700'}`}>{signal.trend}</span>
                                        <span className="text-[9px] text-gray-500 font-medium">bench: {signal.benchmark}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optimization Actions */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold">Optimization Suggestions</h4>
                            <span className="text-[10px] text-amber-700 font-bold px-2 py-0.5 rounded bg-amber-100 border border-amber-200">3 actions recommended</span>
                        </div>
                        <div className="space-y-2">
                            {[
                                { action: 'Regenerate headline',              reason: 'CTR below benchmark for 48h',                         agent: 'Copy Agent',     priority: 'high',   impact: 'Expected +0.5% CTR' },
                                { action: 'Refresh ad creative',              reason: 'Creative fatigue detected — frequency > 3.0',         agent: 'Design Agent',   priority: 'high',   impact: 'Expected -15% CPA' },
                                { action: 'Narrow audience targeting',        reason: 'Bounce rate 42% vs 35% benchmark',                    agent: 'Strategy Agent', priority: 'medium', impact: 'Expected +8% conversion' },
                                { action: 'Shift 20% budget to top performer',reason: 'Ad Set B has 2x ROAS vs average',                    agent: 'Campaign Agent', priority: 'low',    impact: 'Expected +0.3x ROAS' },
                            ].map((action, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white transition-colors">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${action.priority === 'high' ? 'bg-red-500' : action.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-900 font-bold">{action.action}</div>
                                        <div className="text-[11px] text-gray-600 font-medium mt-0.5">{action.reason}</div>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{action.agent}</span>
                                    <span className="text-[10px] text-emerald-700 font-bold whitespace-nowrap">{action.impact}</span>
                                    {optimizationMode === 'manual' ? (
                                        <button className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
                                            Approve
                                        </button>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">Auto</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Campaign Memory */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Campaign Memory — Learning History</h4>
                        <div className="space-y-2">
                            {[
                                { campaign: 'AI Webinar Promo v3',  change: 'Headline regenerated',  before: 'CTR 1.8%',         after: 'CTR 3.1%',         date: '2 days ago' },
                                { campaign: 'Product Launch Q1',    change: 'Audience narrowed',     before: 'CPA $31',          after: 'CPA $19',          date: '5 days ago' },
                                { campaign: 'Blog Amplification',   change: 'Creative refreshed',   before: 'Engagement 4.2%',  after: 'Engagement 7.8%',  date: '1 week ago' },
                            ].map((entry, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <span className="text-emerald-600 text-sm font-bold">✓</span>
                                    <div className="flex-1">
                                        <span className="text-xs font-bold text-gray-900">{entry.campaign}</span>
                                        <span className="text-[11px] text-gray-500 font-medium ml-2">{entry.change}</span>
                                    </div>
                                    <span className="text-[10px] text-red-600 line-through font-medium">{entry.before}</span>
                                    <span className="text-[10px] text-emerald-700 font-bold">{entry.after}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{entry.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
