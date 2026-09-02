import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarHeart,
  Check,
  Heart,
  Languages,
  LockKeyhole,
  MessageCircleHeart,
  MessagesSquare,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    eyebrow: "A relationship community built for real life",
    headline: "Love. Grow. Evolve. Together.",
    subheadline:
      "Dating may start the story. One2OneLove helps you live it — with real conversation, meaningful connection, and simple tools that keep relationships growing.",
    joinCommunity: "Join the Live Community",
    sendLoveNote: "Send a Love Note",
    freeToJoin: "Free to join",
    inclusive: "Inclusive community",
    languages: "5 languages",
    previewTitle: "What a room conversation can feel like",
    previewStatus: "EXAMPLE CONVERSATION",
    previewRoom: "Love Talk",
    previewPeople: "Illustrative preview — not live activity",
    previewMemberA: "Member A",
    previewMemberB: "Member B",
    previewMessage1: "What actually makes you feel connected after a long week?",
    previewMessage2: "For me, it's when we put the phones down and really talk.",
    previewHost: "O2OL AI Host",
    previewHostMessage: "Good one. What's a small habit that makes a big difference?",
    roomsEyebrow: "THE FRONT DOOR",
    roomsTitle: "Come talk about what relationships are really like.",
    roomsSubtitle:
      "Five rooms. Different conversations. One respectful community where people can talk, listen, laugh, learn, and connect.",
    joinRoom: "Join the room",
    hostEyebrow: "A BETTER KIND OF AI",
    hostTitle: "The AI Host knows when to speak — and when to get out of the way.",
    hostCopy:
      "When people are talking, the host listens. When a room gets quiet, it offers one thoughtful spark. If the conversation starts moving again, it disappears back into the background.",
    hostRule1: "Warm, curious, emotionally intelligent",
    hostRule2: "Short prompts — never lectures",
    hostRule3: "Built to encourage people, not replace them",
    hostCta: "See the Community",
    hostExample: "EXAMPLE HOST RHYTHM",
    hostExample1: "Conversation flowing — host stays quiet.",
    hostExample2: "Room goes quiet — host offers one prompt.",
    hostExample3: "Members respond — host steps back.",
    notesEyebrow: "365 LOVE NOTES",
    notesTitle: "One for every day of the year — plus your own words.",
    notesCopy:
      "Choose a ready-to-send note or write your own. Make it personal and keep the recipient reveal private. Optional member scheduling is staged for the relaunch membership tools.",
    curated: "365 curated notes",
    custom: "Write your own",
    scheduled: "Member scheduling — staged",
    private: "Private recipient reveal",
    notesCta: "Explore Love Notes",
    toolsEyebrow: "START WITH SOMETHING SIMPLE",
    toolsTitle: "A little utility. A lot of connection.",
    quizTitle: "Love Language Quiz",
    quizCopy: "Learn how you and your partner naturally give and receive love.",
    dateTitle: "Date Ideas",
    dateCopy: "Find an easy way to spend intentional time together.",
    goalsTitle: "Relationship Goals",
    goalsCopy: "Membership tool: turn good intentions into private goals and progress you can track.",
    membership: "Membership",
    openTool: "Open tool",
    finalTitle: "Relationships deserve more than a swipe.",
    finalCopy:
      "Join a community designed for what comes after the match: communication, connection, growth, and everyday love.",
    finalCta: "Create a Free Account",
    signIn: "Already a member? Sign in",
    footerTagline: "Love. Grow. Evolve. Together.",
    footerNote: "Built for real people, real relationships, and every kind of love.",
  },
  es: {
    eyebrow: "Una comunidad de relaciones hecha para la vida real",
    headline: "Ama. Crece. Evoluciona. Juntos.",
    subheadline:
      "Las citas pueden comenzar la historia. One2OneLove te ayuda a vivirla — con conversaciones reales, conexión significativa y herramientas sencillas para seguir creciendo.",
    joinCommunity: "Únete a la Comunidad en Vivo",
    sendLoveNote: "Envía una Nota de Amor",
    freeToJoin: "Gratis para unirse",
    inclusive: "Comunidad inclusiva",
    languages: "5 idiomas",
    previewTitle: "Cómo puede sentirse una conversación en una sala",
    previewStatus: "CONVERSACIÓN DE EJEMPLO",
    previewRoom: "Hablemos de Amor",
    previewPeople: "Vista ilustrativa — no es actividad en vivo",
    previewMemberA: "Miembro A",
    previewMemberB: "Miembro B",
    previewMessage1: "¿Qué te hace sentir conectado después de una semana larga?",
    previewMessage2: "Para mí, es cuando dejamos los teléfonos y hablamos de verdad.",
    previewHost: "Anfitrión IA O2OL",
    previewHostMessage: "Buena respuesta. ¿Qué pequeño hábito hace una gran diferencia?",
    roomsEyebrow: "LA PUERTA DE ENTRADA",
    roomsTitle: "Ven a hablar de cómo son realmente las relaciones.",
    roomsSubtitle:
      "Cinco salas. Conversaciones diferentes. Una comunidad respetuosa para hablar, escuchar, reír, aprender y conectar.",
    joinRoom: "Entrar a la sala",
    hostEyebrow: "UNA MEJOR CLASE DE IA",
    hostTitle: "El Anfitrión IA sabe cuándo hablar — y cuándo apartarse.",
    hostCopy:
      "Cuando las personas hablan, el anfitrión escucha. Cuando la sala se queda en silencio, ofrece una sola chispa de conversación. Si la charla vuelve a fluir, regresa al fondo.",
    hostRule1: "Cálido, curioso y emocionalmente inteligente",
    hostRule2: "Mensajes cortos — nunca sermones",
    hostRule3: "Hecho para animar a las personas, no reemplazarlas",
    hostCta: "Ver la Comunidad",
    hostExample: "RITMO DE EJEMPLO DEL ANFITRIÓN",
    hostExample1: "La conversación fluye — el anfitrión permanece en silencio.",
    hostExample2: "La sala se queda quieta — el anfitrión ofrece una pregunta.",
    hostExample3: "Los miembros responden — el anfitrión se aparta.",
    notesEyebrow: "365 NOTAS DE AMOR",
    notesTitle: "Una para cada día del año — más tus propias palabras.",
    notesCopy:
      "Elige una nota lista o escribe la tuya. Hazla personal y mantén privada la revelación al destinatario. La programación para miembros está preparada para las herramientas de membresía del relanzamiento.",
    curated: "365 notas seleccionadas",
    custom: "Escribe la tuya",
    scheduled: "Programación de membresía — preparada",
    private: "Revelación privada al destinatario",
    notesCta: "Explorar Notas de Amor",
    toolsEyebrow: "EMPIEZA CON ALGO SENCILLO",
    toolsTitle: "Un poco de utilidad. Mucha conexión.",
    quizTitle: "Quiz de Lenguajes del Amor",
    quizCopy: "Descubre cómo tú y tu pareja dan y reciben amor naturalmente.",
    dateTitle: "Ideas para Citas",
    dateCopy: "Encuentra una forma sencilla de pasar tiempo intencional juntos.",
    goalsTitle: "Metas de Relación",
    goalsCopy: "Herramienta de membresía: convierte buenas intenciones en metas privadas y progreso que puedas seguir.",
    membership: "Membresía",
    openTool: "Abrir herramienta",
    finalTitle: "Las relaciones merecen más que deslizar una pantalla.",
    finalCopy:
      "Únete a una comunidad creada para lo que viene después del match: comunicación, conexión, crecimiento y amor cotidiano.",
    finalCta: "Crear Cuenta Gratis",
    signIn: "¿Ya eres miembro? Inicia sesión",
    footerTagline: "Ama. Crece. Evoluciona. Juntos.",
    footerNote: "Creado para personas reales, relaciones reales y toda forma de amor.",
  },
  fr: {
    eyebrow: "Une communauté relationnelle pensée pour la vraie vie",
    headline: "Aimer. Grandir. Évoluer. Ensemble.",
    subheadline:
      "Les rencontres peuvent commencer l'histoire. One2OneLove vous aide à la vivre — avec de vraies conversations, des liens profonds et des outils simples pour faire grandir la relation.",
    joinCommunity: "Rejoindre la Communauté Live",
    sendLoveNote: "Envoyer une Note d'Amour",
    freeToJoin: "Inscription gratuite",
    inclusive: "Communauté inclusive",
    languages: "5 langues",
    previewTitle: "À quoi peut ressembler une conversation de salon",
    previewStatus: "CONVERSATION D’EXEMPLE",
    previewRoom: "Parlons d'Amour",
    previewPeople: "Aperçu illustratif — pas une activité en direct",
    previewMemberA: "Membre A",
    previewMemberB: "Membre B",
    previewMessage1: "Qu'est-ce qui vous fait vraiment sentir proches après une longue semaine ?",
    previewMessage2: "Pour moi, c'est quand on pose les téléphones et qu'on parle vraiment.",
    previewHost: "Hôte IA O2OL",
    previewHostMessage: "Bonne réponse. Quelle petite habitude fait une grande différence ?",
    roomsEyebrow: "LA PORTE D'ENTRÉE",
    roomsTitle: "Venez parler de ce que les relations sont vraiment.",
    roomsSubtitle:
      "Cinq salons. Des conversations différentes. Une communauté respectueuse pour parler, écouter, rire, apprendre et créer des liens.",
    joinRoom: "Rejoindre le salon",
    hostEyebrow: "UNE IA DIFFÉRENTE",
    hostTitle: "L'Hôte IA sait quand parler — et quand s'effacer.",
    hostCopy:
      "Quand les gens parlent, l'hôte écoute. Quand le salon devient calme, il propose une seule étincelle. Si la conversation repart, il retourne en arrière-plan.",
    hostRule1: "Chaleureux, curieux et émotionnellement intelligent",
    hostRule2: "Des messages courts — jamais de longs discours",
    hostRule3: "Conçu pour encourager les gens, pas les remplacer",
    hostCta: "Voir la Communauté",
    hostExample: "RYTHME D’EXEMPLE DE L’HÔTE",
    hostExample1: "La conversation avance — l’hôte reste silencieux.",
    hostExample2: "Le salon devient calme — l’hôte propose une question.",
    hostExample3: "Les membres répondent — l’hôte s’efface.",
    notesEyebrow: "365 NOTES D'AMOUR",
    notesTitle: "Une pour chaque jour de l'année — plus vos propres mots.",
    notesCopy:
      "Choisissez une note prête ou écrivez la vôtre. Rendez-la personnelle et gardez la révélation privée. La planification pour membres est préparée pour les outils d’adhésion de la relance.",
    curated: "365 notes sélectionnées",
    custom: "Écrivez la vôtre",
    scheduled: "Planification membre — préparée",
    private: "Révélation privée au destinataire",
    notesCta: "Explorer les Notes d'Amour",
    toolsEyebrow: "COMMENCEZ SIMPLEMENT",
    toolsTitle: "Un peu d'utilité. Beaucoup de connexion.",
    quizTitle: "Quiz des Langages de l'Amour",
    quizCopy: "Découvrez comment vous et votre partenaire donnez et recevez naturellement l'amour.",
    dateTitle: "Idées de Rendez-vous",
    dateCopy: "Trouvez une façon simple de passer du temps intentionnel ensemble.",
    goalsTitle: "Objectifs de Relation",
    goalsCopy: "Outil d’adhésion : transformez vos intentions en objectifs privés et en progrès que vous pouvez suivre.",
    membership: "Adhésion",
    openTool: "Ouvrir l'outil",
    finalTitle: "Les relations méritent plus qu'un swipe.",
    finalCopy:
      "Rejoignez une communauté pensée pour ce qui vient après le match : communication, connexion, croissance et amour au quotidien.",
    finalCta: "Créer un Compte Gratuit",
    signIn: "Déjà membre ? Se connecter",
    footerTagline: "Aimer. Grandir. Évoluer. Ensemble.",
    footerNote: "Pensé pour de vraies personnes, de vraies relations et toutes les formes d'amour.",
  },
  it: {
    eyebrow: "Una comunità per le relazioni nella vita reale",
    headline: "Ama. Cresci. Evolvi. Insieme.",
    subheadline:
      "Gli incontri possono iniziare la storia. One2OneLove ti aiuta a viverla — con conversazioni vere, connessioni significative e strumenti semplici per continuare a crescere.",
    joinCommunity: "Entra nella Community Live",
    sendLoveNote: "Invia una Nota d'Amore",
    freeToJoin: "Iscrizione gratuita",
    inclusive: "Community inclusiva",
    languages: "5 lingue",
    previewTitle: "Come può apparire una conversazione nella stanza",
    previewStatus: "CONVERSAZIONE DI ESEMPIO",
    previewRoom: "Parliamo d'Amore",
    previewPeople: "Anteprima illustrativa — non è attività live",
    previewMemberA: "Membro A",
    previewMemberB: "Membro B",
    previewMessage1: "Cosa ti fa sentire davvero connesso dopo una lunga settimana?",
    previewMessage2: "Per me, quando mettiamo via i telefoni e parliamo davvero.",
    previewHost: "Host IA O2OL",
    previewHostMessage: "Bella risposta. Quale piccola abitudine fa una grande differenza?",
    roomsEyebrow: "LA PORTA D'INGRESSO",
    roomsTitle: "Parliamo di come sono davvero le relazioni.",
    roomsSubtitle:
      "Cinque stanze. Conversazioni diverse. Una community rispettosa dove parlare, ascoltare, ridere, imparare e connettersi.",
    joinRoom: "Entra nella stanza",
    hostEyebrow: "UN'IA MIGLIORE",
    hostTitle: "L'Host IA sa quando parlare — e quando farsi da parte.",
    hostCopy:
      "Quando le persone parlano, l'host ascolta. Quando la stanza si fa silenziosa, offre un solo spunto. Se la conversazione riparte, torna sullo sfondo.",
    hostRule1: "Caldo, curioso ed emotivamente intelligente",
    hostRule2: "Spunti brevi — mai lezioni",
    hostRule3: "Creato per incoraggiare le persone, non sostituirle",
    hostCta: "Vedi la Community",
    hostExample: "RITMO DI ESEMPIO DELL’HOST",
    hostExample1: "La conversazione scorre — l’host resta in silenzio.",
    hostExample2: "La stanza si quieta — l’host propone una domanda.",
    hostExample3: "I membri rispondono — l’host si fa da parte.",
    notesEyebrow: "365 NOTE D'AMORE",
    notesTitle: "Una per ogni giorno dell'anno — più le tue parole.",
    notesCopy:
      "Scegli una nota pronta o scrivi la tua. Rendila personale e mantieni privata la rivelazione. La programmazione per membri è preparata per gli strumenti di abbonamento del rilancio.",
    curated: "365 note selezionate",
    custom: "Scrivi la tua",
    scheduled: "Programmazione membri — preparata",
    private: "Rivelazione privata al destinatario",
    notesCta: "Esplora le Note d'Amore",
    toolsEyebrow: "INIZIA DA QUALCOSA DI SEMPLICE",
    toolsTitle: "Un po' di utilità. Tanta connessione.",
    quizTitle: "Quiz dei Linguaggi dell'Amore",
    quizCopy: "Scopri come tu e il tuo partner date e ricevete amore naturalmente.",
    dateTitle: "Idee per Appuntamenti",
    dateCopy: "Trova un modo semplice per passare tempo intenzionale insieme.",
    goalsTitle: "Obiettivi di Relazione",
    goalsCopy: "Strumento in abbonamento: trasforma le buone intenzioni in obiettivi privati e progressi che puoi monitorare.",
    membership: "Abbonamento",
    openTool: "Apri strumento",
    finalTitle: "Le relazioni meritano più di uno swipe.",
    finalCopy:
      "Entra in una community pensata per ciò che viene dopo il match: comunicazione, connessione, crescita e amore quotidiano.",
    finalCta: "Crea un Account Gratuito",
    signIn: "Sei già membro? Accedi",
    footerTagline: "Ama. Cresci. Evolvi. Insieme.",
    footerNote: "Creato per persone vere, relazioni vere e ogni forma d'amore.",
  },
  de: {
    eyebrow: "Eine Beziehungsgemeinschaft für das echte Leben",
    headline: "Lieben. Wachsen. Entwickeln. Gemeinsam.",
    subheadline:
      "Dating kann die Geschichte beginnen. One2OneLove hilft euch, sie zu leben — mit echten Gesprächen, echter Verbindung und einfachen Werkzeugen für gemeinsames Wachstum.",
    joinCommunity: "Der Live-Community Beitreten",
    sendLoveNote: "Liebesbotschaft Senden",
    freeToJoin: "Kostenlos beitreten",
    inclusive: "Inklusive Community",
    languages: "5 Sprachen",
    previewTitle: "So kann sich ein Raumgespräch anfühlen",
    previewStatus: "BEISPIELGESPRÄCH",
    previewRoom: "Love Talk",
    previewPeople: "Beispielansicht — keine Live-Aktivität",
    previewMemberA: "Mitglied A",
    previewMemberB: "Mitglied B",
    previewMessage1: "Was lässt euch nach einer langen Woche wieder echte Nähe spüren?",
    previewMessage2: "Für mich ist es, wenn wir die Handys weglegen und wirklich reden.",
    previewHost: "O2OL KI-Host",
    previewHostMessage: "Guter Punkt. Welche kleine Gewohnheit macht einen großen Unterschied?",
    roomsEyebrow: "DIE EINGANGSTÜR",
    roomsTitle: "Redet darüber, wie Beziehungen wirklich sind.",
    roomsSubtitle:
      "Fünf Räume. Unterschiedliche Gespräche. Eine respektvolle Community zum Reden, Zuhören, Lachen, Lernen und Verbinden.",
    joinRoom: "Raum betreten",
    hostEyebrow: "EINE BESSERE ART KI",
    hostTitle: "Der KI-Host weiß, wann er sprechen soll — und wann nicht.",
    hostCopy:
      "Wenn Menschen reden, hört der Host zu. Wird es still, gibt er einen kurzen Impuls. Kommt das Gespräch wieder in Gang, tritt er wieder in den Hintergrund.",
    hostRule1: "Warm, neugierig und emotional intelligent",
    hostRule2: "Kurze Impulse — keine Vorträge",
    hostRule3: "Für Menschen gemacht, nicht als Ersatz für sie",
    hostCta: "Community ansehen",
    hostExample: "BEISPIEL FÜR DEN HOST-RHYTHMUS",
    hostExample1: "Gespräch läuft — der Host bleibt still.",
    hostExample2: "Der Raum wird ruhig — der Host gibt einen Impuls.",
    hostExample3: "Mitglieder antworten — der Host tritt zurück.",
    notesEyebrow: "365 LIEBESBOTSCHAFTEN",
    notesTitle: "Eine für jeden Tag des Jahres — plus eure eigenen Worte.",
    notesCopy:
      "Wählt eine fertige Nachricht oder schreibt eure eigene. Macht sie persönlich und haltet die Enthüllung privat. Die Mitglieder-Planung ist für die Relaunch-Mitgliedschaft vorbereitet.",
    curated: "365 ausgewählte Nachrichten",
    custom: "Eigene Nachricht schreiben",
    scheduled: "Mitglieder-Planung — vorbereitet",
    private: "Private Empfänger-Enthüllung",
    notesCta: "Liebesbotschaften entdecken",
    toolsEyebrow: "EINFACH ANFANGEN",
    toolsTitle: "Ein wenig Hilfe. Viel Verbindung.",
    quizTitle: "Liebessprachen-Quiz",
    quizCopy: "Entdeckt, wie ihr Liebe ganz natürlich gebt und empfangt.",
    dateTitle: "Date-Ideen",
    dateCopy: "Findet eine einfache Idee für bewusste gemeinsame Zeit.",
    goalsTitle: "Beziehungsziele",
    goalsCopy: "Mitgliedschaftstool: Macht aus guten Absichten private Ziele und nachvollziehbaren Fortschritt.",
    membership: "Mitgliedschaft",
    openTool: "Tool öffnen",
    finalTitle: "Beziehungen verdienen mehr als einen Swipe.",
    finalCopy:
      "Kommt in eine Community für das, was nach dem Match kommt: Kommunikation, Verbindung, Wachstum und Liebe im Alltag.",
    finalCta: "Kostenloses Konto Erstellen",
    signIn: "Schon Mitglied? Anmelden",
    footerTagline: "Lieben. Wachsen. Entwickeln. Gemeinsam.",
    footerNote: "Für echte Menschen, echte Beziehungen und jede Form von Liebe.",
  },
};

