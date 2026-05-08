import pool from '../config.js';

/**
 * Migration: Add catalog system tables
 * - ALTER fabrics: add cost_price, width_cm, brand
 * - CREATE service_rates
 * - CREATE rooms
 * - CREATE room_items
 */

const migrationSQL = `
-- ============================================
-- MIGRATION: CATALOG SYSTEM
-- Date: 2024-12-13
-- ============================================

-- 1. ALTER fabrics table: add cost_price, width_cm, brand
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS width_cm INTEGER DEFAULT 280;
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Set default cost_price as 70% of sell price
UPDATE fabrics SET cost_price = price_per_meter * 0.7 WHERE cost_price IS NULL;

-- 2. ALTER curtains table: add cost_price
ALTER TABLE curtains ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2);
UPDATE curtains SET cost_price = price * 0.7 WHERE cost_price IS NULL;

-- ============================================
-- NEW TABLES
-- ============================================

-- 3. Service types enum
DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('sewing', 'installation', 'delivery', 'measurement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE calc_method AS ENUM ('per_meter', 'per_window', 'per_item', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Service rates table
CREATE TABLE IF NOT EXISTS service_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type service_type NOT NULL,
    calc_method calc_method NOT NULL DEFAULT 'per_meter',
    base_rate DECIMAL(10,2) NOT NULL,
    complexity_simple DECIMAL(3,2) DEFAULT 1.0,
    complexity_medium DECIMAL(3,2) DEFAULT 1.3,
    complexity_complex DECIMAL(3,2) DEFAULT 2.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rooms table (rooms within a measurement)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    order_number INTEGER NOT NULL DEFAULT 1,
    window_count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rooms_measurement ON rooms(measurement_id);

-- 6. Room items table (items within a room)
CREATE TABLE IF NOT EXISTS room_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    
    -- What is this item (one of three)
    fabric_id UUID REFERENCES fabrics(id) ON DELETE SET NULL,
    curtain_id UUID REFERENCES curtains(id) ON DELETE SET NULL,
    service_id UUID REFERENCES service_rates(id) ON DELETE SET NULL,
    
    -- Quantity
    quantity DECIMAL(10,2) NOT NULL,
    
    -- Price snapshot at order time (protection against price changes)
    unit_cost_at_order DECIMAL(10,2),
    unit_price_at_order DECIMAL(10,2),
    
    -- Complexity for services
    complexity VARCHAR(20) DEFAULT 'simple',
    
    -- Design photo
    design_photo_url TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_items_room ON room_items(room_id);
CREATE INDEX IF NOT EXISTS idx_room_items_fabric ON room_items(fabric_id);
CREATE INDEX IF NOT EXISTS idx_room_items_curtain ON room_items(curtain_id);

-- 7. Seed default service rates
INSERT INTO service_rates (name, service_type, calc_method, base_rate, description) 
VALUES 
    ('Пошив стандарт', 'sewing', 'per_meter', 4000, 'Стандартный пошив штор'),
    ('Монтаж', 'installation', 'per_window', 5000, 'Установка карниза и штор на одно окно'),
    ('Выезд на замер', 'measurement', 'fixed', 0, 'Бесплатный выезд на замер')
ON CONFLICT DO NOTHING;

-- 8. Seed sample fabrics for testing
INSERT INTO fabrics (code, name, type, price_per_meter, cost_price, width_cm, supplier, brand, is_available) 
VALUES 
    ('TC-001', 'Velvet Soft', 'semi_blackout', 15000, 10000, 280, 'Турция', 'Premium', true),
    ('TC-002', 'Canvas Linen', 'blackout', 25000, 17000, 280, 'Италия', 'Luxury', true),
    ('TC-003', 'Sheer White', 'transparent', 8000, 5000, 300, 'Китай', 'Economy', true),
    ('TC-004', 'Royal Jacquard', 'blackout', 35000, 24000, 280, 'Италия', 'Royal', true)
ON CONFLICT (code) DO UPDATE SET
    cost_price = EXCLUDED.cost_price,
    width_cm = EXCLUDED.width_cm,
    brand = EXCLUDED.brand;

-- Trigger for service_rates updated_at
CREATE OR REPLACE FUNCTION update_service_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_rates_updated_at ON service_rates;
CREATE TRIGGER update_service_rates_updated_at 
    BEFORE UPDATE ON service_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for rooms updated_at
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting catalog migration...');
    
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Catalog migration completed successfully!');
    console.log('');
    console.log('Added:');
    console.log('  - fabrics: cost_price, width_cm, brand columns');
    console.log('  - curtains: cost_price column');
    console.log('  - service_rates table with default rates');
    console.log('  - rooms table');
    console.log('  - room_items table');
    console.log('  - Sample fabrics: TC-001, TC-002, TC-003, TC-004');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default runMigration;
