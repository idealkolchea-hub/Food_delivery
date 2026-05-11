import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { categories, restaurants as restaurantSeed } from '../data/mockData';
import { getCategoryImage, getHomepageDishImage, getImagePoolForDish } from '../data/foodImageManifest';
import { useCart } from '../hooks/useCart';
import { useCustomerSession } from '../hooks/useCustomerSession';
import { useRestaurants } from '../hooks/useRestaurants';
import { Badge } from '../components/ui/Badge';
import { Pill } from '../components/ui/Pill';
import { GlassCard } from '../components/ui/GlassCard';
import { PageWrapper, childVariants } from '../components/layout/PageWrapper';
import { SkeletonCard } from '../components/ui/SkeletonCard';

const burgerCutout = '/design-references/homepage-final/assets/burger-cutout.png';
const featuredRestaurantVisual = '/design-references/homepage-final/assets/left restraurant card.png';
const biryaniRestaurantVisual = '/design-references/homepage-final/assets/Biryani house.jpg';

function getRestaurantVisual(restaurant, { featured = false } = {}) {
  if (featured) {
    return featuredRestaurantVisual;
  }

  const slug = `${restaurant.slug || ''}`.toLowerCase();
  const name = `${restaurant.name || ''}`.toLowerCase();
  if (slug.includes('biryani') || name.includes('biryani')) {
    return biryaniRestaurantVisual;
  }

  return restaurant.thumbImage
    || restaurant.heroImage
    || getCategoryImage([restaurant.cuisine, restaurant.category, ...(restaurant.tags || [])]);
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function HomeRestaurantCard({ restaurant, featured = false }) {
  const visualImage = getRestaurantVisual(restaurant, { featured });

  return (
    <Link to={`/restaurant/${restaurant.slug}`} className="block h-full">
      <GlassCard className={`group relative h-full overflow-hidden border-white/10 ${featured ? 'min-h-[780px]' : 'min-h-[372px]'}`}>
        <div className="absolute inset-0">
          <img
            src={visualImage}
            alt={restaurant.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,8,13,0.98)] via-[rgba(7,8,13,0.62)] to-[rgba(7,8,13,0.08)]" />
        </div>

        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          {restaurant.cuisine ? (
            <Badge className="normal-case tracking-[0.02em]">{restaurant.cuisine}</Badge>
          ) : null}
          {restaurant.deliveryTime ? (
            <Badge className="bb-mono bb-tabular">{restaurant.deliveryTime}</Badge>
          ) : null}
        </div>

        {restaurant.rating ? (
          <div className="absolute right-4 top-4 z-10 rounded-[10px] border border-white/16 bg-[rgba(20,22,29,0.68)] px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xl">
            ★ {restaurant.rating}
          </div>
        ) : null}

        <div className={`absolute inset-x-0 bottom-0 z-10 ${featured ? 'p-5 sm:p-6' : 'p-5'}`}>
          <div className={featured ? 'space-y-4' : 'space-y-3'}>
            <div>
              <h3 className={`font-display font-bold tracking-[-0.04em] text-white ${featured ? 'text-4xl sm:text-[2.55rem]' : 'text-[1.9rem]'}`}>
                {restaurant.name}
              </h3>
              <p className="mt-1.5 text-sm text-[color:var(--text-secondary)]">
                {restaurant.location}
              </p>
            </div>

            {!featured && restaurant.description ? (
              <p className="max-w-[34ch] line-clamp-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                {restaurant.description}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {!featured
                  ? restaurant.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} className="normal-case tracking-[0.02em]">
                        {tag}
                      </Badge>
                    ))
                  : null}
                {featured && restaurant.deliveryTime ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72">
                    {restaurant.deliveryTime}
                  </span>
                ) : null}
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.14)] px-4 py-2 text-sm font-semibold text-white">
                View menu
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

