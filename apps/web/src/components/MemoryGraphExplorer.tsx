'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NodeType = 'persona' | 'skill' | 'agent' | 'tool' | 'workflow' | 'execution';

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  weight: number; // usage count → radius
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  weight: number; // strength
}

// ---------------------------------------------------------------------------
// Seed graph data
// ---------------------------------------------------------------------------

const RAW_NODES: Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy'>[] = [
  // Personas
  { id: 'p-engineering', type: 'persona', label: 'Engineering',  weight: 847 },
  { id: 'p-marketing',   type: 'persona', label: 'Marketing',    weight: 634 },
  { id: 'p-product',     type: 'persona', label: 'Product',      weight: 412 },
  { id: 'p-hr',          type: 'persona', label: 'HR',           weight: 298 },
  { id: 'p-finance',     type: 'persona', label: 'Finance',      weight: 187 },
  { id: 'p-legal',       type: 'persona', label: 'Legal',        weight: 98 },
  { id: 'p-sales',       type: 'persona', label: 'Sales',        weight: 156 },
  // Skills
  { id: 's-pr-review',   type: 'skill',   label: 'PR Review',    weight: 421 },
  { id: 's-incident',    type: 'skill',   label: 'Incident RCA', weight: 312 },
  { id: 's-campaign',    type: 'skill',   label: 'Campaign Strat',weight: 398 },
  { id: 's-prd',         type: 'skill',   label: 'PRD Generator',weight: 287 },
  { id: 's-icp',         type: 'skill',   label: 'ICP Analysis', weight: 198 },
  { id: 's-resume',      type: 'skill',   label: 'Resume Screen',weight: 176 },
  { id: 's-forecast',    type: 'skill',   label: 'Forecasting',  weight: 134 },
  { id: 's-pipeline',    type: 'skill',   label: 'Pipeline Intel',weight: 112 },
  // Agents
  { id: 'a-pr-reviewer', type: 'agent',   label: 'PR Reviewer',  weight: 380 },
  { id: 'a-campaign',    type: 'agent',   label: 'Campaigner',   weight: 310 },
  { id: 'a-incident',    type: 'agent',   label: 'Incident Bot', weight: 290 },
  { id: 'a-prd',         type: 'agent',   label: 'PRD Agent',    weight: 260 },
  // Tools
  { id: 't-github',      type: 'tool',    label: 'GitHub',       weight: 542 },
  { id: 't-jira',        type: 'tool',    label: 'Jira',         weight: 487 },
  { id: 't-hubspot',     type: 'tool',    label: 'HubSpot',      weight: 312 },
  { id: 't-confluence',  type: 'tool',    label: 'Confluence',   weight: 298 },
  { id: 't-canva',       type: 'tool',    label: 'Canva',        weight: 187 },
  // Workflows
  { id: 'w-feature',     type: 'workflow',label: 'Feature Release',weight: 156 },
  { id: 'w-campaign-wf', type: 'workflow',label: 'Campaign Launch',weight: 134 },
  { id: 'w-incident-wf', type: 'workflow',label: 'Incident Resp', weight: 112 },
];

