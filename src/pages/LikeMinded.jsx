import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ChevronRight, Copy, Globe2, HeartHandshake,
  LockKeyhole, MessageCircle, Radio, RotateCcw, ShieldCheck, Sparkles,
  Trophy, UserRound, Users, Coins
} from 'lucide-react';
import { useLanguage } from './Layout';
import { useAuth } from '@/contexts/AuthContext';
import { createPageUrl } from '@/utils';
import { getTokenWallet, isTokensRequiredError, tokenRequiredDetails } from '@/lib/tokenService';
import UnlockPriceDialog from '@/components/pricing/UnlockPriceDialog';

const LANGS = ['en','es','fr','it','de'];

const UI = {
  en: {
    eyebrow:'A One2OneLove connection game', title:'Like Minded?', tagline:'Same questions. Deeper connections.',
    intro:'Find out where you naturally align, where you see life differently, and what is worth talking about.',
    solo:'Solo Self-Check', soloBody:'Answer privately and learn more about your own preferences, values and instincts.',
    invite:'Play With Someone', inviteBody:'Invite someone you already know. Both answers stay private until both people lock in.',
    lobby:'Player Lobby', lobbyBody:'See who is available right now and invite someone to a Like Minded game.',
    how:'How it works', choose:'Choose', lock:'Lock', reveal:'Reveal', connect:'Connect',
    how1:'Both players get the same underlying question.', how2:'Each person answers privately and locks the answer.',
    how3:'Nothing is revealed until both answers are locked.', how4:'See the match, the difference and your running score.',
    mature:'Private by design', matureBody:'No answer peeking. No changing an answer after lock. No exact location sharing.',
    multilingual:'Play across languages', multilingualBody:'Each player can use English, Spanish, French, Italian or German while sharing the same question ID.',
    categories:'Choose a starting category', depth:'Choose your question depth', easy:'Easy', real:'Real', deep:'Deep',
    begin:'Begin', question:'Question', set:'Set', locked:'Answer locked', lockAnswer:'Done — Lock My Answer',
    chooseAnswer:'Choose an answer first', nextCategory:'Choose the next category', nextQuestion:'Give Me a Question',
    ease:'Ease Up', turnUp:'Turn It Up', checkpoint:'Set complete', checkpointBody:'You completed 21 questions.',
    keepPlaying:'Keep Playing', finish:'Finish Self-Check', yourAnswer:'Your answer', waiting:'Waiting for the other player…',
    room:'Game Room', roomCode:'Room code', copyInvite:'Copy Invite Link', copied:'Copied', player2:'Waiting for Player 2',
    createRoom:'Create Invitation', joinRoom:'Join a Room', join:'Join', codePlaceholder:'Enter room code',
    signin:'Sign in to use multiplayer', signinBody:'Create a free verified O2OL account, then use Credit to start a Like Minded session.',
    available:'Available now', lobbyEmpty:'No other players are available right now.', leaveLobby:'Leave Player Lobby',
    location:'General location', city:'City', state:'State / Region (optional)', country:'Country', enterLobby:'Enter Player Lobby',
    locationNote:'Only your first name and general location are shown. Never your street address or precise location.',
    inviteToPlay:'Invite to Play', block:'Block', report:'Report', score:'Like-Minded Score', matches:'matches',
    talk:'Talk About It', talkPrompt:'What made each of you choose that answer?', difference:'Different answers', match:'You matched', back:'Back to Relationship Games',
    category:'Category', questionDepth:'Depth', reset:'Start Over', unavailable:'Multiplayer service is not available in this preview yet.', premium:'Premium Credit Game',premiumBody:'Like Minded uses Credit. One purchase opens a timed play session; you are not charged again while that pass remains active.',buyTokens:'Add Credit To Access',startPremium:'Start Credit Session',
    categoriesList:['Relationship Goals','Communication','Values','Family','Lifestyle','Money & Ambition','Boundaries','Future Priorities','Fun Scenarios','Humor','Activities','Food & Travel','Entertainment','Daily Preferences','Wild Card']
  },
  es: {
    eyebrow:'Un juego de conexión de One2OneLove', title:'¿Piensan Igual?', tagline:'Las mismas preguntas. Conexiones más profundas.',
    intro:'Descubre dónde coinciden naturalmente, dónde ven la vida de forma diferente y qué vale la pena conversar.',
    solo:'Autoevaluación', soloBody:'Responde en privado y conoce mejor tus preferencias, valores e instintos.',
    invite:'Jugar con Alguien', inviteBody:'Invita a alguien que ya conoces. Las respuestas siguen privadas hasta que ambos las bloqueen.',
    lobby:'Sala de Jugadores', lobbyBody:'Mira quién está disponible e invita a alguien a una partida.',
    how:'Cómo funciona', choose:'Elegir', lock:'Bloquear', reveal:'Revelar', connect:'Conectar',
    how1:'Ambos reciben la misma pregunta base.', how2:'Cada persona responde en privado y bloquea su respuesta.',
    how3:'Nada se revela hasta que ambos hayan bloqueado.', how4:'Ve coincidencias, diferencias y la puntuación acumulada.',
    mature:'Privado por diseño', matureBody:'Sin ver respuestas ajenas. Sin cambiar después de bloquear. Sin ubicación exacta.',
    multilingual:'Juega entre idiomas', multilingualBody:'Cada jugador puede usar inglés, español, francés, italiano o alemán con la misma pregunta.',
    categories:'Elige una categoría inicial', depth:'Elige la profundidad', easy:'Fácil', real:'Real', deep:'Profundo',
    begin:'Comenzar', question:'Pregunta', set:'Serie', locked:'Respuesta bloqueada', lockAnswer:'Listo — Bloquear Mi Respuesta',
    chooseAnswer:'Elige una respuesta primero', nextCategory:'Elige la siguiente categoría', nextQuestion:'Dame una Pregunta',
    ease:'Más Suave', turnUp:'Más Profundo', checkpoint:'Serie completada', checkpointBody:'Completaste 21 preguntas.',
    keepPlaying:'Seguir Jugando', finish:'Finalizar', yourAnswer:'Tu respuesta', waiting:'Esperando al otro jugador…',
    room:'Sala de Juego', roomCode:'Código', copyInvite:'Copiar Enlace', copied:'Copiado', player2:'Esperando al Jugador 2',
    createRoom:'Crear Invitación', joinRoom:'Unirse a una Sala', join:'Unirse', codePlaceholder:'Ingresa el código',
    signin:'Inicia sesión para multijugador', signinBody:'Crea una cuenta O2OL gratuita y verificada, luego usa Crédito para iniciar una sesión de Like Minded.',
    available:'Disponibles ahora', lobbyEmpty:'No hay otros jugadores disponibles ahora.', leaveLobby:'Salir de la Sala',
    location:'Ubicación general', city:'Ciudad', state:'Estado / Región (opcional)', country:'País', enterLobby:'Entrar a la Sala',
    locationNote:'Solo se muestra tu nombre y ubicación general. Nunca tu dirección ni ubicación exacta.',
    inviteToPlay:'Invitar a Jugar', block:'Bloquear', report:'Reportar', score:'Puntuación Like-Minded', matches:'coincidencias',
    talk:'Hablar de Esto', talkPrompt:'¿Qué hizo que cada uno eligiera esa respuesta?', difference:'Respuestas diferentes', match:'Coincidieron', back:'Volver a Juegos',
    category:'Categoría', questionDepth:'Profundidad', reset:'Empezar de Nuevo', unavailable:'El servicio multijugador aún no está disponible en esta vista previa.', premium:'Juego Premium con Crédito',premiumBody:'Like Minded usa Crédito. Una compra abre una sesión temporal; no vuelves a pagar mientras el pase siga activo.',buyTokens:'Agregar Crédito para Acceder',startPremium:'Iniciar Sesión con Crédito',
    categoriesList:['Metas de Relación','Comunicación','Valores','Familia','Estilo de Vida','Dinero y Ambición','Límites','Prioridades Futuras','Escenarios Divertidos','Humor','Actividades','Comida y Viajes','Entretenimiento','Preferencias Diarias','Comodín']
  },
  fr: {
    eyebrow:'Un jeu de connexion One2OneLove', title:'Même Longueur d’Onde ?', tagline:'Les mêmes questions. Des liens plus profonds.',
    intro:'Découvrez où vous vous accordez naturellement, où vos points de vue diffèrent et ce qui mérite une conversation.',
    solo:'Auto-évaluation', soloBody:'Répondez en privé pour mieux comprendre vos préférences, valeurs et instincts.',
    invite:'Jouer avec Quelqu’un', inviteBody:'Invitez une personne que vous connaissez. Les réponses restent privées jusqu’au verrouillage des deux joueurs.',
    lobby:'Salon des Joueurs', lobbyBody:'Voyez qui est disponible et invitez quelqu’un à jouer.',
    how:'Comment ça marche', choose:'Choisir', lock:'Verrouiller', reveal:'Révéler', connect:'Échanger',
    how1:'Les deux joueurs reçoivent la même question de base.', how2:'Chacun répond en privé puis verrouille sa réponse.',
    how3:'Rien n’est révélé avant les deux verrouillages.', how4:'Découvrez les accords, différences et votre score.',
    mature:'Privé par conception', matureBody:'Pas d’aperçu des réponses. Aucun changement après verrouillage. Aucune localisation précise.',
    multilingual:'Jouez entre langues', multilingualBody:'Chaque joueur peut utiliser anglais, espagnol, français, italien ou allemand avec le même identifiant de question.',
    categories:'Choisissez une catégorie de départ', depth:'Choisissez la profondeur', easy:'Léger', real:'Vrai', deep:'Profond',
    begin:'Commencer', question:'Question', set:'Série', locked:'Réponse verrouillée', lockAnswer:'Terminé — Verrouiller Ma Réponse',
    chooseAnswer:'Choisissez d’abord une réponse', nextCategory:'Choisissez la prochaine catégorie', nextQuestion:'Donnez-moi une Question',
    ease:'Alléger', turnUp:'Approfondir', checkpoint:'Série terminée', checkpointBody:'Vous avez répondu à 21 questions.',
    keepPlaying:'Continuer', finish:'Terminer', yourAnswer:'Votre réponse', waiting:'En attente de l’autre joueur…',
    room:'Salle de Jeu', roomCode:'Code', copyInvite:'Copier le Lien', copied:'Copié', player2:'En attente du Joueur 2',
    createRoom:'Créer une Invitation', joinRoom:'Rejoindre une Salle', join:'Rejoindre', codePlaceholder:'Entrez le code',
    signin:'Connectez-vous pour le multijoueur', signinBody:'Créez un compte O2OL gratuit et vérifié, puis utilisez des Crédit pour démarrer une session Like Minded.',
    available:'Disponibles maintenant', lobbyEmpty:'Aucun autre joueur n’est disponible.', leaveLobby:'Quitter le Salon',
    location:'Localisation générale', city:'Ville', state:'État / Région (facultatif)', country:'Pays', enterLobby:'Entrer dans le Salon',
    locationNote:'Seuls votre prénom et votre localisation générale sont visibles. Jamais votre adresse précise.',
    inviteToPlay:'Inviter à Jouer', block:'Bloquer', report:'Signaler', score:'Score Like-Minded', matches:'accords',
    talk:'En Parler', talkPrompt:'Pourquoi chacun de vous a-t-il choisi cette réponse ?', difference:'Réponses différentes', match:'Vous êtes d’accord', back:'Retour aux Jeux',
    category:'Catégorie', questionDepth:'Profondeur', reset:'Recommencer', unavailable:'Le service multijoueur n’est pas encore disponible dans cet aperçu.', premium:'Jeu Premium à Jetons',premiumBody:'Like Minded utilise des Crédit. Un achat ouvre une session de jeu limitée dans le temps; aucun nouveau débit tant que le pass reste actif.',buyTokens:'Ajouter du Crédit pour Accéder',startPremium:'Démarrer la Session',
    categoriesList:['Objectifs Relationnels','Communication','Valeurs','Famille','Style de Vie','Argent & Ambition','Limites','Priorités Futures','Scénarios Amusants','Humour','Activités','Cuisine & Voyage','Divertissement','Préférences Quotidiennes','Joker']
  },
  it: {
    eyebrow:'Un gioco di connessione One2OneLove', title:'Sulla Stessa Lunghezza d’Onda?', tagline:'Le stesse domande. Connessioni più profonde.',
    intro:'Scopri dove siete naturalmente allineati, dove vedete la vita diversamente e cosa vale la pena discutere.',
    solo:'Auto-valutazione', soloBody:'Rispondi in privato e scopri di più sulle tue preferenze, valori e istinti.',
    invite:'Gioca con Qualcuno', inviteBody:'Invita qualcuno che conosci. Le risposte restano private finché entrambi non le bloccano.',
    lobby:'Sala Giocatori', lobbyBody:'Vedi chi è disponibile e invita qualcuno a giocare.',
    how:'Come funziona', choose:'Scegli', lock:'Blocca', reveal:'Rivela', connect:'Confronta',
    how1:'Entrambi ricevono la stessa domanda di base.', how2:'Ognuno risponde in privato e blocca la risposta.',
    how3:'Nulla viene rivelato finché entrambi non hanno bloccato.', how4:'Scopri corrispondenze, differenze e punteggio.',
    mature:'Privato per design', matureBody:'Nessuna anteprima. Nessuna modifica dopo il blocco. Nessuna posizione precisa.',
    multilingual:'Gioca tra lingue', multilingualBody:'Ogni giocatore può usare inglese, spagnolo, francese, italiano o tedesco con lo stesso ID domanda.',
    categories:'Scegli una categoria iniziale', depth:'Scegli la profondità', easy:'Facile', real:'Reale', deep:'Profondo',
    begin:'Inizia', question:'Domanda', set:'Serie', locked:'Risposta bloccata', lockAnswer:'Fatto — Blocca la Mia Risposta',
    chooseAnswer:'Scegli prima una risposta', nextCategory:'Scegli la prossima categoria', nextQuestion:'Dammi una Domanda',
    ease:'Più Leggero', turnUp:'Più Profondo', checkpoint:'Serie completata', checkpointBody:'Hai completato 21 domande.',
    keepPlaying:'Continua', finish:'Termina', yourAnswer:'La tua risposta', waiting:'In attesa dell’altro giocatore…',
    room:'Stanza di Gioco', roomCode:'Codice', copyInvite:'Copia Link', copied:'Copiato', player2:'In attesa del Giocatore 2',
    createRoom:'Crea Invito', joinRoom:'Entra in una Stanza', join:'Entra', codePlaceholder:'Inserisci il codice',
    signin:'Accedi per il multigiocatore', signinBody:'Crea un account O2OL gratuito e verificato, quindi usa Credito per avviare una sessione Like Minded.',
    available:'Disponibili ora', lobbyEmpty:'Nessun altro giocatore è disponibile.', leaveLobby:'Esci dalla Lobby',
    location:'Posizione generale', city:'Città', state:'Stato / Regione (opzionale)', country:'Paese', enterLobby:'Entra nella Lobby',
    locationNote:'Vengono mostrati solo nome e posizione generale. Mai indirizzo o posizione precisa.',
    inviteToPlay:'Invita a Giocare', block:'Blocca', report:'Segnala', score:'Punteggio Like-Minded', matches:'corrispondenze',
    talk:'Parlatene', talkPrompt:'Cosa ha portato ciascuno di voi a scegliere quella risposta?', difference:'Risposte diverse', match:'Corrispondenza', back:'Torna ai Giochi',
    category:'Categoria', questionDepth:'Profondità', reset:'Ricomincia', unavailable:'Il servizio multigiocatore non è ancora disponibile in questa anteprima.', premium:'Gioco Premium a Token',premiumBody:'Like Minded usa Credito. Un acquisto apre una sessione temporanea; nessun nuovo addebito finché il pass resta attivo.',buyTokens:'Aggiungi Credito per Accedere',startPremium:'Avvia Sessione Token',
    categoriesList:['Obiettivi di Coppia','Comunicazione','Valori','Famiglia','Stile di Vita','Denaro & Ambizione','Confini','Priorità Future','Scenari Divertenti','Umorismo','Attività','Cibo & Viaggi','Intrattenimento','Preferenze Quotidiane','Jolly']
  },
  de: {
    eyebrow:'Ein One2OneLove Verbindungsspiel', title:'Gleich Gesinnt?', tagline:'Die gleichen Fragen. Tiefere Verbindungen.',
    intro:'Findet heraus, wo ihr natürlich übereinstimmt, wo ihr anders denkt und worüber sich ein Gespräch lohnt.',
    solo:'Selbst-Check', soloBody:'Antworte privat und lerne deine Vorlieben, Werte und Instinkte besser kennen.',
    invite:'Mit Jemandem Spielen', inviteBody:'Lade jemanden ein, den du kennst. Beide Antworten bleiben privat, bis beide gesperrt sind.',
    lobby:'Spieler-Lobby', lobbyBody:'Sieh, wer verfügbar ist, und lade jemanden zum Spiel ein.',
    how:'So funktioniert es', choose:'Wählen', lock:'Sperren', reveal:'Aufdecken', connect:'Austauschen',
    how1:'Beide erhalten dieselbe zugrunde liegende Frage.', how2:'Jeder antwortet privat und sperrt die Antwort.',
    how3:'Nichts wird gezeigt, bevor beide gesperrt haben.', how4:'Seht Übereinstimmungen, Unterschiede und euren Punktestand.',
    mature:'Privat entwickelt', matureBody:'Kein Spicken. Keine Änderung nach dem Sperren. Keine genaue Standortfreigabe.',
    multilingual:'Sprachübergreifend spielen', multilingualBody:'Jeder kann Englisch, Spanisch, Französisch, Italienisch oder Deutsch nutzen – mit derselben Frage-ID.',
    categories:'Startkategorie wählen', depth:'Fragetiefe wählen', easy:'Leicht', real:'Echt', deep:'Tief',
    begin:'Starten', question:'Frage', set:'Runde', locked:'Antwort gesperrt', lockAnswer:'Fertig — Meine Antwort Sperren',
    chooseAnswer:'Wähle zuerst eine Antwort', nextCategory:'Nächste Kategorie wählen', nextQuestion:'Gib Mir Eine Frage',
    ease:'Leichter', turnUp:'Tiefer', checkpoint:'Runde abgeschlossen', checkpointBody:'Du hast 21 Fragen beantwortet.',
    keepPlaying:'Weiterspielen', finish:'Selbst-Check Beenden', yourAnswer:'Deine Antwort', waiting:'Warte auf die andere Person…',
    room:'Spielraum', roomCode:'Raumcode', copyInvite:'Einladungslink Kopieren', copied:'Kopiert', player2:'Warte auf Spieler 2',
    createRoom:'Einladung Erstellen', joinRoom:'Raum Beitreten', join:'Beitreten', codePlaceholder:'Raumcode eingeben',
    signin:'Für Mehrspieler anmelden', signinBody:'Erstelle ein kostenloses verifiziertes O2OL-Konto und verwende dann Credit, um eine Like Minded-Sitzung zu starten.',
    available:'Jetzt verfügbar', lobbyEmpty:'Zurzeit sind keine anderen Spieler verfügbar.', leaveLobby:'Lobby Verlassen',
    location:'Allgemeiner Standort', city:'Stadt', state:'Bundesland / Region (optional)', country:'Land', enterLobby:'Lobby Betreten',
    locationNote:'Nur Vorname und allgemeiner Standort werden gezeigt. Niemals Straße oder genauer Standort.',
    inviteToPlay:'Zum Spielen Einladen', block:'Blockieren', report:'Melden', score:'Like-Minded Score', matches:'Treffer',
    talk:'Darüber Reden', talkPrompt:'Was hat euch jeweils zu dieser Antwort gebracht?', difference:'Unterschiedliche Antworten', match:'Ihr stimmt überein', back:'Zurück zu Spielen',
    category:'Kategorie', questionDepth:'Tiefe', reset:'Neu Starten', unavailable:'Der Mehrspieler-Dienst ist in dieser Vorschau noch nicht verfügbar.', premium:'Premium-Credit-Spiel',premiumBody:'Like Minded verwendet Credit. Ein Kauf öffnet eine zeitlich begrenzte Spielsitzung; solange der Pass aktiv ist, wird nicht erneut berechnet.',buyTokens:'Credit Hinzufügen für Zugriff',startPremium:'Token-Sitzung Starten',
    categoriesList:['Beziehungsziele','Kommunikation','Werte','Familie','Lebensstil','Geld & Ehrgeiz','Grenzen','Zukunftsprioritäten','Spaßszenarien','Humor','Aktivitäten','Essen & Reisen','Unterhaltung','Alltagsvorlieben','Wildcard']
  }
};

