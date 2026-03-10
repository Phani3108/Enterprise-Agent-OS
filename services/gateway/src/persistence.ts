/**
 * Persistence Layer — Pluggable storage adapters
 *
 * Supports three backends:
 *   1. InMemory  — default, for dev/testing (no setup required)
 *   2. Neo4j     — graph DB, ideal for memory graph & relationships
 *   3. Redis     — key-value + TTL, ideal for sessions & caches
 *
 * Switch adapters via PERSISTENCE_ADAPTER env var:
 *   PERSISTENCE_ADAPTER=neo4j
 *   PERSISTENCE_ADAPTER=redis
 *   PERSISTENCE_ADAPTER=memory (default)
 *
 * Neo4j requires:
 *   NEO4J_URI=bolt://localhost:7687
 *   NEO4J_USER=neo4j
 *   NEO4J_PASSWORD=password
 *
 * Redis requires:
 *   REDIS_URL=redis://localhost:6379
 */

// ---------------------------------------------------------------------------
// Core interface
// ---------------------------------------------------------------------------

export interface PersistenceAdapter {
    /** Store a value with optional TTL in seconds */
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    /** Retrieve a value */
    get<T = unknown>(key: string): Promise<T | null>;
    /** Delete a key */
    del(key: string): Promise<void>;
    /** Get all keys matching a prefix */
    keys(prefix: string): Promise<string[]>;
    /** Check if a key exists */
    exists(key: string): Promise<boolean>;
    /** Increment a counter atomically */
    incr(key: string): Promise<number>;
    /** Push to a list (left push) */
    lpush(key: string, ...values: string[]): Promise<void>;
    /** Get list items */
    lrange(key: string, start: number, end: number): Promise<string[]>;
    /** Add to a sorted set */
    zadd(key: string, score: number, member: string): Promise<void>;
    /** Get sorted set members by score range */
    zrangebyscore(key: string, min: number, max: number): Promise<string[]>;
    /** Close/disconnect */
    close(): Promise<void>;
    /** Name of this adapter */
    readonly name: string;
}

// ---------------------------------------------------------------------------
// 1. In-Memory Adapter
// ---------------------------------------------------------------------------

export class InMemoryAdapter implements PersistenceAdapter {
    readonly name = 'memory';

    private store = new Map<string, { value: unknown; expiresAt?: number }>();
    private lists = new Map<string, string[]>();
    private sortedSets = new Map<string, Map<string, number>>();
    private counters = new Map<string, number>();
    private ttlTimers = new Map<string, ReturnType<typeof setTimeout>>();

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        if (this.ttlTimers.has(key)) clearTimeout(this.ttlTimers.get(key)!);
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
        this.store.set(key, { value, expiresAt });
        if (ttlSeconds) {
            this.ttlTimers.set(key, setTimeout(() => this.store.delete(key), ttlSeconds * 1000));
        }
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value as T;
    }

    async del(key: string): Promise<void> {
        this.store.delete(key);
        if (this.ttlTimers.has(key)) {
            clearTimeout(this.ttlTimers.get(key)!);
            this.ttlTimers.delete(key);
        }
    }

    async keys(prefix: string): Promise<string[]> {
        return [...this.store.keys()].filter((k) => k.startsWith(prefix));
    }

    async exists(key: string): Promise<boolean> {
        return this.store.has(key);
    }

    async incr(key: string): Promise<number> {
        const val = (this.counters.get(key) ?? 0) + 1;
        this.counters.set(key, val);
        return val;
    }

    async lpush(key: string, ...values: string[]): Promise<void> {
        const list = this.lists.get(key) ?? [];
        list.unshift(...values);
        this.lists.set(key, list);
    }

    async lrange(key: string, start: number, end: number): Promise<string[]> {
        const list = this.lists.get(key) ?? [];
        return end === -1 ? list.slice(start) : list.slice(start, end + 1);
    }

    async zadd(key: string, score: number, member: string): Promise<void> {
        const set = this.sortedSets.get(key) ?? new Map<string, number>();
        set.set(member, score);
        this.sortedSets.set(key, set);
    }

    async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
        const set = this.sortedSets.get(key);
        if (!set) return [];
        return [...set.entries()]
            .filter(([, score]) => score >= min && score <= max)
            .sort(([, a], [, b]) => a - b)
            .map(([member]) => member);
    }

    async close(): Promise<void> {
        for (const timer of this.ttlTimers.values()) clearTimeout(timer);
    }
}

// ---------------------------------------------------------------------------
// 2. Neo4j Adapter
// ---------------------------------------------------------------------------

/**
 * Neo4j adapter for persistent graph-based storage.
 *
 * Requires: npm install neo4j-driver
 * Schema notes:
 *   - Generic KV stored as (:KV {key, value, expiresAt}) nodes
 *   - Graph relationships can be added as needed (users, skills, etc.)
 */
export class Neo4jAdapter implements PersistenceAdapter {
    readonly name = 'neo4j';

