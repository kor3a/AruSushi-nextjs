-- Monthly and birthday member perks.
-- A perk is available when the member's rank includes it and there is no row
-- for the current period. Monthly perks use 'YYYY-MM' (restaurant time) as
-- the period key and the birthday treat uses 'YYYY', so unused perks simply
-- lapse when the period rolls over — nothing needs to be reset.

CREATE TABLE IF NOT EXISTS member_perk_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perk_type TEXT NOT NULL CHECK (perk_type IN (
    'monthly_percent_off',
    'monthly_free_appetizer',
    'monthly_free_roll',
    'birthday_treat'
  )),
  period_key TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, perk_type, period_key)
);

-- Only the server (via Prisma) touches this table. RLS with no policies keeps
-- it out of reach of the public anon key, matching the other tables.
ALTER TABLE member_perk_uses ENABLE ROW LEVEL SECURITY;
