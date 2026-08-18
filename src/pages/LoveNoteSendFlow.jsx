import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarHeart,
  Check,
  Crown,
  Heart,
  LockKeyhole,
  Mail,
  MessageCircleHeart,
  Phone,
  Send,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import {
  clearLoveNoteDraft,
  clearLoveNoteSendSession,
  loadLoveNoteDraft,
  loadLoveNoteSendSession,
  stashLoveNoteSendSession,
} from "@/lib/loveNoteDraftService";

const DEFAULT_NOTE = "You crossed my mind today, and that felt like a good enough reason to remind you how much you mean to me. ❤️";
const RETURN_TO = "/LoveNotes/Send";

const copy = {
  en: {
    back: "Back to Love Notes", eyebrow: "SEND A LOVE NOTE", title: "Make it personal. Keep the reveal private.",
    replyTitle: "Replying with a Love Note", replyText: (name) => `We carried ${name}'s name over for you. Write your reply and choose how their invitation should arrive.`,
    recipientStep: "Recipient", deliveryStep: "Delivery", reviewStep: "Review", yourName: "Your name", shown: "shown to recipient",
    senderHelp: "Your name identifies you as the sender. One2OneLove is the private delivery platform, not the author.", recipientName: "Recipient name",
    deliveryQuestion: "How should the invitation arrive?", text: "Text message", textHelp: "Preview only for now. Paid SMS delivery is not activated.",
    email: "Email", emailHelp: "A private invitation arrives without exposing the Love Note.", mobile: "Mobile number", emailAddress: "Email address",
    note: "Your Love Note", notePlaceholder: "Write your Love Note…", replyPlaceholder: (name) => `Write your reply to ${name}…`, continue: "Continue to delivery",
    sendNow: "Send now", sendNowHelp: "Deliver the invitation as soon as delivery is activated.", schedule: "Schedule it", scheduleHelp: "Choose a future date and time.",
    membership: "Membership", scheduleMembershipHelp: "Future-date scheduling is included with One2OneLove Membership.",
    privateTitle: "Private by design", privateText: (sender) => `The invitation identifies ${sender}, but the Love Note itself stays hidden until the recipient opens the secure reveal.`,
    backButton: "Back", review: "Review", from: "From", recipient: "Recipient", delivery: "Delivery", contact: "Contact", when: "When",
    signInTitle: "Your Love Note is ready.", signInText: "Sign in or create a free account to continue. We’ll keep this Love Note and bring you right back here.",
    signIn: "Sign in to send", signup: "Create free account", signedIn: "Signed in and ready",
    devTitle: "Development delivery gate", devText: "No real SMS or email will be sent from this preview. The secure delivery backend is staged and will be activated only after the approved production setup and controlled test.",
    send: "Send Love Note", notSent: "Not sent in preview — delivery activation is still pending.", preview: "Preview recipient experience", edit: "Edit delivery",
    senderPreview: "Sender preview", noteEmpty: "Your note will appear here.", sentThrough: "Sent through One2OneLove",
    receivesFirst: (name) => `What ${name} receives first`, invitation: (sender) => `💕 ${sender} sent you a private Love Note on One2OneLove. Tap to reveal it.`, reveal: "Reveal my Love Note",
    nowLabel: "Send now", chooseDate: "Choose date & time", invalidSchedule: "Choose a future date and time before continuing.",
  },
  es: {
    back: "Volver a Notas de Amor", eyebrow: "ENVIAR UNA NOTA DE AMOR", title: "Hazla personal. Mantén la revelación privada.",
    replyTitle: "Responder con una Nota de Amor", replyText: (name) => `Ya llevamos el nombre de ${name}. Escribe tu respuesta y elige cómo llegará la invitación.`,
    recipientStep: "Destinatario", deliveryStep: "Entrega", reviewStep: "Revisar", yourName: "Tu nombre", shown: "visible para el destinatario",
    senderHelp: "Tu nombre te identifica como remitente. One2OneLove es la plataforma privada de entrega, no el autor.", recipientName: "Nombre del destinatario",
    deliveryQuestion: "¿Cómo debe llegar la invitación?", text: "Mensaje de texto", textHelp: "Solo vista previa. El SMS de pago aún no está activado.", email: "Correo electrónico", emailHelp: "La invitación privada llega sin mostrar la Nota de Amor.",
    mobile: "Número móvil", emailAddress: "Correo electrónico", note: "Tu Nota de Amor", notePlaceholder: "Escribe tu Nota de Amor…", replyPlaceholder: (name) => `Escribe tu respuesta para ${name}…`, continue: "Continuar a entrega",
    sendNow: "Enviar ahora", sendNowHelp: "Entregar la invitación cuando se active la entrega.", schedule: "Programarla", scheduleHelp: "Elige una fecha y hora futuras.",
    membership: "Membresía", scheduleMembershipHelp: "La programación para una fecha futura está incluida con la Membresía One2OneLove.",
    privateTitle: "Privada por diseño", privateText: (sender) => `La invitación identifica a ${sender}, pero la Nota de Amor permanece oculta hasta la revelación segura.`,
    backButton: "Atrás", review: "Revisar", from: "De", recipient: "Destinatario", delivery: "Entrega", contact: "Contacto", when: "Cuándo",
    signInTitle: "Tu Nota de Amor está lista.", signInText: "Inicia sesión o crea una cuenta gratis. Guardaremos esta nota y te traeremos de vuelta.", signIn: "Iniciar sesión para enviar", signup: "Crear cuenta gratis", signedIn: "Sesión iniciada y lista",
    devTitle: "Puerta de entrega de desarrollo", devText: "Esta vista previa no envía SMS ni correos reales. El backend seguro está preparado y se activará solo después de la configuración aprobada y una prueba controlada.",
    send: "Enviar Nota de Amor", notSent: "No enviada en la vista previa — la activación de entrega sigue pendiente.", preview: "Ver experiencia del destinatario", edit: "Editar entrega",
    senderPreview: "Vista del remitente", noteEmpty: "Tu nota aparecerá aquí.", sentThrough: "Enviado por One2OneLove", receivesFirst: (name) => `Lo primero que recibe ${name}`,
    invitation: (sender) => `💕 ${sender} te envió una Nota de Amor privada en One2OneLove. Toca para revelarla.`, reveal: "Revelar mi Nota de Amor", nowLabel: "Enviar ahora", chooseDate: "Elegir fecha y hora", invalidSchedule: "Elige una fecha y hora futuras antes de continuar.",
  },
  fr: {
    back: "Retour aux Mots d’Amour", eyebrow: "ENVOYER UN MOT D’AMOUR", title: "Rendez-le personnel. Gardez la révélation privée.",
    replyTitle: "Répondre avec un Mot d’Amour", replyText: (name) => `Nous avons repris le nom de ${name}. Écrivez votre réponse et choisissez comment l’invitation arrivera.`,
    recipientStep: "Destinataire", deliveryStep: "Envoi", reviewStep: "Vérifier", yourName: "Votre nom", shown: "affiché au destinataire",
    senderHelp: "Votre nom vous identifie comme expéditeur. One2OneLove est la plateforme privée d’envoi, pas l’auteur.", recipientName: "Nom du destinataire",
    deliveryQuestion: "Comment l’invitation doit-elle arriver ?", text: "SMS", textHelp: "Aperçu uniquement. L’envoi SMS payant n’est pas activé.", email: "E-mail", emailHelp: "L’invitation privée arrive sans dévoiler le Mot d’Amour.",
    mobile: "Numéro mobile", emailAddress: "Adresse e-mail", note: "Votre Mot d’Amour", notePlaceholder: "Écrivez votre Mot d’Amour…", replyPlaceholder: (name) => `Écrivez votre réponse à ${name}…`, continue: "Continuer vers l’envoi",
    sendNow: "Envoyer maintenant", sendNowHelp: "Envoyer l’invitation une fois la livraison activée.", schedule: "Programmer", scheduleHelp: "Choisissez une date et une heure futures.",
    membership: "Adhésion", scheduleMembershipHelp: "La programmation à une date future est incluse avec l’adhésion One2OneLove.",
    privateTitle: "Privé par conception", privateText: (sender) => `L’invitation identifie ${sender}, mais le Mot d’Amour reste caché jusqu’à la révélation sécurisée.`,
    backButton: "Retour", review: "Vérifier", from: "De", recipient: "Destinataire", delivery: "Envoi", contact: "Contact", when: "Quand",
    signInTitle: "Votre Mot d’Amour est prêt.", signInText: "Connectez-vous ou créez un compte gratuit. Nous garderons ce mot et vous ramènerons ici.", signIn: "Se connecter pour envoyer", signup: "Créer un compte gratuit", signedIn: "Connecté et prêt",
    devTitle: "Verrou de livraison en développement", devText: "Cet aperçu n’envoie aucun vrai SMS ni e-mail. Le backend sécurisé est prêt et sera activé seulement après la configuration approuvée et un test contrôlé.",
    send: "Envoyer le Mot d’Amour", notSent: "Non envoyé dans l’aperçu — l’activation de la livraison est encore en attente.", preview: "Voir l’expérience destinataire", edit: "Modifier l’envoi",
    senderPreview: "Aperçu expéditeur", noteEmpty: "Votre mot apparaîtra ici.", sentThrough: "Envoyé via One2OneLove", receivesFirst: (name) => `Ce que ${name} reçoit d’abord`,
    invitation: (sender) => `💕 ${sender} vous a envoyé un Mot d’Amour privé sur One2OneLove. Touchez pour le révéler.`, reveal: "Révéler mon Mot d’Amour", nowLabel: "Envoyer maintenant", chooseDate: "Choisir date et heure", invalidSchedule: "Choisissez une date et une heure futures avant de continuer.",
  },
  it: {
    back: "Torna alle Note d’Amore", eyebrow: "INVIA UNA NOTA D’AMORE", title: "Rendila personale. Mantieni privata la rivelazione.",
    replyTitle: "Rispondi con una Nota d’Amore", replyText: (name) => `Abbiamo riportato il nome di ${name}. Scrivi la risposta e scegli come deve arrivare l’invito.`,
    recipientStep: "Destinatario", deliveryStep: "Consegna", reviewStep: "Rivedi", yourName: "Il tuo nome", shown: "mostrato al destinatario",
    senderHelp: "Il tuo nome ti identifica come mittente. One2OneLove è la piattaforma privata di consegna, non l’autore.", recipientName: "Nome del destinatario",
    deliveryQuestion: "Come deve arrivare l’invito?", text: "Messaggio di testo", textHelp: "Solo anteprima. L’SMS a pagamento non è attivo.", email: "Email", emailHelp: "L’invito privato arriva senza mostrare la Nota d’Amore.",
    mobile: "Numero di cellulare", emailAddress: "Indirizzo email", note: "La tua Nota d’Amore", notePlaceholder: "Scrivi la tua Nota d’Amore…", replyPlaceholder: (name) => `Scrivi la tua risposta a ${name}…`, continue: "Continua alla consegna",
    sendNow: "Invia ora", sendNowHelp: "Consegna l’invito quando la consegna sarà attiva.", schedule: "Programma", scheduleHelp: "Scegli una data e un’ora future.",
    membership: "Abbonamento", scheduleMembershipHelp: "La programmazione per una data futura è inclusa nell’abbonamento One2OneLove.",
    privateTitle: "Privata per design", privateText: (sender) => `L’invito identifica ${sender}, ma la Nota d’Amore resta nascosta fino alla rivelazione sicura.`,
    backButton: "Indietro", review: "Rivedi", from: "Da", recipient: "Destinatario", delivery: "Consegna", contact: "Contatto", when: "Quando",
    signInTitle: "La tua Nota d’Amore è pronta.", signInText: "Accedi o crea un account gratuito. Terremo questa nota e ti riporteremo qui.", signIn: "Accedi per inviare", signup: "Crea account gratuito", signedIn: "Accesso effettuato",
    devTitle: "Blocco consegna di sviluppo", devText: "Questa anteprima non invia SMS o email reali. Il backend sicuro è pronto e sarà attivato solo dopo la configurazione approvata e un test controllato.",
    send: "Invia Nota d’Amore", notSent: "Non inviata nell’anteprima — l’attivazione della consegna è ancora in attesa.", preview: "Anteprima esperienza destinatario", edit: "Modifica consegna",
    senderPreview: "Anteprima mittente", noteEmpty: "La tua nota apparirà qui.", sentThrough: "Inviato tramite One2OneLove", receivesFirst: (name) => `Cosa riceve prima ${name}`,
    invitation: (sender) => `💕 ${sender} ti ha inviato una Nota d’Amore privata su One2OneLove. Tocca per rivelarla.`, reveal: "Rivela la mia Nota d’Amore", nowLabel: "Invia ora", chooseDate: "Scegli data e ora", invalidSchedule: "Scegli una data e un’ora future prima di continuare.",
  },
  de: {
    back: "Zurück zu Liebesnotizen", eyebrow: "LIEBESNOTIZ SENDEN", title: "Mach sie persönlich. Die Enthüllung bleibt privat.",
    replyTitle: "Mit einer Liebesnotiz antworten", replyText: (name) => `Wir haben ${name}s Namen übernommen. Schreibe deine Antwort und wähle den Einladungsweg.`,
    recipientStep: "Empfänger", deliveryStep: "Zustellung", reviewStep: "Prüfen", yourName: "Dein Name", shown: "für den Empfänger sichtbar",
    senderHelp: "Dein Name identifiziert dich als Absender. One2OneLove ist die private Zustellplattform, nicht der Autor.", recipientName: "Name des Empfängers",
    deliveryQuestion: "Wie soll die Einladung ankommen?", text: "Textnachricht", textHelp: "Derzeit nur Vorschau. Bezahlte SMS-Zustellung ist nicht aktiviert.", email: "E-Mail", emailHelp: "Die private Einladung kommt an, ohne die Liebesnotiz zu zeigen.",
    mobile: "Mobilnummer", emailAddress: "E-Mail-Adresse", note: "Deine Liebesnotiz", notePlaceholder: "Schreibe deine Liebesnotiz…", replyPlaceholder: (name) => `Schreibe deine Antwort an ${name}…`, continue: "Weiter zur Zustellung",
    sendNow: "Jetzt senden", sendNowHelp: "Einladung senden, sobald die Zustellung aktiviert ist.", schedule: "Planen", scheduleHelp: "Wähle ein zukünftiges Datum und eine Uhrzeit.",
    membership: "Mitgliedschaft", scheduleMembershipHelp: "Die Planung für ein zukünftiges Datum ist in der One2OneLove Mitgliedschaft enthalten.",
    privateTitle: "Privat konzipiert", privateText: (sender) => `Die Einladung nennt ${sender}, aber die Liebesnotiz bleibt bis zur sicheren Enthüllung verborgen.`,
    backButton: "Zurück", review: "Prüfen", from: "Von", recipient: "Empfänger", delivery: "Zustellung", contact: "Kontakt", when: "Wann",
    signInTitle: "Deine Liebesnotiz ist bereit.", signInText: "Melde dich an oder erstelle ein kostenloses Konto. Wir bewahren diese Notiz auf und bringen dich zurück.", signIn: "Zum Senden anmelden", signup: "Kostenloses Konto erstellen", signedIn: "Angemeldet und bereit",
    devTitle: "Entwicklungs-Zustellsperre", devText: "Diese Vorschau sendet keine echte SMS oder E-Mail. Das sichere Backend ist vorbereitet und wird erst nach genehmigter Einrichtung und kontrolliertem Test aktiviert.",
    send: "Liebesnotiz senden", notSent: "In der Vorschau nicht gesendet — die Zustellaktivierung steht noch aus.", preview: "Empfängeransicht testen", edit: "Zustellung bearbeiten",
    senderPreview: "Absendervorschau", noteEmpty: "Deine Notiz erscheint hier.", sentThrough: "Gesendet über One2OneLove", receivesFirst: (name) => `Was ${name} zuerst erhält`,
    invitation: (sender) => `💕 ${sender} hat dir eine private Liebesnotiz auf One2OneLove geschickt. Tippe, um sie zu enthüllen.`, reveal: "Meine Liebesnotiz enthüllen", nowLabel: "Jetzt senden", chooseDate: "Datum und Uhrzeit wählen", invalidSchedule: "Wähle ein zukünftiges Datum und eine Uhrzeit, bevor du fortfährst.",
  },
  nl: {
    back: "Terug naar Liefdesbriefjes", eyebrow: "STUUR EEN LIEFDESBRIEFJE", title: "Maak het persoonlijk. Houd de onthulling privé.",
    replyTitle: "Antwoorden met een Liefdesbriefje", replyText: (name) => `We hebben de naam van ${name} meegenomen. Schrijf je antwoord en kies hoe de uitnodiging aankomt.`,
    recipientStep: "Ontvanger", deliveryStep: "Bezorging", reviewStep: "Controleren", yourName: "Jouw naam", shown: "zichtbaar voor ontvanger",
    senderHelp: "Jouw naam identificeert jou als afzender. One2OneLove is het privé-bezorgplatform, niet de auteur.", recipientName: "Naam ontvanger",
    deliveryQuestion: "Hoe moet de uitnodiging aankomen?", text: "Sms", textHelp: "Voorlopig alleen een voorbeeld. Betaalde sms-bezorging is niet geactiveerd.", email: "E-mail", emailHelp: "De privé-uitnodiging arriveert zonder het Liefdesbriefje te tonen.",
    mobile: "Mobiel nummer", emailAddress: "E-mailadres", note: "Jouw Liefdesbriefje", notePlaceholder: "Schrijf jouw Liefdesbriefje…", replyPlaceholder: (name) => `Schrijf je antwoord aan ${name}…`, continue: "Doorgaan naar bezorging",
    sendNow: "Nu versturen", sendNowHelp: "Bezorg de uitnodiging zodra bezorging is geactiveerd.", schedule: "Inplannen", scheduleHelp: "Kies een toekomstige datum en tijd.",
    membership: "Lidmaatschap", scheduleMembershipHelp: "Planning voor een toekomstige datum is inbegrepen bij het One2OneLove Lidmaatschap.",
    privateTitle: "Privé ontworpen", privateText: (sender) => `De uitnodiging noemt ${sender}, maar het Liefdesbriefje blijft verborgen tot de beveiligde onthulling.`,
    backButton: "Terug", review: "Controleren", from: "Van", recipient: "Ontvanger", delivery: "Bezorging", contact: "Contact", when: "Wanneer",
    signInTitle: "Je Liefdesbriefje is klaar.", signInText: "Log in of maak een gratis account. We bewaren dit briefje en brengen je hier terug.", signIn: "Inloggen om te sturen", signup: "Gratis account maken", signedIn: "Ingelogd en klaar",
    devTitle: "Ontwikkel-bezorgslot", devText: "Deze preview verstuurt geen echte sms of e-mail. De veilige backend staat klaar en wordt pas geactiveerd na goedgekeurde configuratie en een gecontroleerde test.",
    send: "Liefdesbriefje sturen", notSent: "Niet verzonden in preview — bezorgactivatie is nog in afwachting.", preview: "Voorbeeld ontvangerservaring", edit: "Bezorging wijzigen",
    senderPreview: "Afzendervoorbeeld", noteEmpty: "Je briefje verschijnt hier.", sentThrough: "Verstuurd via One2OneLove", receivesFirst: (name) => `Wat ${name} als eerste ontvangt`,
    invitation: (sender) => `💕 ${sender} stuurde je een privé Liefdesbriefje via One2OneLove. Tik om het te onthullen.`, reveal: "Mijn Liefdesbriefje onthullen", nowLabel: "Nu versturen", chooseDate: "Datum en tijd kiezen", invalidSchedule: "Kies een toekomstige datum en tijd voordat je doorgaat.",
  },
};

