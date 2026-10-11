
import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Home, ChevronDown, User, LogIn, LogOut, Users, UserPlus, Menu, X, Sparkles, Target, Code, Rainbow, UserCheck, Gift, MessageCircle, Bell, Gamepad2, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getMyConversations } from "@/lib/chatService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const translations = {
  en: {
    nav: { home: "Home", action: "Action", profile: "Profile", signIn: "Sign In", signUp: "Sign Up", invite: "Invite", community: "Community", aiCreator: "AI Content Creator", lgbtq: "LGBTQ+ Support", developer: "Dev", requests: "Requests", chat: "Chat", signOut: "Sign Out", language:"Language", buyTokens:"BUY CREDIT", openMenu:"Open navigation menu", closeMenu:"Close navigation menu" },
    actionMenu: { sendLoveNote: "Send A Love Note", coupleSupport: "Relationship Support", lgbtqSupport: "LGBTQ+ Support", relationshipQuizzes: "Relationship Quizzes", relationshipMilestones: "Milestones & Anniversaries", relationshipGoals: "Relationship Goals", dateIdeas: "Date Ideas", memoryLane: "Memory Lane", games: "Games", aiCreator: "AI Content Creator" },
    announcement: { label: "NEW · THE CREDIT SYSTEM IS HERE", text: "Buy Credit to send Love Notes and unlock pay-as-you-go features across One2OneLove." }
  },
  es: {
    nav: { home: "Inicio", action: "Acción", profile: "Perfil", signIn: "Iniciar Sesión", signUp: "Registrarse", invite: "Invitar", community: "Comunidad", aiCreator: "Creador de Contenido IA", lgbtq: "Apoyo LGBTQ+", developer: "Dev", requests: "Solicitudes", chat: "Chat", signOut: "Cerrar Sesión", language:"Idioma", buyTokens:"AGREGAR CRÉDITO", openMenu:"Abrir menú de navegación", closeMenu:"Cerrar menú de navegación" },
    actionMenu: { sendLoveNote: "Enviar una Nota de Amor", coupleSupport: "Apoyo para Relaciones", lgbtqSupport: "Apoyo LGBTQ+", relationshipQuizzes: "Cuestionarios de Relaciones", relationshipMilestones: "Hitos y Aniversarios", relationshipGoals: "Metas de Relación", dateIdeas: "Ideas para Citas", memoryLane: "Carril de Recuerdos", games: "Juegos", aiCreator: "Creador de Contenido IA" },
    announcement: { label: "NUEVO · EL SISTEMA DE CRÉDITOS YA ESTÁ AQUÍ", text: "Compra créditos para enviar Notas de Amor y desbloquear funciones de pago por uso en todo One2OneLove." }
  },
  fr: {
    nav: { home: "Accueil", action: "Action", profile: "Profil", signIn: "Se Connecter", signUp: "S'inscrire", invite: "Inviter", community: "Communauté", aiCreator: "Créateur de Contenu IA", lgbtq: "Soutien LGBTQ+", developer: "Dev", requests: "Demandes", chat: "Chat", signOut: "Se Déconnecter", language:"Langue", buyTokens:"AJOUTER DU CRÉDIT", openMenu:"Ouvrir le menu de navigation", closeMenu:"Fermer le menu de navigation" },
    actionMenu: { sendLoveNote: "Envoyer une Note d'Amour", coupleSupport: "Soutien aux Relations", lgbtqSupport: "Soutien LGBTQ+", relationshipQuizzes: "Quiz sur les Relations", relationshipMilestones: "Jalons et Anniversaires", relationshipGoals: "Objectifs de Relation", dateIdeas: "Idées de Rendez-vous", memoryLane: "Allée des Souvenirs", games: "Jeux", aiCreator: "Créateur de Contenu IA" },
    announcement: { label: "NOUVEAU · LE SYSTÈME DE CRÉDITS EST ARRIVÉ", text: "Achetez des crédits pour envoyer des Notes d’Amour et débloquer les fonctions à l’usage sur tout One2OneLove." }
  },
  it: {
    nav: { home: "Home", action: "Azione", profile: "Profilo", signIn: "Accedi", signUp: "Iscriviti", invite: "Invita", community: "Comunità", aiCreator: "Creatore de Contenuti IA", lgbtq: "Supporto LGBTQ+", developer: "Dev", requests: "Richieste", chat: "Chat", signOut: "Esci", language:"Lingua", buyTokens:"AGGIUNGI CREDITO", openMenu:"Apri menu di navigazione", closeMenu:"Chiudi menu di navigazione" },
    actionMenu: { sendLoveNote: "Invia una Nota d'Amore", coupleSupport: "Supporto per Relazioni", lgbtqSupport: "Supporto LGBTQ+", relationshipQuizzes: "Quiz sulle Relazioni", relationshipMilestones: "Traguardi e Anniversari", relationshipGoals: "Obiettivi di Relazione", dateIdeas: "Idee per Appuntamenti", memoryLane: "Viale dei Ricordi", games: "Giochi", aiCreator: "Creatore de Contenuti IA" },
    announcement: { label: "NOVITÀ · IL SISTEMA DI CREDITI È ARRIVATO", text: "Acquista crediti per inviare Note d’Amore e sbloccare le funzioni a consumo su tutto One2OneLove." }
  },
  de: {
    nav: { home: "Startseite", action: "Aktion", profile: "Profil", signIn: "Anmelden", signUp: "Registrieren", invite: "Einladen", community: "Gemeinschaft", aiCreator: "KI-Content-Ersteller", lgbtq: "LGBTQ+ Unterstützung", developer: "Dev", requests: "Anfragen", chat: "Chat", signOut: "Abmelden", language:"Sprache", buyTokens:"CREDIT HINZUFÜGEN", openMenu:"Navigationsmenü öffnen", closeMenu:"Navigationsmenü schließen" },
    actionMenu: { sendLoveNote: "Eine Liebesbotschaft Senden", coupleSupport: "Beziehungsunterstützung", lgbtqSupport: "LGBTQ+ Unterstützung", relationshipQuizzes: "Beziehungsquiz", relationshipMilestones: "Meilensteine & Jahrestage", relationshipGoals: "Beziehungsziele", dateIdeas: "Date-Ideen", memoryLane: "Erinnerungsgasse", games: "Spiele", aiCreator: "KI-Content-Ersteller" },
    announcement: { label: "NEU · DAS CREDIT-SYSTEM IST DA", text: "Kaufe Credits, um Liebesnotizen zu senden und nutzungsbasierte Funktionen auf ganz One2OneLove freizuschalten." }
  },
  nl: {
    nav: { home: "Home", action: "Actie", profile: "Profil", signIn: "Inloggen", signUp: "Aanmelden", invite: "Uitnodigen", community: "Gemeenschap", aiCreator: "AI Content Maker", lgbtq: "LGBTQ+ Ondersteuning", developer: "Dev", requests: "Verzoeken", chat: "Chat", signOut: "Uitloggen" },
    actionMenu: { sendLoveNote: "Stuur een Liefdebriefje", coupleSupport: "Relatie Ondersteuning", lgbtqSupport: "LGBTQ+ Ondersteuning", relationshipQuizzes: "Relatie Quizzen", relationshipMilestones: "Mijlpalen & Jubilea", relationshipGoals: "Relatie Doelen", dateIdeas: "Date Ideeën", memoryLane: "Herinnerings Laan", games: "Spellen", aiCreator: "AI Content Maker" },
    announcement: { label: "NIEUW · HET CREDITSYSTEEM IS ER", text: "Koop credits om Liefdesnotities te sturen en functies met betaling per gebruik op heel One2OneLove te ontgrendelen." }
  },
  pt: {
    nav: { home: "Início", action: "Ação", profile: "Perfil", signIn: "Entrar", signUp: "Inscrever-se", invite: "Convidar", community: "Comunidade", aiCreator: "Criador de Conteúdo IA", lgbtq: "Apoio LGBTQ+", developer: "Dev", requests: "Solicitações", chat: "Chat", signOut: "Sair" },
    actionMenu: { sendLoveNote: "Enviar uma Nota de Amor", coupleSupport: "Apoio para Relacionamentos", lgbtqSupport: "Apoio LGBTQ+", relationshipQuizzes: "Questionários de Relacionamento", relationshipMilestones: "Marcos e Aniversários", relationshipGoals: "Metas de Relacionamento", dateIdeas: "Ideas de Encontros", memoryLane: "Alameda das Memórias", games: "Jogos", aiCreator: "Criador de Conteúdo IA" },
    announcement: { label: "NOVO · O SISTEMA DE CRÉDITOS CHEGOU", text: "Compre créditos para enviar Notas de Amor e desbloquear funções pagas por uso em todo o One2OneLove." }
  }
};

