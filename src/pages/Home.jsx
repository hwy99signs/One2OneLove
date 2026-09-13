import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "./Layout";
const LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/19ffc2fa2_ONE2ONELOVELOGO.png";
const HERO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/bd7450758_-appbackgroundphoto.png";

const COPY = {
  en: {
    home: "Home", action: "Action", invite: "Invite", signUp: "Sign Up", language: "US English",
    announcementLabel: "O2OL Announcement Scroll", announcement: "Be informed as soon as One2OneLove launches.",
    slogan: "We Start Where Dating Sites Stop.",
    mission: "One2OneLove is for everyone pursuing, building, and nurturing love—regardless of race, creed, color, gender, or sexual orientation.",
    support: "Whether you’re dating, committed, engaged, married, or simply trying to better understand love and relationships, One2OneLove brings together practical tools, community, conversation, and inspiration to help you connect, grow, and build healthier relationships.",
    langs: "Available in 5 Languages: English • Spanish • French • Italian • German",
    allInclusive: "ALL-INCLUSIVE RELATIONSHIP PLATFORM",
    inclusiveBody: "Every race, creed, color, gender, sexual orientation, culture, and background is welcome here. One2OneLove is built to support people pursuing, building, and nurturing healthy love and relationships.",
    forEveryone: "For Everyone", forEveryoneBody: "LGBTQ+, interfaith, interracial, and relationships across cultures and backgrounds are welcomed and respected.",
    practical: "Practical Relationship Tools", practicalBody: "Use launch-ready tools designed to support communication, connection, reflection, memories, goals, and meaningful time together.",
    respectful: "Respectful Community", respectfulBody: "A welcoming space where people can discuss love and relationships without discrimination or judgment.",
    notDating: "THIS IS NOT A DATING SITE", notDatingBody: "One2OneLove does not match users for dates. It supports people as they pursue, build, understand, and nurture love and relationships.",
    tools: "Tools for Every Stage of Love", toolsBody: "Whether you’re pursuing love, dating, committed, engaged, married, or focused on strengthening a relationship, One2OneLove brings practical relationship tools and community together in one place.",
    toolLabels: {
      loveNotes: "Love Notes", loveLanguage: "Love Language", dateIdeas: "Date Ideas", memoryLane: "Memory Lane",
      relationshipSupport: "Relationship Support", relationshipGoals: "Relationship Goals", lgbtqSupport: "LGBTQ Support", relationshipGames: "Relationship Games",
      milestones: "Milestones", communicationPractice: "Communication Practice", chatRoom: "Chat Room", findTherapist: "Find a Professional"
    },
    loveNotes: "Love Notes", loveNotesBody: "Create and share personalized love notes that help you express appreciation, affection, encouragement, and meaningful thoughts.",
    loveGrow: "Love. Grow. Evolve. Together.", footerBody: "One2OneLove is designed to support healthier connection, thoughtful communication, self-reflection, shared memories, and real conversations about relationships—while welcoming people from every background.",
    supportCol: "Support", company: "Company", help: "Help Center", contact: "Contact Us", privacy: "Privacy Policy", terms: "Terms of Service", about: "About Us", suggestions: "Suggestions",
    copyright: "© 2026 One2OneLove. Made with ❤️ for people pursuing and building healthier love and relationships."
  },
  es: {
    home: "Inicio", action: "Acción", invite: "Invitar", signUp: "Registrarse", language: "ES Español",
    announcementLabel: "Anuncios O2OL", announcement: "Recibe aviso tan pronto como One2OneLove se lance.", slogan: "Comenzamos Donde Terminan los Sitios de Citas.",
    mission: "One2OneLove es para todas las personas que buscan, construyen y nutren el amor, sin importar raza, credo, color, género u orientación sexual.",
    support: "Ya sea que estés saliendo, comprometido, casado o simplemente tratando de comprender mejor el amor y las relaciones, One2OneLove reúne herramientas prácticas, comunidad, conversación e inspiración.",
    langs: "Disponible en 5 idiomas: Inglés • Español • Francés • Italiano • Alemán", allInclusive: "PLATAFORMA DE RELACIONES PARA TODOS",
    inclusiveBody: "Todas las razas, credos, colores, géneros, orientaciones sexuales, culturas y orígenes son bienvenidos aquí.", forEveryone: "Para Todos", forEveryoneBody: "LGBTQ+, interreligiosas, interraciales y relaciones entre culturas y orígenes son bienvenidas y respetadas.",
    practical: "Herramientas Prácticas", practicalBody: "Herramientas para comunicación, conexión, reflexión, recuerdos, metas y tiempo significativo juntos.", respectful: "Comunidad Respetuosa", respectfulBody: "Un espacio acogedor para hablar de amor y relaciones sin discriminación ni juicio.",
    notDating: "ESTO NO ES UN SITIO DE CITAS", notDatingBody: "One2OneLove no empareja usuarios para citas. Apoya a las personas mientras buscan, construyen, comprenden y nutren el amor.",
    tools: "Herramientas para Cada Etapa del Amor", toolsBody: "One2OneLove reúne herramientas prácticas y comunidad para cada etapa de una relación.",
    toolLabels: {
      loveNotes: "Notas de Amor", loveLanguage: "Lenguaje del Amor", dateIdeas: "Ideas para Citas", memoryLane: "Recuerdos",
      relationshipSupport: "Apoyo para Relaciones", relationshipGoals: "Metas de Relación", lgbtqSupport: "Apoyo LGBTQ", relationshipGames: "Juegos de Relación",
      milestones: "Hitos", communicationPractice: "Práctica de Comunicación", chatRoom: "Sala de Chat", findTherapist: "Encontrar un Profesional"
    },
    loveNotes: "Notas de Amor", loveNotesBody: "Crea y comparte notas personalizadas para expresar aprecio, afecto, ánimo y pensamientos significativos.",
    loveGrow: "Ama. Crece. Evoluciona. Juntos.", footerBody: "One2OneLove apoya conexiones más saludables, comunicación reflexiva, autorreflexión, recuerdos compartidos y conversaciones reales.",
    supportCol: "Soporte", company: "Compañía", help: "Centro de ayuda", contact: "Contáctanos", privacy: "Privacidad", terms: "Términos de servicio", about: "Sobre nosotros", suggestions: "Sugerencias", copyright: "© 2026 One2OneLove. Hecho con ❤️ para relaciones más saludables."
  },
  fr: {
    home: "Accueil", action: "Action", invite: "Inviter", signUp: "S’inscrire", language: "FR Français", announcementLabel: "Annonces O2OL", announcement: "Soyez informé dès le lancement de One2OneLove.", slogan: "Nous Commençons Là Où les Sites de Rencontres S’Arrêtent.",
    mission: "One2OneLove s’adresse à toute personne qui recherche, construit et nourrit l’amour, sans distinction de race, croyance, couleur, genre ou orientation sexuelle.", support: "Que vous soyez en couple, fiancé, marié ou que vous cherchiez simplement à mieux comprendre l’amour et les relations, One2OneLove réunit outils pratiques, communauté, conversation et inspiration.",
    langs: "Disponible en 5 langues : Anglais • Espagnol • Français • Italien • Allemand", allInclusive: "PLATEFORME RELATIONNELLE INCLUSIVE", inclusiveBody: "Toutes les races, croyances, couleurs, genres, orientations sexuelles, cultures et origines sont les bienvenus.", forEveryone: "Pour Tous", forEveryoneBody: "Les relations LGBTQ+, interreligieuses, interraciales et interculturelles sont accueillies et respectées.", practical: "Outils Relationnels Pratiques", practicalBody: "Des outils pour la communication, la connexion, la réflexion, les souvenirs, les objectifs et le temps partagé.", respectful: "Communauté Respectueuse", respectfulBody: "Un espace accueillant pour parler d’amour et de relations sans discrimination ni jugement.", notDating: "CE N’EST PAS UN SITE DE RENCONTRES", notDatingBody: "One2OneLove ne met pas les utilisateurs en relation pour des rendez-vous. Il soutient les personnes dans leur parcours relationnel.", tools: "Des Outils pour Chaque Étape de l’Amour", toolsBody: "One2OneLove réunit outils pratiques et communauté pour chaque étape d’une relation.",
    toolLabels: {
      loveNotes: "Notes d’Amour", loveLanguage: "Langage de l’Amour", dateIdeas: "Idées de Rendez-vous", memoryLane: "Souvenirs",
      relationshipSupport: "Soutien Relationnel", relationshipGoals: "Objectifs Relationnels", lgbtqSupport: "Soutien LGBTQ", relationshipGames: "Jeux Relationnels",
      milestones: "Étapes Importantes", communicationPractice: "Pratique de la Communication", chatRoom: "Salon de Discussion", findTherapist: "Trouver un Professionnel"
    },
    loveNotes: "Notes d’Amour", loveNotesBody: "Créez et partagez des notes personnalisées pour exprimer appréciation, affection, encouragement et pensées significatives.", loveGrow: "Aimez. Grandissez. Évoluez. Ensemble.", footerBody: "One2OneLove favorise une connexion plus saine, une communication réfléchie, l’introspection, les souvenirs partagés et de vraies conversations.", supportCol: "Aide", company: "Entreprise", help: "Centre d’aide", contact: "Contact", privacy: "Confidentialité", terms: "Conditions d’utilisation", about: "À propos", suggestions: "Suggestions", copyright: "© 2026 One2OneLove. Fait avec ❤️ pour des relations plus saines."
  },
  it: {
    home: "Home", action: "Azione", invite: "Invita", signUp: "Iscriviti", language: "IT Italiano", announcementLabel: "Annunci O2OL", announcement: "Ricevi una notifica appena One2OneLove sarà lanciato.", slogan: "Iniziamo Dove i Siti di Incontri Si Fermano.", mission: "One2OneLove è per chiunque cerchi, costruisca e coltivi l’amore, indipendentemente da razza, credo, colore, genere o orientamento sessuale.", support: "Che tu stia frequentando qualcuno, sia impegnato, fidanzato, sposato o voglia semplicemente capire meglio l’amore e le relazioni, One2OneLove riunisce strumenti pratici, comunità, conversazione e ispirazione.", langs: "Disponibile in 5 lingue: Inglese • Spagnolo • Francese • Italiano • Tedesco", allInclusive: "PIATTAFORMA RELAZIONALE INCLUSIVA", inclusiveBody: "Ogni razza, credo, colore, genere, orientamento sessuale, cultura e provenienza è benvenuto qui.", forEveryone: "Per Tutti", forEveryoneBody: "Le relazioni LGBTQ+, interreligiose, interrazziali e interculturali sono accolte e rispettate.", practical: "Strumenti Relazionali Pratici", practicalBody: "Strumenti per comunicazione, connessione, riflessione, ricordi, obiettivi e tempo significativo insieme.", respectful: "Comunità Rispettosa", respectfulBody: "Uno spazio accogliente per parlare di amore e relazioni senza discriminazione o giudizio.", notDating: "QUESTO NON È UN SITO DI INCONTRI", notDatingBody: "One2OneLove non abbina utenti per appuntamenti. Supporta le persone mentre cercano, costruiscono, comprendono e coltivano l’amore.", tools: "Strumenti per Ogni Fase dell’Amore", toolsBody: "One2OneLove riunisce strumenti pratici e comunità per ogni fase di una relazione.",
    toolLabels: {
      loveNotes: "Note d’Amore", loveLanguage: "Linguaggio dell’Amore", dateIdeas: "Idee per Appuntamenti", memoryLane: "Ricordi",
      relationshipSupport: "Supporto Relazionale", relationshipGoals: "Obiettivi di Coppia", lgbtqSupport: "Supporto LGBTQ", relationshipGames: "Giochi di Coppia",
      milestones: "Traguardi", communicationPractice: "Pratica di Comunicazione", chatRoom: "Chat", findTherapist: "Trova un Professionista"
    },
    loveNotes: "Note d’Amore", loveNotesBody: "Crea e condividi note personalizzate per esprimere apprezzamento, affetto, incoraggiamento e pensieri significativi.", loveGrow: "Ama. Cresci. Evolvi. Insieme.", footerBody: "One2OneLove sostiene connessioni più sane, comunicazione consapevole, autoriflessione, ricordi condivisi e conversazioni reali.", supportCol: "Supporto", company: "Azienda", help: "Centro assistenza", contact: "Contatti", privacy: "Privacy", terms: "Termini di servizio", about: "Chi siamo", suggestions: "Suggerimenti", copyright: "© 2026 One2OneLove. Creato con ❤️ per relazioni più sane."
  },
  de: {
    home: "Startseite", action: "Aktion", invite: "Einladen", signUp: "Registrieren", language: "DE Deutsch", announcementLabel: "O2OL Ankündigungen", announcement: "Erfahren Sie sofort, wenn One2OneLove startet.", slogan: "Wir Beginnen, Wo Dating-Seiten Aufhören.", mission: "One2OneLove ist für alle, die Liebe suchen, aufbauen und pflegen – unabhängig von Herkunft, Glauben, Hautfarbe, Geschlecht oder sexueller Orientierung.", support: "Ob Sie daten, in einer festen Beziehung, verlobt oder verheiratet sind oder Liebe und Beziehungen besser verstehen möchten: One2OneLove verbindet praktische Werkzeuge, Community, Gespräche und Inspiration.", langs: "Verfügbar in 5 Sprachen: Englisch • Spanisch • Französisch • Italienisch • Deutsch", allInclusive: "INKLUSIVE BEZIEHUNGSPLATTFORM", inclusiveBody: "Jede Herkunft, jeder Glaube, jede Hautfarbe, jedes Geschlecht, jede sexuelle Orientierung, Kultur und Lebensgeschichte ist willkommen.", forEveryone: "Für Alle", forEveryoneBody: "LGBTQ+, interreligiöse, interkulturelle und gemischte Beziehungen sind willkommen und respektiert.", practical: "Praktische Beziehungstools", practicalBody: "Werkzeuge für Kommunikation, Verbindung, Reflexion, Erinnerungen, Ziele und gemeinsame Zeit.", respectful: "Respektvolle Community", respectfulBody: "Ein einladender Raum für Gespräche über Liebe und Beziehungen ohne Diskriminierung oder Verurteilung.", notDating: "DIES IST KEINE DATING-SEITE", notDatingBody: "One2OneLove vermittelt keine Dates. Es unterstützt Menschen dabei, Liebe und Beziehungen zu suchen, aufzubauen, zu verstehen und zu pflegen.", tools: "Tools für Jede Phase der Liebe", toolsBody: "One2OneLove verbindet praktische Beziehungstools und Community an einem Ort.",
    toolLabels: {
      loveNotes: "Liebesbotschaften", loveLanguage: "Liebessprache", dateIdeas: "Date-Ideen", memoryLane: "Erinnerungen",
      relationshipSupport: "Beziehungsunterstützung", relationshipGoals: "Beziehungsziele", lgbtqSupport: "LGBTQ-Unterstützung", relationshipGames: "Beziehungsspiele",
      milestones: "Meilensteine", communicationPractice: "Kommunikationstraining", chatRoom: "Chatraum", findTherapist: "Fachkraft finden"
    },
    loveNotes: "Liebesbotschaften", loveNotesBody: "Erstellen und teilen Sie persönliche Liebesbotschaften für Wertschätzung, Zuneigung, Ermutigung und bedeutungsvolle Gedanken.", loveGrow: "Lieben. Wachsen. Entwickeln. Gemeinsam.", footerBody: "One2OneLove unterstützt gesündere Verbindung, achtsame Kommunikation, Selbstreflexion, gemeinsame Erinnerungen und echte Gespräche.", supportCol: "Support", company: "Unternehmen", help: "Hilfe-Center", contact: "Kontakt", privacy: "Datenschutz", terms: "Nutzungsbedingungen", about: "Über uns", suggestions: "Vorschläge", copyright: "© 2026 One2OneLove. Mit ❤️ für gesündere Beziehungen."
  }
};

