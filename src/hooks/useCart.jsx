import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './useToast';
import { useCustomerSession } from './useCustomerSession';
import { supabase } from '../lib/supabase';
import { loadCurrentCustomerContext } from '../lib/customer';

const CartContext = createContext(null);

function toCartState(record) {
  if (!record) {
    return {
      cartId: null,
      restaurantId: null,
      promoCode: '',
      discountRate: 0,
      items: [],
    };
  }

  return {
    cartId: record.id,
    restaurantId: record.restaurant_id,
    promoCode: record.promo_code || '',
    discountRate: Number(record.discount_rate || 0),
    items: (record.cart_items || []).map((entry) => ({
      cartItemId: entry.id,
      id: entry.menu_items.id,
      quantity: entry.quantity,
      name: entry.menu_items.name,
      price: Number(entry.menu_items.price),
      image: entry.menu_items.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
      isAvailable: entry.menu_items.is_available !== false,
      restaurantName: record.restaurants?.name || 'Restaurant',
      restaurantSlug: record.restaurants?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '',
      restaurantId: record.restaurant_id,
    })),
  };
}

async function fetchCart(profileId) {
  if (!profileId) {
    return toCartState(null);
  }

  const { data, error } = await supabase
    .from('carts')
    .select('id, restaurant_id, promo_code, discount_rate, restaurants(name), cart_items(id, quantity, special_instructions, menu_items(id, name, price, image_url, is_available))')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load cart.');
  }

  return toCartState(data);
}

async function resolveProfileId(profileId) {
  if (profileId) return profileId;

  const context = await loadCurrentCustomerContext();
  return context.profile?.id || context.customer?.profile_id || null;
}

export function CartProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    profileId: null,
    cartId: null,
    restaurantId: null,
    promoCode: '',
    discountRate: 0,
    items: [],
  });
  const { pushToast } = useToast();
  const { loading: customerLoading, customer } = useCustomerSession();

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      try {
        if (customerLoading) return;
        if (!customer?.profileId) {
          if (ignore) return;
          setState((current) => ({
            ...current,
            loading: false,
            profileId: null,
            cartId: null,
            restaurantId: null,
            promoCode: '',
            discountRate: 0,
            items: [],
          }));
          return;
        }

        const cart = await fetchCart(customer.profileId);
        if (ignore) return;
        setState((current) => ({
          ...current,
          loading: false,
          profileId: customer.profileId,
          ...cart,
        }));
      } catch (error) {
        if (ignore) return;
        setState((current) => ({ ...current, loading: false }));
        pushToast({
          type: 'error',
          title: 'Cart unavailable',
          description: error.message || 'We could not connect your cart right now.',
        });
      }
    }

    bootstrap();

    return () => {
      ignore = true;
    };
  }, [customerLoading, customer?.profileId, pushToast]);

  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal > 0 ? 4.99 : 0;
  const service = subtotal > 0 ? 2.5 : 0;
  const discount = subtotal * state.discountRate;
  const total = Math.max(0, subtotal + delivery + service - discount);

  const value = useMemo(() => ({
    loading: state.loading,
    items: state.items,
    promoCode: state.promoCode,
    discountRate: state.discountRate,
    subtotal,
    delivery,
    service,
    discount,
    total,
    itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0),
    refreshCart: async () => {
      const profileId = await resolveProfileId(state.profileId || customer?.profileId);
      if (!profileId) return toCartState(null);
      const nextCart = await fetchCart(profileId);
      setState((current) => ({
        ...current,
        profileId,
        ...nextCart,
      }));
      return nextCart;
    },
    addItem: async (item, options = {}) => {
      try {
        if (!item?.id) {
          throw new Error('This menu item is missing its database identity.');
        }

        const profileId = await resolveProfileId(state.profileId || customer?.profileId);
        if (!profileId) {
          throw new Error('Customer session is not ready yet.');
        }

        const { error } = await supabase.rpc('add_cart_item', {
          p_menu_item_id: item.id,
          p_quantity: 1,
        });

        if (error) {
          throw new Error(error.message || 'Failed to add item to cart.');
        }

        const nextCart = await fetchCart(profileId);
        const switchedRestaurant = state.restaurantId && nextCart.restaurantId && state.restaurantId !== nextCart.restaurantId;

        setState((current) => ({
          ...current,
          profileId,
          ...nextCart,
        }));

        if (!options.silent) {
          pushToast({
            type: switchedRestaurant ? 'info' : 'success',
            title: switchedRestaurant ? 'Started a new order' : `${item.name} added`,
            description: switchedRestaurant
              ? `Your cart now matches ${item.restaurantName || 'this restaurant'}.`
              : 'Your cart just got better.',
          });
        }

        return true;
      } catch (error) {
        pushToast({
          type: 'error',
          title: 'Cart update failed',
          description: error.message || 'Please try adding that item again.',
        });

        return false;
      }
    },
    setQuantity: async (id, quantity) => {
      const target = state.items.find((item) => item.id === id);
      if (!target) return;

      try {
        const { error } = await supabase.rpc('set_cart_item_quantity', {
          p_cart_item_id: target.cartItemId,
          p_quantity: quantity,
        });

        if (error) {
          throw new Error(error.message || 'Failed to update cart item.');
        }

        const nextCart = await fetchCart(state.profileId || customer?.profileId);
        setState((current) => ({
          ...current,
          ...nextCart,
        }));
      } catch (error) {
        pushToast({
          type: 'error',
          title: 'Quantity update failed',
          description: error.message || 'Please try again.',
        });
      }
    },
    removeItem: async (id) => {
      const target = state.items.find((item) => item.id === id);
      if (!target) return;

      try {
        const { error } = await supabase.rpc('remove_cart_item', {
          p_cart_item_id: target.cartItemId,
        });

        if (error) {
          throw new Error(error.message || 'Failed to remove item from cart.');
        }

        const nextCart = await fetchCart(state.profileId || customer?.profileId);
        setState((current) => ({
          ...current,
          ...nextCart,
        }));
      } catch (error) {
        pushToast({
          type: 'error',
          title: 'Remove failed',
          description: error.message || 'Please try again.',
        });
      }
    },
    applyPromo: async (code) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        pushToast({ type: 'error', title: 'Invalid code', description: 'Enter a promo code first.' });
        return;
      }

      const { error } = await supabase.rpc('apply_cart_promo', {
        p_code: normalized,
      });

      if (error) {
        pushToast({ type: 'error', title: 'Invalid code', description: error.message || 'Try GLOW10 or VELVET15.' });
        return;
      }

      const nextCart = await fetchCart(state.profileId || customer?.profileId);
      setState((current) => ({
        ...current,
        ...nextCart,
      }));
      pushToast({ type: 'info', title: `${normalized} applied`, description: 'Your summary has been updated.' });
    },
    clearCart: async () => {
      try {
        const { error } = await supabase.rpc('clear_current_cart');
        if (error) {
          throw new Error(error.message || 'Failed to clear cart.');
        }

        const nextCart = await fetchCart(state.profileId || customer?.profileId);
        setState((current) => ({
          ...current,
          ...nextCart,
        }));
      } catch (error) {
        pushToast({
          type: 'error',
          title: 'Clear cart failed',
          description: error.message || 'Please try again.',
        });
      }
    },
  }), [state, subtotal, delivery, service, discount, total, pushToast, customer?.profileId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
