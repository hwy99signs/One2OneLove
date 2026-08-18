import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

/**
 * Relaunch membership gate.
 *
 * Gating is disabled by default while the owner-approved free-account versus paid
 * membership boundary is still being finalized. When disabled, this component is
 * transparent and renders its children. If the environment gate is enabled before a
 * feature map exists, the hook fails closed and this component shows a generic
 * membership-required state rather than stale Basic/Premiere/Exclusive pricing.
 */
export default function FeatureGate({
  feature,
  children,
  showUpgradePrompt = true,
  fallback = null,
}) {
  const navigate = useNavigate();
  const { hasAccess, gatingEnabled, isLoading } = useFeatureAccess(feature);

  if (!gatingEnabled || hasAccess) return children;
  if (isLoading) return fallback;
  if (fallback) return fallback;
  if (!showUpgradePrompt) return null;

  return (
    <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
        <Lock className="h-6 w-6 text-purple-700" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">Membership Required</h3>
      <p className="mx-auto mb-4 max-w-md text-sm text-gray-600">
        This feature is part of One2OneLove membership. Membership checkout and final feature entitlements will be activated together for the relaunch.
      </p>
      <Button
        type="button"
        onClick={() => navigate('/Subscription')}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      >
        <Crown className="mr-2 h-4 w-4" />
        View Membership
      </Button>
    </div>
  );
}
