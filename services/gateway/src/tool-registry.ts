/**
 * AgentOS Extensible Tool Registry — Plugin-based tool registration
 *
 * Allows new tools to be added without modifying core. Engineering tools
 * (Terraform, ArgoCD, Datadog, etc.) can be registered dynamically.
 */

export interface RegisteredTool {
  id: string;
  name: string;
  capabilities: string[];
  authType: 'oauth' | 'api_key' | 'mcp';
  category: string;
  description?: string;
  icon?: string;
  registeredAt: string;
  registeredBy: string;
}

const customTools: Map<string, RegisteredTool> = new Map();

// Seed with common engineering tools
const ENGINEERING_TOOLS: Omit<RegisteredTool, 'registeredAt' | 'registeredBy'>[] = [
  { id: 'terraform', name: 'Terraform', capabilities: ['infra_provision'], authType: 'api_key', category: 'DevOps' },
  { id: 'argocd', name: 'ArgoCD', capabilities: ['deploy', 'sync'], authType: 'api_key', category: 'DevOps' },
  { id: 'datadog', name: 'Datadog', capabilities: ['track_performance', 'query_metrics'], authType: 'api_key', category: 'Observability' },
  { id: 'prometheus', name: 'Prometheus', capabilities: ['query_metrics'], authType: 'api_key', category: 'Observability' },
  { id: 'pagerduty', name: 'PagerDuty', capabilities: ['send_message', 'incident_manage'], authType: 'api_key', category: 'Incident' },
  { id: 'sentry', name: 'Sentry', capabilities: ['track_performance', 'error_tracking'], authType: 'api_key', category: 'Observability' },
  { id: 'kubernetes', name: 'Kubernetes', capabilities: ['deploy', 'infra_provision'], authType: 'api_key', category: 'DevOps' },
  { id: 'github', name: 'GitHub', capabilities: ['code_review', 'store_file'], authType: 'oauth', category: 'Engineering' },
  { id: 'jira', name: 'Jira', capabilities: ['manage_contacts', 'ticket_manage'], authType: 'oauth', category: 'Project' },
  { id: 'confluence', name: 'Confluence', capabilities: ['store_file', 'generate_text'], authType: 'oauth', category: 'Documentation' },
];

ENGINEERING_TOOLS.forEach((t) => {
  customTools.set(t.id, {
    ...t,
    registeredAt: new Date().toISOString(),
    registeredBy: 'system',
  });
});

export class ToolRegistry {
  register(tool: Omit<RegisteredTool, 'registeredAt'>): RegisteredTool {
    const now = new Date().toISOString();
    const full: RegisteredTool = { ...tool, registeredAt: now };
    customTools.set(tool.id, full);
    return full;
  }

  unregister(toolId: string): boolean {
    return customTools.delete(toolId);
  }

  get(toolId: string): RegisteredTool | undefined {
    return customTools.get(toolId);
  }

  getAll(): RegisteredTool[] {
    return Array.from(customTools.values());
  }

  getByCategory(category: string): RegisteredTool[] {
    return this.getAll().filter((t) => t.category === category);
  }

  getByCapability(capability: string): RegisteredTool[] {
    return this.getAll().filter((t) => t.capabilities.includes(capability));
  }
}

export const toolRegistry = new ToolRegistry();
