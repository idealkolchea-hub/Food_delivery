import { supabase } from './supabase';

function browserStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function fallbackDisplayName(email = '') {
  const localPart = email.split('@')[0] || 'Customer';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Customer';
}

export async function bootstrapCustomerProfile(displayName, email) {
  const profileName = displayName?.trim() || fallbackDisplayName(email);
  const { error } = await supabase.rpc('bootstrap_profile', {
    p_display_name: profileName,
  });

  if (error) {
    throw new Error(error.message || 'Unable to initialize your customer profile.');
  }
}

export async function signInWithEmailPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message || 'Unable to sign in.');
  }

  return data;
}

export async function signUpWithEmailPassword({ email, password, displayName }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        display_name: displayName?.trim() || fallbackDisplayName(normalizedEmail),
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Unable to create your account.');
  }

  if (data.session) {
    await bootstrapCustomerProfile(displayName, normalizedEmail);
  }

  return data;
}

export async function getCurrentAuthState() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || 'Unable to read your auth state.');
  }

  return data.session;
}

export function mapCustomerContext(profile, customer) {
  if (!profile && !customer) return null;

  return {
    id: customer?.id || null,
    profileId: profile?.id || customer?.profile_id || null,
    phone: customer?.phone || profile?.phone || '',
    name: customer?.name || profile?.name || '',
    email: customer?.email || profile?.email || '',
    avatarUrl: customer?.avatar_url || profile?.avatar_url || '',
    role: profile?.role || customer?.role || 'guest',
    isGuest: customer?.is_guest ?? profile?.is_guest ?? true,
    verifiedAt: customer?.verified_at || profile?.verified_at || null,
    lastLoginAt: customer?.last_login_at || profile?.last_login_at || null,
  };
}

export async function loadCurrentCustomerContext() {
  const session = await getCurrentAuthState();
  const authUser = session?.user || null;

  if (!authUser) {
    return {
      session: null,
      authUser: null,
      profile: null,
      customer: null,
      addresses: [],
    };
  }

  const [{ data: profile, error: profileError }, { data: customer, error: customerError }] = await Promise.all([
    supabase.from('app_profiles').select('*').eq('id', authUser.id).maybeSingle(),
    supabase.from('customers').select('*').eq('profile_id', authUser.id).maybeSingle(),
  ]);

  if (profileError) {
    throw new Error(profileError.message || 'Unable to load the current app profile.');
  }

  if (customerError) {
    throw new Error(customerError.message || 'Unable to load the current customer profile.');
  }

  const addresses = customer?.id ? await loadCustomerAddresses(customer.id) : [];

  return {
    session,
    authUser,
    profile,
    customer,
    addresses,
  };
}

export async function loadCustomerAddresses(customerId) {
  if (!customerId) return [];

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load saved addresses.');
  }

  return data || [];
}

export async function signOutSession() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message || 'Unable to sign out.');
  }
}

export function clearLegacyCustomerStorage() {
  if (!browserStorageAvailable()) return;
  window.localStorage.removeItem('biteblast-customer-id');
  window.localStorage.removeItem('biteblast-customer-phone');
  window.localStorage.removeItem('biteblast-session-token');
  window.localStorage.removeItem('biteblast.agent-session.v1');
  window.localStorage.removeItem('biteblast.agent-availability.v1');
}
