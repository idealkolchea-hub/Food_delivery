import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from './useToast';
import { useAgentSession } from './useAgentSession';
import { supabase } from '../lib/supabase';
import { subscribeToOrdersRealtime } from '../lib/orders-realtime';

const DeliveryOpsContext = createContext(null);
const FALLBACK_REFRESH_MS = 10000;

const deliveryOrderSelect = `
  *,
  restaurants(name),
  order_items(id, name, quantity, unit_price, line_total, image_url, special_instructions),
  order_status_events(status, title, detail, created_at, source, reason_code, created_by_role),
  delivery_assignments(id, agent_profile_id, status, assigned_at, picked_up_at, delivered_at, notes)
`;

function formatStatus(status = '') {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function mapDeliveryOrder(row, currentAgentId) {
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
  const deliveryAssignment = Array.isArray(row.delivery_assignments) ? row.delivery_assignments[0] : row.delivery_assignments || null;
  const assignedToCurrentAgent = row.delivery_partner_id === currentAgentId || deliveryAssignment?.agent_profile_id === currentAgentId;
  const isOpenOffer = row.status === 'ready' && !row.delivery_partner_id;

  return {
    id: row.id,
    status: row.status,
    statusLabel: formatStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    restaurantName: row.restaurants?.name || 'Restaurant',
    customerName: address.name || 'Customer',
    customerPhone: address.phone || '',
    paymentMethod: row.payment_method || 'cod',
    paymentStatus: row.payment_status || 'pending',
    total: Number(row.total || 0),
    totalLabel: formatCurrency(row.total || 0),
    etaMinutes: Number(row.eta_minutes || 0),
    destination: [address.label, address.line1 || address.building, address.landmark || address.area, address.city].filter(Boolean).join(', '),
    destinationArea: address.area || address.city || 'Delivery area',
    deliveryAddress: {
      label: address.label || 'Delivery address',
      building: address.line1 || address.building || '',
      street: address.landmark || address.street || '',
      area: address.area || '',
      city: address.city || '',
      instructions: address.instructions || '',
    },
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    deliveryAssignment,
    statusEvents,
    isOpenOffer,
    assignedToCurrentAgent,
    canClaim: isOpenOffer,
    canPickup: assignedToCurrentAgent && row.status === 'ready',
    canComplete: assignedToCurrentAgent && row.status === 'picked_up',
  };
}

async function fetchDeliveryOrders(currentAgentId) {
  const { data, error } = await supabase
    .from('orders')
    .select(deliveryOrderSelect)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load delivery orders.');
  }

  return (data || []).map((row) => mapDeliveryOrder(row, currentAgentId));
}

async function fetchDeliveryOrder(orderId, currentAgentId) {
  const { data, error } = await supabase
    .from('orders')
    .select(deliveryOrderSelect)
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load this delivery order.');
  }

  return data ? mapDeliveryOrder(data, currentAgentId) : null;
}

