export const categoryImages = {
  pizza: '/food/categories/pizza.jpg',
  burger: '/food/categories/burger.jpg',
  biryani: '/food/categories/biryani.jpg',
  sushi: '/food/categories/sushi.jpg',
  pasta: '/food/categories/pasta.jpg',
  noodles: '/food/categories/noodles.jpg',
  ramen: '/food/categories/ramen.jpg',
  salad: '/food/categories/salad.jpg',
  sandwich: '/food/categories/sandwich.jpg',
  curry: '/food/categories/curry.jpg',
  thali: '/food/categories/thali.jpg',
  dosa: '/food/categories/dosa.jpg',
  momos: '/food/categories/momos.jpg',
  'fried-rice': '/food/categories/fried-rice.jpg',
  dessert: '/food/categories/dessert.jpg',
  'ice-cream': '/food/categories/ice-cream.jpg',
  coffee: '/food/categories/coffee.jpg',
  drinks: '/food/categories/drinks.jpg',
  chicken: '/food/categories/chicken.jpg',
  paneer: '/food/categories/paneer.jpg',
};

export const categoryImagePools = {
  pizza: Array.from({ length: 4 }, (_, index) => `/food/category-pools/pizza/pizza-${index + 1}.jpg`),
  burger: Array.from({ length: 4 }, (_, index) => `/food/category-pools/burger/burger-${index + 1}.jpg`),
  biryani: Array.from({ length: 4 }, (_, index) => `/food/category-pools/biryani/biryani-${index + 1}.jpg`),
  sushi: Array.from({ length: 6 }, (_, index) => `/food/category-pools/sushi/sushi-${index + 1}.jpg`),
  pasta: Array.from({ length: 4 }, (_, index) => `/food/category-pools/pasta/pasta-${index + 1}.jpg`),
  noodles: Array.from({ length: 4 }, (_, index) => `/food/category-pools/noodles/noodles-${index + 1}.jpg`),
  ramen: Array.from({ length: 4 }, (_, index) => `/food/category-pools/ramen/ramen-${index + 1}.jpg`),
  salad: Array.from({ length: 4 }, (_, index) => `/food/category-pools/salad/salad-${index + 1}.jpg`),
  sandwich: Array.from({ length: 4 }, (_, index) => `/food/category-pools/sandwich/sandwich-${index + 1}.jpg`),
  curry: Array.from({ length: 4 }, (_, index) => `/food/category-pools/curry/curry-${index + 1}.jpg`),
  dessert: Array.from({ length: 4 }, (_, index) => `/food/category-pools/dessert/dessert-${index + 1}.jpg`),
  drinks: Array.from({ length: 4 }, (_, index) => `/food/category-pools/drinks/drinks-${index + 1}.jpg`),
  starters: Array.from({ length: 4 }, (_, index) => `/food/category-pools/starters/starters-${index + 1}.jpg`),
  default: Array.from({ length: 4 }, (_, index) => `/food/category-pools/default/default-${index + 1}.jpg`),
};

const DEFAULT_FOOD_IMAGE = '/food/fallbacks/default-food.jpg';

const categoryMatchers = [
  { key: 'starters', matchers: ['starter', 'starters', 'appetizer', 'appetizers', 'side', 'sides', 'edamame', 'fries', 'dip', 'bao', 'crispy rice'] },
  { key: 'pizza', matchers: ['pizza', 'margherita', 'pepperoni', 'wood fired'] },
  { key: 'burger', matchers: ['burger', 'cheeseburger', 'smashburger', 'hamburger'] },
  { key: 'biryani', matchers: ['biryani', 'hyderabadi', 'pulao', 'pilaf'] },
  { key: 'sushi', matchers: ['sushi', 'nigiri', 'maki', 'omakase', 'japanese'] },
  { key: 'pasta', matchers: ['pasta', 'spaghetti', 'fettuccine', 'penne', 'italian'] },
  { key: 'noodles', matchers: ['noodles', 'hakka', 'chow mein', 'chinese noodles'] },
  { key: 'ramen', matchers: ['ramen', 'tonkotsu', 'miso ramen'] },
  { key: 'salad', matchers: ['salad', 'healthy', 'caesar', 'greens'] },
  { key: 'sandwich', matchers: ['sandwich', 'sub', 'toastie', 'panini', 'wrap'] },
  { key: 'curry', matchers: ['curry', 'north indian', 'gravy', 'masala'] },
  { key: 'thali', matchers: ['thali'] },
  { key: 'dosa', matchers: ['dosa', 'south indian', 'masala dosa'] },
  { key: 'momos', matchers: ['momos', 'dumplings', 'dumpling'] },
  { key: 'fried-rice', matchers: ['fried rice', 'rice bowl'] },
  { key: 'dessert', matchers: ['dessert', 'cake', 'sweet', 'pastry', 'baklava', 'tiramisu'] },
  { key: 'ice-cream', matchers: ['ice cream', 'gelato', 'soft serve'] },
  { key: 'coffee', matchers: ['coffee', 'latte', 'espresso', 'cappuccino'] },
  { key: 'drinks', matchers: ['drinks', 'drink', 'beverage', 'juice', 'soda', 'shake', 'smoothie'] },
  { key: 'chicken', matchers: ['chicken', 'grilled chicken', 'fried chicken'] },
  { key: 'paneer', matchers: ['paneer', 'paneer tikka'] },
];