const roomCopy = {
  en: [
    ["Vent Room", "Say what you need to say — without turning people into targets."],
    ["Modern Dating Unfiltered", "The good, the confusing, the funny, and the exhausting parts of dating now."],
    ["Love Talk", "Connection, communication, affection, intimacy, and the everyday work of loving well."],
    ["Marriage Matters", "For the conversations married people are actually having behind closed doors."],
    ["Starting Over", "Dating again, rebuilding confidence, healing, and figuring out what comes next."],
  ],
  es: [
    ["Sala para Desahogarse", "Di lo que necesitas decir — sin convertir a nadie en un blanco."],
    ["Citas Modernas Sin Filtro", "Lo bueno, lo confuso, lo divertido y lo agotador de las citas actuales."],
    ["Hablemos de Amor", "Conexión, comunicación, afecto, intimidad y el trabajo diario de amar bien."],
    ["El Matrimonio Importa", "Para las conversaciones que los matrimonios realmente tienen en privado."],
    ["Empezar de Nuevo", "Volver a salir, recuperar la confianza, sanar y descubrir qué sigue."],
  ],
  fr: [
    ["Le Coin pour Vider son Sac", "Dites ce que vous avez à dire — sans transformer quelqu'un en cible."],
    ["Rencontres Modernes Sans Filtre", "Le bon, le confus, le drôle et l'épuisant des rencontres d'aujourd'hui."],
    ["Parlons d'Amour", "Connexion, communication, affection, intimité et le travail quotidien de bien aimer."],
    ["Le Mariage Compte", "Pour les conversations que les couples mariés ont réellement en privé."],
    ["Recommencer", "Rencontrer à nouveau, retrouver confiance, guérir et imaginer la suite."],
  ],
  it: [
    ["Vent Room", "Dì quello che devi dire — senza trasformare nessuno in un bersaglio."],
    ["Dating Moderno Senza Filtri", "Il bello, il confuso, il divertente e lo stancante degli incontri di oggi."],
    ["Parliamo d'Amore", "Connessione, comunicazione, affetto, intimità e il lavoro quotidiano di amare bene."],
    ["Il Matrimonio Conta", "Per le conversazioni che le persone sposate fanno davvero in privato."],
    ["Ricominciare", "Tornare a frequentarsi, ritrovare fiducia, guarire e capire cosa viene dopo."],
  ],
  de: [
    ["Vent Room", "Sag, was du sagen musst — ohne andere Menschen zur Zielscheibe zu machen."],
    ["Modernes Dating Ungefiltert", "Das Gute, Verwirrende, Lustige und Anstrengende am heutigen Dating."],
    ["Love Talk", "Nähe, Kommunikation, Zuneigung, Intimität und die tägliche Arbeit an guter Liebe."],
    ["Marriage Matters", "Für die Gespräche, die Verheiratete wirklich hinter verschlossenen Türen führen."],
    ["Neuanfang", "Wieder daten, Selbstvertrauen aufbauen, heilen und herausfinden, was als Nächstes kommt."],
  ],
};

