-- Create trigger function to automatically log deal status changes
CREATE OR REPLACE FUNCTION log_deal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO deal_events (deal_id, event_type, description, metadata, created_at)
    VALUES (NEW.id, 'status_changed', 'Статус: ' || OLD.status || ' → ' || NEW.status,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status), NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS deal_events_auto_log ON deals;

-- Create trigger
CREATE TRIGGER deal_events_auto_log
AFTER UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION log_deal_status_change();
