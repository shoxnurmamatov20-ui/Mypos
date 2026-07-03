import { expect, test } from '@playwright/test';

/**
 * Scenario 2 — Mijoz buyurtma berishi to'liq oqim.
 *
 * Consumer landing → restaurant → menu → cart → checkout → success.
 */
test('Customer places order from web-consumer', async ({ page }) => {
  const consumerBase = process.env.WEB_CONSUMER_URL ?? 'http://localhost:3002';
  await page.goto(`${consumerBase}/uz`);

  // Pick a restaurant
  await page
    .getByRole('link', { name: /Demo|Cafe/i })
    .first()
    .click();

  // Add first menu item to cart
  const addBtn = page.getByRole('button', { name: /Add|Qo'shish|Добавить/i }).first();
  await addBtn.click();

  // Open cart
  await page
    .getByRole('link', { name: /Cart|Savat|Корзина/i })
    .first()
    .click();
  await expect(page).toHaveURL(/cart/);

  // Checkout
  await page
    .getByRole('button', { name: /Checkout|Davom etish/i })
    .first()
    .click();
  await expect(page).toHaveURL(/checkout/);

  // Fill name + phone
  await page
    .getByLabel(/Name|Ism/i)
    .first()
    .fill('Test Mijoz');
  await page
    .getByLabel(/Phone|Telefon/i)
    .first()
    .fill('+998901234567');

  // Place order (cash on delivery)
  await page
    .getByRole('button', { name: /Place|Berish|Оформить/i })
    .first()
    .click();
  await expect(page).toHaveURL(/(order-success|track)/, { timeout: 15_000 });
});
