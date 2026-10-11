import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from './Layout';

const LOGO = '/assets/o2ol-approved-logo.png';
const HERO = '/assets/o2ol-hero.png';
const STUDIO_VIDEO = '/studio-media/season-1-episode-1.mp4';
const MYMATCHIQ_LABELS = { en: 'Compatibility Test', es: 'Prueba de Compatibilidad', fr: 'Test de Compatibilité', it: 'Test di Compatibilità', de: 'Kompatibilitätstest' };
const OPEN_HOUSE_COPY = {
  en:{eyebrow:'LIMITED-TIME ONE2ONELOVE OPEN HOUSE',title:'Explore One2OneLove FREE',body:'No account is required to browse. Look around first; create an account only when you want to save, post, or use protected member features.',explore:'Explore Free Tools',studio:'Watch O2OL Studio'},
  es:{eyebrow:'JORNADA DE PUERTAS ABIERTAS ONE2ONELOVE — TIEMPO LIMITADO',title:'Explora One2OneLove GRATIS',body:'No necesitas una cuenta para navegar. Explora primero; crea una cuenta solo cuando quieras guardar, publicar o usar funciones protegidas para miembros.',explore:'Ver Herramientas Gratis',studio:'Ver O2OL Studio'},
  fr:{eyebrow:'PORTES OUVERTES ONE2ONELOVE — DURÉE LIMITÉE',title:'Explorez One2OneLove GRATUITEMENT',body:'Aucun compte n’est nécessaire pour parcourir le site. Explorez d’abord; créez un compte seulement pour enregistrer, publier ou utiliser des fonctions membres protégées.',explore:'Voir les Outils Gratuits',studio:'Voir O2OL Studio'},
  it:{eyebrow:'OPEN HOUSE ONE2ONELOVE — TEMPO LIMITATO',title:'Esplora One2OneLove GRATIS',body:'Non serve un account per navigare. Esplora prima; crea un account solo quando vuoi salvare, pubblicare o usare funzioni protette per i membri.',explore:'Vedi Strumenti Gratuiti',studio:'Guarda O2OL Studio'},
  de:{eyebrow:'ONE2ONELOVE OPEN HOUSE — NUR FÜR KURZE ZEIT',title:'One2OneLove KOSTENLOS Erkunden',body:'Zum Stöbern ist kein Konto erforderlich. Sieh dich zuerst um; erstelle erst dann ein Konto, wenn du speichern, posten oder geschützte Mitgliederfunktionen nutzen möchtest.',explore:'Kostenlose Tools Ansehen',studio:'O2OL Studio Ansehen'}
};

const AMORA_COPY = {
  en:{eyebrow:'MEET AMORA',title:'Your One2OneLove Relationship Coach',body:'Talk naturally with Amora about communication, conflict, boundaries, connection, expectations, or whatever is on your mind.',cta:'Talk with Amora',token:'Credit per reply'},
  es:{eyebrow:'CONOCE A AMORA',title:'Tu Coach de Relaciones One2OneLove',body:'Habla naturalmente con Amora sobre comunicación, conflictos, límites, conexión, expectativas o lo que tengas en mente.',cta:'Hablar con Amora',token:'Crédito por respuesta'},
  fr:{eyebrow:'DÉCOUVREZ AMORA',title:'Votre Coach Relationnelle One2OneLove',body:'Parlez naturellement avec Amora de communication, conflit, limites, connexion, attentes ou de ce qui vous préoccupe.',cta:'Parler avec Amora',token:'Crédito par réponse'},
  it:{eyebrow:'CONOSCI AMORA',title:'La Tua Coach Relazionale One2OneLove',body:'Parla naturalmente con Amora di comunicazione, conflitti, confini, connessione, aspettative o di ciò che hai in mente.',cta:'Parla con Amora',token:'Credito per risposta'},
  de:{eyebrow:'LERNE AMORA KENNEN',title:'Deine One2OneLove Beziehungscoachin',body:'Sprich natürlich mit Amora über Kommunikation, Konflikte, Grenzen, Verbindung, Erwartungen oder was dir gerade durch den Kopf geht.',cta:'Mit Amora sprechen',token:'Credit pro Antwort'}
};

