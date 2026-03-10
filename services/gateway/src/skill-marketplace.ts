/**
 * Skill Marketplace + Skill Builder — App Store for Enterprise Work
 *
 * Users browse, install, and run skills. Teams create custom skills via the Skill Builder.
 * Skills support visibility (private/team/company), versioning, and analytics.
 */

// ---------------------------------------------------------------------------
// Skill Schema (Marketplace)
// ---------------------------------------------------------------------------

export type SkillVisibility = 'private' | 'team' | 'company' | 'public';

export interface WorkflowStep {
  agentId: string;
  agentName: string;
  order: number;
  inputs?: string[];
  outputs: string[];
}

export interface MarketplaceSkill {
  id: string;
  slug: string;
  name: string;
  personaId: string;
  personaName: string;
  personaIcon: string;
  personaColor: string;
  description: string;
  requiredTools: { id: string; name: string; icon: string }[];
  agents: { id: string; name: string }[];
  workflow: WorkflowStep[];
  promptTemplates: string[];
  outputs: string[];
  permissions: string[];
  visibility: SkillVisibility;
  version: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  teamId?: string;
  // Analytics (populated at runtime)
  usageCount?: number;
  successRate?: number;
  avgRuntimeSec?: number;
  timeSavedHours?: number;
  monthlyCost?: number;
  isEnabled?: boolean;
}

export interface SkillTemplate {
  id: string;
  name: string;
  personaId: string;
  description: string;
  requiredTools: string[];
  agents: string[];
  workflowTemplate: Omit<WorkflowStep, 'agentName'>[];
  promptTemplates: string[];
  outputs: string[];
}

export interface SkillAnalytics {
  skillId: string;
  usageCount: number;
  successCount: number;
  successRate: number;
  avgRuntimeSec: number;
  timeSavedHours: number;
  monthlyCost: number;
  lastUsed: string;
}

