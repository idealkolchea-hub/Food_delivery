import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRestaurantOps } from '../hooks/useRestaurantOps';
import { useRestaurantSession } from '../hooks/useRestaurantSession';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { PartnerOrderCard } from '../components/partner/PartnerOrderCard';
import { childVariants } from '../components/layout/PageWrapper';

function MetricCard({ label, value, hint }) {
  return (
    <GlassCard interactive={false} className="p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-3 text-4xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{hint}</div>
    </GlassCard>
  );
}

function QueueSection({ title, description, orders, href, emptyCopy, pendingActions, onAction }) {
  return (
    <GlassCard interactive={false} className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{title}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{description}</h2>
        </div>
        <Link to={href}>
          <Button variant="secondary" className="px-4 py-2 text-xs">Open queue</Button>
        </Link>
      </div>
      <div className="mt-6 space-y-4">
        {orders.length ? orders.map((order) => (
          <PartnerOrderCard
            key={order.id}
            order={order}
            pendingAction={pendingActions[order.id] || ''}
            onAction={onAction}
            detailHref={`/partner/orders/${order.id}`}
          />
        )) : (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
            {emptyCopy}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function PartnerDashboard() {
  const { restaurant, membership } = useRestaurantSession();
  const { loading, counts, incomingOrders, activeOrders, readyOrders, updateOrderStatus } = useRestaurantOps();
  const { pushToast } = useToast();
  const [pendingActions, setPendingActions] = useState({});

  const handleAction = async ({ orderId, targetStatus, reasonCode = null }) => {
    try {
      setPendingActions((current) => ({ ...current, [orderId]: targetStatus }));
      await updateOrderStatus({
        orderId,
        targetStatus,
        reasonCode,
      });
      pushToast({
        type: 'success',
        title: 'Kitchen queue updated',
        description: `Order moved to ${targetStatus.replace(/_/g, ' ')}.`,
      });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Status update failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setPendingActions((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.section variants={childVariants}>
        <div className="mb-3 flex flex-wrap gap-3">
          <Badge>Kitchen overview</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{membership?.role === 'restaurant_owner' ? 'Owner session' : 'Staff session'}</Badge>
        </div>
        <h1 className="font-display text-5xl italic text-white">Run {restaurant?.name || 'the kitchen'} from one queue</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          Accept incoming tickets, move orders into prep, and stage pickup handoffs without leaving the partner workspace.
        </p>
      </motion.section>

      <motion.section variants={childVariants} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Incoming" value={counts.incoming} hint="Awaiting an accept or reject decision." />
        <MetricCard label="Active prep" value={counts.active} hint="Accepted orders moving through the kitchen." />
        <MetricCard label="Ready handoff" value={counts.ready} hint="Packed orders waiting for rider pickup." />
        <MetricCard label="Queue total" value={counts.incoming + counts.active + counts.ready} hint={loading ? 'Refreshing live data...' : 'Tickets currently under restaurant control.'} />
      </motion.section>

      <motion.section variants={childVariants}>
        <QueueSection
          title="Incoming"
          description="Newest undecided orders"
          orders={incomingOrders.slice(0, 3)}
          href="/partner/queue"
          emptyCopy="No new orders are waiting right now."
          pendingActions={pendingActions}
          onAction={handleAction}
        />
      </motion.section>

      <motion.section variants={childVariants}>
        <QueueSection
          title="Active prep"
          description="Orders already in motion"
          orders={activeOrders.slice(0, 3)}
          href="/partner/queue"
          emptyCopy="Nothing is in prep right now."
          pendingActions={pendingActions}
          onAction={handleAction}
        />
      </motion.section>

      <motion.section variants={childVariants}>
        <QueueSection
          title="Ready queue"
          description="Tickets staged for pickup"
          orders={readyOrders.slice(0, 3)}
          href="/partner/queue"
          emptyCopy="No packed orders are waiting for a rider."
          pendingActions={pendingActions}
          onAction={handleAction}
        />
      </motion.section>
    </div>
  );
}
