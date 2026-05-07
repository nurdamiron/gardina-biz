-- ============================================
-- MIGRATION 018: push_subscriptions tenant scope
-- Fixes audit finding: push_subscriptions had no organization_id,
-- meaning a stolen JWT could subscribe an attacker's endpoint
-- and the per-tenant adminBroadcast would silently send to it
-- on global cleanup paths.
-- ============================================

BEGIN;

-- 1. Add organization_id (nullable first so we can backfill safely)
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Backfill from users
UPDATE push_subscriptions ps
SET organization_id = u.organization_id
FROM users u
WHERE ps.user_id = u.id
  AND ps.organization_id IS NULL;

-- 3. Drop any orphan rows (subscriptions whose owning user was deleted)
DELETE FROM push_subscriptions WHERE organization_id IS NULL;

-- 4. Enforce NOT NULL
ALTER TABLE push_subscriptions
  ALTER COLUMN organization_id SET NOT NULL;

-- 5. Indexes for tenant queries and cleanup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org
  ON push_subscriptions(organization_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org_active
  ON push_subscriptions(organization_id, is_active)
  WHERE is_active = true;

COMMENT ON COLUMN push_subscriptions.organization_id IS
  'Tenant scope. Always equals users.organization_id at subscribe time.';

COMMIT;
