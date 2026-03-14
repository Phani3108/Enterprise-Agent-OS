/**
 * @agentos/connector-github — Real GitHub Connector
 *
 * Provides GitHub integration for AgentOS workers via GitHub REST API.
 * Uses native fetch — no external dependencies.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

const GITHUB_API = 'https://api.github.com';

export interface GitHubPullRequest {
    number: number;
    title: string;
    body: string;
    state: string;
    user: { login: string };
    head: { ref: string; sha: string };
    base: { ref: string };
    merged: boolean;
    mergeable: boolean | null;
    changed_files: number;
    additions: number;
    deletions: number;
    created_at: string;
    updated_at: string;
    html_url: string;
}

export interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    state: string;
    user: { login: string };
    labels: Array<{ name: string }>;
    created_at: string;
    html_url: string;
}

export class GitHubConnector {
    private token: string;
    private org: string;
    private connected = false;

    constructor(token: string, org: string) {
        this.token = token;
        this.org = org;
    }

    private get headers(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'AgentOS-Connector/1.0',
        };
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        if (!this.connected) throw new Error('GitHub connector not connected');

        const url = `${GITHUB_API}${path}`;
        const res = await fetch(url, {
            ...options,
            headers: { ...this.headers, ...(options.headers as Record<string, string> ?? {}) },
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`GitHub API error ${res.status} on ${path}: ${errText}`);
        }

        return (await res.json()) as T;
    }

    async connect(): Promise<void> {
        console.log(`🐙 GitHub connector: verifying access to ${this.org}...`);

        if (!this.token) {
            throw new Error('GitHub token is required. Set GITHUB_TOKEN environment variable.');
        }

        // Verify token by checking the authenticated user
        const user = await fetch(`${GITHUB_API}/user`, { headers: this.headers });
        if (!user.ok) {
            throw new Error(`GitHub authentication failed: ${user.status}`);
        }

        const userData = (await user.json()) as { login: string };
        this.connected = true;
        console.log(`🐙 GitHub connector ready — authenticated as ${userData.login}`);
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        console.log('🐙 GitHub connector disconnected');
    }

    isConnected(): boolean {
        return this.connected;
    }

    // -----------------------------------------------------------------------
    // PR Operations
    // -----------------------------------------------------------------------

    async getPullRequest(repo: string, prNumber: number): Promise<GitHubPullRequest> {
        return this.request<GitHubPullRequest>(`/repos/${this.org}/${repo}/pulls/${prNumber}`);
    }

    async listPullRequests(repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPullRequest[]> {
        return this.request<GitHubPullRequest[]>(`/repos/${this.org}/${repo}/pulls?state=${state}&per_page=30`);
    }

    async getPullRequestFiles(repo: string, prNumber: number): Promise<Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }>> {
        return this.request(`/repos/${this.org}/${repo}/pulls/${prNumber}/files`);
    }

    async commentOnPR(repo: string, prNumber: number, body: string): Promise<void> {
        await this.request(`/repos/${this.org}/${repo}/issues/${prNumber}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body }),
        });
    }

    async submitReview(
        repo: string,
        prNumber: number,
        verdict: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
        body: string
    ): Promise<void> {
        await this.request(`/repos/${this.org}/${repo}/pulls/${prNumber}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: verdict, body }),
        });
    }

    // -----------------------------------------------------------------------
    // Issue Operations
    // -----------------------------------------------------------------------

    async createIssue(
        repo: string,
        title: string,
        body: string,
        labels?: string[]
    ): Promise<GitHubIssue> {
        return this.request<GitHubIssue>(`/repos/${this.org}/${repo}/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, labels }),
        });
    }

    async listIssues(repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
        return this.request<GitHubIssue[]>(`/repos/${this.org}/${repo}/issues?state=${state}&per_page=30`);
    }

    async getIssue(repo: string, issueNumber: number): Promise<GitHubIssue> {
        return this.request<GitHubIssue>(`/repos/${this.org}/${repo}/issues/${issueNumber}`);
    }

    // -----------------------------------------------------------------------
    // File Operations
    // -----------------------------------------------------------------------

    async readFile(repo: string, path: string, ref?: string): Promise<string> {
        const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
        const data = await this.request<{ content: string; encoding: string }>(
            `/repos/${this.org}/${repo}/contents/${path}${query}`
        );
        if (data.encoding === 'base64') {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return data.content;
    }

    async writeFile(
        repo: string,
        path: string,
        content: string,
        message: string,
        branch?: string,
        sha?: string
    ): Promise<void> {
        const body: Record<string, string> = {
            message,
            content: Buffer.from(content).toString('base64'),
        };
        if (branch) body.branch = branch;
        if (sha) body.sha = sha;

        await this.request(`/repos/${this.org}/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    // -----------------------------------------------------------------------
    // Repository Operations
    // -----------------------------------------------------------------------

    async listRepos(): Promise<Array<{ name: string; full_name: string; description: string; language: string; html_url: string }>> {
        return this.request(`/orgs/${this.org}/repos?per_page=30&sort=updated`);
    }

    async getRepo(repo: string): Promise<{ name: string; full_name: string; description: string; language: string; default_branch: string; html_url: string }> {
        return this.request(`/repos/${this.org}/${repo}`);
    }

    // -----------------------------------------------------------------------
    // Search
    // -----------------------------------------------------------------------

    async searchCode(query: string, repo?: string): Promise<Array<{ name: string; path: string; repository: { full_name: string }; html_url: string }>> {
        const q = repo ? `${query}+repo:${this.org}/${repo}` : `${query}+org:${this.org}`;
        const data = await this.request<{ items: any[] }>(`/search/code?q=${encodeURIComponent(q)}&per_page=10`);
        return data.items ?? [];
    }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createGitHubConnector(): GitHubConnector | null {
    const token = process.env.GITHUB_TOKEN;
    const org = process.env.GITHUB_ORG ?? 'default-org';

    if (!token) {
        console.warn('⚠️  GITHUB_TOKEN not set — GitHub connector disabled');
        return null;
    }

    return new GitHubConnector(token, org);
}

export default GitHubConnector;
