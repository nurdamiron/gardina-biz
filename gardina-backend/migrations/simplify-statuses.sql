-- Migration: Simplify deal statuses to match real business process
-- Old: 12+ statuses
-- New: 6 simple statuses

-- Drop old enum and create new one
ALTER TYPE deal_status RENAME TO deal_status_old;

CREATE TYPE deal_status AS ENUM (
    'scheduled',      -- Жоспарланған (замер назначен)
    'measured',       -- Өлшем аяқталды (замер завершен, показываем сумму)
    'in_production',  -- Өндірісте (договор подписан, в производстве)
    'ready',          -- Дайын (готово к установке)
    'installing',     -- Орнатылуда (идет установка)
    'completed',      -- Аяқталды (все завершено)
    'cancelled',      -- Болдырылды (отменен клиентом/нами)
    'rejected'        -- Бас тартты (клиент отказался после замера)
);

-- Update deals table to use new enum
ALTER TABLE deals
    ALTER COLUMN status DROP DEFAULT,
    ALTER COLUMN status TYPE deal_status USING (
        CASE status::text
            WHEN 'lead' THEN 'scheduled'::deal_status
            WHEN 'measurement_scheduled' THEN 'scheduled'::deal_status
            WHEN 'measurement_done' THEN 'measured'::deal_status
            WHEN 'proposal_sent' THEN 'measured'::deal_status
            WHEN 'proposal_accepted' THEN 'measured'::deal_status
            WHEN 'contract_signed' THEN 'in_production'::deal_status
            WHEN 'in_production' THEN 'in_production'::deal_status
            WHEN 'ready_for_installation' THEN 'ready'::deal_status
            WHEN 'installation_scheduled' THEN 'ready'::deal_status
            WHEN 'installed' THEN 'installing'::deal_status
            WHEN 'completed' THEN 'completed'::deal_status
            WHEN 'cancelled' THEN 'cancelled'::deal_status
            ELSE 'scheduled'::deal_status
        END
    ),
    ALTER COLUMN status SET DEFAULT 'scheduled'::deal_status;

-- Drop old enum
DROP TYPE deal_status_old;

-- Add new fields for contract/prepayment tracking
ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS contract_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS production_deadline DATE,
    ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN deals.contract_photo_url IS 'URL фото подписанного договора';
COMMENT ON COLUMN deals.contract_signed_at IS 'Дата подписания договора';
COMMENT ON COLUMN deals.production_deadline IS 'Срок выполнения заказа';
COMMENT ON COLUMN deals.cost_breakdown IS 'Разбивка затрат: {materials: 0, services: 0, total: 0}';

SELECT 'Migration completed! Deal statuses simplified.' AS result;
