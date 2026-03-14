/**
 * WorkflowBuilder — Visual node-based workflow editor
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

interface WorkflowNode {
  id: string;
  type: 'agent' | 'worker' | 'tool' | 'decision' | 'start' | 'end';
  label: string;
  skill?: string;
  status: 'idle' | 'running' | 'complete' | 'failed';
  x: number;
  y: number;
}

interface WorkflowEdge { from: string; to: string; label?: string; }

const DEMO_NODES: WorkflowNode[] = [
  { id: 'start',    type: 'start',    label: 'User Request',      status: 'complete', x: 50,  y: 120 },
  { id: 'icp',      type: 'agent',    label: 'ICP Analysis',      skill: 'marketing.icp_analysis',      status: 'complete', x: 220, y: 60  },
  { id: 'market',   type: 'tool',     label: 'GA4 Query',         status: 'complete', x: 220, y: 180 },
  { id: 'strategy', type: 'agent',    label: 'Campaign Strategy', skill: 'marketing.campaign_strategy', status: 'running',  x: 420, y: 120 },
  { id: 'decide',   type: 'decision', label: 'Approval?',         status: 'idle',     x: 620, y: 120 },
  { id: 'content',  type: 'worker',   label: 'Content Generator', status: 'idle',     x: 800, y: 60  },
  { id: 'email',    type: 'worker',   label: 'Email Sequence',    status: 'idle',     x: 800, y: 180 },
  { id: 'end',      type: 'end',      label: 'Deliver',           status: 'idle',     x: 970, y: 120 },
];

const DEMO_EDGES: WorkflowEdge[] = [
  { from: 'start', to: 'icp' }, { from: 'start', to: 'market' },
  { from: 'icp', to: 'strategy' }, { from: 'market', to: 'strategy' },
  { from: 'strategy', to: 'decide' },
  { from: 'decide', to: 'content', label: 'Yes' }, { from: 'decide', to: 'email', label: 'Yes' },
  { from: 'content', to: 'end' }, { from: 'email', to: 'end' },
];

const NODE_STYLES: Record<WorkflowNode['type'], { bg: string; border: string; text: string; icon: string }> = {
  start:    { bg: 'bg-slate-800',      border: 'border-slate-600',      text: 'text-white',       icon: '▶' },
  end:      { bg: 'bg-slate-800',      border: 'border-slate-600',      text: 'text-white',       icon: '⏹' },
  agent:    { bg: 'bg-blue-50',       border: 'border-blue-300',      text: 'text-blue-900',    icon: '◉' },
  worker:   { bg: 'bg-emerald-50',    border: 'border-emerald-300',   text: 'text-emerald-900', icon: '⚙' },
  tool:     { bg: 'bg-amber-50',      border: 'border-amber-300',     text: 'text-amber-900',   icon: '⬡' },
  decision: { bg: 'bg-violet-50',     border: 'border-violet-300',    text: 'text-violet-900',  icon: '◆' },
};

const STATUS_RING: Record<WorkflowNode['status'], string> = {
  idle:     '',
  running:  'ring-2 ring-blue-400 ring-offset-1',
  complete: 'ring-2 ring-emerald-400 ring-offset-1',
  failed:   'ring-2 ring-red-400 ring-offset-1',
};

const WORKFLOW_TEMPLATES = [
  { name: 'Campaign Launch',    nodes: 8, status: 'active',   persona: 'Marketing' },
  { name: 'Incident Response',  nodes: 6, status: 'active',   persona: 'Engineering' },
  { name: 'Product Launch',     nodes: 7, status: 'active',   persona: 'Product' },
  { name: 'Onboarding Flow',    nodes: 7, status: 'active',   persona: 'HR' },
];

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft:    'bg-amber-100 text-amber-700 border-amber-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PERSONA_COLOR: Record<string, string> = {
  Marketing:   'bg-pink-100 text-pink-700',
  Engineering: 'bg-blue-100 text-blue-700',
  Product:     'bg-violet-100 text-violet-700',
  HR:          'bg-teal-100 text-teal-700',
};

export function WorkflowBuilder({ personaFilter }: { personaFilter?: string } = {}) {
  const templates = personaFilter
    ? WORKFLOW_TEMPLATES.filter(wf => wf.persona === personaFilter)
    : WORKFLOW_TEMPLATES;
  return (
    <div className="p-6 bg-slate-50 min-h-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{personaFilter ? `${personaFilter} Workflows` : 'Workflow Builder'}</h2>
          <p className="text-sm text-slate-600 font-medium mt-0.5">Design and orchestrate multi-agent automation pipelines</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
          <span>+</span> New Workflow
        </button>
      </div>

      {/* Active workflow canvas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">Campaign Launch Workflow</h3>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Running
            </span>
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
            <button className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors">Run</button>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="relative w-full h-72 bg-slate-50 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="wf-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              </pattern>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#wf-grid)" />
            {DEMO_EDGES.map((edge, idx) => {
              const from = DEMO_NODES.find(n => n.id === edge.from)!;
              const to   = DEMO_NODES.find(n => n.id === edge.to)!;
              const isActive = from.status === 'complete' || from.status === 'running';
              return (
                <g key={idx}>
                  <line
                    x1={from.x + 62} y1={from.y + 18}
                    x2={to.x - 4}    y2={to.y + 18}
                    stroke={isActive ? '#3b82f6' : '#cbd5e1'}
                    strokeWidth={isActive ? 2 : 1.5}
                    strokeDasharray={isActive ? '0' : '5 4'}
                    markerEnd="url(#arrow)"
                  />
                  {edge.label && (
                    <text
                      x={(from.x + 62 + to.x) / 2}
                      y={(from.y + to.y) / 2 + 12}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >{edge.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {DEMO_NODES.map(node => {
            const s = NODE_STYLES[node.type];
            return (
              <div
                key={node.id}
                className={`absolute px-3 py-2 rounded-lg border-2 shadow-sm ${s.bg} ${s.border} ${STATUS_RING[node.status]} cursor-pointer hover:scale-105 transition-all`}
                style={{ left: node.x, top: node.y }}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${s.text}`}>{s.icon}</span>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${s.text}`}>{node.label}</span>
                </div>
                {node.skill && (
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[100px]">{node.skill}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow templates list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">All Workflows</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {templates.map(wf => (
            <div key={wf.name} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">⚡</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{wf.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${PERSONA_COLOR[wf.persona] ?? 'bg-slate-100 text-slate-600'}`}>
                      {wf.persona}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">{wf.nodes} nodes</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[wf.status]}`}>
                  {wf.status}
                </span>
                <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