const roomStyles = [
  "from-rose-50 to-orange-50 border-rose-100",
  "from-violet-50 to-fuchsia-50 border-violet-100",
  "from-sky-50 to-cyan-50 border-sky-100",
  "from-amber-50 to-yellow-50 border-amber-100",
  "from-emerald-50 to-teal-50 border-emerald-100",
];

const toolCards = [
  { icon: Heart, key: "quiz", page: "LoveLanguageQuiz", accent: "bg-rose-100 text-rose-700" },
  { icon: CalendarHeart, key: "date", page: "DateIdeas", accent: "bg-violet-100 text-violet-700" },
  { icon: Target, key: "goals", page: "RelationshipGoals", accent: "bg-cyan-100 text-cyan-700" },
];

export default function Home() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const rooms = roomCopy[currentLanguage] || roomCopy.en;

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-hidden">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.20),_transparent_38%),radial-gradient(circle_at_85%_15%,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(to_bottom,_#fff7fb,_#ffffff)]" />
        <div className="absolute -top-24 -left-24 -z-10 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute top-24 -right-28 -z-10 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/85 px-4 py-2 text-sm font-semibold text-pink-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {t.eyebrow}
            </div>

            <div className="mb-6 flex items-center gap-4">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/19ffc2fa2_ONE2ONELOVELOGO.png"
                alt="One2OneLove"
                className="h-20 w-auto sm:h-24"
              />
              <div>
                <div className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">One2OneLove</div>
                <div className="text-sm font-semibold text-pink-600">We Start Where Dating Sites Stop.</div>
              </div>
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              {t.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              {t.subheadline}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={createPageUrl("Community")}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-base font-bold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <Users className="h-5 w-5" />
                {t.joinCommunity}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={createPageUrl("LoveNotes")}
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white px-6 py-4 text-base font-bold text-pink-700 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 hover:bg-pink-50"
              >
                <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
                {t.sendLoveNote}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />{t.freeToJoin}</span>
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" />{t.inclusive}</span>
              <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-sky-500" />{t.languages}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-pink-200/50 via-violet-100/50 to-cyan-200/50 blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-slate-900/10">
              <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white sm:px-6">
                <div>
                  <div className="text-xs font-bold tracking-[0.18em] text-amber-300">{t.previewStatus}</div>
                  <div className="mt-1 text-xl font-black">{t.previewRoom}</div>
                </div>
                <div className="mt-2 text-sm text-slate-300">{t.previewPeople}</div>
              </div>

              <div className="space-y-4 bg-gradient-to-b from-white to-slate-50 p-5 sm:p-6">
                <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                  <span className="mb-1 block text-xs font-black text-slate-900">{t.previewMemberA}</span>
                  {t.previewMessage1}
                </div>
                <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-pink-500 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                  <span className="mb-1 block text-xs font-black text-pink-50">{t.previewMemberB}</span>
                  {t.previewMessage2}
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-950">
                  <div className="mb-1 flex items-center gap-2 text-xs font-black text-violet-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t.previewHost}
                  </div>
                  {t.previewHostMessage}
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  <MessageCircleHeart className="h-5 w-5 text-pink-400" />
                  {t.previewTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-black tracking-[0.22em] text-pink-600">{t.roomsEyebrow}</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{t.roomsTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{t.roomsSubtitle}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {rooms.map(([name, description], index) => (
              <Link
                key={name}
                to={createPageUrl("Community")}
                className={`group flex min-h-64 flex-col rounded-3xl border bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${roomStyles[index]}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <MessagesSquare className="h-5 w-5 text-slate-800" />
                </div>
                <h3 className="mt-6 text-xl font-black leading-tight text-slate-950">{name}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-slate-900">
                  {t.joinRoom}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:px-10">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles className="h-7 w-7 text-pink-300" />
              </div>
              <div className="mt-8 text-sm font-black tracking-[0.18em] text-pink-300">O2OL AI HOST</div>
              <blockquote className="mt-4 text-2xl font-bold leading-9 sm:text-3xl">
                “If humans are talking, listen. If humans stop talking, invite. If the invitation works, disappear again.”
              </blockquote>
              <div className="mt-8 text-xs font-black tracking-[0.18em] text-slate-400">{t.hostExample}</div>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">{t.hostExample1}</div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">{t.hostExample2}</div>
                <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-emerald-100 ring-1 ring-emerald-300/15">{t.hostExample3}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-black tracking-[0.22em] text-violet-600">{t.hostEyebrow}</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{t.hostTitle}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">{t.hostCopy}</p>
            <div className="mt-8 space-y-4">
              {[t.hostRule1, t.hostRule2, t.hostRule3].map((rule) => (
                <div key={rule} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className="font-semibold text-slate-700">{rule}</div>
                </div>
              ))}
            </div>
            <Link to={createPageUrl("Community")} className="mt-9 inline-flex items-center gap-2 font-black text-violet-700 hover:text-violet-900">
              {t.hostCta}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-rose-50 via-white to-orange-50 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:px-10">
          <div>
            <div className="text-xs font-black tracking-[0.22em] text-pink-600">{t.notesEyebrow}</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{t.notesTitle}</h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">{t.notesCopy}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [Heart, t.curated],
                [Send, t.custom],
                [CalendarHeart, t.scheduled],
                [LockKeyhole, t.private],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-white bg-white/85 p-4 font-bold text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
                    <Icon className="h-5 w-5 text-pink-600" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
            <Link
              to={createPageUrl("LoveNotes")}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-6 py-4 font-black text-white shadow-lg shadow-pink-600/15 transition hover:-translate-y-0.5 hover:bg-pink-700"
            >
              {t.notesCta}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="relative rotate-[-2deg] rounded-[2rem] bg-yellow-200 p-8 shadow-2xl shadow-amber-900/10 sm:p-10">
              <div className="absolute left-1/2 top-3 h-3 w-24 -translate-x-1/2 rounded-full bg-yellow-300/70" />
              <div className="text-xs font-black tracking-[0.2em] text-amber-800/60">LOVE NOTE · 184 / 365</div>
              <div className="mt-8 font-dancing text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                “I still choose you — in the easy moments, the messy ones, and all the ordinary days in between.”
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-amber-900/10 pt-5 text-sm font-bold text-amber-900/70">
                <span>Made with One2OneLove</span>
                <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-black tracking-[0.22em] text-cyan-700">{t.toolsEyebrow}</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{t.toolsTitle}</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {toolCards.map(({ icon: Icon, key, page, accent }) => {
              const title = key === "quiz" ? t.quizTitle : key === "date" ? t.dateTitle : t.goalsTitle;
              const copy = key === "quiz" ? t.quizCopy : key === "date" ? t.dateCopy : t.goalsCopy;
              return (
                <Link key={key} to={createPageUrl(page)} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {key === "goals" && (
                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-700">{t.membership}</span>
                    )}
                  </div>
                  <h3 className="mt-6 text-xl font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-slate-900">
                    {t.openTool}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 px-6 py-12 text-center text-white shadow-2xl sm:px-10 sm:py-16">
          <div className="mx-auto max-w-3xl">
            <Heart className="mx-auto h-8 w-8 fill-pink-400 text-pink-400" />
            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl">{t.finalTitle}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t.finalCopy}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={createPageUrl("SignUp")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-pink-50">
                {t.finalCta}<ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={createPageUrl("SignIn")} className="inline-flex items-center justify-center px-5 py-4 font-bold text-slate-200 hover:text-white">
                {t.signIn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
            <div>
              <div className="font-black text-slate-800">One2OneLove</div>
              <div>{t.footerTagline}</div>
            </div>
          </div>
          <div className="max-w-xl md:text-right">{t.footerNote}</div>
        </div>
      </footer>
    </main>
  );
}
