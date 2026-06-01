import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const BASE = 'http://localhost:5174';
const OUT = '/tmp/gardina-shots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: 'specs/.auth/demo-admin.json',
  viewport: { width: 1920, height: 1080 }, locale: 'ru-RU',
});
const page = await ctx.newPage();
await page.goto(BASE + '/admin/reports');
await page.waitForLoadState('networkidle').catch(() => {});
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/admin-reports-fixed.png` });
console.log('done');
await browser.close();
