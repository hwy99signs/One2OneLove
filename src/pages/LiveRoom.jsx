import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Flag,
  Heart,
  MessageCircleHeart,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getLiveCommunityRoom, getLocalizedRoom, getRoomActivityLabel } from "@/lib/liveCommunityRooms";
import { joinRoomPresence } from "@/lib/roomPresenceService";
import { getLiveRoomHostPrompt } from "@/lib/liveRoomHostService";
import {
  deleteOwnRoomMessage,
  getRoomMessages,
  REACTIONS,
  REPORT_REASONS,
  reportRoomMessage,
  sendRoomMessage,
  subscribeToRoomMessages,
  toggleRoomReaction,
} from "@/lib/liveRoomMessageService";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";
import { createPageUrl } from "@/utils";

const HOST_IDLE_MS = 90_000;

const localeByLanguage = {
  en: "en-US",
  es: "es",
  fr: "fr",
  it: "it",
  de: "de",
  nl: "nl",
};

const copy = {
  en: {
    allRooms: "All Live Rooms",
    roomLabel: "Live Community Room",
    hostReady: "Host topic ready",
    livePrompt: "live prompt",
    quietExplain: "The room has been quiet for a bit, so the host offers one invitation back into the conversation. Once members begin talking again, the host steps away.",
    waitingExplain: "A conversation is always waiting here. Once members start talking, the host moves into the background.",
    you: "You",
    deletePrompt: "Delete this message from the room?",
    deleteAria: "Delete your message",
    report: "Report",
    reportAria: "Report message",
    serviceWaitTitle: "Group messaging is built and waiting for database activation.",
    serviceWaitText: "The realtime interface, reactions, member message deletion, reporting controls, and AI-host handoff are prepared on the development branch. The approved messaging migration has not been applied yet.",
    loadError: "The room message service could not load yet.",
    sendError: "Message could not be sent.",
    reactionError: "Reaction could not be updated.",
    deleteError: "Your message could not be deleted.",
    write: "Say something to the room…",
    lockedWrite: "Messaging will unlock after the secure room tables are activated.",
    sendAria: "Send message",
    roomRuleShort: "Be real. Be respectful. Tell the story, not the person.",
    joinTitle: "Want to join this conversation?",
    joinText: "Sign in or create a free account to participate. We’ll bring you back to this room.",
    signIn: "Sign in",
    joinFree: "Join free",
    activityTitle: "Room activity",
    activityActive: (label) => `${label}. This count reflects signed-in members currently inside this room.`,
    activityQuiet: "When signed-in members are inside this room, their real count appears here. Otherwise the host topic takes its place instead of showing ‘0’.",
    standardTitle: "Room standard",
    standardLead: "Tell the story. Don’t expose the person.",
    standardText: "No doxxing, targeted humiliation, threats, or turning a relationship discussion into a public attack. Members can report another member’s message for review.",
    hostRhythmTitle: "AI Host rhythm",
    hostRhythmText: "Humans talking: host listens. About 90 seconds of quiet: host invites. Conversation resumes: host disappears again.",
    footerTitle: "O2OL is built for the conversation after the match.",
    footerText: "Connection, communication, growth, and everyday love.",
    reportSafety: "Community safety",
    reportTitle: "Report this message",
    closeReport: "Close report dialog",
    reportWhy: "Why are you reporting it?",
    selectReason: "Select a reason",
    details: "Additional details",
    optional: "optional",
    detailsPlaceholder: "Add context that will help us review the report.",
    cancel: "Cancel",
    submitReport: "Submit report",
    reportSubmitted: "Report submitted for review.",
    reportFailed: "Report could not be submitted.",
    reasonLabels: {
      harassment: "Harassment or targeted humiliation",
      personal_information: "Sharing private or identifying information",
      threats: "Threats or unsafe behavior",
      spam: "Spam or disruptive posting",
      other: "Something else",
    },
  },
  es: {
    allRooms: "Todas las Salas en Vivo", roomLabel: "Sala de Comunidad en Vivo", hostReady: "Tema del anfitrión listo", livePrompt: "tema en vivo",
    quietExplain: "La sala lleva un rato tranquila, así que el anfitrión ofrece una invitación para retomar la conversación. Cuando los miembros vuelven a hablar, el anfitrión se aparta.", waitingExplain: "Siempre hay una conversación esperando aquí. Cuando los miembros empiezan a hablar, el anfitrión pasa a segundo plano.",
    you: "Tú", deletePrompt: "¿Eliminar este mensaje de la sala?", deleteAria: "Eliminar tu mensaje", report: "Reportar", reportAria: "Reportar mensaje",
    serviceWaitTitle: "La mensajería grupal está construida y espera la activación de la base de datos.", serviceWaitText: "La interfaz en tiempo real, reacciones, eliminación de mensajes propios, controles de reporte y relevo del anfitrión de IA están preparados en la rama de desarrollo. La migración de mensajería aprobada aún no se ha aplicado.",
    loadError: "El servicio de mensajes de la sala todavía no pudo cargar.", sendError: "No se pudo enviar el mensaje.", reactionError: "No se pudo actualizar la reacción.", deleteError: "No se pudo eliminar tu mensaje.",
    write: "Di algo a la sala…", lockedWrite: "La mensajería se activará cuando estén listas las tablas seguras de la sala.", sendAria: "Enviar mensaje", roomRuleShort: "Sé auténtico. Sé respetuoso. Cuenta la historia, no expongas a la persona.",
    joinTitle: "¿Quieres unirte a esta conversación?", joinText: "Inicia sesión o crea una cuenta gratis para participar. Te traeremos de vuelta a esta sala.", signIn: "Iniciar sesión", joinFree: "Unirse gratis",
    activityTitle: "Actividad de la sala", activityActive: (label) => `${label}. Este número refleja los miembros conectados que están actualmente en esta sala.`, activityQuiet: "Cuando hay miembros conectados dentro de esta sala, aparece su número real. De lo contrario, el tema del anfitrión ocupa su lugar en vez de mostrar ‘0’.",
    standardTitle: "Norma de la sala", standardLead: "Cuenta la historia. No expongas a la persona.", standardText: "Nada de doxxing, humillación dirigida, amenazas ni convertir una conversación de pareja en un ataque público. Los miembros pueden reportar mensajes para revisión.",
    hostRhythmTitle: "Ritmo del Anfitrión IA", hostRhythmText: "Si las personas hablan, el anfitrión escucha. Tras unos 90 segundos de silencio, invita. Cuando vuelve la conversación, se aparta otra vez.", footerTitle: "O2OL está hecho para la conversación que viene después del match.", footerText: "Conexión, comunicación, crecimiento y amor cotidiano.",
    reportSafety: "Seguridad de la comunidad", reportTitle: "Reportar este mensaje", closeReport: "Cerrar reporte", reportWhy: "¿Por qué lo estás reportando?", selectReason: "Selecciona un motivo", details: "Detalles adicionales", optional: "opcional", detailsPlaceholder: "Agrega contexto que nos ayude a revisar el reporte.", cancel: "Cancelar", submitReport: "Enviar reporte", reportSubmitted: "Reporte enviado para revisión.", reportFailed: "No se pudo enviar el reporte.",
    reasonLabels: { harassment: "Acoso o humillación dirigida", personal_information: "Compartir información privada o identificable", threats: "Amenazas o conducta insegura", spam: "Spam o publicaciones disruptivas", other: "Otro motivo" },
  },
  fr: {
    allRooms: "Tous les Salons en Direct", roomLabel: "Salon de Communauté en Direct", hostReady: "Sujet de l’hôte prêt", livePrompt: "sujet en direct",
    quietExplain: "Le salon est calme depuis un moment, alors l’hôte propose une invitation pour relancer la conversation. Dès que les membres recommencent à parler, l’hôte s’efface.", waitingExplain: "Une conversation vous attend toujours ici. Dès que les membres commencent à parler, l’hôte passe à l’arrière-plan.",
    you: "Vous", deletePrompt: "Supprimer ce message du salon ?", deleteAria: "Supprimer votre message", report: "Signaler", reportAria: "Signaler le message",
    serviceWaitTitle: "La messagerie de groupe est prête et attend l’activation de la base de données.", serviceWaitText: "L’interface temps réel, les réactions, la suppression de ses propres messages, les signalements et le relais de l’hôte IA sont prêts sur la branche de développement. La migration de messagerie approuvée n’a pas encore été appliquée.",
    loadError: "Le service de messages du salon ne peut pas encore se charger.", sendError: "Le message n’a pas pu être envoyé.", reactionError: "La réaction n’a pas pu être mise à jour.", deleteError: "Votre message n’a pas pu être supprimé.",
    write: "Dites quelque chose au salon…", lockedWrite: "La messagerie sera disponible après l’activation des tables sécurisées du salon.", sendAria: "Envoyer le message", roomRuleShort: "Soyez vrai. Soyez respectueux. Racontez l’histoire, n’exposez pas la personne.",
    joinTitle: "Envie de rejoindre cette conversation ?", joinText: "Connectez-vous ou créez un compte gratuit pour participer. Nous vous ramènerons dans ce salon.", signIn: "Se connecter", joinFree: "Rejoindre gratuitement",
    activityTitle: "Activité du salon", activityActive: (label) => `${label}. Ce nombre correspond aux membres connectés actuellement présents dans ce salon.`, activityQuiet: "Quand des membres connectés sont présents, leur nombre réel apparaît ici. Sinon, le sujet de l’hôte prend sa place au lieu d’afficher ‘0’.",
    standardTitle: "Règle du salon", standardLead: "Racontez l’histoire. N’exposez pas la personne.", standardText: "Pas de divulgation d’informations privées, d’humiliation ciblée, de menaces ni de transformation d’une discussion relationnelle en attaque publique. Les membres peuvent signaler un message pour examen.",
    hostRhythmTitle: "Rythme de l’Hôte IA", hostRhythmText: "Les humains parlent : l’hôte écoute. Environ 90 secondes de silence : l’hôte invite. La conversation reprend : l’hôte s’efface de nouveau.", footerTitle: "O2OL est conçu pour la conversation après le match.", footerText: "Connexion, communication, évolution et amour au quotidien.",
    reportSafety: "Sécurité de la communauté", reportTitle: "Signaler ce message", closeReport: "Fermer le signalement", reportWhy: "Pourquoi le signalez-vous ?", selectReason: "Choisir un motif", details: "Détails supplémentaires", optional: "facultatif", detailsPlaceholder: "Ajoutez le contexte qui nous aidera à examiner le signalement.", cancel: "Annuler", submitReport: "Envoyer le signalement", reportSubmitted: "Signalement envoyé pour examen.", reportFailed: "Le signalement n’a pas pu être envoyé.",
    reasonLabels: { harassment: "Harcèlement ou humiliation ciblée", personal_information: "Partage d’informations privées ou identifiantes", threats: "Menaces ou comportement dangereux", spam: "Spam ou publications perturbatrices", other: "Autre chose" },
  },
  it: {
    allRooms: "Tutte le Stanze Live", roomLabel: "Stanza Community Live", hostReady: "Argomento dell’host pronto", livePrompt: "spunto live",
    quietExplain: "La stanza è tranquilla da un po’, quindi l’host propone un invito per riaprire la conversazione. Quando i membri riprendono a parlare, l’host torna a farsi da parte.", waitingExplain: "Qui c’è sempre una conversazione pronta. Quando i membri iniziano a parlare, l’host passa in secondo piano.",
    you: "Tu", deletePrompt: "Eliminare questo messaggio dalla stanza?", deleteAria: "Elimina il tuo messaggio", report: "Segnala", reportAria: "Segnala messaggio",
    serviceWaitTitle: "La messaggistica di gruppo è pronta e attende l’attivazione del database.", serviceWaitText: "Interfaccia realtime, reazioni, eliminazione dei propri messaggi, segnalazioni e passaggio all’host IA sono pronti nel ramo di sviluppo. La migrazione di messaggistica approvata non è ancora stata applicata.",
    loadError: "Il servizio messaggi della stanza non è ancora disponibile.", sendError: "Il messaggio non è stato inviato.", reactionError: "La reazione non è stata aggiornata.", deleteError: "Il tuo messaggio non è stato eliminato.",
    write: "Scrivi qualcosa alla stanza…", lockedWrite: "La messaggistica si sbloccherà dopo l’attivazione delle tabelle sicure della stanza.", sendAria: "Invia messaggio", roomRuleShort: "Sii autentico. Sii rispettoso. Racconta la storia, non esporre la persona.",
    joinTitle: "Vuoi entrare nella conversazione?", joinText: "Accedi o crea un account gratuito per partecipare. Ti riporteremo in questa stanza.", signIn: "Accedi", joinFree: "Entra gratis",
    activityTitle: "Attività della stanza", activityActive: (label) => `${label}. Questo numero riflette i membri autenticati attualmente presenti nella stanza.`, activityQuiet: "Quando ci sono membri autenticati nella stanza, appare il loro numero reale. Altrimenti compare il tema dell’host invece di mostrare ‘0’.",
    standardTitle: "Regola della stanza", standardLead: "Racconta la storia. Non esporre la persona.", standardText: "Niente doxxing, umiliazione mirata, minacce o trasformazione di una discussione di coppia in un attacco pubblico. I membri possono segnalare un messaggio per la revisione.",
    hostRhythmTitle: "Ritmo dell’Host IA", hostRhythmText: "Le persone parlano: l’host ascolta. Circa 90 secondi di silenzio: invita. La conversazione riparte: l’host si fa di nuovo da parte.", footerTitle: "O2OL è costruito per la conversazione dopo il match.", footerText: "Connessione, comunicazione, crescita e amore quotidiano.",
    reportSafety: "Sicurezza della community", reportTitle: "Segnala questo messaggio", closeReport: "Chiudi segnalazione", reportWhy: "Perché lo stai segnalando?", selectReason: "Seleziona un motivo", details: "Dettagli aggiuntivi", optional: "facoltativo", detailsPlaceholder: "Aggiungi il contesto che ci aiuterà a esaminare la segnalazione.", cancel: "Annulla", submitReport: "Invia segnalazione", reportSubmitted: "Segnalazione inviata per la revisione.", reportFailed: "Impossibile inviare la segnalazione.",
    reasonLabels: { harassment: "Molestie o umiliazione mirata", personal_information: "Condivisione di informazioni private o identificative", threats: "Minacce o comportamento pericoloso", spam: "Spam o pubblicazioni disturbanti", other: "Altro" },
  },
  de: {
    allRooms: "Alle Live-Räume", roomLabel: "Live-Community-Raum", hostReady: "Host-Thema bereit", livePrompt: "Live-Impuls",
    quietExplain: "Der Raum ist seit einer Weile ruhig, deshalb bietet der Host eine Einladung zurück ins Gespräch an. Sobald Mitglieder wieder miteinander sprechen, tritt der Host zurück.", waitingExplain: "Hier wartet immer ein Gespräch. Sobald Mitglieder anfangen zu reden, geht der Host in den Hintergrund.",
    you: "Du", deletePrompt: "Diese Nachricht aus dem Raum löschen?", deleteAria: "Deine Nachricht löschen", report: "Melden", reportAria: "Nachricht melden",
    serviceWaitTitle: "Gruppen-Messaging ist gebaut und wartet auf die Datenbankaktivierung.", serviceWaitText: "Realtime-Oberfläche, Reaktionen, Löschen eigener Nachrichten, Meldefunktionen und KI-Host-Übergabe sind im Entwicklungszweig vorbereitet. Die genehmigte Messaging-Migration wurde noch nicht angewendet.",
    loadError: "Der Nachrichtendienst des Raums konnte noch nicht geladen werden.", sendError: "Die Nachricht konnte nicht gesendet werden.", reactionError: "Die Reaktion konnte nicht aktualisiert werden.", deleteError: "Deine Nachricht konnte nicht gelöscht werden.",
    write: "Sag etwas in den Raum…", lockedWrite: "Messaging wird nach Aktivierung der sicheren Raumtabellen freigeschaltet.", sendAria: "Nachricht senden", roomRuleShort: "Sei echt. Sei respektvoll. Erzähl die Geschichte, stell die Person nicht bloß.",
    joinTitle: "Möchtest du an diesem Gespräch teilnehmen?", joinText: "Melde dich an oder erstelle ein kostenloses Konto. Wir bringen dich danach in diesen Raum zurück.", signIn: "Anmelden", joinFree: "Kostenlos beitreten",
    activityTitle: "Raumaktivität", activityActive: (label) => `${label}. Diese Zahl entspricht den angemeldeten Mitgliedern, die sich gerade in diesem Raum befinden.`, activityQuiet: "Wenn angemeldete Mitglieder im Raum sind, erscheint hier ihre echte Anzahl. Andernfalls steht hier das Host-Thema statt einer ‘0’.",
    standardTitle: "Raumstandard", standardLead: "Erzähl die Geschichte. Stell die Person nicht bloß.", standardText: "Kein Doxxing, keine gezielte Demütigung, keine Drohungen und keine öffentliche Attacke aus einer Beziehungsdiskussion machen. Mitglieder können Nachrichten zur Prüfung melden.",
    hostRhythmTitle: "Rhythmus des KI-Hosts", hostRhythmText: "Menschen reden: Host hört zu. Etwa 90 Sekunden Ruhe: Host lädt ein. Gespräch läuft wieder: Host tritt zurück.", footerTitle: "O2OL ist für das Gespräch nach dem Match gebaut.", footerText: "Verbindung, Kommunikation, Wachstum und alltägliche Liebe.",
    reportSafety: "Community-Sicherheit", reportTitle: "Diese Nachricht melden", closeReport: "Meldedialog schließen", reportWhy: "Warum meldest du sie?", selectReason: "Grund auswählen", details: "Zusätzliche Details", optional: "optional", detailsPlaceholder: "Füge Kontext hinzu, der uns bei der Prüfung hilft.", cancel: "Abbrechen", submitReport: "Meldung senden", reportSubmitted: "Meldung zur Prüfung eingereicht.", reportFailed: "Die Meldung konnte nicht gesendet werden.",
    reasonLabels: { harassment: "Belästigung oder gezielte Demütigung", personal_information: "Teilen privater oder identifizierender Informationen", threats: "Drohungen oder unsicheres Verhalten", spam: "Spam oder störende Beiträge", other: "Etwas anderes" },
  },
  nl: {
    allRooms: "Alle Live Kamers", roomLabel: "Live Community Kamer", hostReady: "Hostonderwerp klaar", livePrompt: "live onderwerp",
    quietExplain: "Het is al even rustig in de kamer, dus de host nodigt één keer uit om het gesprek weer op gang te brengen. Zodra leden opnieuw praten, stapt de host terug.", waitingExplain: "Hier staat altijd een gesprek klaar. Zodra leden beginnen te praten, verdwijnt de host naar de achtergrond.",
    you: "Jij", deletePrompt: "Dit bericht uit de kamer verwijderen?", deleteAria: "Je bericht verwijderen", report: "Melden", reportAria: "Bericht melden",
    serviceWaitTitle: "Groepsberichten zijn gebouwd en wachten op databaseactivatie.", serviceWaitText: "De realtime interface, reacties, verwijderen van eigen berichten, meldingsfuncties en overdracht aan de AI-host zijn voorbereid op de ontwikkeltak. De goedgekeurde berichtenmigratie is nog niet toegepast.",
    loadError: "De berichtendienst van de kamer kon nog niet laden.", sendError: "Het bericht kon niet worden verstuurd.", reactionError: "De reactie kon niet worden bijgewerkt.", deleteError: "Je bericht kon niet worden verwijderd.",
    write: "Zeg iets tegen de kamer…", lockedWrite: "Berichten worden beschikbaar zodra de beveiligde kamertabellen zijn geactiveerd.", sendAria: "Bericht versturen", roomRuleShort: "Wees echt. Wees respectvol. Vertel het verhaal, stel de persoon niet bloot.",
    joinTitle: "Wil je aan dit gesprek meedoen?", joinText: "Log in of maak een gratis account om mee te doen. Daarna brengen we je terug naar deze kamer.", signIn: "Inloggen", joinFree: "Gratis meedoen",
    activityTitle: "Kameractiviteit", activityActive: (label) => `${label}. Dit aantal geeft het echte aantal ingelogde leden weer dat nu in deze kamer aanwezig is.`, activityQuiet: "Als ingelogde leden in de kamer zijn, verschijnt hier hun echte aantal. Anders staat hier het onderwerp van de host in plaats van ‘0’.",
    standardTitle: "Kamerregel", standardLead: "Vertel het verhaal. Stel de persoon niet bloot.", standardText: "Geen doxxing, gerichte vernedering, bedreigingen of een relatiegesprek veranderen in een publieke aanval. Leden kunnen een bericht melden voor beoordeling.",
    hostRhythmTitle: "Ritme van de AI-host", hostRhythmText: "Mensen praten: host luistert. Ongeveer 90 seconden stil: host nodigt uit. Gesprek hervat: host stapt weer terug.", footerTitle: "O2OL is gebouwd voor het gesprek na de match.", footerText: "Verbinding, communicatie, groei en liefde van alledag.",
    reportSafety: "Communityveiligheid", reportTitle: "Dit bericht melden", closeReport: "Meldvenster sluiten", reportWhy: "Waarom meld je dit?", selectReason: "Kies een reden", details: "Extra details", optional: "optioneel", detailsPlaceholder: "Voeg context toe die ons helpt de melding te beoordelen.", cancel: "Annuleren", submitReport: "Melding indienen", reportSubmitted: "Melding ingediend voor beoordeling.", reportFailed: "De melding kon niet worden ingediend.",
    reasonLabels: { harassment: "Intimidatie of gerichte vernedering", personal_information: "Delen van privé- of identificerende informatie", threats: "Bedreigingen of onveilig gedrag", spam: "Spam of verstorende berichten", other: "Iets anders" },
  },
};

