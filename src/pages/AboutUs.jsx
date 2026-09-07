import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Heart,
  MessageSquare,
  BookOpen,
  Calendar,
  Users,
  ShieldCheck,
  Compass,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Love. Grow. Evolve. Together.',
    intro: 'One2OneLove is a relationship-development and relationship-wellness platform created to help adults build stronger, healthier and more intentional connections.',
    intro2: 'We focus on what happens after the introduction: communication, understanding, emotional awareness, connection, growth and the everyday work that helps relationships last.',
    purposeTitle: 'Our Purpose',
    purposeBody: 'Our purpose is simple: provide practical tools, thoughtful content and meaningful ways to strengthen relationships. One2OneLove is designed for dating relationships, committed couples and married couples who want more than surface-level connection.',
    focusTitle: 'What You Can Find Here',
    loveNotes: 'Love Notes',
    loveNotesBody: 'Thoughtful ways to express care, appreciation and affection.',
    understanding: 'Relationship Insight',
    understandingBody: 'Quizzes, prompts and tools that encourage greater understanding.',
    dates: 'Connection & Date Ideas',
    datesBody: 'Ideas that encourage quality time, conversation and shared experiences.',
    resources: 'Relationship Resources',
    resourcesBody: 'Practical content about communication, dating, marriage and relationship growth.',
    community: 'Support & Community',
    communityBody: 'Relationship-focused conversations, encouragement and shared learning.',
    privateTools: 'Private Couple Tools',
    privateToolsBody: 'Personal features for reflection, shared goals and meaningful couple experiences.',
    approachTitle: 'Our Approach',
    approachBody: 'One2OneLove is not built around perfect relationships or unrealistic promises. Relationships are complex. We support honest communication, mutual responsibility, respect, emotional growth and intentional connection.',
    evolveTitle: 'Built to Keep Growing',
    evolveBody: 'The platform continues to evolve carefully, with new tools and experiences added to make One2OneLove more useful without losing sight of its purpose: helping people love better, communicate better and grow together.',
    matchTitle: 'Clarity Before Connection',
    matchBody: 'MyMatchIQ complements the One2OneLove ecosystem by helping adults think more intentionally about compatibility before deeper connection.',
    matchButton: 'Visit MyMatchIQ',
    homeButton: 'Explore One2OneLove',
    contactButton: 'Contact Us'
  },
  es: {
    title: 'Ama. Crece. Evoluciona. Juntos.',
    intro: 'One2OneLove es una plataforma de desarrollo y bienestar de relaciones creada para ayudar a los adultos a construir conexiones más fuertes, saludables e intencionales.',
    intro2: 'Nos enfocamos en lo que sucede después de conocerse: comunicación, comprensión, conciencia emocional, conexión, crecimiento y el trabajo cotidiano que ayuda a que las relaciones perduren.',
    purposeTitle: 'Nuestro Propósito',
    purposeBody: 'Nuestro propósito es sencillo: ofrecer herramientas prácticas, contenido reflexivo y formas significativas de fortalecer las relaciones. One2OneLove está diseñado para relaciones de pareja, parejas comprometidas y matrimonios que buscan algo más que una conexión superficial.',
    focusTitle: 'Lo Que Puedes Encontrar Aquí',
    loveNotes: 'Notas de Amor',
    loveNotesBody: 'Formas significativas de expresar cariño, aprecio y afecto.',
    understanding: 'Perspectiva de Relación',
    understandingBody: 'Cuestionarios, preguntas y herramientas que fomentan una mayor comprensión.',
    dates: 'Conexión e Ideas para Citas',
    datesBody: 'Ideas que fomentan tiempo de calidad, conversación y experiencias compartidas.',
    resources: 'Recursos para Relaciones',
    resourcesBody: 'Contenido práctico sobre comunicación, citas, matrimonio y crecimiento de pareja.',
    community: 'Apoyo y Comunidad',
    communityBody: 'Conversaciones centradas en relaciones, ánimo y aprendizaje compartido.',
    privateTools: 'Herramientas Privadas para Parejas',
    privateToolsBody: 'Funciones personales para reflexión, metas compartidas y experiencias significativas.',
    approachTitle: 'Nuestro Enfoque',
    approachBody: 'One2OneLove no se basa en relaciones perfectas ni en promesas poco realistas. Las relaciones son complejas. Apoyamos la comunicación honesta, la responsabilidad mutua, el respeto, el crecimiento emocional y la conexión intencional.',
    evolveTitle: 'Diseñado para Seguir Creciendo',
    evolveBody: 'La plataforma continúa evolucionando cuidadosamente, agregando nuevas herramientas y experiencias sin perder de vista su propósito: ayudar a las personas a amar mejor, comunicarse mejor y crecer juntas.',
    matchTitle: 'Claridad Antes de la Conexión',
    matchBody: 'MyMatchIQ complementa el ecosistema de One2OneLove ayudando a los adultos a pensar de forma más intencional sobre la compatibilidad antes de una conexión más profunda.',
    matchButton: 'Visitar MyMatchIQ',
    homeButton: 'Explorar One2OneLove',
    contactButton: 'Contáctanos'
  },
  fr: {
    title: 'Aimer. Grandir. Évoluer. Ensemble.',
    intro: 'One2OneLove est une plateforme de développement et de bien-être relationnel conçue pour aider les adultes à construire des liens plus solides, plus sains et plus intentionnels.',
    intro2: 'Nous nous concentrons sur ce qui se passe après la rencontre : communication, compréhension, conscience émotionnelle, connexion, croissance et travail quotidien qui aide les relations à durer.',
    purposeTitle: 'Notre Mission',
    purposeBody: 'Notre objectif est simple : offrir des outils pratiques, du contenu réfléchi et des moyens significatifs de renforcer les relations. One2OneLove s’adresse aux personnes qui se fréquentent, aux couples engagés et aux couples mariés qui souhaitent plus qu’une connexion superficielle.',
    focusTitle: 'Ce Que Vous Trouverez Ici',
    loveNotes: 'Messages d’Amour',
    loveNotesBody: 'Des façons attentionnées d’exprimer l’affection, l’appréciation et la tendresse.',
    understanding: 'Compréhension Relationnelle',
    understandingBody: 'Des quiz, questions et outils qui encouragent une meilleure compréhension.',
    dates: 'Connexion et Idées de Rendez-vous',
    datesBody: 'Des idées qui favorisent le temps de qualité, la conversation et les expériences partagées.',
    resources: 'Ressources Relationnelles',
    resourcesBody: 'Du contenu pratique sur la communication, les rencontres, le mariage et la croissance relationnelle.',
    community: 'Soutien et Communauté',
    communityBody: 'Des conversations centrées sur les relations, l’encouragement et l’apprentissage partagé.',
    privateTools: 'Outils Privés pour Couples',
    privateToolsBody: 'Des fonctions personnelles pour la réflexion, les objectifs partagés et les expériences significatives.',
    approachTitle: 'Notre Approche',
    approachBody: 'One2OneLove ne repose pas sur des relations parfaites ni sur des promesses irréalistes. Les relations sont complexes. Nous soutenons la communication honnête, la responsabilité mutuelle, le respect, la croissance émotionnelle et la connexion intentionnelle.',
    evolveTitle: 'Conçu pour Continuer à Évoluer',
    evolveBody: 'La plateforme continue d’évoluer avec soin, en ajoutant de nouveaux outils et expériences sans perdre de vue son objectif : aider les personnes à mieux aimer, mieux communiquer et grandir ensemble.',
    matchTitle: 'La Clarté Avant la Connexion',
    matchBody: 'MyMatchIQ complète l’écosystème One2OneLove en aidant les adultes à réfléchir plus intentionnellement à la compatibilité avant une connexion plus profonde.',
    matchButton: 'Visiter MyMatchIQ',
    homeButton: 'Explorer One2OneLove',
    contactButton: 'Nous Contacter'
  },
  it: {
    title: 'Ama. Cresci. Evolvi. Insieme.',
    intro: 'One2OneLove è una piattaforma dedicata allo sviluppo e al benessere delle relazioni, creata per aiutare gli adulti a costruire connessioni più forti, sane e intenzionali.',
    intro2: 'Ci concentriamo su ciò che accade dopo il primo incontro: comunicazione, comprensione, consapevolezza emotiva, connessione, crescita e il lavoro quotidiano che aiuta le relazioni a durare.',
    purposeTitle: 'Il Nostro Scopo',
    purposeBody: 'Il nostro scopo è semplice: offrire strumenti pratici, contenuti utili e modi significativi per rafforzare le relazioni. One2OneLove è pensato per chi si frequenta, per coppie impegnate e per coppie sposate che desiderano qualcosa di più di una connessione superficiale.',
    focusTitle: 'Cosa Puoi Trovare Qui',
    loveNotes: 'Messaggi d’Amore',
    loveNotesBody: 'Modi premurosi per esprimere affetto, apprezzamento e cura.',
    understanding: 'Comprensione della Relazione',
    understandingBody: 'Quiz, domande e strumenti che favoriscono una maggiore comprensione.',
    dates: 'Connessione e Idee per Appuntamenti',
    datesBody: 'Idee che favoriscono tempo di qualità, conversazioni ed esperienze condivise.',
    resources: 'Risorse per le Relazioni',
    resourcesBody: 'Contenuti pratici su comunicazione, appuntamenti, matrimonio e crescita relazionale.',
    community: 'Supporto e Comunità',
    communityBody: 'Conversazioni incentrate sulle relazioni, incoraggiamento e apprendimento condiviso.',
    privateTools: 'Strumenti Privati per Coppie',
    privateToolsBody: 'Funzioni personali per riflessione, obiettivi condivisi ed esperienze significative.',
    approachTitle: 'Il Nostro Approccio',
    approachBody: 'One2OneLove non si basa su relazioni perfette o promesse irrealistiche. Le relazioni sono complesse. Sosteniamo la comunicazione onesta, la responsabilità reciproca, il rispetto, la crescita emotiva e una connessione intenzionale.',
    evolveTitle: 'Creato per Continuare a Crescere',
    evolveBody: 'La piattaforma continua a evolversi con attenzione, aggiungendo nuovi strumenti ed esperienze senza perdere di vista il suo scopo: aiutare le persone ad amare meglio, comunicare meglio e crescere insieme.',
    matchTitle: 'Chiarezza Prima della Connessione',
    matchBody: 'MyMatchIQ completa l’ecosistema One2OneLove aiutando gli adulti a riflettere in modo più intenzionale sulla compatibilità prima di una connessione più profonda.',
    matchButton: 'Visita MyMatchIQ',
    homeButton: 'Esplora One2OneLove',
    contactButton: 'Contattaci'
  },
  de: {
    title: 'Lieben. Wachsen. Entwickeln. Gemeinsam.',
    intro: 'One2OneLove ist eine Plattform für Beziehungsentwicklung und Beziehungswohlbefinden, die Erwachsenen helfen soll, stärkere, gesündere und bewusstere Verbindungen aufzubauen.',
    intro2: 'Wir konzentrieren uns auf das, was nach dem Kennenlernen passiert: Kommunikation, Verständnis, emotionale Achtsamkeit, Verbindung, Wachstum und die tägliche Arbeit, die Beziehungen trägt.',
    purposeTitle: 'Unser Zweck',
    purposeBody: 'Unser Ziel ist einfach: praktische Werkzeuge, durchdachte Inhalte und sinnvolle Möglichkeiten bereitzustellen, Beziehungen zu stärken. One2OneLove richtet sich an Menschen in der Kennenlernphase, feste Paare und Ehepaare, die mehr als eine oberflächliche Verbindung suchen.',
    focusTitle: 'Was Sie Hier Finden',
    loveNotes: 'Liebesbotschaften',
    loveNotesBody: 'Aufmerksame Möglichkeiten, Zuneigung, Wertschätzung und Fürsorge auszudrücken.',
    understanding: 'Beziehungsverständnis',
    understandingBody: 'Quizze, Fragen und Werkzeuge, die ein besseres gegenseitiges Verständnis fördern.',
    dates: 'Verbindung und Date-Ideen',
    datesBody: 'Ideen, die gemeinsame Zeit, Gespräche und geteilte Erlebnisse fördern.',
    resources: 'Beziehungsressourcen',
    resourcesBody: 'Praktische Inhalte zu Kommunikation, Dating, Ehe und Beziehungswachstum.',
    community: 'Unterstützung und Community',
    communityBody: 'Beziehungsorientierte Gespräche, Ermutigung und gemeinsames Lernen.',
    privateTools: 'Private Paar-Tools',
    privateToolsBody: 'Persönliche Funktionen für Reflexion, gemeinsame Ziele und bedeutungsvolle Erlebnisse.',
    approachTitle: 'Unser Ansatz',
    approachBody: 'One2OneLove basiert nicht auf perfekten Beziehungen oder unrealistischen Versprechen. Beziehungen sind komplex. Wir unterstützen ehrliche Kommunikation, gegenseitige Verantwortung, Respekt, emotionales Wachstum und bewusste Verbindung.',
    evolveTitle: 'Entwickelt, um Weiterzuwachsen',
    evolveBody: 'Die Plattform entwickelt sich sorgfältig weiter. Neue Werkzeuge und Erfahrungen werden ergänzt, ohne den Zweck aus den Augen zu verlieren: Menschen dabei zu helfen, besser zu lieben, besser zu kommunizieren und gemeinsam zu wachsen.',
    matchTitle: 'Klarheit vor Verbindung',
    matchBody: 'MyMatchIQ ergänzt das One2OneLove-Ökosystem, indem es Erwachsenen hilft, bewusster über Kompatibilität nachzudenken, bevor eine tiefere Verbindung entsteht.',
    matchButton: 'MyMatchIQ Besuchen',
    homeButton: 'One2OneLove Entdecken',
    contactButton: 'Kontakt'
  }
};

