# AgentOS — Build Tasks & Milestone Plan

## Milestone 1: Alpha — Core Runtime
> **Goal:** A working orchestrator that can dispatch tasks to workers, execute simple workflows, and persist memory.

### Control Plane
- [ ] Implement `Orchestrator` service with goal intake API
- [ ] Implement `Planner` — LLM-powered task decomposition
- [ ] Implement `Scheduler` — priority queue with concurrency limits
- [ ] Task lifecycle state machine (pending → running → completed/failed)
- [ ] Worker pool management and health checks

### Worker Runtime
- [ ] `BaseWorker` class with lifecycle hooks (init, execute, teardown)
- [ ] Tool invocation framework with auth passthrough
- [ ] Worker manifest loader (YAML → runtime config)
- [ ] Worker sandboxing (resource limits, timeout enforcement)
- [ ] Worker-to-worker delegation protocol

### Workflow Engine
- [x] DAG parser and validator
- [x] Step executor with dependency resolution
- [ ] Conditional edge evaluation
- [ ] Retry with configurable backoff
- [ ] Workflow state persistence

### Event Bus
- [x] Event bus abstraction (publish, subscribe, replay)
- [x] NATS adapter implementation
- [ ] Event envelope schema enforcement
- [ ] Dead-letter queue routing
- [ ] Idempotency key management

### Memory Layer
- [x] Vector store integration (pgvector / Qdrant)
- [x] Episode memory: action-result pairs with timestamps
- [ ] Context bus: real-time context propagation
- [x] Memory query API (semantic search + temporal filters)
- [ ] Memory garbage collection / TTL policies

### SDK
- [ ] `@agentos/sdk` package with BaseWorker, Tool, Context
- [ ] TypeScript type definitions for all primitives
- [ ] Worker development template / scaffolder
- [ ] SDK documentation and examples

---

## Milestone 2: Beta — Governance & Observability
> **Goal:** Enterprise-grade policy enforcement, audit trail, and full observability.

### Policy Engine
- [x] Policy DSL parser (YAML rules → policy objects)
- [x] Policy evaluation runtime (pre/post task execution)
- [x] Allow / deny / escalate action model
- [x] Policy composition (AND/OR/NOT combinators)
- [ ] Policy testing framework

### Approval Flows
- [ ] Human-in-the-loop approval gates in workflows
- [ ] Approval routing (role-based, threshold-based)
- [ ] Approval timeout and escalation
- [ ] Slack/email notification for pending approvals
- [ ] Approval audit log

### Audit Trail
- [x] Immutable append-only event log
- [x] Action attribution (which worker, which tool, which user)
- [x] Query API with filters (time range, worker, action type)
- [ ] Export to S3 / data lake
- [ ] Compliance report generation

### Replay
- [ ] Deterministic workflow replay from event log
- [ ] Step-by-step replay with diff visualization
- [ ] Replay-based regression testing
- [ ] Time-travel debugging

### Observability
- [x] OpenTelemetry SDK integration
- [ ] Distributed trace propagation across worker chains
- [ ] Metrics: task throughput, latency p50/p95/p99, error rate
- [ ] Token usage tracking per worker/task
- [ ] Grafana dashboard templates
- [ ] Alert rules (error spike, latency degradation, budget exceeded)

### API Gateway
- [x] REST API for task submission, status, and results
- [x] WebSocket API for real-time task streaming
- [ ] Authentication (API key + JWT)
- [ ] Rate limiting and quota management
- [ ] OpenAPI spec generation

---

## Milestone 3: GA — Connectors & Multi-Tenant
> **Goal:** Production deployment with connector ecosystem and multi-tenant isolation.

### Connectors
- [ ] Connector SDK with standard interface
- [x] Slack connector (read/write messages, reactions, threads)
- [x] GitHub connector (PRs, issues, reviews, actions)
- [x] Jira connector (tickets, boards, sprints)
- [ ] Email connector (IMAP/SMTP)
- [ ] Webhook connector (generic HTTP events)
- [ ] Connector health monitoring

### Multi-Tenancy
- [ ] Tenant isolation (data, workers, policies)
- [ ] Per-tenant resource quotas
- [ ] Tenant-scoped API keys
- [ ] Cross-tenant worker sharing (opt-in)
- [ ] Tenant onboarding automation

### Deployment
- [x] Docker Compose for local development
- [ ] Kubernetes Helm charts
- [ ] Terraform modules (AWS / GCP / Azure)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Blue/green deployment support
- [x] Health check and readiness probes

### Security
- [ ] Secrets management (Vault / AWS Secrets Manager)
- [ ] mTLS between services
- [ ] Input sanitization for LLM prompts
- [ ] Output filtering (PII detection, content policy)
- [ ] SOC 2 compliance checklist

---

## Milestone 4: Future — Self-Healing & Marketplace
> **Goal:** Autonomous operations and a community ecosystem.

### Self-Healing
- [ ] Automatic worker restart on failure
- [ ] Circuit breaker for external tool calls
- [ ] Adaptive retry strategies (ML-based backoff)
- [ ] Anomaly detection on worker behavior
- [ ] Self-optimizing scheduler (learned priority weights)

### Evaluation Framework
- [ ] Task quality scoring (LLM-as-judge)
- [ ] A/B testing for worker strategies
- [ ] Benchmark suite for common enterprise tasks
- [ ] Regression detection on worker upgrades
- [ ] Human feedback collection and training loop

### Marketplace
- [ ] Worker marketplace (publish, discover, install)
- [ ] Connector marketplace
- [ ] Workflow template gallery
- [ ] Policy template library
- [ ] Versioning and compatibility matrix

### Advanced Features
- [ ] Multi-model routing (cost vs. quality optimization)
- [ ] Federated agent networks (cross-org collaboration)
- [ ] Real-time collaboration (multiple humans + agents)
- [ ] Natural language workflow builder
- [ ] Agent-native IDE plugin
