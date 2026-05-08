-- Migration: Simplify Deal Statuses (Proper way)
-- Date: 2025-12-13

BEGIN;

-- Step 1: Drop unused tables
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS curtains CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_items CASCADE;
DROP TABLE IF EXISTS installations CASCADE;

-- Step 2: Add new status values to existing enum (can't remove, only add)
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'new';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'measuring';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'in_sewing';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'corrections';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'ready_to_install';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'installing';

-- Step 3: Map existing deals to new statuses
UPDATE deals SET status = 'new' WHERE status = 'lead';
UPDATE deals SET status = 'assigned' WHERE status = 'measurement_scheduled';
UPDATE deals SET status = 'in_sewing' WHERE status IN ('contract_signed', 'in_production');
UPDATE deals SET status = 'ready_to_install' WHERE status = 'ready_for_installation';
UPDATE deals SET status = 'installing' WHERE status IN ('installation_scheduled', 'installed');

-- Step 4: Create trigger function for auto-logging deal events
CREATE OR REPLACE FUNCTION log_deal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
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
      'Статус өзгерді: ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW()
      ),
      NOW()
    );
  END IF;

  -- Log payment changes
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO deal_events (
      deal_id,
      event_type,
      description,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'payment_updated',
      'Төлем статусы: ' || OLD.payment_status || ' → ' || NEW.payment_status,
      jsonb_build_object(
        'old_payment_status', OLD.payment_status,
        'new_payment_status', NEW.payment_status,
        'prepayment', NEW.prepayment,
        'final_payment', NEW.final_payment,
        'changed_at', NOW()
      ),
      NOW()
    );
  END IF;

  -- Log total amount changes
  IF OLD.total_amount IS DISTINCT FROM NEW.total_amount AND NEW.total_amount IS NOT NULL THEN
    INSERT INTO deal_events (
      deal_id,
      event_type,
      description,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      'amount_set',
      'Жалпы құн белгіленді: ' || NEW.total_amount || ' ₸',
      jsonb_build_object(
        'total_amount', NEW.total_amount,
        'changed_at', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger
DROP TRIGGER IF EXISTS deal_events_auto_log ON deals;

CREATE TRIGGER deal_events_auto_log
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_status_change();

-- Step 6: Create initial events for existing deals
INSERT INTO deal_events (deal_id, event_type, description, metadata, created_at)
SELECT
  d.id,
  'deal_created',
  'Тапсырыс құрылды: ' || c.name,
  jsonb_build_object(
    'client_id', d.client_id,
    'client_name', c.name,
    'designer_id', d.designer_id,
    'initial_status', d.status
  ),
  d.created_at
FROM deals d
LEFT JOIN clients c ON d.client_id = c.id
WHERE d.id NOT IN (
  SELECT deal_id FROM deal_events WHERE event_type = 'deal_created'
);

-- Step 7: Link measurements to deals automatically
INSERT INTO deal_events (deal_id, event_type, description, metadata, created_at)
SELECT
  d.id,
  'measurement_linked',
  'Өлшем байланыстырылды: ' || m.id,
  jsonb_build_object(
    'measurement_id', m.id,
    'scheduled_at', m.scheduled_at,
    'address', m.address,
    'windows_count', (SELECT COUNT(*) FROM measurement_windows WHERE measurement_id = m.id)
  ),
  m.created_at
FROM deals d
JOIN measurements m ON d.measurement_id = m.id
WHERE d.id NOT IN (
  SELECT deal_id FROM deal_events WHERE event_type = 'measurement_linked'
);

COMMIT;

-- Verification
SELECT 'Unused tables dropped:' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('orders', 'curtains', 'rooms', 'installations', 'room_items');

SELECT 'New deal statuses:' as info;
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'deal_status'
ORDER BY enumsortorder;

SELECT 'Deal events count:' as info, COUNT(*) as total FROM deal_events;

SELECT '✅ Migration completed successfully!' as result;
