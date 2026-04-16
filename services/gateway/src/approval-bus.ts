/**
 * Approval Bus — Unified approval coordination for persona + marketing executions
 *
 * Purpose: the marketing execution loop in marketing-api.ts, the persona
 * execution loop in persona-api.ts, and the REST approval endpoints in
 * server.ts were writing/reading from three different stores. This bus
 * unifies them so that:
 *
 *   1. A marketing workflow step with `requiresApproval: true` calls
 *      `waitForApproval(execId, stepId)` which returns a promise.
 *   2. The REST endpoint `POST /api/executions/:id/approve/:stepId` calls
 *      `approve(execId, stepId)` which resolves the pending promise.
 *   3. `reject(execId, stepId, reason)` resolves with { approved: false }
 *      and lets the loop fail cleanly.
 *   4. Timeout: approvals default to 7-day TTL; callers may override.
 *
 * The bus is also SLA-aware — it emits `approval.requested`,
 * `approval.granted`, `approval.rejected`, `approval.expired` on the
 * event bus so Slack / email notifiers can subscribe.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { eventBus } from './event-bus.js';

export interface ApprovalDecision {
  approved: boolean;
  approverId?: string;
  reason?: string;
  decidedAt: string;
}

type PendingEntry = {
  execId: string;
  stepId: string;
  resolve: (d: ApprovalDecision) => void;
  timer: NodeJS.Timeout;
  slaTimer?: NodeJS.Timeout;
  requestedAt: string;
  slaMs?: number;
  slaBreachedAt?: string;
  requesterId?: string;
  stepName?: string;
};

const pending = new Map<string, PendingEntry>();
const decisions = new Map<string, ApprovalDecision>();

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/** Default SLA — an approval is "breaching" if pending > 24h. */
const DEFAULT_SLA_MS = 24 * 60 * 60 * 1000;

function key(execId: string, stepId: string): string {
  return `${execId}::${stepId}`;
}

/**
 * Block until a user approves or rejects the step via REST.
 * Returns immediately with prior decision if already made.
 */
export function waitForApproval(
  execId: string,
  stepId: string,
  opts?: { ttlMs?: number; slaMs?: number; requesterId?: string; stepName?: string },
): Promise<ApprovalDecision> {
  const k = key(execId, stepId);
  const existing = decisions.get(k);
  if (existing) return Promise.resolve(existing);

  return new Promise<ApprovalDecision>((resolve) => {
    const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS;
    const sla = opts?.slaMs ?? DEFAULT_SLA_MS;
    const timer = setTimeout(() => {
      const p = pending.get(k);
      if (p?.slaTimer) clearTimeout(p.slaTimer);
      pending.delete(k);
      const expired: ApprovalDecision = {
        approved: false,
        reason: 'Approval request expired without a decision',
        decidedAt: new Date().toISOString(),
      };
      decisions.set(k, expired);
      void eventBus.emit('approval.expired', { execId, stepId });
      resolve(expired);
    }, ttl);

    // SLA breach — schedule a notification if still pending after `sla`.
    const slaTimer = setTimeout(() => {
      const p = pending.get(k);
      if (!p) return;
      p.slaBreachedAt = new Date().toISOString();
      void eventBus.emit('approval.sla_breached', {
        execId, stepId, requesterId: p.requesterId, stepName: p.stepName,
        requestedAt: p.requestedAt, slaMs: sla,
      });
    }, sla);

    pending.set(k, {
      execId,
      stepId,
      resolve,
      timer,
      slaTimer,
      slaMs: sla,
      requestedAt: new Date().toISOString(),
      requesterId: opts?.requesterId,
      stepName: opts?.stepName,
    });

    void eventBus.emit('approval.requested', {
      execId,
      stepId,
      requesterId: opts?.requesterId,
      stepName: opts?.stepName,
      slaMs: sla,
    });
  });
}

/** Approve a pending step. Idempotent. */
export function approve(
  execId: string,
  stepId: string,
  approverId?: string,
): { success: boolean; message: string } {
  const k = key(execId, stepId);
  const entry = pending.get(k);
  if (!entry) {
    // No blocker — may still be valid (persona-api style synchronous flip).
    if (decisions.has(k)) return { success: true, message: 'Already decided' };
    return { success: false, message: 'No pending approval for this step' };
  }
  clearTimeout(entry.timer);
  if (entry.slaTimer) clearTimeout(entry.slaTimer);
  pending.delete(k);
  const decision: ApprovalDecision = {
    approved: true,
    approverId,
    decidedAt: new Date().toISOString(),
  };
  decisions.set(k, decision);
  entry.resolve(decision);
  void eventBus.emit('approval.granted', { execId, stepId, approverId });
  return { success: true, message: 'Approval recorded' };
}

/** Reject a pending step. */
export function reject(
  execId: string,
  stepId: string,
  approverId?: string,
  reason?: string,
): { success: boolean; message: string } {
  const k = key(execId, stepId);
  const entry = pending.get(k);
  if (!entry) {
    if (decisions.has(k)) return { success: true, message: 'Already decided' };
    return { success: false, message: 'No pending approval for this step' };
  }
  clearTimeout(entry.timer);
  if (entry.slaTimer) clearTimeout(entry.slaTimer);
  pending.delete(k);
  const decision: ApprovalDecision = {
    approved: false,
    approverId,
    reason,
    decidedAt: new Date().toISOString(),
  };
  decisions.set(k, decision);
  entry.resolve(decision);
  void eventBus.emit('approval.rejected', { execId, stepId, approverId, reason });
  return { success: true, message: 'Rejection recorded' };
}

/** Returns true if a waiter is actively pending. */
export function isPending(execId: string, stepId: string): boolean {
  return pending.has(key(execId, stepId));
}

/** Returns the decision if one has been made. */
export function getDecision(execId: string, stepId: string): ApprovalDecision | undefined {
  return decisions.get(key(execId, stepId));
}

/** Introspection — used for dashboards. */
export function listPending(): Array<{
  execId: string;
  stepId: string;
  requestedAt: string;
  requesterId?: string;
  stepName?: string;
  slaMs?: number;
  slaBreached: boolean;
  slaBreachedAt?: string;
  ageMs: number;
}> {
  const now = Date.now();
  return Array.from(pending.values()).map((p) => {
    const ageMs = now - new Date(p.requestedAt).getTime();
    const slaBreached = Boolean(p.slaBreachedAt) || (p.slaMs ? ageMs > p.slaMs : false);
    return {
      execId: p.execId,
      stepId: p.stepId,
      requestedAt: p.requestedAt,
      requesterId: p.requesterId,
      stepName: p.stepName,
      slaMs: p.slaMs,
      slaBreached,
      slaBreachedAt: p.slaBreachedAt,
      ageMs,
    };
  });
}

/** SLA summary for dashboards. */
export function getApprovalSlaSummary(): {
  totalPending: number;
  breaching: number;
  nearBreach: number;
  avgAgeMs: number;
} {
  const list = listPending();
  const totalPending = list.length;
  const breaching = list.filter((l) => l.slaBreached).length;
  const nearBreach = list.filter((l) => !l.slaBreached && l.slaMs && l.ageMs > l.slaMs * 0.75).length;
  const avgAgeMs = list.length === 0 ? 0 : list.reduce((s, l) => s + l.ageMs, 0) / list.length;
  return { totalPending, breaching, nearBreach, avgAgeMs };
}

/** Test-only: clear all state. */
export function _resetApprovalBus(): void {
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    if (p.slaTimer) clearTimeout(p.slaTimer);
  }
  pending.clear();
  decisions.clear();
}
