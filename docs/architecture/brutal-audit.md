# EOS Brutal Self-Audit

> Critiqued like a principal engineer reviewing an over-ambitious internal platform.

---

## Top 10 Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **No actual LLM integration** — All workers have `// In production: call LLM` placeholders. Without a real LLM client, zero features actually work. | Critical | Build a unified `LLMClient` in `@agentos/sdk` with provider abstraction (OpenAI, Anthropic, Vertex) and use it in every worker. This is P0. |
| 2 | **No database persistence** — Everything is in-memory. Skills registry, approval state, workflow executions, sessions — all vanish on restart. | Critical | Implement Postgres repositories for skills, approvals, workflows, and sessions. Use the existing `docker-compose.yaml` Postgres. |
| 3 | **No authentication/authorization** — Gateway has `// TODO: auth middleware`. Anyone can hit any endpoint. | Critical | Implement JWT middleware, role-based access control, and integrate with SSO. |
| 4 | **Connector implementations are stubs** — Confluence/GitHub/Jira/Blogin connectors have interfaces but no real API calls, no OAuth flows, no pagination, no rate limiting. | High | Build one connector fully (GitHub) as the template. Use proper OAuth, pagination, error handling. Others follow the pattern. |
| 5 | **No tests** — Zero unit tests, zero integration tests. A system this complex with no tests is a deployment liability. | High | Start with contract tests for Skills Compiler, Registry, and Approval Engine. Add integration tests for workers. |
| 6 | **Breadth over depth** — 240+ files across 27 phases, but many subsystems are only type declarations and interfaces with no executable logic. The cognitive engine, kernel, orchestrator, scheduler are largely types. | High | Focus next sprint on making the first vertical slice actually runnable: Skills → Worker → LLM → Output → Respond. |
| 7 | **No real event bus** — NATS is in docker-compose but no code connects to it. Events are conceptual. | Medium | Implement a NATS client wrapper and use it for workflow triggers, worker dispatch, and activity streaming. |
| 8 | **Frontend has no API layer** — React components render demo data, but there are no API routes, no data fetching, no WebSocket connections. | Medium | Add Next.js API routes that proxy to the Gateway. Connect components to real data via TanStack Query + SSE. |
| 9 | **Operational complexity** — 8 services, 4 infra components, 4 connectors. For a team of <5, this is hard to operate. | Medium | Consolidate into 2-3 deployable services initially: Gateway+Orchestrator, Cognitive+Skills, Workers. |
| 10 | **Memory pipeline not connected** — The 5-stage retrieval pipeline is well-designed but has no vector store client, no BM25 index, and no graph database. | Medium | Implement pgvector client for vector search. Defer BM25 and graph to later phases. |

---

## Top 10 Improvements (Priority Order)

1. **Build `LLMClient`** — unified provider abstraction with streaming, structured output, retry
2. **Postgres repositories** — persist skills, workflows, approvals, sessions
3. **Auth middleware** — JWT + RBAC for gateway
4. **GitHub connector (real)** — OAuth, REST API, full CRUD
5. **Contract tests** — Skills Compiler, Registry, Approval Engine
6. **Wire frontend to API** — API routes, TanStack Query, SSE for live updates
7. **NATS integration** — event publishing, workflow triggers
8. **Skills evaluation pipeline** — automated quality scoring from execution history
9. **Monitoring/alerting** — Prometheus metrics, Grafana dashboards for system health
10. **CLI polish** — make `eaos exec` actually call the Gateway and stream results

---

## What to Cut

- **Simulation engine** — not needed for v1, adds complexity without adoption value
- **Multi-agent debate** — interesting but not needed for first vertical slice
- **Learning Engine feedback loops** — defer until skills are running and generating data
- **Teams connector** — focus on Slack first, Teams can come later
- **Mobile strategy** — not needed now, responsive web is sufficient

---

## What to Simplify

- **Consolidate services** — merge Gateway + Orchestrator into one process
- **Simplify kernel** — strip to just lifecycle management + health checks for v1
- **Reduce model routing** — hardcode GPT-4o for complex, GPT-4o-mini for simple. Skip cost/latency optimizers.
- **Skills compiler** — works well but memory hooks and guardrails can be simplified pre-LLM
- **Workflow engine** — condition evaluator using `new Function()` is a security risk. Use a safe expression parser.

---

## What Absolutely Must Remain

These are identity-defining. Cutting them would make EOS a generic chatbot.

1. **Skills as first-class runtime objects** — the schema, compiler, registry pattern
2. **Structured outputs** — typed responses with confidence, grounding, sources
3. **Approval engine** — human-in-the-loop for sensitive actions
4. **Multi-source knowledge retrieval** — parallel search across internal tools
5. **Execution transparency** — step timeline, tool calls, reasoning traces
6. **Embedded integrations** — Slack @eaos, GitHub webhooks, Jira triggers
7. **Domain-specific agents** — the Engineering/Marketing/Learning OS structure