const EDGES: GraphEdge[] = [
  // Persona → Skill
  { id: 'e1',  source: 'p-engineering', target: 's-pr-review',   edgeType: 'uses_skill',   weight: 0.9 },
  { id: 'e2',  source: 'p-engineering', target: 's-incident',    edgeType: 'uses_skill',   weight: 0.8 },
  { id: 'e3',  source: 'p-marketing',   target: 's-campaign',    edgeType: 'uses_skill',   weight: 0.9 },
  { id: 'e4',  source: 'p-marketing',   target: 's-icp',         edgeType: 'uses_skill',   weight: 0.7 },
  { id: 'e5',  source: 'p-product',     target: 's-prd',         edgeType: 'uses_skill',   weight: 0.9 },
  { id: 'e6',  source: 'p-hr',          target: 's-resume',      edgeType: 'uses_skill',   weight: 0.8 },
  { id: 'e7',  source: 'p-finance',     target: 's-forecast',    edgeType: 'uses_skill',   weight: 0.7 },
  { id: 'e8',  source: 'p-sales',       target: 's-pipeline',    edgeType: 'uses_skill',   weight: 0.8 },
  // Skill → Agent
  { id: 'e9',  source: 's-pr-review',   target: 'a-pr-reviewer', edgeType: 'executed_by',  weight: 0.9 },
  { id: 'e10', source: 's-campaign',    target: 'a-campaign',    edgeType: 'executed_by',  weight: 0.9 },
  { id: 'e11', source: 's-incident',    target: 'a-incident',    edgeType: 'executed_by',  weight: 0.8 },
  { id: 'e12', source: 's-prd',         target: 'a-prd',         edgeType: 'executed_by',  weight: 0.8 },
  // Agent → Tool
  { id: 'e13', source: 'a-pr-reviewer', target: 't-github',      edgeType: 'requires_tool',weight: 0.9 },
  { id: 'e14', source: 'a-pr-reviewer', target: 't-jira',        edgeType: 'requires_tool',weight: 0.7 },
  { id: 'e15', source: 'a-campaign',    target: 't-hubspot',     edgeType: 'requires_tool',weight: 0.9 },
  { id: 'e16', source: 'a-campaign',    target: 't-canva',       edgeType: 'requires_tool',weight: 0.6 },
  { id: 'e17', source: 'a-incident',    target: 't-github',      edgeType: 'requires_tool',weight: 0.7 },
  { id: 'e18', source: 'a-prd',         target: 't-confluence',  edgeType: 'requires_tool',weight: 0.8 },
  { id: 'e19', source: 'a-prd',         target: 't-jira',        edgeType: 'requires_tool',weight: 0.7 },
  // Skill → Workflow
  { id: 'e20', source: 's-pr-review',   target: 'w-feature',     edgeType: 'part_of',      weight: 0.7 },
  { id: 'e21', source: 's-campaign',    target: 'w-campaign-wf', edgeType: 'part_of',      weight: 0.8 },
  { id: 'e22', source: 's-incident',    target: 'w-incident-wf', edgeType: 'part_of',      weight: 0.9 },
  // Cross-skill used_together (from memory)
  { id: 'e23', source: 's-campaign',    target: 's-icp',         edgeType: 'used_together',weight: 0.6 },
  { id: 'e24', source: 's-prd',         target: 's-pr-review',   edgeType: 'used_together',weight: 0.5 },
];

// ---------------------------------------------------------------------------
// Colors per node type
// ---------------------------------------------------------------------------

const NODE_COLOR: Record<NodeType, { fill: string; stroke: string; text: string }> = {
  persona:   { fill: '#f3f4f6', stroke: '#9ca3af', text: '#374151' },
  skill:     { fill: '#dbeafe', stroke: '#3b82f6', text: '#1d4ed8' },
  agent:     { fill: '#ede9fe', stroke: '#8b5cf6', text: '#5b21b6' },
  tool:      { fill: '#ffedd5', stroke: '#f97316', text: '#c2410c' },
  workflow:  { fill: '#dcfce7', stroke: '#22c55e', text: '#15803d' },
  execution: { fill: '#fef9c3', stroke: '#eab308', text: '#854d0e' },
};

const TYPE_LABEL: Record<NodeType, string> = {
  persona: 'Persona', skill: 'Skill', agent: 'Agent',
  tool: 'Tool', workflow: 'Workflow', execution: 'Execution',
};

const TYPE_FILTERS: NodeType[] = ['persona', 'skill', 'agent', 'tool', 'workflow'];

// ---------------------------------------------------------------------------
// Force simulation (simple spring + repulsion)
// ---------------------------------------------------------------------------

function initNodes(width: number, height: number): GraphNode[] {
  return RAW_NODES.map((n, i) => ({
    ...n,
    x: width / 2 + (Math.random() - 0.5) * 300,
    y: height / 2 + (Math.random() - 0.5) * 300,
    vx: 0,
    vy: 0,
  }));
}

