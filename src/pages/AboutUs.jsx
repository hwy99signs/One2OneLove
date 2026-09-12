import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Heart, Users, Target, ShieldCheck, Sparkles, Globe, MessageCircle, Brain, HandHeart } from "lucide-react";
import { useLanguage } from "./Layout";

const COPY = {
  en: {
    title: "About One2OneLove",
    subtitle: "Love. Grow. Evolve. Together.",
    back: "Back",
    heroTitle: "We Start Where Dating Sites Stop.",
    heroBody: "One2OneLove is an all-inclusive relationship platform built for people who are pursuing, building, understanding, and nurturing love. We are not a dating site and we do not match people for dates. Our purpose is to support healthier connection through practical tools, thoughtful conversation, community, reflection, and relationship-focused resources.",
    missionTitle: "Our Mission",
    missionBody: "Our mission is to make useful relationship support easier to access at every stage of love—from learning about yourself and a new connection to strengthening long-term partnerships, engagements, marriages, and committed relationships.",
    valuesTitle: "What Guides Us",
    values: [
      ["Inclusive by Design", "One2OneLove welcomes people of every race, creed, color, gender, sexual orientation, culture, and background. Healthy love and respectful relationships are the common ground."],
      ["Practical Support", "Our tools are designed to help users communicate, reflect, set goals, celebrate milestones, preserve memories, explore date ideas, and express appreciation in meaningful ways."],
      ["Respectful Community", "We want conversation about relationships to be constructive, welcoming, and free from harassment, discrimination, intimidation, or abuse."],
      ["Responsible Technology", "AI-assisted features are intended to support creativity and reflection—not replace personal judgment, licensed professional care, or emergency services."]
    ],
    platformTitle: "What You Can Do on One2OneLove",
    platformItems: [
      ["Relationship Tools", "Use Love Notes, communication practice, relationship goals, quizzes, milestones, Memory Lane, and other relationship-building features."],
      ["Community & Conversation", "Connect through relationship-focused community spaces and conversations built around respect and shared learning."],
      ["Relationship Resources", "Explore articles, support resources, and pathways to qualified professionals where available."],
      ["AI-Assisted Features", "Use AI-powered tools for ideas, prompts, drafts, and reflection while keeping important decisions in your own hands."]
    ],
    notTitle: "What One2OneLove Is Not",
    notBody: "One2OneLove is not a dating or matchmaking service, not a licensed therapy practice, not a medical provider, and not an emergency or crisis service. Information, quizzes, AI-generated content, community discussions, and relationship resources are provided for general informational, educational, and relationship-enrichment purposes.",
    privacyTitle: "Privacy, Safety & Trust",
    privacyBody: "We believe relationship information can be personal. Our Privacy Policy explains what information may be collected, how it is used, when service providers may process it, and the choices available to users. Our Terms of Service establish the rules for using the platform and participating in the community.",
    contactTitle: "Questions or Feedback?",
    contactBody: "We welcome thoughtful feedback about One2OneLove, its features, accessibility, safety, and community experience.",
    contactButton: "Contact Us"
  },
  es: {
    title: "Acerca de One2OneLove", subtitle: "Ama. Crece. Evoluciona. Juntos.", back: "Volver",
    heroTitle: "Comenzamos Donde Terminan los Sitios de Citas.",
    heroBody: "One2OneLove es una plataforma inclusiva de relaciones creada para personas que buscan, construyen, comprenden y nutren el amor. No somos un sitio de citas y no emparejamos personas para citas. Nuestro propósito es apoyar conexiones más saludables mediante herramientas prácticas, conversación reflexiva, comunidad, reflexión y recursos centrados en las relaciones.",
    missionTitle: "Nuestra Misión", missionBody: "Nuestra misión es facilitar el acceso a apoyo útil para las relaciones en cada etapa del amor, desde conocerte a ti mismo y comprender una nueva conexión hasta fortalecer relaciones comprometidas, compromisos y matrimonios.",
    valuesTitle: "Lo Que Nos Guía",
    values: [
      ["Inclusión por Diseño", "One2OneLove da la bienvenida a personas de toda raza, credo, color, género, orientación sexual, cultura y origen."],
      ["Apoyo Práctico", "Nuestras herramientas ayudan a comunicar, reflexionar, fijar metas, celebrar hitos, conservar recuerdos y expresar aprecio."],
      ["Comunidad Respetuosa", "Queremos que las conversaciones sobre relaciones sean constructivas, acogedoras y libres de acoso, discriminación, intimidación o abuso."],
      ["Tecnología Responsable", "Las funciones con IA apoyan la creatividad y la reflexión; no sustituyen el criterio personal, la atención profesional licenciada ni los servicios de emergencia."]
    ],
    platformTitle: "Lo Que Puedes Hacer en One2OneLove",
    platformItems: [["Herramientas de Relación", "Usa Love Notes, práctica de comunicación, metas, cuestionarios, hitos y Memory Lane."],["Comunidad y Conversación", "Participa en espacios centrados en relaciones con respeto y aprendizaje compartido."],["Recursos de Relación", "Explora artículos, recursos de apoyo y acceso a profesionales calificados cuando estén disponibles."],["Funciones con IA", "Usa herramientas con IA para ideas, borradores y reflexión manteniendo las decisiones importantes en tus manos."]],
    notTitle: "Lo Que One2OneLove No Es", notBody: "One2OneLove no es un servicio de citas o emparejamiento, una práctica de terapia licenciada, un proveedor médico ni un servicio de emergencia o crisis. El contenido se ofrece con fines generales de información, educación y enriquecimiento de relaciones.",
    privacyTitle: "Privacidad, Seguridad y Confianza", privacyBody: "Nuestra Política de Privacidad explica qué información puede recopilarse, cómo se usa, cuándo pueden procesarla proveedores de servicios y qué opciones tienen los usuarios. Nuestros Términos de Servicio establecen las reglas de uso de la plataforma.",
    contactTitle: "¿Preguntas o Comentarios?", contactBody: "Agradecemos comentarios sobre las funciones, accesibilidad, seguridad y experiencia comunitaria de One2OneLove.", contactButton: "Contáctanos"
  },
  fr: {
    title: "À Propos de One2OneLove", subtitle: "Aimez. Grandissez. Évoluez. Ensemble.", back: "Retour",
    heroTitle: "Nous Commençons Là Où les Sites de Rencontres S’Arrêtent.", heroBody: "One2OneLove est une plateforme relationnelle inclusive destinée aux personnes qui recherchent, construisent, comprennent et nourrissent l’amour. Nous ne sommes pas un site de rencontres et nous ne mettons pas les utilisateurs en relation pour des rendez-vous. Notre objectif est de favoriser des liens plus sains grâce à des outils pratiques, des conversations réfléchies, une communauté et des ressources relationnelles.",
    missionTitle: "Notre Mission", missionBody: "Notre mission est de rendre le soutien relationnel utile plus accessible à chaque étape de l’amour, de la connaissance de soi et d’une nouvelle relation au renforcement des engagements, partenariats et mariages durables.",
    valuesTitle: "Ce Qui Nous Guide", values: [["Inclusif par Conception", "One2OneLove accueille toutes les races, croyances, couleurs, identités de genre, orientations sexuelles, cultures et origines."],["Soutien Pratique", "Nos outils aident à communiquer, réfléchir, fixer des objectifs, célébrer les étapes importantes, préserver les souvenirs et exprimer l’appréciation."],["Communauté Respectueuse", "Nous voulons des échanges constructifs, accueillants et exempts de harcèlement, discrimination, intimidation ou abus."],["Technologie Responsable", "Les fonctions assistées par IA soutiennent la créativité et la réflexion; elles ne remplacent pas le jugement personnel, les soins professionnels agréés ni les services d’urgence."]],
    platformTitle: "Ce Que Vous Pouvez Faire sur One2OneLove", platformItems: [["Outils Relationnels", "Utilisez Love Notes, la pratique de communication, les objectifs, quiz, étapes et Memory Lane."],["Communauté et Conversation", "Participez à des espaces relationnels fondés sur le respect et l’apprentissage partagé."],["Ressources Relationnelles", "Explorez des articles, ressources de soutien et accès à des professionnels qualifiés lorsqu’ils sont disponibles."],["Fonctions Assistées par IA", "Utilisez l’IA pour des idées, brouillons et réflexions tout en gardant les décisions importantes entre vos mains."]],
    notTitle: "Ce Que One2OneLove N’est Pas", notBody: "One2OneLove n’est pas un service de rencontres ou de mise en relation, un cabinet de thérapie agréé, un prestataire médical ou un service d’urgence. Le contenu est fourni à des fins générales d’information, d’éducation et d’enrichissement relationnel.",
    privacyTitle: "Confidentialité, Sécurité et Confiance", privacyBody: "Notre Politique de Confidentialité explique les informations pouvant être collectées, leur utilisation, le rôle des prestataires et les choix des utilisateurs. Nos Conditions d’Utilisation définissent les règles de la plateforme.",
    contactTitle: "Questions ou Commentaires ?", contactBody: "Nous accueillons vos commentaires sur les fonctionnalités, l’accessibilité, la sécurité et l’expérience communautaire de One2OneLove.", contactButton: "Contact"
  },
  it: {
    title: "Chi Siamo - One2OneLove", subtitle: "Ama. Cresci. Evolvi. Insieme.", back: "Indietro",
    heroTitle: "Iniziamo Dove i Siti di Incontri Si Fermano.", heroBody: "One2OneLove è una piattaforma relazionale inclusiva per chi cerca, costruisce, comprende e coltiva l’amore. Non siamo un sito di incontri e non abbiniamo persone per appuntamenti. Il nostro scopo è sostenere connessioni più sane con strumenti pratici, conversazioni attente, comunità, riflessione e risorse dedicate alle relazioni.",
    missionTitle: "La Nostra Missione", missionBody: "La nostra missione è rendere più accessibile un supporto utile per le relazioni in ogni fase dell’amore, dalla conoscenza di sé e di una nuova connessione al rafforzamento di relazioni, fidanzamenti e matrimoni duraturi.",
    valuesTitle: "Ciò Che Ci Guida", values: [["Inclusione per Progettazione", "One2OneLove accoglie persone di ogni razza, credo, colore, genere, orientamento sessuale, cultura e provenienza."],["Supporto Pratico", "I nostri strumenti aiutano a comunicare, riflettere, fissare obiettivi, celebrare traguardi, conservare ricordi ed esprimere apprezzamento."],["Comunità Rispettosa", "Vogliamo conversazioni costruttive, accoglienti e libere da molestie, discriminazione, intimidazione o abuso."],["Tecnologia Responsabile", "Le funzioni assistite dall’IA sostengono creatività e riflessione; non sostituiscono il giudizio personale, l’assistenza professionale autorizzata o i servizi di emergenza."]],
    platformTitle: "Cosa Puoi Fare su One2OneLove", platformItems: [["Strumenti Relazionali", "Usa Love Notes, pratica di comunicazione, obiettivi, quiz, traguardi e Memory Lane."],["Comunità e Conversazione", "Partecipa a spazi dedicati alle relazioni basati su rispetto e apprendimento condiviso."],["Risorse Relazionali", "Esplora articoli, risorse di supporto e accesso a professionisti qualificati dove disponibili."],["Funzioni Assistite dall’IA", "Usa strumenti IA per idee, bozze e riflessione mantenendo nelle tue mani le decisioni importanti."]],
    notTitle: "Cosa One2OneLove Non È", notBody: "One2OneLove non è un servizio di incontri o matchmaking, uno studio di terapia autorizzato, un fornitore medico o un servizio di emergenza o crisi. I contenuti sono forniti per informazione generale, educazione e arricchimento relazionale.",
    privacyTitle: "Privacy, Sicurezza e Fiducia", privacyBody: "La nostra Informativa sulla Privacy spiega quali informazioni possono essere raccolte, come vengono utilizzate, quando possono essere trattate da fornitori di servizi e quali scelte hanno gli utenti. I Termini di Servizio definiscono le regole della piattaforma.",
    contactTitle: "Domande o Commenti?", contactBody: "Accogliamo commenti sulle funzionalità, accessibilità, sicurezza ed esperienza della comunità One2OneLove.", contactButton: "Contatti"
  },
  de: {
    title: "Über One2OneLove", subtitle: "Lieben. Wachsen. Entwickeln. Gemeinsam.", back: "Zurück",
    heroTitle: "Wir Beginnen, Wo Dating-Seiten Aufhören.", heroBody: "One2OneLove ist eine inklusive Beziehungsplattform für Menschen, die Liebe suchen, aufbauen, verstehen und pflegen. Wir sind keine Dating-Seite und vermitteln keine Dates. Unser Ziel ist es, gesündere Verbindungen durch praktische Werkzeuge, reflektierte Gespräche, Community, Selbstreflexion und beziehungsbezogene Ressourcen zu unterstützen.",
    missionTitle: "Unsere Mission", missionBody: "Unsere Mission ist es, hilfreiche Beziehungsunterstützung in jeder Phase der Liebe leichter zugänglich zu machen – vom Kennenlernen der eigenen Bedürfnisse und einer neuen Verbindung bis zur Stärkung langfristiger Partnerschaften, Verlobungen und Ehen.",
    valuesTitle: "Was Uns Leitet", values: [["Inklusiv Gestaltet", "One2OneLove heißt Menschen jeder Herkunft, jedes Glaubens, jeder Hautfarbe, jedes Geschlechts, jeder sexuellen Orientierung, Kultur und Lebensgeschichte willkommen."],["Praktische Unterstützung", "Unsere Werkzeuge helfen bei Kommunikation, Reflexion, Zielen, Meilensteinen, Erinnerungen und Wertschätzung."],["Respektvolle Community", "Wir möchten konstruktive, einladende Gespräche ohne Belästigung, Diskriminierung, Einschüchterung oder Missbrauch."],["Verantwortungsvolle Technologie", "KI-gestützte Funktionen unterstützen Kreativität und Reflexion; sie ersetzen kein persönliches Urteilsvermögen, professionelle Behandlung oder Notfalldienste."]],
    platformTitle: "Was Sie auf One2OneLove Tun Können", platformItems: [["Beziehungstools", "Nutzen Sie Love Notes, Kommunikationsübungen, Ziele, Quizze, Meilensteine und Memory Lane."],["Community und Gespräch", "Nehmen Sie an beziehungsbezogenen Räumen mit Respekt und gemeinsamem Lernen teil."],["Beziehungsressourcen", "Entdecken Sie Artikel, Unterstützungsangebote und – soweit verfügbar – Zugänge zu qualifizierten Fachkräften."],["KI-gestützte Funktionen", "Nutzen Sie KI für Ideen, Entwürfe und Reflexion, während wichtige Entscheidungen bei Ihnen bleiben."]],
    notTitle: "Was One2OneLove Nicht Ist", notBody: "One2OneLove ist kein Dating- oder Matchmaking-Dienst, keine lizenzierte Therapiepraxis, kein medizinischer Anbieter und kein Notfall- oder Krisendienst. Inhalte dienen allgemeinen Informations-, Bildungs- und Beziehungszwecken.",
    privacyTitle: "Datenschutz, Sicherheit und Vertrauen", privacyBody: "Unsere Datenschutzrichtlinie erklärt, welche Informationen erhoben werden können, wie sie verwendet werden, wann Dienstleister sie verarbeiten können und welche Wahlmöglichkeiten Nutzer haben. Unsere Nutzungsbedingungen legen die Regeln für die Plattform fest.",
    contactTitle: "Fragen oder Feedback?", contactBody: "Wir freuen uns über Feedback zu Funktionen, Barrierefreiheit, Sicherheit und Community-Erlebnis von One2OneLove.", contactButton: "Kontakt"
  }
};

