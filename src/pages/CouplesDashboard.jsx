
import React, { useMemo } from "react";
import { useLanguage } from "@/Layout";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import * as journalService from "@/lib/journalService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, TrendingUp, Award, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import MetricsOverview from "../components/dashboard/MetricsOverview";
import ActivityProgress from "../components/dashboard/ActivityProgress";
import BadgesDisplay from "../components/dashboard/BadgesDisplay";
import UpcomingActivities from "../components/dashboard/UpcomingActivities";
import MilestoneCelebration from "../components/dashboard/MilestoneCelebration";
import InsightsPanel from "../components/dashboard/InsightsPanel";

const translations = {
  en: {
    title: "Couple's Dashboard",
    subtitle: "Your relationship journey at a glance",
    welcome: "Welcome back",
    metrics: "Key Metrics",
    progress: "Activity Progress",
    badges: "Your Badges",
    upcoming: "Recommended Activities",
    milestones: "Milestone Celebrations",
    viewAll: "View All",
    startActivity: "Start Activity",
    celebrate: "Celebrate"
  },
  es: {
    title: "Panel de Pareja",
    subtitle: "Tu viaje de relación de un vistazo",
    welcome: "Bienvenido de nuevo",
    metrics: "Métricas Clave",
    progress: "Progreso de Actividades",
    badges: "Tus Insignias",
    upcoming: "Actividades Recomendadas",
    milestones: "Celebraciones de Hitos",
    viewAll: "Ver Todo",
    startActivity: "Iniciar Actividad",
    celebrate: "Celebrar"
  },
  fr: {
    title: "Tableau de Bord du Couple",
    subtitle: "Votre parcours relationnel en un coup d'œil",
    welcome: "Bon retour",
    metrics: "Métriques Clés",
    progress: "Progrès des Activités",
    badges: "Vos Badges",
    upcoming: "Activités Recommandées",
    milestones: "Célébrations de Jalons",
    viewAll: "Voir Tout",
    startActivity: "Commencer l'Activité",
    celebrate: "Célébrer"
  },
  it: {
    title: "Dashboard di Coppia",
    subtitle: "Il tuo percorso di relazione a colpo d'occhio",
    welcome: "Bentornato",
    metrics: "Metriche Chiave",
    progress: "Progressi delle Attività",
    badges: "I Tuoi Badge",
    upcoming: "Attività Consigliate",
    milestones: "Celebrazioni dei Traguardi",
    viewAll: "Vedi Tutto",
    startActivity: "Inizia Attività",
    celebrate: "Celebra"
  },
  de: {
    title: "Paar-Dashboard",
    subtitle: "Ihre Beziehungsreise auf einen Blick",
    welcome: "Willkommen zurück",
    metrics: "Wichtige Metriken",
    progress: "Aktivitätsfortschritt",
    badges: "Ihre Abzeichen",
    upcoming: "Empfohlene Aktivitäten",
    milestones: "Meilenstein-Feiern",
    viewAll: "Alle Ansehen",
    startActivity: "Aktivität Starten",
    celebrate: "Feiern"
  }
};

export default function CouplesDashboard() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    initialData: null
  });

  const { data: activityProgress } = useQuery({
    queryKey: ['activityProgress'],
    queryFn: () => base44.entities.ActivityProgress.list(),
    initialData: []
  });

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list('-earned_date'),
    initialData: []
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.RelationshipGoal.list(),
    initialData: []
  });

  const { data: milestones } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
    initialData: []
  });

  const { data: journals } = useQuery({
    queryKey: ['journals'],
    queryFn: () => journalService.getJournalEntries('-entry_date'),
    initialData: []
  });

  const { data: games } = useQuery({
    queryKey: ['games'],
    queryFn: () => base44.entities.CooperativeGame.list(),
    initialData: []
  });

  const { data: memories } = useQuery({
    queryKey: ['memories'],
    queryFn: () => base44.entities.Memory.list(),
    initialData: []
  });

  const allData = useMemo(() => ({
    activityProgress,
    badges,
    goals,
    milestones,
    journals,
    games,
    memories
  }), [activityProgress, badges, goals, milestones, journals, games, memories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                {t.welcome}{user?.full_name ? `, ${user.full_name}` : ''}! 💕
              </h1>
              <p className="text-xl text-gray-600">{t.subtitle}</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <Heart className="w-10 h-10 text-white fill-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Milestone Celebrations */}
        <MilestoneCelebration milestones={allData.milestones} />

        {/* Relationship Insights */}
        <InsightsPanel data={allData} />

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              {t.metrics}
            </h2>
          </div>
          <MetricsOverview data={allData} />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Activity Progress */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {t.progress}
              </h2>
              <Link to={createPageUrl("CoupleActivities")}>
                <Button variant="ghost" size="sm">
                  {t.viewAll} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <ActivityProgress data={allData} />
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-600" />
                {t.badges}
              </h2>
            </div>
            <BadgesDisplay badges={allData.badges} />
          </motion.div>
        </div>

        {/* Upcoming/Recommended Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              {t.upcoming}
            </h2>
          </div>
          <UpcomingActivities data={allData} />
        </motion.div>
      </div>
    </div>
  );
}
