import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Crown, Heart, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
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
import { getMembershipCopy } from '@/lib/membershipCopy';

const LOCALES = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };

function BenefitList({ items, tone = 'free' }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-gray-700">
          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'paid' ? 'text-purple-600' : 'text-green-600'}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function Subscription() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getMembershipCopy(currentLanguage).subscription;
  const locale = LOCALES[currentLanguage] || LOCALES.en;
  const introPrice = formatMembershipPrice(MEMBERSHIP_PRICING.introMonthly, locale);
  const standardPrice = formatMembershipPrice(MEMBERSHIP_PRICING.standardMonthly, locale);
  const localizedThenPrice = t.thenPrice.replace('$5.99', standardPrice);
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
      setMessage(result.error || t.checkoutUnavailable);
      setActionLoading(false);
    }
  };

  const manageBilling = async () => {
    setMessage('');
    setActionLoading(true);
    const result = await openBillingPortal();
    if (!result.success) {
      setMessage(result.error || t.billingUnavailable);
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </button>

        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-700">{t.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-green-200 bg-white p-7 shadow-lg">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100">
                <Heart className="h-5 w-5 fill-current text-green-700" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-700">{t.alwaysFree}</p>
                <h2 className="text-2xl font-black text-gray-900">{t.freeAccount}</h2>
              </div>
            </div>
            <BenefitList items={t.freeFeatures} />
            {!isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/SignUp?returnTo=%2FSubscription')}
                className="mt-6 w-full border-green-300 text-green-800 hover:bg-green-50"
              >
                {t.createFree}
              </Button>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-7 py-6 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-100">{t.launchMembership}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-5xl font-black">{introPrice}</span>
                <span className="pb-1 text-lg">{t.monthly}</span>
              </div>
              <p className="mt-2 font-semibold">{t.firstMonths}</p>
              <p className="mt-1 text-sm text-purple-100">{localizedThenPrice}</p>
            </div>

            <div className="space-y-6 p-7">
              <BenefitList items={t.paidFeatures} tone="paid" />

              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
                <p>{t.secureCheckout}</p>
              </div>

              <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{t.rollout}</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-4 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t.checking}
                </div>
              ) : membershipActive ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <p className="font-bold text-green-900">{t.active}</p>
                  {membership?.current_period_end && (
                    <p className="mt-1 text-sm text-green-800">
                      {t.periodEnds} {new Date(membership.current_period_end).toLocaleDateString(locale)}.
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={manageBilling}
                    disabled={actionLoading || !paymentsEnabled}
                    className="mt-4 bg-gray-900 text-white hover:bg-gray-800"
                  >
                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t.manage}
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
                  {!paymentsEnabled ? t.checkoutStaged : isAuthenticated ? t.start : t.signIn}
                </Button>
              )}

              {message && (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{message}</p>
              )}

              <p className="text-center text-xs text-gray-500">{t.development}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}