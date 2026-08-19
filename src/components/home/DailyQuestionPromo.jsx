import React from 'react';
import { ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    eyebrow: 'A little connection every day',
    title: 'Daily Relationship Question',
    copy: 'A fresh conversation starter each day to help couples slow down, listen, laugh, remember, and reconnect.',
    button: "See today's question",
  },
  es: {
    eyebrow: 'Un poco de conexión cada día',
    title: 'Pregunta Diaria para la Relación',
    copy: 'Una nueva pregunta cada día para ayudar a las parejas a detenerse, escuchar, reír, recordar y reconectarse.',
    button: 'Ver la pregunta de hoy',
  },
  fr: {
    eyebrow: 'Un peu de connexion chaque jour',
    title: 'Question Relationnelle du Jour',
    copy: 'Une nouvelle question chaque jour pour aider les couples à ralentir, écouter, rire, se souvenir et se reconnecter.',
    button: "Voir la question d'aujourd'hui",
  },
  it: {
    eyebrow: 'Un po’ di connessione ogni giorno',
    title: 'Domanda Quotidiana sulla Relazione',
    copy: 'Una nuova domanda ogni giorno per aiutare le coppie a rallentare, ascoltare, ridere, ricordare e riconnettersi.',
    button: 'Vedi la domanda di oggi',
  },
  de: {
    eyebrow: 'Jeden Tag ein wenig Verbindung',
    title: 'Tägliche Beziehungsfrage',
    copy: 'Jeden Tag ein neuer Gesprächsimpuls, der Paaren hilft, langsamer zu werden, zuzuhören, zu lachen, sich zu erinnern und wieder Nähe zu finden.',
    button: 'Heutige Frage ansehen',
  },
};

export default function DailyQuestionPromo() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="px-4 py-10 md:py-14" aria-labelledby="daily-question-promo-title">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-r from-pink-50 via-white to-cyan-50 p-6 shadow-sm md:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-pink-700">
              <Heart className="h-4 w-4" aria-hidden="true" />
              {t.eyebrow}
            </div>
            <h2 id="daily-question-promo-title" className="mt-3 text-2xl font-bold text-slate-900 md:text-4xl">{t.title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.copy}</p>
          </div>

          <Button asChild size="lg" className="shrink-0">
            <Link to="/DailyQuestion">
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.button}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
