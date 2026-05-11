import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from './useToast';
import { useCustomerSession } from './useCustomerSession';
import { isRestaurantRole, loadRestaurantMembership } from '../lib/restaurant';

const RestaurantSessionContext = createContext(null);

export function RestaurantSessionProvider({ children }) {
  const { pushToast } = useToast();
  const {
    loading: customerLoading,
    profile,
    role,
    logout,
  } = useCustomerSession();
  const [state, setState] = useState({
    loading: true,
    membership: null,
    restaurant: null,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    async function hydrate() {
      try {
        if (customerLoading) return;

        if (!profile?.id || !isRestaurantRole(role)) {
          if (ignore) return;
          setState({
            loading: false,
            membership: null,
            restaurant: null,
            error: '',
          });
          return;
        }

        const membership = await loadRestaurantMembership(profile.id);
        if (ignore) return;

        setState({
          loading: false,
          membership,
          restaurant: membership?.restaurant || null,
          error: membership ? '' : 'No active restaurant membership was found for this profile.',
        });
      } catch (error) {
        if (ignore) return;
        setState({
          loading: false,
          membership: null,
          restaurant: null,
          error: error.message || 'Unable to load the restaurant session.',
        });
        pushToast({
          type: 'error',
          title: 'Partner session unavailable',
          description: error.message || 'Please try again.',
        });
      }
    }

    hydrate();

    return () => {
      ignore = true;
    };
  }, [customerLoading, profile?.id, pushToast, role]);

  const value = useMemo(() => ({
    loading: state.loading,
    accessLoading: false,
    restaurantLoading: state.loading,
    membership: state.membership,
    restaurant: state.restaurant,
    restaurants: state.restaurant ? [state.restaurant] : [],
    error: state.error,
    hasRestaurantRole: isRestaurantRole(role),
    hasRestaurantAccess: Boolean(state.membership?.restaurantId),
    role: state.membership?.role || role || 'guest',
    refreshRestaurantSession: async () => {
      if (!profile?.id || !isRestaurantRole(role)) {
        setState({
          loading: false,
          membership: null,
          restaurant: null,
          error: '',
        });
        return null;
      }

      const membership = await loadRestaurantMembership(profile.id);
      setState({
        loading: false,
        membership,
        restaurant: membership?.restaurant || null,
        error: membership ? '' : 'No active restaurant membership was found for this profile.',
      });
      return membership;
    },
    logoutToGuest: logout,
  }), [state, role, profile?.id, logout]);

  return <RestaurantSessionContext.Provider value={value}>{children}</RestaurantSessionContext.Provider>;
}

export function useRestaurantSession() {
  const context = useContext(RestaurantSessionContext);
  if (!context) {
    throw new Error('useRestaurantSession must be used within RestaurantSessionProvider');
  }

  return context;
}
