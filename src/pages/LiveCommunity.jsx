import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  MessageCircleHeart,
  MessagesSquare,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { LIVE_COMMUNITY_ROOMS, getLocalizedRoom, getRoomActivityLabel } from "@/lib/liveCommunityRooms";
import { observeRoomPresence } from "@/lib/roomPresenceService";
import { useLanguage } from "@/Layout";

const copy = {
  en: {
    badge: "LIVE COMMUNITY", title: "Real conversations about real relationships.", intro: "Pick a room, see what people are talking about, and join when you have something to say. If a room gets quiet, the O2OL Host keeps a thoughtful conversation ready instead of showing an empty room.",
    live: "Live member activity", host: "AI-hosted conversation starters", rules: "Respectful community rules", choose: "Choose your room", where: "Where do you want to talk?",
    countRule: "Active rooms show the real number of signed-in members currently inside. Quiet rooms show the host’s current topic instead — never a fake number.", hostAsking: "O2OL Host is asking", join: "Join the conversation",
    hostBehavior: "How the O2OL Host behaves", hostRule: "If humans are talking, listen. If humans stop talking, invite. If the invitation works, disappear again.", point: "The point is people",
    aiTitle: "The AI keeps the door open. It does not take over the room.", aiCopy: "The host can welcome someone into a quiet room, offer a fresh question when conversation stalls, and step back as soon as members begin talking to one another.", communityRule: "Community rule:", communityRuleText: "Tell the story. Don’t expose the person.",
    finalTitle: "Come as you are. Talk about what’s real.", finalText: "You do not need the perfect answer. You just need a room where the conversation feels worth joining.",
  },
  es: {
    badge: "COMUNIDAD EN VIVO", title: "Conversaciones reales sobre relaciones reales.", intro: "Elige una sala, descubre de qué se habla y únete cuando tengas algo que decir. Si una sala se queda tranquila, el Anfitrión O2OL mantiene un tema preparado en lugar de mostrar una sala vacía.",
    live: "Actividad real de miembros", host: "Temas iniciados por IA", rules: "Reglas de comunidad respetuosa", choose: "Elige tu sala", where: "¿Dónde quieres conversar?",
    countRule: "Las salas activas muestran el número real de miembros conectados dentro. Las salas tranquilas muestran el tema actual del anfitrión — nunca un número inventado.", hostAsking: "El Anfitrión O2OL pregunta", join: "Unirse a la conversación",
    hostBehavior: "Cómo se comporta el Anfitrión O2OL", hostRule: "Si las personas hablan, escucha. Si dejan de hablar, invita. Si funciona, vuelve a apartarte.", point: "Lo importante son las personas",
    aiTitle: "La IA mantiene la puerta abierta. No se adueña de la sala.", aiCopy: "El anfitrión puede recibir a alguien en una sala tranquila, ofrecer una nueva pregunta cuando la charla se detiene y apartarse en cuanto los miembros comienzan a hablar entre ellos.", communityRule: "Regla de la comunidad:", communityRuleText: "Cuenta la historia. No expongas a la persona.",
    finalTitle: "Ven tal como eres. Habla de lo que es real.", finalText: "No necesitas la respuesta perfecta. Solo necesitas una sala donde valga la pena entrar en la conversación.",
  },
  fr: {
    badge: "COMMUNAUTÉ EN DIRECT", title: "De vraies conversations sur de vraies relations.", intro: "Choisissez un salon, voyez les sujets en cours et participez quand vous avez quelque chose à dire. Si un salon devient calme, l’Hôte O2OL garde un sujet prêt plutôt que d’afficher un salon vide.",
    live: "Activité réelle des membres", host: "Sujets lancés par l’IA", rules: "Règles communautaires respectueuses", choose: "Choisissez votre salon", where: "Où voulez-vous parler ?",
    countRule: "Les salons actifs affichent le nombre réel de membres connectés présents. Les salons calmes affichent le sujet actuel de l’hôte — jamais un faux nombre.", hostAsking: "L’Hôte O2OL demande", join: "Rejoindre la conversation",
    hostBehavior: "Comment se comporte l’Hôte O2OL", hostRule: "Si les humains parlent, écoute. S’ils s’arrêtent, invite. Si l’invitation fonctionne, efface-toi à nouveau.", point: "L’essentiel, ce sont les gens",
    aiTitle: "L’IA garde la porte ouverte. Elle ne prend pas possession du salon.", aiCopy: "L’hôte peut accueillir quelqu’un dans un salon calme, proposer une nouvelle question quand la conversation ralentit et s’effacer dès que les membres recommencent à parler entre eux.", communityRule: "Règle de la communauté :", communityRuleText: "Racontez l’histoire. N’exposez pas la personne.",
    finalTitle: "Venez comme vous êtes. Parlez de ce qui est vrai.", finalText: "Vous n’avez pas besoin de la réponse parfaite. Vous avez juste besoin d’un salon où la conversation mérite d’être rejointe.",
  },
  it: {
    badge: "COMMUNITY LIVE", title: "Conversazioni vere sulle relazioni vere.", intro: "Scegli una stanza, guarda di cosa si parla e partecipa quando hai qualcosa da dire. Se una stanza si calma, l’Host O2OL mantiene pronto uno spunto invece di mostrare una stanza vuota.",
    live: "Attività reale dei membri", host: "Spunti di conversazione dell’IA", rules: "Regole rispettose della community", choose: "Scegli la tua stanza", where: "Dove vuoi parlare?",
    countRule: "Le stanze attive mostrano il numero reale di membri autenticati presenti. Le stanze tranquille mostrano invece l’argomento attuale dell’host — mai un numero finto.", hostAsking: "L’Host O2OL chiede", join: "Entra nella conversazione",
    hostBehavior: "Come si comporta l’Host O2OL", hostRule: "Se le persone parlano, ascolta. Se smettono, invita. Se l’invito funziona, torna a farti da parte.", point: "Il punto sono le persone",
    aiTitle: "L’IA tiene la porta aperta. Non prende il controllo della stanza.", aiCopy: "L’host può accogliere qualcuno in una stanza tranquilla, proporre una domanda quando la conversazione rallenta e farsi da parte appena i membri ricominciano a parlare tra loro.", communityRule: "Regola della community:", communityRuleText: "Racconta la storia. Non esporre la persona.",
    finalTitle: "Vieni come sei. Parla di ciò che è reale.", finalText: "Non serve avere la risposta perfetta. Serve solo una stanza in cui valga la pena entrare nella conversazione.",
  },
  de: {
    badge: "LIVE-COMMUNITY", title: "Echte Gespräche über echte Beziehungen.", intro: "Wähle einen Raum, sieh, worüber gesprochen wird, und mach mit, wenn du etwas beitragen möchtest. Wird ein Raum ruhig, hält der O2OL Host ein gutes Gesprächsthema bereit, statt einen leeren Raum zu zeigen.",
    live: "Echte Mitgliederaktivität", host: "KI-Gesprächsimpulse", rules: "Respektvolle Community-Regeln", choose: "Wähle deinen Raum", where: "Worüber möchtest du sprechen?",
    countRule: "Aktive Räume zeigen die echte Zahl aktuell angemeldeter Mitglieder. Ruhige Räume zeigen stattdessen das aktuelle Thema des Hosts — niemals eine erfundene Zahl.", hostAsking: "Der O2OL Host fragt", join: "Gespräch beitreten",
    hostBehavior: "So verhält sich der O2OL Host", hostRule: "Wenn Menschen reden, hör zu. Wenn sie aufhören, lade ein. Wenn es funktioniert, tritt wieder zurück.", point: "Im Mittelpunkt stehen Menschen",
    aiTitle: "Die KI hält die Tür offen. Sie übernimmt nicht den Raum.", aiCopy: "Der Host kann jemanden in einem ruhigen Raum begrüßen, bei stockendem Gespräch eine neue Frage anbieten und sich zurückziehen, sobald Mitglieder miteinander sprechen.", communityRule: "Community-Regel:", communityRuleText: "Erzähl die Geschichte. Stell die Person nicht bloß.",
    finalTitle: "Komm, wie du bist. Sprich über das, was echt ist.", finalText: "Du brauchst nicht die perfekte Antwort. Du brauchst nur einen Raum, in dem sich das Mitreden lohnt.",
  },
  nl: {
    badge: "LIVE COMMUNITY", title: "Echte gesprekken over echte relaties.", intro: "Kies een kamer, kijk waarover mensen praten en doe mee als je iets wilt zeggen. Wordt het rustig, dan houdt de O2OL Host een goed gespreksonderwerp klaar in plaats van een lege kamer te tonen.",
    live: "Echte ledenactiviteit", host: "Gespreksstarters van de AI-host", rules: "Respectvolle communityregels", choose: "Kies je kamer", where: "Waar wil je over praten?",
    countRule: "Actieve kamers tonen het echte aantal ingelogde leden dat op dat moment aanwezig is. Rustige kamers tonen het huidige onderwerp van de host — nooit een verzonnen aantal.", hostAsking: "De O2OL Host vraagt", join: "Doe mee met het gesprek",
    hostBehavior: "Hoe de O2OL Host zich gedraagt", hostRule: "Als mensen praten, luister. Als ze stoppen, nodig uit. Werkt de uitnodiging, verdwijn dan weer naar de achtergrond.", point: "Het draait om mensen",
    aiTitle: "De AI houdt de deur open. Hij neemt de kamer niet over.", aiCopy: "De host kan iemand welkom heten in een rustige kamer, een nieuwe vraag geven wanneer het gesprek stilvalt en terugstappen zodra leden weer met elkaar praten.", communityRule: "Communityregel:", communityRuleText: "Vertel het verhaal. Stel de persoon niet bloot.",
    finalTitle: "Kom zoals je bent. Praat over wat echt is.", finalText: "Je hoeft niet het perfecte antwoord te hebben. Je hebt alleen een kamer nodig waar het gesprek de moeite waard voelt.",
  },
};

