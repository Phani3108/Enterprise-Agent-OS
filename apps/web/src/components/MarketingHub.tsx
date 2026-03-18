/**
 * MarketingHub — AI Marketing Agency inside AgentOS
 * Consolidated: Skills (execution + agent browse) → Outputs → Programs → Memory.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useRef } from 'react';
import { MarketingCommandCenter } from './marketing/MarketingCommandCenter';
import { UnifiedPersonaLayout } from './persona/UnifiedPersonaLayout';
import { OutputsView, type OutputExecution } from './persona/OutputsView';
import { PromptLibrary } from './PromptLibraryDeep';
import { PipelineView } from './PipelineView';
import AgentsPanel from './AgentsPanel';
import { useMarketingStore } from '../store/marketing-store';
import { useConnectionsStore } from '../store/connections-store';

// 12 Marketing Agents — each is a deep skill with sub-capabilities, prompts, outputs, and tools
interface AgentSubSkill {
  id: string;
  name: string;
  description: string;
  promptId: string;       // references a pre-built prompt
  promptLines?: string;   // e.g. "Lines 12-22 of master prompt"
  outputs: string[];      // output format options
  tools: string[];        // tools this sub-skill specifically needs
}

interface AgentDef {
  id: string;
  name: string;
  icon: string;
  role: string;
  tools: string[];
  color: string;
  subSkills: AgentSubSkill[];
}

const AGENTS: AgentDef[] = [
  {
    id: 'campaign', name: 'Campaign Agent', icon: '📡', role: 'Campaign strategy, orchestration, pipeline',
    tools: ['HubSpot', 'Claude'], color: 'from-blue-50 to-indigo-50 border-blue-200',
    subSkills: [
      { id: 'camp-strategy', name: 'Campaign Strategy', description: 'Build full campaign plan with objectives, audience, channels, and timeline', promptId: 'campaign-strategy', outputs: ['Campaign Brief', 'Channel Plan', 'Timeline'], tools: ['Claude'] },
      { id: 'camp-orchestrate', name: 'Multi-Channel Orchestration', description: 'Coordinate messaging across email, ads, social, and web', promptId: 'campaign-orchestration', outputs: ['Orchestration Map', 'Channel Matrix'], tools: ['HubSpot', 'Claude'] },
      { id: 'camp-budget', name: 'Budget Allocation', description: 'Allocate budget across channels based on historical ROI', promptId: 'campaign-budget', outputs: ['Budget Spreadsheet', 'ROI Projection'], tools: ['HubSpot', 'Claude'] },
      { id: 'camp-launch', name: 'Launch Checklist', description: 'Pre-launch verification and go-live orchestration', promptId: 'campaign-launch', outputs: ['Launch Checklist', 'Go-Live Report'], tools: ['HubSpot'] },
    ],
  },
  {
    id: 'content', name: 'Content Agent', icon: '✍️', role: 'Copy, blogs, emails, landing pages',
    tools: ['Claude', 'Blogin', 'WordPress'], color: 'from-emerald-50 to-teal-50 border-emerald-200',
    subSkills: [
      { id: 'cont-longform', name: 'Long-Form Content', description: 'Blog posts, whitepapers, ebooks (1000+ words)', promptId: 'content-longform', promptLines: 'Lines 1-45 of master content prompt', outputs: ['Blog Post', 'Whitepaper', 'eBook Draft'], tools: ['Claude', 'WordPress'] },
      { id: 'cont-shortform', name: 'Short-Form Content', description: 'Social posts, ad copy, taglines, micro-content', promptId: 'content-shortform', promptLines: 'Lines 46-65 of master content prompt', outputs: ['Social Posts (5 variants)', 'Ad Copy Set', 'Tagline Options'], tools: ['Claude'] },
      { id: 'cont-email', name: 'Email Sequences', description: 'Drip campaigns, nurture sequences, transactional emails', promptId: 'content-email', outputs: ['Email Sequence (3-7 emails)', 'Subject Line Variants', 'Drip Schedule'], tools: ['Claude', 'HubSpot'] },
      { id: 'cont-landing', name: 'Landing Pages', description: 'High-converting landing page copy with CTA optimization', promptId: 'content-landing', outputs: ['Landing Page Copy', 'CTA Variants', 'SEO Meta'], tools: ['Claude', 'WordPress'] },
      { id: 'cont-newsletter', name: 'Newsletter', description: 'Weekly/monthly newsletter content curation and writing', promptId: 'content-newsletter', outputs: ['Newsletter Draft', 'Content Roundup'], tools: ['Claude', 'Blogin'] },
    ],
  },
  {
    id: 'creative', name: 'Creative Agent', icon: '🎨', role: 'Ad creatives, banners, social graphics',
    tools: ['Canva', 'DALL-E', 'Nano Banana'], color: 'from-pink-50 to-rose-50 border-pink-200',
    subSkills: [
      { id: 'creat-banner', name: 'Display Banners', description: 'Banner ads in standard IAB sizes', promptId: 'creative-banner', outputs: ['Banner Set (6 sizes)', 'Animated GIF Set'], tools: ['Canva'] },
      { id: 'creat-social', name: 'Social Graphics', description: 'Platform-optimized social media images', promptId: 'creative-social', outputs: ['Social Image Set', 'Story/Reel Templates'], tools: ['Canva', 'DALL-E'] },
      { id: 'creat-infographic', name: 'Infographics', description: 'Data-driven visual content for complex topics', promptId: 'creative-infographic', outputs: ['Infographic', 'Data Visualization'], tools: ['Canva', 'DALL-E'] },
      { id: 'creat-video', name: 'Video Thumbnails & Stills', description: 'Video thumbnails, cover images, promotional stills', promptId: 'creative-video', outputs: ['Thumbnail Set', 'Cover Image'], tools: ['Canva', 'Nano Banana'] },
    ],
  },
  {
    id: 'ads', name: 'Ads Agent', icon: '📢', role: 'Paid media setup, targeting, budgets',
    tools: ['LinkedIn Ads', 'Google Ads', 'Meta Ads'], color: 'from-red-50 to-orange-50 border-red-200',
    subSkills: [
      { id: 'ads-search', name: 'Search Ads', description: 'Google Search campaigns with keyword targeting', promptId: 'ads-search', outputs: ['Ad Group Structure', 'Keyword List', 'Ad Copy Variants'], tools: ['Google Ads'] },
      { id: 'ads-social', name: 'Social Ads', description: 'LinkedIn and Meta sponsored content campaigns', promptId: 'ads-social', outputs: ['Campaign Structure', 'Audience Targeting', 'Creative Brief'], tools: ['LinkedIn Ads', 'Meta Ads'] },
      { id: 'ads-retargeting', name: 'Retargeting', description: 'Re-engagement campaigns for website visitors', promptId: 'ads-retargeting', outputs: ['Retargeting Strategy', 'Audience Segments'], tools: ['Google Ads', 'Meta Ads'] },
      { id: 'ads-reporting', name: 'Ad Performance Report', description: 'Cross-platform ad performance analysis', promptId: 'ads-reporting', outputs: ['Performance Report', 'Optimization Recommendations'], tools: ['Google Ads', 'LinkedIn Ads', 'Meta Ads'] },
    ],
  },
  {
    id: 'crm-campaign', name: 'CRM Campaign Agent', icon: '☁️', role: 'HubSpot/Salesforce campaigns, nurture',
    tools: ['HubSpot', 'Salesforce'], color: 'from-slate-50 to-slate-100 border-slate-200',
    subSkills: [
      { id: 'crm-nurture', name: 'Lead Nurture', description: 'Automated nurture workflows based on lead score', promptId: 'crm-nurture', outputs: ['Workflow Config', 'Email Sequence', 'Scoring Rules'], tools: ['HubSpot'] },
      { id: 'crm-segment', name: 'Audience Segmentation', description: 'Smart lists and dynamic segments for targeting', promptId: 'crm-segment', outputs: ['Segment Definitions', 'Audience Report'], tools: ['HubSpot', 'Salesforce'] },
      { id: 'crm-pipeline', name: 'Pipeline Management', description: 'Deal pipeline setup and conversion optimization', promptId: 'crm-pipeline', outputs: ['Pipeline Report', 'Stage Recommendations'], tools: ['Salesforce'] },
    ],
  },
  {
    id: 'event', name: 'Event Agent', icon: '🎪', role: 'Webinars, events, promo kits',
    tools: ['HubSpot', 'Claude'], color: 'from-orange-50 to-amber-50 border-orange-200',
    subSkills: [
      { id: 'evt-webinar', name: 'Webinar Planning', description: 'End-to-end webinar setup: topic, speakers, promotion', promptId: 'event-webinar', outputs: ['Webinar Plan', 'Promo Kit', 'Follow-Up Sequence'], tools: ['HubSpot', 'Claude'] },
      { id: 'evt-conference', name: 'Conference Prep', description: 'Conference booth, talks, and networking materials', promptId: 'event-conference', outputs: ['Booth Plan', 'Talk Abstract', 'Networking Kit'], tools: ['Claude'] },
      { id: 'evt-promo', name: 'Event Promotion', description: 'Multi-channel event promotion campaign', promptId: 'event-promo', outputs: ['Promo Timeline', 'Email Invites', 'Social Posts'], tools: ['HubSpot', 'Claude'] },
    ],
  },
  {
    id: 'social', name: 'Social Agent', icon: '📱', role: 'Social content, scheduling',
    tools: ['LinkedIn Ads', 'Canva'], color: 'from-cyan-50 to-sky-50 border-cyan-200',
    subSkills: [
      { id: 'soc-calendar', name: 'Content Calendar', description: 'Monthly social content calendar with themes', promptId: 'social-calendar', outputs: ['Calendar (30 days)', 'Theme Map'], tools: ['Claude'] },
      { id: 'soc-posts', name: 'Post Generation', description: 'Platform-specific social posts with hashtags', promptId: 'social-posts', outputs: ['Post Set (10)', 'Hashtag Strategy'], tools: ['Claude', 'Canva'] },
      { id: 'soc-engage', name: 'Engagement Strategy', description: 'Community engagement plan and response templates', promptId: 'social-engage', outputs: ['Engagement Playbook', 'Response Templates'], tools: ['LinkedIn Ads'] },
    ],
  },
  {
    id: 'seo', name: 'SEO Agent', icon: '🔗', role: 'SEO, keywords, content optimization',
    tools: ['Ahrefs', 'Semrush', 'Blogin'], color: 'from-violet-50 to-purple-50 border-violet-200',
    subSkills: [
      { id: 'seo-audit', name: 'Site Audit', description: 'Technical SEO audit with prioritized fixes', promptId: 'seo-audit', outputs: ['Audit Report', 'Fix Priority List'], tools: ['Ahrefs', 'Semrush'] },
      { id: 'seo-keyword', name: 'Keyword Research', description: 'Keyword opportunity analysis with difficulty scoring', promptId: 'seo-keyword', outputs: ['Keyword List', 'Content Gap Analysis'], tools: ['Semrush', 'Ahrefs'] },
      { id: 'seo-optimize', name: 'Content Optimization', description: 'On-page SEO optimization for existing content', promptId: 'seo-optimize', outputs: ['Optimization Report', 'Meta Tag Updates'], tools: ['Blogin', 'Semrush'] },
      { id: 'seo-backlink', name: 'Backlink Strategy', description: 'Link building opportunities and outreach plan', promptId: 'seo-backlink', outputs: ['Backlink Report', 'Outreach Templates'], tools: ['Ahrefs'] },
    ],
  },
  {
    id: 'analytics', name: 'Analytics Agent', icon: '📊', role: 'Performance, funnel, optimization',
    tools: ['GA4', 'HubSpot', 'Salesforce'], color: 'from-amber-50 to-yellow-50 border-amber-200',
    subSkills: [
      { id: 'anal-funnel', name: 'Funnel Analysis', description: 'Full-funnel conversion analysis with drop-off identification', promptId: 'analytics-funnel', outputs: ['Funnel Report', 'Drop-Off Analysis'], tools: ['GA4', 'HubSpot'] },
      { id: 'anal-attribution', name: 'Attribution Modeling', description: 'Multi-touch attribution across marketing channels', promptId: 'analytics-attribution', outputs: ['Attribution Report', 'Channel ROI'], tools: ['GA4', 'HubSpot', 'Salesforce'] },
      { id: 'anal-dashboard', name: 'Dashboard Builder', description: 'Custom analytics dashboard with KPI tracking', promptId: 'analytics-dashboard', outputs: ['Dashboard Config', 'KPI Report'], tools: ['GA4'] },
    ],
  },
  {
    id: 'research', name: 'Research Agent', icon: '🔍', role: 'Market research, trends, competitive intel',
    tools: ['Perplexity', 'Semrush'], color: 'from-sky-50 to-cyan-50 border-sky-200',
    subSkills: [
      { id: 'res-competitive', name: 'Competitive Analysis', description: 'Deep competitor research: positioning, messaging, channels', promptId: 'research-competitive', outputs: ['Competitive Landscape', 'SWOT Matrix', 'Positioning Map'], tools: ['Perplexity', 'Semrush'] },
      { id: 'res-market', name: 'Market Trends', description: 'Industry trend identification and opportunity scanning', promptId: 'research-market', outputs: ['Trend Report', 'Opportunity Brief'], tools: ['Perplexity'] },
      { id: 'res-audience', name: 'Audience Research', description: 'ICP validation, persona refinement, buying journey mapping', promptId: 'research-audience', outputs: ['Persona Cards', 'Journey Map', 'ICP Report'], tools: ['Perplexity', 'Semrush'] },
    ],
  },
  {
    id: 'studio-manager', name: 'Studio Manager Agent', icon: '🎬', role: 'Asset coordination, approvals, workflow',
    tools: ['Google Drive', 'Canva'], color: 'from-rose-50 to-pink-50 border-rose-200',
    subSkills: [
      { id: 'studio-asset', name: 'Asset Management', description: 'Organize, tag, and version creative assets', promptId: 'studio-assets', outputs: ['Asset Inventory', 'Version Log'], tools: ['Google Drive'] },
      { id: 'studio-review', name: 'Review Workflow', description: 'Route assets through stakeholder review and approval', promptId: 'studio-review', outputs: ['Review Queue', 'Approval Status'], tools: ['Google Drive', 'Canva'] },
      { id: 'studio-template', name: 'Template Management', description: 'Create and maintain brand-consistent templates', promptId: 'studio-templates', outputs: ['Template Library', 'Brand Checklist'], tools: ['Canva'] },
    ],
  },
  {
    id: 'optimization', name: 'Optimization Agent', icon: '📈', role: 'A/B tests, conversion, ROI',
    tools: ['GA4', 'HubSpot', 'Claude'], color: 'from-lime-50 to-green-50 border-lime-200',
    subSkills: [
      { id: 'opt-ab', name: 'A/B Test Design', description: 'Statistical test design for landing pages, emails, ads', promptId: 'optimization-ab', outputs: ['Test Plan', 'Variant Specs', 'Sample Size Calc'], tools: ['Claude', 'GA4'] },
      { id: 'opt-cro', name: 'Conversion Rate Optimization', description: 'CRO audit with actionable recommendations', promptId: 'optimization-cro', outputs: ['CRO Audit', 'Priority Fixes', 'Heatmap Analysis'], tools: ['GA4', 'HubSpot'] },
      { id: 'opt-roi', name: 'ROI Analysis', description: 'Campaign ROI calculation and optimization recommendations', promptId: 'optimization-roi', outputs: ['ROI Report', 'Budget Reallocation Plan'], tools: ['GA4', 'HubSpot', 'Claude'] },
    ],
  },
];

const TOOL_CONNECTORS = [
  { id: 'hubspot', name: 'HubSpot', category: 'Marketing', icon: '🟠', authType: 'oauth' as const, connectorId: 'hubspot' },
  { id: 'salesforce', name: 'Salesforce', category: 'Marketing', icon: '☁️', authType: 'oauth' as const, connectorId: 'salesforce' },
  { id: 'linkedin-ads', name: 'LinkedIn Ads', category: 'Ads', icon: '💼', authType: 'oauth' as const, connectorId: 'linkedin-ads' },
  { id: 'canva', name: 'Canva', category: 'Design', icon: '🎨', authType: 'oauth' as const, connectorId: 'canva' },
  { id: 'wordpress', name: 'WordPress', category: 'Content', icon: '🔗', authType: 'oauth' as const, connectorId: 'wordpress' },
  { id: 'blogin', name: 'Blogin', category: 'Content', icon: '📝', authType: 'api_key' as const, connectorId: 'blogin' },
  { id: 'gdrive', name: 'Google Drive', category: 'Storage', icon: '📁', authType: 'oauth' as const, connectorId: 'google-drive' },
  { id: 'perplexity', name: 'Perplexity', category: 'Research', icon: '🧭', authType: 'api_key' as const, connectorId: 'perplexity' },
  { id: 'anthropic', name: 'Claude', category: 'AI', icon: '🤖', authType: 'api_key' as const, connectorId: 'anthropic' },
];

// ---------------------------------------------------------------------------
// Agent browser — expandable agent cards with sub-skills, prompts, outputs, tools
// ---------------------------------------------------------------------------

function MarketingAgentBrowser({ onRunSkill }: { onRunSkill?: () => void }) {
  const isToolConnected = useConnectionsStore(s => s.isToolConnected);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [selectedSubSkill, setSelectedSubSkill] = useState<Record<string, string>>({});
  const [selectedOutput, setSelectedOutput] = useState<Record<string, string>>({});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Marketing Skills</h2>
        <p className="text-sm text-slate-600">Each agent has multiple capabilities with pre-built prompts, output formats, and tool selections. Click an agent to configure.</p>
      </div>
      <div className="space-y-3">
        {AGENTS.map((a) => {
          const connectedTools = a.tools.filter(t => isToolConnected(t));
          const allConnected = connectedTools.length === a.tools.length;
          const noneConnected = connectedTools.length === 0;
          const isExpanded = expandedAgent === a.id;
          const activeSubId = selectedSubSkill[a.id] ?? a.subSkills[0]?.id;
          const activeSub = a.subSkills.find(s => s.id === activeSubId) ?? a.subSkills[0];
          const activeOutput = selectedOutput[a.id] ?? activeSub?.outputs[0];

          return (
            <div key={a.id} className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? 'shadow-md' : ''} ${a.color.replace('from-', 'border-').split(' ')[2] || 'border-slate-200'}`}>
              {/* Agent header — click to expand */}
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : a.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-br ${a.color} text-left hover:brightness-[0.98] transition-all`}
              >
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{a.name}</h4>
                  <p className="text-[11px] text-slate-600 truncate">{a.role}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-500 bg-white/60 px-2 py-0.5 rounded-full font-medium">
                    {a.subSkills.length} skills
                  </span>
                  <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    allConnected ? 'bg-emerald-100 text-emerald-700' : noneConnected ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${allConnected ? 'bg-emerald-500' : noneConnected ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    {allConnected ? 'Ready' : noneConnected ? 'Sandbox' : `${connectedTools.length}/${a.tools.length}`}
                  </div>
                  <span className="text-[10px] text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Expanded: sub-skill selector, prompt, outputs, tools */}
              {isExpanded && activeSub && (
                <div className="bg-white border-t p-4 space-y-4">
                  {/* Sub-skill selector dropdown */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Select Skill</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {a.subSkills.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubSkill(prev => ({ ...prev, [a.id]: sub.id }));
                            setSelectedOutput(prev => ({ ...prev, [a.id]: sub.outputs[0] }));
                          }}
                          className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            sub.id === activeSubId
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active sub-skill detail */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-3">
                    <p className="text-xs text-slate-700">{activeSub.description}</p>

                    {/* Prompt reference */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pre-Built Prompt</label>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] px-2.5 py-1 rounded-md bg-violet-50 border border-violet-200 text-violet-700 font-mono">
                          {activeSub.promptId}
                        </span>
                        {activeSub.promptLines && (
                          <span className="text-[10px] text-slate-400">{activeSub.promptLines}</span>
                        )}
                      </div>
                    </div>

                    {/* Output selector */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Output Format</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activeSub.outputs.map(out => (
                          <button
                            key={out}
                            onClick={() => setSelectedOutput(prev => ({ ...prev, [a.id]: out }))}
                            className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-all ${
                              out === activeOutput
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                            }`}
                          >
                            {out}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tools required */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tools Required</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activeSub.tools.map(t => {
                          const connected = isToolConnected(t);
                          return (
                            <span key={t} className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                              connected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              {t}
                              {!connected && <span className="text-[9px] text-slate-400">(not connected)</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Run button area */}
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      {activeSub.tools.every(t => isToolConnected(t))
                        ? <span className="text-emerald-600 font-medium">All tools connected — live execution</span>
                        : <span className="text-amber-600 font-medium">Missing tools — will run in sandbox mode</span>
                      }
                    </div>
                    <button
                      onClick={() => onRunSkill?.()}
                      className="text-xs px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Run {activeSub.name} →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skills View — Merges execution engine + agent capabilities browse
// ---------------------------------------------------------------------------

function MarketingSkillsContent() {
  const [showAgents, setShowAgents] = useState(true);
  const cmdRef = useRef<HTMLDivElement>(null);

  const handleRunSkill = () => {
    cmdRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Execution engine — skill selector, inputs, execute, output */}
      <div ref={cmdRef}>
        <MarketingCommandCenter />
      </div>

      {/* Agent capabilities browser — discover what's possible */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setShowAgents(!showAgents)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900">Browse by AI Agent</h3>
            <p className="text-[11px] text-slate-500">{AGENTS.length} agents · {AGENTS.reduce((s, a) => s + a.subSkills.length, 0)} capabilities with prompts, tools & outputs</p>
          </div>
          <span className="text-[10px] text-slate-400">{showAgents ? '▲ Collapse' : '▼ Expand'}</span>
        </button>
        {showAgents && <MarketingAgentBrowser onRunSkill={handleRunSkill} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outputs — unified execution history
// ---------------------------------------------------------------------------
// History — unified execution history
// ---------------------------------------------------------------------------

function MarketingHistoryContent() {
  const executions = useMarketingStore((s) => s.executions);
  const mapped: OutputExecution[] = executions.map(e => ({
    id: e.id,
    skillName: e.workflowName,
    status: e.status,
    steps: e.steps,
    outputs: e.outputs,
    startedAt: e.startedAt,
    completedAt: e.completedAt,
  }));
  return <OutputsView executions={mapped} accentColor="blue-600" />;
}

// ---------------------------------------------------------------------------
// Library — Browse skills, prompts, agent definitions
// ---------------------------------------------------------------------------

function MarketingLibraryContent() {
  const [tab, setTab] = useState<'skills' | 'prompts' | 'agents'>('skills');
  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 px-6 pt-4">
        {(['skills', 'prompts', 'agents'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors capitalize ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'skills' ? '⚡ Skills' : t === 'prompts' ? '✨ Prompts' : '🤖 Agents'}
          </button>
        ))}
      </div>
      {tab === 'skills' && <MarketingAgentBrowser />}
      {tab === 'prompts' && <PromptLibrary personaFilter="marketing" />}
      {tab === 'agents' && <AgentsPanel personaFilter="Marketing" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Hub — 4-tab router with unified layout
// ---------------------------------------------------------------------------

export function MarketingHub() {
  const activeSection = useMarketingStore((s) => s.activeSection);
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);

  return (
    <UnifiedPersonaLayout
      persona="Marketing"
      accentColor="bg-blue-600"
      activeSection={activeSection}
      onSectionChange={(s) => setActiveSection(s as typeof activeSection)}
    >
      {activeSection === 'run' && <MarketingSkillsContent />}
      {activeSection === 'library' && <MarketingLibraryContent />}
      {activeSection === 'pipelines' && <PipelineView persona="marketing" accentColor="blue-600" />}
      {activeSection === 'history' && <MarketingHistoryContent />}
    </UnifiedPersonaLayout>
  );
}
