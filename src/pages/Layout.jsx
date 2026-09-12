
import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Home, ChevronDown, User, LogIn, LogOut, Users, UserPlus, Menu, X, Sparkles, Target, Code, Rainbow, UserCheck, Gift, MessageCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getMyConversations } from "@/lib/chatService";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const translations = {
  en: {
    nav: { home: "Home", action: "Action", profile: "Profile", signIn: "Sign In", signUp: "Sign Up", invite: "Invite", community: "Community", aiCreator: "AI Content Creator", lgbtq: "LGBTQ+ Support", developer: "Dev", requests: "Requests", chat: "Chat", signOut: "Sign Out" },
    actionMenu: { sendLoveNote: "Send A Love Note", coupleSupport: "Relationship Support", lgbtqSupport: "LGBTQ+ Support", relationshipQuizzes: "Relationship Quizzes", relationshipMilestones: "Milestones & Anniversaries", relationshipGoals: "Relationship Goals", dateIdeas: "Date Ideas", memoryLane: "Memory Lane", aiCreator: "AI Content Creator", winCruise: "Win Prizes!" },
    announcement: { label: "O2OL Announcement Scroll", text: "Be informed as soon as One2OneLove launches." }
  },
  es: {
    nav: { home: "Inicio", action: "Acción", profile: "Perfil", signIn: "Iniciar Sesión", signUp: "Registrarse", invite: "Invitar", community: "Comunidad", aiCreator: "Creador de Contenido IA", lgbtq: "Apoyo LGBTQ+", developer: "Dev", requests: "Solicitudes", chat: "Chat", signOut: "Cerrar Sesión" },
    actionMenu: { sendLoveNote: "Enviar una Nota de Amor", coupleSupport: "Apoyo para Relaciones", lgbtqSupport: "Apoyo LGBTQ+", relationshipQuizzes: "Cuestionarios de Relaciones", relationshipMilestones: "Hitos y Aniversarios", relationshipGoals: "Metas de Relación", dateIdeas: "Ideas para Citas", memoryLane: "Carril de Recuerdos", aiCreator: "Creador de Contenido IA", winCruise: "¡Gana Premios!" },
    announcement: { label: "Anuncios O2OL", text: "Recibe aviso tan pronto como One2OneLove se lance." }
  },
  fr: {
    nav: { home: "Accueil", action: "Action", profile: "Profil", signIn: "Se Connecter", signUp: "S'inscrire", invite: "Inviter", community: "Communauté", aiCreator: "Créateur de Contenu IA", lgbtq: "Soutien LGBTQ+", developer: "Dev", requests: "Demandes", chat: "Chat", signOut: "Se Déconnecter" },
    actionMenu: { sendLoveNote: "Envoyer une Note d'Amour", coupleSupport: "Soutien aux Relations", lgbtqSupport: "Soutien LGBTQ+", relationshipQuizzes: "Quiz sur les Relations", relationshipMilestones: "Jalons et Anniversaires", relationshipGoals: "Objectifs de Relation", dateIdeas: "Idées de Rendez-vous", memoryLane: "Allée des Souvenirs", aiCreator: "Créateur de Contenu IA", winCruise: "Gagnez des Prix!" },
    announcement: { label: "Annonces O2OL", text: "Soyez informé dès le lancement de One2OneLove." }
  },
  it: {
    nav: { home: "Home", action: "Azione", profile: "Profilo", signIn: "Accedi", signUp: "Iscriviti", invite: "Invita", community: "Comunità", aiCreator: "Creatore de Contenuti IA", lgbtq: "Supporto LGBTQ+", developer: "Dev", requests: "Richieste", chat: "Chat", signOut: "Esci" },
    actionMenu: { sendLoveNote: "Invia una Nota d'Amore", coupleSupport: "Supporto per Relazioni", lgbtqSupport: "Supporto LGBTQ+", relationshipQuizzes: "Quiz sulle Relazioni", relationshipMilestones: "Traguardi e Anniversari", relationshipGoals: "Obiettivi di Relazione", dateIdeas: "Idee per Appuntamenti", memoryLane: "Viale dei Ricordi", aiCreator: "Creatore de Contenuti IA", winCruise: "Vinci Premi!" },
    announcement: { label: "Annunci O2OL", text: "Ricevi una notifica appena One2OneLove sarà lanciato." }
  },
  de: {
    nav: { home: "Startseite", action: "Aktion", profile: "Profil", signIn: "Anmelden", signUp: "Registrieren", invite: "Einladen", community: "Gemeinschaft", aiCreator: "KI-Content-Ersteller", lgbtq: "LGBTQ+ Unterstützung", developer: "Dev", requests: "Anfragen", chat: "Chat", signOut: "Abmelden" },
    actionMenu: { sendLoveNote: "Eine Liebesbotschaft Senden", coupleSupport: "Beziehungsunterstützung", lgbtqSupport: "LGBTQ+ Unterstützung", relationshipQuizzes: "Beziehungsquiz", relationshipMilestones: "Meilensteine & Jahrestage", relationshipGoals: "Beziehungsziele", dateIdeas: "Date-Ideen", memoryLane: "Erinnerungsgasse", aiCreator: "KI-Content-Ersteller", winCruise: "Gewinne Preise!" },
    announcement: { label: "O2OL Ankündigungen", text: "Erfahren Sie sofort, wenn One2OneLove startet." }
  },
  nl: {
    nav: { home: "Home", action: "Actie", profile: "Profil", signIn: "Inloggen", signUp: "Aanmelden", invite: "Uitnodigen", community: "Gemeenschap", aiCreator: "AI Content Maker", lgbtq: "LGBTQ+ Ondersteuning", developer: "Dev", requests: "Verzoeken", chat: "Chat", signOut: "Uitloggen" },
    actionMenu: { sendLoveNote: "Stuur een Liefdebriefje", coupleSupport: "Relatie Ondersteuning", lgbtqSupport: "LGBTQ+ Ondersteuning", relationshipQuizzes: "Relatie Quizzen", relationshipMilestones: "Mijlpalen & Jubilea", relationshipGoals: "Relatie Doelen", dateIdeas: "Date Ideeën", memoryLane: "Herinnerings Laan", aiCreator: "AI Content Maker", winCruise: "Win Prijzen!" },
    announcement: { label: "O2OL Aankondigingen", text: "Blijf op de hoogte zodra One2OneLove wordt gelanceerd." }
  },
  pt: {
    nav: { home: "Início", action: "Ação", profile: "Perfil", signIn: "Entrar", signUp: "Inscrever-se", invite: "Convidar", community: "Comunidade", aiCreator: "Criador de Conteúdo IA", lgbtq: "Apoio LGBTQ+", developer: "Dev", requests: "Solicitações", chat: "Chat", signOut: "Sair" },
    actionMenu: { sendLoveNote: "Enviar uma Nota de Amor", coupleSupport: "Apoio para Relacionamentos", lgbtqSupport: "Apoio LGBTQ+", relationshipQuizzes: "Questionários de Relacionamento", relationshipMilestones: "Marcos e Aniversários", relationshipGoals: "Metas de Relacionamento", dateIdeas: "Ideas de Encontros", memoryLane: "Alameda das Memórias", aiCreator: "Criador de Conteúdo IA", winCruise: "Ganhe Prêmios!" },
    announcement: { label: "Anúncios O2OL", text: "Seja informado assim que o One2OneLove for lançado." }
  }
};

