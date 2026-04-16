/**
 * Governance v2 — YAML policy import/export, approval routing, data
 * residency, compliance pack, and a lightweight red-team scanner.
 *
 * This is the 12-month governance-moat bundle. We intentionally keep the
 * implementation self-contained (no new dependencies) so it can run in
 * dev mode without a pnpm install.
 *
 * The YAML parser here is a deliberate *minimal* subset — it handles
 * the shape we need for policy docs:
 *
 *   - flat or two-level nested mappings with 2-space indentation
 *   - arrays with `- value` items
 *   - scalar strings, numbers, booleans, nulls
 *   - quoted strings ("..." or '...')
 *
 * It is NOT a general YAML 1.2 parser. If customers need anchors,
 * tags, or multi-doc streams, we ship the `yaml` npm package in 12m.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { registerStore } from './gateway-persistence.js';
import {
  createPolicy, listPolicies, updatePolicy, deletePolicy, type PolicyRule,
} from './policy-store.js';

// ---------------------------------------------------------------------------
// Minimal YAML parser (self-contained, no deps)
// ---------------------------------------------------------------------------

function parseScalar(v: string): string | number | boolean | null {
  const trimmed = v.trim();
  if (trimmed === '' || trimmed === '~' || trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

/** Parse minimal YAML. Supports mappings, arrays, scalars. */
export function parseYaml(text: string): unknown {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').replace(/\s+$/, ''));

  let i = 0;
  function indentOf(s: string): number {
    let n = 0;
    while (n < s.length && s[n] === ' ') n++;
    return n;
  }

  function parseBlock(baseIndent: number): unknown {
    const obj: Record<string, unknown> = {};
    let arr: unknown[] | null = null;

    while (i < lines.length) {
      const line = lines[i]!;
      if (line.trim() === '') { i++; continue; }
      const ind = indentOf(line);
      if (ind < baseIndent) break;
      if (ind > baseIndent && arr === null && Object.keys(obj).length === 0) {
        // nested block but no parent key — shouldn't happen
        break;
      }
      if (ind !== baseIndent) break;

      const content = line.slice(ind);
      if (content.startsWith('- ')) {
        arr = arr ?? [];
        const rest = content.slice(2);
        if (rest.includes(':')) {
          // inline object item: "- key: value"
          i++;
          const colon = rest.indexOf(':');
          const k = rest.slice(0, colon).trim();
          const v = rest.slice(colon + 1);
          const entry: Record<string, unknown> = {};
          entry[k] = v.trim() === '' ? parseBlock(baseIndent + 2) : parseScalar(v);
          // Continue collecting subsequent keys at baseIndent+2 as part of this array item
          while (i < lines.length) {
            const l2 = lines[i]!;
            if (l2.trim() === '') { i++; continue; }
            const ind2 = indentOf(l2);
            if (ind2 !== baseIndent + 2) break;
            const c2 = l2.slice(ind2);
            const colon2 = c2.indexOf(':');
            if (colon2 < 0) break;
            const k2 = c2.slice(0, colon2).trim();
            const v2 = c2.slice(colon2 + 1);
            if (v2.trim() === '') {
              i++;
              entry[k2] = parseBlock(baseIndent + 4);
            } else {
              i++;
              entry[k2] = parseScalar(v2);
            }
          }
          arr.push(entry);
        } else {
          arr.push(parseScalar(rest));
          i++;
        }
        continue;
      }

      const colon = content.indexOf(':');
      if (colon < 0) { i++; continue; }
      const key = content.slice(0, colon).trim();
      const val = content.slice(colon + 1);
      i++;
      if (val.trim() === '') {
        // nested block under this key
        obj[key] = parseBlock(baseIndent + 2);
      } else {
        obj[key] = parseScalar(val);
      }
    }

    return arr !== null ? arr : obj;
  }

  return parseBlock(0);
}

/** Stringify a JS object to minimal YAML. */
export function stringifyYaml(value: unknown, indent = 0): string {
  const pad = ' '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    if (/[:#\n]/.test(value) || value.trim() !== value) return `"${value.replace(/"/g, '\\"')}"`;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const entries = Object.entries(item as Record<string, unknown>);
          if (entries.length === 0) return `${pad}- {}`;
          const first = entries[0]!;
          const rest = entries.slice(1);
          const firstLine = `${pad}- ${first[0]}: ${stringifyScalarOrNested(first[1], indent + 2)}`;
          const restLines = rest
            .map(([k, v]) => `${' '.repeat(indent + 2)}${k}: ${stringifyScalarOrNested(v, indent + 2)}`)
            .join('\n');
          return restLines ? `${firstLine}\n${restLines}` : firstLine;
        }
        return `${pad}- ${stringifyScalarOrNested(item, indent + 2)}`;
      })
      .join('\n');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries
      .map(([k, v]) => `${pad}${k}: ${stringifyScalarOrNested(v, indent + 2)}`)
      .join('\n');
  }
  return String(value);
}

