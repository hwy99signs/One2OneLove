import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Bot, CalendarDays, Flag, Heart, Loader2, MessageCircle, Radio, Send, Shield, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { LIVE_COMMUNITY_ROOMS, getLocalizedRoom } from '@/lib/liveCommunityRooms';
import { CREATOR_PROGRAMMING_ENABLED, getGlobalProgrammingStatus } from '@/lib/creatorProgrammingService';
import { buildPublicPresenceKey, enterPublicRoom, leavePublicRoom } from '@/lib/roomPresenceService';
import { listLiveRoomMessages, reportLiveRoomMessage, sendLiveRoomMessage, subscribeToLiveRoomMessages, toggleLiveRoomReaction } from '@/lib/liveRoomMessageService';
import { getLiveRoomHostPrompt } from '@/lib/liveRoomHostService';

const COPY = {
  en: {
    back: 'Back to Live Community', live: 'Live room', people: 'people here', human: 'human', humans: 'humans',
    topic: 'Conversation focus', emptyTitle: 'No one has said hello yet', emptyText: 'The room is open. You can be the first person to speak, or let the O2OL Host offer a gentle conversation starter.',
    hostLabel: 'AI conversation catalyst', hostRhythmTitle: 'Host rhythm', hostRhythmText: 'The O2OL Host may offer a brief prompt when the room is quiet, then steps back while members are talking.',
    rulesTitle: 'Keep the room human and respectful', rulesText: 'No harassment, threats, sexual exploitation, impersonation, private-information sharing, or dangerous advice. Report messages that need moderator review.',
    disclaimerTitle: 'Room notice', disclaimerText: 'Community conversations and creator programming are for discussion and education, not professional advice or emergency support.',
    programmingLive: 'Live now', programmingNext: 'Up next', programmingLiveType: 'Live program', programmingReplayType: 'Replay', manageProgramming: 'Manage creator programming',
    input: 'Share something with the room…', send: 'Send', signIn: 'Sign in to join the conversation.', signInButton: 'Sign In', sending: 'Sending…',
    loading: 'Loading room…', notFound: 'This live room is unavailable.', loadFailed: 'Unable to load room messages.', sendError: 'Unable to send your message.',
    report: 'Report', reportTitle: 'Report this message?', reportText: 'Reports are private moderator records. The reported member is not notified by this preview flow.',
    reportReason: 'Reason', reportPlaceholder: 'Briefly describe the concern…', cancel: 'Cancel', submitReport: 'Submit Report', reportFailed: 'Unable to submit the report.', reported: 'Report submitted.',
    reactions: 'Reactions', hostFallback: 'What is one small thing that helped you feel connected to someone this week?', roomUnavailable: 'Room unavailable',
  },
  es: {
    back: 'Volver a Comunidad en Vivo', live: 'Sala en vivo', people: 'personas aquí', human: 'persona', humans: 'personas', topic: 'Enfoque de conversación', emptyTitle: 'Nadie ha saludado todavía', emptyText: 'La sala está abierta. Puedes ser la primera persona en hablar o dejar que el Anfitrión O2OL ofrezca un tema suave para comenzar.', hostLabel: 'Catalizador de conversación IA', hostRhythmTitle: 'Ritmo del anfitrión', hostRhythmText: 'El Anfitrión O2OL puede ofrecer un breve tema cuando la sala está tranquila y luego se aparta mientras los miembros conversan.', rulesTitle: 'Mantén la sala humana y respetuosa', rulesText: 'No se permite acoso, amenazas, explotación sexual, suplantación, compartir información privada ni consejos peligrosos. Reporta mensajes que necesiten revisión.', disclaimerTitle: 'Aviso de la sala', disclaimerText: 'Las conversaciones de la comunidad y la programación de creadores son para diálogo y educación, no asesoramiento profesional ni apoyo de emergencia.', programmingLive: 'En vivo ahora', programmingNext: 'A continuación', programmingLiveType: 'Programa en vivo', programmingReplayType: 'Repetición', manageProgramming: 'Administrar programación de creadores', input: 'Comparte algo con la sala…', send: 'Enviar', signIn: 'Inicia sesión para unirte a la conversación.', signInButton: 'Iniciar Sesión', sending: 'Enviando…', loading: 'Cargando sala…', notFound: 'Esta sala no está disponible.', loadFailed: 'No se pudieron cargar los mensajes.', sendError: 'No se pudo enviar tu mensaje.', report: 'Reportar', reportTitle: '¿Reportar este mensaje?', reportText: 'Los reportes son registros privados para moderación. El miembro reportado no recibe una notificación de este flujo de vista previa.', reportReason: 'Motivo', reportPlaceholder: 'Describe brevemente la preocupación…', cancel: 'Cancelar', submitReport: 'Enviar Reporte', reportFailed: 'No se pudo enviar el reporte.', reported: 'Reporte enviado.', reactions: 'Reacciones', hostFallback: '¿Qué pequeña cosa te ayudó a sentirte conectado con alguien esta semana?', roomUnavailable: 'Sala no disponible',
  },
  fr: {
    back: 'Retour à la Communauté en Direct', live: 'Salle en direct', people: 'personnes ici', human: 'personne', humans: 'personnes', topic: 'Sujet de conversation', emptyTitle: "Personne n'a encore dit bonjour", emptyText: "La salle est ouverte. Vous pouvez être la première personne à parler ou laisser l'Hôte O2OL proposer un sujet doux.", hostLabel: 'Catalyseur de conversation IA', hostRhythmTitle: "Rythme de l'hôte", hostRhythmText: "L'Hôte O2OL peut proposer un court sujet lorsque la salle est calme, puis se retire pendant que les membres discutent.", rulesTitle: 'Gardez la salle humaine et respectueuse', rulesText: "Pas de harcèlement, menaces, exploitation sexuelle, usurpation, partage d'informations privées ou conseils dangereux. Signalez les messages qui nécessitent une revue.", disclaimerTitle: 'Avis du salon', disclaimerText: "Les conversations communautaires et les programmes de créateurs servent à l'échange et à l'éducation, et ne remplacent ni un conseil professionnel ni une aide d'urgence.", programmingLive: 'En direct maintenant', programmingNext: 'À suivre', programmingLiveType: 'Programme en direct', programmingReplayType: 'Rediffusion', manageProgramming: 'Gérer la programmation des créateurs', input: 'Partagez quelque chose avec la salle…', send: 'Envoyer', signIn: 'Connectez-vous pour rejoindre la conversation.', signInButton: 'Se Connecter', sending: 'Envoi…', loading: 'Chargement de la salle…', notFound: 'Cette salle est indisponible.', loadFailed: 'Impossible de charger les messages.', sendError: "Impossible d'envoyer votre message.", report: 'Signaler', reportTitle: 'Signaler ce message ?', reportText: "Les signalements sont des dossiers privés de modération. Le membre signalé n'est pas averti par ce flux d'aperçu.", reportReason: 'Raison', reportPlaceholder: 'Décrivez brièvement le problème…', cancel: 'Annuler', submitReport: 'Envoyer le Signalement', reportFailed: "Impossible d'envoyer le signalement.", reported: 'Signalement envoyé.', reactions: 'Réactions', hostFallback: "Quelle petite chose vous a aidé à vous sentir proche de quelqu'un cette semaine ?", roomUnavailable: 'Salle indisponible',
  },
  it: {
    back: 'Torna alla Community Live', live: 'Stanza live', people: 'persone qui', human: 'persona', humans: 'persone', topic: 'Focus della conversazione', emptyTitle: 'Nessuno ha ancora salutato', emptyText: "La stanza è aperta. Puoi essere la prima persona a parlare o lasciare che l'Host O2OL proponga un tema leggero.", hostLabel: 'Catalizzatore di conversazione IA', hostRhythmTitle: "Ritmo dell'host", hostRhythmText: "L'Host O2OL può proporre un breve spunto quando la stanza è tranquilla, poi si fa da parte mentre i membri parlano.", rulesTitle: 'Mantieni la stanza umana e rispettosa', rulesText: 'Niente molestie, minacce, sfruttamento sessuale, impersonificazione, condivisione di informazioni private o consigli pericolosi. Segnala i messaggi che richiedono revisione.', disclaimerTitle: 'Avviso della stanza', disclaimerText: 'Le conversazioni della community e i programmi dei creator sono destinati al confronto e alla formazione, non a consulenza professionale o supporto di emergenza.', programmingLive: 'In onda ora', programmingNext: 'Prossimamente', programmingLiveType: 'Programma live', programmingReplayType: 'Replica', manageProgramming: 'Gestisci programmazione creator', input: 'Condividi qualcosa con la stanza…', send: 'Invia', signIn: 'Accedi per unirti alla conversazione.', signInButton: 'Accedi', sending: 'Invio…', loading: 'Caricamento stanza…', notFound: 'Questa stanza non è disponibile.', loadFailed: 'Impossibile caricare i messaggi.', sendError: 'Impossibile inviare il messaggio.', report: 'Segnala', reportTitle: 'Segnalare questo messaggio?', reportText: "Le segnalazioni sono registri privati di moderazione. Il membro segnalato non viene avvisato da questo flusso di anteprima.", reportReason: 'Motivo', reportPlaceholder: 'Descrivi brevemente il problema…', cancel: 'Annulla', submitReport: 'Invia Segnalazione', reportFailed: 'Impossibile inviare la segnalazione.', reported: 'Segnalazione inviata.', reactions: 'Reazioni', hostFallback: 'Quale piccola cosa ti ha aiutato a sentirti vicino a qualcuno questa settimana?', roomUnavailable: 'Stanza non disponibile',
  },
  de: {
    back: 'Zurück zur Live-Community', live: 'Live-Raum', people: 'Personen hier', human: 'Person', humans: 'Personen', topic: 'Gesprächsfokus', emptyTitle: 'Noch niemand hat Hallo gesagt', emptyText: 'Der Raum ist offen. Du kannst als Erste oder Erster sprechen oder den O2OL-Host einen sanften Gesprächsimpuls geben lassen.', hostLabel: 'KI-Gesprächsimpuls', hostRhythmTitle: 'Host-Rhythmus', hostRhythmText: 'Der O2OL-Host kann bei Ruhe einen kurzen Impuls geben und tritt zurück, während Mitglieder sprechen.', rulesTitle: 'Menschlich und respektvoll bleiben', rulesText: 'Keine Belästigung, Drohungen, sexuelle Ausbeutung, Identitätsvortäuschung, Weitergabe privater Informationen oder gefährliche Ratschläge. Melde Nachrichten, die moderiert werden sollten.', disclaimerTitle: 'Raumhinweis', disclaimerText: 'Community-Gespräche und Creator-Programme dienen dem Austausch und der Bildung und ersetzen keine professionelle Beratung oder Notfallhilfe.', programmingLive: 'Jetzt live', programmingNext: 'Als Nächstes', programmingLiveType: 'Live-Programm', programmingReplayType: 'Wiederholung', manageProgramming: 'Creator-Programm verwalten', input: 'Teile etwas mit dem Raum…', send: 'Senden', signIn: 'Melde dich an, um am Gespräch teilzunehmen.', signInButton: 'Anmelden', sending: 'Wird gesendet…', loading: 'Raum wird geladen…', notFound: 'Dieser Live-Raum ist nicht verfügbar.', loadFailed: 'Raumnachrichten konnten nicht geladen werden.', sendError: 'Deine Nachricht konnte nicht gesendet werden.', report: 'Melden', reportTitle: 'Diese Nachricht melden?', reportText: 'Meldungen sind private Moderationsunterlagen. Das gemeldete Mitglied wird durch diesen Vorschauablauf nicht benachrichtigt.', reportReason: 'Grund', reportPlaceholder: 'Beschreibe kurz das Problem…', cancel: 'Abbrechen', submitReport: 'Meldung Senden', reportFailed: 'Meldung konnte nicht gesendet werden.', reported: 'Meldung gesendet.', reactions: 'Reaktionen', hostFallback: 'Welche kleine Sache hat dir diese Woche geholfen, dich jemandem verbunden zu fühlen?', roomUnavailable: 'Raum nicht verfügbar',
  },
  nl: {
    back: 'Terug naar Live Community', live: 'Livekamer', people: 'mensen hier', human: 'persoon', humans: 'mensen', topic: 'Gespreksfocus', emptyTitle: 'Nog niemand heeft hallo gezegd', emptyText: 'De kamer is open. Jij kunt als eerste iets zeggen of de O2OL Host een rustige gespreksstarter laten geven.', hostLabel: 'AI-gespreksstarter', hostRhythmTitle: 'Hostritme', hostRhythmText: 'De O2OL Host kan een korte prompt geven wanneer de kamer stil is en doet daarna een stap terug terwijl leden praten.', rulesTitle: 'Houd de kamer menselijk en respectvol', rulesText: 'Geen intimidatie, bedreigingen, seksuele uitbuiting, imitatie, delen van privé-informatie of gevaarlijk advies. Meld berichten die moderatie nodig hebben.', disclaimerTitle: 'Kamerbericht', disclaimerText: 'Communitygesprekken en programma’s van makers zijn bedoeld voor gesprek en educatie, niet als professioneel advies of noodhulp.', programmingLive: 'Nu live', programmingNext: 'Hierna', programmingLiveType: 'Liveprogramma', programmingReplayType: 'Herhaling', manageProgramming: 'Creatorprogrammering beheren', input: 'Deel iets met de kamer…', send: 'Versturen', signIn: 'Log in om mee te praten.', signInButton: 'Inloggen', sending: 'Versturen…', loading: 'Kamer laden…', notFound: 'Deze livekamer is niet beschikbaar.', loadFailed: 'Kamerberichten konden niet worden geladen.', sendError: 'Je bericht kon niet worden verstuurd.', report: 'Melden', reportTitle: 'Dit bericht melden?', reportText: 'Meldingen zijn privé-moderatierecords. Het gemelde lid krijgt via deze preview geen melding.', reportReason: 'Reden', reportPlaceholder: 'Beschrijf kort het probleem…', cancel: 'Annuleren', submitReport: 'Melding Versturen', reportFailed: 'Melding kon niet worden verstuurd.', reported: 'Melding verstuurd.', reactions: 'Reacties', hostFallback: 'Welke kleine gebeurtenis hielp je deze week om je met iemand verbonden te voelen?', roomUnavailable: 'Kamer niet beschikbaar',
  },
};

