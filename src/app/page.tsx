/**
 * BiteBlast — Home / Role Selector
 * Claude-inspired design: dark background, amber accents, monospace labels.
 */
'use client';

import Link from 'next/link';

const ROLES = [
  {
    key: 'customer', label: 'Customer', subtitle: 'Order food, track deliveries, manage wallet',
    brandColor: '#F85149', icon: '🍽', count: 27, screens: 'C1–C27',
    flow: ['Browse', 'Order', 'Pay', 'Track', 'Rate'],
  },
  {
    key: 'partner', label: 'Restaurant Partner', subtitle: 'Manage orders, menu, payouts, trust score',
    brandColor: '#F0883E', icon: '👨‍🍳', count: 21, screens: 'R1–R21',
    flow: ['Onboard', 'Menu', 'Orders', 'Insights', 'Payouts'],
  },
  {
    key: 'agent', label: 'Delivery Agent', subtitle: 'Accept orders, pick up, deliver, earn daily',
    brandColor: '#3FB950', icon: '🚴', count: 11, screens: 'A1–A11',
    flow: ['KYC', 'Online', 'Pickup', 'Deliver', 'Earn'],
  },
  {
    key: 'admin', label: 'Admin HQ', subtitle: 'Monitor fraud, resolve disputes, manage finance',
    brandColor: '#A371F7', icon: '🛡', count: 22, screens: 'S1–S22',
    flow: ['Dashboard', 'Entities', 'Ops', 'Finance'],
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: 'var(--sp-8) var(--sp-6)' }}>
      <style>{`
        .role-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: var(--sp-4) var(--sp-5); cursor: pointer; transition: border-color 150ms ease, background 150ms ease; text-decoration: none; display: block; position: relative; overflow: hidden; }
        .role-card:hover { border-color: var(--card-accent, var(--border)); background: var(--bg-overlay); }
        .role-card-customer:hover { border-color: rgba(248,81,73,0.5); }
        .role-card-partner:hover  { border-color: rgba(240,136,62,0.5); }
        .role-card-agent:hover    { border-color: rgba(63,185,80,0.5); }
        .role-card-admin:hover    { border-color: rgba(163,113,247,0.5); }
        .role-card .arrow { color: var(--text-faint); font-size: var(--text-lg); transition: color 150ms ease; flex-shrink: 0; }
        .role-card:hover .arrow { color: var(--text-subtle); }
        .role-label { font-weight: 600; font-size: var(--text-base); }
        .back-link { color: var(--text-faint); font-size: var(--text-sm); text-decoration: none; font-family: var(--font-mono); transition: color 100ms ease; }
        .back-link:hover { color: var(--text-subtle); }
      `}</style>

      {/* Header */}
      <header style={{ maxWidth: 680, margin: '0 auto var(--sp-12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
          <span style={{ fontSize: '1.75rem' }}>🔥</span>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            BiteBlast
          </h1>
        </div>
        <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <span>The trusted food delivery platform</span>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>demo build</span>
        </p>
      </header>

      {/* Role Cards */}
      <main style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--amber)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>// select role</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {ROLES.map((role) => (
            <Link key={role.key} href={`/${role.key}`} className={`role-card role-card-${role.key}`}>
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '3px', background: role.brandColor,
                borderRadius: 'var(--r-sm) 0 0 var(--r-sm)',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', paddingLeft: 'var(--sp-1)' }}>
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: role.brandColor + '18',
                  border: `1px solid ${role.brandColor}35`,
                  borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem',
                }}>
                  {role.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-3)', marginBottom: 'var(--sp-1)', flexWrap: 'wrap' }}>
                    <span className="role-label">{role.label}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                      color: role.brandColor, background: role.brandColor + '15',
                      padding: '1px 6px', borderRadius: 'var(--r-sm)',
                      border: `1px solid ${role.brandColor}28`,
                    }}>
                      {role.screens}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-subtle)', fontSize: 'var(--text-sm)' }}>{role.subtitle}</p>
                  <div style={{ display: 'flex', gap: 'var(--sp-1)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    {role.flow.map((step, i) => (
                      <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{step}</span>
                        {i < role.flow.length - 1 && (
                          <span style={{ color: 'var(--border)', margin: '0 2px', fontSize: 'var(--text-xs)' }}>›</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="arrow">→</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          marginTop: 'var(--sp-10)', background: 'var(--bg-surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
          padding: 'var(--sp-5)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-4)',
        }}>
          {[{ label: 'Routes', value: '97' },{ label: 'Mock APIs', value: '8' },{ label: 'Role Hubs', value: '4' },{ label: 'Demo Flows', value: '4' }].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--amber)', marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{label}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 'var(--sp-8)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          generated from <span style={{ color: 'var(--text-subtle)' }}>BiteBlast Obsidian vault</span> · <span style={{ color: 'var(--text-subtle)' }}>Next.js 14 + TypeScript</span>
        </p>
      </main>
    </div>
  );
}
