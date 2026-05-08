import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: /demo\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    ...devices['Desktop Chrome'],
    video: 'on',
    screenshot: 'off',
    trace: 'off',
    locale: 'ru-RU',
    timezoneId: 'Asia/Almaty',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    viewport: { width: 1512, height: 982 },
  },
});
