import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

const reviewTags = ['Fast delivery', 'Fresh food', 'Good packaging', 'Would reorder'];

export default function OrderHistory() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { orderHistory, reorder, cancelOrder, submitRating } = useOrderFlow();
  const { pushToast } = useToast();
  const [expandedId, setExpandedId] = useState(orderHistory[0]?.id ?? null);
  const [ratingState, setRatingState] = useState({});

  if (orderHistory.length === 0) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 w-28 text-6xl">🧾</div>
            <h1 className="font-display text-4xl italic text-white">No orders yet</h1>
            <p className="mt-4 text-[color:var(--text-secondary)]">Your receipts, tracking history, and support actions will appear here after your first order.</p>
            <div className="mt-8">
              <Button onClick={() => navigate('/')}>Browse kitchens</Button>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1080px]">
      <motion.section variants={childVariants}>
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">12 recent moments</p>
        <h1 className="font-display text-5xl italic text-white">Order history as a timeline</h1>
      </motion.section>

      <motion.section variants={childVariants} className="relative mt-10 space-y-6 before:absolute before:left-[22px] before:top-0 before:h-full before:w-px before:bg-white/10">
        {orderHistory.map((order) => {
          const expanded = expandedId === order.id;
          const ratingForm = ratingState[order.id] || { score: 5, review: '', tags: [] };
          return (
            <div key={order.id} className="relative pl-14">
              <div className="absolute left-0 top-5 h-11 w-11 rounded-full border border-white/14 bg-white/8" />
              <GlassCard className="p-6" onClick={() => setExpandedId(expanded ? null : order.id)}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{order.date}</div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{order.restaurant}</h2>
                    <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                      {order.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold tabular-nums text-white">${order.total}</div>
                    <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'Refunded' ? 'bg-amber-300/10 text-amber-200' : 'bg-emerald-400/10 text-emerald-300'}`}>{order.status}</div>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                        {order.receipt.map((line) => (
                          <div key={line.label} className="flex items-center justify-between text-sm text-[color:var(--text-secondary)]">
                            <span>{line.label}</span>
                            <span className="tabular-nums text-white">{line.value}</span>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-3 pt-4">
                          <Button
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/track/${order.id}`);
                            }}
                          >
                            Track
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={(event) => {
                              event.stopPropagation();
                              reorder(order, addItem);
                              navigate('/cart');
                            }}
                          >
                            Reorder
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate('/support');
                            }}
                          >
                            Report issue
                          </Button>
                          {order.canCancel ? (
                            <Button
                              variant="ghost"
                              onClick={async (event) => {
                                event.stopPropagation();
                                try {
                                  await cancelOrder(order.id);
                                } catch (error) {
                                  pushToast({
                                    type: 'error',
                                    title: 'Cancellation failed',
                                    description: error.message || 'Please try again.',
                                  });
                                }
                              }}
                            >
                              Cancel order
                            </Button>
                          ) : null}
                        </div>
                        {order.canRate ? (
                          <div className="mt-6 border-t border-white/10 pt-6">
                            <div className="mb-3 text-sm font-semibold text-white">Rate this order</div>
                            {order.rating ? (
                              <div className="space-y-2 text-sm text-[color:var(--text-secondary)]">
                                <div className="text-white">★ {order.rating.score}/5</div>
                                {order.rating.review ? <div>{order.rating.review}</div> : null}
                              </div>
                            ) : (
                              <>
                                <div className="mb-3 flex flex-wrap gap-2">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setRatingState((current) => ({
                                          ...current,
                                          [order.id]: { ...ratingForm, score },
                                        }));
                                      }}
                                      className={`rounded-full border px-3 py-1.5 text-xs ${ratingForm.score === score ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)] text-white' : 'border-white/10 bg-white/6 text-[color:var(--text-secondary)]'}`}
                                    >
                                      {score}★
                                    </button>
                                  ))}
                                </div>
                                <div className="mb-3 flex flex-wrap gap-2">
                                  {reviewTags.map((tag) => (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setRatingState((current) => {
                                          const tags = ratingForm.tags.includes(tag)
                                            ? ratingForm.tags.filter((entry) => entry !== tag)
                                            : [...ratingForm.tags, tag];
                                          return {
                                            ...current,
                                            [order.id]: { ...ratingForm, tags },
                                          };
                                        });
                                      }}
                                      className={`rounded-full border px-3 py-1.5 text-xs ${ratingForm.tags.includes(tag) ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)] text-white' : 'border-white/10 bg-white/6 text-[color:var(--text-secondary)]'}`}
                                    >
                                      {tag}
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={ratingForm.review}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    setRatingState((current) => ({
                                      ...current,
                                      [order.id]: { ...ratingForm, review: value },
                                    }));
                                  }}
                                  className="min-h-24 w-full rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm text-white outline-none"
                                  placeholder="Share a quick delivery note."
                                />
                                <div className="mt-3">
                                  <Button
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      try {
                                        await submitRating({
                                          orderId: order.id,
                                          score: ratingForm.score,
                                          review: ratingForm.review.trim(),
                                          tags: ratingForm.tags,
                                        });
                                      } catch (error) {
                                        pushToast({
                                          type: 'error',
                                          title: 'Rating failed',
                                          description: error.message || 'Please try again.',
                                        });
                                      }
                                    }}
                                  >
                                    Submit rating
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </div>
          );
        })}
      </motion.section>
    </PageWrapper>
  );
}
