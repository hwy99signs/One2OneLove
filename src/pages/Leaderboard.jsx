import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal, Star, TrendingUp, Users, Zap, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    title: "Leaderboard",
    subtitle: "See how you rank among other couples building stronger relationships",
    topCouples: "Top Couples",
    yourRank: "Your Rank",
    points: "points",
    activities: "activities",
    thisWeek: "This Week",
    allTime: "All Time",
    thisMonth: "This Month",
    back: "Back",
    categories: {
      overall: "Overall",
      loveNotes: "Love Notes",
      milestones: "Milestones",
      goals: "Goals Achieved"
    }
  },
  es: {
    title: "Tabla de Clasificación",
    subtitle: "Mira cómo te clasificas entre otras parejas construyendo relaciones más fuertes",
    topCouples: "Mejores Parejas",
    yourRank: "Tu Clasificación",
    points: "puntos",
    activities: "actividades",
    thisWeek: "Esta Semana",
    allTime: "Todos los Tiempos",
    thisMonth: "Este Mes",
    back: "Volver"
  },
  fr: {
    title: "Classement",
    subtitle: "Voyez comment vous vous classez parmi les autres couples",
    topCouples: "Meilleurs Couples",
    yourRank: "Votre Rang",
    points: "points",
    activities: "activités",
    thisWeek: "Cette Semaine",
    allTime: "Tous les Temps",
    thisMonth: "Ce Mois",
    back: "Retour"
  },
  it: {
    title: "Classifica",
    subtitle: "Vedi come ti classifichi tra le altre coppie",
    topCouples: "Migliori Coppie",
    yourRank: "Il Tuo Rango",
    points: "punti",
    activities: "attività",
    thisWeek: "Questa Settimana",
    allTime: "Sempre",
    thisMonth: "Questo Mese",
    back: "Indietro"
  },
  de: {
    title: "Bestenliste",
    subtitle: "Sehen Sie, wie Sie im Vergleich zu anderen Paaren abschneiden",
    topCouples: "Top Paare",
    yourRank: "Ihr Rang",
    points: "Punkte",
    activities: "Aktivitäten",
    thisWeek: "Diese Woche",
    allTime: "Alle Zeiten",
    thisMonth: "Diesen Monat",
    back: "Zurück"
  }
};

export default function Leaderboard() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [timeRange, setTimeRange] = useState("allTime");

  const { user: currentUser } = useAuth();

  const { data: userPoints = [] } = useQuery({
    queryKey: ['userPoints', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('gamification_points')
        .select('*')
        .eq('user_id', currentUser.id);
      if (error) {
        console.error('Error fetching points:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const totalPoints = userPoints.reduce((sum, p) => sum + (p.points_earned || p.points || 0), 0);

  const mockLeaderboard = [
    { rank: 1, name: "Emma & James", points: 2850, activities: 145, avatar: "💑" },
    { rank: 2, name: "Sofia & Lucas", points: 2620, activities: 132, avatar: "💕" },
    { rank: 3, name: "Mia & Noah", points: 2480, activities: 128, avatar: "❤️" },
    { rank: 4, name: "You", points: totalPoints, activities: userPoints.length, avatar: "⭐", isCurrentUser: true },
    { rank: 5, name: "Ava & Liam", points: 2180, activities: 115, avatar: "💝" },
    { rank: 6, name: "Isabella & Ethan", points: 1950, activities: 98, avatar: "💖" },
    { rank: 7, name: "Charlotte & Mason", points: 1820, activities: 91, avatar: "💗" },
    { rank: 8, name: "Amelia & Logan", points: 1680, activities: 84, avatar: "💓" }
  ];

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2: return <Medal className="w-8 h-8 text-gray-400" />;
      case 3: return <Medal className="w-8 h-8 text-amber-600" />;
      default: return <Star className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="flex justify-center gap-4 mb-8">
          {[
            { id: "thisWeek", label: t.thisWeek },
            { id: "thisMonth", label: t.thisMonth },
            { id: "allTime", label: t.allTime }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                timeRange === range.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 mb-12">
          {mockLeaderboard.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`${entry.isCurrentUser ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300' : 'bg-white'} hover:shadow-xl transition-all`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0 w-16 text-center">
                      {getRankIcon(entry.rank)}
                      <div className="text-sm font-bold text-gray-600 mt-1">#{entry.rank}</div>
                    </div>
                    <div className="text-4xl">{entry.avatar}</div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${entry.isCurrentUser ? 'text-purple-900' : 'text-gray-900'}`}>
                        {entry.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold">{entry.points.toLocaleString()}</span>
                          <span className="text-sm">{t.points}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-semibold">{entry.activities}</span>
                          <span className="text-sm">{t.activities}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}