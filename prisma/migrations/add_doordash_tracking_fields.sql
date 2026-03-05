-- Add DoorDash dasher tracking fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dasher_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dasher_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dasher_latitude DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dasher_longitude DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_pickup_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_dropoff_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_dropoff_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_last_event TEXT;
