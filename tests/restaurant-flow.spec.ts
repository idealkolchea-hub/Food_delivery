import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import { createRestaurantOrder, createVendorAccount } from './helpers/supabase';

test.setTimeout(90000);

async function blockRemoteImages(page: Page) {
  await page.route(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i, (route) => route.abort());
  await page.route(/images\.unsplash\.com/i, (route) => route.abort());
}

async function clickAction(target: Locator) {
  await expect(target).toBeVisible({ timeout: 15000 });
  await expect(target).toBeEnabled({ timeout: 15000 });
  await target.click();
}

async function openPartnerContext(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await blockRemoteImages(page);
  return { context, page };
}

function orderCardById(page: Page, orderId: string) {
  return page
    .getByText(orderId, { exact: true })
    .locator('xpath=ancestor::*[contains(@class, "glass-card")][1]');
}

test('restaurant partner flow shows incoming queue and moves order to ready', async ({ browser }) => {
  const vendor = await createVendorAccount('Kitchen Owner');
  const order = await createRestaurantOrder({
    customerName: 'Kitchen Customer',
    status: 'pending',
  });

  const { context, page } = await openPartnerContext(browser);

  try {
    await page.goto('/partner');
    await expect(page).toHaveURL(/\/partner\/auth(\?.*)?$/);
    await expect(page.getByText(/Open the kitchen ops surface/i)).toBeVisible();

    await page.getByPlaceholder('ops@restaurant.com').fill(vendor.email);
    await page.getByPlaceholder('Your account password').fill(vendor.password);
    await clickAction(page.getByRole('button', { name: /Open partner dashboard/i }));
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/partner\/queue$/);
    await expect(page.getByText(/Run .* from one queue/i)).toBeVisible();
    await expect(page.getByText(/Newest undecided orders/i)).toBeVisible();

    const incomingCard = orderCardById(page, order.orderId);
    await expect(incomingCard).toContainText('Kitchen Customer');
    await expect(incomingCard).toContainText(/Pending/i);
    await clickAction(incomingCard.getByRole('link', { name: /Open detail/i }));

    await expect(page).toHaveURL(new RegExp(`/partner/orders/${order.orderId}$`));
    await expect(page.getByRole('heading', { name: /Kitchen Customer/i })).toBeVisible();

    await clickAction(page.getByRole('button', { name: /Accept order/i }));
    await expect(page.getByRole('button', { name: /Mark preparing/i })).toBeVisible();

    await clickAction(page.getByRole('button', { name: /Mark preparing/i }));
    await expect(page.getByRole('button', { name: /Mark ready/i })).toBeVisible();

    await clickAction(page.getByRole('button', { name: /Mark ready/i }));
    await expect(page.getByText('Ready', { exact: true }).first()).toBeVisible();

    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /All orders/i })).toBeVisible();
    const readyCard = orderCardById(page, order.orderId);
    await expect(readyCard).toContainText('Kitchen Customer');
    await expect(readyCard).toContainText(/Ready/i);
  } finally {
    await context.close();
  }
});
