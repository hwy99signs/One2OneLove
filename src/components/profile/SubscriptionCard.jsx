import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Crown, Heart, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { getUserSubscription } from '@/lib/stripeService';
import {
  ACTIVE_MEMBERSHIP_STATUSES,
  FREE_FEATURE_HIGHLIGHTS,
  MEMBERSHIP_FEATURE_HIGHLIGHTS,
  MEMBERSHIP_PRICING,
  formatMembershipPrice,
} from '@/lib/membershipConfig';

const translations = {
  en: {
    current: 'Current access', free: 'Free Account', member: 'One2OneLove Membership', alwaysFree: 'Always free',
    included: 'Included now', membershipAdds: 'Membership adds', view: 'View Membership', manage: 'Manage Membership',
    loading: 'Checking membership…', intro: 'for the first 6 months', then: 'then', monthly: '/ month',
  },
  es: {
    current: 'Acceso actual', free: 'Cuenta Gratis', member: 'Membresía One2OneLove', alwaysFree: 'Siempre gratis',
    included: 'Incluido ahora', membershipAdds: 'La membresía añade', view: 'Ver Membresía', manage: 'Administrar Membresía',
    loading: 'Comprobando membresía…', intro: 'durante los primeros 6 meses', then: 'luego', monthly: '/ mes',
  },
  fr: {
    current: 'Accès actuel', free: 'Compte Gratuit', member: 'Adhésion One2OneLove', alwaysFree: 'Toujours gratuit',
    included: 'Inclus maintenant', membershipAdds: 'L’adhésion ajoute', view: 'Voir l’Adhésion', manage: 'Gérer l’Adhésion',
    loading: 'Vérification de l’adhésion…', intro: 'pendant les 6 premiers mois', then: 'puis', monthly: '/ mois',
  },
  it: {
    current: 'Accesso attuale', free: 'Account Gratuito', member: 'Abbonamento One2OneLove', alwaysFree: 'Sempre gratis',
    included: 'Incluso ora', membershipAdds: 'L’abbonamento aggiunge', view: 'Vedi Abbonamento', manage: 'Gestisci Abbonamento',
    loading: 'Controllo abbonamento…', intro: 'per i primi 6 mesi', then: 'poi', monthly: '/ mese',
  },
  de: {
    current: 'Aktueller Zugang', free: 'Kostenloses Konto', member: 'One2OneLove Mitgliedschaft', alwaysFree: 'Immer kostenlos',
    included: 'Jetzt enthalten', membershipAdds: 'Mitgliedschaft ergänzt', view: 'Mitgliedschaft ansehen', manage: 'Mitgliedschaft verwalten',
    loading: 'Mitgliedschaft wird geprüft…', intro: 'für die ersten 6 Monate', then: 'danach', monthly: '/ Monat',
  },
  nl: {
    current: 'Huidige toegang', free: 'Gratis Account', member: 'One2OneLove Lidmaatschap', alwaysFree: 'Altijd gratis',
    included: 'Nu inbegrepen', membershipAdds: 'Lidmaatschap voegt toe', view: 'Lidmaatschap Bekijken', manage: 'Lidmaatschap Beheren',
    loading: 'Lidmaatschap controleren…', intro: 'voor de eerste 6 maanden', then: 'daarna', monthly: '/ maand',
  },
};

function SmallList({ items, tone = 'free' }) {
  return (
    <div className="space-y-2">
      {items.slice(0, 4).map((item) => (
        <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'paid' ? 'text-purple-600' : 'text-green-600'}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function SubscriptionCard({ currentLanguage = 'en' }) {
  const t = translations[currentLanguage] || translations.en;
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
  }, []);

  const active = ACTIVE_MEMBERSHIP_STATUSES.has(membership?.status);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card className={`border-2 shadow-xl ${active ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : 'border-green-200 bg-gradient-to-br from-green-50 to-white'}`}>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${active ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-green-100'}`}>
                {active ? <Crown className="h-6 w-6 text-white" /> : <Heart className="h-6 w-6 fill-current text-green-700" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{t.current}</p>
                <h3 className="text-2xl font-black text-gray-900">{active ? t.member : t.free}</h3>
              </div>
            </div>
            <div className="text-right">
              {loading ? (
                <span className="inline-flex items-center text-sm font-medium text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.loading}</span>
              ) : active ? (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-800">Active</span>
              ) : (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">{t.alwaysFree}</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h4 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
              <Sparkles className="h-4 w-4 text-green-600" />
              {t.included}
            </h4>
            <SmallList items={FREE_FEATURE_HIGHLIGHTS} />
          </div>

          {!active && (
            <div className="rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 p-4">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-gray-900">
                <Crown className="h-4 w-4 text-purple-700" />
                {t.membershipAdds}
              </h4>
              <SmallList items={MEMBERSHIP_FEATURE_HIGHLIGHTS} tone="paid" />
              <p className="mt-4 text-sm font-semibold text-purple-900">
                {formatMembershipPrice(MEMBERSHIP_PRICING.introMonthly)} {t.monthly} {t.intro}; {t.then} {formatMembershipPrice(MEMBERSHIP_PRICING.standardMonthly)} {t.monthly}.
              </p>
            </div>
          )}

          <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Link to="/Subscription">
              {active ? t.manage : t.view}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
