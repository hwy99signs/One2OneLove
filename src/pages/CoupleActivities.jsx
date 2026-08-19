import React from "react";
import { BookOpen, CalendarHeart, Gamepad2, Heart, MessageCircle, NotebookPen, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Couple Activities",
    subtitle: "Choose something you can actually do together right now—talk, reflect, plan, remember, play, or grow.",
    privacy: "This hub opens real One2OneLove tools. It does not invent progress scores or store which activity you choose.",
    items: [
      ["Conversation Cards", "Take turns answering thoughtful prompts for connection, appreciation, growth, fun, and the future.", "/ConversationCards", "message"],
      ["Weekly Relationship Check-In", "Use a short recurring structure to talk about what is working and what needs attention.", "/WeeklyCheckIn", "heart"],
      ["Relationship Rituals", "Choose a small repeatable habit that protects connection during busy weeks.", "/RelationshipRituals", "sparkles"],
      ["Shared Journals", "Write reflections and meaningful moments in your relationship journal experience.", "/SharedJournals", "journal"],
      ["Memory Lane", "Revisit meaningful memories already recorded in your relationship journey.", "/MemoryLane", "book"],
      ["Couples Calendar", "Plan dates, milestones, reminders, and shared time.", "/CouplesCalendar", "calendar"],
      ["Relationship Goals", "Create meaningful goals and track progress together.", "/RelationshipGoals", "target"],
      ["Cooperative Games", "Open Conversation Cards now and see additional games clearly marked as coming soon.", "/CooperativeGames", "game"],
    ],
  },
  es: {
    title: "Actividades para Parejas",
    subtitle: "Elijan algo que realmente puedan hacer juntos ahora: conversar, reflexionar, planear, recordar, jugar o crecer.",
    privacy: "Este centro abre herramientas reales de One2OneLove. No inventa puntuaciones de progreso ni guarda la actividad que eligen.",
    items: [
      ["Tarjetas de Conversación", "Túrnense para responder preguntas sobre conexión, aprecio, crecimiento, diversión y futuro.", "/ConversationCards", "message"],
      ["Revisión Semanal", "Usen una estructura breve para hablar de lo que funciona y lo que necesita atención.", "/WeeklyCheckIn", "heart"],
      ["Rituales de Relación", "Elijan un pequeño hábito repetible que proteja la conexión durante semanas ocupadas.", "/RelationshipRituals", "sparkles"],
      ["Diarios Compartidos", "Escriban reflexiones y momentos importantes en su diario de relación.", "/SharedJournals", "journal"],
      ["Carril de Recuerdos", "Vuelvan a recuerdos significativos ya registrados.", "/MemoryLane", "book"],
      ["Calendario de Pareja", "Planifiquen citas, hitos, recordatorios y tiempo compartido.", "/CouplesCalendar", "calendar"],
      ["Metas de Relación", "Creen metas significativas y sigan el progreso juntos.", "/RelationshipGoals", "target"],
      ["Juegos Cooperativos", "Abran Tarjetas de Conversación ahora y vean otros juegos claramente marcados como próximos.", "/CooperativeGames", "game"],
    ],
  },
  fr: {
    title: "Activités de Couple",
    subtitle: "Choisissez quelque chose que vous pouvez réellement faire ensemble maintenant : parler, réfléchir, planifier, vous souvenir, jouer ou grandir.",
    privacy: "Ce centre ouvre de vrais outils One2OneLove. Il n’invente pas de scores de progrès et n’enregistre pas votre choix d’activité.",
    items: [
      ["Cartes de Conversation", "Répondez à tour de rôle à des questions sur la connexion, l’appréciation, la croissance, le plaisir et l’avenir.", "/ConversationCards", "message"],
      ["Bilan Hebdomadaire", "Utilisez une structure courte pour parler de ce qui fonctionne et de ce qui mérite plus d’attention.", "/WeeklyCheckIn", "heart"],
      ["Rituels de Relation", "Choisissez une petite habitude répétée qui protège la connexion pendant les semaines chargées.", "/RelationshipRituals", "sparkles"],
      ["Journaux Partagés", "Écrivez des réflexions et des moments importants dans votre journal relationnel.", "/SharedJournals", "journal"],
      ["Allée des Souvenirs", "Revenez aux souvenirs importants déjà enregistrés.", "/MemoryLane", "book"],
      ["Calendrier du Couple", "Planifiez rendez-vous, jalons, rappels et temps partagé.", "/CouplesCalendar", "calendar"],
      ["Objectifs de Relation", "Créez des objectifs significatifs et suivez vos progrès ensemble.", "/RelationshipGoals", "target"],
      ["Jeux Coopératifs", "Ouvrez les Cartes de Conversation maintenant et voyez les autres jeux clairement indiqués comme à venir.", "/CooperativeGames", "game"],
    ],
  },
  it: {
    title: "Attività di Coppia",
    subtitle: "Scegliete qualcosa che potete davvero fare insieme adesso: parlare, riflettere, pianificare, ricordare, giocare o crescere.",
    privacy: "Questo centro apre strumenti One2OneLove realmente disponibili. Non inventa punteggi di progresso e non salva la vostra scelta.",
    items: [
      ["Carte di Conversazione", "Rispondete a turno a domande su connessione, apprezzamento, crescita, divertimento e futuro.", "/ConversationCards", "message"],
      ["Check-In Settimanale", "Usate una struttura breve per parlare di ciò che funziona e di ciò che richiede attenzione.", "/WeeklyCheckIn", "heart"],
      ["Rituali di Coppia", "Scegliete una piccola abitudine ripetibile che protegga la connessione nelle settimane impegnative.", "/RelationshipRituals", "sparkles"],
      ["Diari Condivisi", "Scrivete riflessioni e momenti importanti nel vostro diario di coppia.", "/SharedJournals", "journal"],
      ["Viale dei Ricordi", "Rivisitate i ricordi importanti già registrati.", "/MemoryLane", "book"],
      ["Calendario di Coppia", "Pianificate appuntamenti, traguardi, promemoria e tempo condiviso.", "/CouplesCalendar", "calendar"],
      ["Obiettivi di Relazione", "Create obiettivi significativi e seguite i progressi insieme.", "/RelationshipGoals", "target"],
      ["Giochi Cooperativi", "Aprite le Carte di Conversazione ora e vedete gli altri giochi chiaramente indicati come prossimamente.", "/CooperativeGames", "game"],
    ],
  },
  de: {
    title: "Paar-Aktivitäten",
    subtitle: "Wählt etwas, das ihr jetzt wirklich gemeinsam tun könnt: reden, reflektieren, planen, erinnern, spielen oder wachsen.",
    privacy: "Dieser Bereich öffnet tatsächlich vorhandene One2OneLove-Werkzeuge. Er erfindet keine Fortschrittswerte und speichert eure Auswahl nicht.",
    items: [
      ["Gesprächskarten", "Beantwortet abwechselnd Fragen zu Verbindung, Wertschätzung, Wachstum, Spaß und Zukunft.", "/ConversationCards", "message"],
      ["Wöchentlicher Check-In", "Nutzt eine kurze Struktur, um über Stärken und Bereiche mit mehr Aufmerksamkeit zu sprechen.", "/WeeklyCheckIn", "heart"],
      ["Beziehungsrituale", "Wählt eine kleine wiederholbare Gewohnheit, die Verbindung in vollen Wochen schützt.", "/RelationshipRituals", "sparkles"],
      ["Gemeinsame Journale", "Schreibt Gedanken und wichtige Momente in eurem Beziehungsjournal fest.", "/SharedJournals", "journal"],
      ["Erinnerungsgasse", "Blickt auf wichtige bereits festgehaltene Erinnerungen zurück.", "/MemoryLane", "book"],
      ["Paar-Kalender", "Plant Dates, Meilensteine, Erinnerungen und gemeinsame Zeit.", "/CouplesCalendar", "calendar"],
      ["Beziehungsziele", "Setzt bedeutungsvolle Ziele und verfolgt euren Fortschritt gemeinsam.", "/RelationshipGoals", "target"],
      ["Kooperative Spiele", "Öffnet jetzt die Gesprächskarten und seht weitere Spiele klar als demnächst verfügbar gekennzeichnet.", "/CooperativeGames", "game"],
    ],
  },
};

const icons = { message: MessageCircle, heart: Heart, sparkles: Sparkles, journal: NotebookPen, book: BookOpen, calendar: CalendarHeart, target: Target, game: Gamepad2 };

export default function CoupleActivities() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"><Heart className="h-8 w-8" aria-hidden="true" /></div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-3 text-xs font-medium leading-5 text-rose-800">{t.privacy}</p>
        </header>
        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4" aria-label={t.title}>
          {t.items.map(([title, description, href, iconKey]) => {
            const Icon = icons[iconKey] || Heart;
            return (
              <Link key={href} to={href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
                <Icon className="h-7 w-7 text-rose-600" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
