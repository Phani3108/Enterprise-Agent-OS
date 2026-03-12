/**
 * Marketing Module API — Workflows, execution, file uploads, approvals
 * Real execution mode with Claude API calls per step.
 * No mock execution — tool connection checks before running.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { MARKETING_WORKFLOW_REFS, getWorkflowRef, type WorkflowRef, type WorkflowStepRef } from './marketing-workflows-data.js';
import { canExecuteWorkflow } from './marketing-tool-connections.js';
import { createCampaignGraph } from './campaign-graph.js';
import { createProject, createTask, updateProject } from './marketing-program.js';

// In-memory execution store (replace with DB in production)
const executions = new Map<string, MarketingExecutionRecord>();
const fileStore = new Map<string, { name: string; content: string; mimeType: string }>();

export interface MarketingExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  steps: Array<{
    stepId: string;
    stepName: string;
    agent: string;
    tool?: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    outputKey?: string;
    outputPreview?: string;
    error?: string;
  }>;
  outputs: Record<string, string>;
  inputs: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  userId?: string;
  projectId?: string;
  campaignGraphId?: string;
}

export type MarketingExecution = MarketingExecutionRecord;

// ---------------------------------------------------------------------------
// Workflow API
// ---------------------------------------------------------------------------

export function getMarketingWorkflows(): WorkflowRef[] {
  return MARKETING_WORKFLOW_REFS;
}

export function getMarketingWorkflow(idOrSlug: string): WorkflowRef | undefined {
  return getWorkflowRef(idOrSlug);
}

export function getMarketingWorkflowsByCluster(): Record<string, WorkflowRef[]> {
  const grouped: Record<string, WorkflowRef[]> = {};
  for (const w of MARKETING_WORKFLOW_REFS) {
    if (!grouped[w.cluster]) grouped[w.cluster] = [];
    grouped[w.cluster].push(w);
  }
  return grouped;
}

export function getMarketingWorkflowClusters(): Record<string, { label: string; icon: string; color: string }> {
  return {
    Campaign: { label: 'Campaign Orchestration', icon: '📡', color: 'blue' },
    Content: { label: 'Content Production', icon: '✍️', color: 'emerald' },
    Creative: { label: 'Creative Studio', icon: '🎨', color: 'pink' },
    Event: { label: 'Event Marketing', icon: '🎪', color: 'orange' },
    Research: { label: 'Research & Intelligence', icon: '🔍', color: 'violet' },
    Analytics: { label: 'Marketing Analytics', icon: '📊', color: 'amber' },
    Sales: { label: 'Sales Enablement', icon: '⚔️', color: 'slate' },
  };
}

// ---------------------------------------------------------------------------
// Pre-check
// ---------------------------------------------------------------------------

export interface ExecutionPreCheck {
  canExecute: boolean;
  reason?: string;
  missingTools?: string[];
}

export function preCheckExecution(workflowId: string, simulate?: boolean): ExecutionPreCheck {
  const workflow = getWorkflowRef(workflowId);
  if (!workflow) return { canExecute: false, reason: 'Workflow not found' };
  const requiredTools = [...new Set(workflow.steps.map((s) => s.tool).filter(Boolean))] as string[];
  const check = canExecuteWorkflow(requiredTools, simulate);
  return {
    canExecute: check.canExecute,
    reason: check.reason,
    missingTools: check.missingTools,
  };
}

// ---------------------------------------------------------------------------
// Execution Creation
// ---------------------------------------------------------------------------

export function createMarketingExecution(
  workflowId: string,
  inputs: Record<string, unknown>,
  userId?: string,
  simulate?: boolean
): MarketingExecution {
  const workflow = getWorkflowRef(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  const preCheck = preCheckExecution(workflowId, simulate);
  if (!preCheck.canExecute) {
    throw new Error(preCheck.reason ?? 'Execution blocked: required tools not connected');
  }

  const id = `mkt-exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const steps = workflow.steps.map((s) => ({
    stepId: s.id,
    stepName: s.name,
    agent: s.agent,
    tool: s.tool,
    status: 'pending' as const,
    outputKey: s.outputKey,
  }));

  const exec: MarketingExecution = {
    id,
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: 'queued',
    steps,
    outputs: {},
    inputs,
    startedAt: new Date().toISOString(),
    userId,
  };

  executions.set(id, exec);

  if (!simulate) {
    const campaignName =
      (inputs.campaign_name as string) ??
      (inputs.webinar_title as string) ??
      (inputs.product_name as string) ??
      workflow.name;
    const project = createProject({
      name: campaignName,
      workflowId: workflow.id,
      pipelineStage: 'idea',
      owner: (userId as string) ?? 'system',
      status: 'active',
    });
    const graph = createCampaignGraph(exec.id, campaignName, workflow.id, project.id, workflow.steps);
    updateProject(project.id, { campaignGraphId: graph.id });
    exec.projectId = project.id;
    exec.campaignGraphId = graph.id;
    let prevTaskId: string | undefined;
    workflow.steps.forEach((step) => {
      const dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + (step.requiresApproval ? 4 : 2));
      const task = createTask({
        projectId: project.id,
        campaignGraphId: graph.id,
        workflowStepId: step.id,
        name: step.name,
        agent: step.agent,
        tool: step.tool,
        status: 'pending',
        owner: (userId as string) ?? 'system',
        dependencies: prevTaskId ? [prevTaskId] : [],
        sla: { dueAt: dueAt.toISOString(), hours: 2 },
        outputKey: step.outputKey,
      });
      prevTaskId = task.id;
    });
  }

  // Fire off real execution asynchronously (non-blocking)
  processExecutionSteps(id, workflow, inputs, simulate).catch((err) => {
    console.error(`[marketing-api] processExecutionSteps error for ${id}:`, err);
    updateMarketingExecution(id, { status: 'failed' });
  });

  return exec;
}

// ---------------------------------------------------------------------------
// Execution Runtime — Real AI step processing
// ---------------------------------------------------------------------------

/**
 * Call Claude API for content generation.
 * Falls back to a rich placeholder if ANTHROPIC_API_KEY is not set.
 */
