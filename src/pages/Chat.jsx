import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Users, ShieldCheck, Sparkles, ArrowLeft, Trash2, LogIn, RefreshCw, Flag, VolumeX, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { createPageUrl } from '@/utils';
import {
  getCommunityChatRooms,
  getCommunityChatMessages,
  getCommunityChatTopics,
  createCommunityChatTopic,
  sendCommunityChatMessage,
  touchCommunityChatPresence,
  beaconLeaveCommunityChatRoom,
  deleteCommunityChatMessage,
  reportCommunityChatMessage,
  muteCommunityChatUser,
} from '@/lib/communityChatService';
import VotingCard from '@/components/chat/VotingCard';
import { questionForRoom } from '@/lib/votingQuestions';

const firstNameOf = (name) => {
  const token = String(name || '').trim().split(/\s+/)[0] || '';
  return token.includes('@') ? '' : token;
};
const lgbtqCopy = {
  en: {
    title:'LGBTQ+ Community Chat',
    subtitle:'A dedicated LGBTQ+ space for connection, questions, encouragement and respectful conversation.',
    back:'Back to LGBTQ+ Support',
    safetyTitle:'This is a protected community space',
    safetyBody:'No bullying, hate speech, threats, outing, harassment, sexual harassment, or sharing another person’s private information. You do not have to disclose or prove your identity to participate respectfully.',
    report:'Report', mute:'Mute', reported:'Report sent to moderation.', muted:'Member muted for you.',
    reportPrompt:'Briefly tell us why you are reporting this message. Examples: harassment, hate speech, threat, outing/private information, sexual harassment.',
    muteConfirm:'Mute this member? Their messages will no longer appear for you.',
    topics:'Chat Topics', mainRoom:'Main Room', startTopic:'Start a Topic', topicTitle:'Topic title', topicPlaceholder:'What would you like to talk about?', openingMessage:'Opening message (optional)', openingPlaceholder:'Add a little context or start the conversation…', createTopic:'Start Topic', cancelTopic:'Cancel', topicCreated:'Your chat topic is live.', topicError:'Unable to start this chat topic.',
    prompt:['Amora','What helps an LGBTQ+ relationship or community space feel genuinely safe, respectful and supportive?']
  },
  es: {
    title:'Chat Comunitario LGBTQ+',
    subtitle:'Un espacio LGBTQ+ dedicado a conexión, preguntas, ánimo y conversación respetuosa.',
    back:'Volver a Apoyo LGBTQ+',
    safetyTitle:'Este es un espacio comunitario protegido',
    safetyBody:'No se permite acoso, odio, amenazas, sacar a alguien del clóset, acoso sexual ni compartir información privada de otra persona. No tienes que revelar ni demostrar tu identidad para participar con respeto.',
    report:'Reportar', mute:'Silenciar', reported:'Reporte enviado a moderación.', muted:'Miembro silenciado para ti.',
    reportPrompt:'Explica brevemente por qué reportas este mensaje: acoso, odio, amenaza, outing/información privada, acoso sexual, etc.',
    muteConfirm:'¿Silenciar a este miembro? Sus mensajes dejarán de aparecer para ti.',
    topics:'Temas del Chat', mainRoom:'Sala Principal', startTopic:'Iniciar un Tema', topicTitle:'Título del tema', topicPlaceholder:'¿De qué te gustaría hablar?', openingMessage:'Mensaje inicial (opcional)', openingPlaceholder:'Añade contexto o inicia la conversación…', createTopic:'Iniciar Tema', cancelTopic:'Cancelar', topicCreated:'Tu tema de chat ya está activo.', topicError:'No se pudo iniciar este tema.',
    prompt:['Amora','¿Qué hace que un espacio o relación LGBTQ+ se sienta realmente seguro, respetuoso y solidario?']
  },
  fr: {
    title:'Chat Communautaire LGBTQ+',
    subtitle:'Un espace LGBTQ+ dédié à la connexion, aux questions, à l’encouragement et aux échanges respectueux.',
    back:'Retour au Soutien LGBTQ+',
    safetyTitle:'Cet espace communautaire est protégé',
    safetyBody:'Aucun harcèlement, propos haineux, menace, outing, harcèlement sexuel ou partage d’informations privées d’autrui. Vous n’avez pas à révéler ni prouver votre identité pour participer avec respect.',
    report:'Signaler', mute:'Masquer', reported:'Signalement envoyé à la modération.', muted:'Membre masqué pour vous.',
    reportPrompt:'Expliquez brièvement pourquoi vous signalez ce message : harcèlement, haine, menace, outing/informations privées, harcèlement sexuel, etc.',
    muteConfirm:'Masquer ce membre ? Ses messages ne s’afficheront plus pour vous.',
    topics:'Sujets du Chat', mainRoom:'Salon Principal', startTopic:'Créer un Sujet', topicTitle:'Titre du sujet', topicPlaceholder:'De quoi souhaitez-vous parler ?', openingMessage:'Message d’ouverture (facultatif)', openingPlaceholder:'Ajoutez du contexte ou lancez la discussion…', createTopic:'Créer le Sujet', cancelTopic:'Annuler', topicCreated:'Votre sujet de discussion est en ligne.', topicError:'Impossible de créer ce sujet.',
    prompt:['Amora','Qu’est-ce qui rend un espace ou une relation LGBTQ+ réellement sûr, respectueux et solidaire ?']
  },
  it: {
    title:'Chat Comunitaria LGBTQ+',
    subtitle:'Uno spazio LGBTQ+ dedicato a connessione, domande, incoraggiamento e conversazioni rispettose.',
    back:'Torna al Supporto LGBTQ+',
    safetyTitle:'Questo è uno spazio comunitario protetto',
    safetyBody:'Niente bullismo, odio, minacce, outing, molestie sessuali o condivisione di informazioni private altrui. Non devi rivelare o dimostrare la tua identità per partecipare con rispetto.',
    report:'Segnala', mute:'Silenzia', reported:'Segnalazione inviata alla moderazione.', muted:'Membro silenziato per te.',
    reportPrompt:'Spiega brevemente perché segnali questo messaggio: molestie, odio, minaccia, outing/informazioni private, molestie sessuali, ecc.',
    muteConfirm:'Silenziare questo membro? I suoi messaggi non appariranno più per te.',
    topics:'Argomenti Chat', mainRoom:'Stanza Principale', startTopic:'Avvia un Argomento', topicTitle:'Titolo argomento', topicPlaceholder:'Di cosa vuoi parlare?', openingMessage:'Messaggio iniziale (opzionale)', openingPlaceholder:'Aggiungi un po’ di contesto o avvia la conversazione…', createTopic:'Avvia Argomento', cancelTopic:'Annulla', topicCreated:'Il tuo argomento è ora attivo.', topicError:'Impossibile avviare questo argomento.',
    prompt:['Amora','Cosa rende uno spazio o una relazione LGBTQ+ davvero sicuro, rispettoso e solidale?']
  },
  de: {
    title:'LGBTQ+ Community-Chat',
    subtitle:'Ein eigener LGBTQ+ Raum für Austausch, Fragen, Ermutigung und respektvolle Gespräche.',
    back:'Zurück zur LGBTQ+ Unterstützung',
    safetyTitle:'Dies ist ein geschützter Community-Raum',
    safetyBody:'Kein Mobbing, keine Hassrede, Drohungen, Outing, sexuelle Belästigung oder Weitergabe privater Informationen anderer. Du musst deine Identität nicht offenlegen oder beweisen, um respektvoll teilzunehmen.',
    report:'Melden', mute:'Stummschalten', reported:'Meldung an die Moderation gesendet.', muted:'Mitglied für dich stummgeschaltet.',
    reportPrompt:'Beschreibe kurz den Grund der Meldung: Belästigung, Hassrede, Drohung, Outing/private Informationen, sexuelle Belästigung usw.',
    muteConfirm:'Dieses Mitglied stummschalten? Seine Nachrichten werden dir nicht mehr angezeigt.',
    topics:'Chat-Themen', mainRoom:'Hauptraum', startTopic:'Thema Starten', topicTitle:'Thementitel', topicPlaceholder:'Worüber möchtest du sprechen?', openingMessage:'Eröffnungsnachricht (optional)', openingPlaceholder:'Gib etwas Kontext oder starte das Gespräch…', createTopic:'Thema Starten', cancelTopic:'Abbrechen', topicCreated:'Dein Chat-Thema ist jetzt aktiv.', topicError:'Dieses Chat-Thema konnte nicht gestartet werden.',
    prompt:['Amora','Was macht einen LGBTQ+ Raum oder eine Beziehung wirklich sicher, respektvoll und unterstützend?']
  },
};