const LIVE_ROOM_I18N_EXTRAS = {
  en: { hostName: 'O2OL Host', reactionAria: (emoji) => `React ${emoji}` },
  es: { hostName: 'Anfitrión O2OL', reactionAria: (emoji) => `Reaccionar ${emoji}` },
  fr: { hostName: 'Hôte O2OL', reactionAria: (emoji) => `Réagir ${emoji}` },
  it: { hostName: 'Host O2OL', reactionAria: (emoji) => `Reagisci ${emoji}` },
  de: { hostName: 'O2OL-Host', reactionAria: (emoji) => `Reagieren ${emoji}` },
  nl: { hostName: 'O2OL-host', reactionAria: (emoji) => `Reageren ${emoji}` },
};

const ROOM_VISUALS = {
  violet: { page: 'from-violet-50 via-white to-fuchsia-50', icon: 'from-violet-600 to-fuchsia-600' },
  rose: { page: 'from-rose-50 via-white to-orange-50', icon: 'from-rose-600 to-orange-500' },
  sky: { page: 'from-sky-50 via-white to-cyan-50', icon: 'from-sky-600 to-cyan-500' },
  amber: { page: 'from-amber-50 via-white to-yellow-50', icon: 'from-amber-600 to-yellow-500' },
  emerald: { page: 'from-emerald-50 via-white to-teal-50', icon: 'from-emerald-600 to-teal-500' },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };
