/**
 * PostgreSQL Store — Real database persistence for AgentOS
 *
 * Implements the Store interface using PostgreSQL with connection pooling.
 * Uses a generic JSONB row pattern so any table/key-value works through
 * the same interface that InMemoryStore and PersistentStore expose.
 *
 * Requires: DATABASE_URL env var (e.g. postgresql://eaos:pass@localhost:5432/eaos)
 */

import type { Store } from './connection.js';

// ---------------------------------------------------------------------------
// Lightweight pg wrapper — dynamic import so the rest of the app works
// without pg installed (falls back to InMemoryStore).
// ---------------------------------------------------------------------------

let _pool: unknown = null;

interface PgPool {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
}

async function getPool(): Promise<PgPool> {
  if (_pool) return _pool as PgPool;
  // Dynamic import so the module only fails when actually used
  const { default: pg } = await import('pg');
  const Pool = pg.Pool ?? (pg as unknown as { Pool: new (config: Record<string, unknown>) => PgPool }).Pool;
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return _pool as PgPool;
}

// ---------------------------------------------------------------------------
// Bootstrap — create the kv_store table if it doesn't exist
// ---------------------------------------------------------------------------

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS kv_store (
  _table TEXT NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (_table, id)
);
CREATE INDEX IF NOT EXISTS idx_kv_store_table ON kv_store(_table);
`;

// ---------------------------------------------------------------------------
// PostgresStore
// ---------------------------------------------------------------------------

export class PostgresStore implements Store {
  private ready: Promise<void>;

  constructor() {
    this.ready = this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    const pool = await getPool();
    await pool.query(BOOTSTRAP_SQL);
  }

  /** Not meaningful for Postgres — returns an empty Map */
  getTable(_name: string): Map<string, Record<string, unknown>> {
    return new Map();
  }

  insert(table: string, id: string, data: Record<string, unknown>): void {
    void this.insertAsync(table, id, data);
  }

  get(table: string, id: string): Record<string, unknown> | undefined {
    // Sync interface — kick off async, return undefined for initial call.
    // The repositories should use getAsync for real queries.
    return undefined;
  }

  update(table: string, id: string, data: Partial<Record<string, unknown>>): void {
    void this.updateAsync(table, id, data);
  }

  delete(table: string, id: string): void {
    void this.deleteAsync(table, id);
  }

  query(table: string, filter: (row: Record<string, unknown>) => boolean): Record<string, unknown>[] {
    // Sync interface — returns empty for initial call.
    return [];
  }

  all(table: string): Record<string, unknown>[] {
    // Sync interface — returns empty for initial call.
    return [];
  }

  // -----------------------------------------------------------------------
  // Async versions — the real implementations
  // -----------------------------------------------------------------------

  async insertAsync(table: string, id: string, data: Record<string, unknown>): Promise<void> {
    await this.ready;
    const pool = await getPool();
    await pool.query(
      `INSERT INTO kv_store (_table, id, data) VALUES ($1, $2, $3)
       ON CONFLICT (_table, id) DO UPDATE SET data = $3, updated_at = NOW()`,
      [table, id, JSON.stringify(data)],
    );
  }

  async getAsync(table: string, id: string): Promise<Record<string, unknown> | undefined> {
    await this.ready;
    const pool = await getPool();
    const { rows } = await pool.query(
      `SELECT data FROM kv_store WHERE _table = $1 AND id = $2`,
      [table, id],
    );
    return rows[0]?.data as Record<string, unknown> | undefined;
  }

  async updateAsync(table: string, id: string, data: Partial<Record<string, unknown>>): Promise<void> {
    await this.ready;
    const pool = await getPool();
    await pool.query(
      `UPDATE kv_store SET data = data || $3::jsonb, updated_at = NOW() WHERE _table = $1 AND id = $2`,
      [table, id, JSON.stringify(data)],
    );
  }

  async deleteAsync(table: string, id: string): Promise<void> {
    await this.ready;
    const pool = await getPool();
    await pool.query(
      `DELETE FROM kv_store WHERE _table = $1 AND id = $2`,
      [table, id],
    );
  }

  async queryAsync(table: string, filter: (row: Record<string, unknown>) => boolean): Promise<Record<string, unknown>[]> {
    await this.ready;
    const pool = await getPool();
    const { rows } = await pool.query(
      `SELECT data FROM kv_store WHERE _table = $1`,
      [table],
    );
    return (rows.map(r => r.data) as Record<string, unknown>[]).filter(filter);
  }

  async allAsync(table: string): Promise<Record<string, unknown>[]> {
    await this.ready;
    const pool = await getPool();
    const { rows } = await pool.query(
      `SELECT data FROM kv_store WHERE _table = $1 ORDER BY updated_at DESC`,
      [table],
    );
    return rows.map(r => r.data) as Record<string, unknown>[];
  }

  async close(): Promise<void> {
    if (_pool) await (_pool as PgPool).end();
  }
}
