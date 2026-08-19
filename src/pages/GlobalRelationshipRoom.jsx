import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Globe2, Radio, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import { getRoomSchedule } from '@/lib/globalRelationshipRoomService';
import RoomScheduleViewer from '@/components/global-room/RoomScheduleViewer';

const translations = {
  en: {
    title: 'O2OL Global Relationship Room',
    tagline: 'One Room. Many Voices. Stronger Relationships.',
    intro: 'A 24-hour relationship-focused room featuring One2OneLove programming, approved creators, special conversations, and replays.',
    creatorTitle: 'Create in the Room',
    creatorCopy: 'Approved free creator accounts can self-book open programming times, initially up to 2 slots per day.',
    creatorButton: 'Creator Access',
    disclaimerTitle: 'Disclaimer',
    disclaimer: 'Programming, opinions, statements, and advice presented by third-party creators are their own and do not necessarily represent the views of One2OneLove or ERANT Property Services LLC.',
    twentyFour: '24-hour programming',
    voices: 'Multiple voices',
    moderated: 'Moderated creator access',
    replay: 'Replay-ready schedule',
  },
  es: {
    title: 'Sala Global de Relaciones O2OL',
    tagline: 'Una sala. Muchas voces. Relaciones más fuertes.',
    intro: 'Una sala de relaciones de 24 horas con programación de One2OneLove, creadores aprobados, conversaciones especiales y repeticiones.',
    creatorTitle: 'Crea en la Sala',
    creatorCopy: 'Las cuentas gratuitas de creadores aprobados pueden reservar horarios disponibles, inicialmente hasta 2 espacios por día.',
    creatorButton: 'Acceso para Creadores',
    disclaimerTitle: 'Aviso',
    disclaimer: 'La programación, opiniones, declaraciones y consejos de creadores externos les pertenecen y no representan necesariamente las opiniones de One2OneLove o ERANT Property Services LLC.',
    twentyFour: 'Programación 24 horas',
    voices: 'Múltiples voces',
    moderated: 'Acceso moderado de creadores',
    replay: 'Horario preparado para repeticiones',
  },
  fr: {
    title: 'Salle Mondiale des Relations O2OL',
    tagline: 'Une salle. Plusieurs voix. Des relations plus fortes.',
    intro: 'Une salle relationnelle ouverte 24 h/24 avec des programmes One2OneLove, des créateurs approuvés, des conversations spéciales et des rediffusions.',
    creatorTitle: 'Créez dans la Salle',
    creatorCopy: 'Les comptes créateurs gratuits approuvés peuvent réserver eux-mêmes les créneaux disponibles, initialement jusqu’à 2 créneaux par jour.',
    creatorButton: 'Accès Créateur',
    disclaimerTitle: 'Avis',
    disclaimer: 'Les programmes, opinions, déclarations et conseils des créateurs tiers leur appartiennent et ne représentent pas nécessairement les positions de One2OneLove ou ERANT Property Services LLC.',
    twentyFour: 'Programmation 24 h/24',
    voices: 'Voix multiples',
    moderated: 'Accès créateur modéré',
    replay: 'Programme compatible avec les rediffusions',
  },
  it: {
    title: 'Sala Globale delle Relazioni O2OL',
    tagline: 'Una sala. Molte voci. Relazioni più forti.',
    intro: 'Una sala dedicata alle relazioni attiva 24 ore su 24 con programmi One2OneLove, creator approvati, conversazioni speciali e repliche.',
    creatorTitle: 'Crea nella Sala',
    creatorCopy: 'Gli account creator gratuiti approvati possono prenotare autonomamente gli spazi disponibili, inizialmente fino a 2 slot al giorno.',
    creatorButton: 'Accesso Creator',
    disclaimerTitle: 'Avviso',
    disclaimer: 'Programmi, opinioni, dichiarazioni e consigli dei creator terzi appartengono ai rispettivi autori e non rappresentano necessariamente le opinioni di One2OneLove o ERANT Property Services LLC.',
    twentyFour: 'Programmazione 24 ore',
    voices: 'Molteplici voci',
    moderated: 'Accesso creator moderato',
    replay: 'Programmazione pronta per le repliche',
  },
  de: {
    title: 'O2OL Globaler Beziehungsraum',
    tagline: 'Ein Raum. Viele Stimmen. Stärkere Beziehungen.',
    intro: 'Ein 24-Stunden-Beziehungsraum mit One2OneLove-Programmen, zugelassenen Creators, besonderen Gesprächen und Wiederholungen.',
    creatorTitle: 'Im Raum erstellen',
    creatorCopy: 'Zugelassene kostenlose Creator-Konten können freie Programmzeiten selbst buchen, zunächst bis zu 2 Slots pro Tag.',
    creatorButton: 'Creator-Zugang',
    disclaimerTitle: 'Hinweis',
    disclaimer: 'Programme, Meinungen, Aussagen und Ratschläge externer Creators sind deren eigene und entsprechen nicht notwendigerweise den Ansichten von One2OneLove oder ERANT Property Services LLC.',
    twentyFour: '24-Stunden-Programm',
    voices: 'Viele Stimmen',
    moderated: 'Moderierter Creator-Zugang',
    replay: 'Wiederholungsfähiger Zeitplan',
  },
};

export default function GlobalRelationshipRoom() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);

  const { data, isLoading } = useQuery({
    queryKey: ['globalRelationshipRoom', now.toISOString().slice(0, 10)],
    queryFn: () => getRoomSchedule(now.toISOString(), end.toISOString()),
    staleTime: 60 * 1000,
  });

  const slots = data?.success ? data.slots : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50">
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-rose-100 bg-white/90 p-6 shadow-sm md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                  <Radio className="h-4 w-4" /> O2OL
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
                <p className="mt-3 text-xl font-semibold text-rose-700">{t.tagline}</p>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.intro}</p>
              </div>
              <Globe2 className="h-24 w-24 text-rose-200 md:h-32 md:w-32" aria-hidden="true" />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[['clock', t.twentyFour], ['voices', t.voices], ['shield', t.moderated], ['replay', t.replay]].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {key === 'clock' && <Clock3 className="h-4 w-4 text-rose-600" />}
                  {key === 'voices' && <Users className="h-4 w-4 text-rose-600" />}
                  {key === 'shield' && <ShieldCheck className="h-4 w-4 text-rose-600" />}
                  {key === 'replay' && <Radio className="h-4 w-4 text-rose-600" />}
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
            <RoomScheduleViewer slots={slots} isLoading={isLoading} />

            <div className="space-y-6">
              <Card className="rounded-3xl border-rose-100 bg-rose-50/60">
                <CardHeader><CardTitle>{t.creatorTitle}</CardTitle></CardHeader>
                <CardContent>
                  <p className="leading-6 text-slate-600">{t.creatorCopy}</p>
                  <Button className="mt-5 w-full" asChild>
                    <Link to="/RoomCreatorAccess">{t.creatorButton}</Link>
                  </Button>
                </CardContent>
              </Card>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <div className="mb-1 flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> {t.disclaimerTitle}</div>
                {t.disclaimer}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