function stringifyScalarOrNested(v: unknown, indent: number): string {
  if (v !== null && typeof v === 'object') {
    const nested = stringifyYaml(v, indent);
    return `\n${nested}`;
  }
  return stringifyYaml(v, 0);
}

// ---------------------------------------------------------------------------
// Policy YAML import / export
// ---------------------------------------------------------------------------

export interface PolicyYamlDoc {
  policies?: Array<Partial<PolicyRule>>;
}

/** Import a YAML policy document, creating policies for each entry. */
export function importPoliciesFromYaml(yaml: string, userId: string): {
  imported: number;
  skipped: number;
  errors: string[];
} {
  let doc: PolicyYamlDoc;
  try {
    doc = parseYaml(yaml) as PolicyYamlDoc;
  } catch (e) {
    return { imported: 0, skipped: 0, errors: [(e as Error).message] };
  }
  const list = Array.isArray(doc?.policies) ? doc.policies : [];
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const raw of list) {
    if (!raw?.name || !raw.effect || !raw.subject || !raw.reason) {
      skipped++;
      errors.push(`Missing required fields for policy: ${raw?.name ?? '(unnamed)'}`);
      continue;
    }
    try {
      createPolicy({
        name: String(raw.name),
        effect: raw.effect === 'allow' ? 'allow' : 'deny',
        subject: raw.subject,
        condition: raw.condition,
        reason: String(raw.reason),
        createdBy: userId,
        enabled: raw.enabled ?? true,
      });
      imported++;
    } catch (e) {
      errors.push((e as Error).message);
      skipped++;
    }
  }
  return { imported, skipped, errors };
}

export function exportPoliciesAsYaml(): string {
  const rules = listPolicies().map((r) => ({
    id: r.id,
    name: r.name,
    effect: r.effect,
    enabled: r.enabled,
    subject: r.subject,
    condition: r.condition ?? undefined,
    reason: r.reason,
  }));
  return `# AgentOS Policies — exported ${new Date().toISOString()}\npolicies:\n${stringifyYaml(rules, 2)}\n`;
}

// ---------------------------------------------------------------------------
// Approval Routing Rules
// ---------------------------------------------------------------------------

export interface RoutingRule {
  id: string;
  name: string;
  /** Match by persona / skill / cost / tool. */
  match: {
    persona?: string;
    skillId?: string;
    tool?: string;
    minEstimatedCost?: number;
  };
  /** Route to these approver(s) — user ids or role names. */
  approvers: string[];
  /** SLA in hours (breach notification sent if no decision in this window). */
  slaHours: number;
  enabled: boolean;
  createdAt: string;
}

const routingRules = new Map<string, RoutingRule>();

registerStore(
  'approval_routing',
  () => Array.from(routingRules.values()) as unknown as Record<string, unknown>[],
  (rows) => {
    routingRules.clear();
    for (const r of rows as unknown as RoutingRule[]) routingRules.set(r.id, r);
  },
);

