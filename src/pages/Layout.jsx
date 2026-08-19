import React, { createContext, useContext, useState } from "react";
import { ChevronDown, Heart, Home, LogIn, LogOut, Menu, MessageCircle, Sparkles, User, UserPlus, Users, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getMyConversations } from "@/lib/chatService";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    nav: { home: "Home", globalRoom: "Global Relationship Room", community: "Community", action: "Relationship Tools", profile: "Profile", chat: "Chat", signIn: "Sign In", signUp: "Sign Up", signOut: "Sign Out", menu: "Open navigation menu", closeMenu: "Close navigation menu", language: "Language" },
    tools: { library: "Relationship Library", dashboard: "Couples Dashboard", loveNotes: "Love Notes", coach: "AI Relationship Coach", support: "Relationship Support", quizzes: "Relationship Quizzes", milestones: "Milestones & Anniversaries", goals: "Relationship Goals", dateIdeas: "Date Ideas", memoryLane: "Memory Lane" },
  },
  es: {
    nav: { home: "Inicio", globalRoom: "Sala Global de Relaciones", community: "Comunidad", action: "Herramientas de Relación", profile: "Perfil", chat: "Chat", signIn: "Iniciar Sesión", signUp: "Registrarse", signOut: "Cerrar Sesión", menu: "Abrir menú de navegación", closeMenu: "Cerrar menú de navegación", language: "Idioma" },
    tools: { library: "Biblioteca de Relaciones", dashboard: "Panel de Pareja", loveNotes: "Notas de Amor", coach: "Coach de Relaciones con IA", support: "Apoyo para Relaciones", quizzes: "Cuestionarios de Relaciones", milestones: "Hitos y Aniversarios", goals: "Metas de Relación", dateIdeas: "Ideas para Citas", memoryLane: "Camino de Recuerdos" },
  },
  fr: {
    nav: { home: "Accueil", globalRoom: "Salle Mondiale des Relations", community: "Communauté", action: "Outils Relationnels", profile: "Profil", chat: "Chat", signIn: "Se Connecter", signUp: "S’inscrire", signOut: "Se Déconnecter", menu: "Ouvrir le menu de navigation", closeMenu: "Fermer le menu de navigation", language: "Langue" },
    tools: { library: "Bibliothèque Relationnelle", dashboard: "Tableau de Bord du Couple", loveNotes: "Notes d’Amour", coach: "Coach Relationnel IA", support: "Soutien aux Relations", quizzes: "Quiz sur les Relations", milestones: "Jalons et Anniversaires", goals: "Objectifs de Relation", dateIdeas: "Idées de Rendez-vous", memoryLane: "Allée des Souvenirs" },
  },
  it: {
    nav: { home: "Home", globalRoom: "Sala Globale delle Relazioni", community: "Community", action: "Strumenti di Relazione", profile: "Profilo", chat: "Chat", signIn: "Accedi", signUp: "Iscriviti", signOut: "Esci", menu: "Apri menu di navigazione", closeMenu: "Chiudi menu di navigazione", language: "Lingua" },
    tools: { library: "Biblioteca delle Relazioni", dashboard: "Dashboard di Coppia", loveNotes: "Note d’Amore", coach: "Coach Relazionale IA", support: "Supporto per Relazioni", quizzes: "Quiz sulle Relazioni", milestones: "Traguardi e Anniversari", goals: "Obiettivi di Relazione", dateIdeas: "Idee per Appuntamenti", memoryLane: "Viale dei Ricordi" },
  },
  de: {
    nav: { home: "Startseite", globalRoom: "Globaler Beziehungsraum", community: "Community", action: "Beziehungswerkzeuge", profile: "Profil", chat: "Chat", signIn: "Anmelden", signUp: "Registrieren", signOut: "Abmelden", menu: "Navigationsmenü öffnen", closeMenu: "Navigationsmenü schließen", language: "Sprache" },
    tools: { library: "Beziehungsbibliothek", dashboard: "Paar-Dashboard", loveNotes: "Liebesbotschaften", coach: "KI-Beziehungscoach", support: "Beziehungsunterstützung", quizzes: "Beziehungsquiz", milestones: "Meilensteine & Jahrestage", goals: "Beziehungsziele", dateIdeas: "Date-Ideen", memoryLane: "Erinnerungsgasse" },
  },
};

