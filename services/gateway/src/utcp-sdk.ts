/**
 * UTCP SDK — Reference TypeScript implementation surface.
 *
 * This module is what we publish as `@agentos/utcp` once we cut a v1.
 * It intentionally re-exports from `utcp-protocol.ts` (the internal
 * implementation) plus adds:
 *
 *   - `validatePacket(obj)` — schema validator without a JSON-Schema dep.
 *   - `canonicalize(packet)` — stable JSON form for hashing / audit.
 *   - `hashPacket(packet)` — SHA-256 of canonical form (hex).
 *   - `toMcpEnvelope(packet)` / `fromMcpEnvelope(env)` — wrap/unwrap a
 *     UTCP packet inside an MCP-compatible transport envelope so
 *     UTCP-native agents can talk to MCP-only peers.
 *   - `adoptionRegistry` — an in-process list of known adopters / impls
 *     (updated out-of-band as real adopters land).
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { createHash } from 'node:crypto';
import type { UTCPPacket } from './utcp-protocol.js';

export type {
  UTCPPacket, UTCPActor, UTCPArtifact, UTCPApproval, UTCPTraceContext,
  UTCPSLA, FunctionDomain, TaskStatus, PrivacyLevel, Urgency, MemoryMode,
} from './utcp-protocol.js';
export {
  createUTCPPacket, createChildPacket, updatePacketStatus,
  storePacket, getPacket, getPacketsByWorkflow, getPacketsByStatus,
  getRecentPackets,
} from './utcp-protocol.js';

// ---------------------------------------------------------------------------
// Validation (without a JSON-Schema dep — we enforce the minimal invariants
// required for downstream code to switch on enum fields safely)
// ---------------------------------------------------------------------------

const ALLOWED_STATUS = new Set([
  'pending', 'planning', 'executing', 'reviewing',
  'awaiting_approval', 'completed', 'failed', 'cancelled',
]);
const ALLOWED_PRIVACY = new Set(['public', 'internal', 'confidential', 'restricted']);
const ALLOWED_URGENCY = new Set(['low', 'medium', 'high', 'critical']);
const ALLOWED_MEMORY = new Set(['read', 'write', 'both', 'none']);
const ALLOWED_FUNCTION = new Set([
  'engineering', 'marketing', 'product', 'hr', 'ta', 'program',
  'finance', 'legal', 'support', 'design', 'data', 'cross-functional',
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePacket(obj: unknown): ValidationResult {
  const errors: string[] = [];
  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['packet must be an object'] };
  }
  const p = obj as Partial<UTCPPacket>;
  const req = (key: keyof UTCPPacket, type: string) => {
    if (p[key] === undefined || p[key] === null) {
      errors.push(`missing required field: ${String(key)}`);
      return false;
    }
    if (type === 'array' && !Array.isArray(p[key])) {
      errors.push(`field ${String(key)} must be an array`);
      return false;
    }
    if (type !== 'array' && typeof p[key] !== type) {
      errors.push(`field ${String(key)} must be of type ${type}`);
      return false;
    }
    return true;
  };
  req('task_id', 'string');
  req('workflow_id', 'string');
  req('version', 'number');
  req('function', 'string');
  req('stage', 'string');
  req('intent', 'string');
  req('initiator', 'object');
  req('actors', 'array');
  req('objectives', 'array');
  req('constraints', 'array');
  req('success_criteria', 'array');
  req('source_artifacts', 'array');
  req('tool_scopes', 'array');
  req('context', 'object');
  req('privacy_level', 'string');
  req('action_rights', 'array');
  req('required_approvals', 'array');
  req('compliance_tags', 'array');
  req('output_schema', 'object');
  req('expected_artifacts', 'array');
  req('trace_context', 'object');
  req('sla', 'object');
  req('status', 'string');
  req('confidence', 'number');
  req('progress', 'number');
  req('memory_mode', 'string');
  req('memory_refs', 'array');
  req('created_at', 'string');
  req('updated_at', 'string');

  if (p.status !== undefined && !ALLOWED_STATUS.has(p.status)) {
    errors.push(`invalid status: ${p.status}`);
  }
  if (p.privacy_level !== undefined && !ALLOWED_PRIVACY.has(p.privacy_level)) {
    errors.push(`invalid privacy_level: ${p.privacy_level}`);
  }
  if (p.sla?.urgency !== undefined && !ALLOWED_URGENCY.has(p.sla.urgency)) {
    errors.push(`invalid sla.urgency: ${p.sla.urgency}`);
  }
  if (p.memory_mode !== undefined && !ALLOWED_MEMORY.has(p.memory_mode)) {
    errors.push(`invalid memory_mode: ${p.memory_mode}`);
  }
  if (p.function !== undefined && !ALLOWED_FUNCTION.has(p.function)) {
    errors.push(`invalid function: ${p.function}`);
  }
  if (typeof p.confidence === 'number' && (p.confidence < 0 || p.confidence > 1)) {
    errors.push('confidence must be in [0,1]');
  }
  if (typeof p.progress === 'number' && (p.progress < 0 || p.progress > 100)) {
    errors.push('progress must be in [0,100]');
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Canonicalization + hashing — deterministic JSON form for audit + hashing
// ---------------------------------------------------------------------------

function sortKeys(val: unknown): unknown {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(sortKeys);
  const entries = Object.entries(val as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const out: Record<string, unknown> = {};
  for (const [k, v] of entries) out[k] = sortKeys(v);
  return out;
}

export function canonicalize(packet: UTCPPacket): string {
  return JSON.stringify(sortKeys(packet));
}

export function hashPacket(packet: UTCPPacket): string {
  return createHash('sha256').update(canonicalize(packet)).digest('hex');
}

// ---------------------------------------------------------------------------
// MCP envelope wrappers
// ---------------------------------------------------------------------------

/**
 * An MCP-compatible transport envelope. Real MCP messages are JSON-RPC 2.0
 * with specific shape. We provide a lightweight mapping so UTCP packets
 * can ride inside an MCP server's request/response bodies until a first-
 * class UTCP transport is standardized.
 */
