/**
 * Cross-Domain Knowledge Flow Engine
 *
 * The real power of EAOS: connecting knowledge across domains.
 *
 * Example flow:
 *   1. Engineering builds a new capability
 *   2. EAOS automatically creates documentation
 *   3. EAOS generates training modules
 *   4. EAOS creates marketing messaging
 *
 * This creates institutional knowledge flow that no single-domain tool can.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeFlowTrigger {
    source: {
        domain: 'engineering' | 'marketing' | 'leadership' | 'learning';
        event: string;
        data: Record<string, unknown>;
    };
    targets: KnowledgeFlowTarget[];
}

export interface KnowledgeFlowTarget {
    domain: 'engineering' | 'marketing' | 'leadership' | 'learning';
    action: string;
    inputMapping: Record<string, string>;
    autoExecute: boolean;
    requiresApproval: boolean;
}

export interface KnowledgeFlowResult {
    triggerId: string;
    sourceEvent: string;
    outputs: Array<{
        domain: string;
        action: string;
        status: 'completed' | 'pending_approval' | 'failed';
        output: unknown;
    }>;
    executedAt: Date;
}

// ---------------------------------------------------------------------------
// Predefined Flows
// ---------------------------------------------------------------------------

export const KNOWLEDGE_FLOWS: KnowledgeFlowTrigger[] = [
    // New feature → docs + training + marketing
    {
        source: {
            domain: 'engineering',
            event: 'feature.released',
            data: {},
        },
        targets: [
            {
                domain: 'engineering',
                action: 'documentation_generation',
                inputMapping: { feature: 'source.data.feature', repo: 'source.data.repo' },
                autoExecute: true,
                requiresApproval: false,
            },
            {
                domain: 'learning',
                action: 'tutorial',
                inputMapping: { topic: 'source.data.feature' },
                autoExecute: true,
                requiresApproval: true,
            },
            {
                domain: 'marketing',
                action: 'messaging_generation',
                inputMapping: { product: 'source.data.feature' },
                autoExecute: false,
                requiresApproval: true,
            },
        ],
    },

    // Incident resolved → runbook update + training + process improvement
    {
        source: {
            domain: 'engineering',
            event: 'incident.resolved',
            data: {},
        },
        targets: [
            {
                domain: 'engineering',
                action: 'runbook_generation',
                inputMapping: { service: 'source.data.service', incident: 'source.data.incidentId' },
                autoExecute: true,
                requiresApproval: false,
            },
            {
                domain: 'learning',
                action: 'playbook',
                inputMapping: { topic: 'source.data.rootCause' },
                autoExecute: true,
                requiresApproval: true,
            },
        ],
    },

    // Campaign results → strategy insights + leadership brief
    {
        source: {
            domain: 'marketing',
            event: 'campaign.completed',
            data: {},
        },
        targets: [
            {
                domain: 'leadership',
                action: 'analytics_brief',
                inputMapping: { campaign: 'source.data.campaignId' },
                autoExecute: true,
                requiresApproval: false,
            },
            {
                domain: 'learning',
                action: 'best_practices',
                inputMapping: { topic: 'source.data.campaignType' },
                autoExecute: true,
                requiresApproval: true,
            },
        ],
    },

    // Leadership decision → engineering tickets + marketing alignment
    {
        source: {
            domain: 'leadership',
            event: 'decision.made',
            data: {},
        },
        targets: [
            {
                domain: 'engineering',
                action: 'transcript_to_tickets',
                inputMapping: { transcript: 'source.data.meetingNotes' },
                autoExecute: false,
                requiresApproval: true,
            },
            {
                domain: 'marketing',
                action: 'messaging_generation',
                inputMapping: { product: 'source.data.decision' },
                autoExecute: false,
                requiresApproval: true,
            },
        ],
    },
];

// ---------------------------------------------------------------------------
// Flow Engine
// ---------------------------------------------------------------------------

export class CrossDomainFlowEngine {
    private flows = KNOWLEDGE_FLOWS;
    private results: KnowledgeFlowResult[] = [];

    /**
     * Register a custom knowledge flow.
     */
    registerFlow(flow: KnowledgeFlowTrigger): void {
        this.flows.push(flow);
    }

    /**
     * Process an event and trigger cross-domain flows.
     */
    async processEvent(
        domain: string,
        event: string,
        data: Record<string, unknown>
    ): Promise<KnowledgeFlowResult[]> {
        const matching = this.flows.filter(
            (f) => f.source.domain === domain && f.source.event === event
        );

        const results: KnowledgeFlowResult[] = [];

        for (const flow of matching) {
            const result: KnowledgeFlowResult = {
                triggerId: `flow-${Date.now()}`,
                sourceEvent: event,
                outputs: [],
                executedAt: new Date(),
            };

            for (const target of flow.targets) {
                if (target.autoExecute) {
                    // Resolve input mapping
                    const input = this.resolveMapping(target.inputMapping, data);

                    // TODO: Dispatch to domain agent
                    result.outputs.push({
                        domain: target.domain,
                        action: target.action,
                        status: target.requiresApproval ? 'pending_approval' : 'completed',
                        output: { input, message: `Dispatched to ${target.domain}.${target.action}` },
                    });
                } else {
                    result.outputs.push({
                        domain: target.domain,
                        action: target.action,
                        status: 'pending_approval',
                        output: { message: 'Requires manual trigger' },
                    });
                }
            }

            results.push(result);
            this.results.push(result);
        }

        return results;
    }

    /**
     * Get all registered flows.
     */
    getFlows(): KnowledgeFlowTrigger[] {
        return this.flows;
    }

    /**
     * Get flow execution history.
     */
    getHistory(): KnowledgeFlowResult[] {
        return this.results;
    }

    private resolveMapping(mapping: Record<string, string>, data: Record<string, unknown>): Record<string, unknown> {
        const resolved: Record<string, unknown> = {};
        for (const [key, path] of Object.entries(mapping)) {
            const parts = path.replace('source.data.', '').split('.');
            let value: unknown = data;
            for (const part of parts) {
                value = (value as Record<string, unknown>)?.[part];
            }
            resolved[key] = value;
        }
        return resolved;
    }
}
