-- ============================================
-- MIGRATION: INVENTORY SYSTEM
-- Date: 2026-01-12
-- Description: Add variant tracking and inventory logs
-- ============================================

-- 1. Add variant_id links to transaction tables
ALTER TABLE room_items 
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

ALTER TABLE deal_products
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_room_items_variant ON room_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_deal_products_variant ON deal_products(variant_id);

-- 2. Create Inventory Logs Table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    -- Changes
    change_amount DECIMAL(10,2) NOT NULL, -- Negative for deduction, positive for restock
    previous_stock DECIMAL(10,2), -- Snapshot
    new_stock DECIMAL(10,2),      -- Snapshot

    -- Context
    reason VARCHAR(50) NOT NULL, -- 'sale', 'manual_adjustment', 'restock', 'return'
    reference_id UUID, -- deal_id or null if manual
    reference_type VARCHAR(50), -- 'deal', 'manual'
    
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_variant ON inventory_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);

-- 3. Report
DO $$
BEGIN
    RAISE NOTICE 'Inventory System schema updated successfully';
    RAISE NOTICE ' - Added variant_id to room_items and deal_products';
    RAISE NOTICE ' - Created inventory_logs table';
END $$;
