/**
 * GDPR compliance endpoints.
 * Art.20 — Data portability (export)
 * Art.17 — Right to erasure (delete / anonymize)
 */

interface PgPool {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  connect(): Promise<PgClient>;
}
interface PgClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  release(): void;
}

// ---------------------------------------------------------------------------
// Art.20 — Export all user data
// ---------------------------------------------------------------------------

export async function exportUserData(userId: string, pool: PgPool): Promise<Record<string, unknown>> {
  const [
    userRows,
    execRows,
    stepRows,
    memoryRows,
    notifRows,
    feedbackRows,
    auditRows,
  ] = await Promise.all([
    pool.query(`SELECT id, email, name, role, teams, tenant_id, created_at FROM users WHERE id = $1`, [userId]),
    pool.query(`SELECT * FROM executions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 500`, [userId]),
    pool.query(`SELECT es.* FROM execution_steps es JOIN executions e ON es.execution_id = e.id WHERE e.user_id = $1 LIMIT 2000`, [userId]),
    pool.query(`SELECT * FROM agent_memory WHERE user_id = $1 LIMIT 1000`, [userId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM notifications WHERE user_id = $1 LIMIT 500`, [userId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM agent_feedback WHERE user_id = $1 LIMIT 500`, [userId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT id, timestamp, action, resource_type, resource_id FROM audit_log WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1000`, [userId]),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: userRows.rows[0] ?? null,
    executions: execRows.rows,
    executionSteps: stepRows.rows,
    memory: memoryRows.rows,
    notifications: notifRows.rows,
    feedback: feedbackRows.rows,
    auditLog: auditRows.rows,
  };
}

// ---------------------------------------------------------------------------
// Art.17 — Right to erasure
// ---------------------------------------------------------------------------

export async function deleteUserData(userId: string, pool: PgPool): Promise<{ deleted: string[] }> {
  const client = await pool.connect();
  const deleted: string[] = [];

  try {
    await client.query('BEGIN');

    // Anonymize user profile (preserve ID for referential integrity)
    await client.query(
      `UPDATE users SET email = $2, name = 'Deleted User', updated_at = NOW() WHERE id = $1`,
      [userId, `deleted+${userId}@gdpr.local`]
    );
    deleted.push('users.profile');

    // Delete execution data
    const execIds = await client.query(`SELECT id FROM executions WHERE user_id = $1`, [userId]);
    if (execIds.rowCount && execIds.rowCount > 0) {
      const ids = execIds.rows.map((r: Record<string, unknown>) => r.id);
      await client.query(`DELETE FROM execution_steps WHERE execution_id = ANY($1)`, [ids]);
      deleted.push('execution_steps');
      await client.query(`DELETE FROM executions WHERE user_id = $1`, [userId]);
      deleted.push('executions');
    }

    // Delete agent memory
    try {
      await client.query(`DELETE FROM agent_memory WHERE user_id = $1`, [userId]);
      deleted.push('agent_memory');
    } catch { /* table may not exist */ }

    // Delete notifications
    try {
      await client.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
      deleted.push('notifications');
    } catch { /* table may not exist */ }

    // Delete feedback
    try {
      await client.query(`DELETE FROM agent_feedback WHERE user_id = $1`, [userId]);
      deleted.push('agent_feedback');
    } catch { /* table may not exist */ }

    // Anonymize audit log entries (retain for compliance, but strip identity)
    await client.query(
      `UPDATE audit_log SET user_id = 'gdpr-deleted' WHERE user_id = $1`,
      [userId]
    );
    deleted.push('audit_log.anonymized');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return { deleted };
}
