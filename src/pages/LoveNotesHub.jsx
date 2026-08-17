import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarHeart,
  Heart,
  LockKeyhole,
  MessageCircleHeart,
  PenLine,
  Send,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/Layout";
import { loveNotesData } from "@/components/lovenotes/LoveNotesData";
import { createPageUrl } from "@/utils";

const copy = {
  en: {
    eyebrow: "365 LOVE NOTES",
    title: "One for every day of the year.",
    intro: "Pick a note, make it yours, and send a little love when it matters — or when there is no special reason at all.",
    browse: "Browse Love Notes",
    write: "Write Your Own",
    schedule: "Send now or schedule it",
    private: "Designed for a private reveal",
    privateText: "The recipient gets the invitation first. The note itself is revealed inside One2OneLove after they sign in or create a free account.",
    collection: "From the collection",
    collectionTitle: "Start with the words. Then make them personal.",
    custom: "Your own words",
    customTitle: "Write the note only you could send.",
    placeholder: "Write something real…",
    preview: "Recipient preview",
    previewLabel: "A Love Note is waiting for you",
    reveal: "Reveal my Love Note",
    loop: "One note can start the next conversation.",
    loopText: "Receive it. Reveal it. Reply, save it, or send one back.",
    all: "See the full collection",
  },
  es: {
    eyebrow: "365 NOTAS DE AMOR",
    title: "Una para cada día del año.",
    intro: "Elige una nota, hazla tuya y envía un poco de amor cuando importe — o simplemente porque sí.",
    browse: "Ver Notas de Amor",
    write: "Escribe la Tuya",
    schedule: "Envía ahora o programa",
    private: "Diseñado para una revelación privada",
    privateText: "El destinatario recibe primero la invitación. La nota se revela dentro de One2OneLove después de iniciar sesión o crear una cuenta gratis.",
    collection: "De la colección",
    collectionTitle: "Empieza con las palabras. Luego hazlas personales.",
    custom: "Tus propias palabras",
    customTitle: "Escribe la nota que solo tú podrías enviar.",
    placeholder: "Escribe algo real…",
    preview: "Vista del destinatario",
    previewLabel: "Tienes una Nota de Amor esperando",
    reveal: "Revelar mi Nota de Amor",
    loop: "Una nota puede iniciar la próxima conversación.",
    loopText: "Recíbela. Revélala. Responde, guárdala o envía otra.",
    all: "Ver la colección completa",
  },
  fr: {
    eyebrow: "365 MOTS D’AMOUR",
    title: "Un pour chaque jour de l’année.",
    intro: "Choisissez un mot, personnalisez-le et envoyez un peu d’amour quand cela compte — ou simplement sans raison particulière.",
    browse: "Voir les Mots d’Amour",
    write: "Écrire le Vôtre",
    schedule: "Envoyer maintenant ou programmer",
    private: "Conçu pour une révélation privée",
    privateText: "Le destinataire reçoit d’abord l’invitation. Le mot est révélé dans One2OneLove après connexion ou création d’un compte gratuit.",
    collection: "De la collection",
    collectionTitle: "Commencez par les mots. Puis rendez-les personnels.",
    custom: "Vos propres mots",
    customTitle: "Écrivez le mot que vous seul pourriez envoyer.",
    placeholder: "Écrivez quelque chose de vrai…",
    preview: "Aperçu destinataire",
    previewLabel: "Un Mot d’Amour vous attend",
    reveal: "Révéler mon Mot d’Amour",
    loop: "Un mot peut lancer la prochaine conversation.",
    loopText: "Recevez-le. Révélez-le. Répondez, sauvegardez ou renvoyez-en un.",
    all: "Voir toute la collection",
  },
  it: {
    eyebrow: "365 NOTE D’AMORE",
    title: "Una per ogni giorno dell’anno.",
    intro: "Scegli una nota, rendila tua e manda un po’ d’amore quando conta — o semplicemente senza un motivo speciale.",
    browse: "Sfoglia le Note d’Amore",
    write: "Scrivi la Tua",
    schedule: "Invia ora o programma",
    private: "Pensato per una rivelazione privata",
    privateText: "Il destinatario riceve prima l’invito. La nota viene rivelata in One2OneLove dopo l’accesso o la creazione di un account gratuito.",
    collection: "Dalla raccolta",
    collectionTitle: "Parti dalle parole. Poi rendile personali.",
    custom: "Le tue parole",
    customTitle: "Scrivi la nota che solo tu potresti inviare.",
    placeholder: "Scrivi qualcosa di vero…",
    preview: "Anteprima destinatario",
    previewLabel: "C’è una Nota d’Amore per te",
    reveal: "Rivela la mia Nota d’Amore",
    loop: "Una nota può iniziare la prossima conversazione.",
    loopText: "Ricevila. Rivelala. Rispondi, salvala o mandane un’altra.",
    all: "Vedi tutta la raccolta",
  },
  de: {
    eyebrow: "365 LIEBESNOTIZEN",
    title: "Eine für jeden Tag des Jahres.",
    intro: "Wähle eine Notiz, mach sie zu deiner und schicke ein bisschen Liebe, wenn es zählt — oder einfach so.",
    browse: "Liebesnotizen ansehen",
    write: "Eigene schreiben",
    schedule: "Jetzt senden oder planen",
    private: "Für eine private Enthüllung gedacht",
    privateText: "Der Empfänger erhält zuerst die Einladung. Die Notiz wird in One2OneLove nach Anmeldung oder Erstellung eines kostenlosen Kontos enthüllt.",
    collection: "Aus der Sammlung",
    collectionTitle: "Beginne mit den Worten. Dann mach sie persönlich.",
    custom: "Deine eigenen Worte",
    customTitle: "Schreibe die Notiz, die nur du senden könntest.",
    placeholder: "Schreib etwas Echtes…",
    preview: "Empfänger-Vorschau",
    previewLabel: "Eine Liebesnotiz wartet auf dich",
    reveal: "Meine Liebesnotiz enthüllen",
    loop: "Eine Notiz kann das nächste Gespräch beginnen.",
    loopText: "Empfangen. Enthüllen. Antworten, speichern oder eine zurücksenden.",
    all: "Gesamte Sammlung ansehen",
  },
  nl: {
    eyebrow: "365 LIEFDESBRIEFJES",
    title: "Eén voor elke dag van het jaar.",
    intro: "Kies een briefje, maak het persoonlijk en stuur wat liefde wanneer het telt — of gewoon zomaar.",
    browse: "Bekijk Liefdesbriefjes",
    write: "Schrijf Je Eigen",
    schedule: "Nu sturen of plannen",
    private: "Ontworpen voor een privé-onthulling",
    privateText: "De ontvanger krijgt eerst de uitnodiging. Het briefje wordt in One2OneLove onthuld na inloggen of het maken van een gratis account.",
    collection: "Uit de collectie",
    collectionTitle: "Begin met de woorden. Maak ze daarna persoonlijk.",
    custom: "Je eigen woorden",
    customTitle: "Schrijf het briefje dat alleen jij kunt sturen.",
    placeholder: "Schrijf iets echts…",
    preview: "Voorbeeld ontvanger",
    previewLabel: "Er wacht een Liefdesbriefje op je",
    reveal: "Mijn Liefdesbriefje onthullen",
    loop: "Eén briefje kan het volgende gesprek beginnen.",
    loopText: "Ontvang. Onthul. Reageer, bewaar of stuur er één terug.",
    all: "Bekijk de volledige collectie",
  },
};

