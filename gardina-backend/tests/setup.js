import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Test data generators (available globally in all tests)
global.createTestUser = (overrides = {}) => ({
  name: 'Test User',
  login: `testuser${Date.now()}`,
  phone: `+7700${Math.floor(Math.random() * 10000000)}`,
  password: 'testpassword',
  role: 'designer',
  ...overrides,
});

global.createTestClient = (overrides = {}) => ({
  name: 'Test Client',
  phone: `+7701${Math.floor(Math.random() * 10000000)}`,
  address: 'Test Address, Almaty',
  ...overrides,
});

global.createTestDeal = (overrides = {}) => ({
  clientId: null, // Must be provided
  designerId: null, // Must be provided  
  status: 'scheduled',
  ...overrides,
});

console.log('✅ Test environment initialized');
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🗄️  Database: ${process.env.DATABASE_NAME || 'shtory'}`);
