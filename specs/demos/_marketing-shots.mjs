import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5174';
const ROOT = 'marketing-assets/screens';
mkdirSync(`${ROOT}/desktop`, { recursive: true });
mkdirSync(`${ROOT}/mobile`, { recursive: true });

// [role, route, name, clickText|null, mobileToo]
const SCREENS = [
  ['designer', '/designer/dashboard',        '01-designer-dashboard',     null,               true],
  ['designer', '/designer/measurements',     '02-designer-measurements',  null,               true],
  ['designer', '/designer/measurements',     '03-designer-measure-detail','Самал Ахметова',    true],
  ['manager',  '/manager/dashboard',         '04-manager-dashboard',      null,               true],
  ['manager',  '/manager/clients',           '05-manager-clients',        null,               false],
  ['manager',  '/manager/clients',           '06-manager-client-detail',  'Дина Нұрланова',    false],
  ['manager',  '/manager/tasks',             '07-manager-tasks',          null,               false],
  ['sales',    '/sales/funnel',              '08-sales-funnel',           null,               true],
  ['sales',    '/sales/clients',             '09-sales-leads',            null,               false],
  ['sales',    '/sales/order/new',           '10-sales-new-order',        null,               true],
  ['admin',    '/admin/dashboard',           '11-admin-dashboard',        null,               true],
  ['admin',    '/admin/reports',             '12-admin-reports',          null,               true],
  ['admin',    '/admin/catalog',             '13-admin-catalog',          null,               true],
  ['admin',    '/admin/catalog',             '14-admin-product-detail',   'Блэкаут Премиум',   false],
  ['admin',    '/admin/users',               '15-admin-team',             null,               false],
  ['admin',    '/admin/billing',             '16-admin-billing',          null,               true],
];

async function shoot(ctx, route, name, clickText, dir) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1400);
    if (clickText) {
      const el = page.getByText(clickText, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click().catch(() => {});
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(1400);
      }
    }
    await page.screenshot({ path: `${ROOT}/${dir}/${name}.png` });
    console.log(dir, name);
  } catch (e) {
    console.log('ERR', name, e.message.slice(0, 60));
  }
  await page.close();
}

const browser = await chromium.launch();
for (const [role, route, name, clickText, mobileToo] of SCREENS) {
  const desk = await browser.newContext({
    storageState: `specs/.auth/demo-${role}.json`,
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: 'ru-RU',
  });
  await shoot(desk, route, name, clickText, 'desktop');
  await desk.close();

  if (mobileToo) {
    const mob = await browser.newContext({
      storageState: `specs/.auth/demo-${role}.json`,
      viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true,
      hasTouch: true, locale: 'ru-RU',
    });
    await shoot(mob, route, name, clickText, 'mobile');
    await mob.close();
  }
}
await browser.close();
console.log('DONE');
