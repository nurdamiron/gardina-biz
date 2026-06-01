import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5174';
const browser = await chromium.launch();
const d = await browser.newContext({ storageState: 'specs/.auth/demo-designer.json', viewport: { width: 1920, height: 1080 }, locale: 'ru-RU' });
const p = await d.newPage();
await p.goto(BASE + '/designer/measurements');
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1200);
await p.getByText('Завершён', { exact: false }).first().click().catch(()=>{}); // tab Завершённые
await p.waitForTimeout(1000);
await p.getByText('Айгүл', { exact: false }).first().click().catch(()=>{});
await p.waitForLoadState('networkidle').catch(()=>{});
await p.waitForTimeout(1600);
await p.screenshot({ path: 'marketing-assets/screens/desktop/03-designer-measure-detail.png' });
console.log('measure-detail', p.url());
await browser.close();
