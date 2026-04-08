/**
 * Universal Intent Engine — AgentOS Control Plane
 *
 * Converts user intent into executable workflows:
 * User query → Intent detection → Persona → Skill → Agents → Tools → Execution
 */

import { skillMarketplace } from './skill-marketplace.js';
import type { MarketplaceSkill } from './skill-marketplace.js';
import { createUTCPPacket, type UTCPPacket, type FunctionDomain } from './utcp-protocol.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntentResult {
  query: string;
  personaId: string;
  personaName: string;
  personaIcon: string;
  personaColor: string;
  skill: MarketplaceSkill;
  confidence: number;
  entities: Record<string, string>;
  suggestedAlternatives: MarketplaceSkill[];
}

/** Enhanced intent result with UTCP + cross-functional detection */
export interface EnhancedIntentResult extends IntentResult {
  /** Whether this intent spans multiple functions (triggers swarm) */
  isCrossFunctional: boolean;
  /** All functions involved (for cross-functional missions) */
  involvedFunctions: { personaId: string; name: string; confidence: number }[];
  /** Suggested agents from the agent registry */
  suggestedAgents: string[];
  /** Required MCP tools for execution */
  requiredTools: string[];
  /** Pre-built UTCP packet for execution */
  utcpPacket: UTCPPacket;
  /** Classification category */
  category: 'search' | 'generation' | 'analysis' | 'action' | 'orchestration' | 'decision_support';
}

// Cross-functional mission patterns
const CROSS_FUNCTIONAL_PATTERNS: Array<{
  keywords: string[];
  functions: string[];
  swarmType: string;
}> = [
  { keywords: ['launch', 'ship', 'release', 'go live', 'ga release'], functions: ['product', 'engineering', 'marketing', 'program'], swarmType: 'product_launch' },
  { keywords: ['incident', 'outage', 'p1', 'sev1', 'production down'], functions: ['engineering', 'program', 'support'], swarmType: 'incident_response' },
  { keywords: ['hire', 'open headcount', 'new role', 'hiring sprint'], functions: ['hr', 'engineering', 'program'], swarmType: 'hiring_sprint' },
  { keywords: ['campaign end-to-end', 'full campaign', 'integrated campaign'], functions: ['marketing', 'product', 'program'], swarmType: 'campaign_pod' },
  { keywords: ['quarterly planning', 'okr', 'strategic plan', 'annual plan'], functions: ['product', 'engineering', 'marketing', 'program', 'finance'], swarmType: 'planning_pod' },
  { keywords: ['onboard', 'new employee', 'new hire orientation'], functions: ['hr', 'engineering', 'corpit'], swarmType: 'onboarding_pod' },
];

// Intent category patterns
const CATEGORY_PATTERNS: Array<{ category: EnhancedIntentResult['category']; keywords: string[] }> = [
  { category: 'search', keywords: ['find', 'search', 'look up', 'where', 'who', 'what is'] },
  { category: 'generation', keywords: ['create', 'write', 'generate', 'draft', 'build', 'make'] },
  { category: 'analysis', keywords: ['analyze', 'compare', 'benchmark', 'audit', 'diagnose', 'review'] },
  { category: 'action', keywords: ['deploy', 'send', 'publish', 'schedule', 'assign', 'close'] },
  { category: 'orchestration', keywords: ['launch', 'coordinate', 'manage', 'run', 'execute'] },
  { category: 'decision_support', keywords: ['prioritize', 'recommend', 'decide', 'evaluate', 'rank'] },
];

// Agent suggestions per persona
const PERSONA_AGENTS: Record<string, string[]> = {
  engineering: ['Colonel Atlas', 'Captain Prometheus', 'Corporal Mercury', 'Sergeant Vulcan'],
  marketing: ['Colonel Hyperion', 'Captain Iris', 'Corporal Nova', 'Captain Apollo'],
  product: ['Colonel Themis', 'Captain Odin', 'Corporal Freya'],
  hr: ['Colonel Rhea', 'Captain Demeter', 'Corporal Hestia'],
  program: ['Program Orchestrator', 'Status Synthesis Agent', 'RAID Agent'],
  ta: ['JD Agent', 'Candidate Match Agent', 'Interview Coordinator'],
};

// Tool requirements per persona
const PERSONA_TOOLS: Record<string, string[]> = {
  engineering: ['github', 'jira', 'confluence', 'sentry', 'datadog'],
  marketing: ['hubspot', 'google_analytics', 'linkedin_ads', 'canva', 'figma'],
  product: ['jira', 'confluence', 'google_analytics'],
  hr: ['slack', 'google_drive', 'confluence'],
  program: ['jira', 'confluence', 'slack'],
  ta: ['linkedin_ads', 'slack', 'google_drive'],
};

