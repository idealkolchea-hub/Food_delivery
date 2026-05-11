import { motion } from 'framer-motion';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RestaurantOpsProvider, useRestaurantOps } from '../../hooks/useRestaurantOps';
import { useRestaurantSession } from '../../hooks/useRestaurantSession';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { PageWrapper, childVariants } from './PageWrapper';

const navItems = [
  { label: 'Queue', to: '/partner/queue', countKey: 'queue' },
  { label: 'Orders', to: '/partner/orders', countKey: 'orders' },
];

function RoleBadge({ role }) {
  return (
    <Badge className={role === 'restaurant_owner' ? 'bb-role-chip bb-role-restaurant normal-case tracking-[0.04em]' : 'bb-role-chip bb-role-delivery normal-case tracking-[0.04em]'}>
      {role === 'restaurant_owner' ? 'Owner access' : 'Staff access'}
    </Badge>
  );
}

function PartnerShellContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { counts } = useRestaurantOps();
  const { restaurant, membership, hasRestaurantAccess, error, logoutToGuest } = useRestaurantSession();

  const navCounts = {
    queue: counts.incoming + counts.active + counts.ready,
    orders: counts.incoming + counts.active + counts.ready + counts.completed,
  };

  if (!hasRestaurantAccess || !restaurant || !membership) {
    return (
      <PageWrapper className="mx-auto max-w-[1120px]">
        <motion.section variants={childVariants} className="grid place-items-center py-16">
          <GlassCard interactive={false} className="w-full max-w-3xl overflow-hidden p-8 md:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge>Partner access</Badge>
              <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">Membership required</Badge>
            </div>
            <h1 className="font-display text-5xl italic text-white">No restaurant is attached to this partner session yet</h1>
            <p className="mt-4 max-w-2xl text-sm text-[color:var(--text-secondary)]">
              {error || 'Use the partner access screen to attach this authenticated profile to one restaurant for kitchen operations.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/partner/auth', { replace: true })}>Open partner access</Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logoutToGuest();
                  navigate('/partner/auth', { replace: true });
                }}
              >
                Reset this session
              </Button>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1380px]">
      <motion.section variants={childVariants} className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <GlassCard interactive={false} className="bb-role-surface bb-role-restaurant overflow-hidden p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge className="bb-role-chip bb-role-restaurant normal-case tracking-[0.04em]">Partner ops</Badge>
              <RoleBadge role={membership.role} />
            </div>
            <h1 className="font-display text-4xl italic text-white">{restaurant.name}</h1>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{restaurant.addressLine || 'Restaurant address unavailable'}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Incoming</div>
                <div className="mt-2 text-2xl font-semibold text-white">{counts.incoming}</div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Ready</div>
                <div className="mt-2 text-2xl font-semibold text-white">{counts.ready}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-3">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                className={({ isActive }) => `flex items-center justify-between rounded-[18px] border px-4 py-3 transition-colors ${
                  isActive
                    ? 'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.14)] text-white'
                    : 'border-white/8 bg-white/4 text-[color:var(--text-secondary)] hover:text-white'
                }`}
              >
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.countKey ? (
                    <span className={`inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-semibold ${location.pathname === item.to ? 'bg-white/12 text-white' : 'bg-white/8 text-[color:var(--text-muted)]'}`}>
                      {navCounts[item.countKey]}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Session control</div>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              This v1 partner flow assumes one restaurant per user session. Switching restaurants is intentionally deferred.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate('/partner/auth')}>Change access</Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logoutToGuest();
                  navigate('/partner/auth', { replace: true });
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

export function PartnerRouteLayout() {
  return (
    <RestaurantOpsProvider>
      <PartnerShellContent />
    </RestaurantOpsProvider>
  );
}
