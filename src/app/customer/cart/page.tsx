/**
 * C7 — Cart
 * Route: /customer/cart
 * FRD: UC-106 Cart Management
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCart, updateQuantity, removeFromCart, clearCart, getCartTotal, Cart } from '@/lib/cart';
import { Button } from '@/components/ui';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);

  const refreshCart = () => setCart(getCart());

  useEffect(() => {
    refreshCart();
    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', refreshCart);
    return () => window.removeEventListener('storage', refreshCart);
  }, []);

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-8) var(--sp-4)', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--sp-4)' }}>🛒</div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          Your cart is empty
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', marginBottom: 'var(--sp-6)' }}>
          Add items from a restaurant to get started
        </p>
        <Link href="/customer/home_guest">
          <Button variant="primary">Browse Restaurants</Button>
        </Link>
      </div>
    );
  }

  const totals = getCartTotal(cart);

  const handleQuantity = (menuItemId: string, delta: number) => {
    const item = cart.items.find(i => i.menuItemId === menuItemId);
    if (!item) return;
    updateQuantity(menuItemId, item.quantity + delta);
    refreshCart();
  };

  const handleRemove = (menuItemId: string) => {
    removeFromCart(menuItemId);
    refreshCart();
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '2px' }}>
            Your Cart
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
            {cart.restaurantName}
          </p>
        </div>
        <button
          onClick={() => { clearCart(); refreshCart(); }}
          style={{
            background: 'none', border: 'none',
            fontSize: 'var(--text-xs)', color: 'var(--red)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}
        >
          Clear cart
        </button>
      </div>

      {/* Restaurant badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: '10px 14px',
        marginBottom: 'var(--sp-5)',
      }}>
        <span style={{ fontSize: '1rem' }}>🍽️</span>
        <div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{cart.restaurantName}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>
            Delivery in ~{35 + Math.floor(Math.random() * 10)} min
          </p>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
        {cart.items.map(item => (
          <div key={item.menuItemId} style={{
            display: 'flex', gap: 'var(--sp-3)', alignItems: 'center',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
          }}>
            {/* Veg/non-veg */}
            <div style={{
              width: 20, height: 20, borderRadius: '3px', flexShrink: 0,
              border: '1.5px solid var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '2px' }}>
                {item.name}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                ₹{item.price} × {item.quantity}
              </p>
              {item.notes && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', marginTop: '2px' }}>
                  Note: {item.notes}
                </p>
              )}
            </div>

            {/* Price */}
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)', marginRight: 'var(--sp-3)' }}>
              ₹{item.price * item.quantity}
            </span>

            {/* Qty controls */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
              background: 'var(--bg-overlay)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '4px',
            }}>
              <button
                onClick={() => handleQuantity(item.menuItemId, -1)}
                style={{
                  width: 28, height: 28, borderRadius: 'var(--r-sm)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 'var(--text-base)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                −
              </button>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: 20, textAlign: 'center' }}>
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantity(item.menuItemId, 1)}
                style={{
                  width: 28, height: 28, borderRadius: 'var(--r-sm)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--amber)', fontSize: 'var(--text-base)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bill breakdown */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)',
      }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
          Bill Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {[
            { label: 'Subtotal', value: `₹${totals.subtotal.toFixed(0)}` },
            { label: 'Delivery fee', value: `₹${cart.deliveryFee}` },
            { label: 'Platform fee', value: '₹5' },
            { label: 'GST (5%)', value: `₹${totals.gst.toFixed(0)}` },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>{row.label}</span>
              <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>{row.value}</span>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--border)', margin: 'var(--sp-2) 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
              ₹{totals.total.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout button */}
      <Link href="/customer/checkout">
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'var(--amber)', color: '#0D1117',
          padding: '16px var(--sp-4)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 700, fontSize: 'var(--text-sm)',
          zIndex: 50, boxShadow: '0 -4px 20px rgba(227,179,65,0.3)',
          cursor: 'pointer', textDecoration: 'none',
        }}>
          <span>Continue to Checkout</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>₹{totals.total.toFixed(0)} →</span>
        </div>
      </Link>
    </div>
  );
}