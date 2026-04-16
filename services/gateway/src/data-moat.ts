/**
 * Data Moat v1 — Model-routing classifier, cross-tenant benchmark
 * leaderboard, drift forecasting, and a Skill Effectiveness Index (SEI).
 *
 * These are the 12-month data-moat bundle. Everything here reads from
 * existing ExecutionRecords in memory-graph.ts and the opt-in benchmark
 * contributions — nothing new is ingested.
 *
 * Intentionally lightweight statistical methods (no external deps). The
 * point is NOT to beat Netflix's recommendation engine — it is to turn
 * telemetry into live product surface so customers feel the network
 * effect.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { memoryGraph } from './memory-graph.js';
import type { ExecutionRecord } from './memory-graph.js';
import { getContributionLog } from './benchmark-ingest.js';

// ---------------------------------------------------------------------------
// Model-routing classifier
// ---------------------------------------------------------------------------

export interface ModelRoute {
  persona?: string;
  skillId?: string;
  bestModel: string;
  bestProvider: string;
  expectedCost: number;
  expectedQuality: number;
  sampleSize: number;
  alternatives: Array<{
    provider: string;
    model: string;
    avgCost: number;
    avgQuality: number;
    sampleSize: number;
  }>;
}

/** Train recommendations from the full in-memory execution log. */
export function trainModelRouter(): ModelRoute[] {
  const execs = memoryGraph.getExecutions(undefined, undefined, 100000).filter((e) => e.success);
  const groups = new Map<string, ExecutionRecord[]>();
  for (const e of execs) {
    const key = `${e.personaId ?? '*'}::${e.skillId ?? '*'}`;
    const arr = groups.get(key) ?? [];
    arr.push(e);
    groups.set(key, arr);
  }
  const routes: ModelRoute[] = [];
  for (const [key, records] of groups) {
    const [persona, skillId] = key.split('::');
    const modelStats = new Map<string, { costs: number[]; quality: number[]; provider: string }>();
    for (const r of records) {
      if (!r.modelId) continue;
      const k = r.modelId;
      const stats = modelStats.get(k) ?? { costs: [], quality: [], provider: r.modelProvider ?? 'unknown' };
      if (typeof r.cost === 'number') stats.costs.push(r.cost);
      if (typeof r.qualityScore === 'number') stats.quality.push(r.qualityScore);
      modelStats.set(k, stats);
    }
    if (modelStats.size === 0) continue;
    const alternatives = Array.from(modelStats.entries()).map(([model, s]) => ({
      provider: s.provider,
      model,
      avgCost: s.costs.length ? s.costs.reduce((a, b) => a + b, 0) / s.costs.length : 0,
      avgQuality: s.quality.length ? s.quality.reduce((a, b) => a + b, 0) / s.quality.length : 0,
      sampleSize: Math.max(s.costs.length, s.quality.length),
    }));
    const scored = alternatives
      .map((a) => ({ ...a, score: a.avgQuality / Math.max(a.avgCost, 0.0001) }))
      .sort((a, b) => (b.score - a.score) || (b.sampleSize - a.sampleSize));
    const best = scored[0]!;
    routes.push({
      persona: persona === '*' ? undefined : persona,
      skillId: skillId === '*' ? undefined : skillId,
      bestModel: best.model,
      bestProvider: best.provider,
      expectedCost: best.avgCost,
      expectedQuality: best.avgQuality,
      sampleSize: records.length,
      alternatives: scored.slice(0, 5).map(({ score: _score, ...rest }) => rest),
    });
  }
  return routes.sort((a, b) => b.sampleSize - a.sampleSize);
}

/** Look up the best model for a given (persona, skillId). */
export function routeRequest(persona?: string, skillId?: string): ModelRoute | undefined {
  const all = trainModelRouter();
  let match = all.find((r) => r.persona === persona && r.skillId === skillId);
  if (match) return match;
  match = all.find((r) => r.persona === persona && !r.skillId);
  if (match) return match;
  match = all.find((r) => r.skillId === skillId && !r.persona);
  return match;
}

// ---------------------------------------------------------------------------
// Cross-tenant benchmark leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  tenantHash: string;
  category: 'speed' | 'cost' | 'quality' | 'success_rate';
  value: number;
  sampleSize: number;
}