const STUDIO_COPY = {
  en:{eyebrow:'O2OL STUDIO SHOW',season:'Season 1 • Episode 1',title:'Who Should Apologize First?',body:'Watch Episode 1 FREE — the O2OL Studio conversation that opened the season — and explore a real relationship question from more than one point of view.',watch:'Watch Episode 1 — FREE'},
  es:{eyebrow:'O2OL STUDIO SHOW',season:'Temporada 1 • Episodio 1',title:'¿Quién debería disculparse primero?',body:'Mira el Episodio 1 GRATIS — la conversación de O2OL Studio que abrió la temporada — y explora una pregunta real de relación desde más de un punto de vista.',watch:'Ver Episodio 1 — GRATIS'},
  fr:{eyebrow:'O2OL STUDIO SHOW',season:'Saison 1 • Épisode 1',title:'Qui devrait s’excuser en premier ?',body:'Regardez l’Épisode 1 GRATUITEMENT — la conversation O2OL Studio qui a ouvert la saison — et explorez une vraie question relationnelle sous plusieurs angles.',watch:'Voir l’Épisode 1 — GRATUIT'},
  it:{eyebrow:'O2OL STUDIO SHOW',season:'Stagione 1 • Episodio 1',title:'Chi dovrebbe scusarsi per primo?',body:'Guarda l’Episodio 1 GRATIS — la conversazione di O2OL Studio che ha aperto la stagione — ed esplora una vera domanda relazionale da più punti di vista.',watch:'Guarda Episodio 1 — GRATIS'},
  de:{eyebrow:'O2OL STUDIO SHOW',season:'Staffel 1 • Folge 1',title:'Wer sollte sich zuerst entschuldigen?',body:'Sieh dir Folge 1 KOSTENLOS an — das O2OL-Studio-Gespräch, das die Staffel eröffnete — und betrachte eine echte Beziehungsfrage aus mehreren Perspektiven.',watch:'Folge 1 — KOSTENLOS Ansehen'}
};

// Homepage Studio feature (owner directive, 2026-10-10): the homepage
// leads with the NEWEST episode. Season 1 Episode 2 is the feature; its
// playback stays behind the $1 Credit unlock in the Studio (the homepage
// never streams it). Episode 1 moves under the Past Episodes tab and
// stays free.
const STUDIO_E2_COPY = {
  en:{eyebrow:'O2OL STUDIO SHOW',badge:'NEW EPISODE',season:'Season 1 • Episode 2',title:'Who Pays for the First Date?',body:'The newest O2OL Studio conversation is here. Unlock Episode 2 once with $1 Credit and watch it anytime — no subscription, ever.',watch:'Unlock Episode 2 — $1',lockNote:'$1 Credit unlock • Watch anytime'},
  es:{eyebrow:'O2OL STUDIO SHOW',badge:'NUEVO EPISODIO',season:'Temporada 1 • Episodio 2',title:'¿Quién paga en la primera cita?',body:'La conversación más nueva de O2OL Studio ya está aquí. Desbloquea el Episodio 2 una vez con $1 de Crédito y míralo cuando quieras — sin suscripción, nunca.',watch:'Desbloquear Episodio 2 — $1',lockNote:'Desbloqueo con $1 de Crédito • Míralo cuando quieras'},
  fr:{eyebrow:'O2OL STUDIO SHOW',badge:'NOUVEL ÉPISODE',season:'Saison 1 • Épisode 2',title:'Qui paie au premier rendez-vous ?',body:'La toute nouvelle conversation O2OL Studio est arrivée. Débloquez l’Épisode 2 une fois avec 1 $ de Crédit et regardez-le quand vous voulez — sans abonnement, jamais.',watch:'Débloquer l’Épisode 2 — $1',lockNote:'Déblocage avec 1 $ de Crédit • À regarder à tout moment'},
  it:{eyebrow:'O2OL STUDIO SHOW',badge:'NUOVO EPISODIO',season:'Stagione 1 • Episodio 2',title:'Chi paga al primo appuntamento?',body:'La conversazione più nuova di O2OL Studio è qui. Sblocca l’Episodio 2 una volta con $1 di Credito e guardalo quando vuoi — senza abbonamento, mai.',watch:'Sblocca Episodio 2 — $1',lockNote:'Sblocco con $1 di Credito • Guardalo quando vuoi'},
  de:{eyebrow:'O2OL STUDIO SHOW',badge:'NEUE FOLGE',season:'Staffel 1 • Folge 2',title:'Wer zahlt beim ersten Date?',body:'Das neueste O2OL-Studio-Gespräch ist da. Schalte Folge 2 einmal mit $1 Credit frei und sieh sie dir jederzeit an — kein Abo, niemals.',watch:'Folge 2 Freischalten — $1',lockNote:'$1 Credit Freischaltung • Jederzeit ansehen'}
};

const STUDIO_TABS_COPY = {
  en:{newEpisode:'New Episode',pastEpisodes:'Past Episodes'},
  es:{newEpisode:'Nuevo Episodio',pastEpisodes:'Episodios Anteriores'},
  fr:{newEpisode:'Nouvel Épisode',pastEpisodes:'Épisodes Précédents'},
  it:{newEpisode:'Nuovo Episodio',pastEpisodes:'Episodi Precedenti'},
  de:{newEpisode:'Neue Folge',pastEpisodes:'Frühere Folgen'}
};

