-- ============================================
-- MIGRATION: CREATE UNIFIED PRODUCTS TABLE
-- Date: 2026-01-12
-- Description: Create unified products table to replace fabrics and curtains
-- ============================================

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fabric', 'curtain', 'accessory', 'service')),
    category VARCHAR(100),

    -- Pricing
    price_per_meter DECIMAL(10,2),
    cost_price DECIMAL(10,2),

    -- Fabric-specific fields
    width_cm INTEGER DEFAULT 280,
    brand VARCHAR(100),
    supplier VARCHAR(255),

    -- General fields
    description TEXT,
    image_url TEXT,
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'meter' CHECK (unit IN ('meter', 'piece', 'set', 'item')),

    -- Status
    is_available BOOLEAN DEFAULT true,

    -- Additional properties (JSON)
    properties JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('russian', name));
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier) WHERE supplier IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(
    to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(code, '') || ' ' || coalesce(brand, ''))
);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATE DATA FROM FABRICS TABLE
-- ============================================

-- Migrate fabrics -> products
INSERT INTO products (
    id, name, code, type, price_per_meter, cost_price, width_cm,
    brand, supplier, image_url, stock_quantity, is_available,
    properties, created_at, updated_at, description, category
)
SELECT
    id,
    name,
    code,
    'fabric' as type,
    price_per_meter,
    cost_price,
    COALESCE(width_cm, 280) as width_cm,
    brand,
    supplier,
    image_url,
    COALESCE(stock_quantity, 0) as stock_quantity,
    COALESCE(is_available, true) as is_available,
    COALESCE(properties, '{}'::jsonb) as properties,
    created_at,
    updated_at,
    description,
    NULL as category
FROM fabrics
WHERE code IS NOT NULL
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- MIGRATE DATA FROM CURTAINS TABLE
-- ============================================

-- Migrate curtains -> products
-- Note: curtains don't have 'code', so we'll generate one
INSERT INTO products (
    id, name, code, type, price_per_meter, category,
    image_url, is_available, properties, created_at, updated_at
)
SELECT
    id,
    name,
    'CURT-' || SUBSTRING(id::text, 1, 8) as code,
    'curtain' as type,
    price,
    type as category,
    image_url,
    COALESCE(is_available, true) as is_available,
    COALESCE(properties, '{}'::jsonb) as properties,
    created_at,
    updated_at
FROM curtains
ON CONFLICT (code) DO NOTHING;

-- Add comments
COMMENT ON TABLE products IS 'Unified table for all products: fabrics, curtains, accessories, and services';
COMMENT ON COLUMN products.type IS 'Product type: fabric, curtain, accessory, or service';
COMMENT ON COLUMN products.code IS 'Unique product code (e.g., TC-001, БП-001)';
COMMENT ON COLUMN products.unit IS 'Unit of measurement: meter, piece, set, or item';

-- Report migration stats
DO $$
DECLARE
    fabric_count INTEGER;
    curtain_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fabric_count FROM products WHERE type = 'fabric';
    SELECT COUNT(*) INTO curtain_count FROM products WHERE type = 'curtain';
    SELECT COUNT(*) INTO total_count FROM products;

    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  - Fabrics migrated: %', fabric_count;
    RAISE NOTICE '  - Curtains migrated: %', curtain_count;
    RAISE NOTICE '  - Total products: %', total_count;
END $$;
