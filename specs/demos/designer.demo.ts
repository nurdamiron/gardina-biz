import { test } from '@playwright/test';
import { visit, smoothScroll, cineClickText, hold } from './_cine';

/**
 * DESIGNER demo: the on-site designer reviews their day, opens an assigned
 * measurement, and works toward the proposal. Authenticated via storageState.
 */
test('designer demo', async ({ page }) => {
  // 1. Dashboard — KPI, rating, measurements done
  await visit(page, '/designer/dashboard', 1500);
  await smoothScroll(page, 700);
  await smoothScroll(page, -700);

  // 2. Assigned measurements
  await visit(page, '/designer/measurements', 1300);
  await smoothScroll(page, 350);

  // 3. Open a measurement -> details
  await cineClickText(page, 'Самал Ахметова');
  await hold(1200);
  await smoothScroll(page, 600);
  await hold(1200);
});
