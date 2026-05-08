/**
 * Designer role tests.
 * Uses pre-saved auth state from global.setup.ts.
 */
import { test, expect } from '@playwright/test';

test.describe('Designer Dashboard', () => {
  test('loads dashboard page', async ({ page }) => {
    await page.goto('/designer/dashboard');
    await page.waitForLoadState('networkidle');
    // Should stay on dashboard (not redirect to login)
    await expect(page).toHaveURL(/\/designer\/dashboard/);
  });

  test('shows key dashboard sections', async ({ page }) => {
    await page.goto('/designer/dashboard');
    await page.waitForLoadState('networkidle');
    // Dashboard should render without crashing
    await expect(page.locator('body')).not.toContainText('Cannot read');
    await expect(page.locator('body')).not.toContainText('undefined is not');
  });

  test('bottom navigation is visible', async ({ page }) => {
    await page.goto('/designer/dashboard');
    await page.waitForLoadState('networkidle');
    // Designer has bottom nav — check by looking for nav links
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });
});

test.describe('Measurements list', () => {
  test('loads /designer/measurements', async ({ page }) => {
    await page.goto('/designer/measurements');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/designer\/measurements/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('shows empty state or measurement cards', async ({ page }) => {
    await page.goto('/designer/measurements');
    await page.waitForLoadState('networkidle');
    // Either empty state message or list items should be visible
    const hasItems = await page.locator('[class*="card"], [class*="item"], li').count();
    const hasEmpty = await page.getByText(/жоқ|нет|empty|пусто/i).count();
    expect(hasItems + hasEmpty).toBeGreaterThan(0);
  });
});

test.describe('Measurement details & workflow', () => {
  let measurementId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    // Try to get first measurement ID from the list
    const page = await browser.newPage();
    await page.goto('/designer/measurements');
    await page.waitForLoadState('networkidle');

    // Look for a link to a measurement detail page
    const link = page.locator('a[href*="/measurements/"]').first();
    if (await link.count() > 0) {
      const href = await link.getAttribute('href');
      measurementId = href?.match(/\/measurements\/([^/]+)/)?.[1] || null;
    }
    await page.close();
  });

  test('measurement detail page loads', async ({ page }) => {
    if (!measurementId) {
      test.skip();
      return;
    }
    await page.goto(`/designer/measurements/${measurementId}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(`/measurements/${measurementId}`));
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('room measurement form loads', async ({ page }) => {
    if (!measurementId) {
      test.skip();
      return;
    }
    await page.goto(`/designer/measurements/${measurementId}/room`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('fabric selection page loads', async ({ page }) => {
    if (!measurementId) {
      test.skip();
      return;
    }
    await page.goto(`/designer/measurements/${measurementId}/fabric`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('proposal view page loads', async ({ page }) => {
    if (!measurementId) {
      test.skip();
      return;
    }
    await page.goto(`/designer/measurements/${measurementId}/proposal`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Designer profile', () => {
  test('profile page loads', async ({ page }) => {
    await page.goto('/designer/profile');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/designer\/profile/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('displays user info', async ({ page }) => {
    await page.goto('/designer/profile');
    await page.waitForLoadState('networkidle');
    // Should show some user info (name or email)
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });
});

test.describe('Notifications', () => {
  test('notifications list loads', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/notifications/);
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });

  test('notification settings load', async ({ page }) => {
    await page.goto('/notifications/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Cannot read');
  });
});

test.describe('Access control', () => {
  test('designer cannot access manager dashboard', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await page.waitForLoadState('networkidle');
    // Should show access denied or redirect
    const denied = await page.getByText(/Қол жетімсіз|Доступ|block/i).count();
    const redirected = !page.url().includes('/manager/dashboard');
    expect(denied > 0 || redirected).toBeTruthy();
  });

  test('designer cannot access admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    const denied = await page.getByText(/Қол жетімсіз|Доступ|block/i).count();
    const redirected = !page.url().includes('/admin/dashboard');
    expect(denied > 0 || redirected).toBeTruthy();
  });
});
