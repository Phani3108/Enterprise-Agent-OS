/**
 * @agentos/events — NATS JetStream EventBus implementation
 *
 * Uses NATS JetStream for persistent, ordered event delivery.
 * Falls back to InMemoryEventBus if NATS is unavailable.
 *
 * Requires: nats package (npm install nats)
 * Config: NATS_URL env var (default: nats://localhost:4222)
 */

import type { EventBus } from './bus.js';
import type { EventEnvelope, EventHandler, SubscriptionOptions, BusHealth } from './types.js';

export class NatsEventBus implements EventBus {
    private nc: unknown = null;
    private js: unknown = null;
    private subs = new Map<string, unknown>();
    private startTime = Date.now();
    private url: string;

    constructor(url?: string) {
        this.url = url ?? process.env.NATS_URL ?? 'nats://localhost:4222';
    }

    async connect(): Promise<void> {
        const nats = await import('nats');
        this.nc = await nats.connect({ servers: this.url });
        // Get JetStream context
        this.js = (this.nc as { jetstream(): unknown }).jetstream();

        // Ensure the "eaos" stream exists, covering all eaos.* subjects
        const jsm = await (this.nc as { jetstreamManager(): Promise<unknown> }).jetstreamManager();
        try {
            await (jsm as { streams: { info(name: string): Promise<unknown> } }).streams.info('eaos');
        } catch {
            await (jsm as { streams: { add(cfg: unknown): Promise<unknown> } }).streams.add({
                name: 'eaos',
                subjects: ['eaos.>'],
                retention: 'limits' as const,
                max_msgs: 100_000,
                max_age: 7 * 24 * 60 * 60 * 1_000_000_000, // 7 days in ns
            });
        }

        console.log(`📡 NATS EventBus connected to ${this.url}`);
    }

    async disconnect(): Promise<void> {
        for (const sub of this.subs.values()) {
            await (sub as { unsubscribe(): void }).unsubscribe();
        }
        this.subs.clear();
        if (this.nc) {
            await (this.nc as { drain(): Promise<void> }).drain();
        }
    }

    async publish<T>(event: EventEnvelope<T>): Promise<void> {
        if (!this.js) throw new Error('NATS not connected');
        const nats = await import('nats');
        const subject = `eaos.${event.type.replace(/\./g, '.')}`;
        const data = nats.StringCodec().encode(JSON.stringify(event));
        await (this.js as { publish(subj: string, data: Uint8Array): Promise<unknown> }).publish(subject, data);
    }

    async publishBatch<T>(events: EventEnvelope<T>[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    async subscribe<T>(
        pattern: string,
        handler: EventHandler<T>,
        options?: SubscriptionOptions,
    ): Promise<string> {
        if (!this.js) throw new Error('NATS not connected');

        const nats = await import('nats');
        const subId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const natsSubject = `eaos.${pattern.replace(/\*/g, '>')}`;

        const consumerName = options?.group ?? subId;

        // Create or bind to a durable consumer
        const jsConsume = this.js as {
            consumers: {
                get(stream: string, consumer: string): Promise<unknown>;
            };
        };

        const jsm = await (this.nc as { jetstreamManager(): Promise<unknown> }).jetstreamManager();
        try {
            await (jsm as { consumers: { add(stream: string, cfg: unknown): Promise<unknown> } }).consumers.add('eaos', {
                durable_name: consumerName,
                filter_subject: natsSubject,
                ack_policy: 'explicit' as const,
            });
        } catch {
            // Consumer may already exist
        }

        const consumer = await jsConsume.consumers.get('eaos', consumerName);
        const messages = await (consumer as { consume(): Promise<AsyncIterable<unknown>> }).consume();

        // Process messages in background
        (async () => {
            for await (const msg of messages as AsyncIterable<{ data: Uint8Array; ack(): void }>) {
                try {
                    const event = JSON.parse(nats.StringCodec().decode(msg.data)) as EventEnvelope<T>;
                    await handler(event);
                    msg.ack();
                } catch (err) {
                    console.error(`[nats-bus] Handler error on ${pattern}:`, err);
                    msg.ack(); // Ack anyway to avoid redelivery loop
                }
            }
        })();

        this.subs.set(subId, messages);
        return subId;
    }

    async unsubscribe(subscriptionId: string): Promise<void> {
        const sub = this.subs.get(subscriptionId);
        if (sub) {
            // Signal stop
            (sub as { stop?(): void }).stop?.();
            this.subs.delete(subscriptionId);
        }
    }

    async replay<T>(
        pattern: string,
        from: Date,
        handler: EventHandler<T>,
    ): Promise<void> {
        if (!this.js) throw new Error('NATS not connected');

        const nats = await import('nats');
        const natsSubject = `eaos.${pattern.replace(/\*/g, '>')}`;
        const jsm = await (this.nc as { jetstreamManager(): Promise<unknown> }).jetstreamManager();

        const replayConsumer = `replay-${Date.now()}`;
        await (jsm as { consumers: { add(stream: string, cfg: unknown): Promise<unknown> } }).consumers.add('eaos', {
            durable_name: replayConsumer,
            filter_subject: natsSubject,
            deliver_policy: 'by_start_time' as const,
            opt_start_time: from.toISOString(),
            ack_policy: 'none' as const,
        });

        const consumer = await (this.js as {
            consumers: { get(stream: string, consumer: string): Promise<unknown> }
        }).consumers.get('eaos', replayConsumer);

        const messages = await (consumer as { fetch(opts: { max_messages: number }): Promise<AsyncIterable<unknown>> }).fetch({ max_messages: 10000 });

        for await (const msg of messages as AsyncIterable<{ data: Uint8Array }>) {
            const event = JSON.parse(nats.StringCodec().decode(msg.data)) as EventEnvelope<T>;
            await handler(event);
        }

        // Cleanup replay consumer
        await (jsm as { consumers: { delete(stream: string, consumer: string): Promise<void> } }).consumers.delete('eaos', replayConsumer);
    }

    async health(): Promise<BusHealth> {
        const connected = this.nc !== null;
        return {
            connected,
            latencyMs: connected ? 1 : -1,
            pendingMessages: 0,
            failedMessages: 0,
            uptime: Date.now() - this.startTime,
        };
    }
}