const CANONICAL_CATEGORIES = [
  'Relationship Goals','Communication','Values','Family','Lifestyle','Money & Ambition','Boundaries',
  'Future Priorities','Fun Scenarios','Humor','Activities','Food & Travel','Entertainment','Daily Preferences','Wild Card'
];

const QUESTIONS = {
  'Relationship Goals': {
    easy:{en:'What sounds like the best kind of relationship weekend?',es:'¿Qué suena como el mejor fin de semana en pareja?',fr:'Quel serait le meilleur week-end en couple ?',it:'Quale sarebbe il miglior weekend di coppia?',de:'Wie sieht das beste Beziehungswochenende aus?'},
    real:{en:'How important is it that partners share the same long-term relationship goals?',es:'¿Qué tan importante es compartir las mismas metas de relación a largo plazo?',fr:'Est-il important de partager les mêmes objectifs relationnels à long terme ?',it:'Quanto è importante condividere gli stessi obiettivi di coppia a lungo termine?',de:'Wie wichtig sind gemeinsame langfristige Beziehungsziele?'},
    deep:{en:'If love is strong but your future plans conflict, what should carry more weight?',es:'Si el amor es fuerte pero los planes de futuro chocan, ¿qué debería pesar más?',fr:'Si l’amour est fort mais que vos projets d’avenir s’opposent, qu’est-ce qui compte le plus ?',it:'Se l’amore è forte ma i progetti futuri sono in conflitto, cosa dovrebbe pesare di più?',de:'Wenn die Liebe stark ist, aber Zukunftspläne kollidieren, was sollte mehr zählen?'}
  },
  'Communication': {
    easy:{en:'When something bothers you, when do you prefer to talk about it?',es:'Cuando algo te molesta, ¿cuándo prefieres hablarlo?',fr:'Quand quelque chose vous dérange, quand préférez-vous en parler ?',it:'Quando qualcosa ti disturba, quando preferisci parlarne?',de:'Wenn dich etwas stört, wann sprichst du am liebsten darüber?'},
    real:{en:'What matters more during a disagreement?',es:'¿Qué importa más durante un desacuerdo?',fr:'Qu’est-ce qui compte le plus pendant un désaccord ?',it:'Cosa conta di più durante un disaccordo?',de:'Was zählt bei einer Meinungsverschiedenheit mehr?'},
    deep:{en:'If your partner feels unheard but you believe you explained yourself clearly, what comes next?',es:'Si tu pareja se siente ignorada pero crees que te explicaste bien, ¿qué sigue?',fr:'Si votre partenaire ne se sent pas entendu mais que vous pensez avoir été clair, que faites-vous ?',it:'Se il partner non si sente ascoltato ma pensi di esserti spiegato bene, cosa fai?',de:'Wenn dein Partner sich nicht gehört fühlt, du dich aber klar erklärt hast – was dann?'}
  },
  'Values': {
    easy:{en:'Which quality do you admire most in a partner?',es:'¿Qué cualidad admiras más en una pareja?',fr:'Quelle qualité admirez-vous le plus chez un partenaire ?',it:'Quale qualità ammiri di più in un partner?',de:'Welche Eigenschaft bewunderst du bei einem Partner am meisten?'},
    real:{en:'How much should shared values matter compared with shared interests?',es:'¿Cuánto deberían importar los valores compartidos frente a los intereses compartidos?',fr:'Quelle importance donner aux valeurs communes par rapport aux intérêts communs ?',it:'Quanto contano i valori condivisi rispetto agli interessi comuni?',de:'Wie wichtig sind gemeinsame Werte im Vergleich zu gemeinsamen Interessen?'},
    deep:{en:'Could you build a lasting relationship with someone whose core values differ from yours?',es:'¿Podrías construir una relación duradera con alguien cuyos valores centrales difieren?',fr:'Pourriez-vous construire une relation durable avec quelqu’un dont les valeurs fondamentales diffèrent ?',it:'Potresti costruire una relazione duratura con valori fondamentali diversi?',de:'Könntest du eine dauerhafte Beziehung mit deutlich anderen Grundwerten führen?'}
  },
  'Family': {
    easy:{en:'How do you feel about frequent family gatherings?',es:'¿Qué opinas de las reuniones familiares frecuentes?',fr:'Que pensez-vous des réunions de famille fréquentes ?',it:'Cosa pensi delle riunioni familiari frequenti?',de:'Wie findest du häufige Familientreffen?'},
    real:{en:'How much influence should extended family have on a couple’s decisions?',es:'¿Cuánta influencia debería tener la familia extendida en las decisiones de pareja?',fr:'Quelle influence la famille élargie devrait-elle avoir sur les décisions du couple ?',it:'Quanta influenza dovrebbe avere la famiglia allargata sulle decisioni di coppia?',de:'Wie viel Einfluss sollte die Großfamilie auf Paarentscheidungen haben?'},
    deep:{en:'If your family strongly disapproved of your partner, what would matter most?',es:'Si tu familia desaprobara fuertemente a tu pareja, ¿qué importaría más?',fr:'Si votre famille désapprouvait fortement votre partenaire, qu’est-ce qui compterait le plus ?',it:'Se la tua famiglia disapprovasse fortemente il partner, cosa conterebbe di più?',de:'Wenn deine Familie deinen Partner stark ablehnt, was wäre am wichtigsten?'}
  },
  'Lifestyle': {
    easy:{en:'Which pace of life feels best to you?',es:'¿Qué ritmo de vida te sienta mejor?',fr:'Quel rythme de vie vous convient le mieux ?',it:'Quale ritmo di vita ti fa stare meglio?',de:'Welches Lebenstempo passt am besten zu dir?'},
    real:{en:'How important is it for partners to have similar daily routines?',es:'¿Qué tan importante es tener rutinas diarias similares?',fr:'Est-il important que les partenaires aient des routines quotidiennes similaires ?',it:'Quanto è importante avere routine quotidiane simili?',de:'Wie wichtig sind ähnliche Tagesabläufe?'},
    deep:{en:'Could you be happy long-term with someone whose ideal lifestyle is very different from yours?',es:'¿Podrías ser feliz a largo plazo con alguien cuyo estilo de vida ideal es muy diferente?',fr:'Pourriez-vous être heureux à long terme avec quelqu’un au mode de vie idéal très différent ?',it:'Potresti essere felice a lungo con uno stile di vita ideale molto diverso?',de:'Könntest du langfristig mit einem sehr anderen idealen Lebensstil glücklich sein?'}
  },
  'Money & Ambition': {
    easy:{en:'What sounds better after receiving an unexpected $1,000?',es:'¿Qué suena mejor después de recibir $1,000 inesperados?',fr:'Que feriez-vous avec 1 000 $ inattendus ?',it:'Cosa faresti con 1.000 dollari inattesi?',de:'Was klingt nach unerwarteten 1.000 $ besser?'},
    real:{en:'How should couples handle money when one person earns much more?',es:'¿Cómo debería manejarse el dinero cuando uno gana mucho más?',fr:'Comment gérer l’argent quand l’un gagne beaucoup plus ?',it:'Come gestire il denaro quando uno guadagna molto di più?',de:'Wie sollte Geld gehandhabt werden, wenn einer deutlich mehr verdient?'},
    deep:{en:'Would you support a partner taking a major financial risk for a dream?',es:'¿Apoyarías a tu pareja al asumir un gran riesgo financiero por un sueño?',fr:'Soutiendriez-vous un partenaire prenant un grand risque financier pour un rêve ?',it:'Sosterresti un partner che prende un grande rischio finanziario per un sogno?',de:'Würdest du einen großen finanziellen Risikoschritt für den Traum deines Partners unterstützen?'}
  },
  'Boundaries': {
    easy:{en:'How much alone time feels healthy in a relationship?',es:'¿Cuánto tiempo a solas parece saludable en una relación?',fr:'Combien de temps seul semble sain dans une relation ?',it:'Quanto tempo da soli è sano in una relazione?',de:'Wie viel Alleinzeit ist in einer Beziehung gesund?'},
    real:{en:'Should partners ever read each other’s private messages?',es:'¿Deberían las parejas leer alguna vez los mensajes privados del otro?',fr:'Les partenaires devraient-ils lire les messages privés de l’autre ?',it:'I partner dovrebbero mai leggere i messaggi privati dell’altro?',de:'Sollten Partner jemals private Nachrichten des anderen lesen?'},
    deep:{en:'What should happen when a boundary feels unreasonable to one partner but essential to the other?',es:'¿Qué debería pasar cuando un límite parece irrazonable para uno pero esencial para el otro?',fr:'Que faire lorsqu’une limite semble déraisonnable à l’un mais essentielle à l’autre ?',it:'Cosa fare quando un confine sembra irragionevole a uno ma essenziale all’altro?',de:'Was sollte passieren, wenn eine Grenze für einen unvernünftig, für den anderen aber wesentlich ist?'}
  },
  'Future Priorities': {
    easy:{en:'Which future goal sounds most exciting?',es:'¿Qué meta futura suena más emocionante?',fr:'Quel objectif futur vous enthousiasme le plus ?',it:'Quale obiettivo futuro ti entusiasma di più?',de:'Welches Zukunftsziel klingt am spannendsten?'},
    real:{en:'How far ahead should couples actively plan together?',es:'¿Con cuánta anticipación deberían planificar juntos?',fr:'Jusqu’où un couple devrait-il planifier ensemble ?',it:'Quanto avanti dovrebbe pianificare insieme una coppia?',de:'Wie weit im Voraus sollten Paare gemeinsam planen?'},
    deep:{en:'If only one major life dream could happen, how should a couple decide whose dream leads?',es:'Si solo pudiera cumplirse un gran sueño, ¿cómo decidir cuál priorizar?',fr:'Si un seul grand rêve pouvait se réaliser, comment décider lequel prioriser ?',it:'Se potesse realizzarsi un solo grande sogno, come decidere quale?',de:'Wenn nur ein großer Lebenstraum möglich wäre, wie sollte ein Paar entscheiden?'}
  },
  'Fun Scenarios': {
    easy:{en:'You get a free weekend trip. What do you choose?',es:'Ganas un viaje gratis de fin de semana. ¿Qué eliges?',fr:'Vous gagnez un week-end gratuit. Que choisissez-vous ?',it:'Vinci un weekend gratis. Cosa scegli?',de:'Ihr gewinnt ein kostenloses Wochenende. Was wählst du?'},
    real:{en:'A surprise plan goes completely wrong. What is your instinct?',es:'Un plan sorpresa sale totalmente mal. ¿Cuál es tu instinto?',fr:'Un plan surprise tourne mal. Quel est votre réflexe ?',it:'Un piano a sorpresa va completamente storto. Qual è il tuo istinto?',de:'Ein Überraschungsplan geht völlig schief. Was ist dein erster Impuls?'},
    deep:{en:'If a once-in-a-lifetime opportunity appeared tomorrow, how spontaneous could you be?',es:'Si mañana apareciera una oportunidad única, ¿qué tan espontáneo podrías ser?',fr:'Si une occasion unique se présentait demain, à quel point pourriez-vous être spontané ?',it:'Se domani arrivasse un’occasione unica, quanto saresti spontaneo?',de:'Wenn morgen eine einmalige Chance käme, wie spontan könntest du sein?'}
  },
  'Humor': {
    easy:{en:'What kind of humor makes you laugh most?',es:'¿Qué tipo de humor te hace reír más?',fr:'Quel type d’humour vous fait le plus rire ?',it:'Che tipo di umorismo ti fa ridere di più?',de:'Welche Art Humor bringt dich am meisten zum Lachen?'},
    real:{en:'How important is it that a partner shares your sense of humor?',es:'¿Qué tan importante es compartir el mismo sentido del humor?',fr:'Est-il important de partager le même sens de l’humour ?',it:'Quanto è importante condividere lo stesso senso dell’umorismo?',de:'Wie wichtig ist ein ähnlicher Humor?'},
    deep:{en:'Can joking during tension help a relationship, or does it usually make things worse?',es:'¿Bromear durante la tensión ayuda o suele empeorar las cosas?',fr:'L’humour pendant une tension aide-t-il ou aggrave-t-il les choses ?',it:'Scherzare durante la tensione aiuta o peggiora le cose?',de:'Hilft Humor in angespannten Momenten oder macht er es eher schlimmer?'}
  },
  'Activities': {
    easy:{en:'What sounds like the best shared activity?',es:'¿Cuál suena como la mejor actividad compartida?',fr:'Quelle activité partagée vous tente le plus ?',it:'Quale attività condivisa ti sembra migliore?',de:'Welche gemeinsame Aktivität klingt am besten?'},
    real:{en:'Should couples regularly make time for hobbies together?',es:'¿Deberían las parejas reservar tiempo regularmente para hobbies juntos?',fr:'Les couples devraient-ils prévoir régulièrement des loisirs ensemble ?',it:'Le coppie dovrebbero dedicare regolarmente tempo a hobby comuni?',de:'Sollten Paare regelmäßig Zeit für gemeinsame Hobbys einplanen?'},
    deep:{en:'If your partner dislikes the activity you love most, how much compromise feels fair?',es:'Si a tu pareja no le gusta tu actividad favorita, ¿cuánto compromiso es justo?',fr:'Si votre partenaire déteste votre activité préférée, quel compromis est juste ?',it:'Se al partner non piace la tua attività preferita, quanto compromesso è giusto?',de:'Wenn dein Partner deine Lieblingsaktivität nicht mag, wie viel Kompromiss ist fair?'}
  },
  'Food & Travel': {
    easy:{en:'Choose your ideal trip style.',es:'Elige tu estilo ideal de viaje.',fr:'Choisissez votre style de voyage idéal.',it:'Scegli il tuo stile di viaggio ideale.',de:'Wähle deinen idealen Reisestil.'},
    real:{en:'When traveling together, what matters most?',es:'Al viajar juntos, ¿qué importa más?',fr:'En voyage à deux, qu’est-ce qui compte le plus ?',it:'Quando si viaggia insieme, cosa conta di più?',de:'Was ist beim gemeinsamen Reisen am wichtigsten?'},
    deep:{en:'Would you relocate far from family for the right shared opportunity?',es:'¿Te mudarías lejos de la familia por la oportunidad correcta?',fr:'Déménageriez-vous loin de votre famille pour une bonne opportunité commune ?',it:'Ti trasferiresti lontano dalla famiglia per una giusta opportunità comune?',de:'Würdest du für eine gute gemeinsame Chance weit weg von der Familie ziehen?'}
  },
  'Entertainment': {
    easy:{en:'Pick the best date-night entertainment.',es:'Elige el mejor entretenimiento para una cita.',fr:'Choisissez le meilleur divertissement pour une soirée à deux.',it:'Scegli il miglior intrattenimento per una serata insieme.',de:'Wähle die beste Unterhaltung für einen Date-Abend.'},
    real:{en:'How much should couples try each other’s entertainment interests?',es:'¿Cuánto deberían probar los intereses de entretenimiento del otro?',fr:'Dans quelle mesure faut-il essayer les loisirs de l’autre ?',it:'Quanto dovrebbero provare gli interessi di intrattenimento dell’altro?',de:'Wie sehr sollten Paare die Unterhaltungsinteressen des anderen ausprobieren?'},
    deep:{en:'If your tastes almost never overlap, can shared quality time still feel easy?',es:'Si sus gustos casi nunca coinciden, ¿puede seguir siendo fácil pasar tiempo de calidad?',fr:'Si vos goûts se croisent rarement, le temps de qualité peut-il rester naturel ?',it:'Se i gusti quasi non coincidono, il tempo di qualità può essere comunque naturale?',de:'Wenn sich eure Geschmäcker kaum überschneiden, kann gemeinsame Qualitätszeit trotzdem leicht sein?'}
  },
  'Daily Preferences': {
    easy:{en:'Which morning style sounds more like you?',es:'¿Qué estilo de mañana se parece más a ti?',fr:'Quel style de matin vous ressemble le plus ?',it:'Quale stile mattutino ti assomiglia di più?',de:'Welcher Morgenstil passt eher zu dir?'},
    real:{en:'How much do small daily habits affect relationship compatibility?',es:'¿Cuánto afectan los pequeños hábitos diarios a la compatibilidad?',fr:'À quel point les petites habitudes quotidiennes influencent-elles la compatibilité ?',it:'Quanto incidono le piccole abitudini quotidiane sulla compatibilità?',de:'Wie stark beeinflussen kleine Alltagsgewohnheiten die Kompatibilität?'},
    deep:{en:'If everyday habits create constant friction, how much should each person change?',es:'Si los hábitos diarios causan fricción constante, ¿cuánto debería cambiar cada uno?',fr:'Si les habitudes quotidiennes créent des frictions constantes, jusqu’où chacun devrait-il changer ?',it:'Se le abitudini quotidiane creano attrito costante, quanto dovrebbe cambiare ciascuno?',de:'Wenn Alltagsgewohnheiten ständig Reibung erzeugen, wie viel sollte jeder ändern?'}
  },
  'Wild Card': {
    easy:{en:'You suddenly get an extra free hour today. What do you do?',es:'De repente tienes una hora libre extra hoy. ¿Qué haces?',fr:'Vous avez soudain une heure libre aujourd’hui. Que faites-vous ?',it:'Hai improvvisamente un’ora libera oggi. Cosa fai?',de:'Du hast heute plötzlich eine freie Stunde. Was machst du?'},
    real:{en:'Which matters more in a strong relationship: predictability or surprise?',es:'¿Qué importa más en una relación fuerte: previsibilidad o sorpresa?',fr:'Dans une relation solide, qu’est-ce qui compte le plus : la prévisibilité ou la surprise ?',it:'In una relazione forte conta di più la prevedibilità o la sorpresa?',de:'Was ist in einer starken Beziehung wichtiger: Verlässlichkeit oder Überraschung?'},
    deep:{en:'What truth about yourself would you most want a partner to understand without judgment?',es:'¿Qué verdad sobre ti quisieras que una pareja entendiera sin juzgar?',fr:'Quelle vérité sur vous aimeriez-vous qu’un partenaire comprenne sans jugement ?',it:'Quale verità su di te vorresti che un partner capisse senza giudicare?',de:'Welche Wahrheit über dich sollte ein Partner ohne Urteil verstehen?'}
  }
};

