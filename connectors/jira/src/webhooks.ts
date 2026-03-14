/**
 * EAOS Jira Integration — Event-driven ticket intelligence
 *
 * 1. Incident created → auto-analyze + enrich ticket
 * 2. High-priority ticket → auto-route to correct team
 * 3. Sprint retro → auto-generate retro insights
 */

interface JiraWebhookConfig {
    jiraBaseUrl: string;
    jiraEmail: string;
    jiraApiToken: string;
    eaosGatewayUrl: string;
    autoAnalyzeIncidents: boolean;
    autoRouteEnabled: boolean;
}

interface JiraIssueEvent {
    webhookEvent: 'jira:issue_created' | 'jira:issue_updated';
    issue: {
        key: string;
        fields: {
            summary: string;
            description: string;
            issuetype: { name: string };
            priority: { name: string };
            status: { name: string };
            labels: string[];
            project: { key: string };
            assignee?: { displayName: string };
        };
    };
    changelog?: {
        items: Array<{
            field: string;
            fromString: string;
            toString: string;
        }>;
    };
}

class JiraWebhookHandler {
    constructor(private config: JiraWebhookConfig) { }

    async handleWebhook(event: JiraIssueEvent): Promise<void> {
        const issue = event.issue;
        const isIncident = issue.fields.issuetype.name.toLowerCase() === 'incident'
            || issue.fields.labels.includes('incident');
        const isHighPriority = ['Critical', 'Highest', 'Blocker'].includes(issue.fields.priority.name);

        // Auto-analyze incidents
        if (event.webhookEvent === 'jira:issue_created' && isIncident && this.config.autoAnalyzeIncidents) {
            await this.analyzeIncident(issue);
        }

        // Auto-route high priority
        if (event.webhookEvent === 'jira:issue_created' && isHighPriority && this.config.autoRouteEnabled) {
            await this.autoRoute(issue);
        }
    }

    private async analyzeIncident(issue: JiraIssueEvent['issue']): Promise<void> {
        console.log(`[Jira] Analyzing incident ${issue.key}: ${issue.fields.summary}`);

        try {
            const res = await fetch(`${this.config.eaosGatewayUrl}/api/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: `Analyze incident: ${issue.fields.summary}`,
                    action: 'incident_analysis',
                    subject: issue.key,
                    context: {
                        source: 'jira',
                        ticketKey: issue.key,
                        description: issue.fields.description,
                        priority: issue.fields.priority.name,
                        project: issue.fields.project.key,
                    },
                }),
            });

            if (!res.ok) throw new Error(`EAOS returned ${res.status}`);
            const result = await res.json() as { output: Record<string, unknown> };

            // Enrich the Jira ticket with analysis
            await this.addComment(issue.key, this.formatAnalysis(result.output));
            await this.addLabels(issue.key, ['eaos-analyzed']);

        } catch (error) {
            console.error(`[Jira] Analysis failed for ${issue.key}:`, error);
        }
    }

    private async autoRoute(issue: JiraIssueEvent['issue']): Promise<void> {
        console.log(`[Jira] Auto-routing ${issue.key}`);

        try {
            const res = await fetch(`${this.config.eaosGatewayUrl}/api/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: `Determine the correct team to handle: ${issue.fields.summary}`,
                    action: 'ticket_routing',
                    subject: issue.key,
                    context: {
                        description: issue.fields.description,
                        project: issue.fields.project.key,
                    },
                }),
            });

            if (!res.ok) return;
            const result = await res.json() as { output: { team?: string; reason?: string } };

            if (result.output.team) {
                await this.addComment(
                    issue.key,
                    `🤖 *EAOS Auto-Route:* Recommended team → *${result.output.team}*\n\n_Reason: ${result.output.reason}_`
                );
            }
        } catch {
            // Silent fail for routing
        }
    }

    private formatAnalysis(output: Record<string, unknown>): string {
        return `h2. 🧠 EAOS Incident Analysis

*Root Cause:* ${output.rootCause ?? 'Under investigation'}

*Blast Radius:* ${output.blastRadius ?? 'Unknown'}

*Severity Assessment:* ${output.severity ?? 'TBD'}

*Recommended Actions:*
${(output.actions as string[] ?? []).map((a: string) => `# ${a}`).join('\n')}

*Related Incidents:* ${(output.relatedIncidents as string[] ?? []).join(', ') || 'None found'}

----
_Confidence: ${((output.confidence as number ?? 0) * 100).toFixed(0)}% · Generated by EAOS_`;
    }

    // Jira API helpers
    private get authHeader(): string {
        return 'Basic ' + Buffer.from(`${this.config.jiraEmail}:${this.config.jiraApiToken}`).toString('base64');
    }

    private async addComment(issueKey: string, body: string): Promise<void> {
        const res = await fetch(
            `${this.config.jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`,
            {
                method: 'POST',
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    body: {
                        type: 'doc',
                        version: 1,
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
                    },
                }),
            },
        );
        if (!res.ok) console.error(`[Jira] Comment failed on ${issueKey}: ${res.status}`);
    }

    private async addLabels(issueKey: string, labels: string[]): Promise<void> {
        // First get existing labels, then merge
        const getRes = await fetch(
            `${this.config.jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=labels`,
            { headers: { 'Authorization': this.authHeader, 'Accept': 'application/json' } },
        );
        const existing = getRes.ok
            ? ((await getRes.json()) as { fields: { labels: string[] } }).fields.labels
            : [];
        const merged = [...new Set([...existing, ...labels])];

        const res = await fetch(
            `${this.config.jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: { labels: merged } }),
            },
        );
        if (!res.ok) console.error(`[Jira] Labels update failed on ${issueKey}: ${res.status}`);
    }
}

export { JiraWebhookHandler };
export type { JiraWebhookConfig, JiraIssueEvent };