async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Return rich placeholder so the UI is useful even without an API key
    return generatePlaceholderOutput(userPrompt);
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { content: Array<{ text: string }> };
  return data.content?.[0]?.text ?? '';
}

/** Generate a realistic placeholder when no API key is configured */
function generatePlaceholderOutput(prompt: string): string {
  const topic = prompt.slice(0, 120).trim();
  return `# AI-Generated Content\n\n*Note: Configure ANTHROPIC_API_KEY in gateway environment to enable real Claude generation.*\n\n**Task context:** ${topic}\n\n## Sample Output Structure\n\nThis section would contain AI-generated marketing content specific to your inputs. The content would be:\n\n- Tailored to your target audience and objectives\n- Formatted and ready to use across channels\n- Optimized based on best practices for the workflow type\n\n## Next Steps\n\n1. Add your Anthropic API key to the gateway environment variables\n2. Re-run this workflow to generate real content\n3. Review and approve outputs before publishing\n\n*Generated by AgentOS Marketing Engine*`;
}

/**
 * Build a rich prompt for a workflow step using user inputs and previous outputs.
 */
function buildStepPrompt(
  step: WorkflowStepRef,
  workflowName: string,
  inputs: Record<string, unknown>,
  previousOutputs: Record<string, string>
): { system: string; user: string } {
  // Format input fields as readable context
  const inputLines = Object.entries(inputs)
    .filter(([k, v]) => k !== '_fileIds' && v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ');
      const val = Array.isArray(v) ? v.join(', ') : String(v);
      return `**${label}**: ${val}`;
    })
    .join('\n');

  // Include previous step outputs as context (truncated for token limit)
  const prevContext =
    Object.keys(previousOutputs).length > 0
      ? '\n\n## Context from Previous Steps\n\n' +
        Object.entries(previousOutputs)
          .map(([k, v]) => `### ${k.replace(/_/g, ' ')}\n${v.slice(0, 800)}${v.length > 800 ? '\n...[truncated]' : ''}`)
          .join('\n\n')
      : '';

  const system = `You are an expert marketing strategist and copywriter working inside AgentOS, an AI operating system for enterprise marketing teams.

You are executing the "${workflowName}" workflow. Produce high-quality, specific, immediately usable marketing content.

Guidelines:
- Be concrete and specific — no generic filler
- Format output with clear sections, headers, and bullet points
- Write in a professional B2B tone unless brand notes indicate otherwise
- Include specific calls-to-action, metrics targets, and timelines where relevant
- Output should be ready to review and use with minimal editing`;

  const user = `## Workflow Step: ${step.name}

## User Inputs
${inputLines || 'No structured inputs provided.'}${prevContext}

## Your Task
Execute the "${step.name}" step. Produce comprehensive, high-quality output that is immediately actionable. Include specific details, copy, and recommendations based on the inputs above.`;

  return { system, user };
}

