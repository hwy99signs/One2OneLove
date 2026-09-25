import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TierCard from './TierCard';
import { subscriptionPlanCopy } from '@/data/subscriptionPlanCopy';

export default function SubscriptionSelection({ onBack, onSelectPlan }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const copy = subscriptionPlanCopy.en;

  const tiers = [
    {
      name: 'Premiere',
      price: 9.99,
      period: 'month',
      description: copy.plans.Premiere.description,
      icon: '💖',
      gradient: 'from-purple-400 to-pink-500',
      popular: true,
      features: copy.plans.Premiere.features,
    },
    {
      name: 'Exclusive',
      price: 19.99,
      period: 'month',
      description: copy.plans.Exclusive.description,
      icon: '👑',
      gradient: 'from-yellow-400 to-orange-500',
      popular: false,
      features: copy.plans.Exclusive.features,
    },
  ];

  const handleContinue = () => {
    if (selectedTier) onSelectPlan(selectedTier);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <Button variant="ghost" onClick={onBack} className="gap-2 hover:bg-white/50">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Create Your One2OneLove Account</h1>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">{copy.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-10">
          {tiers.map((tier, index) => (
            <TierCard
              key={tier.name}
              tier={tier}
              index={index}
              onSelect={setSelectedTier}
              isSelected={selectedTier?.name === tier.name}
            />
          ))}
        </div>

        {selectedTier && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
            <Button onClick={handleContinue} size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-xl px-12 py-6 shadow-lg">
              Continue with {selectedTier.name}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-12 mx-auto max-w-4xl rounded-2xl border border-purple-200 bg-white p-6 text-sm leading-6 text-gray-700">
          <p className="font-semibold text-gray-900">24-hour Guest Preview: no card required, VIEW ONLY.</p>
          <p>Create an account to begin the 24-hour view-only preview. Then start 7 days of Full Access with a card. The subscription price is not charged when the trial begins. The trial includes full Exclusive-level access and automatically continues on Premiere at US$9.99/month unless you choose Exclusive or cancel before the trial ends.</p>
          <p>Love Note SMS sending is unavailable during the view-only Guest Preview. During the 7-day Full Access trial, your first One2OneLove SMS Love Note send is FREE; every additional send is US$0.29 and is billed to your payment method on file. Usage charges may be grouped.</p>
          <p className="text-xs text-gray-500">All prices are shown in U.S. dollars (US$). Cancel anytime; cancellation takes effect at the end of the current billing period. Love Note usage charges already incurred remain due.</p>
        </motion.div>
      </div>
    </div>
  );
}
