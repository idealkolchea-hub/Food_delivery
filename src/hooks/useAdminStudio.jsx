import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { subscribeToOrdersRealtime } from '../lib/orders-realtime';

const profileSelect = 'id, role, name, email, phone, is_guest, verified_at, last_login_at, created_at, updated_at';
const orderSelect = 'id, status, total, payment_status, payment_method, created_at, updated_at, profile_id, user_id, delivery_partner_id, restaurant_id, restaurants(name), delivery_address';
const FALLBACK_REFRESH_MS = 10000;

function safeText(value, fallback = 'Unknown') {
  return value || fallback;
}

function normalizeMetadata(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function deriveEventType(event) {
  if (event.event_type) return event.event_type;
  if (event.source === 'checkout' && event.status === 'pending') return 'order.placed';
  if (event.source === 'customer_cancel' && event.status === 'cancelled') return 'order.cancelled';
  if (event.source === 'vendor_ops' && event.status === 'accepted') return 'restaurant.accepted';
  if (event.source === 'vendor_ops' && event.status === 'preparing') return 'restaurant.preparing';
  if (event.source === 'vendor_ops' && event.status === 'ready' && event.title === 'Packed and ready') return 'restaurant.ready';
  if (event.source === 'delivery_ops' && event.status === 'ready' && event.title === 'Delivery partner assigned') return 'delivery.assigned';
  if (event.source === 'delivery_ops' && event.status === 'picked_up') return 'delivery.picked_up';
  if (event.source === 'delivery_ops' && event.status === 'delivered') return 'delivery.delivered';
  return 'order.status_changed';
}

function mapProfiles(rows) {
  return (rows || []).map((row) => ({
    id: row.id,
    role: row.role || 'guest',
    name: safeText(row.name, 'Unnamed user'),
    email: row.email || '',
    phone: row.phone || '',
    isGuest: row.is_guest === true,
    verifiedAt: row.verified_at || null,
    lastLoginAt: row.last_login_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function mapOrders(rows, profilesById) {
  return (rows || []).map((row) => {
    const customerProfile = profilesById.get(row.profile_id || row.user_id) || null;
    const deliveryProfile = profilesById.get(row.delivery_partner_id) || null;
    const address = row.delivery_address || {};

    return {
      id: row.id,
      status: row.status || 'pending',
      total: Number(row.total || 0),
      paymentStatus: row.payment_status || 'pending',
      paymentMethod: row.payment_method || 'cod',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      restaurantName: row.restaurants?.name || 'Restaurant',
      customerName: customerProfile?.name || address.name || 'Customer',
      customerEmail: customerProfile?.email || '',
      deliveryName: deliveryProfile?.name || '',
      deliveryEmail: deliveryProfile?.email || '',
      deliveryPartnerId: row.delivery_partner_id || null,
    };
  });
}

function mapTimelineEvents(rows, profilesById) {
  const orderedEvents = (rows || [])
    .slice()
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());

  return orderedEvents.map((event, index) => {
    const actorId = event.actor_id || event.created_by_profile_id || null;
    const actorRole = event.actor_role || event.created_by_role || (actorId ? 'unknown' : 'system');
    const actorProfile = actorId ? profilesById.get(actorId) : null;
    const metadata = normalizeMetadata(event.metadata);
    const previousStatus = event.previous_status ?? (index > 0 ? orderedEvents[index - 1]?.status || null : null);

    return {
      id: event.id,
      orderId: event.order_id,
      title: event.title || safeText(deriveEventType(event), 'Order event'),
      detail: event.detail || '',
      status: event.status || 'pending',
      previousStatus,
      eventType: deriveEventType(event),
      actorId,
      actorRole,
      actorName: actorProfile?.name || '',
      actorEmail: actorProfile?.email || '',
      source: event.source || 'system',
      reasonCode: event.reason_code || '',
      createdAt: event.created_at,
      metadata,
      hasMetadata: Object.keys(metadata).length > 0,
    };
  });
}

async function loadStudioSnapshot() {
  const [profilesResponse, ordersResponse] = await Promise.all([
    supabase.from('app_profiles').select(profileSelect).order('created_at', { ascending: false }),
    supabase.from('orders').select(orderSelect).order('created_at', { ascending: false }),
  ]);

  if (profilesResponse.error) {
    throw new Error(profilesResponse.error.message || 'Unable to load admin users.');
  }

  if (ordersResponse.error) {
    throw new Error(ordersResponse.error.message || 'Unable to load admin orders.');
  }

  const profiles = mapProfiles(profilesResponse.data);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const orders = mapOrders(ordersResponse.data, profilesById);

  return {
    profiles,
    orders,
  };
}

async function querySingleStudioOrder(orderId) {
  return supabase
    .from('orders')
    .select(orderSelect)
    .eq('id', orderId)
    .maybeSingle();
}

async function queryOrderTimeline(orderId) {
  return supabase
    .from('order_status_events')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
}

export function useAdminStudio() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    profiles: [],
    orders: [],
    refreshedAt: null,
  });
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [timelineState, setTimelineState] = useState({
    loading: false,
    error: '',
    events: [],
  });
  const profilesRef = useRef([]);
  const selectedOrderIdRef = useRef('');

  useEffect(() => {
    profilesRef.current = state.profiles;
  }, [state.profiles]);

  useEffect(() => {
    selectedOrderIdRef.current = selectedOrderId;
  }, [selectedOrderId]);

  useEffect(() => {
    let ignore = false;

    async function loadTimeline(orderId, profiles = profilesRef.current) {
      if (!orderId) {
        if (!ignore) {
          setTimelineState({ loading: false, error: '', events: [] });
        }
        return;
      }

      try {
        if (!ignore) {
          setTimelineState((current) => ({ ...current, loading: true, error: '' }));
        }

        const { data, error } = await queryOrderTimeline(orderId);
        if (ignore) return;
        if (error) {
          throw new Error(error.message || 'Unable to load this order timeline.');
        }

        const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
        setTimelineState({
          loading: false,
          error: '',
          events: mapTimelineEvents(data, profilesById),
        });
      } catch (error) {
        if (!ignore) {
          setTimelineState({ loading: false, error: error.message || 'Timeline unavailable.', events: [] });
        }
      }
    }

    async function hydrate({ silent = false } = {}) {
      try {
        const snapshot = await loadStudioSnapshot();
        if (ignore) return;
        profilesRef.current = snapshot.profiles;
        setState({
          loading: false,
          error: '',
          profiles: snapshot.profiles,
          orders: snapshot.orders,
          refreshedAt: new Date().toISOString(),
        });

        if (selectedOrderIdRef.current) {
          await loadTimeline(selectedOrderIdRef.current, snapshot.profiles);
        }
      } catch (error) {
        if (ignore) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || 'Admin data is unavailable.',
        }));

        if (!silent) {
          console.error(error);
        }
      }
    }

    hydrate();
    const unsubscribe = subscribeToOrdersRealtime({
      channelName: 'orders-admin-studio',
      scopes: [{ filter: null }],
      onOrderChange: async ({ orderId }) => {
        if (!orderId || ignore) return;

        try {
          const { data, error } = await querySingleStudioOrder(orderId);
          if (ignore) return;
          if (error) {
            throw new Error(error.message || 'Unable to refresh this studio order.');
          }

          setState((current) => {
            const profilesById = new Map(current.profiles.map((profile) => [profile.id, profile]));
            const nextOrder = data ? mapOrders([data], profilesById)[0] : null;
            const filtered = current.orders.filter((order) => order.id !== orderId);
            const orders = nextOrder ? [nextOrder, ...filtered] : filtered;

            return {
              ...current,
              loading: false,
              error: '',
              orders: orders
                .slice()
                .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
              refreshedAt: new Date().toISOString(),
            };
          });

          if (selectedOrderIdRef.current === orderId) {
            const profiles = profilesRef.current;
            const { data: timelineData, error: timelineError } = await queryOrderTimeline(orderId);
            if (ignore) return;
            if (timelineError) {
              throw new Error(timelineError.message || 'Unable to refresh this order timeline.');
            }

            const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
            setTimelineState({
              loading: false,
              error: '',
              events: mapTimelineEvents(timelineData, profilesById),
            });
          }
        } catch (error) {
          if (!ignore) {
            console.error(error);
          }
        }
      },
      onError: (error) => {
        if (!ignore) {
          console.error(error);
        }
      },
    });

    const intervalId = window.setInterval(() => {
      hydrate({ silent: true });
    }, FALLBACK_REFRESH_MS);

    return () => {
      ignore = true;
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function hydrateTimeline() {
      if (!selectedOrderId) {
        setTimelineState({ loading: false, error: '', events: [] });
        return;
      }

      try {
        setTimelineState((current) => ({ ...current, loading: true, error: '' }));
        const { data, error } = await queryOrderTimeline(selectedOrderId);
        if (ignore) return;
        if (error) {
          throw new Error(error.message || 'Unable to load this order timeline.');
        }

        const profilesById = new Map(state.profiles.map((profile) => [profile.id, profile]));
        setTimelineState({
          loading: false,
          error: '',
          events: mapTimelineEvents(data, profilesById),
        });
      } catch (error) {
        if (!ignore) {
          setTimelineState({ loading: false, error: error.message || 'Timeline unavailable.', events: [] });
        }
      }
    }

    hydrateTimeline();

    return () => {
      ignore = true;
    };
  }, [selectedOrderId, state.profiles]);

  const metrics = useMemo(() => ({
    totalOrders: state.orders.length,
    activeDeliveries: state.orders.filter((order) => ['ready', 'picked_up'].includes(order.status)).length,
    completedDeliveries: state.orders.filter((order) => order.status === 'delivered').length,
    registeredVendors: state.profiles.filter((profile) => profile.role === 'vendor').length,
    registeredCustomers: state.profiles.filter((profile) => profile.role === 'customer').length,
  }), [state.orders, state.profiles]);

  const selectedOrder = useMemo(
    () => state.orders.find((order) => order.id === selectedOrderId) || null,
    [selectedOrderId, state.orders],
  );

  return {
    ...state,
    metrics,
    selectedOrderId,
    selectedOrder,
    selectedTimeline: timelineState.events,
    timelineLoading: timelineState.loading,
    timelineError: timelineState.error,
    selectOrder: (orderId) => setSelectedOrderId(orderId || ''),
    refresh: async () => {
      setState((current) => ({ ...current, loading: true, error: '' }));
      const snapshot = await loadStudioSnapshot();
      profilesRef.current = snapshot.profiles;
      setState({
        loading: false,
        error: '',
        profiles: snapshot.profiles,
        orders: snapshot.orders,
        refreshedAt: new Date().toISOString(),
      });
      return snapshot;
    },
  };
}
