import React, { useState } from "react";
import { Heart, Users, MessageCircle, Mic, FileText, Megaphone, Sparkles, Target, Brain, Flame, UsersRound, Search, X } from "lucide-react";
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
      subtitle: "Expert resources to strengthen your relationship", 
      searchPlaceholder: "Search resources...",
      filterAll: "All Resources",
      filterActive: "Interactive Tools",
      filterContent: "Learning Content",
      aiCoach: "AI Relationship Coach",
      aiCoachDesc: "Get personalized advice, daily tips, and communication guidance powered by AI",
      goals: "Relationship Goals",
      goalsDesc: "Set meaningful goals together and track your journey to a stronger relationship",
      quizzes: "Relationship Quizzes",
      quizzesDesc: "Take fun and insightful quizzes to understand yourself and your relationship better",
      meditation: "Guided Meditation",
      meditationDesc: "Reduce stress and strengthen your bond through guided meditation exercises for couples",
      groupActivities: "Group Activities",
      groupActivitiesDesc: "Connect with other couples through fun group activities and build lasting friendships",
      counseling: "Counseling", 
      counselingDesc: "Connect with licensed professionals in couples therapy and relationship counseling", 
      podcast: "Podcast", 
      podcastDesc: "Listen to relationship podcasts and expert advice for couples", 
      articles: "Articles", 
      articlesDesc: "Read insightful articles and guides for relationship growth", 
      influencers: "Influencers", 
      influencersDesc: "Follow expert content creators for daily relationship inspiration and advice",
      communicationPractice: "Communication Practice",
      communicationPracticeDesc: "Interactive simulator to practice healthy communication in realistic scenarios",
      explore: "Explore", 
      ctaTitle: "Ready to Strengthen Your Relationship?", 
      ctaSubtitle: "Get the support, resources, and guidance you need for a stronger, more connected relationship", 
      findCounselor: "Find a Counselor", 
      browseResources: "Browse Resources",
      comingSoon: "Coming Soon",
      noResults: "No resources found",
      noResultsDesc: "Try adjusting your search or filters"
    }
  },
  es: {
    coupleSupport: { 
      title: "Apoyo para Relaciones", 
      subtitle: "Recursos expertos para fortalecer tu relación",
      searchPlaceholder: "Buscar recursos...",
      filterAll: "Todos los Recursos",
      filterActive: "Herramientas Interactivas",
      filterContent: "Contenido de Aprendizaje",
      aiCoach: "Coach de Relaciones IA",
      aiCoachDesc: "Obtén consejos personalizados, tips diarios y orientación de comunicación impulsada por IA",
      goals: "Metas de Relación",
      goalsDesc: "Establezcan metas significativas juntos y sigan su viaje hacia una relación más fuerte",
      quizzes: "Cuestionarios de Relaciones",
      quizzesDesc: "Realiza cuestionarios divertidos e informativos para entenderte mejor a ti y a tu relación",
      meditation: "Meditación Guiada",
      meditationDesc: "Reduce el estrés y fortalece tu vínculo con ejercicios de meditación guiada para parejas",
      groupActivities: "Actividades Grupales",
      groupActivitiesDesc: "Conéctate con otras parejas a través de actividades grupales divertidas y construye amistades duraderas",
      counseling: "Asesoramiento", 
      counselingDesc: "Conéctate con profesionales licenciados en terapia de pareja y asesoramiento de relaciones", 
      podcast: "Podcast", 
      podcastDesc: "Escucha podcasts de relaciones y consejos de expertos para parejas", 
      articles: "Artículos", 
      articlesDesc: "Lee artículos perspicaces y guías para el crecimiento de la relación", 
      influencers: "Influencers", 
      influencersDesc: "Sigue a creadores de contenido expertos para inspiración diaria y consejos de relaciones",
      communicationPractice: "Práctica de Comunicación",
      communicationPracticeDesc: "Simulador interactivo para practicar comunicación saludable en escenarios realistas",
      explore: "Explorar", 
      ctaTitle: "¿Listo para Fortalecer tu Relación?", 
      ctaSubtitle: "Obtén el apoyo, recursos y orientación que necesitas para una relación más fuerte y conectada", 
      findCounselor: "Encontrar un Consejero", 
      browseResources: "Explorar Recursos",
      comingSoon: "Próximamente",
      noResults: "No se encontraron recursos",
      noResultsDesc: "Intenta ajustar tu búsqueda o filtros"
    }
  },
  fr: {
    coupleSupport: { 
      title: "Soutien aux Relations", 
      subtitle: "Ressources d'experts pour renforcer votre relation",
      searchPlaceholder: "Rechercher des ressources...",
      filterAll: "Toutes les Ressources",
      filterActive: "Outils Interactifs",
      filterContent: "Contenu d'Apprentissage",
      aiCoach: "Coach de Relations IA",
      aiCoachDesc: "Obtenez des conseils personnalisés, des astuces quotidiennes et des conseils de communication alimentés par l'IA",
      goals: "Objectifs de Relation",
      goalsDesc: "Fixez des objectifs significatifs ensemble et suivez votre parcours vers une relation plus forte",
      quizzes: "Quiz sur les Relations",
      quizzesDesc: "Répondez à des quiz amusants et instructifs pour mieux vous comprendre et comprendre votre relation",
      meditation: "Méditation Guidée",
      meditationDesc: "Réduisez le stress et renforcez votre lien grâce à des exercices de méditation guidée pour couples",
      groupActivities: "Activités de Groupe",
      groupActivitiesDesc: "Connectez-vous avec d'autres couples à travers des activités de groupe amusantes et créez des amitiés durables",
      counseling: "Conseil", 
      counselingDesc: "Connectez-vous avec des professionnels agréés en thérapie de couple et conseil relationnel", 
      podcast: "Podcast", 
      podcastDesc: "Écoutez des podcasts sur les relations et des conseils d'experts pour les couples", 
      articles: "Articles", 
      articlesDesc: "Lisez des articles perspicaces et des guides pour la croissance relationnelle", 
      influencers: "Influenceurs", 
      influencersDesc: "Suivez des créateurs de contenu experts pour l'inspiration quotidienne et des conseils relationnels",
      communicationPractice: "Pratique de Communication",
      communicationPracticeDesc: "Simulateur interactif pour pratiquer une communication saine dans des scénarios réalistes",
      explore: "Explorer", 
      ctaTitle: "Prêt à Renforcer Votre Relation?", 
      ctaSubtitle: "Obtenez le soutien, les ressources et les conseils dont vous avez besoin pour une relation plus forte et connectée", 
      findCounselor: "Trouver un Conseiller", 
      browseResources: "Parcourir les Ressources",
      comingSoon: "Bientôt Disponible",
      noResults: "Aucune ressource trouvée",
      noResultsDesc: "Essayez d'ajuster votre recherche ou vos filtres"
    }
  },
  it: {
    coupleSupport: { 
      title: "Supporto per le Relazioni", 
      subtitle: "Risorse esperte per rafforzare la tua relazione",
      searchPlaceholder: "Cerca risorse...",
      filterAll: "Tutte le Risorse",
      filterActive: "Strumenti Interattivi",
      filterContent: "Contenuto di Apprendimento",
      aiCoach: "Coach di Relazioni IA",
      aiCoachDesc: "Ottieni consigli personalizzati, suggerimenti quotidiani e orientamento alla comunicazione alimentati dall'IA",
      goals: "Obiettivi di Relazione",
      goalsDesc: "Stabilite obiettivi significativi insieme e seguite il vostro percorso verso una relazione più forte",
      quizzes: "Quiz sulle Relazioni",
      quizzesDesc: "Fai quiz divertenti e perspicaci per capire meglio te stesso e la tua relazione",
      meditation: "Meditazione Guidata",
      meditationDesc: "Riduci lo stress e rafforza il tuo legame con esercizi di meditazione guidata per coppie",
      groupActivities: "Attività di Gruppo",
      groupActivitiesDesc: "Connettiti con altre coppie attraverso divertenti attività di gruppo e costruisci amicizie durature",
      counseling: "Consulenza", 
      counselingDesc: "Connettiti con professionisti autorizzati in terapia di coppia e consulenza relazionale", 
      podcast: "Podcast", 
      podcastDesc: "Ascolta podcast sulle relazioni e consigli di esperti per le coppie", 
      articles: "Articoli", 
      articlesDesc: "Leggi articoli perspicaci e guide per la crescita relazionale", 
      influencers: "Influencer", 
      influencersDesc: "Segui creatori di contenuti esperti per ispirazione quotidiana e consigli relazionali",
      communicationPractice: "Pratica di Comunicazione",
      communicationPracticeDesc: "Simulatore interattivo per praticare una comunicazione sana in scenari realistici",
      explore: "Esplora", 
      ctaTitle: "Pronto a Rafforzare la Tua Relazione?", 
      ctaSubtitle: "Ottieni il supporto, le risorse e la guida di cui hai bisogno per una relazione più forte e connessa", 
      findCounselor: "Trova un Consulente", 
      browseResources: "Sfoglia le Risorse",
      comingSoon: "Prossimamente",
      noResults: "Nessuna risorsa trovata",
      noResultsDesc: "Prova a regolare la tua ricerca o i filtri"
    }
  },
  de: {
    coupleSupport: { 
      title: "Beziehungsunterstützung", 
      subtitle: "Expertenressourcen zur Stärkung Ihrer Beziehung",
      searchPlaceholder: "Ressourcen durchsuchen...",
      filterAll: "Alle Ressourcen",
      filterActive: "Interaktive Werkzeuge",
      filterContent: "Lerninhalte",
      aiCoach: "KI-Beziehungscoach",
      aiCoachDesc: "Erhalten Sie personalisierte Ratschläge, tägliche Tipps und Kommunikationsberatung durch KI",
      goals: "Beziehungsziele",
      goalsDesc: "Setzen Sie gemeinsam bedeutungsvolle Ziele und verfolgen Sie Ihre Reise zu einer stärkeren Beziehung",
      quizzes: "Beziehungsquiz",
      quizzesDesc: "Nehmen Sie an unterhaltsamen und aufschlussreichen Quiz teil, um sich und Ihre Beziehung besser zu verstehen",
      meditation: "Geführte Meditation",
      meditationDesc: "Reduzieren Sie Stress und stärken Sie Ihre Bindung durch geführte Meditationsübungen für Paare",
      groupActivities: "Gruppenaktivitäten",
      groupActivitiesDesc: "Vernetzen Sie sich mit anderen Paaren durch unterhaltsame Gruppenaktivitäten und bauen Sie dauerhafte Freundschaften auf",
      counseling: "Beratung", 
      counselingDesc: "Verbinden Sie sich mit lizenzierten Fachleuten für Paartherapie und Beziehungsberatung", 
      podcast: "Podcast", 
      podcastDesc: "Hören Sie Beziehungspodcasts und Expertenrat für Paare", 
      articles: "Artikel", 
      articlesDesc: "Lesen Sie aufschlussreiche Artikel und Leitfäden für Beziehungswachstum", 
      influencers: "Influencer", 
      influencersDesc: "Folgen Sie Experten-Content-Erstellern für tägliche Beziehungsinspiration und -ratschläge",
      communicationPractice: "Kommunikationspraxis",
      communicationPracticeDesc: "Interaktiver Simulator zum Üben gesunder Kommunikation in realistischen Szenarien",
      explore: "Erkunden", 
      ctaTitle: "Bereit, Ihre Beziehung zu Stärken?", 
      ctaSubtitle: "Erhalten Sie die Unterstützung, Ressourcen und Anleitung, die Sie für eine stärkere, verbundenere Beziehung benötigen", 
      findCounselor: "Einen Berater Finden", 
      browseResources: "Ressourcen Durchsuchen",
      comingSoon: "Demnächst",
      noResults: "Keine Ressourcen gefunden",
      noResultsDesc: "Versuchen Sie, Ihre Suche oder Filter anzupassen"
    }
  }
};

