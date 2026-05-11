/**
 * C1 — Home (Logged In)
 * Route: /customer/home_logged
 * FRD: UC-101 Customer OTP Login (post-login personalized view)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession, clearSession, isLoggedIn } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import { Badge } from '@/components/ui';

const MOCK_RESTAURANTS = [
  { id: 'seed_1', name: 'Spice Garden', cuisine_types: ['North Indian', 'Biryani', 'Mughlai'], rating: '4.3', delivery_time_min: 35, min_order: 200, is_active: true, image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=300&fit=crop', address: { area: 'Koregaon Park' }, delivery_fee: 20 },
  { id: 'seed_2', name: 'The Pizza Forge', cuisine_types: ['Italian', 'Pizza', 'Pasta'], rating: '4.6', delivery_time_min: 28, min_order: 150, is_active: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28d10f96910?w=600&h=300&fit=crop', address: { area: 'Viman Nagar' }, delivery_fee: 15 },
  { id: 'seed_3', name: 'Burger Brigade', cuisine_types: ['American', 'Burgers', 'Fast Food'], rating: '4.1', delivery_time_min: 22, min_order: 100, is_active: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=300&fit=crop', address: { area: 'Kalyani Nagar' }, delivery_fee: 15 },
  { id: 'seed_4', name: 'Sushi Zen', cuisine_types: ['Japanese', 'Sushi', 'Asian'], rating: '4.7', delivery_time_min: 40, min_order: 300, is_active: true, image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce73f870f1?w=600&h=300&fit=crop', address: { area: 'Koregaon Park' }, delivery_fee: 25 },
  { id: 'seed_5', name: 'Biryani Boulevard', cuisine_types: ['Hyderabadi', 'Biryani', 'South Indian'], rating: '4.4', delivery_time_min: 38, min_order: 180, is_active: true, image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=300&fit=crop', address: { area: 'Hadapsar' }, delivery_fee: 20 },
];

interface Restaurant {
  id: string; name: string; cuisine_types: string[];
  rating: string; delivery_time_min: number; min_order: number;
  is_active: boolean; image_url?: string; address?: { area?: string }; delivery_fee?: number;
}

export default function HomeLoggedPage() {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace('/customer/auth_login');
      return;
    }
    setSession(s);
    loadRestaurants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    if (hasEnv) {
      try {
        const { data } = await supabase.from('restaurants').select('*').eq('is_active', true).order('rating', { ascending: false });
        if (data && data.length > 0) { setRestaurants(data as Restaurant[]); setLoading(false); return; }
      } catch {}
    }
    setRestaurants(MOCK_RESTAURANTS);
    setLoading(false);
  };

  const filtered = restaurants.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine_types.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = !filter || r.cuisine_types.includes(filter);
    return matchSearch && matchFilter;
  });

  const allCuisines = [...new Set(restaurants.flatMap(r => r.cuisine_types))].sort();
  const cart = getCart();
  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-4)', paddingTop: 'var(--sp-4)' }}>
      {/* User header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--sp-4)',
      }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginBottom: '2px' }}>
            Deliver to
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>📍 Home — 304, Skyline Residency</span>
            <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>▼</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Link href="/customer/cart" style={{
            position: 'relative',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: '1.1rem' }}>🛒</span>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--amber)', color: '#0D1117',
                width: 18, height: 18, borderRadius: '50%',
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>👤</span>
          </button>
        </div>
      </div>

      {/* User dropdown */}
      {showMenu && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: 'var(--sp-3)',
          marginBottom: 'var(--sp-4)', zIndex: 20, position: 'relative',
        }}>
          <div style={{ padding: 'var(--sp-2)', marginBottom: 'var(--sp-2)', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>+91 {session?.phone}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>Demo customer</p>
          </div>
          <Link href="/customer/order_history" style={{ display: 'block', padding: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text)', textDecoration: 'none', borderRadius: 'var(--r-sm)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            📋 My Orders
          </Link>
          <Link href="/customer/addresses" style={{ display: 'block', padding: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text)', textDecoration: 'none', borderRadius: 'var(--r-sm)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            📍 Saved Addresses
          </Link>
          <Link href="/customer/wallet" style={{ display: 'block', padding: 'var(--sp-2)', fontSize: 'var(--text-sm)', color: 'var(--text)', textDecoration: 'none', borderRadius: 'var(--r-sm)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
            💳 Wallet
          </Link>
          <div style={{ height: '1px', background: 'var(--border)', margin: 'var(--sp-2) 0' }} />
          <button
            onClick={() => { clearSession(); router.push('/customer/auth_login'); }}
            style={{
              width: '100%', padding: 'var(--sp-2)', textAlign: 'left',
              background: 'none', border: 'none', borderRadius: 'var(--r-sm)',
              fontSize: 'var(--text-sm)', color: 'var(--red)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            🚪 Sign Out
          </button>
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '2px' }}>
          Good evening! 👋
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
          5 restaurants delivering near you
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
          <span style={{ color: 'var(--text-subtle)' }}>🔍</span>
          <input type="text" placeholder="Search restaurants or cuisines"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 'var(--text-sm)', color: 'var(--text)', fontFamily: 'var(--font-sans)' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>✕</button>}
        </div>
      </div>

      {/* Cuisine filter */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', marginBottom: 'var(--sp-5)', paddingBottom: 'var(--sp-1)', WebkitOverflowScrolling: 'touch' }}>
        <button onClick={() => setFilter('')} style={{ flexShrink: 0, padding: '6px 12px', background: !filter ? 'var(--amber)' : 'var(--bg-overlay)', color: !filter ? '#0D1117' : 'var(--text-subtle)', border: 'none', borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>All</button>
        {allCuisines.map(cuisine => (
          <button key={cuisine} onClick={() => setFilter(filter === cuisine ? '' : cuisine)} style={{ flexShrink: 0, padding: '6px 12px', background: filter === cuisine ? 'var(--amber)' : 'var(--bg-overlay)', color: filter === cuisine ? '#0D1117' : 'var(--text-subtle)', border: 'none', borderRadius: 'var(--r-full)', fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>{cuisine}</button>
        ))}
      </div>

      {/* Restaurant cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 180, background: 'var(--bg-overlay)', borderRadius: 'var(--r-lg)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', paddingBottom: 'var(--sp-8)' }}>
          {filtered.map(r => (
            <Link key={r.id} href={`/customer/restaurant_detail?id=${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', transition: 'transform var(--t-fast), border-color var(--t-fast)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--amber)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                <div style={{ height: 160, background: `linear-gradient(135deg, var(--bg-overlay) 0%, #2d1f0f 100%)`, backgroundImage: r.image_url ? `url(${r.image_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.7) 0%, transparent 50%)' }} />
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 8px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>₹{r.delivery_fee || 20} delivery</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 8px' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>🕐 {r.delivery_time_min} min</span>
                  </div>
                </div>
                <div style={{ padding: 'var(--sp-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>{r.name}</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', marginBottom: 'var(--sp-2)' }}>{r.cuisine_types.join(' · ')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: 'var(--r-sm)', padding: '4px 8px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#3FB950' }}>★</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: '#3FB950', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.rating}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Min ₹{r.min_order}</span>
                    {r.address?.area && <><span style={{ color: 'var(--border)', fontSize: '0.6rem' }}>●</span><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{r.address.area}</span></>}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
                    {r.cuisine_types.slice(0, 3).map(c => <Badge key={c} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{c}</Badge>)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
