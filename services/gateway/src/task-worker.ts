/**
 * Task Worker — In-process async workers that claim and execute queued tasks.
 *
 * Each worker runs a loop:
 *   1. claim() the next available task (respecting concurrency caps)
 *   2. markRunning()
 *   3. Invoke the registered runFn handler with the payload
 *   4. markCompleted() or markFailed() with retry
 *
 * Shutdown is graceful: pending work is drained before exit.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { claim, markRunning, markCompleted, markFailed, type TaskRow, type PersonaId } from './task-queue.js';
import { eventBus } from './event-bus.js';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface WorkerConfig {
    workerCount?: number;
    maxConcurrentPerAgent?: number;
    maxConcurrentPerPersona?: number;
    pollIntervalMs?: number;
    personaFilter?: PersonaId;
}

type RunFnHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, RunFnHandler>();

/**
 * Register a handler for a specific runFn name.
 * The task queue stores string identifiers for handlers, decoupling
 * serialization from function references.
 */
export function registerTaskHandler(runFn: string, handler: RunFnHandler): void {
    handlers.set(runFn, handler);
}

// ═══════════════════════════════════════════════════════════════
// Worker loop
// ═══════════════════════════════════════════════════════════════

let shuttingDown = false;
const activeWorkers: Promise<void>[] = [];

async function workerLoop(workerId: string, config: Required<WorkerConfig>): Promise<void> {
    while (!shuttingDown) {
        const task = claim({
            workerId,
            personaFilter: config.personaFilter,
            maxConcurrentPerAgent: config.maxConcurrentPerAgent,
            maxConcurrentPerPersona: config.maxConcurrentPerPersona,
        });

        if (!task) {
            // No work available → sleep
            await sleep(config.pollIntervalMs);
            continue;
        }

        await executeTask(task);
    }
}

async function executeTask(task: TaskRow): Promise<void> {
    const handler = handlers.get(task.runFn);
    if (!handler) {
        console.error(`[task-worker] no handler registered for runFn="${task.runFn}"`);
        markFailed(task.taskId, `No handler for runFn: ${task.runFn}`);
        return;
    }

    markRunning(task.taskId);
    const startMs = Date.now();

    try {
        await handler(task.payload);
        markCompleted(task.taskId);
        const duration = Date.now() - startMs;
        eventBus.emit('task.worker.completed', {
            taskId: task.taskId,
            durationMs: duration,
            attempts: task.attempts + 1,
        }).catch(() => {});
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const shouldRetry = task.attempts + 1 < task.maxAttempts;
        console.error(`[task-worker] task ${task.taskId} failed (attempt ${task.attempts + 1}/${task.maxAttempts}):`, message);
        markFailed(task.taskId, message, { retry: shouldRetry });

        if (shouldRetry) {
            // Exponential backoff before the next retry can be claimed
            const backoffMs = Math.min(30_000, 1_000 * Math.pow(2, task.attempts));
            await sleep(backoffMs);
        }

        eventBus.emit('task.worker.failed', {
            taskId: task.taskId,
            attempts: task.attempts + 1,
            error: message,
            retrying: shouldRetry,
        }).catch(() => {});
    }
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export function startWorkers(config: WorkerConfig = {}): void {
    const resolved: Required<WorkerConfig> = {
        workerCount: config.workerCount ?? 4,
        maxConcurrentPerAgent: config.maxConcurrentPerAgent ?? 2,
        maxConcurrentPerPersona: config.maxConcurrentPerPersona ?? 8,
        pollIntervalMs: config.pollIntervalMs ?? 500,
        personaFilter: config.personaFilter ?? undefined as any,
    };

    console.log(`✅ [task-worker] starting ${resolved.workerCount} workers ` +
        `(maxPerAgent=${resolved.maxConcurrentPerAgent}, maxPerPersona=${resolved.maxConcurrentPerPersona})`);

    for (let i = 0; i < resolved.workerCount; i++) {
        const workerId = `worker-${i + 1}`;
        activeWorkers.push(workerLoop(workerId, resolved).catch(err => {
            console.error(`[task-worker] ${workerId} crashed:`, err);
        }));
    }
}

export async function stopWorkers(): Promise<void> {
    shuttingDown = true;
    await Promise.all(activeWorkers);
    activeWorkers.length = 0;
    shuttingDown = false;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
