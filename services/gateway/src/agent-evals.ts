/**
 * Agent Evals — CipherClaw-inspired evaluation and guardrails engine
 *
 * Tracks agent performance via cognitive fingerprints, drift detection,
 * health scores, breakpoints, and predictive failure analysis.
 */

export interface CognitiveFingerprint {
  accuracy: number;
  speed: number;
  costEfficiency: number;
  toolUsage: number;
  creativity: number;
  consistency: number;
  errorRate: number;
  satisfaction: number;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'drift' | 'cost' | 'latency' | 'error_rate' | 'token_budget';

export interface EvalAlert {
  id: string;
  agentId: string;
  agentName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  ts: string;
  acknowledged: boolean;
}

export interface Breakpoint {
  type: AlertType;
  threshold: number;
  enabled: boolean;
}

export interface AgentEvalConfig {
  agentId: string;
  agentName: string;
  breakpoints: Breakpoint[];
  baselineFingerprint?: CognitiveFingerprint;
  currentFingerprint: CognitiveFingerprint;
  driftThreshold: number;
  costThreshold?: number;
  tokenThreshold?: number;
  latencyThresholdMs?: number;
  healthScore: number;
  driftScore: number;
  totalExecutions: number;
  lastEvalAt: string;
}

export interface DriftRecord {
  ts: string;
  driftScore: number;
  fingerprint: CognitiveFingerprint;
}

export interface PredictedFailure {
  type: string;
  confidence: number;
  message: string;
}

export interface EvalReport {
  agentId: string;
  healthScore: number;
  fingerprint: CognitiveFingerprint;
  driftScore: number;
  alerts: EvalAlert[];
  predictedFailures: PredictedFailure[];
}

function randomFingerprint(): CognitiveFingerprint {
  return {
    accuracy: 0.7 + Math.random() * 0.25,
    speed: 0.6 + Math.random() * 0.35,
    costEfficiency: 0.5 + Math.random() * 0.4,
    toolUsage: 0.6 + Math.random() * 0.3,
    creativity: 0.4 + Math.random() * 0.5,
    consistency: 0.7 + Math.random() * 0.25,
    errorRate: Math.random() * 0.15,
    satisfaction: 0.7 + Math.random() * 0.25,
  };
}

function computeDrift(baseline: CognitiveFingerprint, current: CognitiveFingerprint): number {
  const keys: (keyof CognitiveFingerprint)[] = ['accuracy', 'speed', 'costEfficiency', 'toolUsage', 'creativity', 'consistency', 'errorRate', 'satisfaction'];
  let sum = 0;
  for (const k of keys) {
    sum += Math.abs(baseline[k] - current[k]);
  }
  return Math.round((sum / keys.length) * 100);
}

function computeHealthScore(fp: CognitiveFingerprint): number {
  const positives = (fp.accuracy + fp.speed + fp.costEfficiency + fp.toolUsage + fp.consistency + fp.satisfaction) / 6;
  const penalty = fp.errorRate * 2;
  return Math.round(Math.max(0, Math.min(100, positives * 100 - penalty * 100)));
}

const SEED_AGENTS: Array<{ id: string; name: string }> = [
  { id: 'prd-agent', name: 'PRD Agent' },
  { id: 'research-agent', name: 'Research Agent' },
  { id: 'code-review-agent', name: 'Code Review Agent' },
  { id: 'campaign-agent', name: 'Campaign Agent' },
  { id: 'copy-agent', name: 'Copy Agent' },
  { id: 'creative-agent', name: 'Creative Agent' },
  { id: 'security-agent', name: 'Security Agent' },
  { id: 'analytics-agent', name: 'Analytics Agent' },
  { id: 'forecasting-agent', name: 'Forecasting Agent' },
  { id: 'recruitment-agent', name: 'Recruitment Agent' },
];

export class AgentEvalsStore {
  private configs = new Map<string, AgentEvalConfig>();
  private driftHistory = new Map<string, DriftRecord[]>();
  private alerts: EvalAlert[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date().toISOString();
    for (const a of SEED_AGENTS) {
      const baseline = randomFingerprint();
      const current = randomFingerprint();
      const drift = computeDrift(baseline, current);
      const health = computeHealthScore(current);
      this.configs.set(a.id, {
        agentId: a.id,
        agentName: a.name,
        breakpoints: [
          { type: 'cost', threshold: 1.0, enabled: true },
          { type: 'latency', threshold: 30000, enabled: true },
          { type: 'error_rate', threshold: 0.15, enabled: true },
          { type: 'token_budget', threshold: 50000, enabled: true },
          { type: 'drift', threshold: 20, enabled: true },
        ],
        baselineFingerprint: baseline,
        currentFingerprint: current,
        driftThreshold: 15,
        costThreshold: 1.0,
        tokenThreshold: 50000,
        latencyThresholdMs: 30000,
        healthScore: health,
        driftScore: drift,
        totalExecutions: 20 + Math.floor(Math.random() * 100),
        lastEvalAt: now,
      });

      const history: DriftRecord[] = [];
      for (let i = 10; i >= 0; i--) {
        const ts = new Date(Date.now() - i * 86400000).toISOString();
        const fp = randomFingerprint();
        history.push({ ts, driftScore: computeDrift(baseline, fp), fingerprint: fp });
      }
      this.driftHistory.set(a.id, history);

      if (drift > 15) {
        this.alerts.push({
          id: `alert-${a.id}-drift`,
          agentId: a.id,
          agentName: a.name,
          type: 'drift',
          severity: drift > 30 ? 'critical' : drift > 20 ? 'high' : 'medium',
          message: `${a.name} cognitive drift at ${drift}% (threshold: 15%)`,
          value: drift,
          threshold: 15,
          ts: now,
          acknowledged: false,
        });
      }
      if (current.errorRate > 0.1) {
        this.alerts.push({
          id: `alert-${a.id}-error`,
          agentId: a.id,
          agentName: a.name,
          type: 'error_rate',
          severity: current.errorRate > 0.12 ? 'high' : 'medium',
          message: `${a.name} error rate at ${(current.errorRate * 100).toFixed(1)}%`,
          value: current.errorRate,
          threshold: 0.1,
          ts: now,
          acknowledged: false,
        });
      }
    }
  }

