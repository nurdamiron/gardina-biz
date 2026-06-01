import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5174';

const cases = [
  ['designer', '/designer/measurements', 'Самал Ахметова'],
  ['sales', '/sales/clients', 'Дина Нұрланова'],
  ['sales', '/sales/funnel', null],
  ['manager', '/manager/clients', 'Дина Нұрланова'],
  ['manager', '/manager/orders', null],
  ['admin', '/admin/catalog', 'Блэкаут'],
  ['admin', '/admin/users', null],
];

const browser = await chromium.launch();
for (const [role, route, clickText] of cases) {
  const ctx = await browser.newContext({
    storageState: `specs/.auth/demo-${role}.json`,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1200);
    const landed = page.url().replace(BASE, '');
    let after = '(no click)';
    if (clickText) {
      const el = page.getByText(clickText, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click().catch(() => {});
        await page.waitForTimeout(1200);
        after = page.url().replace(BASE, '');
      } else {
        after = `TEXT "${clickText}" NOT VISIBLE`;
      }
    }
    console.log(`${role.padEnd(9)} ${route.padEnd(22)} landed=${landed}  afterClick=${after}`);
  } catch (e) {
    console.log(`${role} ${route} ERROR ${e.message.slice(0, 80)}`);
  }
  await ctx.close();
}
await browser.close();
