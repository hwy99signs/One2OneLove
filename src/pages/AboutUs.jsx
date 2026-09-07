import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Heart,
  MessageCircleHeart,
  BookOpenHeart,
  CalendarHeart,
  Users,
  ShieldCheck,
  Compass,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    eyebrow: 'About One2OneLove',
    title: 'Love. Grow. Evolve. Together.',
    intro: 'One2OneLove is a relationship-development and relationship-wellness platform created to help adults build stronger, healthier and more intentional connections.',
    intro2: 'We focus on what happens after the introduction: communication, understanding, emotional awareness, connection, growth and the everyday work that helps relationships last.',
    purposeTitle: 'Our Purpose',
    purposeBody: 'Our purpose is simple: give people practical tools, thoughtful content and meaningful ways to strengthen their relationships. One2OneLove is designed for dating relationships, committed couples and married couples who want more than surface-level connection.',
    focusTitle: 'What One2OneLove Focuses On',
    loveNotes: 'Love Notes',
    loveNotesBody: 'Create thoughtful messages that help partners express care, appreciation and affection.',
    understanding: 'Understanding Each Other',
    understandingBody: 'Use quizzes, prompts and relationship tools to learn more about yourself and your partner.',
    dateIdeas: 'Connection & Date Ideas',
    dateIdeasBody: 'Find ideas that encourage quality time, conversation and shared experiences.',
    resources: 'Relationship Resources',
    resourcesBody: 'Explore practical content about communication, dating, marriage, emotional awareness and relationship growth.',
    community: 'Support & Community',
    communityBody: 'Connect around relationship-focused conversations, encouragement and shared learning.',
    privacy: 'Private Couple Tools',
    privacyBody: 'Use personal relationship features designed for private reflection, shared goals and meaningful couple experiences.',
    approachTitle: 'Our Approach',
    approachBody: 'One2OneLove is not built around perfect relationships or unrealistic promises. Relationships are complex. Our goal is to support honest communication, mutual responsibility, respect, emotional growth and intentional connection.',
    evolveTitle: 'Built to Evolve With Relationships',
    evolveBody: 'One2OneLove continues to grow as a platform. New tools and experiences are added carefully, with the goal of making the platform more useful without losing sight of its purpose: helping people love better, communicate better and grow together.',
    matchTitle: 'Clarity Before Connection',
    matchBody: 'MyMatchIQ complements the One2OneLove relationship ecosystem by helping adults think more intentionally about compatibility before deeper connection.',
    matchButton: 'Visit MyMatchIQ',
    exploreButton: 'Explore One2OneLove',
    contactButton: 'Contact Us'
  },
  es: {
    eyebrow: 'Acerca de One2OneLove',
    title: 'Ama. Crece. Evoluciona. Juntos.',
    intro: 'One2OneLove es una plataforma de desarrollo y bienestar de relaciones creada para ayudar a los adultos a construir conexiones más fuertes, saludables e intencionales.',
    intro2: 'Nos enfocamos en lo que sucede después de la presentación: comunicación, comprensión, conciencia emocional, conexión, crecimiento y el trabajo cotidiano que ayuda a que las relaciones perduren.',
    purposeTitle: 'Nuestro Propósito',
    purposeBody: 'Nuestro propósito es sencillo: ofrecer herramientas prácticas, contenido reflexivo y formas significativas de fortalecer las relaciones. One2OneLove está diseñado para relaciones de pareja, parejas comprometidas y matrimonios que buscan algo más que una conexión superficial.',
    focusTitle: 'En Qué Se Enfoca One2OneLove',
    loveNotes: 'Notas de Amor',
    loveNotesBody: 'Crea mensajes significativos que ayuden a expresar cariño, aprecio y afecto.',
    understanding: 'Comprenderse Mejor',
    understandingBody: 'Usa cuestionarios, preguntas y herramientas de relación para conocerte mejor a ti y a tu pareja.',
    dateIdeas: 'Conexión e Ideas para Citas',
    dateIdeasBody: 'Encuentra ideas que fomenten tiempo de calidad, conversación y experiencias compartidas.',
    resources: 'Recursos para Relaciones',
    resourcesBody: 'Explora contenido práctico sobre comunicación, citas, matrimonio, conciencia emocional y crecimiento de pareja.',
    community: 'Apoyo y Comunidad',
    communityBody: 'Conéctate mediante conversaciones centradas en las relaciones, ánimo y aprendizaje compartido.',
    privacy: 'Herramientas Privadas para Parejas',
    privacyBody: 'Usa funciones personales diseñadas para la reflexión privada, metas compartidas y experiencias significativas en pareja.',
    approachTitle: 'Nuestro Enfoque',
    approachBody: 'One2OneLove no se basa en relaciones perfectas ni en promesas poco realistas. Las relaciones son complejas. Nuestro objetivo es apoyar la comunicación honesta, la responsabilidad mutua, el respeto, el crecimiento emocional y la conexión intencional.',
    evolveTitle: 'Diseñado para Evolucionar con las Relaciones',
    evolveBody: 'One2OneLove continúa creciendo como plataforma. Se añaden nuevas herramientas y experiencias cuidadosamente, con el objetivo de ser más útil sin perder de vista su propósito: ayudar a las personas a amar mejor, comunicarse mejor y crecer juntas.',
    matchTitle: 'Claridad Antes de la Conexión',
    matchBody: 'MyMatchIQ complementa el ecosistema de One2OneLove ayudando a los adultos a pensar de forma más intencional sobre la compatibilidad antes de una conexión más profunda.',
    matchButton: 'Visitar MyMatchIQ',
    exploreButton: 'Explorar One2OneLove',
    contactButton: 'Contáctanos'
  },
  fr: {
    eyebrow: 'À propos de One2OneLove',
    title: 'Aimer. Grandir. Évoluer. Ensemble.',
    intro: 'One2OneLove est une plateforme de développement et de bien-être relationnel conçue pour aider les adultes à construire des liens plus solides, plus sains et plus intentionnels.',
    intro2: 'Nous nous concentrons sur ce qui se passe après la rencontre : communication, compréhension, conscience émotionnelle, connexion, croissance et travail quotidien qui aide les relations à durer.',
    purposeTitle: 'Notre Mission',
    purposeBody: 'Notre objectif est simple : offrir des outils pratiques, du contenu réfléchi et des moyens significatifs de renforcer les relations. One2OneLove s’adresse aux personnes qui se fréquentent, aux couples engagés et aux couples mariés qui recherchent plus qu’une connexion superficielle.',
    focusTitle: 'Ce Que One2OneLove Met en Avant',
    loveNotes: 'Messages d’Amour',
    loveNotesBody: 'Créez des messages attentionnés qui aident les partenaires à exprimer leur affection, leur appréciation et leur tendresse.',
    understanding: 'Mieux Se Comprendre',
    understandingBody: 'Utilisez des quiz, des questions et des outils relationnels pour mieux vous connaître et mieux comprendre votre partenaire.',
    dateIdeas: 'Connexion et Idées de Rendez-vous',
    dateIdeasBody: 'Découvrez des idées qui encouragent le temps de qualité, la conversation et les expériences partagées.',
    resources: 'Ressources Relationnelles',
    resourcesBody: 'Explorez du contenu pratique sur la communication, les rencontres, le mariage, la conscience émotionnelle et la croissance relationnelle.',
    community: 'Soutien et Communauté',
    communityBody: 'Participez à des conversations centrées sur les relations, l’encouragement et l’apprentissage partagé.',
    privacy: 'Outils Privés pour Couples',
    privacyBody: 'Utilisez des fonctions personnelles conçues pour la réflexion privée, les objectifs partagés et les expériences significatives à deux.',
    approachTitle: 'Notre Approche',
    approachBody: 'One2OneLove ne repose pas sur l’idée de relations parfaites ni sur des promesses irréalistes. Les relations sont complexes. Notre objectif est de soutenir une communication honnête, la responsabilité mutuelle, le respect, la croissance émotionnelle et une connexion intentionnelle.',
    evolveTitle: 'Conçu pour Évoluer avec les Relations',
    evolveBody: 'One2OneLove continue d’évoluer en tant que plateforme. De nouveaux outils et expériences sont ajoutés avec soin afin d’être plus utiles sans perdre de vue notre objectif : aider les personnes à mieux aimer, mieux communiquer et grandir ensemble.',
    matchTitle: 'La Clarté Avant la Connexion',
    matchBody: 'MyMatchIQ complète l’écosystème One2OneLove en aidant les adultes à réfléchir plus intentionnellement à la compatibilité avant une connexion plus profonde.',
    matchButton: 'Visiter MyMatchIQ',
    exploreButton: 'Explorer One2OneLove',
    contactButton: 'Nous Contacter'
  },
  it: {
    eyebrow: 'Informazioni su One2OneLove',
    title: 'Ama. Cresci. Evolvi. Insieme.',
    intro: 'One2OneLove è una piattaforma dedicata allo sviluppo e al benessere delle relazioni, creata per aiutare gli adulti a costruire connessioni più forti, sane e intenzionali.',
    intro2: 'Ci concentriamo su ciò che accade dopo il primo incontro: comunicazione, comprensione, consapevolezza emotiva, connessione, crescita e il lavoro quotidiano che aiuta le relazioni a durare.',
    purposeTitle: 'Il Nostro Scopo',
    purposeBody: 'Il nostro scopo è semplice: offrire strumenti pratici, contenuti utili e modi significativi per rafforzare le relazioni. One2OneLove è pensato per chi si frequenta, per coppie impegnate e per coppie sposate che desiderano qualcosa di più di una connessione superficiale.',
    focusTitle: 'Su Cosa Si Concentra One2OneLove',
    loveNotes: 'Messaggi d’Amore',
    loveNotesBody: 'Crea messaggi premurosi che aiutano i partner a esprimere affetto, apprezzamento e cura.',
    understanding: 'Capirsi Meglio',
    understandingBody: 'Usa quiz, domande e strumenti relazionali per conoscere meglio te stesso e il tuo partner.',
    dateIdeas: 'Connessione e Idee per Appuntamenti',
    dateIdeasBody: 'Trova idee che favoriscono tempo di qualità, conversazioni ed esperienze condivise.',
    resources: 'Risorse per le Relazioni',
    resourcesBody: 'Esplora contenuti pratici su comunicazione, appuntamenti, matrimonio, consapevolezza emotiva e crescita relazionale.',
    community: 'Supporto e Comunità',
    communityBody: 'Partecipa a conversazioni incentrate sulle relazioni, sull’incoraggiamento e sull’apprendimento condiviso.',
    privacy: 'Strumenti Privati per Coppie',
    privacyBody: 'Usa funzioni personali pensate per la riflessione privata, obiettivi condivisi ed esperienze significative di coppia.',
    approachTitle: 'Il Nostro Approccio',
    approachBody: 'One2OneLove non si basa su relazioni perfette o promesse irrealistiche. Le relazioni sono complesse. Il nostro obiettivo è sostenere una comunicazione onesta, la responsabilità reciproca, il rispetto, la crescita emotiva e una connessione intenzionale.',
    evolveTitle: 'Creato per Evolvere con le Relazioni',
    evolveBody: 'One2OneLove continua a crescere come piattaforma. Nuovi strumenti ed esperienze vengono aggiunti con attenzione, con l’obiettivo di essere sempre più utili senza perdere di vista lo scopo: aiutare le persone ad amare meglio, comunicare meglio e crescere insieme.',
    matchTitle: 'Chiarezza Prima della Connessione',
    matchBody: 'MyMatchIQ completa l’ecosistema One2OneLove aiutando gli adulti a riflettere in modo più intenzionale sulla compatibilità prima di una connessione più profonda.',
    matchButton: 'Visita MyMatchIQ',
    exploreButton: 'Esplora One2OneLove',
    contactButton: 'Contattaci'
  },
  de: {
    eyebrow: 'Über One2OneLove',
    title: 'Lieben. Wachsen. Entwickeln. Gemeinsam.',
    intro: 'One2OneLove ist eine Plattform für Beziehungsentwicklung und Beziehungswohlbefinden, die Erwachsenen helfen soll, stärkere, gesündere und bewusstere Verbindungen aufzubauen.',
    intro2: 'Wir konzentrieren uns auf das, was nach dem Kennenlernen passiert: Kommunikation, Verständnis, emotionale Achtsamkeit, Verbindung, Wachstum und die tägliche Arbeit, die Beziehungen trägt.',
    purposeTitle: 'Unser Zweck',
    purposeBody: 'Unser Ziel ist einfach: praktische Werkzeuge, durchdachte Inhalte und sinnvolle Möglichkeiten bereitzustellen, Beziehungen zu stärken. One2OneLove richtet sich an Menschen in der Kennenlernphase, feste Paare und Ehepaare, die mehr als eine oberflächliche Verbindung suchen.',
    focusTitle: 'Worauf One2OneLove den Fokus Legt',
    loveNotes: 'Liebesbotschaften',
    loveNotesBody: 'Erstellen Sie aufmerksame Nachrichten, mit denen Partner Zuneigung, Wertschätzung und Fürsorge ausdrücken können.',
    understanding: 'Einander Besser Verstehen',
    understandingBody: 'Nutzen Sie Quizze, Fragen und Beziehungstools, um sich selbst und Ihren Partner besser kennenzulernen.',
    dateIdeas: 'Verbindung und Date-Ideen',
    dateIdeasBody: 'Entdecken Sie Ideen, die gemeinsame Zeit, Gespräche und geteilte Erlebnisse fördern.',
    resources: 'Beziehungsressourcen',
    resourcesBody: 'Entdecken Sie praktische Inhalte zu Kommunikation, Dating, Ehe, emotionaler Achtsamkeit und Beziehungswachstum.',
    community: 'Unterstützung und Community',
    communityBody: 'Nehmen Sie an beziehungsorientierten Gesprächen, Ermutigung und gemeinsamem Lernen teil.',
    privacy: 'Private Paar-Tools',
    privacyBody: 'Nutzen Sie persönliche Funktionen für private Reflexion, gemeinsame Ziele und bedeutungsvolle Paarerlebnisse.',
    approachTitle: 'Unser Ansatz',
    approachBody: 'One2OneLove basiert nicht auf perfekten Beziehungen oder unrealistischen Versprechen. Beziehungen sind komplex. Unser Ziel ist es, ehrliche Kommunikation, gegenseitige Verantwortung, Respekt, emotionales Wachstum und bewusste Verbindung zu unterstützen.',
    evolveTitle: 'Entwickelt, um mit Beziehungen zu Wachsen',
    evolveBody: 'One2OneLove entwickelt sich als Plattform weiter. Neue Werkzeuge und Erfahrungen werden sorgfältig ergänzt, damit die Plattform nützlicher wird, ohne ihren Zweck aus den Augen zu verlieren: Menschen dabei zu helfen, besser zu lieben, besser zu kommunizieren und gemeinsam zu wachsen.',
    matchTitle: 'Klarheit vor Verbindung',
    matchBody: 'MyMatchIQ ergänzt das One2OneLove-Ökosystem, indem es Erwachsenen hilft, bewusster über Kompatibilität nachzudenken, bevor eine tiefere Verbindung entsteht.',
    matchButton: 'MyMatchIQ Besuchen',
    exploreButton: 'One2OneLove Entdecken',
    contactButton: 'Kontakt'
  }
};

