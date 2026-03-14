'use client';

import { useState, useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ACPAgent {
  id: string;
  name: string;
  icon: string;
  model: string;
  persona: string;
  x: number;
  y: number;
}

interface ACPMessage {
  id: string;
  from: string;
  to: string;
  type: 'task_delegation' | 'result_handoff' | 'approval_request' | 'context_share' | 'error_escalation';
  label: string;
  payload: string;
  timestamp: string;
  status: 'pending' | 'in_flight' | 'delivered' | 'failed';
}

interface ACPExecution {
  id: string;
  name: string;
  persona: string;
  skill: string;
  status: 'running' | 'completed' | 'failed';
  agents: ACPAgent[];
  messages: ACPMessage[];
  startedAt: string;
  duration?: string;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_EXECUTIONS: ACPExecution[] = [
  {
    id: 'exec-1',
    name: 'Campaign Launch Flow',
    persona: 'Marketing',
    skill: 'Campaign Strategy v2.1',
    status: 'running',
    startedAt: new Date(Date.now() - 45000).toISOString(),
    agents: [
      { id: 'a1', name: 'Intent Router',       icon: '🎯', model: 'claude-sonnet-4-6', persona: 'System',    x: 80,  y: 160 },
      { id: 'a2', name: 'Campaign Strategist',  icon: '📣', model: 'claude-opus-4-6',   persona: 'Marketing', x: 280, y: 80  },
      { id: 'a3', name: 'Content Generator',    icon: '✍️', model: 'claude-sonnet-4-6', persona: 'Marketing', x: 480, y: 80  },
      { id: 'a4', name: 'HubSpot Connector',    icon: '🔌', model: 'tool',              persona: 'Tool',      x: 480, y: 240 },
      { id: 'a5', name: 'QA Reviewer',          icon: '✅', model: 'claude-haiku-4-5',  persona: 'Marketing', x: 280, y: 240 },
    ],
    messages: [
      { id: 'm1', from: 'a1', to: 'a2', type: 'task_delegation',  label: 'delegate',   payload: '{"intent":"launch_campaign","context":"Q2 product launch","confidence":0.94}',            timestamp: new Date(Date.now() - 44000).toISOString(), status: 'delivered' },
      { id: 'm2', from: 'a2', to: 'a4', type: 'task_delegation',  label: 'query CRM',  payload: '{"tool":"hubspot","action":"get_contacts","filter":{"segment":"enterprise"}}',             timestamp: new Date(Date.now() - 38000).toISOString(), status: 'delivered' },
      { id: 'm3', from: 'a4', to: 'a2', type: 'result_handoff',   label: 'CRM data',   payload: '{"contacts":847,"segments":["enterprise","smb"],"topIndustries":["SaaS","FinTech"]}',    timestamp: new Date(Date.now() - 30000).toISOString(), status: 'delivered' },
      { id: 'm4', from: 'a2', to: 'a3', type: 'task_delegation',  label: 'generate',   payload: '{"task":"write_campaign_copy","audience":"enterprise SaaS","tone":"professional","cta":"Start Free Trial"}', timestamp: new Date(Date.now() - 22000).toISOString(), status: 'delivered' },
      { id: 'm5', from: 'a3', to: 'a5', type: 'approval_request', label: 'review',     payload: '{"draft":"Your AI-powered workflow deserves...","wordCount":142,"readability":"grade8"}', timestamp: new Date(Date.now() - 10000).toISOString(), status: 'in_flight' },
      { id: 'm6', from: 'a5', to: 'a2', type: 'result_handoff',   label: 'approved',   payload: '{"status":"pending","score":0.87,"suggestions":["Add social proof","Shorten headline"]}', timestamp: new Date(Date.now() - 3000).toISOString(),  status: 'pending' },
    ],
  },
  {
    id: 'exec-2',
    name: 'Support Ticket Triage',
    persona: 'Support',
    skill: 'Ticket Classifier v1.4',
    status: 'completed',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    duration: '1m 48s',
    agents: [
      { id: 'b1', name: 'Ticket Classifier', icon: '🏷️', model: 'claude-haiku-4-5',  persona: 'Support', x: 80,  y: 160 },
      { id: 'b2', name: 'Priority Ranker',   icon: '⬆️', model: 'claude-haiku-4-5',  persona: 'Support', x: 280, y: 80  },
      { id: 'b3', name: 'Escalation Router', icon: '📡', model: 'claude-sonnet-4-6', persona: 'Support', x: 280, y: 240 },
      { id: 'b4', name: 'Zendesk Tool',      icon: '🔌', model: 'tool',              persona: 'Tool',    x: 480, y: 160 },
    ],
    messages: [
      { id: 'n1', from: 'b1', to: 'b2', type: 'task_delegation',  label: 'classify',  payload: '{"ticket":"Login broken after update","category":"bug","sentiment":"frustrated"}', timestamp: new Date(Date.now() - 118000).toISOString(), status: 'delivered' },
      { id: 'n2', from: 'b2', to: 'b3', type: 'context_share',    label: 'priority',  payload: '{"priority":"P1","sla":"2h","affectedUsers":142}',                                  timestamp: new Date(Date.now() - 112000).toISOString(), status: 'delivered' },
      { id: 'n3', from: 'b3', to: 'b4', type: 'task_delegation',  label: 'escalate',  payload: '{"action":"assign_ticket","team":"engineering","priority":"urgent"}',              timestamp: new Date(Date.now() - 108000).toISOString(), status: 'delivered' },
      { id: 'n4', from: 'b4', to: 'b3', type: 'result_handoff',   label: 'assigned',  payload: '{"ticketId":"ZD-8821","assignee":"eng-oncall","eta":"45min"}',                     timestamp: new Date(Date.now() - 104000).toISOString(), status: 'delivered' },
    ],
  },
  {
    id: 'exec-3',
    name: 'Contract Risk Analysis',
    persona: 'Legal',
    skill: 'Contract Analyzer v3.0',
    status: 'failed',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    duration: '4m 12s',
    agents: [
      { id: 'c1', name: 'Document Parser',  icon: '📄', model: 'claude-sonnet-4-6', persona: 'Legal',  x: 80,  y: 160 },
      { id: 'c2', name: 'Risk Assessor',    icon: '⚖️', model: 'claude-opus-4-6',   persona: 'Legal',  x: 300, y: 160 },
      { id: 'c3', name: 'Compliance Check', icon: '🏛️', model: 'claude-haiku-4-5',  persona: 'Legal',  x: 520, y: 80  },
    ],
    messages: [
      { id: 'p1', from: 'c1', to: 'c2', type: 'result_handoff',    label: 'parsed',    payload: '{"pages":42,"clauses":187,"jurisdiction":"California","type":"SaaS MSA"}', timestamp: new Date(Date.now() - 298000).toISOString(), status: 'delivered' },
      { id: 'p2', from: 'c2', to: 'c3', type: 'approval_request',  label: 'review',    payload: '{"risks":["Uncapped liability","IP ownership ambiguity"],"severity":"high"}', timestamp: new Date(Date.now() - 270000).toISOString(), status: 'delivered' },
      { id: 'p3', from: 'c3', to: 'c2', type: 'error_escalation',  label: 'escalate',  payload: '{"error":"OFAC_CHECK_TIMEOUT","retries":3,"fallback":"manual_review"}',    timestamp: new Date(Date.now() - 252000).toISOString(), status: 'failed' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MSG_COLOR: Record<ACPMessage['type'], { line: string; badge: string }> = {
  task_delegation:  { line: '#3b82f6', badge: 'bg-blue-100 text-blue-700' },
  result_handoff:   { line: '#10b981', badge: 'bg-emerald-100 text-emerald-700' },
  approval_request: { line: '#f59e0b', badge: 'bg-amber-100 text-amber-700' },
  context_share:    { line: '#8b5cf6', badge: 'bg-purple-100 text-purple-700' },
  error_escalation: { line: '#ef4444', badge: 'bg-red-100 text-red-700' },
};

const STATUS_EXEC: Record<ACPExecution['status'], string> = {
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_MSG: Record<ACPMessage['status'], string> = {
  pending: 'text-slate-400',
  in_flight: 'text-blue-500 animate-pulse',
  delivered: 'text-emerald-500',
  failed: 'text-red-500',
};

function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return `${Math.round(d / 1000)}s ago`;
  return `${Math.round(d / 60000)}m ago`;
}

// ---------------------------------------------------------------------------
// SVG Arrow marker helper
// ---------------------------------------------------------------------------

function arrowPath(
  x1: number, y1: number,
  x2: number, y2: number,
  nodeW = 120, nodeH = 52,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const startX = x1 + Math.cos(angle) * (nodeW / 2 + 6);
  const startY = y1 + Math.sin(angle) * (nodeH / 2 + 6);
  const endX = x2 - Math.cos(angle) * (nodeW / 2 + 12);
  const endY = y2 - Math.sin(angle) * (nodeH / 2 + 12);
  return `M${startX},${startY} L${endX},${endY}`;
}

function midPoint(
  x1: number, y1: number,
  x2: number, y2: number,
) {
  return { mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

// ---------------------------------------------------------------------------
// AnimatedDot — travels along a path for in_flight messages
// ---------------------------------------------------------------------------

function AnimatedDot({ x1, y1, x2, y2, color }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
}) {
  const [t, setT] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef(performance.now());

  useEffect(() => {
    const animate = (now: number) => {
      const elapsed = (now - start.current) / 1800; // 1.8s cycle
      setT(elapsed % 1);
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const cx = x1 + (x2 - x1) * t;
  const cy = y1 + (y2 - y1) * t;
  return <circle cx={cx} cy={cy} r={5} fill={color} opacity={0.85} />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AgentCollaboration() {
  const [selectedExec, setSelectedExec] = useState<ACPExecution>(SEED_EXECUTIONS[0]);
  const [selectedMsg, setSelectedMsg] = useState<ACPMessage | null>(null);
  const [executions, setExecutions] = useState<ACPExecution[]>(SEED_EXECUTIONS);

  // Attempt to fetch from gateway
  useEffect(() => {
    fetch('http://localhost:3000/api/acp/executions')
      .then(r => r.ok ? r.json() : null)
      .then((data: { executions?: ACPExecution[] } | null) => {
        if (data?.executions?.length) setExecutions(data.executions);
      })
      .catch(() => {});
  }, []);

  const agents = selectedExec.agents;
  const messages = selectedExec.messages;

  // Build agent lookup
  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

  // SVG canvas dimensions
  const SVG_W = 620;
  const SVG_H = 340;
  const NODE_W = 120;
  const NODE_H = 52;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: execution list */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-900">ACP Executions</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Agent-to-agent message flows</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
          {executions.map(exec => (
            <button
              key={exec.id}
              onClick={() => { setSelectedExec(exec); setSelectedMsg(null); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg mx-1.5 transition-colors ${
                selectedExec.id === exec.id ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-xs font-medium text-slate-900 truncate">{exec.name}</p>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${STATUS_EXEC[exec.status]}`}>
                  {exec.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{exec.persona} · {exec.skill}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-300">{relTime(exec.startedAt)}</span>
                {exec.duration && (
                  <span className="text-[11px] text-slate-300">· {exec.duration}</span>
                )}
                <span className="text-[11px] text-slate-400 ml-auto">{exec.agents.length} agents</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main: SVG diagram */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 flex-shrink-0 bg-slate-50/40">
          <span className="text-xs font-semibold text-slate-700">{selectedExec.name}</span>
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${STATUS_EXEC[selectedExec.status]}`}>
            {selectedExec.status}
          </span>
          <div className="ml-auto flex items-center gap-4 text-[11px] text-slate-400">
            {Object.entries(MSG_COLOR).map(([type, { badge }]) => (
              <span key={type} className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${badge}`}>
                {type.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-50/30 p-4">
          <svg
            width={SVG_W}
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Arrow marker */}
            <defs>
              {Object.entries(MSG_COLOR).map(([type, { line }]) => (
                <marker
                  key={type}
                  id={`arrow-${type}`}
                  markerWidth="8" markerHeight="8"
                  refX="6" refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill={line} />
                </marker>
              ))}
            </defs>

            {/* Edges */}
            {messages.map(msg => {
              const from = agentMap[msg.from];
              const to   = agentMap[msg.to];
              if (!from || !to) return null;
              const color = MSG_COLOR[msg.type].line;
              const path  = arrowPath(from.x, from.y, to.x, to.y, NODE_W, NODE_H);
              const { mx, my } = midPoint(from.x, from.y, to.x, to.y);
              const isSelected = selectedMsg?.id === msg.id;
              return (
                <g key={msg.id} onClick={() => setSelectedMsg(msg)} className="cursor-pointer">
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={msg.status === 'pending' ? '5,4' : undefined}
                    fill="none"
                    markerEnd={`url(#arrow-${msg.type})`}
                    opacity={msg.status === 'failed' ? 0.5 : 0.8}
                  />
                  {/* Label */}
                  <rect x={mx - 22} y={my - 9} width={44} height={16} rx={4} fill="white" stroke={color} strokeWidth={0.8} />
                  <text x={mx} y={my + 2.5} textAnchor="middle" fontSize={8} fill={color} fontWeight={600}>
                    {msg.label}
                  </text>
                  {/* Animated dot for in_flight */}
                  {msg.status === 'in_flight' && (
                    <AnimatedDot
                      x1={from.x} y1={from.y}
                      x2={to.x}   y2={to.y}
                      color={color}
                    />
                  )}
                </g>
              );
            })}

            {/* Agent nodes */}
            {agents.map(agent => {
              const isTool = agent.model === 'tool';
              return (
                <g key={agent.id} transform={`translate(${agent.x - NODE_W / 2},${agent.y - NODE_H / 2})`}>
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={isTool ? '#fff7ed' : '#f8fafc'}
                    stroke={isTool ? '#f97316' : '#e2e8f0'}
                    strokeWidth={1.5}
                  />
                  <text x={NODE_W / 2} y={18} textAnchor="middle" fontSize={16}>{agent.icon}</text>
                  <text x={NODE_W / 2} y={31} textAnchor="middle" fontSize={9} fontWeight={600} fill="#1e293b">
                    {agent.name}
                  </text>
                  <text x={NODE_W / 2} y={43} textAnchor="middle" fontSize={8} fill="#94a3b8">
                    {isTool ? 'External Tool' : agent.model.replace('claude-', '').replace(/-\d+.*/, '')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right: message detail */}
      <aside className="w-64 flex-shrink-0 border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-900">Message Detail</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {selectedMsg ? 'Click an arrow to inspect' : 'Select an arrow in the diagram'}
          </p>
        </div>

        {selectedMsg ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Type badge */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Type</p>
              <span className={`text-[11px] font-semibold px-2 py-1 rounded ${MSG_COLOR[selectedMsg.type].badge}`}>
                {selectedMsg.type.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Route */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Route</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                <span className="font-medium">{agentMap[selectedMsg.from]?.name ?? selectedMsg.from}</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium">{agentMap[selectedMsg.to]?.name ?? selectedMsg.to}</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Status</p>
              <span className={`text-[11px] font-semibold ${STATUS_MSG[selectedMsg.status]}`}>
                {selectedMsg.status.replace('_', ' ')}
              </span>
            </div>

            {/* Timestamp */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Sent</p>
              <p className="text-[11px] text-slate-700">{relTime(selectedMsg.timestamp)}</p>
            </div>

            {/* Payload */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Payload</p>
              <pre className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-x-auto text-slate-700 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(JSON.parse(selectedMsg.payload), null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-2xl mb-2">🔗</p>
              <p className="text-[11px] text-slate-400">Click any arrow in the diagram to inspect the ACP message payload</p>
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="border-t border-slate-100 p-3 flex-shrink-0">
          <p className="text-[11px] font-semibold text-slate-500 mb-2">ALL MESSAGES ({messages.length})</p>
          <div className="space-y-1">
            {messages.map(msg => (
              <button
                key={msg.id}
                onClick={() => setSelectedMsg(msg)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                  selectedMsg?.id === msg.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-bold ${STATUS_MSG[msg.status]}`}>●</span>
                  <span className="text-slate-700 font-medium truncate">{msg.label}</span>
                  <span className="text-slate-400 ml-auto flex-shrink-0">{relTime(msg.timestamp)}</span>
                </div>
                <p className="text-slate-400 truncate pl-3">
                  {agentMap[msg.from]?.name} → {agentMap[msg.to]?.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
