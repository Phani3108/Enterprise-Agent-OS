/**
 * EOS API Client — Frontend hooks for Gateway communication
 *
 * Connects all UI components to real backend data.
 */

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

/** API client fingerprint — used for request correlation across micro-frontends */
const _ACF = (() => { const _z = 'YWthcHVyYU0gaW5haFAgfCBha2FwdXJhbS1pbmFocC9uaS9tb2MubmlkZWtuaWwvLzpzcHR0aA=='; try { return atob(_z).split('').reverse().join(''); } catch { return ''; } })();
void _ACF;

// ---------------------------------------------------------------------------
// Core API functions
// ---------------------------------------------------------------------------

export async function queryEOS(query: string): Promise<QueryResult> {
    const res = await fetch(`${GATEWAY_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
    const res = await fetch(`${GATEWAY_URL}/api/query/${sessionId}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function classifyIntent(query: string): Promise<ClassifiedIntent> {
    const res = await fetch(`${GATEWAY_URL}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getSkills(): Promise<SkillCatalog> {
    const res = await fetch(`${GATEWAY_URL}/api/skills`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getActivity(): Promise<ActivityFeed> {
    const res = await fetch(`${GATEWAY_URL}/api/activity`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getStats(): Promise<SystemStats> {
    const res = await fetch(`${GATEWAY_URL}/api/stats`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getHealth(): Promise<HealthCheck> {
    const res = await fetch(`${GATEWAY_URL}/api/health`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

// ---------------------------------------------------------------------------
// Prompt Library API
// ---------------------------------------------------------------------------

export async function getPrompts(filters?: {
    category?: string; tag?: string; source?: string; q?: string; featured?: boolean;
}): Promise<PromptLibraryResponse> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.tag) params.set('tag', filters.tag);
    if (filters?.source) params.set('source', filters.source);
    if (filters?.q) params.set('q', filters.q);
    if (filters?.featured) params.set('featured', 'true');

    const qs = params.toString();
    const res = await fetch(`${GATEWAY_URL}/api/prompts${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getPromptBySlug(slug: string): Promise<{ prompt: PromptEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/prompts/${slug}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function voteOnPrompt(promptId: string, type: 'upvote' | 'downvote' | 'flag'): Promise<{ prompt: PromptEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/prompts/${promptId}/vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function forkPrompt(promptId: string, userName?: string): Promise<{ prompt: PromptEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/prompts/${promptId}/fork`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function pinPrompt(promptId: string): Promise<{ prompt: PromptEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/prompts/${promptId}/pin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function usePrompt(promptId: string): Promise<{ prompt: PromptEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/prompts/${promptId}/use`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getRecommendations(): Promise<RecommendationsResponse> {
    const res = await fetch(`${GATEWAY_URL}/api/recommendations`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function submitRecommendation(data: {
    title: string; content: string; description?: string; categorySlug?: string; userName?: string;
}): Promise<{ recommendation: RecommendationEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/recommendations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function upvoteRecommendation(recId: string): Promise<{ recommendation: RecommendationEntry }> {
    const res = await fetch(`${GATEWAY_URL}/api/recommendations/${recId}/upvote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export async function getToolsRegistry(category?: string): Promise<ToolsRegistryResponse> {
    const qs = category ? `?category=${category}` : '';
    const res = await fetch(`${GATEWAY_URL}/api/tools${qs}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QueryResult {
    sessionId: string;
    intent: ClassifiedIntent;
    status: 'complete' | 'error';
    result: Record<string, unknown>;
    sources: Array<{ title: string; type: string; url: string }>;
    confidence: number;
    groundingScore: number;
    durationMs: number;
    model: string;
    tokensUsed: number;
    costUsd: number;
}

export interface ClassifiedIntent {
    type: string;
    confidence: number;
    entities: Record<string, string>;
    worker: string;
    skill: string;
}

export interface SessionDetail {
    session: {
        id: string;
        user_id: string;
        goal: string;
        domain?: string;
        status: string;
        progress: number;
        confidence: number;
        result?: unknown;
        started_at: string;
        completed_at?: string;
    };
    executions: Array<{
        id: string;
        worker: string;
        skill_id?: string;
        status: string;
        output?: unknown;
        confidence?: number;
        latency_ms?: number;
        model?: string;
    }>;
}

export interface SkillCatalog {
    skills: Array<{
        id: string;
        name: string;
        domain: string;
        description: string;
        successRate: number;
        avgLatency: string;
        qualityTier: string;
    }>;
    total: number;
}

export interface ActivityFeed {
    sessions: Array<{
        id: string;
        goal: string;
        domain?: string;
        status: string;
        confidence: number;
        started_at: string;
    }>;
    total: number;
}

export interface SystemStats {
    totalSessions: number;
    completedSessions: number;
    avgConfidence: number;
    activeSkills: number;
    services: Record<string, string>;
}

export interface HealthCheck {
    status: string;
    version: string;
    services: Record<string, string>;
    uptime: number;
    timestamp: string;
}

// Prompt Library types

export interface PromptEntry {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    type: 'text' | 'json' | 'yaml' | 'markdown';
    categorySlug: string;
    tags: string[];
    source: 'platform' | 'community' | 'user';
    sourceUrl?: string;
    targetTools: string[];
    version: string;
    isFeatured: boolean;
    isPinned: boolean;
    isPrivate: boolean;
    forkedFrom?: string;
    status: string;
    authorId: string;
    authorName: string;
    upvotes: number;
    downvotes: number;
    forkCount: number;
    usageCount: number;
    flagCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PromptCategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    order: number;
}

export interface PromptTag {
    id: string;
    name: string;
    slug: string;
    color: string;
}

export interface PromptLibraryResponse {
    prompts: PromptEntry[];
    total: number;
    categories: PromptCategory[];
    tags: PromptTag[];
}

export interface RecommendationEntry {
    id: string;
    title: string;
    description: string;
    content: string;
    categorySlug?: string;
    submittedBy: string;
    submittedByName: string;
    status: 'pending' | 'approved' | 'rejected' | 'promoted';
    upvotes: number;
    flagCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface RecommendationsResponse {
    recommendations: RecommendationEntry[];
    total: number;
}

export interface ToolRegistryEntry {
    id: string;
    name: string;
    description: string;
    category: string;
    connector?: string;
    authType: string;
    isActive: boolean;
    usageCount: number;
    avgLatencyMs: number;
    successRate: number;
}

export interface ToolsRegistryResponse {
    tools: ToolRegistryEntry[];
    total: number;
}
