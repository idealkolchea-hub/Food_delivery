import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './useToast';
import { useCustomerSession } from './useCustomerSession';
import { supabase } from '../lib/supabase';
import { subscribeToOrdersRealtime } from '../lib/orders-realtime';

const OrderFlowContext = createContext(null);
const FALLBACK_REFRESH_MS = 10000;
const DEFAULT_COURIER = {
  name: 'Dispatch Team',
  rating: 4.9,
  phone: '+91 98110 43210',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
};

const orderSelectWithRelations = '*, restaurants(name), ratings(score, review, tags), order_status_events(status, title, detail, created_at)';
const orderSelectFallback = '*, restaurants(name), ratings(score, review, tags)';
const supabaseRestUrl = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '')
  || (typeof import.meta !== 'undefined' ? import.meta.env?.NEXT_PUBLIC_SUPABASE_URL : '')
  || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : '')
  || (typeof import.meta !== 'undefined' ? import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '')
  || '';

function toCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusCopy(status) {
  switch (status) {
    case 'pending':
      return { label: 'Order placed and awaiting kitchen confirmation', stageIndex: 0 };
    case 'accepted':
      return { label: 'Restaurant accepted your order', stageIndex: 0 };
    case 'preparing':
      return { label: 'The kitchen is preparing your order', stageIndex: 1 };
    case 'ready':
      return { label: 'Packed and ready for pickup', stageIndex: 1 };
    case 'picked_up':
      return { label: 'Your order has been picked up', stageIndex: 2 };
    case 'delivered':
      return { label: 'Delivered to your door', stageIndex: 3 };
    case 'cancelled':
      return { label: 'This order was cancelled', stageIndex: 0 };
    case 'refunded':
      return { label: 'Refund completed for this order', stageIndex: 3 };
    default:
      return { label: 'Order update in progress', stageIndex: 0 };
  }
}

function mapOrderRow(row) {
  const items = Array.isArray(row.items) ? row.items : [];
  const statusInfo = statusCopy(row.status);
  const address = row.delivery_address || {};
  const ratingRecord = Array.isArray(row.ratings) ? row.ratings[0] : row.ratings || null;
  const statusEvents = Array.isArray(row.order_status_events)
    ? [...row.order_status_events].sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    : [];
  const cancellableStatuses = ['pending', 'accepted', 'preparing', 'ready'];

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    restaurantId: row.restaurant_id,
    restaurant: row.restaurants?.name || 'Restaurant',
    restaurantName: row.restaurants?.name || 'Restaurant',
    restaurantSlug: row.restaurants?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '',
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: Number(item.price),
      image: item.image,
    })),
    total: Number(row.total || 0),
    status: row.status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    rawStatus: row.status,
    shortStatus: statusInfo.label,
    receipt: [
      ...items.map((item) => ({ label: `${item.quantity} × ${item.name}`, value: toCurrency(item.quantity * item.price) })),
      { label: 'Delivery', value: toCurrency(row.delivery_fee) },
      { label: 'Platform fee', value: toCurrency(row.platform_fee) },
      { label: 'GST', value: toCurrency(row.gst) },
      { label: 'Discount', value: `-${toCurrency(row.discount || 0).replace('$', '')}` },
    ],
    destination: address.label || 'Delivery address',
    destinationLine: [address.line1, address.landmark || address.area, address.city].filter(Boolean).join(', '),
    paymentMethod: row.payment_method?.toUpperCase() || 'COD',
    paymentStatus: row.payment_status,
    customerName: address.name || '',
    customerPhone: address.phone || '',
    deliveryPartnerId: row.delivery_partner_id || null,
    rating: ratingRecord ? {
      score: ratingRecord.score,
      review: ratingRecord.review || '',
      tags: ratingRecord.tags || [],
    } : null,
    statusEvents,
    canCancel: cancellableStatuses.includes(row.status),
    canRate: row.status === 'delivered',
    etaMinutes: row.eta_minutes || 30,
    etaSeconds: Math.max(0, (row.eta_minutes || 30) * 60),
    initialEtaSeconds: Math.max(0, (row.eta_minutes || 30) * 60),
    stageIndex: statusInfo.stageIndex,
    courier: row.delivery_partner_id
      ? {
        ...DEFAULT_COURIER,
        name: 'Delivery partner assigned',
      }
      : DEFAULT_COURIER,
  };
}

