/**
 * Tenant context middleware.
 * Sets the PostgreSQL session GUC `app.tenant_id` before each query so that
 * Row-Level Security policies (migration 005) enforce tenant isolation automatically.
 */

interface Pool {
  connect(): Promise<PoolClient>;
}
interface PoolClient {
  query(sql: string, params?: unknown[]): Promise<unknown>;
  release(): void;
}
interface AuthUser {
  tenantId?: string;
  [key: string]: unknown;
}

/**
 * Extract tenant ID from the authenticated user.
 * Falls back to `X-Tenant-ID` header for service-to-service calls.
 */
export function getTenantId(user: AuthUser, headers?: Record<string, string | undefined>): string {
  if (user.tenantId && user.tenantId !== 'default') return user.tenantId;
  const headerTenant = headers?.['x-tenant-id'];
  if (headerTenant) return headerTenant;
  return user.tenantId ?? 'default';
}

/**
 * Run a callback with the PostgreSQL session GUC set to the given tenant.
 * Uses SET LOCAL so the GUC is scoped to the current transaction.
 *
 * Usage:
 *   await withTenantContext(pool, tenantId, async (client) => {
 *     await client.query('SELECT * FROM users');
 *   });
 */
export async function withTenantContext<T>(
  pool: Pool,
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.tenant_id = $1`, [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Set tenant context on an already-checked-out client (no transaction management).
 * Call this when you manage the transaction lifecycle yourself.
 */
export async function setTenantContext(client: PoolClient, tenantId: string): Promise<void> {
  await client.query(`SET LOCAL app.tenant_id = $1`, [tenantId]);
}
