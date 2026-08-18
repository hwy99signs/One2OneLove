import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSubscription } from '@/lib/stripeService';
import { ACTIVE_MEMBERSHIP_STATUSES, membershipGatingEnabled } from '@/lib/membershipConfig';

/**
 * Relaunch feature-access hook.
 *
 * The old Basic/Premiere/Exclusive matrix has been retired. Until the owner approves
 * the exact free-account versus paid-membership feature boundary, membership gating is
 * disabled by default through VITE_MEMBERSHIP_GATING_ENABLED. This keeps development
 * from silently reviving stale prices or accidentally locking core relaunch flows.
 *
 * If somebody enables the gate before a feature map is approved, this hook fails closed
 * for named gated features rather than inventing a product entitlement.
 */
export function useFeatureAccess(featureName) {
  const { user } = useAuth();
  const [membership, setMembership] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const gatingEnabled = membershipGatingEnabled();

  useEffect(() => {
    let cancelled = false;

    if (!gatingEnabled || !user?.id) {
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
  }, [gatingEnabled, user?.id]);

  return useMemo(() => {
    if (!gatingEnabled) {
      return {
        hasAccess: true,
        currentTier: 'relaunch-open',
        requiredTier: null,
        featureAccess: null,
        needsUpgrade: false,
        gatingEnabled: false,
        isLoading: false,
      };
    }

    const activeMembership = ACTIVE_MEMBERSHIP_STATUSES.has(membership?.status);

    // No feature-to-membership map is intentionally defined yet. Once the owner approves
    // that product boundary, replace this fail-closed branch with the approved map.
    const approvedFeatureMapExists = false;
    const hasAccess = Boolean(activeMembership && approvedFeatureMapExists && featureName);

    return {
      hasAccess,
      currentTier: activeMembership ? 'membership' : 'free',
      requiredTier: 'membership',
      featureAccess: null,
      needsUpgrade: Boolean(featureName && !hasAccess),
      gatingEnabled: true,
      isLoading,
    };
  }, [featureName, gatingEnabled, isLoading, membership?.status]);
}

export function useTierInfo() {
  const { user } = useAuth();
  const gatingEnabled = membershipGatingEnabled();

  return {
    currentTier: gatingEnabled ? 'free' : 'relaunch-open',
    tiers: ['free', 'membership'],
    user,
    gatingEnabled,
  };
}
