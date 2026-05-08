-- ============================================
-- MIGRATION: ALTER PRODUCTS TABLE
-- Date: 2026-01-12
-- Description: Add missing columns to existing products table
-- ============================================

-- Add missing columns
ALTER TABLE products
ADD COLUMN IF NOT EXISTS code VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Generate codes for existing products (if they don't have one)
UPDATE products
SET code = 'PROD-' || SUBSTRING(id::text, 1, 8)
WHERE code IS NULL;

-- Make code unique and not null
ALTER TABLE products
ALTER COLUMN code SET NOT NULL;

-- Add unique constraint on code
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_code_key'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_code_key UNIQUE (code);
    END IF;
END$$;

-- Change type from ENUM to VARCHAR (if it's still ENUM)
DO $$
BEGIN
    -- Drop the constraint if exists
    ALTER TABLE products
    ALTER COLUMN type TYPE VARCHAR(50);

    -- Update existing values to new format
    UPDATE products
    SET type =
        CASE
            WHEN type::text = 'transparent' THEN 'fabric'
            WHEN type::text = 'semi_blackout' THEN 'fabric'
            WHEN type::text = 'blackout' THEN 'fabric'
            WHEN type::text = 'decorative' THEN 'fabric'
            ELSE 'fabric'
        END;

    -- Add check constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_type_check'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT products_type_check
        CHECK (type IN ('fabric', 'curtain', 'accessory', 'service'));
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter type column: %', SQLERRM;
END$$;

-- Create index on code if not exists
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- Create index on category if not exists
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category) WHERE category IS NOT NULL;

-- Add full-text search index if not exists
DROP INDEX IF EXISTS idx_products_search;
CREATE INDEX idx_products_search ON products USING gin(
    to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(code, '') || ' ' || coalesce(brand, ''))
);

-- Update comments
COMMENT ON COLUMN products.code IS 'Unique product code (e.g., TC-001, БП-001, PROD-xxx)';
COMMENT ON COLUMN products.type IS 'Product type: fabric, curtain, accessory, or service';
COMMENT ON COLUMN products.category IS 'Product category (optional grouping)';

-- Report current state
DO $$
DECLARE
    total_count INTEGER;
    with_code INTEGER;
    fabric_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM products;
    SELECT COUNT(*) INTO with_code FROM products WHERE code IS NOT NULL;
    SELECT COUNT(*) INTO fabric_count FROM products WHERE type = 'fabric';

    RAISE NOTICE 'Products table updated:';
    RAISE NOTICE '  - Total products: %', total_count;
    RAISE NOTICE '  - Products with code: %', with_code;
    RAISE NOTICE '  - Fabric products: %', fabric_count;
END $$;