const copy = {
  en: {
    title: 'One2OneLove Chat Rooms', subtitle: 'Real conversations about love, dating, marriage and relationships.', back: 'Back',
    online: 'active now', messages: 'messages', choose: 'Choose a conversation', loading: 'Loading conversations…',
    empty: 'The conversation starter is above. Be the first to answer and get this room talking.', placeholder: 'Share your thoughts respectfully…', send: 'Send',
    signIn: 'Sign in to join the conversation', readOnly: 'You can read the conversation now. Sign in to post.', featuredBadgeOpen: '💯 Voting closed · Results saved', featuredBadgeClosed: '💯 Voting closed · Results saved',
    guidelines: 'Respect the room', guidelinesBody: 'Be kind. No harassment, threats, hate speech, explicit sexual content, personal attacks, or sharing someone else’s private information.',
    prompt: 'Conversation starter', delete: 'Delete message', refresh: 'Refresh', defaultPrompt:'What is on your mind today?', loadRoomsError:'Unable to load chat rooms.', emptyRooms:'No conversations are available right now.', loadMessagesError:'Unable to load messages.', sendError:'Unable to send message.', deleteError:'Unable to delete message.',
    prompts: {
      'studio-who-should-apologize-first': ['O2OL Studio', 'After watching Episode 1, who do you think should apologize first — and why?'],
      'studio-who-pays-for-the-first-date': ['O2OL Studio', 'After watching Episode 2, who should pay for the first date — and why?'],
      'general-connection': ['O2OL', 'What is one small thing that makes you feel genuinely connected to someone?'],
      'dating-new-relationships': ['Amora', 'What should two people talk about early so expectations do not become assumptions?'],
      'marriage-partnership': ['O2OL', 'What is something married couples should protect even when life gets busy?'],
      'communication-conflict': ['Amora', 'When conflict starts, what helps you feel heard instead of simply answered?'],
      'trust-boundaries-growth': ['O2OL', 'Where is the line between a healthy boundary and trying to control your partner?'],
      'love-intimacy-connection': ['Amora', 'What makes emotional intimacy feel safe, not forced?'],
    },
  },
  es: {
    title: 'Salas de Chat One2OneLove', subtitle: 'Conversaciones reales sobre amor, citas, matrimonio y relaciones.', back: 'Volver',
    online: 'activos ahora', messages: 'mensajes', choose: 'Elige una conversación', loading: 'Cargando conversaciones…',
    empty: 'El tema para conversar está arriba. Sé la primera persona en responder y dar vida a esta sala.', placeholder: 'Comparte tus ideas con respeto…', send: 'Enviar',
    signIn: 'Inicia sesión para participar', readOnly: 'Puedes leer la conversación. Inicia sesión para publicar.', featuredBadgeOpen: '💯 Votación cerrada · Resultados guardados', featuredBadgeClosed: '💯 Votación cerrada · Resultados guardados',
    guidelines: 'Respeta la sala', guidelinesBody: 'Sé amable. No se permite acoso, amenazas, odio, contenido sexual explícito, ataques personales ni compartir información privada de otra persona.',
    prompt: 'Tema para conversar', delete: 'Eliminar mensaje', refresh: 'Actualizar', defaultPrompt:'¿Qué tienes en mente hoy?', loadRoomsError:'No se pudieron cargar las salas de chat.', emptyRooms:'No hay conversaciones disponibles en este momento.', loadMessagesError:'No se pudieron cargar los mensajes.', sendError:'No se pudo enviar el mensaje.', deleteError:'No se pudo eliminar el mensaje.',
    prompts: {
      'studio-who-should-apologize-first': ['O2OL Studio', 'Después de ver el Episodio 1, ¿quién crees que debería disculparse primero y por qué?'],
      'studio-who-pays-for-the-first-date': ['O2OL Studio', 'Después de ver el Episodio 2, ¿quién debería pagar en la primera cita y por qué?'],
      'general-connection': ['O2OL', '¿Qué pequeño detalle te hace sentir realmente conectado con alguien?'],
      'dating-new-relationships': ['Amora', '¿De qué deberían hablar dos personas al principio para que las expectativas no se conviertan en suposiciones?'],
      'marriage-partnership': ['O2OL', '¿Qué deberían proteger las parejas casadas incluso cuando la vida se vuelve ocupada?'],
      'communication-conflict': ['Amora', 'Cuando comienza un conflicto, ¿qué te ayuda a sentirte escuchado en vez de simplemente respondido?'],
      'trust-boundaries-growth': ['O2OL', '¿Dónde está la línea entre un límite saludable y tratar de controlar a tu pareja?'],
      'love-intimacy-connection': ['Amora', '¿Qué hace que la intimidad emocional se sienta segura y no forzada?'],
    },
  },
  fr: {
    title: 'Salons One2OneLove', subtitle: 'De vraies conversations sur l’amour, les rencontres, le mariage et les relations.', back: 'Retour',
    online: 'actifs maintenant', messages: 'messages', choose: 'Choisissez une conversation', loading: 'Chargement des conversations…',
    empty: 'Aucun message pour le moment. Lancez la conversation.', placeholder: 'Partagez vos pensées avec respect…', send: 'Envoyer',
    signIn: 'Connectez-vous pour participer', readOnly: 'Vous pouvez lire la conversation. Connectez-vous pour publier.', featuredBadgeOpen: '💯 Vote terminé · Résultats enregistrés', featuredBadgeClosed: '💯 Vote terminé · Résultats enregistrés',
    guidelines: 'Respectez le salon', guidelinesBody: 'Soyez bienveillant. Pas de harcèlement, menaces, haine, contenu sexuel explicite, attaques personnelles ou partage d’informations privées d’autrui.',
    prompt: 'Point de départ', delete: 'Supprimer le message', refresh: 'Actualiser', defaultPrompt:'À quoi pensez-vous aujourd’hui ?', loadRoomsError:'Impossible de charger les salons.', emptyRooms:'Aucune conversation n’est disponible pour le moment.', loadMessagesError:'Impossible de charger les messages.', sendError:'Impossible d’envoyer le message.', deleteError:'Impossible de supprimer le message.',
    prompts: {
      'studio-who-should-apologize-first': ['O2OL Studio', 'Après avoir regardé l’épisode 1, qui devrait selon vous s’excuser en premier — et pourquoi ?'],
      'studio-who-pays-for-the-first-date': ['O2OL Studio', 'Après l’épisode 2, qui devrait payer au premier rendez-vous — et pourquoi ?'],
      'general-connection': ['O2OL', 'Quel petit geste vous fait vous sentir réellement connecté à quelqu’un ?'],
      'dating-new-relationships': ['Amora', 'De quoi deux personnes devraient-elles parler tôt pour éviter que les attentes deviennent des suppositions ?'],
      'marriage-partnership': ['O2OL', 'Que devraient protéger les couples mariés même lorsque la vie devient très chargée ?'],
      'communication-conflict': ['Amora', 'Quand un conflit commence, qu’est-ce qui vous aide à vous sentir entendu plutôt que simplement répondu ?'],
      'trust-boundaries-growth': ['O2OL', 'Où se situe la limite entre une frontière saine et le contrôle de son partenaire ?'],
      'love-intimacy-connection': ['Amora', 'Qu’est-ce qui rend l’intimité émotionnelle sûre plutôt que forcée ?'],
    },
  },
  it: {
    title: 'Stanze Chat One2OneLove', subtitle: 'Conversazioni vere su amore, incontri, matrimonio e relazioni.', back: 'Indietro',
    online: 'attivi ora', messages: 'messaggi', choose: 'Scegli una conversazione', loading: 'Caricamento conversazioni…',
    empty: 'Lo spunto di conversazione è qui sopra. Sii la prima persona a rispondere e ad animare la stanza.', placeholder: 'Condividi i tuoi pensieri con rispetto…', send: 'Invia',
    signIn: 'Accedi per partecipare', readOnly: 'Puoi leggere la conversazione. Accedi per pubblicare.', featuredBadgeOpen: '💯 Votazione chiusa · Risultati salvati', featuredBadgeClosed: '💯 Votazione chiusa · Risultati salvati',
    guidelines: 'Rispetta la stanza', guidelinesBody: 'Sii gentile. Niente molestie, minacce, odio, contenuti sessuali espliciti, attacchi personali o condivisione di informazioni private altrui.',
    prompt: 'Spunto di conversazione', delete: 'Elimina messaggio', refresh: 'Aggiorna', defaultPrompt:'A cosa stai pensando oggi?', loadRoomsError:'Impossibile caricare le stanze di chat.', emptyRooms:'Nessuna conversazione è disponibile al momento.', loadMessagesError:'Impossibile caricare i messaggi.', sendError:'Impossibile inviare il messaggio.', deleteError:'Impossibile eliminare il messaggio.',
    prompts: {
      'studio-who-should-apologize-first': ['O2OL Studio', 'Dopo aver visto l’Episodio 1, chi pensi dovrebbe scusarsi per primo — e perché?'],
      'studio-who-pays-for-the-first-date': ['O2OL Studio', 'Dopo l’Episodio 2, chi dovrebbe pagare al primo appuntamento — e perché?'],
      'general-connection': ['O2OL', 'Qual è una piccola cosa che ti fa sentire davvero connesso a qualcuno?'],
      'dating-new-relationships': ['Amora', 'Di cosa dovrebbero parlare due persone all’inizio per evitare che le aspettative diventino supposizioni?'],
      'marriage-partnership': ['O2OL', 'Che cosa dovrebbero proteggere le coppie sposate anche quando la vita diventa frenetica?'],
      'communication-conflict': ['Amora', 'Quando inizia un conflitto, cosa ti aiuta a sentirti ascoltato invece che semplicemente risposto?'],
      'trust-boundaries-growth': ['O2OL', 'Dove passa il confine tra un limite sano e il tentativo di controllare il partner?'],
      'love-intimacy-connection': ['Amora', 'Cosa rende l’intimità emotiva sicura e non forzata?'],
    },
  },
  de: {
    title: 'One2OneLove Chaträume', subtitle: 'Echte Gespräche über Liebe, Dating, Ehe und Beziehungen.', back: 'Zurück',
    online: 'jetzt aktiv', messages: 'Nachrichten', choose: 'Wähle ein Gespräch', loading: 'Gespräche werden geladen…',
    empty: 'Der Gesprächsimpuls steht oben. Sei die erste Person, die antwortet und den Raum ins Gespräch bringt.', placeholder: 'Teile deine Gedanken respektvoll…', send: 'Senden',
    signIn: 'Melde dich an, um mitzuschreiben', readOnly: 'Du kannst das Gespräch lesen. Melde dich an, um zu schreiben.', featuredBadgeOpen: '💯 Abstimmung geschlossen · Ergebnisse gespeichert', featuredBadgeClosed: '💯 Abstimmung geschlossen · Ergebnisse gespeichert',
    guidelines: 'Respektiere den Raum', guidelinesBody: 'Sei freundlich. Keine Belästigung, Drohungen, Hassrede, explizit sexuelle Inhalte, persönlichen Angriffe oder Weitergabe privater Informationen anderer.',
    prompt: 'Gesprächsimpuls', delete: 'Nachricht löschen', refresh: 'Aktualisieren', defaultPrompt:'Was beschäftigt dich heute?', loadRoomsError:'Chaträume konnten nicht geladen werden.', emptyRooms:'Derzeit sind keine Gespräche verfügbar.', loadMessagesError:'Nachrichten konnten nicht geladen werden.', sendError:'Nachricht konnte nicht gesendet werden.', deleteError:'Nachricht konnte nicht gelöscht werden.',
    prompts: {
      'studio-who-should-apologize-first': ['O2OL Studio', 'Wer sollte sich nach Episode 1 deiner Meinung nach zuerst entschuldigen — und warum?'],
      'studio-who-pays-for-the-first-date': ['O2OL Studio', 'Wer sollte nach Folge 2 beim ersten Date bezahlen — und warum?'],
      'general-connection': ['O2OL', 'Welche kleine Sache lässt dich echte Verbundenheit mit jemandem spüren?'],
      'dating-new-relationships': ['Amora', 'Worüber sollten zwei Menschen früh sprechen, damit Erwartungen nicht zu Annahmen werden?'],
      'marriage-partnership': ['O2OL', 'Was sollten verheiratete Paare schützen, selbst wenn das Leben sehr beschäftigt wird?'],
      'communication-conflict': ['Amora', 'Was hilft dir in einem Konflikt, dich gehört statt nur beantwortet zu fühlen?'],
      'trust-boundaries-growth': ['O2OL', 'Wo liegt die Grenze zwischen einer gesunden Grenze und dem Versuch, den Partner zu kontrollieren?'],
      'love-intimacy-connection': ['Amora', 'Was lässt emotionale Intimität sicher statt erzwungen wirken?'],
    },
  },
};

