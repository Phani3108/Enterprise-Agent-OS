# EAOS Service Architecture Diagram

## Service Topology

```mermaid
graph TB
    subgraph External["External Clients"]
        CLI["CLI / Dashboard"]
        Webhooks["Webhook Sources"]
        API_Clients["API Consumers"]
    end

    subgraph Gateway_Layer["Gateway Layer"]
        GW["API Gateway<br/>REST + WebSocket"]
        Auth["Auth Middleware<br/>JWT / API Key"]
        RL["Rate Limiter"]
    end

    subgraph Control_Plane["Control Plane"]
        Orch["Orchestrator"]
        Planner["LLM Planner"]
        Scheduler["Task Scheduler"]
        Router["Model Router"]
    end

    subgraph Execution_Layer["Execution Layer"]
        subgraph Eng["Engineering Cluster"]
            CG["Code Generator"]
            CR["Code Reviewer"]
            TR["Test Runner"]
            DP["Deployer"]
        end
        subgraph Mkt["Marketing Cluster"]
            CW["Content Writer"]
            SEO["SEO Analyst"]
        end
        subgraph Lead["Leadership Cluster"]
            SA["Strategy Analyst"]
            OKR["OKR Tracker"]
        end
    end

    subgraph Data_Layer["Data & Memory Layer"]
        VectorDB["Vector Store<br/>pgvector"]
        Episodes["Episode Memory<br/>PostgreSQL"]
        KG["Knowledge Graph"]
        CtxBus["Context Bus<br/>Redis"]
    end

    subgraph Governance_Layer["Governance Layer"]
        PE["Policy Engine"]
        Sandbox["Tool Sandbox"]
        Approval["Approval Manager"]
        Audit["Audit Trail"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        EB["Event Bus<br/>NATS JetStream"]
        Secrets["Secrets Vault"]
        OTel["OpenTelemetry<br/>Collector"]
        Sim["Simulation Engine"]
    end

    subgraph Autonomous["Autonomous Systems"]
        DW["Drift Watcher"]
        CostW["Cost Watcher"]
        CompW["Compliance Watcher"]
        PerfW["Performance Watcher"]
        Eval["Evaluation Harness"]
    end

    subgraph Connectors["Connector Mesh"]
        Slack["Slack"]
        GitHub["GitHub"]
        Jira["Jira"]
    end

    CLI --> GW
    Webhooks --> GW
    API_Clients --> GW
    GW --> Auth --> RL --> Orch

    Orch --> Planner
    Orch --> Scheduler
    Scheduler --> Router
    Router --> Eng
    Router --> Mkt
    Router --> Lead

    Eng --> PE
    Mkt --> PE
    Lead --> PE
    PE --> Sandbox
    PE --> Approval

    Eng --> VectorDB
    Eng --> Episodes
    Eng --> CtxBus
    KG --> VectorDB

    Eng --> Connectors
    Mkt --> Connectors

    EB --> Orch
    EB --> Autonomous
    DW --> EB
    CostW --> EB
    Eval --> Router

    Audit --> Episodes
    OTel --> EB
    Secrets --> Eng

    classDef control fill:#4A90D9,color:#fff,stroke:none
    classDef exec fill:#7B68EE,color:#fff,stroke:none
    classDef data fill:#2ECC71,color:#fff,stroke:none
    classDef gov fill:#E74C3C,color:#fff,stroke:none
    classDef infra fill:#F39C12,color:#fff,stroke:none
    classDef auto fill:#9B59B6,color:#fff,stroke:none
    classDef conn fill:#1ABC9C,color:#fff,stroke:none

    class Orch,Planner,Scheduler,Router control
    class CG,CR,TR,DP,CW,SEO,SA,OKR exec
    class VectorDB,Episodes,KG,CtxBus data
    class PE,Sandbox,Approval,Audit gov
    class EB,Secrets,OTel,Sim infra
    class DW,CostW,CompW,PerfW,Eval auto
    class Slack,GitHub,Jira conn
```

## Service Communication Matrix

| From → To | Protocol | Pattern | Latency |
|-----------|----------|---------|---------|
| Gateway → Orchestrator | gRPC | Request/Reply | <10ms |
| Orchestrator → Scheduler | In-process | Direct call | <1ms |
| Scheduler → Workers | Event Bus | Async dispatch | <50ms |
| Workers → Tools | HTTP/gRPC | Request/Reply | 100-5000ms |
| Workers → Memory | gRPC | Request/Reply | <20ms |
| Workers → Policy Engine | In-process | Sync eval | <5ms |
| Event Bus → Watchers | NATS | Pub/Sub | <10ms |
| Workers → Connectors | HTTP | Request/Reply | 200-2000ms |
| Evaluation → Router | In-process | Feedback loop | async |

## Deployment Model

```
┌─────────────────────────────────────────────────────┐
│  Kubernetes Cluster                                  │
│                                                      │
│  ┌─────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Gateway  │  │ Orchestrator │  │ Memory Service │ │
│  │ (HPA)   │  │ (1 replica)  │  │ (StatefulSet)  │ │
│  └─────────┘  └──────────────┘  └────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Worker Pool (HPA, 0→100 replicas)            │   │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │   │
│  │ │ Eng │ │ Eng │ │ Mkt │ │Lead │ │ Eng │   │   │
│  │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────┐ ┌──────┐ ┌──────────┐ ┌───────────┐  │
│  │  NATS   │ │Redis │ │PostgreSQL│ │ OTel      │  │
│  │JetStream│ │      │ │+ pgvector│ │ Collector │  │
│  └─────────┘ └──────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────┘
```

## Port Assignments

| Service | Port | Protocol |
|---------|------|----------|
| Gateway (REST) | 3000 | HTTP |
| Gateway (WebSocket) | 3000 | WS |
| Orchestrator (gRPC) | 3001 | gRPC |
| Memory Service | 3002 | gRPC |
| NATS | 4222 | NATS |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| OTel Collector | 4317 | gRPC |
| Prometheus | 9090 | HTTP |
| Grafana | 3003 | HTTP |
