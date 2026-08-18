import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Heart, LockKeyhole, MessageCircleHeart, Save, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const fallbackPreview = {
  senderName: "Someone who loves you",
  recipientName: "",
  message: "You crossed my mind today, and that felt like a good enough reason to remind you how much you mean to me. ❤️",
};

const copy = {
  en: {
    back: "Back to Love Notes", subtitle: "Private Love Note preview", waiting: "A private message is waiting",
    headline: (recipient, sender) => recipient ? `${recipient}, ${sender} sent you a Love Note.` : `${sender} sent you a Love Note.`,
    explainer: "The invitation tells you who sent it, but it does not expose their private message. In the live version, a secure invitation token connects this reveal to the intended recipient after sign-in or free-account creation.",
    reveal: "Reveal my Love Note", yourNote: "Your Love Note", sentThrough: "Sent privately through One2OneLove",
    reply: (sender) => `Reply to ${sender}`, save: "Save this note", saved: "Saved", senderIdentity: "Sender identity:",
    identityText: "the Love Note belongs to the person who sent it. One2OneLove is identified as the private delivery platform, not as the author. The recipient can reveal, save, reply, or send another Love Note without leaving One2OneLove.",
  },
  es: {
    back: "Volver a Notas de Amor", subtitle: "Vista previa de Nota de Amor privada", waiting: "Hay un mensaje privado esperando",
    headline: (recipient, sender) => recipient ? `${recipient}, ${sender} te envió una Nota de Amor.` : `${sender} te envió una Nota de Amor.`,
    explainer: "La invitación te dice quién la envió, pero no muestra el mensaje privado. En la versión activa, un enlace seguro conecta esta revelación con el destinatario previsto después de iniciar sesión o crear una cuenta gratis.",
    reveal: "Revelar mi Nota de Amor", yourNote: "Tu Nota de Amor", sentThrough: "Enviado en privado por One2OneLove", reply: (sender) => `Responder a ${sender}`,
    save: "Guardar esta nota", saved: "Guardada", senderIdentity: "Identidad del remitente:", identityText: "la Nota de Amor pertenece a la persona que la envió. One2OneLove se identifica como la plataforma privada de entrega, no como el autor. El destinatario puede revelar, guardar, responder o enviar otra Nota de Amor sin salir de One2OneLove.",
  },
  fr: {
    back: "Retour aux Mots d’Amour", subtitle: "Aperçu du Mot d’Amour privé", waiting: "Un message privé vous attend",
    headline: (recipient, sender) => recipient ? `${recipient}, ${sender} vous a envoyé un Mot d’Amour.` : `${sender} vous a envoyé un Mot d’Amour.`,
    explainer: "L’invitation indique qui l’a envoyée, sans dévoiler le message privé. Dans la version active, un lien sécurisé relie cette révélation au destinataire prévu après connexion ou création d’un compte gratuit.",
    reveal: "Révéler mon Mot d’Amour", yourNote: "Votre Mot d’Amour", sentThrough: "Envoyé en privé via One2OneLove", reply: (sender) => `Répondre à ${sender}`,
    save: "Sauvegarder ce mot", saved: "Sauvegardé", senderIdentity: "Identité de l’expéditeur :", identityText: "le Mot d’Amour appartient à la personne qui l’a envoyé. One2OneLove est identifié comme la plateforme privée d’envoi, et non comme l’auteur. Le destinataire peut révéler, sauvegarder, répondre ou envoyer un autre Mot d’Amour sans quitter One2OneLove.",
  },
  it: {
    back: "Torna alle Note d’Amore", subtitle: "Anteprima Nota d’Amore privata", waiting: "Ti aspetta un messaggio privato",
    headline: (recipient, sender) => recipient ? `${recipient}, ${sender} ti ha inviato una Nota d’Amore.` : `${sender} ti ha inviato una Nota d’Amore.`,
    explainer: "L’invito mostra chi l’ha inviato, ma non espone il messaggio privato. Nella versione attiva, un collegamento sicuro associa la rivelazione al destinatario previsto dopo l’accesso o la creazione di un account gratuito.",
    reveal: "Rivela la mia Nota d’Amore", yourNote: "La tua Nota d’Amore", sentThrough: "Inviata privatamente tramite One2OneLove", reply: (sender) => `Rispondi a ${sender}`,
    save: "Salva questa nota", saved: "Salvata", senderIdentity: "Identità del mittente:", identityText: "la Nota d’Amore appartiene alla persona che l’ha inviata. One2OneLove è la piattaforma privata di consegna, non l’autore. Il destinatario può rivelare, salvare, rispondere o inviare un’altra Nota d’Amore senza lasciare One2OneLove.",
  },
  de: {
    back: "Zurück zu Liebesnotizen", subtitle: "Vorschau der privaten Liebesnotiz", waiting: "Eine private Nachricht wartet",
    headline: (recipient, sender) => recipient ? `${recipient}, ${sender} hat dir eine Liebesnotiz geschickt.` : `${sender} hat dir eine Liebesnotiz geschickt.`,
    explainer: "Die Einladung zeigt, wer sie gesendet hat, ohne die private Nachricht offenzulegen. In der aktiven Version verbindet ein sicherer Link die Enthüllung nach Anmeldung oder kostenloser Kontoerstellung mit dem vorgesehenen Empfänger.",
    reveal: "Meine Liebesnotiz enthüllen", yourNote: "Deine Liebesnotiz", sentThrough: "Privat über One2OneLove gesendet", reply: (sender) => `An ${sender} antworten`,
    save: "Diese Notiz speichern", saved: "Gespeichert", senderIdentity: "Absenderidentität:", identityText: "die Liebesnotiz gehört der Person, die sie gesendet hat. One2OneLove wird als private Zustellplattform ausgewiesen, nicht als Autor. Der Empfänger kann enthüllen, speichern, antworten oder eine weitere Liebesnotiz senden, ohne One2OneLove zu verlassen.",
  },
  nl: {
    back: "Terug naar Liefdesbriefjes", subtitle: "Voorbeeld privé Liefdesbriefje", waiting: "Er wacht een privébericht",
    headline: (recipient, sender) => recipient ? `${recipient}, ${sender} stuurde je een Liefdesbriefje.` : `${sender} stuurde je een Liefdesbriefje.`,
    explainer: "De uitnodiging laat zien wie het stuurde, maar toont het privébericht niet. In de actieve versie koppelt een beveiligde link deze onthulling aan de bedoelde ontvanger na inloggen of het maken van een gratis account.",
    reveal: "Mijn Liefdesbriefje onthullen", yourNote: "Jouw Liefdesbriefje", sentThrough: "Privé verstuurd via One2OneLove", reply: (sender) => `Antwoord aan ${sender}`,
    save: "Dit briefje bewaren", saved: "Bewaard", senderIdentity: "Identiteit afzender:", identityText: "het Liefdesbriefje is van de persoon die het stuurde. One2OneLove wordt getoond als het privé-bezorgplatform, niet als de auteur. De ontvanger kan onthullen, bewaren, antwoorden of een nieuw Liefdesbriefje sturen zonder One2OneLove te verlaten.",
  },
};