    private driver: unknown = null;
    private session: unknown = null;
    private readonly uri: string;
    private readonly user: string;
    private readonly password: string;
    private fallback = new InMemoryAdapter();
    private connected = false;

    constructor(
        uri = process.env.NEO4J_URI ?? 'bolt://localhost:7687',
        user = process.env.NEO4J_USER ?? 'neo4j',
        password = process.env.NEO4J_PASSWORD ?? 'password',
    ) {
        this.uri = uri;
        this.user = user;
        this.password = password;
        void this.connect();
    }

    private async connect(): Promise<void> {
        try {
            // Dynamic import to avoid hard dependency
            const neo4j = await import('neo4j-driver' as string).catch(() => null);
            if (!neo4j) {
                console.warn('[Neo4jAdapter] neo4j-driver not installed. Run: npm install neo4j-driver');
                return;
            }
            // @ts-ignore dynamic import
            this.driver = neo4j.default.driver(this.uri, neo4j.default.auth.basic(this.user, this.password));
            // @ts-expect-error dynamic import
            await this.driver.verifyConnectivity();
            // @ts-expect-error dynamic import
            this.session = this.driver.session();
            this.connected = true;
            console.log('[Neo4jAdapter] Connected to Neo4j at', this.uri);
            await this.ensureSchema();
        } catch (err) {
            console.warn('[Neo4jAdapter] Connection failed, using in-memory fallback:', err instanceof Error ? err.message : err);
        }
    }

    private async ensureSchema(): Promise<void> {
        if (!this.session) return;
        try {
            // @ts-expect-error dynamic session
            await this.session.run('CREATE CONSTRAINT kv_key IF NOT EXISTS FOR (n:KV) REQUIRE n.key IS UNIQUE');
        } catch {
            // Constraint may already exist
        }
    }

    private async runQuery(cypher: string, params: Record<string, unknown> = {}): Promise<unknown[]> {
        if (!this.connected || !this.session) return [];
        try {
            // @ts-expect-error dynamic session
            const result = await this.session.run(cypher, params);
            return result.records;
        } catch (err) {
            console.error('[Neo4jAdapter] Query error:', err);
            return [];
        }
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        if (!this.connected) { await this.fallback.set(key, value, ttlSeconds); return; }
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        await this.runQuery(
            'MERGE (n:KV {key: $key}) SET n.value = $value, n.expiresAt = $expiresAt, n.updatedAt = timestamp()',
            { key, value: JSON.stringify(value), expiresAt },
        );
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        if (!this.connected) return this.fallback.get<T>(key);
        const records = await this.runQuery(
            'MATCH (n:KV {key: $key}) WHERE n.expiresAt IS NULL OR n.expiresAt > timestamp() RETURN n.value',
            { key },
        );
        if (!records.length) return null;
        // @ts-expect-error dynamic record
        const raw = records[0].get('n.value');
        try { return JSON.parse(raw) as T; } catch { return raw as T; }
    }

    async del(key: string): Promise<void> {
        if (!this.connected) { await this.fallback.del(key); return; }
        await this.runQuery('MATCH (n:KV {key: $key}) DETACH DELETE n', { key });
    }

    async keys(prefix: string): Promise<string[]> {
        if (!this.connected) return this.fallback.keys(prefix);
        const records = await this.runQuery(
            'MATCH (n:KV) WHERE n.key STARTS WITH $prefix RETURN n.key',
            { prefix },
        );
        // @ts-expect-error dynamic record
        return records.map((r) => r.get('n.key') as string);
    }

    async exists(key: string): Promise<boolean> {
        if (!this.connected) return this.fallback.exists(key);
        const records = await this.runQuery(
            'MATCH (n:KV {key: $key}) RETURN count(n) AS c',
            { key },
        );
        if (!records.length) return false;
        // @ts-expect-error dynamic record
        return records[0].get('c').toNumber() > 0;
    }

    async incr(key: string): Promise<number> {
        if (!this.connected) return this.fallback.incr(key);
        const records = await this.runQuery(
            'MERGE (n:KV {key: $key}) SET n.value = COALESCE(toInteger(n.value), 0) + 1 RETURN n.value',
            { key },
        );
        if (!records.length) return 1;
        // @ts-expect-error dynamic record
        return records[0].get('n.value').toNumber?.() ?? 1;
    }

    async lpush(key: string, ...values: string[]): Promise<void> {
        if (!this.connected) { await this.fallback.lpush(key, ...values); return; }
        // Store list as JSON array
        const existing = await this.get<string[]>(key) ?? [];
        await this.set(key, [...values, ...existing]);
    }

    async lrange(key: string, start: number, end: number): Promise<string[]> {
        if (!this.connected) return this.fallback.lrange(key, start, end);
        const list = await this.get<string[]>(key) ?? [];
        return end === -1 ? list.slice(start) : list.slice(start, end + 1);
    }

    async zadd(key: string, score: number, member: string): Promise<void> {
        if (!this.connected) { await this.fallback.zadd(key, score, member); return; }
        const set = await this.get<Record<string, number>>(key) ?? {};
        set[member] = score;
        await this.set(key, set);
    }

