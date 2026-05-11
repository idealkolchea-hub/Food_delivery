/**
 * C10 — Order Confirmed
 * Route: /customer/order-confirm
 * FRD: UC-109 Order Confirmation
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, clearCart } from '@/lib/cart';

export default function OrderConfirmPage() {
  const router = useRouter();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (!orderPlaced) {
      // Simulate order placement
      const t = setTimeout(() => {
        const id = 'BB' + Math.random().toString(36).slice(2, 8).toUpperCase();
        setOrderId(id);
        setOrderPlaced(true);
        clearCart(); // Clear cart after order
      }, 1000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!orderPlaced) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-8) var(--sp-4)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>🔥</div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          Placing your order...
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          Please wait while we confirm with the restaurant
        </p>
        <div style={{ marginTop: 'var(--sp-5)', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--border)',
            borderTopColor: 'var(--amber)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', paddingBottom: 80 }}>
      {/* Success animation */}
      <div style={{ textAlign: 'center', padding: 'var(--sp-8) 0 var(--sp-6)' }}>
        <div style={{
          width: 80, height: 80, margin: '0 auto var(--sp-5)',
          background: 'rgba(63,185,80,0.15)', border: '2px solid rgba(63,185,80,0.4)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pop 0.4s ease-out',
        }}>
          <span style={{ fontSize: '2.5rem' }}>✓</span>
        </div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          Order Placed!
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          Your order has been confirmed by the restaurant
        </p>
      </div>

      {/* Order details card */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)',
        marginBottom: 'var(--sp-4)', textAlign: 'center',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: 'var(--sp-2)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
          ORDER ID
        </p>
        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--amber)', letterSpacing: '0.15em', marginBottom: 'var(--sp-4)' }}>
          {orderId}
        </p>

        <div style={{ height: '1px', background: 'var(--border)', margin: 'var(--sp-4) 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-4)' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated delivery</p>
            <p style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>35-40 min</p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#F0883E' }}>🔄 Preparing</p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivering to</p>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>📍 Home</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)',
      }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Order Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: 'Order Placed', time: 'Just now', done: true, active: false },
            { step: 'Restaurant Confirmed', time: '~2 min', done: false, active: true },
            { step: 'Food Being Prepared', time: '~10 min', done: false, active: false },
            { step: 'Out for Delivery', time: '~25 min', done: false, active: false },
            { step: 'Delivered', time: '~35 min', done: false, active: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', padding: 'var(--sp-3) 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: item.done ? '#3FB950' : item.active ? 'var(--amber)' : 'var(--bg-overlay)',
                  border: item.active ? '2px solid var(--amber)' : '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', color: item.done || item.active ? '#0D1117' : 'var(--text-faint)',
                }}>
                  {item.done ? '✓' : item.active ? '●' : '○'}
                </div>
                {i < 4 && <div style={{ width: '2px', height: 20, background: item.done ? '#3FB950' : 'var(--border)' }} />}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: item.active ? 700 : 500, color: item.active ? 'var(--text)' : 'var(--text-subtle)' }}>
                  {item.step}
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <Link href="/customer/delivery_track" style={{
          display: 'block', textAlign: 'center', padding: '14px',
          background: 'var(--amber)', color: '#0D1117',
          borderRadius: 'var(--r-md)', fontSize: 'var(--text-sm)', fontWeight: 700,
          textDecoration: 'none',
        }}>
          📍 Track Delivery
        </Link>
        <Link href="/customer/home_logged" style={{
          display: 'block', textAlign: 'center', padding: '14px',
          background: 'var(--bg-surface)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          fontSize: 'var(--text-sm)', fontWeight: 600,
          textDecoration: 'none',
        }}>
          Continue Browsing
        </Link>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}