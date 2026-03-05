-- Store-level settings (singleton row)
CREATE TABLE IF NOT EXISTS store_settings (
  id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  orders_paused        BOOLEAN   NOT NULL DEFAULT FALSE,
  pause_reason         TEXT,
  paused_at            TIMESTAMPTZ,
  resume_at            TIMESTAMPTZ,
  paused_by_email      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the singleton row so queries always return a result
INSERT INTO store_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