async function queryOrdersForProfile(profileId) {
  let response = await supabase
    .from('orders')
    .select(orderSelectWithRelations)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (response.error && response.error.message?.includes('order_status_events')) {
    response = await supabase
      .from('orders')
      .select(orderSelectFallback)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });
  }

  return response;
}

async function querySingleOrder(profileId, orderId) {
  async function fetchOrderNoStore(selectClause) {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token || '';

    if (!supabaseRestUrl || !supabaseAnonKey || !accessToken) {
      return supabase
        .from('orders')
        .select(selectClause)
        .eq('id', orderId)
        .eq('profile_id', profileId)
        .maybeSingle();
    }

    const url = new URL(`${supabaseRestUrl}/rest/v1/orders`);
    url.searchParams.set('select', selectClause);
    url.searchParams.set('id', `eq.${orderId}`);
    url.searchParams.set('profile_id', `eq.${profileId}`);
    const restResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
    });

    const payload = await restResponse.json().catch(() => null);
    if (!restResponse.ok) {
      return {
        data: null,
        error: {
          message: payload?.message || payload?.error || 'Failed to load order.',
        },
      };
    }

    return {
      data: Array.isArray(payload) ? payload[0] || null : payload,
      error: null,
    };
  }

  let response = await fetchOrderNoStore(orderSelectWithRelations);

  if (response.error && response.error.message?.includes('order_status_events')) {
    response = await fetchOrderNoStore(orderSelectFallback);
  }

  return response;
}

async function loadOrdersForProfile(profileId) {
  if (!profileId) {
    return { activeOrder: null, orderHistory: [] };
  }

  const { data, error } = await queryOrdersForProfile(profileId);
  if (error) {
    throw new Error(error.message || 'Failed to load orders.');
  }

  const history = (data || []).map(mapOrderRow);
  const activeOrder = history.find((order) => !['delivered', 'cancelled', 'refunded'].includes(order.rawStatus)) || null;

  return { activeOrder, orderHistory: history };
}

function deriveOrderState(orderHistory) {
  const history = orderHistory
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    orderHistory: history,
    activeOrder: history.find((order) => !['delivered', 'cancelled', 'refunded'].includes(order.rawStatus)) || null,
  };
}

function mergeOrderState(current, nextOrder, orderId) {
  const filtered = current.orderHistory.filter((entry) => entry.id !== orderId);
  const nextHistory = nextOrder ? [nextOrder, ...filtered] : filtered;
  return deriveOrderState(nextHistory);
}

function patchOrderFromRealtime(currentOrder, row) {
  if (!currentOrder || !row?.status) {
    return currentOrder;
  }

  const statusInfo = statusCopy(row.status);
  const cancellableStatuses = ['pending', 'accepted', 'preparing', 'ready'];
  const hasDeliveryPartner = row.delivery_partner_id ?? currentOrder.deliveryPartnerId;

  return {
    ...currentOrder,
    updatedAt: row.updated_at || currentOrder.updatedAt,
    rawStatus: row.status,
    status: row.status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    shortStatus: statusInfo.label,
    stageIndex: statusInfo.stageIndex,
    paymentStatus: row.payment_status || currentOrder.paymentStatus,
    deliveryPartnerId: row.delivery_partner_id ?? currentOrder.deliveryPartnerId,
    canCancel: cancellableStatuses.includes(row.status),
    canRate: row.status === 'delivered',
    courier: hasDeliveryPartner
      ? {
        ...(currentOrder.courier || DEFAULT_COURIER),
        name: currentOrder.courier?.name && currentOrder.courier.name !== DEFAULT_COURIER.name
          ? currentOrder.courier.name
          : 'Delivery partner assigned',
      }
      : (currentOrder.courier || DEFAULT_COURIER),
  };
}

function mergePatchedRealtimeOrderState(current, row, orderId) {
  const existingOrder = current.orderHistory.find((entry) => entry.id === orderId)
    || (current.activeOrder?.id === orderId ? current.activeOrder : null);

  if (!existingOrder) {
    return {
      activeOrder: current.activeOrder,
      orderHistory: current.orderHistory,
    };
  }

  return mergeOrderState(current, patchOrderFromRealtime(existingOrder, row), orderId);
}

