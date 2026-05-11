import { expect, test } from '@playwright/test';
import {
  createDeliveryAccount,
  createRestaurantOrder,
  getDeliveryHandoffTokens,
  getOrderEvents,
  getOrderSnapshot,
  issueDeliveryHandoffToken,
  invokeOrderRpcAsUser,
  runDeliveryOrderAction,
} from './helpers/supabase';

test.setTimeout(90000);

async function createPickedUpOrder(customerName: string) {
  const order = await createRestaurantOrder({
    customerName,
    status: 'ready',
  });
  const delivery = await createDeliveryAccount(`${customerName} Delivery`);

  await runDeliveryOrderAction({
    email: delivery.email,
    password: delivery.password,
    orderId: order.orderId,
    action: 'claim_delivery_order',
  });

  await runDeliveryOrderAction({
    email: delivery.email,
    password: delivery.password,
    orderId: order.orderId,
    action: 'pickup_delivery_order',
  });

  return { order, delivery };
}

test('issuing a new handoff token revokes the previous active token and returns a fresh raw code once', async () => {
  const { order } = await createPickedUpOrder('Token Rotate Customer');

  const firstToken = await issueDeliveryHandoffToken({
    email: order.customer.email,
    password: order.customer.password,
    orderId: order.orderId,
  });
  const secondToken = await issueDeliveryHandoffToken({
    email: order.customer.email,
    password: order.customer.password,
    orderId: order.orderId,
  });

  expect(firstToken.token).toMatch(/^\d{6}$/);
  expect(secondToken.token).toMatch(/^\d{6}$/);
  expect(secondToken.token).not.toBe(firstToken.token);

  const tokens = await getDeliveryHandoffTokens(order.orderId);
  expect(tokens).toHaveLength(2);
  expect(tokens[0].status).toBe('revoked');
  expect(tokens[1].status).toBe('active');
  expect(tokens[0].token_hash).not.toBe(firstToken.token);
  expect(tokens[1].token_hash).not.toBe(secondToken.token);

  const events = await getOrderEvents(order.orderId);
  expect(events.map((event) => event.event_type)).toContain('delivery.token_issued');
  expect(events.map((event) => event.event_type)).toContain('delivery.token_revoked');
});

test('invalid delivery handoff token is rejected and logs a failed verification event', async () => {
  const { order, delivery } = await createPickedUpOrder('Invalid Token Customer');
  await issueDeliveryHandoffToken({
    email: order.customer.email,
    password: order.customer.password,
    orderId: order.orderId,
  });

  const invalidAttempt = await invokeOrderRpcAsUser({
    email: delivery.email,
    password: delivery.password,
    action: 'complete_delivery_order_with_token',
    args: {
      p_order_id: order.orderId,
      p_token: '000000',
    },
  });

  const invalidMessage = invalidAttempt.error || invalidAttempt.data?.message || '';
  expect(invalidMessage.toLowerCase()).toContain('incorrect');

  if (invalidAttempt.data) {
    expect(invalidAttempt.data).toMatchObject({
      ok: false,
      reason: 'invalid',
      order_id: order.orderId,
      status: 'picked_up',
    });
  }

  const snapshot = await getOrderSnapshot(order.orderId);
  expect(snapshot.status).toBe('picked_up');

  const tokens = await getDeliveryHandoffTokens(order.orderId);
  expect(tokens[0].status).toBe('active');

  if (invalidAttempt.data?.ok === false) {
    const events = await getOrderEvents(order.orderId);
    expect(
      events.some((event) => (
        event.status === 'picked_up'
        && event.event_type === 'delivery.token_verification_failed'
        && event.source === 'delivery_handoff'
      )),
    ).toBe(true);
  }
});

test('legacy completion RPC no longer bypasses delivery token verification', async () => {
  const { order, delivery } = await createPickedUpOrder('Legacy Complete Customer');
  await issueDeliveryHandoffToken({
    email: order.customer.email,
    password: order.customer.password,
    orderId: order.orderId,
  });

  const legacyComplete = await invokeOrderRpcAsUser({
    email: delivery.email,
    password: delivery.password,
    action: 'complete_delivery_order',
    args: {
      p_order_id: order.orderId,
    },
  });

  expect(legacyComplete.error).toContain('Delivery token required');

  const snapshot = await getOrderSnapshot(order.orderId);
  expect(snapshot.status).toBe('picked_up');
});
