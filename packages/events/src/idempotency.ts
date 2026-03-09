/**
 * @agentos/events — Idempotency
 *
 * Idempotency key management to ensure events are processed exactly once.
 * Uses a deduplication store to track processed event IDs.
 */

/**
 * Interface for idempotency stores.
 * Implementations can use Redis, PostgreSQL, or in-memory storage.
 */
export interface IdempotencyStore {
    /**
     * Check if an idempotency key has already been processed.
     */
    has(key: string): Promise<boolean>;

    /**
     * Mark an idempotency key as processed.
     * @param key - The idempotency key
     * @param ttlMs - How long to retain the key (prevents unbounded growth)
     */
    set(key: string, ttlMs?: number): Promise<void>;

    /**
     * Remove an idempotency key (e.g., on processing failure for retry).
     */
    remove(key: string): Promise<void>;

    /**
     * Get store statistics.
     */
    stats(): Promise<{ size: number; oldestKey?: Date }>;
}

/**
 * In-memory idempotency store for development and testing.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
    private store = new Map<string, { expiresAt: number }>();

    async has(key: string): Promise<boolean> {
        const entry = this.store.get(key);
        if (!entry) return false;

        // Check TTL
        if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return false;
        }

        return true;
    }

    async set(key: string, ttlMs: number = 86_400_000): Promise<void> {
        this.store.set(key, {
            expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
        });
    }

    async remove(key: string): Promise<void> {
        this.store.delete(key);
    }

    async stats(): Promise<{ size: number; oldestKey?: Date }> {
        // Cleanup expired entries first
        this.cleanup();
        return { size: this.store.size };
    }

    /**
     * Remove expired entries.
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (entry.expiresAt > 0 && now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

/**
 * Generate an idempotency key for an event.
 *
 * Key format: `{executionId}:{eventType}:{uniqueSuffix}`
 */
export function generateIdempotencyKey(
    executionId: string,
    eventType: string,
    uniqueSuffix?: string
): string {
    const suffix = uniqueSuffix ?? crypto.randomUUID().slice(0, 8);
    return `${executionId}:${eventType}:${suffix}`;
}

/**
 * Wrap an event handler with idempotency checking.
 *
 * If the event's idempotency key has already been processed, the handler
 * is skipped. Otherwise, the handler runs and the key is marked as processed.
 */
export function withIdempotency<T>(
    store: IdempotencyStore,
    handler: (event: { idempotencyKey: string; data: T }) => Promise<void>,
    ttlMs: number = 86_400_000 // 24 hours default
): (event: { idempotencyKey: string; data: T }) => Promise<void> {
    return async (event) => {
        // Check if already processed
        if (await store.has(event.idempotencyKey)) {
            return; // Skip — already processed
        }

        try {
            // Process the event
            await handler(event);

            // Mark as processed
            await store.set(event.idempotencyKey, ttlMs);
        } catch (err) {
            // Don't mark as processed on failure — allow retry
            throw err;
        }
    };
}
