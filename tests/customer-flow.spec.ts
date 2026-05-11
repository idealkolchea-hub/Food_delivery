import { expect, test, type Locator, type Page } from '@playwright/test';
import { createCustomerAccount } from './helpers/supabase';

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

async function signInCustomer(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('ketan@example.com').fill(email);
  await page.getByPlaceholder('Your account password').fill(password);
  await clickAction(page.getByRole('button', { name: /^Sign in$/i }));
  await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/$/);
}

async function addFirstMenuItemToCart(page: Page) {
  await page.goto('/');
  await page.locator('a[href^="/restaurant/"]').first().click();
  await clickAction(page.getByText('+ Add to cart').first());
  await expect(page.getByRole('link', { name: /Go to cart/i }).first()).toBeVisible();
  await clickAction(page.getByRole('link', { name: /Go to cart/i }).first());
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('button', { name: /Continue to checkout/i })).toBeVisible();
}

async function goToCheckout(page: Page) {
  await addFirstMenuItemToCart(page);
  await clickAction(page.getByRole('button', { name: /Continue to checkout/i }));
  await expect(page).toHaveURL(/\/checkout$/);
}

async function fillCheckout(page: Page, name: string) {
  const fillIfNeeded = async (selector: ReturnType<Page['getByPlaceholder']> | ReturnType<Page['locator']>, value: string) => {
    const currentValue = await selector.inputValue().catch(() => '');
    if (currentValue === value) return;
    await selector.evaluate((element, nextValue) => {
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      descriptor?.set?.call(element, nextValue);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  };

  await fillIfNeeded(page.getByPlaceholder('Aarav Mehta'), name);
  await fillIfNeeded(page.locator('input[placeholder="9876543210"]').first(), '9876543210');
  await fillIfNeeded(page.getByPlaceholder('Flat 4B, Skyline Residency'), 'Flat 9B, Riverlight Residency');
  await fillIfNeeded(page.getByPlaceholder('Koregaon Park'), 'Koregaon Park');
  await fillIfNeeded(page.getByPlaceholder('Pune'), 'Pune');
  await fillIfNeeded(page.getByPlaceholder('Near Osho Garden'), 'Near Osho Garden');
  await fillIfNeeded(page.getByPlaceholder('Call when outside'), 'Ring once and leave at the lobby.');
}

async function selectUpiAndOpenPayment(page: Page) {
  await clickAction(page.getByRole('button', { name: /Method UPI/i }));
  await clickAction(page.getByRole('button', { name: /Continue to payment/i }));
  await expect(page).toHaveURL(/\/payment\//);
  await expect(page.getByText(/Approve the UPI payment/i)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await blockRemoteImages(page);
});

test('keeps failed demo payment on the payment screen', async ({ page }) => {
  const account = await createCustomerAccount('Riya Failure');

  await signInCustomer(page, account.email, account.password);
  await goToCheckout(page);
  await fillCheckout(page, account.name);
  await selectUpiAndOpenPayment(page);

  const paymentUrl = page.url();
  await clickAction(page.getByRole('button', { name: /Simulate failure/i }));

  await expect(page).toHaveURL(paymentUrl);
  await expect(page.getByText(/Payment failed in demo mode/i)).toBeVisible();
});

test('places a successful UPI order and allows cancellation from tracking', async ({ page }) => {
  const account = await createCustomerAccount('Arjun Success');

  await signInCustomer(page, account.email, account.password);
  await goToCheckout(page);
  await fillCheckout(page, account.name);
  await selectUpiAndOpenPayment(page);

  await clickAction(page.getByRole('button', { name: /Pay ₹/i }));
  await expect(page).toHaveURL(/\/order-confirmation\//);
  await expect(page.getByText(/Your order is in the system/i)).toBeVisible();

  const orderId = page.url().split('/').pop();
  expect(orderId).toBeTruthy();

  const trackHref = await page.getByRole('link', { name: /Track order/i }).getAttribute('href');
  await page.goto(trackHref || `/track/${orderId}`);
  await expect(page).toHaveURL(new RegExp(`/track/${orderId}$`));
  await expect(page.getByText(/Live tracking/i)).toBeVisible();

  await clickAction(page.getByRole('button', { name: /^Cancel order$/i }));
  await expect
    .poll(async () => page.locator('body').innerText())
    .toMatch(/could not complete this order|Cancelled/i);
});
