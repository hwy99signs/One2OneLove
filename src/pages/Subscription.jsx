import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Crown, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserSubscription,
  handleSubscriptionCheckout,
  openBillingPortal,
  isPaymentsEnabled,
} from '@/lib/stripeService';
import {
  ACTIVE_MEMBERSHIP_STATUSES,
  MEMBERSHIP_PRICING,
  formatMembershipPrice,
} from '@/lib/membershipConfig';

export default function Subscription() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const paymentsEnabled = isPaymentsEnabled();
  const membershipActive = ACTIVE_MEMBERSHIP_STATUSES.has(membership?.status);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!isAuthenticated) {
      setMembership(null);
      setLoading(false);
      return undefined;
    }

    getUserSubscription()
      .then((data) => {
        if (!cancelled) setMembership(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const startCheckout = async () => {
    setMessage('');
    if (!isAuthenticated) {
      navigate('/SignIn?returnTo=%2FSubscription');
      return;
    }

    setActionLoading(true);
    const result = await handleSubscriptionCheckout();
    if (!result.success) {
      setMessage(result.error || 'Membership checkout is unavailable right now.');
      setActionLoading(false);
    }
  };

  const manageBilling = async () => {
    setMessage('');
    setActionLoading(true);
    const result = await openBillingPortal();
    if (!result.success) {
      setMessage(result.error || 'Billing management is unavailable right now.');
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-700">One2OneLove Membership</p>
          <h1 className="mt-2 text-4xl font-black text-gray-900 sm:text-5xl">Simple relaunch pricing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            One membership. No retired Basic, Premiere, or Exclusive tiers.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-7 py-5 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-100">Launch membership</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-5xl font-black">{formatMembershipPrice(MEMBERSHIP_PRICING.introMonthly)}</span>
              <span className="pb-1 text-lg">/ month</span>
            </div>
            <p className="mt-2 font-semibold">for the first {MEMBERSHIP_PRICING.introMonths} months</p>
            <p className="mt-1 text-sm text-purple-100">
              Then {formatMembershipPrice(MEMBERSHIP_PRICING.standardMonthly)} / month unless canceled.
            </p>
          </div>

          <div className="space-y-5 p-7">
            <div className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
              <p>
                Checkout is server-controlled. Your browser cannot choose a different price, Stripe Price ID, user account, or billing email.
              </p>
            </div>

            <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                The final free-account versus paid-membership feature boundary is being completed for the relaunch. Checkout will remain off until those entitlements are approved and tested.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Checking membership…
              </div>
            ) : membershipActive ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="font-bold text-green-900">Membership active</p>
                {membership?.current_period_end && (
                  <p className="mt-1 text-sm text-green-800">
                    Current billing period ends {new Date(membership.current_period_end).toLocaleDateString()}.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={manageBilling}
                  disabled={actionLoading || !paymentsEnabled}
                  className="mt-4 bg-gray-900 text-white hover:bg-gray-800"
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Manage Billing
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={startCheckout}
                disabled={actionLoading || !paymentsEnabled}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-6 text-lg font-bold text-white"
              >
                {actionLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Crown className="mr-2 h-5 w-5" />}
                {!paymentsEnabled ? 'Checkout opens after approval' : isAuthenticated ? 'Start Membership' : 'Sign In to Continue'}
              </Button>
            )}

            {message && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{message}</p>
            )}

            <p className="text-center text-xs text-gray-500">
              Membership activation, feature entitlements, and production billing remain disabled in this development build.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
