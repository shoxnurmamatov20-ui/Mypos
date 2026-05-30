import { expect, test } from '@playwright/test';

/**
 * Scenario 3 — Multi-restaurant CEO operations.
 *
 * CEO login → web-ceo overview → /restaurants list → deep link to dashboard.
 */
test('CEO sees consolidated KPIs and switches restaurant', async ({ page }) => {
  const portalBase = process.env.WEB_PORTAL_URL ?? 'http://localhost:3005';
  const ceoBase = process.env.WEB_CEO_URL ?? 'http://localhost:3001';

  // Login
  await page.goto(`${portalBase}/uz/login`);
  await page.getByLabel(/Email|Telefon/i).fill('ceo@mypos.uz');
  await page.getByLabel(/Password|Parol/i).fill('ceo123');
  await page.getByRole('button', { name: /Sign in|Kirish/i }).click();

  // After redirect, expect to be on web-ceo
  await page.waitForURL(/(localhost:3001|overview)/, { timeout: 10_000 });

  // KPI dashboard
  await page.goto(`${ceoBase}/uz/overview`);
  await expect(page.locator('text=/Revenue|Tushum/')).toBeVisible({ timeout: 10_000 });

  // Restaurants list
  await page.goto(`${ceoBase}/uz/restaurants`);
  const cards = page.locator('[data-testid="restaurant-card"]');
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });

  // Click first → opens detail
  await cards.first().click();
  await expect(page).toHaveURL(/restaurants\/.+/);
});
