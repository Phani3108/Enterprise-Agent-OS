-- Phase A: Unified Execution Model + Auth + Enhanced Persistence
-- Run: psql -d eaos -f 003_unified_execution.sql
--
-- @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
-- @copyright © 2026 Phani Marupaka. All rights reserved.

-- ---------------------------------------------------------------------------
-- Users & Auth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'operator', 'admin')),
  teams TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{"read", "execute"}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- ---------------------------------------------------------------------------
-- Unified Executions — single table for all persona executions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  persona TEXT NOT NULL CHECK (persona IN ('engineering', 'product', 'hr', 'marketing')),
  executable_type TEXT NOT NULL DEFAULT 'skill' CHECK (executable_type IN ('skill', 'workflow', 'goal')),
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'paused')),
  provider TEXT,
  model TEXT,
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  user_id TEXT,
  -- DAG execution support
  edges JSONB DEFAULT '[]',
  execution_mode TEXT NOT NULL DEFAULT 'sequential' CHECK (execution_mode IN ('sequential', 'dag')),
  -- Aggregate metrics
  total_token_cost REAL,
  total_latency_ms INTEGER,
  avg_quality_score REAL,
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_persona ON executions(persona);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_user ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_skill ON executions(skill_id);
CREATE INDEX IF NOT EXISTS idx_executions_started ON executions(started_at DESC);

-- ---------------------------------------------------------------------------
-- Execution Steps — individual step records within an execution
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS execution_steps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  execution_id TEXT NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_index INTEGER NOT NULL DEFAULT 0,
  agent TEXT NOT NULL,
  agent_call_sign TEXT,
  agent_rank TEXT,
  tool TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'approval_required', 'skipped')),
  output_key TEXT,
  output_preview TEXT,
  output_full TEXT,
  error TEXT,
  -- KPI tracking
  latency_ms INTEGER,
  token_cost REAL,
  quality_score REAL,
  handoff_valid BOOLEAN DEFAULT TRUE,
  handoff_warnings TEXT[] DEFAULT '{}',
  -- DAG support
  depends_on TEXT[] DEFAULT '{}',
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exec_steps_execution ON execution_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_exec_steps_agent ON execution_steps(agent);
CREATE INDEX IF NOT EXISTS idx_exec_steps_status ON execution_steps(status);

-- ---------------------------------------------------------------------------
-- Agent KPIs — performance metrics per agent
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_kpis (
  agent_id TEXT PRIMARY KEY,
  call_sign TEXT NOT NULL,
  total_executions INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms REAL NOT NULL DEFAULT 0,
  avg_quality_score REAL NOT NULL DEFAULT 5,
  avg_token_cost REAL NOT NULL DEFAULT 0,
  handoff_success_rate REAL NOT NULL DEFAULT 100,
  last_executed_at TIMESTAMPTZ,
  -- SLA tracking (Phase B thresholds)
  sla_quality_threshold REAL DEFAULT 7.0,
  sla_latency_threshold_ms INTEGER DEFAULT 30000,
  underperformance_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Agent Memory — accumulated context per agent
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_memory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  agent_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('learning', 'preference', 'pattern', 'error', 'feedback')),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'execution',
  execution_id TEXT,
  relevance_score REAL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_kind ON agent_memory(kind);

-- ---------------------------------------------------------------------------
-- Connections — tool / integration connection state
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS connections (
  connector_id TEXT PRIMARY KEY,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'not-connected' CHECK (status IN ('connected', 'not-connected', 'error')),
  credentials JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  error TEXT
);

-- ---------------------------------------------------------------------------
-- Notifications — delivery records
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('slack', 'teams', 'email', 'webhook', 'in_app')),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  delivered BOOLEAN DEFAULT FALSE,
  execution_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE;

-- ---------------------------------------------------------------------------
-- Migrate kv_store data (if upgrading from JSONB store)
-- ---------------------------------------------------------------------------
-- NOTE: After running this migration, existing kv_store data for
-- persona_executions and agent_kpis should be migrated via the
-- gateway's migration script. The kv_store table remains for
-- non-critical ephemeral data (forum, blog, scheduler, etc.).