const loadPreview = () => {
  try {
    const stored = sessionStorage.getItem("o2ol-love-note-preview");
    if (!stored) return fallbackPreview;
    const parsed = JSON.parse(stored);
    return {
      senderName: typeof parsed?.senderName === "string" && parsed.senderName.trim() ? parsed.senderName.trim() : fallbackPreview.senderName,
      recipientName: typeof parsed?.recipientName === "string" ? parsed.recipientName.trim() : "",
      message: typeof parsed?.message === "string" && parsed.message.trim() ? parsed.message.trim() : fallbackPreview.message,
    };
  } catch {
    return fallbackPreview;
  }
};

export default function LoveNoteRevealDemo() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [preview] = useState(loadPreview);
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved] = useState(false);

  const replyWithLoveNote = () => {
    sessionStorage.setItem("o2ol-love-note-draft", JSON.stringify({ source: "reply", recipientName: preview.senderName, message: "" }));
    navigate("/LoveNoteSendDemo");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link to={createPageUrl("LoveNotes")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />{t.back}</Link>

        <div className="mt-8 overflow-hidden rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl">
          <div className="min-h-[38rem] rounded-[1.8rem] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div><div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">One2OneLove</div><div className="mt-1 text-sm font-bold text-slate-500">{t.subtitle}</div></div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50"><Heart className="h-5 w-5 fill-pink-500 text-pink-500" /></div>
            </div>

            {!revealed ? (
              <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700"><LockKeyhole className="h-7 w-7" /></div>
                <div className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-600">{t.waiting}</div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{t.headline(preview.recipientName, preview.senderName)}</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">{t.explainer}</p>
                <button type="button" onClick={() => setRevealed(true)} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-pink-700"><Sparkles className="h-4 w-4" />{t.reveal}</button>
              </div>
            ) : (
              <div className="py-8">
                <div className="text-center text-xs font-black uppercase tracking-[0.16em] text-pink-600">{t.yourNote}</div>
                <div className="mx-auto mt-8 max-w-[20rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-7 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600"><Heart className="h-4 w-4 fill-pink-500" />One2OneLove</div>
                  <p className="mt-6 text-center text-lg font-semibold leading-8 text-slate-800">{preview.message}</p>
                  <div className="mt-6 text-right text-sm font-bold text-slate-600">— {preview.senderName} 💕</div>
                  <div className="mt-2 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{t.sentThrough}</div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={replyWithLoveNote} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white"><MessageCircleHeart className="h-4 w-4" />{t.reply(preview.senderName)}</button>
                  <button type="button" onClick={() => setSaved(true)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${saved ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}>
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saved ? t.saved : t.save}
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><span className="font-black">{t.senderIdentity}</span> {t.identityText}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
