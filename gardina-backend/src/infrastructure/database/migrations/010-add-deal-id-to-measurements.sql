-- ============================================
-- MIGRATION: ADD DEAL_ID TO MEASUREMENTS
-- Date: 2026-01-12
-- Description: Add deal_id column to measurements for bi-directional linking
-- ============================================

-- Add deal_id column to measurements
ALTER TABLE measurements 
ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_measurements_deal_id ON measurements(deal_id);

-- Add comment for documentation
COMMENT ON COLUMN measurements.deal_id IS 'Optional link back to the deal that created this measurement';

-- ============================================
-- VERIFICATION
-- ============================================
-- Check column was added:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'measurements' AND column_name = 'deal_id';
