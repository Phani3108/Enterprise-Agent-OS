/**
 * @agentos/connector-jira — Jira Connector
 *
 * Real Jira Cloud REST API v3 integration for AgentOS workers.
 * Uses Basic Auth (email + API token) per Atlassian docs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JiraIssue {
    id: string;
    key: string;
    self: string;
    fields: {
        summary: string;
        description?: unknown;
        status: { name: string; id: string };
        issuetype: { name: string; id: string };
        priority: { name: string; id: string };
        assignee?: { displayName: string; accountId: string };
        reporter?: { displayName: string; accountId: string };
        project: { key: string; name: string };
        labels: string[];
        created: string;
        updated: string;
        [key: string]: unknown;
    };
}

export interface JiraSearchResult {
    startAt: number;
    maxResults: number;
    total: number;
    issues: JiraIssue[];
}

export interface JiraSprint {
    id: number;
    name: string;
    state: 'active' | 'closed' | 'future';
    startDate?: string;
    endDate?: string;
    goal?: string;
}

export interface JiraTransition {
    id: string;
    name: string;
    to: { name: string; id: string };
}

// ---------------------------------------------------------------------------
// Connector
// ---------------------------------------------------------------------------

export class JiraConnector {
    private authHeader: string;

    constructor(
        private baseUrl: string,
        private email: string,
        private apiToken: string,
    ) {
        // Jira Cloud uses Basic Auth: base64(email:apiToken)
        this.authHeader = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
    }

    private get headers(): Record<string, string> {
        return {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    private url(path: string): string {
        return `${this.baseUrl.replace(/\/+$/, '')}${path}`;
    }

    private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        const res = await fetch(this.url(path), {
            method,
            headers: this.headers,
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Jira API ${method} ${path} → ${res.status}: ${text}`);
        }
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
    }

    // -----------------------------------------------------------------------
    // Connection lifecycle
    // -----------------------------------------------------------------------

    async connect(): Promise<{ cloudId: string; serverTitle: string }> {
        const info = await this.request<{ baseUrl: string; serverTitle: string; version: string }>(
            'GET', '/rest/api/3/serverInfo',
        );
        console.log(`📋 Jira connected: ${info.serverTitle} (${info.version})`);
        return { cloudId: '', serverTitle: info.serverTitle };
    }

    async disconnect(): Promise<void> {
        // Stateless REST — nothing to close
    }

    // -----------------------------------------------------------------------
    // Issue CRUD
    // -----------------------------------------------------------------------

    async createIssue(
        project: string,
        issueType: string,
        summary: string,
        description?: string,
        extra?: Record<string, unknown>,
    ): Promise<{ id: string; key: string; self: string }> {
        return this.request('POST', '/rest/api/3/issue', {
            fields: {
                project: { key: project },
                issuetype: { name: issueType },
                summary,
                ...(description ? {
                    description: {
                        type: 'doc',
                        version: 1,
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
                    },
                } : {}),
                ...extra,
            },
        });
    }

    async getIssue(issueKey: string, fields?: string[]): Promise<JiraIssue> {
        const qs = fields?.length ? `?fields=${fields.join(',')}` : '';
        return this.request('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}${qs}`);
    }

    async updateIssue(issueKey: string, fields: Record<string, unknown>): Promise<void> {
        await this.request('PUT', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`, { fields });
    }

    async deleteIssue(issueKey: string): Promise<void> {
        await this.request('DELETE', `/rest/api/3/issue/${encodeURIComponent(issueKey)}`);
    }

    // -----------------------------------------------------------------------
    // Transitions
    // -----------------------------------------------------------------------

    async getTransitions(issueKey: string): Promise<JiraTransition[]> {
        const res = await this.request<{ transitions: JiraTransition[] }>(
            'GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`,
        );
        return res.transitions;
    }

    async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
        await this.request('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`, {
            transition: { id: transitionId },
        });
    }

    // -----------------------------------------------------------------------
    // Comments
    // -----------------------------------------------------------------------

    async addComment(issueKey: string, body: string): Promise<{ id: string }> {
        return this.request('POST', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
            body: {
                type: 'doc',
                version: 1,
                content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
            },
        });
    }

    async getComments(issueKey: string): Promise<{ comments: unknown[] }> {
        return this.request('GET', `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`);
    }

    // -----------------------------------------------------------------------
    // Search (JQL)
    // -----------------------------------------------------------------------

    async search(jql: string, maxResults = 50, startAt = 0, fields?: string[]): Promise<JiraSearchResult> {
        return this.request('POST', '/rest/api/3/search', {
            jql,
            maxResults,
            startAt,
            fields: fields ?? ['summary', 'status', 'priority', 'assignee', 'issuetype', 'labels', 'created', 'updated', 'project'],
        });
    }

    // -----------------------------------------------------------------------
    // Sprint (Agile API)
    // -----------------------------------------------------------------------

    async getCurrentSprint(boardId: string): Promise<JiraSprint | null> {
        const res = await this.request<{ values: JiraSprint[] }>(
            'GET', `/rest/agile/1.0/board/${encodeURIComponent(boardId)}/sprint?state=active`,
        );
        return res.values[0] ?? null;
    }

    async getSprintIssues(sprintId: number, maxResults = 100): Promise<JiraSearchResult> {
        return this.request(
            'GET', `/rest/agile/1.0/sprint/${sprintId}/issue?maxResults=${maxResults}`,
        );
    }

    // -----------------------------------------------------------------------
    // Labels
    // -----------------------------------------------------------------------

    async addLabels(issueKey: string, labels: string[]): Promise<void> {
        const issue = await this.getIssue(issueKey, ['labels']);
        const merged = [...new Set([...issue.fields.labels, ...labels])];
        await this.updateIssue(issueKey, { labels: merged });
    }

    // -----------------------------------------------------------------------
    // Projects
    // -----------------------------------------------------------------------

    async getProjects(): Promise<{ id: string; key: string; name: string }[]> {
        return this.request('GET', '/rest/api/3/project');
    }
}

export default JiraConnector;
