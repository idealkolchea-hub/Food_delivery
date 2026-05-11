const categoryFallbacks = [
  { key: 'pizza', matchers: ['pizza', 'italian'] },
  { key: 'sushi', matchers: ['sushi', 'japanese'] },
  { key: 'tacos', matchers: ['taco', 'mexican'] },
  { key: 'burgers', matchers: ['burger', 'american'] },
  { key: 'salads', matchers: ['salad', 'healthy', 'vegetarian'] },
  { key: 'ramen', matchers: ['ramen', 'asian', 'biryani', 'mughlai', 'indian'] },
];

export function slugifyRestaurantName(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inferCategory(cuisineTypes = []) {
  const normalized = cuisineTypes.map((item) => item.toLowerCase());
  const match = categoryFallbacks.find(({ matchers }) => (
    matchers.some((matcher) => normalized.some((value) => value.includes(matcher)))
  ));

  return match?.key || 'all';
}

function inferPriceRange(minOrder = 0) {
  if (minOrder >= 250) return '$$$';
  if (minOrder >= 150) return '$$';
  return '$';
}

function inferDietary(item) {
  const dietary = [];
  if (item.is_veg) dietary.push('V');
  return dietary;
}

export function mapRestaurantRecord(record) {
  const cuisineTypes = record.cuisine_types || [];
  const location = record.address?.area || record.address?.city || 'Delivery area';
  const image = record.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop';
  const menu = (record.menu_items || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || 'Chef-prepared for fast delivery.',
    price: Number(item.price),
    image: item.image_url || image,
    category: item.category || 'Featured',
    dietary: inferDietary(item),
    spicy: false,
    glutenFree: false,
    isAvailable: item.is_available !== false,
  }));

  return {
    id: record.id,
    slug: slugifyRestaurantName(record.name),
    name: record.name,
    cuisine: cuisineTypes[0] || 'Restaurant',
    category: inferCategory(cuisineTypes),
    rating: Number(record.rating || 4).toFixed(1),
    deliveryTime: `${record.delivery_time_min || 35} min`,
    priceRange: inferPriceRange(Number(record.min_order || 0)),
    heroImage: image,
    thumbImage: image,
    location,
    tags: cuisineTypes.slice(0, 3),
    hours: 'Open today',
    description: cuisineTypes.length
      ? `${cuisineTypes.join(', ')} crafted for delivery with a tighter, faster menu.`
      : 'Curated dishes built for dependable delivery.',
    deliveryFee: Number(record.delivery_fee || 0),
    minOrder: Number(record.min_order || 0),
    menuCategories: [...new Set(menu.map((item) => item.category))],
    menu,
    isActive: record.is_active !== false,
  };
}
