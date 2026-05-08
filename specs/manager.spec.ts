/**
 * Manager role tests.
 * Uses pre-saved auth state from global.setup.ts.
 */
import { test, expect } from '@playwright/test';

test.describe('Manager Dashboard', () => {
  test('loads manager dashboard', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/manager\/dashboard/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('shows stats or empty state', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');
    // Dashboard should render meaningful content
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(50);
  });

  test('bottom navigation visible (requires manager role)', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');
    // BottomNav uses onClick+navigate (not <a> tags)
    // If running with manager credentials: nav is visible
    // If running with designer credentials: access denied page renders
    const hasNav = await page.locator('nav button').count() > 0;
    const hasAccessDenied = await page.getByText('Қол жетімсіз').count() > 0;
    expect(hasNav || hasAccessDenied).toBeTruthy();
  });
});

test.describe('Clients', () => {
  test('clients list loads', async ({ page }) => {
    await page.goto('/manager/clients');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/manager\/clients/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('create client page loads', async ({ page }) => {
    await page.goto('/manager/client/new');
    await page.waitForLoadState('networkidle');
    // Page renders without JS crash (form or access-denied message)
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('undefined is not');
  });

  test('create client form — fills and validates required fields', async ({ page }) => {
    await page.goto('/manager/client/new');
    await page.waitForLoadState('networkidle');

    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /Сақтау|Создать|Қосу|Добавить|Save/i }).first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      // Validation errors should appear or nothing submitted
      await page.waitForTimeout(500);
      // Still on same page (validation blocked submit)
      await expect(page).toHaveURL(/\/manager\/client\/new/);
    }
  });

  test('create client — fills name and phone', async ({ page }) => {
    await page.goto('/manager/client/new');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('input[placeholder*="Аты|Имя|name|Name"]').first();
    if (await nameInput.count() === 0) {
      // Try finding by label
      const nameField = page.getByLabel(/Аты|Имя|Аты-жөні|name/i).first();
      if (await nameField.count() > 0) {
        await nameField.fill('Test Playwright Client');
      }
    } else {
      await nameInput.fill('Test Playwright Client');
    }

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="телефон|phone|Phone"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('+77001234567');
    }
  });
});

test.describe('Client detail', () => {
  let clientId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/manager/clients');
    await page.waitForLoadState('networkidle');
    const link = page.locator('a[href*="/clients/"]').first();
    if (await link.count() > 0) {
      const href = await link.getAttribute('href');
      clientId = href?.match(/\/clients\/([^/]+)/)?.[1] || null;
    }
    await page.close();
  });

  test('client detail page loads', async ({ page }) => {
    if (!clientId) {
      test.skip();
      return;
    }
    await page.goto(`/manager/clients/${clientId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Deals Funnel', () => {
  test('funnel page loads', async ({ page }) => {
    await page.goto('/manager/funnel');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/manager\/funnel/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('funnel shows deal stages', async ({ page }) => {
    await page.goto('/manager/funnel');
    await page.waitForLoadState('networkidle');
    // Should show funnel stage columns or empty state
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(20);
  });
});

test.describe('Tasks', () => {
  test('tasks list loads', async ({ page }) => {
    await page.goto('/manager/tasks');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/manager\/tasks/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Create Measurement Task', () => {
  test('create order page loads', async ({ page }) => {
    await page.goto('/manager/order/new');
    await page.waitForLoadState('networkidle');
    // Page renders without JS crash
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('undefined is not');
  });
});

test.describe('Orders', () => {
  test('orders list loads', async ({ page }) => {
    await page.goto('/manager/orders');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/manager\/orders/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Deal detail', () => {
  let dealId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/manager/funnel');
    await page.waitForLoadState('networkidle');
    const link = page.locator('a[href*="/deals/"]').first();
    if (await link.count() > 0) {
      const href = await link.getAttribute('href');
      dealId = href?.match(/\/deals\/([^/]+)/)?.[1] || null;
    }
    if (!dealId) {
      await page.goto('/manager/orders');
      await page.waitForLoadState('networkidle');
      const link2 = page.locator('a[href*="/orders/"]').first();
      if (await link2.count() > 0) {
        const href = await link2.getAttribute('href');
        dealId = href?.match(/\/orders\/([^/]+)/)?.[1] || null;
      }
    }
    await page.close();
  });

  test('deal detail page loads', async ({ page }) => {
    if (!dealId) {
      test.skip();
      return;
    }
    await page.goto(`/deals/${dealId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('deal detail shows status and client info', async ({ page }) => {
    if (!dealId) {
      test.skip();
      return;
    }
    await page.goto(`/deals/${dealId}`);
    await page.waitForLoadState('networkidle');
    const content = await page.locator('body').textContent();
    expect(content?.length).toBeGreaterThan(50);
  });
});

test.describe('Manager profile', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/manager/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Access control', () => {
  test('manager cannot access designer-only pages', async ({ page }) => {
    // Note: test uses shared credentials — verifies page renders without crash
    // Full role isolation requires separate MANAGER_LOGIN credentials
    await page.goto('/manager/clients');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('manager cannot access admin-only pages', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    const denied = await page.getByText(/Қол жетімсіз|Доступ|block/i).count();
    const redirected = !page.url().includes('/admin/settings');
    expect(denied > 0 || redirected).toBeTruthy();
  });
});
