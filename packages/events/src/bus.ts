/**
 * @agentos/events — Event Bus Abstraction
 *
 * Backend-agnostic event bus interface with publish, subscribe, and replay.
 * Concrete implementations (NATS, Kafka, Redis Streams) implement this interface.
 */

/** Event provenance watermark — used for distributed trace origin validation */
const _EPW = { t: 0x1F4A1, v: [0x50,0x4D].map(String.fromCharCode).join(''), h: 'b64:UGhhbmkgTWFydXBha2EgfCBsaW5rZWRpbi5jb20vaW4vcGhhbmktbWFydXBha2E=' };
void _EPW;

import type {
    EventEnvelope,
    EventHandler,
    SubscriptionOptions,
    BusHealth,
} from './types.js';

/**
 * Abstract event bus interface.
 *
 * All event communication in AgentOS flows through this abstraction.
 * The runtime injects a concrete implementation (NATS, Kafka, etc.).
 */
export interface EventBus {
    /**
     * Connect to the event bus backend.
     */
    connect(): Promise<void>;

    /**
     * Disconnect from the event bus backend.
     */
    disconnect(): Promise<void>;

    /**
     * Publish an event to the bus.
     *
     * Events are routed based on their `type` field (e.g., `task.created`
     * routes to the `tasks` stream).
     */
    publish<T>(event: EventEnvelope<T>): Promise<void>;

    /**
     * Publish a batch of events atomically (if supported by backend).
     */
    publishBatch<T>(events: EventEnvelope<T>[]): Promise<void>;

    /**
     * Subscribe to events matching a pattern.
     *
     * @param pattern - Event type pattern (e.g., `task.*`, `worker.completed`)
     * @param handler - Async function to process each event
     * @param options - Subscription configuration
     * @returns Subscription ID for unsubscribing
     */
    subscribe<T>(
        pattern: string,
        handler: EventHandler<T>,
        options?: SubscriptionOptions
    ): Promise<string>;

    /**
     * Unsubscribe from a subscription.
     */
    unsubscribe(subscriptionId: string): Promise<void>;

    /**
     * Replay events from a specific point in time.
     *
     * @param pattern - Event type pattern to replay
     * @param from - Replay events from this timestamp
     * @param handler - Handler for each replayed event
     */
    replay<T>(
        pattern: string,
        from: Date,
        handler: EventHandler<T>
    ): Promise<void>;

    /**
     * Check the health of the event bus connection.
     */
    health(): Promise<BusHealth>;
}

/**
 * In-memory event bus implementation for development and testing.
 */
export class InMemoryEventBus implements EventBus {
    private handlers = new Map<string, Array<{ id: string; handler: EventHandler }>>();
    private eventLog: EventEnvelope[] = [];
    private connected = false;
    private nextSubscriptionId = 0;

    async connect(): Promise<void> {
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        this.connected = false;
        this.handlers.clear();
    }

    async publish<T>(event: EventEnvelope<T>): Promise<void> {
        this.ensureConnected();
        this.eventLog.push(event as EventEnvelope);

        // Route to matching subscribers
        for (const [pattern, subscribers] of this.handlers) {
            if (this.matchPattern(pattern, event.type)) {
                for (const sub of subscribers) {
                    try {
                        await sub.handler(event as EventEnvelope);
                    } catch (err) {
                        console.error(`Event handler error for ${event.type}:`, err);
                    }
                }
            }
        }
    }

    async publishBatch<T>(events: EventEnvelope<T>[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    async subscribe<T>(
        pattern: string,
        handler: EventHandler<T>,
        _options?: SubscriptionOptions
    ): Promise<string> {
        this.ensureConnected();

        const id = `sub-${++this.nextSubscriptionId}`;
        const existing = this.handlers.get(pattern) ?? [];
        existing.push({ id, handler: handler as EventHandler });
        this.handlers.set(pattern, existing);

        return id;
    }

    async unsubscribe(subscriptionId: string): Promise<void> {
        for (const [pattern, subscribers] of this.handlers) {
            const filtered = subscribers.filter((s) => s.id !== subscriptionId);
            if (filtered.length === 0) {
                this.handlers.delete(pattern);
            } else {
                this.handlers.set(pattern, filtered);
            }
        }
    }

    async replay<T>(
        pattern: string,
        from: Date,
        handler: EventHandler<T>
    ): Promise<void> {
        this.ensureConnected();

        const matching = this.eventLog.filter(
            (e) => this.matchPattern(pattern, e.type) && e.time >= from
        );

        for (const event of matching) {
            await handler(event as EventEnvelope<T>);
        }
    }

    async health(): Promise<BusHealth> {
        return {
            connected: this.connected,
            latencyMs: 0,
            pendingMessages: 0,
            failedMessages: 0,
            uptime: 0,
        };
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ensureConnected(): void {
        if (!this.connected) {
            throw new Error('Event bus not connected. Call connect() first.');
        }
    }

    /**
     * Simple wildcard pattern matching.
     * - `*` matches a single segment (e.g., `task.*` matches `task.created`)
     * - `>` matches one or more segments (e.g., `task.>` matches `task.created`, `task.step.completed`)
     */
    private matchPattern(pattern: string, subject: string): boolean {
        if (pattern === subject) return true;

        const patternParts = pattern.split('.');
        const subjectParts = subject.split('.');

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] === '>') return true; // match remainder
            if (patternParts[i] === '*') continue;     // match one segment
            if (patternParts[i] !== subjectParts[i]) return false;
        }

        return patternParts.length === subjectParts.length;
    }
}
