-- ============================================
-- MIGRATION: CREATE PRODUCT VARIANTS TABLE
-- Date: 2026-01-12
-- Description: Create product_variants table for storing color/article variants
-- ============================================

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_code VARCHAR(100) NOT NULL,
    variant_name VARCHAR(255),
    hex_color VARCHAR(7),
    stock_quantity DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: one product can't have duplicate variant codes
    CONSTRAINT product_variants_unique_code UNIQUE (product_id, variant_code)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_code ON product_variants(variant_code);
CREATE INDEX IF NOT EXISTS idx_product_variants_available ON product_variants(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_default ON product_variants(is_default) WHERE is_default = true;

-- Create trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE product_variants IS 'Stores different variants (colors/articles) for products';
COMMENT ON COLUMN product_variants.variant_code IS 'Article code or color code (e.g., A-001, B-123)';
COMMENT ON COLUMN product_variants.hex_color IS 'Hex color code for visual display (e.g., #FF5733)';
COMMENT ON COLUMN product_variants.is_default IS 'Whether this is the default variant to show';

-- Report current state
DO $$
DECLARE
    total_variants INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_variants FROM product_variants;
    RAISE NOTICE 'Product variants table created';
    RAISE NOTICE '  - Total variants: %', total_variants;
END $$;