const cards = (t) => [
  { icon: Heart, title: t.loveNotes, body: t.loveNotesBody },
  { icon: Compass, title: t.understanding, body: t.understandingBody },
  { icon: Calendar, title: t.dates, body: t.datesBody },
  { icon: BookOpen, title: t.resources, body: t.resourcesBody },
  { icon: Users, title: t.community, body: t.communityBody },
  { icon: ShieldCheck, title: t.privateTools, body: t.privateToolsBody }
];

export default function AboutUs() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">{t.title}</h1>
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto mb-5">{t.intro}</p>
          <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">{t.intro2}</p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-5">{t.purposeTitle}</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">{t.purposeBody}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">{t.focusTitle}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards(t).map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{card.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-pink-100 bg-pink-50 p-7">
            <MessageSquare className="w-8 h-8 text-pink-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.approachTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{t.approachBody}</p>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-7">
            <Sparkles className="w-8 h-8 text-purple-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.evolveTitle}</h2>
            <p className="text-gray-700 leading-relaxed">{t.evolveBody}</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t.matchTitle}</h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-3xl mx-auto mb-8">{t.matchBody}</p>
          <a href="https://www.mymatchiq.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-bold text-indigo-900 hover:bg-gray-100 transition-colors">
            {t.matchButton}
          </a>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl('Home')} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-7 py-3 font-bold text-white hover:from-pink-600 hover:to-purple-600 transition-all">
            {t.homeButton}
          </Link>
          <Link to={createPageUrl('ContactUs')} className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-white px-7 py-3 font-bold text-pink-600 hover:bg-pink-50 transition-colors">
            {t.contactButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
