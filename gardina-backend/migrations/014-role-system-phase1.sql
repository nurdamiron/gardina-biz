-- ============================================
-- MIGRATION 014: Role System Phase 1
-- Переименование manager → sales_manager
-- Добавление commission tracking
-- ============================================

BEGIN;

-- ============================================
-- 1. RENAME manager → sales_manager
-- ============================================

-- PostgreSQL не позволяет переименовать значение ENUM напрямую,
-- поэтому нужно создать новый тип и заменить

-- Сначала убираем DEFAULT, чтобы можно было изменить тип
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Создаём новый ENUM с правильными значениями
CREATE TYPE user_role_new AS ENUM ('designer', 'sales_manager', 'production', 'installer', 'admin');

-- Меняем тип колонки, при этом 'manager' → 'sales_manager'
ALTER TABLE users
ALTER COLUMN role TYPE user_role_new
USING (
    CASE role::text
        WHEN 'manager' THEN 'sales_manager'::user_role_new
        ELSE role::text::user_role_new
    END
);

-- Удаляем старый тип
DROP TYPE user_role;

-- Переименовываем новый тип
ALTER TYPE user_role_new RENAME TO user_role;

-- Восстанавливаем DEFAULT (теперь 'designer' вместо старого 'manager')
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'designer'::user_role;

-- ============================================
-- 2. ADD COMMISSION_RATE to users
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2);

COMMENT ON COLUMN users.commission_rate IS 'Commission rate in percentage (e.g., 40 = 40%)';

-- Устанавливаем дефолтные ставки для существующих ролей
UPDATE users SET commission_rate = 60 WHERE role = 'designer' AND commission_rate IS NULL;
UPDATE users SET commission_rate = 40 WHERE role = 'sales_manager' AND commission_rate IS NULL;
UPDATE users SET commission_rate = 15 WHERE role = 'installer' AND commission_rate IS NULL;

-- ============================================
-- 3. CREATE commission_splits TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS commission_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role user_role,

    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),

    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    paid_at TIMESTAMP,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Один пользователь может быть только один раз в одной сделке
    UNIQUE(deal_id, user_id)
);

CREATE INDEX idx_commission_splits_deal ON commission_splits(deal_id);
CREATE INDEX idx_commission_splits_user ON commission_splits(user_id);
CREATE INDEX idx_commission_splits_status ON commission_splits(status);
CREATE INDEX idx_commission_splits_role ON commission_splits(role);

COMMENT ON TABLE commission_splits IS 'Tracks commission distribution for each deal among team members';
COMMENT ON COLUMN commission_splits.user_id IS 'NULL for company share';
COMMENT ON COLUMN commission_splits.role IS 'Role at the time of commission (can differ from current user role)';

-- Trigger для updated_at
CREATE TRIGGER update_commission_splits_updated_at
BEFORE UPDATE ON commission_splits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ADD TEAM TRACKING to measurements
-- ============================================

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_measurements_assigned_to ON measurements(assigned_to);
CREATE INDEX IF NOT EXISTS idx_measurements_created_by ON measurements(created_by);

COMMENT ON COLUMN measurements.assigned_to IS 'User assigned to complete the measurement (designer or measurer role)';
COMMENT ON COLUMN measurements.created_by IS 'User who created the measurement record (sales_manager or designer)';

-- NOTE: We cannot add CHECK constraint with subquery in PostgreSQL
-- Validation of assigned_to role will be done in application layer

-- Для существующих measurements, назначаем на designer_id
UPDATE measurements SET assigned_to = designer_id WHERE assigned_to IS NULL AND designer_id IS NOT NULL;
UPDATE measurements SET created_by = designer_id WHERE created_by IS NULL AND designer_id IS NOT NULL;

-- ============================================
-- 5. ADD TEAM TRACKING to deals
-- ============================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS sales_manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS installer_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_locked BOOLEAN DEFAULT false;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_locked_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_locked_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_deals_sales_manager ON deals(sales_manager_id);
CREATE INDEX IF NOT EXISTS idx_deals_installer ON deals(installer_id);
CREATE INDEX IF NOT EXISTS idx_deals_commission_locked ON deals(commission_locked);

COMMENT ON COLUMN deals.sales_manager_id IS 'Sales manager who worked with the lead';
COMMENT ON COLUMN deals.installer_id IS 'Installer assigned to the deal';
COMMENT ON COLUMN deals.commission_locked IS 'Prevents commission changes after calculation';

-- ============================================
-- 6. ADD LEAD TRACKING to deals
-- ============================================

ALTER TABLE deals ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX IF NOT EXISTS idx_deals_source ON deals(source);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_priority ON deals(priority);