const SHARE_COPY = {
  en:{ share:'Share this page', copied:'Link copied', text:'Check out this One2OneLove page.' },
  es:{ share:'Compartir esta página', copied:'Enlace copiado', text:'Mira esta página de One2OneLove.' },
  fr:{ share:'Partager cette page', copied:'Lien copié', text:'Découvrez cette page One2OneLove.' },
  it:{ share:'Condividi questa pagina', copied:'Link copiato', text:'Guarda questa pagina di One2OneLove.' },
  de:{ share:'Diese Seite teilen', copied:'Link kopiert', text:'Schau dir diese One2OneLove-Seite an.' },
};

const SHARE_EXCLUDED_ROUTES = new Set([
  '/admin','/adminaccess','/profile','/dashboard','/subscription','/payment-success',
  '/verifyphone','/signin','/login','/signup','/forgotpassword',
  '/professionalsignup','/therapistsignup','/influencersignup'
]);

const LanguageContext = createContext();

const FOOTER_COPY = {
  en: {
    loveGrow: "Love. Grow. Evolve. Together.", footerBody: "One2OneLove is designed to support healthier connection, thoughtful communication, self-reflection, shared memories, and real conversations about relationships—while welcoming people from every background.",
    supportCol: "Support", company: "Company", help: "Help Center", contact: "Contact Us", privacy: "Privacy Policy", terms: "Terms of Service", about: "About Us", reviews: "Reviews", suggestions: "Suggestions", reportProblem: "Report a problem",
    copyright: "© 2026 One2OneLove. Made with ❤️ for people pursuing and building healthier love and relationships."
  },
  es: {
    loveGrow: "Ama. Crece. Evoluciona. Juntos.", footerBody: "One2OneLove apoya conexiones más saludables, comunicación reflexiva, autorreflexión, recuerdos compartidos y conversaciones reales.",
    supportCol: "Soporte", company: "Compañía", help: "Centro de ayuda", contact: "Contáctanos", privacy: "Privacidad", terms: "Términos de servicio", about: "Sobre nosotros", reviews: "Reseñas", suggestions: "Sugerencias", reportProblem: "Reportar un problema", copyright: "© 2026 One2OneLove. Hecho con ❤️ para relaciones más saludables."
  },
  fr: {
    loveGrow: "Aimez. Grandissez. Évoluez. Ensemble.", footerBody: "One2OneLove favorise une connexion plus saine, une communication réfléchie, l’introspection, les souvenirs partagés et de vraies conversations.", supportCol: "Aide", company: "Entreprise", help: "Centre d’aide", contact: "Contact", privacy: "Confidentialité", terms: "Conditions d’utilisation", about: "À propos", reviews: "Avis", suggestions: "Suggestions", reportProblem: "Signaler un problème", copyright: "© 2026 One2OneLove. Fait avec ❤️ pour des relations plus saines."
  },
  it: {
    loveGrow: "Ama. Cresci. Evolvi. Insieme.", footerBody: "One2OneLove sostiene connessioni più sane, comunicazione consapevole, autoriflessione, ricordi condivisi e conversazioni reali.", supportCol: "Supporto", company: "Azienda", help: "Centro assistenza", contact: "Contatti", privacy: "Privacy", terms: "Termini di servizio", about: "Chi siamo", reviews: "Recensioni", suggestions: "Suggerimenti", reportProblem: "Segnala un problema", copyright: "© 2026 One2OneLove. Creato con ❤️ per relazioni più sane."
  },
  de: {
    loveGrow: "Lieben. Wachsen. Entwickeln. Gemeinsam.", footerBody: "One2OneLove unterstützt gesündere Verbindung, achtsame Kommunikation, Selbstreflexion, gemeinsame Erinnerungen und echte Gespräche.", supportCol: "Support", company: "Unternehmen", help: "Hilfe-Center", contact: "Kontakt", privacy: "Datenschutz", terms: "Nutzungsbedingungen", about: "Über uns", reviews: "Bewertungen", suggestions: "Vorschläge", reportProblem: "Ein Problem melden", copyright: "© 2026 One2OneLove. Mit ❤️ für gesündere Beziehungen."
  }
};

