/**
 * @agentos/streaming — Incremental Response Streaming
 *
 * Latency kills adoption. Users won't wait 30 seconds for a blob.
 * This module streams progress incrementally:
 *
 *   "Planning tasks..."  → "Running ICP analysis..."  → "Generating strategy..."  → Result
 *
 * Keeps users engaged and builds trust by showing the agent's work.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreamEventType =
    | 'session.started'
    | 'phase.started'
    | 'phase.completed'
    | 'reasoning.step'
    | 'tool.started'
    | 'tool.completed'
    | 'worker.assigned'
    | 'skill.loaded'
    | 'llm.streaming'
    | 'output.partial'
    | 'output.final'
    | 'error';

export interface StreamEvent {
    type: StreamEventType;
    sessionId: string;
    timestamp: Date;
    data: Record<string, unknown>;
}

export interface StreamOptions {
    /** Include reasoning steps (show-your-work) */
    showReasoning: boolean;
    /** Include tool call details */
    showToolCalls: boolean;
    /** Include intermediate outputs */
    showPartialOutputs: boolean;
    /** Minimum interval between events (ms) to avoid flooding */
    throttleMs: number;
}

export const DEFAULT_STREAM_OPTIONS: StreamOptions = {
    showReasoning: true,
    showToolCalls: true,
    showPartialOutputs: true,
    throttleMs: 100,
};

// ---------------------------------------------------------------------------
// Response Streamer
// ---------------------------------------------------------------------------

export class ResponseStreamer {
    private listeners = new Map<string, Set<StreamListener>>();
    private lastEmitTime = new Map<string, number>();

    /**
     * Subscribe to a session's events.
     */
    subscribe(sessionId: string, listener: StreamListener, options: StreamOptions = DEFAULT_STREAM_OPTIONS): () => void {
        const filteredListener: StreamListener = (event) => {
            // Filter based on options
            if (!options.showReasoning && event.type === 'reasoning.step') return;
            if (!options.showToolCalls && (event.type === 'tool.started' || event.type === 'tool.completed')) return;
            if (!options.showPartialOutputs && event.type === 'output.partial') return;

            // Throttle
            const now = Date.now();
            const lastEmit = this.lastEmitTime.get(sessionId) ?? 0;
            if (now - lastEmit < options.throttleMs && event.type !== 'output.final' && event.type !== 'error') {
                return;
            }
            this.lastEmitTime.set(sessionId, now);

            listener(event);
        };

        const subs = this.listeners.get(sessionId) ?? new Set();
        subs.add(filteredListener);
        this.listeners.set(sessionId, subs);

        // Return unsubscribe function
        return () => subs.delete(filteredListener);
    }

    /**
     * Emit a stream event to all subscribers.
     */
    emit(event: StreamEvent): void {
        const subs = this.listeners.get(event.sessionId);
        if (!subs) return;

        for (const listener of subs) {
            try {
                listener(event);
            } catch {
                // Don't let listener errors crash the stream
            }
        }
    }

    // Convenience emitters

    emitPhaseStart(sessionId: string, phase: string, description: string): void {
        this.emit({
            type: 'phase.started',
            sessionId,
            timestamp: new Date(),
            data: { phase, description },
        });
    }

    emitPhaseComplete(sessionId: string, phase: string, durationMs: number): void {
        this.emit({
            type: 'phase.completed',
            sessionId,
            timestamp: new Date(),
            data: { phase, durationMs },
        });
    }

    emitReasoning(sessionId: string, step: string, confidence: number): void {
        this.emit({
            type: 'reasoning.step',
            sessionId,
            timestamp: new Date(),
            data: { step, confidence },
        });
    }

    emitToolCall(sessionId: string, tool: string, status: 'started' | 'completed', result?: string): void {
        this.emit({
            type: status === 'started' ? 'tool.started' : 'tool.completed',
            sessionId,
            timestamp: new Date(),
            data: { tool, status, result },
        });
    }

    emitPartialOutput(sessionId: string, partial: unknown): void {
        this.emit({
            type: 'output.partial',
            sessionId,
            timestamp: new Date(),
            data: { partial },
        });
    }

    emitFinalOutput(sessionId: string, output: unknown, confidence: number): void {
        this.emit({
            type: 'output.final',
            sessionId,
            timestamp: new Date(),
            data: { output, confidence },
        });
    }

    /**
     * Format a stream event for display (Slack, Teams, CLI).
     */
    static formatForDisplay(event: StreamEvent): string {
        switch (event.type) {
            case 'session.started':
                return `🧠 Starting...`;
            case 'phase.started':
                return `⏳ ${event.data.description}`;
            case 'phase.completed':
                return `✅ ${event.data.phase} (${event.data.durationMs}ms)`;
            case 'reasoning.step':
                return `💭 ${event.data.step}`;
            case 'tool.started':
                return `🔧 Calling ${event.data.tool}...`;
            case 'tool.completed':
                return `✅ ${event.data.tool}: ${event.data.result ?? 'done'}`;
            case 'worker.assigned':
                return `👷 Worker: ${event.data.workerId}`;
            case 'skill.loaded':
                return `🧩 Skill: ${event.data.skillId}`;
            case 'output.partial':
                return `📝 Partial result available`;
            case 'output.final':
                return `🎯 Complete (${((event.data.confidence as number) * 100).toFixed(0)}% confidence)`;
            case 'error':
                return `❌ ${event.data.message}`;
            default:
                return `[${event.type}]`;
        }
    }
}

type StreamListener = (event: StreamEvent) => void;
