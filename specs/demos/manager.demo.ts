import { test } from '@playwright/test';
import { visit, smoothScroll, cineClickText, hold } from './_cine';

/**
 * MANAGER demo: team dashboard, client base, an active deal, and tasks.
 */
test('manager demo', async ({ page }) => {
  // 1. Team dashboard
  await visit(page, '/manager/dashboard', 1500);
  await smoothScroll(page, 700);
  await smoothScroll(page, -700);

  // 2. Client base -> open a client card
  await visit(page, '/manager/clients', 1300);
  await smoothScroll(page, 300);
  await cineClickText(page, 'Дина Нұрланова');
  await hold(1200);
  await smoothScroll(page, 500);

  // 3. Orders / deals
  await visit(page, '/manager/orders', 1300);
  await smoothScroll(page, 400);

  // 4. Tasks
  await visit(page, '/manager/tasks', 1300);
  await smoothScroll(page, 300);
  await hold(1200);
});
