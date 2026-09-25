import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { subscriptionPlanCopy } from '@/data/subscriptionPlanCopy';

const planMeta = {
  Premiere: { icon: '💖', gradient: 'from-purple-400 to-pink-500', price: 9.99 },
  Exclusive: { icon: '👑', gradient: 'from-yellow-400 to-orange-500', price: 19.99 },
};

const translations = {
  en: { currentPlan: 'Current Plan', guest: 'Guest Preview — View Only', trial: 'Full Access Trial', viewPlans: 'View Plans & Billing Terms', planFeatures: 'Plan Features', perMonth: 'per month', moreFeatures: 'more features' },
  es: { currentPlan: 'Plan Actual', guest: 'Vista Previa — Solo Ver', trial: 'Prueba de Acceso Completo', viewPlans: 'Ver Planes y Condiciones de Facturación', planFeatures: 'Características del Plan', perMonth: 'por mes', moreFeatures: 'funciones más' },
  fr: { currentPlan: 'Plan Actuel', guest: 'Aperçu Invité — Consultation Uniquement', trial: 'Essai Accès Complet', viewPlans: 'Voir les Formules et Conditions de Facturation', planFeatures: 'Fonctionnalités du Plan', perMonth: 'par mois', moreFeatures: 'fonctionnalités supplémentaires' },
  it: { currentPlan: 'Piano Attuale', guest: 'Anteprima Ospite — Solo Visualizzazione', trial: 'Prova Accesso Completo', viewPlans: 'Vedi Piani e Condizioni di Fatturazione', planFeatures: 'Caratteristiche del Piano', perMonth: 'al mese', moreFeatures: 'altre funzionalità' },
  de: { currentPlan: 'Aktueller Plan', guest: 'Gastvorschau — Nur Ansehen', trial: 'Vollzugriff-Test', viewPlans: 'Tarife & Abrechnungsbedingungen Anzeigen', planFeatures: 'Plan-Funktionen', perMonth: 'pro Monat', moreFeatures: 'weitere Funktionen' },
};

function previewActive(user) {
  if (user?.stripe_subscription_id) return false;
  const created = user?.created_at ? new Date(user.created_at) : null;
  return Boolean(created && !Number.isNaN(created.getTime()) && Date.now() - created.getTime() < 24 * 60 * 60 * 1000);
}

export default function SubscriptionCard({ user, currentLanguage = 'en' }) {
  const t = translations[currentLanguage] || translations.en;
  const planData = subscriptionPlanCopy[currentLanguage] || subscriptionPlanCopy.en;
  const status = String(user?.subscription_status || '').toLowerCase();
  const isTrial = status === 'trial' || status === 'trialing';
  const isGuest = previewActive(user);
  const rawPlan = String(user?.subscription_plan || 'Premiere');
  const userPlan = rawPlan === 'Exclusive' ? 'Exclusive' : 'Premiere';
  const planInfo = planMeta[userPlan];
  const planCopy = planData.plans[userPlan];

  const heading = isGuest ? t.guest : isTrial ? t.trial : planCopy.displayName;
  const priceLabel = isGuest ? '24 hours' : isTrial ? '7 days' : `US${planInfo.price}`;
  const priceSub = isGuest ? 'view only · no card required' : isTrial ? 'subscription price not charged today' : t.perMonth;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className="shadow-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${planInfo.gradient} rounded-xl flex items-center justify-center shadow-lg`}><span className="text-2xl">{planInfo.icon}</span></div>
              <div><p className="text-sm text-gray-600">{t.currentPlan}</p><h3 className="text-2xl font-bold text-gray-900">{heading}</h3></div>
            </div>
            <div className="text-right"><div className="text-2xl font-bold text-gray-900">{priceLabel}</div><div className="text-xs text-gray-600">{priceSub}</div></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" />{t.planFeatures}</h4>
            <div className="space-y-2">
              {planCopy.features.slice(0, 5).map((feature, index) => <div key={index} className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /><span className="text-sm text-gray-700">{feature}</span></div>)}
              {planCopy.features.length > 5 && <p className="text-sm text-gray-500 italic">+ {planCopy.features.length - 5} {t.moreFeatures}</p>}
            </div>
          </div>
          <Link to={createPageUrl('Subscription')}><Button variant="outline" className="w-full">{t.viewPlans}<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
