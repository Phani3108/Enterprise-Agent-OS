/**
 * Campaign Pipeline — Idea → Content → Design → Campaign Setup → Launch → Analytics
 * Auto-suggests next stages when a step completes.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

const PIPELINE_STAGES = [
  { id: 'idea', label: 'Idea', icon: '💡', description: 'Strategy, ICP, messaging' },
  { id: 'content', label: 'Content', icon: '✍️', description: 'Copy, outlines, drafts' },
  { id: 'design', label: 'Design', icon: '🎨', description: 'Creatives, visuals' },
  { id: 'campaign_setup', label: 'Campaign Setup', icon: '⚙️', description: 'Channels, targeting' },
  { id: 'launch', label: 'Launch', icon: '🚀', description: 'Go live' },
  { id: 'analytics', label: 'Analytics', icon: '📊', description: 'Performance, optimization' },
] as const;

type PipelineStageId = (typeof PIPELINE_STAGES)[number]['id'];

const NEXT_STAGE_SUGGESTIONS: Record<PipelineStageId, PipelineStageId | null> = {
  idea: 'content',
  content: 'design',
  design: 'campaign_setup',
  campaign_setup: 'launch',
  launch: 'analytics',
  analytics: null,
};

interface Project {
  id: string;
  name: string;
  pipelineStage: PipelineStageId;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function CampaignPipelineView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [suggestedNext, setSuggestedNext] = useState<PipelineStageId | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/marketing/projects?limit=20`);
        if (res.ok) {
          const { projects: p } = await res.json();
          setProjects(p ?? []);
        }
      } catch {
        if (process.env.NODE_ENV === 'development') {
          setProjects([]);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setSuggestedNext(null);
      return;
    }
    const next = NEXT_STAGE_SUGGESTIONS[selectedProject.pipelineStage];
    setSuggestedNext(next);
  }, [selectedProject]);

  const currentStageIdx = selectedProject
    ? PIPELINE_STAGES.findIndex((s) => s.id === selectedProject.pipelineStage)
    : -1;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Campaign Pipeline</h2>
      <p className="text-sm text-slate-600">
        Idea → Content → Design → Campaign Setup → Launch → Analytics. Auto-suggest next stages when a step completes.
      </p>

      {/* Pipeline visualization */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, i) => {
            const isActive = selectedProject && selectedProject.pipelineStage === stage.id;
            const isPast = currentStageIdx >= 0 && i < currentStageIdx;
            const isCompleted = isPast;
            return (
              <div key={stage.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex flex-col items-center gap-1.5 text-center min-w-[80px] ${
                    isActive ? 'text-slate-900 font-semibold' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  <span className="text-2xl">{stage.icon}</span>
                  <span className="text-xs">{stage.label}</span>
                  {isCompleted && <span className="text-[10px] text-emerald-500">✓</span>}
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 flex-shrink-0 ${isPast ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested next stage */}
      {selectedProject && suggestedNext && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">Suggested next stage</p>
          <p className="text-xs text-blue-700 mt-0.5">
            {selectedProject.pipelineStage} complete → suggest {suggestedNext}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Move to <strong>{PIPELINE_STAGES.find((s) => s.id === suggestedNext)?.label}</strong> to continue.
          </p>
        </div>
      )}

      {/* Project list */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Projects</h3>
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            No projects yet. Run a workflow from Command Center to create projects.
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors ${
                  selectedProject?.id === p.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-sm font-medium text-slate-900">{p.name}</span>
                <span className="text-xs text-slate-500 capitalize">{p.pipelineStage.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
