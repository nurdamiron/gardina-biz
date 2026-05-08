-- Migration: Fix timezone issues by converting TIMESTAMP to TIMESTAMPTZ
-- This ensures proper timezone handling in PostgreSQL

-- Measurements table
ALTER TABLE measurements
  ALTER COLUMN scheduled_at TYPE TIMESTAMPTZ USING scheduled_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN started_at TYPE TIMESTAMPTZ USING started_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Installations table
ALTER TABLE installations
  ALTER COLUMN scheduled_at TYPE TIMESTAMPTZ USING scheduled_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN started_at TYPE TIMESTAMPTZ USING started_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Proposals table
ALTER TABLE proposals
  ALTER COLUMN sent_at TYPE TIMESTAMPTZ USING sent_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN viewed_at TYPE TIMESTAMPTZ USING viewed_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN decided_at TYPE TIMESTAMPTZ USING decided_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Users table
ALTER TABLE users
  ALTER COLUMN last_login_at TYPE TIMESTAMPTZ USING last_login_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Clients table
ALTER TABLE clients
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Deals table
ALTER TABLE deals
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Orders table
ALTER TABLE orders
  ALTER COLUMN started_at TYPE TIMESTAMPTZ USING started_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN completed_at TYPE TIMESTAMPTZ USING completed_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Products table (formerly fabrics)
ALTER TABLE products
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Curtains table
ALTER TABLE curtains
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Measurement windows table
ALTER TABLE measurement_windows
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'Asia/Almaty';

-- Photos table
ALTER TABLE photos
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty';

-- Deal events table
ALTER TABLE deal_events
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty';

-- Notifications table
ALTER TABLE notifications
  ALTER COLUMN read_at TYPE TIMESTAMPTZ USING read_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty';

-- Chat messages table
ALTER TABLE chat_messages
  ALTER COLUMN read_at TYPE TIMESTAMPTZ USING read_at AT TIME ZONE 'Asia/Almaty',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Almaty';

-- Success message
SELECT 'Migration completed successfully! All TIMESTAMP columns converted to TIMESTAMPTZ.' AS result;
