/**
 * Gateway-level rate limiter.
 * Wraps model-router's checkRateLimit() with per-role / per-persona limits
 * and sets standard rate-limit response headers.
 */

import { checkRateLimit } from './model-router.js';
import type { AuthUser } from './auth.js';
import type { ServerResponse } from 'node:http';

// ---------------------------------------------------------------------------
// Limits (requests per minute)
// ---------------------------------------------------------------------------

const LIMITS = {
  unauthenticated: 10,
  user: 120,
  operator: 300,
  admin: 500,
  persona: {
    engineering: 30,
    product: 30,
    hr: 20,
    marketing: 60,
    'talent-acquisition': 20,
    'program-management': 30,
  } as Record<string, number>,
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  blocked: boolean;
  limit: number;
  remaining: number;
  resetInMs: number;
}

/**
 * Check and enforce gateway rate limits.
 * Sets X-RateLimit-* headers on the response object.
 * Returns `{ blocked: true }` when the caller should return 429.
 */
export function applyRateLimit(
  res: ServerResponse,
  userId: string,
  role: AuthUser['role'] | 'unauthenticated' = 'unauthenticated',
  persona?: string,
): RateLimitResult {
  // Per-user global limit
  const roleLimits = LIMITS as Record<string, number | Record<string, number>>;
  const globalMax = (typeof roleLimits[role] === 'number' ? roleLimits[role] : LIMITS.user) as number;
  const globalKey = `gw:${userId}:global`;
  const global = checkRateLimit(globalKey, globalMax);

  // Per-persona limit (stricter)
  let personaResult = global;
  if (persona && persona in LIMITS.persona) {
    const personaMax = LIMITS.persona[persona];
    const personaKey = `gw:${userId}:persona:${persona}`;
    personaResult = checkRateLimit(personaKey, personaMax);
  }

  // Most restrictive of the two
  const blocked = !global.allowed || !personaResult.allowed;
  const remaining = Math.min(global.remaining, personaResult.remaining);
  const resetInMs = Math.max(global.resetInMs, personaResult.resetInMs);
  const limit = Math.min(globalMax, persona && LIMITS.persona[persona] ? LIMITS.persona[persona] : globalMax);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetInMs / 1000)));

  return { blocked, limit, remaining, resetInMs };
}
