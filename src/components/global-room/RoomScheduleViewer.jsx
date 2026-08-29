import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, Radio, RotateCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';
import ProgramReportButton from '@/components/global-room/ProgramReportButton';

const translations = {
  en: {
    schedule: 'Programming Schedule', liveNow: 'Live Now', upNext: 'Up Next', sevenDays: 'Next 7 Days', loading: 'Loading programming…', empty: 'No public programming is scheduled in this window yet.', error: 'The programming schedule is temporarily unavailable. Please try again shortly.', nothingLive: 'No program is live right now.', noUpcoming: 'No additional programs are scheduled yet.', live: 'LIVE', official: 'One2OneLove', creator: 'Creator', replay: 'Replay', partner: 'Partner', special: 'Special', presentedBy: 'Presented by', thirdParty: 'Third-party views are not necessarily those of One2OneLove or ERANT.', localTime: 'Times are shown in your local timezone.'
  },
  es: {
    schedule: 'Programación', liveNow: 'En Vivo Ahora', upNext: 'A Continuación', sevenDays: 'Próximos 7 Días', loading: 'Cargando programación…', empty: 'Todavía no hay programación pública en este período.', error: 'La programación no está disponible temporalmente. Inténtalo de nuevo en breve.', nothingLive: 'No hay ningún programa en vivo en este momento.', noUpcoming: 'Todavía no hay programas adicionales programados.', live: 'EN VIVO', official: 'One2OneLove', creator: 'Creador', replay: 'Repetición', partner: 'Socio', special: 'Especial', presentedBy: 'Presentado por', thirdParty: 'Las opiniones de terceros no representan necesariamente a One2OneLove o ERANT.', localTime: 'Los horarios se muestran en tu zona horaria local.'
  },
  fr: {
    schedule: 'Programme', liveNow: 'En Direct', upNext: 'À Suivre', sevenDays: '7 Prochains Jours', loading: 'Chargement du programme…', empty: 'Aucun programme public n’est encore prévu dans cette période.', error: 'Le programme est temporairement indisponible. Veuillez réessayer dans quelques instants.', nothingLive: 'Aucun programme n’est en direct pour le moment.', noUpcoming: 'Aucun autre programme n’est encore prévu.', live: 'EN DIRECT', official: 'One2OneLove', creator: 'Créateur', replay: 'Rediffusion', partner: 'Partenaire', special: 'Spécial', presentedBy: 'Présenté par', thirdParty: 'Les opinions de tiers ne représentent pas nécessairement One2OneLove ou ERANT.', localTime: 'Les horaires sont affichés dans votre fuseau horaire local.'
  },
  it: {
    schedule: 'Programmazione', liveNow: 'In Diretta Ora', upNext: 'A Seguire', sevenDays: 'Prossimi 7 Giorni', loading: 'Caricamento della programmazione…', empty: 'Non ci sono ancora programmi pubblici previsti in questo intervallo.', error: 'La programmazione è temporaneamente non disponibile. Riprova tra poco.', nothingLive: 'Nessun programma è in diretta in questo momento.', noUpcoming: 'Non ci sono ancora altri programmi in calendario.', live: 'IN DIRETTA', official: 'One2OneLove', creator: 'Creator', replay: 'Replica', partner: 'Partner', special: 'Speciale', presentedBy: 'Presentato da', thirdParty: 'Le opinioni di terzi non rappresentano necessariamente One2OneLove o ERANT.', localTime: 'Gli orari sono mostrati nel tuo fuso orario locale.'
  },
  de: {
    schedule: 'Programmplan', liveNow: 'Jetzt Live', upNext: 'Als Nächstes', sevenDays: 'Nächste 7 Tage', loading: 'Programm wird geladen…', empty: 'Für diesen Zeitraum ist noch kein öffentliches Programm geplant.', error: 'Der Programmplan ist vorübergehend nicht verfügbar. Bitte versuche es in Kürze erneut.', nothingLive: 'Derzeit läuft kein Programm live.', noUpcoming: 'Es sind noch keine weiteren Programme geplant.', live: 'LIVE', official: 'One2OneLove', creator: 'Creator', replay: 'Wiederholung', partner: 'Partner', special: 'Spezial', presentedBy: 'Präsentiert von', thirdParty: 'Ansichten Dritter entsprechen nicht notwendigerweise denen von One2OneLove oder ERANT.', localTime: 'Zeiten werden in deiner lokalen Zeitzone angezeigt.'
  },
};

