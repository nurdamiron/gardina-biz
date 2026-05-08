import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// SQL скрипт для создания базы данных и всех таблиц
const initDatabaseSQL = `
-- ============================================
-- GARDINA DATABASE INITIALIZATION
-- Domain-Driven Design Architecture
-- ============================================

-- Создаём расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS (типы данных)
-- ============================================

CREATE TYPE user_role AS ENUM ('designer', 'manager', 'production', 'installer', 'admin', 'sales');
CREATE TYPE measurement_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE mounting_type AS ENUM ('wall', 'ceiling', 'frame', 'niche');
CREATE TYPE photo_type AS ENUM ('room', 'window', 'upper_zone', 'obstacle', 'fabric_sample', 'after_installation', 'other');
CREATE TYPE fabric_type AS ENUM ('transparent', 'semi_blackout', 'blackout', 'decorative');
CREATE TYPE curtain_type AS ENUM ('ceiling', 'wall', 'profile');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected');
CREATE TYPE deal_status AS ENUM (
    'lead',
    'measurement_scheduled',
    'measurement_done',
    'proposal_sent',
    'proposal_accepted',
    'contract_signed',
    'in_production',
    'ready_for_installation',
    'installation_scheduled',
    'installed',
    'completed',
    'cancelled'
);
CREATE TYPE order_status AS ENUM ('pending', 'cutting', 'sewing', 'quality_check', 'ready', 'shipped');
CREATE TYPE installation_status AS ENUM ('scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled');
CREATE TYPE notification_type AS ENUM ('urgent', 'warning', 'info');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');

-- ============================================
-- DOMAIN: ORGANIZATIONS (SaaS tenants)
-- ============================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- DOMAIN: USER MANAGEMENT
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'designer',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_org_phone ON users (organization_id, phone);
CREATE UNIQUE INDEX idx_users_org_email ON users (organization_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization ON users(organization_id);

-- ============================================
-- DOMAIN: CLIENT MANAGEMENT
-- ============================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    source VARCHAR(100),
    tags TEXT[],
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_organization ON clients(organization_id);

-- ============================================
-- DOMAIN: MEASUREMENT (Замеры)
-- ============================================

CREATE TABLE measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    status measurement_status DEFAULT 'scheduled',
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    address TEXT NOT NULL,
    room_type VARCHAR(100),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    deadline DATE,
    client_reaction VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_client ON measurements(client_id);
CREATE INDEX idx_measurements_designer ON measurements(designer_id);
CREATE INDEX idx_measurements_status ON measurements(status);
CREATE INDEX idx_measurements_scheduled_at ON measurements(scheduled_at);
CREATE INDEX idx_measurements_organization ON measurements(organization_id);

-- Windows in measurements
CREATE TABLE measurement_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
    window_number INTEGER NOT NULL,
    room_name VARCHAR(100),

    -- Dimensions (в миллиметрах)
    width_left INTEGER,
    width_center INTEGER,
    width_right INTEGER,
    height_left INTEGER,
    height_center INTEGER,
    height_right INTEGER,

    -- Mounting details
    mounting_type mounting_type,
    top_offset INTEGER,
    sill_height INTEGER,

    -- Obstacles (JSON array)
    obstacles JSONB DEFAULT '[]'::jsonb,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_windows_measurement ON measurement_windows(measurement_id);

-- ============================================
-- DOMAIN: CATALOG (Каталоги)
-- ============================================

CREATE TABLE fabrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    type fabric_type NOT NULL,
    price_per_meter DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    supplier VARCHAR(255),
    stock_quantity INTEGER DEFAULT 0,
    min_order_meters DECIMAL(10,2) DEFAULT 1,
    is_available BOOLEAN DEFAULT true,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fabrics_code ON fabrics(code);
CREATE INDEX idx_fabrics_type ON fabrics(type);
CREATE INDEX idx_fabrics_available ON fabrics(is_available);
CREATE UNIQUE INDEX idx_fabrics_org_code ON fabrics (organization_id, code) WHERE code IS NOT NULL;
CREATE INDEX idx_fabrics_organization ON fabrics(organization_id);

CREATE TABLE curtains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type curtain_type NOT NULL,
    material VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    length_cm INTEGER,
    image_url TEXT,
    supplier VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_curtains_type ON curtains(type);
CREATE INDEX idx_curtains_available ON curtains(is_available);
CREATE INDEX idx_curtains_organization ON curtains(organization_id);

-- ============================================
-- DOMAIN: PROPOSALS (Коммерческие предложения)
-- ============================================

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

    variant_name VARCHAR(100),

    fabric_id UUID REFERENCES fabrics(id) ON DELETE SET NULL,
    fabric_meters DECIMAL(10,2),
    fabric_cost DECIMAL(10,2),

    curtain_id UUID REFERENCES curtains(id) ON DELETE SET NULL,
    curtain_cost DECIMAL(10,2),

    sewing_cost DECIMAL(10,2),
    installation_cost DECIMAL(10,2),
    additional_costs JSONB DEFAULT '[]'::jsonb,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,

    status proposal_status DEFAULT 'draft',
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    decided_at TIMESTAMP,

    pdf_url TEXT,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_designer ON proposals(designer_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_organization ON proposals(organization_id);

-- ============================================
-- DOMAIN: DEALS (Сделки - Aggregate Root)
-- ============================================

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

    status deal_status DEFAULT 'lead',

    total_amount DECIMAL(10,2),
    prepayment DECIMAL(10,2) DEFAULT 0,
    prepayment_percent DECIMAL(5,2) DEFAULT 50,
    final_payment DECIMAL(10,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',

    deadline DATE,

    designer_commission_percent DECIMAL(5,2) DEFAULT 7,
    designer_commission DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deals_client ON deals(client_id);
CREATE INDEX idx_deals_designer ON deals(designer_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_deadline ON deals(deadline);
CREATE INDEX idx_deals_organization ON deals(organization_id);

-- Deal timeline/history
CREATE TABLE deal_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deal_events_deal ON deal_events(deal_id);
CREATE INDEX idx_deal_events_organization ON deal_events(organization_id);

-- Photos (moved here after deals table creation)
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    measurement_id UUID REFERENCES measurements(id) ON DELETE CASCADE,
    window_id UUID REFERENCES measurement_windows(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    photo_type photo_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_measurement ON photos(measurement_id);
CREATE INDEX idx_photos_window ON photos(window_id);
CREATE INDEX idx_photos_deal ON photos(deal_id);
CREATE INDEX idx_photos_organization ON photos(organization_id);

-- ============================================
-- DOMAIN: PRODUCTION (Производство)
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    status order_status DEFAULT 'pending',

    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

    tech_card_url TEXT,
    tech_specs JSONB DEFAULT '{}'::jsonb,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_completion DATE,

    issues TEXT,
    quality_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_deal ON orders(deal_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_assigned ON orders(assigned_to);
CREATE INDEX idx_orders_organization ON orders(organization_id);

-- ============================================
-- DOMAIN: INSTALLATION (Монтаж)
-- ============================================

CREATE TABLE installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

    installer_id UUID REFERENCES users(id) ON DELETE SET NULL,

    status installation_status DEFAULT 'scheduled',

    scheduled_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    address TEXT NOT NULL,
    client_phone VARCHAR(50),
    client_contact_name VARCHAR(255),

    notes TEXT,
    completion_notes TEXT,
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_installations_deal ON installations(deal_id);
CREATE INDEX idx_installations_installer ON installations(installer_id);
CREATE INDEX idx_installations_status ON installations(status);
CREATE INDEX idx_installations_scheduled ON installations(scheduled_at);
CREATE INDEX idx_installations_organization ON installations(organization_id);

-- ============================================
-- DOMAIN: NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,

    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_organization ON notifications(organization_id);

-- ============================================
-- DOMAIN: COMMUNICATION
-- ============================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('designer', 'manager', 'client')),
    sender_id UUID,

    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,

    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_deal ON chat_messages(deal_id);
CREATE INDEX idx_messages_client ON chat_messages(client_id);
CREATE INDEX idx_messages_organization ON chat_messages(organization_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_measurement_windows_updated_at BEFORE UPDATE ON measurement_windows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fabrics_updated_at BEFORE UPDATE ON fabrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_curtains_updated_at BEFORE UPDATE ON curtains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON installations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (demo organization + admin user)
-- ============================================

INSERT INTO organizations (name, slug)
VALUES ('Gardina', 'demo');

INSERT INTO users (organization_id, name, email, phone, password_hash, role)
SELECT id, 'Admin', 'admin@gardina.kz', '+77001234567', crypt('admin123', gen_salt('bf')), 'admin'
FROM organizations WHERE slug = 'demo' LIMIT 1;

`;

