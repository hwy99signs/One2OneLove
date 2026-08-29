import React from 'react';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    eyebrow: 'Built for married couples',
    title: 'Marriage Matters',
    copy: 'Marriage needs encouragement, attention, fun, and connection long after the wedding day. This space is designed specifically for that.',
    button: 'Enter Marriage Matters',
  },
  es: {
    eyebrow: 'Creado para matrimonios',
    title: 'El Matrimonio Importa',
    copy: 'El matrimonio necesita ánimo, atención, diversión y conexión mucho después del día de la boda. Este espacio fue creado específicamente para eso.',
    button: 'Entrar a El Matrimonio Importa',
  },
  fr: {
    eyebrow: 'Créé pour les couples mariés',
    title: 'Le Mariage Compte',
    copy: 'Le mariage a besoin d’encouragement, d’attention, de plaisir et de connexion bien après le jour du mariage. Cet espace est conçu spécialement pour cela.',
    button: 'Entrer dans Le Mariage Compte',
  },
  it: {
    eyebrow: 'Creato per le coppie sposate',
    title: 'Il Matrimonio Conta',
    copy: 'Il matrimonio ha bisogno di incoraggiamento, attenzione, divertimento e connessione molto dopo il giorno delle nozze. Questo spazio è stato creato proprio per questo.',
    button: 'Entra in Il Matrimonio Conta',
  },
  de: {
    eyebrow: 'Für Ehepaare gemacht',
    title: 'Ehe Zählt',
    copy: 'Eine Ehe braucht lange nach dem Hochzeitstag Ermutigung, Aufmerksamkeit, Freude und Verbindung. Dieser Bereich ist genau dafür gemacht.',
    button: 'Ehe Zählt öffnen',
  },
};

export default function MarriageMattersPromo() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="px-4 py-10 md:py-14" aria-labelledby="marriage-matters-promo-title">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-6 shadow-sm md:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-700">
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              {t.eyebrow}
            </div>
            <h2 id="marriage-matters-promo-title" className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">{t.title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.copy}</p>
          </div>

          <Button asChild size="lg" className="shrink-0">
            <Link to="/MarriageMatters">
              {t.button}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
