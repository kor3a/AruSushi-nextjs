-- Transactional outbox.
--
-- Order creation writes the order, its items, and an outbox row inside one
-- transaction. A separate publisher process drains pending rows to SQS. This
-- is what closes the dual-write gap: without it, a crash between "order
-- committed" and "message enqueued" silently loses the notification.
CREATE TABLE IF NOT EXISTS outbox_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT        NOT NULL,
  aggregate_id  UUID        NOT NULL,
  payload       JSONB       NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending',
  attempts      INTEGER     NOT NULL DEFAULT 0,
  last_error    TEXT,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The publisher claims work with:
--   WHERE status = 'pending' ORDER BY created_at FOR UPDATE SKIP LOCKED
-- so this index is the one that matters.
CREATE INDEX IF NOT EXISTS outbox_events_status_created_at_idx
  ON outbox_events (status, created_at);

-- Consumer-side idempotency.
--
-- SQS standard queues are at-least-once: a message whose visibility timeout
-- expires mid-processing is redelivered. The unique constraint below turns a
-- duplicate delivery into a no-op rather than a second email to the customer.
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID        NOT NULL,
  channel    TEXT        NOT NULL,
  message_id TEXT,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_order_channel_idx
  ON notification_deliveries (order_id, channel);

-- Neither table is meant to be reachable through Supabase's public REST API
-- (outbox payloads reference customer orders). The app and worker connect as
-- the table owner via Prisma, which bypasses RLS, so enabling it with no
-- policies locks out anon/authenticated access without affecting them.
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
