import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type TestAccount = {
  email: string;
  password: string;
  name: string;
  userId: string;
  customerId?: string | null;
};

type RpcResult<T = unknown> = {
  data: T | null;
  error: string | null;
};

let cachedEnv: Record<string, string> | null = null;

function loadEnvFile() {
  if (cachedEnv) return cachedEnv;

  const filePath = path.resolve(process.cwd(), '.env.local');
  const content = fs.readFileSync(filePath, 'utf8');
  const entries: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    entries[key] = value;
  }

  cachedEnv = entries;
  return entries;
}

function getEnv(key: string) {
  const env = loadEnvFile();
  const value = process.env[key] || env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const adminSupabase = createClient(
  getEnv('VITE_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

function createUserSupabaseClient() {
  return createClient(
    getEnv('VITE_SUPABASE_URL'),
    getEnv('VITE_SUPABASE_ANON_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function uniqueEmail(prefix: string) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return `${prefix}-${stamp}@biteblast-e2e.app`;
}

async function ensureAppProfile(params: {
  userId: string;
  email: string;
  name: string;
  role: 'customer' | 'vendor' | 'delivery_partner';
}) {
  const now = new Date().toISOString();
  const { error } = await adminSupabase.from('app_profiles').upsert({
    id: params.userId,
    role: params.role,
    name: params.name,
    email: params.email,
    is_guest: false,
    verified_at: now,
    last_login_at: now,
    updated_at: now,
  }, {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(error.message || 'Unable to provision app profile.');
  }
}

export async function createCustomerAccount(name: string): Promise<TestAccount> {
  const email = uniqueEmail('customer');
  const password = 'BiteBlast#123';
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Unable to create customer auth user.');
  }

  await ensureAppProfile({
    userId: data.user.id,
    email,
    name,
    role: 'customer',
  });

  const now = new Date().toISOString();
  const { data: customer, error: customerError } = await adminSupabase
    .from('customers')
    .upsert({
      profile_id: data.user.id,
      name,
      email,
      is_guest: false,
      role: 'customer',
      verified_at: now,
      last_login_at: now,
      updated_at: now,
    }, {
      onConflict: 'profile_id',
    })
    .select('id')
    .single();

  if (customerError) {
    throw new Error(customerError.message || 'Unable to provision customer row.');
  }

  return {
    email,
    password,
    name,
    userId: data.user.id,
    customerId: customer?.id || null,
  };
}

export async function getFirstActiveRestaurant() {
  const { data, error } = await adminSupabase
    .from('restaurants')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load an active restaurant.');
  }

  return data;
}

export async function createVendorAccount(name: string) {
  const restaurant = await getFirstActiveRestaurant();
  return createVendorAccountForRestaurant(name, restaurant.id);
}

export async function createVendorAccountForRestaurant(name: string, restaurantId: string) {
  const { data: restaurant, error: restaurantError } = await adminSupabase
    .from('restaurants')
    .select('id, name')
    .eq('id', restaurantId)
    .single();

  if (restaurantError || !restaurant) {
    throw new Error(restaurantError?.message || 'Unable to load the target restaurant.');
  }

  const email = uniqueEmail('vendor');
  const password = 'BiteBlast#123';
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Unable to create vendor auth user.');
  }

  await ensureAppProfile({
    userId: data.user.id,
    email,
    name,
    role: 'vendor',
  });

  const { error: membershipError } = await adminSupabase
    .from('restaurant_staff_members')
    .upsert({
      restaurant_id: restaurant.id,
      profile_id: data.user.id,
      role: 'restaurant_owner',
      active: true,
    }, {
      onConflict: 'restaurant_id,profile_id',
    });

  if (membershipError) {
    throw new Error(membershipError.message || 'Unable to provision vendor membership.');
  }

  return {
    email,
    password,
    name,
    userId: data.user.id,
    restaurant,
  };
}

export async function createDeliveryAccount(name: string): Promise<TestAccount> {
  const email = uniqueEmail('delivery');
  const password = 'BiteBlast#123';
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Unable to create delivery auth user.');
  }

  await ensureAppProfile({
    userId: data.user.id,
    email,
    name,
    role: 'delivery_partner',
  });

  return {
    email,
    password,
    name,
    userId: data.user.id,
  };
}

export async function createAdminAccount(name: string): Promise<TestAccount> {
  const email = uniqueEmail('admin');
  const password = 'BiteBlast#123';
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Unable to create admin auth user.');
  }

  await ensureAppProfile({
    userId: data.user.id,
    email,
    name,
    role: 'admin',
  });

  return {
    email,
    password,
    name,
    userId: data.user.id,
  };
}

export async function runDeliveryOrderAction(params: {
  email: string;
  password: string;
  orderId: string;
  action: 'claim_delivery_order' | 'pickup_delivery_order' | 'complete_delivery_order' | 'complete_delivery_order_with_token';
  token?: string;
}) {
  const deliverySupabase = createUserSupabaseClient();

  const { error: signInError } = await deliverySupabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (signInError) {
    throw new Error(signInError.message || 'Unable to sign in the delivery account for the test action.');
  }

  const { data, error } = await deliverySupabase.rpc(params.action, {
    p_order_id: params.orderId,
    ...(params.token ? { p_token: params.token } : {}),
  });

  if (error) {
    throw new Error(error.message || `Unable to run ${params.action}.`);
  }

  if (
    params.action === 'complete_delivery_order_with_token'
    && data
    && typeof data === 'object'
    && 'ok' in data
    && data.ok === false
  ) {
    throw new Error(data.message || `Unable to run ${params.action}.`);
  }
}

export async function invokeOrderRpcAsUser<T = unknown>(params: {
  email: string;
  password: string;
  action:
    | 'issue_delivery_handoff_token'
    | 'cancel_customer_order'
    | 'restaurant_update_order_status'
    | 'claim_delivery_order'
    | 'pickup_delivery_order'
    | 'complete_delivery_order'
    | 'complete_delivery_order_with_token';
  args: Record<string, unknown>;
}): Promise<RpcResult<T>> {
  const userSupabase = createUserSupabaseClient();
  const { error: signInError } = await userSupabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (signInError) {
    throw new Error(signInError.message || 'Unable to sign in the test account for the RPC action.');
  }

  const { data, error } = await userSupabase.rpc(params.action, params.args);

  return {
    data: (data as T | null) ?? null,
    error: error?.message || null,
  };
}

export async function issueDeliveryHandoffToken(params: {
  email: string;
  password: string;
  orderId: string;
}) {
  const result = await invokeOrderRpcAsUser<{
    order_id: string;
    token: string;
    expires_at: string;
    status: string;
  }>({
    email: params.email,
    password: params.password,
    action: 'issue_delivery_handoff_token',
    args: {
      p_order_id: params.orderId,
    },
  });

  if (result.error || !result.data) {
    throw new Error(result.error || 'Unable to issue delivery handoff token.');
  }

  return result.data;
}

export async function getLatestOrderForProfile(profileId: string) {
  const { data, error } = await adminSupabase
    .from('orders')
    .select('id, restaurant_id, status, delivery_partner_id')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load the latest order for this profile.');
  }

  return data;
}

