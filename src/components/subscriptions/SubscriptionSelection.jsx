import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TierCard from './TierCard';

export default function SubscriptionSelection({ onBack, onSelectPlan }) {
  const [selectedTier, setSelectedTier] = useState(null);

  const tiers = [
    {
      name: 'Basis',
      price: 0,
      period: 'month',
      description: 'Perfect for couples starting their journey',
      icon: '💝',
      gradient: 'from-blue-400 to-blue-600',
      popular: false,
      isFree: true,
      features: [
        'Access to 50+ Love Notes Library',
        'Basic Relationship Quizzes',
        'Monthly Date Ideas (5 ideas)',
        'Anniversary Reminders',
        'Digital Memory Timeline',
        'Mobile App Access',
        'Email Support'
      ]
    },
    {
      name: 'Premiere',
      price: 19.99,
      period: 'month',
      description: 'For couples ready to deepen their connection',
      icon: '💖',
      gradient: 'from-purple-400 to-pink-500',
      popular: true,
      features: [
        'Everything in Basis, plus:',
        '1000+ Love Notes Library',
        'AI Relationship Coach (50 questions/month)',
        'Unlimited Date Ideas with Filters',
        'Relationship Goals Tracker',
        'Advanced Quizzes & Compatibility Tests',
        'Schedule Surprise Messages',
        'Ad-Free Experience',
        'Priority Support',
        'Early Access to New Features'
      ]
    },
    {
      name: 'Exclusive',
      price: 34.99,
      period: 'month',
      description: 'The ultimate experience for committed couples',
      icon: '👑',
      gradient: 'from-yellow-400 to-orange-500',
      popular: false,
      features: [
        'Everything in Premiere, plus:',
        'Unlimited Love Notes Library',
        'Unlimited AI Relationship Coach',
        'AI Content Creator (poems, letters)',
        'Personalized Relationship Reports',
        'Exclusive Couples Community Access',
        'Monthly Contest Entry for Prizes',
        'LGBTQ+ Specialized Resources',
        '1-on-1 Expert Consultation (1/month)',
        'Premium WhatsApp Support',
        'Exclusive Discounts on Lovers Store',
        'VIP Badge & Recognition'
      ]
    }
  ];

  const handleSelectTier = (tier) => {
    setSelectedTier(tier);
  };

  const handleContinue = () => {
    if (selectedTier) {
      onSelectPlan(selectedTier);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-6 py-16">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-pink-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choose Your Love Journey
            </h1>
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Select the perfect plan to strengthen your relationship and create lasting memories together
          </p>
        </motion.div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {tiers.map((tier, index) => (
            <TierCard 
              key={tier.name} 
              tier={tier} 
              index={index} 
              onSelect={handleSelectTier}
              isSelected={selectedTier?.name === tier.name}
            />
          ))}
        </div>

        {/* Continue Button */}
        {selectedTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <Button
              onClick={handleContinue}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-xl px-12 py-6 shadow-lg"
            >
              Continue with {selectedTier.name}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 text-sm">
            💜 All plans include a 14-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Prices shown in USD. Special discounts available for annual subscriptions.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

