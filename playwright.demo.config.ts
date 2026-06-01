import { defineConfig, devices } from '@playwright/test';

/**
 * Demo-video capture config. Records 1920x1080 desktop video per role
 * against the LOCAL demo stack:
 *   frontend http://localhost:5174  ->  backend :5055  ->  db gardina_demo
 *
 * Single role: npx playwright test --config=playwright.demo.config.ts --project=designer
 * All roles:   npx playwright test --config=playwright.demo.config.ts
 * Videos:      specs/demos/.videos/<test-dir>/video.webm
 */
const BASE = process.env.DEMO_BASE_URL || 'http://localhost:5174';

export default defineConfig({
  testDir: './specs/demos',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: './specs/demos/.videos',
  use: {
    baseURL: BASE,
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    video: { mode: 'on', size: { width: 1920, height: 1080 } },
    screenshot: 'off',
    trace: 'off',
    locale: 'ru-RU',
    timezoneId: 'Asia/Almaty',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    // Natural, watchable cursor/typing cadence on camera.
    launchOptions: { slowMo: 280 },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'admin',
      testMatch: /admin\.demo\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'specs/.auth/demo-admin.json' },
    },
    {
      name: 'manager',
      testMatch: /manager\.demo\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'specs/.auth/demo-manager.json' },
    },
    {
      name: 'designer',
      testMatch: /designer\.demo\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'specs/.auth/demo-designer.json' },
    },
    {
      name: 'sales',
      testMatch: /sales\.demo\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'specs/.auth/demo-sales.json' },
    },
  ],
});
