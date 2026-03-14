/**
 * @agentos/observability — Package entrypoint
 */
export { AgentTracer } from './tracer.js';
export type {
    ExecutionSpan, SpanEvent, ExecutionTrace, LatencyBreakdown,
} from './tracer.js';
export { initOTel, shutdownOTel, bridgeTraceToOTel, getOTelTracer } from './otel.js';