const roomLabels = {
  en: {
    'lgbtq-community': [lgbtqCopy.en.title, lgbtqCopy.en.subtitle],
    'studio-who-should-apologize-first': ['O2OL Studio — Who Should Apologize First?', 'Season 1, Episode 1 discussion. Watch the episode, then share your perspective with the One2OneLove community.'],
    'studio-who-pays-for-the-first-date': ['O2OL Studio — Who Pays for the First Date?', 'Season 1, Episode 2 discussion. Watch the episode, then share your perspective with the One2OneLove community.'],
    'general-connection': ['General Connection', 'Open conversation about relationships, love, growth and everyday connection.'],
    'dating-new-relationships': ['Dating & New Relationships', 'Expectations, pacing, trust and early relationship questions.'],
    'marriage-partnership': ['Marriage & Partnership', 'Marriage, commitment, connection and everyday partnership.'],
    'communication-conflict': ['Communication & Conflict', 'Listening, disagreements, repair and healthier communication.'],
    'trust-boundaries-growth': ['Trust, Boundaries & Growth', 'Trust, boundaries, accountability and relationship security.'],
    'love-intimacy-connection': ['Love, Intimacy & Connection', 'Affection, emotional closeness, romance and intimacy.'],
  },
  es: {
    'lgbtq-community': [lgbtqCopy.es.title, lgbtqCopy.es.subtitle],
    'studio-who-should-apologize-first': ['O2OL Studio — ¿Quién Debería Disculparse Primero?', 'Conversación sobre la Temporada 1, Episodio 1. Mira el episodio y comparte tu punto de vista con la comunidad One2OneLove.'],
    'studio-who-pays-for-the-first-date': ['O2OL Studio — ¿Quién Paga en la Primera Cita?', 'Conversación sobre la Temporada 1, Episodio 2. Mira el episodio y comparte tu punto de vista con la comunidad One2OneLove.'],
    'general-connection': ['Conexión General', 'Conversación abierta sobre relaciones, amor, crecimiento y conexión cotidiana.'],
    'dating-new-relationships': ['Citas y Nuevas Relaciones', 'Expectativas, ritmo, confianza y preguntas de nuevas relaciones.'],
    'marriage-partnership': ['Matrimonio y Pareja', 'Matrimonio, compromiso, conexión y vida en pareja.'],
    'communication-conflict': ['Comunicación y Conflicto', 'Escucha, desacuerdos, reparación y comunicación saludable.'],
    'trust-boundaries-growth': ['Confianza, Límites y Crecimiento', 'Confianza, límites, responsabilidad y seguridad emocional.'],
    'love-intimacy-connection': ['Amor, Intimidad y Conexión', 'Afecto, cercanía emocional, romance e intimidad.'],
  },
  fr: {
    'lgbtq-community': [lgbtqCopy.fr.title, lgbtqCopy.fr.subtitle],
    'studio-who-should-apologize-first': ['O2OL Studio — Qui Devrait S’excuser en Premier ?', 'Discussion sur la Saison 1, Épisode 1. Regardez l’épisode puis partagez votre point de vue avec la communauté One2OneLove.'],
    'studio-who-pays-for-the-first-date': ['O2OL Studio — Qui Paie au Premier Rendez-vous ?', 'Discussion sur la Saison 1, Épisode 2. Regardez l’épisode puis partagez votre point de vue avec la communauté One2OneLove.'],
    'general-connection': ['Connexion Générale', 'Conversation ouverte sur les relations, l’amour, la croissance et la connexion quotidienne.'],
    'dating-new-relationships': ['Rencontres et Nouvelles Relations', 'Attentes, rythme, confiance et débuts de relation.'],
    'marriage-partnership': ['Mariage et Partenariat', 'Mariage, engagement, connexion et vie de couple.'],
    'communication-conflict': ['Communication et Conflit', 'Écoute, désaccords, réparation et communication plus saine.'],
    'trust-boundaries-growth': ['Confiance, Limites et Croissance', 'Confiance, limites, responsabilité et sécurité relationnelle.'],
    'love-intimacy-connection': ['Amour, Intimité et Connexion', 'Affection, proximité émotionnelle, romance et intimité.'],
  },
  it: {
    'lgbtq-community': [lgbtqCopy.it.title, lgbtqCopy.it.subtitle],
    'studio-who-should-apologize-first': ['O2OL Studio — Chi Dovrebbe Scusarsi per Primo?', 'Discussione sulla Stagione 1, Episodio 1. Guarda l’episodio e condividi il tuo punto di vista con la community One2OneLove.'],
    'studio-who-pays-for-the-first-date': ['O2OL Studio — Chi Paga al Primo Appuntamento?', 'Discussione sulla Stagione 1, Episodio 2. Guarda l’episodio e condividi il tuo punto di vista con la community One2OneLove.'],
    'general-connection': ['Connessione Generale', 'Conversazione aperta su relazioni, amore, crescita e connessione quotidiana.'],
    'dating-new-relationships': ['Incontri e Nuove Relazioni', 'Aspettative, ritmo, fiducia e domande iniziali.'],
    'marriage-partnership': ['Matrimonio e Partnership', 'Matrimonio, impegno, connessione e vita di coppia.'],
    'communication-conflict': ['Comunicazione e Conflitto', 'Ascolto, disaccordi, riparazione e comunicazione sana.'],
    'trust-boundaries-growth': ['Fiducia, Confini e Crescita', 'Fiducia, confini, responsabilità e sicurezza relazionale.'],
    'love-intimacy-connection': ['Amore, Intimità e Connessione', 'Affetto, vicinanza emotiva, romanticismo e intimità.'],
  },
  de: {
    'lgbtq-community': [lgbtqCopy.de.title, lgbtqCopy.de.subtitle],
    'studio-who-should-apologize-first': ['O2OL Studio — Wer Sollte Sich Zuerst Entschuldigen?', 'Diskussion zu Staffel 1, Folge 1. Schau dir die Folge an und teile anschließend deine Sicht mit der One2OneLove-Community.'],
    'studio-who-pays-for-the-first-date': ['O2OL Studio — Wer Bezahlt beim Ersten Date?', 'Diskussion zu Staffel 1, Folge 2. Schau dir die Folge an und teile anschließend deine Sicht mit der One2OneLove-Community.'],
    'general-connection': ['Allgemeine Verbindung', 'Offenes Gespräch über Beziehungen, Liebe, Wachstum und alltägliche Verbundenheit.'],
    'dating-new-relationships': ['Dating und Neue Beziehungen', 'Erwartungen, Tempo, Vertrauen und frühe Beziehungsfragen.'],
    'marriage-partnership': ['Ehe und Partnerschaft', 'Ehe, Verbindlichkeit, Nähe und gemeinsamer Alltag.'],
    'communication-conflict': ['Kommunikation und Konflikt', 'Zuhören, Meinungsverschiedenheiten, Reparatur und gesündere Kommunikation.'],
    'trust-boundaries-growth': ['Vertrauen, Grenzen und Wachstum', 'Vertrauen, Grenzen, Verantwortung und Beziehungssicherheit.'],
    'love-intimacy-connection': ['Liebe, Intimität und Verbindung', 'Zuneigung, emotionale Nähe, Romantik und Intimität.'],
  },
};

