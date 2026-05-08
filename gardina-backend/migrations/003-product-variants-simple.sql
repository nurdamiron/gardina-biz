-- ============================================
-- MIGRATION: Simple Product Variants System
-- Date: 2024-12-17
-- Description: Add product variants (codes) for fabrics
-- ============================================

-- 1. Create product_variants table (for different codes of same product)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_code VARCHAR(100) NOT NULL, -- Код варианта (например: "BL-001", "BL-002")
    variant_name VARCHAR(255), -- Название варианта (например: "Көк", "Қара", "Royal Blue")
    hex_color VARCHAR(7), -- HEX код для визуализации (необязательно)
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT, -- Фото этого конкретного варианта
    is_available BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Основной вариант
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, variant_code) -- У каждого продукта код варианта уникален
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_available ON product_variants(is_available);
CREATE INDEX IF NOT EXISTS idx_product_variants_code ON product_variants(variant_code);

-- 2. Add trigger for product_variants updated_at
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Create default variant for existing products (especially fabrics)
INSERT INTO product_variants (product_id, variant_code, variant_name, stock_quantity, is_available, is_default)
SELECT
    id as product_id,
    code as variant_code, -- Use product code as default variant code
    'Стандарт' as variant_name,
    COALESCE(stock_quantity, 0) as stock_quantity,
    is_available,
    true as is_default
FROM products
WHERE type IN ('curtain', 'tulle') -- Only for fabric types
AND NOT EXISTS (
    SELECT 1 FROM product_variants pv
    WHERE pv.product_id = products.id
);

-- 4. Add comment to table
COMMENT ON TABLE product_variants IS 'Варианты продуктов с разными кодами (для тканей - разные цвета/артикулы)';
COMMENT ON COLUMN product_variants.variant_code IS 'Уникальный код варианта продукта';
COMMENT ON COLUMN product_variants.variant_name IS 'Название варианта (обычно цвет)';
COMMENT ON COLUMN product_variants.is_default IS 'Основной вариант, отображаемый по умолчанию';

-- Success message
SELECT 'Migration completed! Product variants system added successfully.' AS result;