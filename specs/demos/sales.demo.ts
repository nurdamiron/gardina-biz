import { test } from '@playwright/test';
import { visit, smoothScroll, cineClickText, hold } from './_cine';

/**
 * SALES demo: the sales pipeline (revenue by stage), the lead base,
 * a lead card, and starting a new measurement order.
 */
test('sales demo', async ({ page }) => {
  // 1. Sales funnel — revenue by stage
  await visit(page, '/sales/funnel', 1500);
  await smoothScroll(page, 600);
  await smoothScroll(page, -600);

  // 2. Leads -> open a lead
  await visit(page, '/sales/clients', 1300);
  await smoothScroll(page, 250);
  await cineClickText(page, 'Зарина Мусаева');
  await hold(1200);
  await smoothScroll(page, 400);

  // 3. Start a new measurement order
  await visit(page, '/sales/order/new', 1500);
  await smoothScroll(page, 350);
  await hold(1200);
});
