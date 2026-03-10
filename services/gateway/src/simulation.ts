/**
 * AgentOS Simulation Layer — Testing & Mock Execution
 *
 * Allows workflows to run in simulation mode with mock connectors
 * and sandbox responses. No real API calls.
 */

import type { MarketplaceSkill } from './skill-marketplace.js';

export interface SimulatedExecution {
  skillId: string;
  skillName: string;
  mode: 'simulation';
  steps: Array<{
    agentId: string;
    agentName: string;
    status: 'simulated';
    output: string;
    mockData?: unknown;
  }>;
  runtimeSec: number;
  cost: number;
  outputs: Array<{ name: string; status: string; mockContent?: string }>;
}

/**
 * Run a skill in simulation mode — no real tool calls.
 */
export function simulateSkillExecution(skill: MarketplaceSkill): SimulatedExecution {
  const steps = skill.workflow.map((w, i) => ({
    agentId: w.agentId,
    agentName: w.agentName,
    status: 'simulated' as const,
    output: `[Simulated] ${w.agentName} produced: ${w.outputs.join(', ')}`,
    mockData: { step: i + 1, timestamp: new Date().toISOString() },
  }));

  const outputs = skill.outputs.map((o, i) => ({
    name: o,
    status: 'generated',
    mockContent: `[Mock] Sample ${o} content for simulation (step ${i + 1})`,
  }));

  return {
    skillId: skill.id,
    skillName: skill.name,
    mode: 'simulation',
    steps,
    runtimeSec: 5 + Math.floor(Math.random() * 10),
    cost: 0,
    outputs,
  };
}