function HomeDishCard({ dish }) {
  const image = getImagePoolForDish(dish, dish.restaurant) || getHomepageDishImage(dish, dish.restaurant);
  const isVeg = Array.isArray(dish.dietary) && dish.dietary.includes('V');

  return (
    <Link to={`/restaurant/${dish.restaurantSlug}`} className="block h-full">
      <GlassCard className="group h-full overflow-hidden border-white/10">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={dish.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,8,13,0.86)] via-[rgba(7,8,13,0.26)] to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {dish.category ? (
              <Badge className="normal-case tracking-[0.02em]">{dish.category}</Badge>
            ) : null}
            {isVeg ? (
              <Badge className="normal-case tracking-[0.02em]">Veg</Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h3 className="font-display text-[1.7rem] font-bold tracking-[-0.04em] text-white">
              {dish.name}
            </h3>
            <p className="mt-1.5 text-sm text-[color:var(--text-secondary)]">
              {dish.restaurantName}
            </p>
          </div>

          {dish.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {dish.description}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-white">
              {typeof dish.price !== 'undefined' && dish.price !== null ? formatPrice(dish.price) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.14)] px-4 py-2 text-sm font-semibold text-white">
              View menu
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { addresses } = useCustomerSession();
  const { itemCount } = useCart();
  const { restaurants, loading, error } = useRestaurants(activeCategory, '');

  const activeArea = addresses.find((address) => address.is_default)?.area || addresses[0]?.area || 'Pune';
  const normalizedSearch = search.trim().toLowerCase();
  const sourceRestaurants = restaurants.length ? restaurants : restaurantSeed;

  const discoveryRestaurants = useMemo(() => (
    sourceRestaurants.filter((restaurant) => (
      activeCategory === 'all' || restaurant.category === activeCategory
    ))
  ), [sourceRestaurants, activeCategory]);

  const featuredRestaurant = discoveryRestaurants[0] || null;
  const secondaryRestaurants = discoveryRestaurants.slice(1, 3);

  const allDishes = useMemo(() => (
    discoveryRestaurants.flatMap((restaurant) => (
      (restaurant.menu || [])
        .filter((dish) => dish.isAvailable !== false)
        .map((dish) => ({
          ...dish,
          restaurant,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug,
          restaurantCuisine: restaurant.cuisine,
        }))
    ))
  ), [discoveryRestaurants]);

  const popularDishes = useMemo(() => allDishes.slice(0, 4), [allDishes]);

  const matchingDishes = useMemo(() => {
    if (!normalizedSearch) return [];

    return allDishes.filter((dish) => {
      const haystack = [
        dish.name,
        dish.category,
        dish.description,
        dish.restaurantName,
        dish.restaurantCuisine,
        ...(dish.dietary || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [allDishes, normalizedSearch]);

  const matchingRestaurants = useMemo(() => {
    if (!normalizedSearch) return [];

    return discoveryRestaurants.filter((restaurant) => {
      const haystack = [
        restaurant.name,
        restaurant.cuisine,
        restaurant.category,
        restaurant.description,
        ...(restaurant.tags || []),
        ...(restaurant.menu || []).flatMap((dish) => [
          dish.name,
          dish.category,
          dish.description,
          ...(dish.dietary || []),
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [discoveryRestaurants, normalizedSearch]);

  const hasSearch = normalizedSearch.length > 0;
  const showNoSearchEmptyState = !hasSearch && discoveryRestaurants.length === 0;
  const showSearchEmptyState = hasSearch && matchingDishes.length === 0 && matchingRestaurants.length === 0;
  return (
    <PageWrapper className="mx-auto max-w-[1320px]">
      <motion.section variants={childVariants} className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-4">
        <div className="space-y-6">
          <Badge>Delivering in {activeArea}</Badge>

          <div className="max-w-none">
            <h1 className="font-display text-[clamp(3.1rem,6.4vw,6rem)] font-extrabold leading-[0.9] tracking-[-0.055em] text-white">
              <span className="block whitespace-nowrap">Hits Diff.</span>
              <span className="block whitespace-nowrap">Every Time.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[color:var(--text-secondary)]">
              Browse kitchens near you and order in a few taps.
            </p>
          </div>
        </div>

        <motion.div variants={childVariants} className="relative min-h-[320px] lg:min-h-[390px]">
          <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={burgerCutout}
                alt="BiteBlast signature burger"
                className="max-h-[360px] w-auto max-w-[92%] object-contain lg:max-h-[410px]"
                style={{
                  filter: 'drop-shadow(0 26px 34px rgba(0,0,0,0.44)) drop-shadow(0 10px 14px rgba(0,0,0,0.22))',
                  transform: 'translateY(6px) scale(1.02)',
                }}
              />
          </div>
        </motion.div>
      </motion.section>

      <motion.section variants={childVariants} className="mt-8">
        <GlassCard interactive={false} className="rounded-[28px] p-5 sm:p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Search</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search restaurants or dishes"
            className="bb-input h-12 rounded-[16px] text-sm"
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Pill key={category.id} active={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>
                <span>{category.emoji}</span>
                <span>{category.label}</span>
              </Pill>
            ))}
          </div>
        </GlassCard>
      </motion.section>

      <motion.section variants={childVariants} className="mt-12 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
              {hasSearch ? 'Matching kitchens' : 'Popular kitchens'}
            </p>
            <h2 className="font-display text-[clamp(2.6rem,5vw,4.7rem)] font-bold tracking-[-0.05em] text-white">
              {hasSearch ? 'Restaurants for your search.' : 'Find your next order.'}
            </h2>
          </div>
          {itemCount > 0 ? (
            <Link to="/cart" className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-white">
              Open cart →
            </Link>
          ) : null}
        </div>

        {error ? (
          <GlassCard interactive={false} className="p-8 text-center">
            <h3 className="font-display text-3xl font-bold tracking-[-0.04em] text-white">We couldn’t load restaurants</h3>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{error}</p>
          </GlassCard>
        ) : loading ? (
          <>
            {hasSearch ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <SkeletonCard className="h-[360px]" />
                <SkeletonCard className="h-[360px]" />
                <SkeletonCard className="h-[360px]" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <SkeletonCard className="h-[720px]" />
                <div className="grid gap-6">
                  <SkeletonCard className="h-[348px]" />
                  <SkeletonCard className="h-[348px]" />
                </div>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <SkeletonCard className="h-[360px]" />
              <SkeletonCard className="h-[360px]" />
              <SkeletonCard className="h-[360px]" />
              <SkeletonCard className="h-[360px]" />
            </div>
          </>
        ) : showNoSearchEmptyState ? (
          <GlassCard interactive={false} className="p-8 text-center">
            <h3 className="font-display text-3xl font-bold tracking-[-0.04em] text-white">No restaurants match your filters</h3>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">Try changing your category or searching for something else.</p>
          </GlassCard>
        ) : showSearchEmptyState ? (
          <GlassCard interactive={false} className="p-8 text-center">
            <h3 className="font-display text-3xl font-bold tracking-[-0.04em] text-white">No dishes or restaurants matched</h3>
            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">Try a different dish, cuisine, or restaurant name.</p>
          </GlassCard>
        ) : (
          <div className="space-y-10">
            {hasSearch && matchingDishes.length > 0 ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Matching dishes</p>
                  <h3 className="font-display text-[clamp(2rem,3.6vw,3.2rem)] font-bold tracking-[-0.05em] text-white">
                    Dishes for “{search.trim()}”.
                  </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {matchingDishes.slice(0, 8).map((dish) => (
                    <HomeDishCard key={`${dish.restaurantId}-${dish.id}`} dish={dish} />
                  ))}
                </div>
              </div>
            ) : null}

            {hasSearch ? (
              matchingRestaurants.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {matchingRestaurants.map((restaurant) => (
                    <HomeRestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              ) : null
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                <div>
                  {featuredRestaurant ? (
                    <HomeRestaurantCard restaurant={featuredRestaurant} featured />
                  ) : null}
                </div>
                <div className="grid gap-6">
                  {secondaryRestaurants.map((restaurant) => (
                    <HomeRestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              </div>
            )}

            {!hasSearch && popularDishes.length > 0 ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Popular dishes</p>
                  <h3 className="font-display text-[clamp(2rem,3.6vw,3.2rem)] font-bold tracking-[-0.05em] text-white">
                    Start with something delicious.
                  </h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {popularDishes.map((dish) => (
                    <HomeDishCard key={`${dish.restaurantId}-${dish.id}`} dish={dish} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </motion.section>
    </PageWrapper>
  );
}
