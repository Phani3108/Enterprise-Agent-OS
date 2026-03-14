'use client';

/**
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

/**
 * About Page — Rich, information-dense page explaining EOS
 */

import { useState } from 'react';
import { DemoVideoCard, DEMO_VIDEOS } from './about/DemoVideoCard';

// ── Section container ──
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <section className="mb-10">
            <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-4">
                <span className="text-xl">{icon}</span>
                {title}
            </h2>
            {children}
        </section>
    );
}

// ── Concept card ──
function ConceptCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="text-2xl mb-3">{icon}</div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>
    );
}

// ── Input/Output example ──
function IOExample({ title, icon, input, output, inputLabel, outputLabel }: {
    title: string; icon: string; input: string; output: string; inputLabel?: string; outputLabel?: string;
}) {
    const [copied, setCopied] = useState(false);
    const copyInput = () => {
        navigator.clipboard.writeText(input).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-bold text-slate-900">{title}</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200">
                <div className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-accent/80 font-semibold mb-2">
                        {inputLabel ?? 'Input'}
                    </div>
                    <div className="flex items-start gap-2">
                        <p className="text-xs text-slate-700 font-mono leading-relaxed flex-1">{input}</p>
                        <button
                            onClick={copyInput}
                            className="text-[11px] text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                            title="Copy to clipboard"
                        >
                            {copied ? '✓' : '📋'}
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold mb-2">
                        {outputLabel ?? 'Output'}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{output}</p>
                </div>
            </div>
        </div>
    );
}

// ── Feature matrix row ──
function FeatureRow({ feature, when, input, output }: { feature: string; when: string; input: string; output: string }) {
    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-4 text-sm font-bold text-slate-900">{feature}</td>
            <td className="py-3 px-4 text-xs text-slate-600">{when}</td>
            <td className="py-3 px-4 text-xs text-slate-700 font-mono">{input}</td>
            <td className="py-3 px-4 text-xs text-slate-600">{output}</td>
        </tr>
    );
}

// ── FAQ item ──
function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
                <span className="text-sm font-bold text-slate-900">{q}</span>
                <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="px-4 pb-4 text-sm text-slate-700 font-medium leading-relaxed border-t border-slate-100">
                    {a}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════
// Main About Page Component
// ══════════════════════════════════════════════

