-- Migration 005 — Multi-Tenancy
-- Adds tenant_id to all core tables + RLS policies for tenant isolation.

-- -------------------------------------------------------------------------
-- Add tenant_id column to core tables
-- -------------------------------------------------------------------------

ALTER TABLE users        ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE api_keys     ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE executions   ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE execution_steps ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE connections  ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';

-- -------------------------------------------------------------------------
-- Indexes for tenant scans
-- -------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_tenant        ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant     ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executions_tenant   ON executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exec_steps_tenant   ON execution_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_tenant ON agent_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_connections_tenant  ON connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);

-- -------------------------------------------------------------------------
-- Row-Level Security — enforced via SET LOCAL app.tenant_id before queries
-- -------------------------------------------------------------------------

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys       ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory   ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Policies: rows visible only when tenant_id matches the session GUC.
-- current_setting('app.tenant_id', TRUE) returns NULL when unset (no rows visible).
-- Superuser / bypassrls roles skip RLS (used for migrations and admin tooling).

DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.tenant_id', TRUE));

DROP POLICY IF EXISTS tenant_isolation ON api_keys;
CREATE POLICY tenant_isolation ON api_keys
  USING (tenant_id = current_setting('app.tenant_id', TRUE));

DROP POLICY IF EXISTS tenant_isolation ON executions;
CREATE POLICY tenant_isolation ON executions
  USING (tenant_id = current_setting('app.tenant_id', TRUE));

DROP POLICY IF EXISTS tenant_isolation ON execution_steps;
CREATE POLICY tenant_isolation ON execution_steps
  USING (tenant_id = current_setting('app.tenant_id', TRUE));

DROP POLICY IF EXISTS tenant_isolation ON agent_memory;
CREATE POLICY tenant_isolation ON agent_memory
  USING (tenant_id = current_setting('app.tenant_id', TRUE));

DROP POLICY IF EXISTS tenant_isolation ON connections;
CREATE POLICY tenant_isolation ON connections
  USING (tenant_id = current_setting('app.tenant_id', TRUE));

DROP POLICY IF EXISTS tenant_isolation ON notifications;
CREATE POLICY tenant_isolation ON notifications
  USING (tenant_id = current_setting('app.tenant_id', TRUE));