function formatTime(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleTimeString();
  }
}

function formatDay(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(value));
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
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"><Icon aria-hidden="true" className="h-3.5 w-3.5" /> {label}</span>;
}

function ProgramCard({ slot, t, language, compact = false, live = false }) {
  return (
    <article className={`rounded-2xl border p-4 ${live ? 'border-rose-200 bg-rose-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {live && <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white"><Radio aria-hidden="true" className="h-3.5 w-3.5" />{t.live}</span>}
            <TypeBadge type={slot.program_type} t={t} />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{slot.title}</h3>
          {slot.creator_display_name && <div className="mt-1 text-sm font-medium text-rose-700">{t.presentedBy} {slot.creator_display_name}</div>}
          {!compact && slot.description && <p className="mt-2 text-sm leading-6 text-slate-600">{slot.description}</p>}
          {slot.disclaimer_required && <p className="mt-2 text-xs leading-5 text-slate-500">{t.thirdParty}</p>}
          {!compact && <div className="mt-3"><ProgramReportButton slotId={slot.id} /></div>}
        </div>
        <time dateTime={slot.scheduled_start} className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"><Clock3 aria-hidden="true" className="mr-1.5 inline h-4 w-4 text-rose-600" />{formatTime(slot.scheduled_start, language)}</time>
      </div>
    </article>
  );
}

export default function RoomScheduleViewer({ slots = [], isLoading = false, hasError = false }) {
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
    return <Card className="rounded-3xl border-slate-200"><CardHeader><CardTitle className="text-2xl">{t.schedule}</CardTitle></CardHeader><CardContent><p role="status" aria-live="polite" className="py-8 text-slate-500">{t.loading}</p></CardContent></Card>;
  }

  if (hasError) {
    return <Card className="rounded-3xl border-amber-200"><CardHeader><CardTitle className="text-2xl">{t.schedule}</CardTitle></CardHeader><CardContent><div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>{t.error}</span></div></CardContent></Card>;
  }

  if (!slots.length) {
    return <Card className="rounded-3xl border-slate-200"><CardHeader><CardTitle className="text-2xl">{t.schedule}</CardTitle></CardHeader><CardContent><div role="status" className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">{t.empty}</div></CardContent></Card>;
  }

  return (
    <div className="space-y-6" aria-label={t.schedule}>
      <p className="px-1 text-xs text-slate-500"><Clock3 aria-hidden="true" className="mr-1 inline h-3.5 w-3.5" />{t.localTime}</p>

      <Card className="rounded-3xl border-rose-100">
        <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><Radio aria-hidden="true" className="h-5 w-5 text-rose-600" />{t.liveNow}</CardTitle></CardHeader>
        <CardContent aria-live="polite">{liveSlots.length ? <div className="space-y-3">{liveSlots.map((slot) => <ProgramCard key={slot.id} slot={slot} t={t} language={currentLanguage} live />)}</div> : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{t.nothingLive}</p>}</CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200">
        <CardHeader><CardTitle className="text-xl">{t.upNext}</CardTitle></CardHeader>
        <CardContent>{upcoming.length ? <div className="space-y-3">{upcoming.map((slot) => <ProgramCard key={slot.id} slot={slot} t={t} language={currentLanguage} compact />)}</div> : <p className="text-sm text-slate-500">{t.noUpcoming}</p>}</CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200">
        <CardHeader><CardTitle className="flex items-center gap-2 text-2xl"><CalendarDays aria-hidden="true" className="h-5 w-5 text-rose-600" />{t.sevenDays}</CardTitle></CardHeader>
        <CardContent>{Object.keys(grouped).length ? <div className="space-y-7">{Object.entries(grouped).map(([key, daySlots]) => <section key={key}><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{formatDay(daySlots[0].scheduled_start, currentLanguage)}</h3><div className="space-y-3">{daySlots.map((slot) => <ProgramCard key={slot.id} slot={slot} t={t} language={currentLanguage} />)}</div></section>)}</div> : <p className="text-sm text-slate-500">{t.noUpcoming}</p>}</CardContent>
      </Card>
    </div>
  );
}
