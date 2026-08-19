import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Radio, RotateCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    schedule: 'Programming Schedule',
    liveNow: 'Live Now',
    upNext: 'Up Next',
    sevenDays: 'Next 7 Days',
    loading: 'Loading programming…',
    empty: 'No public programming is scheduled in this window yet.',
    nothingLive: 'No program is live right now.',
    noUpcoming: 'No additional programs are scheduled yet.',
    live: 'LIVE',
    official: 'One2OneLove',
    creator: 'Creator',
    replay: 'Replay',
    partner: 'Partner',
    special: 'Special',
    thirdParty: 'Third-party views are not necessarily those of One2OneLove or ERANT.',
  },
  es: {
    schedule: 'Programación',
    liveNow: 'En Vivo Ahora',
    upNext: 'A Continuación',
    sevenDays: 'Próximos 7 Días',
    loading: 'Cargando programación…',
    empty: 'Todavía no hay programación pública en este período.',
    nothingLive: 'No hay ningún programa en vivo en este momento.',
    noUpcoming: 'Todavía no hay programas adicionales programados.',
    live: 'EN VIVO',
    official: 'One2OneLove',
    creator: 'Creador',
    replay: 'Repetición',
    partner: 'Socio',
    special: 'Especial',
    thirdParty: 'Las opiniones de terceros no representan necesariamente a One2OneLove o ERANT.',
  },
  fr: {
    schedule: 'Programme',
    liveNow: 'En Direct',
    upNext: 'À Suivre',
    sevenDays: '7 Prochains Jours',
    loading: 'Chargement du programme…',
    empty: 'Aucun programme public n’est encore prévu dans cette période.',
    nothingLive: 'Aucun programme n’est en direct pour le moment.',
    noUpcoming: 'Aucun autre programme n’est encore prévu.',
    live: 'EN DIRECT',
    official: 'One2OneLove',
    creator: 'Créateur',
    replay: 'Rediffusion',
    partner: 'Partenaire',
    special: 'Spécial',
    thirdParty: 'Les opinions de tiers ne représentent pas nécessairement One2OneLove ou ERANT.',
  },
  it: {
    schedule: 'Programmazione',
    liveNow: 'In Diretta Ora',
    upNext: 'A Seguire',
    sevenDays: 'Prossimi 7 Giorni',
    loading: 'Caricamento della programmazione…',
    empty: 'Non ci sono ancora programmi pubblici previsti in questo intervallo.',
    nothingLive: 'Nessun programma è in diretta in questo momento.',
    noUpcoming: 'Non ci sono ancora altri programmi in calendario.',
    live: 'IN DIRETTA',
    official: 'One2OneLove',
    creator: 'Creator',
    replay: 'Replica',
    partner: 'Partner',
    special: 'Speciale',
    thirdParty: 'Le opinioni di terzi non rappresentano necessariamente One2OneLove o ERANT.',
  },
  de: {
    schedule: 'Programmplan',
    liveNow: 'Jetzt Live',
    upNext: 'Als Nächstes',
    sevenDays: 'Nächste 7 Tage',
    loading: 'Programm wird geladen…',
    empty: 'Für diesen Zeitraum ist noch kein öffentliches Programm geplant.',
    nothingLive: 'Derzeit läuft kein Programm live.',
    noUpcoming: 'Es sind noch keine weiteren Programme geplant.',
    live: 'LIVE',
    official: 'One2OneLove',
    creator: 'Creator',
    replay: 'Wiederholung',
    partner: 'Partner',
    special: 'Spezial',
    thirdParty: 'Ansichten Dritter entsprechen nicht notwendigerweise denen von One2OneLove oder ERANT.',
  },
};

function formatTime(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleTimeString();
  }
}

function formatDay(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleDateString();
  }
}

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function typeMeta(type, t) {
  const map = {
    o2ol: { label: t.official, Icon: Radio },
    creator: { label: t.creator, Icon: Users },
    replay: { label: t.replay, Icon: RotateCcw },
    partner: { label: t.partner, Icon: ShieldCheck },
    special: { label: t.special, Icon: Sparkles },
  };
  return map[type] || map.creator;
}

function TypeBadge({ type, t }) {
  const { label, Icon } = typeMeta(type, t);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function ProgramCard({ slot, t, language, compact = false, live = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${live ? 'border-rose-200 bg-rose-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {live && <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white"><Radio className="h-3.5 w-3.5" />{t.live}</span>}
            <TypeBadge type={slot.program_type} t={t} />
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{slot.title}</div>
          {!compact && slot.description && <p className="mt-1 text-sm leading-6 text-slate-600">{slot.description}</p>}
          {slot.disclaimer_required && <p className="mt-2 text-xs leading-5 text-slate-400">{t.thirdParty}</p>}
        </div>
        <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          <Clock3 className="mr-1.5 inline h-4 w-4 text-rose-600" />
          {formatTime(slot.scheduled_start, language)}
        </div>
      </div>
    </div>
  );
}

export default function RoomScheduleViewer({ slots = [], isLoading = false }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const { liveSlots, upcoming, grouped } = useMemo(() => {
    const ordered = [...slots].sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    const live = ordered.filter((slot) => {
      const start = new Date(slot.scheduled_start).getTime();
      const end = new Date(slot.scheduled_end).getTime();
      return start <= nowMs && end > nowMs;
    });
    const future = ordered.filter((slot) => new Date(slot.scheduled_start).getTime() > nowMs);
    const groups = future.reduce((acc, slot) => {
      const key = dayKey(slot.scheduled_start);
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    }, {});
    return { liveSlots: live, upcoming: future.slice(0, 3), grouped: groups };
  }, [slots, nowMs]);

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-slate-200">
        <CardHeader><CardTitle className="text-2xl">{t.schedule}</CardTitle></CardHeader>
        <CardContent><p className="py-8 text-slate-500">{t.loading}</p></CardContent>
      </Card>
    );
  }

  if (!slots.length) {
    return (
      <Card className="rounded-3xl border-slate-200">
        <CardHeader><CardTitle className="text-2xl">{t.schedule}</CardTitle></CardHeader>
        <CardContent><div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">{t.empty}</div></CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><Radio className="h-5 w-5 text-rose-600" />{t.liveNow}</CardTitle>
        </CardHeader>
        <CardContent>
          {liveSlots.length ? (
            <div className="space-y-3">{liveSlots.map((slot) => <ProgramCard key={slot.id} slot={slot} t={t} language={currentLanguage} live />)}</div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{t.nothingLive}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200">
        <CardHeader><CardTitle className="text-xl">{t.upNext}</CardTitle></CardHeader>
        <CardContent>
          {upcoming.length ? (
            <div className="space-y-3">{upcoming.map((slot) => <ProgramCard key={slot.id} slot={slot} t={t} language={currentLanguage} compact />)}</div>
          ) : (
            <p className="text-sm text-slate-500">{t.noUpcoming}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200">
        <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><CalendarDays className="h-5 w-5 text-rose-600" />{t.sevenDays}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-7">
            {Object.entries(grouped).map(([key, daySlots]) => (
              <section key={key}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{formatDay(daySlots[0].scheduled_start, currentLanguage)}</h3>
                <div className="space-y-3">{daySlots.map((slot) => <ProgramCard key={slot.id} slot={slot} t={t} language={currentLanguage} />)}</div>
              </section>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
