# EOS Implementation Backlog

> Ordered for shipping a respectable internal platform quickly, not completing architecture exercises.

---

## Epic 1: Make It Actually Work (Weeks 1-2)

> **Goal:** One vertical slice from user input to structured output.

### Milestone 1.1: LLM Client
- [ ] Unified `LLMClient` with OpenAI provider
- [ ] Streaming support (SSE-compatible)
- [ ] Structured output mode (JSON schema enforcement)
- [ ] Token counting and cost tracking
- [ ] Retry with exponential backoff
- **Owner:** Platform · **DoD:** Worker can call LLM and get typed response

### Milestone 1.2: Postgres Persistence
- [ ] Skills repository (CRUD, versioning, search)
- [ ] Workflow execution state persistence
- [ ] Approval request persistence
- [ ] Session persistence for Workspace API
- [ ] Database migration system (simple SQL files)
- **Owner:** Platform · **DoD:** Server restarts don't lose state

### Milestone 1.3: Auth + Gateway
- [ ] JWT middleware for Gateway
- [ ] User role resolution (user, operator, admin)
- [ ] API key support for CLI and connectors
- [ ] Basic rate limiting (in-memory, move to Redis later)
- **Owner:** Platform · **DoD:** Unauthorized requests return 401

### Milestone 1.4: First Worker End-to-End
- [ ] Developer Knowledge Worker → uses real LLMClient
- [ ] Connects to at least one real connector (GitHub via REST API)
- [ ] Returns `KnowledgeAnswer` with real sources
- [ ] Grounding score computed from actual citations
- **Owner:** Backend · **DoD:** `eaos exec "how does card auth work"` returns real answer

---

## Epic 2: Connectors That Work (Weeks 2-3)

### Milestone 2.1: GitHub Connector
- [ ] OAuth app registration flow
- [ ] Repository search (code, README, PR)
- [ ] PR webhook handler (auto-review)
- [ ] Pagination and rate limiting
- [ ] Token refresh
- **Owner:** Backend · **DoD:** Search returns real GitHub results

### Milestone 2.2: Jira Connector
- [ ] API token auth
- [ ] JQL search
- [ ] Incident webhook handler
- [ ] Ticket creation (with approval)
- **Owner:** Backend · **DoD:** Incident worker finds real past incidents

### Milestone 2.3: Confluence Connector
- [ ] API token auth
- [ ] CQL search
- [ ] Page content extraction
- [ ] Space-scoped search
- **Owner:** Backend · **DoD:** Knowledge worker retrieves real Confluence pages

---

## Epic 3: Skills Runtime Production (Weeks 3-4)

### Milestone 3.1: First 10 Skills Published
- [ ] `engineering.knowledge.search` — knowledge retrieval
- [ ] `engineering.incident.root_cause` — incident analysis
- [ ] `engineering.pr.architecture_review` — PR review
- [ ] `engineering.runbook.generate` — runbook from incident
- [ ] `marketing.campaign.strategy` — campaign planning
- [ ] `marketing.icp.analysis` — ICP definition
- [ ] `marketing.content.newsletter` — newsletter generation
- [ ] `leadership.meeting.summarize` — transcript → action items
- [ ] `learning.tutorial.rag` — RAG tutorial
- [ ] `learning.prompt.engineering` — prompt engineering guide
- **Owner:** Backend + Product · **DoD:** Skills pass validation, compile, execute

### Milestone 3.2: Skills Quality System
- [ ] Execution result tracking (success, confidence, latency, cost)
- [ ] Auto quality-tier promotion
- [ ] User feedback collection (thumbs up/down, edit tracking)
- [ ] Skill comparison: version A vs B performance
- **Owner:** Data · **DoD:** Quality tier updates automatically after 10 executions

---

## Epic 4: Frontend → Alive (Weeks 3-5)

### Milestone 4.1: API Layer
- [ ] Next.js API routes proxying to Gateway
- [ ] TanStack Query hooks for data fetching
- [ ] SSE connection for live activity stream
- [ ] WebSocket for execution progress
- **Owner:** Frontend · **DoD:** Components render real data

### Milestone 4.2: Command Bar → Gateway
- [ ] Submit queries to Gateway API
- [ ] Show execution progress in real-time
- [ ] Display structured output in ExecutionCard
- [ ] Show sources and grounding
- **Owner:** Frontend · **DoD:** User types query, sees live execution, gets result

### Milestone 4.3: Skills + Knowledge Pages
- [ ] `/skills` page — browse, search, run skills
- [ ] `/knowledge` page — search internal knowledge
- [ ] `/activity` page — execution history
- **Owner:** Frontend · **DoD:** Users can browse and run skills from UI

---

## Epic 5: Embedded (Weeks 4-6)

### Milestone 5.1: Slack Integration (Real)
- [ ] Slack App registration
- [ ] `@eaos` mention handler → Gateway
- [ ] `/eaos` slash command → Gateway
- [ ] Thread-based progress updates
- [ ] Structured output as Slack blocks
- **Owner:** Backend · **DoD:** Slack users get real EOS responses

### Milestone 5.2: NATS Event Bus
- [ ] NATS client wrapper
- [ ] Publish execution events
- [ ] Subscribe to workflow triggers
- [ ] Activity stream from events
- **Owner:** Platform · **DoD:** Events flow between services

---

## Epic 6: Observability + Trust (Week 5-6)

### Milestone 6.1: Tracing
- [ ] OTel integration for all services
- [ ] Trace export to Grafana/Jaeger
- [ ] Trace summary in execution results
- **Owner:** Platform · **DoD:** Execution traces visible in Grafana

### Milestone 6.2: Metrics
- [ ] Prometheus metrics per service
- [ ] Grafana dashboards (health, latency, cost, usage)
- [ ] Alerting for service health
- **Owner:** Platform · **DoD:** System health dashboard exists

---

## What's Deferred (Post-v1)

| Item | Reason |
|------|--------|
| Multi-agent debate | Interesting but not needed for adoption |
| Simulation engine | No users to simulate for yet |
| Teams connector | Slack first |
| Learning engine feedback loops | Need data first |
| Cluster orchestration | Single-node is fine for internal v1 |
| Mobile app | Responsive web is enough |
| Knowledge graph (Neo4j) | pgvector + BM25 cover v1 needs |
| Model routing optimization | Hardcode GPT-4o / GPT-4o-mini |