const featureCards = (t) => [
  { icon: MessageCircleHeart, title: t.loveNotes, body: t.loveNotesBody },
  { icon: Compass, title: t.understanding, body: t.understandingBody },
  { icon: CalendarHeart, title: t.dateIdeas, body: t.dateIdeasBody },
  { icon: BookOpenHeart, title: t.resources, body: t.resourcesBody },
  { icon: Users, title: t.community, body: t.communityBody },
  { icon: ShieldCheck, title: t.privacy, body: t.privacyBody }
];

export default function AboutUs() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const cards = featureCards(t);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-pink-600 shadow-sm border border-pink-100 mb-6">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
            {t.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t.title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto mb-5">
            {t.intro}
          </p>
          <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
            {t.intro2}
          </p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-5">{t.purposeTitle}</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
            {t.purposeBody}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">{t.focusTitle}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => {
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
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 mb-4" />
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
          <p className="text-lg text-white/80 leading-relaxed max-w-3xl mx-auto mb-8">
            {t.matchBody}
          </p>
          <a
            href="https://www.mymatchiq.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 font-bold text-indigo-900 hover:bg-gray-100 transition-colors"
          >
            {t.matchButton}
          </a>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-7 py-3 font-bold text-white hover:from-pink-600 hover:to-purple-600 transition-all"
          >
            {t.exploreButton}
          </Link>
          <Link
            to={createPageUrl('ContactUs')}
            className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-white px-7 py-3 font-bold text-pink-600 hover:bg-pink-50 transition-colors"
          >
            {t.contactButton}
          </Link>
        </div>
      </section>
    </div>
  );
}
