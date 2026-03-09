/**
 * Guided Tour — 25-step tour data model
 *
 * Each step targets a data-tour attribute on a DOM element.
 */

export interface TourStep {
    id: string;
    title: string;
    description: string;
    target: string; // data-tour selector value
    placement?: 'top' | 'bottom' | 'left' | 'right';
    exampleInput?: string;
    expectedOutput?: string;
}

export const TOUR_STEPS: TourStep[] = [
    // ── Sidebar core ──
    {
        id: 'sidebar-logo',
        title: 'Welcome to EOS',
        description: 'This is your Enterprise Operating System — an AI-powered internal platform that connects knowledge, automates workflows, and accelerates every team.',
        target: 'sidebar-logo',
        placement: 'right',
    },
    {
        id: 'sidebar-home',
        title: 'Home — Mission Control',
        description: 'Your dashboard. See live stats, recent executions, quick actions, and gateway health at a glance. This is where you start every session.',
        target: 'sidebar-home',
        placement: 'right',
    },
    {
        id: 'sidebar-agents',
        title: 'Agents',
        description: 'Autonomous AI agents that execute multi-step tasks. Agents combine skills, connectors, and memory to accomplish complex goals like incident analysis or campaign planning.',
        target: 'sidebar-agents',
        placement: 'right',
        exampleInput: '"Analyze incident INC-3421 on payments"',
        expectedOutput: 'Root cause hypothesis, evidence links, remediation steps',
    },
    {
        id: 'sidebar-workflows',
        title: 'Workflows',
        description: 'Visual DAG-based pipelines that chain agents and tools together. Great for repeatable multi-step processes like PR review, content pipelines, or incident response.',
        target: 'sidebar-workflows',
        placement: 'right',
        exampleInput: 'Select a workflow template or build from scratch',
        expectedOutput: 'Step-by-step execution with status, approvals, and outputs',
    },
    {
        id: 'sidebar-knowledge',
        title: 'Knowledge Explorer',
        description: 'Search across all internal knowledge — Confluence, GitHub, Jira, transcripts, blog posts, and microsites. Results are ranked by relevance with source attribution.',
        target: 'sidebar-knowledge',
        placement: 'right',
        exampleInput: '"card authorization architecture"',
        expectedOutput: 'Ranked results from Confluence, GitHub, Jira with excerpts and relevance scores',
    },
    {
        id: 'sidebar-skills',
        title: 'Skill Library',
        description: 'Reusable AI capabilities like "Incident Root Cause Analysis" or "Campaign Strategy". Each skill has a success rate, average latency, and quality tier.',
        target: 'sidebar-skills',
        placement: 'right',
    },
    {
        id: 'sidebar-projects',
        title: 'Projects',
        description: 'Organize related queries, executions, and workflows into project spaces. Useful for tracking long-running initiatives across teams.',
        target: 'sidebar-projects',
        placement: 'right',
    },
    // ── Domains ──
    {
        id: 'sidebar-engineering',
        title: 'Engineering Domain',
        description: 'Engineering-specific tools: service architecture search, incident analysis, PR reviews, runbook generation, and deployment analysis.',
        target: 'sidebar-engineering',
        placement: 'right',
    },
    {
        id: 'sidebar-marketing',
        title: 'Marketing Domain',
        description: 'Marketing execution tools: ICP analysis, campaign strategy, content generation, email sequences, and competitive analysis.',
        target: 'sidebar-marketing',
        placement: 'right',
    },
    {
        id: 'sidebar-learning',
        title: 'Learning Mode',
        description: 'Internal AI academy. Ask EOS to teach you any topic — it generates structured lessons with explanations, architecture diagrams, code examples, and exercises.',
        target: 'sidebar-learning',
        placement: 'right',
        exampleInput: '"Teach me how to build a RAG pipeline"',
        expectedOutput: 'Structured tutorial with sections, code examples, exercises, and internal references',
    },
    // ── System ──
    {
        id: 'sidebar-activity',
        title: 'Activity History',
        description: 'Full audit trail of every query, execution, and workflow run. See who ran what, when, and what the output was.',
        target: 'sidebar-activity',
        placement: 'right',
    },
    {
        id: 'sidebar-observability',
        title: 'Observability',
        description: 'Execution traces showing every LLM call, tool invocation, memory retrieval, and policy check — with duration, token usage, and cost.',
        target: 'sidebar-observability',
        placement: 'right',
    },
    {
        id: 'sidebar-about',
        title: 'About EOS',
        description: 'Deep-dive into what EOS is, how it works, core concepts, input/output examples, demo videos, and security information.',
        target: 'sidebar-about',
        placement: 'right',
    },
    // ── Command surface ──
    {
        id: 'command-bar',
        title: 'Command Bar — Talk to EOS',
        description: 'The primary input surface. Type any natural language query and EOS will classify intent, route to the right agent/skill, and return a structured response. Use ⌘K to focus.',
        target: 'command-bar',
        placement: 'bottom',
        exampleInput: '"Explain the card authorization service"',
        expectedOutput: 'Service summary, key components, dependencies, owners, related docs and code — with confidence score',
    },
    // ── Stats ──
    {
        id: 'stats-bar',
        title: 'Live Stats',
        description: 'Real-time metrics from the gateway: total queries today, active skills, average confidence, average latency, grounding score, and gateway status.',
        target: 'stats-bar',
        placement: 'bottom',
    },
    // ── Quick actions ──
    {
        id: 'quick-actions',
        title: 'Quick Actions',
        description: 'One-click shortcuts to common tasks. Each button pre-fills the command bar with a relevant query so you can get started immediately.',
        target: 'quick-actions',
        placement: 'bottom',
        exampleInput: 'Click "Analyze Incident"',
        expectedOutput: 'Command bar pre-fills with an incident analysis query',
    },
    // ── Executions ──
    {
        id: 'recent-executions',
        title: 'Recent Executions',
        description: 'Cards showing recent query results with full execution details: confidence, grounding score, duration, step-by-step pipeline, and linked sources.',
        target: 'recent-executions',
        placement: 'bottom',
    },
    {
        id: 'execution-card',
        title: 'Execution Card — Deep Dive',
        description: 'Each card shows the full execution pipeline: which tools were called, how long each step took, what sources were used, and the final confidence and grounding scores.',
        target: 'execution-card',
        placement: 'left',
    },
    // ── Activity timeline ──
    {
        id: 'activity-stream',
        title: 'Activity Stream',
        description: 'Real-time feed of execution events: intent classification, tool calls (Confluence, GitHub, Jira), LLM synthesis, and grounding validation — all timestamped.',
        target: 'activity-stream',
        placement: 'left',
    },
    {
        id: 'execution-pipeline',
        title: 'Execution Pipeline',
        description: 'Step-by-step trace of how EOS processed a query. Each step shows the type (reasoning, tool, phase, output), what happened, and when.',
        target: 'execution-pipeline',
        placement: 'left',
    },
    // ── Header ──
    {
        id: 'gateway-status',
        title: 'Gateway Status',
        description: 'Shows whether the EOS Gateway API is connected. The gateway handles all requests — when it\'s green, all features are live.',
        target: 'gateway-status',
        placement: 'bottom',
    },
    // ── New sections ──
    {
        id: 'sidebar-prompts',
        title: 'Prompt Library',
        description: 'Browse, search, and fork curated AI prompts. Filter by source (platform, community, user), category, or tags. Upvote, flag, pin, or fork prompts for your own use. Submit recommendations for new prompts.',
        target: 'sidebar-prompts',
        placement: 'right',
    },
    {
        id: 'sidebar-tools',
        title: 'Tools Registry',
        description: 'Internal tools that power AgentOS — view all available connectors, their auth types, usage stats, latency, and success rates. Toggle between grid and table views.',
        target: 'sidebar-tools',
        placement: 'right',
    },
    {
        id: 'sidebar-learning-courses',
        title: 'AI Learning Hub',
        description: 'Your AI education center. Browse 10 major learning platforms, follow a 5-day agent development roadmap, and explore 24 curated courses. Track likes, pins, and views across the organization to measure AI adoption.',
        target: 'sidebar-learning',
        placement: 'right',
    },
    {
        id: 'marketing-hub',
        title: 'Marketing Agent Network',
        description: 'Self-Optimizing Marketing Agent Network (SOMAN). 12 collaborative agents replace human marketing tasks — orchestrating tools like Claude, Canva, LinkedIn Ads, and HubSpot. Includes a tool marketplace, skill registry, execution timeline, and optimization loop that learns from campaign performance.',
        target: 'marketing-hub',
        placement: 'bottom',
    },
    // ── Advanced concepts ──
    {
        id: 'sidebar-settings',
        title: 'Settings & Help',
        description: 'Access settings, restart the guided tour, reopen onboarding, view keyboard shortcuts, and configure your EOS experience.',
        target: 'sidebar-settings',
        placement: 'right',
    },
    {
        id: 'help-menu',
        title: 'Help Menu',
        description: 'Quick access to restart this tour, re-run onboarding, open the About page, view demo videos, and see keyboard shortcuts.',
        target: 'help-menu',
        placement: 'top',
    },
    {
        id: 'evidence-sources',
        title: 'Evidence & Sources',
        description: 'Every EOS response includes linked evidence — the actual Confluence pages, GitHub repos, Jira tickets, and transcripts that informed the answer. Nothing is hallucinated without attribution.',
        target: 'evidence-sources',
        placement: 'left',
    },
    {
        id: 'tour-complete',
        title: 'You\'re Ready!',
        description: 'That\'s the full tour. Start with the command bar (⌘K), try a quick action, or explore the sidebar. You can restart this tour anytime from Settings → Help.',
        target: 'command-bar',
        placement: 'bottom',
    },
];
