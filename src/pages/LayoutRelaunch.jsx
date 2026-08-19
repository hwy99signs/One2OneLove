import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Heart, Home, Languages as LanguagesIcon, LogIn, LogOut, Menu, MessageCircle, Sparkles, Target, User, UserPlus, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProgrammingNotificationCenter from '@/components/programming/ProgrammingNotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { getMyConversations } from '@/lib/chatService';
import { supabase } from '@/lib/supabase';

const LanguageContext = createContext(null);

const LANGUAGES = [
  { code: 'en', name: 'English', flag: 'us', active: true },
  { code: 'es', name: 'Spanish', flag: 'es', active: true },
  { code: 'fr', name: 'French', flag: 'fr', active: true },
  { code: 'it', name: 'Italian', flag: 'it', active: true },
  { code: 'de', name: 'German', flag: 'de', active: true },
  { code: 'nl', name: 'Dutch', flag: 'nl', active: false },
  { code: 'pt', name: 'Portuguese', flag: 'pt', active: false },
];

const COPY = {
  en: { home: 'Home', community: 'Community', loveNotes: 'Love Notes', tools: 'Tools', quiz: 'Love Language Quiz', dateIdeas: 'Date Ideas', goals: 'Relationship Goals', aiCreator: 'AI Content Creator', coach: 'AI Relationship Coach', profile: 'Profile', chat: 'Chat', signIn: 'Sign In', signUp: 'Sign Up', signOut: 'Sign Out', comingSoon: 'Coming Soon' },
  es: { home: 'Inicio', community: 'Comunidad', loveNotes: 'Notas de Amor', tools: 'Herramientas', quiz: 'Quiz de Lenguaje del Amor', dateIdeas: 'Ideas para Citas', goals: 'Metas de Relación', aiCreator: 'Creador de Contenido IA', coach: 'Coach de Relaciones IA', profile: 'Perfil', chat: 'Chat', signIn: 'Iniciar Sesión', signUp: 'Registrarse', signOut: 'Cerrar Sesión', comingSoon: 'Próximamente' },
  fr: { home: 'Accueil', community: 'Communauté', loveNotes: "Notes d'Amour", tools: 'Outils', quiz: "Quiz des Langages d'Amour", dateIdeas: 'Idées de Rendez-vous', goals: 'Objectifs de Relation', aiCreator: 'Créateur de Contenu IA', coach: 'Coach Relationnel IA', profile: 'Profil', chat: 'Chat', signIn: 'Se Connecter', signUp: "S'inscrire", signOut: 'Se Déconnecter', comingSoon: 'Bientôt' },
  it: { home: 'Home', community: 'Comunità', loveNotes: "Note d'Amore", tools: 'Strumenti', quiz: "Quiz del Linguaggio dell'Amore", dateIdeas: 'Idee per Appuntamenti', goals: 'Obiettivi di Relazione', aiCreator: 'Creatore di Contenuti IA', coach: 'Coach Relazionale IA', profile: 'Profilo', chat: 'Chat', signIn: 'Accedi', signUp: 'Iscriviti', signOut: 'Esci', comingSoon: 'Prossimamente' },
  de: { home: 'Startseite', community: 'Community', loveNotes: 'Love Notes', tools: 'Werkzeuge', quiz: 'Liebessprachen-Quiz', dateIdeas: 'Date-Ideen', goals: 'Beziehungsziele', aiCreator: 'KI-Content-Ersteller', coach: 'KI-Beziehungscoach', profile: 'Profil', chat: 'Chat', signIn: 'Anmelden', signUp: 'Registrieren', signOut: 'Abmelden', comingSoon: 'Demnächst' },
  nl: { home: 'Home', community: 'Community', loveNotes: 'Love Notes', tools: 'Tools', quiz: 'Liefdestaalquiz', dateIdeas: 'Date-ideeën', goals: 'Relatiedoelen', aiCreator: 'AI Content Maker', coach: 'AI Relatiecoach', profile: 'Profiel', chat: 'Chat', signIn: 'Inloggen', signUp: 'Aanmelden', signOut: 'Uitloggen', comingSoon: 'Binnenkort' },
  pt: { home: 'Início', community: 'Comunidade', loveNotes: 'Notas de Amor', tools: 'Ferramentas', quiz: 'Quiz de Linguagem do Amor', dateIdeas: 'Ideias para Encontros', goals: 'Metas de Relacionamento', aiCreator: 'Criador de Conteúdo IA', coach: 'Coach de Relacionamento IA', profile: 'Perfil', chat: 'Chat', signIn: 'Entrar', signUp: 'Inscrever-se', signOut: 'Sair', comingSoon: 'Em breve' },
};

