import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import {
  createAdminAccount,
  createCustomerAccount,
  createDeliveryAccount,
  createVendorAccountForRestaurant,
  getLatestOrderForProfile,
  runDeliveryOrderAction,
} from './helpers/supabase';

test.setTimeout(300000);

async function blockRemoteImages(page: Page) {
  await page.route(/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i, (route) => route.abort());
  await page.route(/images\.unsplash\.com/i, (route) => route.abort());
}

async function openContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await blockRemoteImages(page);
  return { context, page };
}

async function clickAction(target: Locator) {
  await expect(target).toBeVisible({ timeout: 15000 });
  await expect(target).toBeEnabled({ timeout: 15000 });
  await target.click();
}

async function signInCustomer(page: Page, email: string, password: string, next = '/') {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await expect(page.getByTestId('demo-access-panel')).toBeVisible();
  await page.getByPlaceholder('ketan@example.com').fill(email);
  await page.getByPlaceholder('Your account password').fill(password);
  await clickAction(page.getByRole('button', { name: /^Sign in$/i }));
  if (next === '/') {
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/$/);
    return;
  }

  await expect.poll(() => page.url(), { timeout: 15000 }).toContain(next);
}

async function signInVendor(page: Page, email: string, password: string) {
  await page.goto('/partner/auth');
  await page.getByPlaceholder('ops@restaurant.com').fill(email);
  await page.getByPlaceholder('Your account password').fill(password);
  await clickAction(page.getByRole('button', { name: /Open partner dashboard/i }));
  await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/partner\/queue$/);
}

async function signInDelivery(page: Page, email: string, password: string) {
  await page.goto('/agent/auth');
  await page.getByPlaceholder('rider@biteblast.app').fill(email);
  await page.getByPlaceholder('Your account password').fill(password);
  await clickAction(page.getByRole('button', { name: /Open delivery console/i }));
  await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/agent\/active$/);
}

async function addFirstMenuItemToCart(page: Page) {
  await page.goto('/');
  await page.locator('a[href^="/restaurant/"]').first().click();
  await clickAction(page.getByText('+ Add to cart').first());
  await clickAction(page.getByRole('link', { name: /Go to cart/i }).first());
  await expect(page).toHaveURL(/\/cart$/);
  await clickAction(page.getByRole('button', { name: /Continue to checkout/i }));
  await expect(page).toHaveURL(/\/checkout$/);
}

async function addMenuItemToCart(page: Page, restaurantName?: string) {
  await page.goto('/');

  if (restaurantName) {
    const preferredLink = page.getByRole('link', { name: new RegExp(restaurantName, 'i') }).first();
    if (await preferredLink.isVisible().catch(() => false)) {
      await preferredLink.click();
    } else {
      await page.locator('a[href^="/restaurant/"]').first().click();
    }
  } else {
    await page.locator('a[href^="/restaurant/"]').first().click();
  }

  await clickAction(page.getByText('+ Add to cart').first());
  await clickAction(page.getByRole('link', { name: /Go to cart/i }).first());
  await expect(page).toHaveURL(/\/cart$/);
  await clickAction(page.getByRole('button', { name: /Continue to checkout/i }));
  await expect(page).toHaveURL(/\/checkout$/);
}

