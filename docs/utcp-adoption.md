# UTCP Adoption Plan — from Internal Spec to 2-3 Design Partners

*v0.1 · March 2026 · Phani Marupaka*

## 1. Why we publish UTCP at all

We wrote UTCP because existing protocols (MCP, A2A, OpenAI/Anthropic
tool-calling) answer only one slice of "what happened in this AI
action". Governance, observability, cross-vendor lineage, and
cost/quality attribution all live *outside* those protocols.

Our thesis: the first agent platform that can demonstrate **credible,
cross-vendor lineage of an enterprise decision** wins the CISO
conversation. UTCP is the wire format that makes that conversation
possible.

But a proprietary wire format is a liability. It becomes an asset
only when at least one non-captive consumer has implemented it. This
document is the 12-month plan to get there.

## 2. Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| M0 — Publish v0.1 spec + JSON Schema + TS reference | Mar 2026 | ✅ Done |
| M1 — Internal production traffic (6+ months) | Sep 2026 | In flight |
| M2 — Public TS SDK (`@agentos/utcp`) on npm | Apr 2026 | Next |
| M3 — Python + Go reference impls | Jun 2026 | Planned |
| M4 — First design-partner adopter shipping | Aug 2026 | Planned |
| M5 — 2-3 design partners in production | Nov 2026 | Planned |
| M6 — v1.0 spec freeze + governance model | Feb 2027 | Planned |

## 3. What we publish (M2)

- **JSON Schema** (`docs/utcp-packet.schema.json`) — normative.
- **TS SDK** (`services/gateway/src/utcp-sdk.ts`) — re-exported as a
  clean npm package `@agentos/utcp` with no AgentOS-internal
  dependencies.
- **Reference gateway routes** so adopters can validate their
  packets against ours:
  - `POST /api/protocol/utcp/validate` — schema conformance.
  - `POST /api/protocol/utcp/canonicalize` — deterministic JSON.
  - `POST /api/protocol/utcp/envelope` — wrap in MCP-compatible
    JSON-RPC envelope.
  - `POST /api/protocol/utcp/envelope/decode` — unwrap + verify
    digest.
- **Adopter registry** — `GET /api/protocol/utcp/adopters`, so we
  can publicly list who has shipped an implementation.

## 4. Python + Go reference impls (M3)

We don't need to rewrite the whole SDK — only three primitives per
language are required:

1. Types (dataclass / struct) matching the TS `UTCPPacket`.
2. `create_utcp_packet()` constructor.
3. `canonicalize()` + `hash_packet()` for audit.

Each reference impl fits in ~400 LOC. The rest (validation,
adoption registry) is optional for adopters.

## 5. Design-partner playbook

Target profile for design partners:

- Mid-market enterprise (500-5000 employees) with a multi-agent
  internal platform.
- Already shipping with MCP *and* has a compliance team asking for
  audit lineage.
- Engineering lead with the authority to approve adopting a new
  wire format.

Ask for design partners:

1. Embed UTCP packets in their existing task payloads for one
   workflow. Not full rewrite.
2. Use `canonicalize()` + `hashPacket()` for their audit log.
3. Share per-packet quality + cost data (anonymized) back to the
   AgentOS benchmark ingest.

What they get in return:

- Co-marketing on the AgentOS blog and the UTCP spec page.
- Skill Effectiveness Index numbers for their workflows.
- Preview access to the cross-tenant leaderboard.

## 6. MCP coexistence strategy

- UTCP packets ride inside MCP-compatible JSON-RPC envelopes via the
  `toMcpEnvelope()` / `fromMcpEnvelope()` helpers. No MCP server
  changes required.
- MCP tool-call payloads are embedded inside UTCP `context` and their
  outcomes recorded in `results.agent_traces[*].tool_calls`.
- No customer is ever asked to pick between UTCP and MCP.

## 7. Exit criteria for v1.0

We will freeze UTCP as v1.0 only when:

- 2+ non-AgentOS organizations have shipped an implementation.
- ≥6 months of production telemetry exists across those
  organizations with no backward-incompatible changes.
- There is a written governance doc describing how future changes
  are proposed, reviewed, and merged.

Until then the spec remains v0.x and may break.

## 8. Anti-goals

- We will not try to replace MCP, A2A, or OpenAI function-calling.
- We will not accept governance-critical fields being optional.
- We will not ship a v1.0 without real third-party adopters.
