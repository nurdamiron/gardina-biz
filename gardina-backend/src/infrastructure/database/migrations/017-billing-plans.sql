-- ============================================
-- MIGRATION 017: Billing plans + trial state
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS subscription_plans (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_users INTEGER NOT NULL,
    max_salons INTEGER NOT NULL,
    has_production_workflow BOOLEAN NOT NULL DEFAULT FALSE,
    has_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    has_network_analytics BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (
    code, name, description, max_users, max_salons,
    has_production_workflow, has_inventory, has_network_analytics
) VALUES
    ('start', 'Start', 'Entry plan for a small salon', 3, 1, FALSE, FALSE, FALSE),
    ('pro', 'Pro', 'Main working plan with full flow', 8, 1, TRUE, TRUE, FALSE),
    ('network', 'Network', 'Multi-salon plan with network analytics', 20, 999, TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    max_users = EXCLUDED.max_users,
    max_salons = EXCLUDED.max_salons,
    has_production_workflow = EXCLUDED.has_production_workflow,
    has_inventory = EXCLUDED.has_inventory,
    has_network_analytics = EXCLUDED.has_network_analytics,
    is_active = TRUE,
    updated_at = CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS current_plan_code VARCHAR(20) REFERENCES subscription_plans(code),
        ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
        ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'trial',
        ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS read_only_since TIMESTAMP,
        ADD COLUMN IF NOT EXISTS max_users_override INTEGER,
        ADD COLUMN IF NOT EXISTS max_salons_override INTEGER;

    UPDATE organizations
    SET
        current_plan_code = COALESCE(current_plan_code, 'start'),
        billing_cycle = COALESCE(billing_cycle, 'monthly'),
        subscription_status = COALESCE(subscription_status, 'trial'),
        trial_started_at = COALESCE(trial_started_at, CURRENT_TIMESTAMP),
        trial_ends_at = COALESCE(trial_ends_at, CURRENT_TIMESTAMP + INTERVAL '7 days')
    WHERE current_plan_code IS NULL
       OR billing_cycle IS NULL
       OR subscription_status IS NULL
       OR trial_started_at IS NULL
       OR trial_ends_at IS NULL;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
      CREATE TABLE IF NOT EXISTS organization_plan_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          actor_user_id UUID REFERENCES users(id),
          event_type VARCHAR(50) NOT NULL,
          from_plan_code VARCHAR(20),
          to_plan_code VARCHAR(20),
          from_status VARCHAR(20),
          to_status VARCHAR(20),
          from_billing_cycle VARCHAR(20),
          to_billing_cycle VARCHAR(20),
          details JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_plan_events') THEN
    CREATE INDEX IF NOT EXISTS idx_org_plan_events_org_created
        ON organization_plan_events (organization_id, created_at DESC);
  END IF;
END $$;

