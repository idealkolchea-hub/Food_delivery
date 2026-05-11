import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

function paymentLabel(order) {
  if (order.paymentMethod === 'COD' && order.paymentStatus !== 'paid') {
    return 'Pay on delivery';
  }

  return 'Paid';
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { activeOrder, orderHistory, getOrderById, loading } = useOrderFlow();
  const [order, setOrder] = useState(() => orderHistory.find((entry) => entry.id === orderId) || (activeOrder?.id === orderId ? activeOrder : null));
  const [status, setStatus] = useState({ loading: !order, error: '' });
  const pricingLines = order ? order.receipt.slice(order.items.length) : [];

  useEffect(() => {
    let ignore = false;

    async function loadOrder() {
      if (order) {
        setStatus({ loading: false, error: '' });
        return;
      }

      if (!orderId) {
        setStatus({ loading: false, error: 'Order not found.' });
        return;
      }

      try {
        const response = await getOrderById(orderId);
        if (ignore) return;
        if (!response) {
          setStatus({ loading: false, error: 'Order not found.' });
          return;
        }
        setOrder(response);
        setStatus({ loading: false, error: '' });
      } catch (error) {
        if (ignore) return;
        setStatus({ loading: false, error: error.message || 'We could not load that order.' });
      }
    }

    if (!loading) {
      loadOrder();
    }

    return () => {
      ignore = true;
    };
  }, [getOrderById, loading, order, orderId]);

  if (loading || status.loading) {
    return (
      <PageWrapper className="mx-auto max-w-[1080px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-white/10" />
            <h1 className="font-display text-4xl italic text-white">Loading your order</h1>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  if (!order || status.error) {
    return (
      <PageWrapper className="mx-auto max-w-[1080px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 w-28 text-6xl">🧾</div>
            <h1 className="font-display text-4xl italic text-white">Order not found</h1>
            <p className="mt-4 text-[color:var(--text-secondary)]">{status.error || 'We could not find that confirmation.'}</p>
            <div className="mt-8">
              <Link to="/orders"><Button>Open order history</Button></Link>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1180px]">
      <motion.section variants={childVariants} className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard interactive={false} className="p-6 md:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order accepted</p>
          <h1 className="font-display text-5xl italic text-white">Your order is in the system</h1>
          <p className="mt-4 max-w-2xl text-sm text-[color:var(--text-secondary)]">The restaurant has your request, your delivery details are saved, and tracking is ready whenever you want it.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order ID</div>
              <div className="mt-2 break-all text-lg font-bold text-white">{order.id}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Restaurant</div>
              <div className="mt-2 text-lg font-bold text-white">{order.restaurant}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">ETA</div>
              <div className="mt-2 text-lg font-bold text-white">{order.etaMinutes} min</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Payment</div>
              <div className="mt-2 text-lg font-bold text-white">{paymentLabel(order)}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge>{order.status}</Badge>
            <Badge>{order.paymentMethod}</Badge>
            <Badge>{order.destination}</Badge>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery address</p>
              <div className="text-lg font-semibold text-white">{order.customerName || 'Customer'}</div>
              <div className="mt-2 break-words text-sm text-[color:var(--text-secondary)]">{order.destinationLine}</div>
              <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{order.customerPhone}</div>
            </GlassCard>
          </motion.div>

          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Items</p>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.id}`} className="flex items-center justify-between text-sm">
                    <span className="text-white">{item.quantity} × {item.name}</span>
                    <span className="tabular-nums text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-sm text-[color:var(--text-secondary)]">
                {pricingLines.map((line) => (
                  <div key={`${order.id}-${line.label}`} className="flex items-center justify-between gap-4">
                    <span>{line.label}</span>
                    <span className="tabular-nums text-white">{line.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[color:var(--text-secondary)]">Total payable</span>
                  <span className="text-xl font-bold tabular-nums text-white">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={childVariants} className="flex flex-wrap gap-3">
            <Link to={`/track/${order.id}`}><Button>Track order</Button></Link>
            <Link to="/support"><Button variant="secondary">Get support</Button></Link>
          </motion.div>
        </div>
      </motion.section>
    </PageWrapper>
  );
}
