/**
 * Cart State — Agent A (Claude Code)
 * Cart stored in localStorage. No DB needed.
 */
'use client';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Cart {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  deliveryFee: number;
}

const CART_KEY = 'biteblast_cart';

export function getCart(): Cart | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Cart; }
  catch { return null; }
}

export function setCart(cart: Cart | null): void {
  if (typeof window === 'undefined') return;
  if (!cart) {
    localStorage.removeItem(CART_KEY);
    return;
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(item: { menuItemId: string; name: string; price: number }, restaurantId: string, restaurantName: string): Cart {
  const existing = getCart();

  if (existing && existing.restaurantId !== restaurantId) {
    // Different restaurant — replace cart
    const cart: Cart = {
      restaurantId,
      restaurantName,
      deliveryFee: 20,
      items: [{ ...item, quantity: 1 }],
    };
    setCart(cart);
    return cart;
  }

  const cart: Cart = existing || { restaurantId, restaurantName, deliveryFee: 20, items: [] };

  const idx = cart.items.findIndex(i => i.menuItemId === item.menuItemId);
  if (idx >= 0) {
    cart.items[idx].quantity += 1;
  } else {
    cart.items.push({ ...item, quantity: 1 });
  }

  setCart(cart);
  return cart;
}

export function updateQuantity(menuItemId: string, quantity: number): Cart | null {
  const cart = getCart();
  if (!cart) return null;

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.menuItemId !== menuItemId);
    if (cart.items.length === 0) { setCart(null); return null; }
  } else {
    const item = cart.items.find(i => i.menuItemId === menuItemId);
    if (item) item.quantity = quantity;
  }

  setCart(cart);
  return cart;
}

export function removeFromCart(menuItemId: string): Cart | null {
  return updateQuantity(menuItemId, 0);
}

export function clearCart(): void {
  setCart(null);
}

export function getCartTotal(cart: Cart): { subtotal: number; gst: number; total: number } {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const total = Math.round((subtotal + cart.deliveryFee + 5 + gst) * 100) / 100; // +₹5 platform fee
  return { subtotal, gst, total };
}
