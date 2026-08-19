import React from "react";
import {
  BookOpen,
  CalendarHeart,
  Gamepad2,
  Heart,
  HeartHandshake,
  MessageCircle,
  MessageSquare,
  Radio,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    heading: "Explore One2OneLove",
    subheading: "Practical relationship tools, conversations, activities, and support in one place.",
    items: [
      ["Love Notes", "Send thoughtful messages that keep appreciation visible.", "/LoveNotes", "heart"],
      ["Daily Relationship Question", "Use one meaningful question each day to start a better conversation.", "/DailyQuestion", "message"],
      ["Marriage Matters", "A dedicated space for married couples to reconnect and keep growing.", "/MarriageMatters", "marriage"],
      ["Relationship Library", "Start with what your relationship needs and find the most useful O2OL tools by goal.", "/RelationshipLibrary", "book"],
      ["Couples Challenges", "Build connection through seven small relationship actions each week.", "/CouplesChallenges", "game"],
      ["Global Relationship Room", "Watch relationship programming, creator conversations, and replays.", "/GlobalRelationshipRoom", "radio"],
      ["Date Ideas", "Find simple ways to make intentional time together more enjoyable.", "/DateIdeas", "calendar"],
      ["Relationship Quizzes", "Use guided questions to learn more about yourself and your relationship.", "/RelationshipQuizzes", "quiz"],
      ["Communication Practice", "Practice healthier ways to listen, express needs, and work through tension.", "/CommunicationPractice", "sparkles"],
      ["Couple Activities", "Choose activities designed to build fun, teamwork, and connection.", "/CoupleActivities", "game"],
      ["Shared Journals", "Create a shared place for reflections, memories, and relationship growth.", "/SharedJournals", "book"],
      ["Relationship Goals", "Turn good intentions into shared goals you can work on together.", "/RelationshipGoals", "target"],
      ["Community", "Connect with other people around relationship conversations and experiences.", "/Community", "users"],
      ["Relationship Support", "Find One2OneLove tools and support pathways when your relationship needs extra care.", "/CoupleSupport", "support"],
    ],
  },
  es: {
    heading: "Explora One2OneLove",
    subheading: "Herramientas prácticas, conversaciones, actividades y apoyo para relaciones en un solo lugar.",
    items: [
      ["Notas de Amor", "Envía mensajes considerados que mantengan visible el aprecio.", "/LoveNotes", "heart"],
      ["Pregunta Diaria para la Relación", "Usa una pregunta significativa cada día para iniciar una mejor conversación.", "/DailyQuestion", "message"],
      ["El Matrimonio Importa", "Un espacio dedicado a matrimonios que quieren reconectarse y seguir creciendo.", "/MarriageMatters", "marriage"],
      ["Biblioteca de Relaciones", "Comienza con lo que tu relación necesita y encuentra las herramientas O2OL más útiles según tu objetivo.", "/RelationshipLibrary", "book"],
      ["Retos para Parejas", "Fortalezcan la conexión con siete pequeñas acciones para la relación cada semana.", "/CouplesChallenges", "game"],
      ["Sala Global de Relaciones", "Mira programación sobre relaciones, conversaciones de creadores y repeticiones.", "/GlobalRelationshipRoom", "radio"],
      ["Ideas para Citas", "Encuentra formas sencillas de hacer más agradable el tiempo intencional juntos.", "/DateIdeas", "calendar"],
      ["Cuestionarios de Relaciones", "Usa preguntas guiadas para conocerte mejor y comprender mejor tu relación.", "/RelationshipQuizzes", "quiz"],
      ["Práctica de Comunicación", "Practica maneras más saludables de escuchar, expresar necesidades y manejar tensiones.", "/CommunicationPractice", "sparkles"],
      ["Actividades para Parejas", "Elige actividades diseñadas para fortalecer diversión, trabajo en equipo y conexión.", "/CoupleActivities", "game"],
      ["Diarios Compartidos", "Crea un espacio compartido para reflexiones, recuerdos y crecimiento de la relación.", "/SharedJournals", "book"],
      ["Metas de Relación", "Convierte buenas intenciones en metas compartidas que puedan trabajar juntos.", "/RelationshipGoals", "target"],
      ["Comunidad", "Conecta con otras personas alrededor de conversaciones y experiencias sobre relaciones.", "/Community", "users"],
      ["Apoyo para Relaciones", "Encuentra herramientas de One2OneLove y caminos de apoyo cuando tu relación necesite más cuidado.", "/CoupleSupport", "support"],
    ],
  },
  fr: {
    heading: "Explorez One2OneLove",
    subheading: "Des outils pratiques, des conversations, des activités et du soutien relationnel réunis au même endroit.",
    items: [
      ["Notes d’Amour", "Envoyez des messages attentionnés qui rendent l’appréciation visible.", "/LoveNotes", "heart"],
      ["Question Relationnelle du Jour", "Utilisez chaque jour une question significative pour ouvrir une meilleure conversation.", "/DailyQuestion", "message"],
      ["Le Mariage Compte", "Un espace dédié aux couples mariés qui souhaitent se reconnecter et continuer à grandir.", "/MarriageMatters", "marriage"],
      ["Bibliothèque Relationnelle", "Commencez par ce dont votre relation a besoin et trouvez les outils O2OL les plus utiles selon votre objectif.", "/RelationshipLibrary", "book"],
      ["Défis de Couple", "Renforcez votre connexion grâce à sept petites actions relationnelles chaque semaine.", "/CouplesChallenges", "game"],
      ["Salle Mondiale des Relations", "Regardez des programmes relationnels, des conversations de créateurs et des rediffusions.", "/GlobalRelationshipRoom", "radio"],
      ["Idées de Rendez-vous", "Trouvez des façons simples de rendre votre temps intentionnel ensemble plus agréable.", "/DateIdeas", "calendar"],
      ["Quiz Relationnels", "Utilisez des questions guidées pour mieux vous connaître et mieux comprendre votre relation.", "/RelationshipQuizzes", "quiz"],
      ["Pratique de Communication", "Entraînez-vous à mieux écouter, exprimer vos besoins et traverser les tensions.", "/CommunicationPractice", "sparkles"],
      ["Activités de Couple", "Choisissez des activités conçues pour renforcer le plaisir, l’équipe et la connexion.", "/CoupleActivities", "game"],
      ["Journaux Partagés", "Créez un espace partagé pour vos réflexions, souvenirs et votre croissance relationnelle.", "/SharedJournals", "book"],
      ["Objectifs de Relation", "Transformez de bonnes intentions en objectifs communs à poursuivre ensemble.", "/RelationshipGoals", "target"],
      ["Communauté", "Échangez avec d’autres personnes autour de conversations et d’expériences relationnelles.", "/Community", "users"],
      ["Soutien aux Relations", "Trouvez les outils One2OneLove et les voies de soutien lorsque votre relation a besoin de plus d’attention.", "/CoupleSupport", "support"],
    ],
  },
  it: {
    heading: "Esplora One2OneLove",
    subheading: "Strumenti pratici, conversazioni, attività e supporto per le relazioni in un unico posto.",
    items: [
      ["Note d’Amore", "Invia messaggi premurosi che mantengono visibile l’apprezzamento.", "/LoveNotes", "heart"],
      ["Domanda Quotidiana sulla Relazione", "Usa ogni giorno una domanda significativa per iniziare una conversazione migliore.", "/DailyQuestion", "message"],
      ["Il Matrimonio Conta", "Uno spazio dedicato alle coppie sposate che vogliono riconnettersi e continuare a crescere.", "/MarriageMatters", "marriage"],
      ["Biblioteca delle Relazioni", "Parti da ciò di cui la relazione ha bisogno e trova gli strumenti O2OL più utili in base all’obiettivo.", "/RelationshipLibrary", "book"],
      ["Sfide di Coppia", "Rafforzate la connessione con sette piccole azioni relazionali ogni settimana.", "/CouplesChallenges", "game"],
      ["Sala Globale delle Relazioni", "Guarda programmi sulle relazioni, conversazioni dei creator e repliche.", "/GlobalRelationshipRoom", "radio"],
      ["Idee per Appuntamenti", "Trova modi semplici per rendere più piacevole il tempo intenzionale insieme.", "/DateIdeas", "calendar"],
      ["Quiz sulle Relazioni", "Usa domande guidate per conoscere meglio te stesso e la tua relazione.", "/RelationshipQuizzes", "quiz"],
      ["Pratica di Comunicazione", "Esercitati ad ascoltare meglio, esprimere bisogni e affrontare le tensioni.", "/CommunicationPractice", "sparkles"],
      ["Attività di Coppia", "Scegli attività pensate per rafforzare divertimento, collaborazione e connessione.", "/CoupleActivities", "game"],
      ["Diari Condivisi", "Crea uno spazio condiviso per riflessioni, ricordi e crescita della relazione.", "/SharedJournals", "book"],
      ["Obiettivi di Relazione", "Trasforma le buone intenzioni in obiettivi condivisi su cui lavorare insieme.", "/RelationshipGoals", "target"],
      ["Comunità", "Connettiti con altre persone attraverso conversazioni ed esperienze sulle relazioni.", "/Community", "users"],
      ["Supporto per Relazioni", "Trova strumenti One2OneLove e percorsi di supporto quando la relazione ha bisogno di più cura.", "/CoupleSupport", "support"],
    ],
  },
  de: {
    heading: "One2OneLove entdecken",
    subheading: "Praktische Beziehungstools, Gespräche, Aktivitäten und Unterstützung an einem Ort.",
    items: [
      ["Liebesbotschaften", "Sende aufmerksame Nachrichten, die Wertschätzung sichtbar machen.", "/LoveNotes", "heart"],
      ["Tägliche Beziehungsfrage", "Nutze jeden Tag eine bedeutungsvolle Frage für ein besseres Gespräch.", "/DailyQuestion", "message"],
      ["Ehe Zählt", "Ein eigener Bereich für Ehepaare, die sich wieder näherkommen und gemeinsam wachsen möchten.", "/MarriageMatters", "marriage"],
      ["Beziehungsbibliothek", "Beginnt mit dem, was eure Beziehung braucht, und findet passende O2OL-Werkzeuge nach Ziel.", "/RelationshipLibrary", "book"],
      ["Paar-Challenges", "Stärkt eure Verbindung jede Woche mit sieben kleinen Beziehungsaktionen.", "/CouplesChallenges", "game"],
      ["Globaler Beziehungsraum", "Sieh Beziehungsprogramme, Creator-Gespräche und Wiederholungen.", "/GlobalRelationshipRoom", "radio"],
      ["Date-Ideen", "Finde einfache Möglichkeiten, bewusste gemeinsame Zeit schöner zu gestalten.", "/DateIdeas", "calendar"],
      ["Beziehungsquiz", "Nutze geführte Fragen, um dich selbst und eure Beziehung besser kennenzulernen.", "/RelationshipQuizzes", "quiz"],
      ["Kommunikationspraxis", "Übt gesünderes Zuhören, das Ausdrücken von Bedürfnissen und den Umgang mit Spannungen.", "/CommunicationPractice", "sparkles"],
      ["Paar-Aktivitäten", "Wählt Aktivitäten, die Spaß, Teamarbeit und Verbindung stärken.", "/CoupleActivities", "game"],
      ["Gemeinsame Journale", "Schafft einen gemeinsamen Ort für Gedanken, Erinnerungen und Beziehungswachstum.", "/SharedJournals", "book"],
      ["Beziehungsziele", "Macht aus guten Absichten gemeinsame Ziele, an denen ihr zusammen arbeiten könnt.", "/RelationshipGoals", "target"],
      ["Community", "Tauscht euch mit anderen Menschen über Beziehungsthemen und Erfahrungen aus.", "/Community", "users"],
      ["Beziehungsunterstützung", "Findet One2OneLove-Werkzeuge und Unterstützungswege, wenn eure Beziehung zusätzliche Aufmerksamkeit braucht.", "/CoupleSupport", "support"],
    ],
  },
};

const iconMap = {
  heart: Heart,
  message: MessageCircle,
  marriage: HeartHandshake,
  radio: Radio,
  calendar: CalendarHeart,
  quiz: MessageSquare,
  sparkles: Sparkles,
  game: Gamepad2,
  book: BookOpen,
  target: Target,
  users: Users,
  support: HeartHandshake,
};

export default function FeaturesGrid() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 px-4 py-14 md:py-18" aria-labelledby="o2ol-features-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <h2 id="o2ol-features-heading" className="text-3xl font-bold text-slate-900 md:text-4xl">{t.heading}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600 md:text-lg">{t.subheading}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map(([title, description, href, iconKey]) => {
            const Icon = iconMap[iconKey] || Heart;
            return (
              <Link
                key={href}
                to={href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-700 transition group-hover:bg-pink-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
