'use client';

/**
 * Workflow Builder — Visual node-based workflow editor
 * Uses a simplified React Flow-inspired interface.
 */

interface WorkflowNode {
    id: string;
    type: 'agent' | 'worker' | 'tool' | 'decision' | 'start' | 'end';
    label: string;
    skill?: string;
    status: 'idle' | 'running' | 'complete' | 'failed';
    x: number;
    y: number;
}

interface WorkflowEdge {
    from: string;
    to: string;
    label?: string;
}

const DEMO_NODES: WorkflowNode[] = [
    { id: 'start', type: 'start', label: 'User Request', status: 'complete', x: 50, y: 120 },
    { id: 'icp', type: 'agent', label: 'ICP Analysis', skill: 'marketing.icp_analysis', status: 'complete', x: 220, y: 60 },
    { id: 'market', type: 'tool', label: 'GA4 Query', status: 'complete', x: 220, y: 180 },
    { id: 'strategy', type: 'agent', label: 'Campaign Strategy', skill: 'marketing.campaign_strategy', status: 'running', x: 420, y: 120 },
    { id: 'decide', type: 'decision', label: 'Approval?', status: 'idle', x: 620, y: 120 },
    { id: 'content', type: 'worker', label: 'Content Generator', status: 'idle', x: 800, y: 60 },
    { id: 'email', type: 'worker', label: 'Email Sequence', status: 'idle', x: 800, y: 180 },
    { id: 'end', type: 'end', label: 'Deliver', status: 'idle', x: 970, y: 120 },
];

const DEMO_EDGES: WorkflowEdge[] = [
    { from: 'start', to: 'icp' },
    { from: 'start', to: 'market' },
    { from: 'icp', to: 'strategy' },
    { from: 'market', to: 'strategy' },
    { from: 'strategy', to: 'decide' },
    { from: 'decide', to: 'content', label: 'Yes' },
    { from: 'decide', to: 'email', label: 'Yes' },
    { from: 'content', to: 'end' },
    { from: 'email', to: 'end' },
];

const NODE_STYLES: Record<WorkflowNode['type'], { bg: string; border: string; icon: string }> = {
    start: { bg: 'bg-neutral-800', border: 'border-neutral-600', icon: '▶' },
    end: { bg: 'bg-neutral-800', border: 'border-neutral-600', icon: '⏹' },
    agent: { bg: 'bg-accent/10', border: 'border-accent/30', icon: '🤖' },
    worker: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '👷' },
    tool: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '🔧' },
    decision: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: '🔀' },
};

const STATUS_RINGS: Record<WorkflowNode['status'], string> = {
    idle: '',
    running: 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
    complete: 'ring-2 ring-success/50 ring-offset-2 ring-offset-surface',
    failed: 'ring-2 ring-danger/50 ring-offset-2 ring-offset-surface',
};

export function WorkflowBuilder() {
    return (
        <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Campaign Workflow</h3>
                <div className="flex items-center gap-2">
                    <span className="status-dot running" />
                    <span className="text-xs text-neutral-400">Running</span>
                </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full h-64 bg-surface rounded-lg overflow-hidden border border-white/[0.04]">
                {/* Grid pattern */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Edges */}
                    {DEMO_EDGES.map((edge, idx) => {
                        const from = DEMO_NODES.find((n) => n.id === edge.from)!;
                        const to = DEMO_NODES.find((n) => n.id === edge.to)!;
                        return (
                            <g key={idx}>
                                <line
                                    x1={from.x + 60} y1={from.y + 18}
                                    x2={to.x} y2={to.y + 18}
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="1.5"
                                    strokeDasharray={from.status === 'complete' && to.status !== 'idle' ? '0' : '4 4'}
                                />
                                {edge.label && (
                                    <text
                                        x={(from.x + 60 + to.x) / 2}
                                        y={(from.y + to.y) / 2 + 14}
                                        fill="rgba(255,255,255,0.3)"
                                        fontSize="9"
                                        textAnchor="middle"
                                    >
                                        {edge.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Nodes */}
                {DEMO_NODES.map((node) => {
                    const style = NODE_STYLES[node.type];
                    return (
                        <div
                            key={node.id}
                            className={`absolute px-3 py-2 rounded-lg border ${style.bg} ${style.border} ${STATUS_RINGS[node.status]} cursor-pointer hover:scale-105 transition-transform`}
                            style={{ left: node.x, top: node.y }}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">{style.icon}</span>
                                <span className="text-[11px] text-white font-medium whitespace-nowrap">{node.label}</span>
                            </div>
                            {node.skill && (
                                <div className="text-[9px] text-neutral-500 font-mono mt-0.5">{node.skill}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
