import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Loader2, Radio, RotateCcw, ShieldCheck, Sparkles, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/Layout';
import {
  CREATOR_PROGRAMMING_ENABLED,
  bookCreatorProgrammingSlot,
  cancelCreatorProgrammingSlot,
  getCreatorProgrammingAccess,
  listMyProgramming,
  listPublishedProgramming,
} from '@/lib/creatorProgrammingService';

const COPY = {
  en: {
    badge: 'CREATOR PROGRAMMING', title: 'Global Relationship Room — 24-hour programming calendar', intro: 'Approved creators can self-book open programming time around the clock. Start with up to two free slots per creator each day; live programs and approved replays share the same room schedule.',
    freeRule: 'Launch rule: up to 2 free creator slots per day', paidRule: 'Future paid slots are prepared in the system but are not active.', notice: 'Creator programming is community content. It is not professional medical, mental-health, legal, financial, or emergency advice from One2OneLove.',
    disabledTitle: 'Creator programming is staged, not live yet.', disabledText: 'The calendar, booking service, database rules, and safety controls are being prepared behind a launch switch.',
    accessTitle: 'Approved creator access required', accessText: 'Self-booking is available only to approved creator accounts.',
    day: 'Schedule date', schedule: '24-hour room schedule', open: 'Open', booked: 'Programmed', mine: 'Your programming', bookTitle: 'Book an open slot', programTitle: 'Program title', description: 'Short description', start: 'Start time', duration: 'Duration', mode: 'Programming type', live: 'Live', replay: 'Replay', replayUrl: 'Replay link', book: 'Book free slot', booking: 'Booking…', refresh: 'Refresh schedule', cancel: 'Cancel slot', noMine: 'No programming booked for this date.', timezone: 'Times shown in your timezone', free: 'FREE', paidLater: 'Paid slots: later rollout', minutes: 'minutes', loading: 'Loading creator calendar…',
  },
  es: {
    badge: 'PROGRAMACIÓN DE CREADORES', title: 'Sala Global de Relaciones — calendario de programación de 24 horas', intro: 'Los creadores aprobados pueden reservar por sí mismos horarios disponibles durante todo el día. Al inicio, cada creador puede reservar hasta dos espacios gratuitos por día; los programas en vivo y las repeticiones aprobadas comparten el mismo calendario.', freeRule: 'Regla de lanzamiento: hasta 2 espacios gratuitos por creador al día', paidRule: 'Los futuros espacios de pago están preparados en el sistema, pero no están activos.', notice: 'La programación de creadores es contenido comunitario. No constituye asesoramiento médico, de salud mental, legal, financiero ni de emergencia de One2OneLove.', disabledTitle: 'La programación de creadores está preparada, pero aún no está activa.', disabledText: 'El calendario, el servicio de reservas, las reglas de base de datos y los controles de seguridad se están preparando detrás de un interruptor de lanzamiento.', accessTitle: 'Se requiere acceso de creador aprobado', accessText: 'La autorreserva está disponible solo para cuentas de creador aprobadas.', day: 'Fecha del calendario', schedule: 'Horario de 24 horas', open: 'Disponible', booked: 'Programado', mine: 'Tu programación', bookTitle: 'Reserva un espacio disponible', programTitle: 'Título del programa', description: 'Descripción breve', start: 'Hora de inicio', duration: 'Duración', mode: 'Tipo de programación', live: 'En vivo', replay: 'Repetición', replayUrl: 'Enlace de repetición', book: 'Reservar espacio gratuito', booking: 'Reservando…', refresh: 'Actualizar calendario', cancel: 'Cancelar espacio', noMine: 'No tienes programación reservada para esta fecha.', timezone: 'Horas mostradas en tu zona horaria', free: 'GRATIS', paidLater: 'Espacios de pago: lanzamiento posterior', minutes: 'minutos', loading: 'Cargando calendario de creadores…',
  },
  fr: {
    badge: 'PROGRAMMATION DES CRÉATEURS', title: 'Salon Mondial des Relations — calendrier de programmation sur 24 heures', intro: 'Les créateurs approuvés peuvent réserver eux-mêmes les créneaux disponibles à toute heure. Au lancement, chaque créateur peut réserver jusqu’à deux créneaux gratuits par jour ; les directs et rediffusions approuvées partagent le même calendrier.', freeRule: 'Règle de lancement : jusqu’à 2 créneaux gratuits par créateur et par jour', paidRule: 'Les futurs créneaux payants sont prévus dans le système, mais ne sont pas actifs.', notice: 'La programmation des créateurs est un contenu communautaire. Elle ne constitue pas un conseil médical, psychologique, juridique, financier ou d’urgence de One2OneLove.', disabledTitle: 'La programmation des créateurs est préparée, mais pas encore active.', disabledText: 'Le calendrier, le service de réservation, les règles de base de données et les contrôles de sécurité sont préparés derrière un interrupteur de lancement.', accessTitle: 'Accès créateur approuvé requis', accessText: 'La réservation autonome est réservée aux comptes créateurs approuvés.', day: 'Date du calendrier', schedule: 'Programme de la salle sur 24 heures', open: 'Libre', booked: 'Programmé', mine: 'Votre programmation', bookTitle: 'Réserver un créneau libre', programTitle: 'Titre du programme', description: 'Courte description', start: 'Heure de début', duration: 'Durée', mode: 'Type de programmation', live: 'Direct', replay: 'Rediffusion', replayUrl: 'Lien de rediffusion', book: 'Réserver un créneau gratuit', booking: 'Réservation…', refresh: 'Actualiser le calendrier', cancel: 'Annuler le créneau', noMine: 'Aucune programmation réservée pour cette date.', timezone: 'Heures affichées dans votre fuseau horaire', free: 'GRATUIT', paidLater: 'Créneaux payants : lancement ultérieur', minutes: 'minutes', loading: 'Chargement du calendrier créateur…',
  },
  it: {
    badge: 'PROGRAMMAZIONE CREATOR', title: 'Sala Globale delle Relazioni — calendario di programmazione 24 ore', intro: 'I creator approvati possono prenotare autonomamente gli orari disponibili in qualsiasi momento. Al lancio ogni creator può prenotare fino a due spazi gratuiti al giorno; programmi live e repliche approvate condividono lo stesso calendario.', freeRule: 'Regola di lancio: fino a 2 spazi gratuiti per creator al giorno', paidRule: 'Gli spazi a pagamento futuri sono predisposti nel sistema, ma non sono attivi.', notice: 'La programmazione dei creator è contenuto della community. Non costituisce consulenza medica, psicologica, legale, finanziaria o assistenza di emergenza di One2OneLove.', disabledTitle: 'La programmazione creator è predisposta, ma non è ancora attiva.', disabledText: 'Calendario, servizio di prenotazione, regole del database e controlli di sicurezza sono preparati dietro un interruttore di lancio.', accessTitle: 'È richiesto l’accesso creator approvato', accessText: 'La prenotazione autonoma è disponibile solo per gli account creator approvati.', day: 'Data del calendario', schedule: 'Programma della stanza 24 ore', open: 'Libero', booked: 'Programmato', mine: 'La tua programmazione', bookTitle: 'Prenota uno spazio libero', programTitle: 'Titolo del programma', description: 'Breve descrizione', start: 'Ora di inizio', duration: 'Durata', mode: 'Tipo di programmazione', live: 'Live', replay: 'Replica', replayUrl: 'Link della replica', book: 'Prenota spazio gratuito', booking: 'Prenotazione…', refresh: 'Aggiorna calendario', cancel: 'Annulla spazio', noMine: 'Nessuna programmazione prenotata per questa data.', timezone: 'Orari mostrati nel tuo fuso orario', free: 'GRATIS', paidLater: 'Spazi a pagamento: lancio futuro', minutes: 'minuti', loading: 'Caricamento calendario creator…',
  },
  de: {
    badge: 'CREATOR-PROGRAMM', title: 'Globaler Beziehungsraum — 24-Stunden-Programmkalender', intro: 'Freigegebene Creator können rund um die Uhr freie Programmzeiten selbst buchen. Zum Start sind bis zu zwei kostenlose Slots pro Creator und Tag möglich; Live-Programme und freigegebene Wiederholungen teilen sich denselben Raumkalender.', freeRule: 'Startregel: bis zu 2 kostenlose Creator-Slots pro Tag', paidRule: 'Künftige bezahlte Slots sind im System vorbereitet, aber nicht aktiv.', notice: 'Creator-Programme sind Community-Inhalte. Sie stellen keine medizinische, psychologische, rechtliche, finanzielle oder Notfallberatung von One2OneLove dar.', disabledTitle: 'Creator-Programme sind vorbereitet, aber noch nicht live.', disabledText: 'Kalender, Buchungsdienst, Datenbankregeln und Sicherheitskontrollen liegen hinter einem Startschalter bereit.', accessTitle: 'Freigegebener Creator-Zugang erforderlich', accessText: 'Die Selbstbuchung ist nur für freigegebene Creator-Konten verfügbar.', day: 'Kalendertag', schedule: '24-Stunden-Raumplan', open: 'Frei', booked: 'Programmiert', mine: 'Dein Programm', bookTitle: 'Freien Slot buchen', programTitle: 'Programmtitel', description: 'Kurzbeschreibung', start: 'Startzeit', duration: 'Dauer', mode: 'Programmtyp', live: 'Live', replay: 'Wiederholung', replayUrl: 'Wiederholungslink', book: 'Kostenlosen Slot buchen', booking: 'Buchung…', refresh: 'Plan aktualisieren', cancel: 'Slot stornieren', noMine: 'Für dieses Datum ist kein eigenes Programm gebucht.', timezone: 'Zeiten in deiner Zeitzone', free: 'KOSTENLOS', paidLater: 'Bezahlte Slots: spätere Einführung', minutes: 'Minuten', loading: 'Creator-Kalender wird geladen…',
  },
  nl: {
    badge: 'CREATORPROGRAMMERING', title: 'Wereldwijde Relatiekamer — 24-uurs programmakalender', intro: 'Goedgekeurde makers kunnen dag en nacht zelf beschikbare programmatijd boeken. Bij de start zijn maximaal twee gratis slots per maker per dag beschikbaar; liveprogramma’s en goedgekeurde herhalingen delen dezelfde planning.', freeRule: 'Startregel: maximaal 2 gratis creatorslots per dag', paidRule: 'Toekomstige betaalde slots zijn voorbereid, maar niet actief.', notice: 'Creatorprogrammering is community-inhoud en is geen professioneel medisch, mentaal, juridisch, financieel of noodadvies van One2OneLove.', disabledTitle: 'Creatorprogrammering is voorbereid, maar nog niet live.', disabledText: 'De kalender, boekingsservice, databaseregels en veiligheidscontroles staan klaar achter een lanceringsschakelaar.', accessTitle: 'Goedgekeurde creatortoegang vereist', accessText: 'Zelf boeken is alleen beschikbaar voor goedgekeurde creatoraccounts.', day: 'Kalenderdatum', schedule: '24-uurs kamerschema', open: 'Vrij', booked: 'Geprogrammeerd', mine: 'Jouw programmering', bookTitle: 'Boek een vrije plek', programTitle: 'Programmatitel', description: 'Korte beschrijving', start: 'Starttijd', duration: 'Duur', mode: 'Programmatype', live: 'Live', replay: 'Herhaling', replayUrl: 'Herhalingslink', book: 'Gratis slot boeken', booking: 'Boeken…', refresh: 'Schema vernieuwen', cancel: 'Slot annuleren', noMine: 'Geen programmering geboekt voor deze datum.', timezone: 'Tijden in jouw tijdzone', free: 'GRATIS', paidLater: 'Betaalde slots: latere uitrol', minutes: 'minuten', loading: 'Creatorkalender laden…',
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

const timeLabel = (hour) => new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(2026, 0, 1, hour, 0));
const slotTimeLabel = (slot) => `${new Date(slot.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(slot.ends_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

export default function CreatorProgramming() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [date, setDate] = useState(localDateString());
  const [access, setAccess] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(CREATOR_PROGRAMMING_ENABLED);
  const [booking, setBooking] = useState(false);
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
      const accessResult = await getCreatorProgrammingAccess();
      setAccess(accessResult);
      if (!accessResult.eligible) return;
      const bounds = dateBounds(targetDate);
      const [published, own] = await Promise.all([
        listPublishedProgramming(bounds),
        listMyProgramming(bounds),
      ]);
      setSchedule(published);
      setMine(own.filter((slot) => slot.status === 'booked'));
    } catch (error) {
      toast.error(error?.message || 'Unable to load creator programming.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(date); }, [date]);

  const scheduleByHour = useMemo(() => {
    const grouped = new Map();
    for (const slot of schedule) {
      const start = new Date(slot.starts_at);
      const hour = start.getHours();
      const list = grouped.get(hour) || [];
      list.push(slot);
      grouped.set(hour, list);
    }
    return grouped;
  }, [schedule]);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !startTime) return;
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = startTime.split(':').map(Number);
    const starts = new Date(year, month - 1, day, hour, minute, 0, 0);
    const ends = new Date(starts.getTime() + Number(duration) * 60 * 1000);
    setBooking(true);
    try {
      await bookCreatorProgrammingSlot({
        title,
        description,
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        timezone,
        contentMode: mode,
        replayUrl,
      });
      toast.success('Creator programming slot booked.');
      setTitle('');
      setDescription('');
      setReplayUrl('');
      await load(date);
    } catch (error) {
      toast.error(error?.message || 'Unable to book this programming slot.');
    } finally {
      setBooking(false);
    }
  };

  const cancelSlot = async (slotId) => {
    try {
      await cancelCreatorProgrammingSlot(slotId);
      await load(date);
    } catch (error) {
      toast.error(error?.message || 'Unable to cancel this programming slot.');
    }
  };

  if (!CREATOR_PROGRAMMING_ENABLED) {
    return <main className="min-h-[70vh] bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] border border-violet-100 bg-white p-8 text-center shadow-xl"><Sparkles className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabledTitle}</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{t.disabledText}</p></div></main>;
  }

  if (loading && !access) {
    return <main className="min-h-[70vh] px-5 py-16"><div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl bg-white p-10 text-slate-600 shadow-lg"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div></main>;
  }

  if (access && !access.eligible) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.accessTitle}</h1><p className="mt-4 text-slate-600">{t.accessText}</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-600 px-5 py-14 text-white">
        <div className="mx-auto max-w-7xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.16em]"><Radio className="h-4 w-4" />{t.badge}</div><h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/90">{t.intro}</p><div className="mt-7 flex flex-wrap gap-3"><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-violet-700">{t.freeRule}</span><span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold">{t.paidRule}</span></div></div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>{t.notice}</strong></div>
        <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><label className="mb-2 block text-sm font-black text-slate-700">{t.day}</label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-52 bg-white" /></div><div className="flex items-center gap-3"><span className="text-xs font-bold text-slate-500">{t.timezone}: {timezone}</span><Button variant="outline" onClick={() => load(date)}><RotateCcw className="mr-2 h-4 w-4" />{t.refresh}</Button></div></div>
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b bg-slate-950 px-5 py-4 font-black text-white"><Clock3 className="h-5 w-5" />{t.schedule}</div>{HOURS.map((hour) => { const slots = scheduleByHour.get(hour) || []; return <div key={hour} className="grid min-h-16 grid-cols-[90px_1fr] border-b border-slate-100 last:border-b-0"><div className="border-r bg-slate-50 px-3 py-4 text-sm font-black text-slate-500">{timeLabel(hour)}</div><div className="p-2">{slots.length ? slots.map((slot) => <div key={slot.id} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black text-violet-950">{slot.title}</span><span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-black uppercase text-white">{slot.content_mode === 'replay' ? t.replay : t.live}</span></div><div className="mt-1 text-xs font-semibold text-violet-700">{slotTimeLabel(slot)} · {t.booked}</div></div>) : <div className="px-2 py-3 text-sm font-semibold text-emerald-700">{t.open}</div>}</div></div>; })}</div>
          </div>

          <div className="space-y-6">
            <form onSubmit={submit} className="rounded-[2rem] border border-violet-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-xl font-black"><CalendarDays className="h-5 w-5 text-violet-600" />{t.bookTitle}</div><div className="mt-5 space-y-4"><div><label className="mb-1.5 block text-sm font-bold">{t.programTitle}</label><Input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 120))} required /></div><div><label className="mb-1.5 block text-sm font-bold">{t.description}</label><textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 1000))} rows={3} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-sm font-bold">{t.start}</label><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></div><div><label className="mb-1.5 block text-sm font-bold">{t.duration}</label><select value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{DURATIONS.map((value) => <option key={value} value={value}>{value} {t.minutes}</option>)}</select></div></div><div><label className="mb-1.5 block text-sm font-bold">{t.mode}</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setMode('live')} className={`rounded-xl border p-3 text-sm font-black ${mode === 'live' ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200'}`}><Radio className="mx-auto mb-1 h-4 w-4" />{t.live}</button><button type="button" onClick={() => setMode('replay')} className={`rounded-xl border p-3 text-sm font-black ${mode === 'replay' ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200'}`}><Video className="mx-auto mb-1 h-4 w-4" />{t.replay}</button></div></div>{mode === 'replay' && <div><label className="mb-1.5 block text-sm font-bold">{t.replayUrl}</label><Input type="url" value={replayUrl} onChange={(event) => setReplayUrl(event.target.value.slice(0, 1000))} required /></div>}<Button type="submit" disabled={booking} className="w-full bg-violet-700 text-white hover:bg-violet-800">{booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{booking ? t.booking : t.book}</Button><div className="flex items-center justify-between text-xs font-bold text-slate-500"><span>{t.free}</span><span>{t.paidLater}</span></div></div></form>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{t.mine}</h2><div className="mt-4 space-y-3">{mine.length ? mine.map((slot) => <div key={slot.id} className="rounded-2xl border border-slate-200 p-4"><div className="font-black text-slate-900">{slot.title}</div><div className="mt-1 text-sm text-slate-500">{slotTimeLabel(slot)} · {slot.content_mode === 'replay' ? t.replay : t.live}</div><Button variant="outline" size="sm" className="mt-3" onClick={() => cancelSlot(slot.id)}>{t.cancel}</Button></div>) : <p className="text-sm leading-6 text-slate-500">{t.noMine}</p>}</div></div>
          </div>
        </div>
      </section>
    </main>
  );
}
