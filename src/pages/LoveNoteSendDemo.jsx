import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarHeart,
  Check,
  Heart,
  LockKeyhole,
  Mail,
  MessageCircleHeart,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";

const DEFAULT_NOTE = "You crossed my mind today, and that felt like a good enough reason to remind you how much you mean to me. ❤️";

const copy = {
  en: {
    back: "Back to Love Notes",
    eyebrow: "SEND A LOVE NOTE",
    title: "Make it personal. Keep the reveal private.",
    replyTitle: "Replying with a Love Note",
    replyText: (name) => `We carried ${name}'s name over for you. Write your reply, choose how their invitation should arrive, and review it before sending.`,
    recipientStep: "Recipient",
    deliveryStep: "Delivery",
    reviewStep: "Review",
    yourName: "Your name",
    shown: "shown to recipient",
    senderHelp: "The invitation and revealed Love Note identify the person who sent it. One2OneLove appears as the delivery platform, not as the sender.",
    recipientName: "Recipient name",
    deliveryQuestion: "How should the invitation arrive?",
    text: "Text message",
    textHelp: "Preview only for now. SMS delivery has not been activated.",
    email: "Email",
    emailHelp: "A private invitation arrives without exposing the note.",
    mobile: "Mobile number",
    emailAddress: "Email address",
    note: "Your Love Note",
    notePlaceholder: "Write your Love Note…",
    replyPlaceholder: (name) => `Write your reply to ${name}…`,
    continue: "Continue to delivery",
    sendNow: "Send now",
    sendNowHelp: "Deliver the invitation as soon as the approved backend confirms it.",
    schedule: "Schedule it",
    scheduleHelp: "Choose a moment that makes the note land just right.",
    privateTitle: "Private by design",
    privateText: (sender) => `The invitation identifies ${sender} but does not expose the Love Note itself. The message stays hidden until the recipient opens the secure reveal experience.`,
    backButton: "Back",
    review: "Review",
    from: "From",
    recipient: "Recipient",
    delivery: "Delivery",
    contact: "Contact",
    when: "When",
    development: "Development preview:",
    developmentText: "this screen does not send a real SMS or email yet. It lets us test the complete customer experience before connecting the approved delivery backend.",
    previewExperience: "Preview recipient experience",
    editDelivery: "Edit delivery",
    senderPreview: "Sender preview",
    noteEmpty: "Your note will appear here.",
    sentThrough: "Sent through One2OneLove",
    receivesFirst: (name) => `What ${name} receives first`,
    invitation: (sender) => `💕 ${sender} sent you a private Love Note on One2OneLove. Tap to reveal it.`,
    reveal: "Reveal my Love Note",
    nowLabel: "Send now",
    chooseDate: "Choose date & time",
  },
  es: {
    back: "Volver a Notas de Amor", eyebrow: "ENVIAR UNA NOTA DE AMOR", title: "Hazla personal. Mantén la revelación privada.",
    replyTitle: "Responder con una Nota de Amor", replyText: (name) => `Ya llevamos el nombre de ${name}. Escribe tu respuesta, elige cómo llegará la invitación y revísala antes de enviarla.`,
    recipientStep: "Destinatario", deliveryStep: "Entrega", reviewStep: "Revisar", yourName: "Tu nombre", shown: "visible para el destinatario",
    senderHelp: "La invitación y la Nota de Amor revelada identifican a la persona que la envió. One2OneLove aparece como la plataforma de entrega, no como el remitente.",
    recipientName: "Nombre del destinatario", deliveryQuestion: "¿Cómo debe llegar la invitación?", text: "Mensaje de texto", textHelp: "Solo vista previa por ahora. El envío por SMS aún no está activado.",
    email: "Correo electrónico", emailHelp: "Llega una invitación privada sin mostrar la nota.", mobile: "Número móvil", emailAddress: "Correo electrónico", note: "Tu Nota de Amor",
    notePlaceholder: "Escribe tu Nota de Amor…", replyPlaceholder: (name) => `Escribe tu respuesta para ${name}…`, continue: "Continuar a entrega", sendNow: "Enviar ahora",
    sendNowHelp: "Entrega la invitación cuando el backend aprobado la confirme.", schedule: "Programarla", scheduleHelp: "Elige el momento perfecto para que llegue.", privateTitle: "Privada por diseño",
    privateText: (sender) => `La invitación identifica a ${sender}, pero no muestra la Nota de Amor. El mensaje permanece oculto hasta que el destinatario abre la revelación segura.`,
    backButton: "Atrás", review: "Revisar", from: "De", recipient: "Destinatario", delivery: "Entrega", contact: "Contacto", when: "Cuándo", development: "Vista previa de desarrollo:",
    developmentText: "esta pantalla todavía no envía SMS ni correos reales. Nos permite probar toda la experiencia antes de conectar el backend de entrega aprobado.", previewExperience: "Ver experiencia del destinatario",
    editDelivery: "Editar entrega", senderPreview: "Vista del remitente", noteEmpty: "Tu nota aparecerá aquí.", sentThrough: "Enviado por One2OneLove", receivesFirst: (name) => `Lo primero que recibe ${name}`,
    invitation: (sender) => `💕 ${sender} te envió una Nota de Amor privada en One2OneLove. Toca para revelarla.`, reveal: "Revelar mi Nota de Amor", nowLabel: "Enviar ahora", chooseDate: "Elegir fecha y hora",
  },
  fr: {
    back: "Retour aux Mots d’Amour", eyebrow: "ENVOYER UN MOT D’AMOUR", title: "Rendez-le personnel. Gardez la révélation privée.",
    replyTitle: "Répondre avec un Mot d’Amour", replyText: (name) => `Nous avons repris le nom de ${name}. Écrivez votre réponse, choisissez comment l’invitation arrivera et vérifiez-la avant l’envoi.`,
    recipientStep: "Destinataire", deliveryStep: "Envoi", reviewStep: "Vérifier", yourName: "Votre nom", shown: "affiché au destinataire",
    senderHelp: "L’invitation et le Mot d’Amour révélé identifient la personne qui l’a envoyé. One2OneLove est la plateforme d’envoi, pas l’expéditeur.", recipientName: "Nom du destinataire",
    deliveryQuestion: "Comment l’invitation doit-elle arriver ?", text: "SMS", textHelp: "Aperçu uniquement pour le moment. L’envoi SMS n’est pas encore activé.", email: "E-mail", emailHelp: "Une invitation privée arrive sans dévoiler le mot.",
    mobile: "Numéro mobile", emailAddress: "Adresse e-mail", note: "Votre Mot d’Amour", notePlaceholder: "Écrivez votre Mot d’Amour…", replyPlaceholder: (name) => `Écrivez votre réponse à ${name}…`, continue: "Continuer vers l’envoi",
    sendNow: "Envoyer maintenant", sendNowHelp: "Envoyer l’invitation dès que le backend approuvé la confirme.", schedule: "Programmer", scheduleHelp: "Choisissez le bon moment pour l’envoyer.", privateTitle: "Privé par conception",
    privateText: (sender) => `L’invitation identifie ${sender}, mais ne dévoile pas le Mot d’Amour. Le message reste caché jusqu’à l’ouverture de la révélation sécurisée.`, backButton: "Retour", review: "Vérifier",
    from: "De", recipient: "Destinataire", delivery: "Envoi", contact: "Contact", when: "Quand", development: "Aperçu de développement :", developmentText: "cet écran n’envoie pas encore de vrai SMS ni d’e-mail. Il permet de tester toute l’expérience avant de connecter le backend d’envoi approuvé.",
    previewExperience: "Voir l’expérience destinataire", editDelivery: "Modifier l’envoi", senderPreview: "Aperçu expéditeur", noteEmpty: "Votre mot apparaîtra ici.", sentThrough: "Envoyé via One2OneLove", receivesFirst: (name) => `Ce que ${name} reçoit d’abord`,
    invitation: (sender) => `💕 ${sender} vous a envoyé un Mot d’Amour privé sur One2OneLove. Touchez pour le révéler.`, reveal: "Révéler mon Mot d’Amour", nowLabel: "Envoyer maintenant", chooseDate: "Choisir date et heure",
  },
  it: {
    back: "Torna alle Note d’Amore", eyebrow: "INVIA UNA NOTA D’AMORE", title: "Rendila personale. Mantieni privata la rivelazione.", replyTitle: "Rispondi con una Nota d’Amore",
    replyText: (name) => `Abbiamo riportato il nome di ${name}. Scrivi la risposta, scegli come deve arrivare l’invito e controllala prima dell’invio.`, recipientStep: "Destinatario", deliveryStep: "Consegna", reviewStep: "Rivedi",
    yourName: "Il tuo nome", shown: "mostrato al destinatario", senderHelp: "L’invito e la Nota d’Amore rivelata identificano la persona che l’ha inviata. One2OneLove è la piattaforma di consegna, non il mittente.", recipientName: "Nome del destinatario",
    deliveryQuestion: "Come deve arrivare l’invito?", text: "Messaggio di testo", textHelp: "Solo anteprima per ora. L’invio SMS non è ancora attivo.", email: "Email", emailHelp: "Arriva un invito privato senza mostrare la nota.", mobile: "Numero di cellulare", emailAddress: "Indirizzo email",
    note: "La tua Nota d’Amore", notePlaceholder: "Scrivi la tua Nota d’Amore…", replyPlaceholder: (name) => `Scrivi la tua risposta a ${name}…`, continue: "Continua alla consegna", sendNow: "Invia ora", sendNowHelp: "Consegna l’invito quando il backend approvato lo conferma.",
    schedule: "Programma", scheduleHelp: "Scegli il momento giusto per far arrivare la nota.", privateTitle: "Privata per design", privateText: (sender) => `L’invito identifica ${sender}, ma non mostra la Nota d’Amore. Il messaggio resta nascosto fino all’apertura della rivelazione sicura.`, backButton: "Indietro", review: "Rivedi",
    from: "Da", recipient: "Destinatario", delivery: "Consegna", contact: "Contatto", when: "Quando", development: "Anteprima di sviluppo:", developmentText: "questa schermata non invia ancora SMS o email reali. Serve a testare l’esperienza completa prima di collegare il backend di consegna approvato.", previewExperience: "Anteprima esperienza destinatario",
    editDelivery: "Modifica consegna", senderPreview: "Anteprima mittente", noteEmpty: "La tua nota apparirà qui.", sentThrough: "Inviato tramite One2OneLove", receivesFirst: (name) => `Cosa riceve prima ${name}`, invitation: (sender) => `💕 ${sender} ti ha inviato una Nota d’Amore privata su One2OneLove. Tocca per rivelarla.`, reveal: "Rivela la mia Nota d’Amore", nowLabel: "Invia ora", chooseDate: "Scegli data e ora",
  },
  de: {
    back: "Zurück zu Liebesnotizen", eyebrow: "LIEBESNOTIZ SENDEN", title: "Mach sie persönlich. Die Enthüllung bleibt privat.", replyTitle: "Mit einer Liebesnotiz antworten", replyText: (name) => `Wir haben ${name}s Namen übernommen. Schreibe deine Antwort, wähle den Einladungsweg und prüfe alles vor dem Senden.`,
    recipientStep: "Empfänger", deliveryStep: "Zustellung", reviewStep: "Prüfen", yourName: "Dein Name", shown: "für den Empfänger sichtbar", senderHelp: "Einladung und enthüllte Liebesnotiz zeigen, wer sie gesendet hat. One2OneLove ist die Zustellplattform, nicht der Absender.", recipientName: "Name des Empfängers",
    deliveryQuestion: "Wie soll die Einladung ankommen?", text: "Textnachricht", textHelp: "Derzeit nur Vorschau. SMS-Zustellung ist noch nicht aktiviert.", email: "E-Mail", emailHelp: "Eine private Einladung kommt an, ohne die Notiz zu zeigen.", mobile: "Mobilnummer", emailAddress: "E-Mail-Adresse",
    note: "Deine Liebesnotiz", notePlaceholder: "Schreibe deine Liebesnotiz…", replyPlaceholder: (name) => `Schreibe deine Antwort an ${name}…`, continue: "Weiter zur Zustellung", sendNow: "Jetzt senden", sendNowHelp: "Die Einladung wird zugestellt, sobald das genehmigte Backend sie bestätigt.", schedule: "Planen", scheduleHelp: "Wähle den richtigen Moment.", privateTitle: "Privat konzipiert",
    privateText: (sender) => `Die Einladung nennt ${sender}, zeigt aber die Liebesnotiz nicht. Die Nachricht bleibt verborgen, bis der Empfänger die sichere Enthüllung öffnet.`, backButton: "Zurück", review: "Prüfen", from: "Von", recipient: "Empfänger", delivery: "Zustellung", contact: "Kontakt", when: "Wann", development: "Entwicklungsvorschau:",
    developmentText: "dieser Bildschirm sendet noch keine echten SMS oder E-Mails. So testen wir die vollständige Erfahrung, bevor das genehmigte Zustell-Backend verbunden wird.", previewExperience: "Empfängeransicht testen", editDelivery: "Zustellung bearbeiten", senderPreview: "Absendervorschau", noteEmpty: "Deine Notiz erscheint hier.", sentThrough: "Gesendet über One2OneLove",
    receivesFirst: (name) => `Was ${name} zuerst erhält`, invitation: (sender) => `💕 ${sender} hat dir eine private Liebesnotiz auf One2OneLove geschickt. Tippe, um sie zu enthüllen.`, reveal: "Meine Liebesnotiz enthüllen", nowLabel: "Jetzt senden", chooseDate: "Datum und Uhrzeit wählen",
  },
  nl: {
    back: "Terug naar Liefdesbriefjes", eyebrow: "STUUR EEN LIEFDESBRIEFJE", title: "Maak het persoonlijk. Houd de onthulling privé.", replyTitle: "Antwoorden met een Liefdesbriefje", replyText: (name) => `We hebben de naam van ${name} alvast meegenomen. Schrijf je antwoord, kies hoe de uitnodiging aankomt en controleer alles voor verzending.`,
    recipientStep: "Ontvanger", deliveryStep: "Bezorging", reviewStep: "Controleren", yourName: "Jouw naam", shown: "zichtbaar voor ontvanger", senderHelp: "De uitnodiging en het onthulde Liefdesbriefje tonen wie het stuurde. One2OneLove is het bezorgplatform, niet de afzender.", recipientName: "Naam ontvanger",
    deliveryQuestion: "Hoe moet de uitnodiging aankomen?", text: "Sms", textHelp: "Voorlopig alleen een voorbeeld. Sms-bezorging is nog niet geactiveerd.", email: "E-mail", emailHelp: "Een privé-uitnodiging komt aan zonder het briefje te tonen.", mobile: "Mobiel nummer", emailAddress: "E-mailadres", note: "Jouw Liefdesbriefje",
    notePlaceholder: "Schrijf jouw Liefdesbriefje…", replyPlaceholder: (name) => `Schrijf je antwoord aan ${name}…`, continue: "Doorgaan naar bezorging", sendNow: "Nu versturen", sendNowHelp: "Bezorg de uitnodiging zodra de goedgekeurde backend dit bevestigt.", schedule: "Inplannen", scheduleHelp: "Kies een moment waarop het briefje goed aankomt.", privateTitle: "Privé ontworpen",
    privateText: (sender) => `De uitnodiging noemt ${sender}, maar toont het Liefdesbriefje niet. Het bericht blijft verborgen totdat de ontvanger de beveiligde onthulling opent.`, backButton: "Terug", review: "Controleren", from: "Van", recipient: "Ontvanger", delivery: "Bezorging", contact: "Contact", when: "Wanneer", development: "Ontwikkelvoorbeeld:",
    developmentText: "dit scherm verstuurt nog geen echte sms of e-mail. Hiermee testen we de volledige ervaring voordat de goedgekeurde bezorgbackend wordt aangesloten.", previewExperience: "Voorbeeld ontvangerservaring", editDelivery: "Bezorging wijzigen", senderPreview: "Afzendervoorbeeld", noteEmpty: "Je briefje verschijnt hier.", sentThrough: "Verstuurd via One2OneLove", receivesFirst: (name) => `Wat ${name} als eerste ontvangt`, invitation: (sender) => `💕 ${sender} stuurde je een privé Liefdesbriefje via One2OneLove. Tik om het te onthullen.`, reveal: "Mijn Liefdesbriefje onthullen", nowLabel: "Nu versturen", chooseDate: "Datum en tijd kiezen",
  },
};

