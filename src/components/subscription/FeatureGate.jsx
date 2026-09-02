import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

/**
 * Relaunch membership gate.
 *
 * Paid gating remains OFF until VITE_MEMBERSHIP_GATING_ENABLED=true after controlled
 * billing tests. Once enabled, free entitlements remain transparent, visitors are sent
 * through normal account/sign-in flow, and only approved membership features upsell.
 */
export default function FeatureGate({
  feature,
  children,
  showUpgradePrompt = true,
  fallback = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAccess, gatingEnabled, isLoading, needsSignIn } = useFeatureAccess(feature);

  if (!gatingEnabled || hasAccess) return children;
  if (isLoading) return fallback;
  if (fallback) return fallback;
  if (!showUpgradePrompt) return null;

  const returnTo = `${location.pathname}${location.search || ''}`;

  if (needsSignIn) {
    return (
      <div className="mx-auto my-10 max-w-2xl rounded-3xl border-2 border-pink-200 bg-gradient-to-br from-rose-50 to-purple-50 p-7 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
          <LogIn className="h-6 w-6 text-pink-700" />
        </div>
        <h3 className="text-xl font-black text-gray-900">Sign in to continue</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
          This member feature needs a One2OneLove account before we can check membership access.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => navigate(`/SignIn?returnTo=${encodeURIComponent(returnTo)}`)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/SignUp?returnTo=${encodeURIComponent(returnTo)}`)}
          >
            Create Free Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto my-10 max-w-2xl rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-7 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
        <Lock className="h-6 w-6 text-purple-700" />
      </div>
      <h3 className="text-xl font-black text-gray-900">Included with One2OneLove Membership</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
        Your free account stays active. This deeper relationship tool is part of the paid membership experience.
      </p>
      <Button
        type="button"
        onClick={() => navigate('/Subscription')}
        className="mt-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      >
        <Crown className="mr-2 h-4 w-4" />
        View Membership
      </Button>
    </div>
  );
}
