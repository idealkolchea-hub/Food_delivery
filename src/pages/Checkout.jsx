import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { useToast } from '../hooks/useToast';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';

const paymentMethods = [
  { id: 'upi', label: 'UPI', requiresAuth: true, note: 'Instant collect request' },
  { id: 'card', label: 'Card / wallet', requiresAuth: true, note: 'Secure demo gateway' },
  { id: 'cod', label: 'Cash on delivery', requiresAuth: true, note: 'Pay at handoff' },
];

const initialForm = {
  name: '',
  phone: '',
  addressLabel: 'Home',
  addressLine1: '',
  area: '',
  city: 'Pune',
  landmark: '',
  instructions: '',
};

function validateCheckout(form) {
  const nextErrors = {};

  if (!form.name.trim()) nextErrors.name = 'Name is required.';
  if (!/^\d{10}$/.test(form.phone.trim())) nextErrors.phone = 'Enter a valid 10-digit phone number.';
  if (!form.addressLine1.trim()) nextErrors.addressLine1 = 'Street address is required.';
  if (!form.area.trim()) nextErrors.area = 'Area is required.';
  if (!form.city.trim()) nextErrors.city = 'City is required.';
  if (!form.landmark.trim()) nextErrors.landmark = 'Landmark is required.';

  return nextErrors;
}

function Field({ label, error, children }) {
  return (
    <label className={`rounded-[22px] border bg-white/6 p-4 ${error ? 'border-rose-400/60' : 'border-white/10'}`}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      {children}
      {error ? <div className="mt-2 text-xs text-rose-200">{error}</div> : null}
    </label>
  );
}

