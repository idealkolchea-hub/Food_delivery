import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import { createDeliveryAccount, createRestaurantOrder } from './helpers/supabase';

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

async function openAgentContext(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await blockRemoteImages(page);
  return { context, page };
}

test.beforeEach(async ({ page }) => {
  await blockRemoteImages(page);
});

test('agent direct routes load and an open offer can be claimed', async ({ browser }) => {
  const deliveryAccount = await createDeliveryAccount('Rohan Patil');
  const readyOrder = await createRestaurantOrder({
    customerName: 'Delivery Customer',
    status: 'ready',
  });

  const { context, page } = await openAgentContext(browser);

  try {
    await page.goto('/agent/auth');
    await expect(page.getByText(/Launch the delivery-side console/i)).toBeVisible();

    await page.getByPlaceholder('rider@biteblast.app').fill(deliveryAccount.email);
    await page.getByPlaceholder('Your account password').fill(deliveryAccount.password);
    await clickAction(page.getByRole('button', { name: /Open delivery console/i }));
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/agent\/active$/);
    await expect(page.getByText(/Keep the next handoff obvious/i)).toBeVisible();
    await expect(page.locator('a[href="/partner/queue"]')).toHaveCount(0);

    await page.goto('/agent/orders');
    await expect(page.getByRole('heading', { name: /Review open offers and recent runs/i })).toBeVisible();
    const offerCard = page.getByText(readyOrder.orderId, { exact: true }).locator('xpath=ancestor::*[contains(@class, "rounded-[24px]")][1]');
    await expect(offerCard).toBeVisible({ timeout: 15000 });
    await clickAction(offerCard.getByRole('link', { name: /Review offer/i }));

    await expect(page).toHaveURL(new RegExp(`/agent/orders/${readyOrder.orderId}$`));
    await clickAction(page.getByRole('button', { name: /Claim order/i }));
    await expect(page.getByRole('button', { name: /Confirm pickup/i })).toBeVisible();
  } finally {
    await context.close();
  }
});
