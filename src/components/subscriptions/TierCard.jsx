import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { handleSubscriptionCheckout } from '@/lib/stripeService';
import { useLanguage } from '@/Layout';
import { toast } from 'sonner';

const translations = {
  en: { popular: 'MOST POPULAR', free: 'Free', processing: 'Processing…', selected: 'Selected', choose: 'Choose', current: 'You are already on the Basic plan.', failed: 'Billing could not be started. Please try again later.' },
  es: { popular: 'MÁS POPULAR', free: 'Gratis', processing: 'Procesando…', selected: 'Seleccionado', choose: 'Elegir', current: 'Ya tienes el plan Basic.', failed: 'No se pudo iniciar la facturación. Inténtalo de nuevo más tarde.' },
  fr: { popular: 'LE PLUS POPULAIRE', free: 'Gratuit', processing: 'Traitement…', selected: 'Sélectionné', choose: 'Choisir', current: 'Vous utilisez déjà le forfait Basic.', failed: 'La facturation n’a pas pu démarrer. Réessayez plus tard.' },
  it: { popular: 'PIÙ POPOLARE', free: 'Gratis', processing: 'Elaborazione…', selected: 'Selezionato', choose: 'Scegli', current: 'Stai già utilizzando il piano Basic.', failed: 'Non è stato possibile avviare la fatturazione. Riprova più tardi.' },
  de: { popular: 'AM BELIEBTESTEN', free: 'Kostenlos', processing: 'Wird verarbeitet…', selected: 'Ausgewählt', choose: 'Wählen', current: 'Du nutzt bereits den Basic-Tarif.', failed: 'Die Abrechnung konnte nicht gestartet werden. Bitte später erneut versuchen.' },
};

export default function TierCard({ tier, index, onSelect, isSelected, showPayment = false }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const handleChoosePlan = async () => {
    if (onSelect && !showPayment) {
      onSelect(tier);
      return;
    }

    if (!showPayment) {
      onSelect?.(tier);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await handleSubscriptionCheckout({
        name: tier.name,
        price: tier.price || 0,
        isFree: Boolean(tier.isFree) || tier.price === 0,
      });

      if (!result.success) {
        toast.error(result.error || t.failed);
        return;
      }

      if (result.alreadyCurrent) toast.info(t.current);
      // Paid checkout and billing management redirect inside stripeService.
    } catch {
      toast.error(t.failed);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className={`relative flex h-full flex-col transition-all duration-300 hover:shadow-xl ${tier.popular ? 'border-4 border-purple-400' : 'border-2 hover:border-purple-200'} ${isSelected ? 'ring-4 ring-purple-500 ring-offset-2' : ''}`}>
        {tier.popular && (
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 text-sm font-bold text-white shadow-lg">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t.popular}
            </span>
          </div>
        )}

        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${tier.gradient} text-4xl shadow-lg`} aria-hidden="true">{tier.icon}</div>
          </div>
          <CardTitle className="text-3xl font-bold">{tier.displayName || tier.name}</CardTitle>
          <CardDescription className="mt-2 text-base">{tier.description}</CardDescription>
          <div className="mt-6 flex items-baseline justify-center">
            {tier.isFree ? (
              <span className="text-5xl font-bold text-green-600">{t.free}</span>
            ) : (
              <>
                <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                <span className="ml-2 text-xl text-gray-500">/{tier.period}</span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-grow flex-col">
          <ul className="mb-6 flex-grow space-y-3">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" aria-hidden="true" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Button type="button" onClick={handleChoosePlan} disabled={isProcessing || (isSelected && showPayment)} className={`w-full py-6 text-lg font-semibold ${tier.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' : 'bg-gray-800 text-white hover:bg-gray-900'}`}>
            {isProcessing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />{t.processing}</>
            ) : isSelected ? (
              `✓ ${t.selected}`
            ) : (
              `${t.choose} ${tier.displayName || tier.name}`
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