export async function getOrderSnapshot(orderId: string) {
  const { data, error } = await adminSupabase
    .from('orders')
    .select('id, status, delivery_partner_id')
    .eq('id', orderId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load this order snapshot.');
  }

  return data;
}

export async function getOrderEvents(orderId: string) {
  const { data, error } = await adminSupabase
    .from('order_status_events')
    .select('status, event_type, previous_status, source, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load order events.');
  }

  return data;
}

export async function getDeliveryHandoffTokens(orderId: string) {
  const { data, error } = await adminSupabase
    .from('delivery_handoff_tokens')
    .select('id, order_id, customer_profile_id, delivery_partner_id, token_hash, status, expires_at, used_at, used_by_profile_id, attempt_count, last_attempt_at, metadata, created_at, updated_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load delivery handoff tokens.');
  }

  return data;
}

async function firstMenuItemForRestaurant(restaurantId: string) {
  const { data, error } = await adminSupabase
    .from('menu_items')
    .select('id, name, price')
    .eq('restaurant_id', restaurantId)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load a menu item for the restaurant.');
  }

  return data;
}

export async function createRestaurantOrder(params: {
  customerName: string;
  status: 'pending' | 'ready';
}) {
  const customer = await createCustomerAccount(params.customerName);
  const restaurant = await getFirstActiveRestaurant();
  const menuItem = await firstMenuItemForRestaurant(restaurant.id);
  const now = new Date();
  const subtotal = Number(menuItem.price || 0);
  const deliveryFee = 4.99;
  const platformFee = 2.5;
  const total = subtotal + deliveryFee + platformFee;

  const timeline = [
    { status: 'pending', title: 'Order placed', detail: 'Your order is waiting for restaurant confirmation.' },
  ];

  if (params.status === 'ready') {
    timeline.push(
      { status: 'accepted', title: 'Order accepted', detail: 'The restaurant has accepted your order.' },
      { status: 'preparing', title: 'Kitchen is preparing', detail: 'The kitchen has started preparing your order.' },
      { status: 'ready', title: 'Packed and ready', detail: 'The order is packed and ready for delivery pickup.' },
    );
  }

  const timestamps = timeline.map((_, index) => new Date(now.getTime() - (timeline.length - index) * 60_000).toISOString());

  const { data: order, error: orderError } = await adminSupabase
    .from('orders')
    .insert({
      customer_id: customer.customerId,
      user_id: customer.userId,
      profile_id: customer.userId,
      restaurant_id: restaurant.id,
      status: params.status,
      items: [
        {
          id: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          price: subtotal,
          image: '',
        },
      ],
      subtotal,
      delivery_fee: deliveryFee,
      platform_fee: platformFee,
      gst: 0,
      discount: 0,
      total,
      payment_method: 'cod',
      payment_status: 'pending',
      delivery_address: {
        label: 'Home',
        line1: 'Flat 9B, Riverlight Residency',
        area: 'Koregaon Park',
        city: 'Pune',
        landmark: 'Near Osho Garden',
        instructions: 'Call at the gate.',
        name: params.customerName,
        phone: '9999999999',
      },
      eta_minutes: 28,
      accepted_at: params.status === 'ready' ? timestamps[1] : null,
      preparing_at: params.status === 'ready' ? timestamps[2] : null,
      ready_at: params.status === 'ready' ? timestamps[3] : null,
      created_at: timestamps[0],
      updated_at: timestamps[timestamps.length - 1],
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Unable to create restaurant order.');
  }

  const { error: orderItemError } = await adminSupabase
    .from('order_items')
    .insert({
      order_id: order.id,
      menu_item_id: menuItem.id,
      restaurant_id: restaurant.id,
      name: menuItem.name,
      quantity: 1,
      unit_price: subtotal,
      line_total: subtotal,
      created_at: timestamps[0],
    });

  if (orderItemError) {
    throw new Error(orderItemError.message || 'Unable to create order items.');
  }

  const statusEvents = timeline.map((entry, index) => ({
    order_id: order.id,
    status: entry.status,
    title: entry.title,
    detail: entry.detail,
    created_by_role: index === 0 ? 'customer' : 'vendor',
    created_by_profile_id: index === 0 ? customer.userId : null,
    source: index === 0 ? 'checkout' : 'vendor_ops',
    event_type: index === 0
      ? 'order.placed'
      : entry.status === 'accepted'
        ? 'restaurant.accepted'
        : entry.status === 'preparing'
          ? 'restaurant.preparing'
          : 'restaurant.ready',
    previous_status: index === 0 ? null : timeline[index - 1]?.status ?? null,
    actor_id: index === 0 ? customer.userId : null,
    actor_role: index === 0 ? 'customer' : 'vendor',
    metadata: {} as Record<string, never>,
    created_at: timestamps[index],
  }));

  const { error: eventError } = await adminSupabase
    .from('order_status_events')
    .insert(statusEvents);

  if (eventError) {
    throw new Error(eventError.message || 'Unable to create order status events.');
  }

  return {
    orderId: order.id,
    restaurantName: restaurant.name,
    restaurantId: restaurant.id,
    customer,
  };
}
