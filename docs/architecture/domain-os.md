# Three-Domain OS Architecture

## The Core Insight

EAOS is not three separate AI tools. It is **one runtime** that powers three domains
with a shared kernel, memory, and knowledge flow engine.

```mermaid
graph TB
    subgraph Interface["Where Work Happens"]
        Slack["Slack @eaos"]
        Teams["Teams @eaos"]
        GitHub["GitHub Webhooks"]
        Jira["Jira Webhooks"]
        CLI["eaos CLI"]
    end

    subgraph Cognitive["Cognitive Layer"]
        CE["Cognitive Engine"]
        RE["Reliability Engine"]
        Streaming["Response Streaming"]
    end

    subgraph Domains["Three Domain OS Agents"]
        MKT["Marketing Execution OS<br/>12 actions"]
        ENG["Engineering Intelligence OS<br/>12 actions"]
        LEARN["Learning & Upskilling OS<br/>10 actions"]
    end

    subgraph Flow["Cross-Domain"]
        XD["Knowledge Flow Engine<br/>4 predefined flows"]
    end

    subgraph Shared["Shared Runtime"]
        Skills["Skills Runtime"]
        Memory["Memory Pipeline"]
        Workers["Worker Clusters"]
        Kernel["EAOS Kernel"]
    end

    Interface --> CE
    CE --> Domains
    Domains --> XD
    XD --> Domains
    Domains --> Shared
```

## Domain Coverage

| Domain | Actions | Trigger Examples |
|--------|---------|-----------------|
| **Marketing** | campaign, newsletter, competitor tracking, CRM cleanup, SEO, segmentation, ad creative, email sequence, analytics | `@eaos campaign targeting credit unions` |
| **Engineering** | knowledge search, architecture explain, incident analysis, log investigation, PR review, runbook, service lookup, dependency trace, transcript→tickets, on-call assist | `@eaos how does card auth work` |
| **Learning** | tutorial, explain concept, prompt library, playbook, model comparison, architecture template, code example, best practices, assessment, learning path | `@eaos teach me RAG using our stack` |

## Cross-Domain Knowledge Flows

| Trigger | Actions | Approval |
|---------|---------|----------|
| `feature.released` | → Docs + Tutorial + Marketing messaging | Tutorial + messaging need approval |
| `incident.resolved` | → Runbook update + Troubleshooting playbook | Playbook needs approval |
| `campaign.completed` | → Executive brief + Best practices | Auto |
| `decision.made` | → Jira tickets + Marketing alignment | Both need approval |

## Why This Combination Wins

Single-domain AI tools cannot create the **knowledge flywheel**:

```
Engineering builds → EAOS documents → EAOS trains → EAOS markets
                ↑                                          ↓
                ←──── feedback improves all domains ←──────┘
```
