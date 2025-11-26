import React, { useState, useMemo } from "react";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BookOpen, Brain, Gamepad2, Target, Calendar, Heart,
  TrendingUp, Award, Flame, ArrowRight, Sparkles, Users
} from "lucide-react";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "Couple Activities",
    subtitle: "Strengthen your bond through fun and meaningful activities",
    progressTracker: "Your Progress",
    recommendations: "Recommended For You",
    allActivities: "All Activities",
    streak: "day streak",
    activities: "activities",
    completed: "completed",
    minutesTogether: "minutes together",
    startActivity: "Start Activity",
    continue: "Continue",
    viewProgress: "View Progress",
    activities_types: {
      journal: "Shared Journals",
      journal_desc: "Write together, share thoughts, and document your journey",
      quiz: "Relationship Quizzes",
      quiz_desc: "Discover insights about your relationship and each other",
      game: "Cooperative Games",
      game_desc: "Play fun games together and build teamwork",
      goal: "Relationship Goals",
      goal_desc: "Set and achieve meaningful goals as a couple",
      memory: "Memory Lane",
      memory_desc: "Capture and cherish special moments together",
      milestone: "Milestones",
      milestone_desc: "Track and celebrate your relationship milestones"
    },
    recommended_for_you: "Based on your preferences and activity history",
    no_progress: "Start an activity to see your progress",
    total_activities: "Total Activities",
    this_week: "This Week"
  },
  es: {
    title: "Actividades de Pareja",
    subtitle: "Fortalece tu vínculo a través de actividades divertidas y significativas",
    progressTracker: "Tu Progreso",
    recommendations: "Recomendado Para Ti",
    allActivities: "Todas las Actividades",
    streak: "días seguidos",
    activities: "actividades",
    completed: "completadas",
    minutesTogether: "minutos juntos",
    startActivity: "Iniciar Actividad",
    continue: "Continuar",
    viewProgress: "Ver Progreso",
    activities_types: {
      journal: "Diarios Compartidos",
      journal_desc: "Escriban juntos, compartan pensamientos y documenten su viaje",
      quiz: "Cuestionarios de Relación",
      quiz_desc: "Descubre ideas sobre tu relación y el uno del otro",
      game: "Juegos Cooperativos",
      game_desc: "Juega juegos divertidos juntos y construye trabajo en equipo",
      goal: "Metas de Relación",
      goal_desc: "Establece y logra metas significativas como pareja",
      memory: "Carril de Recuerdos",
      memory_desc: "Captura y aprecia momentos especiales juntos",
      milestone: "Hitos",
      milestone_desc: "Rastrea y celebra los hitos de tu relación"
    },
    recommended_for_you: "Basado en tus preferencias e historial de actividad",
    no_progress: "Inicia una actividad para ver tu progreso",
    total_activities: "Total de Actividades",
    this_week: "Esta Semana"
  },
  fr: {
    title: "Activités de Couple",
    subtitle: "Renforcez votre lien grâce à des activités amusantes et significatives",
    progressTracker: "Votre Progrès",
    recommendations: "Recommandé Pour Vous",
    allActivities: "Toutes les Activités",
    streak: "jours d'affilée",
    activities: "activités",
    completed: "terminées",
    minutesTogether: "minutes ensemble",
    startActivity: "Commencer l'Activité",
    continue: "Continuer",
    viewProgress: "Voir le Progrès",
    activities_types: {
      journal: "Journaux Partagés",
      journal_desc: "Écrivez ensemble, partagez vos pensées et documentez votre voyage",
      quiz: "Quiz de Relations",
      quiz_desc: "Découvrez des aperçus sur votre relation et l'un l'autre",
      game: "Jeux Coopératifs",
      game_desc: "Jouez à des jeux amusants ensemble et développez le travail d'équipe",
      goal: "Objectifs de Relation",
      goal_desc: "Fixez et atteignez des objectifs significatifs en tant que couple",
      memory: "Allée des Souvenirs",
      memory_desc: "Capturez et chérissez des moments spéciaux ensemble",
      milestone: "Jalons",
      milestone_desc: "Suivez et célébrez les jalons de votre relation"
    },
    recommended_for_you: "Basé sur vos préférences et historique d'activité",
    no_progress: "Commencez une activité pour voir votre progrès",
    total_activities: "Total des Activités",
    this_week: "Cette Semaine"
  },
  it: {
    title: "Attività di Coppia",
    subtitle: "Rafforza il tuo legame attraverso attività divertenti e significative",
    progressTracker: "I Tuoi Progressi",
    recommendations: "Consigliato Per Te",
    allActivities: "Tutte le Attività",
    streak: "giorni di fila",
    activities: "attività",
    completed: "completate",
    minutesTogether: "minuti insieme",
    startActivity: "Inizia Attività",
    continue: "Continua",
    viewProgress: "Vedi Progressi",
    activities_types: {
      journal: "Diari Condivisi",
      journal_desc: "Scrivi insieme, condividi pensieri e documenta il tuo viaggio",
      quiz: "Quiz sulle Relazioni",
      quiz_desc: "Scopri intuizioni sulla tua relazione e l'uno sull'altro",
      game: "Giochi Cooperativi",
      game_desc: "Gioca a giochi divertenti insieme e costruisci il lavoro di squadra",
      goal: "Obiettivi di Relazione",
      goal_desc: "Stabilisci e raggiungi obiettivi significativi come coppia",
      memory: "Viale dei Ricordi",
      memory_desc: "Cattura e custodisci momenti speciali insieme",
      milestone: "Traguardi",
      milestone_desc: "Traccia e celebra i traguardi della tua relazione"
    },
    recommended_for_you: "Basato sulle tue preferenze e sulla cronologia delle attività",
    no_progress: "Inizia un'attività per vedere i tuoi progressi",
    total_activities: "Totale Attività",
    this_week: "Questa Settimana"
  },
  de: {
    title: "Paar-Aktivitäten",
    subtitle: "Stärken Sie Ihre Bindung durch unterhaltsame und bedeutungsvolle Aktivitäten",
    progressTracker: "Dein Fortschritt",
    recommendations: "Empfohlen Für Dich",
    allActivities: "Alle Aktivitäten",
    streak: "Tage in Folge",
    activities: "Aktivitäten",
    completed: "abgeschlossen",
    minutesTogether: "Minuten zusammen",
    startActivity: "Aktivität Starten",
    continue: "Fortsetzen",
    viewProgress: "Fortschritt Ansehen",
    activities_types: {
      journal: "Gemeinsame Tagebücher",
      journal_desc: "Schreibt zusammen, teilt Gedanken und dokumentiert eure Reise",
      quiz: "Beziehungsquiz",
      quiz_desc: "Entdecke Einblicke in deine Beziehung und einander",
      game: "Kooperative Spiele",
      game_desc: "Spielt lustige Spiele zusammen und baut Teamarbeit auf",
      goal: "Beziehungsziele",
      goal_desc: "Setzt und erreicht bedeutungsvolle Ziele als Paar",
      memory: "Erinnerungsgasse",
      memory_desc: "Erfasst und schätzt besondere Momente zusammen",
      milestone: "Meilensteine",
      milestone_desc: "Verfolgt und feiert eure Beziehungsmeilensteine"
    },
    recommended_for_you: "Basierend auf deinen Vorlieben und Aktivitätsverlauf",
    no_progress: "Starte eine Aktivität, um deinen Fortschritt zu sehen",
    total_activities: "Gesamtaktivitäten",
    this_week: "Diese Woche"
  }
};

