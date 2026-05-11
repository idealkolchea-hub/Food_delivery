import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';
import { subscribeToOrdersRealtime } from '../lib/orders-realtime';
import { supabase } from '../lib/supabase';

const steps = [
  { label: 'Order placed', statuses: ['pending', 'accepted'] },
  { label: 'Preparing', statuses: ['preparing', 'ready'] },
  { label: 'Out for delivery', statuses: ['picked_up'] },
  { label: 'Delivered', statuses: ['delivered'] },
];
const reviewTags = ['Fast delivery', 'Great packaging', 'Fresh food', 'Worth reordering'];
function formatCountdown(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function stepFromStatus(status, fallback = 0) {
  const index = steps.findIndex((step) => step.statuses.includes(status));
  return index === -1 ? fallback : index;
}

function resolveTrackingOrder(liveOrder, fallbackOrder) {
  if (!liveOrder) return fallbackOrder;
  if (!fallbackOrder) return liveOrder;

  const liveStage = stepFromStatus(liveOrder.rawStatus, liveOrder.stageIndex ?? 0);
  const fallbackStage = stepFromStatus(fallbackOrder.rawStatus, fallbackOrder.stageIndex ?? 0);

  if (liveStage !== fallbackStage) {
    return liveStage > fallbackStage ? liveOrder : fallbackOrder;
  }

  const liveUpdatedAt = new Date(liveOrder.updatedAt || liveOrder.createdAt || 0).getTime();
  const fallbackUpdatedAt = new Date(fallbackOrder.updatedAt || fallbackOrder.createdAt || 0).getTime();

  return liveUpdatedAt >= fallbackUpdatedAt ? liveOrder : fallbackOrder;
}

function trackingHeadline(order, activeStep) {
  if (!order) return 'Tracking your order';
  if (order.rawStatus === 'cancelled') return `${order.restaurant} could not complete this order`;
  if (activeStep === 0) return `${order.restaurant} accepted your order`;
  if (activeStep === 1) return `${order.restaurant} is preparing your food`;
  if (activeStep === 2) return `${order.restaurant} is on its way`;
  return `${order.restaurant} delivered your order`;
}

function paymentLine(order) {
  if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
    return 'Pay with cash on delivery';
  }

  return `Paid via ${order.paymentMethod || 'Card'}`;
}