const COPY = {
  en: {
    slogan:'We Start Where Dating Sites Stop.', mission:'One2OneLove is for everyone pursuing, building, and nurturing love—regardless of race, creed, color, gender, or sexual orientation.', support:'Whether you’re dating, committed, engaged, married, or simply trying to better understand love and relationships, One2OneLove brings together practical tools, community, conversation, and inspiration to help you connect, grow, and build healthier relationships.', langs:'Available in 5 Languages: English • Spanish • French • Italian • German', allInclusive:'ALL-INCLUSIVE RELATIONSHIP PLATFORM', inclusiveBody:'Every race, creed, color, gender, sexual orientation, culture, and background is welcome here. One2OneLove is built to support people pursuing, building, and nurturing healthy love and relationships.', forEveryone:'For Everyone', forEveryoneBody:'LGBTQ+, interfaith, interracial, and relationships across cultures and backgrounds are welcomed and respected.', practical:'Practical Relationship Tools', practicalBody:'Use launch-ready tools designed to support communication, connection, reflection, memories, goals, and meaningful time together.', respectful:'Respectful Community', respectfulBody:'A welcoming space where people can discuss love and relationships without discrimination or judgment.', notDating:'THIS IS NOT A DATING SITE', notDatingBody:'One2OneLove does not match users for dates. It supports people as they pursue, build, understand, and nurture love and relationships.', tools:'Tools for Every Stage of Love', toolsBody:'Whether you’re pursuing love, dating, committed, engaged, married, or focused on strengthening a relationship, One2OneLove brings practical relationship tools and community together in one place.', toolLabels:{ loveNotes:'Love Notes', loveLanguage:'Love Language', dateIdeas:'Date Ideas', memoryLane:'Memory Lane', relationshipSupport:'Relationship Support', relationshipGoals:'Relationship Goals', lgbtqSupport:'LGBTQ+ Support', milestones:'Milestones', communicationPractice:'Communication Practice', chatRoom:'Chat Room', relationshipGames:'Relationship Games', professionals:'Therapists / Professionals' }, onboarding:'NOW ON-BOARDING', loveNotes:'Love Notes', loveNotesBody:'Create and share personalized love notes that help you express appreciation, affection, encouragement, and meaningful thoughts.',
    podcast:'Podcast', stats:{ loveNotesCreated:'Love Notes Created', happyCouples:'Happy Couples', mostWeek:'Most Notes (Week)', mostMonth:'Most Notes (Month)', mostYear:'Most Notes (Year)' }
  },
  es: {
    slogan:'Comenzamos Donde Terminan los Sitios de Citas.', mission:'One2OneLove es para todas las personas que buscan, construyen y nutren el amor, sin importar raza, credo, color, género u orientación sexual.', support:'Ya sea que estés saliendo, comprometido, casado o simplemente tratando de comprender mejor el amor y las relaciones, One2OneLove reúne herramientas prácticas, comunidad, conversación e inspiración.', langs:'Disponible en 5 idiomas: Inglés • Español • Francés • Italiano • Alemán', allInclusive:'PLATAFORMA DE RELACIONES PARA TODOS', inclusiveBody:'Todas las razas, credos, colores, géneros, orientaciones sexuales, culturas y orígenes son bienvenidos aquí.', forEveryone:'Para Todos', forEveryoneBody:'LGBTQ+, interreligiosas, interraciales y relaciones entre culturas y orígenes son bienvenidas y respetadas.', practical:'Herramientas Prácticas', practicalBody:'Herramientas para comunicación, conexión, reflexión, recuerdos, metas y tiempo significativo juntos.', respectful:'Comunidad Respetuosa', respectfulBody:'Un espacio acogedor para hablar de amor y relaciones sin discriminación ni juicio.', notDating:'ESTO NO ES UN SITIO DE CITAS', notDatingBody:'One2OneLove no empareja usuarios para citas. Apoya a las personas mientras buscan, construyen, comprenden y nutren el amor.', tools:'Herramientas para Cada Etapa del Amor', toolsBody:'One2OneLove reúne herramientas prácticas y comunidad para cada etapa de una relación.', toolLabels:{ loveNotes:'Notas de Amor', loveLanguage:'Lenguaje del Amor', dateIdeas:'Ideas para Citas', memoryLane:'Recuerdos', relationshipSupport:'Apoyo para Relaciones', relationshipGoals:'Metas de Relación', lgbtqSupport:'Apoyo LGBTQ+', milestones:'Hitos', communicationPractice:'Práctica de Comunicación', chatRoom:'Sala de Chat', relationshipGames:'Juegos de Relaciones', professionals:'Terapeutas / Profesionales' }, onboarding:'AHORA INCORPORANDO', loveNotes:'Notas de Amor', loveNotesBody:'Crea y comparte notas personalizadas para expresar aprecio, afecto, ánimo y pensamientos significativos.',
    podcast:'Pódcast', stats:{ loveNotesCreated:'Notas de Amor Creadas', happyCouples:'Parejas Felices', mostWeek:'Más Notas (Semana)', mostMonth:'Más Notas (Mes)', mostYear:'Más Notas (Año)' }
  },
  fr: {
    slogan:'Nous Commençons Là Où les Sites de Rencontres S’Arrêtent.', mission:'One2OneLove s’adresse à toute personne qui recherche, construit et nourrit l’amour, sans distinction de race, croyance, couleur, genre ou orientation sexuelle.', support:'Que vous soyez en couple, fiancé, marié ou que vous cherchiez simplement à mieux comprendre l’amour et les relations, One2OneLove réunit outils pratiques, communauté, conversation et inspiration.', langs:'Disponible en 5 langues : Anglais • Espagnol • Français • Italien • Allemand', allInclusive:'PLATEFORME RELATIONNELLE INCLUSIVE', inclusiveBody:'Toutes les races, croyances, couleurs, genres, orientations sexuelles, cultures et origines sont les bienvenus.', forEveryone:'Pour Tous', forEveryoneBody:'Les relations LGBTQ+, interreligieuses, interraciales et interculturelles sont accueillies et respectées.', practical:'Outils Relationnels Pratiques', practicalBody:'Des outils pour la communication, la connexion, la réflexion, les souvenirs, les objectifs et le temps partagé.', respectful:'Communauté Respectueuse', respectfulBody:'Un espace accueillant pour parler d’amour et de relations sans discrimination ni jugement.', notDating:'CE N’EST PAS UN SITE DE RENCONTRES', notDatingBody:'One2OneLove ne met pas les utilisateurs en relation pour des rendez-vous. Il soutient les personnes dans leur parcours relationnel.', tools:'Des Outils pour Chaque Étape de l’Amour', toolsBody:'One2OneLove réunit outils pratiques et communauté pour chaque étape d’une relation.', toolLabels:{ loveNotes:'Notes d’Amour', loveLanguage:'Langage de l’Amour', dateIdeas:'Idées de Rendez-vous', memoryLane:'Souvenirs', relationshipSupport:'Soutien Relationnel', relationshipGoals:'Objectifs Relationnels', lgbtqSupport:'Soutien LGBTQ+', milestones:'Étapes Importantes', communicationPractice:'Pratique de la Communication', chatRoom:'Salon de Discussion', relationshipGames:'Jeux Relationnels', professionals:'Thérapeutes / Professionnels' }, onboarding:'RECRUTEMENT EN COURS', loveNotes:'Notes d’Amour', loveNotesBody:'Créez et partagez des notes personnalisées pour exprimer appréciation, affection, encouragement et pensées significatives.',
    podcast:'Podcast', stats:{ loveNotesCreated:"Notes d’Amour Créées", happyCouples:'Couples Heureux', mostWeek:'Plus de Notes (Semaine)', mostMonth:'Plus de Notes (Mois)', mostYear:'Plus de Notes (Année)' }
  },
  it: {
    slogan:'Iniziamo Dove i Siti di Incontri Si Fermano.', mission:'One2OneLove è per chiunque cerchi, costruisca e coltivi l’amore, indipendentemente da razza, credo, colore, genere o orientamento sessuale.', support:'Che tu stia frequentando qualcuno, sia impegnato, fidanzato, sposato o voglia semplicemente capire meglio l’amore e le relazioni, One2OneLove riunisce strumenti pratici, comunità, conversazione e ispirazione.', langs:'Disponibile in 5 lingue: Inglese • Spagnolo • Francese • Italiano • Tedesco', allInclusive:'PIATTAFORMA RELAZIONALE INCLUSIVA', inclusiveBody:'Ogni razza, credo, colore, genere, orientamento sessuale, cultura e provenienza è benvenuto qui.', forEveryone:'Per Tutti', forEveryoneBody:'Le relazioni LGBTQ+, interreligiose, interrazziali e interculturali sono accolte e rispettate.', practical:'Strumenti Relazionali Pratici', practicalBody:'Strumenti per comunicazione, connessione, riflessione, ricordi, obiettivi e tempo significativo insieme.', respectful:'Comunità Rispettosa', respectfulBody:'Uno spazio accogliente per parlare di amore e relazioni senza discriminazione o giudizio.', notDating:'QUESTO NON È UN SITO DI INCONTRI', notDatingBody:'One2OneLove non abbina utenti per appuntamenti. Supporta le persone mentre cercano, costruiscono, comprendono e coltivano l’amore.', tools:'Strumenti per Ogni Fase dell’Amore', toolsBody:'One2OneLove riunisce strumenti pratici e comunità per ogni fase di una relazione.', toolLabels:{ loveNotes:'Note d’Amore', loveLanguage:'Linguaggio dell’Amore', dateIdeas:'Idee per Appuntamenti', memoryLane:'Ricordi', relationshipSupport:'Supporto Relazionale', relationshipGoals:'Obiettivi di Coppia', lgbtqSupport:'Supporto LGBTQ+', milestones:'Traguardi', communicationPractice:'Pratica di Comunicazione', chatRoom:'Chat', relationshipGames:'Giochi Relazionali', professionals:'Terapeuti / Professionisti' }, onboarding:'ORA IN INSERIMENTO', loveNotes:'Note d’Amore', loveNotesBody:'Crea e condividi note personalizzate per esprimere apprezzamento, affetto, incoraggiamento e pensieri significativi.',
    podcast:'Podcast', stats:{ loveNotesCreated:"Note d’Amore Create", happyCouples:'Coppie Felici', mostWeek:'Più Note (Settimana)', mostMonth:'Più Note (Mese)', mostYear:'Più Note (Anno)' }
  },
  de: {
    slogan:'Wir Beginnen, Wo Dating-Seiten Aufhören.', mission:'One2OneLove ist für alle, die Liebe suchen, aufbauen und pflegen – unabhängig von Herkunft, Glauben, Hautfarbe, Geschlecht oder sexueller Orientierung.', support:'Ob Sie daten, in einer festen Beziehung, verlobt oder verheiratet sind oder Liebe und Beziehungen besser verstehen möchten: One2OneLove verbindet praktische Werkzeuge, Community, Gespräche und Inspiration.', langs:'Verfügbar in 5 Sprachen: Englisch • Spanisch • Französisch • Italienisch • Deutsch', allInclusive:'INKLUSIVE BEZIEHUNGSPLATTFORM', inclusiveBody:'Jede Herkunft, jeder Glaube, jede Hautfarbe, jedes Geschlecht, jede sexuelle Orientierung, Kultur und Lebensgeschichte ist willkommen.', forEveryone:'Für Alle', forEveryoneBody:'LGBTQ+, interreligiöse, interkulturelle und gemischte Beziehungen sind willkommen und respektiert.', practical:'Praktische Beziehungstools', practicalBody:'Werkzeuge für Kommunikation, Verbindung, Reflexion, Erinnerungen, Ziele und gemeinsame Zeit.', respectful:'Respektvolle Community', respectfulBody:'Ein einladender Raum für Gespräche über Liebe und Beziehungen ohne Diskriminierung oder Verurteilung.', notDating:'DIES IST KEINE DATING-SEITE', notDatingBody:'One2OneLove vermittelt keine Dates. Es unterstützt Menschen dabei, Liebe und Beziehungen zu suchen, aufzubauen, zu verstehen und zu pflegen.', tools:'Tools für Jede Phase der Liebe', toolsBody:'One2OneLove verbindet praktische Beziehungstools und Community an einem Ort.', toolLabels:{ loveNotes:'Liebesbotschaften', loveLanguage:'Liebessprache', dateIdeas:'Date-Ideen', memoryLane:'Erinnerungen', relationshipSupport:'Beziehungsunterstützung', relationshipGoals:'Beziehungsziele', lgbtqSupport:'LGBTQ+ Unterstützung', milestones:'Meilensteine', communicationPractice:'Kommunikationstraining', chatRoom:'Chatraum', relationshipGames:'Beziehungsspiele', professionals:'Therapeuten / Fachkräfte' }, onboarding:'JETZT IN AUFNAHME', loveNotes:'Liebesbotschaften', loveNotesBody:'Erstellen und teilen Sie persönliche Liebesbotschaften für Wertschätzung, Zuneigung, Ermutigung und bedeutungsvolle Gedanken.',
    podcast:'Podcast', stats:{ loveNotesCreated:'Erstellte Liebesbotschaften', happyCouples:'Glückliche Paare', mostWeek:'Meiste Nachrichten (Woche)', mostMonth:'Meiste Nachrichten (Monat)', mostYear:'Meiste Nachrichten (Jahr)' }
  }
};