// ---------------------------------------------------------------------------
// Intent → Persona → Skill mapping (keyword-based, extensible to LLM)
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: Array<{
  personaId: string;
  keywords: string[];
  skillKeywords: string[];
  skillSlugHint?: string;
}> = [
  // Product
  {
    personaId: 'product',
    keywords: ['prd', 'product requirements', 'roadmap', 'epic', 'jira', 'backlog', 'user story', 'release notes', 'competitor', 'market research', 'product launch', 'feature spec'],
    skillKeywords: ['prd', 'roadmap', 'epic', 'jira', 'competitor', 'release'],
    skillSlugHint: 'product-prd',
  },
  // Engineering
  {
    personaId: 'engineering',
    keywords: ['pr review', 'pull request', 'code review', 'ci', 'pipeline', 'incident', 'rca', 'architecture', 'test', 'debug', 'deploy'],
    skillKeywords: ['pr', 'review', 'incident', 'rca', 'architecture'],
    skillSlugHint: 'engineering-pr',
  },
  // Marketing
  {
    personaId: 'marketing',
    keywords: ['campaign', 'launch', 'ad', 'creative', 'linkedin', 'hubspot', 'funnel', 'webinar', 'landing page', 'blog', 'content'],
    skillKeywords: ['campaign', 'launch', 'creative', 'ad', 'funnel'],
    skillSlugHint: 'marketing-campaign',
  },
  // HR
  {
    personaId: 'hr',
    keywords: ['resume', 'hiring', 'job description', 'jd', 'interview', 'candidate', 'screening', 'onboarding', 'offboarding', 'performance review', 'engagement survey', 'compensation', 'offer letter', 'talent acquisition', 'people ops', 'dei', 'employee', 'recruiter', 'hr policy'],
    skillKeywords: ['resume', 'hiring', 'jd', 'interview', 'onboarding', 'performance', 'compensation', 'offer', 'policy'],
    skillSlugHint: 'hr-jd-generator',
  },
  // Finance
  {
    personaId: 'finance',
    keywords: ['budget', 'forecast', 'expense', 'revenue', 'cash flow', 'financial'],
    skillKeywords: ['budget', 'forecast', 'expense'],
    skillSlugHint: 'finance-forecast',
  },
  // Corp IT
  {
    personaId: 'corpit',
    keywords: ['access', 'provision', 'license', 'device', 'it ticket', 'onboard'],
    skillKeywords: ['access', 'provision', 'license'],
    skillSlugHint: 'corpit-access',
  },
  // Program
  {
    personaId: 'program',
    keywords: ['project', 'milestone', 'stakeholder', 'status report', 'program'],
    skillKeywords: ['project', 'milestone', 'status'],
  },
  // Data
  {
    personaId: 'data',
    keywords: ['analytics', 'report', 'dashboard', 'metrics', 'data'],
    skillKeywords: ['analytics', 'report', 'dashboard'],
  },
  // Sales
  {
    personaId: 'sales',
    keywords: ['sales', 'gtm', 'pipeline', 'prospect', 'deal'],
    skillKeywords: ['sales', 'pipeline', 'gtm'],
  },
  // Design
  {
    personaId: 'design',
    keywords: ['design', 'figma', 'mockup', 'ui', 'ux'],
    skillKeywords: ['design', 'mockup', 'ui'],
  },
  // Support
  {
    personaId: 'support',
    keywords: ['support', 'ticket', 'customer', 'faq'],
    skillKeywords: ['support', 'ticket', 'faq'],
  },
  // Legal
  {
    personaId: 'legal',
    keywords: ['legal', 'compliance', 'contract', 'policy'],
    skillKeywords: ['legal', 'compliance', 'contract'],
  },
];

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

// ---------------------------------------------------------------------------
// Intent Engine
// ---------------------------------------------------------------------------

export class IntentEngine {
  /**
   * Route user intent to persona + skill + agents + tools.
   */
  routeIntent(query: string): IntentResult | null {
    const lower = query.toLowerCase().trim();
    if (!lower) return null;

    let bestPersonaId: string | null = null;
    let bestScore = 0;
    let matchedKeywords: string[] = [];

    for (const pattern of INTENT_PATTERNS) {
      let score = 0;
      const qWords = lower.split(/\s+/);
      for (const kw of pattern.keywords) {
        if (lower.includes(kw)) score += 2;
        if (qWords.some((w) => w === kw || w.startsWith(kw) || kw.startsWith(w))) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestPersonaId = pattern.personaId;
        matchedKeywords = pattern.keywords.filter((k) => lower.includes(k));
      }
    }

    if (!bestPersonaId || bestScore === 0) {
      bestPersonaId = 'product'; // default fallback
      bestScore = 0.3;
    }

    const persona = PERSONA_INFO[bestPersonaId] || { name: bestPersonaId, icon: '📌', color: '#6b7280' };
    const skills = skillMarketplace.getAllSkills(bestPersonaId);

    if (skills.length === 0) return null;

    // Score skills by relevance to query
    let bestSkill: MarketplaceSkill = skills[0];
    let bestSkillScore = 0;

    for (const skill of skills) {
      let score = 0;
      const searchText = `${skill.name} ${skill.description} ${skill.outputs.join(' ')}`.toLowerCase();
      for (const word of lower.split(/\s+/).filter((w) => w.length > 2)) {
        if (searchText.includes(word)) score += 2;
        if (skill.name.toLowerCase().includes(word)) score += 3;
        if (skill.description.toLowerCase().includes(word)) score += 1;
      }
      if (score > bestSkillScore) {
        bestSkillScore = score;
        bestSkill = skill;
      }
    }

    const confidence = Math.min(0.95, 0.5 + bestScore * 0.1 + bestSkillScore * 0.05);

    const entities: Record<string, string> = {};
    const productMatch = lower.match(/(?:for|about)\s+(?:our\s+)?(?:ai\s+)?(\w+(?:\s+\w+)?)/i);
    if (productMatch) entities.product = productMatch[1].trim();
    const campaignMatch = lower.match(/(?:launch|create)\s+(?:a\s+)?(\w+(?:\s+\w+)?)\s+(?:campaign|plan)/i);
    if (campaignMatch) entities.campaign = campaignMatch[1].trim();

    const alternatives = skills.filter((s) => s.id !== bestSkill.id).slice(0, 3);

    return {
      query,
      personaId: bestPersonaId,
      personaName: persona.name,
      personaIcon: persona.icon,
      personaColor: persona.color,
      skill: bestSkill,
      confidence,
      entities,
      suggestedAlternatives: alternatives,
    };
  }

