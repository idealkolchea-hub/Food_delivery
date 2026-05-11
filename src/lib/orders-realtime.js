import { supabase } from './supabase';

function defaultEvents(events) {
  return Array.isArray(events) && events.length ? events : ['INSERT', 'UPDATE'];
}

export function subscribeToOrdersRealtime({
  channelName,
  scopes,
  events,
  onOrderChange,
  onError,
}) {
  const activeScopes = Array.isArray(scopes) ? scopes.filter(Boolean) : [];

  if (!channelName || !activeScopes.length || typeof onOrderChange !== 'function') {
    return () => {};
  }

  const channel = supabase.channel(channelName);
  const realtimeEvents = defaultEvents(events);

  activeScopes.forEach((scope, index) => {
    const filter = scope?.filter || undefined;

    realtimeEvents.forEach((event) => {
      channel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: 'orders',
          filter,
        },
        (payload) => {
          const row = payload.new || payload.old || null;
          const orderId = row?.id || null;

          onOrderChange({
            payload,
            row,
            orderId,
            event,
            scopeIndex: index,
            filter: filter || null,
          });
        },
      );
    });
  });

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      onError?.(new Error(`Orders realtime channel failed: ${channelName}`));
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
