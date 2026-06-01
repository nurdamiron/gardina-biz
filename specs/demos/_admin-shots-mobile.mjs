import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const BASE = 'http://localhost:5174';
const OUT = 'marketing-assets/screens/admin/mobile';
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ['/admin/dashboard',     'admin-01-dashboard'],
  ['/admin/reports',       'admin-02-reports'],
  ['/admin/catalog',       'admin-03-catalog'],
  ['/admin/clients',       'admin-04-clients'],
  ['/admin/users',         'admin-05-team'],
  ['/admin/orders',        'admin-06-orders'],
  ['/admin/billing',       'admin-07-billing'],
  ['/admin/notifications', 'admin-08-notifications'],
  ['/admin/settings',      'admin-09-settings'],
];

const browser = await chromium.launch();
for (const [route, name] of ROUTES) {
  const ctx = await browser.newContext({
    storageState: 'specs/.auth/demo-admin.json',
    viewport: { width: 430, height: 932 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'ru-RU',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}.png` }); // viewport (9:16) for Reels/Stories
    console.log(name, '->', page.url().replace(BASE, ''));
  } catch (e) {
    console.log('ERR', name, e.message.slice(0, 60));
  }
  await ctx.close();
}
await browser.close();
console.log('DONE');
