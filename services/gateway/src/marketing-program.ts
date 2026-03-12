/**
 * Marketing Program Management — Projects, Tasks, SLA, Dependencies
 * Each skill execution produces structured tasks.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { notifyTaskAssignment, notifyTaskDelay, notifyApprovalRequired, notifyCompletion } from './marketing-notifications.js';

export type TaskStatus = 'pending' | 'blocked' | 'in_progress' | 'approval_required' | 'completed' | 'failed' | 'cancelled';
export type PipelineStage = 'idea' | 'content' | 'design' | 'campaign_setup' | 'launch' | 'analytics';

export interface MarketingTask {
  id: string;
  projectId: string;
  campaignId?: string;
  campaignGraphId?: string;
  workflowStepId: string;
  name: string;
  description?: string;
  owner: string;
  ownerId?: string;
  agent: string;
  tool?: string;
  status: TaskStatus;
  sla?: { dueAt: string; hours?: number };
  dependencies: string[];
  delayTracking?: { isDelayed: boolean; delayHours?: number; delayReason?: string; notifiedAt?: string };
  outputKey?: string;
  outputRef?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MarketingProject {
  id: string;
  name: string;
  description?: string;
  workflowId: string;
  campaignGraphId?: string;
  pipelineStage: PipelineStage;
  tasks: string[];
  owner: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const projects = new Map<string, MarketingProject>();
const tasks = new Map<string, MarketingTask>();

function id(): string {
  return `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createProject(input: Omit<MarketingProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>): MarketingProject {
  const now = new Date().toISOString();
  const project: MarketingProject = {
    ...input,
    id: id(),
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
  projects.set(project.id, project);
  return project;
}

export function createTask(input: Omit<MarketingTask, 'id' | 'createdAt'>): MarketingTask {
  const now = new Date().toISOString();
  const task: MarketingTask = {
    ...input,
    id: id(),
    createdAt: now,
  };
  tasks.set(task.id, task);
  const project = projects.get(task.projectId);
  if (project) {
    project.tasks.push(task.id);
    project.updatedAt = now;
  }
  notifyTaskAssignment(task.id, task.owner, task.name);
  return task;
}

export function getProject(id: string): MarketingProject | undefined {
  return projects.get(id);
}

export function getTask(id: string): MarketingTask | undefined {
  return tasks.get(id);
}

export function getProjectTasks(projectId: string): MarketingTask[] {
  return Array.from(tasks.values()).filter((t) => t.projectId === projectId);
}

export function updateTask(id: string, updates: Partial<MarketingTask>): MarketingTask | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;
  const updated = { ...task, ...updates };
  tasks.set(id, updated);
  if (updates.status === 'approval_required') {
    notifyApprovalRequired(id, updated.owner, updated.name);
  }
  if (updates.status === 'completed') {
    notifyCompletion(id, updated.owner, updated.name);
  }
  if (updates.delayTracking?.isDelayed && !task.delayTracking?.isDelayed) {
    notifyTaskDelay(id, updated.owner, updated.name, updated.delayTracking?.delayHours ?? 0);
  }
  return updated;
}

export function updateProject(id: string, updates: Partial<MarketingProject>): MarketingProject | undefined {
  const project = projects.get(id);
  if (!project) return undefined;
  const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
  projects.set(id, updated);
  return updated;
}

export function getRecentProjects(limit = 20): MarketingProject[] {
  return Array.from(projects.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export function getTasksByStatus(status: TaskStatus): MarketingTask[] {
  return Array.from(tasks.values()).filter((t) => t.status === status);
}

export function isTaskDelayed(task: MarketingTask): boolean {
  if (!task.sla?.dueAt || task.status === 'completed' || task.status === 'cancelled') return false;
  return new Date() > new Date(task.sla.dueAt);
}

export function getNextPipelineStage(current: PipelineStage): PipelineStage | null {
  const order: PipelineStage[] = ['idea', 'content', 'design', 'campaign_setup', 'launch', 'analytics'];
  const idx = order.indexOf(current);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}