export function computeLeaderboard(limit = 20): {
  speed: LeaderboardEntry[];
  cost: LeaderboardEntry[];
  quality: LeaderboardEntry[];
  success_rate: LeaderboardEntry[];
  totalTenants: number;
} {
  const contribs = getContributionLog(100000);
  const byTenant = new Map<string, typeof contribs>();
  for (const c of contribs) {
    const arr = byTenant.get(c.tenantHash) ?? [];
    arr.push(c);
    byTenant.set(c.tenantHash, arr);
  }

  function build(
    category: 'speed' | 'cost' | 'quality' | 'success_rate',
    pick: (rows: typeof contribs) => number,
    direction: 'asc' | 'desc',
  ): LeaderboardEntry[] {
    const rows: Array<{ tenantHash: string; value: number; sampleSize: number }> = [];
    for (const [tenantHash, r] of byTenant) {
      if (r.length < 10) continue;
      rows.push({ tenantHash, value: pick(r), sampleSize: r.length });
    }
    rows.sort((a, b) => (direction === 'asc' ? a.value - b.value : b.value - a.value));
    return rows.slice(0, limit).map((row, i) => ({
      rank: i + 1,
      tenantHash: row.tenantHash.slice(0, 12),
      category,
      value: Math.round(row.value * 1000) / 1000,
      sampleSize: row.sampleSize,
    }));
  }

  return {
    speed: build('speed',
      (rs) => rs.reduce((s, x) => s + (x.runtimeSec ?? 0), 0) / rs.length, 'asc'),
    cost: build('cost',
      (rs) => rs.reduce((s, x) => s + (x.cost ?? 0), 0) / rs.length, 'asc'),
    quality: build('quality',
      (rs) => rs.reduce((s, x) => s + (x.qualityScore ?? 0), 0) / rs.length, 'desc'),
    success_rate: build('success_rate',
      (rs) => rs.filter((x) => x.success).length / rs.length, 'desc'),
    totalTenants: byTenant.size,
  };
}

// ---------------------------------------------------------------------------
// Drift forecasting
// ---------------------------------------------------------------------------

export interface DriftForecast {
  agentId: string;
  currentHealth: number;
  predictedHealth7d: number;
  direction: 'improving' | 'stable' | 'declining';
  confidence: number;
  recommendation: string;
}

export function forecastDrift(): DriftForecast[] {
  const execs = memoryGraph.getExecutions(undefined, undefined, 100000);
  const byAgent = new Map<string, ExecutionRecord[]>();
  for (const e of execs) {
    for (const agentId of e.agentsUsed ?? []) {
      const arr = byAgent.get(agentId) ?? [];
      arr.push(e);
      byAgent.set(agentId, arr);
    }
  }

  const forecasts: DriftForecast[] = [];
  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  for (const [agentId, records] of byAgent) {
    if (records.length < 10) continue;
    const sorted = [...records].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const recent = sorted.filter((r) => nowMs - new Date(r.ts).getTime() < sevenDaysMs);
    if (recent.length < 5) continue;

    const xs = recent.map((_, i) => i);
    const ys = recent.map((r) => r.qualityScore ?? (r.success ? 0.9 : 0.3));
    const slope = linearSlope(xs, ys);
    const currentHealth = ys.reduce((a, b) => a + b, 0) / ys.length;
    const predictedHealth7d = Math.max(0, Math.min(1, currentHealth + slope * ys.length));
    const delta = predictedHealth7d - currentHealth;
    let direction: DriftForecast['direction'] = 'stable';
    if (delta > 0.05) direction = 'improving';
    else if (delta < -0.05) direction = 'declining';
    const confidence = Math.min(1, recent.length / 50);

    let recommendation: string;
    if (direction === 'declining' && predictedHealth7d < 0.6) {
      recommendation = 'Agent health is deteriorating — schedule prompt review and check recent tool errors.';
    } else if (direction === 'improving') {
      recommendation = 'Agent is improving — consider raising automation threshold and expanding scope.';
    } else {
      recommendation = 'Agent is stable — no intervention required.';
    }

    forecasts.push({
      agentId,
      currentHealth: Math.round(currentHealth * 100) / 100,
      predictedHealth7d: Math.round(predictedHealth7d * 100) / 100,
      direction,
      confidence: Math.round(confidence * 100) / 100,
      recommendation,
    });
  }
  return forecasts.sort((a, b) => a.predictedHealth7d - b.predictedHealth7d);
}

