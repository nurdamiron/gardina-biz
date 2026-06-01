import { test } from '@playwright/test';
import { visit, smoothScroll, cineClickText, hold } from './_cine';

/**
 * ADMIN demo: business analytics, the product catalog, the team, and billing —
 * the owner's full control surface.
 */
test('admin demo', async ({ page }) => {
  // 1. Analytics dashboard
  await visit(page, '/admin/dashboard', 1500);
  await smoothScroll(page, 750);
  await smoothScroll(page, -750);

  // 2. Catalog -> open a product
  await visit(page, '/admin/catalog', 1300);
  await smoothScroll(page, 300);
  await cineClickText(page, 'Блэкаут Премиум');
  await hold(1100);
  await smoothScroll(page, 300);

  // 3. Team / users
  await visit(page, '/admin/users', 1300);
  await smoothScroll(page, 300);

  // 4. Reports — switch to the 3-month window so the revenue trend shows a curve
  await visit(page, '/admin/reports', 1400);
  await cineClickText(page, '3 месяца');
  await hold(1100);
  await smoothScroll(page, 500);

  // 5. Billing / plan
  await visit(page, '/admin/billing', 1300);
  await smoothScroll(page, 300);
  await hold(1200);
});