const TOOLS = [
  ['🤝','relationshipSupport','CoupleSupport','from-sky-600 to-blue-700','free'],
  ['🌈','lgbtqSupport','LGBTQSupport','from-fuchsia-600 to-purple-700','free'],
  ['🗣','communicationPractice','CommunicationPractice','from-teal-600 to-emerald-700','free'],
  ['💬','chatRoom','Chat','from-blue-600 to-indigo-700','free'],
  ['🩺','professionals','Professionals','from-purple-600 to-indigo-700','free'],
  ['✦','MyMatchIQ','MyMatchIQ','from-slate-950 via-indigo-800 to-fuchsia-700','mixed'],
  ['💗','loveNotes','LoveNotes','from-rose-500 to-pink-600','mixed'],
  ['💬','loveLanguage','LoveLanguageQuiz','from-violet-600 to-purple-600','mixed'],
  ['🗓️','dateIdeas','DateIdeas','from-cyan-500 to-blue-600','mixed'],
  ['📷','memoryLane','MemoryLane','from-indigo-600 to-violet-700','locked'],
  ['🎯','relationshipGoals','RelationshipGoals','from-amber-500 to-yellow-600','locked'],
  ['💗','milestones','RelationshipMilestones','from-pink-600 to-fuchsia-700','locked'],
  ['🎮','relationshipGames','CooperativeGames','from-emerald-600 to-teal-700','locked'],
];