export function OrderFlowProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    customerId: null,
    profileId: null,
    activeOrder: null,
    orderHistory: [],
  });
  const { pushToast } = useToast();
  const { loading: customerLoading, customer } = useCustomerSession();

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      try {
        if (customerLoading) return;
        if (!customer?.profileId) {
          if (ignore) return;
          setState((current) => ({
            ...current,
            loading: false,
            customerId: null,
            profileId: null,
            activeOrder: null,
            orderHistory: [],
          }));
          return;
        }

        const orders = await loadOrdersForProfile(customer.profileId);
        if (ignore) return;
        setState({
          loading: false,
          customerId: customer.id,
          profileId: customer.profileId,
          ...orders,
        });
      } catch (error) {
        if (ignore) return;
        setState((current) => ({ ...current, loading: false }));
        pushToast({
          type: 'error',
          title: 'Orders unavailable',
          description: error.message || 'We could not load your order history.',
        });
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [customerLoading, customer?.id, customer?.profileId, pushToast]);

  useEffect(() => {
    if (!customer?.profileId || customerLoading) {
      return undefined;
    }

    const refreshOrders = async () => {
      const orders = await loadOrdersForProfile(customer.profileId);
      setState((current) => ({
        ...current,
        customerId: customer.id,
        profileId: customer.profileId,
        ...orders,
      }));
      return orders;
    };

    const unsubscribe = subscribeToOrdersRealtime({
      channelName: `orders-customer-${customer.profileId}`,
      scopes: [{ filter: `profile_id=eq.${customer.profileId}` }],
      onOrderChange: async ({ orderId, row }) => {
        if (!orderId) return;

        try {
          if (row) {
            setState((current) => ({
              ...current,
              customerId: customer.id,
              profileId: customer.profileId,
              ...mergePatchedRealtimeOrderState(current, row, orderId),
            }));
          }

          const { data, error } = await querySingleOrder(customer.profileId, orderId);
          if (error) {
            throw new Error(error.message || 'Unable to refresh this order.');
          }

          setState((current) => ({
            ...current,
            customerId: customer.id,
            profileId: customer.profileId,
            ...mergeOrderState(current, data ? mapOrderRow(data) : null, orderId),
          }));
        } catch (error) {
          console.error(error);
        }
      },
      onError: (error) => {
        console.error(error);
      },
    });

    const intervalId = window.setInterval(() => {
      refreshOrders().catch((error) => {
        console.error(error);
      });
    }, FALLBACK_REFRESH_MS);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [customer?.id, customer?.profileId, customerLoading]);

  const value = useMemo(() => ({
    loading: state.loading,
    customerId: state.customerId,
    profileId: state.profileId,
    activeOrder: state.activeOrder,
    orderHistory: state.orderHistory,
    refreshOrders: async () => {
      const profileId = state.profileId || customer?.profileId;
      if (!profileId) return;
      const orders = await loadOrdersForProfile(profileId);
      setState((current) => ({
        ...current,
        customerId: customer?.id || current.customerId,
        profileId,
        ...orders,
      }));
    },
    getOrderById: async (orderId) => {
      const profileId = state.profileId || customer?.profileId;
      if (!profileId || !orderId) return null;

      const { data, error } = await querySingleOrder(profileId, orderId);
      if (error) {
        throw new Error(error.message || 'Failed to load order.');
      }

      if (!data) return null;
      return mapOrderRow(data);
    },
    getOrderEvents: async (orderId) => {
      const profileId = state.profileId || customer?.profileId;
      if (!profileId || !orderId) return [];
      const { data, error } = await querySingleOrder(profileId, orderId);
      if (error || !data) return [];
      return mapOrderRow(data).statusEvents || [];
    },
    placeOrder: async ({ checkout }) => {
      if (!customer?.profileId || customer.role !== 'customer') {
        throw new Error('Your verified customer session is not ready yet.');
      }

      const { data, error } = await supabase.rpc('place_cod_order', {
        p_checkout: checkout,
      });

      if (error) {
        throw new Error(error.message || 'Failed to place order.');
      }

      const { data: orderRow, error: orderError } = await querySingleOrder(customer.profileId, data.id);
      if (orderError || !orderRow) {
        throw new Error(orderError?.message || 'Order was created but could not be reloaded.');
      }

      const newOrder = mapOrderRow(orderRow);
      setState((current) => ({
        ...current,
        customerId: customer.id,
        profileId: customer.profileId,
        ...mergeOrderState(current, newOrder, newOrder.id),
      }));

      pushToast({
        type: 'success',
        title: 'Order placed',
        description: `${newOrder.restaurant} has your order now.`,
      });

      return newOrder;
    },
    createPaymentIntent: async ({ checkout, paymentMethod }) => {
      if (!customer?.profileId || customer.role !== 'customer') {
        throw new Error('Verify your session before starting payment.');
      }

      const { data, error } = await supabase.rpc('create_demo_payment_intent', {
        p_payment_method: paymentMethod,
        p_checkout: checkout,
      });

      if (error) {
        throw new Error(error.message || 'Unable to start payment.');
      }

      return data;
    },
    getPaymentIntent: async (intentId) => {
      const profileId = state.profileId || customer?.profileId;
      if (!profileId || !intentId) return null;
      const { data, error } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', intentId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message || 'Unable to load payment intent.');
      }

      return data;
    },
    completePaymentIntent: async ({ intentId, outcome = 'success', failureReason = null }) => {
      if (!customer?.profileId || customer.role !== 'customer') {
        throw new Error('Verify your session before completing payment.');
      }

      const { data, error } = await supabase.rpc('complete_demo_payment_intent', {
        p_intent_id: intentId,
        p_outcome: outcome === 'failed' ? 'failed' : 'succeeded',
        p_failure_reason: failureReason,
      });

      if (error) {
        throw new Error(error.message || 'Unable to finalize payment.');
      }

      if (data?.status === 'failed') {
        return { paymentIntent: { id: intentId, status: 'failed' }, order: null };
      }

      const { data: orderRow, error: orderError } = await querySingleOrder(customer.profileId, data.order_id);
      if (orderError || !orderRow) {
        throw new Error(orderError?.message || 'Payment succeeded but the order could not be reloaded.');
      }

      const newOrder = mapOrderRow(orderRow);
      setState((current) => ({
        ...current,
        customerId: customer.id,
        profileId: customer.profileId,
        ...mergeOrderState(current, newOrder, newOrder.id),
      }));

      pushToast({
        type: 'success',
        title: 'Payment approved',
        description: `${newOrder.restaurant} is now preparing your order.`,
      });

      return {
        paymentIntent: { id: intentId, status: 'succeeded', order_id: newOrder.id },
        order: newOrder,
      };
    },
    cancelOrder: async (orderId) => {
      const profileId = state.profileId || customer?.profileId;
      if (!profileId || !orderId) {
        throw new Error('Order is not available for cancellation.');
      }

      const { error } = await supabase.rpc('cancel_customer_order', {
        p_order_id: orderId,
      });

      if (error) {
        throw new Error(error.message || 'Unable to cancel this order.');
      }

      const orders = await loadOrdersForProfile(profileId);
      setState((current) => ({
        ...current,
        ...orders,
      }));

      const cancelledOrder = orders.orderHistory.find((entry) => entry.id === orderId);
      pushToast({
        type: 'info',
        title: 'Order cancelled',
        description: `${cancelledOrder?.restaurant || 'The restaurant'} has been removed from the active queue.`,
      });
    },
    submitRating: async ({ orderId, score, review, tags = [] }) => {
      const profileId = state.profileId || customer?.profileId;
      if (!profileId || !orderId) {
        throw new Error('We could not attach this rating.');
      }

      const { error } = await supabase.rpc('submit_customer_rating', {
        p_order_id: orderId,
        p_score: score,
        p_review: review,
        p_tags: tags,
      });

      if (error) {
        throw new Error(error.message || 'Unable to save your rating.');
      }

      const orders = await loadOrdersForProfile(profileId);
      setState((current) => ({
        ...current,
        ...orders,
      }));

      pushToast({
        type: 'success',
        title: 'Thanks for rating',
        description: 'Your feedback is now attached to the order.',
      });
    },
    reorder: async (order, addItem) => {
      for (const item of order.items) {
        // eslint-disable-next-line no-await-in-loop
        await addItem({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          restaurantName: order.restaurant,
          restaurantSlug: order.restaurantSlug,
          restaurantId: order.restaurantId,
        }, { silent: true });
      }

      pushToast({
        type: 'info',
        title: 'Back in your cart',
        description: `${order.restaurant} is ready for another round.`,
      });
    },
  }), [state, pushToast, customer]);

  return <OrderFlowContext.Provider value={value}>{children}</OrderFlowContext.Provider>;
}

export function useOrderFlow() {
  const context = useContext(OrderFlowContext);
  if (!context) {
    throw new Error('useOrderFlow must be used within OrderFlowProvider');
  }
  return context;
}
