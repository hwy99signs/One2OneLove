import React from "react";
import {
  Heart,
  MessageSquare,
  Gamepad2,
  BookOpen,
  Award,
  Lock,
  Calendar,
  Users,
  Star,
  Shield,
  Mail,
  Crown
} from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    heading: "Platform Features & Resources",
    features: {
      loveNotes: { title: "Love Notes", description: "Create and send personalized notes for everyday affection and special moments." },
      loveLanguage: { title: "Love Language Quiz", description: "Discover how you and your partner prefer to give and receive love." },
      dateIdeas: { title: "Date Ideas", description: "Find thoughtful activities for quality time, from simple outings to special occasions." },
      games: { title: "Games & Activities", description: "Enjoy playful activities designed to spark conversation, laughter, and connection." },
      articles: { title: "Relationship Articles", description: "Explore practical guidance on communication, trust, intimacy, and growth." },
      coupleSupport: { title: "Couple Support", description: "Access tools and prompts that help couples work through everyday relationship challenges." },
      partnerConnection: { title: "Partner Connection", description: "Use shared experiences and check-ins to stay emotionally connected." },
      sharedJournals: { title: "Shared Journals", description: "Capture reflections, memories, and meaningful moments together." },
      relationshipGoals: { title: "Relationship Goals", description: "Set shared goals and keep track of the progress you make as a couple." },
      featuredExperts: { title: "Featured Experts", description: "Learn from selected relationship professionals and practical expert perspectives." },
      hiddenMessages: { title: "Hidden Messages", description: "Share private notes and surprises that only the intended person can reveal." },
      privateSpace: { title: "Private Couple Space", description: "Keep selected couple content in a dedicated private area." }
    }
  },
  es: {
    heading: "Funciones y Recursos de la Plataforma",
    features: {
      loveNotes: { title: "Notas de Amor", description: "Crea y envía notas personalizadas para el cariño diario y los momentos especiales." },
      loveLanguage: { title: "Quiz de Lenguajes del Amor", description: "Descubre cómo tú y tu pareja prefieren dar y recibir amor." },
      dateIdeas: { title: "Ideas para Citas", description: "Encuentra actividades especiales para compartir tiempo de calidad, desde salidas sencillas hasta ocasiones especiales." },
      games: { title: "Juegos y Actividades", description: "Disfruta actividades divertidas diseñadas para generar conversación, risas y conexión." },
      articles: { title: "Artículos sobre Relaciones", description: "Explora orientación práctica sobre comunicación, confianza, intimidad y crecimiento." },
      coupleSupport: { title: "Apoyo para Parejas", description: "Accede a herramientas y preguntas que ayudan a las parejas con los retos cotidianos de la relación." },
      partnerConnection: { title: "Conexión con tu Pareja", description: "Usa experiencias compartidas y momentos de conexión para mantener la cercanía emocional." },
      sharedJournals: { title: "Diarios Compartidos", description: "Guarda reflexiones, recuerdos y momentos significativos juntos." },
      relationshipGoals: { title: "Metas de Relación", description: "Establezcan metas compartidas y sigan el progreso que logran como pareja." },
      featuredExperts: { title: "Expertos Destacados", description: "Aprende de profesionales seleccionados y de perspectivas prácticas de expertos en relaciones." },
      hiddenMessages: { title: "Mensajes Ocultos", description: "Comparte notas privadas y sorpresas que solo la persona indicada puede descubrir." },
      privateSpace: { title: "Espacio Privado para Parejas", description: "Mantén contenido seleccionado de la pareja en un área privada dedicada." }
    }
  },
  fr: {
    heading: "Fonctionnalités et Ressources de la Plateforme",
    features: {
      loveNotes: { title: "Notes d'Amour", description: "Créez et envoyez des messages personnalisés pour le quotidien et les moments spéciaux." },
      loveLanguage: { title: "Quiz des Langages de l'Amour", description: "Découvrez comment vous et votre partenaire préférez donner et recevoir de l'amour." },
      dateIdeas: { title: "Idées de Rendez-vous", description: "Trouvez des activités attentionnées pour partager du temps de qualité, des sorties simples aux occasions spéciales." },
      games: { title: "Jeux et Activités", description: "Profitez d'activités ludiques conçues pour susciter la conversation, le rire et la connexion." },
      articles: { title: "Articles sur les Relations", description: "Explorez des conseils pratiques sur la communication, la confiance, l'intimité et l'évolution." },
      coupleSupport: { title: "Soutien aux Couples", description: "Accédez à des outils et des questions pour mieux gérer les défis relationnels du quotidien." },
      partnerConnection: { title: "Connexion du Couple", description: "Utilisez des expériences partagées et des moments de connexion pour rester proches émotionnellement." },
      sharedJournals: { title: "Journaux Partagés", description: "Conservez ensemble vos réflexions, souvenirs et moments significatifs." },
      relationshipGoals: { title: "Objectifs de Couple", description: "Fixez des objectifs communs et suivez les progrès accomplis ensemble." },
      featuredExperts: { title: "Experts à la Une", description: "Apprenez auprès de professionnels sélectionnés et de perspectives pratiques sur les relations." },
      hiddenMessages: { title: "Messages Cachés", description: "Partagez des notes privées et des surprises que seule la personne concernée peut découvrir." },
      privateSpace: { title: "Espace Privé du Couple", description: "Gardez certains contenus du couple dans un espace privé dédié." }
    }
  },
  it: {
    heading: "Funzionalità e Risorse della Piattaforma",
    features: {
      loveNotes: { title: "Note d'Amore", description: "Crea e invia messaggi personalizzati per l'affetto quotidiano e i momenti speciali." },
      loveLanguage: { title: "Quiz dei Linguaggi dell'Amore", description: "Scopri come tu e il tuo partner preferite dare e ricevere amore." },
      dateIdeas: { title: "Idee per Appuntamenti", description: "Trova attività pensate per trascorrere tempo di qualità, dalle uscite semplici alle occasioni speciali." },
      games: { title: "Giochi e Attività", description: "Divertiti con attività pensate per stimolare conversazione, risate e connessione." },
      articles: { title: "Articoli sulle Relazioni", description: "Esplora consigli pratici su comunicazione, fiducia, intimità e crescita." },
      coupleSupport: { title: "Supporto di Coppia", description: "Accedi a strumenti e spunti che aiutano le coppie ad affrontare le sfide quotidiane della relazione." },
      partnerConnection: { title: "Connessione di Coppia", description: "Usa esperienze condivise e momenti di confronto per mantenere la vicinanza emotiva." },
      sharedJournals: { title: "Diari Condivisi", description: "Conserva insieme riflessioni, ricordi e momenti significativi." },
      relationshipGoals: { title: "Obiettivi di Relazione", description: "Stabilite obiettivi condivisi e seguite i progressi fatti come coppia." },
      featuredExperts: { title: "Esperti in Evidenza", description: "Impara da professionisti selezionati e da prospettive pratiche sulle relazioni." },
      hiddenMessages: { title: "Messaggi Nascosti", description: "Condividi note private e sorprese che solo la persona destinataria può scoprire." },
      privateSpace: { title: "Spazio Privato di Coppia", description: "Mantieni contenuti selezionati della coppia in un'area privata dedicata." }
    }
  },
  de: {
    heading: "Plattform-Funktionen & Ressourcen",
    features: {
      loveNotes: { title: "Liebesbotschaften", description: "Erstelle und sende persönliche Nachrichten für den Alltag und besondere Momente." },
      loveLanguage: { title: "Liebessprachen-Quiz", description: "Entdeckt, wie du und dein Partner Liebe am liebsten gebt und empfangt." },
      dateIdeas: { title: "Date-Ideen", description: "Finde schöne Aktivitäten für gemeinsame Zeit, von einfachen Unternehmungen bis zu besonderen Anlässen." },
      games: { title: "Spiele & Aktivitäten", description: "Genießt spielerische Aktivitäten, die Gespräche, Lachen und Verbundenheit fördern." },
      articles: { title: "Beziehungsartikel", description: "Entdecke praktische Tipps zu Kommunikation, Vertrauen, Intimität und Wachstum." },
      coupleSupport: { title: "Paar-Unterstützung", description: "Nutze Werkzeuge und Impulse, die Paaren bei alltäglichen Beziehungsherausforderungen helfen." },
      partnerConnection: { title: "Partner-Verbindung", description: "Nutzt gemeinsame Erlebnisse und Check-ins, um emotional verbunden zu bleiben." },
      sharedJournals: { title: "Gemeinsame Journale", description: "Haltet Gedanken, Erinnerungen und bedeutungsvolle Momente gemeinsam fest." },
      relationshipGoals: { title: "Beziehungsziele", description: "Setzt gemeinsame Ziele und verfolgt eure Fortschritte als Paar." },
      featuredExperts: { title: "Ausgewählte Experten", description: "Lernt von ausgewählten Fachleuten und praktischen Beziehungsperspektiven." },
      hiddenMessages: { title: "Verborgene Nachrichten", description: "Teile private Botschaften und Überraschungen, die nur die vorgesehene Person entdecken kann." },
      privateSpace: { title: "Privater Paarbereich", description: "Bewahrt ausgewählte Paarinhalte in einem eigenen privaten Bereich auf." }
    }
  }
};

