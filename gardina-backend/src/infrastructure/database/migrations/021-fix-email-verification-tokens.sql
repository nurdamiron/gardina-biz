-- ============================================================
-- MIGRATION 021: Fix email_verification_tokens for one-row-per-user upsert
-- AuthController._sendVerificationEmail does
--   INSERT ... ON CONFLICT (user_id) DO UPDATE ...
-- but 019 never gave user_id a UNIQUE constraint, so every resend attempt
-- 500'd with "no unique or exclusion constraint matching ON CONFLICT".
-- Safe to re-run: guarded, and adding a UNIQUE constraint is a no-op if a
-- user somehow already has more than one row would fail loudly instead of
-- silently, which is what we want caught rather than masked.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_verification_tokens_user_id_key'
  ) THEN
    ALTER TABLE email_verification_tokens
      ADD CONSTRAINT email_verification_tokens_user_id_key UNIQUE (user_id);
  END IF;
END $$;
