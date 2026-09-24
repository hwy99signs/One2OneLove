(() => {
  const SUPPORTED = ['en','es','fr','it','de'];
  const NAMES = { en:'English', es:'Español', fr:'Français', it:'Italiano', de:'Deutsch' };
  const MAP = {
    es: {
      'Scratch. Share. Grow Closer.':'Rasca. Comparte. Acérquense.',
      'A simple relationship conversation game. Pick a deck, draw a card, scratch it, and talk.':'Un sencillo juego de conversación para parejas. Elijan un mazo, saquen una carta, rásquenla y hablen.',
      'Start Game':'Comenzar Juego','How to Play':'Cómo Jugar','Install Game':'Instalar Juego',
      'How many players?':'¿Cuántos jugadores?','Play solo for self-evaluation, as one couple, or as two couples. No scoring—just reflection and conversation.':'Juega a solas para autoevaluarte, en pareja o como dos parejas. Sin puntuación: solo reflexión y conversación.',
      '1 Player':'1 Jugador','Self Evaluation':'Autoevaluación','2 Players':'2 Jugadores','One couple':'Una pareja','4 Players':'4 Jugadores','Two couples':'Dos parejas','Back':'Volver',
      'Choose Your Relationship':'Elige Tu Relación','This tailors the questions to where you are together.':'Esto adapta las preguntas a la etapa en la que están juntos.',
      'Dating':'En Citas','Getting to know each other':'Conociéndose','Engaged':'Comprometidos','Preparing for marriage':'Preparándose para el matrimonio','Married':'Casados','Growing your marriage':'Fortaleciendo su matrimonio','Committed / Unmarried':'Comprometidos / No Casados','Building a life together':'Construyendo una vida juntos',
      'Choose a Deck':'Elige un Mazo','Each category has its own colored card back.':'Cada categoría tiene su propio color de carta.','Home':'Inicio','Communication Deck':'Mazo de Comunicación','Change Deck':'Cambiar Mazo','Draw':'Sacar','Played':'Jugadas','Tap the deck to draw.':'Toca el mazo para sacar una carta.','Next Card':'Siguiente Carta',
      'Deck complete':'Mazo completado','Every question in this deck has been played.':'Se han jugado todas las preguntas de este mazo.','Choose Another Deck':'Elegir Otro Mazo','Got It':'Entendido',
      'Choose 1, 2, or 4 players':'Elige 1, 2 o 4 jugadores',', select your relationship type, then choose a relationship deck.':', selecciona el tipo de relación y luego elige un mazo.',
      '2 or 4 Players:':'2 o 4 Jugadores:','The active player taps the deck, scratches the silver area to reveal the question, and everyone discusses it. Tap':'El jugador activo toca el mazo, rasca el área plateada para revelar la pregunta y todos la comentan. Toca','when you are finished. The played card moves to the face-up pile and the turn moves to the next player.':'cuando hayan terminado. La carta jugada pasa a la pila boca arriba y el turno pasa al siguiente jugador.',
      '1 Player — Self Evaluation:':'1 Jugador — Autoevaluación:','Play as if your partner is sitting across from you and asking you each question. Read every card as a question coming directly from your partner, answer it honestly from your own perspective, and reflect on what your answer tells you about yourself and your relationship. The questions keep the same partner wording as the regular game, so you do not need a separate solo question set. Tap':'Juega como si tu pareja estuviera frente a ti haciéndote cada pregunta. Lee cada carta como una pregunta directa de tu pareja, responde con honestidad desde tu propia perspectiva y reflexiona sobre lo que tu respuesta revela de ti y de tu relación. Las preguntas conservan el mismo lenguaje de pareja del juego normal, por lo que no necesitas un mazo distinto para jugar a solas. Toca','when you are ready to continue.':'cuando estés listo para continuar.',
      'Communication':'Comunicación','Trust':'Confianza','Fun':'Diversión','Intimacy':'Intimidad','Money':'Dinero','Future':'Futuro','Conflict':'Conflicto','Deep Questions':'Preguntas Profundas','Digital Communication':'Comunicación Digital','Electronic Devices':'Dispositivos Electrónicos','Social Media':'Redes Sociales','AI Bot Relationships':'Relaciones con Bots de IA','Shuffle All':'Mezclar Todo','Tap to open deck':'Toca para abrir el mazo',
      'Public Beta — Free for a Limited Time':'Beta Pública — Gratis por Tiempo Limitado','Create a free account to play, save your access, and help us learn which Relationship Games people use most.':'Crea una cuenta gratuita para jugar, guardar tu acceso y ayudarnos a saber qué Juegos de Relaciones usa más la gente.','Create Account':'Crear Cuenta','Sign In':'Iniciar Sesión','Username':'Nombre de Usuario','Choose a username':'Elige un nombre de usuario','Email':'Correo Electrónico','Password':'Contraseña','8–12 characters':'8–12 caracteres','Use 8–12 characters.':'Usa entre 8 y 12 caracteres.','Send me One2OneLove updates, new games, and special offers. I can unsubscribe later.':'Envíame novedades de One2OneLove, nuevos juegos y ofertas especiales. Puedo cancelar la suscripción más adelante.','I agree to the':'Acepto los','Terms of Service':'Términos de Servicio','and acknowledge the':'y reconozco la','Privacy Policy':'Política de Privacidad','Create Free Account & Play':'Crear Cuenta Gratis y Jugar','Your password':'Tu contraseña','Sign In & Play':'Iniciar Sesión y Jugar','Forgot your password? Email':'¿Olvidaste tu contraseña? Escribe a','Signed in as':'Sesión iniciada como','Log out':'Cerrar Sesión',
      'Request failed':'La solicitud falló','Could not create account.':'No se pudo crear la cuenta.','Could not sign in.':'No se pudo iniciar sesión.','Enter a valid email address.':'Introduce un correo electrónico válido.','Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens.':'El nombre de usuario debe tener entre 3 y 24 caracteres y usar letras, números, puntos, guiones bajos o guiones.','Password must be 8–12 characters.':'La contraseña debe tener entre 8 y 12 caracteres.','You must agree to the Terms and Privacy Policy.':'Debes aceptar los Términos y la Política de Privacidad.','Too many signup attempts. Please try again later.':'Demasiados intentos de registro. Inténtalo de nuevo más tarde.','Too many login attempts. Please try again later.':'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.','Email and password are required.':'Se requieren el correo electrónico y la contraseña.','Email or password is incorrect.':'El correo electrónico o la contraseña son incorrectos.','Sign in required':'Debes iniciar sesión','Card unavailable':'Carta no disponible','Method not allowed':'Método no permitido','Invalid JSON':'JSON no válido','Invalid relationship type':'Tipo de relación no válido','Invalid category':'Categoría no válida'
    },
    fr: {
      'Scratch. Share. Grow Closer.':'Grattez. Partagez. Rapprochez-vous.',
      'A simple relationship conversation game. Pick a deck, draw a card, scratch it, and talk.':'Un jeu simple de conversation pour les couples. Choisissez un paquet, tirez une carte, grattez-la et discutez.',
      'Start Game':'Commencer','How to Play':'Comment Jouer','Install Game':'Installer le Jeu',
      'How many players?':'Combien de joueurs ?','Play solo for self-evaluation, as one couple, or as two couples. No scoring—just reflection and conversation.':'Jouez en solo pour une autoévaluation, en couple ou à deux couples. Pas de score — seulement de la réflexion et de la conversation.',
      '1 Player':'1 Joueur','Self Evaluation':'Autoévaluation','2 Players':'2 Joueurs','One couple':'Un couple','4 Players':'4 Joueurs','Two couples':'Deux couples','Back':'Retour',
      'Choose Your Relationship':'Choisissez Votre Relation','This tailors the questions to where you are together.':'Cela adapte les questions à l’étape où vous en êtes ensemble.',
      'Dating':'Relation naissante','Getting to know each other':'Apprendre à se connaître','Engaged':'Fiancés','Preparing for marriage':'Préparer le mariage','Married':'Mariés','Growing your marriage':'Faire grandir votre mariage','Committed / Unmarried':'Engagés / Non Mariés','Building a life together':'Construire une vie ensemble',
      'Choose a Deck':'Choisissez un Paquet','Each category has its own colored card back.':'Chaque catégorie possède sa propre couleur de carte.','Home':'Accueil','Communication Deck':'Paquet Communication','Change Deck':'Changer de Paquet','Draw':'Pioche','Played':'Jouées','Tap the deck to draw.':'Touchez le paquet pour tirer une carte.','Next Card':'Carte Suivante',
      'Deck complete':'Paquet terminé','Every question in this deck has been played.':'Toutes les questions de ce paquet ont été jouées.','Choose Another Deck':'Choisir un Autre Paquet','Got It':'Compris',
      'Choose 1, 2, or 4 players':'Choisissez 1, 2 ou 4 joueurs',', select your relationship type, then choose a relationship deck.':', sélectionnez votre type de relation, puis choisissez un paquet relationnel.',
      '2 or 4 Players:':'2 ou 4 Joueurs :','The active player taps the deck, scratches the silver area to reveal the question, and everyone discusses it. Tap':'Le joueur actif touche le paquet, gratte la zone argentée pour révéler la question, puis tout le monde en discute. Touchez','when you are finished. The played card moves to the face-up pile and the turn moves to the next player.':'lorsque vous avez terminé. La carte jouée rejoint la pile face visible et le tour passe au joueur suivant.',
      '1 Player — Self Evaluation:':'1 Joueur — Autoévaluation :','Play as if your partner is sitting across from you and asking you each question. Read every card as a question coming directly from your partner, answer it honestly from your own perspective, and reflect on what your answer tells you about yourself and your relationship. The questions keep the same partner wording as the regular game, so you do not need a separate solo question set. Tap':'Jouez comme si votre partenaire était assis en face de vous et vous posait chaque question. Lisez chaque carte comme une question venant directement de votre partenaire, répondez honnêtement de votre point de vue et réfléchissez à ce que votre réponse révèle sur vous et votre relation. Les questions conservent la même formulation de partenaire que le jeu normal, vous n’avez donc pas besoin d’un jeu distinct en solo. Touchez','when you are ready to continue.':'lorsque vous êtes prêt à continuer.',
      'Communication':'Communication','Trust':'Confiance','Fun':'Amusement','Intimacy':'Intimité','Money':'Argent','Future':'Avenir','Conflict':'Conflit','Deep Questions':'Questions Profondes','Digital Communication':'Communication Numérique','Electronic Devices':'Appareils Électroniques','Social Media':'Réseaux Sociaux','AI Bot Relationships':'Relations avec des Bots IA','Shuffle All':'Tout Mélanger','Tap to open deck':'Touchez pour ouvrir le paquet',
      'Public Beta — Free for a Limited Time':'Bêta Publique — Gratuite pour une Durée Limitée','Create a free account to play, save your access, and help us learn which Relationship Games people use most.':'Créez un compte gratuit pour jouer, conserver votre accès et nous aider à savoir quels Jeux Relationnels sont les plus utilisés.','Create Account':'Créer un Compte','Sign In':'Se Connecter','Username':'Nom d’Utilisateur','Choose a username':'Choisissez un nom d’utilisateur','Email':'E-mail','Password':'Mot de Passe','8–12 characters':'8–12 caractères','Use 8–12 characters.':'Utilisez entre 8 et 12 caractères.','Send me One2OneLove updates, new games, and special offers. I can unsubscribe later.':'Envoyez-moi les nouveautés One2OneLove, les nouveaux jeux et les offres spéciales. Je pourrai me désabonner plus tard.','I agree to the':'J’accepte les','Terms of Service':'Conditions d’Utilisation','and acknowledge the':'et je reconnais la','Privacy Policy':'Politique de Confidentialité','Create Free Account & Play':'Créer un Compte Gratuit et Jouer','Your password':'Votre mot de passe','Sign In & Play':'Se Connecter et Jouer','Forgot your password? Email':'Mot de passe oublié ? Écrivez à','Signed in as':'Connecté en tant que','Log out':'Se Déconnecter',
      'Request failed':'La demande a échoué','Could not create account.':'Impossible de créer le compte.','Could not sign in.':'Impossible de se connecter.','Enter a valid email address.':'Saisissez une adresse e-mail valide.','Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens.':'Le nom d’utilisateur doit comporter 3 à 24 caractères : lettres, chiffres, points, tirets bas ou tirets.','Password must be 8–12 characters.':'Le mot de passe doit comporter 8 à 12 caractères.','You must agree to the Terms and Privacy Policy.':'Vous devez accepter les Conditions et la Politique de Confidentialité.','Too many signup attempts. Please try again later.':'Trop de tentatives d’inscription. Réessayez plus tard.','Too many login attempts. Please try again later.':'Trop de tentatives de connexion. Réessayez plus tard.','Email and password are required.':'L’e-mail et le mot de passe sont requis.','Email or password is incorrect.':'L’e-mail ou le mot de passe est incorrect.','Sign in required':'Connexion requise','Card unavailable':'Carte indisponible','Method not allowed':'Méthode non autorisée','Invalid JSON':'JSON invalide','Invalid relationship type':'Type de relation invalide','Invalid category':'Catégorie invalide'
    },
    it: {
      'Scratch. Share. Grow Closer.':'Gratta. Condividi. Avvicinatevi.',
      'A simple relationship conversation game. Pick a deck, draw a card, scratch it, and talk.':'Un semplice gioco di conversazione per coppie. Scegliete un mazzo, pescate una carta, grattatela e parlatene.',
      'Start Game':'Inizia il Gioco','How to Play':'Come si Gioca','Install Game':'Installa il Gioco',
      'How many players?':'Quanti giocatori?','Play solo for self-evaluation, as one couple, or as two couples. No scoring—just reflection and conversation.':'Gioca da solo per l’autovalutazione, in coppia o con due coppie. Nessun punteggio: solo riflessione e conversazione.',
      '1 Player':'1 Giocatore','Self Evaluation':'Autovalutazione','2 Players':'2 Giocatori','One couple':'Una coppia','4 Players':'4 Giocatori','Two couples':'Due coppie','Back':'Indietro',
      'Choose Your Relationship':'Scegli il Tipo di Relazione','This tailors the questions to where you are together.':'Questo adatta le domande alla fase della vostra relazione.',
      'Dating':'Frequentazione','Getting to know each other':'Conoscersi meglio','Engaged':'Fidanzati','Preparing for marriage':'Prepararsi al matrimonio','Married':'Sposati','Growing your marriage':'Far crescere il vostro matrimonio','Committed / Unmarried':'Relazione Stabile / Non Sposati','Building a life together':'Costruire una vita insieme',
      'Choose a Deck':'Scegli un Mazzo','Each category has its own colored card back.':'Ogni categoria ha il proprio colore sul retro delle carte.','Home':'Inizio','Communication Deck':'Mazzo Comunicazione','Change Deck':'Cambia Mazzo','Draw':'Pesca','Played':'Giocate','Tap the deck to draw.':'Tocca il mazzo per pescare una carta.','Next Card':'Carta Successiva',
      'Deck complete':'Mazzo completato','Every question in this deck has been played.':'Tutte le domande di questo mazzo sono state giocate.','Choose Another Deck':'Scegli un Altro Mazzo','Got It':'Ho Capito',
      'Choose 1, 2, or 4 players':'Scegli 1, 2 o 4 giocatori',', select your relationship type, then choose a relationship deck.':', seleziona il tipo di relazione e poi scegli un mazzo.',
      '2 or 4 Players:':'2 o 4 Giocatori:','The active player taps the deck, scratches the silver area to reveal the question, and everyone discusses it. Tap':'Il giocatore di turno tocca il mazzo, gratta l’area argentata per rivelare la domanda e tutti ne parlano. Tocca','when you are finished. The played card moves to the face-up pile and the turn moves to the next player.':'quando avete finito. La carta giocata passa nella pila a faccia in su e il turno passa al giocatore successivo.',
      '1 Player — Self Evaluation:':'1 Giocatore — Autovalutazione:','Play as if your partner is sitting across from you and asking you each question. Read every card as a question coming directly from your partner, answer it honestly from your own perspective, and reflect on what your answer tells you about yourself and your relationship. The questions keep the same partner wording as the regular game, so you do not need a separate solo question set. Tap':'Gioca come se il tuo partner fosse seduto di fronte a te e ti facesse ogni domanda. Leggi ogni carta come una domanda rivolta direttamente dal tuo partner, rispondi con sincerità dal tuo punto di vista e rifletti su ciò che la risposta ti dice di te e della tua relazione. Le domande mantengono la stessa formulazione del gioco normale, quindi non serve un mazzo separato per il gioco in solitaria. Tocca','when you are ready to continue.':'quando sei pronto a continuare.',
      'Communication':'Comunicazione','Trust':'Fiducia','Fun':'Divertimento','Intimacy':'Intimità','Money':'Denaro','Future':'Futuro','Conflict':'Conflitto','Deep Questions':'Domande Profonde','Digital Communication':'Comunicazione Digitale','Electronic Devices':'Dispositivi Elettronici','Social Media':'Social Media','AI Bot Relationships':'Relazioni con Bot IA','Shuffle All':'Mescola Tutto','Tap to open deck':'Tocca per aprire il mazzo',
      'Public Beta — Free for a Limited Time':'Beta Pubblica — Gratis per un Periodo Limitato','Create a free account to play, save your access, and help us learn which Relationship Games people use most.':'Crea un account gratuito per giocare, conservare il tuo accesso e aiutarci a capire quali Giochi Relazionali vengono usati di più.','Create Account':'Crea Account','Sign In':'Accedi','Username':'Nome Utente','Choose a username':'Scegli un nome utente','Email':'E-mail','Password':'Password','8–12 characters':'8–12 caratteri','Use 8–12 characters.':'Usa da 8 a 12 caratteri.','Send me One2OneLove updates, new games, and special offers. I can unsubscribe later.':'Inviami aggiornamenti One2OneLove, nuovi giochi e offerte speciali. Potrò annullare l’iscrizione in seguito.','I agree to the':'Accetto i','Terms of Service':'Termini di Servizio','and acknowledge the':'e prendo atto della','Privacy Policy':'Informativa sulla Privacy','Create Free Account & Play':'Crea Account Gratis e Gioca','Your password':'La tua password','Sign In & Play':'Accedi e Gioca','Forgot your password? Email':'Password dimenticata? Scrivi a','Signed in as':'Accesso effettuato come','Log out':'Esci',
      'Request failed':'Richiesta non riuscita','Could not create account.':'Impossibile creare l’account.','Could not sign in.':'Impossibile accedere.','Enter a valid email address.':'Inserisci un indirizzo e-mail valido.','Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens.':'Il nome utente deve avere da 3 a 24 caratteri e usare lettere, numeri, punti, trattini bassi o trattini.','Password must be 8–12 characters.':'La password deve avere da 8 a 12 caratteri.','You must agree to the Terms and Privacy Policy.':'Devi accettare i Termini e l’Informativa sulla Privacy.','Too many signup attempts. Please try again later.':'Troppi tentativi di registrazione. Riprova più tardi.','Too many login attempts. Please try again later.':'Troppi tentativi di accesso. Riprova più tardi.','Email and password are required.':'E-mail e password sono obbligatorie.','Email or password is incorrect.':'E-mail o password non corretti.','Sign in required':'Accesso richiesto','Card unavailable':'Carta non disponibile','Method not allowed':'Metodo non consentito','Invalid JSON':'JSON non valido','Invalid relationship type':'Tipo di relazione non valido','Invalid category':'Categoria non valida'
    },
    de: {
      'Scratch. Share. Grow Closer.':'Rubbeln. Teilen. Näher zusammenwachsen.',
      'A simple relationship conversation game. Pick a deck, draw a card, scratch it, and talk.':'Ein einfaches Gesprächsspiel für Paare. Wählt einen Stapel, zieht eine Karte, rubbelt sie frei und sprecht darüber.',
      'Start Game':'Spiel Starten','How to Play':'Spielanleitung','Install Game':'Spiel Installieren',
      'How many players?':'Wie viele Spieler?','Play solo for self-evaluation, as one couple, or as two couples. No scoring—just reflection and conversation.':'Spiele allein zur Selbsteinschätzung, als Paar oder als zwei Paare. Keine Punkte — nur Reflexion und Gespräche.',
      '1 Player':'1 Spieler','Self Evaluation':'Selbsteinschätzung','2 Players':'2 Spieler','One couple':'Ein Paar','4 Players':'4 Spieler','Two couples':'Zwei Paare','Back':'Zurück',
      'Choose Your Relationship':'Wählt Eure Beziehungsform','This tailors the questions to where you are together.':'Damit werden die Fragen an eure gemeinsame Phase angepasst.',
      'Dating':'Kennenlernphase','Getting to know each other':'Einander kennenlernen','Engaged':'Verlobt','Preparing for marriage':'Vorbereitung auf die Ehe','Married':'Verheiratet','Growing your marriage':'Eure Ehe stärken','Committed / Unmarried':'Fest Zusammen / Unverheiratet','Building a life together':'Gemeinsam ein Leben aufbauen',
      'Choose a Deck':'Wählt einen Stapel','Each category has its own colored card back.':'Jede Kategorie hat eine eigene Kartenfarbe.','Home':'Start','Communication Deck':'Kommunikations-Stapel','Change Deck':'Stapel Wechseln','Draw':'Ziehen','Played':'Gespielt','Tap the deck to draw.':'Tippe auf den Stapel, um eine Karte zu ziehen.','Next Card':'Nächste Karte',
      'Deck complete':'Stapel vollständig','Every question in this deck has been played.':'Alle Fragen in diesem Stapel wurden gespielt.','Choose Another Deck':'Anderen Stapel Wählen','Got It':'Verstanden',
      'Choose 1, 2, or 4 players':'Wählt 1, 2 oder 4 Spieler',', select your relationship type, then choose a relationship deck.':', wählt eure Beziehungsform und dann einen Beziehungsstapel.',
      '2 or 4 Players:':'2 oder 4 Spieler:','The active player taps the deck, scratches the silver area to reveal the question, and everyone discusses it. Tap':'Der aktive Spieler tippt auf den Stapel, rubbelt die silberne Fläche frei und alle sprechen über die Frage. Tippt auf','when you are finished. The played card moves to the face-up pile and the turn moves to the next player.':'wenn ihr fertig seid. Die gespielte Karte wandert offen auf den Ablagestapel und der nächste Spieler ist an der Reihe.',
      '1 Player — Self Evaluation:':'1 Spieler — Selbsteinschätzung:','Play as if your partner is sitting across from you and asking you each question. Read every card as a question coming directly from your partner, answer it honestly from your own perspective, and reflect on what your answer tells you about yourself and your relationship. The questions keep the same partner wording as the regular game, so you do not need a separate solo question set. Tap':'Spiele so, als säße dein Partner dir gegenüber und würde dir jede Frage stellen. Lies jede Karte als direkte Frage deines Partners, antworte ehrlich aus deiner eigenen Sicht und überlege, was deine Antwort über dich und eure Beziehung aussagt. Die Fragen behalten dieselbe Partner-Formulierung wie im normalen Spiel, daher brauchst du keinen separaten Solo-Fragensatz. Tippe auf','when you are ready to continue.':'wenn du bereit bist weiterzumachen.',
      'Communication':'Kommunikation','Trust':'Vertrauen','Fun':'Spaß','Intimacy':'Intimität','Money':'Geld','Future':'Zukunft','Conflict':'Konflikt','Deep Questions':'Tiefgehende Fragen','Digital Communication':'Digitale Kommunikation','Electronic Devices':'Elektronische Geräte','Social Media':'Soziale Medien','AI Bot Relationships':'Beziehungen zu KI-Bots','Shuffle All':'Alles Mischen','Tap to open deck':'Tippe, um den Stapel zu öffnen',
      'Public Beta — Free for a Limited Time':'Öffentliche Beta — Für Begrenzte Zeit Kostenlos','Create a free account to play, save your access, and help us learn which Relationship Games people use most.':'Erstelle ein kostenloses Konto, um zu spielen, deinen Zugang zu speichern und uns zu helfen zu verstehen, welche Beziehungsspiele am häufigsten genutzt werden.','Create Account':'Konto Erstellen','Sign In':'Anmelden','Username':'Benutzername','Choose a username':'Wähle einen Benutzernamen','Email':'E-Mail','Password':'Passwort','8–12 characters':'8–12 Zeichen','Use 8–12 characters.':'Verwende 8 bis 12 Zeichen.','Send me One2OneLove updates, new games, and special offers. I can unsubscribe later.':'Sende mir One2OneLove-Neuigkeiten, neue Spiele und Sonderangebote. Ich kann mich später abmelden.','I agree to the':'Ich akzeptiere die','Terms of Service':'Nutzungsbedingungen','and acknowledge the':'und nehme die','Privacy Policy':'Datenschutzrichtlinie','Create Free Account & Play':'Kostenloses Konto Erstellen & Spielen','Your password':'Dein Passwort','Sign In & Play':'Anmelden & Spielen','Forgot your password? Email':'Passwort vergessen? E-Mail an','Signed in as':'Angemeldet als','Log out':'Abmelden',
      'Request failed':'Anfrage fehlgeschlagen','Could not create account.':'Konto konnte nicht erstellt werden.','Could not sign in.':'Anmeldung fehlgeschlagen.','Enter a valid email address.':'Gib eine gültige E-Mail-Adresse ein.','Username must be 3–24 characters using letters, numbers, dots, underscores, or hyphens.':'Der Benutzername muss 3–24 Zeichen lang sein und darf Buchstaben, Zahlen, Punkte, Unterstriche oder Bindestriche enthalten.','Password must be 8–12 characters.':'Das Passwort muss 8–12 Zeichen lang sein.','You must agree to the Terms and Privacy Policy.':'Du musst den Nutzungsbedingungen und der Datenschutzrichtlinie zustimmen.','Too many signup attempts. Please try again later.':'Zu viele Registrierungsversuche. Bitte versuche es später erneut.','Too many login attempts. Please try again later.':'Zu viele Anmeldeversuche. Bitte versuche es später erneut.','Email and password are required.':'E-Mail und Passwort sind erforderlich.','Email or password is incorrect.':'E-Mail oder Passwort ist falsch.','Sign in required':'Anmeldung erforderlich','Card unavailable':'Karte nicht verfügbar','Method not allowed':'Methode nicht erlaubt','Invalid JSON':'Ungültiges JSON','Invalid relationship type':'Ungültige Beziehungsform','Invalid category':'Ungültige Kategorie'
    }
  };

  const currentFromUrl = new URLSearchParams(location.search).get('lang');
  let current = SUPPORTED.includes(currentFromUrl) ? currentFromUrl : (SUPPORTED.includes(localStorage.getItem('preferredLanguage')) ? localStorage.getItem('preferredLanguage') : 'en');
  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttrs = new WeakMap();
  let applying = false;

  function exact(key, lang=current){ return lang==='en' ? key : (MAP[lang]?.[key] || key); }
  function translateDynamic(value, lang=current){
    const raw=String(value ?? '');
    if(lang==='en') return raw;
    if(MAP[lang]?.[raw]) return MAP[lang][raw];

    let m=raw.match(/^Player (\d+)$/);
    if(m) return lang==='es'?`Jugador ${m[1]}`:lang==='fr'?`Joueur ${m[1]}`:lang==='it'?`Giocatore ${m[1]}`:`Spieler ${m[1]}`;

    m=raw.match(/^Player (\d+): tap the deck to draw\.$/);
    if(m) return lang==='es'?`Jugador ${m[1]}: toca el mazo para sacar una carta.`:lang==='fr'?`Joueur ${m[1]} : touchez le paquet pour tirer une carte.`:lang==='it'?`Giocatore ${m[1]}: tocca il mazzo per pescare una carta.`:`Spieler ${m[1]}: Tippe auf den Stapel, um eine Karte zu ziehen.`;

    m=raw.match(/^Player (\d+): scratch to reveal\.$/);
    if(m) return lang==='es'?`Jugador ${m[1]}: rasca para revelar.`:lang==='fr'?`Joueur ${m[1]} : grattez pour révéler.`:lang==='it'?`Giocatore ${m[1]}: gratta per rivelare.`:`Spieler ${m[1]}: Rubbeln zum Aufdecken.`;

    if(raw==='Drawing card…') return lang==='es'?'Sacando carta…':lang==='fr'?'Tirage de la carte…':lang==='it'?'Estrazione della carta…':'Karte wird gezogen…';
    if(raw==='Card unavailable. Tap the deck to try again.') return lang==='es'?'Carta no disponible. Toca el mazo para intentarlo de nuevo.':lang==='fr'?'Carte indisponible. Touchez le paquet pour réessayer.':lang==='it'?'Carta non disponibile. Tocca il mazzo per riprovare.':'Karte nicht verfügbar. Tippe auf den Stapel, um es erneut zu versuchen.';
    if(raw==='Self Evaluation: tap the deck to draw.') return lang==='es'?'Autoevaluación: toca el mazo para sacar una carta.':lang==='fr'?'Autoévaluation : touchez le paquet pour tirer une carte.':lang==='it'?'Autovalutazione: tocca il mazzo per pescare una carta.':'Selbsteinschätzung: Tippe auf den Stapel, um eine Karte zu ziehen.';

    const rels=['Dating','Engaged','Married','Committed / Unmarried'];
    const cats=['Communication','Trust','Fun','Intimacy','Money','Future','Conflict','Deep Questions','Digital Communication','Electronic Devices','Social Media','AI Bot Relationships','Shuffle All'];
    let out=raw;
    for(const item of [...rels,...cats]) out=out.split(item).join(exact(item,lang));
    out=out.replace(/Self Evaluation/g,exact('Self Evaluation',lang));
    if(lang==='es') out=out.replace(/\bDeck\b/g,'Mazo');
    if(lang==='fr') out=out.replace(/\bDeck\b/g,'Paquet');
    if(lang==='it') out=out.replace(/\bDeck\b/g,'Mazzo');
    if(lang==='de') out=out.replace(/\bDeck\b/g,'Stapel');
    return out;
  }

  function translateTextNode(node){
    if(!node || node.nodeType!==Node.TEXT_NODE) return;
    if(['SCRIPT','STYLE','NOSCRIPT'].includes(node.parentElement?.tagName)) return;
    const rendered=renderedText.get(node);
    if(rendered===undefined || node.data!==rendered) originalText.set(node,node.data);
    const original=originalText.get(node) ?? node.data;
    const lead=original.match(/^\s*/)?.[0]||'';
    const trail=original.match(/\s*$/)?.[0]||'';
    const core=original.trim();
    if(!core){renderedText.set(node,node.data);return;}
    const next=lead+translateDynamic(core)+trail;
    renderedText.set(node,next);
    if(node.data!==next) node.data=next;
  }

  function translateAttributes(el){
    if(!(el instanceof Element)) return;
    let rec=originalAttrs.get(el);
    if(!rec){rec={};originalAttrs.set(el,rec);}
    for(const attr of ['placeholder','aria-label','title']){
      const v=el.getAttribute(attr);
      if(v==null) continue;
      if(rec[attr]===undefined || v!==rec[attr].rendered){
        rec[attr]={original:v,rendered:v};
      }
      const next=translateDynamic(rec[attr].original);
      rec[attr].rendered=next;
      if(v!==next) el.setAttribute(attr,next);
    }
  }

  function translateTree(root=document.body){
    applying=true;
    try{
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      let n;
      while((n=walker.nextNode())) translateTextNode(n);
      if(root instanceof Element) translateAttributes(root);
      root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(translateAttributes);
      document.documentElement.lang=current;
    }finally{applying=false;}
  }

  function addPicker(){
    if(document.getElementById('o2olLanguagePicker')) return;
    const wrap=document.createElement('div');
    wrap.id='o2olLanguagePicker';
    wrap.setAttribute('aria-label','Language');
    wrap.innerHTML='<select aria-label="Language"></select>';
    const sel=wrap.querySelector('select');
    for(const code of SUPPORTED){
      const opt=document.createElement('option'); opt.value=code; opt.textContent=NAMES[code]; sel.appendChild(opt);
    }
    sel.value=current;
    sel.addEventListener('change',()=>setLanguage(sel.value));
    const style=document.createElement('style');
    style.textContent=`
      #o2olLanguagePicker{position:fixed;left:10px;top:10px;z-index:12000;font-family:Arial,Helvetica,sans-serif}
      #o2olLanguagePicker select{background:rgba(255,255,255,.97);color:#0a3f72;border:1px solid #bfd0db;border-radius:999px;padding:8px 30px 8px 11px;font-weight:800;box-shadow:0 4px 14px #0002}
      html[lang="es"] .player.active:after{content:"TU TURNO"}
      html[lang="fr"] .player.active:after{content:"À TON TOUR"}
      html[lang="it"] .player.active:after{content:"TOCCA A TE"}
      html[lang="de"] .player.active:after{content:"DU BIST DRAN"}
      @media(max-width:600px){#o2olLanguagePicker{left:6px;top:6px}#o2olLanguagePicker select{max-width:126px;padding:7px 24px 7px 9px;font-size:12px}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(wrap);
  }

  function setLanguage(lang){
    if(!SUPPORTED.includes(lang)) lang='en';
    current=lang;
    localStorage.setItem('preferredLanguage',lang);
    const url=new URL(location.href);
    if(url.searchParams.get('lang')!==lang){
      url.searchParams.set('lang',lang);
      history.replaceState(null,'',url);
    }
    const picker=document.querySelector('#o2olLanguagePicker select');
    if(picker) picker.value=lang;
    translateTree(document.body);
    window.dispatchEvent(new CustomEvent('o2ol-language-change',{detail:{language:lang}}));
  }

  const observer=new MutationObserver(mutations=>{
    if(applying) return;
    for(const m of mutations){
      if(m.type==='characterData') translateTextNode(m.target);
      else if(m.type==='childList') for(const n of m.addedNodes){
        if(n.nodeType===Node.TEXT_NODE) translateTextNode(n);
        else if(n instanceof Element) translateTree(n);
      }
      else if(m.type==='attributes') translateAttributes(m.target);
    }
  });

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    try{
      const url=typeof input==='string'?input:input?.url||'';
      if(url.includes('/api/draw-question') && init?.body && typeof init.body==='string'){
        const body=JSON.parse(init.body); body.language=current;
        init={...init,body:JSON.stringify(body),headers:{...(init.headers||{}),'Accept-Language':current}};
      }
    }catch{}
    return nativeFetch(input,init);
  };

  const proto=window.CanvasRenderingContext2D?.prototype;
  if(proto && !proto.__o2olI18nPatched){
    const nativeFill=proto.fillText, nativeStroke=proto.strokeText;
    proto.fillText=function(text,...rest){return nativeFill.call(this,translateDynamic(text),...rest);};
    proto.strokeText=function(text,...rest){return nativeStroke.call(this,translateDynamic(text),...rest);};
    proto.__o2olI18nPatched=true;
  }

  window.O2OLI18N={getLanguage:()=>current,setLanguage,t:translateDynamic,exact};

  function boot(){
    addPicker();
    translateTree(document.body);
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();