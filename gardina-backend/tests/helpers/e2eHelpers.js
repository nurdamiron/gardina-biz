import request from 'supertest';
import app from '../../src/server.js';

/**
 * Get test user from global.testUsers by role
 */
export function getTestUser(role = 'designer') {
  if (!global.testUsers || global.testUsers.length === 0) {
    throw new Error('Test users not seeded. Check setup.e2e.js');
  }

  const user = global.testUsers.find(u => u.role === role);
  if (!user) {
    throw new Error(`Test user with role "${role}" not found`);
  }

  return user;
}

/**
 * Login and get access token
 */
export async function loginAsUser(role = 'designer') {
  const user = getTestUser(role);

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      login: user.email,
      password: 'password',
    });

  if (response.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${JSON.stringify(response.body)}`);
  }

  return {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    user: response.body.data.user,
  };
}

/**
 * Create test client
 */
export async function createTestClient(accessToken, clientData = {}) {
  const defaultData = {
    name: `Test Client ${Date.now()}`,
    phone: `+7701${Math.floor(Math.random() * 10000000)}`.slice(0, 12),
    address: 'Test Address, Almaty',
  };

  const response = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ ...defaultData, ...clientData });

  if (response.status !== 201) {
    throw new Error(`Failed to create client: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
}

/**
 * Create test deal
 */
export async function createTestDeal(accessToken, dealData = {}) {
  const response = await request(app)
    .post('/api/deals')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dealData);

  if (response.status !== 201) {
    throw new Error(`Failed to create deal: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
}

/**
 * Create test measurement
 */
export async function createTestMeasurement(accessToken, measurementData = {}) {
  const defaultData = {
    address: 'Test Measurement Address',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  };

  const response = await request(app)
    .post('/api/measurements')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ ...defaultData, ...measurementData });

  if (response.status !== 201) {
    throw new Error(`Failed to create measurement: ${JSON.stringify(response.body)}`);
  }

  return response.body.data;
}

/**
 * Setup common E2E test environment
 * Returns { accessToken, user, client }
 */
export async function setupE2ETest(role = 'designer') {
  const { accessToken, user } = await loginAsUser(role);
  const client = await createTestClient(accessToken);

  return {
    accessToken,
    user,
    client,
  };
}

/**
 * Generate unique phone number
 */
export function uniquePhone(prefix = '+7701') {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 12);
}

/**
 * Generate unique email
 */
export function uniqueEmail() {
  return `test${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;
}
