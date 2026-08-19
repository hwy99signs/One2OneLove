import React from 'react';
import { Globe2, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    eyebrow: 'New from One2OneLove',
    title: 'O2OL Global Relationship Room',
    tagline: 'One Room. Many Voices. Stronger Relationships.',
    copy: 'Explore relationship-focused programming around the clock—from One2OneLove conversations to approved creators and replays.',
    button: 'Enter the Global Room',
    creator: 'Creator Access',
    trust: 'Creator programming is moderated and clearly distinguished from official One2OneLove views.',
  },
  es: {
    eyebrow: 'Nuevo de One2OneLove',
    title: 'Sala Global de Relaciones O2OL',
    tagline: 'Una sala. Muchas voces. Relaciones más fuertes.',
    copy: 'Explora programación sobre relaciones las 24 horas, desde conversaciones de One2OneLove hasta creadores aprobados y repeticiones.',
    button: 'Entrar a la Sala Global',
    creator: 'Acceso para Creadores',
    trust: 'La programación de creadores es moderada y se distingue claramente de las opiniones oficiales de One2OneLove.',
  },
  fr: {
    eyebrow: 'Nouveau chez One2OneLove',
    title: 'Salle Mondiale des Relations O2OL',
    tagline: 'Une salle. Plusieurs voix. Des relations plus fortes.',
    copy: 'Découvrez des programmes consacrés aux relations 24 h/24, des conversations One2OneLove aux créateurs approuvés et aux rediffusions.',
    button: 'Entrer dans la Salle Mondiale',
    creator: 'Accès Créateur',
    trust: 'Les programmes des créateurs sont modérés et clairement distingués des positions officielles de One2OneLove.',
  },
  it: {
    eyebrow: 'Novità da One2OneLove',
    title: 'Sala Globale delle Relazioni O2OL',
    tagline: 'Una sala. Molte voci. Relazioni più forti.',
    copy: 'Scopri programmi dedicati alle relazioni 24 ore su 24, dalle conversazioni One2OneLove ai creator approvati e alle repliche.',
    button: 'Entra nella Sala Globale',
    creator: 'Accesso Creator',
    trust: 'I programmi dei creator sono moderati e chiaramente distinti dalle posizioni ufficiali di One2OneLove.',
  },
  de: {
    eyebrow: 'Neu von One2OneLove',
    title: 'O2OL Globaler Beziehungsraum',
    tagline: 'Ein Raum. Viele Stimmen. Stärkere Beziehungen.',
    copy: 'Entdecke rund um die Uhr Beziehungsprogramme – von One2OneLove-Gesprächen bis zu zugelassenen Creators und Wiederholungen.',
    button: 'Globalen Raum Betreten',
    creator: 'Creator-Zugang',
    trust: 'Creator-Programme werden moderiert und klar von offiziellen One2OneLove-Positionen unterschieden.',
  },
};

export default function GlobalRoomPromo() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="bg-gradient-to-br from-rose-50 via-white to-cyan-50 px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="p-7 md:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
              <Radio className="h-4 w-4" /> {t.eyebrow}
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t.title}</h2>
            <p className="mt-2 text-xl font-semibold text-rose-700">{t.tagline}</p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.copy}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link to="/GlobalRelationshipRoom">{t.button}</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/RoomCreatorAccess">{t.creator}</Link></Button>
            </div>

            <div className="mt-6 flex items-start gap-2 text-sm leading-6 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{t.trust}</span>
            </div>
          </div>

          <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-cyan-100 p-8">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-white/70 bg-white/70 shadow-sm backdrop-blur">
              <Globe2 className="h-24 w-24 text-rose-400" aria-hidden="true" />
              <div className="absolute bottom-4 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">O2OL • 24/7</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
