/**
 * PlatformArchitecture — How AgentOS Works + Agent Regiment Hierarchy
 * Two-section architecture visualization for the Home / Command Centre.
 * Shows: (1) User journey flow, (2) Agent hierarchy with regiment naming culture.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState } from 'react';
import { useEAOSStore } from '../store/eaos-store';

// ── USER FLOW STEPS ──────────────────────────────────────────────

const PLATFORM_FLOW = [
  {
    step: 1,
    title: 'Connect Your Tools',
    subtitle: 'One-time Setup',
    description: 'Link external services — AI models (Claude, GPT), CRM (HubSpot, Salesforce), dev tools (GitHub, Jira), analytics (GA4), and more. Tools stay connected across all personas.',
    icon: '🔌',
    color: 'bg-slate-800',
    textColor: 'text-white',
    borderColor: 'border-slate-700',
    action: 'conn-ai-models',
    details: ['AI Models', 'CRM & Ads', 'Dev Tools', 'Analytics', 'CMS', 'Messaging'],
  },
  {
    step: 2,
    title: 'Choose a Persona',
    subtitle: 'Your Domain Workspace',
    description: 'Enter a specialized workspace — Marketing, Engineering, Product, or HR. Each persona has its own regiment of agents, curated skills, workflows, prompts, and memory.',
    icon: '🏢',
    color: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-500',
    action: 'ws-marketing',
    details: ['Marketing', 'Engineering', 'Product', 'HR & TA'],
  },
  {
    step: 3,
    title: 'Select a Skill',
    subtitle: 'What You Want to Do',
    description: 'Pick a specific skill — e.g. "Campaign Strategy", "PR Review", "PRD Generation". Each skill defines a structured task with required inputs, agent assignments, and expected outputs.',
    icon: '⚡',
    color: 'bg-violet-600',
    textColor: 'text-white',
    borderColor: 'border-violet-500',
    action: 'ws-marketing',
    details: ['Marketing: 42 sub-skills', 'Engineering: 33 sub-skills', 'Product: 30 sub-skills', 'HR: 24 sub-skills'],
  },
  {
    step: 4,
    title: 'See the Workflow',
    subtitle: 'Execution Blueprint',
    description: 'The skill decomposes into a multi-step workflow — a DAG of agent tasks. Each node represents an agent at a specific rank executing a scoped job. Review the plan before execution.',
    icon: '🔀',
    color: 'bg-emerald-600',
    textColor: 'text-white',
    borderColor: 'border-emerald-500',
    action: 'ws-marketing',
    details: ['Task decomposition', 'Agent assignments', 'Approval gates', 'Dependencies'],
  },
  {
    step: 5,
    title: 'Configure & Edit Prompts',
    subtitle: 'Customize the Execution',
    description: 'Adjust inputs, edit the prompt template, set parameters. Every skill ships with battle-tested prompts, but you can customize for your brand voice, audience, and objectives.',
    icon: '✨',
    color: 'bg-amber-500',
    textColor: 'text-white',
    borderColor: 'border-amber-400',
    action: 'ws-marketing',
    details: ['Input parameters', 'Prompt editing', 'Brand voice', 'Constraints'],
  },
  {
    step: 6,
    title: 'Agents Execute',
    subtitle: 'Chain of Command Runs',
    description: 'The Colonel (Director) dispatches to Captains (Senior agents), who delegate to Corporals (Junior agents). Each agent has a scoped JD — they execute, their manager reviews, results flow upward.',
    icon: '🤖',
    color: 'bg-rose-600',
    textColor: 'text-white',
    borderColor: 'border-rose-500',
    action: 'platform-agents',
    details: ['Colonel delegates', 'Captain executes', 'Corporal assists', 'Manager reviews'],
  },
  {
    step: 7,
    title: 'Review Outputs',
    subtitle: 'Structured Results',
    description: 'Each execution produces structured outputs — content drafts, analysis reports, code reviews, PRDs. Every output is tagged with which agent produced it, when, and at what quality score.',
    icon: '📦',
    color: 'bg-cyan-600',
    textColor: 'text-white',
    borderColor: 'border-cyan-500',
    action: 'ws-marketing',
    details: ['Per-step outputs', 'Quality scores', 'Agent attribution', 'Export options'],
  },
  {
    step: 8,
    title: 'Memory Persists',
    subtitle: 'Learning & Context',
    description: 'Execution history, learnings, brand context, and outcomes get stored in memory. Future executions benefit from past context — agents learn your preferences and improve over time.',
    icon: '🧠',
    color: 'bg-indigo-600',
    textColor: 'text-white',
    borderColor: 'border-indigo-500',
    action: 'ws-marketing',
    details: ['Execution history', 'Brand context', 'Agent learnings', 'Reusable templates'],
  },
];

const OVERSIGHT_LAYER = {
  title: 'Program Management Layer',
  subtitle: 'Oversight & Governance',
  description: 'The Programs tab oversees ALL steps above. It tracks timelines, ensures every agent is executing correctly, monitors output quality, flags deviations from the plan, and provides a "War Room" view of all active operations across regiments.',
  icon: '🏛️',
  items: [
    { label: 'Timeline Tracking', desc: 'Are milestones on schedule?' },
    { label: 'Quality Assurance', desc: 'Does output meet thresholds?' },
    { label: 'Fault Isolation', desc: 'Which platoon/agent failed?' },
    { label: 'Plan Adherence', desc: 'Is execution following the workflow?' },
    { label: 'Cross-Regiment Ops', desc: 'Joint operations across personas' },
    { label: 'After-Action Reports', desc: 'Post-execution tracing & learnings' },
  ],
};

// ── REGIMENT HIERARCHY ───────────────────────────────────────────

interface RegimentAgent {
  callSign: string;
  role: string;
  rank: string;
  icon: string;
}

interface Regiment {
  name: string;
  theme: string;
  persona: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  colonel: RegimentAgent;
  captains: RegimentAgent[];
  corporals: RegimentAgent[];
  action: string;
}

const REGIMENTS: Regiment[] = [
  {
    name: 'Olympian Regiment',
    theme: 'Greek Gods of Communication',
    persona: 'Marketing',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '⚡',
    colonel: { callSign: 'Zeus', role: 'Marketing Director', rank: 'Colonel', icon: '📣' },
    captains: [
      { callSign: 'Hermes', role: 'Content Lead', rank: 'Captain', icon: '✍️' },
      { callSign: 'Athena', role: 'Campaign Strategist', rank: 'Captain', icon: '📡' },
      { callSign: 'Ares', role: 'Ads Manager', rank: 'Captain', icon: '📢' },
      { callSign: 'Iris', role: 'Social Lead', rank: 'Captain', icon: '📱' },
      { callSign: 'Apollo', role: 'SEO Lead', rank: 'Captain', icon: '🔍' },
      { callSign: 'Prometheus', role: 'Analytics Lead', rank: 'Captain', icon: '📊' },
    ],
    corporals: [
      { callSign: 'Echo', role: 'Blog Writer', rank: 'Corporal', icon: '📝' },
      { callSign: 'Zephyr', role: 'Email Writer', rank: 'Corporal', icon: '📧' },
    ],
    action: 'ws-marketing',
  },
  {
    name: 'Asgard Regiment',
    theme: 'Norse Mythology',
    persona: 'Engineering',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '🔨',
    colonel: { callSign: 'Odin', role: 'Engineering Director', rank: 'Colonel', icon: '⚙️' },
    captains: [
      { callSign: 'Thor', role: 'Incident Intelligence', rank: 'Captain', icon: '🚨' },
      { callSign: 'Loki', role: 'PR Reviewer', rank: 'Captain', icon: '🔎' },
      { callSign: 'Mímir', role: 'Developer Knowledge', rank: 'Captain', icon: '📖' },
      { callSign: 'Heimdall', role: 'Architecture Agent', rank: 'Captain', icon: '🏗️' },
      { callSign: 'Freya', role: 'DevOps Agent', rank: 'Captain', icon: '🚀' },
      { callSign: 'Bragi', role: 'Documentation Agent', rank: 'Captain', icon: '📚' },
      { callSign: 'Tyr', role: 'Security Agent', rank: 'Captain', icon: '🛡️' },
      { callSign: 'Vidar', role: 'Performance Agent', rank: 'Captain', icon: '⚡' },
      { callSign: 'Baldur', role: 'Refactoring Agent', rank: 'Captain', icon: '🔧' },
      { callSign: 'Forseti', role: 'Sprint Planning Agent', rank: 'Captain', icon: '📋' },
    ],
    corporals: [
      { callSign: 'Ratatoskr', role: 'Test Writer', rank: 'Corporal', icon: '🧪' },
      { callSign: 'Fenrir', role: 'CI Debugger', rank: 'Corporal', icon: '🔥' },
    ],
    action: 'ws-engineering',
  },
  {
    name: 'Explorer Regiment',
    theme: 'Great Explorers',
    persona: 'Product',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: '🌍',
    colonel: { callSign: 'Magellan', role: 'Product Director', rank: 'Colonel', icon: '🗺️' },
    captains: [
      { callSign: 'Columbus', role: 'PRD Writer', rank: 'Captain', icon: '📄' },
      { callSign: 'Drake', role: 'User Researcher', rank: 'Captain', icon: '🧪' },
      { callSign: 'Vespucci', role: 'Metrics Analyst', rank: 'Captain', icon: '📈' },
      { callSign: 'Zheng He', role: 'Strategy Agent', rank: 'Captain', icon: '🧭' },
      { callSign: 'Amundsen', role: 'Analytics Agent', rank: 'Captain', icon: '📊' },
      { callSign: 'Cook', role: 'Competitive Intel', rank: 'Captain', icon: '🔭' },
      { callSign: 'Shackleton', role: 'Launch Agent', rank: 'Captain', icon: '🎯' },
      { callSign: 'Polo', role: 'Stakeholder Reports', rank: 'Captain', icon: '📑' },
      { callSign: 'Cabot', role: 'Roadmap Agent', rank: 'Captain', icon: '🗓️' },
      { callSign: 'Tasman', role: 'Feedback Agent', rank: 'Captain', icon: '💬' },
    ],
    corporals: [
      { callSign: 'Hudson', role: 'Spec Writer', rank: 'Corporal', icon: '📝' },
      { callSign: 'Frobisher', role: 'Data Puller', rank: 'Corporal', icon: '📈' },
    ],
    action: 'ws-product',
  },
  {
    name: 'Eden Regiment',
    theme: 'Nature & Nurture',
    persona: 'HR & TA',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    icon: '🌿',
    colonel: { callSign: 'Gaia', role: 'HR & TA Director', rank: 'Colonel', icon: '👥' },
    captains: [
      { callSign: 'Ceres', role: 'TA Lead', rank: 'Captain', icon: '🎯' },
      { callSign: 'Flora', role: 'People Ops Lead', rank: 'Captain', icon: '🏢' },
      { callSign: 'Pomona', role: 'Compensation Analyst', rank: 'Captain', icon: '💰' },
      { callSign: 'Demeter', role: 'Interview Design', rank: 'Captain', icon: '🎤' },
      { callSign: 'Persephone', role: 'Performance & Growth', rank: 'Captain', icon: '🌱' },
      { callSign: 'Artemis', role: 'Engagement & Culture', rank: 'Captain', icon: '💚' },
      { callSign: 'Iris Eden', role: 'DEI Specialist', rank: 'Captain', icon: '🌈' },
      { callSign: 'Sylvanus', role: 'People Analytics', rank: 'Captain', icon: '📊' },
    ],
    corporals: [
      { callSign: 'Seedling', role: 'JD Drafter', rank: 'Corporal', icon: '🌱' },
      { callSign: 'Sprout', role: 'Onboarding Assistant', rank: 'Corporal', icon: '🌿' },
    ],
    action: 'ws-hr',
  },
];

// ── COMPONENT ────────────────────────────────────────────────────

export default function PlatformArchitecture() {
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const [activeFlow, setActiveFlow] = useState<number | null>(null);
  const [expandedRegiment, setExpandedRegiment] = useState<string | null>(null);

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: HOW AGENTOS WORKS — USER JOURNEY
         ══════════════════════════════════════════════════════════════ */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg">🏗️</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">How AgentOS Works</h2>
              <p className="text-sm text-slate-500">The complete flow from tool connection to intelligent output — 8 steps, fully orchestrated.</p>
            </div>
          </div>
        </div>

        {/* Flow visual — horizontal timeline */}
        <div className="px-6 py-5 bg-slate-50/50">
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {PLATFORM_FLOW.map((step, i) => (
              <div key={step.step} className="flex items-start flex-shrink-0">
                {/* Step node */}
                <button
                  onClick={() => setActiveFlow(activeFlow === i ? null : i)}
                  className={`flex flex-col items-center gap-2 w-[110px] group transition-all ${activeFlow === i ? 'scale-105' : 'hover:scale-105'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${step.color} ${step.borderColor} ${step.textColor} transition-transform`}>
                    {step.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">{step.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{step.subtitle}</p>
                  </div>
                </button>
                {/* Connector arrow */}
                {i < PLATFORM_FLOW.length - 1 && (
                  <div className="flex items-center mt-5 mx-0.5 flex-shrink-0">
                    <div className="w-4 h-0.5 bg-slate-300" />
                    <svg className="w-2.5 h-2.5 text-slate-400 -ml-0.5" viewBox="0 0 10 10" fill="currentColor"><path d="M2 1 L8 5 L2 9 Z" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expanded step detail */}
        {activeFlow !== null && (
          <div className="px-6 py-5 border-t border-slate-100 bg-white">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border flex-shrink-0 ${PLATFORM_FLOW[activeFlow].color} ${PLATFORM_FLOW[activeFlow].borderColor} ${PLATFORM_FLOW[activeFlow].textColor}`}>
                {PLATFORM_FLOW[activeFlow].icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400">STEP {PLATFORM_FLOW[activeFlow].step}</span>
                  <h3 className="text-sm font-bold text-slate-900">{PLATFORM_FLOW[activeFlow].title}</h3>
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{PLATFORM_FLOW[activeFlow].description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORM_FLOW[activeFlow].details.map(d => (
                    <span key={d} className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-medium">{d}</span>
                  ))}
                </div>
                <button
                  onClick={() => setActiveSection(PLATFORM_FLOW[activeFlow].action)}
                  className="mt-3 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Go to this step →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Program Management overlay */}
        <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{OVERSIGHT_LAYER.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800">{OVERSIGHT_LAYER.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-500 font-medium">{OVERSIGHT_LAYER.subtitle}</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-relaxed mb-3">{OVERSIGHT_LAYER.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {OVERSIGHT_LAYER.items.map(item => (
                  <div key={item.label} className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: AGENT REGIMENT HIERARCHY
         ══════════════════════════════════════════════════════════════ */}
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center text-lg">👑</span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Agent Regiment Hierarchy</h2>
              <p className="text-sm text-slate-500">47 agents across 4 regiments — each with a call sign, military rank, and scoped job description.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSection('platform-agents')}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View full org model →
            </button>
          </div>
        </div>

        {/* Field Marshal — top of the chain */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-2xl">👑</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-800">Olympus</span>
                <span className="text-[11px] text-slate-500 font-medium">(Chief Orchestrator)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-800 font-bold">⭐ Field Marshal</span>
              </div>
              <p className="text-[12px] text-amber-700/70 mt-0.5">Supreme commander across all regiments. Routes requests, enforces governance, manages cross-regiment joint operations.</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-amber-600 font-semibold">High Command</p>
              <p className="text-[10px] text-slate-400">4 regiments · 47 agents</p>
            </div>
          </div>
        </div>

        {/* Chain of Command explanation */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-6 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-600">Chain of Command:</span>
            <span className="flex items-center gap-1">⭐ Field Marshal <span className="text-slate-300">→</span></span>
            <span className="flex items-center gap-1">🏅 Colonel <span className="text-slate-400">(commands regiment)</span> <span className="text-slate-300">→</span></span>
            <span className="flex items-center gap-1">🛡️ Captain <span className="text-slate-400">(leads platoon)</span> <span className="text-slate-300">→</span></span>
            <span className="flex items-center gap-1">⚔️ Corporal <span className="text-slate-400">(executes tasks)</span></span>
          </div>
        </div>

        {/* Regiment cards */}
        <div className="px-6 py-5 space-y-4">
          {REGIMENTS.map(reg => {
            const isExpanded = expandedRegiment === reg.name;
            return (
              <div key={reg.name} className={`rounded-xl border ${reg.borderColor} overflow-hidden transition-all ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
                {/* Regiment header */}
                <button
                  onClick={() => setExpandedRegiment(isExpanded ? null : reg.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 ${reg.bgColor} text-left transition-colors hover:brightness-95`}
                >
                  <span className="text-xl">{reg.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${reg.color}`}>{reg.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{reg.theme}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{reg.persona} · {1 + reg.captains.length + reg.corporals.length} agents</p>
                  </div>

                  {/* Colonel preview */}
                  <div className="flex items-center gap-2 mr-3">
                    <span className="text-lg">{reg.colonel.icon}</span>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-700">{reg.colonel.callSign}</p>
                      <p className="text-[10px] text-slate-400">{reg.colonel.rank}</p>
                    </div>
                  </div>

                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded hierarchy */}
                {isExpanded && (
                  <div className="px-4 py-4 bg-white border-t border-slate-100">
                    {/* Colonel */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200 mb-3">
                      <span className="text-2xl">{reg.colonel.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-violet-800">{reg.colonel.callSign}</span>
                          <span className="text-[11px] text-slate-500">({reg.colonel.role})</span>
                        </div>
                        <p className="text-[10px] text-violet-600 font-semibold mt-0.5">🏅 {reg.colonel.rank} — Commands the {reg.name}</p>
                      </div>
                      <button onClick={() => setActiveSection(reg.action)} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700">
                        View workspace →
                      </button>
                    </div>

                    {/* Connector */}
                    <div className="flex items-center gap-2 ml-8 mb-2">
                      <div className="w-0.5 h-4 bg-slate-200" />
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">delegates to</span>
                    </div>

                    {/* Captains */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2 ml-6">
                      {reg.captains.map(cap => (
                        <div key={cap.callSign} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                          <span className="text-lg">{cap.icon}</span>
                          <div>
                            <p className="text-[11px] font-bold text-blue-800">{cap.callSign}</p>
                            <p className="text-[10px] text-slate-500">({cap.role})</p>
                            <p className="text-[9px] text-blue-600 font-semibold">🛡️ {cap.rank}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Corporals (if any) */}
                    {reg.corporals.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 ml-12 mb-2">
                          <div className="w-0.5 h-4 bg-slate-200" />
                          <span className="text-[9px] text-slate-400 font-semibold uppercase">reports reviewed by captain</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-10">
                          {reg.corporals.map(corp => (
                            <div key={corp.callSign} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                              <span className="text-lg">{corp.icon}</span>
                              <div>
                                <p className="text-[11px] font-bold text-slate-700">{corp.callSign}</p>
                                <p className="text-[10px] text-slate-500">({corp.role})</p>
                                <p className="text-[9px] text-slate-500 font-semibold">⚔️ {corp.rank}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Fault isolation callout */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🔍</span>
            <div>
              <h3 className="text-xs font-bold text-slate-700 mb-1">Fault Isolation & Accountability</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                If a failure occurs, we trace it to the <strong>exact agent</strong> (not the entire regiment). If Apollo (SEO) fails, Hermes (Content) and Iris (Social) continue unaffected. 
                The After-Action Report shows which agent produced faulty output, which Captain should have caught it, and whether the Colonel&apos;s delegation was correct. 
                Reward high-performing agents with increased autonomy. Flag underperformers for retraining or removal from the regiment.
              </p>
            </div>
          </div>
        </div>

        {/* Rank legend */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-6 text-[10px]">
            <span className="text-slate-400 font-semibold">Military Rank → Corporate:</span>
            <span className="text-amber-700">⭐ Field Marshal = C-Level</span>
            <span className="text-violet-700">🏅 Colonel = Director / VP</span>
            <span className="text-blue-700">🛡️ Captain = Senior Lead</span>
            <span className="text-slate-600">⚔️ Corporal = Junior Worker</span>
          </div>
        </div>
      </div>
    </div>
  );
}