const roomStyles = {
  rose: "from-rose-50 to-orange-50 border-rose-100", violet: "from-violet-50 to-fuchsia-50 border-violet-100", sky: "from-sky-50 to-cyan-50 border-sky-100", amber: "from-amber-50 to-yellow-50 border-amber-100", emerald: "from-emerald-50 to-teal-50 border-emerald-100",
};
const roomIconStyles = {
  rose: "bg-rose-100 text-rose-700", violet: "bg-violet-100 text-violet-700", sky: "bg-sky-100 text-sky-700", amber: "bg-amber-100 text-amber-700", emerald: "bg-emerald-100 text-emerald-700",
};

function RoomActivity({ room, activeCount, language, t }) {
  const activityLabel = getRoomActivityLabel(activeCount, language);
  if (activityLabel) {
    return <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="flex items-center gap-2 text-sm font-black text-emerald-800"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />{activityLabel}</div></div>;
  }
  return <div className="mt-5 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-violet-700"><Sparkles className="h-3.5 w-3.5" />{t.hostAsking}</div><p className="mt-2 text-sm font-semibold leading-6 text-slate-700">“{room.topic}”</p></div>;
}

export default function LiveCommunity() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    const cleanups = LIVE_COMMUNITY_ROOMS.map((room) => observeRoomPresence(room.slug, (count) => setRoomCounts((current) => ({ ...current, [room.slug]: count }))));
    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, []);

  const rooms = LIVE_COMMUNITY_ROOMS.map((room) => getLocalizedRoom(room, currentLanguage));

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-rose-50 via-white to-cyan-50">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" /><div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-4xl text-center"><div className="mx-auto inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/90 px-4 py-2 text-sm font-black text-pink-700 shadow-sm"><Radio className="h-4 w-4" />{t.badge}</div><h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">{t.title}</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">{t.intro}</p></div>
          <div className="mx-auto mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-bold text-slate-600"><span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-cyan-600" />{t.live}</span><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" />{t.host}</span><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />{t.rules}</span></div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-14 sm:py-20"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-xs font-black uppercase tracking-[0.22em] text-pink-600">{t.choose}</div><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.where}</h2></div><div className="max-w-md text-sm leading-6 text-slate-500">{t.countRule}</div></div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {rooms.map((room) => <Link key={room.slug} to={`/LiveRoom?room=${room.slug}`} className={`group flex min-h-[28rem] flex-col rounded-[2rem] border bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${roomStyles[room.accent]}`}>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${roomIconStyles[room.accent]}`}><MessagesSquare className="h-6 w-6" /></div><h3 className="mt-6 text-xl font-black leading-tight text-slate-950">{room.name}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{room.description}</p><RoomActivity room={room} activeCount={roomCounts[room.slug] || 0} language={currentLanguage} t={t} /><div className="mt-auto pt-6"><div className="inline-flex items-center gap-2 text-sm font-black text-slate-900">{t.join}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div></div>
          </Link>)}
        </div>
      </div></section>

      <section className="py-16 sm:py-20"><div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10">
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Sparkles className="h-6 w-6 text-pink-300" /></div><div className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-pink-300">{t.hostBehavior}</div><div className="mt-4 text-2xl font-black leading-9 sm:text-3xl">{t.hostRule}</div></div>
        <div><div className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">{t.point}</div><h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.aiTitle}</h2><p className="mt-5 text-lg leading-8 text-slate-600">{t.aiCopy}</p><div className="mt-7 flex items-start gap-3 rounded-2xl border border-pink-100 bg-pink-50 p-4 text-sm leading-6 text-slate-700"><MessageCircleHeart className="mt-0.5 h-5 w-5 shrink-0 text-pink-600" /><div><span className="font-black">{t.communityRule}</span> {t.communityRuleText}</div></div></div>
      </div></section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10"><div className="mx-auto max-w-6xl rounded-[2rem] bg-gradient-to-r from-pink-600 via-rose-500 to-violet-600 px-6 py-10 text-center text-white shadow-xl sm:px-10"><Heart className="mx-auto h-7 w-7 fill-white text-white" /><h2 className="mt-4 text-3xl font-black tracking-tight">{t.finalTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/90">{t.finalText}</p></div></section>
    </main>
  );
}
