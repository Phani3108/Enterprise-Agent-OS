/**
 * RetrainingAlerts — Shows agents flagged for underperformance.
 * Displays severity, reason, suggested action, and allows acknowledgment/dismissal.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

interface RetrainingFlag {
  agentId: string;
  callSign: string;
  persona: string;
  flaggedAt: string;
  reason: 'low_quality' | 'handoff_failures' | 'high_latency' | 'high_cost';
  severity: 'warning' | 'critical';
  currentValue: number;
  threshold: number;
  consecutiveFailures: number;
  suggestedAction: string;
  acknowledged: boolean;
}

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  low_quality:      { label: 'Low Quality',      icon: '📉' },
  handoff_failures: { label: 'Handoff Failures',  icon: '🔗' },
  high_latency:     { label: 'High Latency',      icon: '🐢' },
  high_cost:        { label: 'High Cost',          icon: '💰' },
};

export function RetrainingAlerts() {
  const [flags, setFlags] = useState<RetrainingFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch(`${GATEWAY}/api/retraining`);
      if (!res.ok) return;
      const data = await res.json();
      setFlags(data.flags ?? []);
    } catch { /* gateway down */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const handleAcknowledge = async (agentId: string) => {
    await fetch(`${GATEWAY}/api/retraining/${encodeURIComponent(agentId)}/acknowledge`, { method: 'POST' });
    fetchFlags();
  };

  const handleDismiss = async (agentId: string) => {
    await fetch(`${GATEWAY}/api/retraining/${encodeURIComponent(agentId)}`, { method: 'DELETE' });
    fetchFlags();
  };

  if (loading) return <div className="text-[12px] text-slate-400 p-4">Loading alerts...</div>;
  if (flags.length === 0) return null;

  const critical = flags.filter(f => f.severity === 'critical');
  const warnings = flags.filter(f => f.severity === 'warning');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-slate-900">
          Agent Alerts
          <span className="ml-2 text-[12px] font-normal text-slate-400">{flags.length} flagged</span>
        </h3>
        {critical.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700">
            {critical.length} critical
          </span>
        )}
      </div>

      {flags.map(flag => {
        const meta = REASON_LABELS[flag.reason] ?? { label: flag.reason, icon: '⚠' };
        return (
          <div
            key={`${flag.agentId}-${flag.reason}`}
            className={`rounded-lg border p-4 ${
              flag.severity === 'critical'
                ? 'border-red-200 bg-red-50/50'
                : 'border-amber-200 bg-amber-50/50'
            } ${flag.acknowledged ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{meta.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-900">{flag.callSign}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      flag.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{flag.severity}</span>
                    <span className="text-[11px] text-slate-400">{flag.persona}</span>
                  </div>
                  <span className="text-[12px] text-slate-500">{meta.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!flag.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(flag.agentId)}
                    className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(flag.agentId)}
                  className="px-2 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="mt-2 text-[12px] text-slate-600">{flag.suggestedAction}</div>

            <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
              <span>Current: {typeof flag.currentValue === 'number'
                ? (flag.reason === 'high_cost' ? `$${flag.currentValue.toFixed(3)}` :
                   flag.reason === 'high_latency' ? `${(flag.currentValue / 1000).toFixed(1)}s` :
                   flag.reason === 'handoff_failures' ? `${flag.currentValue.toFixed(0)}%` :
                   flag.currentValue.toFixed(1))
                : flag.currentValue
              }</span>
              <span>Threshold: {typeof flag.threshold === 'number'
                ? (flag.reason === 'high_cost' ? `$${flag.threshold.toFixed(3)}` :
                   flag.reason === 'high_latency' ? `${(flag.threshold / 1000).toFixed(1)}s` :
                   flag.reason === 'handoff_failures' ? `${flag.threshold.toFixed(0)}%` :
                   flag.threshold.toFixed(1))
                : flag.threshold
              }</span>
              <span>Consecutive: {flag.consecutiveFailures}×</span>
              {flag.acknowledged && <span className="text-emerald-500">✓ Acknowledged</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
