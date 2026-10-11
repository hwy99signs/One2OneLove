
import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Home, ChevronDown, User, LogIn, LogOut, Users, UserPlus, Menu, X, Sparkles, Target, Code, Rainbow, UserCheck, Gift, MessageCircle, Bell, Gamepad2, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getMyConversations } from "@/lib/chatService";
import ClickToVoteCard from "@/components/voting/ClickToVoteCard";
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

// Footer social icons (owner, 2026-10-10): the platforms' real full-color
// brand glyphs (official Simple Icons shapes) on clean white discs, so every
// brand color reads clearly on the blue footer. Links/order/labels unchanged.
const SocialDisc = ({ children }) => (
  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 hover:scale-110">{children}</span>
);
const FacebookIcon = () => (<SocialDisc><svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></SocialDisc>);
const InstagramIcon = () => (<SocialDisc><svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><defs><radialGradient id="o2ol-ig-gradient" cx="30%" cy="107%" r="125%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs><path fill="url(#o2ol-ig-gradient)" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></SocialDisc>);
const XIcon = () => (<SocialDisc><svg viewBox="0 0 24 24" className="h-4 w-4" fill="#000000" aria-hidden="true"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg></SocialDisc>);
const TiktokIcon = () => (<SocialDisc><svg viewBox="0 0 24 24" className="h-4 w-4" fill="#000000" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></SocialDisc>);
const PinterestIcon = () => (<SocialDisc><svg viewBox="0 0 24 24" className="h-4 w-4" fill="#E60023" aria-hidden="true"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg></SocialDisc>);
const ThreadsIcon = () => (<SocialDisc><svg viewBox="0 0 24 24" className="h-4 w-4" fill="#000000" aria-hidden="true"><path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/></svg></SocialDisc>);

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
  // Homepage only ('/' and its '/Home' alias): the header widens to carry
  // the Click-to-Vote row under the locked header row (owner, 2026-10-10).
  const isHomeRoute = normalizedShareRoute === '/' || normalizedShareRoute === '/home';
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

        {/* Click-to-Vote row (owner directive, 2026-10-10): on the
            homepage the header widens — the header row above stays
            locked exactly as-is, and the voting renders as its own
            outlined band directly beneath it, inside the header block. */}
        {isHomeRoute && (
          <ClickToVoteCard language={currentLanguage} />
        )}
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