export default function AboutPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto overflow-y-auto bg-slate-50 min-h-full">
            {/* Hero */}
            <div className="text-center mb-12 pt-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                    ⚡
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Enterprise Operating System</h1>
                <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
                    An AI-powered platform that connects internal knowledge, automates workflows, and accelerates every team — Engineering, Marketing, Product, and Leadership.
                </p>
            </div>

            {/* ── What EOS Is ── */}
            <Section title="What EOS Is" icon="💡">
                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">
                        EOS is an internal AI operating layer that sits on top of your company&apos;s existing systems — Confluence, GitHub, Jira, Slack, CRM, analytics tools — and makes them accessible through a single natural language interface.
                    </p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        Instead of switching between 12 tools, you ask EOS one question and it orchestrates the right agents, skills, and connectors to deliver a structured, grounded answer with source attribution.
                    </p>
                </div>
            </Section>

            {/* ── Problems It Solves ── */}
            <Section title="What Problems It Solves" icon="🎯">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: '🔍', title: 'Knowledge Silos', desc: 'Information trapped in Confluence, Slack, GitHub, emails. EOS unifies search across all sources.' },
                        { icon: '🐌', title: 'Slow Investigations', desc: 'Incident analysis takes hours of manual digging. EOS pulls metrics, logs, deploys, and past incidents in seconds.' },
                        { icon: '🔄', title: 'Repetitive Work', desc: 'Meeting summaries, PR reviews, campaign planning — EOS automates the repeateable parts.' },
                        { icon: '🧠', title: 'Institutional Memory', desc: 'Tribal knowledge leaves when people do. EOS preserves and surfaces organizational knowledge.' },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <span className="text-lg">{item.icon}</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-2 mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Core Concepts ── */}
            <Section title="Core Concepts" icon="🧱">
                <div className="grid grid-cols-3 gap-3">
                    <ConceptCard icon="🤖" title="Agents" description="Autonomous AI workers that execute multi-step tasks. Each agent has a domain focus (engineering, marketing, etc.), access to specific tools, and follows governed policies." />
                    <ConceptCard icon="🧩" title="Skills" description="Reusable capabilities like 'Incident Root Cause Analysis' or 'Campaign Strategy'. Skills have success rates, latency metrics, and quality tiers (beta → production → certified)." />
                    <ConceptCard icon="⚡" title="Workflows" description="DAG-based pipelines that chain agents and tools. Define steps, conditions, approval gates, and retry policies. Visual builder or YAML definitions." />
                    <ConceptCard icon="📚" title="Knowledge" description="Unified search across all internal systems — Confluence, GitHub, Jira, transcripts, blogs. Results ranked by relevance with source attribution." />
                    <ConceptCard icon="🔌" title="Connectors" description="Integrations with external tools: Slack, GitHub, Jira, email, GA4, CRM. Connectors enable agents to read and write to the systems your teams already use." />
                    <ConceptCard icon="🔍" title="Observability" description="Every execution is traced: LLM calls, tool invocations, memory retrievals, policy checks. See token usage, duration, cost, and grounding scores." />
                </div>
            </Section>

            {/* ── Input/Output Examples ── */}
            <Section title="Input & Output Examples" icon="📝">
                <div className="space-y-4">
                    <IOExample
                        icon="📖" title="Service Explanation"
                        input="Explain the card authorization service"
                        output="Service summary, key components (API Gateway, Risk Engine, Token Service), dependencies (PostgreSQL, Redis, Kafka), owners (@platform-eng), related docs, related code"
                    />
                    <IOExample
                        icon="🚨" title="Incident Analysis"
                        input="Analyze incident INC-3421"
                        output="Summary, possible causes with confidence scores, evidence from Grafana/Kibana, affected systems, recent deployments, remediation steps"
                    />
                    <IOExample
                        icon="📋" title="Transcript → Actions"
                        input="Summarize meeting transcript and create action items"
                        output="Meeting summary, decisions made, action items with owners and due dates, draft Jira tickets"
                    />
                    <IOExample
                        icon="📊" title="Marketing Campaign"
                        input="Create campaign for community banks around card modernization"
                        output="ICP definition, messaging framework, channel strategy, content calendar, email sequences, KPIs"
                    />
                    <IOExample
                        icon="🎓" title="Learning Mode"
                        input="Teach me how to build RAG using our internal stack"
                        output="Structured tutorial: explanation → architecture → code examples → exercises → internal references"
                    />
                </div>
            </Section>

            {/* ── When to Use What ── */}
            <Section title="When to Use What" icon="🗺️">
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="py-3 px-4 text-left text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Feature</th>
                                <th className="py-3 px-4 text-left text-[11px] uppercase tracking-wider text-slate-600 font-semibold">When to Use</th>
                                <th className="py-3 px-4 text-left text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Example Input</th>
                                <th className="py-3 px-4 text-left text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Output Shape</th>
                            </tr>
                        </thead>
                        <tbody>
                            <FeatureRow feature="Command Bar" when="Quick questions, ad-hoc queries" input="⌘K → type question" output="Structured JSON with sources" />
                            <FeatureRow feature="Knowledge" when="Research, understanding systems" input="Search query" output="Ranked docs with excerpts" />
                            <FeatureRow feature="Agents" when="Complex multi-step tasks" input="Natural language goal" output="Multi-stage execution" />
                            <FeatureRow feature="Workflows" when="Repeatable processes" input="Trigger or schedule" output="Step-by-step artifacts" />
                            <FeatureRow feature="Skills" when="Browse available capabilities" input="Filter by domain" output="Skill cards with metrics" />
                            <FeatureRow feature="Learning" when="Upskilling, tutorials" input="&quot;Teach me X&quot;" output="Tutorial with code + exercises" />
                            <FeatureRow feature="Observability" when="Audit, debug, understand cost" input="View any execution" output="Trace waterfall + cost" />
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* ── Demo Videos ── */}
            <Section title="Demo Videos" icon="🎬">
                <div className="grid grid-cols-3 gap-4">
                    {DEMO_VIDEOS.map(video => (
                        <DemoVideoCard key={video.id} video={video} />
                    ))}
                </div>
            </Section>

            {/* ── Security & Trust ── */}
            <Section title="Security, Privacy & Trust" icon="🔒">
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: '🔐', title: 'Authentication', desc: 'JWT + API key auth. Every request is authenticated and attributed to a user.' },
                        { icon: '🛡️', title: 'RBAC', desc: 'Role-Based Access Control — admins, engineers, viewers with domain-scoped permissions.' },
                        { icon: '📝', title: 'Audit Trail', desc: 'Immutable log of every query, execution, and approval. Full attribution chain.' },
                        { icon: '✅', title: 'Grounding', desc: 'Every response includes a grounding score — how well the answer is supported by actual sources vs. model inference.' },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <span className="text-lg">{item.icon}</span>
                            <h4 className="text-sm font-bold text-slate-900 mt-2 mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── FAQ ── */}
            <Section title="FAQ & Getting Started" icon="❓">
                <div className="space-y-3">
                    <FAQItem q="What do I need to get started?" a="Nothing! Just start typing in the Command Bar (⌘K). EOS handles intent classification, agent routing, and tool orchestration behind the scenes." />
                    <FAQItem q="Are responses real-time?" a="Yes. The Gateway processes queries in real-time: intent classification (< 50ms), tool calls (1-5s each), LLM synthesis (2-8s). Total typically 5-15s." />
                    <FAQItem q="Can I trust the answers?" a="Every response comes with a confidence score and grounding score. Sources are linked so you can verify. Grounding scores above 80% mean strong source support." />
                    <FAQItem q="What if EOS doesn't know something?" a="Low confidence responses are flagged clearly. EOS will tell you when it's unsure and suggest alternative approaches or human experts." />
                    <FAQItem q="Can I automate recurring tasks?" a="Yes — use Workflows to define DAG-based pipelines that run on schedule or trigger. Combine agents, tools, approval gates, and conditions." />
                    <FAQItem q="How do I see what EOS did?" a="Click the Observability panel. Every execution shows a waterfall trace of every LLM call, tool invocation, and policy check — with duration, tokens, and cost." />
                    <FAQItem q="Who can see my queries?" a="Queries are attributed to your user account. Admins can view the audit trail. Data is scoped by team and role. No cross-tenant visibility." />
                </div>
            </Section>

            {/* Footer */}
            <div className="text-center py-8 border-t border-slate-200 mt-8">
                <p className="text-xs text-slate-600">
                    EOS v0.1.0 — Built with Next.js, TypeScript, and 🧠
                </p>
            </div>
        </div>
    );
}
