-- ============================================
-- MIGRATION: Brand and Color System for Products
-- Date: 2024-12-17
-- Description: Add brand management and color variants for products
-- ============================================

-- 1. Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100), -- Страна производителя (Турция, Италия, Китай и т.д.)
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

-- 2. Create product_colors table (color variants for products)
CREATE TABLE IF NOT EXISTS product_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_name VARCHAR(255) NOT NULL, -- Название цвета (например: "Royal Blue", "Кремовый")
    color_code VARCHAR(50) NOT NULL, -- Код цвета у производителя (например: "RB-001", "CR-25")
    hex_color VARCHAR(7), -- HEX код для визуализации (например: "#0033A0")
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT, -- Фото этого конкретного цвета
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, color_code) -- У каждого продукта код цвета уникален
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_colors_available ON product_colors(is_available);

-- 3. Add brand_id to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

-- 4. Migrate existing brand data to new brands table
-- First, insert unique brands from products table
INSERT INTO brands (name, country)
SELECT DISTINCT
    brand as name,
    CASE
        WHEN lower(brand) LIKE '%турц%' OR lower(brand) = 'турция' THEN 'Турция'
        WHEN lower(brand) LIKE '%итал%' OR lower(brand) = 'италия' THEN 'Италия'
        WHEN lower(brand) LIKE '%кита%' OR lower(brand) = 'китай' OR lower(brand) = 'қытай' THEN 'Китай'
        WHEN lower(brand) LIKE '%ресе%' OR lower(brand) = 'ресей' OR lower(brand) = 'россия' THEN 'Россия'
        WHEN lower(brand) LIKE '%казах%' OR lower(brand) LIKE '%қазақ%' THEN 'Казахстан'
        ELSE NULL
    END as country
FROM products
WHERE brand IS NOT NULL AND brand != ''
ON CONFLICT (name) DO NOTHING;

-- 5. Update products to link with brand_id
UPDATE products p
SET brand_id = b.id
FROM brands b
WHERE p.brand = b.name;

-- 6. Create sample color variants for existing products
-- This will add default color for each existing product based on its name
INSERT INTO product_colors (product_id, color_name, color_code, hex_color, stock_quantity, is_available)
SELECT
    id as product_id,
    CASE
        WHEN lower(name) LIKE '%ақ%' OR lower(name) LIKE '%white%' THEN 'Ақ'
        WHEN lower(name) LIKE '%қара%' OR lower(name) LIKE '%black%' THEN 'Қара'
        WHEN lower(name) LIKE '%көк%' OR lower(name) LIKE '%blue%' THEN 'Көк'
        WHEN lower(name) LIKE '%қоңыр%' OR lower(name) LIKE '%brown%' THEN 'Қоңыр'
        WHEN lower(name) LIKE '%крем%' OR lower(name) LIKE '%cream%' THEN 'Кремді'
        WHEN lower(name) LIKE '%беж%' OR lower(name) LIKE '%beige%' THEN 'Бежевый'
        WHEN lower(name) LIKE '%алтын%' OR lower(name) LIKE '%gold%' THEN 'Алтын'
        WHEN lower(name) LIKE '%сұр%' OR lower(name) LIKE '%grey%' OR lower(name) LIKE '%gray%' THEN 'Сұр'
        ELSE 'Стандарт'
    END as color_name,
    UPPER(LEFT(code, 3) || '-001') as color_code, -- Generate basic color code
    CASE
        WHEN lower(name) LIKE '%ақ%' OR lower(name) LIKE '%white%' THEN '#FFFFFF'
        WHEN lower(name) LIKE '%қара%' OR lower(name) LIKE '%black%' THEN '#000000'
        WHEN lower(name) LIKE '%көк%' OR lower(name) LIKE '%blue%' THEN '#0033A0'
        WHEN lower(name) LIKE '%қоңыр%' OR lower(name) LIKE '%brown%' THEN '#8B4513'
        WHEN lower(name) LIKE '%крем%' OR lower(name) LIKE '%cream%' THEN '#FFFDD0'
        WHEN lower(name) LIKE '%беж%' OR lower(name) LIKE '%beige%' THEN '#F5F5DC'
        WHEN lower(name) LIKE '%алтын%' OR lower(name) LIKE '%gold%' THEN '#FFD700'
        WHEN lower(name) LIKE '%сұр%' OR lower(name) LIKE '%grey%' OR lower(name) LIKE '%gray%' THEN '#808080'
        ELSE NULL
    END as hex_color,
    COALESCE(stock_quantity, 0) as stock_quantity,
    is_available
FROM products
WHERE NOT EXISTS (
    SELECT 1 FROM product_colors pc
    WHERE pc.product_id = products.id
);

-- 7. Add trigger for product_colors updated_at
CREATE TRIGGER update_product_colors_updated_at
    BEFORE UPDATE ON product_colors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Add trigger for brands updated_at
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Add comment to tables
COMMENT ON TABLE brands IS 'Таблица брендов/производителей тканей и штор';
COMMENT ON TABLE product_colors IS 'Цветовые варианты продуктов с кодами производителя';
COMMENT ON COLUMN product_colors.color_code IS 'Уникальный код цвета от производителя';
COMMENT ON COLUMN product_colors.hex_color IS 'HEX код цвета для визуального отображения';

-- Success message
SELECT 'Migration completed! Brand and color system added successfully.' AS result;