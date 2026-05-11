/**
 * C8 — Checkout
 * Route: /customer/checkout
 * FRD: UC-107 Checkout & Address Selection
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, getCartTotal, Cart } from '@/lib/cart';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui';

interface Address {
  id: string;
  label: string;
  flat_no: string;
  building: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
}

const MOCK_ADDRESSES: Address[] = [
  { id: 'addr_1', label: 'Home', flat_no: '304', building: 'Skyline Residency', street: 'Koregaon Park Road', area: 'Koregaon Park', city: 'Pune', pincode: '411001' },
  { id: 'addr_2', label: 'Work', flat_no: '12', building: 'Tech Park Alpha', street: 'Viman Nagar Road', area: 'Viman Nagar', city: 'Pune', pincode: '411014' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddr, setSelectedAddr] = useState<string>('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [tip, setTip] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = getCart();
    if (!c || c.items.length === 0) {
      router.replace('/customer/cart');
      return;
    }
    setCart(c);
    // Load addresses (mock + real)
    setAddresses(MOCK_ADDRESSES);
    setSelectedAddr('addr_1');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!cart) return null;

  const totals = getCartTotal(cart);
  const discount = couponApplied ? Math.round(totals.subtotal * 0.1) : 0;
  const grandTotal = totals.total - discount;

  const tipOptions = [0, 10, 20, 30];

  const applyCoupon = () => {
    setCouponError('');
    if (coupon.toUpperCase() === 'BITE10') {
      setCouponApplied(true);
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    router.push('/customer/payment_select');
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <Link href="/customer/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textDecoration: 'none', marginBottom: 'var(--sp-3)' }}>
          ← Back to Cart
        </Link>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>Checkout</h1>
      </div>

      {/* Delivery Address */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          📍 Delivery Address
        </h2>
        {addresses.map(addr => (
          <div
            key={addr.id}
            onClick={() => setSelectedAddr(addr.id)}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
              marginBottom: 'var(--sp-2)', cursor: 'pointer',
              borderColor: selectedAddr === addr.id ? 'var(--amber)' : 'var(--border)',
              transition: 'border-color var(--t-fast)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: 'var(--text-xs)', fontWeight: 700,
                    background: selectedAddr === addr.id ? 'var(--amber)' : 'var(--bg-overlay)',
                    color: selectedAddr === addr.id ? '#0D1117' : 'var(--text-subtle)',
                    padding: '2px 8px', borderRadius: 'var(--r-sm)',
                  }}>
                    {addr.label}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
                  {addr.flat_no}, {addr.building}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>
                  {addr.street}, {addr.area}, {addr.city} — {addr.pincode}
                </p>
              </div>
              {selectedAddr === addr.id && (
                <span style={{ color: 'var(--amber)', fontSize: 'var(--text-sm)' }}>✓</span>
              )}
            </div>
          </div>
        ))}
        <button style={{
          width: '100%', padding: '10px', background: 'var(--bg-surface)',
          border: '1px dashed var(--border)', borderRadius: 'var(--r-md)',
          color: 'var(--text-subtle)', fontSize: 'var(--text-sm)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}>
          + Add new address
        </button>
      </div>

      {/* Coupon */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          🎟️ Coupon
        </h2>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <input
            type="text" placeholder="Enter coupon code"
            value={coupon}
            onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponApplied(false); setCouponError(''); }}
            style={{
              flex: 1, background: 'var(--bg-surface)',
              border: `1px solid ${couponError ? 'var(--red)' : couponApplied ? 'var(--amber)' : 'var(--border)'}`,
              borderRadius: 'var(--r-md)', padding: '10px 14px',
              fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
              color: 'var(--text)', outline: 'none',
            }}
          />
          <button
            onClick={applyCoupon}
            disabled={!coupon}
            style={{
              padding: '10px 16px', background: 'var(--bg-overlay)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              color: coupon ? 'var(--text)' : 'var(--text-faint)',
              cursor: coupon ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Apply
          </button>
        </div>
        {couponApplied && (
          <p style={{ fontSize: 'var(--text-xs)', color: '#3FB950', marginTop: 'var(--sp-2)' }}>
            ✓ BITE10 applied — 10% off!
          </p>
        )}
        {couponError && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 'var(--sp-2)' }}>
            {couponError}
          </p>
        )}
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: 'var(--sp-1)', fontFamily: 'var(--font-mono)' }}>
          Try: BITE10
        </p>
      </div>

      {/* Tip */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          💜 Add a tip
        </h2>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {tipOptions.map(t => (
            <button
              key={t}
              onClick={() => setTip(t)}
              style={{
                flex: 1, padding: '10px',
                background: tip === t ? 'var(--amber)' : 'var(--bg-surface)',
                color: tip === t ? '#0D1117' : 'var(--text-subtle)',
                border: `1px solid ${tip === t ? 'var(--amber)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)',
                fontWeight: 600, fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              {t === 0 ? 'No tip' : `₹${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Bill breakdown */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-5)',
      }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          Bill Summary
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {[
            { label: 'Subtotal', value: `₹${totals.subtotal.toFixed(0)}` },
            { label: 'Delivery fee', value: `₹${cart.deliveryFee}` },
            { label: 'Platform fee', value: '₹5' },
            { label: 'GST (5%)', value: `₹${totals.gst.toFixed(0)}` },
            ...(tip > 0 ? [{ label: 'Tip', value: `₹${tip}` }] : []),
            ...(couponApplied ? [{ label: 'Discount (10%)', value: `-₹${discount}` }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>{row.label}</span>
              <span style={{
                fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
                color: row.label.includes('Discount') ? '#3FB950' : 'var(--text)',
              }}>
                {row.value}
              </span>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--border)', margin: 'var(--sp-2) 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Grand Total</span>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
              ₹{(grandTotal + tip).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Place order button */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--amber)', color: '#0D1117',
        padding: '16px var(--sp-4)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontWeight: 700, fontSize: 'var(--text-sm)',
        zIndex: 50, boxShadow: '0 -4px 20px rgba(227,179,65,0.3)',
        cursor: 'pointer',
      }} onClick={handlePlaceOrder}>
        <span>{loading ? 'Processing...' : 'Proceed to Payment'}</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(grandTotal + tip).toFixed(0)} →</span>
      </div>
    </div>
  );
}