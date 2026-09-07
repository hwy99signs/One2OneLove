import React, { useState } from "react";
import {
  Heart,
  Users,
  MessageCircle,
  Mic,
  FileText,
  Sparkles,
  Target,
  Brain,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    coupleSupport: {
      title: "Relationship Support",
      subtitle: "Practical tools and resources to help you understand, communicate, reconnect, and grow together",
      searchPlaceholder: "Search resources...",
      filterAll: "All Resources",
      filterActive: "Interactive Tools",
      filterContent: "Learning & Media",
      aiGuide: "AI Relationship Guide",
      aiGuideDesc: "A future educational guide for relationship reflection, communication, and everyday relationship questions",
      goals: "Relationship Goals",
      goalsDesc: "Set meaningful goals together and track your journey toward a stronger relationship",
      quizzes: "Relationship Quizzes",
      quizzesDesc: "Use self-reflection quizzes to learn more about communication, conflict, connection, and relationship patterns",
      communicationPractice: "Communication Practice",
      communicationPracticeDesc: "Practice difficult conversations in realistic relationship scenarios and receive immediate educational feedback",
      podcast: "Featured Podcasters",
      podcastDesc: "Discover approved relationship-focused podcasters and selected episodes as they are added to One2OneLove",
      articles: "Relationship Library",
      articlesDesc: "A growing library for relationship articles, guides, and educational resources",
      talkShow: "O2OL + Amora",
      talkShowDesc: "The One2OneLove Talk Show — conversations about love, dating, marriage, communication, and relationships",
      counseling: "Counseling Directory",
      counselingDesc: "A future directory for verified licensed relationship and couples professionals",
      relationshipRoom: "Relationship Room",
      relationshipRoomDesc: "A public topic-based community room for live relationship discussions, questions, and shared conversation — not private messaging",
      explore: "Explore",
      ctaTitle: "Ready to Strengthen Your Relationship?",
      ctaSubtitle: "Use the tools that are available now and watch for new relationship resources as they are approved and added",
      browseResources: "Browse Active Resources",
      viewPodcasts: "View Podcasters",
      comingSoon: "Coming Soon",
      noResults: "No resources found",
      noResultsDesc: "Try adjusting your search or filters"
    }
  },
  es: {
    coupleSupport: {
      title: "Apoyo para Relaciones",
      subtitle: "Herramientas y recursos prácticos para comprenderse, comunicarse, reconectarse y crecer juntos",
      searchPlaceholder: "Buscar recursos...",
      filterAll: "Todos los Recursos",
      filterActive: "Herramientas Interactivas",
      filterContent: "Aprendizaje y Medios",
      aiGuide: "Guía de Relaciones con IA",
      aiGuideDesc: "Una futura guía educativa para la reflexión, la comunicación y las preguntas cotidianas sobre las relaciones",
      goals: "Metas de Relación",
      goalsDesc: "Establezcan metas significativas juntos y sigan su camino hacia una relación más fuerte",
      quizzes: "Cuestionarios de Relaciones",
      quizzesDesc: "Usa cuestionarios de autorreflexión para aprender sobre comunicación, conflicto, conexión y patrones de relación",
      communicationPractice: "Práctica de Comunicación",
      communicationPracticeDesc: "Practica conversaciones difíciles en escenarios realistas y recibe retroalimentación educativa inmediata",
      podcast: "Podcasters Destacados",
      podcastDesc: "Descubre podcasters aprobados enfocados en relaciones y episodios seleccionados a medida que se agregan",
      articles: "Biblioteca de Relaciones",
      articlesDesc: "Una biblioteca en crecimiento de artículos, guías y recursos educativos sobre relaciones",
      talkShow: "O2OL + Amora",
      talkShowDesc: "El programa de One2OneLove: conversaciones sobre amor, citas, matrimonio, comunicación y relaciones",
      counseling: "Directorio de Consejería",
      counselingDesc: "Un futuro directorio de profesionales licenciados y verificados en relaciones y parejas",
      relationshipRoom: "Sala de Relaciones",
      relationshipRoomDesc: "Una sala comunitaria pública por temas para conversaciones, preguntas y debates en vivo — no mensajería privada",
      explore: "Explorar",
      ctaTitle: "¿Listo para Fortalecer tu Relación?",
      ctaSubtitle: "Usa las herramientas disponibles ahora y descubre nuevos recursos a medida que sean aprobados y agregados",
      browseResources: "Ver Recursos Activos",
      viewPodcasts: "Ver Podcasters",
      comingSoon: "Próximamente",
      noResults: "No se encontraron recursos",
      noResultsDesc: "Intenta ajustar tu búsqueda o filtros"
    }
  },
  fr: {
    coupleSupport: {
      title: "Soutien aux Relations",
      subtitle: "Des outils et ressources pratiques pour mieux se comprendre, communiquer, se reconnecter et grandir ensemble",
      searchPlaceholder: "Rechercher des ressources...",
      filterAll: "Toutes les Ressources",
      filterActive: "Outils Interactifs",
      filterContent: "Apprentissage et Médias",
      aiGuide: "Guide Relationnel IA",
      aiGuideDesc: "Un futur guide éducatif pour la réflexion, la communication et les questions relationnelles du quotidien",
      goals: "Objectifs de Relation",
      goalsDesc: "Fixez ensemble des objectifs significatifs et suivez votre progression vers une relation plus forte",
      quizzes: "Quiz sur les Relations",
      quizzesDesc: "Utilisez des quiz d'autoréflexion sur la communication, les conflits, la connexion et les schémas relationnels",
      communicationPractice: "Pratique de Communication",
      communicationPracticeDesc: "Entraînez-vous aux conversations difficiles dans des scénarios réalistes avec un retour éducatif immédiat",
      podcast: "Podcasteurs en Vedette",
      podcastDesc: "Découvrez des podcasteurs relationnels approuvés et des épisodes sélectionnés au fur et à mesure de leur ajout",
      articles: "Bibliothèque Relationnelle",
      articlesDesc: "Une bibliothèque grandissante d'articles, de guides et de ressources éducatives sur les relations",
      talkShow: "O2OL + Amora",
      talkShowDesc: "L'émission One2OneLove — conversations sur l'amour, les rencontres, le mariage, la communication et les relations",
      counseling: "Annuaire de Conseillers",
      counselingDesc: "Un futur annuaire de professionnels agréés et vérifiés pour les relations et les couples",
      relationshipRoom: "Salon des Relations",
      relationshipRoomDesc: "Un espace communautaire public par thèmes pour des discussions et questions en direct — sans messagerie privée",
      explore: "Explorer",
      ctaTitle: "Prêt à Renforcer Votre Relation ?",
      ctaSubtitle: "Utilisez les outils disponibles maintenant et découvrez les nouvelles ressources au fur et à mesure de leur approbation",
      browseResources: "Voir les Ressources Actives",
      viewPodcasts: "Voir les Podcasteurs",
      comingSoon: "Bientôt Disponible",
      noResults: "Aucune ressource trouvée",
      noResultsDesc: "Essayez d'ajuster votre recherche ou vos filtres"
    }
  },
  it: {
    coupleSupport: {
      title: "Supporto per le Relazioni",
      subtitle: "Strumenti e risorse pratiche per capirsi, comunicare, riconnettersi e crescere insieme",
      searchPlaceholder: "Cerca risorse...",
      filterAll: "Tutte le Risorse",
      filterActive: "Strumenti Interattivi",
      filterContent: "Apprendimento e Media",
      aiGuide: "Guida Relazionale IA",
      aiGuideDesc: "Una futura guida educativa per riflessione, comunicazione e domande quotidiane sulle relazioni",
      goals: "Obiettivi di Relazione",
      goalsDesc: "Stabilite insieme obiettivi significativi e seguite il vostro percorso verso una relazione più forte",
      quizzes: "Quiz sulle Relazioni",
      quizzesDesc: "Usa quiz di autoriflessione per conoscere meglio comunicazione, conflitto, connessione e schemi relazionali",
      communicationPractice: "Pratica di Comunicazione",
      communicationPracticeDesc: "Esercitati nelle conversazioni difficili con scenari realistici e feedback educativo immediato",
      podcast: "Podcaster in Evidenza",
      podcastDesc: "Scopri podcaster approvati dedicati alle relazioni e episodi selezionati man mano che vengono aggiunti",
      articles: "Biblioteca delle Relazioni",
      articlesDesc: "Una biblioteca in crescita di articoli, guide e risorse educative sulle relazioni",
      talkShow: "O2OL + Amora",
      talkShowDesc: "Il talk show di One2OneLove — conversazioni su amore, appuntamenti, matrimonio, comunicazione e relazioni",
      counseling: "Elenco di Consulenza",
      counselingDesc: "Un futuro elenco di professionisti autorizzati e verificati per relazioni e coppie",
      relationshipRoom: "Sala delle Relazioni",
      relationshipRoomDesc: "Uno spazio comunitario pubblico per temi, discussioni e domande dal vivo — senza messaggistica privata",
      explore: "Esplora",
      ctaTitle: "Pronto a Rafforzare la Tua Relazione?",
      ctaSubtitle: "Usa gli strumenti disponibili ora e scopri nuove risorse man mano che vengono approvate e aggiunte",
      browseResources: "Vedi Risorse Attive",
      viewPodcasts: "Vedi Podcaster",
      comingSoon: "Prossimamente",
      noResults: "Nessuna risorsa trovata",
      noResultsDesc: "Prova a regolare la ricerca o i filtri"
    }
  },
  de: {
    coupleSupport: {
      title: "Beziehungsunterstützung",
      subtitle: "Praktische Werkzeuge und Ressourcen zum Verstehen, Kommunizieren, Wiederverbinden und gemeinsamen Wachsen",
      searchPlaceholder: "Ressourcen durchsuchen...",
      filterAll: "Alle Ressourcen",
      filterActive: "Interaktive Werkzeuge",
      filterContent: "Lernen und Medien",
      aiGuide: "KI-Beziehungsleitfaden",
      aiGuideDesc: "Ein zukünftiger Bildungsleitfaden für Reflexion, Kommunikation und alltägliche Beziehungsfragen",
      goals: "Beziehungsziele",
      goalsDesc: "Setzen Sie gemeinsam bedeutungsvolle Ziele und verfolgen Sie Ihren Weg zu einer stärkeren Beziehung",
      quizzes: "Beziehungsquiz",
      quizzesDesc: "Nutzen Sie Selbstreflexions-Quiz zu Kommunikation, Konflikten, Verbindung und Beziehungsmustern",
      communicationPractice: "Kommunikationspraxis",
      communicationPracticeDesc: "Üben Sie schwierige Gespräche in realistischen Szenarien mit unmittelbarem pädagogischem Feedback",
      podcast: "Ausgewählte Podcaster",
      podcastDesc: "Entdecken Sie geprüfte beziehungsorientierte Podcaster und ausgewählte Episoden, sobald sie hinzugefügt werden",
      articles: "Beziehungsbibliothek",
      articlesDesc: "Eine wachsende Bibliothek mit Artikeln, Leitfäden und Bildungsressourcen zu Beziehungen",
      talkShow: "O2OL + Amora",
      talkShowDesc: "Die One2OneLove Talk Show — Gespräche über Liebe, Dating, Ehe, Kommunikation und Beziehungen",
      counseling: "Beratungsverzeichnis",
      counselingDesc: "Ein zukünftiges Verzeichnis verifizierter lizenzierter Fachleute für Beziehungen und Paare",
      relationshipRoom: "Beziehungsraum",
      relationshipRoomDesc: "Ein öffentlicher themenbasierter Community-Raum für Live-Diskussionen und Fragen — ohne private Nachrichten",
      explore: "Erkunden",
      ctaTitle: "Bereit, Ihre Beziehung zu Stärken?",
      ctaSubtitle: "Nutzen Sie die verfügbaren Werkzeuge und entdecken Sie neue Ressourcen, sobald sie geprüft und hinzugefügt werden",
      browseResources: "Aktive Ressourcen Ansehen",
      viewPodcasts: "Podcaster Ansehen",
      comingSoon: "Demnächst",
      noResults: "Keine Ressourcen gefunden",
      noResultsDesc: "Versuchen Sie, Ihre Suche oder Filter anzupassen"
    }
  }
};

