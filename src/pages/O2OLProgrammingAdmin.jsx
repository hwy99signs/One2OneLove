import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Loader2, Radio, RotateCcw, ShieldCheck, Sparkles, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/Layout';
import { CREATOR_PROGRAMMING_ENABLED, listPublishedProgramming } from '@/lib/creatorProgrammingService';
import {
  bookO2OLProgrammingSlot,
  cancelO2OLProgrammingSlot,
  getO2OLProgrammingAdminAccess,
} from '@/lib/o2olProgrammingService';

const COPY = {
  en: {
    badge: 'O2OL PROGRAMMING', title: 'Global Relationship Room — O2OL programming console', intro: 'Schedule One2OneLove-owned live programs and approved replays on the same 24-hour timeline used by independent creators. Existing creator programming remains protected from staff cancellation through this console.',
    disabledTitle: 'O2OL programming is staged, not live yet.', disabledText: 'This internal console is behind the creator-programming launch switch and a server-side staff allowlist.', deniedTitle: 'O2OL staff access required', deniedText: 'This account is not on the server-side O2OL programming administrator allowlist.',
    notice: 'O2OL-owned programming is distinct from independent creator programming. The shared timeline prevents either source from double-booking the Global Relationship Room.', day: 'Schedule date', schedule: '24-hour room schedule', open: 'Open', creator: 'Creator', o2ol: 'O2OL', booked: 'Programmed', formTitle: 'Schedule O2OL programming', programTitle: 'Program title', description: 'Short description', start: 'Start time', duration: 'Duration', mode: 'Programming type', live: 'Live', replay: 'Replay', replayUrl: 'Replay link', scheduleButton: 'Schedule O2OL program', scheduling: 'Scheduling…', refresh: 'Refresh schedule', timezone: 'Times shown in your timezone', minutes: 'minutes', conflictWarning: 'That selected time overlaps existing programming. Choose another time.', manage: 'O2OL programs on this date', cancel: 'Cancel O2OL program', none: 'No O2OL-owned programming overlaps this date.', loading: 'Loading O2OL programming console…', loadError: 'Unable to load O2OL programming.', bookedSuccess: 'O2OL programming scheduled.', bookError: 'Unable to schedule O2OL programming.', cancelError: 'Unable to cancel O2OL programming.',
  },
  es: {
    badge: 'PROGRAMACIÓN O2OL', title: 'Sala Global de Relaciones — consola de programación O2OL', intro: 'Programa contenidos en vivo y repeticiones aprobadas propiedad de One2OneLove en la misma línea de 24 horas utilizada por creadores independientes. La programación de los creadores permanece protegida frente a cancelaciones desde esta consola.', disabledTitle: 'La programación O2OL está preparada, pero aún no está activa.', disabledText: 'Esta consola interna está detrás del interruptor de programación y de una lista de acceso del servidor.', deniedTitle: 'Se requiere acceso del personal O2OL', deniedText: 'Esta cuenta no está en la lista de administradores de programación O2OL del servidor.', notice: 'La programación propiedad de O2OL es distinta de la programación de creadores independientes. La línea compartida evita reservas dobles en la Sala Global de Relaciones.', day: 'Fecha', schedule: 'Horario de 24 horas', open: 'Disponible', creator: 'Creador', o2ol: 'O2OL', booked: 'Programado', formTitle: 'Programar contenido O2OL', programTitle: 'Título', description: 'Descripción breve', start: 'Hora de inicio', duration: 'Duración', mode: 'Tipo', live: 'En vivo', replay: 'Repetición', replayUrl: 'Enlace de repetición', scheduleButton: 'Programar contenido O2OL', scheduling: 'Programando…', refresh: 'Actualizar horario', timezone: 'Horas en tu zona horaria', minutes: 'minutos', conflictWarning: 'La hora seleccionada se superpone con otra programación. Elige otro horario.', manage: 'Programas O2OL en esta fecha', cancel: 'Cancelar programa O2OL', none: 'No hay programación O2OL que se superponga con esta fecha.', loading: 'Cargando consola O2OL…', loadError: 'No se pudo cargar la programación O2OL.', bookedSuccess: 'Programación O2OL creada.', bookError: 'No se pudo programar el contenido O2OL.', cancelError: 'No se pudo cancelar la programación O2OL.',
  },
  fr: {
    badge: 'PROGRAMMATION O2OL', title: 'Salon Mondial des Relations — console de programmation O2OL', intro: 'Planifiez les directs et rediffusions approuvées appartenant à One2OneLove sur la même chronologie de 24 heures que les créateurs indépendants. Cette console ne peut pas annuler leurs programmes.', disabledTitle: 'La programmation O2OL est préparée, mais pas encore active.', disabledText: 'Cette console interne est protégée par le commutateur de lancement et une liste d’accès côté serveur.', deniedTitle: 'Accès du personnel O2OL requis', deniedText: 'Ce compte ne figure pas dans la liste serveur des administrateurs de programmation O2OL.', notice: 'La programmation O2OL est distincte de celle des créateurs indépendants. La chronologie commune empêche les doubles réservations du Salon Mondial des Relations.', day: 'Date', schedule: 'Programme sur 24 heures', open: 'Libre', creator: 'Créateur', o2ol: 'O2OL', booked: 'Programmé', formTitle: 'Planifier un programme O2OL', programTitle: 'Titre', description: 'Courte description', start: 'Heure de début', duration: 'Durée', mode: 'Type', live: 'Direct', replay: 'Rediffusion', replayUrl: 'Lien de rediffusion', scheduleButton: 'Planifier le programme O2OL', scheduling: 'Planification…', refresh: 'Actualiser', timezone: 'Heures dans votre fuseau', minutes: 'minutes', conflictWarning: 'L’heure choisie chevauche une programmation existante. Choisissez un autre horaire.', manage: 'Programmes O2OL à cette date', cancel: 'Annuler le programme O2OL', none: 'Aucun programme O2OL ne chevauche cette date.', loading: 'Chargement de la console O2OL…', loadError: 'Impossible de charger la programmation O2OL.', bookedSuccess: 'Programme O2OL planifié.', bookError: 'Impossible de planifier le programme O2OL.', cancelError: 'Impossible d’annuler le programme O2OL.',
  },
  it: {
    badge: 'PROGRAMMAZIONE O2OL', title: 'Sala Globale delle Relazioni — console programmazione O2OL', intro: 'Programma dirette e repliche approvate di One2OneLove sulla stessa timeline di 24 ore usata dai creator indipendenti. Questa console non può annullare i programmi dei creator.', disabledTitle: 'La programmazione O2OL è predisposta, ma non è ancora attiva.', disabledText: 'Questa console interna è protetta dall’interruttore di lancio e da una allowlist lato server.', deniedTitle: 'Accesso staff O2OL richiesto', deniedText: 'Questo account non è nella lista server degli amministratori della programmazione O2OL.', notice: 'La programmazione O2OL è distinta da quella dei creator indipendenti. La timeline condivisa impedisce doppie prenotazioni nella Sala Globale delle Relazioni.', day: 'Data', schedule: 'Programma 24 ore', open: 'Libero', creator: 'Creator', o2ol: 'O2OL', booked: 'Programmato', formTitle: 'Programma contenuto O2OL', programTitle: 'Titolo', description: 'Breve descrizione', start: 'Ora di inizio', duration: 'Durata', mode: 'Tipo', live: 'Live', replay: 'Replica', replayUrl: 'Link replica', scheduleButton: 'Programma contenuto O2OL', scheduling: 'Programmazione…', refresh: 'Aggiorna', timezone: 'Orari nel tuo fuso', minutes: 'minuti', conflictWarning: 'L’orario selezionato si sovrappone a una programmazione esistente. Scegli un altro orario.', manage: 'Programmi O2OL in questa data', cancel: 'Annulla programma O2OL', none: 'Nessun programma O2OL si sovrappone a questa data.', loading: 'Caricamento console O2OL…', loadError: 'Impossibile caricare la programmazione O2OL.', bookedSuccess: 'Programmazione O2OL creata.', bookError: 'Impossibile programmare il contenuto O2OL.', cancelError: 'Impossibile annullare la programmazione O2OL.',
  },
  de: {
    badge: 'O2OL-PROGRAMM', title: 'Globaler Beziehungsraum — O2OL-Programmkonsole', intro: 'Plane One2OneLove-eigene Live-Programme und freigegebene Wiederholungen auf derselben 24-Stunden-Zeitleiste wie unabhängige Creator. Creator-Programme können über diese Konsole nicht storniert werden.', disabledTitle: 'O2OL-Programme sind vorbereitet, aber noch nicht aktiv.', disabledText: 'Diese interne Konsole liegt hinter dem Programm-Startschalter und einer serverseitigen Mitarbeiter-Allowlist.', deniedTitle: 'O2OL-Mitarbeiterzugang erforderlich', deniedText: 'Dieses Konto steht nicht auf der serverseitigen O2OL-Programm-Adminliste.', notice: 'O2OL-eigene Programme sind von unabhängigen Creator-Programmen getrennt. Die gemeinsame Zeitleiste verhindert Doppelbuchungen im Globalen Beziehungsraum.', day: 'Datum', schedule: '24-Stunden-Raumplan', open: 'Frei', creator: 'Creator', o2ol: 'O2OL', booked: 'Programmiert', formTitle: 'O2OL-Programm planen', programTitle: 'Titel', description: 'Kurzbeschreibung', start: 'Startzeit', duration: 'Dauer', mode: 'Typ', live: 'Live', replay: 'Wiederholung', replayUrl: 'Wiederholungslink', scheduleButton: 'O2OL-Programm planen', scheduling: 'Planung…', refresh: 'Plan aktualisieren', timezone: 'Zeiten in deiner Zeitzone', minutes: 'Minuten', conflictWarning: 'Die gewählte Zeit überschneidet sich mit einem vorhandenen Programm. Wähle eine andere Zeit.', manage: 'O2OL-Programme an diesem Datum', cancel: 'O2OL-Programm stornieren', none: 'Keine O2OL-Programme überschneiden dieses Datum.', loading: 'O2OL-Konsole wird geladen…', loadError: 'O2OL-Programme konnten nicht geladen werden.', bookedSuccess: 'O2OL-Programm geplant.', bookError: 'O2OL-Programm konnte nicht geplant werden.', cancelError: 'O2OL-Programm konnte nicht storniert werden.',
  },
  nl: {
    badge: 'O2OL-PROGRAMMERING', title: 'Wereldwijde Relatiekamer — O2OL-programmeerconsole', intro: 'Plan liveprogramma’s en goedgekeurde herhalingen van One2OneLove op dezelfde 24-uurs tijdlijn als onafhankelijke makers. Deze console kan creatorprogramma’s niet annuleren.', disabledTitle: 'O2OL-programmering is voorbereid, maar nog niet actief.', disabledText: 'Deze interne console staat achter de lanceringsschakelaar en een server-side medewerkerslijst.', deniedTitle: 'O2OL-medewerkerstoegang vereist', deniedText: 'Dit account staat niet op de server-side lijst van O2OL-programmeerbeheerders.', notice: 'O2OL-programmering staat los van onafhankelijke creatorprogrammering. De gedeelde tijdlijn voorkomt dubbele boekingen in de Wereldwijde Relatiekamer.', day: 'Datum', schedule: '24-uurs kamerschema', open: 'Vrij', creator: 'Creator', o2ol: 'O2OL', booked: 'Geprogrammeerd', formTitle: 'O2OL-programma plannen', programTitle: 'Titel', description: 'Korte beschrijving', start: 'Starttijd', duration: 'Duur', mode: 'Type', live: 'Live', replay: 'Herhaling', replayUrl: 'Herhalingslink', scheduleButton: 'O2OL-programma plannen', scheduling: 'Plannen…', refresh: 'Schema vernieuwen', timezone: 'Tijden in jouw tijdzone', minutes: 'minuten', conflictWarning: 'De gekozen tijd overlapt bestaande programmering. Kies een andere tijd.', manage: 'O2OL-programma’s op deze datum', cancel: 'O2OL-programma annuleren', none: 'Geen O2OL-programma overlapt deze datum.', loading: 'O2OL-console laden…', loadError: 'O2OL-programmering kon niet worden geladen.', bookedSuccess: 'O2OL-programma gepland.', bookError: 'O2OL-programma kon niet worden gepland.', cancelError: 'O2OL-programma kon niet worden geannuleerd.',
  },
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const DURATIONS = [30, 60, 90, 120];

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateBounds = (dateString) => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  const from = new Date(year, month - 1, day, 0, 0, 0, 0);
  const to = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
};

