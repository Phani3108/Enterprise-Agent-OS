# Enterprise Agent OS

> **AI-Powered Enterprise Operating System** — Orchestration, governance, memory, and observability for autonomous AI agent clusters.

Enterprise Agent OS (EAOS) is a full-stack platform that coordinates AI agents and external tools to automate complex enterprise workflows. It doesn't replace tools — it **orchestrates them through intelligent agents**.

---

## Demo

https://github.com/user-attachments/assets/agentos-simulation-demo.mp4

> Full simulation demo — Engineering skill execution from start to finish. [Watch on GitHub →](demos/agentos-simulation-demo.mp4)

---

## Screenshots

### Command Center
Mission control — live agent stats, recent executions, activity feed, platform health, and quick-action shortcuts.

![Command Center](docs/screenshots/01-home-command-center.png)

### Personas
Browse AI personas (Marketing, Engineering, Product) and their associated skills, tools, and agents. Each persona scopes the platform to its domain.

![Personas](docs/screenshots/02-personas.png)

### Agents
Monitor all autonomous AI agents across personas — status, model, token usage, last action, and success rates.

![Agents](docs/screenshots/05-agents.png)

### Workflow Builder
Design multi-step DAG workflows chaining agents, skills, and tools. Visual canvas with node connections and conditional branching.

![Workflow Builder](docs/screenshots/06-workflows.png)

### Connections & Tools Registry
Manage external tool integrations (HubSpot, Jira, GitHub, Slack, Salesforce, etc.) with auth types, capability mapping, latency, and usage statistics.

![Tools Registry](docs/screenshots/07-tools-registry.png)

### Prompt Library
Browse, fork, pin, and upvote curated AI prompts. Filter by persona, category, or tags. Submit recommendations and vote on community suggestions.

![Prompt Library](docs/screenshots/08-prompt-library.png)

### Observability
Live execution traces — every LLM call, tool invocation, and step. Token usage, cost, latency, and confidence metrics per execution.

![Observability](docs/screenshots/14-observability.png)

---

## Persona Hubs

Each persona hub provides a unified workspace with **Skills → Outputs → Programs → Memory** tabs, a skill configuration form with simulation mode, and a full execution pipeline.

### Engineering Hub

<table>
<tr>
<td width="50%">

**Skills** — 10 engineering skills across Code Review, Testing, Incident Response, and Documentation.

![Engineering Skills](docs/screenshots/engineering-01-skills.png)

</td>
<td width="50%">

**Outputs** — Generated reviews, test suites, docs, and RCA drafts with export actions and quality metrics.

![Engineering Outputs](docs/screenshots/engineering-02-outputs.png)

</td>
</tr>
<tr>
<td width="50%">

**Skill Form** — Adaptive inputs, file upload, severity selectors, conditional fields, and tool indicators.

![Engineering Skill Form](docs/screenshots/engineering-05-skill-form.png)

</td>
<td width="50%">

**Simulation** — Dry-run execution without real tool connections. Full pipeline, zero cost, no side effects.

![Engineering Simulation](docs/screenshots/engineering-06-simulation-mode.png)

</td>
</tr>
</table>

### Product Hub

<table>
<tr>
<td width="50%">

**Skills** — PRD Generator, Jira Epic Writer, User Story Builder, Roadmap Planner, and more.

![Product Skills](docs/screenshots/product-01-skills.png)

</td>
<td width="50%">

**Outputs** — Generated PRDs, user stories, roadmaps, and release notes with Jira/Confluence push.

![Product Outputs](docs/screenshots/product-02-outputs.png)

</td>
</tr>
<tr>
<td width="50%">

**Skill Form** — Tags for success metrics and constraints. Toggle Jira push and Confluence drafts.

![Product Skill Form](docs/screenshots/product-05-skill-form.png)

</td>
<td width="50%">

**Simulation** — Generate mock PRDs, user stories, and roadmaps without API calls.

![Product Simulation](docs/screenshots/product-06-simulation-mode.png)