const timeLabel = (value, language) =>
  new Intl.DateTimeFormat(localeByLanguage[language] || undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));

function ReactionBar({ message, userId, onToggle }) {
  const counts = useMemo(() => {
    const result = {};
    (message.room_message_reactions || []).forEach((reaction) => {
      result[reaction.emoji] = (result[reaction.emoji] || 0) + 1;
    });
    return result;
  }, [message.room_message_reactions]);

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {REACTIONS.map((emoji) => {
        const selected = (message.room_message_reactions || []).some(
          (reaction) => reaction.user_id === userId && reaction.emoji === emoji
        );
        return (
          <button key={emoji} type="button" onClick={() => onToggle(message, emoji)} className={`rounded-full border px-2.5 py-1 text-xs transition ${selected ? "border-pink-300 bg-pink-50 text-pink-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`} aria-label={`React ${emoji}`}>
            {emoji}{counts[emoji] ? ` ${counts[emoji]}` : ""}
          </button>
        );
      })}
    </div>
  );
}

function ReportDialog({ message, reason, details, status, onReason, onDetails, onClose, onSubmit, t }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
      <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label={t.reportTitle}>
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">{t.reportSafety}</div><h2 className="mt-2 text-2xl font-black text-slate-950">{t.reportTitle}</h2></div><button type="button" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={t.closeReport}><X className="h-5 w-5" /></button></div>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><div className="font-black text-slate-800">{message.sender_name}</div><div className="mt-1 line-clamp-3">{message.content}</div></div>
        <label className="mt-5 block text-sm font-black text-slate-800">{t.reportWhy}</label>
        <select value={reason} onChange={(event) => onReason(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-pink-300">
          <option value="">{t.selectReason}</option>
          {REPORT_REASONS.map((item) => <option key={item.value} value={item.value}>{t.reasonLabels[item.value] || item.label}</option>)}
        </select>
        <label className="mt-4 block text-sm font-black text-slate-800">{t.details} <span className="font-semibold text-slate-400">({t.optional})</span></label>
        <textarea value={details} onChange={(event) => onDetails(event.target.value)} maxLength={500} rows={4} placeholder={t.detailsPlaceholder} className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-pink-300" />
        <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">{details.length}/500</div>
        {status && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{status}</div>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600">{t.cancel}</button><button type="button" onClick={onSubmit} disabled={!reason} className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{t.submitReport}</button></div>
      </div>
    </div>
  );
}

export default function LiveRoom() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const baseRoom = getLiveCommunityRoom(searchParams.get("room"));
  const room = getLocalizedRoom(baseRoom, currentLanguage);
  const [activeCount, setActiveCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [backendReady, setBackendReady] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  const [hostPrompt, setHostPrompt] = useState(room.topic);
  const [hostSource, setHostSource] = useState("fallback");
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const messagesEndRef = useRef(null);
  const hostEpisodeRef = useRef("");
  const activityLabel = getRoomActivityLabel(activeCount, currentLanguage);

  const lastMessageAt = messages.length ? new Date(messages[messages.length - 1].created_at).getTime() : 0;
  const roomHasGoneQuiet = backendReady === true && messages.length > 0 && clock - lastMessageAt >= HOST_IDLE_MS;
  const showHostPrompt = !backendReady || messages.length === 0 || roomHasGoneQuiet;
  const roomReturnTo = `/LiveRoom?room=${encodeURIComponent(baseRoom.slug)}`;
  const signInUrl = `${createPageUrl("SignIn")}?returnTo=${encodeURIComponent(roomReturnTo)}`;
  const signUpUrl = `${createPageUrl("SignUp")}?returnTo=${encodeURIComponent(roomReturnTo)}`;

  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 15_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { setHostPrompt(room.topic); setHostSource("fallback"); hostEpisodeRef.current = ""; }, [baseRoom.slug, room.topic]);
  useEffect(() => { setActiveCount(0); if (!user?.id) return undefined; return joinRoomPresence(baseRoom.slug, user, setActiveCount); }, [baseRoom.slug, user?.id]);

  const loadMessages = useCallback(async () => {
    if (!user?.id) { setMessages([]); setBackendReady(null); return; }
    try {
      const result = await getRoomMessages(baseRoom.slug);
      setBackendReady(result.ready); setMessages(result.messages); setMessageError("");
    } catch (error) {
      console.error("Failed to load room messages:", error); setBackendReady(false); setMessageError(t.loadError);
    }
  }, [baseRoom.slug, user?.id, t.loadError]);

  useEffect(() => { void loadMessages(); }, [loadMessages]);
  useEffect(() => { if (!backendReady || !user?.id) return undefined; return subscribeToRoomMessages(baseRoom.slug, loadMessages); }, [backendReady, loadMessages, baseRoom.slug, user?.id]);
  useEffect(() => { if (messages.length > 0) messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  useEffect(() => {
    if (!user?.id || backendReady !== true || !showHostPrompt) return undefined;
    const reason = messages.length === 0 ? "room_empty" : "room_quiet";
    const episodeKey = `${baseRoom.slug}:${reason}:${reason === "room_quiet" ? lastMessageAt : "empty"}:${currentLanguage}`;
    if (hostEpisodeRef.current === episodeKey) return undefined;
    hostEpisodeRef.current = episodeKey; setHostPrompt(room.topic); setHostSource("fallback");
    let cancelled = false;
    getLiveRoomHostPrompt(baseRoom.slug, messages, reason).then((result) => {
      if (cancelled || !result?.prompt) return;
      // AI prompts are currently generated in the backend's configured language.
      // Keep the localized room fallback whenever the generated prompt is unavailable.
      setHostPrompt(result.prompt); setHostSource(result.source);
    });
    return () => { cancelled = true; };
  }, [backendReady, lastMessageAt, messages, baseRoom.slug, room.topic, showHostPrompt, user?.id, currentLanguage]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!backendReady || !user?.id || !draft.trim()) return;
    setSending(true); setMessageError("");
    try { await sendRoomMessage(baseRoom.slug, user, draft); setDraft(""); setClock(Date.now()); await loadMessages(); }
    catch (error) { console.error("Failed to send room message:", error); setMessageError(error?.message || t.sendError); }
    finally { setSending(false); }
  };

  const handleReaction = async (message, emoji) => {
    try { await toggleRoomReaction(message, user?.id, emoji); await loadMessages(); }
    catch (error) { console.error("Failed to update reaction:", error); setMessageError(t.reactionError); }
  };

  const handleDelete = async (message) => {
    if (!user?.id || message.user_id !== user.id) return;
    if (!window.confirm(t.deletePrompt)) return;
    try { await deleteOwnRoomMessage(message.id, user.id); await loadMessages(); }
    catch (error) { console.error("Failed to delete room message:", error); setMessageError(t.deleteError); }
  };

  const openReport = (message) => { setReportTarget(message); setReportReason(""); setReportDetails(""); setReportStatus(""); };
  const closeReport = () => { setReportTarget(null); setReportReason(""); setReportDetails(""); setReportStatus(""); };
  const submitReport = async () => {
    if (!reportTarget || !user?.id || !reportReason) return;
    setReportStatus("");
    try { await reportRoomMessage(reportTarget.id, user.id, reportReason, reportDetails); setReportStatus(t.reportSubmitted); window.setTimeout(closeReport, 900); }
    catch (error) { console.error("Failed to report room message:", error); setReportStatus(error?.message || t.reportFailed); }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10"><Link to={createPageUrl("Community")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />{t.allRooms}</Link></div></div>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="text-xs font-black uppercase tracking-[0.18em] text-pink-300">{t.roomLabel}</div><h1 className="mt-2 text-3xl font-black tracking-tight">{room.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{room.description}</p></div>
            {activityLabel ? <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />{activityLabel}</div> : <div className="inline-flex items-center gap-2 self-start rounded-full border border-violet-300/20 bg-violet-300/10 px-4 py-2 text-sm font-black text-violet-200"><Sparkles className="h-4 w-4" />{t.hostReady}</div>}
          </div></div>

          <div className="max-h-[65vh] min-h-[31rem] overflow-y-auto bg-gradient-to-b from-white to-slate-50 p-5 sm:p-7">
            {showHostPrompt && <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-violet-200 bg-violet-50 p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-700"><Sparkles className="h-4 w-4" />O2OL Host{hostSource === "ai" && <span className="ml-auto rounded-full bg-violet-100 px-2 py-1 text-[10px] tracking-normal text-violet-600">{t.livePrompt}</span>}</div><p className="mt-3 text-lg font-bold leading-7 text-violet-950">“{hostPrompt || room.topic}”</p><div className="mt-4 text-sm leading-6 text-violet-800/80">{roomHasGoneQuiet ? t.quietExplain : t.waitingExplain}</div></div>}

            {user && backendReady === true && messages.length > 0 && <div className="mx-auto mt-5 max-w-3xl space-y-4">{messages.map((message) => {
              const mine = message.user_id === user.id;
              return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`group max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-pink-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                <div className={`flex items-center gap-2 text-xs font-black ${mine ? "text-pink-100" : "text-slate-500"}`}><span>{mine ? t.you : message.sender_name}</span><span>·</span><span>{timeLabel(message.created_at, currentLanguage)}</span>
                  {mine ? <button type="button" onClick={() => handleDelete(message)} className="ml-auto rounded-full p-1 opacity-70 transition hover:bg-white/15 hover:opacity-100" aria-label={t.deleteAria} title={t.deleteAria}><Trash2 className="h-3.5 w-3.5" /></button> : <button type="button" onClick={() => openReport(message)} className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black text-slate-400 transition hover:bg-slate-100 hover:text-red-600" aria-label={t.reportAria} title={t.reportAria}><Flag className="h-3 w-3" />{t.report}</button>}
                </div><div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message.content}</div><ReactionBar message={message} userId={user.id} onToggle={handleReaction} />
              </div></div>;
            })}<div ref={messagesEndRef} /></div>}

            {user && backendReady === false && <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-center"><MessageCircleHeart className="mx-auto h-7 w-7 text-amber-600" /><div className="mt-3 font-black text-slate-900">{t.serviceWaitTitle}</div><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{t.serviceWaitText}</p></div>}
            {messageError && <div className="mx-auto mt-4 max-w-2xl text-center text-sm font-semibold text-red-600">{messageError}</div>}
          </div>

          <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
            {user ? <div><form onSubmit={handleSend} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><input value={draft} onChange={(event) => setDraft(event.target.value)} disabled={!backendReady || sending} maxLength={2000} placeholder={backendReady ? t.write : t.lockedWrite} className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" /><button type="submit" disabled={!backendReady || sending || !draft.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400" aria-label={t.sendAria}><Send className="h-4 w-4" /></button></form><div className="mt-2 flex justify-between px-1 text-[11px] font-semibold text-slate-400"><span>{t.roomRuleShort}</span><span>{draft.length}/2000</span></div></div> : <div className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-pink-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-black text-slate-900">{t.joinTitle}</div><div className="mt-1 text-sm text-slate-600">{t.joinText}</div></div><div className="flex gap-2"><Link to={signInUrl} className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-black text-pink-700">{t.signIn}</Link><Link to={signUpUrl} className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-black text-white">{t.joinFree}</Link></div></div>}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 font-black text-slate-900"><Users className="h-5 w-5 text-cyan-600" />{t.activityTitle}</div><div className="mt-4 text-sm leading-6 text-slate-600">{activityLabel ? t.activityActive(activityLabel) : t.activityQuiet}</div></div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 font-black text-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-600" />{t.standardTitle}</div><p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{t.standardLead}</p><p className="mt-2 text-sm leading-6 text-slate-500">{t.standardText}</p></div>
          <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50 p-5"><div className="flex items-center gap-2 font-black text-violet-950"><Sparkles className="h-5 w-5 text-violet-600" />{t.hostRhythmTitle}</div><p className="mt-3 text-sm leading-6 text-violet-900/75">{t.hostRhythmText}</p></div>
          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-600 to-violet-600 p-5 text-white shadow-lg"><Heart className="h-5 w-5 fill-white text-white" /><div className="mt-3 font-black">{t.footerTitle}</div><p className="mt-2 text-sm leading-6 text-white/85">{t.footerText}</p></div>
        </aside>
      </section>

      <ReportDialog message={reportTarget} reason={reportReason} details={reportDetails} status={reportStatus} onReason={setReportReason} onDetails={setReportDetails} onClose={closeReport} onSubmit={submitReport} t={t} />
    </main>
  );
}
