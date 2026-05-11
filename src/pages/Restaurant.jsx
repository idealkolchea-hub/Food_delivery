import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Stepper } from '../components/ui/Stepper';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { supabase } from '../lib/supabase';
import { mapRestaurantRecord, slugifyRestaurantName } from '../lib/catalog';

function useRestaurantRecord() {
  const { restaurantSlug } = useParams();
  const { search } = useLocation();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams(search);
    const legacyId = params.get('id');

    async function loadRestaurant() {
      setLoading(true);
      setError('');

      let query = supabase
        .from('restaurants')
        .select('*, menu_items(*)');

      if (legacyId) {
        query = query.eq('id', legacyId);
      } else if (restaurantSlug) {
        query = query.eq('is_active', true);
      }

      const { data, error: fetchError } = await query;

      if (ignore) return;

      if (fetchError) {
        setError(fetchError.message || 'Failed to load restaurant.');
        setRestaurant(null);
        setLoading(false);
        return;
      }

      const rows = (data || []).map(mapRestaurantRecord);
      const match = legacyId
        ? rows[0] || null
        : rows.find((entry) => entry.slug === restaurantSlug || slugifyRestaurantName(entry.name) === restaurantSlug) || null;

      if (!match) {
        setRestaurant(null);
        setLoading(false);
        return;
      }

      setRestaurant(match);
      setLoading(false);
    }

    loadRestaurant();

    return () => {
      ignore = true;
    };
  }, [restaurantSlug, search]);

  return useMemo(() => ({ restaurant, loading, error }), [restaurant, loading, error]);
}