export function DeliveryOpsProvider({ children }) {
  const { pushToast } = useToast();
  const { loading: agentLoading, agent, hasAgentAccess } = useAgentSession();
  const processedEventsRef = useRef(new Map());
  const [state, setState] = useState({
    loading: true,
    orders: [],
  });

  useEffect(() => {
    let ignore = false;

    async function hydrate() {
      try {
        if (agentLoading) return;
        if (!hasAgentAccess || !agent?.id) {
          if (ignore) return;
          setState({ loading: false, orders: [] });
          return;
        }

        const orders = await fetchDeliveryOrders(agent.id);
        if (ignore) return;
        setState({ loading: false, orders });
      } catch (error) {
        if (ignore) return;
        setState((current) => ({ ...current, loading: false }));
        pushToast({
          type: 'error',
          title: 'Delivery queue unavailable',
          description: error.message || 'We could not load the delivery queue.',
        });
      }
    }

    hydrate();

    return () => {
      ignore = true;
    };
  }, [agent?.id, agentLoading, hasAgentAccess, pushToast]);

  useEffect(() => {
    if (agentLoading || !hasAgentAccess || !agent?.id) {
      return undefined;
    }

    const refreshOrders = async () => {
      const orders = await fetchDeliveryOrders(agent.id);
      setState({ loading: false, orders });
      return orders;
    };

    const mergeRealtimeOrder = async (orderId, commitTimestamp) => {
      if (!orderId) return;

      const eventKey = `${orderId}:${commitTimestamp || 'unknown'}`;
      if (processedEventsRef.current.has(eventKey)) {
        return;
      }

      processedEventsRef.current.set(eventKey, Date.now());

      try {
        const nextOrder = await fetchDeliveryOrder(orderId, agent.id);
        setState((current) => {
          const filtered = current.orders.filter((entry) => entry.id !== orderId);
          const orders = nextOrder ? [nextOrder, ...filtered] : filtered;
          return {
            loading: false,
            orders: orders
              .slice()
              .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
          };
        });
      } catch (error) {
        console.error(error);
      }

      if (processedEventsRef.current.size > 40) {
        const nextMap = new Map(
          Array.from(processedEventsRef.current.entries()).slice(-20),
        );
        processedEventsRef.current = nextMap;
      }
    };

    const unsubscribe = subscribeToOrdersRealtime({
      channelName: `orders-delivery-${agent.id}`,
      scopes: [
        { filter: 'status=eq.ready' },
        { filter: `delivery_partner_id=eq.${agent.id}` },
      ],
      onOrderChange: ({ orderId, payload }) => {
        mergeRealtimeOrder(orderId, payload.commit_timestamp);
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
  }, [agent?.id, agentLoading, hasAgentAccess]);

  const value = useMemo(() => {
    const openOffers = state.orders.filter((order) => order.isOpenOffer);
    const assignedOrders = state.orders.filter((order) => order.assignedToCurrentAgent);
    const activeOrders = assignedOrders.filter((order) => !['delivered', 'cancelled', 'refunded'].includes(order.status));
    const completedOrders = assignedOrders.filter((order) => order.status === 'delivered');
    const activeOrder = activeOrders[0] || null;
    const totalEarnings = completedOrders.reduce((sum, order) => sum + order.total, 0);

    async function refreshOrders() {
      if (!agent?.id) {
        setState({ loading: false, orders: [] });
        return [];
      }

      const orders = await fetchDeliveryOrders(agent.id);
      setState({ loading: false, orders });
      return orders;
    }

    function syncOrderState(nextOrder, orderId) {
      setState((current) => {
        const filtered = current.orders.filter((entry) => entry.id !== orderId);
        const orders = nextOrder ? [nextOrder, ...filtered] : filtered;
        return {
          loading: false,
          orders: orders
            .slice()
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
        };
      });

      return nextOrder;
    }

    async function refreshOrder(orderId) {
      const nextOrder = await fetchDeliveryOrder(orderId, agent.id);
      return syncOrderState(nextOrder, orderId);
    }

    async function mutateOrder(rpcName, orderId) {
      const { error } = await supabase.rpc(rpcName, {
        p_order_id: orderId,
      });

      if (error) {
        throw new Error(error.message || 'Unable to update this delivery order.');
      }

      return refreshOrder(orderId);
    }

    return {
      loading: state.loading,
      orders: state.orders,
      openOffers,
      assignedOrders,
      activeOrders,
      completedOrders,
      activeOrder,
      refreshOrders,
      getOrderById: async (orderId, options = {}) => {
        const useCache = options.force !== true;
        const cached = useCache ? state.orders.find((order) => order.id === orderId) : null;
        if (cached) return cached;
        if (!agent?.id) return null;
        return fetchDeliveryOrder(orderId, agent.id);
      },
      claimOrder: async (orderId) => mutateOrder('claim_delivery_order', orderId),
      pickupOrder: async (orderId) => mutateOrder('pickup_delivery_order', orderId),
      completeOrder: async (orderId) => mutateOrder('complete_delivery_order', orderId),
      completeOrderWithToken: async (orderId, token) => {
        const { data, error } = await supabase.rpc('complete_delivery_order_with_token', {
          p_order_id: orderId,
          p_token: token,
        });

        if (error) {
          throw new Error(error.message || 'Unable to complete this delivery.');
        }

        if (data?.ok === false) {
          return data;
        }

        const nextOrder = await refreshOrder(orderId);
        return {
          ...(typeof data === 'object' && data ? data : {}),
          ok: true,
          order: nextOrder,
        };
      },
      counts: {
        openOffers: openOffers.length,
        activeOrders: activeOrders.length,
        completedOrders: completedOrders.length,
        totalEarnings,
      },
    };
  }, [agent?.id, state]);

  return <DeliveryOpsContext.Provider value={value}>{children}</DeliveryOpsContext.Provider>;
}

export function useDeliveryOps() {
  const context = useContext(DeliveryOpsContext);
  if (!context) {
    throw new Error('useDeliveryOps must be used within DeliveryOpsProvider');
  }

  return context;
}