</td>
</tr>
</table>

### Marketing Hub

<table>
<tr>
<td width="50%">

**Skills** — 30 marketing workflows across Campaign, Content, Creative, Event, Research, and Analytics.

![Marketing Skills](docs/screenshots/marketing-01-skills.png)

</td>
<td width="50%">

**Outputs** — Campaign assets, content drafts, analytics reports, and creative briefs with export.

![Marketing Outputs](docs/screenshots/marketing-02-outputs.png)

</td>
</tr>
<tr>
<td width="50%">

**Skill Form** — Audience targeting, channel selection, budget allocation, and content parameters.

![Marketing Skill Form](docs/screenshots/marketing-05-skill-form.png)

</td>
<td width="50%">

**Simulation** — Simulate campaigns — mock assets, analytics, and performance projections safely.

![Marketing Simulation](docs/screenshots/marketing-06-simulation-mode.png)

</td>
</tr>
</table>

---

## Simulation Platform

Run any skill or workflow in **simulation mode** — full agent orchestration, tool calls, and output generation without connecting real tools or making live API calls.

<table>
<tr>
<td width="33%">

**Engineering** — Configure → Execute → Output

![Sim Engineering](docs/screenshots/simulation-engineering-04-running.png)

</td>
<td width="33%">

**Product** — Configure → Execute → Output

![Sim Product](docs/screenshots/simulation-product-03-running.png)

</td>
<td width="33%">

**Marketing** — Configure → Execute → Output

![Sim Marketing](docs/screenshots/simulation-marketing-03-running.png)

</td>
</tr>
</table>

---

## Platform Operations

<table>
<tr>
<td width="25%">

**Skill Marketplace** — Discover, search, and install skills. Filter by category, status, ratings.

![Marketplace](docs/screenshots/03-skill-marketplace.png)

</td>
<td width="25%">

**Knowledge Explorer** — Search Confluence, GitHub, Jira with source attribution and relevance scoring.

![Knowledge](docs/screenshots/09-knowledge-explorer.png)

</td>
<td width="25%">

**Control Plane** — Metric sparklines, agent runtime, skill router decisions, live logs, service health.

![Control Plane](docs/screenshots/10-control-plane.png)

</td>
<td width="25%">

**Memory Graph** — Force-directed graph of skill/agent/tool relationships. Filter, search, inspect.

![Memory Graph](docs/screenshots/11-memory-graph.png)

</td>
</tr>
<tr>
<td width="25%">

**Agent Collaboration** — Agent-to-agent message flows with animated messages, edge labels, and payloads.

![Agent Collab](docs/screenshots/12-agent-collaboration.png)

</td>
<td width="25%">

**Governance** — License tracking, cost attribution, access management, audit log, compliance checks.

![Governance](docs/screenshots/13-governance.png)

</td>
<td width="25%">

**AI Learning Hub** — Curated courses, 5-day roadmap, platform providers, and adoption metrics.

![Learning Hub](docs/screenshots/15-learning-hub.png)

</td>
<td width="25%">

**Scheduler** — Cron jobs, event triggers, retry policies, and execution history with status tracking.

![Scheduler](docs/screenshots/16-scheduler.png)

</td>
</tr>
</table>

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                 │
│  Sidebar │ Command Bar │ Main Content │ Activity Stream  │
├──────────┴─────────────┴──────────────┴─────────────────┤
│                    Gateway API (Node.js)                 │
│  /api/query │ /api/skills │ /api/prompts │ /api/courses  │
├─────────────────────────────────────────────────────────┤
│              Agent Graph Runtime (LangGraph)             │
│  Orchestrator → Agents → Tools → Checkpoints → Storage  │
├─────────────────────────────────────────────────────────┤
│  Tool Capability Graph │ Memory Pipeline │ Policy Engine │
├─────────────────────────────────────────────────────────┤
│  Connectors: Jira │ GitHub │ Slack │ Confluence │ etc.  │
└─────────────────────────────────────────────────────────┘
```

### Core Principles

```
User Intent → Skill Detection → Agent Deployment → Tool Selection
     → Workflow Orchestration → Execution → Human Checkpoints → Asset Storage
