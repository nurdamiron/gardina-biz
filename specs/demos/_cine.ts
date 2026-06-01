import type { Page } from '@playwright/test';

/** Cinematic helpers for demo capture: smooth scrolling, holds, gentle cursor moves. */

export const hold = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Smoothly scroll the window by `total` px over several small steps. */
export async function smoothScroll(page: Page, total: number, steps = 16) {
  const step = total / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await hold(45);
  }
  await hold(500);
}

/** Move the cursor to an element's center in a few eased hops, then optionally hover. */
export async function moveTo(page: Page, selector: string, hover = true) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) return;
  const tx = box.x + box.width / 2;
  const ty = box.y + box.height / 2;
  await page.mouse.move(tx, ty, { steps: 24 });
  if (hover) await hold(450);
}

/** Move to an element and click it (cursor visibly travels first). */
export async function cineClick(page: Page, selector: string) {
  await moveTo(page, selector);
  await page.locator(selector).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await hold(700);
}

/** Move to and click an element matched by visible text (cards are divs+onClick, not links). */
export async function cineClickText(page: Page, text: string) {
  const el = page.getByText(text, { exact: false }).first();
  if (!(await el.isVisible().catch(() => false))) return false;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 24 });
  await hold(400);
  await el.click().catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await hold(800);
  return true;
}

/** Land on a route and let it settle before the next beat. */
export async function visit(page: Page, path: string, settle = 1100) {
  await page.goto(path);
  await page.waitForLoadState('networkidle').catch(() => {});
  await hold(settle);
}
