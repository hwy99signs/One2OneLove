import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSubscription } from '@/lib/stripeService';
import {
  ACTIVE_MEMBERSHIP_STATUSES,
  getFeatureEntitlement,
  membershipGatingEnabled,
} from '@/lib/membershipConfig';

/**
 * Relaunch feature-access hook.
 *
 * The entitlement map is approved, but paid gating remains disabled until the controlled
 * Stripe/backend sequence is complete. Free features remain free even after the gate is
 * enabled; membership features require an active/trialing paid membership.
 */
export function useFeatureAccess(featureName) {
  const { user, isAuthenticated } = useAuth();
  const [membership, setMembership] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const gatingEnabled = membershipGatingEnabled();
  const entitlement = getFeatureEntitlement(featureName);

  useEffect(() => {
    let cancelled = false;

    if (!gatingEnabled || entitlement === 'free' || !user?.id) {
      setMembership(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    getUserSubscription()
      .then((result) => {
        if (!cancelled) setMembership(result);
      })
      .catch((error) => {
        console.warn('Unable to load membership access state:', error);
        if (!cancelled) setMembership(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entitlement, gatingEnabled, user?.id]);

  return useMemo(() => {
    if (!gatingEnabled || entitlement === 'free') {
      return {
        hasAccess: true,
        currentTier: isAuthenticated ? 'free' : 'visitor',
        requiredTier: entitlement,
        featureAccess: entitlement,
        needsUpgrade: false,
        needsSignIn: false,
        gatingEnabled,
        isLoading: false,
      };
    }

    if (!isAuthenticated) {
      return {
        hasAccess: false,
        currentTier: 'visitor',
        requiredTier: 'membership',
        featureAccess: entitlement,
        needsUpgrade: false,
        needsSignIn: true,
        gatingEnabled: true,
        isLoading: false,
      };
    }

    const activeMembership = ACTIVE_MEMBERSHIP_STATUSES.has(membership?.status);

    return {
      hasAccess: activeMembership,
      currentTier: activeMembership ? 'membership' : 'free',
      requiredTier: 'membership',
      featureAccess: entitlement,
      needsUpgrade: !activeMembership,
      needsSignIn: false,
      gatingEnabled: true,
      isLoading,
    };
  }, [entitlement, gatingEnabled, isAuthenticated, isLoading, membership?.status]);
}

export function useTierInfo() {
  const { user, isAuthenticated } = useAuth();
  const gatingEnabled = membershipGatingEnabled();

  return {
    currentTier: isAuthenticated ? 'free' : 'visitor',
    tiers: ['free', 'membership'],
    user,
    gatingEnabled,
  };
}
