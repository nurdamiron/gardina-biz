-- Migration: Simplify Deal Statuses
-- Date: 2025-12-13
-- Description: Simplify deal_status enum to match actual business process

BEGIN;

-- 1. Drop unused tables that are empty
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS curtains CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_items CASCADE;
DROP TABLE IF EXISTS installations CASCADE;

-- 2. Update existing deals to new status mapping
-- Map old statuses to new simplified ones
UPDATE deals SET status = 'new'::deal_status WHERE status = 'lead'::deal_status;

-- 3. Create new enum type for simplified statuses
CREATE TYPE deal_status_new AS ENUM (
  'new',                 -- Новый заказ (клиент дал адрес и время)
  'assigned',            -- Назначен дизайнер
  'measuring',           -- Замер идет (дизайнер на месте)
  'measurement_done',    -- Замер завершен
  'in_sewing',           -- В пошиве
  'corrections',         -- Правки (если нужно)
  'ready_to_install',    -- Готово к установке
  'installing',          -- Установка идет
  'completed',           -- Завершено
  'cancelled'            -- Отменено
);

-- 4. Alter deals table to use new enum
ALTER TABLE deals
  ALTER COLUMN status TYPE deal_status_new
  USING (
    CASE status::text
      WHEN 'lead' THEN 'new'
      WHEN 'measurement_scheduled' THEN 'assigned'
      WHEN 'measurement_done' THEN 'measurement_done'
      WHEN 'proposal_sent' THEN 'measurement_done'
      WHEN 'proposal_accepted' THEN 'measurement_done'
      WHEN 'contract_signed' THEN 'in_sewing'
      WHEN 'in_production' THEN 'in_sewing'
      WHEN 'ready_for_installation' THEN 'ready_to_install'
      WHEN 'installation_scheduled' THEN 'installing'
      WHEN 'installed' THEN 'installing'
      WHEN 'completed' THEN 'completed'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE 'new'
    END::deal_status_new
  );

-- 5. Drop old enum type
DROP TYPE IF EXISTS deal_status CASCADE;

-- 6. Rename new enum to original name
ALTER TYPE deal_status_new RENAME TO deal_status;

-- 7. Set default for new deals
ALTER TABLE deals
  ALTER COLUMN status SET DEFAULT 'new'::deal_status;

-- 8. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);

-- 9. Add trigger to auto-create deal_events on status change
CREATE OR REPLACE FUNCTION log_deal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO deal_events (
      deal_id,
      event_type,
      description,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'status_changed',
      'Статус изменен: ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS deal_status_change_trigger ON deals;

-- Create trigger
CREATE TRIGGER deal_status_change_trigger
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_status_change();

-- 10. Add initial event for existing deals
INSERT INTO deal_events (deal_id, event_type, description, metadata, created_at)
SELECT
  id,
  'deal_created',
  'Тапсырыс құрылды',
  jsonb_build_object(
    'client_id', client_id,
    'designer_id', designer_id,
    'initial_status', status
  ),
  created_at
FROM deals
WHERE id NOT IN (SELECT deal_id FROM deal_events WHERE event_type = 'deal_created');

COMMIT;

-- Verify changes
SELECT
  enumlabel as status,
  COUNT(*) as count
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'deal_status'
GROUP BY enumlabel, enumsortorder
ORDER BY enumsortorder;

SELECT 'Migration completed successfully!' as message;