const loadDraft = () => {
  try {
    const stored = sessionStorage.getItem("o2ol-love-note-draft");
    if (!stored) return { source: "new", recipientName: "", message: DEFAULT_NOTE };
    const parsed = JSON.parse(stored);
    const source = typeof parsed?.source === "string" ? parsed.source : "new";
    const recipientName = typeof parsed?.recipientName === "string" ? parsed.recipientName.trim().slice(0, 80) : "";
    const providedMessage = typeof parsed?.message === "string" ? parsed.message.trim().slice(0, 500) : "";
    return { source, recipientName, message: source === "reply" ? providedMessage : providedMessage || DEFAULT_NOTE };
  } catch {
    return { source: "new", recipientName: "", message: DEFAULT_NOTE };
  }
};

export default function LoveNoteSendDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [initialDraft] = useState(loadDraft);
  const [senderName, setSenderName] = useState(user?.name || "");
  const [recipientName, setRecipientName] = useState(initialDraft.recipientName);
  const [delivery, setDelivery] = useState("text");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState(initialDraft.message);
  const [deliveryTime, setDeliveryTime] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!senderName.trim() && user?.name) setSenderName(user.name);
  }, [user?.name, senderName]);

  useEffect(() => {
    sessionStorage.removeItem("o2ol-love-note-draft");
  }, []);

  const senderLabel = senderName.trim() || t.yourName;
  const recipientLabel = recipientName.trim() || t.recipientName;
  const canContinue = Boolean(senderName.trim() && recipientName.trim() && contact.trim() && message.trim());
  const scheduleLabel = useMemo(() => {
    if (deliveryTime === "now") return t.nowLabel;
    if (!scheduleDate || !scheduleTime) return t.chooseDate;
    return `${scheduleDate} · ${scheduleTime}`;
  }, [deliveryTime, scheduleDate, scheduleTime, t]);
  const today = new Date().toISOString().slice(0, 10);

  const previewRecipient = () => {
    sessionStorage.setItem("o2ol-love-note-preview", JSON.stringify({
      senderName: senderName.trim(), recipientName: recipientName.trim(), message: message.trim(), delivery,
      contact: contact.trim(), deliveryTime, scheduleDate, scheduleTime,
    }));
    navigate("/LoveNoteRevealDemo");
  };

  const steps = [t.recipientStep, t.deliveryStep, t.reviewStep];

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigate("/LoveNotes")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />{t.back}
        </button>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <section className="rounded-[2rem] border border-white bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100"><Heart className="h-6 w-6 fill-pink-500 text-pink-500" /></div>
              <div><div className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">{t.eyebrow}</div><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{t.title}</h1></div>
            </div>

            {initialDraft.source === "reply" && initialDraft.recipientName && (
              <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-900">
                <div className="flex items-center gap-2 font-black"><MessageCircleHeart className="h-4 w-4" />{t.replyTitle}</div><p className="mt-1">{t.replyText(initialDraft.recipientName)}</p>
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
                  <input value={senderName} onChange={(e) => setSenderName(e.target.value.slice(0, 80))} placeholder="Alex" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" />
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
                  <input type={delivery === "text" ? "tel" : "email"} value={contact} onChange={(e) => setContact(e.target.value.slice(0, 160))} placeholder={delivery === "text" ? "(555) 123-4567" : "jamie@example.com"} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" /></div>

                <div><label className="text-sm font-black text-slate-700">{t.note}</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 500))} rows={6} placeholder={initialDraft.source === "reply" ? t.replyPlaceholder(recipientLabel) : t.notePlaceholder} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 leading-7 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" />
                  <div className="mt-1 text-right text-xs font-bold text-slate-400">{message.length}/500</div></div>

                <button type="button" disabled={!canContinue} onClick={() => setStep(2)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">{t.continue}<Send className="h-4 w-4" /></button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setDeliveryTime("now")} className={`rounded-2xl border p-5 text-left ${deliveryTime === "now" ? "border-pink-300 bg-pink-50" : "border-slate-200"}`}><Send className="h-5 w-5 text-pink-600" /><div className="mt-3 font-black">{t.sendNow}</div><div className="mt-1 text-xs leading-5 text-slate-500">{t.sendNowHelp}</div></button>
                  <button type="button" onClick={() => setDeliveryTime("schedule")} className={`rounded-2xl border p-5 text-left ${deliveryTime === "schedule" ? "border-violet-300 bg-violet-50" : "border-slate-200"}`}><CalendarHeart className="h-5 w-5 text-violet-600" /><div className="mt-3 font-black">{t.schedule}</div><div className="mt-1 text-xs leading-5 text-slate-500">{t.scheduleHelp}</div></button>
                </div>
                {deliveryTime === "schedule" && <div className="grid gap-3 sm:grid-cols-2"><input type="date" min={today} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3" /><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3" /></div>}
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><div className="flex items-center gap-2 font-black"><LockKeyhole className="h-4 w-4" />{t.privateTitle}</div><p className="mt-1">{t.privateText(senderLabel)}</p></div>
                <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">{t.backButton}</button><button type="button" onClick={() => setStep(3)} disabled={deliveryTime === "schedule" && (!scheduleDate || !scheduleTime)} className="flex-1 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{t.review}</button></div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"><div className="grid gap-4 sm:grid-cols-2">
                  {[[t.from, senderLabel], [t.recipient, recipientLabel], [t.delivery, delivery === "text" ? t.text : t.email], [t.contact, contact], [t.when, scheduleLabel]].map(([label, value]) => <div key={label}><div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</div><div className="mt-1 break-all font-black">{value}</div></div>)}
                </div></div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><span className="font-black">{t.development}</span> {t.developmentText}</div>
                <button type="button" onClick={previewRecipient} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-xl"><Sparkles className="h-4 w-4 text-pink-300" />{t.previewExperience}</button>
                <button type="button" onClick={() => setStep(2)} className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">{t.editDelivery}</button>
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
