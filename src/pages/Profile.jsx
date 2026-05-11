import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

const emptyAddress = {
  label: 'Home',
  name: '',
  phone: '',
  line1: '',
  area: '',
  city: 'Pune',
  landmark: '',
  instructions: '',
};

function Field({ label, children }) {
  return (
    <label className="rounded-[22px] border border-white/10 bg-white/6 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      {children}
    </label>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const {
    loading,
    customer,
    addresses,
    isAuthenticated,
    saveAddress,
    setDefaultAddress,
    updateProfile,
    logout,
  } = useCustomerSession();
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setProfileForm({
      name: customer.name || '',
      email: customer.email || '',
    });
    setAddressForm((current) => ({
      ...current,
      name: current.name || customer.name || '',
      phone: current.phone || customer.phone || '',
    }));
  }, [customer]);

  const submitProfile = async () => {
    try {
      setSavingProfile(true);
      await updateProfile(profileForm);
      pushToast({
        type: 'success',
        title: 'Profile updated',
        description: 'Your customer identity is now up to date.',
      });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Profile update failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const submitAddress = async () => {
    if (!addressForm.line1.trim() || !addressForm.area.trim() || !addressForm.landmark.trim()) {
      pushToast({
        type: 'error',
        title: 'Address is incomplete',
        description: 'Fill street, area, and landmark before saving the address.',
      });
      return;
    }

    try {
      setSavingAddress(true);
      await saveAddress({
        ...addressForm,
        isDefault: addresses.length === 0,
      });
      setAddressForm((current) => ({
        ...emptyAddress,
        name: current.name,
        phone: current.phone,
      }));
      pushToast({
        type: 'success',
        title: 'Address saved',
        description: 'This delivery address is ready for checkout.',
      });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Address save failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="mx-auto max-w-[1080px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <h1 className="font-display text-4xl italic text-white">Loading profile</h1>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1220px]">
      <motion.section variants={childVariants} className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Customer profile</p>
          <h1 className="font-display text-5xl italic text-white">{isAuthenticated ? 'Your delivery identity' : 'Signed-out browsing mode'}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-secondary)]">
            {isAuthenticated
              ? 'Manage the customer details, addresses, and trust signals that follow every order.'
              : 'You can browse freely while signed out, but a customer account unlocks saved addresses, online payment, and protected order history.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isAuthenticated ? <Link to="/login?next=/profile"><Button>Sign in</Button></Link> : null}
          <Button variant="ghost" onClick={() => navigate('/')}>Back to discovery</Button>
        </div>
      </motion.section>

      <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
        <motion.section variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar
                src={customer?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'}
                alt={customer?.name || 'Customer avatar'}
                size="lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge>{isAuthenticated ? 'Customer account' : 'Signed out'}</Badge>
                  <Badge>{customer?.phone || 'Phone unavailable'}</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-white">{customer?.name || 'Guest Customer'}</h2>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  {isAuthenticated
                    ? 'Your account now owns your saved addresses, order history, support requests, and checkout activity.'
                    : 'You are browsing without an account session. Orders feel more complete once you sign in.'}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full bg-transparent text-white outline-none"
                  placeholder="Ketan Mehta"
                />
              </Field>
              <Field label="Email address">
                <input
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full bg-transparent text-white outline-none"
                  placeholder="ketan@example.com"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="h-12 text-base disabled:cursor-not-allowed disabled:opacity-60" onClick={submitProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save profile'}
              </Button>
              <Button
                variant="ghost"
                className="h-12 text-base"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
              >
                Sign out
              </Button>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Saved addresses</p>
            {addresses.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/6 p-6 text-sm text-[color:var(--text-secondary)]">
                No addresses saved yet. Add one below so checkout can reuse it.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div key={address.id} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{address.label || 'Address'}</Badge>
                          {address.is_default ? <Badge className="text-emerald-200">Default</Badge> : null}
                        </div>
                        <div className="mt-3 text-lg font-semibold text-white">{[address.building, address.area].filter(Boolean).join(', ')}</div>
                        <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{[address.street, address.city].filter(Boolean).join(', ')}</div>
                        <div className="mt-1 text-sm text-[color:var(--text-secondary)]">{address.contact_name || customer?.name} · {address.phone || customer?.phone}</div>
                      </div>
                      {!address.is_default ? (
                        <Button
                          variant="secondary"
                          className="px-4 py-2 text-xs"
                          onClick={async () => {
                            try {
                              await setDefaultAddress(address.id);
                              pushToast({
                                type: 'success',
                                title: 'Default address updated',
                                description: 'This address will be preselected during checkout.',
                              });
                            } catch (error) {
                              pushToast({
                                type: 'error',
                                title: 'Address update failed',
                                description: error.message || 'Please try again.',
                              });
                            }
                          }}
                        >
                          Make default
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.section>

        <motion.aside variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Add new address</p>
            <div className="grid gap-4">
              <Field label="Address label">
                <select value={addressForm.label} onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))} className="mt-2 w-full bg-transparent text-white outline-none">
                  <option className="bg-slate-950" value="Home">Home</option>
                  <option className="bg-slate-950" value="Work">Work</option>
                  <option className="bg-slate-950" value="Studio">Studio</option>
                </select>
              </Field>
              <Field label="Contact name">
                <input value={addressForm.name} onChange={(event) => setAddressForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full bg-transparent text-white outline-none" />
              </Field>
              <Field label="Phone number">
                <input value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))} className="mt-2 w-full bg-transparent text-white outline-none" />
              </Field>
              <Field label="Street address">
                <input value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} className="mt-2 w-full bg-transparent text-white outline-none" />
              </Field>
              <Field label="Area">
                <input value={addressForm.area} onChange={(event) => setAddressForm((current) => ({ ...current, area: event.target.value }))} className="mt-2 w-full bg-transparent text-white outline-none" />
              </Field>
              <Field label="Landmark">
                <input value={addressForm.landmark} onChange={(event) => setAddressForm((current) => ({ ...current, landmark: event.target.value }))} className="mt-2 w-full bg-transparent text-white outline-none" />
              </Field>
              <Field label="Delivery instructions">
                <input value={addressForm.instructions} onChange={(event) => setAddressForm((current) => ({ ...current, instructions: event.target.value }))} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Call when you reach the gate" />
              </Field>
            </div>
            <div className="mt-6">
              <Button className="h-12 text-base disabled:cursor-not-allowed disabled:opacity-60" onClick={submitAddress} disabled={savingAddress}>
                {savingAddress ? 'Saving...' : 'Save address'}
              </Button>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Guest vs verified</p>
            <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
              <div>Guest browsing lets people explore restaurants, build a cart, and understand the product quickly.</div>
              <div>Verification adds saved addresses, online payment handoff, support ownership, and a durable order history.</div>
              <div>The best product flow is browse first, verify when intent is strong, and keep the handoff effortless.</div>
            </div>
          </GlassCard>
        </motion.aside>
      </div>
    </PageWrapper>
  );
}
