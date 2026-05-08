-- ============================================
-- MIGRATION: FIX FOREIGN KEY CONTRADICTIONS
-- Date: 2026-01-12
-- Description: Fix NOT NULL + ON DELETE SET NULL contradictions
-- ============================================

BEGIN;

-- Fix measurements.designer_id
-- Problem: designer_id is NOT NULL but FK has ON DELETE SET NULL
-- Solution: Make designer_id nullable (allows keeping measurements even if designer is deleted)
ALTER TABLE measurements
ALTER COLUMN designer_id DROP NOT NULL;

COMMENT ON COLUMN measurements.designer_id IS 'Designer who performed/scheduled the measurement (nullable for deleted users)';

-- Fix deals.designer_id (same issue)
-- Check if it exists first
DO $$
BEGIN
    -- Check if designer_id in deals is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals'
        AND column_name = 'designer_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE deals ALTER COLUMN designer_id DROP NOT NULL;
        RAISE NOTICE 'Fixed deals.designer_id constraint';
    END IF;
END$$;

COMMENT ON COLUMN deals.designer_id IS 'Designer assigned to this deal (nullable for deleted users)';

-- Fix deals.client_id if needed
-- Note: client_id should remain NOT NULL with CASCADE delete since a deal without client makes no sense
DO $$
BEGIN
    -- Verify that client_id has ON DELETE CASCADE (not SET NULL)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'deals'
        AND kcu.column_name = 'client_id'
        AND rc.delete_rule = 'SET NULL'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE deals DROP CONSTRAINT deals_client_id_fkey;

        -- Recreate with CASCADE
        ALTER TABLE deals
        ADD CONSTRAINT deals_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

        RAISE NOTICE 'Fixed deals.client_id FK to use CASCADE instead of SET NULL';
    END IF;
END$$;

COMMIT;

-- Verification
SELECT 'Fixed FK contradictions:' as info;

SELECT
    table_name,
    column_name,
    is_nullable,
    'Should be YES for columns with ON DELETE SET NULL' as note
FROM information_schema.columns
WHERE table_name IN ('measurements', 'deals')
AND column_name IN ('designer_id', 'client_id')
ORDER BY table_name, column_name;

SELECT '✅ Migration completed successfully!' as result;
