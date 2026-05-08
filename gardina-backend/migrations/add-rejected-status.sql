-- Add 'rejected' status to deal_status enum
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'rejected';

COMMENT ON TYPE deal_status IS 'Simplified deal statuses: scheduled, measured, in_production, ready, installing, completed, cancelled, rejected';
