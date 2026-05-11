import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRestaurantOps } from '../hooks/useRestaurantOps';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { childVariants } from '../components/layout/PageWrapper';

function eventTimestamp(value) {
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function PartnerOrderDetail() {
  const { orderId } = useParams();
  const { getOrderById, updateOrderStatus } = useRestaurantOps();
  const { pushToast } = useToast();
  const [state, setState] = useState({
    loading: true,
    order: null,
    error: '',
    pendingAction: '',
  });

  useEffect(() => {
    let ignore = false;

    async function hydrate() {
      try {
        setState((current) => ({ ...current, loading: true, error: '' }));
        const order = await getOrderById(orderId);
        if (ignore) return;
        if (!order) {
          setState({ loading: false, order: null, error: 'That order is no longer visible to this restaurant.', pendingAction: '' });
          return;
        }
        setState({ loading: false, order, error: '', pendingAction: '' });
      } catch (error) {
        if (ignore) return;
        setState({ loading: false, order: null, error: error.message || 'Unable to load this order.', pendingAction: '' });
      }
    }

    hydrate();

    return () => {
      ignore = true;
    };
  }, [getOrderById, orderId]);

  const handleAction = async (targetStatus, reasonCode = null) => {
    try {
      setState((current) => ({ ...current, pendingAction: targetStatus }));
      const nextOrder = await updateOrderStatus({
        orderId,
        targetStatus,
        reasonCode,
      });
      setState((current) => ({
        ...current,
        order: nextOrder || current.order,
        pendingAction: '',
      }));
      pushToast({
        type: 'success',
        title: 'Order updated',
        description: `Moved to ${targetStatus.replace(/_/g, ' ')}.`,
      });
    } catch (error) {
      setState((current) => ({ ...current, pendingAction: '' }));
      pushToast({
        type: 'error',
        title: 'Update failed',
        description: error.message || 'Please try again.',
      });
    }
  };

  if (state.loading) {
    return (
      <motion.section variants={childVariants} className="grid place-items-center py-16">
        <GlassCard interactive={false} className="max-w-xl p-10 text-center">
          <h1 className="font-display text-4xl italic text-white">Loading order detail</h1>
        </GlassCard>
      </motion.section>
    );
  }

  if (!state.order) {
    return (
      <motion.section variants={childVariants} className="space-y-6">
        <GlassCard interactive={false} className="p-8">
          <Badge>Order detail</Badge>
          <h1 className="mt-4 font-display text-5xl italic text-white">Order unavailable</h1>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">{state.error || 'We could not find that order for this restaurant.'}</p>
          <div className="mt-6">
            <Link to="/partner">
              <Button>Back to overview</Button>
            </Link>
          </div>
        </GlassCard>
      </motion.section>
    );
  }

  const order = state.order;

  return (
    <div className="space-y-6">
      <motion.section variants={childVariants}>
        <div className="mb-3 flex flex-wrap gap-3">
          <Badge>Order detail</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{order.statusLabel}</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{order.paymentStatus}</Badge>
        </div>
        <h1 className="font-display text-5xl italic text-white">{order.customerName}</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          {order.itemCount} items · {order.totalLabel} · opened {order.elapsedMinutes} minutes ago
        </p>
      </motion.section>

      <motion.section variants={childVariants} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Packing detail</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Kitchen checklist</h2>
              </div>
              <Link to="/partner/queue">
                <Button variant="secondary" className="px-4 py-2 text-xs">Back to queue</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.id || item.name}`} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{item.quantity} × {item.name}</div>
                      <div className="mt-2 text-sm text-[color:var(--text-secondary)]">Unit ₹{item.unitPrice.toFixed(2)} · Line ₹{item.lineTotal.toFixed(2)}</div>
                    </div>
                    <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{item.quantity} pcs</Badge>
                  </div>
                  {item.specialInstructions ? (
                    <div className="mt-4 rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                      Special instructions: <span className="text-white">{item.specialInstructions}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Status timeline</p>
            <div className="mt-5 space-y-4">
              {order.statusEvents.length ? order.statusEvents.map((event, index) => (
                <div key={`${event.created_at}-${index}`} className="relative pl-7">
                  <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border border-white/14 bg-[rgba(255,107,53,0.35)]" />
                  <div className="text-sm font-semibold text-white">{event.title || event.status.replace(/_/g, ' ')}</div>
                  {event.detail ? <div className="mt-1 text-sm text-[color:var(--text-secondary)]">{event.detail}</div> : null}
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                    {event.source || 'system'} · {event.created_by_role || 'system'} · {eventTimestamp(event.created_at)}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-[color:var(--text-secondary)]">Status events will appear here as the kitchen moves this order.</div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Actions</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {order.canAccept ? (
                <Button disabled={Boolean(state.pendingAction)} onClick={() => handleAction('accepted')}>
                  {state.pendingAction === 'accepted' ? 'Accepting...' : 'Accept order'}
                </Button>
              ) : null}
              {order.canMarkPreparing ? (
                <Button disabled={Boolean(state.pendingAction)} onClick={() => handleAction('preparing')}>
                  {state.pendingAction === 'preparing' ? 'Moving to prep...' : 'Mark preparing'}
                </Button>
              ) : null}
              {order.canMarkReady ? (
                <Button disabled={Boolean(state.pendingAction)} onClick={() => handleAction('ready')}>
                  {state.pendingAction === 'ready' ? 'Marking ready...' : 'Mark ready'}
                </Button>
              ) : null}
              {order.canReject ? (
                <Button variant="ghost" disabled={Boolean(state.pendingAction)} onClick={() => handleAction('cancelled', 'restaurant_rejected')}>
                  {state.pendingAction === 'cancelled' ? 'Rejecting...' : 'Reject order'}
                </Button>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Customer handoff</p>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--text-secondary)]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Name</div>
                <div className="mt-1 text-white">{order.customerName}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Phone</div>
                <div className="mt-1 text-white">{order.customerPhone || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery address</div>
                <div className="mt-1 text-white">{order.destination}</div>
              </div>
              {order.addressInstructions ? (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Drop notes</div>
                  <div className="mt-1 text-white">{order.addressInstructions}</div>
                </div>
              ) : null}
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery partner</div>
                <div className="mt-1 text-white">{order.deliveryPartnerName || 'Waiting for claim'}</div>
                <div className="mt-1 text-[color:var(--text-secondary)]">{order.deliveryPartnerStatus}</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.section>
    </div>
  );
}
