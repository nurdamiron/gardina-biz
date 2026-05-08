/**
 * Auth tests — login page, validation, role redirects, logout.
 * Runs WITHOUT pre-saved auth (fresh browser).
 */
import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Gardina' })).toBeVisible();
    await expect(page.getByPlaceholder('Логиніңізді енгізіңіз')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /Кіру/i })).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.getByPlaceholder('Логиніңізді енгізіңіз').fill('wrong@email.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /Кіру/i }).click();
    await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 8_000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('••••••••');
    await passwordInput.fill('mypassword');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.locator('button[type="button"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.locator('button[type="button"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Role-based login redirects', () => {
  // Designer (akbota) → /designer/dashboard
  test('designer logs in → redirected to /designer/dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Логиніңізді енгізіңіз').fill(
      process.env.DESIGNER_LOGIN || 'akbota',
    );
    await page.getByPlaceholder('••••••••').fill(
      process.env.DESIGNER_PASSWORD || 'akbota123',
    );
    await page.getByRole('button', { name: /Кіру/i }).click();
    await page.waitForURL(/\/designer\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/designer\/dashboard/);
  });

  // Manager redirect — skip if no credentials provided
  test('manager logs in → redirected to /manager/dashboard', async ({ page }) => {
    if (!process.env.MANAGER_LOGIN) test.skip();
    await page.goto('/login');
    await page.getByPlaceholder('Логиніңізді енгізіңіз').fill(process.env.MANAGER_LOGIN!);
    await page.getByPlaceholder('••••••••').fill(process.env.MANAGER_PASSWORD || '');
    await page.getByRole('button', { name: /Кіру/i }).click();
    await page.waitForURL(/\/manager\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/manager\/dashboard/);
  });

  // Admin redirect — skip if no credentials provided
  test('admin logs in → redirected to /admin/dashboard', async ({ page }) => {
    if (!process.env.ADMIN_LOGIN) test.skip();
    await page.goto('/login');
    await page.getByPlaceholder('Логиніңізді енгізіңіз').fill(process.env.ADMIN_LOGIN!);
    await page.getByPlaceholder('••••••••').fill(process.env.ADMIN_PASSWORD || '');
    await page.getByRole('button', { name: /Кіру/i }).click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});
