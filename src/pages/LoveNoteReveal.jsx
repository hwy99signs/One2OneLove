import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Heart, LockKeyhole, MessageCircleHeart, Save, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { revealLoveNote } from "@/lib/loveNoteRevealService";
import { useLanguage } from "@/Layout";

const copy = {
  en: {
    subtitle: "Private Love Note", incomplete: "This Love Note link is incomplete.", incompleteText: "Open the private link that arrived in your One2OneLove invitation.", go: "Go to Love Notes",
    waiting: "A private message is waiting", received: "You received a Love Note.", hidden: "The message itself stays hidden until you sign in and choose to reveal it.", checking: "Checking your account…",
    opening: "Opening…", reveal: "Reveal my Love Note", signIn: "Sign in to reveal", signup: "Create free account", unavailable: "This secure Love Note cannot be opened yet. The private reveal backend is staged but has not been activated on the database.",
    yourNote: "Your Love Note", sentThrough: "Sent privately through One2OneLove", reply: "Reply with a Love Note", save: "Save this note", saved: "Saved",
  },
  es: {
    subtitle: "Nota de Amor privada", incomplete: "Este enlace de Nota de Amor está incompleto.", incompleteText: "Abre el enlace privado que llegó en tu invitación de One2OneLove.", go: "Ir a Notas de Amor",
    waiting: "Hay un mensaje privado esperando", received: "Recibiste una Nota de Amor.", hidden: "El mensaje permanece oculto hasta que inicies sesión y elijas revelarlo.", checking: "Comprobando tu cuenta…",
    opening: "Abriendo…", reveal: "Revelar mi Nota de Amor", signIn: "Iniciar sesión para revelar", signup: "Crear cuenta gratis", unavailable: "Esta Nota de Amor segura todavía no puede abrirse. El backend de revelación privada está preparado, pero aún no se ha activado en la base de datos.",
    yourNote: "Tu Nota de Amor", sentThrough: "Enviado en privado por One2OneLove", reply: "Responder con una Nota de Amor", save: "Guardar esta nota", saved: "Guardada",
  },
  fr: {
    subtitle: "Mot d’Amour privé", incomplete: "Ce lien de Mot d’Amour est incomplet.", incompleteText: "Ouvrez le lien privé reçu dans votre invitation One2OneLove.", go: "Aller aux Mots d’Amour",
    waiting: "Un message privé vous attend", received: "Vous avez reçu un Mot d’Amour.", hidden: "Le message reste caché jusqu’à ce que vous vous connectiez et choisissiez de le révéler.", checking: "Vérification de votre compte…",
    opening: "Ouverture…", reveal: "Révéler mon Mot d’Amour", signIn: "Se connecter pour révéler", signup: "Créer un compte gratuit", unavailable: "Ce Mot d’Amour sécurisé ne peut pas encore être ouvert. Le backend de révélation privée est préparé, mais il n’a pas encore été activé dans la base de données.",
    yourNote: "Votre Mot d’Amour", sentThrough: "Envoyé en privé via One2OneLove", reply: "Répondre avec un Mot d’Amour", save: "Sauvegarder ce mot", saved: "Sauvegardé",
  },
  it: {
    subtitle: "Nota d’Amore privata", incomplete: "Questo link della Nota d’Amore è incompleto.", incompleteText: "Apri il link privato ricevuto nell’invito One2OneLove.", go: "Vai alle Note d’Amore",
    waiting: "Ti aspetta un messaggio privato", received: "Hai ricevuto una Nota d’Amore.", hidden: "Il messaggio resta nascosto finché non accedi e scegli di rivelarlo.", checking: "Controllo dell’account…",
    opening: "Apertura…", reveal: "Rivela la mia Nota d’Amore", signIn: "Accedi per rivelare", signup: "Crea account gratuito", unavailable: "Questa Nota d’Amore sicura non può ancora essere aperta. Il backend di rivelazione privata è pronto, ma non è ancora stato attivato nel database.",
    yourNote: "La tua Nota d’Amore", sentThrough: "Inviata privatamente tramite One2OneLove", reply: "Rispondi con una Nota d’Amore", save: "Salva questa nota", saved: "Salvata",
  },
  de: {
    subtitle: "Private Liebesnotiz", incomplete: "Dieser Liebesnotiz-Link ist unvollständig.", incompleteText: "Öffne den privaten Link aus deiner One2OneLove-Einladung.", go: "Zu den Liebesnotizen",
    waiting: "Eine private Nachricht wartet", received: "Du hast eine Liebesnotiz erhalten.", hidden: "Die Nachricht bleibt verborgen, bis du dich anmeldest und sie bewusst enthüllst.", checking: "Konto wird geprüft…",
    opening: "Wird geöffnet…", reveal: "Meine Liebesnotiz enthüllen", signIn: "Zum Enthüllen anmelden", signup: "Kostenloses Konto erstellen", unavailable: "Diese sichere Liebesnotiz kann noch nicht geöffnet werden. Das private Enthüllungs-Backend ist vorbereitet, wurde aber noch nicht in der Datenbank aktiviert.",
    yourNote: "Deine Liebesnotiz", sentThrough: "Privat über One2OneLove gesendet", reply: "Mit einer Liebesnotiz antworten", save: "Diese Notiz speichern", saved: "Gespeichert",
  },
  nl: {
    subtitle: "Privé Liefdesbriefje", incomplete: "Deze link naar het Liefdesbriefje is onvolledig.", incompleteText: "Open de privélink die je in je One2OneLove-uitnodiging hebt ontvangen.", go: "Naar Liefdesbriefjes",
    waiting: "Er wacht een privébericht", received: "Je hebt een Liefdesbriefje ontvangen.", hidden: "Het bericht blijft verborgen totdat je inlogt en ervoor kiest het te onthullen.", checking: "Je account wordt gecontroleerd…",
    opening: "Openen…", reveal: "Mijn Liefdesbriefje onthullen", signIn: "Inloggen om te onthullen", signup: "Gratis account maken", unavailable: "Dit beveiligde Liefdesbriefje kan nog niet worden geopend. De privé-onthullingsbackend staat klaar, maar is nog niet in de database geactiveerd.",
    yourNote: "Jouw Liefdesbriefje", sentThrough: "Privé verstuurd via One2OneLove", reply: "Antwoord met een Liefdesbriefje", save: "Dit briefje bewaren", saved: "Bewaard",
  },
};

