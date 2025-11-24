import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { handleSubscriptionCheckout } from '@/lib/stripeService';
import { toast } from 'sonner';

export default function TierCard({ tier, index, onSelect, isSelected, showPayment = false }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChoosePlan = async () => {
    if (onSelect && !showPayment) {
      // If in signup flow, just select the plan
      onSelect(tier);
      return;
    }

    // If showing payment, process checkout
    if (showPayment) {
      setIsProcessing(true);
      
      try {
        // Ensure tier has all required properties
        const planData = {
          name: tier.name,
          price: tier.price || 0,
          priceId: tier.priceId || `price_${tier.name.toLowerCase()}`,
          isFree: tier.isFree || tier.price === 0
        };

        const result = await handleSubscriptionCheckout(planData);
        
        if (!result.success) {
          toast.error(result.error || 'Failed to process payment');
          setIsProcessing(false);
          return;
        }
        
        // Note: For successful paid checkout, user will be redirected to Stripe
        // For free plan, user stays on page and sees success message
        if (planData.isFree || planData.price === 0) {
          toast.success('Successfully subscribed to Basis plan!');
          // Reload to refresh user data
          setTimeout(() => window.location.reload(), 1000);
        } else {
          // For paid plans, redirect happens in handleSubscriptionCheckout
          // Show a brief message before redirect
          toast.success('Redirecting to Stripe checkout...');
          // The redirect happens automatically in stripeService.js
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'An error occurred. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else if (onSelect) {
      onSelect(tier);
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
        className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-2xl ${
          tier.popular ? 'border-4 border-purple-400 scale-105' : 'border-2 hover:border-purple-200'
        } ${
          isSelected ? 'ring-4 ring-purple-500 ring-offset-2' : ''
        }`}
      >
        {tier.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              MOST POPULAR
            </span>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-4xl shadow-lg`}>
              {tier.icon}
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{tier.name}</CardTitle>
          <CardDescription className="text-base mt-2">{tier.description}</CardDescription>
          
          <div className="mt-6">
            <div className="flex items-baseline justify-center">
              {tier.isFree ? (
                <span className="text-5xl font-bold text-green-600">Free</span>
              ) : (
                <>
                  <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-xl text-gray-500 ml-2">/{tier.period}</span>
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
            onClick={handleChoosePlan}
            disabled={isProcessing}
            className={`w-full text-lg py-6 font-semibold transition-all duration-300 ${
              tier.popular 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg' 
                : 'bg-gray-800 hover:bg-gray-900 text-white'
            } ${
              isSelected ? 'ring-4 ring-purple-500' : ''
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : isSelected ? (
              '✓ Selected'
            ) : (
              `Choose ${tier.name}`
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

