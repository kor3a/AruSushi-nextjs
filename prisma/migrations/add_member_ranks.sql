-- Member ranking system: Silver → Rose Gold → Platinum → Diamond
-- Ranks expire after 1 year, reverting to Silver.

CREATE TABLE IF NOT EXISTS member_ranks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  rank TEXT NOT NULL DEFAULT 'silver' CHECK (rank IN ('silver', 'rose_gold', 'platinum', 'diamond')),
  rank_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rank_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  free_appetizer_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  free_roll_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  last_monthly_appetizer_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_ranks_expires
  ON member_ranks(rank_expires_at);
