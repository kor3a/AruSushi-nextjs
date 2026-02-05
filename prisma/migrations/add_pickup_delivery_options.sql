-- Migration: Add pickup and delivery options
-- This migration adds orderType, delivery fee, and DoorDash delivery tracking columns to the orders table

-- Add orderType column (defaults to 'pickup')
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'pickup' NOT NULL;

-- Add delivery fee column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2);

-- Add DoorDash delivery tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS doordash_delivery_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS doordash_delivery_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS doordash_tracking_url TEXT;

-- Add index on orderType for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- Add index on doordashDeliveryId for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_doordash_delivery_id ON orders(doordash_delivery_id) WHERE doordash_delivery_id IS NOT NULL;
