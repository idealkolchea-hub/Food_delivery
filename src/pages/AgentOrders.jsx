import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeliveryOps } from '../hooks/useDeliveryOps';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { childVariants } from '../components/layout/PageWrapper';

export default function AgentOrders() {
  const { openOffers, assignedOrders } = useDeliveryOps();
  const orders = [...openOffers, ...assignedOrders.filter((order) => !order.isOpenOffer)];

  return (
    <div className="space-y-6">
      <motion.section variants={childVariants}>
        <div className="mb-3 flex flex-wrap gap-3">
          <Badge>Delivery ledger</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{orders.length} cards</Badge>
        </div>
        <h1 className="font-display text-5xl italic text-white">Review open offers and recent runs</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          Ready orders that can be claimed and deliveries already attached to this account live together here so the rider can move fast without losing context.
        </p>
      </motion.section>

      <motion.section variants={childVariants}>
        <GlassCard interactive={false} className="p-6">
          <div className="space-y-4">
            {orders.length ? orders.map((order) => (
              <div key={order.id} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xl font-semibold text-white">{order.id}</div>
                      <Badge className={order.isOpenOffer ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : ''}>
                        {order.isOpenOffer ? 'Open offer' : order.statusLabel}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
                      {order.restaurantName} · {order.customerName} · {order.destinationArea}
                    </div>
                  </div>
                  <Link to={`/agent/orders/${order.id}`}>
                    <Button variant="secondary" className="px-4 py-2 text-xs">{order.isOpenOffer ? 'Review offer' : 'Open detail'}</Button>
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[18px] border border-white/10 bg-black/10 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Payment</div>
                    <div className="mt-2 text-lg font-semibold text-white">{order.paymentMethod.toUpperCase()}</div>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-black/10 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Total</div>
                    <div className="mt-2 text-lg font-semibold text-white">{order.totalLabel}</div>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-black/10 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery stage</div>
                    <div className="mt-2 text-lg font-semibold text-white">{order.statusLabel}</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 p-8 text-sm text-[color:var(--text-secondary)]">
                No delivery cards are visible to this account yet.
              </div>
            )}
          </div>
        </GlassCard>
      </motion.section>
    </div>
  );
}
