-- EOS Initial Database Schema
-- Run: psql -d eaos -f 001_initial.sql

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id TEXT NOT NULL,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  definition JSONB NOT NULL,
  requirements JSONB NOT NULL,
  output_contract JSONB NOT NULL,
  governance JSONB NOT NULL,
  evaluation JSONB NOT NULL DEFAULT '{"totalExecutions":0,"successRate":0,"avgConfidence":0,"avgGroundingScore":0,"avgLatencyMs":0,"avgCostUsd":0,"userSatisfaction":0,"editRate":0,"qualityTier":"experimental"}',
  lifecycle_state TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  PRIMARY KEY (id, version)
);

CREATE INDEX IF NOT EXISTS idx_skills_domain ON skills(domain);
CREATE INDEX IF NOT EXISTS idx_skills_state ON skills(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_skills_tags ON skills USING GIN(tags);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  progress REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  result JSONB,
  trace JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Approval requests table
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_metadata JSONB DEFAULT '{}',
  sensitivity TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approvers TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approval_requests(status);

-- Execution history table
CREATE TABLE IF NOT EXISTS execution_history (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  skill_id TEXT,
  worker TEXT NOT NULL,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  sources JSONB DEFAULT '[]',
  confidence REAL,
  grounding_score REAL,
  latency_ms INTEGER,
  cost_usd REAL,
  model TEXT,
  tokens_used INTEGER,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_executions_session ON execution_history(session_id);
CREATE INDEX IF NOT EXISTS idx_executions_worker ON execution_history(worker);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