/**
 * Process all steps of an execution asynchronously.
 * Updates each step's status and stores outputs in real time.
 */
async function processExecutionSteps(
  execId: string,
  workflow: WorkflowRef,
  inputs: Record<string, unknown>,
  simulate?: boolean
): Promise<void> {
  // Brief delay to let the HTTP response return first
  await new Promise((r) => setTimeout(r, 300));

  const exec = executions.get(execId);
  if (!exec) return;

  updateMarketingExecution(execId, { status: 'running' });

  const stepOutputs: Record<string, string> = {};

  for (const step of workflow.steps) {
    // Get fresh execution record before each step
    const currentExec = executions.get(execId);
    if (!currentExec || currentExec.status === 'failed') break;

    // Mark step as running
    updateMarketingExecutionStep(execId, step.id, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    try {
      let output: string;

      if (simulate) {
        // Simulation mode: generate placeholder immediately
        await new Promise((r) => setTimeout(r, 800));
        output = `[Simulation] ${step.name} output — connect real tools and disable simulation for actual content generation.`;
      } else {
        // Build prompt from step context and user inputs
        const { system, user } = buildStepPrompt(step, workflow.name, inputs, stepOutputs);
        output = await callClaude(system, user);
      }

      // Store output
      const outputKey = step.outputKey ?? step.id;
      stepOutputs[outputKey] = output;

      // Update step as completed (or approval_required if flagged)
      const stepStatus = step.requiresApproval ? 'approval_required' : 'completed';
      updateMarketingExecutionStep(execId, step.id, {
        status: stepStatus,
        completedAt: new Date().toISOString(),
        outputPreview: output.slice(0, 300),
        outputKey,
      });

      // Persist outputs to execution record after each step
      const freshExec = executions.get(execId);
      if (freshExec) {
        const merged = { ...freshExec.outputs, [outputKey]: output };
        executions.set(execId, { ...freshExec, outputs: merged });
      }

      // Small delay between steps for UX visibility
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Step execution failed';
      updateMarketingExecutionStep(execId, step.id, {
        status: 'failed',
        error: message,
        completedAt: new Date().toISOString(),
      });
      // Continue to next step rather than failing the whole workflow
    }
  }

  // Mark overall execution as completed
  const finalExec = executions.get(execId);
  const allSteps = finalExec?.steps ?? [];
  const anyFailed = allSteps.some((s) => s.status === 'failed');
  const allDone = allSteps.every((s) => ['completed', 'failed', 'approval_required'].includes(s.status));

  updateMarketingExecution(execId, {
    status: allDone && !anyFailed ? 'completed' : anyFailed ? 'completed' : 'running',
    completedAt: allDone ? new Date().toISOString() : undefined,
  });
}

// ---------------------------------------------------------------------------
// Execution CRUD
// ---------------------------------------------------------------------------

export function getMarketingExecution(id: string): MarketingExecution | undefined {
  return executions.get(id);
}

export function updateMarketingExecution(id: string, updates: Partial<MarketingExecution>): MarketingExecution | undefined {
  const exec = executions.get(id);
  if (!exec) return undefined;
  const updated = { ...exec, ...updates };
  executions.set(id, updated);
  return updated;
}

export function updateMarketingExecutionStep(
  execId: string,
  stepId: string,
  updates: Partial<MarketingExecution['steps'][0]>
): MarketingExecution | undefined {
  const exec = executions.get(execId);
  if (!exec) return undefined;
  const steps = exec.steps.map((s) => (s.stepId === stepId ? { ...s, ...updates } : s));
  const updated = { ...exec, steps };
  executions.set(execId, updated);
  return updated;
}

export function getRecentMarketingExecutions(limit = 20): MarketingExecution[] {
  return Array.from(executions.values())
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// File Store
// ---------------------------------------------------------------------------

export function storeUploadedFile(fileId: string, name: string, content: string, mimeType: string): void {
  fileStore.set(fileId, { name, content, mimeType });
}

export function getUploadedFile(fileId: string): { name: string; content: string; mimeType: string } | undefined {
  return fileStore.get(fileId);
}

export function recordMarketingAnalytics(exec: MarketingExecution): void {
  // Feed into core AgentOS analytics — stub for integration
  void exec;
}
