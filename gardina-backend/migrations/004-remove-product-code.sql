-- ============================================
-- MIGRATION: Remove code field from products
-- Date: 2024-12-17
-- Description: Remove code from products since we now use variant codes
-- ============================================

-- 1. Drop the unique constraint on code if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_code_key;

-- 2. Drop the index on code if it exists
DROP INDEX IF EXISTS idx_products_code;

-- 3. Drop the code column from products table
ALTER TABLE products DROP COLUMN IF EXISTS code;

-- Success message
SELECT 'Migration completed! Product code field removed. Codes are now managed at variant level.' AS result;