function tokenize(value) {
  return `${value || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeFoodCategory(category) {
  const normalized = Array.isArray(category)
    ? category.map(tokenize).join(' ')
    : tokenize(category);

  if (!normalized) return null;

  const match = categoryMatchers.find(({ matchers }) => (
    matchers.some((matcher) => normalized.includes(tokenize(matcher)))
  ));

  return match?.key || null;
}

export function getCategoryImage(category) {
  const normalized = normalizeFoodCategory(category);
  return normalized ? categoryImages[normalized] || null : null;
}

export function getStableImageIndex(seed, poolLength) {
  const normalized = tokenize(seed || 'default');
  if (!poolLength || poolLength <= 0) return 0;

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % poolLength;
}

export function getPooledCategoryImage(categoryKey, seed) {
  const pool = categoryImagePools[categoryKey];
  if (!pool?.length) return null;
  return pool[getStableImageIndex(seed, pool.length)] || null;
}

export function getDishImage(dish, restaurant) {
  if (dish?.image) return dish.image;
  if (dish?.imageUrl) return dish.imageUrl;

  const imageKeyMatch = dish?.imageKey ? getCategoryImage(dish.imageKey) : null;
  if (imageKeyMatch) return imageKeyMatch;

  const categoryImage = getCategoryImage([
    dish?.category,
    dish?.name,
    dish?.description,
    restaurant?.cuisine,
    restaurant?.category,
    ...(restaurant?.tags || []),
  ]);

  if (categoryImage) return categoryImage;

  if (restaurant?.thumbImage) return restaurant.thumbImage;
  if (restaurant?.heroImage) return restaurant.heroImage;

  return DEFAULT_FOOD_IMAGE;
}

function normalizeImageUrl(value) {
  return `${value || ''}`.split('?')[0].trim();
}

function isSameImage(a, b) {
  const left = normalizeImageUrl(a);
  const right = normalizeImageUrl(b);
  return Boolean(left && right && left === right);
}

function isClearlySpecificDishImage(candidate, restaurant) {
  if (!candidate) return false;

  if (isSameImage(candidate, restaurant?.thumbImage) || isSameImage(candidate, restaurant?.heroImage)) {
    return false;
  }

  const normalized = normalizeImageUrl(candidate);
  if (!normalized) return false;

  if (normalized.includes('photo-1517248135467-4c7edcad34c4')) {
    return false;
  }

  return true;
}

export function getHomepageDishImage(dish, restaurant) {
  const explicitDishImage = dish?.image || dish?.imageUrl || '';
  if (isClearlySpecificDishImage(explicitDishImage, restaurant)) {
    return explicitDishImage;
  }

  const pooledImage = getImagePoolForDish(dish, restaurant);
  if (pooledImage) return pooledImage;

  const imageKeyMatch = dish?.imageKey ? getCategoryImage(dish.imageKey) : null;
  if (imageKeyMatch) return imageKeyMatch;

  const categoryImage = getCategoryImage([
    dish?.category,
    dish?.name,
    ...(dish?.tags || []),
    ...(dish?.dietary || []),
    restaurant?.cuisine,
    restaurant?.category,
    ...(restaurant?.tags || []),
  ]);
  if (categoryImage) return categoryImage;

  if (restaurant?.thumbImage) return restaurant.thumbImage;
  if (restaurant?.heroImage) return restaurant.heroImage;

  return DEFAULT_FOOD_IMAGE;
}

export function getImagePoolForDish(dish, restaurant) {
  const categoryKey = normalizeFoodCategory([
    dish?.category,
    dish?.name,
    ...(dish?.tags || []),
    ...(dish?.dietary || []),
    restaurant?.cuisine,
    restaurant?.category,
    ...(restaurant?.tags || []),
  ]);

  const seed = `${dish?.name || ''}::${restaurant?.name || ''}`;
  if (categoryKey) {
    const pooled = getPooledCategoryImage(categoryKey, seed);
    if (pooled) return pooled;
  }

  return getPooledCategoryImage('default', seed);
}

export { DEFAULT_FOOD_IMAGE };
