import { test, expect } from '@playwright/test';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test('product demo flow', async ({ page }) => {
  await page.goto('/landing.html');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/landing\.html/);
  await sleep(1200);

  await page.mouse.wheel(0, 900);
  await sleep(1200);
  await page.mouse.wheel(0, 900);
  await sleep(1200);
  await page.mouse.wheel(0, -1400);
  await sleep(1500);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Gardina' })).toBeVisible();
  await sleep(1000);

  await page.getByPlaceholder('Логиніңізді енгізіңіз').fill('demo@gardina.app');
  await sleep(500);
  await page.getByPlaceholder('••••••••').fill('••••••••');
  await sleep(800);

  const routes = [
    '/notifications',
    '/login',
    '/landing.html',
  ];

  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await sleep(1500);
  }
});