export interface SkillGovernanceRecord {
  skillId: string;
  skillName: string;
  personaName: string;
  toolsUsed: string[];
  monthlyCost: number;
  usageCount: number;
  isEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Skill Templates (pre-built for quick creation)
// ---------------------------------------------------------------------------

const SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: 'tpl-marketing-campaign',
    name: 'Marketing Campaign Launcher',
    personaId: 'marketing',
    description: 'Launch a full campaign: strategy → copy → creatives → ads → analytics',
    requiredTools: ['hubspot', 'linkedin-ads', 'canva', 'ga4'],
    agents: ['campaign-agent', 'copy-agent', 'creative-agent', 'campaign-agent', 'analytics-mkt-agent'],
    workflowTemplate: [
      { agentId: 'campaign-agent', order: 1, outputs: ['Campaign plan', 'ICP'] },
      { agentId: 'copy-agent', order: 2, outputs: ['Ad copy', 'Headlines'] },
      { agentId: 'creative-agent', order: 3, outputs: ['Creative assets'] },
      { agentId: 'campaign-agent', order: 4, outputs: ['Live campaigns'] },
      { agentId: 'analytics-mkt-agent', order: 5, outputs: ['Performance report'] },
    ],
    promptTemplates: ['Launch {channel} campaign for {product}', 'Target audience: {audience}'],
    outputs: ['Campaign plan', 'Ad copy', 'Creatives', 'Live campaigns', 'Performance dashboard'],
  },
  {
    id: 'tpl-product-prd',
    name: 'Product PRD Generator',
    personaId: 'product',
    description: 'Generate PRD → user stories → Jira epics in one flow',
    requiredTools: ['jira', 'confluence', 'notion'],
    agents: ['research-agent', 'prd-agent', 'epic-generator-agent'],
    workflowTemplate: [
      { agentId: 'research-agent', order: 1, outputs: ['Market context', 'Competitor notes'] },
      { agentId: 'prd-agent', order: 2, outputs: ['PRD document', 'Success metrics'] },
      { agentId: 'epic-generator-agent', order: 3, outputs: ['User stories', 'Jira epics'] },
    ],
    promptTemplates: ['Write PRD for {product}', 'Include: {requirements}'],
    outputs: ['PRD document', 'User stories', 'Jira epics', 'Confluence page'],
  },
  {
    id: 'tpl-engineering-pr',
    name: 'Engineering PR Review',
    personaId: 'engineering',
    description: 'Automated PR review for security, performance, and architecture',
    requiredTools: ['github', 'jira'],
    agents: ['code-review-agent', 'security-agent'],
    workflowTemplate: [
      { agentId: 'code-review-agent', order: 1, outputs: ['Review comments', 'Score card'] },
      { agentId: 'security-agent', order: 2, outputs: ['Security scan', 'Vulnerability report'] },
    ],
    promptTemplates: ['Review PR #{pr_number} for security and performance', 'Focus on: {focus_areas}'],
    outputs: ['Review comments', 'Security report', 'Merge recommendation'],
  },
  {
    id: 'tpl-hr-resume',
    name: 'HR Resume Screening',
    personaId: 'hr',
    description: 'Screen resumes and rank candidates against job requirements',
    requiredTools: ['greenhouse', 'lever', 'linkedin'],
    agents: ['resume-screening-agent', 'recruitment-agent'],
    workflowTemplate: [
      { agentId: 'resume-screening-agent', order: 1, outputs: ['Ranked candidates', 'Score cards'] },
      { agentId: 'recruitment-agent', order: 2, outputs: ['Interview questions', 'Evaluation rubric'] },
    ],
    promptTemplates: ['Screen resumes for {role}', 'Requirements: {requirements}'],
    outputs: ['Ranked candidate list', 'Score cards', 'Interview questions'],
  },
  {
    id: 'tpl-finance-forecast',
    name: 'Finance Budget Forecast',
    personaId: 'finance',
    description: 'Generate budget forecast with scenario analysis',
    requiredTools: ['excel', 'snowflake', 'quickbooks'],
    agents: ['forecasting-agent', 'finance-analysis-agent'],
    workflowTemplate: [
      { agentId: 'forecasting-agent', order: 1, outputs: ['Forecast model', 'Projections'] },
      { agentId: 'finance-analysis-agent', order: 2, outputs: ['Budget report', 'Variance analysis'] },
    ],
    promptTemplates: ['Create {period} budget forecast for {department}', 'Include: {scenarios}'],
    outputs: ['Forecast model', 'Budget report', 'Scenario analysis'],
  },
  {
    id: 'tpl-corpit-access',
    name: 'Corp IT Access Provision',
    personaId: 'corpit',
    description: 'Provision tool access for users with approval workflow',
    requiredTools: ['okta', 'azure-ad', 'jira-service-desk'],
    agents: ['access-provisioning-agent', 'policy-enforcement-agent'],
    workflowTemplate: [
      { agentId: 'access-provisioning-agent', order: 1, outputs: ['Provisioning plan'] },
      { agentId: 'policy-enforcement-agent', order: 2, outputs: ['Compliance check', 'Approval status'] },
    ],
    promptTemplates: ['Provision {tool} access for {user}', 'Role: {role}'],
    outputs: ['Provisioning confirmation', 'Access matrix'],
  },
];

// ---------------------------------------------------------------------------
// Marketplace Skills (curated + user-created)
// ---------------------------------------------------------------------------

const AGENT_NAMES: Record<string, string> = {
  'prd-agent': 'PRD Agent',
  'research-agent': 'Research Agent',
  'epic-generator-agent': 'Epic Generator Agent',
  'roadmap-agent': 'Roadmap Agent',
  'strategy-agent': 'Strategy Agent',
  'analytics-agent': 'Product Analytics Agent',
  'code-review-agent': 'Code Review Agent',
  'security-agent': 'Security Agent',
  'campaign-agent': 'Campaign Agent',
  'copy-agent': 'Copy Agent',
  'creative-agent': 'Creative Agent',
  'analytics-mkt-agent': 'Analytics Agent',
  'resume-screening-agent': 'Resume Screening Agent',
  'recruitment-agent': 'Recruitment Agent',
  'forecasting-agent': 'Forecasting Agent',
  'finance-analysis-agent': 'Finance Analysis Agent',
  'access-provisioning-agent': 'Access Provisioning Agent',
  'policy-enforcement-agent': 'Policy Enforcement Agent',
};

