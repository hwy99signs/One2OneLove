import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Heart, Loader2, MessageCircle, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import {
  createCoachConversation,
  deleteCoachConversation,
  getCoachConversation,
  listCoachConversations,
  newCoachRequestId,
  sendCoachMessage,
} from '@/lib/relationshipCoachService';

const COPY = {
  en: {
    title: 'Relationship Coach', subtitle: 'Practical relationship guidance when you want another way to think through the moment.',
    newChat: 'New conversation', conversations: 'Your conversations', empty: 'Start a conversation',
    emptyBody: 'Ask about communication, connection, dating, conflict, trust, affection, routines, or relationship growth.',
    placeholder: 'What would you like to talk through?', send: 'Send', back: 'Back to Support',
    premium: 'Relationship Coach is a membership feature.', membership: 'View Membership',
    unavailable: 'Relationship Coach is still being prepared for the controlled relaunch. No AI request was sent.',
    note: 'AI guidance can be useful for reflection, but it is not therapy, legal advice, medical advice, or emergency support.',
    prompts: ['Help us communicate better', 'Give me a practical relationship check-in idea', 'How can I bring up a difficult subject calmly?', 'Suggest a simple way to reconnect this week'],
  },
  es: {
    title: 'Coach de Relaciones', subtitle: 'Orientación práctica para pensar una situación de pareja desde otro ángulo.',
    newChat: 'Nueva conversación', conversations: 'Tus conversaciones', empty: 'Inicia una conversación',
    emptyBody: 'Pregunta sobre comunicación, conexión, citas, conflictos, confianza, afecto, rutinas o crecimiento.',
    placeholder: '¿Qué te gustaría analizar?', send: 'Enviar', back: 'Volver a Soporte',
    premium: 'El Coach de Relaciones es una función de membresía.', membership: 'Ver membresía',
    unavailable: 'El Coach de Relaciones todavía se está preparando para el relanzamiento controlado. No se envió ninguna solicitud de IA.',
    note: 'La orientación de IA puede ayudar a reflexionar, pero no sustituye terapia, asesoría legal o médica ni servicios de emergencia.',
    prompts: ['Ayúdanos a comunicarnos mejor', 'Dame una idea práctica para revisar nuestra relación', '¿Cómo saco un tema difícil con calma?', 'Sugiere una forma sencilla de reconectarnos esta semana'],
  },
  fr: {
    title: 'Coach Relationnel', subtitle: 'Des pistes pratiques pour réfléchir autrement à une situation de couple.',
    newChat: 'Nouvelle conversation', conversations: 'Vos conversations', empty: 'Démarrer une conversation',
    emptyBody: 'Parlez de communication, connexion, rencontres, conflits, confiance, affection, routines ou évolution.',
    placeholder: 'De quoi souhaitez-vous parler ?', send: 'Envoyer', back: 'Retour au Support',
    premium: 'Le Coach Relationnel est une fonctionnalité réservée aux membres.', membership: 'Voir l’abonnement',
    unavailable: 'Le Coach Relationnel est encore en préparation pour la relance contrôlée. Aucune requête IA n’a été envoyée.',
    note: 'Les conseils de l’IA peuvent aider à réfléchir, mais ne remplacent pas une thérapie, un avis juridique ou médical, ni les services d’urgence.',
    prompts: ['Aidez-nous à mieux communiquer', 'Donnez-moi une idée pratique de bilan de couple', 'Comment aborder calmement un sujet difficile ?', 'Suggérez une façon simple de nous reconnecter cette semaine'],
  },
  it: {
    title: 'Coach Relazionale', subtitle: 'Indicazioni pratiche per guardare un momento di coppia da un’altra prospettiva.',
    newChat: 'Nuova conversazione', conversations: 'Le tue conversazioni', empty: 'Inizia una conversazione',
    emptyBody: 'Parla di comunicazione, connessione, appuntamenti, conflitti, fiducia, affetto, routine o crescita.',
    placeholder: 'Di cosa vorresti parlare?', send: 'Invia', back: 'Torna al Supporto',
    premium: 'Il Coach Relazionale è una funzione riservata agli abbonati.', membership: 'Vedi abbonamento',
    unavailable: 'Il Coach Relazionale è ancora in preparazione per il rilancio controllato. Non è stata inviata alcuna richiesta IA.',
    note: 'La guida dell’IA può aiutare a riflettere, ma non sostituisce terapia, consulenza legale o medica né servizi di emergenza.',
    prompts: ['Aiutaci a comunicare meglio', 'Dammi un’idea pratica per fare il punto sulla relazione', 'Come posso affrontare con calma un argomento difficile?', 'Suggerisci un modo semplice per riconnetterci questa settimana'],
  },
  de: {
    title: 'Beziehungscoach', subtitle: 'Praktische Impulse, um eine Beziehungssituation aus einer anderen Perspektive zu betrachten.',
    newChat: 'Neues Gespräch', conversations: 'Deine Gespräche', empty: 'Gespräch beginnen',
    emptyBody: 'Frage zu Kommunikation, Nähe, Dating, Konflikten, Vertrauen, Zuneigung, Routinen oder Wachstum.',
    placeholder: 'Worüber möchtest du sprechen?', send: 'Senden', back: 'Zurück zum Support',
    premium: 'Der Beziehungscoach ist eine Mitgliedschaftsfunktion.', membership: 'Mitgliedschaft ansehen',
    unavailable: 'Der Beziehungscoach wird noch für den kontrollierten Relaunch vorbereitet. Es wurde keine KI-Anfrage gesendet.',
    note: 'KI-Hinweise können beim Nachdenken helfen, ersetzen aber keine Therapie, Rechts- oder medizinische Beratung und keinen Notfalldienst.',
    prompts: ['Hilf uns, besser zu kommunizieren', 'Gib mir eine praktische Idee für einen Beziehungs-Check-in', 'Wie spreche ich ein schwieriges Thema ruhig an?', 'Schlage eine einfache Möglichkeit vor, wie wir uns diese Woche wieder näherkommen'],
  },
  nl: {
    title: 'Relatiecoach', subtitle: 'Praktische begeleiding om op een andere manier naar een relatiemoment te kijken.',
    newChat: 'Nieuw gesprek', conversations: 'Je gesprekken', empty: 'Start een gesprek',
    emptyBody: 'Vraag over communicatie, verbinding, daten, conflict, vertrouwen, affectie, routines of groei.',
    placeholder: 'Waar wil je over praten?', send: 'Versturen', back: 'Terug naar Support',
    premium: 'De Relatiecoach is een lidmaatschapsfunctie.', membership: 'Bekijk lidmaatschap',
    unavailable: 'De Relatiecoach wordt nog voorbereid voor de gecontroleerde herlancering. Er is geen AI-verzoek verzonden.',
    note: 'AI-begeleiding kan helpen bij reflectie, maar vervangt geen therapie, juridisch of medisch advies of noodhulp.',
    prompts: ['Help ons beter communiceren', 'Geef me een praktisch idee voor een relatiecheck-in', 'Hoe bespreek ik rustig een moeilijk onderwerp?', 'Stel een eenvoudige manier voor om deze week opnieuw verbinding te maken'],
  },
};