export default function CoupleSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  
  const categories = [
    {
      id: 'aiCoach',
      title: t.coupleSupport.aiCoach,
      icon: Sparkles,
      description: t.coupleSupport.aiCoachDesc,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      link: 'RelationshipCoach',
      active: true,
      type: 'interactive'
    },
    {
      id: 'goals',
      title: t.coupleSupport.goals,
      icon: Target,
      description: t.coupleSupport.goalsDesc,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-gradient-to-r from-pink-600 to-rose-600',
      link: 'RelationshipGoals',
      active: true,
      type: 'interactive'
    },
    {
      id: 'quizzes',
      title: t.coupleSupport.quizzes,
      icon: Brain,
      description: t.coupleSupport.quizzesDesc,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-gradient-to-r from-violet-600 to-purple-600',
      link: 'RelationshipQuizzes',
      active: true,
      type: 'interactive'
    },
    {
      id: 'communicationPractice',
      title: t.coupleSupport.communicationPractice,
      icon: MessageCircle,
      description: t.coupleSupport.communicationPracticeDesc,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-gradient-to-r from-cyan-600 to-blue-600',
      link: 'CommunicationPractice',
      active: true,
      type: 'interactive'
    },
    {
      id: 'meditation',
      title: t.coupleSupport.meditation,
      icon: Flame,
      description: t.coupleSupport.meditationDesc,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-gradient-to-r from-emerald-600 to-teal-600',
      link: 'Meditation',
      active: true,
      type: 'content'
    },
    {
      id: 'articles',
      title: t.coupleSupport.articles,
      icon: FileText,
      description: t.coupleSupport.articlesDesc,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      link: 'ArticlesSupport',
      active: true,
      type: 'content'
    },
    {
      id: 'podcast',
      title: t.coupleSupport.podcast,
      icon: Mic,
      description: t.coupleSupport.podcastDesc,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-gradient-to-r from-orange-600 to-amber-600',
      link: 'PodcastsSupport',
      active: true,
      type: 'content'
    },
    {
      id: 'groupActivities',
      title: t.coupleSupport.groupActivities,
      icon: UsersRound,
      description: t.coupleSupport.groupActivitiesDesc,
      color: 'from-fuchsia-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-fuchsia-600 to-pink-600',
      link: 'GroupActivities',
      active: false,
      type: 'interactive'
    },
    {
      id: 'counseling',
      title: t.coupleSupport.counseling,
      icon: MessageCircle,
      description: t.coupleSupport.counselingDesc,
      color: 'from-teal-500 to-green-500',
      bgColor: 'bg-gradient-to-r from-teal-600 to-green-600',
      link: 'CounselingSupport',
      active: false,
      type: 'content'
    },
    {
      id: 'influencers',
      title: t.coupleSupport.influencers,
      icon: Megaphone,
      description: t.coupleSupport.influencersDesc,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-red-600 to-pink-600',
      link: 'InfluencersSupport',
      active: false,
      type: 'content'
    }
  ];

  const hiddenCategoryIds = new Set(['aiCoach', 'groupActivities', 'counseling', 'influencers']);

  const filteredCategories = categories.filter(category => {
    if (hiddenCategoryIds.has(category.id)) return false;

    const matchesSearch = !searchQuery || 
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'interactive' && category.type === 'interactive') ||
      (filter === 'content' && category.type === 'content');
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.coupleSupport.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.coupleSupport.subtitle}
          </p>
        </motion.div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={t.coupleSupport.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg rounded-full shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : ''}
            >
              {t.coupleSupport.filterAll}
            </Button>
            <Button
              variant={filter === 'interactive' ? 'default' : 'outline'}
              onClick={() => setFilter('interactive')}
              className={filter === 'interactive' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : ''}
            >
              {t.coupleSupport.filterActive}
            </Button>
            <Button
              variant={filter === 'content' ? 'default' : 'outline'}
              onClick={() => setFilter('content')}
              className={filter === 'content' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : ''}
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
            >
              {filteredCategories.map((category, index) => {
                const Icon = category.icon;
                const CardWrapper = category.active ? Link : 'div';
                const cardProps = category.active ? { to: createPageUrl(category.link) } : {};
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <CardWrapper {...cardProps}>
                      <Card className={`h-full transition-all duration-300 border-2 ${
                        category.active 
                          ? 'hover:shadow-2xl cursor-pointer border-transparent hover:border-pink-200 group' 
                          : 'cursor-not-allowed border-gray-300'
                      }`}>
                        {!category.active && (
                          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] rounded-lg z-10 flex items-center justify-center pointer-events-none">
                            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-2xl transform rotate-[-5deg]">
                              {t.coupleSupport.comingSoon}
                            </div>
                          </div>
                        )}
                        <CardHeader>
                          <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                            category.active ? 'group-hover:scale-110 transition-transform' : ''
                          }`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-2xl font-bold text-gray-900">
                            {category.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 leading-relaxed mb-4">
                            {category.description}
                          </p>
                          <Button 
                            className={`w-full ${category.bgColor} hover:opacity-90 text-white`}
                            disabled={!category.active}
                          >
                            {t.coupleSupport.explore} {category.title}
                          </Button>
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
              className="text-center py-16"
            >
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                {t.coupleSupport.noResults}
              </h3>
              <p className="text-gray-500">
                {t.coupleSupport.noResultsDesc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <Heart className="w-16 h-16 mx-auto mb-6 fill-current" />
          <h2 className="text-4xl font-bold mb-4">
            {t.coupleSupport.ctaTitle}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t.coupleSupport.ctaSubtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={createPageUrl("RelationshipCoach")}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl">
                {t.coupleSupport.browseResources}
              </Button>
            </Link>
            <Link to={createPageUrl("ArticlesSupport")}>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/20 text-lg px-8 py-6">
                {t.coupleSupport.explore} {t.coupleSupport.articles}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}