function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const stored = localStorage.getItem('preferredLanguage') || 'en';
    const match = LANGUAGES.find((language) => language.code === stored && language.active);
    return match?.code || 'en';
  });

  const changeLanguage = (code) => {
    const match = LANGUAGES.find((language) => language.code === code && language.active);
    if (!match) return;
    setCurrentLanguage(match.code);
    localStorage.setItem('preferredLanguage', match.code);
  };

  return <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}

const PRIMARY_LINKS = [
  { key: 'home', path: '/Home', icon: Home },
  { key: 'community', path: '/Community', icon: Users },
  { key: 'loveNotes', path: '/LoveNotes', icon: Heart },
];

const TOOL_LINKS = [
  { key: 'quiz', path: '/LoveLanguageQuiz', icon: Heart },
  { key: 'dateIdeas', path: '/DateIdeas', icon: Sparkles },
  { key: 'goals', path: '/RelationshipGoals', icon: Target },
  { key: 'aiCreator', path: '/AIContentCreator', icon: Sparkles },
  { key: 'coach', path: '/RelationshipCoach', icon: MessageCircle },
];

function LayoutContent({ children }) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const selectedLanguage = LANGUAGES.find((language) => language.code === currentLanguage) || LANGUAGES[0];

  const { data: conversations = [], refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: getMyConversations,
    enabled: Boolean(user?.id && isAuthenticated),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return undefined;
    const channel = supabase
      .channel(`layout-conversations-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        const row = payload?.new;
        if (row?.user1_id === user.id || row?.user2_id === user.id) void refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated, refetch]);

  const unreadCount = useMemo(
    () => conversations.reduce((total, conversation) => total + Number(conversation?.unreadCount || 0), 0),
    [conversations]
  );

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileToolsOpen(false);
  };

  const handleLogout = async () => {
    closeMobile();
    await logout();
    navigate('/SignIn', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/Home" className="flex flex-shrink-0 items-center gap-3 transition hover:opacity-90" aria-label="One2OneLove home">
              <img
                src="https://hphhmjcutesqsdnubnnw.supabase.co/storage/v1/object/public/app-assets/logo.png"
                alt="One2OneLove"
                className="h-10 w-auto"
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
              />
              <span className="hidden text-lg font-bold leading-tight text-white sm:block">One 2 One Love</span>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
              {PRIMARY_LINKS.map(({ key, path, icon: Icon }) => (
                <Link key={key} to={path} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white">
                  <Icon className="h-4 w-4" />{t[key]}
                </Link>
              ))}

              <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
                <button type="button" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white" onClick={() => setToolsOpen((value) => !value)} aria-expanded={toolsOpen}>
                  <Sparkles className="h-4 w-4" />{t.tools}<ChevronDown className="h-4 w-4" />
                </button>
                {toolsOpen && (
                  <div className="absolute left-0 top-full mt-1 w-72 overflow-hidden rounded-xl bg-white py-2 shadow-2xl ring-1 ring-black/5">
                    {TOOL_LINKS.map(({ key, path, icon: Icon }) => (
                      <Link key={key} to={path} onClick={() => setToolsOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-pink-50 hover:text-pink-700">
                        <Icon className="h-5 w-5 text-pink-500" />{t[key]}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isAuthenticated && (
                <Link to="/Profile" className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"><User className="h-4 w-4" />{t.profile}</Link>
              )}
            </nav>

            <div className="flex items-center gap-1.5">
              {isAuthenticated ? <ProgrammingNotificationCenter languageCode={currentLanguage} /> : null}

              {isAuthenticated && (
                <Link to="/Chat" className="relative hidden rounded-lg p-2 text-white/85 transition hover:bg-white/10 hover:text-white md:block" aria-label={t.chat} title={t.chat}>
                  <MessageCircle className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </Link>
              )}

              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className="h-9 w-[94px] border-white/30 bg-white/20 text-white hover:bg-white/30 sm:w-[118px]" aria-label="Language">
                  <SelectValue>
                    <div className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${selectedLanguage.flag}.png`} width="18" alt="" /><span className="text-xs font-semibold">{selectedLanguage.code.toUpperCase()}</span></div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code} disabled={!language.active}>
                      <div className="flex min-w-[180px] items-center gap-3"><img src={`https://flagcdn.com/w20/${language.flag}.png`} width="20" alt="" /><span>{language.name}</span>{!language.active && <span className="ml-auto text-xs text-orange-600">{t.comingSoon}</span>}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!isAuthenticated ? (
                <>
                  <Button size="sm" variant="ghost" className="hidden text-white/90 hover:bg-white/10 hover:text-white md:flex" onClick={() => navigate('/SignIn')}><LogIn className="mr-1.5 h-4 w-4" />{t.signIn}</Button>
                  <Button size="sm" className="hidden border border-white/30 bg-white/20 text-white hover:bg-white/30 md:flex" onClick={() => navigate('/SignUp')}><UserPlus className="mr-1.5 h-4 w-4" />{t.signUp}</Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" className="hidden text-white/90 hover:bg-white/10 hover:text-white md:flex" onClick={handleLogout}><LogOut className="mr-1.5 h-4 w-4" />{t.signOut}</Button>
              )}

              <button type="button" onClick={() => setMobileOpen((value) => !value)} className="rounded-lg p-2 text-white transition hover:bg-white/10 lg:hidden" aria-label="Menu">
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-white/20 py-4 lg:hidden">
              <nav className="space-y-1">
                {PRIMARY_LINKS.map(({ key, path, icon: Icon }) => (
                  <Link key={key} to={path} onClick={closeMobile} className="flex items-center gap-3 rounded-lg px-4 py-3 text-white transition hover:bg-white/10"><Icon className="h-5 w-5" />{t[key]}</Link>
                ))}

                <button type="button" onClick={() => setMobileToolsOpen((value) => !value)} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-white transition hover:bg-white/10">
                  <span className="flex items-center gap-3"><Sparkles className="h-5 w-5" />{t.tools}</span><ChevronDown className={`h-4 w-4 transition ${mobileToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileToolsOpen && (
                  <div className="ml-4 overflow-hidden rounded-lg bg-white/10">
                    {TOOL_LINKS.map(({ key, path, icon: Icon }) => (
                      <Link key={key} to={path} onClick={closeMobile} className="flex items-center gap-3 px-4 py-3 text-white transition hover:bg-white/10"><Icon className="h-5 w-5" />{t[key]}</Link>
                    ))}
                  </div>
                )}

                {isAuthenticated && <Link to="/Profile" onClick={closeMobile} className="flex items-center gap-3 rounded-lg px-4 py-3 text-white transition hover:bg-white/10"><User className="h-5 w-5" />{t.profile}</Link>}
                {isAuthenticated && <Link to="/Chat" onClick={closeMobile} className="flex items-center gap-3 rounded-lg px-4 py-3 text-white transition hover:bg-white/10"><MessageCircle className="h-5 w-5" />{t.chat}{unreadCount > 0 && <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}</Link>}

                <div className="my-2 border-t border-white/20" />
                {!isAuthenticated ? (
                  <>
                    <button type="button" onClick={() => { closeMobile(); navigate('/SignIn'); }} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-white transition hover:bg-white/10"><LogIn className="h-5 w-5" />{t.signIn}</button>
                    <button type="button" onClick={() => { closeMobile(); navigate('/SignUp'); }} className="flex w-full items-center gap-3 rounded-lg bg-white/15 px-4 py-3 text-left font-semibold text-white transition hover:bg-white/20"><UserPlus className="h-5 w-5" />{t.signUp}</button>
                  </>
                ) : (
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-white transition hover:bg-white/10"><LogOut className="h-5 w-5" />{t.signOut}</button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default function LayoutRelaunch({ children }) {
  return <LanguageProvider><LayoutContent>{children}</LayoutContent></LanguageProvider>;
}
