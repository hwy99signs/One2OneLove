import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Sparkles, Plus, MessageCircle, Loader2, Trash2, ArrowLeft, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import MessageBubble from "../components/coach/MessageBubble";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  listCoachConversations,
  createCoachConversation,
  deleteCoachConversation,
  listCoachMessages,
  sendCoachMessage,
} from "@/lib/aiService";
import { getTokenWallet } from "@/lib/tokenService";

const translations = {
  en: {
    title: "Amora — Relationship Coach", subtitle: "Talk naturally with Amora about communication, conflict, boundaries, connection, expectations, or whatever is on your mind.",
    newChat: "New Conversation", yourConversations: "Your Conversations", startNewConversation: "Start New Conversation",
    typeMessage: "Type your message...", send: "Send", emptyState: "No conversations yet",
    emptyStateDesc: "Start a conversation with Amora for practical relationship reflection and guidance.",
    quickPrompts: "Quick Prompts", dailyTip: "Give me a daily relationship tip", dateIdea: "Suggest a creative date idea",
    communicationHelp: "Help us communicate better", conflictResolution: "How to resolve conflicts peacefully",
    keepSparkAlive: "Tips to keep the spark alive", deleteConversation: "Delete conversation",
    conversationDeleted: "Conversation deleted", backToSupport: "Back to Support", meet:"MEET AMORA", tokenNote:"Creating an account and viewing Amora are free. Each Amora response uses O2OL Tokens.", signIn:"Sign In", createAccount:"Create FREE O2OL Account", reply:"reply",
  },
  es: {
    title: "Amora — Coach de Relaciones", subtitle: "Habla naturalmente con Amora sobre comunicación, conflictos, límites, conexión, expectativas o lo que tengas en mente.",
    newChat: "Nueva Conversación", yourConversations: "Tus Conversaciones", startNewConversation: "Iniciar Nueva Conversación",
    typeMessage: "Escribe tu mensaje...", send: "Enviar", emptyState: "Aún no hay conversaciones",
    emptyStateDesc: "Inicia una conversación con Amora para obtener reflexión y orientación práctica sobre relaciones.",
    quickPrompts: "Prompts Rápidos", dailyTip: "Dame un consejo diario para relaciones", dateIdea: "Sugiere una idea creativa de cita",
    communicationHelp: "Ayúdanos a comunicarnos mejor", conflictResolution: "Cómo resolver conflictos pacíficamente",
    keepSparkAlive: "Tips para mantener viva la chispa", deleteConversation: "Eliminar conversación",
    conversationDeleted: "Conversación eliminada", backToSupport: "Volver al Soporte", meet:"CONOCE A AMORA", tokenNote:"Crear una cuenta y ver a Amora es gratis. Cada respuesta de Amora usa Tokens O2OL.", signIn:"Iniciar Sesión", createAccount:"Crear Cuenta O2OL GRATIS", reply:"respuesta",
  },
  fr: {
    title: "Amora — Coach Relationnelle", subtitle: "Parlez naturellement avec Amora de communication, conflit, limites, connexion, attentes ou de ce qui vous préoccupe.",
    newChat: "Nouvelle Conversation", yourConversations: "Vos Conversations", startNewConversation: "Démarrer Nouvelle Conversation",
    typeMessage: "Tapez votre message...", send: "Envoyer", emptyState: "Pas encore de conversations",
    emptyStateDesc: "Commencez une conversation avec Amora pour une réflexion et des conseils relationnels pratiques.",
    quickPrompts: "Prompts Rapides", dailyTip: "Donnez-moi un conseil relationnel quotidien", dateIdea: "Suggérez une idée de rendez-vous créative",
    communicationHelp: "Aidez-nous à mieux communiquer", conflictResolution: "Comment résoudre les conflits pacifiquement",
    keepSparkAlive: "Conseils pour garder l'étincelle vivante", deleteConversation: "Supprimer la conversation",
    conversationDeleted: "Conversation supprimée", backToSupport: "Retour au Support", meet:"DÉCOUVREZ AMORA", tokenNote:"Créer un compte et voir Amora est gratuit. Chaque réponse d’Amora utilise des Jetons O2OL.", signIn:"Se Connecter", createAccount:"Créer un Compte O2OL GRATUIT", reply:"réponse",
  },
  it: {
    title: "Amora — Coach Relazionale", subtitle: "Parla naturalmente con Amora di comunicazione, conflitti, confini, connessione, aspettative o di ciò che hai in mente.",
    newChat: "Nuova Conversazione", yourConversations: "Le Tue Conversazioni", startNewConversation: "Inizia Nuova Conversazione",
    typeMessage: "Scrivi il tuo messaggio...", send: "Invia", emptyState: "Nessuna conversazione ancora",
    emptyStateDesc: "Inizia una conversazione con Amora per una riflessione e una guida pratica sulle relazioni.",
    quickPrompts: "Prompt Rapidi", dailyTip: "Dammi un consiglio quotidiano per relazioni", dateIdea: "Suggerisci un'idea creativa per appuntamento",
    communicationHelp: "Aiutaci a comunicare meglio", conflictResolution: "Come risolvere i conflitti pacificamente",
    keepSparkAlive: "Consigli per mantenere viva la scintilla", deleteConversation: "Elimina conversazione",
    conversationDeleted: "Conversazione eliminata", backToSupport: "Torna al Supporto", meet:"CONOSCI AMORA", tokenNote:"Creare un account e vedere Amora è gratuito. Ogni risposta di Amora usa Token O2OL.", signIn:"Accedi", createAccount:"Crea Account O2OL GRATUITO", reply:"risposta",
  },
  de: {
    title: "Amora — Beziehungscoach", subtitle: "Sprich natürlich mit Amora über Kommunikation, Konflikte, Grenzen, Verbindung, Erwartungen oder was dir gerade durch den Kopf geht.",
    newChat: "Neues Gespräch", yourConversations: "Ihre Gespräche", startNewConversation: "Neues Gespräch Starten",
    typeMessage: "Geben Sie Ihre Nachricht ein...", send: "Senden", emptyState: "Noch keine Gespräche",
    emptyStateDesc: "Beginne ein Gespräch mit Amora für praktische Beziehungsreflexion und Orientierung.",
    quickPrompts: "Schnelle Prompts", dailyTip: "Gib mir einen täglichen Beziehungstipp", dateIdea: "Schlage eine kreative Date-Idee vor",
    communicationHelp: "Hilf uns besser zu kommunizieren", conflictResolution: "Wie man Konflikte friedlich löst",
    keepSparkAlive: "Tipps um den Funken am Leben zu halten", deleteConversation: "Gespräch löschen",
    conversationDeleted: "Gespräch gelöscht", backToSupport: "Zurück zum Support", meet:"LERNE AMORA KENNEN", tokenNote:"Ein Konto zu erstellen und Amora anzusehen ist kostenlos. Jede Antwort von Amora verwendet O2OL Tokens.", signIn:"Anmelden", createAccount:"KOSTENLOSES O2OL-Konto erstellen", reply:"Antwort",
  }
};

