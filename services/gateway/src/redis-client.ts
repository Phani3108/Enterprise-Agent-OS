/**
 * Redis client singleton for horizontal scaling.
 * Provides graceful fallback: returns null when Redis is unreachable so the
 * gateway stays operational in single-instance dev mode without Redis.
 */

import { createRequire } from 'module';

// Lazy import — ioredis may not be installed in all environments.
type IORedis = import('ioredis').Redis;

let _redis: IORedis | null = null;
let _attempted = false;

export async function getRedis(): Promise<IORedis | null> {
  if (_attempted) return _redis;
  _attempted = true;

  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

  try {
    const { default: Redis } = await import('ioredis') as any;
    const client: IORedis = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    await client.connect();
    _redis = client;

    client.on('error', (err: Error) => {
      if ((err as any).code !== 'ECONNREFUSED') {
        console.warn('[redis] connection error:', err.message);
      }
    });

    console.info(`[redis] connected → ${url}`);
    return _redis;
  } catch {
    console.warn('[redis] unavailable — running in single-instance mode');
    return null;
  }
}

export function getRedisSync(): IORedis | null {
  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await (_redis as any).quit();
    _redis = null;
    _attempted = false;
  }
}