const LanguageContext = createContext();

const FOOTER_COPY = {
  en: {
    loveGrow: "Love. Grow. Evolve. Together.", footerBody: "One2OneLove is designed to support healthier connection, thoughtful communication, self-reflection, shared memories, and real conversations about relationships—while welcoming people from every background.",
    supportCol: "Support", company: "Company", help: "Help Center", contact: "Contact Us", privacy: "Privacy Policy", terms: "Terms of Service", about: "About Us", suggestions: "Suggestions",
    copyright: "© 2026 One2OneLove. Made with ❤️ for people pursuing and building healthier love and relationships."
  },
  es: {
    loveGrow: "Ama. Crece. Evoluciona. Juntos.", footerBody: "One2OneLove apoya conexiones más saludables, comunicación reflexiva, autorreflexión, recuerdos compartidos y conversaciones reales.",
    supportCol: "Soporte", company: "Compañía", help: "Centro de ayuda", contact: "Contáctanos", privacy: "Privacidad", terms: "Términos de servicio", about: "Sobre nosotros", suggestions: "Sugerencias", copyright: "© 2026 One2OneLove. Hecho con ❤️ para relaciones más saludables."
  },
  fr: {
    loveGrow: "Aimez. Grandissez. Évoluez. Ensemble.", footerBody: "One2OneLove favorise une connexion plus saine, une communication réfléchie, l’introspection, les souvenirs partagés et de vraies conversations.", supportCol: "Aide", company: "Entreprise", help: "Centre d’aide", contact: "Contact", privacy: "Confidentialité", terms: "Conditions d’utilisation", about: "À propos", suggestions: "Suggestions", copyright: "© 2026 One2OneLove. Fait avec ❤️ pour des relations plus saines."
  },
  it: {
    loveGrow: "Ama. Cresci. Evolvi. Insieme.", footerBody: "One2OneLove sostiene connessioni più sane, comunicazione consapevole, autoriflessione, ricordi condivisi e conversazioni reali.", supportCol: "Supporto", company: "Azienda", help: "Centro assistenza", contact: "Contatti", privacy: "Privacy", terms: "Termini di servizio", about: "Chi siamo", suggestions: "Suggerimenti", copyright: "© 2026 One2OneLove. Creato con ❤️ per relazioni più sane."
  },
  de: {
    loveGrow: "Lieben. Wachsen. Entwickeln. Gemeinsam.", footerBody: "One2OneLove unterstützt gesündere Verbindung, achtsame Kommunikation, Selbstreflexion, gemeinsame Erinnerungen und echte Gespräche.", supportCol: "Support", company: "Unternehmen", help: "Hilfe-Center", contact: "Kontakt", privacy: "Datenschutz", terms: "Nutzungsbedingungen", about: "Über uns", suggestions: "Vorschläge", copyright: "© 2026 One2OneLove. Mit ❤️ für gesündere Beziehungen."
  }
};

