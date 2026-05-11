import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAgentSession } from '../hooks/useAgentSession';
import { useDeliveryOps } from '../hooks/useDeliveryOps';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { childVariants } from '../components/layout/PageWrapper';

function formatCurrency(value) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function MetricCard({ label, value, hint }) {
  return (
    <GlassCard interactive={false} className="p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-3 text-4xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{hint}</div>
    </GlassCard>
  );
}

export default function AgentDashboard() {
  const { agent } = useAgentSession();
  const { activeOrder, openOffers, counts } = useDeliveryOps();
  const openOffer = openOffers[0] || null;

  return (
    <div className="space-y-6">
      <motion.section variants={childVariants}>
        <div className="mb-3 flex flex-wrap gap-3">
          <Badge>Delivery console</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)] capitalize">{agent?.availabilityStatus || 'offline'}</Badge>
        </div>
        <h1 className="font-display text-5xl italic text-white">Keep the next handoff obvious</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          This route centers the live assignment, the next delivery transition, and the queue of ready orders waiting to be claimed.
        </p>
      </motion.section>

      <motion.section variants={childVariants} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open offers" value={counts.openOffers} hint="Ready orders available to claim." />
        <MetricCard label="Active deliveries" value={counts.activeOrders} hint="Orders currently attached to this delivery account." />
        <MetricCard label="Completed" value={counts.completedOrders} hint="Finished deliveries visible to this account." />
        <MetricCard label="Delivered earnings" value={formatCurrency(counts.totalEarnings || 0)} hint="Live total from delivered orders assigned to this account." />
      </motion.section>

      <motion.section variants={childVariants}>
        <GlassCard interactive={false} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Current assignment</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                {activeOrder ? `${activeOrder.restaurantName} to ${activeOrder.destinationArea}` : 'No live delivery is attached yet'}
              </h2>
            </div>
            {activeOrder ? (
              <Link to={`/agent/orders/${activeOrder.id}`}>
                <Button variant="secondary" className="px-4 py-2 text-xs">Open live detail</Button>
              </Link>
            ) : null}
          </div>

          {activeOrder ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-sm text-[color:var(--text-secondary)]">Status</div>
                <div className="mt-2 text-2xl font-semibold text-white">{activeOrder.statusLabel}</div>
                <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
                  Payment {activeOrder.paymentMethod.toUpperCase()} · {activeOrder.totalLabel}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <div className="text-sm text-[color:var(--text-secondary)]">Handoff summary</div>
                <div className="mt-2 text-2xl font-semibold text-white">{activeOrder.customerName}</div>
                <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
                  {activeOrder.itemCount} items · ETA {activeOrder.etaMinutes || 0} min
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/12 bg-white/4 p-6 text-sm text-[color:var(--text-secondary)]">
              This delivery account has no active trip right now. Claim a ready order from the open offers list to keep the flow moving.
            </div>
          )}
        </GlassCard>
      </motion.section>

      <motion.section variants={childVariants}>
        <GlassCard interactive={false} className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Next available offer</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{openOffer ? openOffer.id : 'No open offers'}</h2>
            </div>
            {openOffer ? (
              <Link to={`/agent/orders/${openOffer.id}`}>
                <Button className="px-4 py-2 text-xs">Review offer</Button>
              </Link>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
            {openOffer
              ? `${openOffer.restaurantName} · ${openOffer.customerName} · ${openOffer.destinationArea}`
              : 'Ready orders will appear here as soon as the kitchen hands them off to delivery.'}
          </p>
        </GlassCard>
      </motion.section>
    </div>
  );
}
