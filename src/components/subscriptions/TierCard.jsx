import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { handleSubscriptionCheckout } from '@/lib/stripeService';
import { toast } from 'sonner';

const defaultLabels = {
  mostPopular: 'MOST POPULAR',
  free: 'Free',
  month: 'month',
  pricingPending: 'Pricing to be finalized',
  pricingPendingButton: 'Pricing coming next',
  processing: 'Processing...',
  selected: 'Selected',
  choose: 'Choose',
  paymentFailed: 'Failed to process payment',
  basicSuccess: 'Successfully subscribed to Basic plan!',
  redirecting: 'Redirecting to Stripe checkout...',
  genericError: 'An error occurred. Please try again.',
};

const TIER_SELECTED_EVENT = 'o2ol-tier-selected';

export default function TierCard({ tier, index, onSelect, isSelected, showPayment = false, labels = {} }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(Boolean(isSelected));
  const copy = { ...defaultLabels, ...labels };
  const displayName = tier.displayName || tier.name;
  const pricingPending = tier.price === null || tier.price === undefined;

  useEffect(() => {
    setIsHighlighted(Boolean(isSelected));
  }, [isSelected]);

  useEffect(() => {
    const handleTierSelected = (event) => {
      setIsHighlighted(event.detail === tier.name);
    };

    window.addEventListener(TIER_SELECTED_EVENT, handleTierSelected);
    return () => window.removeEventListener(TIER_SELECTED_EVENT, handleTierSelected);
  }, [tier.name]);

  const selectThisTier = () => {
    window.dispatchEvent(new CustomEvent(TIER_SELECTED_EVENT, { detail: tier.name }));
    if (onSelect) onSelect(tier);
  };

  const handleChoosePlan = async () => {
    selectThisTier();

    if (tier.checkoutDisabled || pricingPending) return;

    if (onSelect && !showPayment) {
      return;
    }

    if (showPayment) {
      setIsProcessing(true);
      try {
        const planData = {
          name: tier.name,
          price: tier.price || 0,
          priceId: tier.priceId || `price_${tier.name.toLowerCase()}`,
          isFree: tier.isFree || tier.price === 0,
        };

        const result = await handleSubscriptionCheckout(planData);
        if (!result.success) {
          toast.error(result.error || copy.paymentFailed);
          setIsProcessing(false);
          return;
        }

        if (planData.isFree || planData.price === 0) {
          toast.success(copy.basicSuccess);
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.success(copy.redirecting);
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || copy.genericError);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        onClick={selectThisTier}
        className={`relative h-full flex flex-col cursor-pointer border-2 transition-all duration-300 hover:shadow-2xl hover:border-purple-200 ${
          isHighlighted ? 'ring-4 ring-purple-500 ring-offset-2' : ''
        }`}
      >
        {tier.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {copy.mostPopular}
            </span>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-4xl shadow-lg`}>
              {tier.icon}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{displayName}</CardTitle>
          <CardDescription className="text-base mt-2">{tier.description}</CardDescription>

          <div className="mt-6">
            <div className="flex items-baseline justify-center">
              {pricingPending ? (
                <span className="text-2xl font-bold text-purple-700">{copy.pricingPending}</span>
              ) : tier.isFree ? (
                <span className="text-5xl font-bold text-green-600">{copy.free}</span>
              ) : (
                <>
                  <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-xl text-gray-500 ml-2">/{tier.periodLabel || copy.month}</span>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col">
          <ul className="space-y-3 mb-6 flex-grow">
            {tier.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={(event) => {
              event.stopPropagation();
              handleChoosePlan();
            }}
            disabled={isProcessing}
            className={`w-full text-lg py-6 font-semibold transition-all duration-300 ${
              tier.popular
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-900 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {copy.processing}
              </>
            ) : isHighlighted ? (
              `✓ ${copy.selected}`
            ) : pricingPending || tier.checkoutDisabled ? (
              copy.pricingPendingButton
            ) : (
              `${copy.choose} ${displayName}`
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