COMMENT ON COLUMN deals.source IS 'Lead source: instagram_dm, whatsapp, phone_call, website_form, referral, repeat_client';
COMMENT ON COLUMN deals.assigned_to IS 'User currently assigned to work on this deal/lead';
COMMENT ON COLUMN deals.priority IS 'Priority level for lead/deal processing';

-- ============================================
-- 7. ADD LEAD DATA to clients
-- ============================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_clients_priority ON clients(priority);
CREATE INDEX IF NOT EXISTS idx_clients_lead_source ON clients(lead_source);

COMMENT ON COLUMN clients.budget IS 'Expected budget from client';
COMMENT ON COLUMN clients.priority IS 'Client priority level';
COMMENT ON COLUMN clients.lead_source IS 'Original source of the lead';

-- Копируем source из deals если есть
UPDATE clients c
SET lead_source = d.source
FROM deals d
WHERE c.id = d.client_id
AND c.lead_source IS NULL
AND d.source IS NOT NULL;

-- ============================================
-- 8. EXTEND measurement_status ENUM
-- ============================================

-- Добавляем новые статусы
ALTER TYPE measurement_status ADD VALUE IF NOT EXISTS 'pending_assignment';
ALTER TYPE measurement_status ADD VALUE IF NOT EXISTS 'rescheduled';
ALTER TYPE measurement_status ADD VALUE IF NOT EXISTS 'no_show';

-- ============================================
-- 9. ADD INSTALLER TEAM to installations
-- ============================================

ALTER TABLE installations ADD COLUMN IF NOT EXISTS installer_2_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS requires_team BOOLEAN DEFAULT false;
ALTER TABLE installations ADD COLUMN IF NOT EXISTS complexity VARCHAR(20) DEFAULT 'standard' CHECK (complexity IN ('standard', 'complex', 'expert'));

CREATE INDEX IF NOT EXISTS idx_installations_installer_2 ON installations(installer_2_id);
CREATE INDEX IF NOT EXISTS idx_installations_complexity ON installations(complexity);

COMMENT ON COLUMN installations.installer_2_id IS 'Second installer for complex installations';
COMMENT ON COLUMN installations.requires_team IS 'Whether this installation requires 2+ installers';
COMMENT ON COLUMN installations.complexity IS 'Installation complexity level';

-- ============================================
-- 10. CREATE audit_log TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,

    action VARCHAR(50) NOT NULL,

    old_data JSONB,
    new_data JSONB,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);

COMMENT ON TABLE audit_log IS 'Audit trail for all entity changes in the system';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity: deal, measurement, client, proposal, user, etc.';
COMMENT ON COLUMN audit_log.action IS 'Action performed: created, updated, deleted, assigned, completed, etc.';

-- ============================================
-- 11. UPDATE EXISTING DATA
-- ============================================

-- Для существующих deals со статусом 'lead', назначаем на sales_manager если есть
UPDATE deals d
SET assigned_to = (
    SELECT id FROM users WHERE role = 'sales_manager' LIMIT 1
)
WHERE status = 'lead'
AND assigned_to IS NULL;

-- Для deals с designer_id, копируем в sales_manager_id если это был полный цикл
UPDATE deals
SET sales_manager_id = designer_id
WHERE status IN ('lead', 'measurement_scheduled')
AND sales_manager_id IS NULL
AND designer_id IS NOT NULL;

-- ============================================
-- VERIFY MIGRATION
-- ============================================

DO $$
DECLARE
    role_count INTEGER;
    commission_splits_count INTEGER;
    audit_log_count INTEGER;
BEGIN
    -- Check user_role ENUM has sales_manager
    SELECT COUNT(*) INTO role_count
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
    AND e.enumlabel = 'sales_manager';

    IF role_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: sales_manager role not found in user_role ENUM';
    END IF;

    -- Check commission_splits table exists
    SELECT COUNT(*) INTO commission_splits_count
    FROM information_schema.tables
    WHERE table_name = 'commission_splits';

    IF commission_splits_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: commission_splits table not created';
    END IF;

    -- Check audit_log table exists
    SELECT COUNT(*) INTO audit_log_count
    FROM information_schema.tables
    WHERE table_name = 'audit_log';

    IF audit_log_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: audit_log table not created';
    END IF;

    RAISE NOTICE '✅ Migration 014 completed successfully!';
    RAISE NOTICE '   - user_role ENUM updated (manager → sales_manager)';
    RAISE NOTICE '   - commission_rate added to users';
    RAISE NOTICE '   - commission_splits table created';
    RAISE NOTICE '   - Team tracking added to measurements and deals';
    RAISE NOTICE '   - Lead tracking added to deals and clients';
    RAISE NOTICE '   - audit_log table created';
END $$;

COMMIT;
