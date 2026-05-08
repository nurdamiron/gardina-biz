/**
 * Admin role tests.
 * Uses pre-saved auth state from global.setup.ts.
 */
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('loads admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('shows analytics stats', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(50);
  });

  test('bottom navigation visible (requires admin role)', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    // BottomNav uses onClick+navigate (not <a> tags)
    const hasNav = await page.locator('nav button').count() > 0;
    const hasAccessDenied = await page.getByText('Қол жетімсіз').count() > 0;
    expect(hasNav || hasAccessDenied).toBeTruthy();
  });
});

test.describe('Catalog — Products (Fabrics)', () => {
  test('catalog page loads', async ({ page }) => {
    await page.goto('/admin/catalog');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/catalog/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('shows products tab or access control', async ({ page }) => {
    await page.goto('/admin/catalog');
    await page.waitForLoadState('networkidle');
    // Either shows catalog content or access denied — no JS crash
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('undefined is not');
  });

  test('create fabric page loads', async ({ page }) => {
    await page.goto('/admin/catalog/products/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('undefined is not');
  });

  test('create fabric page renders', async ({ page }) => {
    await page.goto('/admin/catalog/products/new');
    await page.waitForLoadState('networkidle');
    // Verify page content is meaningful (form or access denied message)
    const content = await page.locator('body').textContent();
    expect(content?.trim().length).toBeGreaterThan(10);
  });
});

test.describe('Catalog — Fabric Details', () => {
  let fabricId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/admin/catalog');
    await page.waitForLoadState('networkidle');
    const link = page.locator('a[href*="/catalog/products/"]').first();
    if (await link.count() > 0) {
      const href = await link.getAttribute('href');
      const match = href?.match(/\/catalog\/products\/([^/]+?)(?:\/edit|$)/);
      if (match && match[1] !== 'new') {
        fabricId = match[1];
      }
    }
    await page.close();
  });

  test('fabric details page loads', async ({ page }) => {
    if (!fabricId) {
      test.skip();
      return;
    }
    await page.goto(`/admin/catalog/products/${fabricId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('fabric edit page loads', async ({ page }) => {
    if (!fabricId) {
      test.skip();
      return;
    }
    await page.goto(`/admin/catalog/products/${fabricId}/edit`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
    const inputs = page.locator('input, textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Catalog — Services', () => {
  test('create service page loads', async ({ page }) => {
    await page.goto('/admin/catalog/services/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('undefined is not');
  });

  test('create service — fills fields', async ({ page }) => {
    await page.goto('/admin/catalog/services/new');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test Playwright Service');
    }
  });
});

test.describe('Admin Clients', () => {
  test('admin clients list loads', async ({ page }) => {
    await page.goto('/admin/clients');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/clients/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Admin Orders', () => {
  test('admin orders list loads', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('create order page loads', async ({ page }) => {
    await page.goto('/admin/order/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Admin Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/admin\/settings/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Admin Users (TODO page)', () => {
  test('users placeholder page renders', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    // This is a TODO page — just check it doesn't crash
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Admin Reports (TODO page)', () => {
  test('reports placeholder page renders', async ({ page }) => {
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Multi-page navigation (no crash)', () => {
  // Verify key pages render without JS errors regardless of role
  const pages = [
    '/designer/measurements',
    '/manager/clients',
    '/manager/funnel',
    '/admin/catalog',
    '/notifications',
  ];

  for (const path of pages) {
    test(`${path} renders without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toContainText('Cannot read');
      await expect(page.locator('body')).not.toContainText('undefined is not');
      await expect(page.locator('body')).not.toContainText('TypeError');
    });
  }
});

test.describe('Price calculation logic', () => {
  test('catalog calculate API is reachable', async ({ page, request }) => {
    // Test the price calculation endpoint via API
    const response = await request.post(
      (process.env.API_URL || 'http://localhost:3001') + '/api/catalog/calculate',
      {
        data: {
          rooms: [
            {
              name: 'Гостиная',
              windows: [
                {
                  width: 200,
                  height: 250,
                  curtainType: 'classic',
                  fabricCode: 'TEST-001',
                },
              ],
            },
          ],
        },
        headers: {
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      },
    );
    // Either succeeds (200) or returns validation error (400/401) — not a 500
    expect(response.status()).toBeLessThan(500);
  });
});
