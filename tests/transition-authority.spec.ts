import { expect, test } from '@playwright/test';
import {
  createDeliveryAccount,
  createRestaurantOrder,
  createVendorAccountForRestaurant,
  getOrderEvents,
  getOrderSnapshot,
  invokeOrderRpcAsUser,
  runDeliveryOrderAction,
} from './helpers/supabase';

test.setTimeout(90000);

test('customer cancellation authority preserves ready-order cancellation', async () => {
  const order = await createRestaurantOrder({
    customerName: 'Authority Customer',
    status: 'ready',
  });

  const result = await invokeOrderRpcAsUser({
    email: order.customer.email,
    password: order.customer.password,
    action: 'cancel_customer_order',
    args: {
      p_order_id: order.orderId,
    },
  });

  expect(result.error).toBeNull();

  const snapshot = await getOrderSnapshot(order.orderId);
  expect(snapshot.status).toBe('cancelled');

  const events = await getOrderEvents(order.orderId);
  expect(events.at(-1)).toMatchObject({
    status: 'cancelled',
    event_type: 'order.cancelled',
    previous_status: 'ready',
    source: 'customer_cancel',
  });
});

test('vendor cannot skip directly from pending to ready', async () => {
  const order = await createRestaurantOrder({
    customerName: 'Authority Vendor Customer',
    status: 'pending',
  });
  const vendor = await createVendorAccountForRestaurant('Authority Vendor', order.restaurantId);

  const result = await invokeOrderRpcAsUser({
    email: vendor.email,
    password: vendor.password,
    action: 'restaurant_update_order_status',
    args: {
      p_order_id: order.orderId,
      p_target_status: 'ready',
      p_detail: null,
      p_reason_code: null,
    },
  });

  expect(result.error).toContain('transition is not allowed');

  const snapshot = await getOrderSnapshot(order.orderId);
  expect(snapshot.status).toBe('pending');

  const events = await getOrderEvents(order.orderId);
  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    status: 'pending',
    event_type: 'order.placed',
  });
});

test('claimed ready orders cannot be stolen by another delivery partner', async () => {
  const order = await createRestaurantOrder({
    customerName: 'Authority Delivery Customer',
    status: 'ready',
  });
  const firstDelivery = await createDeliveryAccount('Authority Delivery One');
  const secondDelivery = await createDeliveryAccount('Authority Delivery Two');

  await runDeliveryOrderAction({
    email: firstDelivery.email,
    password: firstDelivery.password,
    orderId: order.orderId,
    action: 'claim_delivery_order',
  });

  const secondClaim = await invokeOrderRpcAsUser({
    email: secondDelivery.email,
    password: secondDelivery.password,
    action: 'claim_delivery_order',
    args: {
      p_order_id: order.orderId,
    },
  });

  expect(secondClaim.error).toContain('already claimed');

  const snapshot = await getOrderSnapshot(order.orderId);
  expect(snapshot.status).toBe('ready');
  expect(snapshot.delivery_partner_id).toBe(firstDelivery.userId);

  const events = await getOrderEvents(order.orderId);
  expect(events.at(-1)).toMatchObject({
    status: 'ready',
    event_type: 'delivery.assigned',
    previous_status: 'ready',
    source: 'delivery_ops',
  });
  expect(events.filter((event) => event.event_type === 'delivery.assigned')).toHaveLength(1);
});