function linearSlope(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - meanX) * (ys[i]! - meanY);
    den += (xs[i]! - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ---------------------------------------------------------------------------
// Skill Effectiveness Index (SEI)
// ---------------------------------------------------------------------------

export interface SkillEffectivenessScore {
  skillId: string;
  overallScore: number;  // 0-100
  components: {
    successRate: number;
    costEfficiency: number;
    speedScore: number;
    approvalRate: number;
    userSatisfaction: number;
  };
  trend: 'up' | 'down' | 'flat';
  sampleSize: number;
  percentile: number;
}

export function computeSEI(): SkillEffectivenessScore[] {
  const execs = memoryGraph.getExecutions(undefined, undefined, 100000);
  const bySkill = new Map<string, ExecutionRecord[]>();
  for (const e of execs) {
    if (!e.skillId) continue;
    const arr = bySkill.get(e.skillId) ?? [];
    arr.push(e);
    bySkill.set(e.skillId, arr);
  }
  const raw: Array<SkillEffectivenessScore & { _score: number }> = [];
  for (const [skillId, records] of bySkill) {
    if (records.length < 3) continue;
    const successRate = records.filter((r) => r.success).length / records.length;
    const costRecords = records.filter((r) => typeof r.cost === 'number');
    const avgCost = costRecords.length
      ? costRecords.reduce((s, r) => s + (r.cost ?? 0), 0) / costRecords.length
      : 0;
    const costEfficiency = 1 / (1 + avgCost);
    const speedRecords = records.filter((r) => typeof r.runtimeSec === 'number');
    const avgSec = speedRecords.length
      ? speedRecords.reduce((s, r) => s + (r.runtimeSec ?? 0), 0) / speedRecords.length
      : 0;
    const speedScore = 1 / (1 + avgSec / 10);
    const gated = records.filter((r) => r.approvalOutcome !== undefined);
    const approvalRate = gated.length
      ? gated.filter((r) => r.approvalOutcome === 'approved' || r.approvalOutcome === 'auto').length / gated.length
      : 0.5;

    const fb = memoryGraph.getFeedback(skillId);
    const totalFb = fb.length;
    const ups = fb.filter((f) => f.vote === 'up').length;
    const userSatisfaction = totalFb === 0 ? 0.5 : ups / totalFb;

    const sorted = [...records].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const firstQ = avg(firstHalf.map((r) => r.qualityScore ?? (r.success ? 0.9 : 0.3)));
    const secondQ = avg(secondHalf.map((r) => r.qualityScore ?? (r.success ? 0.9 : 0.3)));
    const trend: 'up' | 'down' | 'flat' =
      secondQ - firstQ > 0.05 ? 'up' : secondQ - firstQ < -0.05 ? 'down' : 'flat';

    const components = {
      successRate: Math.round(successRate * 100) / 100,
      costEfficiency: Math.round(costEfficiency * 100) / 100,
      speedScore: Math.round(speedScore * 100) / 100,
      approvalRate: Math.round(approvalRate * 100) / 100,
      userSatisfaction: Math.round(userSatisfaction * 100) / 100,
    };
    const overallScore = Math.round(
      (components.successRate * 0.30
        + components.costEfficiency * 0.20
        + components.speedScore * 0.15
        + components.approvalRate * 0.20
        + components.userSatisfaction * 0.15) * 100,
    );

    raw.push({
      skillId,
      overallScore,
      components,
      trend,
      sampleSize: records.length,
      percentile: 0,
      _score: overallScore,
    });
  }
  const sorted = [...raw].sort((a, b) => a._score - b._score);
  sorted.forEach((s, i) => {
    s.percentile = sorted.length ? Math.round(((i + 1) / sorted.length) * 100) : 0;
  });
  return sorted
    .map(({ _score: _, ...s }) => s)
    .sort((a, b) => b.overallScore - a.overallScore);
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