export function createRoutingRule(input: Omit<RoutingRule, 'id' | 'createdAt'>): RoutingRule {
  const id = `rr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rule: RoutingRule = { ...input, id, createdAt: new Date().toISOString() };
  routingRules.set(id, rule);
  return rule;
}

export function listRoutingRules(): RoutingRule[] {
  return Array.from(routingRules.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function deleteRoutingRule(id: string): boolean {
  return routingRules.delete(id);
}

export function resolveApprovers(input: {
  persona?: string;
  skillId?: string;
  tool?: string;
  estimatedCost?: number;
}): { approvers: string[]; slaHours: number; matchedRules: string[] } {
  const matched: RoutingRule[] = [];
  for (const r of routingRules.values()) {
    if (!r.enabled) continue;
    if (r.match.persona && r.match.persona !== input.persona) continue;
    if (r.match.skillId && r.match.skillId !== input.skillId) continue;
    if (r.match.tool && r.match.tool !== input.tool) continue;
    if (r.match.minEstimatedCost !== undefined && (input.estimatedCost ?? 0) < r.match.minEstimatedCost) continue;
    matched.push(r);
  }
  if (matched.length === 0) {
    return { approvers: [], slaHours: 24, matchedRules: [] };
  }
  // Union of approvers; strictest (smallest) SLA wins.
  const approvers = Array.from(new Set(matched.flatMap((m) => m.approvers)));
  const slaHours = Math.min(...matched.map((m) => m.slaHours));
  return { approvers, slaHours, matchedRules: matched.map((m) => m.id) };
}

// ---------------------------------------------------------------------------
// Data Residency — region pinning
// ---------------------------------------------------------------------------

export type Region = 'us' | 'eu' | 'in' | 'apac';

export interface ResidencyRule {
  id: string;
  name: string;
  /** Match by tenant / persona / skill. */
  match: { tenant?: string; persona?: string; skillId?: string };
  /** Allowed regions — if request is outside, it's blocked. */
  allowedRegions: Region[];
  /** LLM providers allowed in this region. */
  allowedProviders?: string[];
  createdAt: string;
  enabled: boolean;
}

const residencyRules = new Map<string, ResidencyRule>();

registerStore(
  'residency_rules',
  () => Array.from(residencyRules.values()) as unknown as Record<string, unknown>[],
  (rows) => {
    residencyRules.clear();
    for (const r of rows as unknown as ResidencyRule[]) residencyRules.set(r.id, r);
  },
);

export function createResidencyRule(input: Omit<ResidencyRule, 'id' | 'createdAt'>): ResidencyRule {
  const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rule: ResidencyRule = { ...input, id, createdAt: new Date().toISOString() };
  residencyRules.set(id, rule);
  return rule;
}

export function listResidencyRules(): ResidencyRule[] {
  return Array.from(residencyRules.values());
}

export function deleteResidencyRule(id: string): boolean {
  return residencyRules.delete(id);
}

export function checkResidency(input: {
  tenant?: string;
  persona?: string;
  skillId?: string;
  currentRegion: Region;
  provider?: string;
}): { allowed: boolean; reason?: string; matchedRuleId?: string } {
  for (const r of residencyRules.values()) {
    if (!r.enabled) continue;
    if (r.match.tenant && r.match.tenant !== input.tenant) continue;
    if (r.match.persona && r.match.persona !== input.persona) continue;
    if (r.match.skillId && r.match.skillId !== input.skillId) continue;
    if (!r.allowedRegions.includes(input.currentRegion)) {
      return {
        allowed: false,
        matchedRuleId: r.id,
        reason: `Data residency violation: region ${input.currentRegion} not in ${r.allowedRegions.join(',')}`,
      };
    }
    if (input.provider && r.allowedProviders && !r.allowedProviders.includes(input.provider)) {
      return {
        allowed: false,
        matchedRuleId: r.id,
        reason: `LLM provider ${input.provider} not allowed in region ${input.currentRegion}`,
      };
    }
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Compliance Pack — static export for SOC2 / ISO / GDPR reviews
// ---------------------------------------------------------------------------

export interface ComplianceControl {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'GDPR';
  category: string;
  control: string;
  description: string;
  status: 'implemented' | 'partial' | 'planned';
  evidence: string[];
}

const COMPLIANCE_CONTROLS: ComplianceControl[] = [
  {
    id: 'SOC2-CC6.1',
    framework: 'SOC2',
    category: 'Logical & Physical Access',
    control: 'Logical access controls',
    description: 'RBAC enforced at the gateway. JWT-based authentication with per-role guards on mutating routes.',
    status: 'implemented',
    evidence: ['services/gateway/src/server.ts: guardRole()', 'packages/auth/src/middleware.ts: verifyToken()'],
  },
  {
    id: 'SOC2-CC7.2',
    framework: 'SOC2',
    category: 'System Operations',
    control: 'Change monitoring / audit logs',
    description: 'Tamper-evident, hash-chained audit log for all authenticated actions. Verifiable integrity chain.',
    status: 'implemented',
    evidence: ['services/gateway/src/server.ts: recordAudit() with prevHash/hash', 'GET /api/governance/audit/verify'],
  },
  {
    id: 'SOC2-CC8.1',
    framework: 'SOC2',
    category: 'Change Management',
    control: 'Approval gates on production actions',
    description: 'Blocking approval steps for marketing and persona workflows with SLA breach notifications.',
    status: 'implemented',
    evidence: ['services/gateway/src/approval-bus.ts', 'marketing-api.ts: waitForApproval()'],
  },
  {
    id: 'ISO27001-A.9.4.1',
    framework: 'ISO27001',
    category: 'Access Control',
    control: 'Information access restriction',
    description: 'Attribute-based access control policies restrict agent/tool/persona combinations.',
    status: 'implemented',
    evidence: ['services/gateway/src/policy-store.ts', 'services/gateway/src/mcp-executor.ts: checkPolicy()'],
  },
  {
    id: 'ISO27001-A.12.4.1',
    framework: 'ISO27001',
    category: 'Logging & Monitoring',
    control: 'Event logging',
    description: 'All governance-relevant events are logged with actor, timestamp, and outcome.',
    status: 'implemented',
    evidence: ['services/gateway/src/server.ts: AuditEntry'],
  },
  {
    id: 'GDPR-Art5-1-c',
    framework: 'GDPR',
    category: 'Data Minimisation',
    control: 'PII redaction before model inputs',
    description: 'Regex-based PII/secret scrubbing removes personal data before it reaches LLM providers.',
    status: 'implemented',
    evidence: ['services/gateway/src/pii-redactor.ts', 'POST /api/governance/pii/scan'],
  },
  {
    id: 'GDPR-Art44',
    framework: 'GDPR',
    category: 'Data Transfers',
    control: 'Regional data residency',
    description: 'Residency rules pin tenant/persona data to approved regions and restrict non-compliant providers.',
    status: 'implemented',
    evidence: ['services/gateway/src/governance-v2.ts: checkResidency()'],
  },
  {
    id: 'GDPR-Art30',
    framework: 'GDPR',
    category: 'Records of Processing',
    control: 'Processing activity records',
    description: 'Memory graph records every execution with actor, tool, and outcome for processing transparency.',
    status: 'partial',
    evidence: ['services/gateway/src/memory-graph.ts: ExecutionRecord'],
  },
];

export function listComplianceControls(framework?: 'SOC2' | 'ISO27001' | 'GDPR'): ComplianceControl[] {
  if (!framework) return COMPLIANCE_CONTROLS;
  return COMPLIANCE_CONTROLS.filter((c) => c.framework === framework);
}

export function getComplianceSummary(): {
  frameworks: Record<string, { total: number; implemented: number; partial: number; planned: number }>;
  overallCoverage: number;
} {
  const frameworks: Record<string, { total: number; implemented: number; partial: number; planned: number }> = {};
  for (const c of COMPLIANCE_CONTROLS) {
    const f = frameworks[c.framework] ?? (frameworks[c.framework] = { total: 0, implemented: 0, partial: 0, planned: 0 });
    f.total++;
    f[c.status]++;
  }
  const total = COMPLIANCE_CONTROLS.length;
  const implemented = COMPLIANCE_CONTROLS.filter((c) => c.status === 'implemented').length;
  const overallCoverage = total === 0 ? 0 : implemented / total;
  return { frameworks, overallCoverage };
}

// ---------------------------------------------------------------------------
// Red-team scanner — cheap but genuinely useful
// ---------------------------------------------------------------------------

export interface RedTeamFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  remediation: string;
  evidence?: string;
}

/**
 * Scan gateway state for common misconfigurations. Non-destructive; uses
 * only information already in memory / env.
 */
export function runRedTeamScan(input?: {
  publicRoutes?: string[];
  jwtSecretPresent?: boolean;
  allowAnon?: boolean;
  hasPolicies?: boolean;
  residencyConfigured?: boolean;
}): { findings: RedTeamFinding[]; scannedAt: string } {
  const findings: RedTeamFinding[] = [];
  const env = process.env.NODE_ENV ?? 'dev';

  if (env === 'production' && input?.jwtSecretPresent === false) {
    findings.push({
      severity: 'critical',
      category: 'auth',
      title: 'JWT_SECRET missing in production',
      description: 'Production gateway is running without a JWT signing secret.',
      remediation: 'Set JWT_SECRET (or AUTH_SECRET) before enabling production traffic.',
    });
  }
  if (env === 'production' && input?.allowAnon === true) {
    findings.push({
      severity: 'high',
      category: 'auth',
      title: 'Anonymous access allowed in production',
      description: 'ALLOW_ANON is true — unauthenticated requests get operator-equivalent access.',
      remediation: 'Set ALLOW_ANON=false in production.',
    });
  }
  if (input?.hasPolicies === false) {
    findings.push({
      severity: 'medium',
      category: 'governance',
      title: 'No policies defined',
      description: 'Policy store is empty, so all tool calls are default-allow.',
      remediation: 'Import at least one deny-rule via POST /api/governance/policies.',
    });
  }
  if (input?.residencyConfigured === false) {
    findings.push({
      severity: 'medium',
      category: 'data-residency',
      title: 'No residency rules configured',
      description: 'Customer data may be processed in any region by any LLM provider.',
      remediation: 'Define residency rules for multi-region tenants via POST /api/governance/residency.',
    });
  }
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.AZURE_OPENAI_KEY) {
    findings.push({
      severity: 'low',
      category: 'config',
      title: 'No LLM provider credentials detected',
      description: 'Gateway will fall back to simulation mode for all model calls.',
      remediation: 'Set an LLM provider API key to enable real model routing.',
    });
  }
  // Check for overly permissive public routes
  for (const r of input?.publicRoutes ?? []) {
    if (r.includes('/admin') || r.includes('/budget') || r.includes('/webhooks')) {
      findings.push({
        severity: 'high',
        category: 'routing',
        title: `Sensitive route appears in public list: ${r}`,
        description: `Route ${r} should not be publicly accessible without authentication.`,
        remediation: 'Move to authenticated path and apply guardRole() protection.',
      });
    }
  }

  return { findings, scannedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Update / delete helpers passthrough (used by server)
// ---------------------------------------------------------------------------

export { updatePolicy, deletePolicy };