const flattenNotes = (language) => {
  const source = loveNotesData[language] || loveNotesData.en || {};
  return Object.entries(source).flatMap(([category, notes]) =>
    Array.isArray(notes) ? notes.map((note) => ({ ...note, category })) : []
  );
};

export default function LoveNotesHub() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const notes = useMemo(() => flattenNotes(currentLanguage), [currentLanguage]);
  const samples = notes.slice(0, 3);
  const [draft, setDraft] = useState("");
  const [selectedSample, setSelectedSample] = useState(0);
  const previewText = draft.trim() || samples[selectedSample]?.content || "You crossed my mind, and that felt like a good reason to remind you that you are loved.";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-rose-50 via-white to-violet-50">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-pink-200/35 blur-3xl" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-black tracking-[0.18em] text-pink-700 shadow-sm">
              <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
              {t.eyebrow}
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">{t.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">{t.intro}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/LoveNotesCollection" className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-pink-700">
                {t.browse}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#write-your-own" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50">
                <PenLine className="h-4 w-4" />
                {t.write}
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-slate-600">
              <span className="inline-flex items-center gap-2"><CalendarHeart className="h-4 w-4 text-violet-600" />{t.schedule}</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-600" />{t.private}</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2.25rem] bg-slate-950 p-4 shadow-2xl">
              <div className="rounded-[1.8rem] bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 p-6">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                  <span>One2OneLove</span>
                  <span>{t.preview}</span>
                </div>
                <div className="mx-auto mt-8 max-w-[18rem] -rotate-2 rounded-sm border border-yellow-300 bg-yellow-100 p-6 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-pink-600">
                    <Heart className="h-4 w-4 fill-pink-500" /> Love Note
                  </div>
                  <p className="mt-5 text-center text-lg font-semibold leading-8 text-slate-800">{previewText}</p>
                  <div className="mt-5 text-right text-sm font-bold text-slate-600">— Someone who loves you 💕</div>
                </div>
                <div className="mt-8 rounded-2xl border border-white bg-white/80 p-4 text-center shadow-sm">
                  <div className="text-sm font-black text-slate-900">{t.previewLabel}</div>
                  <button type="button" className="mt-3 w-full rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white">{t.reveal}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-pink-600">{t.collection}</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.collectionTitle}</h2>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {samples.map((note, index) => (
              <button
                key={`${note.title}-${index}`}
                type="button"
                onClick={() => setSelectedSample(index)}
                className={`rounded-[1.75rem] border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${selectedSample === index ? "border-pink-300 bg-pink-50" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-pink-700 shadow-sm">{note.category}</span>
                  <Heart className="h-4 w-4 text-pink-500" />
                </div>
                <h3 className="mt-5 text-lg font-black text-slate-950">{note.title}</h3>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{note.content}</p>
              </button>
            ))}
          </div>

          <div className="mt-7">
            <Link to="/LoveNotesCollection" className="inline-flex items-center gap-2 text-sm font-black text-pink-700">
              {t.all}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="write-your-own" className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">{t.custom}</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.customTitle}</h2>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 500))}
              rows={7}
              placeholder={t.placeholder}
              className="mt-7 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white p-5 text-base leading-7 text-slate-700 shadow-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
            />
            <div className="mt-2 flex items-center justify-between px-1 text-xs font-bold text-slate-400">
              <span>{draft.length}/500</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />Live preview</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-pink-100 bg-gradient-to-br from-pink-50 to-violet-50 p-7 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-black text-pink-700"><MessageCircleHeart className="h-5 w-5" />Love Note preview</div>
            <div className="mt-6 rounded-sm border border-yellow-300 bg-yellow-100 p-7 shadow-xl">
              <p className="text-lg font-semibold leading-8 text-slate-800">{previewText}</p>
              <div className="mt-6 text-right text-sm font-bold text-slate-600">— With love 💕</div>
            </div>
            <Link to="/LoveNotesCollection" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-black text-white">
              <Send className="h-4 w-4" />{t.browse}
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><LockKeyhole className="h-6 w-6 text-pink-300" /></div>
            <h2 className="mt-5 text-3xl font-black tracking-tight">{t.private}</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">{t.privateText}</p>
          </div>
          <div className="rounded-[1.5rem] bg-white/10 p-6">
            <div className="text-xl font-black">{t.loop}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{t.loopText}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
              {["1. Send", "2. Invite", "3. Reveal", "4. Reply / Save"].map((step) => (
                <span key={step} className="rounded-full border border-white/15 bg-white/10 px-3 py-2">{step}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
