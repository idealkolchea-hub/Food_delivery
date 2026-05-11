import { supabase } from './supabase';

/**
 * @typedef {'restaurant_owner' | 'restaurant_staff'} RestaurantAccessRole
 */

/**
 * @typedef {Object} RestaurantMembership
 * @property {string} id
 * @property {string} restaurantId
 * @property {string} profileId
 * @property {RestaurantAccessRole} role
 * @property {boolean} active
 * @property {{
 *   id: string,
 *   name: string,
 *   ownerName: string,
 *   phone: string,
 *   rating: number,
 *   imageUrl: string,
 *   cuisineTypes: string[],
 *   deliveryTimeMin: number,
 *   minOrder: number,
 *   address: Record<string, string>,
 *   addressLine: string,
 * }} restaurant
 */

/**
 * @typedef {Object} RestaurantSession
 * @property {boolean} loading
 * @property {boolean} accessLoading
 * @property {boolean} restaurantLoading
 * @property {RestaurantMembership | null} membership
 * @property {RestaurantMembership['restaurant'] | null} restaurant
 * @property {Array<Record<string, any>>} restaurants
 * @property {string} error
 * @property {boolean} hasRestaurantRole
 * @property {boolean} hasRestaurantAccess
 * @property {string} role
 */

/**
 * @typedef {Object} RestaurantQueueOrder
 * @property {string} id
 * @property {string} restaurantId
 * @property {string} restaurantName
 * @property {string} status
 * @property {string} statusLabel
 * @property {'incoming' | 'active' | 'ready' | 'completed'} bucket
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} elapsedMinutes
 * @property {number} itemCount
 * @property {Array<{
 *   id: string,
 *   name: string,
 *   quantity: number,
 *   unitPrice: number,
 *   lineTotal: number,
 *   image: string,
 *   specialInstructions: string,
 * }>} items
 * @property {number} subtotal
 * @property {number} total
 * @property {string} totalLabel
 * @property {string} paymentMethod
 * @property {string} paymentStatus
 * @property {string} customerName
 * @property {string} customerPhone
 * @property {string} destination
 * @property {string} addressInstructions
 * @property {boolean} canAccept
 * @property {boolean} canReject
 * @property {boolean} canMarkPreparing
 * @property {boolean} canMarkReady
 * @property {Array<{
 *   status: string,
 *   title: string,
 *   detail: string,
 *   created_at: string,
 *   source: string,
 *   reason_code: string | null,
 *   created_by_role: string | null,
 * }>} statusEvents
 */

/**
 * @typedef {RestaurantQueueOrder} RestaurantOrderDetail
 */

export const RESTAURANT_ACCESS_ROLES = ['restaurant_owner', 'restaurant_staff'];

export function isRestaurantRole(role) {
  return role === 'vendor';
}

export function mapRestaurantMembership(membership) {
  if (!membership) return null;

  const restaurant = membership.restaurants || {};
  const address = restaurant.address || {};

  return {
    id: membership.id,
    restaurantId: membership.restaurant_id,
    profileId: membership.profile_id,
    role: membership.role || 'restaurant_staff',
    active: membership.active !== false,
    restaurant: {
      id: restaurant.id || membership.restaurant_id,
      name: restaurant.name || 'Restaurant',
      ownerName: restaurant.owner_name || '',
      phone: restaurant.phone || '',
      rating: Number(restaurant.rating || 0),
      imageUrl: restaurant.image_url || '',
      cuisineTypes: restaurant.cuisine_types || [],
      deliveryTimeMin: restaurant.delivery_time_min || 0,
      minOrder: Number(restaurant.min_order || 0),
      address,
      addressLine: [address.street, address.area, address.city].filter(Boolean).join(', '),
    },
  };
}

export async function loadPartnerRestaurants() {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, owner_name, cuisine_types, image_url, rating, delivery_time_min, min_order, phone, address')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Unable to load restaurants.');
  }

  return data || [];
}

export async function loadRestaurantMembership(profileId) {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from('restaurant_staff_members')
    .select('id, restaurant_id, profile_id, role, active, created_at, restaurants(*)')
    .eq('profile_id', profileId)
    .eq('active', true);

  if (error) {
    throw new Error(error.message || 'Unable to load restaurant membership.');
  }

  const memberships = data || [];
  const preferredMembership = memberships
    .slice()
    .sort((left, right) => {
      const leftRank = left.role === 'restaurant_owner' ? 0 : 1;
      const rightRank = right.role === 'restaurant_owner' ? 0 : 1;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    })[0] || null;

  return mapRestaurantMembership(preferredMembership);
}

export async function bootstrapDemoRestaurantAccess({
  restaurantId,
  accessRole = 'restaurant_owner',
  displayName = '',
}) {
  if (!restaurantId) {
    throw new Error('Pick a restaurant first.');
  }

  const { data, error } = await supabase.rpc('bootstrap_demo_restaurant_access', {
    p_restaurant_id: restaurantId,
    p_access_role: accessRole,
    p_display_name: displayName?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || 'Unable to start restaurant access.');
  }

  return data;
}