const activeLanguages = [
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["it", "Italiano"],
  ["de", "Deutsch"],
];
const activeCodes = new Set(activeLanguages.map(([code]) => code));

const LanguageContext = createContext(null);

function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const stored = localStorage.getItem("preferredLanguage") || "en";
    return activeCodes.has(stored) ? stored : "en";
  });

  const changeLanguage = (languageCode) => {
    if (!activeCodes.has(languageCode)) return;
    setCurrentLanguage(languageCode);
    localStorage.setItem("preferredLanguage", languageCode);
  };

  return <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>{children}</LanguageContext.Provider>;
}

function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within a LanguageProvider");
  return value;
}

const toolLinks = [
  ["library", "RelationshipLibrary"],
  ["dashboard", "CouplesDashboard"],
  ["loveNotes", "LoveNotes"],
  ["coach", "RelationshipCoach"],
  ["support", "CoupleSupport"],
  ["quizzes", "RelationshipQuizzes"],
  ["milestones", "RelationshipMilestones"],
  ["goals", "RelationshipGoals"],
  ["dateIdeas", "DateIdeas"],
  ["memoryLane", "MemoryLane"],
];

function NavigationLink({ to, icon: Icon, children, onClick, active }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-white/20 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

function LanguageContent({ children }) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const { data: conversations = [] } = useQuery({
    queryKey: ["layout-conversations", user?.id],
    queryFn: getMyConversations,
    enabled: Boolean(user?.id && isAuthenticated),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    initialData: [],
  });

  const unreadCount = conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0);
  const isActive = (page) => location.pathname === createPageUrl(page);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      setMobileOpen(false);
      navigate(createPageUrl("SignIn"), { replace: true });
    }
  };

  const ToolMenu = ({ mobile = false }) => (
    <div className={mobile ? "mt-2 overflow-hidden rounded-xl bg-white/10" : "absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border bg-white py-2 text-gray-800 shadow-2xl"}>
      {toolLinks.map(([key, page]) => (
        <Link
          key={page}
          to={createPageUrl(page)}
          onClick={() => { setToolsOpen(false); setMobileToolsOpen(false); setMobileOpen(false); }}
          className={mobile ? "block px-4 py-3 text-sm text-white hover:bg-white/15" : "block px-4 py-3 text-sm font-medium hover:bg-purple-50 hover:text-purple-700"}
        >
          {t.tools[key]}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-purple-800 via-purple-700 to-pink-700 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to={createPageUrl("Home")} className="flex min-w-0 items-center gap-2 text-white">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white/15"><Heart className="h-6 w-6 fill-white" aria-hidden="true" /></span>
            <span className="truncate text-lg font-bold">One2One Love</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            <NavigationLink to={createPageUrl("Home")} icon={Home} active={isActive("Home")}>{t.nav.home}</NavigationLink>
            <NavigationLink to={createPageUrl("GlobalRelationshipRoom")} icon={MessageCircle} active={isActive("GlobalRelationshipRoom")}>{t.nav.globalRoom}</NavigationLink>
            <NavigationLink to={createPageUrl("Community")} icon={Users} active={isActive("Community")}>{t.nav.community}</NavigationLink>

            <div className="relative">
              <button type="button" onClick={() => setToolsOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white" aria-expanded={toolsOpen}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />{t.nav.action}<ChevronDown className={`h-4 w-4 transition ${toolsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {toolsOpen && <ToolMenu />}
            </div>

            {isAuthenticated && <NavigationLink to={createPageUrl("Chat")} icon={MessageCircle} active={isActive("Chat")}>{t.nav.chat}{unreadCount > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</NavigationLink>}
            {isAuthenticated && <NavigationLink to={createPageUrl("Profile")} icon={User} active={isActive("Profile")}>{t.nav.profile}</NavigationLink>}

            <Select value={currentLanguage} onValueChange={changeLanguage}>
              <SelectTrigger className="ml-1 w-32 border-white/30 bg-white/10 text-white" aria-label={t.nav.language}><SelectValue /></SelectTrigger>
              <SelectContent>{activeLanguages.map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}</SelectContent>
            </Select>

            {isAuthenticated ? (
              <Button type="button" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />{t.nav.signOut}</Button>
            ) : (
              <>
                <Button type="button" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => navigate(createPageUrl("SignIn"))}><LogIn className="mr-2 h-4 w-4" />{t.nav.signIn}</Button>
                <Button type="button" variant="secondary" onClick={() => navigate(createPageUrl("SignUp"))}><UserPlus className="mr-2 h-4 w-4" />{t.nav.signUp}</Button>
              </>
            )}
          </nav>

          <button type="button" className="ml-auto rounded-lg p-2 text-white hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? t.nav.closeMenu : t.nav.menu} aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-white/10 px-4 pb-4 lg:hidden" aria-label="Mobile navigation">
            <div className="mx-auto max-w-7xl space-y-1 pt-3">
              <NavigationLink to={createPageUrl("Home")} icon={Home} onClick={() => setMobileOpen(false)} active={isActive("Home")}>{t.nav.home}</NavigationLink>
              <div className="block"><NavigationLink to={createPageUrl("GlobalRelationshipRoom")} icon={MessageCircle} onClick={() => setMobileOpen(false)} active={isActive("GlobalRelationshipRoom")}>{t.nav.globalRoom}</NavigationLink></div>
              <div className="block"><NavigationLink to={createPageUrl("Community")} icon={Users} onClick={() => setMobileOpen(false)} active={isActive("Community")}>{t.nav.community}</NavigationLink></div>

              <button type="button" onClick={() => setMobileToolsOpen((open) => !open)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-white hover:bg-white/10" aria-expanded={mobileToolsOpen}>
                <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />{t.nav.action}</span><ChevronDown className={`h-4 w-4 transition ${mobileToolsOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileToolsOpen && <ToolMenu mobile />}

              {isAuthenticated && <div className="block"><NavigationLink to={createPageUrl("Chat")} icon={MessageCircle} onClick={() => setMobileOpen(false)} active={isActive("Chat")}>{t.nav.chat}{unreadCount > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs">{unreadCount > 99 ? "99+" : unreadCount}</span>}</NavigationLink></div>}
              {isAuthenticated && <div className="block"><NavigationLink to={createPageUrl("Profile")} icon={User} onClick={() => setMobileOpen(false)} active={isActive("Profile")}>{t.nav.profile}</NavigationLink></div>}

              <div className="pt-2">
                <Select value={currentLanguage} onValueChange={changeLanguage}>
                  <SelectTrigger className="w-full border-white/30 bg-white/10 text-white" aria-label={t.nav.language}><SelectValue /></SelectTrigger>
                  <SelectContent>{activeLanguages.map(([code, name]) => <SelectItem key={code} value={code}>{name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                {isAuthenticated ? <Button type="button" variant="secondary" className="w-full" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />{t.nav.signOut}</Button> : <><Button type="button" variant="ghost" className="flex-1 text-white hover:bg-white/10 hover:text-white" onClick={() => navigate(createPageUrl("SignIn"))}>{t.nav.signIn}</Button><Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(createPageUrl("SignUp"))}>{t.nav.signUp}</Button></>}
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}

export default function Layout({ children }) {
  return <LanguageProvider><LanguageContent>{children}</LanguageContent></LanguageProvider>;
}

export { useLanguage };
