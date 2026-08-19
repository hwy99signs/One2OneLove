import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: { eyebrow: 'Weekly Connection', title: 'Relationship Reset', copy: 'Ten intentional minutes to appreciate, check in, and choose one small thing that helps the week feel more connected.', cta: 'Start this week’s reset' },
  es: { eyebrow: 'Conexión Semanal', title: 'Reinicio de la Relación', copy: 'Diez minutos intencionales para apreciar, revisar cómo están y elegir una pequeña acción que ayude a sentirse más conectados esta semana.', cta: 'Comenzar el reinicio de esta semana' },
  fr: { eyebrow: 'Connexion Hebdomadaire', title: 'Reset Relationnel', copy: 'Dix minutes intentionnelles pour apprécier, faire le point et choisir une petite action qui aide la semaine à se sentir plus connectée.', cta: 'Commencer le reset de cette semaine' },
  it: { eyebrow: 'Connessione Settimanale', title: 'Reset della Relazione', copy: 'Dieci minuti intenzionali per apprezzarsi, fare il punto e scegliere una piccola azione che renda la settimana più connessa.', cta: 'Inizia il reset di questa settimana' },
  de: { eyebrow: 'Wöchentliche Verbindung', title: 'Beziehungs-Reset', copy: 'Zehn bewusste Minuten, um Wertschätzung zu zeigen, einzuchecken und eine kleine Sache für mehr Verbindung in dieser Woche zu wählen.', cta: 'Reset dieser Woche starten' },
};

export default function RelationshipResetPromo() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="bg-emerald-50 px-4 py-12" aria-labelledby="relationship-reset-promo-title">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex max-w-3xl items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><RefreshCw className="h-6 w-6" aria-hidden="true" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{t.eyebrow}</p>
            <h2 id="relationship-reset-promo-title" className="mt-1 text-3xl font-bold text-slate-900">{t.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{t.copy}</p>
          </div>
        </div>
        <Button asChild className="shrink-0 bg-emerald-600 hover:bg-emerald-700"><Link to="/RelationshipReset">{t.cta}</Link></Button>
      </div>
    </section>
  );
}
