/**
 * C1 — Home (Guest) — Browse Restaurants
 * Route: /customer/home_guest
 * FRD: UC-101 Customer OTP Login
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isLoggedIn } from '@/lib/auth';
import { Badge } from '@/components/ui';

// Seed data for when Supabase isn't configured yet
const MOCK_RESTAURANTS = [
  {
    id: 'seed_1',
    name: 'Spice Garden',
    cuisine_types: ['North Indian', 'Biryani', 'Mughlai'],
    rating: '4.3',
    delivery_time_min: 35,
    min_order: 200,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=300&fit=crop',
    address: { area: 'Koregaon Park' },
    delivery_fee: 20,
  },
  {
    id: 'seed_2',
    name: 'The Pizza Forge',
    cuisine_types: ['Italian', 'Pizza', 'Pasta'],
    rating: '4.6',
    delivery_time_min: 28,
    min_order: 150,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28d10f96910?w=600&h=300&fit=crop',
    address: { area: 'Viman Nagar' },
    delivery_fee: 15,
  },
  {
    id: 'seed_3',
    name: 'Burger Brigade',
    cuisine_types: ['American', 'Burgers', 'Fast Food'],
    rating: '4.1',
    delivery_time_min: 22,
    min_order: 100,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=300&fit=crop',
    address: { area: 'Kalyani Nagar' },
    delivery_fee: 15,
  },
  {
    id: 'seed_4',
    name: 'Sushi Zen',
    cuisine_types: ['Japanese', 'Sushi', 'Asian'],
    rating: '4.7',
    delivery_time_min: 40,
    min_order: 300,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce73f870f1?w=600&h=300&fit=crop',
    address: { area: 'Koregaon Park' },
    delivery_fee: 25,
  },
  {
    id: 'seed_5',
    name: 'Biryani Boulevard',
    cuisine_types: ['Hyderabadi', 'Biryani', 'South Indian'],
    rating: '4.4',
    delivery_time_min: 38,
    min_order: 180,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=300&fit=crop',
    address: { area: 'Hadapsar' },
    delivery_fee: 20,
  },
];

interface Restaurant {
  id: string;
  name: string;
  cuisine_types: string[];
  rating: string;
  delivery_time_min: number;
  min_order: number;
  is_active: boolean;
  image_url?: string;
  address?: { area?: string };
  delivery_fee?: number;
}

export default function HomeGuestPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Redirect logged-in users
    if (isLoggedIn()) {
      router.replace('/customer/home_logged');
      return;
    }
    loadRestaurants();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRestaurants = async () => {
    setLoading(true);
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

    if (hasEnv) {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false });
        if (!error && data && data.length > 0) {
          setRestaurants(data as Restaurant[]);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to mock
      }
    }

    // Fallback: use mock data
    setRestaurants(MOCK_RESTAURANTS);
    setLoading(false);
  };

  const filtered = restaurants.filter(r => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine_types.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = !filter || r.cuisine_types.includes(filter);
    return matchSearch && matchFilter;
  });

  const allCuisines = [...new Set(restaurants.flatMap(r => r.cuisine_types))].sort();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-4)', paddingTop: 'var(--sp-4)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'var(--sp-5)',
      }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '2px' }}>
            What are you craving?
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
            5 restaurants in Pune
          </p>
        </div>
        <Link href="/customer/auth_login" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
          background: 'var(--amber)', color: '#0D1117',
          padding: '8px 14px', borderRadius: 'var(--r-md)',
          fontSize: 'var(--text-xs)', fontWeight: 600,
          textDecoration: 'none',
        }}>
          Sign In
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '10px 14px',
        }}>
          <span style={{ color: 'var(--text-subtle)', fontSize: '1rem' }}>🔍</span>
          <input
            type="text" placeholder="Search restaurants or cuisines"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 'var(--text-sm)', color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Cuisine filter */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', marginBottom: 'var(--sp-5)', paddingBottom: 'var(--sp-1)', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setFilter('')}
          style={{
            flexShrink: 0, padding: '6px 12px',
            background: !filter ? 'var(--amber)' : 'var(--bg-overlay)',
            color: !filter ? '#0D1117' : 'var(--text-subtle)',
            border: 'none', borderRadius: 'var(--r-full)',
            fontSize: 'var(--text-xs)', fontWeight: 600,
            fontFamily: 'var(--font-sans)', cursor: 'pointer',
          }}
        >
          All
        </button>
        {allCuisines.map(cuisine => (
          <button
            key={cuisine}
            onClick={() => setFilter(filter === cuisine ? '' : cuisine)}
            style={{
              flexShrink: 0, padding: '6px 12px',
              background: filter === cuisine ? 'var(--amber)' : 'var(--bg-overlay)',
              color: filter === cuisine ? '#0D1117' : 'var(--text-subtle)',
              border: 'none', borderRadius: 'var(--r-full)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {/* Restaurant cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
              height: 180, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-8) 0', color: 'var(--text-subtle)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 'var(--sp-3)' }}>🍽️</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>No restaurants match your search</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', paddingBottom: 'var(--sp-8)' }}>
          {filtered.map(r => (
            <Link
              key={r.id}
              href={`/customer/restaurant_detail?id=${r.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
                transition: 'transform var(--t-fast), border-color var(--t-fast)',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--amber)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                }}
              >
                {/* Image */}
                <div style={{
                  height: 160, background: `linear-gradient(135deg, var(--bg-overlay) 0%, #2d1f0f 100%)`,
                  backgroundImage: r.image_url ? `url(${r.image_url})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  position: 'relative',
                }}>
                  {r.image_url && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(13,17,23,0.7) 0%, transparent 50%)',
                    }} />
                  )}
                  {/* Delivery fee badge */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(8px)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                    padding: '4px 8px',
                  }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                      ₹{r.delivery_fee || 20} delivery
                    </span>
                  </div>
                  {/* Time badge */}
                  <div style={{
                    position: 'absolute', bottom: 12, left: 12,
                    background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(8px)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                    padding: '4px 8px',
                  }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      🕐 {r.delivery_time_min} min
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: 'var(--sp-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>
                        {r.name}
                      </h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', marginBottom: 'var(--sp-2)' }}>
                        {r.cuisine_types.join(' · ')}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: 'rgba(63,185,80,0.15)', border: '1px solid rgba(63,185,80,0.3)',
                      borderRadius: 'var(--r-sm)', padding: '4px 8px',
                    }}>
                      <span style={{ fontSize: '0.7rem', color: '#3FB950' }}>★</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: '#3FB950', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {r.rating}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      Min ₹{r.min_order}
                    </span>
                    {r.address?.area && (
                      <>
                        <span style={{ color: 'var(--border)', fontSize: '0.6rem' }}>●</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
                          {r.address.area}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Cuisine tags */}
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
                    {r.cuisine_types.slice(0, 3).map(c => (
                      <Badge key={c} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}