const REACTION_OPTIONS = ['❤️', '👍', '🤔'];

const safeName = (message) => String(message?.sender_name || '').trim() || '—';
const initialFor = (name) => String(name || '?').trim().slice(0, 1).toUpperCase() || '?';

function timeLabel(value, locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function programmingTimeLabel(slot, locale) {
  if (!slot?.starts_at) return '';
  const start = new Date(slot.starts_at);
  const end = new Date(slot.ends_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  return `${start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
}

function ReactionBar({ message, onReact, t }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {REACTION_OPTIONS.map((emoji) => {
        const reaction = (message.reactions || []).find((item) => item.reaction === emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(message, emoji)}
            aria-label={t.reactionAria(emoji)}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${reaction?.reacted_by_me ? 'border-pink-300 bg-pink-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            {emoji}{reaction?.count ? ` ${reaction.count}` : ''}
          </button>
        );
      })}
    </div>
  );
}

function ProgrammingStatus({ status, locale, t }) {
  if (!status?.enabled || (!status.current && !status.next)) return null;

  const cards = [
    status.current ? { slot: status.current, label: t.programmingLive, live: true } : null,
    status.next ? { slot: status.next, label: t.programmingNext, live: false } : null,
  ].filter(Boolean);

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {cards.map(({ slot, label, live }) => (
        <div key={`${label}-${slot.id}`} className={`rounded-2xl border p-4 ${live ? 'border-rose-200 bg-rose-50' : 'border-violet-200 bg-violet-50'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] ${live ? 'text-rose-700' : 'text-violet-700'}`}>
              {live ? <Radio className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}{label}
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase text-slate-600">
              {slot.content_mode === 'replay' ? t.programmingReplayType : t.programmingLiveType}
            </span>
          </div>
          <div className="mt-2 font-black text-slate-950">{slot.title}</div>
          {slot.description ? <p className="mt-1 text-sm leading-6 text-slate-600">{slot.description}</p> : null}
          <div className="mt-2 text-xs font-bold text-slate-500">{programmingTimeLabel(slot, locale)}</div>
        </div>
      ))}
    </div>
  );
}

function ReportDialog({ open, onOpenChange, t, onSubmit, busy }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.reportTitle}</DialogTitle>
          <DialogDescription>{t.reportText}</DialogDescription>
        </DialogHeader>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">{t.reportReason}</label>
          <Input value={reason} onChange={(event) => setReason(event.target.value.slice(0, 500))} placeholder={t.reportPlaceholder} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button type="button" disabled={busy || reason.trim().length < 3} onClick={() => onSubmit(reason.trim())}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
            {t.submitReport}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LiveRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = { ...COPY[language], ...(LIVE_ROOM_I18N_EXTRAS[language] || LIVE_ROOM_I18N_EXTRAS.en) };
  const locale = localeByLanguage[language] || 'en-US';
  const roomSlug = searchParams.get('room') || '';
  const baseRoom = LIVE_COMMUNITY_ROOMS.find((candidate) => candidate.slug === roomSlug) || null;
  const room = baseRoom ? getLocalizedRoom(baseRoom, language) : null;
  const visuals = ROOM_VISUALS[room?.accent] || ROOM_VISUALS.violet;
  const [presenceKey] = useState(() => buildPublicPresenceKey());
  const [humanCount, setHumanCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [hostPrompt, setHostPrompt] = useState('');
  const [programmingStatus, setProgrammingStatus] = useState({ enabled: false, current: null, next: null });
  const [loading, setLoading] = useState(Boolean(room));
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [error, setError] = useState('');

  const canManageCreatorProgramming = Boolean(
    room?.slug === 'global-relationship-room'
    && CREATOR_PROGRAMMING_ENABLED
    && isAuthenticated
    && user?.user_type === 'influencer'
  );

  const loadMessages = async () => {
    if (!room) return;
    try {
      setMessages(await listLiveRoomMessages(room.slug, 100));
    } catch (loadError) {
      console.error('Unable to load live room messages:', loadError);
      toast.error(t.loadFailed);
    }
  };

  useEffect(() => {
    if (!room) {
      setLoading(false);
      setError(t.notFound);
      return undefined;
    }

    let mounted = true;
    setLoading(true);
    setError('');
    setProgrammingStatus({ enabled: false, current: null, next: null });

    const programmingRequest = room.slug === 'global-relationship-room' && CREATOR_PROGRAMMING_ENABLED && isAuthenticated
      ? getGlobalProgrammingStatus().catch(() => ({ enabled: false, current: null, next: null }))
      : Promise.resolve({ enabled: false, current: null, next: null });

    Promise.all([
      listLiveRoomMessages(room.slug, 100),
      getLiveRoomHostPrompt({ room, language, recentMessages: [] }).catch(() => null),
      programmingRequest,
    ]).then(([loadedMessages, host, programming]) => {
      if (!mounted) return;
      setMessages(loadedMessages || []);
      setHostPrompt(host?.text || room.topic || t.hostFallback);
      setProgrammingStatus(programming || { enabled: false, current: null, next: null });
      setLoading(false);
    }).catch((loadError) => {
      console.error('Unable to initialize live room:', loadError);
      if (!mounted) return;
      setError(t.loadFailed);
      setLoading(false);
    });

    const releasePresence = enterPublicRoom(room.slug, presenceKey, (count) => {
      if (mounted) setHumanCount(count);
    });

    const unsubscribeMessages = subscribeToLiveRoomMessages(room.slug, () => {
      if (mounted) void loadMessages();
    });

    return () => {
      mounted = false;
      releasePresence?.();
      unsubscribeMessages?.();
      leavePublicRoom(room.slug, presenceKey);
    };
  }, [room?.slug, language, presenceKey, isAuthenticated]);

  const activeHostPrompt = useMemo(() => hostPrompt || room?.topic || t.hostFallback, [hostPrompt, room?.topic, t.hostFallback]);
  const showHostPrompt = !messages.length;

  const submitMessage = async (event) => {
    event.preventDefault();
    if (!isAuthenticated || !user?.id || !room || !draft.trim() || sending) return;
    setSending(true);
    try {
      await sendLiveRoomMessage(room.slug, draft);
      setDraft('');
      await loadMessages();
    } catch (sendFailure) {
      console.error('Unable to send live room message:', sendFailure);
      toast.error(t.sendError);
    } finally {
      setSending(false);
    }
  };

  const react = async (message, reaction) => {
    if (!isAuthenticated || !user?.id || message.virtual) return;
    try {
      const existing = (message.reactions || []).find((item) => item.reaction === reaction);
      await toggleLiveRoomReaction(message.id, reaction, !existing?.reacted_by_me);
      await loadMessages();
    } catch (reactionError) {
      console.warn('Live room reaction unavailable:', reactionError);
    }
  };

  const submitReport = async (reason) => {
    if (!reportingMessage) return;
    setReportBusy(true);
    try {
      await reportLiveRoomMessage(reportingMessage.id, reason);
      toast.success(t.reported);
      setReportingMessage(null);
    } catch (reportError) {
      console.error('Unable to submit live room report:', reportError);
      toast.error(t.reportFailed);
    } finally {
      setReportBusy(false);
    }
  };

  if (!room) {
    return (
      <main className="min-h-[70vh] bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-16">
        <div className="mx-auto max-w-xl text-center"><AlertTriangle className="mx-auto h-12 w-12 text-amber-600" /><h1 className="mt-4 text-2xl font-black text-slate-900">{t.roomUnavailable}</h1><p className="mt-2 text-slate-600">{error || t.notFound}</p><Button className="mt-6" onClick={() => navigate('/Community')}>{t.back}</Button></div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-gradient-to-br ${visuals.page} px-4 py-8`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/Community')}><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManageCreatorProgramming ? (
              <Button variant="outline" onClick={() => navigate('/CreatorProgramming')} className="border-violet-200 bg-white/90 text-violet-800 shadow-sm hover:bg-violet-50">
                <CalendarDays className="mr-2 h-4 w-4" />{t.manageProgramming}
              </Button>
            ) : null}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur"><Users className="h-4 w-4 text-green-600" />{humanCount} {humanCount === 1 ? t.human : t.humans}</div>
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl backdrop-blur">
          <div className="border-b border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${visuals.icon} text-white shadow-lg`}><Heart className="h-7 w-7 fill-white" /></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-pink-700">{t.live}</p><h1 className="text-3xl font-black text-slate-950">{room.name}</h1><p className="mt-1 text-sm text-slate-600">{room.description}</p></div></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{t.topic}</p><p className="mt-1 max-w-sm text-sm font-semibold text-slate-700">{room.topic}</p></div>
            </div>
            <ProgrammingStatus status={programmingStatus} locale={locale} t={t} />
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><span className="font-black">{t.disclaimerTitle}:</span> {t.disclaimerText}</div></div>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px]">
            <div className="min-h-[34rem] border-b border-slate-100 p-5 lg:border-b-0 lg:border-r sm:p-6">
              {loading ? (
                <div className="flex min-h-[24rem] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.loading}</div>
              ) : (
                <div className="space-y-4">
                  {showHostPrompt && (
                    <article className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                      <div className="flex items-start gap-3"><div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-purple-700 text-white"><Bot className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-black text-purple-950">{t.hostName}</span><span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-purple-700">{t.hostLabel}</span></div><p className="mt-2 leading-7 text-purple-950">{activeHostPrompt}</p></div></div>
                    </article>
                  )}

                  {!messages.length && !showHostPrompt ? <div className="py-16 text-center"><MessageCircle className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 text-xl font-black text-slate-700">{t.emptyTitle}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{t.emptyText}</p></div> : null}

                  {messages.map((message) => {
                    const senderName = safeName(message);
                    return (
                      <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-sm font-black text-white">{initialFor(senderName)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="font-black text-slate-900">{senderName}</span><span className="ml-2 text-xs text-slate-400">{timeLabel(message.created_at, locale)}</span></div>{message.sender_id !== user?.id && <button type="button" onClick={() => setReportingMessage(message)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-600"><Flag className="h-3.5 w-3.5" />{t.report}</button>}</div>
                            <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-slate-700">{message.content}</p>
                            <ReactionBar message={message} onReact={react} t={t} />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-5">
                {isAuthenticated ? (
                  <form onSubmit={submitMessage} className="flex gap-2"><Input value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 1200))} placeholder={t.input} className="h-12" /><Button type="submit" disabled={sending || !draft.trim()} className="h-12 bg-gradient-to-r from-pink-600 to-purple-600 px-5 text-white">{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{sending ? t.sending : t.send}</Button></form>
                ) : (
                  <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-center sm:flex-row sm:text-left"><p className="font-semibold text-slate-700">{t.signIn}</p><Button onClick={() => navigate(`/SignIn?returnTo=${encodeURIComponent(`/LiveRoom?room=${room.slug}`)}`)}>{t.signInButton}</Button></div>
                )}
              </div>
            </div>

            <aside className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4"><div className="flex items-center gap-2 font-black text-purple-900"><Bot className="h-5 w-5" />{t.hostRhythmTitle}</div><p className="mt-2 text-sm leading-6 text-purple-800">{t.hostRhythmText}</p></div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-center gap-2 font-black text-blue-900"><Shield className="h-5 w-5" />{t.rulesTitle}</div><p className="mt-2 text-sm leading-6 text-blue-800">{t.rulesText}</p></div>
            </aside>
          </div>
        </section>
      </div>

      <ReportDialog open={Boolean(reportingMessage)} onOpenChange={(open) => { if (!open) setReportingMessage(null); }} t={t} busy={reportBusy} onSubmit={submitReport} />
    </main>
  );
}