  /**
   * Get suggested skills for a persona (for "What do you want to do?" autocomplete).
   */
  getSuggestions(personaId?: string, limit = 8): MarketplaceSkill[] {
    const skills = personaId
      ? skillMarketplace.getAllSkills(personaId)
      : skillMarketplace.getAllSkills();
    return skills.slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // Enhanced routing with UTCP, cross-functional detection, agents, tools
  // -------------------------------------------------------------------------

  /**
   * Full intent routing with UTCP packet, cross-functional detection, agent/tool mapping.
   */
  routeEnhanced(query: string, userId = 'user-default', userRole = 'operator'): EnhancedIntentResult | null {
    const base = this.routeIntent(query);
    if (!base) return null;

    const lower = query.toLowerCase().trim();

    // Detect cross-functional missions
    const crossMatch = CROSS_FUNCTIONAL_PATTERNS.find(p => p.keywords.some(k => lower.includes(k)));
    const isCrossFunctional = !!crossMatch;
    const involvedFunctions = isCrossFunctional && crossMatch
      ? crossMatch.functions.map(f => ({
          personaId: f,
          name: PERSONA_INFO[f]?.name || f,
          confidence: lower.includes(f) ? 0.9 : 0.7,
        }))
      : [{ personaId: base.personaId, name: base.personaName, confidence: base.confidence }];

    // Classify intent category
    let category: EnhancedIntentResult['category'] = 'generation';
    let bestCatScore = 0;
    for (const cp of CATEGORY_PATTERNS) {
      const score = cp.keywords.filter(k => lower.includes(k)).length;
      if (score > bestCatScore) { bestCatScore = score; category = cp.category; }
    }

    // Map agents
    const suggestedAgents: string[] = [];
    for (const func of involvedFunctions) {
      const agents = PERSONA_AGENTS[func.personaId] || [];
      suggestedAgents.push(...agents.slice(0, 2));
    }

    // Map tools
    const requiredTools: string[] = [];
    const seen = new Set<string>();
    for (const func of involvedFunctions) {
      for (const tool of (PERSONA_TOOLS[func.personaId] || [])) {
        if (!seen.has(tool)) { requiredTools.push(tool); seen.add(tool); }
      }
    }

    // Build UTCP packet
    const functionDomain = (isCrossFunctional ? 'cross-functional' : base.personaId) as FunctionDomain;
    const utcpPacket = createUTCPPacket({
      function: functionDomain,
      stage: 'intake',
      intent: query,
      initiator: { user_id: userId, role: userRole },
      objectives: [query],
      tool_scopes: requiredTools,
      urgency: lower.includes('urgent') || lower.includes('asap') || lower.includes('p1') ? 'critical'
        : lower.includes('important') ? 'high'
        : 'medium',
    });

    return {
      ...base,
      isCrossFunctional,
      involvedFunctions,
      suggestedAgents,
      requiredTools,
      utcpPacket,
      category,
    };
  }

  /**
   * Detect all personas relevant to a query (for swarm formation).
   */
  detectFunctions(query: string): { personaId: string; name: string; score: number }[] {
    const lower = query.toLowerCase().trim();
    const results: { personaId: string; name: string; score: number }[] = [];

    for (const pattern of INTENT_PATTERNS) {
      let score = 0;
      for (const kw of pattern.keywords) {
        if (lower.includes(kw)) score += 2;
      }
      if (score > 0) {
        const persona = PERSONA_INFO[pattern.personaId];
        results.push({
          personaId: pattern.personaId,
          name: persona?.name || pattern.personaId,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }
}

export const intentEngine = new IntentEngine();
