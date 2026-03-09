# EAOS Frontend Architecture

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | SSR, RSC, streaming |
| UI Library | MUI 5 + Tailwind CSS 3 | Components + layout |
| State | Zustand | Lightweight store |
| Data | TanStack Query | Server state |
| Visualization | React Flow + SVG | Workflow graphs |
| Animation | Framer Motion + CSS | Micro-interactions |
| Real-time | WebSocket / SSE | Live agent streams |

## Layout

```
┌──────────┬──────────────────────────────────────────┬─────────────┐
│          │  ⌘K  Ask EAOS anything...                │             │
│          ├──────────────────────────────────────────┤             │
│          │                                          │   Agent     │
│ Sidebar  │  Stats Bar (6 KPIs)                     │  Activity   │
│          │                                          │  Timeline   │
│ 12 items │  Quick Actions (6 cards)                │             │
│ 3 groups │                                          │  Live       │
│          │  Execution Cards                         │  Events     │
│          │  ├ Goal + Domain                         │             │
│          │  ├ Progress Bar                          │  Reasoning  │
│          │  ├ Step Timeline                         │  Tool Calls │
│          │  ├ Confidence + Grounding                │  Outputs    │
│          │  └ Evidence Sources                      │             │
│          │                                          │             │
│ Status:  │  Workflow Builder                        │  🟢 Live    │
│ 7 up     │  Knowledge Explorer                     │             │
└──────────┴──────────────────────────────────────────┴─────────────┘
```

## Component Map

| Component | File | Features |
|-----------|------|----------|
| Sidebar | `Sidebar.tsx` | Collapsible, 3 sections, active state, status footer |
| CommandBar | `CommandBar.tsx` | ⌘K shortcut, 8 suggestions, keyboard nav, domain tags |
| Workspace | `Workspace.tsx` | Composes StatsBar + QuickActions + ExecutionCards |
| ExecutionCard | `ExecutionCard.tsx` | Expandable, progress bar, step timeline, trust metrics |
| StatsBar | `StatsBar.tsx` | 6 KPI cards with glass styling |
| QuickActions | `QuickActions.tsx` | 6 domain-colored gradient cards |
| ActivityTimeline | `ActivityTimeline.tsx` | Live event stream, connector lines |
| WorkflowBuilder | `WorkflowBuilder.tsx` | Visual DAG, 6 node types, SVG edges |
| KnowledgeExplorer | `KnowledgeExplorer.tsx` | 6-source search, relevance bars |
| SkillLibrary | `SkillLibrary.tsx` | 8 skills, success rates, latency |
| ObservabilityPanel | `ObservabilityPanel.tsx` | Waterfall trace, token/cost summary |
| NotificationPanel | `NotificationPanel.tsx` | Color-coded cards |

## Design System

- **Theme**: Dark mission control (`#0a0a0f` background)
- **Surfaces**: Glass effect with `backdrop-filter: blur(20px)`
- **Accent**: Indigo `#6366f1` with glow effects
- **Typography**: Inter (UI) + JetBrains Mono (code/metrics)
- **Animations**: Pulse glow, slide-up, fade-in transitions
