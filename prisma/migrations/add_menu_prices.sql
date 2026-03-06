-- Menu price overrides (admin-managed prices that override hardcoded defaults)
CREATE TABLE IF NOT EXISTS menu_prices (
  id             SERIAL PRIMARY KEY,
  menu_type      VARCHAR(10) NOT NULL,    -- 'lunch' or 'dinner'
  category       TEXT NOT NULL,
  item_name      TEXT NOT NULL,
  price          DECIMAL(10, 2) NOT NULL,
  updated_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(menu_type, category, item_name)
);

CREATE INDEX IF NOT EXISTS idx_menu_prices_lookup
  ON menu_prices (menu_type, category, item_name);
