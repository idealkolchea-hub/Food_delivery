import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { PageWrapper, childVariants } from './PageWrapper';

function StudioShellContent() {
  return (
    <PageWrapper className="mx-auto max-w-[1280px]">
      <motion.section variants={childVariants} className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <GlassCard interactive={false} className="bb-role-surface bb-role-admin overflow-hidden p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Badge>Studio</Badge>
              <Badge className="bb-role-chip normal-case tracking-[0.04em]">Admin workspace</Badge>
            </div>
            <h1 className="font-display text-4xl italic text-white">BiteBlast Studio</h1>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Monitor platform accounts, delivery state, and live order health from the admin surface.
            </p>
          </GlassCard>

          <GlassCard interactive={false} className="p-3">
            <div className="space-y-2">
              <NavLink
                to="/studio"
                end
                className={({ isActive }) => `flex items-center justify-between rounded-[18px] border px-4 py-3 transition-colors ${
                  isActive
                    ? 'border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.16)] text-white'
                    : 'border-white/8 bg-white/4 text-[color:var(--text-secondary)] hover:text-white'
                }`}
              >
                <span className="text-sm font-medium">Overview</span>
              </NavLink>
            </div>
          </GlassCard>
          <GlassCard interactive={false} className="p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Refresh cadence</div>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Studio data refreshes automatically every 15 seconds and can be pulled manually from the overview.
            </p>
          </GlassCard>
        </aside>

        <div>
          <Outlet />
        </div>
      </motion.section>
    </PageWrapper>
  );
}

export function StudioRouteLayout() {
  return <StudioShellContent />;
}
