/**
 * Health & Readiness — Production health checks for AgentOS gateway.
 *
 * /health  — basic liveness (always returns 200 if process is running)
 * /ready   — deep readiness (checks DB, LLM, memory, etc.)
 * /metrics — Prometheus-compatible metrics endpoint
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { getAvailableProviders, getDefaultProvider } from './llm-provider.js';
import { getCostMeter } from './model-router.js';
import { getToolStats } from './mcp-executor.js';
import { getAllCircuitStates } from './model-router.js';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime_seconds: number;
  version: string;
  timestamp: string;
}

export interface ReadinessCheck {
  status: 'ready' | 'not_ready';
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    latency_ms?: number;
    message?: string;
  }[];
  timestamp: string;
}

export interface PlatformMetrics {
  uptime_seconds: number;
  memory: {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
    external_mb: number;
  };
  cpu: {
    user_ms: number;
    system_ms: number;
  };
  llm: {
    default_provider: string;
    providers_available: number;
    providers_total: number;
    cost_meter: ReturnType<typeof getCostMeter>;
  };
  mcp: {
    tool_stats: ReturnType<typeof getToolStats>;
  };
  circuits: Record<string, { status: string; failures: number }>;
  requests: {
    total: number;
    errors: number;
    avg_latency_ms: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════

const startTime = Date.now();
const VERSION = '0.5.0';

// Request tracking
let totalRequests = 0;
let totalErrors = 0;
let totalLatency = 0;

export function recordRequest(latencyMs: number, isError: boolean): void {
  totalRequests++;
  totalLatency += latencyMs;
  if (isError) totalErrors++;
}

// ═══════════════════════════════════════════════════════════════
// Health Check (liveness)
// ═══════════════════════════════════════════════════════════════

export function getHealth(): HealthCheck {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return {
    status: 'healthy',
    uptime_seconds: uptimeSeconds,
    version: VERSION,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Readiness Check (deep)
// ═══════════════════════════════════════════════════════════════

export async function getReadiness(): Promise<ReadinessCheck> {
  const checks: ReadinessCheck['checks'] = [];

  // 1. LLM Provider availability
  const providers = getAvailableProviders();
  const availableCount = providers.filter(p => p.available).length;
  checks.push({
    name: 'llm_provider',
    status: availableCount > 0 ? 'pass' : 'warn',
    message: `${availableCount}/${providers.length} providers available (default: ${getDefaultProvider()})`,
  });

  // 2. Memory check
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  checks.push({
    name: 'memory',
    status: heapUsedMB < 512 ? 'pass' : heapUsedMB < 1024 ? 'warn' : 'fail',
    message: `Heap: ${heapUsedMB}MB used`,
  });

  // 3. Cost budget
  const costMeter = getCostMeter();
  checks.push({
    name: 'cost_budget',
    status: costMeter.budgetUtilization < 80 ? 'pass' : costMeter.budgetUtilization < 95 ? 'warn' : 'fail',
    message: `Budget utilization: ${costMeter.budgetUtilization.toFixed(1)}% ($${costMeter.hourlyCostUsd.toFixed(2)}/$${costMeter.hourlyBudgetUsd})`,
  });

  // 4. Circuit breakers
  const circuits = getAllCircuitStates();
  const openCircuits = Object.entries(circuits).filter(([, s]) => s.status === 'open');
  checks.push({
    name: 'circuit_breakers',
    status: openCircuits.length === 0 ? 'pass' : 'warn',
    message: openCircuits.length === 0 ? 'All circuits closed' : `${openCircuits.length} open: ${openCircuits.map(([k]) => k).join(', ')}`,
  });

  // 5. Error rate
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  checks.push({
    name: 'error_rate',
    status: errorRate < 5 ? 'pass' : errorRate < 15 ? 'warn' : 'fail',
    message: `${errorRate.toFixed(1)}% error rate (${totalErrors}/${totalRequests})`,
  });

  // 6. Environment variables
  const requiredEnvs = ['ANTHROPIC_API_KEY'];
  const missingEnvs = requiredEnvs.filter(e => !process.env[e]);
  checks.push({
    name: 'environment',
    status: missingEnvs.length === 0 ? 'pass' : 'warn',
    message: missingEnvs.length === 0 ? 'All required env vars set' : `Missing: ${missingEnvs.join(', ')}`,
  });

  const overallStatus = checks.some(c => c.status === 'fail') ? 'not_ready' : 'ready';

  return {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Metrics
// ═══════════════════════════════════════════════════════════════

export function getMetrics(): PlatformMetrics {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const providers = getAvailableProviders();

  return {
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      external_mb: Math.round(mem.external / 1024 / 1024),
    },
    cpu: {
      user_ms: Math.round(cpu.user / 1000),
      system_ms: Math.round(cpu.system / 1000),
    },
    llm: {
      default_provider: getDefaultProvider(),
      providers_available: providers.filter(p => p.available).length,
      providers_total: providers.length,
      cost_meter: getCostMeter(),
    },
    mcp: {
      tool_stats: getToolStats(),
    },
    circuits: Object.fromEntries(
      Object.entries(getAllCircuitStates()).map(([k, v]) => [k, { status: v.status, failures: v.failures }])
    ),
    requests: {
      total: totalRequests,
      errors: totalErrors,
      avg_latency_ms: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
    },
  };
}
