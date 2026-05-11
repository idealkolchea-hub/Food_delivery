import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeliveryOps } from '../hooks/useDeliveryOps';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { childVariants } from '../components/layout/PageWrapper';

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

export default function AgentOrderDetail() {
  const { orderId } = useParams();
  const { getOrderById, claimOrder, pickupOrder, completeOrderWithToken } = useDeliveryOps();
  const { pushToast } = useToast();
  const [state, setState] = useState({
    loading: true,
    order: null,
    error: '',
    pendingAction: '',
    tokenEntryOpen: false,
    deliveryTokenInput: '',
    tokenSubmitError: '',
  });

  useEffect(() => {
    let ignore = false;

    async function hydrate() {
      try {
        setState((current) => ({ ...current, loading: true, error: '' }));
        const order = await getOrderById(orderId);
        if (ignore) return;
        if (!order) {
          setState({
            loading: false,
            order: null,
            error: 'That order is no longer visible to this delivery account.',
            pendingAction: '',
            tokenEntryOpen: false,
            deliveryTokenInput: '',
            tokenSubmitError: '',
          });
          return;
        }
        setState({
          loading: false,
          order,
          error: '',
          pendingAction: '',
          tokenEntryOpen: false,
          deliveryTokenInput: '',
          tokenSubmitError: '',
        });
      } catch (error) {
        if (ignore) return;
        setState({
          loading: false,
          order: null,
          error: error.message || 'Unable to load this delivery order.',
          pendingAction: '',
          tokenEntryOpen: false,
          deliveryTokenInput: '',
          tokenSubmitError: '',
        });
      }
    }

    hydrate();

    return () => {
      ignore = true;
    };
  }, [getOrderById, orderId]);

  if (!state.loading && !state.order && !state.error) {
    return <Navigate to="/agent/orders" replace />;
  }

  const refreshOrder = async () => {
    const order = await getOrderById(orderId, { force: true });
    setState((current) => ({
      ...current,
      order,
      loading: false,
      error: order ? '' : 'That order is no longer visible to this delivery account.',
      tokenEntryOpen: order?.canComplete ? current.tokenEntryOpen : false,
    }));
  };

  const resolveDeliveryCodeMessage = (message) => {
    if (!message) return 'That delivery code is incorrect.';

    return message
      .replace(/delivery token/gi, 'delivery code')
      .replace(/handoff code/gi, 'delivery code');
  };

  const performAction = async (actionKey) => {
    try {
      setState((current) => ({ ...current, pendingAction: actionKey }));

      if (actionKey === 'claim') {
        await claimOrder(orderId);
      } else if (actionKey === 'pickup') {
        await pickupOrder(orderId);
      }

      await refreshOrder();
      pushToast({
        type: 'success',
        title: 'Delivery updated',
        description: `Order moved through the ${actionKey} step.`,
      });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Delivery update failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setState((current) => ({ ...current, pendingAction: '' }));
    }
  };

  const submitCompletionToken = async () => {
    try {
      setState((current) => ({
        ...current,
        pendingAction: 'complete',
        tokenSubmitError: '',
      }));

      const result = await completeOrderWithToken(orderId, state.deliveryTokenInput);

      if (result?.ok === false) {
        const deliveryCodeMessage = resolveDeliveryCodeMessage(result.message);
        setState((current) => ({
          ...current,
          pendingAction: '',
          deliveryTokenInput: '',
          tokenSubmitError: deliveryCodeMessage,
          tokenEntryOpen: true,
        }));
        pushToast({
          type: 'error',
          title: 'Delivery code rejected',
          description: deliveryCodeMessage || 'Ask the customer for a fresh delivery code.',
        });
        return;
      }

      await refreshOrder();
      setState((current) => ({
        ...current,
        pendingAction: '',
        tokenEntryOpen: false,
        deliveryTokenInput: '',
        tokenSubmitError: '',
      }));
      pushToast({
        type: 'success',
        title: 'Delivery updated',
        description: 'Code verified. Delivery completed.',
      });
    } catch (error) {
      const deliveryCodeMessage = resolveDeliveryCodeMessage(error.message || 'Please try again.');
      setState((current) => ({
        ...current,
        pendingAction: '',
        tokenSubmitError: deliveryCodeMessage,
      }));
      pushToast({
        type: 'error',
        title: 'Delivery update failed',
        description: deliveryCodeMessage,
      });
    }
  };

  if (state.loading) {
    return (
      <motion.section variants={childVariants} className="grid place-items-center py-16">
        <GlassCard interactive={false} className="max-w-xl p-10 text-center">
          <h1 className="font-display text-4xl italic text-white">Loading delivery detail</h1>
        </GlassCard>
      </motion.section>
    );
  }

  if (!state.order) {
    return (
      <motion.section variants={childVariants} className="space-y-6">
        <GlassCard interactive={false} className="p-8">
          <Badge>Delivery detail</Badge>
          <h1 className="mt-4 font-display text-5xl italic text-white">Order unavailable</h1>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">{state.error || 'We could not find that order for this delivery account.'}</p>
          <div className="mt-6">
            <Link to="/agent/orders">
              <Button>Back to deliveries</Button>
            </Link>
          </div>
        </GlassCard>
      </motion.section>
    );
  }

  const { order } = state;

  return (
    <div className="space-y-6">
      <motion.section variants={childVariants}>
        <div className="mb-3 flex flex-wrap gap-3">
          <Badge>{order.isOpenOffer ? 'Open offer' : 'Delivery detail'}</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{order.statusLabel}</Badge>
        </div>
        <h1 className="bb-mono text-4xl font-semibold tracking-[-0.03em] text-white md:text-5xl">{order.id}</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          {order.restaurantName} to {order.customerName} in {order.destinationArea}. Use this screen to claim the order, confirm pickup, or complete delivery with the customer&apos;s code.
        </p>
      </motion.section>

      <motion.section variants={childVariants} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard interactive={false} className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Restaurant</div>
              <div className="mt-2 text-xl font-semibold text-white">{order.restaurantName}</div>
              <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{order.itemCount} items · ETA {order.etaMinutes || 0} min</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Customer</div>
              <div className="mt-2 text-xl font-semibold text-white">{order.customerName}</div>
              <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{order.customerPhone || 'Phone unavailable'}</div>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-white/10 bg-white/6 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Drop location</div>
            <div className="mt-2 text-white">
              {[order.deliveryAddress.label, order.deliveryAddress.building, order.deliveryAddress.street, order.deliveryAddress.area, order.deliveryAddress.city]
                .filter(Boolean)
                .join(', ')}
            </div>
            {order.deliveryAddress.instructions ? (
              <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{order.deliveryAddress.instructions}</div>
            ) : null}
          </div>

          <div className="mt-5 rounded-[20px] border border-white/10 bg-white/6 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Line items</div>
            <div className="mt-3 space-y-3">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.id || item.name}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="text-white">{item.name} x {item.quantity}</div>
                  <div className="text-[color:var(--text-secondary)]">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Next step</div>
          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
              <div className="text-sm text-[color:var(--text-secondary)]">Payment</div>
              <div className="mt-2 text-xl font-semibold text-white">{order.paymentMethod.toUpperCase()} · {order.totalLabel}</div>
              <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
                Assignment: {order.deliveryAssignment?.status ? order.deliveryAssignment.status.replace(/_/g, ' ') : 'not assigned yet'}
              </div>
            </div>

            {order.canClaim ? (
              <Button className="w-full" onClick={() => performAction('claim')} disabled={state.pendingAction === 'claim'}>
                {state.pendingAction === 'claim' ? 'Claiming offer...' : 'Claim order'}
              </Button>
            ) : null}

            {order.canPickup ? (
              <Button className="w-full" onClick={() => performAction('pickup')} disabled={state.pendingAction === 'pickup'}>
                {state.pendingAction === 'pickup' ? 'Confirming pickup...' : 'Confirm pickup'}
              </Button>
            ) : null}

            {order.canComplete ? (
              <div className="space-y-3" data-testid="agent-complete-panel">
                <Button
                  className="w-full"
                  onClick={() => setState((current) => ({
                    ...current,
                    tokenEntryOpen: true,
                    tokenSubmitError: '',
                  }))}
                  disabled={state.pendingAction === 'complete'}
                >
                  {state.pendingAction === 'complete' ? 'Completing delivery...' : 'Complete delivery'}
                </Button>
                {state.tokenEntryOpen ? (
                  <div
                    data-testid="agent-token-entry-panel"
                    className="bb-glass-inner p-5"
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                      Customer code
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-white">
                      Enter customer code
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
                      Complete delivery only after the customer shares the current 6-digit delivery code.
                    </div>
                    <input
                      data-testid="agent-token-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={state.deliveryTokenInput}
                      onChange={(event) => {
                        const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
                        setState((current) => ({
                          ...current,
                          deliveryTokenInput: digitsOnly,
                          tokenSubmitError: '',
                        }));
                      }}
                      className="bb-input bb-mono mt-4 text-lg tracking-[0.35em]"
                      placeholder="000000"
                    />
                    {state.tokenSubmitError ? (
                      <div className="mt-3 text-sm text-rose-200">{state.tokenSubmitError}</div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        data-testid="agent-token-submit"
                        onClick={submitCompletionToken}
                        disabled={state.pendingAction === 'complete' || state.deliveryTokenInput.length !== 6}
                      >
                        {state.pendingAction === 'complete' ? 'Completing delivery...' : 'Complete delivery'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setState((current) => ({
                          ...current,
                          tokenEntryOpen: false,
                          deliveryTokenInput: '',
                          tokenSubmitError: '',
                        }))}
                        disabled={state.pendingAction === 'complete'}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!order.canClaim && !order.canPickup && !order.canComplete ? (
              <div className="rounded-[20px] border border-dashed border-white/12 bg-white/4 p-4 text-sm text-[color:var(--text-secondary)]">
                No action is needed on this delivery right now.
              </div>
            ) : null}

            <Link to="/agent/orders">
              <Button variant="ghost" className="w-full">Back to deliveries</Button>
            </Link>
          </div>
        </GlassCard>
      </motion.section>
    </div>
  );
}
