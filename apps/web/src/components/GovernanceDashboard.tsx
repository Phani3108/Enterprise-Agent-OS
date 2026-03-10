'use client';

import { useState, useEffect } from 'react';
import { getLicenses } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LicenseRow {
  toolId: string;
  toolName: string;
  icon: string;
  licenseType: string;
  totalLicenses: number;
  usedLicenses: number;
  costPerMonth: number;
  expirationDate: string;
  status: 'active' | 'expiring_soon' | 'expired';
}

interface CostRow {
  personaId: string;
  personaName: string;
  personaIcon: string;
  skillsUsed: number;
  toolCalls: number;
  estimatedCostUsd: number;
  budgetUsd: number;
  budgetPct: number;
}

interface AccessRow {
  userId: string;
  userName: string;
  role: string;
  connectedTools: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

interface AuditRow {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  target: string;
  result: 'success' | 'failure' | 'warning';
}

interface ComplianceItem {
  id: string;
  policy: string;
  category: string;
  status: 'pass' | 'fail' | 'warning' | 'na';
  detail: string;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_LICENSES: LicenseRow[] = [
  { toolId: 't1', toolName: 'GitHub Enterprise',   icon: '🐙', licenseType: 'Enterprise', totalLicenses: 50,  usedLicenses: 42, costPerMonth: 2100, expirationDate: '2026-06-30', status: 'active' },
  { toolId: 't2', toolName: 'Jira Software',       icon: '📋', licenseType: 'Business',   totalLicenses: 100, usedLicenses: 87, costPerMonth: 870,  expirationDate: '2026-03-31', status: 'expiring_soon' },
  { toolId: 't3', toolName: 'Confluence',          icon: '📄', licenseType: 'Business',   totalLicenses: 100, usedLicenses: 79, costPerMonth: 795,  expirationDate: '2026-03-31', status: 'expiring_soon' },
  { toolId: 't4', toolName: 'HubSpot Sales Hub',   icon: '🎯', licenseType: 'Professional',totalLicenses: 25, usedLicenses: 18, costPerMonth: 1400, expirationDate: '2026-12-31', status: 'active' },
  { toolId: 't5', toolName: 'Canva for Teams',     icon: '🎨', licenseType: 'Teams',      totalLicenses: 30,  usedLicenses: 22, costPerMonth: 300,  expirationDate: '2026-09-30', status: 'active' },
  { toolId: 't6', toolName: 'Google Workspace',    icon: '📧', licenseType: 'Business+',  totalLicenses: 150, usedLicenses: 143,costPerMonth: 2145, expirationDate: '2027-01-31', status: 'active' },
  { toolId: 't7', toolName: 'LinkedIn Ads',        icon: '💼', licenseType: 'Subscription',totalLicenses: 5, usedLicenses: 3,  costPerMonth: 850,  expirationDate: '2025-12-31', status: 'expired' },
  { toolId: 't8', toolName: 'Datadog',             icon: '📊', licenseType: 'Pro',        totalLicenses: 20,  usedLicenses: 15, costPerMonth: 1200, expirationDate: '2026-08-31', status: 'active' },
];

const SEED_COSTS: CostRow[] = [
  { personaId: 'p1', personaName: 'Engineering',  personaIcon: '⚙️', skillsUsed: 847, toolCalls: 3421, estimatedCostUsd: 892.40,  budgetUsd: 1500, budgetPct: 59.5 },
  { personaId: 'p2', personaName: 'Marketing',    personaIcon: '📣', skillsUsed: 634, toolCalls: 2187, estimatedCostUsd: 721.80,  budgetUsd: 1000, budgetPct: 72.2 },
  { personaId: 'p3', personaName: 'Product',      personaIcon: '🎯', skillsUsed: 412, toolCalls: 1654, estimatedCostUsd: 498.60,  budgetUsd: 800,  budgetPct: 62.3 },
  { personaId: 'p4', personaName: 'Sales',        personaIcon: '💰', skillsUsed: 298, toolCalls: 1203, estimatedCostUsd: 367.20,  budgetUsd: 600,  budgetPct: 61.2 },
  { personaId: 'p5', personaName: 'Finance',      personaIcon: '📈', skillsUsed: 187, toolCalls: 892,  estimatedCostUsd: 234.80,  budgetUsd: 500,  budgetPct: 46.9 },
  { personaId: 'p6', personaName: 'HR',           personaIcon: '👥', skillsUsed: 156, toolCalls: 678,  estimatedCostUsd: 189.40,  budgetUsd: 400,  budgetPct: 47.3 },
  { personaId: 'p7', personaName: 'Legal',        personaIcon: '⚖️', skillsUsed: 98,  toolCalls: 421,  estimatedCostUsd: 124.60,  budgetUsd: 300,  budgetPct: 41.5 },
  { personaId: 'p8', personaName: 'Corp IT',      personaIcon: '🏦', skillsUsed: 76,  toolCalls: 312,  estimatedCostUsd: 98.20,   budgetUsd: 250,  budgetPct: 39.3 },
];

const SEED_ACCESS: AccessRow[] = [
  { userId: 'u1', userName: 'Phani Marupaka',  role: 'Admin',    connectedTools: 14, lastActive: '2 min ago',   status: 'active' },
  { userId: 'u2', userName: 'Sarah Chen',      role: 'User',     connectedTools: 8,  lastActive: '15 min ago',  status: 'active' },
  { userId: 'u3', userName: 'Marcus Webb',     role: 'User',     connectedTools: 6,  lastActive: '1h ago',      status: 'active' },
  { userId: 'u4', userName: 'Yuki Tanaka',     role: 'User',     connectedTools: 9,  lastActive: '2h ago',      status: 'active' },
  { userId: 'u5', userName: 'Fatima Al-Hassan',role: 'Corp IT',  connectedTools: 12, lastActive: '3h ago',      status: 'active' },
  { userId: 'u6', userName: 'Riley Johnson',   role: 'Moderator',connectedTools: 5,  lastActive: '1d ago',      status: 'inactive' },
];

const SEED_AUDIT: AuditRow[] = [
  { id: 'au1', timestamp: new Date(Date.now() - 120000).toISOString(), userName: 'Phani Marupaka', action: 'Published skill',    target: 'PR Architecture Review v2.3',   result: 'success' },
  { id: 'au2', timestamp: new Date(Date.now() - 300000).toISOString(), userName: 'Sarah Chen',     action: 'Connected tool',     target: 'HubSpot Sales Hub',             result: 'success' },
  { id: 'au3', timestamp: new Date(Date.now() - 600000).toISOString(), userName: 'Marcus Webb',    action: 'Created workflow',   target: 'Feature Release Pipeline',      result: 'success' },
  { id: 'au4', timestamp: new Date(Date.now() - 900000).toISOString(), userName: 'Yuki Tanaka',    action: 'Failed skill run',   target: 'Budget Forecast (timeout)',     result: 'failure' },
  { id: 'au5', timestamp: new Date(Date.now() - 1800000).toISOString(),userName: 'Fatima Al-Hassan','action': 'License renewed', target: 'Jira Software (30 days)',       result: 'success' },
  { id: 'au6', timestamp: new Date(Date.now() - 3600000).toISOString(), userName: 'System',        action: 'Memory compacted',   target: 'Memory graph — 127 edges pruned', result: 'success' },
  { id: 'au7', timestamp: new Date(Date.now() - 7200000).toISOString(), userName: 'Phani Marupaka','action': 'Role assigned',   target: 'Riley Johnson → Moderator',     result: 'warning' },
  { id: 'au8', timestamp: new Date(Date.now() - 86400000).toISOString(),userName: 'Fatima Al-Hassan','action': 'Tool revoked',   target: 'LinkedIn Ads (expired)',        result: 'warning' },
];

const SEED_COMPLIANCE: ComplianceItem[] = [
  { id: 'c1',  policy: 'All tool connections use OAuth 2.0',           category: 'Security',    status: 'pass',    detail: '14/14 tools use OAuth or API key with rotation' },
  { id: 'c2',  policy: 'No expired licenses in active use',            category: 'Licensing',   status: 'fail',    detail: 'LinkedIn Ads license expired — still referenced in 2 skills' },
  { id: 'c3',  policy: 'GDPR — no PII stored in memory graph',        category: 'Privacy',     status: 'pass',    detail: 'Memory graph stores only anonymized execution IDs' },
  { id: 'c4',  policy: 'All AI outputs reviewed before external use',  category: 'AI Governance',status: 'warning','detail': '3 skills auto-publish to LinkedIn without human approval gate' },
  { id: 'c5',  policy: 'Audit log retained for 90 days',               category: 'Compliance',  status: 'pass',    detail: 'Audit log retention: 365 days (exceeds policy)' },
  { id: 'c6',  policy: 'Multi-factor authentication enabled',          category: 'Security',    status: 'pass',    detail: '100% of admin accounts have MFA enabled' },
  { id: 'c7',  policy: 'Budget alerts configured for all personas',    category: 'Cost',        status: 'warning', detail: '5/8 personas have budget alerts. Finance, Corp IT, Legal missing.' },
  { id: 'c8',  policy: 'Skill versioning enabled for production skills',category: 'Governance', status: 'pass',    detail: '6/6 production-tier skills have version history' },
  { id: 'c9',  policy: 'Tool capability scopes follow least-privilege',category: 'Security',    status: 'warning', detail: 'GitHub tool has write access not required by any current skill' },
  { id: 'c10', policy: 'Agent decisions logged with audit trail',       category: 'AI Governance',status: 'pass',  detail: 'All agent decisions captured in execution logs' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  expiring_soon: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  inactive: 'bg-gray-100 text-gray-500',
  success: 'bg-emerald-100 text-emerald-700',
  failure: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
};

const COMPLIANCE_BADGE: Record<string, string> = {
  pass: 'bg-emerald-100 text-emerald-700',
  fail: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  na: 'bg-gray-100 text-gray-500',
};

const COMPLIANCE_ICON: Record<string, string> = {
  pass: '✓', fail: '✗', warning: '⚠', na: '—',
};

type Tab = 'licenses' | 'costs' | 'access' | 'audit' | 'compliance';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GovernanceDashboard() {
  const [tab, setTab] = useState<Tab>('licenses');
  const [licenses, setLicenses] = useState<LicenseRow[]>(SEED_LICENSES);

  useEffect(() => {
    // Try to load live license data
    getLicenses().then(data => {
      if (!data) return;
      const d = data as { licenses?: Array<{ toolId: string; toolName: string; totalLicenses: number; usedLicenses: number; costPerMonth: number; expirationDate: string }> };
      if (d.licenses?.length) {
        // Merge with seed, enriching with live data
        setLicenses(prev => prev.map(p => {
          const live = d.licenses?.find(l => l.toolId === p.toolId || l.toolName === p.toolName);
          if (!live) return p;
          return { ...p, totalLicenses: live.totalLicenses, usedLicenses: live.usedLicenses, costPerMonth: live.costPerMonth };
        }));
      }
    }).catch(() => {});
  }, []);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'licenses',   label: 'Licenses' },
    { id: 'costs',      label: 'Cost Attribution' },
    { id: 'access',     label: 'Access & Permissions' },
    { id: 'audit',      label: 'Audit Log' },
    { id: 'compliance', label: `Compliance (${SEED_COMPLIANCE.filter(c => c.status === 'fail' || c.status === 'warning').length} issues)` },
  ];

