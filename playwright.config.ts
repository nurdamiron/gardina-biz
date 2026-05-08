import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ru-RU',
    timezoneId: 'Asia/Almaty',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // Step 1: save auth sessions for each role
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Step 2: auth flow tests (no pre-saved session needed)
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Mobile Chrome'] },
    },

    // Step 3: role-specific tests using saved sessions
    {
      name: 'designer',
      testMatch: /designer\.spec\.ts/,
      use: {
        ...devices['Mobile Chrome'],
        storageState: 'specs/.auth/designer.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'manager',
      testMatch: /manager\.spec\.ts/,
      use: {
        ...devices['Mobile Chrome'],
        storageState: 'specs/.auth/manager.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Mobile Chrome'],
        storageState: 'specs/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'logic',
      testMatch: /logic\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
