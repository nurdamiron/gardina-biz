import { test as setup } from '@playwright/test';

/**
 * Logs in each demo role against the local demo stack and saves the
 * authenticated storage state. Role demo specs reuse these so the video
 * starts already inside the app (login intro is added later in Remotion).
 */
const ACCOUNTS = [
  { role: 'admin', login: 'admin@gardina.kz', password: 'admin123' },
  { role: 'manager', login: 'aigerim@gardina.demo', password: 'Demo1234!' },
  { role: 'designer', login: 'damir@gardina.demo', password: 'Demo1234!' },
  { role: 'sales', login: 'erlan@gardina.demo', password: 'Demo1234!' },
];

for (const acc of ACCOUNTS) {
  setup(`auth ${acc.role}`, async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[autocomplete="username"]').fill(acc.login);
    await page.locator('input[type="password"]').fill(acc.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 20_000,
    });
    await page.waitForLoadState('networkidle');
    await page.context().storageState({ path: `specs/.auth/demo-${acc.role}.json` });
  });
}