export default function CoupleSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const categories = [
    {
      id: "communicationPractice",
      title: t.coupleSupport.communicationPractice,
      icon: MessageCircle,
      description: t.coupleSupport.communicationPracticeDesc,
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-gradient-to-r from-cyan-600 to-blue-600",
      link: "CommunicationPractice",
      active: true,
      type: "interactive"
    },
    {
      id: "goals",
      title: t.coupleSupport.goals,
      icon: Target,
      description: t.coupleSupport.goalsDesc,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-gradient-to-r from-pink-600 to-rose-600",
      link: "RelationshipGoals",
      active: true,
      type: "interactive"
    },
    {
      id: "quizzes",
      title: t.coupleSupport.quizzes,
      icon: Brain,
      description: t.coupleSupport.quizzesDesc,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-gradient-to-r from-violet-600 to-purple-600",
      link: "RelationshipQuizzes",
      active: true,
      type: "interactive"
    },
    {
      id: "podcast",
      title: t.coupleSupport.podcast,
      icon: Mic,
      description: t.coupleSupport.podcastDesc,
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-gradient-to-r from-orange-600 to-amber-600",
      link: "PodcastsSupport",
      active: true,
      type: "content"
    },
    {
      id: "aiGuide",
      title: t.coupleSupport.aiGuide,
      icon: Sparkles,
      description: t.coupleSupport.aiGuideDesc,
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-gradient-to-r from-purple-600 to-indigo-600",
      active: false,
      type: "interactive"
    },
    {
      id: "articles",
      title: t.coupleSupport.articles,
      icon: FileText,
      description: t.coupleSupport.articlesDesc,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-gradient-to-r from-blue-600 to-cyan-600",
      active: false,
      type: "content"
    },
    {
      id: "talkShow",
      title: t.coupleSupport.talkShow,
      icon: Heart,
      description: t.coupleSupport.talkShowDesc,
      color: "from-pink-500 to-purple-500",
      bgColor: "bg-gradient-to-r from-pink-600 to-purple-600",
      active: false,
      type: "content"
    },
    {
      id: "counseling",
      title: t.coupleSupport.counseling,
      icon: MessageCircle,
      description: t.coupleSupport.counselingDesc,
      color: "from-teal-500 to-green-500",
      bgColor: "bg-gradient-to-r from-teal-600 to-green-600",
      active: false,
      type: "content"
    },
    {
      id: "relationshipRoom",
      title: t.coupleSupport.relationshipRoom,
      icon: Users,
      description: t.coupleSupport.relationshipRoomDesc,
      color: "from-fuchsia-500 to-pink-500",
      bgColor: "bg-gradient-to-r from-fuchsia-600 to-pink-600",
      active: false,
      type: "interactive"
    }
  ];

  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      !searchQuery ||
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "interactive" && category.type === "interactive") ||
      (filter === "content" && category.type === "content");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.coupleSupport.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.coupleSupport.subtitle}</p>
        </motion.div>

        <div className="mb-8 space-y-4" id="support-resources">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={t.coupleSupport.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg rounded-full shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-gradient-to-r from-purple-500 to-pink-600" : ""}
            >
              {t.coupleSupport.filterAll}
            </Button>
            <Button
              variant={filter === "interactive" ? "default" : "outline"}
              onClick={() => setFilter("interactive")}
              className={filter === "interactive" ? "bg-gradient-to-r from-purple-500 to-pink-600" : ""}
            >
              {t.coupleSupport.filterActive}
            </Button>
            <Button
              variant={filter === "content" ? "default" : "outline"}
              onClick={() => setFilter("content")}
              className={filter === "content" ? "bg-gradient-to-r from-purple-500 to-pink-600" : ""}
            >
              {t.coupleSupport.filterContent}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredCategories.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            >
              {filteredCategories.map((category, index) => {
                const Icon = category.icon;
                const CardWrapper = category.active ? Link : "div";
                const cardProps = category.active ? { to: createPageUrl(category.link) } : {};

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative"
                  >
                    <CardWrapper {...cardProps}>
                      <Card
                        className={`h-full transition-all duration-300 border-2 ${
                          category.active
                            ? "hover:shadow-2xl cursor-pointer border-transparent hover:border-pink-200 group"
                            : "cursor-default border-gray-200"
                        }`}
                      >
                        {!category.active && (
                          <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-lg">
                            {t.coupleSupport.comingSoon}
                          </div>
                        )}
                        <CardHeader>
                          <div
                            className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                              category.active ? "group-hover:scale-110 transition-transform" : ""
                            }`}
                          >
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-2xl font-bold text-gray-900 pr-20">
                            {category.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 leading-relaxed mb-4">{category.description}</p>
                          {category.active && (
                            <Button className={`w-full ${category.bgColor} hover:opacity-90 text-white`}>
                              {t.coupleSupport.explore} {category.title}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </CardWrapper>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">{t.coupleSupport.noResults}</h3>
              <p className="text-gray-500">{t.coupleSupport.noResultsDesc}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl px-8 py-8 text-center text-white shadow-2xl"
        >
          <Heart className="w-10 h-10 mx-auto mb-3 fill-current" />
          <h2 className="text-3xl font-bold mb-3">{t.coupleSupport.ctaTitle}</h2>
          <p className="text-lg mb-5 opacity-90 max-w-2xl mx-auto">{t.coupleSupport.ctaSubtitle}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#support-resources">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 hover:text-purple-800 font-semibold px-7 py-5 shadow-xl">
                {t.coupleSupport.browseResources}
              </Button>
            </a>
            <Link to={createPageUrl("PodcastsSupport")}>
              <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 hover:text-purple-800 font-semibold px-7 py-5 shadow-xl">
                {t.coupleSupport.viewPodcasts}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
