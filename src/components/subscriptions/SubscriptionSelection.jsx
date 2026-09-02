import React from 'react';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MEMBERSHIP_PRICING, formatMembershipPrice, paymentsEnabled } from '@/lib/membershipConfig';

/**
 * Single relaunch membership selector.
 * The retired Basic/Premiere/Exclusive prices must never reappear in signup or checkout.
 */
export default function SubscriptionSelection({ selectedPlan, onSelect, disabled = false }) {
  const enabled = paymentsEnabled();
  const isSelected = selectedPlan?.key === MEMBERSHIP_PRICING.planKey || selectedPlan === MEMBERSHIP_PRICING.planKey;

  const plan = {
    key: MEMBERSHIP_PRICING.planKey,
    name: 'One2OneLove Membership',
    introPrice: MEMBERSHIP_PRICING.introMonthly,
    introMonths: MEMBERSHIP_PRICING.introMonths,
    standardPrice: MEMBERSHIP_PRICING.standardMonthly,
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border-2 border-purple-200 bg-white p-7 shadow-lg">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
          <Crown className="h-6 w-6 text-purple-700" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-purple-700">Relaunch membership</p>
          <h3 className="mt-1 text-2xl font-bold text-gray-900">{plan.name}</h3>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-5">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-gray-900">{formatMembershipPrice(plan.introPrice)}</span>
          <span className="pb-1 text-gray-600">/ month</span>
        </div>
        <p className="mt-2 font-semibold text-purple-800">for the first {plan.introMonths} months</p>
        <p className="mt-1 text-sm text-gray-600">
          Then {formatMembershipPrice(plan.standardPrice)} / month unless canceled.
        </p>
      </div>

      <div className="mt-5 flex items-start gap-3 text-sm text-gray-600">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <p>The exact free-account versus membership feature boundary is being finalized for relaunch; no legacy tier entitlements are used.</p>
      </div>

      <Button
        type="button"
        disabled={disabled || !enabled}
        onClick={() => onSelect?.(plan)}
        className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
      >
        {!enabled ? 'Checkout opens with relaunch' : isSelected ? 'Membership Selected' : 'Choose Membership'}
      </Button>
    </div>
  );
}
