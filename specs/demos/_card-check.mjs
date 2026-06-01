import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5174';
const OUT = '/tmp/gardina-shots';
const shots = (process.argv[2] || 'manager:/manager/clients:clients').split('|').map(s => s.split(':'));
const browser = await chromium.launch();
for (const [role, route, name] of shots) {
  const ctx = await browser.newContext({ storageState: `specs/.auth/demo-${role}.json`, viewport: { width: 1920, height: 1080 }, locale: 'ru-RU' });
  const p = await ctx.newPage();
  await p.goto(BASE + route);
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${OUT}/card-${name}.png` });
  console.log('card-' + name);
  await ctx.close();
}
await browser.close();
