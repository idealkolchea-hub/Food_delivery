import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './useToast';
import { useRestaurantSession } from './useRestaurantSession';
import { supabase } from '../lib/supabase';
import { subscribeToOrdersRealtime } from '../lib/orders-realtime';

const RestaurantOpsContext = createContext(null);
const FALLBACK_REFRESH_MS = 10000;

const queueOrderSelect = `
  *,
  restaurants(name),
  order_items(id, name, quantity, unit_price, line_total, image_url, special_instructions),
  order_status_events(status, title, detail, created_at, source, reason_code, created_by_role)
`;

function currency(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function prettyStatus(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function queueBucket(status) {
  if (status === 'pending') return 'incoming';
  if (['accepted', 'preparing'].includes(status)) return 'active';
  if (status === 'ready') return 'ready';
  return 'completed';
}

function mapRestaurantOrder(row) {
  const address = row.delivery_address || {};
  const items = Array.isArray(row.order_items) && row.order_items.length
    ? row.order_items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      lineTotal: Number(item.line_total || 0),
      image: item.image_url || '',
      specialInstructions: item.special_instructions || '',
    }))
    : (Array.isArray(row.items) ? row.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.price || 0),
      lineTotal: Number(item.price || 0) * Number(item.quantity || 0),
      image: item.image || '',
      specialInstructions: item.specialInstructions || '',
    })) : []);

  const statusEvents = Array.isArray(row.order_status_events)
    ? row.order_status_events.slice().sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    : [];

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurants?.name || '',
    status: row.status,
    statusLabel: prettyStatus(row.status),
    bucket: queueBucket(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    elapsedMinutes: Math.max(0, Math.floor((Date.now() - new Date(row.created_at).getTime()) / 60000)),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    subtotal: Number(row.subtotal || 0),
    total: Number(row.total || 0),
    totalLabel: currency(row.total),
    paymentMethod: row.payment_method?.toUpperCase() || 'COD',
    paymentStatus: row.payment_status || 'pending',
    customerName: address.name || 'Guest Customer',
    customerPhone: address.phone || '',
    destination: [address.label, address.line1 || address.building, address.landmark || address.area, address.city]
      .filter(Boolean)
      .join(', '),
    addressInstructions: address.instructions || '',
    canAccept: row.status === 'pending',
    canReject: ['pending', 'accepted', 'preparing', 'ready'].includes(row.status),
    canMarkPreparing: row.status === 'accepted',
    canMarkReady: row.status === 'preparing',
    statusEvents,
    deliveryPartnerId: row.delivery_partner_id || null,
    deliveryPartnerName: row.delivery_partner_id ? 'Delivery partner assigned' : '',
    deliveryPartnerStatus: row.delivery_partner_id ? 'Assigned and heading to the restaurant.' : 'Waiting for a delivery partner to claim this order.',
  };
}

async function queryOrdersForRestaurant(restaurantId) {
  return supabase
    .from('orders')
    .select(queueOrderSelect)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
}

async function querySingleOrder(restaurantId, orderId) {
  return supabase
    .from('orders')
    .select(queueOrderSelect)
    .eq('restaurant_id', restaurantId)
    .eq('id', orderId)
    .maybeSingle();
}

async function loadRestaurantOrders(restaurantId) {
  if (!restaurantId) {
    return [];
  }

  const { data, error } = await queryOrdersForRestaurant(restaurantId);
  if (error) {
    throw new Error(error.message || 'Unable to load restaurant orders.');
  }

  return (data || []).map(mapRestaurantOrder);
}

