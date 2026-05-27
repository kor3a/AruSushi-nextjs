-- Add birthday column to users table
-- Captured during sign up; stored as a date (no time component)
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE;
