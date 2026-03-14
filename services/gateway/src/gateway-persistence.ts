/**
 * Gateway Persistence Layer — Wires all ephemeral stores to the PersistentStore
 *
 * Instead of modifying every store class, this module:
 * 1. On init: restores saved data into each store's internal state
 * 2. On a periodic interval: snapshots dirty stores to PersistentStore
 * 3. On shutdown: flushes everything
 *
 * This means forum threads, blog posts, scheduler jobs, event logs,
 * audit entries, connection records, and course stats all survive restarts.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import type { Store } from './db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoreSnapshot {
  name: string;
  save: () => Record<string, unknown>[];
  restore: (rows: Record<string, unknown>[]) => void;
}

// ---------------------------------------------------------------------------
// Gateway Persistence Controller
// ---------------------------------------------------------------------------

let backingStore: Store | null = null;
const registeredStores: StoreSnapshot[] = [];
let saveTimer: ReturnType<typeof setInterval> | null = null;
const SAVE_INTERVAL_MS = 5_000; // Save dirty state every 5 seconds

/**
 * Register a store for persistence.
 * @param name - Table name in PersistentStore
 * @param save - Function that returns all current records as plain objects
 * @param restore - Function that loads records back into the store
 */
export function registerStore(name: string, save: () => Record<string, unknown>[], restore: (rows: Record<string, unknown>[]) => void): void {
  registeredStores.push({ name, save, restore });
}

/**
 * Initialize persistence — call from server.ts after all stores are created.
 * Restores saved state and starts periodic save timer.
 */
export function initGatewayPersistence(store: Store): void {
  backingStore = store;

  // Restore all registered stores
  let totalRestored = 0;
  for (const reg of registeredStores) {
    try {
      const saved = store.all(reg.name);
      if (saved.length > 0) {
        reg.restore(saved);
        totalRestored += saved.length;
      }
    } catch (err) {
      console.error(`[persistence] Failed to restore ${reg.name}:`, err);
    }
  }

  if (totalRestored > 0) {
    console.log(`[persistence] Restored ${totalRestored} records across ${registeredStores.length} stores`);
  }

  // Start periodic save
  saveTimer = setInterval(() => {
    saveAll();
  }, SAVE_INTERVAL_MS);
}

/**
 * Save all registered stores to the backing store.
 */
export function saveAll(): void {
  if (!backingStore) return;

  for (const reg of registeredStores) {
    try {
      const records = reg.save();
      // Clear existing table and re-insert all records
      const existing = backingStore.all(reg.name);
      for (const row of existing) {
        if (row.id && typeof row.id === 'string') {
          backingStore.delete(reg.name, row.id);
        }
      }
      for (const record of records) {
        const id = (record.id as string) ?? `${reg.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        backingStore.insert(reg.name, id, record);
      }
    } catch (err) {
      console.error(`[persistence] Failed to save ${reg.name}:`, err);
    }
  }
}

/**
 * Flush all stores and stop the periodic save timer.
 */
export function flushGatewayPersistence(): void {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  saveAll();
}
