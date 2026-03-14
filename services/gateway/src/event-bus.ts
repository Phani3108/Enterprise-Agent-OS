/**
 * Gateway Event Bus — In-process event system for the gateway
 *
 * Publishes events for all gateway operations (query execution, skill execution,
 * connector operations, etc.). Subscribers can be added for logging, metrics,
 * and cross-service communication.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GatewayEvent {
    id: string;
    type: string;
    source: string;
    time: string;
    data: Record<string, unknown>;
    traceId: string;
}

export type EventHandler = (event: GatewayEvent) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Event Bus
// ---------------------------------------------------------------------------

class GatewayEventBus {
    private handlers = new Map<string, EventHandler[]>();
    private log: GatewayEvent[] = [];
    private maxLogSize = 1000;

    /**
     * Subscribe to events matching a pattern.
     * Pattern supports wildcards: 'query.*', 'skill.*', '*'
     */
    on(pattern: string, handler: EventHandler): void {
        const existing = this.handlers.get(pattern) ?? [];
        existing.push(handler);
        this.handlers.set(pattern, existing);
    }

    /**
     * Publish an event.
     */
    async emit(type: string, data: Record<string, unknown>, traceId?: string): Promise<void> {
        const event: GatewayEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type,
            source: 'gateway',
            time: new Date().toISOString(),
            data,
            traceId: traceId ?? `trace_${Date.now()}`,
        };

        // Store in log
        this.log.push(event);
        if (this.log.length > this.maxLogSize) {
            this.log = this.log.slice(-this.maxLogSize);
        }

        // Dispatch to matching handlers
        for (const [pattern, handlers] of this.handlers) {
            if (this.matchPattern(pattern, type)) {
                for (const handler of handlers) {
                    try {
                        await handler(event);
                    } catch (err) {
                        console.error(`[event-bus] Handler error for ${type}:`, err);
                    }
                }
            }
        }
    }

    /**
     * Get recent events, optionally filtered by type pattern.
     */
    getLog(pattern?: string, limit = 50): GatewayEvent[] {
        let events = this.log;
        if (pattern) {
            events = events.filter(e => this.matchPattern(pattern, e.type));
        }
        return events.slice(-limit);
    }

    /**
     * Get event counts by type for metrics.
     */
    getMetrics(): Record<string, number> {
        const counts: Record<string, number> = {};
        for (const event of this.log) {
            counts[event.type] = (counts[event.type] ?? 0) + 1;
        }
        return counts;
    }

    private matchPattern(pattern: string, type: string): boolean {
        if (pattern === '*') return true;
        if (pattern === type) return true;
        if (pattern.endsWith('.*')) {
            const prefix = pattern.slice(0, -2);
            return type.startsWith(prefix + '.');
        }
        return false;
    }

    // -----------------------------------------------------------------------
    // Persistence hooks
    // -----------------------------------------------------------------------

    _exportLog(): GatewayEvent[] {
        return [...this.log];
    }

    _importLog(events: GatewayEvent[]): void {
        this.log = events.slice(-this.maxLogSize);
    }
}

// Singleton event bus
export const eventBus = new GatewayEventBus();

// Default console logging for key events
eventBus.on('query.*', (e) => {
    console.log(`📡 [event] ${e.type}: ${JSON.stringify(e.data).slice(0, 120)}`);
});

eventBus.on('skill.*', (e) => {
    console.log(`⚡ [event] ${e.type}: ${JSON.stringify(e.data).slice(0, 120)}`);
});

eventBus.on('connector.*', (e) => {
    console.log(`🔌 [event] ${e.type}: ${JSON.stringify(e.data).slice(0, 120)}`);
});