const TOOLS = [
  ["💗", "loveNotes", "LoveNotes", "from-rose-500 to-pink-600"],
  ["💬", "loveLanguage", "LoveLanguageQuiz", "from-violet-600 to-purple-600"],
  ["🗓️", "dateIdeas", "DateIdeas", "from-cyan-500 to-blue-600"],
  ["📷", "memoryLane", "MemoryLane", "from-indigo-600 to-violet-700"],
  ["🤝", "relationshipSupport", "CoupleSupport", "from-sky-600 to-blue-700"],
  ["🎯", "relationshipGoals", "RelationshipGoals", "from-amber-500 to-yellow-600"],
  ["🌈", "lgbtqSupport", "LGBTQSupport", "from-fuchsia-600 to-purple-700"],
  ["🎮", "relationshipGames", "CooperativeGames", "from-orange-600 to-red-600"],
  ["💗", "milestones", "RelationshipMilestones", "from-pink-600 to-fuchsia-700"],
  ["🗣", "communicationPractice", "CommunicationPractice", "from-teal-600 to-emerald-700"],
  ["💬", "chatRoom", "Chat", "from-blue-600 to-indigo-700"],
  ["🩺", "findTherapist", "CounselingSupport", "from-emerald-600 to-teal-700"]
];

export default function Home() {
  const navigate = useNavigate();
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [selectedTool, setSelectedTool] = useState(0);

  const go = (page) => navigate(createPageUrl(page));

  return (
    <div className="min-h-screen bg-white text-slate-950 overflow-x-hidden">
      <section className="relative min-h-[900px] flex items-center justify-center bg-cover bg-center" style={{backgroundImage:`url(${HERO})`}}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white pt-8 pb-8">
          <img src={LOGO} alt="One2OneLove" className="h-44 md:h-52 w-auto mx-auto mb-1 drop-shadow-xl" />
          <h1 className="text-6xl md:text-8xl font-black tracking-tight drop-shadow-xl">One2OneLove</h1>
          <div className="text-3xl md:text-4xl font-black italic text-yellow-300 mt-2 drop-shadow">{t.slogan}</div>
          <p className="mt-8 text-xl md:text-2xl font-extrabold leading-snug drop-shadow max-w-5xl mx-auto">{t.mission}</p>
          <p className="mt-5 text-lg md:text-xl leading-relaxed drop-shadow max-w-5xl mx-auto">{t.support}</p>
          <p className="mt-7 text-xl md:text-2xl font-black text-yellow-300 drop-shadow">{t.langs}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-7">
            <button onClick={() => go("LoveLanguageQuiz")} className="rounded-2xl bg-pink-500 hover:bg-pink-600 px-8 py-5 font-extrabold text-xl shadow-xl">♡ Love Language Quiz</button>
            <button onClick={() => go("LoveNotes")} className="rounded-2xl bg-white hover:bg-slate-50 text-pink-600 px-8 py-5 font-extrabold text-xl shadow-xl">♡ Send A Love Note</button>
            <button onClick={() => go("CommunicationPractice")} className="rounded-2xl bg-purple-600 hover:bg-purple-700 px-8 py-5 font-extrabold text-xl shadow-xl">🗣 Communication Practice</button>
            <button onClick={() => go("DateIdeas")} className="rounded-2xl bg-teal-600 hover:bg-teal-700 px-8 py-5 font-extrabold text-xl shadow-xl">▣ Date Ideas</button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-16 text-slate-900">
            <Stat value="0" label="Love Notes Created" white />
            <Stat value="0" label="Happy Couples" white accent="purple" />
            <Stat value="0" label="Most Notes (Week)" tone="orange" trophy />
            <Stat value="0" label="Most Notes (Month)" tone="blue" trophy />
            <Stat value="0" label="Most Notes (Year)" tone="green" trophy />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-rose-600 text-white px-5 py-7">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-black">🌍 {t.allInclusive} 🌍</h2>
          <p className="text-center text-lg md:text-xl max-w-6xl mx-auto mt-3">{t.inclusiveBody}</p>
          <div className="grid md:grid-cols-3 gap-5 mt-7">
            <Info icon="🌐" title={t.forEveryone} body={t.forEveryoneBody} />
            <Info icon="♥" title={t.practical} body={t.practicalBody} />
            <Info icon="♡" title={t.respectful} body={t.respectfulBody} />
          </div>
          <div className="mt-4 rounded-2xl border-2 border-yellow-400 px-5 py-3 text-center bg-white/5">
            <div className="text-xl font-black">⚠️ {t.notDating} ⚠️</div>
            <div className="text-sm md:text-base mt-1">{t.notDatingBody}</div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-5xl md:text-6xl font-black tracking-tight">{t.tools}</h2>
          <p className="text-center text-lg md:text-xl text-slate-600 max-w-5xl mx-auto mt-3">{t.toolsBody}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {TOOLS.map(([icon,labelKey,page,gradient], index) => (
              <button key={page} onClick={() => {setSelectedTool(index); go(page);}} className={`min-h-[86px] rounded-2xl bg-gradient-to-r ${gradient} text-white text-xl font-extrabold px-5 shadow-lg hover:scale-[1.02] transition-transform ${index===selectedTool ? 'ring-4 ring-rose-400 ring-offset-2' : ''}`}>
                {icon} {t.toolLabels?.[labelKey] || COPY.en.toolLabels[labelKey]}
              </button>
            ))}
          </div>
          <div className="mt-12 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-9 py-8 shadow-sm">
            <h3 className="text-3xl font-black">{t.loveNotes}</h3>
            <p className="text-xl mt-3 leading-relaxed">{t.loveNotesBody}</p>
          </div>
        </div>
      </section>

      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-35%); } }`}</style>
    </div>
  );
}

function Stat({value,label,white,tone,trophy,accent}) {
  const tones = {orange:"from-yellow-400 to-orange-500",blue:"from-blue-500 to-cyan-500",green:"from-green-500 to-emerald-500"};
  return <div className={`${white?'bg-white':'bg-gradient-to-br '+tones[tone]+' text-white'} rounded-xl px-4 py-2 min-w-[120px] shadow-lg`}><div className={`font-black text-xl ${white ? (accent==='purple'?'text-purple-600':'text-pink-600') : ''}`}>{trophy?'🏆 ':''}{value}</div><div className="text-xs font-bold">{label}</div></div>;
}

function Info({icon,title,body}) {
  return <div className="rounded-2xl bg-white/10 p-6 text-center shadow-lg"><div className="text-4xl">{icon}</div><h3 className="text-2xl font-black mt-2">{title}</h3><p className="text-base mt-2 leading-relaxed">{body}</p></div>;
}