  const totalMonthly = licenses.reduce((s, l) => s + l.costPerMonth, 0);
  const totalBudget = SEED_COSTS.reduce((s, c) => s + c.budgetUsd, 0);
  const totalSpend = SEED_COSTS.reduce((s, c) => s + c.estimatedCostUsd, 0);
  const failCount = SEED_COMPLIANCE.filter(c => c.status === 'fail').length;
  const warnCount = SEED_COMPLIANCE.filter(c => c.status === 'warning').length;

  return (
    <div className="h-full flex flex-col bg-gray-50/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-gray-900">Governance Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Corp IT oversight — licenses, costs, access, and compliance</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {failCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium border border-red-200">
              <span>✗</span> {failCount} compliance failure{failCount > 1 ? 's' : ''}
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">
              <span>⚠</span> {warnCount} warning{warnCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Summary tiles */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-100">
        <div className="grid grid-cols-4 gap-4">
          <SummaryTile label="Tool Licenses" value={`${licenses.length}`} sub={`${licenses.filter(l => l.status === 'expired').length} expired`} icon="🔌" />
          <SummaryTile label="Monthly Tool Cost" value={`$${(totalMonthly).toLocaleString()}`} sub="across all tools" icon="💳" />
          <SummaryTile label="AI Spend (MTD)" value={`$${totalSpend.toFixed(0)}`} sub={`of $${totalBudget} budget (${Math.round(totalSpend / totalBudget * 100)}%)`} icon="🤖" />
          <SummaryTile label="Compliance" value={`${SEED_COMPLIANCE.filter(c => c.status === 'pass').length}/${SEED_COMPLIANCE.length}`} sub={`${failCount} fail · ${warnCount} warn`} icon="✅" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    tab === t.id
                      ? 'text-gray-900 border-b-2 border-gray-900 -mb-px'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Licenses Tab */}
            {tab === 'licenses' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Tool</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">License Type</th>
                      <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Used / Total</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Cost / Mo</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Expires</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {licenses.map(lic => (
                      <tr key={lic.toolId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{lic.icon}</span>
                            <span className="font-medium text-gray-900">{lic.toolName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lic.licenseType}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="font-medium text-gray-900">{lic.usedLicenses}</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-500">{lic.totalLicenses}</span>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  lic.usedLicenses / lic.totalLicenses >= 0.9 ? 'bg-red-400' :
                                  lic.usedLicenses / lic.totalLicenses >= 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${(lic.usedLicenses / lic.totalLicenses) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ${lic.costPerMonth.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{fmtDate(lic.expirationDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[lic.status]}`}>
                            {lic.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cost Attribution Tab */}
            {tab === 'costs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Persona</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Skills Run</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Tool Calls</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">AI Spend</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Budget</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Budget Used</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {SEED_COSTS.map(row => (
                      <tr key={row.personaId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{row.personaIcon}</span>
                            <span className="font-medium text-gray-900">{row.personaName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">{row.skillsUsed.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{row.toolCalls.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">${row.estimatedCostUsd.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">${row.budgetUsd}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  row.budgetPct >= 90 ? 'bg-red-400' :
                                  row.budgetPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(row.budgetPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 w-8 text-right">{row.budgetPct.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/60">
                      <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {SEED_COSTS.reduce((s, r) => s + r.skillsUsed, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {SEED_COSTS.reduce((s, r) => s + r.toolCalls, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${SEED_COSTS.reduce((s, r) => s + r.estimatedCostUsd, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-400">
                        ${SEED_COSTS.reduce((s, r) => s + r.budgetUsd, 0)}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Access & Permissions Tab */}
            {tab === 'access' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">User</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Role</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Connected Tools</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Last Active</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {SEED_ACCESS.map(user => (
                      <tr key={user.userId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600 flex-shrink-0">
                              {user.userName.split(' ').map(n => n[0]).join('').slice(0,2)}
                            </div>
                            <span className="font-medium text-gray-900">{user.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'Corp IT' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'Moderator' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 font-medium">{user.connectedTools}</td>
                        <td className="px-4 py-3 text-gray-500">{user.lastActive}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[user.status]}`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Audit Log Tab */}
            {tab === 'audit' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Timestamp</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">User</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Action</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Target</th>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {SEED_AUDIT.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400 font-mono text-[10px] whitespace-nowrap">
                          {fmtTime(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{entry.userName}</td>
                        <td className="px-4 py-3 text-gray-700">{entry.action}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{entry.target}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[entry.result]}`}>
                            {entry.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Compliance Tab */}
            {tab === 'compliance' && (
              <div className="p-4 space-y-2">
                {['Security', 'Licensing', 'Privacy', 'AI Governance', 'Compliance', 'Cost', 'Governance'].map(cat => {
                  const items = SEED_COMPLIANCE.filter(c => c.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat}>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 mt-3 first:mt-0">{cat}</p>
                      <div className="space-y-1.5">
                        {items.map(item => (
                          <div key={item.id} className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                            item.status === 'pass' ? 'border-gray-100 bg-gray-50/30' :
                            item.status === 'warning' ? 'border-amber-100 bg-amber-50/30' :
                            'border-red-100 bg-red-50/30'
                          }`}>
                            <span className={`text-sm flex-shrink-0 mt-0.5 font-bold ${
                              item.status === 'pass' ? 'text-emerald-500' :
                              item.status === 'warning' ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              {COMPLIANCE_ICON[item.status]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900">{item.policy}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{item.detail}</p>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex-shrink-0 ${COMPLIANCE_BADGE[item.status]}`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-base font-bold text-gray-900">{value}</p>
        <p className="text-[11px] font-medium text-gray-600">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