export default function Chat() {
  const { currentLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const lgbtqMode = searchParams.get('scope') === 'lgbtq';
  const requestedRoomSlug = searchParams.get('room');
  const t = copy[currentLanguage] || copy.en;
  const lt = lgbtqCopy[currentLanguage] || lgbtqCopy.en;
  const labels = roomLabels[currentLanguage] || roomLabels.en;
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicOpening, setTopicOpening] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const sectionRef = useRef(null);
  const userPickedRoomRef = useRef(false);

  const selectedRoom = useMemo(() => rooms.find(room => room.id === selectedRoomId) || rooms[0] || null, [rooms, selectedRoomId]);
  const roomLabel = selectedRoom ? (labels[selectedRoom.slug] || [selectedRoom.name, selectedRoom.description]) : null;
  const prompt = selectedRoom
    ? (selectedRoom.slug === 'lgbtq-community' ? lt.prompt : (t.prompts[selectedRoom.slug] || ['O2OL', t.defaultPrompt]))
    : null;
  const votingQuestion = selectedRoom ? questionForRoom(selectedRoom.slug) : null;

  const loadRooms = async () => {
    try {
      const data = await getCommunityChatRooms(lgbtqMode ? 'lgbtq' : 'general');
      setRoomsError(false);
      setRooms(data);
      setSelectedRoomId(current => {
        const requested = requestedRoomSlug ? data.find(room => room.slug === requestedRoomSlug) : null;
        if (requested) return requested.id;
        if (current && data.some(room => room.id === current)) return current;
        return data[0]?.id || null;
      });
    } catch (error) {
      setRoomsError(true);
      console.error('Unable to load chat rooms:', error);
      toast.error(currentLanguage === 'en' ? (error?.message || t.loadRoomsError) : t.loadRoomsError);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId, quiet = false) => {
    if (!roomId) return;
    if (!quiet) setLoadingMessages(true);
    try {
      const data = await getCommunityChatMessages(roomId, lgbtqMode ? selectedTopicId : null);
      setMessages(data);
    } catch (error) {
      if (!quiet) {
        console.error('Unable to load messages:', error);
        toast.error(currentLanguage === 'en' ? (error?.message || t.loadMessagesError) : t.loadMessagesError);
      }
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  };

  const loadTopics = async (roomId = selectedRoomId) => {
    if (!lgbtqMode || !roomId) {
      setTopics([]);
      setSelectedTopicId(null);
      return;
    }
    try {
      const data = await getCommunityChatTopics(roomId);
      setTopics(data);
      setSelectedTopicId(current => current && data.some(topic => topic.id === current) ? current : null);
    } catch (error) {
      console.error('Unable to load LGBTQ+ chat topics:', error);
    }
  };

  const startTopic = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) return toast.error(t.signIn);
    const title = topicTitle.trim();
    if (title.length < 3 || creatingTopic || !selectedRoomId) return;
    setCreatingTopic(true);
    try {
      const topic = await createCommunityChatTopic(selectedRoomId, title, topicOpening.trim());
      setTopicTitle('');
      setTopicOpening('');
      setTopicFormOpen(false);
      await loadTopics(selectedRoomId);
      if (topic?.id) setSelectedTopicId(topic.id);
      toast.success(lt.topicCreated);
    } catch (error) {
      toast.error(error?.message || lt.topicError);
    } finally {
      setCreatingTopic(false);
    }
  };

  useEffect(() => { loadRooms(); }, [lgbtqMode, requestedRoomSlug]);
  useEffect(() => {
    if (!selectedRoomId) return;
    loadMessages(selectedRoomId);
    if (lgbtqMode) loadTopics(selectedRoomId);
    // Poll intervals are unchanged while the tab is visible (chat still
    // feels live), but a hidden/background tab must not poll at full rate
    // forever — forgotten chat tabs were a top driver of the Oct 7
    // database query burn. Polling resumes on the next tick once visible.
    const tabHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const messageTimer = window.setInterval(() => { if (!tabHidden()) loadMessages(selectedRoomId, true); }, 3000);
    const roomTimer = window.setInterval(() => { if (!tabHidden()) loadRooms(); }, 10000);
    const topicTimer = lgbtqMode ? window.setInterval(() => { if (!tabHidden()) loadTopics(selectedRoomId); }, 10000) : null;
    let presenceTimer;
    if (isAuthenticated) {
      touchCommunityChatPresence(selectedRoomId).catch(() => {});
      presenceTimer = window.setInterval(() => { if (!tabHidden()) touchCommunityChatPresence(selectedRoomId).catch(() => {}); }, 45000);
    }
    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(roomTimer);
      if (topicTimer) window.clearInterval(topicTimer);
      if (presenceTimer) window.clearInterval(presenceTimer);
    };
  }, [selectedRoomId, selectedTopicId, isAuthenticated, lgbtqMode]);

  // Chat-close rule (Oct 7): stepping out of a room closes it. Presence is
  // per-room, so this effect is keyed on the room (not the topic): when the
  // member switches rooms, leaves the page (unmount), or the tab closes /
  // is hidden for good (pagehide), a beacon leave deletes their presence
  // row immediately and the room drops to empty instead of burning polls
  // and presence until a timeout. Re-entering is a fresh join — the
  // polling effect above re-touches presence and reloads messages.
  // Guests hold no presence row, so there is nothing for them to leave.
  useEffect(() => {
    if (!selectedRoomId || !isAuthenticated) return undefined;
    const roomId = selectedRoomId;
    const leave = () => { beaconLeaveCommunityChatRoom(roomId); };
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      leave();
    };
  }, [selectedRoomId, isAuthenticated]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, selectedRoomId]);

  // On phones the room list stacks above the conversation, so a tapped room
  // used to highlight in place while its conversation sat off-screen below.
  // After a deliberate tap, bring the conversation into view.
  useEffect(() => {
    if (!userPickedRoomRef.current) return;
    userPickedRoomRef.current = false;
    if (window.innerWidth < 1024) sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedRoomId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error(t.signIn);
      return;
    }
    const text = message.trim();
    if (!text || !selectedRoomId || sending) return;
    setSending(true);
    try {
      await sendCommunityChatMessage(selectedRoomId, text, null, lgbtqMode ? selectedTopicId : null);
      setMessage('');
      await Promise.all([loadMessages(selectedRoomId, true), loadRooms()]);
    } catch (error) {
      console.error('Unable to send message:', error);
      toast.error(currentLanguage === 'en' ? (error?.message || t.sendError) : t.sendError);
    } finally {
      setSending(false);
    }
  };

  const removeMessage = async (messageId) => {
    try {
      await deleteCommunityChatMessage(messageId);
      await loadMessages(selectedRoomId, true);
    } catch (error) {
      console.error('Unable to delete message:', error);
      toast.error(currentLanguage === 'en' ? (error?.message || t.deleteError) : t.deleteError);
    }
  };

  const reportMessage = async (item) => {
    if (!isAuthenticated) return toast.error(t.signIn);
    const reason = window.prompt(lt.reportPrompt);
    if (!reason?.trim()) return;
    try {
      await reportCommunityChatMessage(item.id, reason.trim());
      toast.success(lt.reported);
    } catch (error) {
      toast.error(error?.message || t.sendError);
    }
  };

  const muteMember = async (item) => {
    if (!isAuthenticated || !item?.userId) return;
    if (!window.confirm(lt.muteConfirm)) return;
    try {
      await muteCommunityChatUser(item.userId);
      await loadMessages(selectedRoomId, true);
      toast.success(lt.muted);
    } catch (error) {
      toast.error(error?.message || t.sendError);
    }
  };

  const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(currentLanguage || 'en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <Link to={lgbtqMode ? createPageUrl('LGBTQSupport') : createPageUrl('Home')} className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-purple-700">
          <ArrowLeft size={18}/>{lgbtqMode ? lt.back : t.back}
        </Link>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg"><MessageCircle size={32}/></div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{lgbtqMode ? lt.title : t.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-600">{lgbtqMode ? lt.subtitle : t.subtitle}</p>
          {lgbtqMode && <div className="mx-auto mt-5 max-w-4xl overflow-hidden rounded-2xl border border-purple-200 bg-white text-left shadow-sm"><div className="grid h-2 grid-cols-6"><span className="bg-red-500"/><span className="bg-orange-500"/><span className="bg-yellow-400"/><span className="bg-green-500"/><span className="bg-blue-500"/><span className="bg-violet-600"/></div><div className="flex items-start gap-3 p-4"><ShieldCheck className="mt-0.5 shrink-0 text-purple-600" size={20}/><div><p className="font-black text-slate-900">{lt.safetyTitle}</p><p className="mt-1 text-sm leading-6 text-slate-600">{lt.safetyBody}</p></div></div></div>}
        </div>

        <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-purple-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-2">
              <h2 className="font-black text-slate-900">{t.choose}</h2>
              <button type="button" onClick={loadRooms} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.refresh}><RefreshCw size={17}/></button>
            </div>
            {loadingRooms ? <p role="status" aria-live="polite" className="px-2 py-6 text-sm text-slate-500">{t.loading}</p> : (
              <div className="space-y-2">
                <style>{`@keyframes r100Glow{0%{box-shadow:0 0 0 0 rgba(251,191,36,0)}25%{box-shadow:0 0 0 5px rgba(251,191,36,.55)}100%{box-shadow:0 0 0 0 rgba(251,191,36,0)}}.r100-glow{animation:r100Glow 2s ease-out 1}@media (prefers-reduced-motion: reduce){.r100-glow{animation:none}}`}</style>
                {rooms.length === 0 && <p className="px-2 py-4 text-sm text-slate-500">{roomsError ? t.loadRoomsError : t.emptyRooms}</p>}
                {rooms.map(room => {
                  const label = labels[room.slug] || [room.name, room.description];
                  const active = room.id === selectedRoom?.id;
                  const featured = room.slug === 'relationship-100';
                  const nowMs = Date.now();
                  const featuredBadge = featured ? t.featuredBadgeClosed : null; // Owner decision 2026-10-08: voting CLOSED — badge shows the closed copy.
                  return (
                    <button key={room.id} type="button" onClick={() => { userPickedRoomRef.current = true; setSelectedRoomId(room.id); }} className={`w-full rounded-2xl border p-4 text-left transition ${featured ? `border-amber-400 bg-gradient-to-br from-[#5c0e1a] via-[#7f1d2d] to-[#5c0e1a] shadow-md r100-glow ${active ? 'ring-2 ring-amber-300' : 'hover:border-amber-300'}` : active ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/40'}`}>
                      <div className="flex items-start gap-3"><span className="text-2xl">{room.icon || '💬'}</span><div className="min-w-0 flex-1"><p className={featured ? 'font-extrabold text-[#f7f2e7]' : 'font-extrabold text-slate-900'}>{label[0]}</p><p className={featured ? 'mt-1 text-xs leading-5 text-[#f7f2e7]/75' : 'mt-1 line-clamp-2 text-xs leading-5 text-slate-500'}>{label[1]}</p></div></div>
                      {featuredBadge && <div className="mt-3"><span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#5c0e1a] shadow-sm">{featuredBadge}</span></div>}
                      <div className={featured ? 'mt-3 flex gap-3 text-xs font-semibold text-[#f7f2e7]/75' : 'mt-3 flex gap-3 text-xs font-semibold text-slate-500'}><span className="inline-flex items-center gap-1"><Users size={14}/>{room.online_count} {t.online}</span><span>{room.message_count} {t.messages}</span></div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section ref={sectionRef} className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
            {selectedRoom ? (
              <>
                <div className="border-b border-slate-200 bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white">
                  <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black">{roomLabel?.[0]}</h2><p className="mt-1 text-sm text-white/90">{roomLabel?.[1]}</p></div><div className="rounded-xl bg-white/15 px-3 py-2 text-sm font-bold"><Users className="mr-1 inline" size={16}/>{selectedRoom.online_count}</div></div>
                </div>

                {lgbtqMode && (
                  <div className="border-b border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-purple-600">{lt.topics}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={()=>setSelectedTopicId(null)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${!selectedTopicId?'border-purple-500 bg-purple-600 text-white':'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`}>{lt.mainRoom}</button>
                          {topics.map(topic=><button key={topic.id} type="button" onClick={()=>setSelectedTopicId(topic.id)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedTopicId===topic.id?'border-purple-500 bg-purple-600 text-white':'border-slate-200 bg-white text-slate-600 hover:border-purple-300'}`} title={`${topic.messageCount || 0} messages`}>{topic.title}</button>)}
                        </div>
                      </div>
                      {isAuthenticated && <button type="button" onClick={()=>setTopicFormOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 py-2 text-sm font-black text-white shadow-sm"><Plus size={16}/>{lt.startTopic}</button>}
                    </div>
                    {topicFormOpen && <form onSubmit={startTopic} className="relative mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
                      <button type="button" onClick={()=>setTopicFormOpen(false)} className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700" aria-label={lt.cancelTopic}><X size={17}/></button>
                      <label className="block text-xs font-black uppercase tracking-wide text-slate-600">{lt.topicTitle}</label>
                      <input value={topicTitle} onChange={e=>setTopicTitle(e.target.value.slice(0,160))} placeholder={lt.topicPlaceholder} maxLength={160} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100" autoFocus/>
                      <label className="mt-3 block text-xs font-black uppercase tracking-wide text-slate-600">{lt.openingMessage}</label>
                      <textarea value={topicOpening} onChange={e=>setTopicOpening(e.target.value.slice(0,2000))} placeholder={lt.openingPlaceholder} rows={3} maxLength={2000} className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"/>
                      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={()=>setTopicFormOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">{lt.cancelTopic}</button><button type="submit" disabled={creatingTopic||topicTitle.trim().length<3} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{creatingTopic?t.loading:lt.createTopic}</button></div>
                    </form>}
                  </div>
                )}

                {prompt && (
                  <div className="border-b border-purple-100 bg-purple-50 p-4 sm:p-5">
                    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-purple-700 shadow-sm">{prompt[0] === 'Amora' ? 'A' : 'O'}</div><div><p className="text-xs font-black uppercase tracking-wide text-purple-600">{t.prompt} · {prompt[0]}</p><p className="mt-1 font-semibold leading-6 text-slate-800">{prompt[1]}</p></div></div>
                  </div>
                )}

                {votingQuestion && (
                  <VotingCard key={votingQuestion.slug} question={votingQuestion} language={currentLanguage} isAuthenticated={isAuthenticated} />
                )}

                <div className="h-[52vh] min-h-[420px] overflow-y-auto p-4 sm:p-6">
                  {loadingMessages ? <p className="py-10 text-center text-slate-500">{t.loading}</p> : messages.length === 0 ? <div className="grid h-full place-items-center text-center"><div><MessageCircle className="mx-auto mb-3 text-purple-200" size={54}/><p className="font-semibold text-slate-500">{t.empty}</p></div></div> : (
                    <div className="space-y-4">
                      {messages.map(item => {
                        const mine = user?.id === item.userId;
                        return (
                          <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[86%] rounded-2xl px-4 py-3 sm:max-w-[74%] ${mine ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                              <div className="mb-1 flex items-center justify-between gap-3"><span className={`text-xs font-black ${mine ? 'text-white/90' : 'text-purple-700'}`}>{mine ? (firstNameOf(user?.name) || item.authorName) : item.authorName}</span><div className="flex items-center gap-2">{mine ? <button type="button" onClick={() => removeMessage(item.id)} className="opacity-70 hover:opacity-100" aria-label={t.delete}><Trash2 size={14}/></button> : (lgbtqMode && isAuthenticated ? <><button type="button" onClick={() => reportMessage(item)} className="text-slate-400 hover:text-rose-600" aria-label={lt.report} title={lt.report}><Flag size={14}/></button><button type="button" onClick={() => muteMember(item)} className="text-slate-400 hover:text-slate-700" aria-label={lt.mute} title={lt.mute}><VolumeX size={14}/></button></> : null)}</div></div>
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.content}</p>
                              <p className={`mt-1 text-[11px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>{formatTime(item.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef}/>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 p-4 sm:p-5">
                  {!isAuthenticated && <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span>{t.readOnly}</span><Link to={createPageUrl('SignIn')} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 font-bold text-white"><LogIn size={15}/>{t.signIn}</Link></div>}
                  <form onSubmit={submit} className="flex gap-3"><textarea value={message} onChange={event => setMessage(event.target.value.slice(0, 2000))} disabled={!isAuthenticated || sending} placeholder={t.placeholder} rows={2} className="min-h-[54px] flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 disabled:bg-slate-50"/><button type="submit" disabled={!isAuthenticated || sending || !message.trim()} className="inline-flex min-w-[96px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 px-4 font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"><Send size={17}/>{t.send}</button></form>
                  <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={15}/><span><strong className="text-slate-700">{t.guidelines}:</strong> {t.guidelinesBody}</span></div>
                </div>
              </>
            ) : loadingRooms ? <div className="grid min-h-[500px] place-items-center text-slate-500">{t.loading}</div> : (
              <div className="grid min-h-[500px] place-items-center p-6 text-center">
                <div>
                  <MessageCircle className="mx-auto mb-3 text-purple-200" size={54}/>
                  <p className="font-semibold text-slate-600">{roomsError ? t.loadRoomsError : t.emptyRooms}</p>
                  {!isAuthenticated ? (
                    <>
                      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{t.readOnly}</p>
                      <Link to={createPageUrl('SignIn')} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 font-bold text-white"><LogIn size={15}/>{t.signIn}</Link>
                    </>
                  ) : (
                    <button type="button" onClick={loadRooms} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-bold text-white"><RefreshCw size={15}/>{t.refresh}</button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
