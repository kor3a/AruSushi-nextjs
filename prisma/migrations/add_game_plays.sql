-- Daily Conveyor Catch mini game.
-- Run after add_user_points_rewards.sql, in your Supabase/PostgreSQL database.

-- Game prizes are stored as reward redemptions so checkout applies them like
-- any other claimed reward. They cost no points and expire after a week.
ALTER TABLE reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_points_cost_check;
ALTER TABLE reward_redemptions ADD CONSTRAINT reward_redemptions_points_cost_check CHECK (points_cost >= 0);
ALTER TABLE reward_redemptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- One row per member per game per day. play_date is 'YYYY-MM-DD' in
-- restaurant time, and the unique key is what limits members to one play a
-- day. The row is written when the round starts, so quitting a losing round
-- still uses up the day's play.
CREATE TABLE IF NOT EXISTS game_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL CHECK (game IN ('conveyor_catch')),
  play_date TEXT NOT NULL,
  -- When the round's gold plate appears, decided by the server; NULL means no gold plate
  gold_at_ms INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  score INTEGER,
  caught_gold BOOLEAN NOT NULL DEFAULT FALSE,
  redemption_id UUID REFERENCES reward_redemptions(id) ON DELETE SET NULL,
  UNIQUE (user_id, game, play_date)
);

-- Only the server (via Prisma) touches this table, matching the other tables.
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;
