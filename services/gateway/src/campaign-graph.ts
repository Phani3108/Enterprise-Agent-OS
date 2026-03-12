/**
 * Campaign Graph — Campaign, Assets, Channels, Tasks, Tools, Owners, Agents, Outputs
 * Auto-generated when marketing workflow starts. Powers overview, timeline, dependencies.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

export type GraphNodeType = 'campaign' | 'asset' | 'channel' | 'task' | 'tool' | 'owner' | 'agent' | 'output';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface CampaignGraph {
  id: string;
  campaignId: string;
  campaignName: string;
  workflowId: string;
  projectId?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  createdAt: string;
  updatedAt: string;
}

const graphs = new Map<string, CampaignGraph>();

function id(): string {
  return `cg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createCampaignGraph(
  campaignId: string,
  campaignName: string,
  workflowId: string,
  projectId?: string,
  steps?: Array<{ id: string; name: string; agent: string; tool?: string; outputKey: string }>
): CampaignGraph {
  const now = new Date().toISOString();
  const graphId = id();

  const nodes: GraphNode[] = [
    { id: 'campaign-root', type: 'campaign', label: campaignName, data: { campaignId, workflowId } },
  ];

  const edges: GraphEdge[] = [];

  if (steps) {
    steps.forEach((step, i) => {
      const taskId = `task-${step.id}`;
      const agentId = `agent-${step.agent}`;
      const ownerId = `owner-${step.id}`;
      nodes.push(
        { id: taskId, type: 'task', label: step.name, data: { stepId: step.id, agent: step.agent, tool: step.tool } },
        { id: agentId, type: 'agent', label: step.agent, data: {} },
        { id: ownerId, type: 'owner', label: 'Owner', data: { taskId } }
      );
      edges.push({ source: 'campaign-root', target: taskId, type: 'contains' });
      edges.push({ source: agentId, target: taskId, type: 'executes' });
      edges.push({ source: ownerId, target: taskId, type: 'owns' });
      if (step.tool) {
        const toolId = `tool-${step.tool}`;
        if (!nodes.some((n) => n.id === toolId)) {
          nodes.push({ id: toolId, type: 'tool', label: step.tool, data: {} });
        }
        edges.push({ source: taskId, target: toolId, type: 'uses' });
      }
      if (step.outputKey) {
        const outputId = `output-${step.outputKey}`;
        nodes.push({ id: outputId, type: 'output', label: step.outputKey, data: {} });
        edges.push({ source: taskId, target: outputId, type: 'produces' });
      }
      if (i > 0) {
        const prevTaskId = `task-${steps[i - 1].id}`;
        edges.push({ source: prevTaskId, target: taskId, type: 'depends_on' });
      }
    });
  }

  const graph: CampaignGraph = {
    id: graphId,
    campaignId,
    campaignName,
    workflowId,
    projectId,
    nodes,
    edges,
    createdAt: now,
    updatedAt: now,
  };

  graphs.set(graphId, graph);
  return graph;
}

export function getCampaignGraph(id: string): CampaignGraph | undefined {
  return graphs.get(id);
}

export function updateCampaignGraph(id: string, updates: Partial<CampaignGraph>): CampaignGraph | undefined {
  const graph = graphs.get(id);
  if (!graph) return undefined;
  const updated = { ...graph, ...updates, updatedAt: new Date().toISOString() };
  graphs.set(id, updated);
  return updated;
}

export function addGraphNode(graphId: string, node: GraphNode): CampaignGraph | undefined {
  const graph = graphs.get(graphId);
  if (!graph) return undefined;
  if (graph.nodes.some((n) => n.id === node.id)) return graph;
  graph.nodes.push(node);
  graph.updatedAt = new Date().toISOString();
  return graph;
}

export function addGraphEdge(graphId: string, edge: GraphEdge): CampaignGraph | undefined {
  const graph = graphs.get(graphId);
  if (!graph) return undefined;
  graph.edges.push(edge);
  graph.updatedAt = new Date().toISOString();
  return graph;
}

export function getGraphsByCampaign(campaignId: string): CampaignGraph[] {
  return Array.from(graphs.values()).filter((g) => g.campaignId === campaignId);
}