const ANSWERS = {
  en:['Strongly me','Mostly me','It depends','Not really me'],
  es:['Totalmente yo','Bastante yo','Depende','No mucho'],
  fr:['Tout à fait moi','Plutôt moi','Ça dépend','Pas vraiment moi'],
  it:['Proprio io','Abbastanza io','Dipende','Non proprio io'],
  de:['Ganz ich','Eher ich','Kommt darauf an','Eher nicht ich']
};

function depthKey(depth) {
  return depth === 'Easy' ? 'easy' : depth === 'Deep' ? 'deep' : 'real';
}

function api(path, options={}) {
  return fetch(path, {
    credentials:'include',
    headers:{ 'content-type':'application/json', ...(options.headers||{}) },
    ...options,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error=new Error(data?.error?.message || data?.message || 'Request failed');
      error.status=res.status; error.payload=data;
      throw error;
    }
    return data;
  });
}

function ModeCard({ icon:Icon, title, body, onClick, accent, surface }) {
  return (
    <button
      onClick={onClick}
      className={"group relative flex min-h-[210px] flex-col items-center overflow-hidden rounded-[24px] border p-4 text-center shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white/80 sm:min-h-[230px] sm:p-5 " + surface}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-black/12" />
      <div className={"relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/35 shadow-lg " + accent}>
        <Icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="relative z-10 mt-4 text-[17px] font-black leading-[1.08] text-white sm:text-xl">{title}</h3>
      <p className="relative z-10 mt-3 text-[12px] font-medium leading-[1.35] text-white/90 sm:text-sm">{body}</p>
      <span className="relative z-10 mt-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition group-hover:translate-x-1">
        <ChevronRight className="h-5 w-5" />
      </span>
    </button>
  );
}

