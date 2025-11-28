import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Check, ArrowRight, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const planFeatures = {
  'Basic': {
    icon: '💝',
    gradient: 'from-blue-400 to-blue-600',
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
  'Premiere': {
    icon: '💖',
    gradient: 'from-purple-400 to-pink-500',
    features: [
      'Everything in Basic, plus:',
      '1000+ Love Notes Library',
      'AI Relationship Coach (50 questions/month)',
      'Unlimited Date Ideas with Filters',
      'Relationship Goals Tracker',
      'Advanced Quizzes & Compatibility Tests',
      'Schedule Surprise Messages',
      'Ad-Free Experience',
      'Priority Support'
    ]
  },
  'Exclusive': {
    icon: '👑',
    gradient: 'from-yellow-400 to-orange-500',
    features: [
      'Everything in Premiere, plus:',
      'Unlimited Love Notes Library',
      'Unlimited AI Relationship Coach',
      'AI Content Creator (poems, letters)',
      'Personalized Relationship Reports',
      'Exclusive Couples Community Access',
      '1-on-1 Expert Consultation (1/month)',
      'Premium WhatsApp Support',
      'VIP Badge & Recognition'
    ]
  }
};

const planPrices = {
  'Basic': { price: 0, period: 'month', label: 'FREE' },
  'Premiere': { price: 19.99, period: 'month', label: '$19.99' },
  'Exclusive': { price: 34.99, period: 'month', label: '$34.99' }
};

const translations = {
  en: {
    currentPlan: 'Current Plan',
    freePlan: 'FREE Plan',
    upgrade: 'Upgrade Plan',
    viewPlans: 'View All Plans',
    planFeatures: 'Plan Features',
    unlockMore: 'Unlock More Features',
    perMonth: 'per month'
  },
  es: {
    currentPlan: 'Plan Actual',
    freePlan: 'Plan GRATIS',
    upgrade: 'Mejorar Plan',
    viewPlans: 'Ver Todos los Planes',
    planFeatures: 'Características del Plan',
    unlockMore: 'Desbloquear Más Funciones',
    perMonth: 'por mes'
  },
  fr: {
    currentPlan: 'Plan Actuel',
    freePlan: 'Plan GRATUIT',
    upgrade: 'Améliorer le Plan',
    viewPlans: 'Voir Tous les Plans',
    planFeatures: 'Fonctionnalités du Plan',
    unlockMore: 'Débloquer Plus de Fonctionnalités',
    perMonth: 'par mois'
  },
  it: {
    currentPlan: 'Piano Attuale',
    freePlan: 'Piano GRATUITO',
    upgrade: 'Aggiorna Piano',
    viewPlans: 'Visualizza Tutti i Piani',
    planFeatures: 'Caratteristiche del Piano',
    unlockMore: 'Sblocca Altre Funzionalità',
    perMonth: 'al mese'
  },
  de: {
    currentPlan: 'Aktueller Plan',
    freePlan: 'KOSTENLOSER Plan',
    upgrade: 'Plan Upgraden',
    viewPlans: 'Alle Pläne Anzeigen',
    planFeatures: 'Plan-Funktionen',
    unlockMore: 'Mehr Funktionen Freischalten',
    perMonth: 'pro Monat'
  }
};

export default function SubscriptionCard({ user, currentLanguage = 'en' }) {
  const t = translations[currentLanguage] || translations.en;
  // Normalize 'Basis' to 'Basic' for display
  const normalizePlan = (plan) => {
    if (!plan) return 'Basic';
    return plan === 'Basis' ? 'Basic' : plan;
  };
  const userPlan = normalizePlan(user?.subscription_plan) || 'Basic';
  // Safely get plan info with proper fallback
  const planInfo = planFeatures[userPlan] || planFeatures['Basic'] || {
    icon: '💝',
    gradient: 'from-blue-400 to-blue-600',
    features: ['Basic features included']
  };
  const priceInfo = planPrices[userPlan] || planPrices['Basic'] || { price: 0, period: 'month', label: 'FREE' };
  const isFree = userPlan === 'Basic' || !userPlan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={`shadow-xl border-2 ${isFree ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isFree ? (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">{planInfo.icon}</span>
                </div>
              ) : (
                <div className={`w-12 h-12 bg-gradient-to-br ${planInfo.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{planInfo.icon}</span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">{t.currentPlan}</p>
                <h3 className="text-2xl font-bold text-gray-900">{userPlan}</h3>
              </div>
            </div>
            <div className="text-right">
              {isFree ? (
                <div className="text-2xl font-bold text-green-600">FREE</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">${priceInfo.price}</div>
                  <div className="text-xs text-gray-600">{t.perMonth}</div>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Features */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              {t.planFeatures}
            </h4>
            <div className="space-y-2">
              {planInfo.features.slice(0, 5).map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              {planInfo.features.length > 5 && (
                <p className="text-sm text-gray-500 italic">
                  + {planInfo.features.length - 5} more features
                </p>
              )}
            </div>
          </div>

          {/* Upgrade Section */}
          {isFree && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <Crown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-gray-900 mb-1">{t.unlockMore}</h5>
                  <p className="text-sm text-gray-700">
                    Upgrade to Premiere or Exclusive for unlimited features!
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("Subscription")}>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  {t.upgrade}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

          {/* View All Plans Button */}
          <Link to={createPageUrl("Subscription")}>
            <Button variant="outline" className="w-full">
              {t.viewPlans}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

