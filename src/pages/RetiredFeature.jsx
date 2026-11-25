import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Home } from 'lucide-react';
import { useLanguage } from '@/Layout';

// Retired features (owner decision, 2026-11-25): One2OneLove is now a
// completely free relationship platform. The features that cost money every
// time someone used them — Amora / AI Relationship Coach chat, the AI
// Content Creator, AI Love Note writing, AI reports and Love Note texting
// (SMS) — were switched off instead of charged for. Everything else on the
// site is free for everyone, with no signup and no card.
const COPY = {
  en: { eyebrow: 'ONE2ONELOVE', title: 'This Feature Has Been Retired', body: 'One2OneLove is now a completely free relationship platform. This feature cost money every time it was used, so it has been switched off — everything else on the site is free for everyone, with no signup and no card.', home: 'Go to Home', back: 'Go Back', features: 'See everything that is free' },
  es: { eyebrow: 'ONE2ONELOVE', title: 'Esta Función Ha Sido Retirada', body: 'One2OneLove ahora es una plataforma de relaciones completamente gratuita. Esta función costaba dinero cada vez que se usaba, así que fue desactivada; todo lo demás en el sitio es gratis para todos, sin registro y sin tarjeta.', home: 'Ir al Inicio', back: 'Volver', features: 'Ver todo lo que es gratis' },
  fr: { eyebrow: 'ONE2ONELOVE', title: 'Cette Fonction a Été Retirée', body: 'One2OneLove est désormais une plateforme relationnelle entièrement gratuite. Cette fonction coûtait de l’argent à chaque utilisation, elle a donc été désactivée — tout le reste du site est gratuit pour tout le monde, sans inscription ni carte.', home: 'Accueil', back: 'Retour', features: 'Voir tout ce qui est gratuit' },
  it: { eyebrow: 'ONE2ONELOVE', title: 'Questa Funzione È Stata Ritirata', body: 'One2OneLove ora è una piattaforma relazionale completamente gratuita. Questa funzione costava denaro a ogni utilizzo, quindi è stata disattivata — tutto il resto del sito è gratuito per tutti, senza registrazione e senza carta.', home: 'Vai alla Home', back: 'Indietro', features: 'Vedi tutto ciò che è gratuito' },
  de: { eyebrow: 'ONE2ONELOVE', title: 'Diese Funktion Wurde Eingestellt', body: 'One2OneLove ist jetzt eine komplett kostenlose Beziehungsplattform. Diese Funktion kostete bei jeder Nutzung Geld und wurde daher abgeschaltet — alles andere auf der Seite ist für alle kostenlos, ohne Anmeldung und ohne Karte.', home: 'Zur Startseite', back: 'Zurück', features: 'Alles Kostenlose ansehen' },
};
export default function RetiredFeature({ feature }) {
  const { currentLanguage } = useLanguage(); const t = COPY[currentLanguage] || COPY.en;
  return <main className="min-h-[68vh] bg-gradient-to-b from-rose-50 via-white to-sky-50 px-4 py-16">
    <section className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl">
      <Heart className="mx-auto h-14 w-14 text-rose-500" />
      <p className="mt-4 text-xs font-black uppercase tracking-[.18em] text-rose-700">{t.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">{t.title}</h1>
      {feature && <p className="mt-2 text-sm font-bold text-slate-500">{feature}</p>}
      <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">{t.body}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 font-bold text-slate-700"><ArrowLeft className="h-4 w-4" />{t.back}</button>
        <Link to="/FeaturePricing" className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-5 py-3 font-black text-rose-700">{t.features}</Link>
        <Link to="/Home" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-black text-white"><Home className="h-4 w-4" />{t.home}</Link>
      </div>
    </section>
  </main>;
}