function simulationTick(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[] {
  const REPULSION = 2200;
  const SPRING_STRENGTH = 0.08;
  const SPRING_REST = 120;
  const DAMPING = 0.82;
  const CENTER_STRENGTH = 0.006;

  const next = nodes.map(n => ({ ...n }));
  const idx: Record<string, number> = {};
  next.forEach((n, i) => { idx[n.id] = i; });

  // Repulsion
  for (let i = 0; i < next.length; i++) {
    for (let j = i + 1; j < next.length; j++) {
      const dx = next[j].x - next[i].x;
      const dy = next[j].y - next[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      next[i].vx -= fx;
      next[i].vy -= fy;
      next[j].vx += fx;
      next[j].vy += fy;
    }
  }

  // Springs (edges)
  for (const edge of edges) {
    const si = idx[edge.source];
    const ti = idx[edge.target];
    if (si == null || ti == null) continue;
    const dx = next[ti].x - next[si].x;
    const dy = next[ti].y - next[si].y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const restLen = SPRING_REST * (1 / (edge.weight + 0.1));
    const force = (dist - restLen) * SPRING_STRENGTH;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    next[si].vx += fx;
    next[si].vy += fy;
    next[ti].vx -= fx;
    next[ti].vy -= fy;
  }

  // Center gravity
  const cx = width / 2;
  const cy = height / 2;
  for (const n of next) {
    n.vx += (cx - n.x) * CENTER_STRENGTH;
    n.vy += (cy - n.y) * CENTER_STRENGTH;
    n.vx *= DAMPING;
    n.vy *= DAMPING;
    n.x += n.vx;
    n.y += n.vy;
    // Boundary clamp
    n.x = Math.max(30, Math.min(width - 30, n.x));
    n.y = Math.max(30, Math.min(height - 30, n.y));
  }
  return next;
}

function nodeRadius(weight: number): number {
  return Math.max(18, Math.min(38, 12 + Math.sqrt(weight) * 0.7));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MemoryGraphExplorer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 560 });
  const [nodes, setNodes] = useState<GraphNode[]>(() => initNodes(800, 560));
  const [running, setRunning] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ lastX: number; lastY: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(new Set(TYPE_FILTERS));
  const [searchQ, setSearchQ] = useState('');
  const tickRef = useRef(0);
  const frameRef = useRef<number>(0);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Observe canvas size
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      if (rect.width > 0 && rect.height > 0) {
        setDims({ w: rect.width, h: rect.height });
      }
    });
    ro.observe(el);
    setDims({ w: el.clientWidth || 800, h: el.clientHeight || 560 });
    return () => ro.disconnect();
  }, []);

  // Force sim loop
  useEffect(() => {
    if (!running) return;
    const animate = () => {
      if (tickRef.current < 200) {
        setNodes(prev => simulationTick(prev, EDGES, dims.w, dims.h));
        tickRef.current++;
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setRunning(false);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [running, dims]);

  const resetSim = useCallback(() => {
    setNodes(initNodes(dims.w, dims.h));
    tickRef.current = 0;
    setRunning(true);
    setSelectedNode(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [dims]);

  // Pan handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('[data-node]')) return;
    setDragging({ lastX: e.clientX, lastY: e.clientY });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.lastX;
    const dy = e.clientY - dragging.lastY;
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    setDragging({ lastX: e.clientX, lastY: e.clientY });
  };
  const onMouseUp = () => setDragging(null);

  // Zoom on wheel
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(3, z * delta)));
  };

  // Filter
  const filteredNodes = nodes.filter(n => {
    if (!visibleTypes.has(n.type)) return false;
    if (searchQ && !n.label.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = EDGES.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));

  // Node connections for detail panel
  const connectedEdges = selectedNode
    ? EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];
  const connectedNodeIds = new Set(connectedEdges.flatMap(e => [e.source, e.target]).filter(id => id !== selectedNode?.id));
  const connectedNodes = nodes.filter(n => connectedNodeIds.has(n.id));

  const toggleType = (t: NodeType) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50/30">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-base font-bold text-slate-900">Memory Graph Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredNodes.length} nodes · {filteredEdges.length} connections · showing skill/agent/tool relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search nodes…"
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400 w-36"
          />
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} className="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">＋</button>
          <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z / 1.2))} className="px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">－</button>
          {/* Reset */}
          <button onClick={resetSim} className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex-shrink-0 flex items-center gap-2 px-6 py-2 bg-white border-b border-slate-100">
        <span className="text-[11px] text-slate-400 font-medium mr-1">Filter:</span>
        {TYPE_FILTERS.map(t => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
              visibleTypes.has(t)
                ? 'border-transparent text-white'
                : 'border-slate-200 text-slate-400 bg-white'
            }`}
            style={visibleTypes.has(t) ? { backgroundColor: NODE_COLOR[t].stroke } : {}}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
        {running && (
          <span className="ml-auto text-[11px] text-blue-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Simulating…
          </span>
        )}
      </div>

      {/* Graph + detail panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* SVG canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <svg width="100%" height="100%" className="w-full h-full">
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {filteredEdges.map(edge => {
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;
                const highlight = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
                return (
                  <line
                    key={edge.id}
                    x1={src.x} y1={src.y}
                    x2={tgt.x} y2={tgt.y}
                    stroke={highlight ? '#111827' : '#d1d5db'}
                    strokeWidth={highlight ? 1.5 : 0.8}
                    strokeOpacity={highlight ? 0.9 : 0.5}
                    strokeDasharray={edge.edgeType === 'used_together' ? '4,3' : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const r = nodeRadius(node.weight);
                const colors = NODE_COLOR[node.type];
                const isSelected = selectedNode?.id === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const dimmed = selectedNode && !isSelected && !isConnected;
                return (
                  <g
                    key={node.id}
                    data-node="true"
                    transform={`translate(${node.x},${node.y})`}
                    style={{ cursor: 'pointer', opacity: dimmed ? 0.3 : 1 }}
                    onClick={e => { e.stopPropagation(); setSelectedNode(prev => prev?.id === node.id ? null : node); }}
                  >
                    <circle
                      r={r}
                      fill={colors.fill}
                      stroke={isSelected ? '#111827' : colors.stroke}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize={Math.max(8, Math.min(11, r * 0.55))}
                      fill={colors.text}
                      fontWeight="500"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label}
                    </text>
                    {/* Weight badge (small) */}
                    <text
                      y={r + 10}
                      textAnchor="middle"
                      fontSize="7"
                      fill="#9ca3af"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {node.weight}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-64 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{selectedNode.label}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Node info */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: NODE_COLOR[selectedNode.type].fill, border: `1px solid ${NODE_COLOR[selectedNode.type].stroke}` }}
              >
                <span className="text-xs font-semibold" style={{ color: NODE_COLOR[selectedNode.type].text }}>
                  {TYPE_LABEL[selectedNode.type]}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-slate-400 text-[11px]">Usage Count</p>
                  <p className="font-bold text-slate-900 text-base">{selectedNode.weight}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-slate-400 text-[11px]">Connections</p>
                  <p className="font-bold text-slate-900 text-base">{connectedEdges.length}</p>
                </div>
              </div>

              {/* Connections */}
              {connectedNodes.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Connected nodes</p>
                  <div className="space-y-1">
                    {connectedNodes.map(cn => {
                      const edge = connectedEdges.find(e => e.source === cn.id || e.target === cn.id);
                      const colors = NODE_COLOR[cn.type];
                      return (
                        <div
                          key={cn.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                          onClick={() => setSelectedNode(cn)}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colors.stroke }}
                          />
                          <span className="flex-1 truncate text-slate-800">{cn.label}</span>
                          {edge && (
                            <span className="text-[11px] text-slate-400 flex-shrink-0">{edge.edgeType.replace('_', ' ')}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 py-2 bg-white border-t border-slate-100">
        <span className="text-[11px] text-slate-400">Legend:</span>
        {TYPE_FILTERS.map(t => (
          <div key={t} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLOR[t].stroke }} />
            <span className="text-[11px] text-slate-500">{TYPE_LABEL[t]}</span>
          </div>
        ))}
        <span className="text-[11px] text-slate-400 ml-2">· · ·</span>
        <span className="text-[11px] text-slate-400">Dashed = used together</span>
        <span className="text-[11px] text-slate-400 ml-auto">Drag to pan · Scroll to zoom · Click node for details</span>
      </div>
    </div>
  );
}