async function fillCheckout(page: Page, name: string) {
  const fillIfNeeded = async (target: Locator, value: string) => {
    const currentValue = await target.inputValue().catch(() => '');
    if (currentValue === value) return;
    await target.evaluate((element, nextValue) => {
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

async function readMetricValue(page: Page, testId: string) {
  const card = page.getByTestId(testId);
  await expect(card).toBeVisible({ timeout: 15000 });
  const text = await card.textContent();
  const match = text?.match(/(\d+)/);
  return Number(match?.[1] || 0);
}

test('customer to vendor to delivery to admin lifecycle completes end to end', async ({ browser }) => {
  const delivery = await createDeliveryAccount('Scenario Delivery');
  const admin = await createAdminAccount('Scenario Admin');
  const customer = await createCustomerAccount('Scenario Customer');

  const customerSession = await openContext(browser);
  const vendorSession = await openContext(browser);
  const deliverySession = await openContext(browser);
  const adminSession = await openContext(browser);

  try {
    await Promise.all([
      signInDelivery(deliverySession.page, delivery.email, delivery.password),
      signInCustomer(adminSession.page, admin.email, admin.password, '/studio'),
      signInCustomer(customerSession.page, customer.email, customer.password),
    ]);

    await deliverySession.page.goto('/agent/orders');
    await expect(deliverySession.page).toHaveURL(/\/agent\/orders$/);
    await adminSession.page.goto('/studio');
    await expect(adminSession.page).toHaveURL(/\/studio$/);
    await expect(adminSession.page.getByTestId('studio-metrics')).toBeVisible();
    await expect(adminSession.page.getByTestId('studio-orders-list')).not.toContainText('Loading order ledger...', { timeout: 15000 });

    const initialTotalOrders = await readMetricValue(adminSession.page, 'studio-metric-total-orders');

    await addMenuItemToCart(customerSession.page);
    await fillCheckout(customerSession.page, customer.name);
    await clickAction(customerSession.page.getByRole('button', { name: /Cash on delivery/i }));
    await clickAction(customerSession.page.getByRole('button', { name: /^Place order$/i }));

    await expect(customerSession.page).toHaveURL(/\/order-confirmation\//);
    const orderId = customerSession.page.url().split('/').pop();
    expect(orderId).toBeTruthy();

    const latestOrder = await getLatestOrderForProfile(customer.userId);
    expect(latestOrder.id).toBe(orderId);

    const vendor = await createVendorAccountForRestaurant('Scenario Vendor', latestOrder.restaurant_id);
    await signInVendor(vendorSession.page, vendor.email, vendor.password);
    await expect(vendorSession.page.locator('body')).toContainText(orderId || '', { timeout: 15000 });
    await expect
      .poll(() => readMetricValue(adminSession.page, 'studio-metric-total-orders'), { timeout: 15000 })
      .toBe(initialTotalOrders + 1);
    await adminSession.page.getByPlaceholder('Order ID, restaurant, customer, delivery, payment').fill(orderId || '');
    await expect(adminSession.page.getByTestId(`studio-order-${orderId}`)).toBeVisible({ timeout: 15000 });

    await customerSession.page.goto(`/track/${orderId}`);
    await expect(customerSession.page).toHaveURL(new RegExp(`/track/${orderId}$`));

    await vendorSession.page.goto(`/partner/orders/${orderId}`);
    await expect(vendorSession.page.getByRole('button', { name: /Accept order/i })).toBeVisible();
    await clickAction(vendorSession.page.getByRole('button', { name: /Accept order/i }));
    await expect(customerSession.page.locator('body')).toContainText('Restaurant accepted your order', { timeout: 15000 });

    await clickAction(vendorSession.page.getByRole('button', { name: /Mark preparing/i }));
    await clickAction(vendorSession.page.getByRole('button', { name: /Mark ready/i }));
    await expect(customerSession.page.locator('body')).toContainText('Packed and ready for pickup', { timeout: 15000 });
    await expect(deliverySession.page.locator('body')).toContainText(orderId || '', { timeout: 15000 });

    await expect(deliverySession.page.locator('body')).toContainText(orderId || '', { timeout: 15000 });
    await runDeliveryOrderAction({
      email: delivery.email,
      password: delivery.password,
      orderId: orderId || '',
      action: 'claim_delivery_order',
    });

    await expect(customerSession.page.locator('body')).toContainText('Delivery partner assigned', { timeout: 15000 });

    await runDeliveryOrderAction({
      email: delivery.email,
      password: delivery.password,
      orderId: orderId || '',
      action: 'pickup_delivery_order',
    });

    await expect(customerSession.page.getByTestId('tracking-handoff-panel')).toBeVisible({ timeout: 15000 });
    await clickAction(customerSession.page.getByTestId('tracking-handoff-generate'));
    const initialToken = ((await customerSession.page.getByTestId('tracking-handoff-token').textContent()) || '').replace(/\s+/g, '');
    expect(initialToken).toMatch(/^\d{6}$/);

    await clickAction(customerSession.page.getByTestId('tracking-handoff-generate'));
    await expect(customerSession.page.getByTestId('tracking-handoff-notice')).toContainText('New code invalidates the old one.', { timeout: 15000 });
    const refreshedToken = ((await customerSession.page.getByTestId('tracking-handoff-token').textContent()) || '').replace(/\s+/g, '');
    expect(refreshedToken).toMatch(/^\d{6}$/);
    expect(refreshedToken).not.toBe(initialToken);

    await deliverySession.page.goto(`/agent/orders/${orderId}`);
    await expect(deliverySession.page.getByTestId('agent-complete-panel')).toBeVisible({ timeout: 15000 });
    await clickAction(deliverySession.page.getByRole('button', { name: /^Complete delivery$/i }));
    await expect(deliverySession.page.getByTestId('agent-token-entry-panel')).toBeVisible({ timeout: 15000 });
    await deliverySession.page.getByTestId('agent-token-input').fill(refreshedToken);
    await clickAction(deliverySession.page.getByTestId('agent-token-submit'));
    await expect(adminSession.page.getByTestId(`studio-order-${orderId}`)).toContainText(/Delivered/i, { timeout: 15000 });
    await expect(customerSession.page.getByTestId('tracking-handoff-panel')).toHaveCount(0, { timeout: 15000 });
    await clickAction(adminSession.page.getByTestId(`studio-order-${orderId}`));
    await expect(adminSession.page.getByTestId('studio-order-detail')).toBeVisible({ timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('order.placed', { timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('restaurant.accepted', { timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('restaurant.preparing', { timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('restaurant.ready', { timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('delivery.assigned', { timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('delivery.picked_up', { timeout: 15000 });
    await expect(adminSession.page.getByTestId('studio-order-timeline')).toContainText('delivery.delivered', { timeout: 15000 });
  } finally {
    await vendorSession.context.close();
    await deliverySession.context.close();
    await adminSession.context.close();
    await customerSession.context.close();
  }
});