export default function LoveNoteReveal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const token = (searchParams.get("token") || "").trim();
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const returnTo = useMemo(() => `/LoveNoteReveal?token=${encodeURIComponent(token)}`, [token]);
  const signInUrl = `/SignIn?returnTo=${encodeURIComponent(returnTo)}`;
  const signUpUrl = `/SignUp?returnTo=${encodeURIComponent(returnTo)}`;

  const handleReveal = async () => {
    if (!token || isRevealing) return;
    setIsRevealing(true);
    setError("");
    try {
      const data = await revealLoveNote(token);
      setRevealed(data);
    } catch (revealError) {
      console.warn("Love Note reveal unavailable:", revealError);
      setError(t.unavailable);
    } finally {
      setIsRevealing(false);
    }
  };

  const replyWithLoveNote = () => {
    sessionStorage.setItem("o2ol-love-note-draft", JSON.stringify({ source: "reply", recipientName: revealed?.sender_name || "", message: "" }));
    navigate("/LoveNoteSendDemo");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl">
          <div className="min-h-[38rem] rounded-[1.8rem] bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div><div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">One2OneLove</div><div className="mt-1 text-sm font-bold text-slate-500">{t.subtitle}</div></div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50"><Heart className="h-5 w-5 fill-pink-500 text-pink-500" /></div>
            </div>

            {!token ? (
              <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                <LockKeyhole className="h-12 w-12 text-slate-300" /><h1 className="mt-5 text-2xl font-black">{t.incomplete}</h1><p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{t.incompleteText}</p>
                <Link to="/LoveNotes" className="mt-7 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white">{t.go}</Link>
              </div>
            ) : !revealed ? (
              <div className="flex min-h-[30rem] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-700"><LockKeyhole className="h-7 w-7" /></div>
                <div className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-violet-600">{t.waiting}</div><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{t.received}</h1><p className="mt-4 max-w-md text-sm leading-6 text-slate-600">{t.hidden}</p>

                {isLoading ? <div className="mt-7 text-sm font-bold text-slate-500">{t.checking}</div> : user ? (
                  <button type="button" onClick={handleReveal} disabled={isRevealing} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"><Sparkles className="h-4 w-4" />{isRevealing ? t.opening : t.reveal}</button>
                ) : (
                  <div className="mt-7 grid w-full max-w-sm gap-3 sm:grid-cols-2"><Link to={signInUrl} className="rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white">{t.signIn}</Link><Link to={signUpUrl} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">{t.signup}</Link></div>
                )}
                {error && <div className="mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>}
              </div>
            ) : (
              <div className="py-8">
                <div className="text-center text-xs font-black uppercase tracking-[0.16em] text-pink-600">{t.yourNote}</div>
                <div className="mx-auto mt-8 max-w-[20rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-7 shadow-xl"><div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600"><Heart className="h-4 w-4 fill-pink-500" />One2OneLove</div><p className="mt-6 text-center text-lg font-semibold leading-8 text-slate-800">{revealed.note_content}</p><div className="mt-6 text-right text-sm font-bold text-slate-600">— {revealed.sender_name} 💕</div><div className="mt-2 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{t.sentThrough}</div></div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2"><button type="button" onClick={replyWithLoveNote} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white"><MessageCircleHeart className="h-4 w-4" />{t.reply}</button><button type="button" onClick={() => setSaved(true)} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black ${saved ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}>{saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}{saved ? t.saved : t.save}</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
