/**
 * @agentos/memory-pipeline — Enhanced Memory Retrieval Pipeline
 *
 * Combines multiple retrieval strategies into a single, ranked context:
 *
 *   Vector Search → Keyword Search → Graph Expansion → Ranking → Context Pack
 *
 * This is the module that makes agents NOT hallucinate.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RetrievalRequest {
    query: string;
    namespaces: string[];
    knowledgeTypes: string[];
    maxResults: number;
    minRelevance: number;
    expandGraph: boolean;
    includeKeyword: boolean;
}

export interface RetrievedDocument {
    id: string;
    content: string;
    source: string;
    sourceType: 'confluence' | 'jira' | 'github' | 'document' | 'transcript' | 'email' | 'blog' | 'microsite';
    relevanceScore: number;
    retrievalMethod: 'vector' | 'keyword' | 'graph' | 'hybrid';
    metadata: Record<string, unknown>;
}

export interface RankedContext {
    documents: RetrievedDocument[];
    totalRetrieved: number;
    totalAfterRanking: number;
    tokenCount: number;
    retrievalDurationMs: number;
    rankingDurationMs: number;
    methods: { vector: number; keyword: number; graph: number };
}

export interface MemoryPipelineConfig {
    vectorWeight: number;    // 0-1
    keywordWeight: number;   // 0-1
    graphWeight: number;     // 0-1
    maxTokenBudget: number;
    diversityPenalty: number; // penalize duplicate sources
    recencyBoost: number;    // boost recent documents
}

export const DEFAULT_PIPELINE_CONFIG: MemoryPipelineConfig = {
    vectorWeight: 0.6,
    keywordWeight: 0.2,
    graphWeight: 0.2,
    maxTokenBudget: 4000,
    diversityPenalty: 0.1,
    recencyBoost: 0.05,
};

// ---------------------------------------------------------------------------
// Memory Pipeline
// ---------------------------------------------------------------------------

export class MemoryPipeline {
    private config: MemoryPipelineConfig;

    constructor(
        config: Partial<MemoryPipelineConfig> = {},
        private vectorStore: VectorStore,
        private keywordIndex: KeywordIndex,
        private knowledgeGraph: KnowledgeGraphQuery,
    ) {
        this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    }

    /**
     * Execute the full retrieval pipeline.
     */
    async retrieve(request: RetrievalRequest): Promise<RankedContext> {
        const startTime = Date.now();
        const allDocs: RetrievedDocument[] = [];
        const methods = { vector: 0, keyword: 0, graph: 0 };

        // Stage 1: Vector search (semantic similarity)
        const vectorDocs = await this.vectorStore.search(
            request.query,
            request.namespaces,
            request.maxResults * 2
        );
        for (const doc of vectorDocs) {
            doc.retrievalMethod = 'vector';
            doc.relevanceScore *= this.config.vectorWeight;
        }
        allDocs.push(...vectorDocs);
        methods.vector = vectorDocs.length;

        // Stage 2: Keyword search (BM25 / exact match)
        if (request.includeKeyword) {
            const keywordDocs = await this.keywordIndex.search(
                request.query,
                request.namespaces,
                request.maxResults
            );
            for (const doc of keywordDocs) {
                doc.retrievalMethod = 'keyword';
                doc.relevanceScore *= this.config.keywordWeight;
            }
            allDocs.push(...keywordDocs);
            methods.keyword = keywordDocs.length;
        }

        // Stage 3: Knowledge graph expansion
        if (request.expandGraph && request.knowledgeTypes.length > 0) {
            const graphDocs = await this.knowledgeGraph.expand(
                request.query,
                request.knowledgeTypes,
                request.maxResults
            );
            for (const doc of graphDocs) {
                doc.retrievalMethod = 'graph';
                doc.relevanceScore *= this.config.graphWeight;
            }
            allDocs.push(...graphDocs);
            methods.graph = graphDocs.length;
        }

        const retrievalDurationMs = Date.now() - startTime;

        // Stage 4: Rank and deduplicate
        const rankStart = Date.now();
        const ranked = this.rank(allDocs, request.minRelevance);

        // Stage 5: Pack into token budget
        const packed = this.packContext(ranked, this.config.maxTokenBudget);

        return {
            documents: packed,
            totalRetrieved: allDocs.length,
            totalAfterRanking: packed.length,
            tokenCount: packed.reduce((sum, d) => sum + this.estimateTokens(d.content), 0),
            retrievalDurationMs,
            rankingDurationMs: Date.now() - rankStart,
            methods,
        };
    }

    // -------------------------------------------------------------------------
    // Ranking
    // -------------------------------------------------------------------------

    private rank(docs: RetrievedDocument[], minRelevance: number): RetrievedDocument[] {
        // Deduplicate by ID (keep highest score)
        const byId = new Map<string, RetrievedDocument>();
        for (const doc of docs) {
            const existing = byId.get(doc.id);
            if (!existing || doc.relevanceScore > existing.relevanceScore) {
                byId.set(doc.id, doc);
            }
        }

        let unique = Array.from(byId.values());

        // Apply recency boost
        for (const doc of unique) {
            const age = doc.metadata.updatedAt
                ? (Date.now() - new Date(doc.metadata.updatedAt as string).getTime()) / 86_400_000
                : 30;
            const boost = Math.max(0, this.config.recencyBoost * (30 - age) / 30);
            doc.relevanceScore += boost;
        }

        // Apply diversity penalty (penalize multiple docs from same source)
        const sourceCounts = new Map<string, number>();
        for (const doc of unique) {
            const count = sourceCounts.get(doc.source) ?? 0;
            if (count > 0) {
                doc.relevanceScore -= this.config.diversityPenalty * count;
            }
            sourceCounts.set(doc.source, count + 1);
        }

        // Filter by minimum relevance and sort
        unique = unique
            .filter((d) => d.relevanceScore >= minRelevance)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);

        return unique;
    }

    // -------------------------------------------------------------------------
    // Context Packing
    // -------------------------------------------------------------------------

    private packContext(docs: RetrievedDocument[], maxTokens: number): RetrievedDocument[] {
        const packed: RetrievedDocument[] = [];
        let tokens = 0;

        for (const doc of docs) {
            const docTokens = this.estimateTokens(doc.content);
            if (tokens + docTokens > maxTokens) break;
            packed.push(doc);
            tokens += docTokens;
        }

        return packed;
    }

    private estimateTokens(text: string): number {
        // Rough estimate: ~4 chars per token
        return Math.ceil(text.length / 4);
    }
}

// ---------------------------------------------------------------------------
// Provider Interfaces
// ---------------------------------------------------------------------------

export interface VectorStore {
    search(query: string, namespaces: string[], topK: number): Promise<RetrievedDocument[]>;
}

export interface KeywordIndex {
    search(query: string, namespaces: string[], topK: number): Promise<RetrievedDocument[]>;
}

export interface KnowledgeGraphQuery {
    expand(query: string, nodeTypes: string[], topK: number): Promise<RetrievedDocument[]>;
}
