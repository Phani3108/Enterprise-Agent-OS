-- Migration 004: Tables for budget intelligence, webhooks, vision, innovation,
--               agent improvement, and notification dispatch.
-- Run: psql -d eaos -f 004_missing_tables.sql
--
-- All tables use IF NOT EXISTS so re-running is safe.
--
-- @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
-- @copyright © 2026 Phani Marupaka. All rights reserved.

-- ---------------------------------------------------------------------------
-- Budget Intelligence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_budgets (
  agent_id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  regiment TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'quarterly', 'annual')),
  allocated_usd REAL NOT NULL DEFAULT 0,
  spent_usd REAL NOT NULL DEFAULT 0,
  token_count INTEGER NOT NULL DEFAULT 0,
  task_count INTEGER NOT NULL DEFAULT 0,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  alert_threshold_pct REAL NOT NULL DEFAULT 80,
  alert_fired BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_spend_log (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  execution_id TEXT,
  task_description TEXT NOT NULL DEFAULT '',
  token_count INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spend_log_agent ON agent_spend_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_spend_log_created ON agent_spend_log(created_at DESC);

CREATE TABLE IF NOT EXISTS cost_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('budget_threshold', 'burn_spike', 'overspend', 'unusual_pattern')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  agent_id TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_alerts_agent ON cost_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_ack ON cost_alerts(acknowledged) WHERE acknowledged = FALSE;

-- ---------------------------------------------------------------------------
-- Webhook Connector
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  delivery_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  secret TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  received_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_inbound_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  endpoint_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT '',
  payload JSONB DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_inbound_endpoint ON webhook_inbound_log(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_inbound_received ON webhook_inbound_log(received_at DESC);

-- ---------------------------------------------------------------------------
-- Vision & PMO
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vision_statements (
  id TEXT PRIMARY KEY,
  statement TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'decomposing', 'active', 'completed', 'archived')),
  decomposition JSONB,
  programs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vision_status ON vision_statements(status);

CREATE TABLE IF NOT EXISTS program_records (
  id TEXT PRIMARY KEY,
  vision_id TEXT NOT NULL REFERENCES vision_statements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'active', 'at-risk', 'completed')),
  owner_agent_id TEXT NOT NULL DEFAULT '',
  involved_regiments TEXT[] DEFAULT '{}',
  dependencies JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_vision ON program_records(vision_id);
CREATE INDEX IF NOT EXISTS idx_programs_status ON program_records(status);

-- ---------------------------------------------------------------------------
-- Innovation Labs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS innovation_experiments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'process',
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'proposed', 'approved', 'in-progress', 'completed', 'failed', 'archived')),
  hypothesis TEXT NOT NULL DEFAULT '',
  success_criteria TEXT NOT NULL DEFAULT '',
  results JSONB DEFAULT '[]',
  score REAL,
  proposed_by TEXT NOT NULL DEFAULT '',
  approved_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON innovation_experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_category ON innovation_experiments(category);

CREATE TABLE IF NOT EXISTS innovation_hackathons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed')),
  duration_ms BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  experiment_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS innovation_graduations (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES innovation_experiments(id),
  target_regiment TEXT NOT NULL DEFAULT '',
  target_skill_id TEXT,
  proposed_by TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_graduations_status ON innovation_graduations(status);

-- ---------------------------------------------------------------------------
-- Agent Improvement
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS performance_reviews (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  call_sign TEXT NOT NULL DEFAULT '',
  regiment TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT '',
  reviewed_by TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT 'meets'
    CHECK (outcome IN ('exceeds', 'meets', 'needs-improvement', 'underperforming')),
  overall_score REAL NOT NULL DEFAULT 5,
  quality_score REAL NOT NULL DEFAULT 5,
  speed_score REAL NOT NULL DEFAULT 5,
  cost_efficiency_score REAL NOT NULL DEFAULT 5,
  handoff_score REAL NOT NULL DEFAULT 5,
  reliability_score REAL NOT NULL DEFAULT 5,
  efficiency_score REAL NOT NULL DEFAULT 5,
  summary TEXT NOT NULL DEFAULT '',
  strengths TEXT[] DEFAULT '{}',
  improvement_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_agent ON performance_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_period ON performance_reviews(period);

CREATE TABLE IF NOT EXISTS improvement_plans (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  call_sign TEXT NOT NULL DEFAULT '',
  review_id TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in-progress', 'completed', 'abandoned')),
  title TEXT NOT NULL DEFAULT '',
  objectives JSONB DEFAULT '[]',
  target_date TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_agent ON improvement_plans(agent_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON improvement_plans(status);

CREATE TABLE IF NOT EXISTS agent_feedback (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  execution_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('positive', 'negative', 'correction')),
  category TEXT NOT NULL CHECK (category IN ('quality', 'speed', 'accuracy', 'handoff', 'cost', 'general')),
  feedback TEXT NOT NULL,
  submitted_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_agent ON agent_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON agent_feedback(created_at DESC);

CREATE TABLE IF NOT EXISTS training_exemplars (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  execution_id TEXT NOT NULL DEFAULT '',
  skill_name TEXT NOT NULL DEFAULT '',
  rating TEXT NOT NULL CHECK (rating IN ('exemplary', 'good', 'cautionary')),
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exemplars_agent ON training_exemplars(agent_id);
CREATE INDEX IF NOT EXISTS idx_exemplars_rating ON training_exemplars(rating);

-- ---------------------------------------------------------------------------
-- Notification Dispatch
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification_channels (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('slack', 'teams', 'email', 'webhook')),
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  event_pattern TEXT,
  channel_id TEXT NOT NULL REFERENCES notification_channels(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  template TEXT,
  recipient_override TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_rules_channel ON notification_rules(channel_id);
CREATE INDEX IF NOT EXISTS idx_notif_rules_enabled ON notification_rules(enabled) WHERE enabled = TRUE;

CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  rule_id TEXT,
  channel_id TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_log_channel ON notification_delivery_log(channel_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_created ON notification_delivery_log(created_at DESC);
