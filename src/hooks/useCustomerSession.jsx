import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './useToast';
import { supabase } from '../lib/supabase';
import {
  bootstrapCustomerProfile,
  clearLegacyCustomerStorage,
  loadCurrentCustomerContext,
  loadCustomerAddresses,
  mapCustomerContext,
  signInWithEmailPassword,
  signOutSession,
  signUpWithEmailPassword,
} from '../lib/customer';

const CustomerSessionContext = createContext(null);

function customerEmail(authUser, profile, customer) {
  return customer?.email || profile?.email || authUser?.email || '';
}

function customerName(authUser, profile, customer) {
  return customer?.name || profile?.name || authUser?.user_metadata?.display_name || '';
}

export function CustomerSessionProvider({ children }) {
  const { pushToast } = useToast();
  const [state, setState] = useState({
    loading: true,
    authUser: null,
    profile: null,
    customer: null,
    session: null,
    addresses: [],
  });

  async function hydrateCustomerContext(ignore = false, { toastOnError = true } = {}) {
    try {
      clearLegacyCustomerStorage();
      const context = await loadCurrentCustomerContext();
      if (ignore) return null;

      const mergedCustomer = mapCustomerContext(context.profile, context.customer);
      const nextState = {
        loading: false,
        authUser: context.authUser,
        profile: context.profile,
        customer: mergedCustomer
          ? {
            ...mergedCustomer,
            email: customerEmail(context.authUser, context.profile, context.customer),
            name: customerName(context.authUser, context.profile, context.customer),
          }
          : null,
        session: context.session,
        addresses: context.addresses,
      };

      setState((current) => ({
        ...current,
        ...nextState,
      }));

      return nextState;
    } catch (error) {
      if (ignore) return null;
      setState((current) => ({ ...current, loading: false }));
      if (toastOnError) {
        pushToast({
          type: 'error',
          title: 'Session unavailable',
          description: error.message || 'We could not restore your account session.',
        });
      }
      throw error;
    }
  }

  useEffect(() => {
    let ignore = false;

    hydrateCustomerContext(ignore);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      hydrateCustomerContext(ignore, { toastOnError: false });
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [pushToast]);

  const value = useMemo(() => {
    const role = state.profile?.role || state.customer?.role || 'guest';
    const hasSession = Boolean(state.authUser);
    const hasCustomerAccess = hasSession && role === 'customer' && Boolean(state.customer?.id);

    return {
      loading: state.loading,
      authUser: state.authUser,
      profile: state.profile,
      customer: state.customer,
      session: state.session,
      addresses: state.addresses,
      isAuthenticated: hasSession,
      hasCustomerAccess,
      isGuest: !hasSession,
      role,
      refreshSession: async ({ toastOnError = false } = {}) => {
        const context = await hydrateCustomerContext(false, { toastOnError });
        return context?.customer || null;
      },
      signIn: async ({ email, password }) => {
        await signInWithEmailPassword({ email, password });
        const context = await hydrateCustomerContext(false, { toastOnError: false });
        return context?.customer || null;
      },
      signUp: async ({ email, password, displayName }) => {
        const result = await signUpWithEmailPassword({ email, password, displayName });
        const context = await hydrateCustomerContext(false, { toastOnError: false });
        return {
          requiresEmailVerification: !result.session,
          customer: context?.customer || null,
        };
      },
      ensureCustomerProfile: async ({ displayName, email }) => {
        await bootstrapCustomerProfile(displayName, email);
        const context = await hydrateCustomerContext(false, { toastOnError: false });
        return context?.customer || null;
      },
      refreshAddresses: async () => {
        if (!state.customer?.id) return [];
        const addresses = await loadCustomerAddresses(state.customer.id);
        setState((current) => ({ ...current, addresses }));
        return addresses;
      },
      logout: async () => {
        await signOutSession();
        await hydrateCustomerContext(false, { toastOnError: false });
      },
      saveAddress: async (addressInput) => {
        const { error } = await supabase.rpc('save_customer_address', {
          p_label: addressInput.label,
          p_line1: addressInput.line1,
          p_area: addressInput.area,
          p_city: addressInput.city,
          p_landmark: addressInput.landmark,
          p_instructions: addressInput.instructions || null,
          p_contact_name: addressInput.name,
          p_phone: addressInput.phone,
          p_is_default: addressInput.isDefault === true,
        });

        if (error) {
          throw new Error(error.message || 'Unable to save this address.');
        }

        if (!state.customer?.id) return [];
        const addresses = await loadCustomerAddresses(state.customer.id);
        setState((current) => ({ ...current, addresses }));
        return addresses;
      },
      setDefaultAddress: async (addressId) => {
        if (!addressId) {
          throw new Error('Pick an address first.');
        }

        const { error } = await supabase.rpc('set_default_customer_address', {
          p_address_id: addressId,
        });

        if (error) {
          throw new Error(error.message || 'Unable to update the default address.');
        }

        if (!state.customer?.id) return [];
        const addresses = await loadCustomerAddresses(state.customer.id);
        setState((current) => ({ ...current, addresses }));
        return addresses;
      },
      updateProfile: async ({ name, email }) => {
        if (!state.profile?.id) {
          throw new Error('Your profile is not ready yet.');
        }

        const profilePayload = {
          name: name?.trim() || state.customer?.name || 'BiteBlast Customer',
          email: email?.trim() || state.authUser?.email || null,
          updated_at: new Date().toISOString(),
        };

        const updates = [
          supabase.from('app_profiles').update(profilePayload).eq('id', state.profile.id),
        ];

        if (role === 'customer' && state.customer?.id) {
          updates.push(supabase.from('customers').update(profilePayload).eq('profile_id', state.profile.id));
        }

        const results = await Promise.all(updates);
        const firstError = results.find((result) => result.error)?.error;

        if (firstError) {
          throw new Error(firstError.message || 'Unable to update your profile.');
        }

        const context = await hydrateCustomerContext(false, { toastOnError: false });
        return context?.customer || null;
      },
    };
  }, [state, pushToast]);

  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>;
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext);
  if (!context) {
    throw new Error('useCustomerSession must be used within CustomerSessionProvider');
  }

  return context;
}
