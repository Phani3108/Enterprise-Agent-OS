/**
 * Policy Store — Declarative allow/deny rules for agent + tool behavior.
 *
 * Rationale: the governance moat evaluation flagged that enterprises will
 * ask for ABAC-style rules before any purchase. This module provides a
 * small, composable policy primitive that the MCP executor, marketing API,
 * and persona API can consult before acting.
 *
 * Minimal v1 schema:
 *   {
 *     id, name, effect: 'deny'|'allow',
 *     subject: { agent?, tool?, persona?, userRole? },
 *     condition: { timeOfDay?, dayOfWeek?, env? },
 *     reason
 *   }
 *
 * Evaluation model: all applicable DENY rules win; otherwise default-allow.
 * Designed to be replaced by a richer engine (e.g. OPA/Rego) in 12m plan.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { registerStore } from './gateway-persistence.js';

export interface PolicySubject {
  agent?: string;
  tool?: string;
  persona?: string;
  userRole?: 'user' | 'operator' | 'admin';
}

export interface PolicyCondition {
  /** Inclusive hour-of-day window in local tz, e.g. [9, 17] for 9am-5pm. */
  timeOfDay?: [number, number];
  /** 0 = Sunday, 6 = Saturday. */
  dayOfWeek?: number[];
  /** 'dev' | 'staging' | 'production' matching NODE_ENV. */
  env?: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  effect: 'allow' | 'deny';
  subject: PolicySubject;
  condition?: PolicyCondition;
  reason: string;
  createdAt: string;
  createdBy?: string;
  enabled: boolean;
}

const policies = new Map<string, PolicyRule>();

// Persistence
registerStore(
  'policies',
  () => Array.from(policies.values()) as unknown as Record<string, unknown>[],
  (rows) => {
    policies.clear();
    for (const row of rows as unknown as PolicyRule[]) policies.set(row.id, row);
  },
);

export interface PolicyCheckInput {
  agent?: string;
  tool?: string;
  persona?: string;
  userRole?: PolicySubject['userRole'];
}

export interface PolicyCheckResult {
  allowed: boolean;
  matchedDenies: PolicyRule[];
  matchedAllows: PolicyRule[];
}

/** Evaluate an action against all enabled policies. */
export function checkPolicy(input: PolicyCheckInput, now: Date = new Date()): PolicyCheckResult {
  const matchedDenies: PolicyRule[] = [];
  const matchedAllows: PolicyRule[] = [];
  for (const p of policies.values()) {
    if (!p.enabled) continue;
    if (!subjectMatches(p.subject, input)) continue;
    if (p.condition && !conditionMatches(p.condition, now)) continue;
    if (p.effect === 'deny') matchedDenies.push(p);
    else matchedAllows.push(p);
  }
  return {
    allowed: matchedDenies.length === 0,
    matchedDenies,
    matchedAllows,
  };
}

function subjectMatches(s: PolicySubject, i: PolicyCheckInput): boolean {
  if (s.agent && s.agent !== '*' && s.agent !== i.agent) return false;
  if (s.tool && s.tool !== '*' && s.tool !== i.tool) return false;
  if (s.persona && s.persona !== '*' && s.persona !== i.persona) return false;
  if (s.userRole && s.userRole !== i.userRole) return false;
  return true;
}

function conditionMatches(c: PolicyCondition, now: Date): boolean {
  if (c.env && c.env !== (process.env.NODE_ENV ?? 'dev')) return false;
  if (c.timeOfDay) {
    const h = now.getHours();
    const [lo, hi] = c.timeOfDay;
    if (h < lo || h > hi) return false;
  }
  if (c.dayOfWeek && !c.dayOfWeek.includes(now.getDay())) return false;
  return true;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function createPolicy(
  input: Omit<PolicyRule, 'id' | 'createdAt' | 'enabled'> & { enabled?: boolean },
): PolicyRule {
  const id = `pol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rule: PolicyRule = {
    id,
    name: input.name,
    effect: input.effect,
    subject: input.subject,
    condition: input.condition,
    reason: input.reason,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    enabled: input.enabled ?? true,
  };
  policies.set(id, rule);
  return rule;
}

export function updatePolicy(id: string, patch: Partial<PolicyRule>): PolicyRule | undefined {
  const existing = policies.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch, id: existing.id };
  policies.set(id, updated);
  return updated;
}

export function deletePolicy(id: string): boolean {
  return policies.delete(id);
}

export function getPolicy(id: string): PolicyRule | undefined {
  return policies.get(id);
}

export function listPolicies(): PolicyRule[] {
  return Array.from(policies.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ---------------------------------------------------------------------------
// Seed examples — so the admin UI isn't empty on first boot.
// ---------------------------------------------------------------------------

export function seedExamplePolicies(): void {
  if (policies.size > 0) return;
  createPolicy({
    name: 'Block Jira writes on weekends',
    effect: 'deny',
    subject: { tool: 'jira' },
    condition: { dayOfWeek: [0, 6] },
    reason: 'Change freeze during weekends',
    createdBy: 'system',
  });
  createPolicy({
    name: 'Marketing persona cannot call GitHub',
    effect: 'deny',
    subject: { persona: 'marketing', tool: 'github' },
    reason: 'Segregation of duty — marketing does not push code',
    createdBy: 'system',
  });
  createPolicy({
    name: 'Only operators may record spend in production',
    effect: 'deny',
    subject: { userRole: 'user' },
    condition: { env: 'production' },
    reason: 'Financial write restricted to operators+',
    createdBy: 'system',
  });
}