export interface MCPEnvelope {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: {
    /** Protocol identifier so the peer knows how to decode. */
    protocol: 'utcp/0.1';
    /** Packet payload. */
    packet: UTCPPacket;
    /** Optional signature/hash for integrity. */
    digest?: string;
  };
}

export function toMcpEnvelope(packet: UTCPPacket, method = 'utcp/task.create'): MCPEnvelope {
  return {
    jsonrpc: '2.0',
    id: packet.task_id,
    method,
    params: {
      protocol: 'utcp/0.1',
      packet,
      digest: hashPacket(packet),
    },
  };
}

export function fromMcpEnvelope(env: unknown): { packet: UTCPPacket; verified: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!env || typeof env !== 'object') {
    return { packet: {} as UTCPPacket, verified: false, errors: ['envelope must be an object'] };
  }
  const e = env as MCPEnvelope;
  if (e.jsonrpc !== '2.0') errors.push('jsonrpc must be "2.0"');
  if (!e.params || e.params.protocol !== 'utcp/0.1') errors.push('params.protocol must be "utcp/0.1"');
  if (!e.params?.packet) {
    return { packet: {} as UTCPPacket, verified: false, errors: [...errors, 'missing params.packet'] };
  }
  const packet = e.params.packet;
  const v = validatePacket(packet);
  if (!v.valid) errors.push(...v.errors);
  let verified = false;
  if (e.params.digest) {
    verified = hashPacket(packet) === e.params.digest;
    if (!verified) errors.push('digest mismatch — packet may have been tampered with');
  }
  return { packet, verified, errors };
}

// ---------------------------------------------------------------------------
// Adoption registry
// ---------------------------------------------------------------------------

export interface UTCPAdopter {
  id: string;
  org: string;
  status: 'announced' | 'design-partner' | 'shipped' | 'rolled-back';
  language: 'typescript' | 'python' | 'go' | 'rust' | 'other';
  since: string;
  notes?: string;
}

const adopters: UTCPAdopter[] = [
  {
    id: 'agentos-reference',
    org: 'AgentOS',
    status: 'shipped',
    language: 'typescript',
    since: '2026-03-09',
    notes: 'Reference implementation — this repo',
  },
];

export function listAdopters(): UTCPAdopter[] {
  return adopters.slice();
}

export function registerAdopter(a: Omit<UTCPAdopter, 'id'> & { id?: string }): UTCPAdopter {
  const entry: UTCPAdopter = {
    ...a,
    id: a.id ?? `adopter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  adopters.push(entry);
  return entry;
}
