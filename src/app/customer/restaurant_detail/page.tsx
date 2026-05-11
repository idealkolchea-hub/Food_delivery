/**
 * C5 — Restaurant Detail + Menu
 * Route: /customer/restaurant_detail
 * FRD: UC-102 Browse Restaurant Menu
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { addToCart, getCart, Cart } from '@/lib/cart';
import { Button, Badge, RatingStars } from '@/components/ui';

// Mock menu data
const MOCK_MENU: Record<string, Array<{
  id: string; name: string; description: string; price: number;
  category: string; is_veg: boolean; is_bestseller: boolean; is_available: boolean;
}>> = {
  seed_1: [
    { id: 'm1', name: 'Chicken Biryani', description: 'Aromatic basmati rice with tender chicken, slow-cooked with saffron and spices', price: 299, category: 'Biryani', is_veg: false, is_bestseller: true, is_available: true },
    { id: 'm2', name: 'Mutton Rogan Josh', description: 'Kashmiri-style braised lamb in aromatic gravy', price: 349, category: 'Main Course', is_veg: false, is_bestseller: false, is_available: true },
    { id: 'm3', name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in tandoori spices', price: 249, category: 'Starters', is_veg: true, is_bestseller: true, is_available: true },
    { id: 'm4', name: 'Dal Makhani', description: 'Black lentils slow-cooked overnight with butter and cream', price: 199, category: 'Main Course', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'm5', name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', price: 49, category: 'Breads', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'm6', name: 'Tandoori Roti', description: 'Whole wheat flatbread from clay oven', price: 35, category: 'Breads', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'm7', name: 'Gulab Jamun', description: 'Deep-fried milk balls soaked in rose-cardamom syrup', price: 89, category: 'Desserts', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'm8', name: 'Masala Chai', description: 'Traditional spiced Indian tea', price: 30, category: 'Beverages', is_veg: true, is_bestseller: false, is_available: true },
  ],
  seed_2: [
    { id: 'p1', name: 'Margherita', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 249, category: 'Pizza', is_veg: true, is_bestseller: true, is_available: true },
    { id: 'p2', name: 'Pepperoni Feast', description: 'Double pepperoni with smoked cheese blend', price: 349, category: 'Pizza', is_veg: false, is_bestseller: true, is_available: true },
    { id: 'p3', name: 'BBQ Chicken', description: 'Grilled chicken, BBQ sauce, red onion, cilantro', price: 329, category: 'Pizza', is_veg: false, is_bestseller: false, is_available: true },
    { id: 'p4', name: 'Garlic Bread', description: 'Toasted with roasted garlic and herb butter', price: 129, category: 'Sides', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'p5', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, caesar dressing', price: 179, category: 'Salads', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'p6', name: 'Coca-Cola 500ml', description: 'Chilled soft drink', price: 60, category: 'Beverages', is_veg: true, is_bestseller: false, is_available: true },
  ],
  seed_3: [
    { id: 'b1', name: 'Classic Smash', description: 'Double beef patties, cheddar, special sauce, pickles, lettuce', price: 229, category: 'Burgers', is_veg: false, is_bestseller: true, is_available: true },
    { id: 'b2', name: 'Bacon BBQ', description: 'Beef patty, crispy bacon, onion rings, BBQ sauce', price: 269, category: 'Burgers', is_veg: false, is_bestseller: false, is_available: true },
    { id: 'b3', name: 'Veggie Stack', description: 'Crispy veggie patty, lettuce, tomato, mayo', price: 199, category: 'Burgers', is_veg: true, is_bestseller: true, is_available: true },
    { id: 'b4', name: 'Loaded Fries', description: 'Crispy fries with cheese sauce and jalapeños', price: 129, category: 'Sides', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'b5', name: 'Onion Rings', description: 'Beer-battered, golden fried', price: 109, category: 'Sides', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'b6', name: 'Chocolate Shake', description: 'Thick Belgian chocolate shake with whipped cream', price: 149, category: 'Beverages', is_veg: true, is_bestseller: false, is_available: true },
  ],
  seed_4: [
    { id: 's1', name: 'Salmon Nigiri (2 pcs)', description: 'Fresh Atlantic salmon over pressed rice', price: 199, category: 'Nigiri', is_veg: false, is_bestseller: true, is_available: true },
    { id: 's2', name: 'Rainbow Roll', description: 'California roll topped with assorted sashimi', price: 349, category: 'Rolls', is_veg: false, is_bestseller: true, is_available: true },
    { id: 's3', name: 'Dragon Roll', description: 'Eel, cucumber, avocado, unagi sauce', price: 389, category: 'Rolls', is_veg: false, is_bestseller: false, is_available: true },
    { id: 's4', name: 'Edamame', description: 'Steamed soybeans with sea salt', price: 99, category: 'Starters', is_veg: true, is_bestseller: false, is_available: true },
    { id: 's5', name: 'Miso Soup', description: 'Traditional white miso with tofu and wakame', price: 79, category: 'Soup', is_veg: true, is_bestseller: false, is_available: true },
    { id: 's6', name: 'Green Tea Ice Cream', description: 'Matcha-flavored Japanese ice cream', price: 129, category: 'Desserts', is_veg: true, is_bestseller: false, is_available: true },
  ],
  seed_5: [
    { id: 'bb1', name: 'Hyderabadi Chicken Biryani', description: 'Dum-cooked with caramelized onion, saffron, and whole spices', price: 279, category: 'Biryani', is_veg: false, is_bestseller: true, is_available: true },
    { id: 'bb2', name: 'Mutton Biryani', description: 'Premium mutton with aged basmati, slow-cooked to perfection', price: 349, category: 'Biryani', is_veg: false, is_bestseller: false, is_available: true },
    { id: 'bb3', name: 'Veg Biryani', description: 'Seasonal vegetables with fragrant rice and raita', price: 219, category: 'Biryani', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'bb4', name: 'Chicken 65', description: 'Spicy deep-fried chicken with curry leaves', price: 229, category: 'Starters', is_veg: false, is_bestseller: true, is_available: true },
    { id: 'bb5', name: 'Mirchi Ka Salan', description: 'Green chilies in peanut-coconut gravy', price: 169, category: 'Main Course', is_veg: true, is_bestseller: false, is_available: true },
    { id: 'bb6', name: 'Sheer Khurma', description: 'Vermicelli pudding with dry fruits and cardamom', price: 99, category: 'Desserts', is_veg: true, is_bestseller: false, is_available: true },
  ],
};

interface MenuItem {
  id: string; name: string; description: string; price: number;
  category: string; is_veg: boolean; is_bestseller: boolean; is_available: boolean;
}

interface Restaurant {
  id: string; name: string; cuisine_types: string[];
  rating: string; delivery_time_min: number; min_order: number;
  address?: { area?: string; street?: string };
  delivery_fee?: number; image_url?: string;
}

function RestaurantDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('id') || 'seed_1';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Cart | null>(null);

  useEffect(() => {
    loadData();
    const cartData = getCart();
    setCart(cartData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const loadData = async () => {
    setLoading(true);
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

    if (hasEnv) {
      try {
        const [{ data: r }, { data: m }] = await Promise.all([
          supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
          supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).eq('is_available', true).order('category'),
        ]);
        if (r) setRestaurant(r as Restaurant);
        if (m && m.length > 0) {
          setMenu(m as MenuItem[]);
          const cats = [...new Set(m.map(i => i.category))];
          setActiveCategory(cats[0] || '');
          setLoading(false);
          return;
        }
      } catch {
        // fall through
      }
    }

    // Mock fallback
    const mockRestaurants: Record<string, Restaurant> = {
      seed_1: { id: 'seed_1', name: 'Spice Garden', cuisine_types: ['North Indian', 'Biryani', 'Mughlai'], rating: '4.3', delivery_time_min: 35, min_order: 200, address: { area: 'Koregaon Park' }, delivery_fee: 20 },
      seed_2: { id: 'seed_2', name: 'The Pizza Forge', cuisine_types: ['Italian', 'Pizza', 'Pasta'], rating: '4.6', delivery_time_min: 28, min_order: 150, address: { area: 'Viman Nagar' }, delivery_fee: 15 },
      seed_3: { id: 'seed_3', name: 'Burger Brigade', cuisine_types: ['American', 'Burgers', 'Fast Food'], rating: '4.1', delivery_time_min: 22, min_order: 100, address: { area: 'Kalyani Nagar' }, delivery_fee: 15 },
      seed_4: { id: 'seed_4', name: 'Sushi Zen', cuisine_types: ['Japanese', 'Sushi', 'Asian'], rating: '4.7', delivery_time_min: 40, min_order: 300, address: { area: 'Koregaon Park' }, delivery_fee: 25 },
      seed_5: { id: 'seed_5', name: 'Biryani Boulevard', cuisine_types: ['Hyderabadi', 'Biryani', 'South Indian'], rating: '4.4', delivery_time_min: 38, min_order: 180, address: { area: 'Hadapsar' }, delivery_fee: 20 },
    };
    const r = mockRestaurants[restaurantId] || mockRestaurants['seed_1'];
    setRestaurant(r);
    const m = MOCK_MENU[restaurantId] || MOCK_MENU['seed_1'];
    setMenu(m);
    const cats = [...new Set(m.map(i => i.category))];
    setActiveCategory(cats[0] || '');
    setLoading(false);
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) return;
    addToCart(
      { menuItemId: item.id, name: item.name, price: item.price },
      restaurant.id,
      restaurant.name,
    );
    setAddedItems(prev => new Set([...prev, item.id]));
    setCart(getCart());
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 1500);
  };

  const categories = [...new Set(menu.map(i => i.category))];
  const filteredItems = activeCategory ? menu.filter(i => i.category === activeCategory) : menu;

  const cartItemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) || 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', padding: 'var(--sp-4)' }}>
        <div style={{ height: 200, background: 'var(--bg-overlay)', borderRadius: 'var(--r-lg)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 80, background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: cartItemCount > 0 ? 100 : 'var(--sp-8)' }}>
      {/* Back */}
      <div style={{ padding: 'var(--sp-3) var(--sp-4)', position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/customer/home_guest" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
            fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', textDecoration: 'none',
          }}>
            ← Back
          </Link>
          {cartItemCount > 0 && (
            <Link href="/customer/cart" style={{
              display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
              background: 'var(--amber)', color: '#0D1117',
              padding: '6px 14px', borderRadius: 'var(--r-full)',
              fontSize: 'var(--text-xs)', fontWeight: 700,
              textDecoration: 'none',
            }}>
              🛒 {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
      <div style={{
        height: 220, position: 'relative',
        backgroundImage: restaurant?.image_url ? `url(${restaurant.image_url})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: '#1a1209',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,17,23,0.95) 30%, rgba(13,17,23,0.3) 100%)',
        }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'var(--sp-4)' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
            {restaurant?.name}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: '#3FB950' }}>★</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#3FB950', fontFamily: 'var(--font-mono)' }}>
                {restaurant?.rating}
              </span>
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.6rem' }}>●</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)' }}>
              🕐 {restaurant?.delivery_time_min} min
            </span>
            <span style={{ color: 'var(--text-faint)', fontSize: '0.6rem' }}>●</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
              ₹{restaurant?.delivery_fee} delivery
            </span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {(restaurant?.cuisine_types || []).map(c => (
              <Badge key={c} style={{ fontSize: '0.65rem' }}>{c}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: 'var(--sp-4)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--sp-4)' }}>Menu</h2>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto', marginBottom: 'var(--sp-5)', paddingBottom: 'var(--sp-1)', WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: '6px 14px',
                background: activeCategory === cat ? 'var(--amber)' : 'var(--bg-overlay)',
                color: activeCategory === cat ? '#0D1117' : 'var(--text-subtle)',
                border: 'none', borderRadius: 'var(--r-full)',
                fontSize: 'var(--text-xs)', fontWeight: 600,
                fontFamily: 'var(--font-sans)', cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
                transition: 'border-color var(--t-fast)',
              }}
            >
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: '4px' }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '2px',
                    border: item.is_veg ? '1.5px solid #3FB950' : '1.5px solid #F85149',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: item.is_veg ? '#3FB950' : '#F85149',
                    }} />
                  </div>
                  {item.is_bestseller && (
                    <Badge style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                      ★ Bestseller
                    </Badge>
                  )}
                </div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '4px' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', lineHeight: 1.5, marginBottom: 'var(--sp-2)' }}>
                  {item.description}
                </p>
                <span style={{
                  fontSize: 'var(--text-sm)', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', color: 'var(--text)',
                }}>
                  ₹{item.price}
                </span>
              </div>

              {/* Add button */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {item.is_available ? (
                  addedItems.has(item.id) ? (
                    <div style={{
                      width: 72, height: 32, background: 'rgba(63,185,80,0.15)',
                      border: '1px solid rgba(63,185,80,0.3)',
                      borderRadius: 'var(--r-md)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#3FB950' }}>✓ Added</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--amber)', color: '#0D1117',
                        border: 'none', borderRadius: 'var(--r-md)',
                        fontSize: 'var(--text-xs)', fontWeight: 700,
                        fontFamily: 'var(--font-sans)', cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Add +
                    </button>
                  )
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart sticky bar */}
      {cartItemCount > 0 && (
        <Link href="/customer/cart" style={{ textDecoration: 'none' }}>
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--amber)', color: '#0D1117',
            padding: '14px var(--sp-4)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontWeight: 700, fontSize: 'var(--text-sm)',
            zIndex: 50, boxShadow: '0 -4px 20px rgba(227,179,65,0.3)',
          }}>
            <span>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
            <span>View Cart →</span>
          </div>
        </Link>
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

export default function RestaurantDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--sp-4)' }}>Loading...</div>}>
      <RestaurantDetailContent />
    </Suspense>
  );
}