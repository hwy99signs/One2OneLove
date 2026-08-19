import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Radio, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProgrammingReminderButton from '@/components/programming/ProgrammingReminderButton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { CREATOR_PROGRAMMING_ENABLED, listPublishedProgramming } from '@/lib/creatorProgrammingService';

const COPY = {
  en: {
    badge: 'GLOBAL RELATIONSHIP ROOM', title: 'Programming schedule', intro: 'See what is coming up in the Global Relationship Room. O2OL programs and independent creator programs share one schedule, and signed-in members can set private in-app reminders.',
    disabledTitle: 'Programming is not live yet.', disabledText: 'The Global Relationship Room programming schedule is staged behind the relaunch feature switch.',
    signInTitle: 'Sign in to view the programming schedule', signInText: 'The programming schedule and private reminders are available to signed-in One2OneLove members.', signIn: 'Sign In',
    weekOf: 'Week of', previous: 'Previous week', next: 'Next week', loading: 'Loading programming…', loadError: 'Programming could not be loaded.', empty: 'No programming is scheduled in this seven-day window yet.',
    o2ol: 'O2OL', creator: 'Creator', live: 'Live', replay: 'Replay', liveNow: 'Live now', scheduled: 'Scheduled', room: 'Global Relationship Room',
  },
  es: {
    badge: 'SALA GLOBAL DE RELACIONES', title: 'Calendario de programación', intro: 'Mira lo que viene en la Sala Global de Relaciones. Los programas de O2OL y de creadores independientes comparten un calendario, y los miembros conectados pueden activar recordatorios privados dentro de la aplicación.', disabledTitle: 'La programación aún no está activa.', disabledText: 'El calendario de la Sala Global de Relaciones está preparado detrás del interruptor de relanzamiento.', signInTitle: 'Inicia sesión para ver la programación', signInText: 'El calendario y los recordatorios privados están disponibles para miembros conectados de One2OneLove.', signIn: 'Iniciar Sesión', weekOf: 'Semana del', previous: 'Semana anterior', next: 'Semana siguiente', loading: 'Cargando programación…', loadError: 'No se pudo cargar la programación.', empty: 'Aún no hay programación en esta ventana de siete días.', o2ol: 'O2OL', creator: 'Creador', live: 'En vivo', replay: 'Repetición', liveNow: 'En vivo ahora', scheduled: 'Programado', room: 'Sala Global de Relaciones',
  },
  fr: {
    badge: 'SALON MONDIAL DES RELATIONS', title: 'Calendrier de programmation', intro: 'Découvrez les programmes à venir dans le Salon Mondial des Relations. Les programmes O2OL et ceux des créateurs indépendants partagent un même calendrier, avec des rappels privés pour les membres connectés.', disabledTitle: 'La programmation n’est pas encore active.', disabledText: 'Le calendrier du Salon Mondial des Relations est préparé derrière le commutateur de relance.', signInTitle: 'Connectez-vous pour voir la programmation', signInText: 'Le calendrier et les rappels privés sont disponibles aux membres One2OneLove connectés.', signIn: 'Se Connecter', weekOf: 'Semaine du', previous: 'Semaine précédente', next: 'Semaine suivante', loading: 'Chargement de la programmation…', loadError: 'Impossible de charger la programmation.', empty: 'Aucun programme n’est encore prévu dans cette période de sept jours.', o2ol: 'O2OL', creator: 'Créateur', live: 'Direct', replay: 'Rediffusion', liveNow: 'En direct maintenant', scheduled: 'Programmé', room: 'Salon Mondial des Relations',
  },
  it: {
    badge: 'SALA GLOBALE DELLE RELAZIONI', title: 'Calendario programmazione', intro: 'Scopri cosa è in arrivo nella Sala Globale delle Relazioni. I programmi O2OL e quelli dei creator indipendenti condividono lo stesso calendario e i membri autenticati possono impostare promemoria privati in-app.', disabledTitle: 'La programmazione non è ancora attiva.', disabledText: 'Il calendario della Sala Globale delle Relazioni è predisposto dietro l’interruttore di rilancio.', signInTitle: 'Accedi per vedere la programmazione', signInText: 'Il calendario e i promemoria privati sono disponibili per i membri One2OneLove autenticati.', signIn: 'Accedi', weekOf: 'Settimana del', previous: 'Settimana precedente', next: 'Settimana successiva', loading: 'Caricamento programmazione…', loadError: 'Impossibile caricare la programmazione.', empty: 'Nessun programma è ancora previsto in questa finestra di sette giorni.', o2ol: 'O2OL', creator: 'Creator', live: 'Live', replay: 'Replica', liveNow: 'In onda ora', scheduled: 'Programmato', room: 'Sala Globale delle Relazioni',
  },
  de: {
    badge: 'GLOBALER BEZIEHUNGSRAUM', title: 'Programmkalender', intro: 'Sieh, was im Globalen Beziehungsraum als Nächstes läuft. O2OL-Programme und unabhängige Creator-Programme teilen sich einen Kalender; angemeldete Mitglieder können private In-App-Erinnerungen setzen.', disabledTitle: 'Das Programm ist noch nicht live.', disabledText: 'Der Programmkalender des Globalen Beziehungsraums liegt hinter dem Relaunch-Schalter bereit.', signInTitle: 'Melde dich an, um den Programmkalender zu sehen', signInText: 'Programmkalender und private Erinnerungen sind für angemeldete One2OneLove-Mitglieder verfügbar.', signIn: 'Anmelden', weekOf: 'Woche ab', previous: 'Vorherige Woche', next: 'Nächste Woche', loading: 'Programm wird geladen…', loadError: 'Programm konnte nicht geladen werden.', empty: 'In diesem Sieben-Tage-Zeitraum ist noch kein Programm geplant.', o2ol: 'O2OL', creator: 'Creator', live: 'Live', replay: 'Wiederholung', liveNow: 'Jetzt live', scheduled: 'Geplant', room: 'Globaler Beziehungsraum',
  },
  nl: {
    badge: 'WERELDWIJDE RELATIEKAMER', title: 'Programmakalender', intro: 'Bekijk wat er aankomt in de Wereldwijde Relatiekamer. O2OL-programma’s en onafhankelijke creatorprogramma’s delen één schema en ingelogde leden kunnen privéherinneringen in de app instellen.', disabledTitle: 'Programmering is nog niet live.', disabledText: 'De programmakalender van de Wereldwijde Relatiekamer staat klaar achter de relaunch-schakelaar.', signInTitle: 'Log in om de programmakalender te bekijken', signInText: 'De kalender en privéherinneringen zijn beschikbaar voor ingelogde One2OneLove-leden.', signIn: 'Inloggen', weekOf: 'Week van', previous: 'Vorige week', next: 'Volgende week', loading: 'Programmering laden…', loadError: 'Programmering kon niet worden geladen.', empty: 'Er staat nog geen programmering in deze periode van zeven dagen.', o2ol: 'O2OL', creator: 'Creator', live: 'Live', replay: 'Herhaling', liveNow: 'Nu live', scheduled: 'Gepland', room: 'Wereldwijde Relatiekamer',
  },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };
const startOfLocalDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);

export default function ProgrammingSchedule() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const [weekStart, setWeekStart] = useState(() => startOfLocalDay(new Date()));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!CREATOR_PROGRAMMING_ENABLED || !isAuthenticated || !user?.id) {
      setSlots([]);
      setLoading(false);
      return () => { mounted = false; };
    }

    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    setLoading(true);
    setError('');
    listPublishedProgramming({ from, to })
      .then((rows) => {
        if (mounted) setSlots(rows || []);
      })
      .catch(() => {
        if (mounted) setError(t.loadError);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [weekStart, isAuthenticated, user?.id, language]);

  const groups = useMemo(() => {
    const grouped = [];
    for (let index = 0; index < 7; index += 1) {
      const dayStart = addDays(weekStart, index);
      const dayEnd = addDays(weekStart, index + 1);
      const items = slots.filter((slot) => new Date(slot.starts_at) < dayEnd && new Date(slot.ends_at) > dayStart);
      grouped.push({ dayStart, items });
    }
    return grouped;
  }, [slots, weekStart]);

  if (!CREATOR_PROGRAMMING_ENABLED) {
    return <main className="min-h-[70vh] bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] border border-violet-100 bg-white p-8 text-center shadow-xl"><Sparkles className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabledTitle}</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{t.disabledText}</p></div></main>;
  }

  if (!isAuthenticated) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><CalendarDays className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.signInTitle}</h1><p className="mt-4 leading-7 text-slate-600">{t.signInText}</p><Button className="mt-6" onClick={() => navigate('/SignIn?returnTo=%2FProgrammingSchedule')}>{t.signIn}</Button></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-600 px-5 py-14 text-white"><div className="mx-auto max-w-6xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.16em]"><Radio className="h-4 w-4" />{t.badge}</div><h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/90">{t.intro}</p></div></section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Button variant="outline" onClick={() => setWeekStart((current) => addDays(current, -7))} aria-label={t.previous}><ChevronLeft className="mr-2 h-4 w-4" />{t.previous}</Button>
          <div className="text-center"><div className="text-xs font-black uppercase tracking-[0.14em] text-violet-600">{t.weekOf}</div><div className="mt-1 text-lg font-black text-slate-950">{weekStart.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}</div></div>
          <Button variant="outline" onClick={() => setWeekStart((current) => addDays(current, 7))}>{t.next}<ChevronRight className="ml-2 h-4 w-4" /></Button>
        </div>

        {loading ? <div className="flex min-h-64 items-center justify-center rounded-[2rem] bg-white text-slate-500 shadow-sm"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 font-bold text-rose-800">{error}</div> : slots.length === 0 ? <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div> : (
          <div className="space-y-5">
            {groups.map(({ dayStart, items }) => items.length ? (
              <section key={dayStart.toISOString()} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white"><div className="text-sm font-black uppercase tracking-[0.12em]">{dayStart.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>
                <div className="divide-y divide-slate-100">
                  {items.map((slot) => {
                    const start = new Date(slot.starts_at);
                    const end = new Date(slot.ends_at);
                    const now = new Date();
                    const liveNow = start <= now && end > now;
                    return (
                      <article key={`${dayStart.toISOString()}-${slot.id}`} className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${liveNow ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>{liveNow ? t.liveNow : t.scheduled}</span><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase text-violet-800">{slot.program_source === 'o2ol' ? t.o2ol : t.creator}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-700">{slot.content_mode === 'replay' ? t.replay : t.live}</span></div><h2 className="mt-3 text-xl font-black text-slate-950">{slot.title}</h2>{slot.description ? <p className="mt-2 max-w-3xl leading-7 text-slate-600">{slot.description}</p> : null}<div className="mt-3 text-sm font-bold text-slate-500">{start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })} – {end.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })} · {t.room}</div></div>
                          <div className="shrink-0">{liveNow ? <Button onClick={() => navigate('/LiveRoom?room=global-relationship-room')}>{t.liveNow}</Button> : <ProgrammingReminderButton slot={slot} />}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null)}
          </div>
        )}
      </section>
    </main>
  );
}
