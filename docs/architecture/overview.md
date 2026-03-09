# AgentOS — System Architecture Overview

## Design Principles

1. **Agent-Native** — Everything is designed around autonomous agent processes, not human UIs
2. **Policy-First** — Every action is governed by composable policy rules
3. **Event-Driven** — All state changes propagate through an immutable event bus
4. **Observable** — Full distributed tracing from goal to outcome
5. **Extensible** — New workers, connectors, and policies without core changes

---

## Layer Architecture

```mermaid
graph TB
    subgraph "Control Plane"
        O[Orchestrator] --> P[Planner]
        P --> S[Scheduler]
    end

    subgraph "Execution Layer"
        S --> W1[Engineering Cluster]
        S --> W2[Marketing Cluster]
        S --> W3[Leadership Cluster]
        S --> W4[Custom Clusters]
    end

    subgraph "Infrastructure"
        EB[Event Bus]
        ML[Memory Layer]
        PE[Policy Engine]
        AT[Audit Trail]
        OT[Observability]
    end

    W1 & W2 & W3 & W4 --> EB
    EB --> ML
    EB --> AT
    W1 & W2 & W3 & W4 --> PE
    W1 & W2 & W3 & W4 --> ML
    W1 & W2 & W3 & W4 --> OT

    subgraph "Connectors"
        C1[Slack]
        C2[GitHub]
        C3[Jira]
        C4[Email]
    end

    W1 & W2 & W3 & W4 --> C1 & C2 & C3 & C4
```

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant U as User / API
    participant GW as Gateway
    participant O as Orchestrator
    participant P as Planner
    participant S as Scheduler
    participant W as Worker
    participant PE as Policy Engine
    participant EB as Event Bus
    participant M as Memory

    U->>GW: Submit Goal
    GW->>O: Route to Orchestrator
    O->>P: Decompose Goal
    P->>P: LLM-powered planning
    P-->>O: Task DAG
    O->>S: Schedule Tasks
    S->>PE: Pre-execution policy check
    PE-->>S: Allow / Deny
    S->>W: Dispatch Task
    W->>M: Retrieve context
    M-->>W: Relevant memories
    W->>W: Execute (LLM + Tools)
    W->>EB: Publish task.completed
    EB->>M: Persist episode
    W-->>S: Return result
    S-->>O: Aggregate results
    O-->>GW: Final response
    GW-->>U: Deliver result
```

---

## Data Flow

| Flow | Source | Destination | Transport |
|------|--------|-------------|-----------|
| Goal submission | API Gateway | Orchestrator | gRPC / REST |
| Task dispatch | Scheduler | Worker | Event Bus |
| Tool invocation | Worker | External API | HTTP / SDK |
| Context retrieval | Worker | Memory | gRPC |
| Event propagation | Any service | Event Bus | NATS / Kafka |
| Policy evaluation | Worker | Policy Engine | In-process / gRPC |
| Trace export | All services | Observability | OTLP |

---

## Technology Choices

| Component | Default | Alternatives |
|-----------|---------|-------------|
| Language | TypeScript | — |
| Runtime | Node.js 20+ | Bun |
| Event Bus | NATS JetStream | Kafka, Redis Streams |
| Vector Store | pgvector | Qdrant, Pinecone |
| Relational DB | PostgreSQL | — |
| Cache | Redis | — |
| Observability | OpenTelemetry + Grafana | Datadog |
| Container | Docker + K8s | — |
| CI/CD | GitHub Actions | — |

---

## Cross-Cutting Concerns

### Authentication & Authorization
- API keys for external clients
- JWT for internal service-to-service
- Role-based access control (RBAC) for multi-tenant

### Configuration
- Environment variables for secrets
- YAML manifests for workers, workflows, policies
- Feature flags for gradual rollout

### Error Handling
- Structured error types with codes
- Retry with exponential backoff
- Dead-letter queues for unprocessable events
- Circuit breakers for external services

See individual layer documents for detailed designs:
- [Control Plane](./control-plane.md)
- [Execution Layer](./execution-layer.md)
- [Memory Layer](./memory-layer.md)
- [Governance Layer](./governance-layer.md)
- [Observability Layer](./observability-layer.md)
- [Event Bus](./event-bus.md)
- [Agent Protocol](./agent-protocol.md)