const featureConfig = [
  { key: "loveNotes", icon: Heart, color: "text-pink-500" },
  { key: "loveLanguage", icon: MessageSquare, color: "text-purple-500" },
  { key: "dateIdeas", icon: Calendar, color: "text-rose-500" },
  { key: "games", icon: Gamepad2, color: "text-green-500" },
  { key: "articles", icon: BookOpen, color: "text-blue-500" },
  { key: "coupleSupport", icon: Users, color: "text-indigo-500" },
  { key: "partnerConnection", icon: Mail, color: "text-cyan-500" },
  { key: "sharedJournals", icon: Crown, color: "text-amber-500" },
  { key: "relationshipGoals", icon: Award, color: "text-orange-500" },
  { key: "featuredExperts", icon: Star, color: "text-yellow-500" },
  { key: "hiddenMessages", icon: Lock, color: "text-gray-500" },
  { key: "privateSpace", icon: Shield, color: "text-emerald-500" }
];

export default function FeaturesGrid() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const features = featureConfig.map((feature) => ({ ...feature, ...t.features[feature.key] }));
  const leftFeatures = features.slice(0, 6);
  const rightFeatures = features.slice(6);

  const renderFeature = (feature) => {
    const IconComponent = feature.icon;
    return (
      <div
        key={feature.key}
        className="flex items-start gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-all"
      >
        <div className={`flex-shrink-0 ${feature.color}`}>
          <IconComponent size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-4 pb-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.heading}</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">{leftFeatures.map(renderFeature)}</div>
          <div className="space-y-4">{rightFeatures.map(renderFeature)}</div>
        </div>
      </div>
    </div>
  );
}
