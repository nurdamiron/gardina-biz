-- ============================================
-- MIGRATION 016: Multi-tenant SaaS (organizations + organization_id)
-- Run once on existing DBs migrated from single-salon install.
-- Fresh SaaS installs: use init-database.js (already multi-tenant).
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT organizations_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

INSERT INTO organizations (name, slug)
SELECT 'Default salon', 'default'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Users: add org + relax global unique email/phone
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE users SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1)
  WHERE organization_id IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_phone ON users (organization_id, phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_email ON users (organization_id, email) WHERE email IS NOT NULL;

ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;

-- Core domain
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE clients SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
ALTER TABLE clients ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_organization ON clients(organization_id);

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE measurements m SET organization_id = c.organization_id FROM clients c WHERE c.id = m.client_id AND m.organization_id IS NULL;
ALTER TABLE measurements ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_measurements_organization ON measurements(organization_id);

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE proposals p SET organization_id = c.organization_id FROM clients c WHERE c.id = p.client_id AND p.organization_id IS NULL;
ALTER TABLE proposals ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_organization ON proposals(organization_id);

ALTER TABLE deals ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE deals d SET organization_id = c.organization_id FROM clients c WHERE c.id = d.client_id AND d.organization_id IS NULL;
ALTER TABLE deals ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_organization ON deals(organization_id);

ALTER TABLE deal_events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE deal_events e SET organization_id = d.organization_id FROM deals d WHERE d.id = e.deal_id AND e.organization_id IS NULL;
ALTER TABLE deal_events ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_events_organization ON deal_events(organization_id);

ALTER TABLE photos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE photos ph SET organization_id = m.organization_id FROM measurements m WHERE m.id = ph.measurement_id AND ph.organization_id IS NULL AND ph.measurement_id IS NOT NULL;
UPDATE photos ph SET organization_id = d.organization_id FROM deals d WHERE d.id = ph.deal_id AND ph.organization_id IS NULL AND ph.deal_id IS NOT NULL;
UPDATE photos SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
ALTER TABLE photos ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_organization ON photos(organization_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE orders o SET organization_id = d.organization_id FROM deals d WHERE d.id = o.deal_id AND o.organization_id IS NULL;
ALTER TABLE orders ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_organization ON orders(organization_id);

ALTER TABLE installations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE installations i SET organization_id = d.organization_id FROM deals d WHERE d.id = i.deal_id AND i.organization_id IS NULL;
ALTER TABLE installations ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_installations_organization ON installations(organization_id);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE notifications n SET organization_id = u.organization_id FROM users u WHERE u.id = n.user_id AND n.organization_id IS NULL;
ALTER TABLE notifications ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE chat_messages cm SET organization_id = d.organization_id FROM deals d WHERE d.id = cm.deal_id AND cm.organization_id IS NULL AND cm.deal_id IS NOT NULL;
UPDATE chat_messages cm SET organization_id = c.organization_id FROM clients c WHERE c.id = cm.client_id AND cm.organization_id IS NULL;
UPDATE chat_messages SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
ALTER TABLE chat_messages ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_organization ON chat_messages(organization_id);

-- Legacy catalog
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE fabrics SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
ALTER TABLE fabrics ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE fabrics DROP CONSTRAINT IF EXISTS fabrics_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fabrics_org_code ON fabrics (organization_id, code) WHERE code IS NOT NULL;

ALTER TABLE curtains ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE curtains SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
ALTER TABLE curtains ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE service_rates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE service_rates SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
ALTER TABLE service_rates ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_rates_organization ON service_rates(organization_id);

-- Products / brands (when tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    UPDATE products SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
    ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_code_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_org_code ON products (organization_id, code);
    CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    ALTER TABLE brands ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    UPDATE brands SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
    ALTER TABLE brands ALTER COLUMN organization_id SET NOT NULL;
    ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_name_key;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_org_name ON brands (organization_id, name);
    CREATE INDEX IF NOT EXISTS idx_brands_organization ON brands(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    UPDATE payments p SET organization_id = m.organization_id FROM measurements m WHERE m.id = p.measurement_id AND p.organization_id IS NULL AND p.measurement_id IS NOT NULL;
    UPDATE payments p SET organization_id = d.organization_id FROM deals d WHERE d.id = p.deal_id AND p.organization_id IS NULL AND p.deal_id IS NOT NULL;
    UPDATE payments p SET organization_id = ord.organization_id FROM orders ord WHERE ord.id = p.order_id AND p.organization_id IS NULL AND p.order_id IS NOT NULL;
    UPDATE payments SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
    ALTER TABLE payments ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_payments_organization ON payments(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deal_products') THEN
    ALTER TABLE deal_products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    UPDATE deal_products dp SET organization_id = d.organization_id FROM deals d WHERE d.id = dp.deal_id AND dp.organization_id IS NULL;
    ALTER TABLE deal_products ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_deal_products_organization ON deal_products(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_logs') THEN
    ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    UPDATE inventory_logs SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
    ALTER TABLE inventory_logs ALTER COLUMN organization_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_inventory_logs_organization ON inventory_logs(organization_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    UPDATE audit_logs SET organization_id = (SELECT id FROM organizations ORDER BY created_at LIMIT 1) WHERE organization_id IS NULL;
    ALTER TABLE audit_logs ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;
