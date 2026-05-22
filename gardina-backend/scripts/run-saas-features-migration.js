/**
 * Migration: SaaS features — email verification + user invitations
 * Run: node scripts/run-saas-features-migration.js
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const SQL = `
-- ── Email verification ────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(128) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  used_at     TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evt_token ON email_verification_tokens(token);

-- ── User invitations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_invitations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            VARCHAR(255) NOT NULL,
  name             VARCHAR(255),
  role             VARCHAR(50) NOT NULL DEFAULT 'designer',
  token            VARCHAR(128) NOT NULL UNIQUE,
  invited_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at       TIMESTAMP NOT NULL,
  accepted_at      TIMESTAMP,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ui_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_ui_org ON user_invitations(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ui_org_email ON user_invitations(organization_id, email) WHERE accepted_at IS NULL;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('Running SaaS features migration…');
    await client.query(SQL);
    console.log('✅  Migration complete.');
  } catch (e) {
    console.error('❌  Migration failed:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
