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

export default function AgentProfile() {
  const { agent, setAvailability } = useAgentSession();
  const { assignedOrders, completedOrders, counts } = useDeliveryOps();
  const liveOrderValue = assignedOrders.reduce((sum, entry) => sum + entry.total, 0);

  return (
    <div className="space-y-6">
      <motion.section variants={childVariants}>
        <div className="mb-3 flex flex-wrap gap-3">
          <Badge>Agent profile</Badge>
          <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)] capitalize">{agent?.kycStatus || 'pending'}</Badge>
        </div>
        <h1 className="font-display text-5xl italic text-white">Keep availability and delivery context in one place</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text-secondary)]">
          This profile view anchors the non-route parts of the rider experience: account identity, delivery availability, and the current order workload.
        </p>
      </motion.section>

      <motion.section variants={childVariants} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard interactive={false} className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Availability controls</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant={agent?.availabilityStatus === 'online' ? 'primary' : 'secondary'} onClick={() => setAvailability('online')}>Go online</Button>
            <Button variant={agent?.availabilityStatus === 'busy' ? 'primary' : 'secondary'} onClick={() => setAvailability('busy')}>Mark busy</Button>
            <Button variant={agent?.availabilityStatus === 'offline' ? 'primary' : 'ghost'} onClick={() => setAvailability('offline')}>Go offline</Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Current workload</div>
              <div className="mt-2 text-2xl font-semibold text-white">{counts.activeOrders}</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Trust score</div>
              <div className="mt-2 text-2xl font-semibold text-white">{agent?.trustScore || 0}</div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/6 p-4 md:col-span-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivered earnings</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(counts.totalEarnings || 0)}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard interactive={false} className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Account snapshot</div>
          <div className="mt-5 space-y-3 text-sm text-[color:var(--text-secondary)]">
            <div>Name: <span className="font-semibold text-white">{agent?.name || 'Delivery Partner'}</span></div>
            <div>Email: <span className="font-semibold text-white">{agent?.email || 'Unavailable'}</span></div>
            <div>Phone: <span className="font-semibold text-white">{agent?.phone || 'Unavailable'}</span></div>
            <div>Active delivery value: <span className="font-semibold text-white">{formatCurrency(liveOrderValue)}</span></div>
          </div>
        </GlassCard>
      </motion.section>

      <motion.section variants={childVariants}>
        <GlassCard interactive={false} className="p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Recent completed deliveries</div>
          <div className="mt-5 space-y-3">
            {completedOrders.length ? completedOrders.slice(0, 4).map((entry) => (
              <div key={entry.id} className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{entry.restaurantName}</div>
                  <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">{entry.statusLabel}</Badge>
                </div>
                <div className="mt-2 text-xs text-[color:var(--text-secondary)]">{entry.id} · {entry.customerName} · {entry.totalLabel}</div>
              </div>
            )) : (
              <div className="rounded-[20px] border border-dashed border-white/12 bg-white/4 p-4 text-sm text-[color:var(--text-secondary)]">
                No completed deliveries are visible to this account yet.
              </div>
            )}
          </div>
        </GlassCard>
      </motion.section>
    </div>
  );
}