export default function Restaurant() {
  const { restaurant, loading, error } = useRestaurantRecord();
  const [activeTab, setActiveTab] = useState('menu');
  const [addedId, setAddedId] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, items, setQuantity } = useCart();
  const { loading: customerLoading, isAuthenticated, hasCustomerAccess } = useCustomerSession();
  const { pushToast } = useToast();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, 120]);
  const restaurantName = restaurant?.name || 'This kitchen';
  const reviews = useMemo(() => ([
    {
      author: 'Rhea Kapoor',
      title: 'Worth the night delivery',
      body: `${restaurantName} lands exactly how it looks: polished, hot, and a little dramatic in the best way.`,
    },
    {
      author: 'Neel Shah',
      title: 'Packaging still feels premium',
      body: `The textures hold up, the portions are generous, and the menu has a clear point of view instead of generic filler.`,
    },
    {
      author: 'Aanya Mehta',
      title: 'Would order again',
      body: `Standout flavor balance, fast handoff, and the kind of dish lineup that makes repeat orders easy.`,
    },
  ]), [restaurantName]);

  useEffect(() => {
    if (!restaurant) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [restaurant?.slug]);

  useEffect(() => {
    if (!restaurant) return;
    setActiveTab('menu');
  }, [restaurant?.slug]);

  if (loading) {
    return (
      <PageWrapper className="mx-auto max-w-[1280px]">
        <SkeletonCard className="h-[560px]" />
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} className="h-[180px]" />)}
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <GlassCard interactive={false} className="p-10 text-center">
          <h1 className="font-display text-4xl italic text-white">We couldn’t open this kitchen</h1>
          <p className="mt-4 text-[color:var(--text-secondary)]">{error}</p>
          <div className="mt-8"><Link to="/"><Button>Back to discovery</Button></Link></div>
        </GlassCard>
      </PageWrapper>
    );
  }

  if (!restaurant) {
    return (
      <PageWrapper className="mx-auto max-w-[980px]">
        <GlassCard interactive={false} className="p-10 text-center">
          <h1 className="font-display text-4xl italic text-white">Restaurant not found</h1>
          <p className="mt-4 text-[color:var(--text-secondary)]">This kitchen may have gone offline, or the link is no longer valid.</p>
          <div className="mt-8"><Link to="/"><Button>Back to discovery</Button></Link></div>
        </GlassCard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="mx-auto max-w-[1280px]">
      <motion.section variants={childVariants} className="relative -mt-10 overflow-hidden rounded-[34px]">
        <motion.img style={{ y: parallaxY }} src={restaurant.heroImage} alt={restaurant.name} className="h-[420px] w-full scale-110 object-cover md:h-[560px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,5,14,0.9)] via-[rgba(3,5,14,0.22)] to-transparent" />
        <div className="absolute left-5 right-5 bottom-5">
          <GlassCard interactive={false} className="p-6 md:max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{restaurant.cuisine}</Badge>
              <Badge>★ {restaurant.rating}</Badge>
              <Badge>{restaurant.hours}</Badge>
              <Badge>{restaurant.deliveryTime}</Badge>
            </div>
            <h1 className="mt-4 font-display text-5xl italic text-white">{restaurant.name}</h1>
            <p className="mt-3 max-w-xl text-sm text-[color:var(--text-secondary)]">{restaurant.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {restaurant.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
          </GlassCard>
        </div>
      </motion.section>

      <motion.section variants={childVariants} className="sticky top-24 z-20 mt-8">
        <GlassCard interactive={false} className="inline-flex gap-2 px-2 py-2">
          {[
            { label: 'Menu', value: 'menu' },
            { label: 'Reviews', value: 'reviews' },
            { label: 'Info', value: 'info' },
          ].map((tab) => (
            <Button key={tab.value} variant={activeTab === tab.value ? 'primary' : 'ghost'} className="px-5 py-2 text-xs" onClick={() => setActiveTab(tab.value)}>
              {tab.label}
            </Button>
          ))}
        </GlassCard>
      </motion.section>

      {activeTab === 'menu' && (
        <motion.section variants={childVariants} className="mt-10 space-y-8">
          {restaurant.menuCategories.map((category) => (
            <div key={category}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{restaurant.name}</p>
                  <h2 className="font-display text-3xl italic text-white">{category}</h2>
                </div>
              </div>
              <div className="space-y-4">
                {restaurant.menu.filter((item) => item.category === category).map((item) => {
                  const quantity = items.find((entry) => entry.id === item.id)?.quantity || 0;
                  const added = addedId === item.id;
                  return (
                    <GlassCard key={item.id} className="grid gap-4 p-4 md:grid-cols-[180px_1fr_auto] md:items-center">
                      <img src={item.image} alt={item.name} className="h-40 w-full rounded-[22px] object-cover md:h-32" />
                      <div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {(item.dietary || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                          {item.isAvailable === false && <Badge>Unavailable</Badge>}
                        </div>
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                            <p className="mt-2 line-clamp-2 text-sm text-[color:var(--text-secondary)]">{item.description}</p>
                          </div>
                          <div className="text-xl font-bold tabular-nums text-white">${item.price}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        {item.isAvailable === false ? (
                          <div className="rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-[color:var(--text-secondary)]">Unavailable</div>
                        ) : quantity > 0 ? (
                          <Stepper value={quantity} onChange={(next) => setQuantity(item.id, Math.max(0, next))} />
                        ) : (
                          <motion.button
                            layout
                            whileHover={{ scale: 1.03, boxShadow: '0 0 24px var(--accent-glow)' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            disabled={addingId === item.id}
                            onClick={async () => {
                              if (customerLoading) {
                                return;
                              }

                              if (!isAuthenticated || !hasCustomerAccess) {
                                pushToast({
                                  type: 'info',
                                  title: 'Sign in to start your cart',
                                  description: 'Browse freely, then sign in when you are ready to add dishes and check out.',
                                });
                                navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
                                return;
                              }

                              setAddingId(item.id);
                              const added = await addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                restaurantName: restaurant.name,
                                restaurantSlug: restaurant.slug,
                                restaurantId: restaurant.id,
                              });
                              if (added) {
                                setAddedId(item.id);
                                window.setTimeout(() => setAddedId((current) => (current === item.id ? null : current)), 1500);
                              }
                              setAddingId((current) => (current === item.id ? null : current));
                            }}
                            className={`inline-flex h-12 min-w-[142px] items-center justify-center rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${added ? 'bg-emerald-400 text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.38)]' : 'bg-coral-gradient text-white'}`}
                          >
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={addingId === item.id ? 'loading' : added ? 'done' : 'idle'}
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.94 }}
                              >
                                {addingId === item.id ? 'Adding...' : added ? '✓ Added' : '+ Add to cart'}
                              </motion.span>
                            </AnimatePresence>
                          </motion.button>
                        )}
                        <Link to="/cart" className="text-sm text-[color:var(--text-secondary)] hover:text-white">Go to cart →</Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.section>
      )}

      {activeTab === 'reviews' && (
        <motion.section variants={childVariants} className="mt-10 grid gap-6 lg:grid-cols-3">
          {reviews.map((review) => (
            <GlassCard key={review.author} className="p-6" interactive={false}>
              <Badge className="mb-4">★ Verified order</Badge>
              <h2 className="font-display text-3xl italic text-white">{review.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">{review.body}</p>
              <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{review.author}</div>
            </GlassCard>
          ))}
        </motion.section>
      )}

      {activeTab === 'info' && (
        <motion.section variants={childVariants} className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard interactive={false} className="p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">About the kitchen</p>
            <h2 className="font-display text-4xl italic text-white">A sharper way to order in</h2>
            <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">{restaurant.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {restaurant.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
          </GlassCard>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <GlassCard interactive={false} className="p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Service details</div>
              <div className="mt-4 space-y-4 text-sm text-[color:var(--text-secondary)]">
                <div className="flex justify-between gap-4"><span>Hours</span><span className="text-right text-white">{restaurant.hours}</span></div>
                <div className="flex justify-between gap-4"><span>Delivery time</span><span className="text-right text-white">{restaurant.deliveryTime}</span></div>
                <div className="flex justify-between gap-4"><span>Delivery fee</span><span className="text-right text-white">${restaurant.deliveryFee.toFixed(2)}</span></div>
                <div className="flex justify-between gap-4"><span>Price range</span><span className="text-right text-white">{restaurant.priceRange}</span></div>
                <div className="flex justify-between gap-4"><span>Location</span><span className="text-right text-white">{restaurant.location}</span></div>
              </div>
            </GlassCard>
            <GlassCard interactive={false} className="p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Best for</div>
              <div className="mt-4 space-y-3 text-sm text-[color:var(--text-secondary)]">
                <p>Comfort orders that still feel premium.</p>
                <p>Fast repeat dinners with a clear signature menu.</p>
                <p>Sharing plates and one standout main for the table.</p>
              </div>
            </GlassCard>
          </div>
        </motion.section>
      )}
    </PageWrapper>
  );
}
