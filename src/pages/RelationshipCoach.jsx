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
    conversationDeleted: "Conversation deleted", backToSupport: "Back to Support", meet:"MEET AMORA", tokenNote:"{t.tokenNote}", signIn:"Sign In", createAccount:"Create FREE O2OL Account", reply:"reply",
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
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 px-4 py-12">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-7 text-center shadow-xl sm:p-9">
          <img src="/assets/amora-relationship-coach-official.webp" alt="Amora — One2OneLove Relationship Coach" className="mx-auto h-auto w-full max-w-[360px] rounded-3xl shadow-xl" />
          <div className="mt-6 text-xs font-black uppercase tracking-[.22em] text-rose-600">{t.meet}</div>
          <h1 className="mt-2 text-4xl font-black text-slate-900">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950"><Coins className="mx-auto mb-2 h-5 w-5"/>Creating an account and viewing Amora are free. Each Amora response uses O2OL Tokens.</div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/SignIn?source=amora&token=1&redirect=/RelationshipCoach" className="rounded-full border border-slate-300 bg-white px-6 py-3 font-black text-slate-800">{t.signIn}</Link>
            <Link to="/SignUp?source=amora&token=1&feature=amora&return=/RelationshipCoach" className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-3 font-black text-white">{t.createAccount}</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("CoupleSupport")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />{t.backToSupport}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <img src="/assets/amora-relationship-coach-official.webp" alt="Amora — One2OneLove Relationship Coach" className="mx-auto h-auto w-full max-w-[260px] rounded-3xl shadow-xl" />
          <div className="mt-5 text-xs font-black uppercase tracking-[.22em] text-rose-600">{t.meet}</div>
          <h1 className="mt-2 text-5xl font-bold text-gray-900 mb-4 font-dancing">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
          <Link to="/Tokens?return=/RelationshipCoach" className="mx-auto mt-5 flex max-w-sm items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-amber-950 shadow-sm">
            <span className="inline-flex items-center gap-2 font-black"><Coins className="h-5 w-5"/>O2OL Tokens</span>
            <span className="font-black">{tokenBalance} <span className="text-xs font-bold text-amber-700">· {amoraTokenCost || 1}/{t.reply}</span></span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <Button onClick={() => createConversationMutation.mutate()} className="w-full mb-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" disabled={createConversationMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />{t.newChat}
              </Button>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.yourConversations}</h3>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div key={conv.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${currentConversationId === conv.id ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <button onClick={() => loadConversation(conv.id)} className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.metadata?.name || conv.title || 'Coaching Session'}</p>
                      <p className="text-xs text-gray-500">{new Date(conv.created_date || conv.created_at).toLocaleDateString()}</p>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this conversation?')) deleteConversationMutation.mutate(conv.id); }} className="text-gray-400 hover:text-red-600 transition-colors ml-2" title={t.deleteConversation}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {conversations.length === 0 && <div className="text-center py-6"><MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">{t.emptyState}</p></div>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!currentConversationId && messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.emptyState}</h3>
                    <p className="text-gray-500 mb-6 max-w-md">{t.emptyStateDesc}</p>
                    <div className="w-full max-w-md">
                      <p className="text-sm font-semibold text-gray-700 mb-3">{t.quickPrompts}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {quickPrompts.map((prompt) => {
                          const Icon = prompt.icon;
                          return <button key={prompt.id} onClick={() => handleSendMessage(prompt.text)} className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-all text-left border border-pink-200"><Icon className="w-5 h-5 text-pink-600" /><span className="text-sm text-gray-700">{prompt.text}</span></button>;
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
                    {isSending && <div className="flex gap-3 justify-start"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mt-0.5"><div className="h-1.5 w-1.5 rounded-full bg-pink-500" /></div><div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div></div>}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex gap-3">
                  <Input placeholder={t.typeMessage} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} className="flex-1 h-12" disabled={isSending} />
                  <Button onClick={() => handleSendMessage()} disabled={!inputMessage.trim() || isSending} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 px-6">
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-2" />{t.send}</>}
                  </Button>
                </div>
                {currentConversationId && messages.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{quickPrompts.slice(0, 3).map((prompt) => <button key={prompt.id} onClick={() => handleSendMessage(prompt.text)} disabled={isSending} className="text-xs px-3 py-1.5 bg-white rounded-full border border-pink-200 text-gray-700 hover:bg-pink-50 transition-colors disabled:opacity-50">{prompt.text}</button>)}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
