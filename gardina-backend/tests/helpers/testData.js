// Test data factory for creating test objects

export const createTestUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+77001234567',
  role: 'designer',
  is_active: true,
  ...overrides,
});

export const createTestClient = (overrides = {}) => ({
  id: '223e4567-e89b-12d3-a456-426614174000',
  name: 'Test Client',
  phone: '+77009876543',
  whatsapp: '+77009876543',
  email: 'client@example.com',
  address: 'Almaty, Kazakhstan',
  notes: 'Test notes',
  source: 'instagram',
  created_by: '123e4567-e89b-12d3-a456-426614174000',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createTestDeal = (overrides = {}) => ({
  id: '323e4567-e89b-12d3-a456-426614174000',
  client_id: '223e4567-e89b-12d3-a456-426614174000',
  designer_id: '123e4567-e89b-12d3-a456-426614174000',
  status: 'lead',
  payment_status: 'pending',
  prepayment_percent: 50,
  designer_commission_percent: 7,
  prepayment: 0,
  final_payment: 0,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createTestMeasurement = (overrides = {}) => ({
  id: '423e4567-e89b-12d3-a456-426614174000',
  client_id: '223e4567-e89b-12d3-a456-426614174000',
  designer_id: '123e4567-e89b-12d3-a456-426614174000',
  status: 'scheduled',
  scheduled_at: new Date(Date.now() + 86400000), // Tomorrow
  address: 'Almaty, Kazakhstan',
  room_type: 'living_room',
  budget_min: 50000,
  budget_max: 100000,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createTestProposal = (overrides = {}) => ({
  id: '523e4567-e89b-12d3-a456-426614174000',
  measurement_id: '423e4567-e89b-12d3-a456-426614174000',
  client_id: '223e4567-e89b-12d3-a456-426614174000',
  designer_id: '123e4567-e89b-12d3-a456-426614174000',
  variant_name: 'Вариант 1',
  fabric_cost: 50000,
  sewing_cost: 20000,
  curtain_cost: 15000,
  installation_cost: 10000,
  total_cost: 95000,
  status: 'draft',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createJWTToken = (payload = {}) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'designer',
      ...payload,
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};
