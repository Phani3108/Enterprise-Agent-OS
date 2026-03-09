/**
 * Developer Knowledge Worker — The 10x knowledge discovery engine
 *
 * Instead of 45 minutes searching Confluence, an engineer asks:
 *   "@eaos how does the card authorization service work?"
 *
 * This worker retrieves from multiple sources, correlates, and produces
 * a structured knowledge answer WITH provenance.
 *
 * Sources: Confluence, GitHub, Jira, Blogin, transcripts, design docs
 * Output:  KnowledgeAnswer with architecture, owners, code refs, incidents
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KnowledgeQuery {
    question: string;
    context?: {
        service?: string;
        repo?: string;
        team?: string;
    };
    depth: 'quick' | 'standard' | 'deep';
}

export interface KnowledgeAnswer {
    question: string;
    answer: string;
    confidence: number;
    groundingScore: number;

    architecture?: {
        summary: string;
        components: Component[];
        dependencies: string[];
        dataFlow: string;
        codeReferences: CodeRef[];
        diagrams: string[];
    };

    owners: Owner[];
    relatedDocs: Doc[];
    recentChanges: Change[];
    pastIncidents: Incident[];
    sources: Source[];

    meta: {
        durationMs: number;
        sourcesQueried: number;
        documentsRetrieved: number;
        tokensUsed: number;
        model: string;
    };
}

interface Component { name: string; type: string; description: string }
interface CodeRef { file: string; repo: string; lines: string; description: string; url: string }
interface Owner { name: string; team: string; role: string; slack: string }
interface Doc { title: string; type: string; url: string; updatedAt: string; relevance: number }
interface Change { pr: string; author: string; date: string; summary: string; filesChanged: number }
interface Incident { key: string; summary: string; date: string; rootCause: string; severity: string }
interface Source { title: string; type: string; url: string; excerpt: string; relevance: number }

// ---------------------------------------------------------------------------
// Worker Implementation
// ---------------------------------------------------------------------------

export class DeveloperKnowledgeWorker {
    private connectors: Map<string, Connector> = new Map();

    registerConnector(name: string, connector: Connector): void {
        this.connectors.set(name, connector);
    }

    async execute(query: KnowledgeQuery): Promise<KnowledgeAnswer> {
        const startTime = Date.now();
        const allSources: Source[] = [];

        // Phase 1: Multi-source retrieval (parallel)
        const [confluenceDocs, githubResults, jiraTickets, bloginPosts, transcriptHits] = await Promise.all([
            this.searchConfluence(query),
            this.searchGitHub(query),
            this.searchJira(query),
            this.searchBlogin(query),
            this.searchTranscripts(query),
        ]);

        allSources.push(...confluenceDocs, ...githubResults, ...jiraTickets, ...bloginPosts, ...transcriptHits);

        // Phase 2: Rank and deduplicate
        const rankedSources = this.rankSources(allSources, query.question);

        // Phase 3: Extract entities
        const components = this.extractComponents(rankedSources);
        const owners = this.extractOwners(rankedSources);
        const codeRefs = this.extractCodeReferences(githubResults);
        const recentChanges = this.extractRecentChanges(githubResults);
        const pastIncidents = this.extractIncidents(jiraTickets);

        // Phase 4: Synthesize answer
        // In production: send ranked context + question to LLM with structured output schema
        const contextWindow = rankedSources.slice(0, 15).map(s => `[${s.type}] ${s.title}: ${s.excerpt}`).join('\n\n');

        const answer = await this.synthesize(query.question, contextWindow, {
            components,
            owners,
            codeRefs,
            recentChanges,
            pastIncidents,
        });

        // Phase 5: Compute grounding
        const groundingScore = this.computeGrounding(answer, rankedSources);

        return {
            question: query.question,
            answer,
            confidence: Math.min(0.95, groundingScore + 0.05),
            groundingScore,
            architecture: components.length > 0 ? {
                summary: '',
                components,
                dependencies: [],
                dataFlow: '',
                codeReferences: codeRefs,
                diagrams: [],
            } : undefined,
            owners,
            relatedDocs: rankedSources.slice(0, 8).map(s => ({
                title: s.title,
                type: s.type,
                url: s.url,
                updatedAt: '',
                relevance: s.relevance,
            })),
            recentChanges,
            pastIncidents,
            sources: rankedSources.slice(0, 10),
            meta: {
                durationMs: Date.now() - startTime,
                sourcesQueried: 5,
                documentsRetrieved: allSources.length,
                tokensUsed: 0,
                model: 'gpt-4o',
            },
        };
    }

    // -------------------------------------------------------------------------
    // Source search methods
    // -------------------------------------------------------------------------

    private async searchConfluence(query: KnowledgeQuery): Promise<Source[]> {
        const connector = this.connectors.get('confluence');
        if (!connector) return [];

        try {
            const results = await connector.search(query.question, {
                types: ['page', 'blogpost'],
                spaces: query.context?.team ? [query.context.team] : undefined,
                limit: 10,
            });
            return results.map(r => ({
                title: r.title,
                type: 'confluence',
                url: r.url,
                excerpt: r.excerpt ?? '',
                relevance: r.score ?? 0.5,
            }));
        } catch {
            return [];
        }
    }

    private async searchGitHub(query: KnowledgeQuery): Promise<Source[]> {
        const connector = this.connectors.get('github');
        if (!connector) return [];

        try {
            const results = await connector.search(query.question, {
                repos: query.context?.repo ? [query.context.repo] : undefined,
                types: ['code', 'readme', 'pr'],
                limit: 10,
            });
            return results.map(r => ({
                title: r.title,
                type: 'github',
                url: r.url,
                excerpt: r.excerpt ?? '',
                relevance: r.score ?? 0.5,
            }));
        } catch {
            return [];
        }
    }

    private async searchJira(query: KnowledgeQuery): Promise<Source[]> {
        const connector = this.connectors.get('jira');
        if (!connector) return [];

        try {
            const results = await connector.search(query.question, {
                types: ['Bug', 'Incident', 'Story'],
                limit: 8,
            });
            return results.map(r => ({
                title: r.title,
                type: 'jira',
                url: r.url,
                excerpt: r.excerpt ?? '',
                relevance: r.score ?? 0.4,
            }));
        } catch {
            return [];
        }
    }

    private async searchBlogin(query: KnowledgeQuery): Promise<Source[]> {
        const connector = this.connectors.get('blogin');
        if (!connector) return [];

        try {
            const results = await connector.search(query.question, { limit: 5 });
            return results.map(r => ({ title: r.title, type: 'blogin', url: r.url, excerpt: r.excerpt ?? '', relevance: r.score ?? 0.4 }));
        } catch {
            return [];
        }
    }

    private async searchTranscripts(query: KnowledgeQuery): Promise<Source[]> {
        const connector = this.connectors.get('transcripts');
        if (!connector) return [];

        try {
            const results = await connector.search(query.question, { limit: 5 });
            return results.map(r => ({ title: r.title, type: 'transcript', url: r.url, excerpt: r.excerpt ?? '', relevance: r.score ?? 0.3 }));
        } catch {
            return [];
        }
    }

    // -------------------------------------------------------------------------
    // Analysis methods
    // -------------------------------------------------------------------------

    private rankSources(sources: Source[], question: string): Source[] {
        // Score each source based on relevance + recency + diversity
        const seen = new Set<string>();
        return sources
            .filter(s => {
                const key = `${s.type}:${s.title}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => b.relevance - a.relevance);
    }

    private extractComponents(sources: Source[]): Component[] {
        // In production: use NER or structured extraction from source content
        return [];
    }

    private extractOwners(sources: Source[]): Owner[] {
        return [];
    }

    private extractCodeReferences(githubSources: Source[]): CodeRef[] {
        return githubSources
            .filter(s => s.url.includes('/blob/'))
            .map(s => ({
                file: s.title,
                repo: s.url.split('/')[4] ?? '',
                lines: '',
                description: s.excerpt,
                url: s.url,
            }));
    }

    private extractRecentChanges(githubSources: Source[]): Change[] {
        return githubSources
            .filter(s => s.url.includes('/pull/'))
            .map(s => ({
                pr: s.title,
                author: '',
                date: '',
                summary: s.excerpt,
                filesChanged: 0,
            }));
    }

    private extractIncidents(jiraSources: Source[]): Incident[] {
        return jiraSources
            .filter(s => s.title.includes('INC') || s.excerpt.toLowerCase().includes('incident'))
            .map(s => ({
                key: s.title.match(/[A-Z]+-\d+/)?.[0] ?? s.title,
                summary: s.excerpt,
                date: '',
                rootCause: '',
                severity: '',
            }));
    }

    private async synthesize(
        question: string,
        context: string,
        _entities: Record<string, unknown>
    ): Promise<string> {
        // In production: call LLM with structured prompt
        // For now, return a placeholder that indicates the system's synthesis approach
        return `Based on ${context.split('\n\n').length} sources: [LLM synthesis from compiled skill prompt]`;
    }

    private computeGrounding(answer: string, sources: Source[]): number {
        if (sources.length === 0) return 0;
        // Simple heuristic: more high-relevance sources = higher grounding
        const avgRelevance = sources.slice(0, 5).reduce((sum, s) => sum + s.relevance, 0) / Math.min(5, sources.length);
        return Math.min(0.95, avgRelevance);
    }
}

// ---------------------------------------------------------------------------
// Connector interface
// ---------------------------------------------------------------------------

export interface Connector {
    search(query: string, options: Record<string, unknown>): Promise<ConnectorResult[]>;
}

export interface ConnectorResult {
    title: string;
    url: string;
    excerpt?: string;
    score?: number;
    metadata?: Record<string, unknown>;
}