```

---

## Features

### Core Platform
- **Agents** — 12+ autonomous workers with multi-step execution pipelines
- **Workflows** — DAG-based pipelines chaining agents and tools
- **Knowledge Explorer** — Search across Confluence, GitHub, Jira with source attribution
- **Skills** — Reusable AI capabilities with success rates and quality tiers
- **Command Bar** — Natural language queries with intent classification (Cmd+K)

### Prompt Library
- **13+ curated prompts** across engineering, QA, SRE, architecture categories
- **Community skills** curated from 6 open-source repositories
- **Fork, pin, upvote, flag** — full engagement lifecycle
- **Recommendations** — Users submit and vote on new prompt ideas
- **Target tools** — Cursor, GitHub Copilot, Claude, ChatGPT, Office Copilot

### AI Learning Hub
- **10 Platform Providers** — Anthropic, Google, Meta, NVIDIA, Microsoft, OpenAI, IBM, AWS, DeepLearning.AI, Hugging Face
- **5-Day Roadmap** — Visual milestone journey covering AI Agents, MCP, Memory, Quality, Production
- **24 Courses** — Categorized, filterable, with engagement tracking
- **Organization Stats** — Aggregate views, likes, pins to measure AI adoption

### Marketing Agent Graph (SOMAN)
- **12 Specialized Agents** — Orchestrator, Strategy, Research, Competitor, Copy, Design, Landing Page, Campaign, Analytics, Optimization, SEO, Email
- **Self-Optimizing Loop** — Agents learn from campaign outcomes and adapt automatically
- **Tool Marketplace** — 16 connectors (Canva, DALL-E, LinkedIn Ads, HubSpot, GA4, etc.)
- **10 Marketing Skills** — Campaign Builder, Content Creation, Creative Design, and more
- **Human-in-the-Loop** — Approval checkpoints before critical actions
- **3 Optimization Modes** — Manual, Assisted, Autonomous

### Tool Capability Graph
- **Dynamic tool selection** — Maps tasks → capabilities → tools
- **20 capabilities** across content, visual, layout, campaign, analytics, research, storage
- **22 tool nodes** with priority, cost tier, and latency rankings
- **Execution planning** — Query graph for optimal tool chains

### Observability
- **Execution traces** — Every LLM call, tool invocation, memory retrieval
- **Token usage and cost tracking** — Per-query cost analysis
- **Confidence and grounding scores** — Quality metrics on every response

### Engineering Hub
- **10 Engineering Skills** — PR Review, PR Summary, Unit Test Generator, Code Documentation, CI Failure Diagnosis, Incident RCA Draft, Dependency Audit, Architecture Review, API Contract Validator, Performance Profiler
- **Smart Skill Forms** — adaptive field types: multiselect, tags, toggles, file upload, conditional `dependsOn` fields
- **Live / Sandbox run modes** — test without real API calls
- **Tool strip** — shows Claude (always connected), GitHub, Jira, Sentry, Datadog, PagerDuty connection states

### Product Hub
- **10 Product Skills** — PRD Generator, BRD Generator, Jira Epic Generator, User Story Writer, Acceptance Criteria Generator, Roadmap Builder, Competitor Analysis Brief, Release Notes, Stakeholder Update, Customer Feedback Synthesizer
- **Jira + Confluence integration** — push epics and drafts directly from skill forms
- **Tags fields** for success metrics, constraints, and stakeholders
- **Violet accent** distinguishes product workflows from engineering (slate) and marketing (emerald)

### Guided Tour
- **21-step interactive tour** covering all sections including Engineering and Product Hubs
- **Onboarding modal** for first-time users
- **Keyboard navigation** (Arrow keys, Escape, Enter)
- **Help menu** with tour restart

### Simulation Platform
- **Dry-run execution** — Run any skill without real tool connections or API calls
- **Full pipeline simulation** — All agents, steps, and checkpoints execute as normal
- **Mock output generation** — Realistic synthetic outputs for review and testing
- **Zero cost** — No token usage, no external API charges
- **Cross-persona** — Available for Engineering, Product, and Marketing hubs
- **Safe testing** — No side effects on production systems or data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| Gateway API | Node.js HTTP server, TypeScript |
| State Management | Zustand |
| Data Fetching | TanStack React Query |
| Monorepo | pnpm workspaces + Turborepo |
| Schemas | JSON Schema (skills, tools, prompts, workflows, workers, policies) |
| Database | PostgreSQL (Prisma for Prompt Library) |
| Agent Runtimes | LangGraph (default), AutoGen, CrewAI, Custom |
| Connectors | Jira, GitHub, Slack, Confluence |

---

## Project Structure

```
Enterprise-Agent-OS/
├── apps/
│   └── web/                    # Next.js 14 frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # UI components
│           │   ├── MarketingHub.tsx
│           │   ├── PromptLibrary.tsx
│           │   ├── AICoursesHub.tsx
│           │   ├── ToolsRegistry.tsx
│           │   ├── Workspace.tsx
│           │   ├── Sidebar.tsx
│           │   ├── CommandBar.tsx
│           │   └── tour/       # Guided tour system
│           ├── store/          # Zustand stores
│           └── lib/            # API client, tour data, utils
├── services/
│   ├── gateway/                # API gateway (Node.js)
│   ├── orchestrator/           # Mother orchestrator
│   ├── cognitive-engine/       # LLM reasoning
│   ├── reliability-engine/     # Grounding & validation
│   ├── skills-runtime/         # Skill execution
│   ├── learning-engine/        # AI learning engine
│   ├── memory/                 # Memory pipeline
│   └── workspace-api/          # Workspace management
├── packages/
│   ├── schemas/                # JSON schemas (skill, tool, prompt, workflow)
│   ├── kernel/                 # Core kernel
│   ├── knowledge/              # Knowledge base
│   ├── policy/                 # Policy engine
│   ├── events/                 # Event system
│   ├── db/                     # Database & migrations
│   ├── llm/                    # LLM abstractions
│   └── ...                     # 20+ packages
├── connectors/
│   ├── jira/                   # Jira connector
│   ├── github/                 # GitHub connector
│   ├── slack/                  # Slack connector
│   └── teams/                  # Teams connector
├── workers/
│   ├── developer-knowledge/    # Engineering knowledge worker
│   ├── incident-intelligence/  # Incident analysis worker
│   └── transcript-actions/     # Transcript processing
├── agents/
│   └── marketing/              # Marketing Agent Graph (SOMAN)
│       ├── orchestrator/       # Marketing Orchestrator
│       ├── agents/             # 11 specialist agents
│       ├── graph_runtime/      # Agent collaboration graph
│       ├── skills/             # 10 marketing skills
│       ├── tools/              # 14 tool connectors
│       └── memory/             # Campaign memory schema
├── Prompt Library/             # Prompt Library (Prisma-based)
└── docs/
    └── screenshots/            # App screenshots
