/**
 * @agentos/events — Retry Semantics
 *
 * Configurable retry logic with exponential backoff, max attempts,
 * and dead-letter queue routing for failed events.
 */

import type { EventEnvelope, RetryConfig, DeadLetterEntry } from './types.js';

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 60_000,
    backoffMultiplier: 2,
};

/**
 * Process an event with automatic retry and dead-letter routing.
 */
export async function withRetry<T>(
    event: EventEnvelope<T>,
    handler: (event: EventEnvelope<T>) => Promise<void>,
    config: Partial<RetryConfig> = {},
    onDeadLetter?: (entry: DeadLetterEntry<T>) => Promise<void>
): Promise<{ success: boolean; attempts: number; error?: string }> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
        try {
            await handler(event);
            return { success: true, attempts: attempt };
        } catch (err) {
            lastError = err as Error;

            // Check if error is retryable
            if (!isRetryableError(err)) {
                break;
            }

            // Wait before retrying (except on last attempt)
            if (attempt < retryConfig.maxAttempts) {
                const delay = calculateDelay(retryConfig, attempt);
                await sleep(delay);
            }
        }
    }

    // Route to dead-letter queue
    if (onDeadLetter) {
        const deadLetter: DeadLetterEntry<T> = {
            originalEvent: event,
            consumer: 'unknown',
            failureCount: retryConfig.maxAttempts,
            lastError: lastError?.message ?? 'Unknown error',
            firstFailedAt: new Date(),
            lastFailedAt: new Date(),
            status: 'pending_review',
        };

        await onDeadLetter(deadLetter);
    }

    return {
        success: false,
        attempts: retryConfig.maxAttempts,
        error: lastError?.message,
    };
}

/**
 * Calculate delay with exponential backoff and jitter.
 */
export function calculateDelay(config: RetryConfig, attempt: number): number {
    // Exponential backoff
    const exponentialDelay =
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    // Add jitter (±25%)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

    return Math.floor(cappedDelay + jitter);
}

/**
 * Determine if an error is retryable.
 *
 * Non-retryable errors:
 * - Validation errors (bad input)
 * - Auth errors (bad credentials)
 * - Not found errors
 *
 * Retryable errors:
 * - Network errors
 * - Timeouts
 * - 5xx server errors
 * - Rate limit (429)
 */
function isRetryableError(err: unknown): boolean {
    if (err instanceof Error) {
        const code = (err as any).code;
        const status = (err as any).status ?? (err as any).statusCode;

        // Non-retryable HTTP status codes
        if (status && status >= 400 && status < 500 && status !== 429) {
            return false;
        }

        // Non-retryable error codes
        const nonRetryable = ['VALIDATION_ERROR', 'AUTH_ERROR', 'NOT_FOUND', 'FORBIDDEN'];
        if (code && nonRetryable.includes(code)) {
            return false;
        }
    }

    return true; // default to retryable
}

/**
 * Sleep for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
