'use client';
/**
 * NotificationCenter — Multi-channel notification management with channels,
 * rules, delivery history, and webhook endpoint configuration.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/* ── Types ─────────────────────────────────────────────────────────────── */

type DispatchChannel = 'slack' | 'teams' | 'email' | 'webhook';
type NotificationTrigger = 'execution.completed' | 'execution.failed' | 'step.approval_needed' | 'agent.retraining_flagged' | 'vision.decomposed' | 'pmo.escalation' | 'kpi.threshold_breach';

interface ChannelConfig {
  id: string;
  name: string;
  type: DispatchChannel;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
}

interface NotificationRule {
  id: string;
  name: string;
  trigger: NotificationTrigger;
  channelIds: string[];
  enabled: boolean;
  template?: { subject: string; body: string };
  filters?: Record<string, unknown>;
  createdAt: string;
}

interface DeliveryRecord {
  id: string;
  channelId: string;
  channelName: string;
  subject: string;
  status: 'delivered' | 'failed' | 'retrying';
  attempts: number;
  error?: string;
  createdAt: string;
}

interface DeliveryStats {
  total: number;
  delivered: number;
  failed: number;
  retrying: number;
}

interface WebhookEndpoint {
  id: string;
  name: string;
  eventPrefix: string;
  secret: string;
  active: boolean;
  receivedCount: number;
  createdAt: string;
}

interface WebhookSubscription {
  id: string;
  eventPattern: string;
  targetUrl: string;
  active: boolean;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
}

type Tab = 'channels' | 'rules' | 'deliveries' | 'webhooks';

/* ── Helpers ───────────────────────────────────────────────────────────── */

const CHANNEL_ICONS: Record<DispatchChannel, string> = {
  slack: '💬', teams: '🟦', email: '📧', webhook: '🔗',
};

const TRIGGER_LABELS: Record<NotificationTrigger, string> = {
  'execution.completed': 'Execution Completed',
  'execution.failed': 'Execution Failed',
  'step.approval_needed': 'Approval Needed',
  'agent.retraining_flagged': 'Retraining Flagged',
  'vision.decomposed': 'Vision Decomposed',
  'pmo.escalation': 'PMO Escalation',
  'kpi.threshold_breach': 'KPI Threshold Breach',
};

const STATUS_PILL: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  retrying: 'bg-amber-100 text-amber-700',
};

/* ── Component ────────────────────────────────────────────────────────── */