```

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

```bash
git clone https://github.com/Phani3108/Enterprise-Agent-OS.git
cd Enterprise-Agent-OS
pnpm install
```

### Running the App

Start both the Gateway API and the Frontend:

```bash
# Terminal 1 — Gateway API (port 3000)
cd services/gateway
npx tsx src/server.ts

# Terminal 2 — Frontend (port 3010)
cd apps/web
pnpm dev
```

Open [http://localhost:3010](http://localhost:3010) in your browser.

### First Time?

The app will show an **onboarding modal** on your first visit. After that, use the **Help menu** (top-right) to restart the guided tour anytime.

---

## Guided Tour

The app includes a 29-step interactive guided tour that covers:

| Step | Section | What You Learn |
|------|---------|---------------|
| 1-2 | Welcome + Nav | Sidebar navigation, Mission Control overview |
| 3 | Intent Router | Natural language skill routing |
| 4-6 | Core Skills | Persona selector, Skills dashboard, Execution panel |
| 7 | Governance | License tracking and Corp IT dashboard |
| 8-10 | Navigation | Agents, Workflows, Skill Marketplace |
| 11-13 | Tools + Content | Tools registry, Prompt Library, Knowledge |
| 14 | Learning | AI courses and 5-day roadmap |
| 15-16 | Engineering Hub | Command Center, smart skill forms |
| 17-18 | Product Hub | PRD/Jira/Roadmap skills, tags and toggle fields |
| 19 | Tool Strip | Connected vs unconnected tool indicators |
| 20-21 | Completion | Full platform ready, tour restart |

**Keyboard shortcuts**: Arrow keys to navigate, Escape to skip, Enter to advance.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/query` | Natural language query |
| GET | `/api/skills` | Skill catalog |
| GET | `/api/prompts` | Prompt library (with filters) |
| POST | `/api/prompts/:id/vote` | Upvote/downvote prompt |
| POST | `/api/prompts/:id/fork` | Fork a prompt |
| GET | `/api/recommendations` | User-submitted suggestions |
| GET | `/api/tools` | Tools registry |
| GET | `/api/courses/stats` | Course engagement stats |
| GET | `/api/capability-graph` | Tool capability graph |
| POST | `/api/capability-graph/plan` | Generate execution plan |
| GET | `/api/engineering/skills` | Engineering skill catalog |
| POST | `/api/engineering/execute` | Execute an engineering skill |
| GET | `/api/engineering/executions/:id` | Poll execution status |
| GET | `/api/product/skills` | Product skill catalog |
| POST | `/api/product/execute` | Execute a product skill |
| GET | `/api/product/executions/:id` | Poll execution status |
| POST | `/api/tools/:id/connect` | Save tool credentials |
| POST | `/api/tools/:id/test` | Test tool connection |
| GET | `/api/health` | Gateway health check |

