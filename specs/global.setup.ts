/**
 * Global setup: logs in as each role and saves auth state to disk.
 * This runs once before all test suites.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:5173';

async function loginAs(
  page: any,
  login: string,
  password: string,
  savePath: string,
) {
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('Логиніңізді енгізіңіз').fill(login);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /Кіру/i }).click();
  // Wait for redirect away from /login
  await page.waitForURL((url: URL) => !url.pathname.includes('/login'), {
    timeout: 10_000,
  });
  await page.context().storageState({ path: savePath });
}

setup('save designer auth', async ({ page }) => {
  await loginAs(
    page,
    process.env.DESIGNER_LOGIN || 'akbota',
    process.env.DESIGNER_PASSWORD || 'akbota123',
    path.join('specs', '.auth', 'designer.json'),
  );
});

setup('save manager auth', async ({ page }) => {
  await loginAs(
    page,
    process.env.MANAGER_LOGIN || 'akbota',
    process.env.MANAGER_PASSWORD || 'akbota123',
    path.join('specs', '.auth', 'manager.json'),
  );
});

setup('save admin auth', async ({ page }) => {
  await loginAs(
    page,
    process.env.ADMIN_LOGIN || 'akbota',
    process.env.ADMIN_PASSWORD || 'akbota123',
    path.join('specs', '.auth', 'admin.json'),
  );
});
