/**
 * Marketing Module Store — Sub-section navigation, execution state, approvals
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MarketingSection =
  | 'command-center'
  | 'campaigns'
  | 'content-studio'
  | 'creative-studio'
  | 'research-hub'
  | 'analytics-hub'
  | 'website-seo'
  | 'events'
  | 'sales-enablement'
  | 'skills'
  | 'workflows'
  | 'prompts'
  | 'integrations'
  | 'timeline'
  | 'assets'
  | 'approvals'
  | 'pipeline'
  | 'community'
  | 'projects';

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'approval_required';

export interface ExecutionStepEvent {
  id: string;
  stepId: string;
  stepName: string;
  agent: string;
  tool?: string;
  status: ExecutionStepStatus;
  startedAt?: string;
  completedAt?: string;
  outputKey?: string;
  outputPreview?: string;
  error?: string;
}

export interface MarketingExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  steps: ExecutionStepEvent[];
  outputs: Record<string, string>;
  startedAt: string;
  completedAt?: string;
  userId?: string;
}

export interface ApprovalRequest {
  id: string;
  executionId: string;
  stepId: string;
  stepName: string;
  workflowName: string;
  roleRequired?: string;
  personaRequired?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface MarketingState {
  activeSection: MarketingSection;
  setActiveSection: (section: MarketingSection) => void;

  activeExecution: MarketingExecution | null;
  executions: MarketingExecution[];
  setActiveExecution: (exec: MarketingExecution | null) => void;
  addExecution: (exec: MarketingExecution) => void;
  updateExecution: (id: string, updates: Partial<MarketingExecution>) => void;
  updateExecutionStep: (execId: string, stepId: string, updates: Partial<ExecutionStepEvent>) => void;

  approvalQueue: ApprovalRequest[];
  addApprovalRequest: (req: ApprovalRequest) => void;
  resolveApproval: (id: string, approved: boolean, resolvedBy?: string) => void;

  selectedWorkflowId: string | null;
  setSelectedWorkflowId: (id: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMarketingStore = create<MarketingState>((set) => ({
  activeSection: 'command-center',
  setActiveSection: (section) => set({ activeSection: section }),

  activeExecution: null,
  executions: [],
  setActiveExecution: (exec) => set({ activeExecution: exec }),
  addExecution: (exec) =>
    set((s) => ({
      executions: [exec, ...s.executions].slice(0, 50),
      activeExecution: exec,
    })),
  updateExecution: (id, updates) =>
    set((s) => ({
      executions: s.executions.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      activeExecution: s.activeExecution?.id === id ? { ...s.activeExecution, ...updates } : s.activeExecution,
    })),
  updateExecutionStep: (execId, stepId, updates) =>
    set((s) => ({
      executions: s.executions.map((e) =>
        e.id === execId
          ? {
              ...e,
              steps: e.steps.map((st) => (st.stepId === stepId ? { ...st, ...updates } : st)),
            }
          : e
      ),
      activeExecution:
        s.activeExecution?.id === execId
          ? {
              ...s.activeExecution,
              steps: s.activeExecution.steps.map((st) =>
                st.stepId === stepId ? { ...st, ...updates } : st
              ),
            }
          : s.activeExecution,
    })),

  approvalQueue: [],
  addApprovalRequest: (req) =>
    set((s) => ({
      approvalQueue: [req, ...s.approvalQueue.filter((a) => a.id !== req.id)],
    })),
  resolveApproval: (id, approved, resolvedBy) =>
    set((s) => ({
      approvalQueue: s.approvalQueue.map((a) =>
        a.id === id
          ? {
              ...a,
              status: approved ? 'approved' : 'rejected',
              resolvedAt: new Date().toISOString(),
              resolvedBy,
            }
          : a
      ),
    })),

  selectedWorkflowId: null,
  setSelectedWorkflowId: (id) => set({ selectedWorkflowId: id }),
}));
