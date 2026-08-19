import React from "react";
import { BookOpen, Heart, MessageCircle, MoonStar, Sparkles, Target, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Support",
    subtitle: "Practical One2OneLove tools for reflection, communication, connection, and intentional relationship habits.",
    limit: "One2OneLove provides educational relationship tools and community content. This page does not provide therapy, diagnosis, crisis care, or a verified referral to a licensed professional.",
    choose: "Choose what would help right now",
    items: [
      ["Communication Practice", "Practice calmer ways to start difficult conversations without saving your responses.", "/CommunicationPractice", "message"],
      ["Relationship Reset", "Use a guided reset when you want to slow down, reconnect, and choose a constructive next step.", "/RelationshipReset", "sparkles"],
      ["Weekly Check-In", "Create a recurring conversation about connection, appreciation, needs, repair, and the week ahead.", "/WeeklyCheckIn", "heart"],
      ["Conversation Cards", "Use thoughtful prompts when you want to talk more deeply or simply enjoy each other’s company.", "/ConversationCards", "cards"],
      ["Relationship Goals", "Turn an intention into a concrete relationship goal you can work on together.", "/RelationshipGoals", "target"],
      ["Relationship Library", "Browse One2OneLove resources by the kind of relationship support you are looking for.", "/RelationshipLibrary", "library"],
      ["Marriage Matters", "Explore reflection and connection content created specifically with married couples in mind.", "/MarriageMatters", "couple"],
      ["Date Night", "Plan intentional time together around your available time and preferences.", "/DateNight", "date"],
    ],
  },
  es: {
    title: "Apoyo para Relaciones",
    subtitle: "Herramientas prácticas de One2OneLove para reflexión, comunicación, conexión y hábitos intencionales de relación.",
    limit: "One2OneLove ofrece herramientas educativas y contenido comunitario. Esta página no ofrece terapia, diagnóstico, atención de crisis ni una referencia verificada a un profesional con licencia.",
    choose: "Elige lo que podría ayudar ahora",
    items: [
      ["Práctica de Comunicación", "Practiquen maneras más tranquilas de iniciar conversaciones difíciles sin guardar sus respuestas.", "/CommunicationPractice", "message"],
      ["Reinicio de la Relación", "Usen un reinicio guiado para bajar el ritmo, reconectarse y elegir un siguiente paso constructivo.", "/RelationshipReset", "sparkles"],
      ["Revisión Semanal", "Creen una conversación recurrente sobre conexión, aprecio, necesidades, reparación y la próxima semana.", "/WeeklyCheckIn", "heart"],
      ["Tarjetas de Conversación", "Usen preguntas reflexivas para hablar con más profundidad o simplemente disfrutar juntos.", "/ConversationCards", "cards"],
      ["Metas de Relación", "Conviertan una intención en una meta concreta para trabajar juntos.", "/RelationshipGoals", "target"],
      ["Biblioteca de Relaciones", "Exploren recursos de One2OneLove según el tipo de apoyo que buscan.", "/RelationshipLibrary", "library"],
      ["Marriage Matters", "Exploren reflexión y conexión creadas específicamente pensando en parejas casadas.", "/MarriageMatters", "couple"],
      ["Noche de Cita", "Planifiquen tiempo intencional juntos según su tiempo disponible y preferencias.", "/DateNight", "date"],
    ],
  },
  fr: {
    title: "Soutien Relationnel",
    subtitle: "Des outils pratiques One2OneLove pour la réflexion, la communication, la connexion et des habitudes relationnelles intentionnelles.",
    limit: "One2OneLove propose des outils éducatifs et du contenu communautaire. Cette page ne fournit ni thérapie, ni diagnostic, ni aide de crise, ni orientation vérifiée vers un professionnel agréé.",
    choose: "Choisissez ce qui pourrait vous aider maintenant",
    items: [
      ["Pratique de Communication", "Entraînez-vous à commencer les conversations difficiles plus calmement sans enregistrer vos réponses.", "/CommunicationPractice", "message"],
      ["Réinitialisation de la Relation", "Utilisez un guide pour ralentir, vous reconnecter et choisir une prochaine étape constructive.", "/RelationshipReset", "sparkles"],
      ["Bilan Hebdomadaire", "Créez une conversation régulière sur la connexion, l’appréciation, les besoins, la réparation et la semaine à venir.", "/WeeklyCheckIn", "heart"],
      ["Cartes de Conversation", "Utilisez des questions réfléchies pour parler plus profondément ou simplement profiter d’un moment ensemble.", "/ConversationCards", "cards"],
      ["Objectifs de Relation", "Transformez une intention en objectif concret sur lequel travailler ensemble.", "/RelationshipGoals", "target"],
      ["Bibliothèque Relationnelle", "Parcourez les ressources One2OneLove selon le type de soutien recherché.", "/RelationshipLibrary", "library"],
      ["Marriage Matters", "Découvrez du contenu de réflexion et de connexion pensé spécialement pour les couples mariés.", "/MarriageMatters", "couple"],
      ["Soirée en Couple", "Planifiez du temps intentionnel ensemble selon votre disponibilité et vos préférences.", "/DateNight", "date"],
    ],
  },
  it: {
    title: "Supporto alla Relazione",
    subtitle: "Strumenti pratici One2OneLove per riflessione, comunicazione, connessione e abitudini relazionali intenzionali.",
    limit: "One2OneLove offre strumenti educativi e contenuti della community. Questa pagina non fornisce terapia, diagnosi, assistenza di crisi o un invio verificato a un professionista autorizzato.",
    choose: "Scegliete ciò che potrebbe aiutarvi adesso",
    items: [
      ["Pratica di Comunicazione", "Esercitate modi più calmi per iniziare conversazioni difficili senza salvare le vostre risposte.", "/CommunicationPractice", "message"],
      ["Reset della Relazione", "Usate una guida per rallentare, riconnettervi e scegliere un prossimo passo costruttivo.", "/RelationshipReset", "sparkles"],
      ["Check-In Settimanale", "Create una conversazione ricorrente su connessione, apprezzamento, bisogni, riparazione e settimana futura.", "/WeeklyCheckIn", "heart"],
      ["Carte di Conversazione", "Usate domande riflessive per parlare più profondamente o semplicemente godervi la compagnia reciproca.", "/ConversationCards", "cards"],
      ["Obiettivi di Relazione", "Trasformate un’intenzione in un obiettivo concreto da sviluppare insieme.", "/RelationshipGoals", "target"],
      ["Biblioteca delle Relazioni", "Esplorate le risorse One2OneLove secondo il tipo di supporto che state cercando.", "/RelationshipLibrary", "library"],
      ["Marriage Matters", "Esplorate contenuti di riflessione e connessione pensati specificamente per coppie sposate.", "/MarriageMatters", "couple"],
      ["Serata di Coppia", "Pianificate tempo intenzionale insieme in base alla disponibilità e alle preferenze.", "/DateNight", "date"],
    ],
  },
  de: {
    title: "Beziehungsunterstützung",
    subtitle: "Praktische One2OneLove-Werkzeuge für Reflexion, Kommunikation, Verbindung und bewusste Beziehungsgewohnheiten.",
    limit: "One2OneLove bietet pädagogische Beziehungswerkzeuge und Community-Inhalte. Diese Seite bietet keine Therapie, Diagnose, Krisenversorgung oder verifizierte Vermittlung an lizenzierte Fachpersonen.",
    choose: "Wählt, was euch jetzt helfen könnte",
    items: [
      ["Kommunikationsübung", "Übt ruhigere Einstiege in schwierige Gespräche, ohne eure Antworten zu speichern.", "/CommunicationPractice", "message"],
      ["Beziehungs-Reset", "Nutzt eine geführte Rücksetzung, um langsamer zu werden, euch zu verbinden und einen konstruktiven nächsten Schritt zu wählen.", "/RelationshipReset", "sparkles"],
      ["Wöchentlicher Check-In", "Schafft ein regelmäßiges Gespräch über Verbindung, Wertschätzung, Bedürfnisse, Reparatur und die kommende Woche.", "/WeeklyCheckIn", "heart"],
      ["Gesprächskarten", "Nutzt durchdachte Fragen für tiefere Gespräche oder einfach gemeinsame Zeit.", "/ConversationCards", "cards"],
      ["Beziehungsziele", "Macht aus einer Absicht ein konkretes Ziel, an dem ihr gemeinsam arbeiten könnt.", "/RelationshipGoals", "target"],
      ["Beziehungsbibliothek", "Durchsucht One2OneLove-Ressourcen nach der Art von Unterstützung, die ihr sucht.", "/RelationshipLibrary", "library"],
      ["Marriage Matters", "Entdeckt Reflexions- und Verbindungsthemen speziell für verheiratete Paare.", "/MarriageMatters", "couple"],
      ["Date Night", "Plant bewusste gemeinsame Zeit passend zu eurer Verfügbarkeit und euren Vorlieben.", "/DateNight", "date"],
    ],
  },
};

const icons = { message: MessageCircle, sparkles: Sparkles, heart: Heart, cards: MessageCircle, target: Target, library: BookOpen, couple: UsersRound, date: MoonStar };

export default function CoupleSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <Heart className="mx-auto h-14 w-14 fill-rose-100 text-rose-600" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4 text-left text-sm leading-6 text-slate-700">{t.limit}</p>
        </header>

        <section className="mt-10" aria-labelledby="support-options-heading">
          <h2 id="support-options-heading" className="text-2xl font-bold text-slate-900">{t.choose}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {t.items.map(([title, description, href, iconKey]) => {
              const Icon = icons[iconKey] || Heart;
              return <Link key={href} to={href} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"><Icon className="h-7 w-7 text-indigo-600" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></Link>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