    async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
        if (!this.connected) return this.fallback.zrangebyscore(key, min, max);
        const set = await this.get<Record<string, number>>(key) ?? {};
        return Object.entries(set)
            .filter(([, score]) => score >= min && score <= max)
            .sort(([, a], [, b]) => a - b)
            .map(([member]) => member);
    }

    async close(): Promise<void> {
        if (this.session) { // @ts-expect-error dynamic
            await this.session.close();
        }
        if (this.driver) { // @ts-expect-error dynamic
            await this.driver.close();
        }
    }
}

// ---------------------------------------------------------------------------
// 3. Redis Adapter (ioredis)
// ---------------------------------------------------------------------------

/**
 * Redis adapter for high-performance KV storage with TTL.
 *
 * Requires: npm install ioredis
 * REDIS_URL=redis://localhost:6379
 */
export class RedisAdapter implements PersistenceAdapter {
    readonly name = 'redis';

    private client: unknown = null;
    private fallback = new InMemoryAdapter();
    private connected = false;
    private readonly url: string;

    constructor(url = process.env.REDIS_URL ?? 'redis://localhost:6379') {
        this.url = url;
        void this.connect();
    }

    private async connect(): Promise<void> {
        try {
            const ioredis = await import('ioredis' as string).catch(() => null);
            if (!ioredis) {
                console.warn('[RedisAdapter] ioredis not installed. Run: npm install ioredis');
                return;
            }
            // @ts-ignore dynamic import
            this.client = new ioredis.default(this.url, { lazyConnect: true, maxRetriesPerRequest: 3 });
            // @ts-expect-error dynamic
            await this.client.connect();
            this.connected = true;
            console.log('[RedisAdapter] Connected to Redis at', this.url);
        } catch (err) {
            console.warn('[RedisAdapter] Connection failed, using in-memory fallback:', err instanceof Error ? err.message : err);
        }
    }

    async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        if (!this.connected) { await this.fallback.set(key, value, ttlSeconds); return; }
        const serialised = JSON.stringify(value);
        if (ttlSeconds) {
            // @ts-expect-error dynamic
            await this.client.set(key, serialised, 'EX', ttlSeconds);
        } else {
            // @ts-expect-error dynamic
            await this.client.set(key, serialised);
        }
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        if (!this.connected) return this.fallback.get<T>(key);
        // @ts-expect-error dynamic
        const val: string | null = await this.client.get(key);
        if (val === null) return null;
        try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
    }

    async del(key: string): Promise<void> {
        if (!this.connected) { await this.fallback.del(key); return; }
        // @ts-expect-error dynamic
        await this.client.del(key);
    }

    async keys(prefix: string): Promise<string[]> {
        if (!this.connected) return this.fallback.keys(prefix);
        // @ts-expect-error dynamic
        return this.client.keys(`${prefix}*`);
    }

    async exists(key: string): Promise<boolean> {
        if (!this.connected) return this.fallback.exists(key);
        // @ts-expect-error dynamic
        return (await this.client.exists(key)) === 1;
    }

    async incr(key: string): Promise<number> {
        if (!this.connected) return this.fallback.incr(key);
        // @ts-expect-error dynamic
        return this.client.incr(key);
    }

    async lpush(key: string, ...values: string[]): Promise<void> {
        if (!this.connected) { await this.fallback.lpush(key, ...values); return; }
        // @ts-expect-error dynamic
        await this.client.lpush(key, ...values);
    }

    async lrange(key: string, start: number, end: number): Promise<string[]> {
        if (!this.connected) return this.fallback.lrange(key, start, end);
        // @ts-expect-error dynamic
        return this.client.lrange(key, start, end);
    }

    async zadd(key: string, score: number, member: string): Promise<void> {
        if (!this.connected) { await this.fallback.zadd(key, score, member); return; }
        // @ts-expect-error dynamic
        await this.client.zadd(key, score, member);
    }

    async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
        if (!this.connected) return this.fallback.zrangebyscore(key, min, max);
        // @ts-expect-error dynamic
        return this.client.zrangebyscore(key, min, max);
    }

    async close(): Promise<void> {
        if (this.client) { // @ts-expect-error dynamic
            await this.client.quit();
        }
    }
}

// ---------------------------------------------------------------------------
// Factory — select adapter from env
// ---------------------------------------------------------------------------

export function createPersistenceAdapter(): PersistenceAdapter {
    const adapter = (process.env.PERSISTENCE_ADAPTER ?? 'memory').toLowerCase();

    switch (adapter) {
        case 'neo4j':
            console.log('[Persistence] Using Neo4j adapter');
            return new Neo4jAdapter();
        case 'redis':
            console.log('[Persistence] Using Redis adapter');
            return new RedisAdapter();
        default:
            console.log('[Persistence] Using in-memory adapter');
            return new InMemoryAdapter();
    }
}

// Singleton adapter
export const db = createPersistenceAdapter();
