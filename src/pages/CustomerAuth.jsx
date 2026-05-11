import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const demoAccessRows = [
  { label: 'Customer', email: 'customer@demo.com', password: 'BiteBlast#123', portal: '/login' },
  { label: 'Vendor', email: 'vendor@demo.com', password: 'BiteBlast#123', portal: '/partner/auth' },
  { label: 'Delivery', email: 'delivery@demo.com', password: 'BiteBlast#123', portal: '/agent/auth' },
  { label: 'Admin', email: 'admin@demo.com', password: 'BiteBlast#123', portal: '/login -> /studio' },
];

function authModeTitle(mode) {
  return mode === 'register' ? 'Create your dinner profile' : 'Sign in to continue';
}

export default function CustomerAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const { loading, authUser, customer, role, signIn, signUp, logout } = useCustomerSession();
  const { pushToast } = useToast();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!form.name && customer?.name) {
      setForm((current) => ({ ...current, name: customer.name || '' }));
    }
    if (!form.email && (customer?.email || authUser?.email)) {
      setForm((current) => ({ ...current, email: customer?.email || authUser?.email || '' }));
    }
  }, [authUser?.email, customer?.email, customer?.name, form.email, form.name]);

  useEffect(() => {
    if (!loading && authUser && role === 'customer') {
      navigate(nextPath, { replace: true });
    }
  }, [authUser, role, loading, navigate, nextPath]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitAuth = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      pushToast({
        type: 'error',
        title: 'Missing credentials',
        description: 'Enter your email address and password to continue.',
      });
      return;
    }

    if (mode === 'register') {
      if (!form.name.trim()) {
        pushToast({
          type: 'error',
          title: 'Add your name',
          description: 'We use it to set up your customer profile.',
        });
        return;
      }

      if (form.password.length < 8) {
        pushToast({
          type: 'error',
          title: 'Use a stronger password',
          description: 'Pick at least 8 characters for your account password.',
        });
        return;
      }

      if (form.password !== form.confirmPassword) {
        pushToast({
          type: 'error',
          title: 'Passwords do not match',
          description: 'Re-enter the confirmation password and try again.',
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      if (mode === 'register') {
        const result = await signUp({
          email: form.email,
          password: form.password,
          displayName: form.name,
        });

        if (result.requiresEmailVerification) {
          pushToast({
            type: 'info',
            title: 'Check your email',
            description: 'Confirm your account from the email we sent, then sign in here.',
          });
          setMode('login');
          return;
        }

        navigate(nextPath, { replace: true });
        return;
      }

      await signIn({
        email: form.email,
        password: form.password,
      });
      navigate(nextPath, { replace: true });
    } catch (error) {
      pushToast({
        type: 'error',
        title: mode === 'register' ? 'Account setup failed' : 'Sign in failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const signedInWithDifferentRole = Boolean(authUser && role !== 'customer');

  return (
    <PageWrapper className="mx-auto max-w-[1080px]">
      <motion.section variants={childVariants} className="grid gap-8 xl:grid-cols-[1fr_0.92fr]">
        <GlassCard interactive={false} className="p-8 md:p-10">
          <div className="mb-6 flex flex-wrap gap-3">
            <Badge>{mode === 'register' ? 'Create customer account' : 'Customer sign in'}</Badge>
            <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">Email and password</Badge>
          </div>
          <h1 className="font-display text-5xl italic text-white">{authModeTitle(mode)}</h1>
          <p className="mt-4 max-w-2xl text-sm text-[color:var(--text-secondary)]">
            Use one account for saved addresses, order history, support, and checkout across sessions and devices.
          </p>

          {signedInWithDifferentRole ? (
            <div className="mt-8 rounded-[22px] border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
              This account is signed in as <span className="font-semibold">{role}</span>. Customer checkout routes are reserved for customer profiles.
            </div>
          ) : null}

          <div className="mt-8 grid gap-4">
            {mode === 'register' ? (
              <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Full name</div>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-2 w-full bg-transparent text-white outline-none"
                  placeholder="Ketan Mehta"
                />
              </label>
            ) : null}

            <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Email address</div>
              <input
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                className="mt-2 w-full bg-transparent text-white outline-none"
                placeholder="ketan@example.com"
                type="email"
                autoComplete="email"
              />
            </label>

            <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Password</div>
              <input
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                className="mt-2 w-full bg-transparent text-white outline-none"
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your account password'}
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </label>

            {mode === 'register' ? (
              <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Confirm password</div>
                <input
                  value={form.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  className="mt-2 w-full bg-transparent text-white outline-none"
                  placeholder="Repeat your password"
                  type="password"
                  autoComplete="new-password"
                />
              </label>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="h-14 text-base disabled:cursor-not-allowed disabled:opacity-60" onClick={submitAuth} disabled={submitting}>
              {submitting
                ? (mode === 'register' ? 'Creating account...' : 'Signing in...')
                : (mode === 'register' ? 'Create account' : 'Sign in')}
            </Button>
            <Button
              variant="secondary"
              className="h-14 text-base"
              onClick={() => setMode((current) => (current === 'register' ? 'login' : 'register'))}
              disabled={submitting}
            >
              {mode === 'register' ? 'I already have an account' : 'Create a new account'}
            </Button>
            <Link to={nextPath}><Button variant="ghost" className="h-14 text-base">Back</Button></Link>
          </div>

          {signedInWithDifferentRole ? (
            <div className="mt-4">
              <Button
                variant="ghost"
                className="h-12 text-sm"
                onClick={async () => {
                  await logout();
                  setForm(emptyForm);
                }}
              >
                Sign out and switch account
              </Button>
            </div>
          ) : null}
        </GlassCard>

        <motion.div variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">What this unlocks</p>
            <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
              <div>Saved addresses and checkout details tied to one account.</div>
              <div>Protected order history, tracking, ratings, and support tickets.</div>
              <div>Reusable login across the customer, vendor, delivery, and admin surfaces when provisioned.</div>
            </div>
          </GlassCard>
          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Role-aware access</p>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Customer routes accept customer accounts only. Vendor, delivery, and admin accounts use their own protected route families after sign-in.
            </p>
          </GlassCard>
          <GlassCard interactive={false} className="p-6" data-testid="demo-access-panel">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Demo access</p>
              <Badge className="border-white/10 bg-white/6 text-[color:var(--text-secondary)]">Static credentials</Badge>
            </div>
            <div className="space-y-3 text-sm">
              {demoAccessRows.map((entry) => (
                <div key={entry.email} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-white">{entry.label}</span>
                    <span className="text-xs text-[color:var(--text-muted)]">{entry.portal}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-[color:var(--text-secondary)]">
                    <div>Email: <span className="font-mono text-white">{entry.email}</span></div>
                    <div>Password: <span className="font-mono text-white">{entry.password}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.section>
    </PageWrapper>
  );
}
