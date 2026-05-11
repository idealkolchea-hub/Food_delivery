import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRestaurantOps } from '../hooks/useRestaurantOps';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { GlassCard } from '../components/ui/GlassCard';
import { PartnerOrderCard } from '../components/partner/PartnerOrderCard';
import { childVariants } from '../components/layout/PageWrapper';

const queueLookup = {
  incoming: {
    badge: 'Incoming queue',
    empty: 'New orders will appear here the moment customers place them.',
  },
  active: {
    badge: 'Prep queue',
    empty: 'Accepted orders will land here after the kitchen confirms them.',
  },
  ready: {
    badge: 'Pickup queue',
    empty: 'Packed orders will appear here once they are ready for a rider.',
  },
  completed: {
    badge: 'Completed queue',
    empty: 'Delivered, cancelled, and refunded orders will collect here.',
  },
};

export default function PartnerQueue({ bucket = 'incoming', title = 'Queue', description = '' }) {
  const { pushToast } = useToast();
  const { orders: allOrders, incomingOrders, activeOrders, readyOrders, completedOrders, updateOrderStatus } = useRestaurantOps();
  const [pendingActions, setPendingActions] = useState({});

  const ordersByBucket = {
    all: allOrders,
    incoming: incomingOrders,
    active: activeOrders,
    ready: readyOrders,
    completed: completedOrders,
  };

  const orders = ordersByBucket[bucket] || [];
  const queueMeta = queueLookup[bucket] || queueLookup.incoming;

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
        title: 'Queue updated',
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
          <Badge>{queueMeta.badge}</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{orders.length} orders</Badge>
        </div>
        <h1 className="font-display text-5xl italic text-white">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">{description}</p>
      </motion.section>

      <motion.section variants={childVariants}>
        <GlassCard interactive={false} className="p-6">
          <div className="space-y-4">
            {orders.length ? orders.map((order) => (
              <PartnerOrderCard
                key={order.id}
                order={order}
                pendingAction={pendingActions[order.id] || ''}
                onAction={handleAction}
                detailHref={`/partner/orders/${order.id}`}
              />
            )) : (
              <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 p-8 text-sm text-[color:var(--text-secondary)]">
                {queueMeta.empty}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.section>
    </div>
  );
}
