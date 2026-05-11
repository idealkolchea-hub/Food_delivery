/**
 * C9 — Payment Method Selection
 * Route: /customer/payment-select
 * FRD: UC-108 Payment Method Selection
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, getCartTotal } from '@/lib/cart';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', desc: 'Google Pay, PhonePe, Paytm', sublabel: 'Instant' },
  { id: 'card', label: 'Debit/Credit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay', sublabel: 'Secure' },
  { id: 'wallet', label: 'BiteBlast Wallet', icon: '💰', desc: 'Balance: ₹0', sublabel: 'Fast' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives', sublabel: 'Convenient' },
];

export default function PaymentSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('upi');
  const [processing, setProcessing] = useState(false);
  const [cart, setCart] = useState<ReturnType<typeof getCart>>(null);

  useEffect(() => {
    const c = getCart();
    if (!c || c.items.length === 0) {
      router.replace('/customer/checkout');
      return;
    }
    setCart(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cart) return null;

  const totals = getCartTotal(cart);

  const handlePay = async () => {
    setProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));
    router.push('/customer/order_confirm');
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <Link href="/customer/checkout" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textDecoration: 'none', marginBottom: 'var(--sp-3)' }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Choose Payment</h1>
      </div>

      {/* Order summary */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
        marginBottom: 'var(--sp-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: '2px' }}>Amount to pay</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
            {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} · {cart.restaurantName}
          </p>
        </div>
        <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
          ₹{totals.total.toFixed(0)}
        </span>
      </div>

      {/* Payment methods */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {PAYMENT_METHODS.map(m => (
          <div
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
              cursor: 'pointer',
              borderColor: selected === m.id ? 'var(--amber)' : 'var(--border)',
              transition: 'border-color var(--t-fast)',
            }}
          >
            <div style={{ fontSize: '1.5rem', width: 40, textAlign: 'center' }}>{m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: '0.6rem', background: 'var(--bg-overlay)', color: 'var(--text-subtle)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>{m.sublabel}</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>{m.desc}</p>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${selected === m.id ? 'var(--amber)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected === m.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)' }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        marginBottom: 'var(--sp-5)', padding: 'var(--sp-3)',
        background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)',
        borderRadius: 'var(--r-md)',
      }}>
        <span style={{ fontSize: '0.85rem' }}>🔒</span>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>
          Your payment info is encrypted and secure. We never store card details.
        </p>
      </div>

      {/* Pay button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--amber)', color: '#0D1117',
        padding: '16px var(--sp-4)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontWeight: 700, fontSize: 'var(--text-sm)',
        zIndex: 50, boxShadow: '0 -4px 20px rgba(227,179,65,0.3)',
        cursor: processing ? 'not-allowed' : 'pointer',
      }} onClick={processing ? undefined : handlePay}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          {processing ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #0D1117', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Processing...
            </>
          ) : (
            <>Pay ₹{totals.total.toFixed(0)}</>
          )}
        </span>
        <span>→</span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
