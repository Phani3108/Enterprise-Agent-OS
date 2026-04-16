/**
 * Demo Seeder — Populate a consistent starter scenario.
 *
 * When the gateway starts up in demo mode (SEED_DEMO=true or when there are
 * no existing executions), this seeder writes a curated set of execution
 * records, feedback, and comments into the memory graph so the dashboards,
 * recommendations, and agent-evals panels render a believable story out of
 * the box. Avoids hitting LLM providers — pure in-memory data.
 *
 * Skills/workflows referenced below must exist in marketing-workflows-data
 * and engineering-skills-data; otherwise the seeder silently skips them.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { memoryGraph } from './memory-graph.js';

interface SeedExec {
  userId: string;
  userName: string;
  skillId: string;
  skillName: string;
  personaId: string;
  success: boolean;
  runtimeSec: number;
  cost: number;
  agentsUsed: string[];
  toolsUsed: string[];
  outputs: string[];
  /** How many minutes ago this run happened. */
  minutesAgo: number;
}

const DEMO_EXECUTIONS: SeedExec[] = [
  // Marketing — Blog From Brief (the hero workflow for the demo)
  {
    userId: 'demo-user-1', userName: 'Priya (Marketing)',
    skillId: 'wf-007', skillName: 'Blog From Brief',
    personaId: 'marketing', success: true, runtimeSec: 142, cost: 0.086,
    agentsUsed: ['copy-agent', 'research-agent'],
    toolsUsed: ['claude'], outputs: ['outline', 'blog_draft', 'seo_metadata'],
    minutesAgo: 4,
  },
  {
    userId: 'demo-user-2', userName: 'Arjun (Marketing)',
    skillId: 'wf-007', skillName: 'Blog From Brief',
    personaId: 'marketing', success: true, runtimeSec: 168, cost: 0.094,
    agentsUsed: ['copy-agent'], toolsUsed: ['claude', 'slack'],
    outputs: ['blog_draft'], minutesAgo: 28,
  },
  // Marketing — LinkedIn Creative Generator
  {
    userId: 'demo-user-1', userName: 'Priya (Marketing)',
    skillId: 'wf-013', skillName: 'LinkedIn Creative Generator',
    personaId: 'marketing', success: true, runtimeSec: 87, cost: 0.032,
    agentsUsed: ['creative-agent'], toolsUsed: ['claude', 'canva'],
    outputs: ['creative_brief', 'post_copy'], minutesAgo: 52,
  },
  // Marketing — Webinar Campaign Generator (one failure to make evals realistic)
  {
    userId: 'demo-user-3', userName: 'Neha (Marketing)',
    skillId: 'wf-001', skillName: 'Webinar Campaign Generator',
    personaId: 'marketing', success: false, runtimeSec: 41, cost: 0.018,
    agentsUsed: ['strategy-agent'], toolsUsed: ['claude', 'hubspot'],
    outputs: [], minutesAgo: 84,
  },
  // Engineering
  {
    userId: 'demo-user-4', userName: 'Ravi (Engineering)',
    skillId: 'eng-001', skillName: 'PR Review Assistant',
    personaId: 'engineering', success: true, runtimeSec: 63, cost: 0.041,
    agentsUsed: ['reviewer-agent'], toolsUsed: ['github', 'claude'],
    outputs: ['review_comments'], minutesAgo: 17,
  },
  {
    userId: 'demo-user-5', userName: 'Anjali (Engineering)',
    skillId: 'eng-004', skillName: 'Unit Test Generator',
    personaId: 'engineering', success: true, runtimeSec: 94, cost: 0.052,
    agentsUsed: ['testing-agent'], toolsUsed: ['github', 'claude'],
    outputs: ['test_files'], minutesAgo: 120,
  },
  // Product
  {
    userId: 'demo-user-6', userName: 'Sanjay (Product)',
    skillId: 'prod-001', skillName: 'PRD Generator',
    personaId: 'product', success: true, runtimeSec: 212, cost: 0.128,
    agentsUsed: ['prd-agent', 'research-agent'], toolsUsed: ['claude', 'jira'],
    outputs: ['prd_document', 'jira_epics'], minutesAgo: 190,
  },
];

const DEMO_FEEDBACK = [
  { skillId: 'wf-007', userId: 'demo-user-1', userName: 'Priya', vote: 'up' as const, comment: 'Saves me ~2 hours per blog. Tone matches our voice.' },
  { skillId: 'wf-007', userId: 'demo-user-2', userName: 'Arjun', vote: 'up' as const },
  { skillId: 'wf-013', userId: 'demo-user-1', userName: 'Priya', vote: 'up' as const, comment: 'Canva handoff is perfect.' },
  { skillId: 'eng-001', userId: 'demo-user-4', userName: 'Ravi', vote: 'up' as const, comment: 'Catches security issues I would miss.' },
  { skillId: 'prod-001', userId: 'demo-user-6', userName: 'Sanjay', vote: 'up' as const },
];

/**
 * Seed the demo scenario unless executions already exist. Safe to call on
 * every startup — idempotent via the existence check.
 */
export function seedDemoScenario(): void {
  const existing = memoryGraph.getExecutions(undefined, undefined, 1);
  if (existing.length > 0) return; // already has data — don't overwrite real runs

  const now = Date.now();
  for (const d of DEMO_EXECUTIONS) {
    const rec = memoryGraph.recordExecution({
      userId: d.userId,
      userName: d.userName,
      skillId: d.skillId,
      skillName: d.skillName,
      personaId: d.personaId,
      success: d.success,
      runtimeSec: d.runtimeSec,
      cost: d.cost,
      agentsUsed: d.agentsUsed,
      toolsUsed: d.toolsUsed,
      outputs: d.outputs,
    });
    // Backdate the timestamp so the timeline shows realistic spread.
    rec.ts = new Date(now - d.minutesAgo * 60_000).toISOString();
  }

  for (const f of DEMO_FEEDBACK) {
    try {
      // recordFeedback may not exist on all memory-graph variants; guard.
      const mg = memoryGraph as unknown as { recordFeedback?: (f: unknown) => void };
      mg.recordFeedback?.({ ...f, ts: new Date().toISOString() });
    } catch { /* ignore */ }
  }

  console.log(`[demo-seeder] Seeded ${DEMO_EXECUTIONS.length} demo executions`);
}