const TOOL_INFO: Record<string, { name: string; icon: string }> = {
  jira: { name: 'Jira', icon: '🔷' },
  confluence: { name: 'Confluence', icon: '📝' },
  github: { name: 'GitHub', icon: '🐙' },
  hubspot: { name: 'HubSpot', icon: '🟠' },
  'linkedin-ads': { name: 'LinkedIn Ads', icon: '💼' },
  canva: { name: 'Canva', icon: '🎨' },
  ga4: { name: 'GA4', icon: '📊' },
  notion: { name: 'Notion', icon: '📓' },
  excel: { name: 'Excel', icon: '📗' },
  snowflake: { name: 'Snowflake', icon: '❄️' },
  quickbooks: { name: 'QuickBooks', icon: '💚' },
  okta: { name: 'Okta', icon: '🔐' },
  'azure-ad': { name: 'Azure AD', icon: '🔷' },
  'jira-service-desk': { name: 'Jira Service Desk', icon: '🎫' },
  greenhouse: { name: 'Greenhouse', icon: '🌱' },
  lever: { name: 'Lever', icon: '🔩' },
  linkedin: { name: 'LinkedIn', icon: '💼' },
};

const PERSONA_INFO: Record<string, { name: string; icon: string; color: string }> = {
  product: { name: 'Product', icon: '📦', color: '#8b5cf6' },
  engineering: { name: 'Engineering', icon: '⚙️', color: '#3b82f6' },
  marketing: { name: 'Marketing', icon: '📣', color: '#f59e0b' },
  program: { name: 'Program', icon: '📋', color: '#10b981' },
  hr: { name: 'HR', icon: '👥', color: '#ec4899' },
  finance: { name: 'Finance', icon: '💰', color: '#06b6d4' },
  data: { name: 'Data', icon: '📊', color: '#6366f1' },
  corpit: { name: 'Corp IT', icon: '🏛️', color: '#64748b' },
  sales: { name: 'Sales', icon: '🎯', color: '#ef4444' },
  design: { name: 'Design', icon: '🎨', color: '#d946ef' },
  support: { name: 'Support', icon: '🎧', color: '#14b8a6' },
  legal: { name: 'Legal', icon: '⚖️', color: '#78716c' },
};

// In-memory store for user-created skills (would be DB in production)
let marketplaceSkills: MarketplaceSkill[] = [];
let skillAnalytics: Map<string, SkillAnalytics> = new Map();
let skillExecutions: Array<{ skillId: string; userId: string; success: boolean; runtimeSec: number; cost: number; ts: string }> = [];

// Seed marketplace with curated skills from templates
function seedMarketplace(): void {
  const now = new Date().toISOString();
  marketplaceSkills = SKILL_TEMPLATES.map((t, i) => {
    const p = PERSONA_INFO[t.personaId] || { name: t.personaId, icon: '📌', color: '#6b7280' };
    const workflow: WorkflowStep[] = t.workflowTemplate.map(w => ({
      ...w,
      agentName: AGENT_NAMES[w.agentId] || w.agentId,
    }));
    return {
      id: `skill-${i + 1}`,
      slug: t.id.replace('tpl-', ''),
      name: t.name,
      personaId: t.personaId,
      personaName: p.name,
      personaIcon: p.icon,
      personaColor: p.color,
      description: t.description,
      requiredTools: t.requiredTools.map(tid => ({
        id: tid,
        name: TOOL_INFO[tid]?.name || tid,
        icon: TOOL_INFO[tid]?.icon || '🔧',
      })),
      agents: t.agents.map(aid => ({ id: aid, name: AGENT_NAMES[aid] || aid })),
      workflow,
      promptTemplates: t.promptTemplates,
      outputs: t.outputs,
      permissions: ['read', 'execute'],
      visibility: 'company' as SkillVisibility,
      version: '1.0.0',
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
      usageCount: Math.floor(Math.random() * 200) + 20,
      successRate: 0.85 + Math.random() * 0.12,
      avgRuntimeSec: 30 + Math.floor(Math.random() * 90),
      timeSavedHours: Math.floor(Math.random() * 50) + 10,
      monthlyCost: 20 + Math.floor(Math.random() * 80),
      isEnabled: true,
    };
  });
}

seedMarketplace();

// ---------------------------------------------------------------------------
// SkillMarketplace class
// ---------------------------------------------------------------------------

export class SkillMarketplace {
  getTemplates(): SkillTemplate[] {
    return SKILL_TEMPLATES;
  }

  getTemplate(id: string): SkillTemplate | undefined {
    return SKILL_TEMPLATES.find(t => t.id === id);
  }

