/**
 * AgentOS Memory Graph — Platform intelligence layer
 *
 * Stores execution history, user feedback, and powers recommendations.
 * Graph structure: users → skills → agents → tools → executions → outputs
 */

import { skillMarketplace } from './skill-marketplace.js';
import type { MarketplaceSkill } from './skill-marketplace.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExecutionRecord {
  id: string;
  userId: string;
  userName?: string;
  skillId: string;
  skillName: string;
  personaId: string;
  success: boolean;
  runtimeSec: number;
  cost: number;
  agentsUsed: string[];
  toolsUsed: string[];
  outputs: string[];
  ts: string;
}

export interface SkillFeedback {
  skillId: string;
  userId: string;
  userName?: string;
  vote: 'up' | 'down';
  comment?: string;
  ts: string;
}

export interface SkillComment {
  id: string;
  skillId: string;
  userId: string;
  userName: string;
  content: string;
  ts: string;
  parentId?: string;
}

export interface Recommendation {
  skillId: string;
  skill: MarketplaceSkill;
  score: number;
  reason: 'popular' | 'persona_match' | 'recent_success' | 'high_rating';
}

// ---------------------------------------------------------------------------
// In-memory store (would be Neo4j/RedisGraph in production)
// ---------------------------------------------------------------------------

const executions: ExecutionRecord[] = [];
const feedback: SkillFeedback[] = [];
const comments: SkillComment[] = [];

// ---------------------------------------------------------------------------
// Memory Graph
// ---------------------------------------------------------------------------

export class MemoryGraph {
  recordExecution(record: Omit<ExecutionRecord, 'id' | 'ts'>): ExecutionRecord {
    const id = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const rec: ExecutionRecord = { ...record, id, ts: new Date().toISOString() };
    executions.push(rec);
    return rec;
  }

  getExecutions(userId?: string, skillId?: string, limit = 50): ExecutionRecord[] {
    let list = [...executions].reverse();
    if (userId) list = list.filter((e) => e.userId === userId);
    if (skillId) list = list.filter((e) => e.skillId === skillId);
    return list.slice(0, limit);
  }

  addFeedback(skillId: string, userId: string, vote: 'up' | 'down', userName?: string, comment?: string): SkillFeedback {
    const existing = feedback.find((f) => f.skillId === skillId && f.userId === userId);
    if (existing) {
      existing.vote = vote;
      existing.comment = comment;
      existing.ts = new Date().toISOString();
      return existing;
    }
    const f: SkillFeedback = { skillId, userId, userName, vote, comment, ts: new Date().toISOString() };
    feedback.push(f);
    return f;
  }

  getFeedback(skillId?: string): SkillFeedback[] {
    if (skillId) return feedback.filter((f) => f.skillId === skillId);
    return [...feedback];
  }

  getSkillVotes(skillId: string): { up: number; down: number } {
    const forSkill = feedback.filter((f) => f.skillId === skillId);
    return {
      up: forSkill.filter((f) => f.vote === 'up').length,
      down: forSkill.filter((f) => f.vote === 'down').length,
    };
  }

  addComment(skillId: string, userId: string, userName: string, content: string, parentId?: string): SkillComment {
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const c: SkillComment = { id, skillId, userId, userName, content, ts: new Date().toISOString(), parentId };
    comments.push(c);
    return c;
  }

  getComments(skillId: string): SkillComment[] {
    return comments.filter((c) => c.skillId === skillId).sort((a, b) => a.ts.localeCompare(b.ts));
  }

  /**
   * Recommendation engine: suggest skills based on memory graph.
   */
  getRecommendations(userId?: string, personaId?: string, limit = 6): Recommendation[] {
    const allSkills = skillMarketplace.getAllSkills(personaId);
    const scored: Array<{ skill: MarketplaceSkill; score: number; reason: Recommendation['reason'] }> = [];

    for (const skill of allSkills) {
      const votes = this.getSkillVotes(skill.id);
      const execs = executions.filter((e) => e.skillId === skill.id);
      const successRate = execs.length > 0 ? execs.filter((e) => e.success).length / execs.length : 0.5;

      let score = 0;
      let reason: Recommendation['reason'] = 'persona_match';

      if (skill.usageCount && skill.usageCount > 20) {
        score += skill.usageCount * 0.01;
        reason = 'popular';
      }
      if (votes.up > votes.down && votes.up >= 3) {
        score += (votes.up - votes.down) * 0.5;
        reason = 'high_rating';
      }
      if (execs.length > 0 && successRate > 0.8) {
        score += successRate * 2;
        reason = 'recent_success';
      }
      if (personaId && skill.personaId === personaId) {
        score += 1;
      }

      scored.push({ skill, score, reason });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => ({
      skillId: s.skill.id,
      skill: s.skill,
      score: s.score,
      reason: s.reason,
    }));
  }

  getStats(): {
    totalExecutions: number;
    totalFeedback: number;
    totalComments: number;
    successRate: number;
  } {
    const totalExecutions = executions.length;
    const successCount = executions.filter((e) => e.success).length;
    return {
      totalExecutions,
      totalFeedback: feedback.length,
      totalComments: comments.length,
      successRate: totalExecutions > 0 ? successCount / totalExecutions : 0,
    };
  }
}

export const memoryGraph = new MemoryGraph();
