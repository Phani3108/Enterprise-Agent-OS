-- EOS Prompt Library, Tools Registry & Community Features
-- Run: psql -d eaos -f 002_prompt_library.sql

-- ---------------------------------------------------------------------------
-- Prompt categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prompt_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Prompt tags
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prompt_tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Prompts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','json','yaml','markdown')),
  category_id TEXT REFERENCES prompt_categories(id),
  source TEXT NOT NULL DEFAULT 'platform' CHECK (source IN ('platform','community','user')),
  source_url TEXT,
  target_tools TEXT[] DEFAULT '{universal}',
  version TEXT NOT NULL DEFAULT 'v1.0.0',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  forked_from TEXT REFERENCES prompts(id),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived','flagged')),
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'system',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  fork_count INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  flag_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_source ON prompts(source);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_featured ON prompts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompts_pinned ON prompts(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompts_upvotes ON prompts(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_tools ON prompts USING GIN(target_tools);

-- ---------------------------------------------------------------------------
-- Prompt ↔ Tag join table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS prompt_tag_map (
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES prompt_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Votes (upvote / downvote / flag on prompts or recommendations)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('prompt','recommendation')),
  target_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote','downvote','flag')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id, vote_type)
);

CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);

-- ---------------------------------------------------------------------------
-- Recommendations (user-submitted prompt suggestions)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT NOT NULL,
  category_id TEXT REFERENCES prompt_categories(id),
  submitted_by TEXT NOT NULL,
  submitted_by_name TEXT NOT NULL DEFAULT 'anonymous',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','promoted')),
  upvotes INTEGER NOT NULL DEFAULT 0,
  flag_count INTEGER NOT NULL DEFAULT 0,
  promoted_prompt_id TEXT REFERENCES prompts(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_upvotes ON recommendations(upvotes DESC);

-- ---------------------------------------------------------------------------
-- Tools registry (internal tools used by the platform)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tools_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  connector TEXT,
  auth_type TEXT DEFAULT 'none',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 1.0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_category ON tools_registry(category);
CREATE INDEX IF NOT EXISTS idx_tools_active ON tools_registry(is_active) WHERE is_active = TRUE;