const backendNotReady = new Set(['PREMIUM_AI_NOT_ENABLED', 'MEMBERSHIP_GATING_NOT_READY', 'BACKEND_NOT_CONFIGURED']);

export default function RelationshipCoach() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const access = useFeatureAccess('relationship_coach');
  const t = COPY[currentLanguage] || COPY.en;
  const endRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === conversationId) || null,
    [conversations, conversationId],
  );

  const handleError = (error) => {
    const code = error?.code || error?.message;
    if (code === 'MEMBERSHIP_REQUIRED') {
      setNotice(t.premium);
      return;
    }
    if (backendNotReady.has(code)) {
      setNotice(t.unavailable);
      return;
    }
    setNotice(error?.message || t.unavailable);
  };

  const refreshConversations = async () => {
    if (!isAuthenticated || !access.hasAccess) return;
    setLoading(true);
    setNotice('');
    try {
      const rows = await listCoachConversations(currentLanguage);
      setConversations(rows);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshConversations();
  }, [isAuthenticated, access.hasAccess, currentLanguage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const createConversation = async () => {
    setNotice('');
    if (!isAuthenticated) {
      navigate(`/SignIn?returnTo=${encodeURIComponent('/RelationshipCoach')}`);
      return;
    }
    if (!access.hasAccess) {
      navigate('/Subscription');
      return;
    }
    setLoading(true);
    try {
      const created = await createCoachConversation({ language: currentLanguage });
      if (created) {
        setConversations((current) => [created, ...current.filter((item) => item.id !== created.id)]);
        setConversationId(created.id);
        setMessages([]);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (id) => {
    setLoading(true);
    setNotice('');
    try {
      const data = await getCoachConversation(id, currentLanguage);
      setConversationId(id);
      setMessages(data?.messages || []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const removeConversation = async (id) => {
    if (!window.confirm('Delete this coaching conversation?')) return;
    setNotice('');
    try {
      await deleteCoachConversation(id, currentLanguage);
      setConversations((current) => current.filter((item) => item.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const send = async (text = input) => {
    const message = String(text || '').trim();
    if (!message || sending) return;

    if (!conversationId) {
      setNotice('Start a conversation first.');
      return;
    }

    const requestId = newCoachRequestId();
    setSending(true);
    setNotice('');
    setInput('');
    setMessages((current) => [...current, { id: `local-${requestId}`, role: 'user', content: message, created_at: new Date().toISOString() }]);

    try {
      const result = await sendCoachMessage({ conversationId, message, language: currentLanguage, requestId });
      setMessages((current) => [...current, {
        id: `assistant-${requestId}`,
        role: 'assistant',
        content: result.reply,
        created_at: new Date().toISOString(),
      }]);
      void refreshConversations();
    } catch (error) {
      // Remove the optimistic user bubble if the request never reached a usable backend.
      setMessages((current) => current.filter((item) => item.id !== `local-${requestId}`));
      setInput(message);
      handleError(error);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <Sparkles className="mx-auto h-12 w-12 text-purple-600" />
          <h1 className="mt-4 text-3xl font-black text-gray-900">{t.title}</h1>
          <p className="mt-3 text-gray-600">Sign in to use your private Relationship Coach conversations.</p>
          <Button className="mt-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white" onClick={() => navigate(`/SignIn?returnTo=${encodeURIComponent('/RelationshipCoach')}`)}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (!access.isLoading && !access.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <Crown className="mx-auto h-12 w-12 text-purple-600" />
          <h1 className="mt-4 text-3xl font-black text-gray-900">{t.title}</h1>
          <p className="mt-3 text-gray-600">{t.premium}</p>
          <Button className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white" onClick={() => navigate('/Subscription')}>
            {t.membership}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/CoupleSupport" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white/70 hover:text-purple-700">
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </Link>

        <div className="mt-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-4xl font-black text-gray-900">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">{t.subtitle}</p>
        </div>

        {notice && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-medium text-amber-900">
            {notice}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl bg-white p-4 shadow-lg">
            <Button onClick={createConversation} disabled={loading} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> {t.newChat}
            </Button>
            <p className="mb-3 mt-5 text-xs font-black uppercase tracking-[0.12em] text-gray-500">{t.conversations}</p>
            <div className="space-y-2">
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></div>
              ) : conversations.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-gray-500">No conversations yet.</p>
              ) : conversations.map((conversation) => (
                <div key={conversation.id} className={`flex items-center gap-2 rounded-xl border p-2 ${conversationId === conversation.id ? 'border-purple-300 bg-purple-50' : 'border-transparent bg-slate-50'}`}>
                  <button type="button" onClick={() => openConversation(conversation.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-gray-800">{conversation.title || 'Coaching Session'}</p>
                    <p className="text-xs text-gray-500">{new Date(conversation.updated_at || conversation.created_at).toLocaleDateString()}</p>
                  </button>
                  <button type="button" onClick={() => removeConversation(conversation.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete conversation">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[650px] flex-col overflow-hidden rounded-3xl bg-white shadow-lg">
            <div className="border-b border-gray-100 px-6 py-4">
              <p className="font-bold text-gray-900">{activeConversation?.title || t.empty}</p>
              <p className="mt-1 text-xs text-gray-500">Private to your account. {t.note}</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {!conversationId && (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                  <MessageCircle className="h-14 w-14 text-purple-200" />
                  <h2 className="mt-4 text-xl font-bold text-gray-800">{t.empty}</h2>
                  <p className="mt-2 max-w-md text-sm text-gray-500">{t.emptyBody}</p>
                  <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                    {t.prompts.map((prompt) => (
                      <button key={prompt} type="button" onClick={async () => { if (!conversationId) await createConversation(); setInput(prompt); }} className="rounded-xl border border-pink-200 bg-pink-50 p-3 text-left text-sm text-gray-700 hover:bg-pink-100">
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'border border-gray-200 bg-white text-gray-800'}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {sending && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 4000))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  disabled={!conversationId || sending}
                  rows={2}
                  placeholder={t.placeholder}
                  className="min-h-[52px] flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
                />
                <Button type="button" onClick={() => send()} disabled={!conversationId || !input.trim() || sending} className="self-end bg-gradient-to-r from-pink-600 to-purple-600 text-white">
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="sr-only">{t.send}</span>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
