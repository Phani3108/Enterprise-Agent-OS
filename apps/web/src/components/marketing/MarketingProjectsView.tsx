/**
 * Projects & Campaign Graph — Project list, tasks, campaign graph visualization
 * Dependency tracking, execution monitoring, task delays, agent collaboration.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

interface Project {
  id: string;
  name: string;
  workflowId: string;
  campaignGraphId?: string;
  pipelineStage: string;
  status: string;
  tasks: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  projectId: string;
  name: string;
  agent: string;
  tool?: string;
  status: string;
  owner: string;
  dependencies: string[];
  sla?: { dueAt: string; hours?: number };
  delayTracking?: { isDelayed: boolean; delayHours?: number };
}

interface GraphNode {
  id: string;
  type: string;
  label: string;
  data: Record<string, unknown>;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface CampaignGraph {
  id: string;
  campaignName: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function MarketingProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [graph, setGraph] = useState<CampaignGraph | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/marketing/projects?limit=20`);
        if (res.ok) {
          const { projects: p } = await res.json();
          setProjects(p ?? []);
        }
      } catch {
        setProjects([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setGraph(null);
      return;
    }
    (async () => {
      try {
        const [tasksRes, graphRes] = await Promise.all([
          fetch(`${GATEWAY_URL}/api/marketing/projects/${selectedProject.id}/tasks`),
          selectedProject.campaignGraphId
            ? fetch(`${GATEWAY_URL}/api/marketing/campaign-graph/${selectedProject.campaignGraphId}`)
            : null,
        ]);
        if (tasksRes.ok) {
          const { tasks: t } = await tasksRes.json();
          setTasks(t ?? []);
        }
        if (graphRes?.ok) {
          const { graph: g } = await graphRes.json();
          setGraph(g);
        } else {
          setGraph(null);
        }
      } catch {
        setTasks([]);
        setGraph(null);
      }
    })();
  }, [selectedProject]);

  const nodeColors: Record<string, string> = {
    campaign: 'bg-blue-100 border-blue-300',
    task: 'bg-slate-100 border-slate-300',
    agent: 'bg-violet-100 border-violet-300',
    tool: 'bg-amber-100 border-amber-300',
    output: 'bg-emerald-100 border-emerald-300',
    asset: 'bg-pink-100 border-pink-300',
    channel: 'bg-cyan-100 border-cyan-300',
    owner: 'bg-slate-200 border-slate-400',
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Projects & Campaign Graph</h2>
      <p className="text-sm text-slate-600">
        Campaign overview, execution timeline, task dependencies, asset generation, tool usage.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project list */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Projects</h3>
          {projects.length === 0 ? (
            <p className="text-xs text-slate-500">No projects yet.</p>
          ) : (
            <div className="space-y-1.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedProject?.id === p.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Tasks</h3>
          {!selectedProject ? (
            <p className="text-xs text-slate-500">Select a project</p>
          ) : tasks.length === 0 ? (
            <p className="text-xs text-slate-500">No tasks</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-100 p-2 text-xs">
                  <div className="font-medium text-slate-800">{t.name}</div>
                  <div className="text-slate-500 mt-0.5">{t.agent} · {t.tool ?? '—'}</div>
                  <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    t.delayTracking?.isDelayed ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {t.status}{t.delayTracking?.isDelayed ? ' (delayed)' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Graph */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Campaign Graph</h3>
          {!selectedProject || !graph ? (
            <p className="text-xs text-slate-500">Select a project with a campaign graph</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {graph.nodes.map((n) => (
                <div
                  key={n.id}
                  className={`inline-block px-2 py-1 rounded text-[10px] border mr-1 mb-1 ${nodeColors[n.type] ?? 'bg-slate-50 border-slate-200'}`}
                >
                  <span className="font-medium">{n.label}</span>
                  <span className="text-slate-500 ml-1">({n.type})</span>
                </div>
              ))}
              <div className="text-[10px] text-slate-500 mt-2">
                {graph.edges.length} edges (depends_on, uses, produces, executes)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
