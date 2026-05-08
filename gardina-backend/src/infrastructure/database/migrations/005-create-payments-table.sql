-- ============================================
-- MIGRATION: CREATE PAYMENTS TABLE
-- Date: 2026-01-12
-- Description: Create payments table for tracking all payment transactions
-- ============================================

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('prepayment', 'final', 'partial', 'refund')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    note TEXT,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'online')),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- At least one of these must be set
    CHECK (
        measurement_id IS NOT NULL OR
        order_id IS NOT NULL OR
        deal_id IS NOT NULL
    )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_measurement ON payments(measurement_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_deal ON payments(deal_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE payments IS 'Stores all payment transactions for measurements, orders, and deals';
COMMENT ON COLUMN payments.type IS 'Type of payment: prepayment, final, partial, or refund';
COMMENT ON COLUMN payments.payment_method IS 'Method of payment: cash, card, transfer, or online';
