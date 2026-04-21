-- Migration 006 — Audit Log Hardening
-- Adds hash-chain columns to audit_log for tamper-evident persistence.
-- The gateway's in-memory SHA-256 chain is now backed by this table.

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS hash      TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS result    TEXT NOT NULL DEFAULT 'success';

CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_hash   ON audit_log(hash);