export default function RelationshipCoach() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const { data: tokenWallet } = useQuery({
    queryKey: ['o2olTokenWallet', user?.id],
    queryFn: getTokenWallet,
    enabled: !!user?.id,
    staleTime: 10 * 1000,
  });
  const tokenBalance = Number(tokenWallet?.wallet?.balance || 0);
  const amoraTokenCost = Number(tokenWallet?.featurePrices?.find(item => item.feature_code === 'amora_response')?.token_cost || 0);

  const { data: conversations = [] } = useQuery({
    queryKey: ['coach-conversations', user?.id],
    queryFn: () => user?.id ? listCoachConversations() : [],
    enabled: !!user?.id,
    initialData: [],
  });

  const createConversationMutation = useMutation({
    mutationFn: createCoachConversation,
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['coach-conversations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['o2olTokenWallet', user?.id] });
      setCurrentConversationId(newConv.id);
      setMessages([]);
    },
    onError: (error) => toast.error(error?.message || 'Unable to start a coaching conversation.'),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: deleteCoachConversation,
    onSuccess: (_, deletedConvId) => {
      queryClient.invalidateQueries({ queryKey: ['coach-conversations', user?.id] });
      toast.success(t.conversationDeleted);
      if (currentConversationId === deletedConvId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    },
    onError: (error) => toast.error(error?.message || 'Unable to delete this conversation.'),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async (conversationId) => {
    try {
      setCurrentConversationId(conversationId);
      setMessages(await listCoachMessages(conversationId));
    } catch (error) {
      toast.error(error?.message || 'Unable to load this conversation.');
    }
  };

  const ensureConversation = async () => {
    if (currentConversationId) return currentConversationId;
    const conversation = await createCoachConversation();
    queryClient.invalidateQueries({ queryKey: ['coach-conversations', user?.id] });
    setCurrentConversationId(conversation.id);
    setMessages([]);
    return conversation.id;
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    const text = String(messageText || '').trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      const conversationId = await ensureConversation();
      setInputMessage('');
      const optimistic = { id: `local-${Date.now()}`, role: 'user', content: text };
      setMessages(prev => [...prev, optimistic]);
      const result = await sendCoachMessage(conversationId, text);
      setMessages(prev => {
        const withoutOptimistic = prev.filter(message => message.id !== optimistic.id);
        return [...withoutOptimistic, result.userMessage, result.message];
      });
      queryClient.invalidateQueries({ queryKey: ['coach-conversations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['o2olTokenWallet', user?.id] });
    } catch (error) {
      setMessages(prev => prev.filter(message => !String(message.id).startsWith('local-')));
      setInputMessage(text);
      toast.error(error?.message || 'Unable to reach Amora.');
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    { id: 1, text: t.dailyTip, icon: Sparkles },
    { id: 2, text: t.dateIdea, icon: Heart },
    { id: 3, text: t.communicationHelp, icon: MessageCircle },
    { id: 4, text: t.conflictResolution, icon: Heart },
    { id: 5, text: t.keepSparkAlive, icon: Sparkles },
  ];

  if (!isAuthenticated) {
    return (
      <main
        className="min-h-screen bg-[#16070f] px-4 py-12 text-white"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 0%, #8b1e3f 0%, transparent 30%), radial-gradient(circle at 88% 12%, #5b102d 0%, transparent 30%), radial-gradient(circle at 50% 100%, #9a3412 0%, transparent 34%)',
        }}
      >
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200/25 bg-black/35 p-7 text-center shadow-2xl backdrop-blur sm:p-9">
          <div className="relative mx-auto w-fit">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-rose-500/30 via-pink-500/25 to-amber-400/20 blur-2xl" />
            <img
              src="/assets/amora-relationship-coach-official.webp?v=20261006-portrait"
              alt="Amora — One2OneLove Relationship Coach"
              className="relative mx-auto h-auto w-full max-w-[330px] rounded-3xl border border-white/15 shadow-[0_24px_70px_rgba(236,72,153,0.28)]"
            />
          </div>

          <div className="mt-7 text-xs font-black uppercase tracking-[.24em] text-rose-200">{t.meet}</div>
          <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-white/75">{t.subtitle}</p>

          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200/25 bg-amber-300/10 p-4 text-sm font-semibold leading-6 text-amber-50 shadow-lg">
            <Coins className="mx-auto mb-2 h-5 w-5 text-amber-300" />
            {t.tokenNote}
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/SignIn?source=amora&token=1&redirect=/Amora"
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-black text-white shadow-md transition hover:bg-white/15"
            >
              {t.signIn}
            </Link>
            <Link
              to="/SignUp?source=amora&token=1&feature=amora&return=/Amora"
              className="rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 px-6 py-3 font-black text-white shadow-[0_12px_30px_rgba(217,70,239,0.3)] transition hover:brightness-110"
            >
              {t.createAccount}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#16070f] px-3 py-6 text-white sm:px-6 sm:py-8"
      style={{
        backgroundImage:
          'radial-gradient(circle at 12% 0%, #8b1e3f 0%, transparent 28%), radial-gradient(circle at 88% 12%, #5b102d 0%, transparent 28%), radial-gradient(circle at 50% 100%, #9a3412 0%, transparent 32%)',
      }}
    >
      <section className="mx-auto max-w-7xl">
        <div className="mb-5">
          <Link
            to={createPageUrl("CoupleSupport")}
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.backToSupport}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-[2rem] border border-rose-200/20 bg-black/30 p-6 text-center shadow-2xl backdrop-blur sm:p-8"
        >
          <div className="grid items-center gap-6 md:grid-cols-[220px_1fr] md:text-left">
            <div className="relative mx-auto">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-rose-500/30 via-pink-500/25 to-amber-400/20 blur-2xl" />
              <img
                src="/assets/amora-relationship-coach-official.webp?v=20261006-portrait"
                alt="Amora — One2OneLove Relationship Coach"
                className="relative w-full max-w-[220px] rounded-3xl border border-white/15 shadow-[0_20px_55px_rgba(236,72,153,0.25)]"
              />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[.24em] text-rose-200">{t.meet}</div>
              <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{t.title}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-7 text-white/70">{t.subtitle}</p>

              <Link
                to="/Tokens?return=/Amora"
                className="mt-5 flex max-w-sm items-center justify-between rounded-2xl border border-amber-200/25 bg-amber-300/10 px-5 py-3 text-amber-50 shadow-lg transition hover:bg-amber-300/15"
              >
                <span className="inline-flex items-center gap-2 font-black">
                  <Coins className="h-5 w-5 text-amber-300" />
                  O2OL Tokens
                </span>
                <span className="font-black">
                  {tokenBalance}
                  <span className="ml-1 text-xs font-bold text-amber-200">· {amoraTokenCost || 1}/{t.reply}</span>
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-[1.75rem] border border-rose-200/20 bg-black/35 p-5 shadow-xl backdrop-blur">
            <Button
              onClick={() => createConversationMutation.mutate()}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 font-black text-white hover:brightness-110"
              disabled={createConversationMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.newChat}
            </Button>

            <h3 className="mb-3 mt-5 text-sm font-semibold text-white/70">{t.yourConversations}</h3>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between rounded-xl pr-2 transition-all ${
                    currentConversationId === conv.id
                      ? 'border border-rose-300/25 bg-rose-500/25'
                      : 'bg-white/[0.05] hover:bg-white/10'
                  }`}
                >
                  <button onClick={() => loadConversation(conv.id)} className="min-w-0 flex-1 px-3 py-2 text-left">
                    <p className="truncate text-sm font-medium text-white">{conv.metadata?.name || conv.title || 'Coaching Session'}</p>
                    <p className="text-xs text-white/45">{new Date(conv.created_date || conv.created_at).toLocaleDateString()}</p>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this conversation?')) deleteConversationMutation.mutate(conv.id);
                    }}
                    className="ml-2 rounded-lg p-2 text-white/35 transition-colors hover:bg-white/10 hover:text-rose-300"
                    title={t.deleteConversation}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {conversations.length === 0 && (
                <div className="py-7 text-center">
                  <MessageCircle className="mx-auto mb-2 h-11 w-11 text-rose-300/50" />
                  <p className="text-sm text-white/45">{t.emptyState}</p>
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/35 shadow-2xl backdrop-blur">
            <div className="border-b border-white/10 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-400/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-rose-200" />
                <div>
                  <h2 className="font-black">{t.title}</h2>
                  <p className="text-xs text-white/50">{t.tokenNote}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {!currentConversationId && messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Sparkles className="mb-4 h-14 w-14 text-rose-300/60" />
                  <h3 className="mb-2 text-xl font-semibold text-white/70">{t.emptyState}</h3>
                  <p className="mb-6 max-w-md text-white/50">{t.emptyStateDesc}</p>

                  <div className="w-full max-w-md">
                    <p className="mb-3 text-sm font-semibold text-white/65">{t.quickPrompts}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.map((prompt) => {
                        const Icon = prompt.icon;
                        return (
                          <button
                            key={prompt.id}
                            onClick={() => handleSendMessage(prompt.text)}
                            className="flex items-center gap-3 rounded-xl border border-rose-200/15 bg-white/[0.06] p-3 text-left text-white/80 transition-all hover:bg-white/10"
                          >
                            <Icon className="h-5 w-5 text-rose-300" />
                            <span className="text-sm">{prompt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                  {isSending && (
                    <div className="flex justify-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/30 to-amber-500/25">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="border-t border-white/10 bg-black/10 p-4">
              <div className="flex gap-3">
                <Input
                  placeholder={t.typeMessage}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="h-12 flex-1 border-white/15 bg-slate-950/75 text-white placeholder:text-white/35 focus-visible:ring-rose-400"
                  disabled={isSending}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isSending}
                  className="h-12 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 px-6 text-white hover:brightness-110"
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="mr-2 h-5 w-5" />{t.send}</>}
                </Button>
              </div>

              {currentConversationId && messages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickPrompts.slice(0, 3).map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSendMessage(prompt.text)}
                      disabled={isSending}
                      className="rounded-full border border-rose-200/15 bg-white/[0.06] px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
                    >
                      {prompt.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