export default function NotificationCenter() {
  const [tab, setTab] = useState<Tab>('channels');
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [stats, setStats] = useState<DeliveryStats>({ total: 0, delivered: 0, failed: 0, retrying: 0 });
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);

  // Form states
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showEndpointForm, setShowEndpointForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);

  // Channel form
  const [chName, setChName] = useState('');
  const [chType, setChType] = useState<DispatchChannel>('slack');
  const [chConfigJson, setChConfigJson] = useState('{}');

  // Rule form
  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState<NotificationTrigger>('execution.completed');
  const [ruleChannelIds, setRuleChannelIds] = useState('');
  const [ruleSubject, setRuleSubject] = useState('');
  const [ruleBody, setRuleBody] = useState('');

  // Endpoint form
  const [epName, setEpName] = useState('');
  const [epPrefix, setEpPrefix] = useState('');

  // Subscription form
  const [subPattern, setSubPattern] = useState('');
  const [subUrl, setSubUrl] = useState('');

  /* ── Data fetching ──────────────────────────────────────────────────── */

  const fetchChannels = () => fetch(`${API}/api/notifications/channels`).then(r => r.json()).then(d => setChannels(d.channels ?? [])).catch(() => {});
  const fetchRules = () => fetch(`${API}/api/notifications/rules`).then(r => r.json()).then(d => setRules(d.rules ?? [])).catch(() => {});
  const fetchDeliveries = () => {
    fetch(`${API}/api/notifications/deliveries?limit=100`).then(r => r.json()).then(d => setDeliveries(d.deliveries ?? [])).catch(() => {});
    fetch(`${API}/api/notifications/deliveries/stats`).then(r => r.json()).then(d => setStats(d)).catch(() => {});
  };
  const fetchWebhooks = () => {
    fetch(`${API}/api/webhooks/endpoints`).then(r => r.json()).then(d => setEndpoints(d.endpoints ?? [])).catch(() => {});
    fetch(`${API}/api/webhooks/subscriptions`).then(r => r.json()).then(d => setSubscriptions(d.subscriptions ?? [])).catch(() => {});
  };

  useEffect(() => {
    fetchChannels();
    fetchRules();
    fetchDeliveries();
    fetchWebhooks();
  }, []);

  /* ── CRUD handlers ──────────────────────────────────────────────────── */

  const addChannel = async () => {
    let config: Record<string, unknown> = {};
    try { config = JSON.parse(chConfigJson); } catch { /* keep empty */ }
    await fetch(`${API}/api/notifications/channels`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: chName, type: chType, config }),
    });
    setChName(''); setChType('slack'); setChConfigJson('{}');
    setShowChannelForm(false);
    fetchChannels();
  };

  const toggleChannel = async (id: string, enabled: boolean) => {
    await fetch(`${API}/api/notifications/channels/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    });
    fetchChannels();
  };

  const removeChannel = async (id: string) => {
    await fetch(`${API}/api/notifications/channels/${encodeURIComponent(id)}`, { method: 'DELETE' });
    fetchChannels();
  };

  const addRule = async () => {
    const channelIds = ruleChannelIds.split(',').map(s => s.trim()).filter(Boolean);
    await fetch(`${API}/api/notifications/rules`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: ruleName, trigger: ruleTrigger, channelIds,
        template: ruleSubject || ruleBody ? { subject: ruleSubject, body: ruleBody } : undefined,
      }),
    });
    setRuleName(''); setRuleTrigger('execution.completed'); setRuleChannelIds(''); setRuleSubject(''); setRuleBody('');
    setShowRuleForm(false);
    fetchRules();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await fetch(`${API}/api/notifications/rules/${encodeURIComponent(id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    });
    fetchRules();
  };

  const removeRule = async (id: string) => {
    await fetch(`${API}/api/notifications/rules/${encodeURIComponent(id)}`, { method: 'DELETE' });
    fetchRules();
  };

  const addEndpoint = async () => {
    await fetch(`${API}/api/webhooks/endpoints`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: epName, eventPrefix: epPrefix }),
    });
    setEpName(''); setEpPrefix('');
    setShowEndpointForm(false);
    fetchWebhooks();
  };

  const removeEndpoint = async (id: string) => {
    await fetch(`${API}/api/webhooks/endpoints/${encodeURIComponent(id)}`, { method: 'DELETE' });
    fetchWebhooks();
  };

  const addSubscription = async () => {
    await fetch(`${API}/api/webhooks/subscriptions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventPattern: subPattern, targetUrl: subUrl }),
    });
    setSubPattern(''); setSubUrl('');
    setShowSubForm(false);
    fetchWebhooks();
  };

  const removeSub = async (id: string) => {
    await fetch(`${API}/api/webhooks/subscriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    fetchWebhooks();
  };

  /* ── Tabs ───────────────────────────────────────────────────────────── */

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'channels', label: 'Channels', icon: '📡' },
    { key: 'rules', label: 'Rules', icon: '📋' },
    { key: 'deliveries', label: 'Delivery Log', icon: '📦' },
    { key: 'webhooks', label: 'Webhooks', icon: '🔗' },
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Center</h1>
        <p className="text-indigo-200 mb-6">Multi-channel dispatch, webhook connectors & delivery tracking</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{channels.length}</div>
            <div className="text-sm text-indigo-200">Channels</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{rules.length}</div>
            <div className="text-sm text-indigo-200">Rules</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <div className="text-sm text-indigo-200">Delivered</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{endpoints.length}</div>
            <div className="text-sm text-indigo-200">Webhooks</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Channels Tab ──────────────────────────────────────────────── */}
      {tab === 'channels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Notification Channels</h2>
            <button onClick={() => setShowChannelForm(!showChannelForm)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Channel</button>
          </div>

          {showChannelForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input value={chName} onChange={e => setChName(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. #ops-alerts" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select value={chType} onChange={e => setChType(e.target.value as DispatchChannel)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="slack">Slack</option>
                    <option value="teams">Teams</option>
                    <option value="email">Email</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Config (JSON)</label>
                <textarea value={chConfigJson} onChange={e => setChConfigJson(e.target.value)} className="w-full px-3 py-2 border rounded-md font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} placeholder='{"webhookUrl":"https://hooks.slack.com/..."}' />
              </div>
              <button onClick={addChannel} disabled={!chName} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">Create Channel</button>
            </div>
          )}

          <div className="grid gap-3">
            {channels.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No channels configured. Add one to start receiving notifications.</div>}
            {channels.map(ch => (
              <div key={ch.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CHANNEL_ICONS[ch.type]}</span>
                  <div>
                    <h3 className="font-medium dark:text-white">{ch.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ch.type} • {ch.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleChannel(ch.id, ch.enabled)} className={`px-3 py-1 text-xs rounded-full font-medium ${ch.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ch.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button onClick={() => removeChannel(ch.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rules Tab ─────────────────────────────────────────────────── */}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Notification Rules</h2>
            <button onClick={() => setShowRuleForm(!showRuleForm)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Rule</button>
          </div>

          {showRuleForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input value={ruleName} onChange={e => setRuleName(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Alert on failures" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trigger</label>
                  <select value={ruleTrigger} onChange={e => setRuleTrigger(e.target.value as NotificationTrigger)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel IDs (comma-separated)</label>
                <input value={ruleChannelIds} onChange={e => setRuleChannelIds(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="ch_abc123, ch_def456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Subject (optional)</label>
                  <input value={ruleSubject} onChange={e => setRuleSubject(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Execution {{executionId}} failed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Body (optional)</label>
                  <input value={ruleBody} onChange={e => setRuleBody(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Agent {{agentId}} reported: {{error}}" />
                </div>
              </div>
              <button onClick={addRule} disabled={!ruleName} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">Create Rule</button>
            </div>
          )}

          <div className="grid gap-3">
            {rules.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-12">No rules configured. Add rules to route events to channels.</div>}
            {rules.map(rule => (
              <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium dark:text-white">{rule.name}</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleRule(rule.id, rule.enabled)} className={`px-3 py-1 text-xs rounded-full font-medium ${rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rule.enabled ? 'Active' : 'Paused'}
                    </button>
                    <button onClick={() => removeRule(rule.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{TRIGGER_LABELS[rule.trigger]}</span>
                  <span>→</span>
                  <span>{rule.channelIds.length} channel{rule.channelIds.length !== 1 ? 's' : ''}</span>
                  {rule.template && <span className="text-gray-400 ml-2">• custom template</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deliveries Tab ────────────────────────────────────────────── */}
      {tab === 'deliveries' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Delivery Log</h2>
            <button onClick={fetchDeliveries} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white">Refresh</button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.delivered}</div>
              <div className="text-sm text-gray-500">Delivered</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.retrying}</div>
              <div className="text-sm text-gray-500">Retrying</div>
            </div>
          </div>

          {/* Delivery table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Subject</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Channel</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Attempts</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {deliveries.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">No deliveries yet.</td></tr>
                )}
                {deliveries.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 dark:text-white">{d.subject}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{d.channelName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_PILL[d.status] ?? 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{d.attempts}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Webhooks Tab ──────────────────────────────────────────────── */}
      {tab === 'webhooks' && (
        <div className="space-y-6">
          {/* ── Inbound Endpoints ─────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold dark:text-white">Inbound Endpoints</h2>
              <button onClick={() => setShowEndpointForm(!showEndpointForm)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Endpoint</button>
            </div>

            {showEndpointForm && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input value={epName} onChange={e => setEpName(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. GitHub Webhook" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Prefix</label>
                    <input value={epPrefix} onChange={e => setEpPrefix(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. github" />
                  </div>
                </div>
                <button onClick={addEndpoint} disabled={!epName || !epPrefix} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">Create Endpoint</button>
              </div>
            )}

            <div className="grid gap-3">
              {endpoints.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-8">No inbound endpoints. Create one to receive external webhooks.</div>}
              {endpoints.map(ep => (
                <div key={ep.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium dark:text-white">{ep.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Prefix: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{ep.eventPrefix}</code></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ep.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{ep.active ? 'Active' : 'Inactive'}</span>
                      <button onClick={() => removeEndpoint(ep.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>URL: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{API}/api/webhooks/receive/{ep.id}</code></p>
                    <p>Secret: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{ep.secret.slice(0, 12)}...</code></p>
                    <p>Received: {ep.receivedCount} events</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Outbound Subscriptions ────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold dark:text-white">Outbound Subscriptions</h2>
              <button onClick={() => setShowSubForm(!showSubForm)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">+ Add Subscription</button>
            </div>

            {showSubForm && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Pattern</label>
                    <input value={subPattern} onChange={e => setSubPattern(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. execution.*" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target URL</label>
                    <input value={subUrl} onChange={e => setSubUrl(e.target.value)} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://example.com/hook" />
                  </div>
                </div>
                <button onClick={addSubscription} disabled={!subPattern || !subUrl} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">Create Subscription</button>
              </div>
            )}

            <div className="grid gap-3">
              {subscriptions.length === 0 && <div className="text-gray-500 dark:text-gray-400 text-center py-8">No outbound subscriptions. Subscribe to event patterns to forward them externally.</div>}
              {subscriptions.map(sub => (
                <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">{sub.eventPattern}</code>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">{sub.targetUrl}</span>
                    </div>
                    <p className="text-xs text-gray-400">{sub.deliveredCount} delivered • {sub.failedCount} failed</p>
                  </div>
                  <button onClick={() => removeSub(sub.id)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
