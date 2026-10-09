import { test, expect } from '@playwright/test';

test('all React screens initialize without browser errors and retain navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  for (const filename of ['index.html', 'frozen-pastries.html', 'creams.html', 'setting-proover.html', 'wastage.html', 'orders.html']) {
    await page.goto(`/${filename}`);
    await expect(page.locator('#root main')).toBeVisible();
    await expect(page.locator(`nav a[href="${filename}"]`)).toHaveAttribute('aria-current', 'page');
    await page.waitForFunction(() => document.querySelector('script[src="scripts/order-alerts.js"]'));
    await expect(page.locator('main .order-alert')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test('stock search and delivery controls still work', async ({ page }) => {
  await page.goto('/frozen-pastries.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.locator('#pastry-search').fill('bowtie');
  await expect(page.locator('#results-count')).toContainText('1 product');
  await page.locator('#pastry-search').fill('no such pastry');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.locator('#open-delivery-scan').click();
  await expect(page.locator('#delivery-upload')).toBeVisible();
});

test('tray photos open and close their full-size dialog', async ({ page }) => {
  await page.goto('/setting-proover.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.locator('.tray-photo').first().click();
  await expect(page.locator('#tray-dialog')).toBeVisible();
  await page.locator('#close-tray').click();
  await expect(page.locator('#tray-dialog')).not.toBeVisible();
});

test('confirmed wastage loads and later edits persist across refresh', async ({ page }) => {
  await page.goto('/wastage.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.locator('#waste-date').fill('2026-10-08');
  await page.locator('#waste-date').dispatchEvent('change');
  await expect(page.locator('#waste-total')).toHaveText('10');
  await expect(page.locator('#waste-state')).toHaveText('Complete');
  await page.getByRole('spinbutton', { name: 'Cinnamon Bun wastage', exact: true }).fill('5');
  await page.locator('#save-wastage').click();
  await expect(page.locator('#waste-total')).toHaveText('11');
  await page.reload();
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.locator('#waste-date').fill('2026-10-08');
  await page.locator('#waste-date').dispatchEvent('change');
  await expect(page.locator('#waste-total')).toHaveText('11');
});
