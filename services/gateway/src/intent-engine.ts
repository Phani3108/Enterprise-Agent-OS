/**
 * Universal Intent Engine — AgentOS Control Plane
 *
 * Converts user intent into executable workflows:
 * User query → Intent detection → Persona → Skill → Agents → Tools → Execution
 */

import { skillMarketplace } from './skill-marketplace.js';
import type { MarketplaceSkill } from './skill-marketplace.js';

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
}

export const intentEngine = new IntentEngine();
