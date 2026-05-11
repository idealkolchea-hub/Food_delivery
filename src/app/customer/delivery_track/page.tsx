/**
 * C12 — Delivery Tracking
 * Route: /customer/delivery-track
 * FRD: UC-110 Order Status Tracking
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type OrderStatus = 'confirmed' | 'preparing' | 'picked_up' | 'on_the_way' | 'delivered';

interface Stage {
  key: OrderStatus;
  label: string;
  time: string;
  desc: string;
}

const DEMO_STAGES: Record<OrderStatus, Stage> = {
  confirmed: {
    key: 'confirmed',
    label: 'Order Confirmed',
    time: 'Just now',
    desc: 'Restaurant has accepted your order',
  },
  preparing: {
    key: 'preparing',
    label: 'Being Prepared',
    time: '~10 min',
    desc: 'Chef is preparing your food',
  },
  picked_up: {
    key: 'picked_up',
    label: 'Picked Up',
    time: '~20 min',
    desc: 'Delivery partner collected your order',
  },
  on_the_way: {
    key: 'on_the_way',
    label: 'On the Way',
    time: '~30 min',
    desc: 'Your order is on its way to you',
  },
  delivered: {
    key: 'delivered',
    label: 'Delivered',
    time: '~35 min',
    desc: 'Order delivered. Enjoy your meal!',
  },
};

const STATUS_ORDER: OrderStatus[] = ['confirmed', 'preparing', 'picked_up', 'on_the_way', 'delivered'];

function getCurrentStage(): OrderStatus {
  const saved = localStorage.getItem('biteblast_demo_stage');
  if (saved && STATUS_ORDER.includes(saved as OrderStatus)) return saved as OrderStatus;
  return 'preparing';
}

function advanceStage(current: OrderStatus): OrderStatus {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx < STATUS_ORDER.length - 1) return STATUS_ORDER[idx + 1];
  return current;
}

export default function DeliveryTrackPage() {
  const [stage, setStage] = useState<OrderStatus>('preparing');
  const [timeLeft, setTimeLeft] = useState(28);

  useEffect(() => {
    const initial = getCurrentStage();
    setStage(initial);
    // Countdown
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const next = advanceStage(stage);
          if (next !== stage) {
            setStage(next);
            localStorage.setItem('biteblast_demo_stage', next);
          }
          return 35;
        }
        return prev - 1;
      });
    }, 15000); // Advance every 15s for demo purposes
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageData = DEMO_STAGES[stage];
  const stageIndex = STATUS_ORDER.indexOf(stage);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-4)', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <Link href="/customer/home_logged" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textDecoration: 'none', marginBottom: 'var(--sp-3)' }}>
          ← Home
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '2px' }}>
              Track Order
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              BB{Math.random().toString(36).slice(2, 8).toUpperCase()}
            </p>
          </div>
          <div style={{
            background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.3)',
            borderRadius: 'var(--r-md)', padding: '8px 12px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: '2px', textTransform: 'uppercase' }}>Arriving in</p>
            <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#3FB950' }}>
              {timeLeft} min
            </p>
          </div>
        </div>
      </div>

      {/* Active status banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(240,136,62,0.15) 0%, rgba(240,136,62,0.05) 100%)',
        border: '1px solid rgba(240,136,62,0.3)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)',
        marginBottom: 'var(--sp-4)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-3)' }}>
          {stage === 'confirmed' ? '📋' : stage === 'preparing' ? '👨‍🍳' : stage === 'picked_up' ? '📦' : stage === 'on_the_way' ? '🛵' : '✅'}
        </div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          {stageData.label}
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          {stageData.desc}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: 'var(--sp-5)',
      }}>
        {STATUS_ORDER.map((s, i) => {
          const done = i <= stageIndex;
          const active = s === stage;
          return (
            <div
              key={s}
              style={{
                flex: 1, height: 4, borderRadius: 'var(--r-full)',
                background: done ? (active ? 'var(--amber)' : '#3FB950') : 'var(--bg-overlay)',
                transition: 'background var(--t-base)',
              }}
            />
          );
        })}
      </div>

      {/* Full timeline */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)',
      }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STATUS_ORDER.map((s, i) => {
            const done = i < stageIndex;
            const active = s === stage;
            const future = i > stageIndex;
            const data = DEMO_STAGES[s];
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', padding: 'var(--sp-3) 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: done ? '#3FB950' : active ? 'var(--amber)' : 'var(--bg-overlay)',
                    border: active ? '2px solid var(--amber)' : '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: done || active ? '#0D1117' : 'var(--text-faint)',
                    fontWeight: 700,
                  }}>
                    {done ? '✓' : active ? '●' : '○'}
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div style={{ width: '2px', flex: 1, minHeight: 20, background: done ? '#3FB950' : 'var(--border)' }} />
                  )}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: active ? 700 : done ? 500 : 400, color: future ? 'var(--text-faint)' : 'var(--text)' }}>
                    {data.label}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: done ? '#3FB950' : active ? 'var(--amber)' : 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    {data.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery partner info */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)',
      }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--sp-3)' }}>Delivery Partner</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--bg-overlay)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            🛵
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Arun Kumar</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>Your delivery partner</p>
          </div>
          <button style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--bg-overlay)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', cursor: 'pointer',
          }}>
            📞
          </button>
        </div>
      </div>

      {/* Demo controls */}
      <div style={{
        background: 'var(--bg-overlay)', border: '1px dashed var(--border)',
        borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
        marginBottom: 'var(--sp-4)',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: 'var(--sp-2)', fontFamily: 'var(--font-mono)' }}>
          DEMO: Advance to next stage
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => {
                setStage(s);
                localStorage.setItem('biteblast_demo_stage', s);
                setTimeLeft(35);
              }}
              style={{
                flex: 1, padding: '6px 4px',
                background: stage === s ? 'var(--amber)' : 'var(--bg-surface)',
                color: stage === s ? '#0D1117' : 'var(--text-subtle)',
                border: 'none', borderRadius: 'var(--r-sm)',
                fontSize: '0.6rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Rate order (if delivered) */}
      {stage === 'delivered' && (
        <Link href="/customer/rate_experience" style={{ textDecoration: 'none' }}>
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--amber)', color: '#0D1117',
            padding: '16px var(--sp-4)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontWeight: 700, fontSize: 'var(--text-sm)',
            zIndex: 50, boxShadow: '0 -4px 20px rgba(227,179,65,0.3)',
          }}>
            ⭐ Rate Your Order
          </div>
        </Link>
      )}
    </div>
  );
}