  getAllSkills(personaId?: string, visibility?: SkillVisibility): MarketplaceSkill[] {
    let list = [...marketplaceSkills];
    if (personaId) list = list.filter(s => s.personaId === personaId);
    if (visibility) list = list.filter(s => s.visibility === visibility);
    return list.filter(s => s.isEnabled !== false);
  }

  getSkill(id: string): MarketplaceSkill | undefined {
    return marketplaceSkills.find(s => s.id === id);
  }

  getSkillBySlug(slug: string): MarketplaceSkill | undefined {
    return marketplaceSkills.find(s => s.slug === slug);
  }

  searchSkills(query: string): MarketplaceSkill[] {
    const q = query.toLowerCase();
    return marketplaceSkills.filter(s =>
      s.isEnabled !== false &&
      (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.personaName.toLowerCase().includes(q))
    );
  }

  createSkill(draft: Omit<MarketplaceSkill, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'successRate' | 'avgRuntimeSec' | 'timeSavedHours' | 'monthlyCost'>): MarketplaceSkill {
    const id = `skill-${Date.now()}`;
    const now = new Date().toISOString();
    const skill: MarketplaceSkill = {
      ...draft,
      id,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      successRate: 1,
      avgRuntimeSec: 0,
      timeSavedHours: 0,
      monthlyCost: 0,
      isEnabled: true,
    };
    marketplaceSkills.push(skill);
    return skill;
  }

  updateSkill(id: string, updates: Partial<MarketplaceSkill>): MarketplaceSkill | undefined {
    const idx = marketplaceSkills.findIndex(s => s.id === id);
    if (idx < 0) return undefined;
    marketplaceSkills[idx] = { ...marketplaceSkills[idx], ...updates, updatedAt: new Date().toISOString() };
    return marketplaceSkills[idx];
  }

  recordExecution(skillId: string, userId: string, success: boolean, runtimeSec: number, cost: number): void {
    skillExecutions.push({
      skillId,
      userId,
      success,
      runtimeSec,
      cost,
      ts: new Date().toISOString(),
    });
    // Update analytics
    const skill = marketplaceSkills.find(s => s.id === skillId);
    if (skill) {
      const execs = skillExecutions.filter(e => e.skillId === skillId);
      const successCount = execs.filter(e => e.success).length;
      skill.usageCount = (skill.usageCount || 0) + 1;
      skill.successRate = successCount / execs.length;
      skill.avgRuntimeSec = execs.reduce((s, e) => s + e.runtimeSec, 0) / execs.length;
      skill.timeSavedHours = (skill.timeSavedHours || 0) + runtimeSec / 3600;
      skill.monthlyCost = (skill.monthlyCost || 0) + cost;
    }
  }

  getAnalytics(skillId?: string): SkillAnalytics[] {
    if (skillId) {
      const s = marketplaceSkills.find(sk => sk.id === skillId);
      if (!s) return [];
      return [{
        skillId: s.id,
        usageCount: s.usageCount || 0,
        successCount: Math.floor((s.usageCount || 0) * (s.successRate || 0)),
        successRate: s.successRate || 0,
        avgRuntimeSec: s.avgRuntimeSec || 0,
        timeSavedHours: s.timeSavedHours || 0,
        monthlyCost: s.monthlyCost || 0,
        lastUsed: s.updatedAt,
      }];
    }
    return marketplaceSkills.map(s => ({
      skillId: s.id,
      usageCount: s.usageCount || 0,
      successCount: Math.floor((s.usageCount || 0) * (s.successRate || 0)),
      successRate: s.successRate || 0,
      avgRuntimeSec: s.avgRuntimeSec || 0,
      timeSavedHours: s.timeSavedHours || 0,
      monthlyCost: s.monthlyCost || 0,
      lastUsed: s.updatedAt,
    }));
  }

  getGovernanceView(): SkillGovernanceRecord[] {
    return marketplaceSkills.map(s => ({
      skillId: s.id,
      skillName: s.name,
      personaName: s.personaName,
      toolsUsed: s.requiredTools.map(t => t.name),
      monthlyCost: s.monthlyCost || 0,
      usageCount: s.usageCount || 0,
      isEnabled: s.isEnabled !== false,
    }));
  }

  setSkillEnabled(skillId: string, enabled: boolean): boolean {
    const skill = this.updateSkill(skillId, { isEnabled: enabled });
    return !!skill;
  }
}

export const skillMarketplace = new SkillMarketplace();
