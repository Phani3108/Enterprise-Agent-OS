# UTCP — Universal Task Context Protocol

*Draft v0.1 · March 2026 · Phani Marupaka*

## 1. What UTCP is

UTCP is a single self-describing envelope that carries one unit of agent
work — a task — end-to-end across planning, execution, governance, and
reporting. A UTCP packet answers every question an enterprise asks about
an AI action:

- **Who** requested it (initiator) and **who** acted (actors)?
- **What** was the objective, the constraints, and the success criteria?
- **What** privacy level, compliance tags, and approvals apply?
- **Which** tools were allowed, which were used?
- **How much** did it cost, how long did it take, who approved each step?
- **What** was the output, and what's the provenance trace back to the
  request?

Existing protocols (MCP, A2A, OpenAI tool-calling) answer one or two of
these. UTCP is built to answer all of them in one schema so that an
agent platform, a CISO dashboard, and a benchmark report all consume
the same payload.

## 2. Design principles

1. **Self-describing** — a packet carries its own schema and context; a
   consumer doesn't need an out-of-band registry to act on it.
2. **Governance-first** — `privacy_level`, `action_rights`,
   `required_approvals`, `compliance_tags` are not optional add-ons;
   they are first-class fields and must appear in every packet.
3. **Auditable** — every packet carries a `trace_context` (root + span
   + parent), a cost/latency/token breakdown in `results.agent_traces`,
   and a decision record in `results.decisions`.
4. **Composable** — a packet references its parent, so workflows
   become hash-chained trees of packets.
5. **Envelope, not replacement** — UTCP does not redefine tool-calling.
   It carries tool-call payloads (MCP, function-calling, REST) inside
   the `context` + `source_artifacts` fields and records their outcomes
   in `results`. Interop, not conflict.

## 3. Packet shape

See `docs/utcp-packet.schema.json` for the normative JSON Schema. In
summary, a packet has four sections:

- **Identity & classification** — `task_id`, `workflow_id`, `version`,
  `function`, `stage`, `intent`.
- **Actors & mission** — `initiator`, `actors[]`, `objectives[]`,
  `constraints[]`, `success_criteria[]`.
- **Context & governance** — `source_artifacts[]`, `tool_scopes[]`,
  `context{}`, `privacy_level`, `action_rights[]`,
  `required_approvals[]`, `compliance_tags[]`, `output_schema{}`,
  `expected_artifacts[]`.
- **Execution & results** — `trace_context`, `sla`, `status`,
  `confidence`, `progress`, `memory_mode`, `memory_refs[]`, timestamps
  (`created_at`, `started_at`, `completed_at`), `results{}` with
  per-agent traces.

Every string enum field in the spec is closed-world (listed values
only) so that downstream systems can switch on them without
defensive code.

## 4. Example

```json
{
  "task_id": "utcp-01HZ8K9N2F...",
  "workflow_id": "wf-blog-from-brief",
  "version": 1,
  "function": "marketing",
  "stage": "drafting",
  "intent": "content.blog.create",
  "initiator": {
    "user_id": "u-1234",
    "role": "marketing-lead",
    "email": "alex@example.com"
  },
  "actors": [
    { "agent_id": "copy-agent", "role": "writer" },
    { "agent_id": "research-agent", "role": "researcher" }
  ],
  "objectives": [
    "Draft a 1500-word technical blog from the attached brief",
    "Match existing editorial tone"
  ],
  "constraints": ["Must not cite unverified claims"],
  "success_criteria": ["Draft approved by marketing-lead"],
  "source_artifacts": [
    { "type": "document", "ref": "file-abc", "tool": "upload", "title": "Brief.pdf" }
  ],
  "tool_scopes": ["Claude", "Perplexity"],
  "context": { "target_audience": "CTOs and VP Engineering" },
  "privacy_level": "internal",
  "action_rights": ["read", "execute"],
  "required_approvals": [
    { "role": "marketing-lead", "threshold": "any", "required": true }
  ],
  "compliance_tags": ["SOC2"],
  "output_schema": {
    "type": "object",
    "properties": { "blog_draft": { "type": "string" } }
  },
  "expected_artifacts": ["blog_draft"],
  "trace_context": { "span_id": "a1b2c3d4", "root_id": "a1b2c3d4", "depth": 0 },
  "sla": { "urgency": "medium", "max_cost_usd": 1.0, "max_duration_ms": 180000 },
  "status": "executing",
  "confidence": 0.82,
  "progress": 45,
  "memory_mode": "both",
  "memory_refs": ["exec-prev-brief-123"],
  "created_at": "2026-03-09T10:00:00Z",
  "updated_at": "2026-03-09T10:02:34Z"
}
```

## 5. Relationship to other standards

- **MCP (Model Context Protocol)** — UTCP packets carry MCP tool-call
  payloads in `context.mcp_tool_calls` (convention) and record
  results in `results.agent_traces[*].tool_calls`. An MCP server
  operates one level below UTCP.
- **A2A (Agent-to-Agent)** — A2A messages are envelopes for
  individual RPCs between agents. A UTCP packet represents the
  aggregate task context those RPCs serve.
- **OpenAI function-calling / Anthropic tool-use** — same as MCP:
  embedded, not replaced.

## 6. Versioning

- The `version` field on the packet is the *packet version for
  idempotency* (each edit of the same task_id bumps it). This is not
  the spec version.
- The **spec version** is tracked in this document's front-matter and
  in the JSON Schema's `$id`. Backward-incompatible changes increment
  the major version and publish a migration note.

## 7. Implementation notes

- Reference TypeScript types live in
  `services/gateway/src/utcp-protocol.ts`.
- A `createUTCPPacket(params)` constructor initializes a valid packet
  with defaults; `createChildPacket(parent, params)` wires the
  `trace_context` chain.
- Serialization: packets MUST be UTF-8 JSON. For archival, use the
  canonical form produced by `canonicalize(packet)` (alphabetized
  keys, no whitespace) so they can be hashed for audit.

## 8. Status

UTCP is an internal convention at AgentOS. This document is
published as a stake in the ground for industry discussion, not as
a ratified standard. Feedback welcome via the GitHub repo. A v1.0
public release is planned once 6-plus months of production telemetry
and at least 2 independent implementations exist.
