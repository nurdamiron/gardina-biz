// Screenshots of the real Gardina UI for the "Айшторы" demo salon, per role, phone-sized.
// usage: node capture.mjs <outDir> [role...]
import { createRequire } from 'module';
import fs from 'fs';
const req = createRequire('/Users/nurdauletakhmatov/threads-marketing/scripts/package.json');
const { chromium } = req('playwright');
const pgReq = createRequire('/Users/nurdauletakhmatov/Projects/clients/gardina-biz/gardina-backend/package.json');
const pg = pgReq('pg');

const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const BASE = 'http://localhost:5174';
const PW = fs.readFileSync(new URL('./.demo-password', import.meta.url), 'utf8').trim();
const [outDir, ...only] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const db = new pg.Client({ host: 'localhost', port: 5433, user: 'gardina', password: 'demo_local_only', database: 'gardina_demo' });
await db.connect();
const id = async (sql) => (await db.query(sql)).rows[0]?.id;
const O = `(SELECT id FROM organizations WHERE slug='aishtory')`;
const ids = {
  dealProd: await id(`SELECT d.id FROM deals d JOIN clients c ON c.id=d.client_id WHERE d.organization_id=${O} AND c.name='Ләззат Әбдірова'`),
  dealReady: await id(`SELECT d.id FROM deals d JOIN clients c ON c.id=d.client_id WHERE d.organization_id=${O} AND c.name='Айжан Бекмұратова'`),
  clientReady: await id(`SELECT id FROM clients WHERE organization_id=${O} AND name='Айжан Бекмұратова'`),
  measTomorrow: await id(`SELECT m.id FROM measurements m JOIN clients c ON c.id=m.client_id WHERE m.organization_id=${O} AND c.name='Ерболат Сейітов'`),
  measDone: await id(`SELECT m.id FROM measurements m JOIN clients c ON c.id=m.client_id WHERE m.organization_id=${O} AND c.name='Руслан Оспанов'`),
};
await db.end();

const ROLES = {
  owner: { phone: '+77012345601', shots: [['admin-dashboard', '/admin/dashboard', { close: 'Первые шаги' }], ['admin-orders', '/admin/orders'], ['admin-reports', '/admin/reports'], ['admin-clients', '/admin/clients'], ['deal-production', `/deals/${ids.dealProd}`], ['admin-catalog', '/admin/catalog'], ['admin-users', '/admin/users']] },
  manager: { phone: '+77012345602', shots: [['manager-dashboard', '/manager/dashboard'], ['manager-urgent', '/manager/dashboard', { scrollTo: 'Срочные задачи' }], ['manager-funnel', '/manager/funnel'], ['manager-orders', '/manager/orders'], ['manager-client', `/manager/clients/${ids.clientReady}`], ['manager-new-order', '/manager/order/new'], ['manager-tasks', '/manager/tasks'], ['deal-ready', `/deals/${ids.dealReady}`]] },
  designer: { phone: '+77012345603', shots: [['designer-dashboard', '/designer/dashboard'], ['designer-measurements', '/designer/measurements'], ['designer-measurement', `/designer/measurements/${ids.measTomorrow}`], ['designer-measurement-done', `/designer/measurements/${ids.measDone}`]] },
  production: { phone: '+77012345605', shots: [['production-home', '/']] },
  installer: { phone: '+77012345606', shots: [['installer-home', '/']] },
};

const browser = await chromium.launch({ executablePath: EXE });
for (const [role, cfg] of Object.entries(ROLES)) {
  if (only.length && !only.includes(role)) continue;
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ru-RU', timezoneId: 'Asia/Almaty' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 140)));
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input:not([type=password])').first().fill(cfg.phone);
  await page.locator('input[type=password]').fill(PW);
  await page.locator('button[type=submit]').click();
  await page.waitForTimeout(2500);
  console.log(`${role}: after login -> ${new URL(page.url()).pathname}`);
  for (const [name, path, act = {}] of cfg.shots) {
    await page.goto(BASE + path);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    if (act.close) {
      const box = page.getByText(act.close, { exact: false }).first().locator('xpath=ancestor::div[.//button][1]');
      await box.locator('button').first().click().catch((e) => console.log('  close failed', e.message.slice(0, 60)));
      await page.waitForTimeout(600);
    }
    if (act.scrollTo) {
      await page.getByText(act.scrollTo, { exact: false }).first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.evaluate(() => window.scrollBy(0, -90));
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
    console.log(`  ${name} <- ${new URL(page.url()).pathname}`);
  }
  if (errors.length) console.log('  console errors:', [...new Set(errors)].slice(0, 4));
  await ctx.close();
}
await browser.close();