function mergeRestaurantOrder(currentOrders, nextOrder, orderId) {
  const filtered = currentOrders.filter((entry) => entry.id !== orderId);
  const nextOrders = nextOrder ? [nextOrder, ...filtered] : filtered;
  return nextOrders
    .slice()
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function RestaurantOpsProvider({ children }) {
  const { pushToast } = useToast();
  const { restaurantLoading, restaurant } = useRestaurantSession();
  const [state, setState] = useState({
    loading: true,
    orders: [],
  });

  useEffect(() => {
    let ignore = false;

    async function hydrate() {
      try {
        if (restaurantLoading) return;
        if (!restaurant?.id) {
          if (ignore) return;
          setState({ loading: false, orders: [] });
          return;
        }

        const orders = await loadRestaurantOrders(restaurant.id);
        if (ignore) return;
        setState({ loading: false, orders });
      } catch (error) {
        if (ignore) return;
        setState((current) => ({ ...current, loading: false }));
        pushToast({
          type: 'error',
          title: 'Kitchen queue unavailable',
          description: error.message || 'We could not load the restaurant queue.',
        });
      }
    }

    hydrate();

    return () => {
      ignore = true;
    };
  }, [restaurantLoading, restaurant?.id, pushToast]);

  useEffect(() => {
    if (restaurantLoading || !restaurant?.id) {
      return undefined;
    }

    const refreshOrders = async () => {
      const orders = await loadRestaurantOrders(restaurant.id);
      setState({ loading: false, orders });
      return orders;
    };

    const unsubscribe = subscribeToOrdersRealtime({
      channelName: `orders-restaurant-${restaurant.id}`,
      scopes: [{ filter: `restaurant_id=eq.${restaurant.id}` }],
      onOrderChange: async ({ orderId }) => {
        if (!orderId) return;

        try {
          const { data, error } = await querySingleOrder(restaurant.id, orderId);
          if (error) {
            throw new Error(error.message || 'Unable to refresh this restaurant order.');
          }

          setState((current) => ({
            loading: false,
            orders: mergeRestaurantOrder(current.orders, data ? mapRestaurantOrder(data) : null, orderId),
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
  }, [restaurant?.id, restaurantLoading]);

  const queues = useMemo(() => ({
    incoming: state.orders.filter((order) => order.bucket === 'incoming'),
    active: state.orders.filter((order) => order.bucket === 'active'),
    ready: state.orders.filter((order) => order.bucket === 'ready'),
    completed: state.orders.filter((order) => order.bucket === 'completed'),
  }), [state.orders]);

  const value = useMemo(() => ({
    loading: state.loading,
    orders: state.orders,
    incomingOrders: queues.incoming,
    activeOrders: queues.active,
    readyOrders: queues.ready,
    completedOrders: queues.completed,
    counts: {
      incoming: queues.incoming.length,
      active: queues.active.length,
      ready: queues.ready.length,
      completed: queues.completed.length,
    },
    refreshOrders: async () => {
      if (!restaurant?.id) {
        setState((current) => ({ ...current, loading: false, orders: [] }));
        return [];
      }

      const orders = await loadRestaurantOrders(restaurant.id);
      setState({ loading: false, orders });
      return orders;
    },
    getOrderById: async (orderId) => {
      if (!restaurant?.id || !orderId) return null;

      const cached = state.orders.find((order) => order.id === orderId);
      if (cached) return cached;

      const { data, error } = await querySingleOrder(restaurant.id, orderId);
      if (error) {
        throw new Error(error.message || 'Unable to load this order.');
      }

      return data ? mapRestaurantOrder(data) : null;
    },
    updateOrderStatus: async ({ orderId, targetStatus, detail = null, reasonCode = null }) => {
      const { error } = await supabase.rpc('restaurant_update_order_status', {
        p_order_id: orderId,
        p_target_status: targetStatus,
        p_detail: detail,
        p_reason_code: reasonCode,
      });

      if (error) {
        throw new Error(error.message || 'Unable to update this order.');
      }

      if (!restaurant?.id) {
        return null;
      }

      const { data, error: reloadError } = await querySingleOrder(restaurant.id, orderId);
      if (reloadError) {
        throw new Error(reloadError.message || 'Unable to reload this order.');
      }

      const nextOrder = data ? mapRestaurantOrder(data) : null;
      setState((current) => ({
        loading: false,
        orders: mergeRestaurantOrder(current.orders, nextOrder, orderId),
      }));
      return nextOrder;
    },
  }), [state, queues, restaurant?.id]);

  return <RestaurantOpsContext.Provider value={value}>{children}</RestaurantOpsContext.Provider>;
}

export function useRestaurantOps() {
  const context = useContext(RestaurantOpsContext);
  if (!context) {
    throw new Error('useRestaurantOps must be used within RestaurantOpsProvider');
  }

  return context;
}
