import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, Users, ShieldCheck, Sparkles, ArrowLeft, Trash2, LogIn, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { createPageUrl } from '@/utils';
import {
  getCommunityChatRooms,
  getCommunityChatMessages,
  sendCommunityChatMessage,
  touchCommunityChatPresence,
  deleteCommunityChatMessage,
} from '@/lib/communityChatService';

const copy = {
  en: {
    title: 'One2OneLove Chat Rooms', subtitle: 'Real conversations about love, dating, marriage and relationships.', back: 'Back',
    online: 'active now', messages: 'messages', choose: 'Choose a conversation', loading: 'Loading conversations…',
    empty: 'No messages yet. Be the first to start the conversation.', placeholder: 'Share your thoughts respectfully…', send: 'Send',
    signIn: 'Sign in to join the conversation', readOnly: 'You can read the conversation now. Sign in to post.',
    guidelines: 'Respect the room', guidelinesBody: 'Be kind. No harassment, threats, hate speech, explicit sexual content, personal attacks, or sharing someone else’s private information.',
    prompt: 'Conversation starter', delete: 'Delete message', refresh: 'Refresh', defaultPrompt:'What is on your mind today?', loadRoomsError:'Unable to load chat rooms.', loadMessagesError:'Unable to load messages.', sendError:'Unable to send message.', deleteError:'Unable to delete message.',
    prompts: {
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
    empty: 'Aún no hay mensajes. Sé la primera persona en iniciar la conversación.', placeholder: 'Comparte tus ideas con respeto…', send: 'Enviar',
    signIn: 'Inicia sesión para participar', readOnly: 'Puedes leer la conversación. Inicia sesión para publicar.',
    guidelines: 'Respeta la sala', guidelinesBody: 'Sé amable. No se permite acoso, amenazas, odio, contenido sexual explícito, ataques personales ni compartir información privada de otra persona.',
    prompt: 'Tema para conversar', delete: 'Eliminar mensaje', refresh: 'Actualizar', defaultPrompt:'¿Qué tienes en mente hoy?', loadRoomsError:'No se pudieron cargar las salas de chat.', loadMessagesError:'No se pudieron cargar los mensajes.', sendError:'No se pudo enviar el mensaje.', deleteError:'No se pudo eliminar el mensaje.',
    prompts: {
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
    signIn: 'Connectez-vous pour participer', readOnly: 'Vous pouvez lire la conversation. Connectez-vous pour publier.',
    guidelines: 'Respectez le salon', guidelinesBody: 'Soyez bienveillant. Pas de harcèlement, menaces, haine, contenu sexuel explicite, attaques personnelles ou partage d’informations privées d’autrui.',
    prompt: 'Point de départ', delete: 'Supprimer le message', refresh: 'Actualiser', defaultPrompt:'À quoi pensez-vous aujourd’hui ?', loadRoomsError:'Impossible de charger les salons.', loadMessagesError:'Impossible de charger les messages.', sendError:'Impossible d’envoyer le message.', deleteError:'Impossible de supprimer le message.',
    prompts: {
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
    empty: 'Ancora nessun messaggio. Inizia tu la conversazione.', placeholder: 'Condividi i tuoi pensieri con rispetto…', send: 'Invia',
    signIn: 'Accedi per partecipare', readOnly: 'Puoi leggere la conversazione. Accedi per pubblicare.',
    guidelines: 'Rispetta la stanza', guidelinesBody: 'Sii gentile. Niente molestie, minacce, odio, contenuti sessuali espliciti, attacchi personali o condivisione di informazioni private altrui.',
    prompt: 'Spunto di conversazione', delete: 'Elimina messaggio', refresh: 'Aggiorna', defaultPrompt:'A cosa stai pensando oggi?', loadRoomsError:'Impossibile caricare le stanze di chat.', loadMessagesError:'Impossibile caricare i messaggi.', sendError:'Impossibile inviare il messaggio.', deleteError:'Impossibile eliminare il messaggio.',
    prompts: {
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
    empty: 'Noch keine Nachrichten. Starte das Gespräch.', placeholder: 'Teile deine Gedanken respektvoll…', send: 'Senden',
    signIn: 'Melde dich an, um mitzuschreiben', readOnly: 'Du kannst das Gespräch lesen. Melde dich an, um zu schreiben.',
    guidelines: 'Respektiere den Raum', guidelinesBody: 'Sei freundlich. Keine Belästigung, Drohungen, Hassrede, explizit sexuelle Inhalte, persönlichen Angriffe oder Weitergabe privater Informationen anderer.',
    prompt: 'Gesprächsimpuls', delete: 'Nachricht löschen', refresh: 'Aktualisieren', defaultPrompt:'Was beschäftigt dich heute?', loadRoomsError:'Chaträume konnten nicht geladen werden.', loadMessagesError:'Nachrichten konnten nicht geladen werden.', sendError:'Nachricht konnte nicht gesendet werden.', deleteError:'Nachricht konnte nicht gelöscht werden.',
    prompts: {
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
    'general-connection': ['General Connection', 'Open conversation about relationships, love, growth and everyday connection.'],
    'dating-new-relationships': ['Dating & New Relationships', 'Expectations, pacing, trust and early relationship questions.'],
    'marriage-partnership': ['Marriage & Partnership', 'Marriage, commitment, connection and everyday partnership.'],
    'communication-conflict': ['Communication & Conflict', 'Listening, disagreements, repair and healthier communication.'],
    'trust-boundaries-growth': ['Trust, Boundaries & Growth', 'Trust, boundaries, accountability and relationship security.'],
    'love-intimacy-connection': ['Love, Intimacy & Connection', 'Affection, emotional closeness, romance and intimacy.'],
  },
  es: {
    'general-connection': ['Conexión General', 'Conversación abierta sobre relaciones, amor, crecimiento y conexión cotidiana.'],
    'dating-new-relationships': ['Citas y Nuevas Relaciones', 'Expectativas, ritmo, confianza y preguntas de nuevas relaciones.'],
    'marriage-partnership': ['Matrimonio y Pareja', 'Matrimonio, compromiso, conexión y vida en pareja.'],
    'communication-conflict': ['Comunicación y Conflicto', 'Escucha, desacuerdos, reparación y comunicación saludable.'],
    'trust-boundaries-growth': ['Confianza, Límites y Crecimiento', 'Confianza, límites, responsabilidad y seguridad emocional.'],
    'love-intimacy-connection': ['Amor, Intimidad y Conexión', 'Afecto, cercanía emocional, romance e intimidad.'],
  },
  fr: {
    'general-connection': ['Connexion Générale', 'Conversation ouverte sur les relations, l’amour, la croissance et la connexion quotidienne.'],
    'dating-new-relationships': ['Rencontres et Nouvelles Relations', 'Attentes, rythme, confiance et débuts de relation.'],
    'marriage-partnership': ['Mariage et Partenariat', 'Mariage, engagement, connexion et vie de couple.'],
    'communication-conflict': ['Communication et Conflit', 'Écoute, désaccords, réparation et communication plus saine.'],
    'trust-boundaries-growth': ['Confiance, Limites et Croissance', 'Confiance, limites, responsabilité et sécurité relationnelle.'],
    'love-intimacy-connection': ['Amour, Intimité et Connexion', 'Affection, proximité émotionnelle, romance et intimité.'],
  },
  it: {
    'general-connection': ['Connessione Generale', 'Conversazione aperta su relazioni, amore, crescita e connessione quotidiana.'],
    'dating-new-relationships': ['Incontri e Nuove Relazioni', 'Aspettative, ritmo, fiducia e domande iniziali.'],
    'marriage-partnership': ['Matrimonio e Partnership', 'Matrimonio, impegno, connessione e vita di coppia.'],
    'communication-conflict': ['Comunicazione e Conflitto', 'Ascolto, disaccordi, riparazione e comunicazione sana.'],
    'trust-boundaries-growth': ['Fiducia, Confini e Crescita', 'Fiducia, confini, responsabilità e sicurezza relazionale.'],
    'love-intimacy-connection': ['Amore, Intimità e Connessione', 'Affetto, vicinanza emotiva, romanticismo e intimità.'],
  },
  de: {
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
  const t = copy[currentLanguage] || copy.en;
  const labels = roomLabels[currentLanguage] || roomLabels.en;
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const selectedRoom = useMemo(() => rooms.find(room => room.id === selectedRoomId) || rooms[0] || null, [rooms, selectedRoomId]);
  const roomLabel = selectedRoom ? (labels[selectedRoom.slug] || [selectedRoom.name, selectedRoom.description]) : null;
  const prompt = selectedRoom ? (t.prompts[selectedRoom.slug] || ['O2OL', t.defaultPrompt]) : null;

  const loadRooms = async () => {
    try {
      const data = await getCommunityChatRooms();
      setRooms(data);
      setSelectedRoomId(current => current || data[0]?.id || null);
    } catch (error) {
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
      const data = await getCommunityChatMessages(roomId);
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

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => {
    if (!selectedRoomId) return;
    loadMessages(selectedRoomId);
    const messageTimer = window.setInterval(() => loadMessages(selectedRoomId, true), 3000);
    const roomTimer = window.setInterval(loadRooms, 10000);
    let presenceTimer;
    if (isAuthenticated) {
      touchCommunityChatPresence(selectedRoomId).catch(() => {});
      presenceTimer = window.setInterval(() => touchCommunityChatPresence(selectedRoomId).catch(() => {}), 45000);
    }
    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(roomTimer);
      if (presenceTimer) window.clearInterval(presenceTimer);
    };
  }, [selectedRoomId, isAuthenticated]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, selectedRoomId]);

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
      await sendCommunityChatMessage(selectedRoomId, text);
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

  const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(currentLanguage || 'en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <Link to={createPageUrl('Home')} className="mb-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-purple-700">
          <ArrowLeft size={18}/>{t.back}
        </Link>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg"><MessageCircle size={32}/></div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-slate-600">{t.subtitle}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-purple-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-2">
              <h2 className="font-black text-slate-900">{t.choose}</h2>
              <button type="button" onClick={loadRooms} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={t.refresh}><RefreshCw size={17}/></button>
            </div>
            {loadingRooms ? <p className="px-2 py-6 text-sm text-slate-500">{t.loading}</p> : (
              <div className="space-y-2">
                {rooms.map(room => {
                  const label = labels[room.slug] || [room.name, room.description];
                  const active = room.id === selectedRoom?.id;
                  return (
                    <button key={room.id} type="button" onClick={() => setSelectedRoomId(room.id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-purple-300 bg-purple-50 shadow-sm' : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/40'}`}>
                      <div className="flex items-start gap-3"><span className="text-2xl">{room.icon || '💬'}</span><div className="min-w-0 flex-1"><p className="font-extrabold text-slate-900">{label[0]}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{label[1]}</p></div></div>
                      <div className="mt-3 flex gap-3 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1"><Users size={14}/>{room.online_count} {t.online}</span><span>{room.message_count} {t.messages}</span></div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-sm">
            {selectedRoom ? (
              <>
                <div className="border-b border-slate-200 bg-gradient-to-r from-purple-600 to-pink-500 p-5 text-white">
                  <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-black">{roomLabel?.[0]}</h2><p className="mt-1 text-sm text-white/90">{roomLabel?.[1]}</p></div><div className="rounded-xl bg-white/15 px-3 py-2 text-sm font-bold"><Users className="mr-1 inline" size={16}/>{selectedRoom.online_count}</div></div>
                </div>

                {prompt && (
                  <div className="border-b border-purple-100 bg-purple-50 p-4 sm:p-5">
                    <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-purple-700 shadow-sm">{prompt[0] === 'Amora' ? 'A' : 'O'}</div><div><p className="text-xs font-black uppercase tracking-wide text-purple-600">{t.prompt} · {prompt[0]}</p><p className="mt-1 font-semibold leading-6 text-slate-800">{prompt[1]}</p></div></div>
                  </div>
                )}

                <div className="h-[52vh] min-h-[420px] overflow-y-auto p-4 sm:p-6">
                  {loadingMessages ? <p className="py-10 text-center text-slate-500">{t.loading}</p> : messages.length === 0 ? <div className="grid h-full place-items-center text-center"><div><MessageCircle className="mx-auto mb-3 text-purple-200" size={54}/><p className="font-semibold text-slate-500">{t.empty}</p></div></div> : (
                    <div className="space-y-4">
                      {messages.map(item => {
                        const mine = user?.id === item.userId;
                        return (
                          <div key={item.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[86%] rounded-2xl px-4 py-3 sm:max-w-[74%] ${mine ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                              <div className="mb-1 flex items-center justify-between gap-3"><span className={`text-xs font-black ${mine ? 'text-white/90' : 'text-purple-700'}`}>{mine ? (user?.name || item.authorName) : item.authorName}</span>{mine && <button type="button" onClick={() => removeMessage(item.id)} className="opacity-70 hover:opacity-100" aria-label={t.delete}><Trash2 size={14}/></button>}</div>
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
            ) : <div className="grid min-h-[500px] place-items-center text-slate-500">{t.loading}</div>}
          </section>
        </div>
      </div>
    </div>
  );
}