function mapAddressToCheckout(address, customer) {
  return {
    name: address.contact_name || customer?.name || '',
    phone: address.phone || customer?.phone || '',
    addressLabel: address.label || 'Home',
    addressLine1: address.building || '',
    area: address.area || '',
    city: address.city || 'Pune',
    landmark: address.street || '',
    instructions: address.instructions || '',
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const { loading, items, subtotal, delivery, service, discount, total, clearCart } = useCart();
  const { placeOrder, createPaymentIntent } = useOrderFlow();
  const { customer, addresses, isAuthenticated, saveAddress } = useCustomerSession();
  const { pushToast } = useToast();
  const [checkout, setCheckout] = useState(initialForm);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const currentRestaurant = items[0]?.restaurantName;
  const summary = useMemo(() => ({
    subtotal,
    delivery,
    service,
    discount,
    total,
  }), [subtotal, delivery, service, discount, total]);

  useEffect(() => {
    if (!customer) return;
    setCheckout((current) => ({
      ...current,
      name: current.name || customer.name || '',
      phone: current.phone || customer.phone || '',
    }));
  }, [customer]);

  useEffect(() => {
    if (!addresses.length) return;
    const defaultAddress = addresses.find((address) => address.is_default) || addresses[0];
    if (!defaultAddress) return;
    setSelectedAddressId(defaultAddress.id);
    setCheckout((current) => ({
      ...current,
      ...mapAddressToCheckout(defaultAddress, customer),
    }));
  }, [addresses, customer]);

  const updateField = (field, value) => {
    setCheckout((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const maybeSaveAddress = async () => {
    if (!isAuthenticated) return;

    const alreadySaved = addresses.some((address) => (
      address.label === checkout.addressLabel
      && address.building === checkout.addressLine1
      && address.area === checkout.area
      && address.city === checkout.city
      && address.street === checkout.landmark
    ));

    if (alreadySaved) return;

    await saveAddress({
      label: checkout.addressLabel,
      line1: checkout.addressLine1,
      area: checkout.area,
      city: checkout.city,
      landmark: checkout.landmark,
      instructions: checkout.instructions,
      name: checkout.name,
      phone: checkout.phone,
      isDefault: addresses.length === 0,
    });
  };

  const submitOrder = async () => {
    const nextErrors = validateCheckout(checkout);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      pushToast({
        type: 'error',
        title: 'Finish the required details',
        description: 'We need a complete delivery profile before sending this order.',
      });
      return;
    }

    if (!isAuthenticated) {
      pushToast({
        type: 'info',
        title: 'Sign in first',
        description: 'We need a customer account before taking the order any further.',
      });
      navigate('/login?next=/checkout');
      return;
    }

    try {
      setSubmitting(true);
      await maybeSaveAddress();

      if (paymentMethod === 'cod') {
        const order = await placeOrder({
          items,
          summary,
          checkout,
          paymentMethod,
        });
        await clearCart();
        navigate(`/order-confirmation/${order.id}`);
        return;
      }

      const paymentIntent = await createPaymentIntent({
        items,
        summary,
        checkout,
        paymentMethod,
      });
      navigate(`/payment/${paymentIntent.id}`);
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Checkout could not continue',
        description: error.message || 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && items.length === 0) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <motion.section variants={childVariants} className="grid place-items-center py-24">
          <GlassCard interactive={false} className="max-w-xl p-10 text-center">
            <div className="mx-auto mb-6 w-28 text-6xl">🥢</div>
            <h1 className="font-display text-4xl italic text-white">Nothing to check out yet</h1>
            <p className="mt-4 text-[color:var(--text-secondary)]">Build your order first, then we will take care of the handoff and live tracking.</p>
            <div className="mt-8">
              <Link to="/"><Button>Browse kitchens</Button></Link>
            </div>
          </GlassCard>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1280px]">
      <motion.section variants={childVariants} className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Checkout</p>
          <h1 className="font-display text-5xl italic text-white">Finish the order</h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-secondary)]">Signed-in customers can place COD orders or move into a believable online payment handoff.</p>
        </div>
        <Link to="/cart" className="text-sm text-[color:var(--text-secondary)]">Back to cart →</Link>
      </motion.section>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.section variants={childVariants} className="space-y-6">
          <GlassCard interactive={false} className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Customer verification</p>
              <Badge className={isAuthenticated ? 'text-emerald-200' : ''}>{isAuthenticated ? 'Verified' : 'Verification required'}</Badge>
            </div>
              <p className="text-sm text-[color:var(--text-secondary)]">
              {isAuthenticated
                ? `${customer?.name || 'Customer'} is signed in and ready for saved addresses, orders, and payment flows.`
                : 'Sign in before placing the order. This keeps history, support, and online payment attempts tied to one real customer account.'}
            </p>
            {!isAuthenticated ? (
              <div className="mt-5">
                <Link to="/login?next=/checkout"><Button>Sign in now</Button></Link>
              </div>
            ) : null}
          </GlassCard>

          {addresses.length ? (
            <GlassCard interactive={false} className="p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Saved addresses</p>
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.map((address) => {
                  const selected = selectedAddressId === address.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setCheckout((current) => ({ ...current, ...mapAddressToCheckout(address, customer) }));
                      }}
                      className={`rounded-[22px] border p-4 text-left transition-colors ${selected ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)]' : 'border-white/10 bg-white/6'}`}
                    >
                      <div className="text-sm font-semibold text-white">{address.label || 'Saved address'}</div>
                      <div className="mt-2 text-sm text-[color:var(--text-secondary)]">{[address.building, address.area, address.city].filter(Boolean).join(', ')}</div>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          ) : null}

          <GlassCard interactive={false} className="p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Delivery details</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name" error={errors.name}>
                <input value={checkout.name} onChange={(event) => updateField('name', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Aarav Mehta" />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <input value={checkout.phone} onChange={(event) => updateField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="9876543210" inputMode="numeric" />
              </Field>
              <Field label="Address label" error={errors.addressLabel}>
                <select value={checkout.addressLabel} onChange={(event) => updateField('addressLabel', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none">
                  <option className="bg-slate-950" value="Home">Home</option>
                  <option className="bg-slate-950" value="Work">Work</option>
                  <option className="bg-slate-950" value="Studio">Studio</option>
                </select>
              </Field>
              <Field label="Area" error={errors.area}>
                <input value={checkout.area} onChange={(event) => updateField('area', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Koregaon Park" />
              </Field>
              <Field label="Street address" error={errors.addressLine1}>
                <input value={checkout.addressLine1} onChange={(event) => updateField('addressLine1', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Flat 4B, Skyline Residency" />
              </Field>
              <Field label="City" error={errors.city}>
                <input value={checkout.city} onChange={(event) => updateField('city', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Pune" />
              </Field>
              <Field label="Landmark" error={errors.landmark}>
                <input value={checkout.landmark} onChange={(event) => updateField('landmark', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Near Osho Garden" />
              </Field>
              <Field label="Delivery instructions" error={errors.instructions}>
                <input value={checkout.instructions} onChange={(event) => updateField('instructions', event.target.value)} className="mt-2 w-full bg-transparent text-white outline-none" placeholder="Call when outside" />
              </Field>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Payment</p>
              <Badge>{paymentMethod.toUpperCase()}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`rounded-[22px] border px-4 py-5 text-left transition-colors ${
                      selected
                        ? 'border-[color:var(--accent-primary)] bg-[rgba(255,107,53,0.14)] text-white'
                        : 'border-white/10 bg-white/6 text-[color:var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Method</div>
                    <div className="mt-2 text-sm font-semibold">{method.label}</div>
                    <div className="mt-2 text-xs text-[color:var(--text-secondary)]">{method.note}</div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </motion.section>

        <motion.aside variants={childVariants} className="xl:sticky xl:top-28 xl:self-start">
          <GlassCard interactive={false} className="space-y-6 p-6">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Review</p>
              <h2 className="font-display text-3xl italic text-white">Ready for dispatch</h2>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{currentRestaurant}</p>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/6 p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-[16px] object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-[color:var(--text-secondary)]">{item.quantity} item{item.quantity > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-white">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums text-white">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums text-white">${delivery.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Service fee</span><span className="tabular-nums text-white">${service.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="tabular-nums text-emerald-300">-${discount.toFixed(2)}</span></div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Total payable</span>
              <motion.span layout className="text-3xl font-extrabold tabular-nums text-white">${total.toFixed(2)}</motion.span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{checkout.addressLabel}</Badge>
              <Badge>{paymentMethod.toUpperCase()}</Badge>
              {isAuthenticated ? <Badge>Verified</Badge> : <Badge>Verify first</Badge>}
            </div>

            <Button className="h-14 w-full text-base disabled:cursor-not-allowed disabled:opacity-60" onClick={submitOrder} disabled={submitting || loading}>
              {submitting
                ? paymentMethod === 'cod' ? 'Sending to kitchen...' : 'Preparing payment...'
                : paymentMethod === 'cod' ? 'Place order' : 'Continue to payment'}
            </Button>
          </GlassCard>
        </motion.aside>
      </div>
    </PageWrapper>
  );
}
