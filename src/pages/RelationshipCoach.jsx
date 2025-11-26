
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Sparkles, Plus, MessageCircle, Loader2, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import MessageBubble from "../components/coach/MessageBubble";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    title: "AI Relationship Coach",
    subtitle: "Get personalized advice, daily tips, and guidance to strengthen your relationship",
    newChat: "New Conversation",
    yourConversations: "Your Conversations",
    startNewConversation: "Start New Conversation",
    typeMessage: "Type your message...",
    send: "Send",
    emptyState: "No conversations yet",
    emptyStateDesc: "Start a new conversation with your AI relationship coach to get personalized advice!",
    quickPrompts: "Quick Prompts",
    dailyTip: "Give me a daily relationship tip",
    dateIdea: "Suggest a creative date idea",
    communicationHelp: "Help us communicate better",
    conflictResolution: "How to resolve conflicts peacefully",
    keepSparkAlive: "Tips to keep the spark alive",
    deleteConversation: "Delete conversation",
    conversationDeleted: "Conversation deleted",
    backToSupport: "Back to Support",
  },
  es: {
    title: "Coach de Relaciones IA",
    subtitle: "Obtén consejos personalizados, tips diarios y orientación para fortalecer tu relación",
    newChat: "Nueva Conversación",
    yourConversations: "Tus Conversaciones",
    startNewConversation: "Iniciar Nueva Conversación",
    typeMessage: "Escribe tu mensaje...",
    send: "Enviar",
    emptyState: "Aún no hay conversaciones",
    emptyStateDesc: "¡Inicia una nueva conversación con tu coach de relaciones IA para obtener consejos personalizados!",
    quickPrompts: "Prompts Rápidos",
    dailyTip: "Dame un consejo diario para relaciones",
    dateIdea: "Sugiere una idea creativa de cita",
    communicationHelp: "Ayúdanos a comunicarnos mejor",
    conflictResolution: "Cómo resolver conflictos pacíficamente",
    keepSparkAlive: "Tips para mantener viva la chispa",
    deleteConversation: "Eliminar conversación",
    conversationDeleted: "Conversación eliminada",
    backToSupport: "Volver al Soporte",
  },
  fr: {
    title: "Coach de Relations IA",
    subtitle: "Obtenez des conseils personnalisés, des astuces quotidiennes et des conseils pour renforcer votre relation",
    newChat: "Nouvelle Conversation",
    yourConversations: "Vos Conversations",
    startNewConversation: "Démarrer Nouvelle Conversation",
    typeMessage: "Tapez votre message...",
    send: "Envoyer",
    emptyState: "Pas encore de conversations",
    emptyStateDesc: "Démarrez une nouvelle conversation avec votre coach de relations IA pour obtenir des conseils personnalisés!",
    quickPrompts: "Prompts Rapides",
    dailyTip: "Donnez-moi un conseil relationnel quotidien",
    dateIdea: "Suggérez une idée de rendez-vous créative",
    communicationHelp: "Aidez-nous à mieux communiquer",
    conflictResolution: "Comment résoudre les conflits pacifiquement",
    keepSparkAlive: "Conseils pour garder l'étincelle vivante",
    deleteConversation: "Supprimer la conversation",
    conversationDeleted: "Conversation supprimée",
    backToSupport: "Retour au Support",
  },
  it: {
    title: "Coach di Relazioni IA",
    subtitle: "Ottieni consigli personalizzati, suggerimenti quotidiani e orientamento per rafforzare la tua relazione",
    newChat: "Nuova Conversazione",
    yourConversations: "Le Tue Conversazioni",
    startNewConversation: "Inizia Nuova Conversazione",
    typeMessage: "Scrivi il tuo messaggio...",
    send: "Invia",
    emptyState: "Nessuna conversazione ancora",
    emptyStateDesc: "Inizia una nuova conversazione con il tuo coach di relazioni IA per ottenere consigli personalizzati!",
    quickPrompts: "Prompt Rapidi",
    dailyTip: "Dammi un consiglio quotidiano per relazioni",
    dateIdea: "Suggerisci un'idea creativa per appuntamento",
    communicationHelp: "Aiutaci a comunicare meglio",
    conflictResolution: "Come risolvere i conflitti pacificamente",
    keepSparkAlive: "Consigli per mantenere viva la scintilla",
    deleteConversation: "Elimina conversazione",
    conversationDeleted: "Conversazione eliminata",
    backToSupport: "Torna al Supporto",
  },
  de: {
    title: "KI-Beziehungscoach",
    subtitle: "Erhalten Sie personalisierte Ratschläge, tägliche Tipps und Anleitung zur Stärkung Ihrer Beziehung",
    newChat: "Neues Gespräch",
    yourConversations: "Ihre Gespräche",
    startNewConversation: "Neues Gespräch Starten",
    typeMessage: "Geben Sie Ihre Nachricht ein...",
    send: "Senden",
    emptyState: "Noch keine Gespräche",
    emptyStateDesc: "Starten Sie ein neues Gespräch mit Ihrem KI-Beziehungscoach, um personalisierte Ratschläge zu erhalten!",
    quickPrompts: "Schnelle Prompts",
    dailyTip: "Gib mir einen täglichen Beziehungstipp",
    dateIdea: "Schlage eine kreative Date-Idee vor",
    communicationHelp: "Hilf uns besser zu kommunizieren",
    conflictResolution: "Wie man Konflikte friedlich löst",
    keepSparkAlive: "Tipps um den Funken am Leben zu halten",
    deleteConversation: "Gespräch löschen",
    conversationDeleted: "Gespräch gelöscht",
    backToSupport: "Zurück zum Support",
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

  const { user } = useAuth();

  const { data: conversations = [] } = useQuery({
    queryKey: ['coach-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // TODO: Implement AI coach conversations with Supabase Edge Functions or external AI service
      // This requires setting up chat functionality with AI (OpenAI, Anthropic, etc.)
      return [];
    },
    enabled: !!user?.id,
    initialData: [],
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement conversation creation with Supabase
      throw new Error('AI Coach feature requires implementation with Supabase Edge Functions or external AI service');
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['coach-conversations'] });
      setCurrentConversationId(newConv.id);
      setMessages([]);
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (convId) => {
      // TODO: Implement conversation deletion with Supabase
      throw new Error('AI Coach feature requires implementation');
    },
    onSuccess: (_, deletedConvId) => {
      queryClient.invalidateQueries({ queryKey: ['coach-conversations'] });
      toast.success(t.conversationDeleted);
      if (currentConversationId === deletedConvId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    }
  });

  useEffect(() => {
    if (!currentConversationId) return;
    // TODO: Implement realtime subscription for conversation messages
    return () => {};
  }, [currentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async (conversationId) => {
    // TODO: Implement conversation loading from Supabase
    setCurrentConversationId(conversationId);
    setMessages([]);
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;
    
    toast.error('AI Coach feature requires implementation with Supabase Edge Functions or external AI service');
    setIsSending(false);
    // TODO: Implement message sending with AI integration
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  const quickPrompts = [
    { id: 1, text: t.dailyTip, icon: Sparkles },
    { id: 2, text: t.dateIdea, icon: Heart },
    { id: 3, text: t.communicationHelp, icon: MessageCircle },
    { id: 4, text: t.conflictResolution, icon: Heart },
    { id: 5, text: t.keepSparkAlive, icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            to={createPageUrl("CoupleSupport")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.backToSupport}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-dancing">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <Button
                onClick={() => createConversationMutation.mutate()}
                className="w-full mb-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                disabled={createConversationMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.newChat}
              </Button>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {t.yourConversations}
              </h3>

              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                      currentConversationId === conv.id
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => loadConversation(conv.id)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.metadata?.name || 'Coaching Session'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(conv.created_date).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this conversation?')) {
                          deleteConversationMutation.mutate(conv.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                      title={t.deleteConversation}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {conversations.length === 0 && (
                  <div className="text-center py-6">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{t.emptyState}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!currentConversationId && messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {t.emptyState}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      {t.emptyStateDesc}
                    </p>
                    
                    <div className="w-full max-w-md">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        {t.quickPrompts}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {quickPrompts.map((prompt) => {
                          const Icon = prompt.icon;
                          return (
                            <button
                              key={prompt.id}
                              onClick={() => handleQuickPrompt(prompt.text)}
                              className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-all text-left border border-pink-200"
                            >
                              <Icon className="w-5 h-5 text-pink-600" />
                              <span className="text-sm text-gray-700">{prompt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <MessageBubble key={idx} message={msg} />
                    ))}
                    {isSending && (
                      <div className="flex gap-3 justify-start">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mt-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex gap-3">
                  <Input
                    placeholder={t.typeMessage}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 h-12"
                    disabled={isSending}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isSending}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 h-12 px-6"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {t.send}
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Prompts - Only show when conversation is active */}
                {currentConversationId && messages.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickPrompts.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        disabled={isSending}
                        className="text-xs px-3 py-1.5 bg-white rounded-full border border-pink-200 text-gray-700 hover:bg-pink-50 transition-colors disabled:opacity-50"
                      >
                        {prompt.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