---

## Marketing Agent Graph (SOMAN)

The Self-Optimizing Marketing Agent Network is a collaborative AI agent system where agents reason together through shared state:

```
                     Marketing Orchestrator
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   Research Agent       Strategy Agent       Analytics Agent
         │                    │                    │
         ├──────────┐         │         ┌──────────┤
         │          │         │         │          │
    SEO Agent  Competitor     │    Copy Agent  Campaign Agent
                 Agent        │         │
                              │    Design Agent
                              │         │
                         Email Agent  Landing Page Agent
                                        │
                              Optimization Agent ◀── Feedback Loop
```

**Optimization Loop**: Campaign → Performance Signals → Analytics → Optimization → Strategy Adjust → Creative Regen → New Campaign

---

## Schemas

All definitions are validated against JSON schemas in `packages/schemas/`:

- `skill.schema.json` — Skill definitions
- `tool.schema.json` — Tool connectors
- `prompt.schema.json` — Prompt library entries
- `workflow.schema.json` — Workflow definitions
- `worker.schema.json` — Worker configurations
- `event.schema.json` — Event types
- `policy.schema.json` — Policy rules
- `capability-graph.schema.json` — Tool capability graph

---

## License

MIT

---

## Author

**Created & developed by [Phani Marupaka](https://linkedin.com/in/phani-marupaka)**

&copy; 2026 Phani Marupaka. All rights reserved.

Unauthorized reproduction, distribution, or modification of this software, in whole or in part, is strictly prohibited under applicable trademark and copyright laws including but not limited to the Digital Millennium Copyright Act (DMCA), the Lanham Act (15 U.S.C. &sect; 1051 et seq.), and equivalent international intellectual property statutes. This software contains embedded provenance markers and attribution watermarks that are protected under 17 U.S.C. &sect; 1202 (integrity of copyright management information). Removal or alteration of such markers constitutes a violation of federal law.

---

Built with Next.js, TypeScript, Tailwind CSS, and a lot of AI agents.
