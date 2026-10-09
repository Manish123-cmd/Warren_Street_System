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

test('October 7 report includes almond croissant in daily and weekly totals', async ({ page }) => {
  await page.goto('/wastage.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.locator('#waste-date').fill('2026-10-07');
  await page.locator('#waste-date').dispatchEvent('change');
  await expect(page.locator('#waste-total')).toHaveText('10');
  await expect(page.locator('#almond-waste')).toHaveValue('1');
  await expect(page.locator('#waste-week-summary')).toContainText('25 pastries recorded');
  await page.locator('#save-wastage').click();
  await page.reload();
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.locator('#waste-date').fill('2026-10-07');
  await page.locator('#waste-date').dispatchEvent('change');
  await expect(page.locator('#waste-total')).toHaveText('10');
  await expect(page.locator('#almond-waste')).toHaveValue('1');
});

test('receiving an order updates totals and alerts, persists, and can be undone', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-09T12:00:00Z'));
  await page.goto('/orders.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  const button=page.getByRole('button', { name: /Mark as received for order/ }).filter({ visible: true }).first();
  const label=await button.getAttribute('aria-label');
  const orderNumber=label.match(/for order (\S+) on/)[1];
  const before=Number((await page.locator('#orders-pending').textContent()).replaceAll(',', ''));
  const stock=await page.evaluate(() => localStorage.getItem('warren-stock-v1'));
  await button.click();
  await expect(page.locator('#receipt-status')).toHaveText('Order marked as received.');
  expect(Number((await page.locator('#orders-pending').textContent()).replaceAll(',', ''))).toBeLessThan(before);
  await expect(page.locator('main .order-alert')).not.toContainText(`Order ${orderNumber}`);
  const undo=page.getByRole('button', { name: new RegExp(`Undo received for order ${orderNumber} on`) });
  await expect(undo).toBeVisible();
  await page.reload();
  await expect(undo).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('warren-stock-v1'))).toBe(stock);
  await undo.click();
  await expect(page.locator('#orders-pending')).toHaveText(before.toLocaleString('en-GB'));
});

test('Saturday receipt adds to confirmed stock before preparation without duplication', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-10T07:00:00Z'));
  await page.goto('/orders.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await page.getByRole('button', { name: 'Mark as received for order 33921178 on 2026-10-10', exact: true }).click();
  await page.goto('/frozen-pastries.html');
  await expect(page.locator('main .order-alert')).toHaveCount(1);
  await expect(page.getByRole('spinbutton', { name: 'Butter Croissant stock count', exact: true })).toHaveValue('57');
  await expect(page.getByRole('spinbutton', { name: 'Pistachio Cookie stock count', exact: true })).toHaveValue('44');
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Butter Croissant stock count', exact: true })).toHaveValue('57');
  await page.clock.setFixedTime(new Date('2026-10-10T09:00:00Z'));
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Butter Croissant stock count', exact: true })).toHaveValue('45');
});
