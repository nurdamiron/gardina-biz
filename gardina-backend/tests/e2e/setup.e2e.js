import { cleanDatabase, seedTestUsers } from '../helpers/database.js';
import pool from '../../src/infrastructure/database/config.js';

// Setup before all e2e tests
beforeAll(async () => {
  console.log('🧪 Setting up E2E test environment...');

  try {
    // Clean database
    console.log('   Cleaning database...');
    await cleanDatabase();
    console.log('   ✅ Database cleaned');

    // Seed test users
    console.log('   Seeding test users...');
    const users = await seedTestUsers();
    console.log(`   ✅ Seeded ${users.length} test users`);

    global.testUsers = users;

    // Helper function to get test user by role
    global.getTestUser = (role) => {
      return users.find(u => u.role === role);
    };

    console.log('✅ E2E test environment ready');
    console.log(`👥 Test users available:`, users.map(u => `${u.email} (${u.role})`).join(', '));
  } catch (error) {
    console.error('❌ E2E setup failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}, 30000); // Increase timeout for setup

// Cleanup after all e2e tests
// NOTE: Don't clean database here as it runs after EACH test file
// This would delete test users while other test files are still running
afterAll(async () => {
  // Don't clean database or close pool here
  // Jest will handle cleanup after all test files complete
});

// Cleanup between test suites
afterEach(async () => {
  // Optional: clean up test data created during tests
  // Можно оставить пустым если хотим сохранять данные между тестами в одном файле
});