const cleanDraft = () => {
  const resumed = loadLoveNoteSendSession();
  if (resumed) return resumed;
  const draft = loadLoveNoteDraft();
  if (!draft) return { source: "new", recipientName: "", message: DEFAULT_NOTE, step: 1 };
  return {
    source: draft.source || "new",
    recipientName: draft.recipientName || "",
    message: draft.source === "reply" ? (draft.message || "") : (draft.message || DEFAULT_NOTE),
    step: 1,
  };
};

export default function LoveNoteSendFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const scheduleAccess = useFeatureAccess("love_note_scheduling");
  const [initial] = useState(cleanDraft);
  const [senderName, setSenderName] = useState(initial.senderName || user?.name || "");
  const [recipientName, setRecipientName] = useState(initial.recipientName || "");
  const [delivery, setDelivery] = useState(initial.delivery === "email" ? "email" : "text");
  const [contact, setContact] = useState(initial.contact || "");
  const [message, setMessage] = useState(initial.message || DEFAULT_NOTE);
  const [deliveryTime, setDeliveryTime] = useState(initial.deliveryTime === "schedule" ? "schedule" : "now");
  const [scheduleDate, setScheduleDate] = useState(initial.scheduleDate || "");
  const [scheduleTime, setScheduleTime] = useState(initial.scheduleTime || "");
  const [step, setStep] = useState(initial.step || 1);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!senderName.trim() && user?.name) setSenderName(user.name);
  }, [user?.name, senderName]);

  useEffect(() => {
    clearLoveNoteDraft();
  }, []);

  useEffect(() => {
    if (!message.trim()) return;
    stashLoveNoteSendSession({
      senderName, recipientName, delivery, contact, message, deliveryTime,
      scheduleDate, scheduleTime, source: initial.source, step,
    });
  }, [senderName, recipientName, delivery, contact, message, deliveryTime, scheduleDate, scheduleTime, step, initial.source]);

  useEffect(() => {
    if (
      scheduleAccess.gatingEnabled
      && !scheduleAccess.isLoading
      && !scheduleAccess.hasAccess
      && deliveryTime === "schedule"
    ) {
      setDeliveryTime("now");
      setScheduleDate("");
      setScheduleTime("");
    }
  }, [deliveryTime, scheduleAccess.gatingEnabled, scheduleAccess.hasAccess, scheduleAccess.isLoading]);

  const senderLabel = senderName.trim() || t.yourName;
  const recipientLabel = recipientName.trim() || t.recipientName;
  const canContinue = Boolean(senderName.trim() && recipientName.trim() && contact.trim() && message.trim());
  const today = new Date().toISOString().slice(0, 10);

  const scheduledAt = useMemo(() => {
    if (deliveryTime !== "schedule" || !scheduleDate || !scheduleTime) return null;
    const value = new Date(`${scheduleDate}T${scheduleTime}`);
    return Number.isNaN(value.getTime()) ? null : value;
  }, [deliveryTime, scheduleDate, scheduleTime]);

  const scheduleValid = deliveryTime === "now" || Boolean(scheduledAt && scheduledAt.getTime() > Date.now());
  const scheduleLabel = deliveryTime === "now" ? t.nowLabel : (scheduleValid ? `${scheduleDate} · ${scheduleTime}` : t.chooseDate);
  const steps = [t.recipientStep, t.deliveryStep, t.reviewStep];

  const stashCurrent = (targetStep = step) => {
    stashLoveNoteSendSession({
      senderName, recipientName, delivery, contact, message, deliveryTime,
      scheduleDate, scheduleTime, source: initial.source, step: targetStep,
    });
  };

  const preserveAndGo = (path) => {
    stashCurrent(3);
    navigate(`${path}?returnTo=${encodeURIComponent(RETURN_TO)}`);
  };

  const chooseSchedule = () => {
    if (scheduleAccess.isLoading) return;
    if (scheduleAccess.hasAccess) {
      setDeliveryTime("schedule");
      return;
    }

    // Preserve the free Love Note draft. Signed-out visitors first establish identity;
    // signed-in free members see the one-membership offer. The server independently
    // enforces the entitlement, so this is UX—not the security boundary.
    stashCurrent(2);
    if (scheduleAccess.needsSignIn) {
      navigate(`/SignIn?returnTo=${encodeURIComponent(RETURN_TO)}`);
    } else {
      navigate("/Subscription");
    }
  };

  const previewRecipient = () => {
    sessionStorage.setItem("o2ol-love-note-preview", JSON.stringify({
      senderName: senderName.trim(), recipientName: recipientName.trim(), message: message.trim(),
      delivery, contact: contact.trim(), deliveryTime, scheduleDate, scheduleTime,
    }));
    navigate("/LoveNoteRevealDemo");
  };

  const previewSend = () => {
    setNotice(t.notSent);
  };

  const startAnother = () => {
    clearLoveNoteSendSession();
    navigate("/LoveNotes");
  };

  const scheduleLocked = scheduleAccess.gatingEnabled && !scheduleAccess.hasAccess;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={startAnother} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />{t.back}
        </button>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <section className="rounded-[2rem] border border-white bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100"><Heart className="h-6 w-6 fill-pink-500 text-pink-500" /></div>
              <div><div className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">{t.eyebrow}</div><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{t.title}</h1></div>
            </div>

            {initial.source === "reply" && initial.recipientName && (
              <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
                <div className="flex items-center gap-2 font-black"><MessageCircleHeart className="h-4 w-4" />{t.replyTitle}</div><p className="mt-1">{t.replyText(initial.recipientName)}</p>
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-2">
              {steps.map((label, index) => {
                const item = index + 1;
                return <div key={label} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${step >= item ? "bg-pink-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {step > item ? <Check className="h-3.5 w-3.5" /> : <span>{item}</span>}{label}
                </div>;
              })}
            </div>

            {step === 1 && (
              <div className="mt-8 space-y-5">
                <div><label className="text-sm font-black text-slate-700">{t.yourName} <span className="font-semibold text-slate-400">({t.shown})</span></label>
                  <input value={senderName} onChange={(e) => setSenderName(e.target.value.slice(0, 80))} placeholder="Alex" autoComplete="name" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" />
                  <p className="mt-2 text-xs leading-5 text-slate-500">{t.senderHelp}</p></div>

                <div><label className="text-sm font-black text-slate-700">{t.recipientName}</label>
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value.slice(0, 80))} placeholder="Jamie" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" /></div>

                <div><div className="text-sm font-black text-slate-700">{t.deliveryQuestion}</div><div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setDelivery("text"); setContact(""); }} className={`rounded-2xl border p-4 text-left transition ${delivery === "text" ? "border-pink-300 bg-pink-50" : "border-slate-200 bg-white"}`}>
                    <Phone className="h-5 w-5 text-pink-600" /><div className="mt-2 font-black">{t.text}</div><div className="mt-1 text-xs leading-5 text-slate-500">{t.textHelp}</div></button>
                  <button type="button" onClick={() => { setDelivery("email"); setContact(""); }} className={`rounded-2xl border p-4 text-left transition ${delivery === "email" ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white"}`}>
                    <Mail className="h-5 w-5 text-violet-600" /><div className="mt-2 font-black">{t.email}</div><div className="mt-1 text-xs leading-5 text-slate-500">{t.emailHelp}</div></button>
                </div></div>

                <div><label className="text-sm font-black text-slate-700">{delivery === "text" ? t.mobile : t.emailAddress}</label>
                  <input type={delivery === "text" ? "tel" : "email"} value={contact} onChange={(e) => setContact(e.target.value.slice(0, 160))} placeholder={delivery === "text" ? "(555) 123-4567" : "jamie@example.com"} autoComplete={delivery === "email" ? "email" : "tel"} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" /></div>

                <div><label className="text-sm font-black text-slate-700">{t.note}</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 500))} rows={6} placeholder={initial.source === "reply" ? t.replyPlaceholder(recipientLabel) : t.notePlaceholder} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 leading-7 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" />
                  <div className="mt-1 text-right text-xs font-bold text-slate-400">{message.length}/500</div></div>

                <button type="button" disabled={!canContinue} onClick={() => setStep(2)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">{t.continue}<Send className="h-4 w-4" /></button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setDeliveryTime("now")} className={`rounded-2xl border p-5 text-left ${deliveryTime === "now" ? "border-pink-300 bg-pink-50" : "border-slate-200"}`}><Send className="h-5 w-5 text-pink-600" /><div className="mt-3 font-black">{t.sendNow}</div><div className="mt-1 text-xs leading-5 text-slate-500">{t.sendNowHelp}</div></button>
                  <button
                    type="button"
                    onClick={chooseSchedule}
                    disabled={scheduleAccess.isLoading}
                    className={`relative rounded-2xl border p-5 text-left transition disabled:cursor-wait disabled:opacity-60 ${deliveryTime === "schedule" ? "border-violet-300 bg-violet-50" : scheduleLocked ? "border-purple-200 bg-purple-50/60" : "border-slate-200"}`}
                  >
                    {scheduleLocked && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-purple-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white"><Crown className="h-3 w-3" />{t.membership}</span>
                    )}
                    <CalendarHeart className="h-5 w-5 text-violet-600" />
                    <div className="mt-3 font-black">{t.schedule}</div>
                    <div className="mt-1 pr-2 text-xs leading-5 text-slate-500">{scheduleLocked ? t.scheduleMembershipHelp : t.scheduleHelp}</div>
                  </button>
                </div>
                {deliveryTime === "schedule" && <div><div className="grid gap-3 sm:grid-cols-2"><input type="date" min={today} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3" /><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3" /></div>{!scheduleValid && scheduleDate && scheduleTime && <p className="mt-2 text-xs font-bold text-amber-700">{t.invalidSchedule}</p>}</div>}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><div className="flex items-center gap-2 font-black"><LockKeyhole className="h-4 w-4" />{t.privateTitle}</div><p className="mt-1">{t.privateText(senderLabel)}</p></div>
                <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">{t.backButton}</button><button type="button" onClick={() => setStep(3)} disabled={!scheduleValid} className="flex-1 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{t.review}</button></div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><div className="grid gap-4 sm:grid-cols-2">
                  {[[t.from, senderLabel], [t.recipient, recipientLabel], [t.delivery, delivery === "text" ? t.text : t.email], [t.contact, contact], [t.when, scheduleLabel]].map(([label, value]) => <div key={label}><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</div><div className="mt-1 break-all font-black">{value}</div></div>)}
                </div></div>

                {!user ? (
                  <div className="rounded-2xl border border-pink-200 bg-pink-50 p-5">
                    <div className="flex items-center gap-2 font-black text-pink-900"><LockKeyhole className="h-5 w-5" />{t.signInTitle}</div>
                    <p className="mt-2 text-sm leading-6 text-pink-900/80">{t.signInText}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={() => preserveAndGo("/SignIn")} className="rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white">{t.signIn}</button>
                      <button type="button" onClick={() => preserveAndGo("/SignUp")} className="rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-black text-pink-700">{t.signup}</button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><div className="flex items-center gap-2 font-black"><UserRoundCheck className="h-4 w-4" />{t.signedIn}</div><div className="mt-1">{user.email}</div></div>
                )}

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><div className="font-black">{t.devTitle}</div><div className="mt-1">{t.devText}</div></div>
                {notice && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm font-bold text-violet-900">{notice}</div>}

                <button type="button" onClick={previewSend} disabled={!user} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" />{t.send}</button>
                <button type="button" onClick={previewRecipient} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white"><Sparkles className="h-4 w-4 text-pink-300" />{t.preview}</button>
                <button type="button" onClick={() => setStep(2)} className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">{t.edit}</button>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6"><div className="rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl"><div className="rounded-[1.8rem] bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 p-6">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500"><span>One2OneLove</span><span>{t.senderPreview}</span></div>
            <div className="mx-auto mt-8 max-w-[19rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-6 shadow-xl"><div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600"><Heart className="h-4 w-4 fill-pink-500" /> Love Note</div><p className="mt-5 text-center text-lg font-semibold leading-8 text-slate-800">{message || t.noteEmpty}</p><div className="mt-5 text-right text-sm font-bold text-slate-600">— {senderLabel} 💕</div><div className="mt-2 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{t.sentThrough}</div></div>
            <div className="mt-8 rounded-2xl border border-white bg-white/85 p-5 shadow-sm"><div className="flex items-start gap-3"><MessageCircleHeart className="mt-0.5 h-5 w-5 text-pink-600" /><div><div className="font-black text-slate-950">{t.receivesFirst(recipientLabel)}</div><p className="mt-2 text-sm leading-6 text-slate-600">“{t.invitation(senderLabel)}”</p><div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-xs font-black text-white"><LockKeyhole className="h-3.5 w-3.5" />{t.reveal}</div></div></div></div>
          </div></div></aside>
        </div>
      </div>
    </main>
  );
}
