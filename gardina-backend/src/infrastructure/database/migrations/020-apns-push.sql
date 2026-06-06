-- ============================================================
-- MIGRATION 020: APNs (native iOS) push support
-- Extends the existing push_subscriptions table (Web Push, from 015) to also
-- store native iOS device tokens. iOS rows use platform='ios', device_token=<token>
-- and a synthetic endpoint 'apns:<token>' so the existing UNIQUE(user_id, endpoint)
-- upsert key keeps registrations idempotent. Web Push rows are unaffected.
-- Mirrors the guarded block in server.js runAutoMigrations (safe to re-run).
-- ============================================================

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS device_token TEXT;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_token
  ON push_subscriptions(device_token) WHERE device_token IS NOT NULL;

COMMENT ON COLUMN push_subscriptions.platform IS 'Delivery platform: web (Web Push/VAPID) or ios (APNs)';
COMMENT ON COLUMN push_subscriptions.device_token IS 'APNs device token for platform=ios rows (null for web)';