export default function LikeMinded() {
  const { currentLanguage } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const lang = LANGS.includes(currentLanguage) ? currentLanguage : 'en';
  const t = UI[lang] || UI.en;

  const [screen,setScreen] = useState('home');
  const [category,setCategory] = useState('Relationship Goals');
  const [depth,setDepth] = useState('Real');
  const [questionNo,setQuestionNo] = useState(1);
  const [setNo,setSetNo] = useState(1);
  const [selected,setSelected] = useState(null);
  const [locked,setLocked] = useState(false);
  const [checkpoint,setCheckpoint] = useState(false);
  const [nextCategory,setNextCategory] = useState('Communication');
  const [room,setRoom] = useState(null);
  const [roomCode,setRoomCode] = useState('');
  const [roomState,setRoomState] = useState(null);
  const [copied,setCopied] = useState(false);
  const [apiError,setApiError] = useState('');
  const [city,setCity] = useState('');
  const [stateRegion,setStateRegion] = useState('');
  const [country,setCountry] = useState('');
  const [lobbyUsers,setLobbyUsers] = useState([]);
  const [lobbyInvites,setLobbyInvites] = useState([]);
  const [inLobby,setInLobby] = useState(false);
  const [available,setAvailable] = useState(false);
  const [showTalk,setShowTalk] = useState(false);
  const [gamePass,setGamePass]=useState(null);
  const [gamePromotion,setGamePromotion]=useState(null);
  const [tokenBalance,setTokenBalance]=useState(0);
  const [tokenCost,setTokenCost]=useState(0);
  const [tokenPrompt,setTokenPrompt]=useState(false);
  const [accessLoading,setAccessLoading]=useState(false);
  const premiumResolveRef=useRef(null);

  const categoryIndex = Math.max(0, CANONICAL_CATEGORIES.indexOf(category));
  const activeCanonicalCategory = CANONICAL_CATEGORIES[(categoryIndex + questionNo - 1) % CANONICAL_CATEGORIES.length];
  const questionText = QUESTIONS[activeCanonicalCategory]?.[depthKey(depth)]?.[lang] || QUESTIONS[activeCanonicalCategory]?.real?.en;
  const answers = ANSWERS[lang] || ANSWERS.en;
  const displayCategory = t.categoriesList[CANONICAL_CATEGORIES.indexOf(activeCanonicalCategory)] || activeCanonicalCategory;

  const refreshTokenState=async()=>{
    if(!isAuthenticated){setGamePass(null);setTokenBalance(0);return null;}
    try{
      const [wallet,access]=await Promise.all([
        getTokenWallet(),
        api('/api/games/like-minded/access',{method:'GET',headers:{}}),
      ]);
      setGamePromotion(access?.promotion||null);
      setTokenBalance(Number(wallet?.wallet?.balance||0));
      setTokenCost(access?.promotion?.free?0:Number(wallet?.featurePrices?.find(x=>x.feature_code==='like_minded_session')?.token_cost||49));
      let pass=access?.pass||null;
      if(!pass&&access?.promotion?.free){
        const requestId=globalThis.crypto?.randomUUID?.()||`like-minded-free-${Date.now()}`;
        const freeAccess=await api('/api/games/like-minded/access',{method:'POST',body:JSON.stringify({requestId})});
        pass=freeAccess?.pass||null;
        setGamePromotion(freeAccess?.promotion||access.promotion);
      }
      setGamePass(pass);
      return pass;
    }catch(error){
      if(error?.status===402||isTokensRequiredError(error)){setGamePass(null);}
      return null;
    }
  };
  const handlePremiumError=(error)=>{
    if(isTokensRequiredError(error)||error?.payload?.error?.code==='tokens_required'){
      const info=tokenRequiredDetails(error);
      setTokenBalance(Number(info.balance||tokenBalance||0));
      if(info.required)setTokenCost(Number(info.required));
      setTokenPrompt(true);
      setApiError(`${t.buyTokens} — ${info.required||tokenCost||49} Credit cents required. Balance: ${info.balance||0}.`);
      return true;
    }
    setApiError(error?.message||t.unavailable);
    return false;
  };
  const ensurePremiumAccess=async()=>{
    if(!isAuthenticated){
      window.location.assign('/SignUp?source=like-minded&type=individual');
      return false;
    }
    if(gamePass&&new Date(gamePass.expires_at).getTime()>Date.now())return true;
    setApiError('');
    setTokenPrompt(true);
    return new Promise(resolve=>{premiumResolveRef.current=resolve;});
  };
  const confirmPremiumAccess=async()=>{
    if(accessLoading)return;
    setAccessLoading(true);setApiError('');
    try{
      const requestId=globalThis.crypto?.randomUUID?.()||`like-minded-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const data=await api('/api/games/like-minded/access',{method:'POST',body:JSON.stringify({requestId})});
      setGamePass(data.pass||null);
      if(data?.tokens?.balance!=null)setTokenBalance(Number(data.tokens.balance));
      else await refreshTokenState();
      setTokenPrompt(false);
      const resolve=premiumResolveRef.current; premiumResolveRef.current=null; resolve?.(true);
    }catch(error){
      handlePremiumError(error);
    }finally{setAccessLoading(false);}
  };
  const closePremiumPrompt=()=>{
    setTokenPrompt(false);setApiError('');
    const resolve=premiumResolveRef.current; premiumResolveRef.current=null; resolve?.(false);
  };
  const withPremiumDialog=(content)=><>
    {content}
    <UnlockPriceDialog
      open={Boolean(tokenPrompt)&&!(gamePass&&new Date(gamePass.expires_at).getTime()>Date.now())}
      title="Like Minded?"
      priceCents={Number(tokenCost||49)}
      terms="Per game / session."
      balanceCents={Number(tokenBalance||0)}
      busy={accessLoading}
      error={apiError}
      onUnlock={confirmPremiumAccess}
      onClose={closePremiumPrompt}
      creditReturn="/LikeMinded"
    />
  </>;

  useEffect(() => {
    const pending=new URLSearchParams(window.location.search).get('room');
    if(!pending)return;
    const normalized=pending.toUpperCase();
    setRoomCode(normalized);
    if(!isAuthenticated){setScreen('invite');return;}
    let active=true;
    (async()=>{
      const pass=await refreshTokenState();
      if(!active)return;
      // Opening an invite never spends tokens automatically.
      if(!pass){setTokenPrompt(true);setScreen('invite');return;}
      try{
        const data=await api('/api/like-minded/rooms/join',{method:'POST',body:JSON.stringify({code:normalized,language:lang})});
        if(!active)return;
        setRoom(data.room);setRoomState(data.room);setRoomUrl(data.room?.code);
        if(data.room?.category)setCategory(data.room.category);
        if(data.room?.depth)setDepth(data.room.depth);
        if(data.room?.current_question_no)setQuestionNo(data.room.current_question_no);
        setLocked(Boolean(data.room?.my_locked));setScreen('room');
      }catch(error){if(active){handlePremiumError(error);setScreen('invite');}}
    })();
    return()=>{active=false};
  },[isAuthenticated]);

  useEffect(() => {
    if(!isAuthenticated)return;
    let active=true;
    refreshTokenState().then(pass=>{
      if(!active||!pass)return;
      api('/api/like-minded/settings',{method:'GET',headers:{}})
        .then(data=>{if(active)setAvailable(Boolean(data.settings?.available));})
        .catch(()=>{});
    });
    return()=>{active=false};
  },[isAuthenticated]);

  useEffect(() => {
    if (!room?.code) return;
    let active = true;
    const load = async () => {
      // Skip polls from a hidden tab (query-burn fix, Oct 7).
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const data = await api('/api/like-minded/rooms/' + encodeURIComponent(room.code), { method:'GET', headers:{} });
        if (active) {
          setRoomState(data.room);
          if (data.room?.category) setCategory(data.room.category);
          if (data.room?.depth) setDepth(data.room.depth);
          if (data.room?.current_question_no) setQuestionNo(data.room.current_question_no);
        }
      } catch (err) {
        if (active) setApiError(err.message);
      }
    };
    load();
    const id = setInterval(load, 1800);
    return () => { active = false; clearInterval(id); };
  }, [room?.code]);

  useEffect(() => {
    if (screen !== 'lobby' || !inLobby) return;
    let active = true;
    const load = async () => {
      // Skip polls from a hidden tab (query-burn fix, Oct 7).
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      try {
        const data = await api('/api/like-minded/lobby', { method:'GET', headers:{} });
        if (active) {
          setLobbyUsers(data.players || []);
          setLobbyInvites(data.invites || []);
        }
      } catch (err) {
        if (active) setApiError(err.message);
      }
    };
    load();
    const id = setInterval(load, 4000);
    return () => { active=false; clearInterval(id); };
  }, [screen,inLobby]);

  const selectDepth = (value) => setDepth(value);

  const setRoomUrl = (code) => {
    if (!code) return;
    const target=createPageUrl('LikeMinded')+'?room='+encodeURIComponent(code);
    window.history.replaceState({},'',target);
  };

  const goHome = () => {
    window.history.replaceState({},'',createPageUrl('LikeMinded'));
    setRoom(null); setRoomState(null); setRoomCode(''); setSelected(null); setLocked(false); setShowTalk(false); setScreen('home');
  };

  const startSolo = async () => {
    if(!(await ensurePremiumAccess()))return;
    setScreen('solo'); setQuestionNo(1); setSetNo(1); setSelected(null); setLocked(false); setCheckpoint(false);
  };

  const lockSolo = () => {
    if (selected == null) return;
    setLocked(true);
  };

  const advanceSolo = () => {
    if (questionNo >= 21) { setCheckpoint(true); return; }
    setCategory(nextCategory || category);
    setQuestionNo((n) => n + 1);
    setSelected(null); setLocked(false);
  };

  const createRoom = async () => {
    if(!(await ensurePremiumAccess()))return;
    setApiError('');
    try {
      const data = await api('/api/like-minded/rooms', {
        method:'POST',
        body:JSON.stringify({ category, depth, language:lang }),
      });
      setRoom(data.room); setRoomState(data.room); setRoomUrl(data.room?.code);
      if (data.room?.category) setCategory(data.room.category);
      if (data.room?.depth) setDepth(data.room.depth);
      if (data.room?.current_question_no) setQuestionNo(data.room.current_question_no);
      setScreen('room');
    } catch (err) { handlePremiumError(err); }
  };

  const joinRoom = async () => {
    if(!(await ensurePremiumAccess()))return;
    setApiError('');
    try {
      const data = await api('/api/like-minded/rooms/join', {
        method:'POST',
        body:JSON.stringify({ code:roomCode.trim().toUpperCase(), language:lang }),
      });
      setRoom(data.room); setRoomState(data.room); setRoomUrl(data.room?.code);
      if (data.room?.category) setCategory(data.room.category);
      if (data.room?.depth) setDepth(data.room.depth);
      if (data.room?.current_question_no) setQuestionNo(data.room.current_question_no);
      setScreen('room');
    } catch (err) { handlePremiumError(err); }
  };

  const lockRoomAnswer = async () => {
    if (selected == null || !room?.code) return;
    setApiError('');
    try {
      const data = await api('/api/like-minded/rooms/' + encodeURIComponent(room.code) + '/answer', {
        method:'POST',
        body:JSON.stringify({ answerId:selected, questionId:activeCanonicalCategory + ':' + depthKey(depth) }),
      });
      setLocked(true);
      setRoomState(data.room || roomState);
    } catch (err) { handlePremiumError(err); }
  };

  const nextRoomQuestion = async () => {
    if (!room?.code) return;
    setApiError('');
    try {
      const data = await api('/api/like-minded/rooms/' + encodeURIComponent(room.code) + '/next', { method:'POST', body:'{}' });
      setRoomState(data.room); setQuestionNo(data.room?.current_question_no || questionNo + 1);
      setSelected(null); setLocked(false); setShowTalk(false);
    } catch (err) { handlePremiumError(err); }
  };

  const copyInvite = async () => {
    const link = window.location.origin + createPageUrl('LikeMinded') + '?room=' + encodeURIComponent(room?.code || '');
    await navigator.clipboard?.writeText(link);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const toggleAvailability = async () => {
    if (!isAuthenticated || inLobby) return;
    if(!(gamePass&&new Date(gamePass.expires_at).getTime()>Date.now())){setTokenPrompt(true);setApiError(t.buyTokens);return;}
    setApiError('');
    try {
      const next=!available;
      const data=await api('/api/like-minded/settings',{method:'POST',body:JSON.stringify({available:next,language:lang})});
      setAvailable(Boolean(data.available));
    } catch (err) { handlePremiumError(err); }
  };

  const enterLobby = async () => {
    if(!(await ensurePremiumAccess()))return;
    setApiError('');
    try {
      await api('/api/like-minded/lobby', {
        method:'POST',
        body:JSON.stringify({ available:true, inLobby:true, city, stateRegion, country }),
      });
      setInLobby(true); setAvailable(true);
    } catch (err) { handlePremiumError(err); }
  };

  const leaveLobby = async () => {
    try {
      await api('/api/like-minded/lobby', { method:'POST', body:JSON.stringify({ inLobby:false }) });
    } catch {}
    setInLobby(false); setScreen('home');
  };

  const joinInvite = async (code) => {
    if(!(await ensurePremiumAccess()))return;
    setRoomCode(code);
    setApiError('');
    try {
      const data = await api('/api/like-minded/rooms/join', {
        method:'POST',
        body:JSON.stringify({ code, language:lang }),
      });
      setRoom(data.room); setRoomState(data.room);
      if (data.room?.category) setCategory(data.room.category);
      if (data.room?.depth) setDepth(data.room.depth);
      if (data.room?.current_question_no) setQuestionNo(data.room.current_question_no);
      setScreen('room');
    } catch (err) { handlePremiumError(err); }
  };

  const blockPlayer = async (playerId) => {
    try {
      await api('/api/like-minded/blocks', { method:'POST', body:JSON.stringify({ userId:playerId }) });
      setLobbyUsers(list => list.filter(p => p.user_id !== playerId));
    } catch (err) { handlePremiumError(err); }
  };

  const reportPlayer = async (playerId) => {
    try {
      await api('/api/like-minded/reports', { method:'POST', body:JSON.stringify({ userId:playerId, context:'Reported from Like Minded Player Lobby' }) });
      setLobbyUsers(list => list.filter(p => p.user_id !== playerId));
    } catch (err) { handlePremiumError(err); }
  };

  const invitePlayer = async (playerId) => {
    if(!(await ensurePremiumAccess()))return;
    setApiError('');
    try {
      const data = await api('/api/like-minded/rooms', {
        method:'POST',
        body:JSON.stringify({ category, depth, language:lang, invitedUserId:playerId }),
      });
      setRoom(data.room); setRoomState(data.room); setRoomUrl(data.room?.code); setScreen('room');
    } catch (err) { handlePremiumError(err); }
  };

  const modeHeader = (
    <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <button onClick={goHome} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> {t.back}</button>
      <div className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-black tracking-wide text-white">LIKE MINDED?</div>
    </div>
  );

  if (screen === 'solo') {
    return withPremiumDialog(
      <div className="min-h-screen bg-[#f8f5ff] py-8">
        {modeHeader}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">{t.set} {setNo} · {t.question} {questionNo}/21</div>
                <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{displayCategory}</h1>
              </div>
              <div className="flex gap-2">
                <button onClick={() => selectDepth(depth === 'Deep' ? 'Real' : 'Easy')} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">{t.ease}</button>
                <button onClick={() => selectDepth(depth === 'Easy' ? 'Real' : 'Deep')} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white">{t.turnUp}</button>
              </div>
            </div>

            <div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 transition-all" style={{width:(questionNo/21*100)+'%'}} /></div>

            <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 p-6 text-white sm:p-9">
              <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold text-white/65">
                <span>{t.category}: {displayCategory}</span><span>{t.questionDepth}: {depth}</span>
              </div>
              <h2 className="text-2xl font-black leading-tight sm:text-4xl">{questionText}</h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {answers.map((answer,index) => (
                <button key={answer} disabled={locked} onClick={() => setSelected(index)} className={"rounded-2xl border-2 p-4 text-left text-sm font-bold transition " + (selected===index ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-950 shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:border-violet-300')}>
                  <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs">{String.fromCharCode(65+index)}</span>{answer}
                </button>
              ))}
            </div>

            {!locked ? (
              <button onClick={lockSolo} disabled={selected==null} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-4 text-base font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">
                <LockKeyhole className="mr-2 inline h-5 w-5" />{selected==null ? t.chooseAnswer : t.lockAnswer}
              </button>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"><CheckCircle2 className="mr-2 inline h-5 w-5" /><strong>{t.locked}</strong> · {t.yourAnswer}: {answers[selected]}</div>
                <div>
                  <div className="mb-2 text-sm font-black text-slate-900">{t.nextCategory}</div>
                  <div className="flex flex-wrap gap-2">
                    {CANONICAL_CATEGORIES.map((c,i) => <button key={c} onClick={() => setNextCategory(c)} className={"rounded-full px-3 py-2 text-xs font-bold " + (nextCategory===c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700')}>{t.categoriesList[i]}</button>)}
                  </div>
                </div>
                <button onClick={advanceSolo} className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">{t.nextQuestion} <ChevronRight className="ml-2 inline h-5 w-5" /></button>
              </div>
            )}
          </div>
        </div>

        {checkpoint && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-2xl">
              <Trophy className="mx-auto h-12 w-12 text-amber-500" /><h2 className="mt-4 text-3xl font-black">{t.checkpoint}</h2><p className="mt-2 text-slate-600">{t.checkpointBody}</p>
              <div className="mt-6 grid gap-3">
                <button onClick={() => {setSetNo(n=>n+1);setQuestionNo(1);setSelected(null);setLocked(false);setCheckpoint(false);}} className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">{t.keepPlaying}</button>
                <button onClick={() => {setCheckpoint(false);setScreen('home');}} className="rounded-2xl border border-slate-200 px-5 py-4 font-black text-slate-800">{t.finish}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'invite') {
    return withPremiumDialog(
      <div className="min-h-screen bg-[#f7f4ff] py-8">
        {modeHeader}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-7 text-white shadow-2xl">
              <Users className="h-10 w-10 text-fuchsia-300" /><h1 className="mt-5 text-3xl font-black">{t.invite}</h1><p className="mt-3 leading-7 text-slate-200">{t.inviteBody}</p>
              <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-slate-100"><LockKeyhole className="mr-2 inline h-4 w-4" />{t.matureBody}</div>
            </div>
            <div className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-xl">
              {!isAuthenticated ? (
                <>
                  <h2 className="text-2xl font-black text-slate-950">{t.signin}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t.signinBody}</p>
                  <Link to={createPageUrl('SignIn') + (roomCode ? ('?redirect=' + encodeURIComponent(createPageUrl('LikeMinded') + '?room=' + roomCode)) : '')} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">{t.signin}</Link>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black text-slate-950">{t.createRoom}</h2>
                  <div className="mt-5 text-sm font-black text-slate-800">{t.categories}</div>
                  <select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3">
                    {CANONICAL_CATEGORIES.map((c,i)=><option key={c} value={c}>{t.categoriesList[i]}</option>)}
                  </select>
                  <div className="mt-5 text-sm font-black text-slate-800">{t.depth}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">{['Easy','Real','Deep'].map(d=><button key={d} onClick={()=>setDepth(d)} className={"rounded-xl px-3 py-3 text-sm font-black " + (depth===d?'bg-violet-600 text-white':'bg-slate-100 text-slate-700')}>{d==='Easy'?t.easy:d==='Real'?t.real:t.deep}</button>)}</div>
                  <button onClick={createRoom} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-4 font-black text-white">{t.createRoom}</button>
                  <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200"/><span className="text-xs font-bold text-slate-400">OR</span><div className="h-px flex-1 bg-slate-200"/></div>
                  <h2 className="text-xl font-black text-slate-950">{t.joinRoom}</h2>
                  <div className="mt-3 flex gap-2"><input value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} placeholder={t.codePlaceholder} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-black uppercase tracking-widest"/><button onClick={joinRoom} className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">{t.join}</button></div>
                </>
              )}
              {apiError && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{apiError}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'room') {
    const current = roomState || room || {};
    const bothLocked = Boolean(current.both_locked);
    const match = current.current_match;
    const myLocked = Boolean(current.my_locked) || locked;
    return withPremiumDialog(
      <div className="min-h-screen bg-[#f7f4ff] py-8">
        {modeHeader}
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-600">{t.room}</div><h1 className="mt-1 text-2xl font-black">{t.question} {current.current_question_no || questionNo}/21</h1></div>
              <div className="text-right"><div className="text-xs font-bold text-slate-500">{t.roomCode}</div><div className="font-mono text-xl font-black tracking-[0.2em]">{current.code || room?.code}</div></div>
            </div>

            {!current.guest_user_id && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="font-black text-amber-900">{t.player2}</div>
                <button onClick={copyInvite} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-950 px-4 py-2 text-sm font-black text-white"><Copy className="h-4 w-4"/>{copied?t.copied:t.copyInvite}</button>
              </div>
            )}

            <div className="mt-6 rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 p-6 text-white sm:p-9">
              <div className="mb-3 text-xs font-bold text-white/60">{displayCategory} · {depth}</div>
              <h2 className="text-2xl font-black leading-tight sm:text-4xl">{questionText}</h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {answers.map((answer,index)=><button key={answer} disabled={myLocked} onClick={()=>setSelected(index)} className={"rounded-2xl border-2 p-4 text-left font-bold " + (selected===index?'border-fuchsia-500 bg-fuchsia-50':'border-slate-200')}>{String.fromCharCode(65+index)}. {answer}</button>)}
            </div>

            {!myLocked ? <button onClick={lockRoomAnswer} disabled={selected==null || !current.guest_user_id} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-4 font-black text-white disabled:opacity-40"><LockKeyhole className="mr-2 inline h-5 w-5"/>{selected==null?t.chooseAnswer:t.lockAnswer}</button>
            : !bothLocked ? <div className="mt-6 rounded-2xl bg-indigo-50 p-4 font-bold text-indigo-900"><Radio className="mr-2 inline h-5 w-5 animate-pulse"/>{t.waiting}</div>
            : <div className="mt-6 space-y-4">
                <div className={"rounded-2xl p-5 " + (match ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900')}>
                  <div className="text-lg font-black">{match ? t.match : t.difference}</div>
                  <div className="mt-1 text-sm">{t.score}: {current.matches || 0}/{current.total_answered || 0}</div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl bg-white/70 p-3"><div className="text-[11px] font-black uppercase opacity-60">{t.yourAnswer}</div><div className="mt-1 font-black">{answers[current.my_answer_id] || '—'}</div></div>
                    <div className="rounded-xl bg-white/70 p-3"><div className="text-[11px] font-black uppercase opacity-60">Player 2</div><div className="mt-1 font-black">{answers[current.other_answer_id] || '—'}</div></div>
                  </div>
                  {current.category_scores?.[activeCanonicalCategory] && <div className="mt-3 text-xs font-bold opacity-75">{displayCategory}: {current.category_scores[activeCanonicalCategory].matches}/{current.category_scores[activeCanonicalCategory].total} {t.matches}</div>}
                </div>
                {showTalk && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-center font-bold text-violet-950">{t.talkPrompt}</div>}
                <div className="grid gap-3 sm:grid-cols-2"><button onClick={()=>setShowTalk(v=>!v)} className="rounded-2xl border border-slate-200 px-5 py-4 font-black text-slate-800"><MessageCircle className="mr-2 inline h-5 w-5"/>{t.talk}</button><button onClick={nextRoomQuestion} className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">{t.nextQuestion}<ChevronRight className="ml-2 inline h-5 w-5"/></button></div>
              </div>}
            {apiError && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{apiError}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'lobby') {
    return withPremiumDialog(
      <div className="min-h-screen bg-[#f7f4ff] py-8">
        {modeHeader}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          {!isAuthenticated ? (
            <div className="mx-auto max-w-xl rounded-[30px] bg-white p-8 text-center shadow-xl"><UserRound className="mx-auto h-12 w-12 text-violet-600"/><h1 className="mt-4 text-2xl font-black">{t.signin}</h1><p className="mt-2 text-slate-600">{t.signinBody}</p><Link to={createPageUrl('SignIn')} className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-4 font-black text-white">{t.signin}</Link></div>
          ) : !inLobby ? (
            <div className="mx-auto max-w-xl rounded-[30px] bg-white p-8 shadow-xl">
              <Users className="h-10 w-10 text-violet-600"/><h1 className="mt-4 text-3xl font-black">{t.lobby}</h1><p className="mt-2 text-slate-600">{t.locationNote}</p>
              <div className="mt-6 grid gap-4"><label className="text-sm font-black">{t.city}<input value={city} onChange={e=>setCity(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label><label className="text-sm font-black">{t.state}<input value={stateRegion} onChange={e=>setStateRegion(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label><label className="text-sm font-black">{t.country}<input value={country} onChange={e=>setCountry(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label></div>
              <button onClick={enterLobby} disabled={!city.trim() || !country.trim()} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-4 font-black text-white disabled:opacity-40">{t.enterLobby}</button>
              {apiError && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{apiError}</div>}
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between gap-3"><div><h1 className="text-3xl font-black">{t.available}</h1><p className="text-sm text-slate-500">{lobbyUsers.length} online</p></div><button onClick={leaveLobby} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">{t.leaveLobby}</button></div>
              {lobbyInvites.length > 0 && <div className="mb-5 rounded-[28px] border border-fuchsia-200 bg-fuchsia-50 p-5 text-slate-950">
                <div className="text-sm font-black uppercase tracking-[.16em] text-fuchsia-700">Game invitations</div>
                <div className="mt-3 grid gap-2">{lobbyInvites.map(inv => <button key={inv.code} onClick={()=>joinInvite(inv.code)} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-left shadow-sm"><span><strong>{inv.host_first_name}</strong><span className="ml-2 text-sm text-slate-500">{inv.category} · {inv.depth}</span></span><span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">{t.join}</span></button>)}</div>
              </div>}
              <div className="grid gap-4 md:grid-cols-2">
                {lobbyUsers.length===0 ? <div className="rounded-[28px] bg-white p-8 text-center text-slate-500 shadow">{t.lobbyEmpty}</div> : lobbyUsers.map((p)=>(
                  <div key={p.user_id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
                    <div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-black text-white">{(p.first_name||'?').slice(0,1).toUpperCase()}</div><div><div className="font-black text-slate-950">{p.first_name}</div><div className="text-sm text-slate-500">{[p.city,p.state_region,p.country].filter(Boolean).join(', ')}</div></div></div>
                    <div className="mt-5 grid grid-cols-4 gap-2"><button onClick={()=>invitePlayer(p.user_id)} className="col-span-2 rounded-xl bg-slate-950 px-3 py-3 text-sm font-black text-white">{t.inviteToPlay}</button><button onClick={()=>blockPlayer(p.user_id)} className="rounded-xl border border-slate-200 px-2 text-xs font-black">{t.block}</button><button onClick={()=>reportPlayer(p.user_id)} className="rounded-xl border border-slate-200 px-2 text-xs font-black">{t.report}</button></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return withPremiumDialog(
    <div className="min-h-screen bg-[#07112f] text-white">
      <section className="relative flex min-h-[calc(100svh-96px)] flex-col overflow-hidden bg-[#07112f]">
        <div className="relative h-[40svh] min-h-[320px] max-h-[520px] overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="relative overflow-hidden">
              <img
                src="/assets/o2ol-hero.png"
                alt=""
                className="h-full w-full scale-[1.65] object-cover"
                style={{objectPosition:'72% 48%'}}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950/25 via-blue-600/5 to-transparent" />
            </div>
            <div className="relative overflow-hidden">
              <img
                src="/assets/o2ol-hero.png"
                alt=""
                className="h-full w-full scale-[1.65] object-cover"
                style={{objectPosition:'28% 48%'}}
              />
              <div className="absolute inset-0 bg-gradient-to-bl from-fuchsia-950/25 via-rose-500/5 to-transparent" />
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[-12%] h-[128%] w-[4px] -translate-x-1/2 rotate-[18deg] bg-white/95 shadow-[0_0_18px_rgba(255,255,255,.65)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#07112f] via-[#07112f]/60 to-transparent" />

          <Link
            to={createPageUrl('CooperativeGames')}
            aria-label={t.back}
            className="absolute left-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="absolute inset-x-0 bottom-[-18px] z-10 flex justify-center px-4">
            <div className="select-none text-center [filter:drop-shadow(0_10px_18px_rgba(0,0,0,.55))]">
              <div className="leading-[.76]">
                <span
                  className="block text-[74px] font-black tracking-[-.07em] text-yellow-300 sm:text-[96px]"
                  style={{WebkitTextStroke:'4px #07112f', textShadow:'0 0 0 #07112f, 0 5px 0 #f59e0b'}}
                >
                  Like
                </span>
                <span
                  className="block text-[68px] font-black tracking-[-.065em] text-white sm:text-[90px]"
                  style={{WebkitTextStroke:'4px #07112f', textShadow:'0 4px 0 #dbeafe'}}
                >
                  Minded<span className="text-yellow-300">?</span>
                </span>
              </div>
              <div className="mt-3 flex justify-center gap-2">
                <span className="relative inline-flex h-11 w-14 items-center justify-center rounded-[18px] rounded-bl-[5px] bg-cyan-400 shadow-[0_0_0_4px_#07112f]">
                  <span className="text-xl text-[#07112f]">♥</span>
                </span>
                <span className="relative inline-flex h-11 w-14 items-center justify-center rounded-[18px] rounded-br-[5px] bg-pink-500 shadow-[0_0_0_4px_#07112f]">
                  <span className="text-xl text-[#07112f]">♥</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-3 pb-5 pt-12 sm:px-5 sm:pb-7 sm:pt-16">
          <div className="mx-auto w-full max-w-3xl"><img src="/game-cards/card-like-minded.jpg" alt="Like Minded?" className="mb-7 block w-full rounded-[24px] shadow-2xl ring-1 ring-white/15" /></div>
          <div className="mx-auto w-full max-w-5xl text-center">
            <h1 className="text-[31px] font-black leading-[1.08] tracking-tight text-white sm:text-4xl">
              {t.tagline.split('. ').map((part,i,arr) => (
                <React.Fragment key={part}>
                  <span className={i===1 ? 'text-yellow-300' : 'text-white'}>{part}{i < arr.length-1 ? '.' : ''}</span>
                  {i < arr.length-1 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="mx-auto mt-3 hidden max-w-2xl text-sm leading-6 text-slate-300 sm:block">{t.intro}</p>
          </div>

          {isAuthenticated && (
            <div className="mx-auto mt-3 flex max-w-3xl items-center justify-center gap-2 text-xs text-slate-300">
              <button
                onClick={toggleAvailability}
                disabled={inLobby}
                aria-label={available ? 'Set unavailable' : 'Set available'}
                className={"relative h-6 w-11 rounded-full transition " + (available ? 'bg-emerald-500' : 'bg-slate-600') + (inLobby ? ' cursor-not-allowed opacity-70' : '')}
              >
                <span className={"absolute top-1 h-4 w-4 rounded-full bg-white transition " + (available ? 'left-6' : 'left-1')} />
              </button>
              <span className="font-bold">{available ? t.available : 'Unavailable'}</span>
            </div>
          )}

          <div className="mx-auto mt-4 w-full max-w-5xl rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-left text-amber-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="inline-flex items-center gap-2 font-black"><Coins className="h-5 w-5"/>{t.premium}</div><p className="mt-1 text-xs leading-5 text-amber-50/80">{t.premiumBody}</p></div>
              {isAuthenticated ? <Link to="/Credit?return=/LikeMinded" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-amber-950">{gamePass?'Pass Active':gamePromotion?.free?'🎉 FREE through Sunday · No Credit used':`🔒 ${(Number(tokenCost||49)/100).toFixed(2)} per game · Balance ${(Number(tokenBalance||0)/100).toFixed(2)}`}</Link> : <Link to="/SignUp?source=like-minded&type=individual" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-amber-950">Create FREE Account</Link>}
            </div>
          </div>

          <div className="mx-auto mt-4 grid w-full max-w-5xl grid-cols-3 gap-2.5 sm:mt-6 sm:gap-4">
            <ModeCard
              icon={UserRound}
              title={t.solo}
              body={t.soloBody}
              onClick={startSolo}
              accent="bg-blue-500/95"
              surface="border-cyan-300/55 bg-gradient-to-b from-sky-500 via-blue-600 to-blue-800"
            />
            <ModeCard
              icon={HeartHandshake}
              title={t.invite}
              body={t.inviteBody}
              onClick={()=>setScreen('invite')}
              accent="bg-pink-500/95"
              surface="border-pink-300/55 bg-gradient-to-b from-pink-500 via-fuchsia-600 to-pink-800"
            />
            <ModeCard
              icon={Users}
              title={t.lobby}
              body={t.lobbyBody}
              onClick={()=>setScreen('lobby')}
              accent="bg-amber-400/95"
              surface="border-amber-200/60 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-700"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white text-slate-950">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{t.how}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">{t.intro}</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[[Sparkles,t.choose,t.how1],[LockKeyhole,t.lock,t.how2],[CheckCircle2,t.reveal,t.how3],[HeartHandshake,t.connect,t.how4]].map(([Icon,title,body],i)=>(
              <div key={title} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#07112f] text-white shadow-md">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="mt-4 text-xs font-black uppercase tracking-[.18em] text-violet-600">0{i+1}</div>
                <h3 className="mt-1 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#07112f]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-14 md:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7">
            <ShieldCheck className="h-9 w-9 text-pink-300"/>
            <h3 className="mt-4 text-2xl font-black">{t.mature}</h3>
            <p className="mt-3 leading-7 text-slate-300">{t.matureBody}</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-7">
            <Globe2 className="h-9 w-9 text-cyan-300"/>
            <h3 className="mt-4 text-2xl font-black">{t.multilingual}</h3>
            <p className="mt-3 leading-7 text-slate-300">{t.multilingualBody}</p>
          </div>
        </div>
      </section>
      <p className="pb-8 text-center text-xs text-slate-400">Copyright © 2026 EPS Venture Group. All rights reserved.</p>
    </div>
  );
}
