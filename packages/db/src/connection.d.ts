/**
 * Database connection pool and repository base
 */
export interface DbConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    maxConnections?: number;
}
export declare class InMemoryStore {
    private tables;
    getTable(name: string): Map<string, Record<string, unknown>>;
    insert(table: string, id: string, data: Record<string, unknown>): void;
    get(table: string, id: string): Record<string, unknown> | undefined;
    update(table: string, id: string, data: Partial<Record<string, unknown>>): void;
    delete(table: string, id: string): void;
    query(table: string, filter: (row: Record<string, unknown>) => boolean): Record<string, unknown>[];
    all(table: string): Record<string, unknown>[];
}
export declare class SessionRepository {
    private store;
    constructor(store: InMemoryStore);
    create(session: SessionRecord): void;
    get(id: string): SessionRecord | undefined;
    update(id: string, updates: Partial<SessionRecord>): void;
    getByUser(userId: string): SessionRecord[];
    getRecent(limit: number): SessionRecord[];
}
export declare class ExecutionRepository {
    private store;
    constructor(store: InMemoryStore);
    create(execution: ExecutionRecord): void;
    get(id: string): ExecutionRecord | undefined;
    update(id: string, updates: Partial<ExecutionRecord>): void;
    getBySession(sessionId: string): ExecutionRecord[];
}
export interface SessionRecord {
    id: string;
    user_id: string;
    goal: string;
    domain?: string;
    status: string;
    progress: number;
    confidence: number;
    result?: unknown;
    trace: unknown[];
    sources: unknown[];
    started_at: string;
    completed_at?: string;
}
export interface ExecutionRecord {
    id: string;
    session_id: string;
    skill_id?: string;
    worker: string;
    status: string;
    input?: unknown;
    output?: unknown;
    sources: unknown[];
    confidence?: number;
    grounding_score?: number;
    latency_ms?: number;
    cost_usd?: number;
    model?: string;
    tokens_used?: number;
    error?: string;
    started_at: string;
    completed_at?: string;
}
export { InMemoryStore as Database };
//# sourceMappingURL=connection.d.ts.map