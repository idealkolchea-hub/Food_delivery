import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEMO_PASSWORD = 'BiteBlast#123';
const DEMO_USERS = [
  { email: 'customer@demo.com', name: 'Demo Customer', role: 'customer' },
  { email: 'vendor@demo.com', name: 'Demo Vendor', role: 'vendor' },
  { email: 'delivery@demo.com', name: 'Demo Delivery', role: 'delivery_partner' },
  { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin' },
];

let cachedEnv = null;

function loadEnvFile() {
  if (cachedEnv) return cachedEnv;

  const filePath = path.resolve(process.cwd(), '.env.local');
  const content = fs.readFileSync(filePath, 'utf8');
  const entries = {};

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

function getEnv(key) {
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

async function listUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(error.message || 'Unable to list auth users.');
    }

    const pageUsers = data?.users || [];
    users.push(...pageUsers);

    if (pageUsers.length < 200) {
      return users;
    }

    page += 1;
  }
}

async function findExistingUserByEmail(email) {
  const users = await listUsers();
  return users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function ensureAuthUser({ email, name }) {
  const existing = await findExistingUserByEmail(email);

  if (existing) {
    const { data, error } = await adminSupabase.auth.admin.updateUserById(existing.id, {
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        display_name: name,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message || `Unable to update auth user for ${email}.`);
    }

    return {
      user: data.user,
      status: 'already exists',
    };
  }

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || `Unable to create auth user for ${email}.`);
  }

  return {
    user: data.user,
    status: 'created',
  };
}

async function ensureAppProfile({ userId, email, name, role }) {
  const now = new Date().toISOString();
  const { error } = await adminSupabase.from('app_profiles').upsert({
    id: userId,
    role,
    email,
    name,
    is_guest: false,
    verified_at: now,
    last_login_at: now,
    updated_at: now,
  }, {
    onConflict: 'id',
  });

  if (error) {
    throw new Error(error.message || `Unable to upsert app profile for ${email}.`);
  }
}

async function ensureCustomerRow({ userId, email, name }) {
  const now = new Date().toISOString();
  const { error } = await adminSupabase.from('customers').upsert({
    profile_id: userId,
    email,
    name,
    is_guest: false,
    role: 'customer',
    verified_at: now,
    last_login_at: now,
    updated_at: now,
  }, {
    onConflict: 'profile_id',
  });

  if (error) {
    throw new Error(error.message || `Unable to upsert customer row for ${email}.`);
  }
}

async function firstActiveRestaurant() {
  const { data, error } = await adminSupabase
    .from('restaurants')
    .select('id')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to find an active restaurant for the demo vendor.');
  }

  return data;
}

async function ensureVendorMembership({ userId }) {
  const restaurant = await firstActiveRestaurant();
  const { error } = await adminSupabase.from('restaurant_staff_members').upsert({
    restaurant_id: restaurant.id,
    profile_id: userId,
    role: 'restaurant_owner',
    active: true,
  }, {
    onConflict: 'restaurant_id,profile_id',
  });

  if (error) {
    throw new Error(error.message || 'Unable to upsert demo vendor membership.');
  }
}

async function bootstrapDemoUsers() {
  const results = [];

  for (const demoUser of DEMO_USERS) {
    const ensured = await ensureAuthUser(demoUser);

    await ensureAppProfile({
      userId: ensured.user.id,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
    });

    if (demoUser.role === 'customer') {
      await ensureCustomerRow({
        userId: ensured.user.id,
        email: demoUser.email,
        name: demoUser.name,
      });
    }

    if (demoUser.role === 'vendor') {
      await ensureVendorMembership({
        userId: ensured.user.id,
      });
    }

    results.push({
      email: demoUser.email,
      role: demoUser.role,
      status: ensured.status,
    });
  }

  return results;
}

bootstrapDemoUsers()
  .then((results) => {
    for (const result of results) {
      console.log(`${result.email} (${result.role}): ${result.status}`);
    }
  })
  .catch((error) => {
    console.error(error.message || 'Demo bootstrap failed.');
    process.exitCode = 1;
  });
