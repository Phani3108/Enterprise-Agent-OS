# EAOS Full Stack Architecture

## Complete System Diagram

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        Teams["Teams / Web"]
        CLI["CLI"]
        API["API Consumers"]
        Webhooks["Webhooks"]
    end

    subgraph Gateway_Layer["Gateway"]
        GW["API Gateway :3000"]
        Auth["Auth + Rate Limit"]
    end

    subgraph Control["Control Plane"]
        Orch["Orchestrator :3001"]
    end

    subgraph Cognitive["Cognitive Layer"]
        CE["Cognitive Engine :3005"]
        RL_E["Reliability Engine :3006"]
        LE["Learning Engine :3007"]
    end

    subgraph Execution["Execution Layer"]
        WR["Worker Runtime"]
        SR["Skills Runtime :3004"]
        SC["Scheduler"]
        MR["Model Router"]
    end

    subgraph Kernel_Layer["EAOS Kernel"]
        LM["Lifecycle Manager"]
        CO["Cluster Orchestrator"]
        SP["State Persistence"]
        SI["Security Isolation"]
    end

    subgraph Workers["Worker Clusters"]
        Eng["Engineering"]
        Mkt["Marketing"]
        Lead["Leadership"]
    end

    subgraph Data["Data Layer"]
        Mem["Memory Service :3002"]
        KG["Knowledge Graph"]
        Vec["Vector Store"]
    end

    subgraph Gov["Governance"]
        PE["Policy Engine"]
        Sand["Tool Sandbox"]
        Sim["Simulation"]
    end

    subgraph Auto["Autonomous"]
        Watch["Watchers"]
        Eval["Evaluation"]
    end

    subgraph Infra["Infrastructure"]
        EB["Event Bus"]
        Sec["Secrets Vault"]
        OTel["OpenTelemetry"]
    end

    subgraph Conn["Connectors"]
        Slack["Slack"]
        GH["GitHub"]
        Jira["Jira"]
    end

    Clients --> GW --> Auth --> Orch
    Orch --> CE
    CE --> RL_E
    CE --> LE
    CE --> SC --> MR --> Workers
    Workers --> SR
    Workers --> Sand
    Workers --> Mem
    Workers --> Conn
    WR --> Kernel_Layer
    Watch --> EB
    Eval --> MR
    LE --> SR
    SI --> Sand
    SP --> Mem
```

## Service Registry

| Service | Port | Package | Layer |
|---------|------|---------|-------|
| API Gateway | 3000 | `@agentos/gateway` | Gateway |
| Orchestrator | 3001 | `@agentos/orchestrator` | Control |
| Memory Service | 3002 | `@agentos/memory` | Data |
| Skills Runtime | 3004 | `@agentos/skills-runtime` | Execution |
| Cognitive Engine | 3005 | `@agentos/cognitive-engine` | Cognitive |
| Reliability Engine | 3006 | `@agentos/reliability-engine` | Cognitive |
| Learning Engine | 3007 | `@agentos/learning-engine` | Cognitive |

## Package Dependency Map

| Package | Depends On |
|---------|-----------|
| `kernel` | runtime, events, sandbox, secrets |
| `cognition` | sdk, skills |
| `skills` | sdk, events, router, sandbox |
| `runtime` | sdk, events |
| `scheduler` | sdk, runtime |
| `router` | sdk |
| `evaluation` | — |
| `simulation` | sandbox |
| `watchers` | events |
| `knowledge` | — |
| `sandbox` | policy |
| `secrets` | — |
| `policy` | — |
| `events` | — |
| `sdk` | — |

## Request Flow (End-to-End)

```
User → Gateway → Auth → Orchestrator → Cognitive Engine
                                              ↓
                                    Decompose → Plan → Reason
                                              ↓
                                    Scheduler → Model Router
                                              ↓
                                    Worker Selected
                                              ↓
                                    Skill Loaded → Compiled
                                              ↓
                                    Memory Retrieved
                                              ↓
                                    Prompt Assembled
                                              ↓
                                    LLM Execution (sandboxed)
                                              ↓
                                    Output Validation (Reliability)
                                              ↓
                                    Hallucination Check
                                              ↓
                                    Self-Reflection
                                              ↓
                                    Final Output → User
                                              ↓
                                    Learning Engine (async)
```