// Функция для инициализации БД
async function initializeDatabase() {
  const adminClient = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres', // подключаемся к служебной БД
    ssl: process.env.DATABASE_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Проверяем существует ли база данных
    const checkDbResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DATABASE_NAME]
    );

    if (checkDbResult.rows.length === 0) {
      console.log(`📦 Creating database "${process.env.DATABASE_NAME}"...`);
      await adminClient.query(`CREATE DATABASE ${process.env.DATABASE_NAME}`);
      console.log(`✅ Database "${process.env.DATABASE_NAME}" created successfully`);
    } else {
      console.log(`✅ Database "${process.env.DATABASE_NAME}" already exists`);
    }

    await adminClient.end();

    // Теперь подключаемся к созданной БД и создаём таблицы
    const appClient = new Client({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false
    });

    await appClient.connect();
    console.log(`✅ Connected to database "${process.env.DATABASE_NAME}"`);

    console.log('📝 Creating tables and schema...');
    await appClient.query(initDatabaseSQL);
    console.log('✅ All tables created successfully!');

    await appClient.end();

    console.log('\n🎉 Database initialization completed!\n');
    console.log('Default admin credentials:');
    console.log('  Email: admin@gardina.kz');
    console.log('  Phone: +77001234567');
    console.log('  Password: admin123');
    console.log('\n⚠️  Please change the admin password after first login!\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Запуск если файл вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default initializeDatabase;
