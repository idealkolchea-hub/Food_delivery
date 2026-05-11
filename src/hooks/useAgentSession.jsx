import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCustomerSession } from './useCustomerSession';

const STORAGE_KEY = 'biteblast.agent-availability.v1';
const AgentSessionContext = createContext(null);

function readStoredAvailability(profileId) {
  if (typeof window === 'undefined' || !profileId) return '';

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    return store?.[profileId] || '';
  } catch {
    return '';
  }
}

function writeStoredAvailability(profileId, availabilityStatus) {
  if (typeof window === 'undefined' || !profileId) return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    if (!availabilityStatus) {
      delete store[profileId];
    } else {
      store[profileId] = availabilityStatus;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Availability is a local UI preference only.
  }
}

export function AgentSessionProvider({ children }) {
  const {
    loading: customerLoading,
    authUser,
    profile,
    role,
    refreshSession,
    logout,
  } = useCustomerSession();
  const [availabilityStatus, setAvailabilityStatus] = useState('');

  useEffect(() => {
    if (!profile?.id) {
      setAvailabilityStatus('');
      return;
    }

    setAvailabilityStatus(readStoredAvailability(profile.id) || 'online');
  }, [profile?.id]);

  const value = useMemo(() => {
    const hasAgentAccess = role === 'delivery_partner';
    const agent = hasAgentAccess && profile
      ? {
        id: profile.id,
        name: profile.name || authUser?.user_metadata?.display_name || authUser?.email?.split('@')[0] || 'Delivery Partner',
        phone: profile.phone || '',
        email: profile.email || authUser?.email || '',
        trustScore: 94,
        kycStatus: 'verified',
        zone: 'Live dispatch zone',
        vehicle: 'Delivery vehicle on file',
        rating: 4.9,
        completedTrips: 0,
        availabilityStatus: availabilityStatus || 'online',
      }
      : null;

    return {
      loading: customerLoading,
      agentId: agent?.id || '',
      agent,
      agents: agent ? [agent] : [],
      hasAgentAccess,
      refreshAgentSession: async () => {
        await refreshSession({ toastOnError: false });
        return agent;
      },
      logoutAgent: logout,
      setAvailability: async (nextAvailability) => {
        if (!profile?.id) {
          throw new Error('No delivery partner session is active.');
        }

        writeStoredAvailability(profile.id, nextAvailability);
        setAvailabilityStatus(nextAvailability);
        return {
          ...agent,
          availabilityStatus: nextAvailability,
        };
      },
    };
  }, [customerLoading, authUser?.email, authUser?.user_metadata?.display_name, profile, role, refreshSession, logout, availabilityStatus]);

  return <AgentSessionContext.Provider value={value}>{children}</AgentSessionContext.Provider>;
}

export function useAgentSession() {
  const context = useContext(AgentSessionContext);
  if (!context) {
    throw new Error('useAgentSession must be used within AgentSessionProvider');
  }

  return context;
}
