import pool from '../../src/infrastructure/database/config.js';
import bcrypt from 'bcryptjs';

/**
 * Clean all test data from database
 * Deletes records in correct order to respect FK constraints
 */
export async function cleanDatabase() {
  const client = await pool.connect();
  try {
    // Use TRUNCATE CASCADE for faster cleanup (auto-handles FK constraints)
    // But only for test tables - safer approach
    await client.query('BEGIN');

    // First, delete only test data
    await client.query("DELETE FROM deal_events WHERE deal_id IN (SELECT id FROM deals WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM payments WHERE deal_id IN (SELECT id FROM deals WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM installations WHERE deal_id IN (SELECT id FROM deals WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM orders WHERE deal_id IN (SELECT id FROM deals WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM proposals WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%')");
    await client.query("DELETE FROM photos WHERE measurement_id IN (SELECT id FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM room_items WHERE room_id IN (SELECT id FROM rooms WHERE measurement_id IN (SELECT id FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%')))");
    await client.query("DELETE FROM rooms WHERE measurement_id IN (SELECT id FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM measurement_windows WHERE measurement_id IN (SELECT id FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%'))");
    await client.query("DELETE FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%')");
    await client.query("DELETE FROM deals WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%')");
    await client.query("DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test%@test.com')");
    await client.query("DELETE FROM chat_messages WHERE client_id IN (SELECT id FROM clients WHERE name LIKE 'Test%')");

    // Delete test clients and users
    await client.query("DELETE FROM clients WHERE name LIKE 'Test%' OR phone LIKE '+7700%' OR phone LIKE '+7701%'");
    await client.query("DELETE FROM users WHERE email LIKE 'test%@test.com'");

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clean database:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Seed test users for all roles
 */
export async function seedTestUsers() {
  const client = await pool.connect();
  try {
    // Use bcrypt to hash passwords (same as in application code)
    const passwordHash = await bcrypt.hash('password', 10);
    
    const result = await client.query(`
      INSERT INTO users (name, phone, email, password_hash, role, is_active)
      VALUES
        ('Test Admin', '+77000000001', 'testadmin@test.com', $1, 'admin', true),
        ('Test Designer', '+77000000002', 'testdesigner@test.com', $1, 'designer', true),
        ('Test Manager', '+77000000003', 'testmanager@test.com', $1, 'manager', true),
        ('Test Production', '+77000000004', 'testproduction@test.com', $1, 'production', true),
        ('Test Installer', '+77000000005', 'testinstaller@test.com', $1, 'installer', true)
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        is_active = EXCLUDED.is_active
      RETURNING id, name, phone, email, role
    `, [passwordHash]);
    
    console.log(`✅ Seeded ${result.rows.length} test users`);
    return result.rows;
  } catch (error) {
    console.error('❌ Failed to seed test users:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Seed test clients
 */
export async function seedTestClients(createdBy) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO clients (name, phone, address, created_by)
      VALUES 
        ('Test Client 1', '+77011111111', 'Test Address 1, Almaty', $1),
        ('Test Client 2', '+77011111112', 'Test Address 2, Almaty', $1),
        ('Test Client 3', '+77011111113', 'Test Address 3, Astana', $1)
      RETURNING id, name, phone, address
    `, [createdBy]);
    
    console.log(`✅ Seeded ${result.rows.length} test clients`);
    return result.rows;
  } catch (error) {
    console.error('❌ Failed to seed test clients:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create test deal
 */
export async function createTestDeal({ clientId, designerId, status = 'scheduled' }) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO deals (client_id, designer_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [clientId, designerId, status]);
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to create test deal:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create test measurement
 */
export async function createTestMeasurement({ clientId, designerId, address }) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO measurements (client_id, designer_id, address, status)
      VALUES ($1, $2, $3, 'scheduled')
      RETURNING *
    `, [clientId, designerId, address || 'Test Address']);
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to create test measurement:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get test user by role
 */
export async function getTestUserByRole(role) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM users WHERE role = $1 AND email LIKE 'test%@test.com' LIMIT 1`,
      [role]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Get test user by phone or email (login)
 */
export async function getTestUserByLogin(login) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM users WHERE phone = $1 OR email = $1`,
      [login]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

/**
 * Create test data helpers
 */
export const testData = {
  createUser: (overrides = {}) => ({
    name: 'Test User',
    phone: `+7700${Math.floor(Math.random() * 10000000)}`,
    email: `testuser${Date.now()}@test.com`,
    password: 'testpassword123',
    role: 'designer',
    ...overrides,
  }),

  createClient: (overrides = {}) => ({
    name: 'Test Client',
    phone: `+7701${Math.floor(Math.random() * 10000000)}`,
    address: 'Test Address, Almaty',
    ...overrides,
  }),

  createDeal: (overrides = {}) => ({
    clientId: null, // Must be provided
    designerId: null, // Must be provided
    status: 'scheduled',
    ...overrides,
  }),

  createMeasurement: (overrides = {}) => ({
    clientId: null, // Must be provided
    designerId: null, // Must be provided
    address: 'Test Address for Measurement',
    status: 'scheduled',
    ...overrides,
  }),
};

