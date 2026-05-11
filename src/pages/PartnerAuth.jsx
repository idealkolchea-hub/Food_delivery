import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { useRestaurantSession } from '../hooks/useRestaurantSession';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

export default function PartnerAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/partner';
  const { loading, authUser, role, signIn, logout } = useCustomerSession();
  const { membership, restaurant, hasRestaurantAccess } = useRestaurantSession();
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    email: authUser?.email || '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && role === 'vendor' && hasRestaurantAccess) {
      navigate(nextPath, { replace: true });
    }
  }, [hasRestaurantAccess, loading, navigate, nextPath, role]);

  const submitPartnerLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      pushToast({
        type: 'error',
        title: 'Missing credentials',
        description: 'Enter your partner email and password to continue.',
      });
      return;
    }

    try {
      setSubmitting(true);
      await signIn({
        email: form.email,
        password: form.password,
      });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Partner sign in failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const wrongRole = Boolean(authUser && role && role !== 'vendor');

  return (
    <PageWrapper className="mx-auto max-w-[1280px]">
      <motion.section variants={childVariants} className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <GlassCard interactive={false} className="overflow-hidden p-8 md:p-10">
          <div className="mb-6 flex flex-wrap gap-3">
            <Badge>Partner sign in</Badge>
            <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">Vendor role required</Badge>
          </div>
          <h1 className="font-display text-5xl italic text-white">Open the kitchen ops surface</h1>
          <p className="mt-4 max-w-2xl text-sm text-[color:var(--text-secondary)]">
            Sign in with a provisioned vendor account to access the restaurant queue, prep flow, and live handoff states.
          </p>

          {wrongRole ? (
            <div className="mt-8 rounded-[22px] border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
              This account is currently signed in as <span className="font-semibold">{role}</span>. Partner routes are reserved for vendor profiles.
            </div>
          ) : null}

          <div className="mt-8 grid gap-4">
            <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Email address</div>
              <input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-2 w-full bg-transparent text-white outline-none"
                placeholder="ops@restaurant.com"
                type="email"
                autoComplete="email"
              />
            </label>

            <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Password</div>
              <input
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="mt-2 w-full bg-transparent text-white outline-none"
                placeholder="Your account password"
                type="password"
                autoComplete="current-password"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              className="h-14 text-base disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              onClick={submitPartnerLogin}
            >
              {submitting ? 'Signing in...' : 'Open partner dashboard'}
            </Button>
            <Link to="/login"><Button variant="secondary" className="h-14 text-base">Customer sign in</Button></Link>
            <Link to={nextPath}><Button variant="ghost" className="h-14 text-base">Back</Button></Link>
          </div>

          {wrongRole ? (
            <div className="mt-4">
              <Button
                variant="ghost"
                className="h-12 text-sm"
                onClick={async () => {
                  await logout();
                  setForm({ email: '', password: '' });
                }}
              >
                Sign out and switch account
              </Button>
            </div>
          ) : null}
        </GlassCard>

        <div className="space-y-6">
          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Session snapshot</p>
              <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
                <div>Current app role: <span className="font-semibold text-white">{role || 'guest'}</span></div>
                <div>Restaurant access: <span className="font-semibold text-white">{hasRestaurantAccess ? 'Ready' : 'Not attached'}</span></div>
                <div>Restaurant: <span className="font-semibold text-white">{restaurant?.name || membership?.restaurant?.name || 'Provisioned after sign-in'}</span></div>
              </div>
            </GlassCard>
          </motion.div>
          <motion.div variants={childVariants}>
            <GlassCard interactive={false} className="p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Provisioning note</p>
              <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
                <div>Vendor access now comes from canonical RBAC in `app_profiles` plus restaurant membership rows.</div>
                <div>Front-end role switching is gone, so this page expects a real vendor account instead of demo bootstrap actions.</div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </motion.section>
    </PageWrapper>
  );
}