const bookingWindow = (dateString, timeString, durationMinutes) => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  const [hour, minute] = String(timeString).split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  const starts = new Date(year, month - 1, day, hour, minute, 0, 0);
  return { starts, ends: new Date(starts.getTime() + Number(durationMinutes) * 60 * 1000) };
};

const overlaps = (slot, starts, ends) => new Date(slot.starts_at) < ends && new Date(slot.ends_at) > starts;
const timeLabel = (hour) => new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(2026, 0, 1, hour, 0));
const slotTimeLabel = (slot) => `${new Date(slot.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(slot.ends_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

export default function O2OLProgrammingAdmin() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [date, setDate] = useState(localDateString());
  const [access, setAccess] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(CREATOR_PROGRAMMING_ENABLED);
  const [scheduling, setScheduling] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState('live');
  const [replayUrl, setReplayUrl] = useState('');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const load = async (targetDate = date) => {
    if (!CREATOR_PROGRAMMING_ENABLED) return;
    setLoading(true);
    try {
      const accessResult = await getO2OLProgrammingAdminAccess();
      setAccess(accessResult);
      if (!accessResult.eligible) return;
      setSchedule(await listPublishedProgramming(dateBounds(targetDate)));
    } catch {
      toast.error(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(date); }, [date]);

  const scheduleByHour = useMemo(() => {
    const [year, month, day] = date.split('-').map(Number);
    const grouped = new Map();
    for (const hour of HOURS) {
      const hourStart = new Date(year, month - 1, day, hour, 0, 0, 0);
      const hourEnd = new Date(year, month - 1, day, hour + 1, 0, 0, 0);
      grouped.set(hour, schedule.filter((slot) => overlaps(slot, hourStart, hourEnd)));
    }
    return grouped;
  }, [schedule, date]);

  const selectedWindow = useMemo(() => bookingWindow(date, startTime, duration), [date, startTime, duration]);
  const selectedSlotConflict = useMemo(
    () => Boolean(selectedWindow && schedule.some((slot) => overlaps(slot, selectedWindow.starts, selectedWindow.ends))),
    [schedule, selectedWindow]
  );
  const o2olSlots = useMemo(() => schedule.filter((slot) => slot.program_source === 'o2ol'), [schedule]);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !selectedWindow || selectedSlotConflict) return;
    setScheduling(true);
    try {
      await bookO2OLProgrammingSlot({
        title,
        description,
        startsAt: selectedWindow.starts.toISOString(),
        endsAt: selectedWindow.ends.toISOString(),
        timezone,
        contentMode: mode,
        replayUrl,
      });
      toast.success(t.bookedSuccess);
      setTitle('');
      setDescription('');
      setReplayUrl('');
      await load(date);
    } catch {
      toast.error(t.bookError);
    } finally {
      setScheduling(false);
    }
  };

  const cancelSlot = async (slotId) => {
    try {
      await cancelO2OLProgrammingSlot(slotId);
      await load(date);
    } catch {
      toast.error(t.cancelError);
    }
  };

  if (!CREATOR_PROGRAMMING_ENABLED) {
    return <main className="min-h-[70vh] bg-gradient-to-br from-slate-100 via-white to-violet-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl"><Sparkles className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabledTitle}</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{t.disabledText}</p></div></main>;
  }

  if (loading && !access) {
    return <main className="min-h-[70vh] px-5 py-16"><div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl bg-white p-10 text-slate-600 shadow-lg"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div></main>;
  }

  if (access && !access.eligible) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.deniedTitle}</h1><p className="mt-4 text-slate-600">{t.deniedText}</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-900 px-5 py-14 text-white"><div className="mx-auto max-w-7xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black tracking-[0.16em]"><ShieldCheck className="h-4 w-4" />{t.badge}</div><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/85">{t.intro}</p></div></section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950"><strong>{t.notice}</strong></div>
        <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><label className="mb-2 block text-sm font-black text-slate-700">{t.day}</label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-52 bg-white" /></div><div className="flex items-center gap-3"><span className="text-xs font-bold text-slate-500">{t.timezone}: {timezone}</span><Button variant="outline" onClick={() => load(date)}><RotateCcw className="mr-2 h-4 w-4" />{t.refresh}</Button></div></div>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b bg-slate-950 px-5 py-4 font-black text-white"><Clock3 className="h-5 w-5" />{t.schedule}</div>{HOURS.map((hour) => { const slots = scheduleByHour.get(hour) || []; return <div key={hour} className="grid min-h-16 grid-cols-[90px_1fr] border-b border-slate-100 last:border-b-0"><div className="border-r bg-slate-50 px-3 py-4 text-sm font-black text-slate-500">{timeLabel(hour)}</div><div className="p-2">{slots.length ? slots.map((slot) => <div key={`${hour}-${slot.id}`} className={`rounded-xl border px-3 py-2 ${slot.program_source === 'o2ol' ? 'border-fuchsia-200 bg-fuchsia-50' : 'border-violet-200 bg-violet-50'}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black text-slate-950">{slot.title}</span><div className="flex gap-1.5"><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase text-slate-700">{slot.program_source === 'o2ol' ? t.o2ol : t.creator}</span><span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-black uppercase text-white">{slot.content_mode === 'replay' ? t.replay : t.live}</span></div></div><div className="mt-1 text-xs font-semibold text-slate-600">{slotTimeLabel(slot)} · {t.booked}</div></div>) : <div className="px-2 py-3 text-sm font-semibold text-emerald-700">{t.open}</div>}</div></div>; })}</div>
          </div>

          <div className="space-y-6">
            <form onSubmit={submit} className="rounded-[2rem] border border-fuchsia-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-xl font-black"><CalendarDays className="h-5 w-5 text-fuchsia-700" />{t.formTitle}</div><div className="mt-5 space-y-4"><div><label className="mb-1.5 block text-sm font-bold">{t.programTitle}</label><Input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 120))} required /></div><div><label className="mb-1.5 block text-sm font-bold">{t.description}</label><textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 1000))} rows={3} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-fuchsia-400" /></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-sm font-bold">{t.start}</label><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></div><div><label className="mb-1.5 block text-sm font-bold">{t.duration}</label><select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{DURATIONS.map((value) => <option key={value} value={value}>{value} {t.minutes}</option>)}</select></div></div>{selectedSlotConflict ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold leading-6 text-rose-800">{t.conflictWarning}</div> : null}<div><label className="mb-1.5 block text-sm font-bold">{t.mode}</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setMode('live')} className={`rounded-xl border p-3 text-sm font-black ${mode === 'live' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800' : 'border-slate-200'}`}><Radio className="mx-auto mb-1 h-4 w-4" />{t.live}</button><button type="button" onClick={() => setMode('replay')} className={`rounded-xl border p-3 text-sm font-black ${mode === 'replay' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800' : 'border-slate-200'}`}><Video className="mx-auto mb-1 h-4 w-4" />{t.replay}</button></div></div>{mode === 'replay' && <div><label className="mb-1.5 block text-sm font-bold">{t.replayUrl}</label><Input type="url" value={replayUrl} onChange={(event) => setReplayUrl(event.target.value.slice(0, 1000))} required /></div>}<Button type="submit" disabled={scheduling || selectedSlotConflict} className="w-full bg-fuchsia-700 text-white hover:bg-fuchsia-800">{scheduling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{scheduling ? t.scheduling : t.scheduleButton}</Button></div></form>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{t.manage}</h2><div className="mt-4 space-y-3">{o2olSlots.length ? o2olSlots.map((slot) => <div key={slot.id} className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/40 p-4"><div className="font-black text-slate-900">{slot.title}</div><div className="mt-1 text-sm text-slate-500">{slotTimeLabel(slot)} · {slot.content_mode === 'replay' ? t.replay : t.live}</div><Button variant="outline" size="sm" className="mt-3" onClick={() => cancelSlot(slot.id)}>{t.cancel}</Button></div>) : <p className="text-sm leading-6 text-slate-500">{t.none}</p>}</div></div>
          </div>
        </div>
      </section>
    </main>
  );
}
