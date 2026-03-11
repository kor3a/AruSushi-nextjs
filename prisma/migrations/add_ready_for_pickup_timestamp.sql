-- Add ready_for_pickup_at timestamp to orders table
-- Records when an order's status was changed to "ready" (Ready for Pick Up)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMPTZ;