function FooterLink({children,onClick}) { return <button onClick={onClick} className="block text-left py-1 hover:text-yellow-200">{children}</button>; }

function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const stored = localStorage.getItem('preferredLanguage') || 'en';
    // Prevent loading disabled languages
    if (stored === 'nl' || stored === 'pt') {
      return 'en';
    }
    return stored;
  });

  const changeLanguage = (languageCode) => {
    // Prevent selecting disabled languages
    if (languageCode === 'nl' || languageCode === 'pt') {
      return;
    }
    setCurrentLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

const languages = [
  { code: "en", name: "English", flags: [{ country: "us", alt: "USA" }, { country: "gb", alt: "UK" }, { country: "ca", alt: "Canada" }], active: true },
  { code: "es", name: "Spanish", flags: [{ country: "es", alt: "Spain" }, { country: "mx", alt: "Mexico" }], active: true },
  { code: "fr", name: "French", flags: [{ country: "fr", alt: "France" }, { country: "ca", alt: "Canada" }], active: true },
  { code: "it", name: "Italian", flags: [{ country: "it", alt: "Italy" }], active: true },
  { code: "de", name: "German", flags: [{ country: "de", alt: "Germany" }], active: true },
  { code: "nl", name: "Dutch", flags: [{ country: "nl", alt: "Netherlands" }], active: false },
  { code: "pt", name: "Portuguese", flags: [{ country: "pt", alt: "Portugal" }], active: false }
];

function LanguageContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [actionOpen, setActionOpen] = useState(false);
  const [mobileActionOpen, setMobileActionOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const fT = FOOTER_COPY[currentLanguage] || FOOTER_COPY.en;
  const closeTimeoutRef = useRef(null);

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage);

  // Get authentication state
  const { isAuthenticated, logout, user } = useAuth();

  // Fetch conversations to get unread message count
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getMyConversations,
    enabled: !!user && isAuthenticated,
    refetchInterval: 3000, // Refetch every 3 seconds for faster badge updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Refetch when component mounts
    staleTime: 0, // Always consider data stale to force fresh fetches
    cacheTime: 0, // Don't cache to ensure fresh data
  });

  // Subscribe to real-time conversation updates to update badge immediately
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    console.log('🔔 Setting up real-time subscription for conversation updates (badge)');
    
    // Subscribe to conversation updates where user is either user1 or user2
    const subscription = supabase
      .channel(`conversations-badge-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          // This will trigger for any conversation where user is involved
          // We can't filter by OR in Supabase realtime, so we subscribe to all and filter in callback
        },
        (payload) => {
          const conv = payload.new;
          // Only process if this conversation involves the current user
          if (conv.user1_id === user.id || conv.user2_id === user.id) {
            console.log('📬 Conversation updated (badge refresh):', conv.id);
            // Immediately refetch conversations to update badge
            refetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from conversation badge updates');
      supabase.removeChannel(subscription);
    };
  }, [user, isAuthenticated, refetchConversations]);

  // Calculate total unread messages count
  const totalUnreadCount = conversations.reduce((total, conv) => {
    const count = conv.unreadCount || 0;
    return total + count;
  }, 0);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setActionOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActionOpen(false);
    }, 300);
  };

  const handleSignIn = () => {
    navigate(createPageUrl("SignIn"));
  };

  const handleSignUp = () => {
    navigate(createPageUrl("SignUp"));
  };

  const handleSignOut = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      console.log('🔴 Sign out button clicked');
      
      // Call logout function
      await logout();
      
      // Clear any local storage items
      try {
        localStorage.removeItem('preferredLanguage');
        // Don't remove other items as they might be needed
      } catch (storageError) {
        console.warn('⚠️ Error clearing localStorage:', storageError);
      }
      
      // Force a full page reload to clear all state and ensure clean logout
      // Use window.location.replace to prevent back button issues
      // Redirect to sign in page after logout
      window.location.replace(createPageUrl("SignIn"));
    } catch (error) {
      console.error('❌ Error during sign out:', error);
      // Still redirect even if there's an error
      // Clear user state manually
      try {
    await logout();
      } catch (logoutError) {
        console.error('❌ Error in fallback logout:', logoutError);
      }
      // Force redirect to sign in page
      window.location.replace(createPageUrl("SignIn"));
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Kalam:wght@300;400;700&family=Comic+Neue:wght@300;400;700&display=swap');
        
        :root {
          --font-dancing: 'Dancing Script', cursive;
          --font-kalam: 'Kalam', cursive;
          --font-comic: 'Comic Neue', cursive;
        }
        
        .font-dancing {
          font-family: var(--font-dancing);
        }
        
        .font-kalam {
          font-family: var(--font-kalam);
        }
        
        .font-comic {
          font-family: var(--font-comic);
        }
      `}</style>

      {/* Top Announcement Bar */}
      {t.announcement && (
        <div className="bg-indigo-950 text-white overflow-hidden py-2 flex items-center justify-center">
          <div className="whitespace-nowrap text-lg md:text-xl font-medium tracking-wide animate-[marquee_20s_linear_infinite]" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <span className="font-extrabold text-yellow-400 uppercase tracking-widest text-sm mr-3">{t.announcement.label}</span> 
            <span className="text-white/90">{t.announcement.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between gap-5">
          <Link to={createPageUrl("Home")} className="shrink-0 hover:opacity-90 transition-opacity">
            <img 
              src="https://hphhmjcutesqsdnubnnw.supabase.co/storage/v1/object/public/app-assets/logo.png" 
              alt="One2One Love Logo" 
              className="h-[88px] w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 font-bold text-lg shrink-0">
            <Link to={createPageUrl("Home")} className="hover:text-yellow-200">⌂ {t.nav.home}</Link>
            
            <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <button className="hover:text-yellow-200">♡ {t.nav.action} ▾</button>
              {actionOpen && (
                <div className="absolute right-0 top-8 w-72 bg-white text-slate-800 rounded-xl shadow-xl p-2 z-50 text-sm font-normal">
                  <Link to={createPageUrl("LoveNotes")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>💗 {t.actionMenu.sendLoveNote}</Link>
                  <Link to={createPageUrl("LGBTQSupport")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>🌈 {t.actionMenu.lgbtqSupport}</Link>
                  <Link to={createPageUrl("RelationshipQuizzes")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>🧩 {t.actionMenu.relationshipQuizzes}</Link>
                  <Link to={createPageUrl("DateIdeas")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>🗓️ {t.actionMenu.dateIdeas}</Link>
                  <Link to={createPageUrl("RelationshipGoals")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>🎯 {t.actionMenu.relationshipGoals}</Link>
                  <Link to={createPageUrl("MemoryLane")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>📷 {t.actionMenu.memoryLane}</Link>
                  <Link to={createPageUrl("CoupleSupport")} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100" onClick={() => setActionOpen(false)}>👥 {t.actionMenu.coupleSupport}</Link>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link to={createPageUrl("FriendRequests")} className="hover:text-yellow-200 relative">
                  🔔 {t.nav.requests}
                </Link>
                <Link to={createPageUrl("Chat")} className="hover:text-yellow-200 relative">
                  💬 {t.nav.chat}
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </span>
                  )}
                </Link>
                <Link to={createPageUrl("Profile")} className="hover:text-yellow-200">👤 {t.nav.profile}</Link>
                <button onClick={handleSignOut} className="hover:text-yellow-200">{t.nav.signOut}</button>
              </>
            ) : (
              <>
                <Link to={createPageUrl("Invite")} className="hover:text-yellow-200">{t.nav.invite}</Link>
                <button onClick={handleSignIn} className="hover:text-yellow-200">{t.nav.signIn}</button>
                <button onClick={handleSignUp} className="text-yellow-300 text-xl hover:text-yellow-100">{t.nav.signUp}</button>
              </>
            )}

            <div className="relative">
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-36 rounded-xl bg-white/15 border border-white/25 px-4 py-3 text-yellow-300 h-auto font-bold text-lg">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">US English</SelectItem>
                  <SelectItem value="es">ES Español</SelectItem>
                  <SelectItem value="fr">FR Français</SelectItem>
                  <SelectItem value="it">IT Italiano</SelectItem>
                  <SelectItem value="de">DE Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </nav>
          
          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-white/20 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="flex flex-col gap-2">
                <Link
                  to={createPageUrl("Home")}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  {t.nav.home}
                </Link>

                {/* Action Dropdown for Mobile */}
                <div className="relative">
                  <button
                    onClick={() => setMobileActionOpen(!mobileActionOpen)}
                    className="flex items-center justify-between w-full text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      {t.nav.action}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileActionOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {mobileActionOpen && (
                    <div className="mt-1 bg-white/10 rounded-lg overflow-hidden">
                      <Link
                        to={createPageUrl("LoveNotes")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Heart className="w-5 h-5" />
                        {t.actionMenu.sendLoveNote}
                      </Link>
                      <Link
                        to={createPageUrl("LGBTQSupport")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Rainbow className="w-5 h-5" />
                        {t.actionMenu.lgbtqSupport}
                      </Link>
                      <Link
                        to={createPageUrl("RelationshipCoach")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Sparkles className="w-5 h-5" />
                        AI Relationship Coach
                      </Link>
                      <Link
                        to={createPageUrl("CoupleSupport")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Users className="w-5 h-5" />
                        {t.actionMenu.coupleSupport}
                      </Link>
                      <Link
                        to={createPageUrl("RelationshipQuizzes")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Heart className="w-5 h-5" />
                        {t.actionMenu.relationshipQuizzes}
                      </Link>
                      <Link
                        to={createPageUrl("RelationshipMilestones")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Heart className="w-5 h-5" />
                        {t.actionMenu.relationshipMilestones}
                      </Link>
                      <Link
                        to={createPageUrl("RelationshipGoals")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Target className="w-5 h-5" />
                        {t.actionMenu.relationshipGoals}
                      </Link>
                      <Link
                        to={createPageUrl("DateIdeas")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Heart className="w-5 h-5" />
                        {t.actionMenu.dateIdeas}
                      </Link>
                      <Link
                        to={createPageUrl("MemoryLane")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Heart className="w-5 h-5" />
                        {t.actionMenu.memoryLane}
                      </Link>
                      <Link
                        to={createPageUrl("AIContentCreator")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Sparkles className="w-5 h-5" />
                        {t.actionMenu.aiCreator}
                      </Link>
                      <Link
                        to={createPageUrl("WinACruise")}
                        className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-3 transition-all"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileActionOpen(false);
                        }}
                      >
                        <Gift className="w-5 h-5" />
                        {t.actionMenu.winCruise}
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to={createPageUrl("Community")}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-5 h-5" />
                  {t.nav.community}
                </Link>
                <Link
                  to={createPageUrl("LGBTQSupport")}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Rainbow className="w-5 h-5" />
                  {t.nav.lgbtq}
                </Link>
                {isAuthenticated && (
                  <Link
                    to={createPageUrl("Profile")}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    {t.nav.profile}
                  </Link>
                )}
                <Link
                  to={createPageUrl("Developer")}
                  className="flex items-center gap-2 text-yellow-300 hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Code className="w-5 h-5" />
                  {t.nav.developer}
                </Link>
                <div className="border-t border-white/20 my-2"></div>
                
                {/* Friend Requests - Only show when authenticated */}
                {isAuthenticated && (
                  <Link
                    to={createPageUrl("FriendRequests")}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell className="w-5 h-5" />
                    {t.nav.requests}
                  </Link>
                )}

                {/* Chat - Only show when authenticated */}
                {isAuthenticated && (
                  <Link
                    to={createPageUrl("Chat")}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all relative"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t.nav.chat}
                    {totalUnreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                        {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Sign Out - Only show when authenticated */}
                {isAuthenticated && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMobileMenuOpen(false);
                      handleSignOut(e);
                    }}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    {t.nav.signOut}
                  </button>
                )}
                
                {/* Show Invite, Sign In/Sign Up only when NOT authenticated */}
                {!isAuthenticated && (
                  <>
                    <Link
                      to={createPageUrl("Invite")}
                      className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserCheck className="w-5 h-5" />
                      {t.nav.invite}
                    </Link>
                    <button
                      onClick={() => {
                        handleSignUp();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 px-4 py-3 rounded-lg transition-all font-semibold"
                    >
                      <UserPlus className="w-5 h-5" />
                      {t.nav.signUp}
                    </button>
                    <button
                      onClick={() => {
                        handleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                    >
                      <LogIn className="w-5 h-5" />
                      {t.nav.signIn}
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <section className="bg-white text-center px-5 py-5 border-t">
        <h3 className="font-black text-lg">{fT.loveGrow}</h3>
        <p className="text-slate-600 max-w-5xl mx-auto mt-1">{fT.footerBody}</p>
      </section>

      <footer className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[1.3fr_1fr_1fr] gap-12">
          <div>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/19ffc2fa2_ONE2ONELOVELOGO.png" alt="One2OneLove" className="h-28 w-auto" />
            <div className="text-lg mt-2">{fT.loveGrow}</div>
            <div className="flex gap-3 mt-5 text-2xl"><span>●</span><span>◉</span><span>𝕏</span><span>♪</span><span>↗</span></div>
          </div>
          <div><h4 className="text-xl font-black mb-4">{fT.supportCol}</h4><FooterLink onClick={() => navigate(createPageUrl("HelpCenter"))}>{fT.help}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("ContactUs"))}>{fT.contact}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("PrivacyPolicy"))}>{fT.privacy}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("TermsOfService"))}>{fT.terms}</FooterLink></div>
          <div><h4 className="text-xl font-black mb-4">{fT.company}</h4><FooterLink onClick={() => navigate(createPageUrl("AboutUs"))}>{fT.about}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("Suggestions"))}>{fT.suggestions}</FooterLink></div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/25 mt-8 pt-4 text-center text-sm">{fT.copyright}</div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LanguageContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}

export { useLanguage };