export default function Tracking() {
  const { orderId } = useParams();
  const { activeOrder, orderHistory, getOrderById, loading, cancelOrder, submitRating } = useOrderFlow();
  const { pushToast } = useToast();
  const liveOrder = useMemo(
    () => orderHistory.find((entry) => entry.id === orderId) || (activeOrder?.id === orderId ? activeOrder : null),
    [activeOrder, orderHistory, orderId],
  );
  const [fallbackOrder, setFallbackOrder] = useState(() => liveOrder);
  const [status, setStatus] = useState({ loading: !orderId, error: '' });
  const order = useMemo(() => resolveTrackingOrder(liveOrder, fallbackOrder), [fallbackOrder, liveOrder]);
  const hasFallbackOrder = Boolean(fallbackOrder);
  const [countdown, setCountdown] = useState(order?.etaSeconds || 0);
  const [ratingForm, setRatingForm] = useState({ score: order?.rating?.score || 5, review: order?.rating?.review || '', tags: order?.rating?.tags || [] });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [handoffCodeState, setHandoffCodeState] = useState({
    token: '',
    expiresAt: '',
    loading: false,
    error: '',
    notice: '',
  });

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      if (!orderId) {
        setStatus({ loading: false, error: 'Order not found.' });
        return;
      }

      if (liveOrder) {
        setFallbackOrder((current) => resolveTrackingOrder(liveOrder, current));
        setStatus({ loading: false, error: '' });
        return;
      }

      try {
        const response = await getOrderById(orderId);
        if (ignore) return;
        if (!response) {
          setStatus({
            loading: false,
            error: hasFallbackOrder ? '' : 'We could not find that order in your account.',
          });
          return;
        }
        setFallbackOrder((current) => resolveTrackingOrder(response, current));
        setStatus({ loading: false, error: '' });
      } catch (error) {
        if (ignore) return;
        setStatus({
          loading: false,
          error: hasFallbackOrder ? '' : (error.message || 'Tracking is temporarily unavailable.'),
        });
      }
    }

    if (!loading) {
      loadOrder();
    }

    return () => {
      ignore = true;
    };
  }, [getOrderById, hasFallbackOrder, liveOrder, loading, orderId]);

  useEffect(() => {
    setCountdown(order?.etaSeconds || 0);
    setRatingForm({
      score: order?.rating?.score || 5,
      review: order?.rating?.review || '',
      tags: order?.rating?.tags || [],
    });
  }, [order?.etaSeconds, order?.id]);

  useEffect(() => {
    setHandoffCodeState({
      token: '',
      expiresAt: '',
      loading: false,
      error: '',
      notice: '',
    });
  }, [order?.id]);

  useEffect(() => {
    if (!order || order.rawStatus === 'picked_up') {
      return;
    }

    setHandoffCodeState({
      token: '',
      expiresAt: '',
      loading: false,
      error: '',
      notice: '',
    });
  }, [order?.rawStatus]);

  useEffect(() => {
    if (!order || countdown <= 0 || order.rawStatus === 'delivered' || order.rawStatus === 'cancelled') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown, order]);

  useEffect(() => {
    if (!orderId || loading) {
      return undefined;
    }

    const unsubscribe = subscribeToOrdersRealtime({
      channelName: `tracking-order-${orderId}`,
      scopes: [{ filter: `id=eq.${orderId}` }],
      onOrderChange: async () => {
        try {
          const refreshed = await getOrderById(orderId);
          if (!refreshed) {
            return;
          }

          setFallbackOrder((current) => resolveTrackingOrder(refreshed, current));
          setStatus({ loading: false, error: '' });
        } catch (error) {
          if (!hasFallbackOrder) {
            setStatus({
              loading: false,
              error: error.message || 'Tracking is temporarily unavailable.',
            });
          }
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [getOrderById, hasFallbackOrder, loading, orderId]);

  const activeStep = useMemo(() => stepFromStatus(order?.rawStatus, order?.stageIndex ?? 0), [order]);
  const restaurantName = order?.restaurant || order?.restaurantName;
  const destination = order?.destination || 'Delivery address';
  const destinationLine = order?.destinationLine || 'Address coming through';
  const handoffCodeVisible = order?.rawStatus === 'picked_up';
  const courier = order?.courier || {
    name: 'Dispatch Team',
    rating: 4.9,
    phone: '+91 98110 43210',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  };

  if (loading || status.loading) {
    return (
      <PageWrapper className="mx-auto max-w-[1080px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-white/10" />
            <h1 className="font-display text-4xl italic text-white">Loading tracking</h1>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  if (!order) {
    return (
      <PageWrapper className="mx-auto max-w-[1080px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 w-28 text-6xl">🧭</div>
            <h1 className="font-display text-4xl italic text-white">Order not found</h1>
            <p className="mt-4 text-[color:var(--text-secondary)]">{status.error || 'Once you place an order, tracking will appear here automatically.'}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/orders"><Button>Open order history</Button></Link>
              <Link to="/support"><Button variant="secondary">Get support</Button></Link>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  const cancelled = order.rawStatus === 'cancelled';

  const toggleTag = (tag) => {
    setRatingForm((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((entry) => entry !== tag)
        : [...current.tags, tag],
    }));
  };

  const issueHandoffCode = async () => {
    if (!order) return;

    try {
      setHandoffCodeState((current) => ({
        ...current,
        loading: true,
        error: '',
      }));

      const previousToken = handoffCodeState.token;
      const { data, error } = await supabase.rpc('issue_delivery_handoff_token', {
        p_order_id: order.id,
      });

      if (error) {
        throw new Error(error.message || 'Could not generate a delivery code right now.');
      }

      if (!data?.token) {
        throw new Error('Could not generate a delivery code right now.');
      }

      const nextNotice = previousToken
        ? 'New code invalidates the old one.'
        : 'Share this code only when your order reaches you.';

      setHandoffCodeState({
        token: data.token,
        expiresAt: data.expires_at || '',
        loading: false,
        error: '',
        notice: nextNotice,
      });

      pushToast({
        type: 'success',
        title: previousToken ? 'New delivery code ready' : 'Delivery code ready',
        description: nextNotice,
      });
    } catch (error) {
      setHandoffCodeState((current) => ({
        ...current,
        loading: false,
        error: error.message || 'Could not generate a delivery code right now.',
      }));
    }
  };

  return (
    <PageWrapper className="mx-auto max-w-[1280px]">
      <motion.section variants={childVariants} className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard interactive={false} className="relative overflow-hidden p-4 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,107,53,0.25),transparent_35%),radial-gradient(circle_at_20%_75%,rgba(167,139,250,0.24),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]" />
          <div className="relative">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Live tracking</p>
            <h1 className="font-display text-5xl italic text-white">{trackingHeadline(order, activeStep)}</h1>
            <p className="mt-4 max-w-2xl text-sm text-[color:var(--text-secondary)]">{order.shortStatus || 'Track every step as your order moves from the restaurant to your door.'}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order</div>
                <div className="bb-mono mt-2 break-all text-2xl font-bold text-white">{order.id}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">ETA</div>
                <div className="bb-mono mt-2 text-2xl font-bold tabular-nums text-white">
                  {cancelled ? 'Cancelled' : activeStep === 3 ? 'Delivered' : formatCountdown(countdown)}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Destination</div>
                <div className="mt-2 text-2xl font-bold text-white">{destination}</div>
                <div className="mt-2 break-words text-sm text-[color:var(--text-secondary)]">{destinationLine}</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {steps.map((step, index) => {
                const completed = index < activeStep;
                const active = index === activeStep && !cancelled;
                return (
                  <div key={step.label} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${completed ? 'border-emerald-400 bg-emerald-400/18 text-emerald-300' : active ? 'pulse-ring border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)] text-[color:var(--accent-primary)]' : 'border-white/12 bg-white/8 text-[color:var(--text-muted)]'}`}>
                      {completed ? '✓' : index + 1}
                    </div>
                    <div className="mt-4 text-sm font-semibold text-white">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Courier</p>
              <div className="flex items-center gap-4">
                <Avatar src={courier.avatar} alt={courier.name} size="lg" />
                <div className="flex-1">
                  <div className="text-xl font-semibold text-white">{courier.name}</div>
                  <div className="text-sm text-[color:var(--text-secondary)]">★ {courier.rating} · {activeStep === 3 ? 'delivered' : cancelled ? 'order interrupted' : 'on the way right now'}</div>
                </div>
                <a href={`tel:${courier.phone}`} className="inline-flex">
                  <Button variant="secondary" className="h-12 w-12 rounded-full px-0">☎</Button>
                </a>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Your order</p>
                <Link to="/support" className="text-sm text-[color:var(--text-secondary)]">Need help?</Link>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm text-white">
                    <span>{item.quantity} × {item.name}</span>
                    <span className="tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4 text-sm text-[color:var(--text-secondary)]">
                <span className="font-semibold text-white">{paymentLine(order)}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {order.canCancel ? (
                  <Button
                    variant="ghost"
                    className="px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={cancelling}
                    onClick={async () => {
                      try {
                        setCancelling(true);
                        await cancelOrder(order.id);
                        const refreshed = await getOrderById(order.id);
                        setFallbackOrder(refreshed);
                      } catch (error) {
                        pushToast({
                          type: 'error',
                          title: 'Cancellation failed',
                          description: error.message || 'Please try again.',
                        });
                      } finally {
                        setCancelling(false);
                      }
                    }}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel order'}
                  </Button>
                ) : null}
                {order.canRate && !order.rating ? (
                  <Badge>Rating unlocked</Badge>
                ) : null}
              </div>
            </GlassCard>
          </motion.div>
          {handoffCodeVisible ? (
            <motion.div variants={childVariants}>
              <GlassCard interactive={false} className="p-6" data-testid="tracking-handoff-panel">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery code</p>
                    <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-white">Delivery code</h2>
                    <p className="mt-2 max-w-2xl text-sm text-[color:var(--text-secondary)]">
                      Share this code only when your order reaches you.
                    </p>
                  </div>
                  <Button
                    data-testid="tracking-handoff-generate"
                    onClick={issueHandoffCode}
                    disabled={handoffCodeState.loading}
                  >
                    {handoffCodeState.loading
                      ? 'Generating...'
                      : handoffCodeState.token
                        ? 'Generate new code'
                        : 'Generate delivery code'}
                  </Button>
                </div>

                {handoffCodeState.error ? (
                  <div className="mt-4 rounded-[20px] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {handoffCodeState.error}
                  </div>
                ) : null}

                {handoffCodeState.token ? (
                  <div className="mt-5 rounded-[24px] border border-white/10 bg-white/6 p-5">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Current code</div>
                    <div
                      data-testid="tracking-handoff-token"
                      className="bb-mono mt-3 text-4xl font-bold tracking-[0.4em] text-white md:text-5xl"
                    >
                      {handoffCodeState.token}
                    </div>
                    {handoffCodeState.expiresAt ? (
                      <div className="mt-3 text-sm text-[color:var(--text-secondary)]">
                        Expires {new Date(handoffCodeState.expiresAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    ) : null}
                    {handoffCodeState.notice ? (
                      <div
                        data-testid="tracking-handoff-notice"
                        className="mt-3 text-sm text-[color:var(--text-secondary)]"
                      >
                        {handoffCodeState.notice}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </GlassCard>
            </motion.div>
          ) : null}
          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order history</p>
              <div className="space-y-4">
                {(order.statusEvents?.length ? order.statusEvents : [{ status: order.rawStatus, title: order.status, detail: order.shortStatus, created_at: new Date().toISOString() }]).map((event, index) => (
                  <div key={`${event.status}-${event.created_at}-${index}`} className="flex gap-4">
                    <div className="mt-1 h-3 w-3 rounded-full bg-[color:var(--accent-primary)]" />
                    <div>
                      <div className="text-sm font-semibold text-white">{event.title || event.status.replace(/_/g, ' ')}</div>
                      <div className="mt-1 text-sm text-[color:var(--text-secondary)]">{event.detail || 'Status updated.'}</div>
                      <div className="bb-mono mt-1 text-xs text-[color:var(--text-muted)]">{new Date(event.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
          {order.canRate ? (
            <motion.div variants={childVariants}>
              <GlassCard interactive={false} className="p-6">
                <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Rate your order</p>
                {order.rating ? (
                  <div className="space-y-3">
                    <div className="text-xl font-semibold text-white">★ {order.rating.score}/5</div>
                    {order.rating.review ? <div className="text-sm text-[color:var(--text-secondary)]">{order.rating.review}</div> : null}
                    {order.rating.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {order.rating.tags.map((tag) => <Button key={tag} variant="secondary" className="px-3 py-1.5 text-xs">{tag}</Button>)}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setRatingForm((current) => ({ ...current, score }))}
                          className={`rounded-full border px-4 py-2 text-sm ${ratingForm.score === score ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)] text-white' : 'border-white/10 bg-white/6 text-[color:var(--text-secondary)]'}`}
                        >
                          {score}★
                        </button>
                      ))}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {reviewTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-3 py-1.5 text-xs ${ratingForm.tags.includes(tag) ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)] text-white' : 'border-white/10 bg-white/6 text-[color:var(--text-secondary)]'}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingForm.review}
                      onChange={(event) => setRatingForm((current) => ({ ...current, review: event.target.value }))}
                      className="min-h-28 w-full rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm text-white outline-none"
                      placeholder="Tell us how the order felt end to end."
                    />
                    <div className="mt-4">
                      <Button
                        className="h-12 text-base disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submittingRating}
                        onClick={async () => {
                          try {
                            setSubmittingRating(true);
                            await submitRating({
                              orderId: order.id,
                              score: ratingForm.score,
                              review: ratingForm.review.trim(),
                              tags: ratingForm.tags,
                            });
                            const refreshed = await getOrderById(order.id);
                            setFallbackOrder(refreshed);
                          } catch (error) {
                            pushToast({
                              type: 'error',
                              title: 'Rating failed',
                              description: error.message || 'Please try again.',
                            });
                          } finally {
                            setSubmittingRating(false);
                          }
                        }}
                      >
                        {submittingRating ? 'Saving...' : 'Submit rating'}
                      </Button>
                    </div>
                  </>
                )}
              </GlassCard>
            </motion.div>
          ) : null}
        </div>
      </motion.section>
    </PageWrapper>
  );
}
