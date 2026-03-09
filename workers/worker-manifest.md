# Worker Manifest Specification

This document describes the schema for defining workers in AgentOS.

## Manifest Structure

Every worker is defined in a YAML manifest file (`worker.yaml`) within a cluster directory.

### Cluster-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique cluster identifier |
| `description` | string | ✅ | Human-readable description |
| `model_default` | string | ❌ | Default LLM model for workers in this cluster |
| `max_concurrent_workers` | number | ❌ | Max workers running simultaneously |
| `policies` | string[] | ❌ | Cluster-wide policy references |
| `workers` | Worker[] | ✅ | List of worker definitions |

### Worker-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique worker identifier within cluster |
| `description` | string | ✅ | What this worker does |
| `model` | string | ❌ | LLM model (overrides cluster default) |
| `tools` | string[] | ✅ | List of tool identifiers this worker can invoke |
| `policies` | string[] | ❌ | Worker-specific policy references |
| `triggers` | Trigger[] | ❌ | Events that auto-spawn this worker |
| `context_sources` | ContextSource[] | ❌ | Memory sources for RAG context |
| `sandbox` | Sandbox | ❌ | Resource limits and timeouts |

### Trigger Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | ✅ | Event type to trigger on |
| `filter` | string | ❌ | Expression to filter matching events |

### Context Source Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `vector` \| `episode` | ✅ | Memory source type |
| `namespace` | string | ❌ | Vector store namespace (for `vector` type) |
| `filter` | object | ❌ | Query filter (for `episode` type) |

### Sandbox Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_tokens` | number | 8000 | Max tokens per task |
| `max_tool_calls` | number | 20 | Max tool invocations per task |
| `timeout_ms` | number | 120000 | Task execution timeout |
| `max_memory_mb` | number | 512 | Memory limit |
| `max_cpu_percent` | number | 50 | CPU quota |

## Minimal Example

```yaml
name: my-cluster
description: A custom worker cluster
workers:
  - name: my-worker
    description: Does useful things
    model: gpt-4o
    tools:
      - file.read
      - file.write
```

## Validation

Worker manifests are validated against the [worker.schema.json](../packages/schemas/worker.schema.json) JSON Schema at load time. Invalid manifests will cause the runtime to reject the cluster registration.