const icons = [Heart, Target, Users, ShieldCheck];
const platformIcons = [HandHeart, MessageCircle, Globe, Brain];

export default function AboutUs() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="bg-white shadow-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <Link to={createPageUrl("Home")} className="flex items-center px-4 py-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all mr-4">
              <ArrowLeft size={20} className="mr-2" />{t.back}
            </Link>
            <div className="flex items-center">
              <Heart className="text-pink-500 fill-pink-500 mr-3" size={32} />
              <div><h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t.title}</h1><p className="text-sm text-gray-500">{t.subtitle}</p></div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Sparkles className="mx-auto text-purple-600 mb-5" size={44} />
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">{t.heroTitle}</h2>
          <p className="text-xl text-gray-700 leading-relaxed">{t.heroBody}</p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.missionTitle}</h3>
          <p className="text-lg text-gray-700 leading-relaxed">{t.missionBody}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-10">{t.valuesTitle}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.values.map(([title, body], index) => {
              const Icon = icons[index];
              return <div key={title} className="bg-white rounded-2xl p-6 shadow-lg text-center"><div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"><Icon className="text-white" size={25} /></div><h4 className="text-lg font-bold text-gray-900 mb-2">{title}</h4><p className="text-gray-600 text-sm leading-relaxed">{body}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-10">{t.platformTitle}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {t.platformItems.map(([title, body], index) => {
              const Icon = platformIcons[index];
              return <div key={title} className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-7"><Icon className="text-purple-600 mb-3" size={30} /><h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4><p className="text-gray-700 leading-relaxed">{body}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="py-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <ShieldCheck className="mx-auto mb-4" size={42} />
          <h3 className="text-3xl font-black mb-4">{t.notTitle}</h3>
          <p className="text-lg leading-relaxed text-white/95">{t.notBody}</p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.privacyTitle}</h3>
          <p className="text-lg text-gray-700 leading-relaxed">{t.privacyBody}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl("PrivacyPolicy")} className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">Privacy Policy</Link>
            <Link to={createPageUrl("TermsOfService")} className="px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700">Terms of Service</Link>
          </div>
        </div>
      </section>

      <section className="py-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-3">{t.contactTitle}</h3>
          <p className="text-lg text-white/90 mb-6">{t.contactBody}</p>
          <Link to={createPageUrl("ContactUs")} className="inline-flex items-center px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50">{t.contactButton}</Link>
        </div>
      </section>
    </div>
  );
}