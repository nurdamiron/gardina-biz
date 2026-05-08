-- Migration: 015-notification-system.sql
-- Description: Full notification system with push subscriptions and preferences
-- Date: 2025-01-20

-- 1. User notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Deal notifications
  deal_status_inapp BOOLEAN DEFAULT true,
  deal_status_push BOOLEAN DEFAULT true,
  deal_status_sms BOOLEAN DEFAULT false,

  -- Payment notifications
  payment_inapp BOOLEAN DEFAULT true,
  payment_push BOOLEAN DEFAULT true,
  payment_sms BOOLEAN DEFAULT false,

  -- Task/Measurement notifications
  task_assigned_inapp BOOLEAN DEFAULT true,
  task_assigned_push BOOLEAN DEFAULT true,
  task_assigned_sms BOOLEAN DEFAULT false,

  -- Reminder notifications
  measurement_reminder_inapp BOOLEAN DEFAULT true,
  measurement_reminder_push BOOLEAN DEFAULT true,
  measurement_reminder_sms BOOLEAN DEFAULT true,

  -- Stock notifications (admin only)
  stock_low_inapp BOOLEAN DEFAULT true,
  stock_low_push BOOLEAN DEFAULT true,
  stock_low_sms BOOLEAN DEFAULT false,

  -- Proposal notifications
  proposal_viewed_inapp BOOLEAN DEFAULT true,
  proposal_viewed_push BOOLEAN DEFAULT true,
  proposal_viewed_sms BOOLEAN DEFAULT false,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 2. Push subscriptions for Web Push API
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- Metadata
  user_agent TEXT,
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One subscription per endpoint per user
  UNIQUE(user_id, endpoint)
);

-- 3. Notification delivery logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Delivery info
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('inapp', 'push', 'sms', 'whatsapp', 'email')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),

  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,

  -- Timing
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notification templates (for consistent messaging)
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type VARCHAR(50) NOT NULL UNIQUE,

  -- Templates with placeholders like {clientName}, {amount}
  title_template VARCHAR(255) NOT NULL,
  body_template TEXT NOT NULL,

  -- Default action URL pattern
  action_url_template VARCHAR(255),

  -- Icon for push notifications
  icon VARCHAR(50) DEFAULT 'notifications',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add notification_type column to existing notifications table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN event_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_type VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_id UUID;
  END IF;
END $$;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification ON notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notifications_event_type ON notifications(event_type);

-- 7. Insert default notification templates
INSERT INTO notification_templates (event_type, title_template, body_template, action_url_template, icon) VALUES
  ('deal.created', 'Жаңа тапсырыс', '{clientName} - жаңа тапсырыс тағайындалды', '/deals/{dealId}', 'assignment'),
  ('deal.status_changed', 'Тапсырыс статусы', '{clientName}: {oldStatus} → {newStatus}', '/deals/{dealId}', 'sync'),
  ('payment.received', 'Төлем түсті', '{clientName}: {amount} ₸ төлем түсті', '/deals/{dealId}', 'payments'),
  ('task.assigned', 'Жаңа тапсырма', '{clientName}, {address}', '/designer/measurements/{measurementId}', 'task'),
  ('measurement.scheduled', 'Өлшем жоспарланды', '{clientName} - {scheduledAt}', '/designer/measurements/{measurementId}', 'schedule'),
  ('measurement.reminder', 'Өлшем еске салу', '{clientName}, {address} - 1 сағаттан кейін', '/designer/measurements/{measurementId}', 'alarm'),
  ('stock.low', 'Қалдық аз', '{productName}: {quantity}м қалды', '/admin/catalog/products/{productId}', 'inventory'),
  ('proposal.sent', 'КП жіберілді', '{clientName} үшін КП жіберілді', '/measurements/{measurementId}/proposal', 'description'),
  ('proposal.viewed', 'КП қаралды', '{clientName} КП-ны қарады', '/measurements/{measurementId}/proposal', 'visibility'),
  ('proposal.accepted', 'КП қабылданды', '{clientName} КП-ны қабылдады!', '/deals/{dealId}', 'check_circle')
ON CONFLICT (event_type) DO NOTHING;

-- 8. Trigger to auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_notification_prefs ON users;
CREATE TRIGGER trg_create_notification_prefs
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- 9. Create preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- 10. Update timestamp trigger for preferences
CREATE OR REPLACE FUNCTION update_notification_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_notification_prefs_timestamp ON user_notification_preferences;
CREATE TRIGGER trg_update_notification_prefs_timestamp
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_timestamp();

COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification channels and quiet hours';
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions for each user device';
COMMENT ON TABLE notification_logs IS 'Delivery tracking for all notifications';
COMMENT ON TABLE notification_templates IS 'Templates for different notification event types';
