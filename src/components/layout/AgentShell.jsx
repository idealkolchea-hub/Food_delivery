import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAgentSession } from '../../hooks/useAgentSession';
import { DeliveryOpsProvider, useDeliveryOps } from '../../hooks/useDeliveryOps';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { PageWrapper, childVariants } from './PageWrapper';

const navItems = [
  { label: 'Active', to: '/agent/active' },
  { label: 'Deliveries', to: '/agent/orders' },
  { label: 'Profile', to: '/agent/profile' },
];

function availabilityTone(status) {
  if (status === 'online') return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100';
  if (status === 'busy') return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
  return 'border-white/10 bg-white/6 text-[color:var(--text-secondary)]';
}

export function AgentRouteLayout() {
  return (
    <DeliveryOpsProvider>
      <AgentShellContent />
    </DeliveryOpsProvider>
  );
}

function AgentShellContent() {
  const navigate = useNavigate();
  const { agent, logoutAgent } = useAgentSession();
  const { counts } = useDeliveryOps();

  return (
    <PageWrapper className="mx-auto max-w-[1380px]">
      <motion.section variants={childVariants} className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <GlassCard interactive={false} className="overflow-hidden p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge>Agent ops</Badge>
              <Badge className={availabilityTone(agent?.availabilityStatus)}>{agent?.availabilityStatus || 'offline'}</Badge>
            </div>
            <h1 className="font-display text-4xl italic text-white">{agent?.name || 'Agent session'}</h1>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              {agent ? `${agent.zone} · ${agent.vehicle}` : 'Pick a delivery agent to open this route family.'}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Active</div>
                <div className="mt-2 text-2xl font-semibold text-white">{counts.activeOrders}</div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Completed</div>
                <div className="mt-2 text-2xl font-semibold text-white">{counts.completedOrders}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-3">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) => `flex items-center justify-between rounded-[18px] border px-4 py-3 transition-colors ${
                    isActive
                      ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.16)] text-white'
                      : 'border-white/8 bg-white/4 text-[color:var(--text-secondary)] hover:text-white'
                  }`}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Session control</div>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Delivery access is isolated from customer, partner, and studio flows. This session only affects the delivery-side routes.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate('/agent/auth')}>Switch account</Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logoutAgent();
                  navigate('/agent/auth', { replace: true });
                }}
              >
                Reset session
              </Button>
            </div>
          </GlassCard>
        </aside>

        <div>
          <Outlet />
        </div>
      </motion.section>
    </PageWrapper>
  );
}