  getAllConfigs(): AgentEvalConfig[] {
    return Array.from(this.configs.values());
  }

  getConfig(agentId: string): AgentEvalConfig | undefined {
    return this.configs.get(agentId);
  }

  updateConfig(agentId: string, updates: Partial<AgentEvalConfig>): AgentEvalConfig | undefined {
    const cfg = this.configs.get(agentId);
    if (!cfg) return undefined;
    const updated = { ...cfg, ...updates, lastEvalAt: new Date().toISOString() };
    this.configs.set(agentId, updated);
    return updated;
  }

  getReport(agentId: string): EvalReport | undefined {
    const cfg = this.configs.get(agentId);
    if (!cfg) return undefined;

    const agentAlerts = this.alerts.filter(a => a.agentId === agentId);
    const predictions: PredictedFailure[] = [];

    if (cfg.currentFingerprint.errorRate > 0.08) {
      predictions.push({
        type: 'error_spike',
        confidence: 0.6 + cfg.currentFingerprint.errorRate * 2,
        message: `Error rate trending up — predicted spike within 24h`,
      });
    }
    if (cfg.driftScore > cfg.driftThreshold * 0.8) {
      predictions.push({
        type: 'drift_threshold',
        confidence: 0.7,
        message: `Drift approaching threshold (${cfg.driftScore}% / ${cfg.driftThreshold}%)`,
      });
    }
    if (cfg.currentFingerprint.costEfficiency < 0.5) {
      predictions.push({
        type: 'cost_overrun',
        confidence: 0.55,
        message: 'Cost efficiency below 50% — budget exhaustion risk',
      });
    }

    return {
      agentId,
      healthScore: cfg.healthScore,
      fingerprint: cfg.currentFingerprint,
      driftScore: cfg.driftScore,
      alerts: agentAlerts,
      predictedFailures: predictions,
    };
  }

  getDriftHistory(agentId: string): DriftRecord[] {
    return this.driftHistory.get(agentId) || [];
  }

  setBaseline(agentId: string): AgentEvalConfig | undefined {
    const cfg = this.configs.get(agentId);
    if (!cfg) return undefined;
    cfg.baselineFingerprint = { ...cfg.currentFingerprint };
    cfg.driftScore = 0;
    cfg.lastEvalAt = new Date().toISOString();
    this.configs.set(agentId, cfg);
    this.alerts = this.alerts.filter(a => !(a.agentId === agentId && a.type === 'drift'));
    return cfg;
  }

  getAlerts(agentId?: string): EvalAlert[] {
    if (agentId) return this.alerts.filter(a => a.agentId === agentId);
    return [...this.alerts];
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;
    alert.acknowledged = true;
    return true;
  }

  getDashboard(): {
    totalAgents: number;
    avgHealthScore: number;
    activeAlerts: number;
    driftingAgents: number;
    agents: AgentEvalConfig[];
  } {
    const agents = this.getAllConfigs();
    const avgHealth = agents.length > 0
      ? Math.round(agents.reduce((s, a) => s + a.healthScore, 0) / agents.length)
      : 0;
    return {
      totalAgents: agents.length,
      avgHealthScore: avgHealth,
      activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
      driftingAgents: agents.filter(a => a.driftScore > a.driftThreshold).length,
      agents,
    };
  }

  _exportData() {
    return {
      configs: Array.from(this.configs.entries()),
      driftHistory: Array.from(this.driftHistory.entries()),
      alerts: this.alerts,
    };
  }

  _importData(data: { configs?: [string, AgentEvalConfig][]; driftHistory?: [string, DriftRecord[]][]; alerts?: EvalAlert[] }) {
    if (data.configs) { this.configs = new Map(data.configs); }
    if (data.driftHistory) { this.driftHistory = new Map(data.driftHistory); }
    if (data.alerts) { this.alerts = data.alerts; }
  }
}

export const agentEvalsStore = new AgentEvalsStore();
