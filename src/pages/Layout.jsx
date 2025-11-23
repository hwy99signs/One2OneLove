
import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Home, ChevronDown, User, LogIn, LogOut, Users, UserPlus, Menu, X, Sparkles, Target, Code, Rainbow, UserCheck, Gift, MessageCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const translations = {
  en: {
    nav: { home: "Home", action: "Action", profile: "Profile", signIn: "Sign In", signUp: "Sign Up", invite: "Invite", community: "Community", aiCreator: "AI Content Creator", lgbtq: "LGBTQ+ Support", developer: "Dev" },
    actionMenu: { sendLoveNote: "Send A Love Note", coupleSupport: "Relationship Support", lgbtqSupport: "LGBTQ+ Support", relationshipQuizzes: "Relationship Quizzes", relationshipMilestones: "Milestones & Anniversaries", relationshipGoals: "Relationship Goals", dateIdeas: "Date Ideas", memoryLane: "Memory Lane", aiCreator: "AI Content Creator", winCruise: "Win Prizes!" }
  },
  es: {
    nav: { home: "Inicio", action: "Acción", profile: "Perfil", signIn: "Iniciar Sesión", signUp: "Registrarse", invite: "Invitar", community: "Comunidad", aiCreator: "Creador de Contenido IA", lgbtq: "Apoyo LGBTQ+", developer: "Dev" },
    actionMenu: { sendLoveNote: "Enviar una Nota de Amor", coupleSupport: "Apoyo para Relaciones", lgbtqSupport: "Apoyo LGBTQ+", relationshipQuizzes: "Cuestionarios de Relaciones", relationshipMilestones: "Hitos y Aniversarios", relationshipGoals: "Metas de Relación", dateIdeas: "Ideas para Citas", memoryLane: "Carril de Recuerdos", aiCreator: "Creador de Contenido IA", winCruise: "¡Gana Premios!" }
  },
  fr: {
    nav: { home: "Accueil", action: "Action", profile: "Profil", signIn: "Se Connecter", signUp: "S'inscrire", invite: "Inviter", community: "Communauté", aiCreator: "Créateur de Contenu IA", lgbtq: "Soutien LGBTQ+", developer: "Dev" },
    actionMenu: { sendLoveNote: "Envoyer une Note d'Amour", coupleSupport: "Soutien aux Relations", lgbtqSupport: "Soutien LGBTQ+", relationshipQuizzes: "Quiz sur les Relations", relationshipMilestones: "Jalons et Anniversaires", relationshipGoals: "Objectifs de Relation", dateIdeas: "Idées de Rendez-vous", memoryLane: "Allée des Souvenirs", aiCreator: "Créateur de Contenu IA", winCruise: "Gagnez des Prix!" }
  },
  it: {
    nav: { home: "Home", action: "Azione", profile: "Profilo", signIn: "Accedi", signUp: "Iscriviti", invite: "Invita", community: "Comunità", aiCreator: "Creatore de Contenuti IA", lgbtq: "Supporto LGBTQ+", developer: "Dev" },
    actionMenu: { sendLoveNote: "Invia una Nota d'Amore", coupleSupport: "Supporto per Relazioni", lgbtqSupport: "Supporto LGBTQ+", relationshipQuizzes: "Quiz sulle Relazioni", relationshipMilestones: "Traguardi e Anniversari", relationshipGoals: "Obiettivi di Relazione", dateIdeas: "Idee per Appuntamenti", memoryLane: "Viale dei Ricordi", aiCreator: "Creatore de Contenuti IA", winCruise: "Vinci Premi!" }
  },
  de: {
    nav: { home: "Startseite", action: "Aktion", profile: "Profil", signIn: "Anmelden", signUp: "Registrieren", invite: "Einladen", community: "Gemeinschaft", aiCreator: "KI-Content-Ersteller", lgbtq: "LGBTQ+ Unterstützung", developer: "Dev" },
    actionMenu: { sendLoveNote: "Eine Liebesbotschaft Senden", coupleSupport: "Beziehungsunterstützung", lgbtqSupport: "LGBTQ+ Unterstützung", relationshipQuizzes: "Beziehungsquiz", relationshipMilestones: "Meilensteine & Jahrestage", relationshipGoals: "Beziehungsziele", dateIdeas: "Date-Ideen", memoryLane: "Erinnerungsgasse", aiCreator: "KI-Content-Ersteller", winCruise: "Gewinne Preise!" }
  },
  nl: {
    nav: { home: "Home", action: "Actie", profile: "Profil", signIn: "Inloggen", signUp: "Aanmelden", invite: "Uitnodigen", community: "Gemeenschap", aiCreator: "AI Content Maker", lgbtq: "LGBTQ+ Ondersteuning", developer: "Dev" },
    actionMenu: { sendLoveNote: "Stuur een Liefdebriefje", coupleSupport: "Relatie Ondersteuning", lgbtqSupport: "LGBTQ+ Ondersteuning", relationshipQuizzes: "Relatie Quizzen", relationshipMilestones: "Mijlpalen & Jubilea", relationshipGoals: "Relatie Doelen", dateIdeas: "Date Ideeën", memoryLane: "Herinnerings Laan", aiCreator: "AI Content Maker", winCruise: "Win Prijzen!" }
  },
  pt: {
    nav: { home: "Início", action: "Ação", profile: "Perfil", signIn: "Entrar", signUp: "Inscrever-se", invite: "Convidar", community: "Comunidade", aiCreator: "Criador de Conteúdo IA", lgbtq: "Apoio LGBTQ+", developer: "Dev" },
    actionMenu: { sendLoveNote: "Enviar uma Nota de Amor", coupleSupport: "Apoio para Relacionamentos", lgbtqSupport: "Apoio LGBTQ+", relationshipQuizzes: "Questionários de Relacionamento", relationshipMilestones: "Marcos e Aniversários", relationshipGoals: "Metas de Relacionamento", dateIdeas: "Ideas de Encontros", memoryLane: "Alameda das Memórias", aiCreator: "Criador de Conteúdo IA", winCruise: "Ganhe Prêmios!" }
  }
};

