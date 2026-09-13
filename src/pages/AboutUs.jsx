import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import { ArrowLeft, Heart, Users, Target, Shield, Sparkles, Globe, MessageCircle } from "lucide-react";

const translations = {
  en: {
    title: "About One2OneLove",
    subtitle: "Love. Grow. Evolve. Together.",
    back: "Back",
    hero: "We Start Where Dating Sites Stop.",
    intro: "One2OneLove is an all-inclusive relationship platform built to support people who are pursuing, building, understanding, and nurturing healthy love and relationships. It is designed for people at many stages of connection, including dating, committed relationships, engagement, marriage, and personal relationship growth.",
    ownershipTitle: "Ownership & Operation",
    ownership: "The One2One Love Platform is owned and operated by ERANT Property Services LLC (EPS LLC), its parent company.",
    missionTitle: "Our Mission",
    mission: "Our mission is to bring practical relationship tools, thoughtful conversation, reflection, community, and supportive resources together in one place so people can communicate more intentionally, strengthen connection, celebrate meaningful moments, and make healthier relationship choices.",
    notDatingTitle: "What One2OneLove Is — and Is Not",
    notDating: "One2OneLove is not a dating or matchmaking service. We do not match people for dates. The platform begins where traditional dating services often stop: helping people think, communicate, connect, grow, and maintain relationships after a connection exists or while they are learning what healthy relationships require.",
    valuesTitle: "What Guides the Platform",
    values: [
      { title: "Inclusive by Design", body: "People of every race, creed, color, culture, gender, sexual orientation, and background are welcome. One2OneLove is intended to be respectful of different relationship experiences and identities." },
      { title: "Practical Relationship Tools", body: "Features such as Love Notes, quizzes, communication practice, goals, milestones, memories, date ideas, and related tools are intended to support reflection, communication, connection, and shared experiences." },
      { title: "Community With Boundaries", body: "Community and chat features are intended for respectful conversation. Harassment, threats, discrimination, exploitation, impersonation, spam, and abusive conduct are not part of the community we are building." },
      { title: "Privacy and Safety Matter", body: "Relationship information can be personal. Users should share thoughtfully, and One2OneLove is committed to handling personal information in accordance with its Privacy Policy and applicable law." }
    ],
    aiTitle: "AI-Assisted Features",
    ai: "Some One2OneLove features may use artificial intelligence to help generate ideas, prompts, notes, educational information, or relationship reflections. AI output can be incomplete, inaccurate, or inappropriate for a user's circumstances. Users should review AI-generated material before relying on or sharing it.",
    professionalTitle: "Professional and Support Resources",
    professional: "Where One2OneLove provides access to therapists, counselors, coaches, professionals, directories, articles, or support resources, those resources are intended to help users locate information and possible sources of support. One2OneLove does not replace licensed medical, mental-health, legal, financial, or emergency services and does not guarantee the qualifications, availability, outcome, or suitability of any third-party professional unless expressly stated otherwise.",
    emergencyTitle: "Important Safety Notice",
    emergency: "If you are in immediate danger, experiencing abuse, facing a medical or mental-health emergency, or believe someone may be at risk of harm, contact local emergency services or an appropriate qualified crisis resource. One2OneLove is not an emergency-response service.",
    feedbackTitle: "Help Us Improve",
    feedback: "One2OneLove will continue to evolve based on user experience, responsible product development, and feedback from the community. If you find something that is unclear, broken, unsafe, or could be improved, please contact us.",
    contact: "Contact Us",
    signup: "Create an Account"
  },
  es: {
    title: "Acerca de One2OneLove", subtitle: "Ama. Crece. Evoluciona. Juntos.", back: "Volver", hero: "Comenzamos Donde Terminan los Sitios de Citas.",
    intro: "One2OneLove es una plataforma inclusiva de relaciones creada para apoyar a personas que buscan, construyen, comprenden y nutren relaciones y vínculos saludables. Está diseñada para distintas etapas, incluidas citas, relaciones comprometidas, compromiso, matrimonio y crecimiento personal en las relaciones.",
    ownershipTitle: "Propiedad y Operación", ownership: "La Plataforma One2One Love es propiedad de ERANT Property Services LLC (EPS LLC), su empresa matriz, y es operada por ella.",
    missionTitle: "Nuestra Misión", mission: "Nuestra misión es reunir en un solo lugar herramientas prácticas, conversación reflexiva, comunidad y recursos de apoyo para ayudar a las personas a comunicarse con mayor intención, fortalecer la conexión, celebrar momentos significativos y tomar decisiones relacionales más saludables.",
    notDatingTitle: "Qué Es One2OneLove — y Qué No Es", notDating: "One2OneLove no es un servicio de citas ni de emparejamiento. No unimos personas para citas. La plataforma comienza donde muchos servicios de citas terminan: ayudando a las personas a pensar, comunicarse, conectar, crecer y mantener relaciones.",
    valuesTitle: "Lo Que Guía la Plataforma",
    values: [
      { title: "Inclusiva por Diseño", body: "Son bienvenidas personas de toda raza, credo, color, cultura, género, orientación sexual y origen. One2OneLove busca respetar diferentes experiencias e identidades relacionales." },
      { title: "Herramientas Prácticas", body: "Funciones como Notas de Amor, cuestionarios, práctica de comunicación, metas, hitos, recuerdos e ideas para citas buscan apoyar reflexión, comunicación y conexión." },
      { title: "Comunidad con Límites", body: "Las funciones de comunidad y chat son para conversación respetuosa. El acoso, amenazas, discriminación, explotación, suplantación, spam y abuso no forman parte de la comunidad que estamos construyendo." },
      { title: "Privacidad y Seguridad", body: "La información sobre relaciones puede ser muy personal. Los usuarios deben compartir con cuidado y One2OneLove se compromete a manejar la información personal conforme a su Política de Privacidad y la ley aplicable." }
    ],
    aiTitle: "Funciones Asistidas por IA", ai: "Algunas funciones pueden usar inteligencia artificial para generar ideas, indicaciones, notas, información educativa o reflexiones. La IA puede ser incompleta o equivocada. Revisa todo contenido generado antes de usarlo o compartirlo.",
    professionalTitle: "Recursos Profesionales y de Apoyo", professional: "Cuando One2OneLove ofrece acceso a terapeutas, consejeros, coaches, profesionales, directorios, artículos o recursos de apoyo, estos sirven para ayudar a localizar información y posibles fuentes de apoyo. One2OneLove no sustituye servicios médicos, de salud mental, legales, financieros o de emergencia con licencia.",
    emergencyTitle: "Aviso Importante de Seguridad", emergency: "Si estás en peligro inmediato, sufres abuso, enfrentas una emergencia médica o de salud mental, o crees que alguien corre riesgo de daño, contacta los servicios de emergencia locales o un recurso de crisis cualificado. One2OneLove no es un servicio de emergencia.",
    feedbackTitle: "Ayúdanos a Mejorar", feedback: "One2OneLove seguirá evolucionando a partir de la experiencia de los usuarios, el desarrollo responsable y los comentarios de la comunidad. Si encuentras algo confuso, roto, inseguro o mejorable, contáctanos.",
    contact: "Contáctanos", signup: "Crear una Cuenta"
  },
  fr: {
    title: "À Propos de One2OneLove", subtitle: "Aimez. Grandissez. Évoluez. Ensemble.", back: "Retour", hero: "Nous Commençons Là Où les Sites de Rencontres S'Arrêtent.",
    intro: "One2OneLove est une plateforme relationnelle inclusive conçue pour soutenir les personnes qui recherchent, construisent, comprennent et entretiennent des relations saines. Elle s'adresse à de nombreuses étapes : rencontres, relation engagée, fiançailles, mariage et développement personnel relationnel.",
    ownershipTitle: "Propriété et Exploitation", ownership: "La Plateforme One2One Love est détenue et exploitée par ERANT Property Services LLC (EPS LLC), sa société mère.",
    missionTitle: "Notre Mission", mission: "Notre mission est de réunir des outils pratiques, des conversations réfléchies, une communauté et des ressources de soutien afin d'aider les personnes à mieux communiquer, renforcer leurs liens, célébrer les moments importants et faire des choix relationnels plus sains.",
    notDatingTitle: "Ce Qu'est One2OneLove — et Ce Qu'il N'est Pas", notDating: "One2OneLove n'est pas un service de rencontres ou de mise en relation. Nous ne mettons pas les utilisateurs en relation pour des rendez-vous. La plateforme commence là où de nombreux sites de rencontres s'arrêtent : communication, compréhension, connexion, croissance et entretien des relations.",
    valuesTitle: "Ce Qui Guide la Plateforme",
    values: [
      { title: "Inclusive par Conception", body: "Les personnes de toute origine, croyance, couleur, culture, genre et orientation sexuelle sont les bienvenues. One2OneLove vise à respecter la diversité des expériences et identités relationnelles." },
      { title: "Outils Relationnels Pratiques", body: "Love Notes, quiz, exercices de communication, objectifs, étapes, souvenirs et idées de rendez-vous sont conçus pour soutenir réflexion, communication et connexion." },
      { title: "Communauté avec des Limites", body: "La communauté et le chat sont destinés à des échanges respectueux. Harcèlement, menaces, discrimination, exploitation, usurpation d'identité, spam et abus ne sont pas acceptables." },
      { title: "Confidentialité et Sécurité", body: "Les informations relationnelles peuvent être personnelles. Les utilisateurs doivent partager avec prudence et One2OneLove s'engage à traiter les données conformément à sa Politique de confidentialité et au droit applicable." }
    ],
    aiTitle: "Fonctions Assistées par IA", ai: "Certaines fonctions peuvent utiliser l'intelligence artificielle pour générer des idées, des messages, du contenu éducatif ou des pistes de réflexion. Les résultats peuvent être incomplets ou inexacts. Vérifiez-les avant de les utiliser ou de les partager.",
    professionalTitle: "Ressources Professionnelles et de Soutien", professional: "Lorsque One2OneLove donne accès à des thérapeutes, conseillers, coachs, professionnels, annuaires, articles ou ressources, ces éléments servent à aider les utilisateurs à trouver des informations et des sources possibles de soutien. One2OneLove ne remplace pas les services médicaux, de santé mentale, juridiques, financiers ou d'urgence agréés.",
    emergencyTitle: "Avis Important de Sécurité", emergency: "En cas de danger immédiat, de violence, d'urgence médicale ou de santé mentale, ou si une personne risque d'être blessée, contactez les services d'urgence locaux ou une ressource de crise qualifiée. One2OneLove n'est pas un service d'urgence.",
    feedbackTitle: "Aidez-Nous à Nous Améliorer", feedback: "One2OneLove continuera d'évoluer grâce à l'expérience des utilisateurs, au développement responsable et aux retours de la communauté. Si quelque chose est confus, défectueux, dangereux ou améliorable, contactez-nous.",
    contact: "Nous Contacter", signup: "Créer un Compte"
  },
  it: {
    title: "Chi Siamo — One2OneLove", subtitle: "Ama. Cresci. Evolvi. Insieme.", back: "Indietro", hero: "Iniziamo Dove i Siti di Incontri Si Fermano.",
    intro: "One2OneLove è una piattaforma inclusiva per le relazioni, creata per sostenere chi cerca, costruisce, comprende e coltiva relazioni sane. È pensata per diverse fasi: frequentazione, relazione stabile, fidanzamento, matrimonio e crescita personale nelle relazioni.",
    ownershipTitle: "Proprietà e Gestione", ownership: "La Piattaforma One2One Love è di proprietà ed è gestita da ERANT Property Services LLC (EPS LLC), la sua società madre.",
    missionTitle: "La Nostra Missione", mission: "La nostra missione è riunire strumenti pratici, conversazioni consapevoli, comunità e risorse di supporto per aiutare le persone a comunicare con maggiore intenzione, rafforzare la connessione, celebrare momenti significativi e fare scelte relazionali più sane.",
    notDatingTitle: "Cos'è One2OneLove — e Cosa Non È", notDating: "One2OneLove non è un servizio di incontri o matchmaking. Non abbiniamo persone per appuntamenti. La piattaforma inizia dove molti servizi di incontri si fermano: comunicazione, comprensione, connessione, crescita e cura della relazione.",
    valuesTitle: "Cosa Guida la Piattaforma",
    values: [
      { title: "Inclusiva per Progetto", body: "Sono benvenute persone di ogni razza, credo, colore, cultura, genere, orientamento sessuale e provenienza. One2OneLove mira a rispettare diverse esperienze e identità relazionali." },
      { title: "Strumenti Pratici", body: "Love Notes, quiz, esercizi di comunicazione, obiettivi, traguardi, ricordi e idee per appuntamenti sono pensati per sostenere riflessione, comunicazione e connessione." },
      { title: "Comunità con Limiti", body: "Community e chat sono destinate a conversazioni rispettose. Molestie, minacce, discriminazione, sfruttamento, impersonificazione, spam e abusi non fanno parte della comunità che stiamo costruendo." },
      { title: "Privacy e Sicurezza", body: "Le informazioni sulle relazioni possono essere personali. Gli utenti devono condividere con attenzione e One2OneLove si impegna a gestire i dati personali secondo l'Informativa sulla Privacy e la legge applicabile." }
    ],
    aiTitle: "Funzioni Assistite dall'AI", ai: "Alcune funzioni possono usare l'intelligenza artificiale per generare idee, spunti, note, contenuti educativi o riflessioni. L'output può essere incompleto o errato. Verificalo prima di usarlo o condividerlo.",
    professionalTitle: "Risorse Professionali e di Supporto", professional: "Quando One2OneLove offre accesso a terapeuti, counselor, coach, professionisti, directory, articoli o risorse di supporto, questi strumenti servono ad aiutare gli utenti a trovare informazioni e possibili fonti di sostegno. One2OneLove non sostituisce servizi medici, di salute mentale, legali, finanziari o di emergenza autorizzati.",
    emergencyTitle: "Importante Avviso di Sicurezza", emergency: "In caso di pericolo immediato, abuso, emergenza medica o di salute mentale, o rischio di danno, contatta i servizi di emergenza locali o una risorsa di crisi qualificata. One2OneLove non è un servizio di emergenza.",
    feedbackTitle: "Aiutaci a Migliorare", feedback: "One2OneLove continuerà a evolvere attraverso l'esperienza degli utenti, lo sviluppo responsabile e i feedback della comunità. Se qualcosa è poco chiaro, non funziona, non è sicuro o può essere migliorato, contattaci.",
    contact: "Contattaci", signup: "Crea un Account"
  },
  de: {
    title: "Über One2OneLove", subtitle: "Lieben. Wachsen. Entwickeln. Gemeinsam.", back: "Zurück", hero: "Wir Beginnen, Wo Dating-Seiten Aufhören.",
    intro: "One2OneLove ist eine inklusive Beziehungsplattform für Menschen, die gesunde Liebe und Beziehungen suchen, aufbauen, verstehen und pflegen möchten. Sie richtet sich an viele Phasen: Dating, feste Beziehungen, Verlobung, Ehe und persönliche Beziehungsentwicklung.",
    ownershipTitle: "Eigentum und Betrieb", ownership: "Die One2One Love Plattform befindet sich im Eigentum von ERANT Property Services LLC (EPS LLC), ihrer Muttergesellschaft, und wird von ihr betrieben.",
    missionTitle: "Unsere Mission", mission: "Unsere Mission ist es, praktische Beziehungstools, reflektierte Gespräche, Community und unterstützende Ressourcen an einem Ort zusammenzubringen, damit Menschen bewusster kommunizieren, Verbindung stärken, wichtige Momente feiern und gesündere Beziehungsentscheidungen treffen können.",
    notDatingTitle: "Was One2OneLove Ist — und Was Nicht", notDating: "One2OneLove ist kein Dating- oder Matchmaking-Dienst. Wir vermitteln keine Dates. Die Plattform beginnt dort, wo viele Dating-Dienste aufhören: bei Kommunikation, Verständnis, Verbindung, Wachstum und Pflege einer Beziehung.",
    valuesTitle: "Was die Plattform Leitet",
    values: [
      { title: "Inklusiv Entwickelt", body: "Menschen jeder Herkunft, Religion, Hautfarbe, Kultur, Geschlechtsidentität und sexuellen Orientierung sind willkommen. One2OneLove soll unterschiedliche Beziehungserfahrungen und Identitäten respektieren." },
      { title: "Praktische Beziehungstools", body: "Love Notes, Quiz, Kommunikationsübungen, Ziele, Meilensteine, Erinnerungen und Date-Ideen sollen Reflexion, Kommunikation und Verbindung unterstützen." },
      { title: "Community mit Grenzen", body: "Community- und Chatfunktionen sind für respektvolle Gespräche gedacht. Belästigung, Drohungen, Diskriminierung, Ausbeutung, Identitätsmissbrauch, Spam und missbräuchliches Verhalten gehören nicht dazu." },
      { title: "Datenschutz und Sicherheit", body: "Beziehungsinformationen können sehr persönlich sein. Nutzer sollten bewusst teilen; One2OneLove verpflichtet sich zum Umgang mit personenbezogenen Daten gemäß Datenschutzrichtlinie und geltendem Recht." }
    ],
    aiTitle: "KI-Unterstützte Funktionen", ai: "Einige Funktionen können künstliche Intelligenz nutzen, um Ideen, Hinweise, Nachrichten, Bildungsinhalte oder Reflexionen zu erzeugen. Ergebnisse können unvollständig oder falsch sein. Prüfen Sie sie vor Nutzung oder Weitergabe.",
    professionalTitle: "Professionelle und Unterstützende Ressourcen", professional: "Wenn One2OneLove Zugang zu Therapeuten, Beratern, Coaches, Fachleuten, Verzeichnissen, Artikeln oder Hilfsangeboten bietet, dienen diese dazu, Informationen und mögliche Unterstützung zu finden. One2OneLove ersetzt keine zugelassenen medizinischen, psychologischen, rechtlichen, finanziellen oder Notfalldienste.",
    emergencyTitle: "Wichtiger Sicherheitshinweis", emergency: "Bei unmittelbarer Gefahr, Missbrauch, medizinischem oder psychischem Notfall oder drohendem Schaden wenden Sie sich an örtliche Notdienste oder eine qualifizierte Krisenstelle. One2OneLove ist kein Notfalldienst.",
    feedbackTitle: "Helfen Sie Uns, Besser zu Werden", feedback: "One2OneLove wird sich durch Nutzererfahrung, verantwortungsvolle Produktentwicklung und Community-Feedback weiterentwickeln. Wenn etwas unklar, defekt, unsicher oder verbesserungswürdig ist, kontaktieren Sie uns.",
    contact: "Kontaktieren Sie Uns", signup: "Konto Erstellen"
  }
};