export default function CoupleActivities() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const { user } = useAuth();

  const { data: progressData = [] } = useQuery({
    queryKey: ['activityProgress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // TODO: Implement activity progress service
      return [];
    },
    enabled: !!user?.id,
    initialData: []
  });

  const { data: preferences = null } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // TODO: Implement user preferences service
      return null;
    },
    enabled: !!user?.id,
    initialData: null
  });

  const activities = [
    {
      id: 'journal',
      name: t.activities_types.journal,
      description: t.activities_types.journal_desc,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      link: 'SharedJournals',
      category: 'creative'
    },
    {
      id: 'quiz',
      name: t.activities_types.quiz,
      description: t.activities_types.quiz_desc,
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      link: 'RelationshipQuizzes',
      category: 'learning'
    },
    {
      id: 'game',
      name: t.activities_types.game,
      description: t.activities_types.game_desc,
      icon: Gamepad2,
      color: 'from-green-500 to-emerald-500',
      link: 'CooperativeGames',
      category: 'fun'
    },
    {
      id: 'goal',
      name: t.activities_types.goal,
      description: t.activities_types.goal_desc,
      icon: Target,
      color: 'from-orange-500 to-red-500',
      link: 'RelationshipGoals',
      category: 'growth'
    },
    {
      id: 'memory',
      name: t.activities_types.memory,
      description: t.activities_types.memory_desc,
      icon: Calendar,
      color: 'from-pink-500 to-rose-500',
      link: 'MemoryLane',
      category: 'memories'
    },
    {
      id: 'milestone',
      name: t.activities_types.milestone,
      description: t.activities_types.milestone_desc,
      icon: Award,
      color: 'from-amber-500 to-yellow-500',
      link: 'RelationshipMilestones',
      category: 'celebration'
    }
  ];

  const stats = useMemo(() => {
    const totalCompleted = progressData.reduce((sum, p) => sum + (p.completion_count || 0), 0);
    const totalMinutes = progressData.reduce((sum, p) => sum + (p.total_time_minutes || 0), 0);
    const maxStreak = Math.max(...progressData.map(p => p.streak_days || 0), 0);
    
    return {
      totalCompleted,
      totalMinutes,
      maxStreak,
      totalActivities: progressData.length
    };
  }, [progressData]);

  const recommendations = useMemo(() => {
    if (!preferences || progressData.length === 0) {
      return activities.slice(0, 3);
    }

    const activityScores = activities.map(activity => {
      const progress = progressData.find(p => 
        p.activity_type === activity.id || p.activity_name === activity.name
      );
      
      let score = 0;
      
      if (progress) {
        score += (progress.preference_rating || 0) * 20;
        score += Math.min(progress.completion_count || 0, 10) * 5;
        
        const daysSinceActivity = progress.last_activity_date 
          ? Math.floor((Date.now() - new Date(progress.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysSinceActivity > 7) score += 15;
      } else {
        score += 30;
      }
      
      if (preferences.favorite_activity_types?.includes(activity.category)) {
        score += 25;
      }
      
      return { ...activity, score };
    });

    return activityScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [activities, progressData, preferences]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Progress Tracker */}
        {stats.totalCompleted > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              {t.progressTracker}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Flame className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold mb-1">{stats.maxStreak}</div>
                  <div className="text-sm opacity-90">{t.streak}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold mb-1">{stats.totalCompleted}</div>
                  <div className="text-sm opacity-90">{t.completed}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold mb-1">{stats.totalActivities}</div>
                  <div className="text-sm opacity-90">{t.activities}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 fill-current" />
                  <div className="text-3xl font-bold mb-1">{stats.totalMinutes}</div>
                  <div className="text-sm opacity-90">{t.minutesTogether}</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {t.recommendations}
          </h2>
          <p className="text-gray-600 mb-6">{t.recommended_for_you}</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((activity, index) => {
              const Icon = activity.icon;
              const progress = progressData.find(p => 
                p.activity_type === activity.id || p.activity_name === activity.name
              );
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className={`w-16 h-16 bg-gradient-to-br ${activity.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {activity.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        {activity.description}
                      </p>
                      
                      {progress && (
                        <div className="bg-purple-50 rounded-lg p-3 mb-4 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-semibold text-purple-600">
                              {progress.completion_count || 0} {t.completed}
                            </span>
                          </div>
                          {progress.streak_days > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Flame className="w-4 h-4" />
                              <span className="font-semibold">{progress.streak_days} {t.streak}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Link to={createPageUrl(activity.link)}>
                        <Button className={`w-full bg-gradient-to-r ${activity.color} hover:opacity-90`}>
                          {progress ? t.continue : t.startActivity}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* All Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t.allActivities}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              const progress = progressData.find(p => 
                p.activity_type === activity.id || p.activity_name === activity.name
              );
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-200">
                    <CardHeader>
                      <div className={`w-14 h-14 bg-gradient-to-br ${activity.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {activity.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        {activity.description}
                      </p>
                      
                      {progress && (
                        <div className="text-xs text-gray-500 mb-3">
                          {progress.completion_count || 0} {t.completed}
                        </div>
                      )}
                      
                      <Link to={createPageUrl(activity.link)}>
                        <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                          {progress ? t.continue : t.startActivity}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}