const MMIQ_FOOTER_COPY = {
  en: { tagline:'Compatibility. Insights. Stronger Relationships.', body:'MyMatchIQ helps people explore compatibility, gain clarity, recognize red flags earlier, and make more intentional relationship decisions.', support:'MyMatchIQ Support', explore:'Explore MyMatchIQ', home:'MyMatchIQ Home', passport:'Compatibility Passport', credits:'Credit', insights:'Compatibility Insights', gettingStarted:'Getting Started', invite:'Invite a Connection', workspace:'MyMatchIQ Workspace', signIn:'Sign In to One2OneLove', copyright:'MyMatchIQ — a One2OneLove feature.' },
  es: { tagline:'Compatibilidad. Claridad. Relaciones Más Fuertes.', body:'MyMatchIQ ayuda a explorar la compatibilidad, ganar claridad, reconocer señales de alerta antes y tomar decisiones relacionales más intencionales.', support:'Soporte MyMatchIQ', explore:'Explora MyMatchIQ', home:'Inicio MyMatchIQ', passport:'Pasaporte de Compatibilidad', credits:'Crédito', insights:'Insights de Compatibilidad', gettingStarted:'Primeros Pasos', invite:'Invitar a una Conexión', workspace:'Espacio MyMatchIQ', signIn:'Iniciar Sesión en One2OneLove', copyright:'MyMatchIQ — una función de One2OneLove.' },
  fr: { tagline:'Compatibilité. Clarté. Relations Plus Fortes.', body:'MyMatchIQ vous aide à explorer la compatibilité, gagner en clarté, reconnaître les signaux d’alerte plus tôt et prendre des décisions relationnelles plus intentionnelles.', support:'Assistance MyMatchIQ', explore:'Explorer MyMatchIQ', home:'Accueil MyMatchIQ', passport:'Passeport de Compatibilité', credits:'Crédit', insights:'Insights de Compatibilité', gettingStarted:'Bien Commencer', invite:'Inviter une Connexion', workspace:'Espace MyMatchIQ', signIn:'Se Connecter à One2OneLove', copyright:'MyMatchIQ — une fonctionnalité de One2OneLove.' },
  it: { tagline:'Compatibilità. Chiarezza. Relazioni Più Forti.', body:'MyMatchIQ aiuta a esplorare la compatibilità, ottenere chiarezza, riconoscere prima i segnali di allarme e prendere decisioni relazionali più intenzionali.', support:'Supporto MyMatchIQ', explore:'Esplora MyMatchIQ', home:'Home MyMatchIQ', passport:'Passaporto di Compatibilità', credits:'Credito', insights:'Insight di Compatibilità', gettingStarted:'Per Iniziare', invite:'Invita una Connessione', workspace:'Spazio MyMatchIQ', signIn:'Accedi a One2OneLove', copyright:'MyMatchIQ — una funzione di One2OneLove.' },
  de: { tagline:'Kompatibilität. Klarheit. Stärkere Beziehungen.', body:'MyMatchIQ hilft dabei, Kompatibilität zu erkunden, Klarheit zu gewinnen, Warnsignale früher zu erkennen und bewusstere Beziehungsentscheidungen zu treffen.', support:'MyMatchIQ Support', explore:'MyMatchIQ Entdecken', home:'MyMatchIQ Startseite', passport:'Kompatibilitäts-Pass', credits:'Credit', insights:'Kompatibilitäts-Einblicke', gettingStarted:'Erste Schritte', invite:'Eine Verbindung Einladen', workspace:'MyMatchIQ-Bereich', signIn:'Bei One2OneLove Anmelden', copyright:'MyMatchIQ — eine Funktion von One2OneLove.' },
};

const FacebookIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 hover:text-yellow-200 transition-colors"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>);
const InstagramIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 hover:text-yellow-200 transition-colors"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>);
const XIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 hover:text-yellow-200 transition-colors"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
const TiktokIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 hover:text-yellow-200 transition-colors"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.96-.5 3.96-1.82 5.36-1.2 1.28-2.9 2-4.7 2.06-2.12.08-4.34-.52-5.83-2.06-1.58-1.6-2.07-3.95-1.55-6.08.43-1.74 1.61-3.22 3.16-4.04 1.59-.83 3.53-.96 5.25-.49.27.08.53.18.78.3v4.18c-.46-.22-.97-.32-1.49-.3-.59.02-1.18.23-1.63.63-.61.54-.88 1.42-.71 2.21.14.67.62 1.22 1.25 1.44.75.27 1.64.12 2.24-.37.52-.42.84-1.07.87-1.74V.02z"/></svg>);
const PinterestIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 hover:text-yellow-200 transition-colors"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.188 0 7.451 2.986 7.451 6.969 0 4.167-2.626 7.519-6.275 7.519-1.226 0-2.38-.638-2.775-1.39l-.752 2.868c-.272 1.043-1.01 2.348-1.503 3.143 1.218.375 2.518.577 3.864.577 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z"/></svg>);
const ThreadsIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 hover:text-yellow-200 transition-colors"><path d="M15.918 10.363a4.706 4.706 0 0 0-4.01-2.316c-3.1 0-5.59 2.533-5.59 6.274 0 3.654 2.457 6.071 5.48 6.071 2.261 0 4.095-.91 5.309-2.715l-2.032-1.364c-.753 1.178-1.895 1.705-3.216 1.705-1.748 0-3.076-1.127-3.136-2.909h8.775c.01-.219.015-.436.015-.658 0-2.527-1.139-4.088-2.668-4.088zm-3.87 2.015c.164-1.272 1.173-1.921 2.302-1.921 1.096 0 2.046.608 2.124 1.921h-4.426zm4.908-4.664a7.067 7.067 0 0 1 1.722 4.717c0 .484-.02.97-.061 1.455h-8.877c.105 2.19 1.777 3.511 3.826 3.511 1.637 0 3.033-.762 3.967-2.186l2.062 1.348c-1.34 1.996-3.528 3.08-5.968 3.08-3.58 0-6.386-2.613-6.386-6.626 0-3.992 2.766-6.634 6.294-6.634 1.733 0 3.33.633 4.5 1.777l-.609-2.697a8.718 8.718 0 0 0-3.89-.884C8.423 4.673 5.46 7.644 5.46 11.834c0 4.167 2.981 7.18 7.098 7.18 3.23 0 5.486-1.733 6.643-4.148l.056-.123 2.123 1.077c-1.369 3.003-4.148 5.178-8.156 5.178-5.267 0-9.256-4.04-9.256-9.155 0-5.132 4.043-9.172 9.324-9.172 1.79 0 3.488.468 4.905 1.317l-.24 1.026z"/></svg>);

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
    window.dispatchEvent(new Event('o2ol:language'));
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
  const [desktopActionOpen, setDesktopActionOpen] = useState(false);
  const [mobileActionOpen, setMobileActionOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const fT = FOOTER_COPY[currentLanguage] || FOOTER_COPY.en;
  const mT = MMIQ_FOOTER_COPY[currentLanguage] || MMIQ_FOOTER_COPY.en;
  const desktopActionRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage);
  useEffect(() => {
    const langFromUrl = new URLSearchParams(location.search).get('lang');
    if (['en','es','fr','it','de'].includes(langFromUrl) && langFromUrl !== currentLanguage) {
      changeLanguage(langFromUrl);
    }
  }, [location.search, currentLanguage, changeLanguage]);

  const shareCurrentPage = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', currentLanguage);
    const shareUrl = url.toString();
    const pageTitle = currentPageName && currentPageName !== 'Home'
      ? `${currentPageName} | One2OneLove`
      : 'One2OneLove';
    const copy = SHARE_COPY[currentLanguage] || SHARE_COPY.en;

    try {
      if (navigator.share) {
        await navigator.share({ title: pageTitle, text: copy.text, url: shareUrl });
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch (_) {
      window.prompt(copy.copied, shareUrl);
    }
  };

  const normalizedShareRoute = String(location.pathname || '/').toLowerCase().replace(/\/$/,'') || '/';
  const showPageShare = !SHARE_EXCLUDED_ROUTES.has(normalizedShareRoute);
  const isMyMatchIQPage = normalizedShareRoute === '/mymatchiq' || normalizedShareRoute.startsWith('/mymatchiq/');
  const mmiqHeaderButton = (gradient) => isMyMatchIQPage
    ? `inline-flex items-center whitespace-nowrap rounded-full border border-white/25 bg-gradient-to-r ${gradient} px-2.5 py-2 text-sm font-black text-white 2xl:px-3.5 shadow-[0_5px_15px_rgba(15,4,42,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white`
    : 'hover:text-yellow-200';



  // Get authentication state
  const { isAuthenticated, logout, user } = useAuth();

  // Fetch conversations to get unread message count
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getMyConversations,
    enabled: !!user && isAuthenticated && !['/subscription','/tokens'].includes(location.pathname.toLowerCase()),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000
  });


  // Calculate total unread messages count
  const totalUnreadCount = conversations.reduce((total, conv) => {
    const count = conv.unreadCount || 0;
    return total + count;
  }, 0);

  const handleSignIn = () => {
    navigate(createPageUrl("SignIn"));
  };

  const handleSignUp = () => {
    navigate("/SignUp");
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
    const closeDesktopAction = (event) => {
      if (desktopActionRef.current?.contains(event.target)) return;
      setDesktopActionOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setDesktopActionOpen(false);
        desktopActionRef.current?.querySelector('[data-desktop-action-trigger]')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeDesktopAction);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeDesktopAction);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const closeOnOutsidePress = (event) => {
      if (mobileMenuRef.current?.contains(event.target)) return;
      if (mobileMenuButtonRef.current?.contains(event.target)) return;
      setMobileMenuOpen(false);
      setMobileActionOpen(false);
    };

    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setMobileMenuOpen(false);
      setMobileActionOpen(false);
      mobileMenuButtonRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileActionOpen(false);
  }, [location.pathname]);

  const closeResponsiveMenuOnHoverAway = () => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setMobileMenuOpen(false);
    setMobileActionOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Kalam:wght@300;400;700&family=Comic+Neue:wght@300;400;700&display=swap');
        
        :root {
          --font-dancing: 'Dancing Script', cursive;
          --font-kalam: 'Kalam', cursive;
          --font-comic: 'Comic Neue', cursive;
        }

        html {
          scrollbar-gutter: stable;
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

        @keyframes o2ol-marquee {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .o2ol-announcement-track {
          display: inline-flex;
          min-width: max-content;
          animation: o2ol-marquee 20s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* Top Announcement Bar */}
      {t.announcement && location.pathname.toLowerCase() !== '/subscription' && (
        <div className="relative w-full max-w-[100vw] overflow-hidden bg-indigo-950 py-2 text-white" style={{ contain: 'layout paint' }}>
          <div className="o2ol-announcement-track whitespace-nowrap text-lg md:text-xl font-medium tracking-wide" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <span className="font-extrabold text-yellow-400 uppercase tracking-widest text-sm mr-3">{t.announcement.label}</span> 
            <span className="text-white/90">{t.announcement.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${isMyMatchIQPage ? 'bg-gradient-to-r from-[#250334] via-[#5d146f] to-[#1b2c72]' : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500'} text-white shadow-md sticky top-0 z-50`}>
        <div className={`${isMyMatchIQPage ? 'mx-auto max-w-[1840px] px-3 sm:px-5' : 'max-w-[1400px] mx-auto px-3 sm:px-5'} h-[96px] flex items-center justify-between gap-2 sm:gap-3 2xl:gap-5`}>
          <Link to={isMyMatchIQPage ? '/MyMatchIQ' : createPageUrl("Home")} className="w-[168px] sm:w-[190px] 2xl:w-[220px] h-[88px] shrink-0 hover:opacity-90 transition-opacity flex items-center">
            <img 
              src={isMyMatchIQPage ? '/assets/mymatchiq-official-logo.webp' : '/assets/o2ol-header-logo.png'}
              alt={isMyMatchIQPage ? 'MyMatchIQ Logo' : 'One2One Love Logo'}
              width="220"
              height="88"
              className={isMyMatchIQPage ? 'h-[72px] w-[168px] sm:w-[190px] 2xl:w-[220px] object-contain object-left' : 'h-[88px] w-[168px] sm:w-[190px] 2xl:w-[220px] object-contain object-left'}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          </Link>
          
          <nav className={`hidden lg:flex items-center ${isMyMatchIQPage ? 'gap-2' : 'gap-3 text-base 2xl:gap-6 2xl:text-lg'} font-bold shrink-0`}>
            {isMyMatchIQPage && (
              <Link to="/Home" aria-label="One to One Love" className="mr-3 2xl:mr-6 inline-flex h-12 w-[86px] items-center justify-center rounded-full border border-white/25 bg-white px-2 shadow-[0_5px_15px_rgba(15,4,42,0.35)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <img src="/assets/o2ol-header-logo.png" alt="One to One Love" className="h-10 w-[76px] scale-[1.2] object-contain" />
              </Link>
            )}
            {!isMyMatchIQPage && (
              <Link to="/MyMatchIQ" aria-label="MyMatchIQ" className="mr-3 2xl:mr-6 inline-flex h-12 w-[86px] items-center justify-center rounded-full border border-white/25 bg-white px-2 shadow-[0_5px_15px_rgba(15,4,42,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <img src="/assets/mymatchiq-official-logo.webp" alt="MyMatchIQ" className="h-10 w-[76px] scale-[1.2] object-contain" />
              </Link>
            )}
            <Link to={isMyMatchIQPage ? '/MyMatchIQ' : createPageUrl("Home")} className={mmiqHeaderButton('from-sky-400 to-blue-600')}>⌂ {t.nav.home}</Link>
            
            <div
              ref={desktopActionRef}
              className="relative"
            >
              <button
                type="button"
                data-desktop-action-trigger
                aria-haspopup="menu"
                aria-controls="desktop-action-menu"
                aria-expanded={desktopActionOpen}
                onClick={() => setDesktopActionOpen((open) => !open)}
                className={`${mmiqHeaderButton('from-violet-500 to-fuchsia-600')} cursor-pointer`}
              >
                ♡ {t.nav.action} ▾
              </button>
              {desktopActionOpen && isMyMatchIQPage && (
                <div id="desktop-action-menu" className="absolute right-0 top-8 w-72 rounded-xl bg-white p-2 text-sm font-normal text-slate-800 shadow-xl z-50">
                  <Link to="/MyMatchIQ/Actions" className="mb-1 flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-950 via-violet-800 to-fuchsia-700 px-3 py-2 font-black text-white shadow-sm hover:from-indigo-900 hover:to-fuchsia-600" onClick={() => setDesktopActionOpen(false)}>✦ MyMatchIQ</Link>
                  <Link to="/MyMatchIQ/Assessment" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🧠 Compatibility Passport</Link>
                  <Link to="/Credit" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>◈ {mT.credits}</Link>
                  <Link to="/MyMatchIQ/Meet" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🤝 Meet Intentional Members</Link>
                  <Link to="/MyMatchIQ/Dashboard" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>✦ MyMatchIQ Dashboard</Link>
                  <Link to="/MyMatchIQ/Invite" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>💌 Invite with intention</Link>
                </div>
              )}
              {desktopActionOpen && !isMyMatchIQPage && (
                <div id="desktop-action-menu" className="absolute right-0 top-8 w-72 bg-white text-slate-800 rounded-xl shadow-xl p-2 z-50 text-sm font-normal">
                  <div className="px-3 pb-1 pt-1 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Free</div>
                  <Link to={createPageUrl("LGBTQSupport")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🌈 {t.actionMenu.lgbtqSupport}<span className="ml-auto rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black text-yellow-950">FREE</span></Link>
                  <Link to={createPageUrl("CoupleSupport")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>👥 {t.actionMenu.coupleSupport}<span className="ml-auto rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black text-yellow-950">FREE</span></Link>
                  <div className="mt-1 px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Free + locked items</div>
                  <Link to={createPageUrl("MyMatchIQ")} className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-950 via-violet-800 to-fuchsia-700 px-3 py-2 font-black text-white shadow-sm hover:from-indigo-900 hover:to-fuchsia-600" onClick={() => setDesktopActionOpen(false)}>✦ MyMatchIQ</Link>
                  <Link to={createPageUrl("LoveNotes")} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>💗 {t.actionMenu.sendLoveNote}</Link>
                  <Link to={createPageUrl("RelationshipQuizzes")} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🧩 {t.actionMenu.relationshipQuizzes}</Link>
                  <Link to={createPageUrl("DateIdeas")} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🗓️ {t.actionMenu.dateIdeas}</Link>
                  <div className="mt-1 px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Credit</div>
                  <Link to={createPageUrl("CooperativeGames")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🎮 {t.actionMenu.games}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                  <Link to={createPageUrl("RelationshipMilestones")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>💗 {t.actionMenu.relationshipMilestones}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                  <Link to={createPageUrl("RelationshipGoals")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>🎯 {t.actionMenu.relationshipGoals}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                  <Link to={createPageUrl("MemoryLane")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100" onClick={() => setDesktopActionOpen(false)}>📷 {t.actionMenu.memoryLane}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                </div>
              )}
            </div>

            <Link
              to="/Credit"
              className={isMyMatchIQPage ? mmiqHeaderButton('from-amber-400 to-orange-500') : 'rounded-full bg-yellow-300 px-3 py-2 text-sm font-black text-blue-900 shadow-sm transition hover:bg-yellow-200'}
            >
              {t.nav.buyTokens || 'BUY CREDIT'}
            </Link>

            {isAuthenticated ? (
              <>
                <Link to={createPageUrl("Chat")} className={`${mmiqHeaderButton('from-cyan-500 to-blue-700')} relative`}>
                  💬 {t.nav.chat}
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </span>
                  )}
                </Link>
                <Link to={createPageUrl("Profile")} className={mmiqHeaderButton('from-indigo-500 to-violet-700')}>👤 {t.nav.profile}</Link>
                <button onClick={handleSignOut} className={mmiqHeaderButton('from-slate-600 to-slate-800')}>{t.nav.signOut}</button>
              </>
            ) : (
              <>
                <Link to={isMyMatchIQPage ? '/MyMatchIQ/Invite' : createPageUrl("Invite")} className={mmiqHeaderButton('from-emerald-400 to-cyan-600')}>{t.nav.invite}</Link>
                <button onClick={handleSignIn} aria-label={`${t.nav.signIn} — navigation`} className={mmiqHeaderButton('from-blue-500 to-indigo-700')}>{t.nav.signIn}</button>
                <button onClick={handleSignUp} className={isMyMatchIQPage ? mmiqHeaderButton('from-rose-500 to-fuchsia-600') : 'text-yellow-300 text-xl hover:text-yellow-100'}>{t.nav.signUp}</button>
              </>
            )}

            <div className="relative">
              <Select value={currentLanguage} onValueChange={changeLanguage}>
                <SelectTrigger className={isMyMatchIQPage ? 'h-auto w-32 rounded-full border border-white/25 bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-sm font-black text-white shadow-[0_5px_15px_rgba(15,4,42,0.35)] 2xl:w-36 2xl:px-3.5' : 'w-32 rounded-xl bg-white/15 border border-white/25 px-3 py-2.5 text-yellow-300 h-auto font-bold text-base 2xl:w-36 2xl:px-4 2xl:py-3 2xl:text-lg'}>
                  <SelectValue placeholder={t.nav.language} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">US English</SelectItem>
                  <SelectItem value="es">{currentLanguage === 'en' ? 'ES Spanish' : 'ES Español'}</SelectItem>
                  <SelectItem value="fr">{currentLanguage === 'en' ? 'FR French' : 'FR Français'}</SelectItem>
                  <SelectItem value="it">{currentLanguage === 'en' ? 'IT Italian' : 'IT Italiano'}</SelectItem>
                  <SelectItem value="de">{currentLanguage === 'en' ? 'DE German' : 'DE Deutsch'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </nav>
          
          {/* Mobile header controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            <Select value={currentLanguage} onValueChange={changeLanguage}>
              <SelectTrigger aria-label={t.nav.language} className="w-[76px] sm:w-[112px] rounded-xl bg-white/15 border border-white/30 px-2.5 sm:px-3 py-2 text-yellow-300 h-auto font-black text-sm sm:text-base">
                <SelectValue placeholder={t.nav.language} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN English</SelectItem>
                <SelectItem value="es">ES Español</SelectItem>
                <SelectItem value="fr">FR Français</SelectItem>
                <SelectItem value="it">IT Italiano</SelectItem>
                <SelectItem value="de">DE Deutsch</SelectItem>
              </SelectContent>
            </Select>
            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="responsive-navigation-menu"
              onClick={() => {
                setMobileMenuOpen((open) => !open);
                if (mobileMenuOpen) setMobileActionOpen(false);
              }}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              id="responsive-navigation-menu"
              ref={mobileMenuRef}
              onMouseLeave={closeResponsiveMenuOnHoverAway}
              className={`lg:hidden absolute right-2 sm:right-4 top-[calc(100%+0.5rem)] z-[70] w-[240px] sm:w-[260px] max-w-[calc(100vw-1rem)] rounded-2xl border border-white/25 ${isMyMatchIQPage ? 'bg-gradient-to-br from-[#250334] via-[#5d146f] to-[#1b2c72]' : 'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600'} px-2.5 py-2.5 shadow-2xl max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain`}
            >
              <nav className="flex flex-col gap-1 text-[15px] leading-5">
                {isMyMatchIQPage && (
                  <Link to="/Home" aria-label="One to One Love" className="flex h-11 w-[84px] items-center justify-center rounded-xl bg-white px-3 shadow-sm" onClick={() => setMobileMenuOpen(false)}>
                    <img src="/assets/o2ol-header-logo.png" alt="One to One Love" className="h-8 w-[72px] scale-[1.05] object-contain" />
                  </Link>
                )}
                <Link
                  to={isMyMatchIQPage ? '/MyMatchIQ' : createPageUrl("Home")}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  {t.nav.home}
                </Link>

                {/* Action Dropdown for Mobile */}
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={mobileActionOpen}
                    onClick={() => setMobileActionOpen(!mobileActionOpen)}
                    className="flex items-center justify-between w-full text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      {t.nav.action}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileActionOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {mobileActionOpen && (
                    <div className="mt-1 overflow-hidden rounded-lg bg-white/10">
                      <div className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-white/60">Free</div>
                      <Link to={createPageUrl("LGBTQSupport")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Rainbow className="h-4 w-4"/>{t.actionMenu.lgbtqSupport}<span className="ml-auto rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black text-yellow-950">FREE</span></Link>
                      <Link to={createPageUrl("CoupleSupport")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Users className="h-4 w-4"/>{t.actionMenu.coupleSupport}<span className="ml-auto rounded-full bg-yellow-300 px-2 py-0.5 text-[10px] font-black text-yellow-950">FREE</span></Link>
                      <div className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-white/60">Free + locked items</div>
                      <Link to={isMyMatchIQPage ? '/MyMatchIQ/Actions' : createPageUrl("MyMatchIQ")} className="flex items-center gap-2 bg-gradient-to-r from-indigo-950/90 via-violet-800/90 to-fuchsia-700/90 px-3 py-2.5 font-black text-white" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Sparkles className="h-4 w-4"/>MyMatchIQ</Link>
                      <Link to={createPageUrl("LoveNotes")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Heart className="h-4 w-4"/>{t.actionMenu.sendLoveNote}</Link>
                      <Link to={createPageUrl("RelationshipQuizzes")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Heart className="h-4 w-4"/>{t.actionMenu.relationshipQuizzes}</Link>
                      <Link to={createPageUrl("DateIdeas")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Heart className="h-4 w-4"/>{t.actionMenu.dateIdeas}</Link>
                      <div className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[.18em] text-white/60">Credit</div>
                      <Link to={createPageUrl("CooperativeGames")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Gamepad2 className="h-4 w-4"/>{t.actionMenu.games}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                      <Link to={createPageUrl("RelationshipMilestones")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Heart className="h-4 w-4"/>{t.actionMenu.relationshipMilestones}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                      <Link to={createPageUrl("RelationshipGoals")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Target className="h-4 w-4"/>{t.actionMenu.relationshipGoals}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                      <Link to={createPageUrl("MemoryLane")} className="flex items-center gap-2 px-3 py-2.5 text-white hover:bg-white/20" onClick={() => {setMobileMenuOpen(false);setMobileActionOpen(false);}}><Heart className="h-4 w-4"/>{t.actionMenu.memoryLane}<span className="ml-auto" aria-label="Locked">🔒</span></Link>
                    </div>
                  )}
                </div>

                <Link
                  to={createPageUrl("Community")}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4" />
                  {t.nav.community}
                </Link>
                <Link
                  to={createPageUrl("LGBTQSupport")}
                  className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Rainbow className="w-4 h-4" />
                  {t.nav.lgbtq}
                </Link>
                {isAuthenticated && (
                  <Link
                    to={createPageUrl("Profile")}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    {t.nav.profile}
                  </Link>
                )}
                <div className="border-t border-white/20 my-1.5"></div>
                

                <Link
                  to="/Credit"
                  className="flex items-center gap-2 rounded-lg bg-yellow-300 px-3 py-2.5 font-black text-blue-900 transition hover:bg-yellow-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Gift className="h-4 w-4" />
                  {t.nav.buyTokens || 'BUY CREDIT'}
                </Link>

                {/* Chat - Only show when authenticated */}
                {isAuthenticated && (
                  <Link
                    to={createPageUrl("Chat")}
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all relative"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-4 h-4" />
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
                    className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.nav.signOut}
                  </button>
                )}
                
                {/* Show Invite, Sign In/Sign Up only when NOT authenticated */}
                {!isAuthenticated && (
                  <>
                    <Link
                      to={isMyMatchIQPage ? '/MyMatchIQ/Invite' : createPageUrl("Invite")}
                      className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserCheck className="w-4 h-4" />
                      {t.nav.invite}
                    </Link>
                    <button
                      onClick={() => {
                        handleSignUp();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 px-3 py-2.5 rounded-lg transition-all font-semibold"
                    >
                      <UserPlus className="w-4 h-4" />
                      {t.nav.signUp}
                    </button>
                    <button
                      aria-label={`${t.nav.signIn} — navigation`}
                      onClick={() => {
                        handleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      {t.nav.signIn}
                    </button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Shareable page promotion */}
      {showPageShare && (
        <div className="pointer-events-none relative z-30 mx-auto h-0 w-full max-w-[1400px] px-4 sm:px-6">
          <div className="pointer-events-auto absolute right-4 top-3 sm:right-6">
            <button
              type="button"
              onClick={shareCurrentPage}
              className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/95 px-3.5 py-2 text-sm font-black text-purple-700 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg"
              aria-label={(SHARE_COPY[currentLanguage] || SHARE_COPY.en).share}
              title={(SHARE_COPY[currentLanguage] || SHARE_COPY.en).share}
            >
              {shareCopied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{shareCopied ? (SHARE_COPY[currentLanguage] || SHARE_COPY.en).copied : (SHARE_COPY[currentLanguage] || SHARE_COPY.en).share}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      {isMyMatchIQPage ? (
        <>
          <section className="border-t border-fuchsia-300/20 bg-[#0d0516] px-5 py-6 text-center text-white">
            <h3 className="text-lg font-black">{mT.tagline}</h3>
            <p className="mx-auto mt-2 max-w-4xl text-white/75">{mT.body}</p>
          </section>
          <footer className="bg-gradient-to-r from-[#240432] via-[#5d146f] to-[#172c70] px-6 py-10 text-white">
            <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
              <div>
                <img src="/assets/mymatchiq-official-logo.webp" alt="MyMatchIQ" className="h-20 w-auto object-contain object-left" />
                <div className="mt-3 text-lg font-semibold">{mT.tagline}</div>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">{mT.body}</p>
              </div>
              <div>
                <h4 className="mb-4 text-xl font-black">{mT.explore}</h4>
                <FooterLink onClick={() => navigate('/MyMatchIQ')}>{mT.home}</FooterLink>
                <FooterLink onClick={() => navigate('/MyMatchIQ/Assessment')}>{mT.passport}</FooterLink>
                <FooterLink onClick={() => navigate('/Credit')}>{mT.credits}</FooterLink>
                <FooterLink onClick={() => navigate('/MyMatchIQ/Actions')}>{mT.insights}</FooterLink>
              </div>
              <div>
                <h4 className="mb-4 text-xl font-black">{mT.support}</h4>
                <FooterLink onClick={() => navigate('/MyMatchIQ/Assessment')}>{mT.gettingStarted}</FooterLink>
                <FooterLink onClick={() => navigate('/MyMatchIQ/Invite')}>{mT.invite}</FooterLink>
                <FooterLink onClick={() => navigate('/MyMatchIQ/Dashboard')}>{mT.workspace}</FooterLink>
                <FooterLink onClick={() => navigate('/SignIn?source=mymatchiq-feature')}>{mT.signIn}</FooterLink>
              </div>
            </div>
            <div className="mx-auto mt-8 max-w-7xl border-t border-white/25 pt-4 text-center text-sm">{mT.copyright}</div>
          </footer>
        </>
      ) : (
        <>
          <section className="bg-white text-center px-5 py-5 border-t">
            <h3 className="font-black text-lg">{fT.loveGrow}</h3>
            <p className="text-slate-600 max-w-5xl mx-auto mt-1">{fT.footerBody}</p>
          </section>
          <footer className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-10">
            <div className="max-w-7xl mx-auto grid md:grid-cols-[1.3fr_1fr_1fr] gap-12">
              <div>
                <img src="/assets/o2ol-approved-logo.png" alt="One2OneLove" className="h-28 w-auto" />
                <div className="text-lg mt-2">{fT.loveGrow}</div>
                <div className="flex gap-4 mt-5 text-2xl">
                  <a href="https://www.tiktok.com/@one2onelove" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><TiktokIcon /></a>
                  <a href="https://www.facebook.com/one2onelove" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookIcon /></a>
                  <a href="https://www.instagram.com/one2oneloves" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>
                  <a href="https://x.com/one2oneloves" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"><XIcon /></a>
                  <a href="https://www.threads.net/@one2oneloves" target="_blank" rel="noopener noreferrer" aria-label="Threads"><ThreadsIcon /></a>
                  <a href="https://www.pinterest.com/One2onelovers" target="_blank" rel="noopener noreferrer" aria-label="Pinterest"><PinterestIcon /></a>
                </div>
              </div>
              <div><h4 className="text-xl font-black mb-4">{fT.supportCol}</h4><FooterLink onClick={() => navigate(createPageUrl("HelpCenter"))}>{fT.help}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("ContactUs"))}>{fT.contact}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("PrivacyPolicy"))}>{fT.privacy}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("TermsOfService"))}>{fT.terms}</FooterLink><FooterLink onClick={() => navigate("/FeaturePricing")}>Feature Price List</FooterLink></div>
              <div><h4 className="text-xl font-black mb-4">{fT.company}</h4><FooterLink onClick={() => navigate(createPageUrl("AboutUs"))}>{fT.about}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("Reviews"))}>{fT.reviews}</FooterLink><FooterLink onClick={() => navigate(createPageUrl("Suggestions"))}>{fT.suggestions}</FooterLink><FooterLink onClick={() => navigate('/Suggestions?mode=problem')}>{fT.reportProblem}</FooterLink></div>
            </div>
            <div className="max-w-7xl mx-auto border-t border-white/25 mt-8 pt-4 text-center text-sm">{fT.copyright}</div>
          </footer>
        </>
      )}
        <button type="button" onClick={() => navigate('/Suggestions?mode=problem')} aria-label={fT.reportProblem}
          className="fixed bottom-0 right-4 z-50 rounded-t-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700">
          {fT.reportProblem}</button>
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
