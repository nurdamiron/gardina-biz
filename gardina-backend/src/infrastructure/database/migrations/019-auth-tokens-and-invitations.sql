-- ============================================
-- MIGRATION 019: Self-serve auth flows
-- - Password reset tokens
-- - Email verification tokens
-- - Team-member invitations (replace ad-hoc password sharing via WhatsApp)
-- - Tour/onboarding flags on users
-- - Generic counter for trial-warning emails so cron-worker is idempotent
-- ============================================

BEGIN;

-- 1. Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,        -- sha256 of the raw token, never the raw value
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at) WHERE used_at IS NULL;

-- 2. Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,             -- email at the time of issuance (in case user changes it)
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);

-- 3. Team-member invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  role VARCHAR(32) NOT NULL DEFAULT 'designer',
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email) -- one pending invite per email per org
);
CREATE INDEX IF NOT EXISTS idx_user_invitations_org ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_pending ON user_invitations(expires_at) WHERE accepted_at IS NULL;

-- 4. New columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 5. Trial-warning idempotency tracking on organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_warning_sent_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_expired_email_sent_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS canceled_email_sent_at TIMESTAMPTZ;

-- 6. Sample-data flag on demo entities created during onboarding
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT false;

COMMIT;