export default function AboutUs() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const icons = [Globe, Target, MessageCircle, Shield];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <div className="text-center max-w-5xl mx-auto py-8">
          <Heart className="w-16 h-16 mx-auto text-pink-500 fill-pink-500 mb-5" />
          <h1 className="text-5xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-xl font-bold text-purple-600 mb-6">{t.subtitle}</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-6">{t.hero}</h2>
          <p className="text-xl text-gray-600 leading-relaxed">{t.intro}</p>
          <div className="mt-6 rounded-2xl border border-purple-200 bg-white/80 p-5 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.ownershipTitle}</h3>
            <p className="text-gray-700 leading-relaxed">{t.ownership}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-10">
          <section className="bg-white rounded-3xl p-8 shadow-xl">
            <Target className="w-10 h-10 text-purple-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.missionTitle}</h2>
            <p className="text-gray-700 leading-relaxed text-lg">{t.mission}</p>
          </section>
          <section className="bg-white rounded-3xl p-8 shadow-xl">
            <Users className="w-10 h-10 text-blue-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.notDatingTitle}</h2>
            <p className="text-gray-700 leading-relaxed text-lg">{t.notDating}</p>
          </section>
        </div>

        <section className="max-w-6xl mx-auto mt-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">{t.valuesTitle}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {t.values.map((value, index) => {
              const Icon = icons[index];
              return (
                <div key={value.title} className="bg-white rounded-2xl p-7 shadow-lg">
                  <Icon className="w-9 h-9 text-pink-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{value.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mt-12">
          <section className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-8 shadow-xl">
            <Sparkles className="w-10 h-10 mb-4" />
            <h2 className="text-3xl font-bold mb-4">{t.aiTitle}</h2>
            <p className="leading-relaxed text-lg text-white/95">{t.ai}</p>
          </section>
          <section className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-3xl p-8 shadow-xl">
            <Users className="w-10 h-10 mb-4" />
            <h2 className="text-3xl font-bold mb-4">{t.professionalTitle}</h2>
            <p className="leading-relaxed text-lg text-white/95">{t.professional}</p>
          </section>
        </div>

        <section className="max-w-6xl mx-auto mt-12 bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-sm">
          <Shield className="w-10 h-10 text-amber-700 mb-4" />
          <h2 className="text-3xl font-bold text-amber-950 mb-4">{t.emergencyTitle}</h2>
          <p className="text-amber-950 leading-relaxed text-lg">{t.emergency}</p>
        </section>

        <section className="max-w-6xl mx-auto mt-12 bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.feedbackTitle}</h2>
          <p className="text-gray-700 leading-relaxed text-lg max-w-4xl mx-auto mb-8">{t.feedback}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl("ContactUs")} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">{t.contact}</Link>
            <Link to={createPageUrl("SignUp")} className="px-6 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold">{t.signup}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