const LanguageContext = createContext();

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
  const closeTimeoutRef = useRef(null);

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage);

  // Get authentication state
  const { isAuthenticated, logout } = useAuth();

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

  const handleSignOut = async () => {
    await logout();
    navigate(createPageUrl("Home"));
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

      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-shrink-0">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/19ffc2fa2_ONE2ONELOVELOGO.png" 
                alt="One2One Love Logo" 
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-white leading-tight">One 2 One Love</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center mx-4">
              <Link
                to={createPageUrl("Home")}
                className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all font-medium text-sm"
              >
                <Home className="w-4 h-4" />
                {t.nav.home}
              </Link>

              <div 
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-all font-medium text-sm"
                >
                  <Heart className="w-4 h-4" />
                  {t.nav.action}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {actionOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
                    <Link
                      to={createPageUrl("LoveNotes")}
                      className="w-full px-6 py-4 text-left bg-gradient-to-r from-pink-400 to-pink-600 text-white hover:from-pink-500 hover:to-pink-700 transition-all font-semibold flex items-center gap-3"
                      onClick={() => setActionOpen(false)}
                    >
                      <Heart className="w-5 h-5 fill-current" />
                      {t.actionMenu.sendLoveNote}
                    </Link>

                    <Link
                      to={createPageUrl("LGBTQSupport")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Rainbow className="w-5 h-5 text-purple-600" />
                      <span>{t.actionMenu.lgbtqSupport}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("RelationshipCoach")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span>AI Relationship Coach</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("CoupleSupport")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>{t.actionMenu.coupleSupport}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("RelationshipQuizzes")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Heart className="w-5 h-5 text-pink-600" />
                      <span>{t.actionMenu.relationshipQuizzes}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("RelationshipMilestones")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Heart className="w-5 h-5 text-pink-600" />
                      <span>{t.actionMenu.relationshipMilestones}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("RelationshipGoals")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Target className="w-5 h-5 text-pink-600" />
                      <span>{t.actionMenu.relationshipGoals}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("DateIdeas")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Heart className="w-5 h-5 text-pink-600" />
                      <span>{t.actionMenu.dateIdeas}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("MemoryLane")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Heart className="w-5 h-5 text-pink-600" />
                      <span>{t.actionMenu.memoryLane}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("AIContentCreator")}
                      className="w-full px-6 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-3 border-b border-gray-100"
                      onClick={() => setActionOpen(false)}
                    >
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <span>{t.actionMenu.aiCreator}</span>
                    </Link>
                    
                    <Link
                      to={createPageUrl("WinACruise")}
                      className="w-full px-6 py-4 text-left bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 transition-all font-semibold flex items-center gap-3"
                      onClick={() => setActionOpen(false)}
                    >
                      <Gift className="w-5 h-5" />
                      {t.actionMenu.winCruise}
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to={createPageUrl("Community")}
                className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all font-medium text-sm"
              >
                <Users className="w-4 h-4" />
                {t.nav.community}
              </Link>

              <Link
                to={createPageUrl("LGBTQSupport")}
                className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all font-medium text-sm"
              >
                <Rainbow className="w-4 h-4" />
                {t.nav.lgbtq}
              </Link>
              
              {isAuthenticated && (
                <Link
                  to={createPageUrl("Profile")}
                  className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all font-medium text-sm"
                >
                  <User className="w-4 h-4" />
                  {t.nav.profile}
                </Link>
              )}

              <Link
                to={createPageUrl("Developer")}
                className="flex items-center gap-1 text-yellow-300 hover:text-yellow-100 hover:bg-white/10 px-3 py-2 rounded-lg transition-all font-medium text-sm"
              >
                <Code className="w-4 h-4" />
                {t.nav.developer}
              </Link>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              {/* Friend Requests Icon - Only show when authenticated */}
              {isAuthenticated && (
                <Link to={createPageUrl("FriendRequests")} className="hidden md:block">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap relative" 
                    title="Friend Requests"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="hidden xl:inline ml-2">Requests</span>
                  </Button>
                </Link>
              )}

              {/* Chat Icon - Only show when authenticated */}
              {isAuthenticated && (
                <Link to={createPageUrl("Chat")} className="hidden md:block">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap relative" 
                    title="Chat"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden xl:inline ml-2">Chat</span>
                  </Button>
                </Link>
              )}

              {/* Show Invite, Sign In/Sign Up only when NOT authenticated */}
              {!isAuthenticated && (
                <>
                  <Link to={createPageUrl("Invite")} className="hidden md:block">
                    <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap" title={t.nav.invite}>
                      <UserCheck className="w-4 h-4 mr-1" />
                      <span className="hidden xl:inline">{t.nav.invite}</span>
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    className="hidden md:flex bg-white/20 hover:bg-white/30 text-white border border-white/30 whitespace-nowrap"
                    onClick={handleSignUp}
                    title={t.nav.signUp}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span className="hidden xl:inline">{t.nav.signUp}</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hidden md:flex text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap"
                    onClick={handleSignIn}
                    title={t.nav.signIn}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="hidden xl:inline">{t.nav.signIn}</span>
                  </Button>
                </>
              )}
              
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="w-[120px] h-9 bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm">
                  <SelectValue>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1">
                        {selectedLanguage?.flags.slice(0, 1).map((flag, index) => (
                          <img 
                            key={index}
                            src={`https://flagcdn.com/w20/${flag.country}.png`}
                            srcSet={`https://flagcdn.com/w40/${flag.country}.png 2x`}
                            width="16"
                            alt={flag.alt}
                            className="shadow-sm"
                          />
                        ))}
                      </div>
                      <span className="font-medium text-xs">{selectedLanguage?.code.toUpperCase()}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-xl">
                  {languages.map((lang) => (
                    <SelectItem 
                      key={lang.code} 
                      value={lang.code}
                      disabled={!lang.active}
                      className={`cursor-pointer hover:bg-gray-50 py-3 px-4 focus:bg-gray-100 ${!lang.active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3 relative">
                        <div className="flex items-center gap-1 min-w-[60px]">
                          {lang.flags.map((flag, index) => (
                            <img 
                              key={index}
                              src={`https://flagcdn.com/w20/${flag.country}.png`}
                              srcSet={`https://flagcdn.com/w40/${flag.country}.png 2x`}
                              width="20"
                              alt={flag.alt}
                              className="shadow-sm"
                            />
                          ))}
                        </div>
                        <span className="text-gray-800 font-medium">{lang.name}</span>
                        {!lang.active && (
                          <span className="ml-auto text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sign Out Button - Only show when authenticated, after language dropdown */}
              {isAuthenticated && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden md:flex text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap"
                  onClick={handleSignOut}
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden xl:inline">Sign Out</span>
                </Button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
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
                    Friend Requests
                  </Link>
                )}

                {/* Chat - Only show when authenticated */}
                {isAuthenticated && (
                  <Link
                    to={createPageUrl("Chat")}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat
                  </Link>
                )}

                {/* Sign Out - Only show when authenticated */}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-3 rounded-lg transition-all w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
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