export default function Home() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const matchIQLabel = MYMATCHIQ_LABELS[currentLanguage] || MYMATCHIQ_LABELS.en;
  const studio = STUDIO_COPY[currentLanguage] || STUDIO_COPY.en;
  const studioE2 = STUDIO_E2_COPY[currentLanguage] || STUDIO_E2_COPY.en;
  const studioTabs = STUDIO_TABS_COPY[currentLanguage] || STUDIO_TABS_COPY.en;
  const [studioTab, setStudioTab] = useState('new');
  const amora = AMORA_COPY[currentLanguage] || AMORA_COPY.en;
  const [selectedTool, setSelectedTool] = useState(0);
  const [publicStats, setPublicStats] = useState(null);
  const go = page => navigate(createPageUrl(page));

  useEffect(() => {
    let active = true;
    fetch('/api/public-stats', { credentials:'same-origin', headers:{ accept:'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(payload => { if (active && payload?.ok) setPublicStats(payload); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const heroStats = [
    { value: Number(publicStats?.notesCreated || 0), label: t.stats.loveNotesCreated, white:true },
    { value: Number(publicStats?.happyCouples || 0), label: t.stats.happyCouples, white:true, accent:'purple' },
    { value: Number(publicStats?.mostNotesWeek || 0), label: t.stats.mostWeek, tone:'orange', trophy:true },
    { value: Number(publicStats?.mostNotesMonth || 0), label: t.stats.mostMonth, tone:'blue', trophy:true },
    { value: Number(publicStats?.mostNotesYear || 0), label: t.stats.mostYear, tone:'green', trophy:true },
  ].filter(item => item.value > 0);
  const showHeroStats = publicStats?.hasDisplayableData === true && heroStats.length > 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      {/* Click-to-Vote moved into the widened site header (owner
          directive, 2026-10-10) — Layout renders it as an outlined row
          under the header row on the homepage. */}
      <section className="relative flex min-h-[900px] items-end justify-center bg-cover bg-center" style={{backgroundImage:`url(${HERO})`}}>
        <div className="absolute inset-0 bg-black/10"/>
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-8 pt-8 text-center text-white">
          <div className="mt-2 text-3xl font-black italic text-yellow-300 drop-shadow md:text-4xl">{t.slogan}</div>
          <p className="mx-auto mt-8 max-w-5xl text-xl font-extrabold leading-snug drop-shadow md:text-2xl">{t.mission}</p>
          <p className="mx-auto mt-5 max-w-5xl text-lg leading-relaxed drop-shadow md:text-xl">{t.support}</p>
          <p className="mt-7 text-xl font-black text-yellow-300 drop-shadow md:text-2xl">{t.langs}</p>

          <div className="mx-auto mt-7 grid w-[70%] max-w-[33.6rem] grid-cols-1 gap-4 md:grid-cols-2">
            <button data-analytics-id="home-hero-love-language" data-analytics-destination="/LoveLanguageQuiz" onClick={() => go('LoveLanguageQuiz')} className="rounded-2xl bg-pink-500 px-[1.4rem] py-[0.525rem] text-[1.375rem]/[1.925rem] font-extrabold shadow-xl hover:bg-pink-600">♡ {t.toolLabels.loveLanguage}</button>
            <button data-analytics-id="home-hero-love-notes" data-analytics-destination="/LoveNotes" onClick={() => go('LoveNotes')} className="rounded-2xl bg-white px-[1.4rem] py-[0.525rem] text-[1.375rem]/[1.925rem] font-extrabold text-pink-600 shadow-xl hover:bg-slate-50">♡ {t.toolLabels.loveNotes}</button>
            <button data-analytics-id="home-hero-podcasts" data-analytics-destination="/PodcastsSupport" onClick={() => go('PodcastsSupport')} className="rounded-2xl bg-orange-500 px-[1.4rem] py-[0.525rem] text-[1.375rem]/[1.925rem] font-extrabold shadow-xl hover:bg-orange-600">🎙 {t.podcast}</button>
            <button data-analytics-id="home-hero-date-ideas" data-analytics-destination="/DateIdeas" onClick={() => go('DateIdeas')} className="rounded-2xl bg-teal-600 px-[1.4rem] py-[0.525rem] text-[1.375rem]/[1.925rem] font-extrabold shadow-xl hover:bg-teal-700">▣ {t.toolLabels.dateIdeas}</button>
            <button data-analytics-id="home-hero-mymatchiq" data-analytics-destination="/MyMatchIQ" onClick={() => go('MyMatchIQ')} aria-label={`MyMatchIQ ${matchIQLabel}`} className="relative flex min-h-[68px] items-center justify-center overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-slate-950 via-indigo-800 to-fuchsia-700 px-4 py-2.5 text-white shadow-2xl transition hover:scale-[1.02] hover:from-indigo-950 hover:to-fuchsia-600 md:col-span-2">
              <img src="/assets/mymatchiq-official-logo.webp" alt="MyMatchIQ" className="h-10 w-auto max-w-[72%] object-contain sm:h-11" />
              <span className="absolute right-3 top-2 max-w-[45%] rounded-full bg-violet-500/90 px-2.5 py-1 text-[0.48rem] font-black uppercase leading-none tracking-[0.16em] text-white shadow-sm sm:right-4 sm:text-[0.56rem]">{matchIQLabel}</span>
            </button>
          </div>

          {showHeroStats && (
            <div className="mt-16 flex flex-wrap justify-center gap-2 text-slate-900">
              {heroStats.map((item) => (
                <Stat key={item.label} value={item.value.toLocaleString()} label={item.label} white={item.white} accent={item.accent} tone={item.tone} trophy={item.trophy} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-rose-600 px-5 py-7 text-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-black md:text-4xl">🌍 {t.allInclusive} 🌍</h2>
          <p className="mx-auto mt-3 max-w-6xl text-center text-lg md:text-xl">{t.inclusiveBody}</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <Info icon="🌐" title={t.forEveryone} body={t.forEveryoneBody}/>
            <Info icon="♥" title={t.practical} body={t.practicalBody}/>
            <Info icon="♡" title={t.respectful} body={t.respectfulBody}/>
          </div>
          <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-white/5 px-5 py-3 text-center"><div className="text-xl font-black">⚠️ {t.notDating} ⚠️</div><div className="mt-1 text-sm md:text-base">{t.notDatingBody}</div></div>
        </div>
      </section>

      <section id="open-house-tools" className="scroll-mt-24 bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-5xl font-black tracking-tight md:text-6xl">{t.tools}</h2>
          <p className="mx-auto mt-3 max-w-5xl text-center text-lg text-slate-600 md:text-xl">{t.toolsBody}</p>
          <button type="button" data-feature-status="locked" onClick={() => go('Amora')} className="group relative mx-auto mt-8 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-purple-50 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:grid-cols-[190px_1fr]">
            <span className="absolute right-4 top-4 z-10 rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-amber-950 shadow">🔒</span><div className="flex items-center justify-center bg-[#16070f] p-4">
              <img src="/assets/amora-relationship-coach-official.webp" alt="Amora — One2OneLove Relationship Coach" className="h-auto w-full max-w-[170px] rounded-2xl shadow-lg" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <div className="text-xs font-black uppercase tracking-[.2em] text-rose-600">{amora.eyebrow}</div>
              <h3 className="mt-2 text-3xl font-black text-slate-950">{amora.title}</h3>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{amora.body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-5 py-2.5 text-sm font-black text-white shadow-md">{amora.cta}</span>
                <span className="text-xs font-black uppercase tracking-wide text-amber-700">🪙 {amora.token}</span>
              </div>
            </div>
          </button>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map(([icon,labelKey,page,gradient,status],index) => (
              <button key={page} data-feature-status={status} data-analytics-id={`home-tool-${String(page).toLowerCase()}`} data-analytics-destination={`/${page}`} onClick={() => { setSelectedTool(index); go(page); }} className={`relative min-h-[86px] rounded-2xl bg-gradient-to-r ${gradient} px-5 text-xl font-extrabold text-white shadow-lg transition-transform hover:scale-[1.02] ${labelKey === 'MyMatchIQ' ? 'border-2 border-fuchsia-300 ring-2 ring-indigo-200' : ''} ${index===selectedTool?'ring-4 ring-rose-400 ring-offset-2':''}`}>
                {status === 'free' && <span className="absolute right-2 top-2 rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black tracking-wide text-yellow-950 shadow">FREE</span>}
                {status === 'locked' && <span aria-label="Locked" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-amber-300 text-sm text-amber-950 shadow">🔒</span>}
                <span>{icon} {labelKey === 'MyMatchIQ' ? 'MyMatchIQ' : (t.toolLabels[labelKey] || COPY.en.toolLabels[labelKey])}</span>
              </button>
            ))}
          </div>
          <div className="mt-12 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-9 py-8 shadow-sm"><h3 className="text-3xl font-black">{t.loveNotes}</h3><p className="mt-3 text-xl leading-relaxed">{t.loveNotesBody}</p></div>
          <div className="mt-10 flex items-center justify-center gap-2" role="tablist" aria-label="O2OL Studio episodes">
            {/* Owner color rule (2026-10-10): every NEW EPISODE element wears
                the same fuchsia-to-blue gradient; the Past Episodes tab is
                yellow. Active state is shown by ring + shadow so the colors
                never swap. */}
            <button type="button" role="tab" aria-selected={studioTab==='new'} onClick={() => setStudioTab('new')} className={`rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow transition hover:brightness-110 ${studioTab==='new' ? 'shadow-lg ring-2 ring-fuchsia-300' : 'opacity-80'}`}>{studioTabs.newEpisode}</button>
            <button type="button" role="tab" aria-selected={studioTab==='past'} onClick={() => setStudioTab('past')} className={`rounded-full bg-amber-300 px-5 py-2.5 text-sm font-black text-amber-950 shadow transition hover:brightness-105 ${studioTab==='past' ? 'shadow-lg ring-2 ring-amber-500' : 'opacity-80'}`}>{studioTabs.pastEpisodes}</button>
          </div>
          {studioTab === 'new' ? (
          <div className="mt-6 w-full overflow-hidden rounded-3xl border border-fuchsia-300/35 bg-slate-950 text-white shadow-2xl">
            <div className="relative flex aspect-[16/9] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 px-6 text-center">
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-600 px-3.5 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white shadow-lg sm:text-xs">{studioE2.badge}</span>
              <div className="mt-4 text-[0.7rem] font-black uppercase tracking-[0.22em] text-cyan-200 sm:text-sm">{studioE2.season}</div>
              <div className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">{studioE2.title}</div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/90 sm:text-sm"><span aria-hidden="true">🔒</span>{studioE2.lockNote}</div>
            </div>
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 px-5 py-4 sm:px-7 sm:py-5 lg:px-9 lg:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.18em] shadow-lg sm:text-[0.68rem]">{studioE2.eyebrow}</span>
                    <span className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-cyan-200 sm:text-xs">{studioE2.season}</span>
                  </div>
                  <div className="mt-2 text-xl font-black leading-tight sm:text-2xl lg:text-3xl">{studioE2.title}</div>
                  <p className="mt-1.5 hidden max-w-3xl text-sm leading-5 text-white/80 md:block">{studioE2.body}</p>
                </div>
                <button
                  type="button"
                  data-analytics-id="home-studio-feature-e2"
                  data-analytics-destination="/O2OLStudio?episode=season-1-episode-2"
                  onClick={()=>navigate('/O2OLStudio?episode=season-1-episode-2')}
                  aria-label={`${studioE2.watch}: ${studioE2.title}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg transition hover:brightness-110 sm:self-auto sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {studioE2.watch}<span aria-hidden="true">▶</span>
                </button>
              </div>
            </div>
          </div>
          ) : (
          <div className="mt-6 w-full overflow-hidden rounded-3xl border border-fuchsia-300/35 bg-slate-950 text-white shadow-2xl">
            <div className="aspect-[16/9] w-full overflow-hidden bg-black">
              <video
                data-home-studio-video="season-1-episode-1"
                aria-label="O2OL Studio Season 1 Episode 1 — Who Should Apologize First?"
                className="h-full w-full bg-black object-contain"
                controls
                playsInline
                preload="metadata"
                src={`${STUDIO_VIDEO}#t=0.1`}
              >
                Your browser does not support HTML5 video.
              </video>
            </div>
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 px-5 py-4 sm:px-7 sm:py-5 lg:px-9 lg:py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.18em] shadow-lg sm:text-[0.68rem]">{studio.eyebrow}</span>
                    <span className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-cyan-200 sm:text-xs">{studio.season}</span>
                  </div>
                  <div className="mt-2 text-xl font-black leading-tight sm:text-2xl lg:text-3xl">{studio.title}</div>
                  <p className="mt-1.5 hidden max-w-3xl text-sm leading-5 text-white/80 md:block">{studio.body}</p>
                </div>
                <button
                  type="button"
                  data-analytics-id="home-studio-feature"
                  data-analytics-destination="/O2OLStudio?episode=season-1-episode-1"
                  onClick={()=>navigate('/O2OLStudio?episode=season-1-episode-1')}
                  aria-label={`${studio.watch}: ${studio.title}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-fuchsia-500 to-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg transition hover:brightness-110 sm:self-auto sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {studio.watch}<span aria-hidden="true">▶</span>
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({value,label,white,tone,trophy,accent}) {
  const tones = {orange:'from-yellow-400 to-orange-500',blue:'from-blue-500 to-cyan-500',green:'from-green-500 to-emerald-500'};
  return <div className={`${white?'bg-white':'bg-gradient-to-br '+tones[tone]+' text-white'} rounded-xl px-4 py-2 min-w-[120px] shadow-lg`}><div className={`font-black text-xl ${white ? (accent==='purple'?'text-purple-600':'text-pink-600') : ''}`}>{trophy?'🏆 ':''}{value}</div><div className="text-xs font-bold">{label}</div></div>;
}

function Info({icon,title,body}) {
  return <div className="rounded-2xl bg-white/10 p-6 text-center shadow-lg"><div className="text-4xl">{icon}</div><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mt-2 text-base leading-relaxed">{body}</p></div>;
}
