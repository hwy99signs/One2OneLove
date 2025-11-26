import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Heart, Calendar, Star, Zap, Target, Gift, Crown, Award, ArrowLeft, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const translations = {
  en: {
    title: "Achievements & Rewards",
    subtitle: "Unlock badges and rewards as you build a stronger relationship",
    yourProgress: "Your Progress",
    totalPoints: "Total Points",
    badges: "Badges Earned",
    level: "Level",
    nextReward: "Next Reward",
    pointsAway: "points away",
    earnedBadges: "Earned Badges",
    lockedBadges: "Locked Badges",
    pointsSystem: "Points System",
    premiumRewards: "Premium Rewards",
    viewPremium: "View All Premium Features",
    back: "Back"
  },
  es: {
    title: "Logros y Recompensas",
    subtitle: "Desbloquea insignias y recompensas mientras construyes una relación más fuerte",
    yourProgress: "Tu Progreso",
    totalPoints: "Puntos Totales",
    badges: "Insignias Ganadas",
    level: "Nivel",
    nextReward: "Próxima Recompensa",
    pointsAway: "puntos restantes",
    earnedBadges: "Insignias Ganadas",
    lockedBadges: "Insignias Bloqueadas",
    pointsSystem: "Sistema de Puntos",
    premiumRewards: "Recompensas Premium",
    viewPremium: "Ver Todas las Funciones Premium",
    back: "Volver"
  },
  fr: {
    title: "Réalisations et Récompenses",
    subtitle: "Débloquez des badges et récompenses en construisant une relation plus forte",
    yourProgress: "Votre Progrès",
    totalPoints: "Points Totaux",
    badges: "Badges Gagnés",
    level: "Niveau",
    nextReward: "Prochaine Récompense",
    pointsAway: "points restants",
    earnedBadges: "Badges Gagnés",
    lockedBadges: "Badges Verrouillés",
    pointsSystem: "Système de Points",
    premiumRewards: "Récompenses Premium",
    viewPremium: "Voir Toutes les Fonctionnalités Premium",
    back: "Retour"
  },
  it: {
    title: "Obiettivi e Ricompense",
    subtitle: "Sblocca badge e ricompense costruendo una relazione più forte",
    yourProgress: "I Tuoi Progressi",
    totalPoints: "Punti Totali",
    badges: "Badge Guadagnati",
    level: "Livello",
    nextReward: "Prossima Ricompensa",
    pointsAway: "punti mancanti",
    earnedBadges: "Badge Guadagnati",
    lockedBadges: "Badge Bloccati",
    pointsSystem: "Sistema Punti",
    premiumRewards: "Ricompense Premium",
    viewPremium: "Vedi Tutte le Funzionalità Premium",
    back: "Indietro"
  },
  de: {
    title: "Erfolge und Belohnungen",
    subtitle: "Schalte Abzeichen und Belohnungen frei beim Aufbau einer stärkeren Beziehung",
    yourProgress: "Ihr Fortschritt",
    totalPoints: "Gesamtpunkte",
    badges: "Verdiente Abzeichen",
    level: "Level",
    nextReward: "Nächste Belohnung",
    pointsAway: "Punkte entfernt",
    earnedBadges: "Verdiente Abzeichen",
    lockedBadges: "Gesperrte Abzeichen",
    pointsSystem: "Punktesystem",
    premiumRewards: "Premium-Belohnungen",
    viewPremium: "Alle Premium-Funktionen Ansehen",
    back: "Zurück"
  }
};

const achievementsList = [
  { id: 1, name: "First Love Note", icon: "💌", points: 10, description: "Send your first love note", unlockAt: 0, earned: true },
  { id: 2, name: "Romantic Streak", icon: "🔥", points: 50, description: "Send love notes 7 days in a row", unlockAt: 50, earned: true },
  { id: 3, name: "Milestone Master", icon: "🎯", points: 100, description: "Add 5 relationship milestones", unlockAt: 100, earned: true },
  { id: 4, name: "Date Night Pro", icon: "🌟", points: 150, description: "Complete 10 date ideas", unlockAt: 150, earned: false },
  { id: 5, name: "Memory Keeper", icon: "📸", points: 200, description: "Add 20 memories to your collection", unlockAt: 200, earned: false },
  { id: 6, name: "Goal Achiever", icon: "🏆", points: 250, description: "Complete 5 relationship goals", unlockAt: 250, earned: false },
  { id: 7, name: "Love Legend", icon: "👑", points: 500, description: "Reach 500 total points", unlockAt: 500, earned: false },
  { id: 8, name: "Power Couple", icon: "💪", points: 1000, description: "Reach 1000 total points", unlockAt: 1000, earned: false }
];

const pointsActivities = [
  { activity: "Send Love Note", points: 10, icon: Heart },
  { activity: "Complete Date Idea", points: 20, icon: Calendar },
  { activity: "Add Milestone", points: 25, icon: Star },
  { activity: "Achieve Goal", points: 50, icon: Target },
  { activity: "Daily Login", points: 5, icon: Zap },
  { activity: "Complete Profile", points: 30, icon: Award }
];

export default function Achievements() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

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

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['badges', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', currentUser.id);
      if (error) {
        console.error('Error fetching badges:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const totalPoints = userPoints.reduce((sum, p) => sum + (p.points_earned || p.points || 0), 0);
  const level = Math.floor(totalPoints / 100) + 1;
  const nextLevelPoints = level * 100;
  const pointsToNextLevel = nextLevelPoints - totalPoints;

  const earnedAchievements = achievementsList.filter(a => a.earned || totalPoints >= a.unlockAt);
  const lockedAchievements = achievementsList.filter(a => !a.earned && totalPoints < a.unlockAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
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

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">{totalPoints.toLocaleString()}</div>
              <div className="text-sm opacity-90">{t.totalPoints}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">{earnedBadges.length + earnedAchievements.length}</div>
              <div className="text-sm opacity-90">{t.badges}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-6 text-center">
              <Crown className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">{level}</div>
              <div className="text-sm opacity-90">{t.level}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.nextReward}</h3>
            <div className="bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalPoints % 100) / 100 * 100, 100)}%` }}
              />
            </div>
            <p className="text-gray-600 text-center">{pointsToNextLevel} {t.pointsAway}</p>
          </CardContent>
        </Card>

        <Card className="mb-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white overflow-hidden">
          <CardContent className="p-8 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{t.premiumRewards}</h3>
                  <p className="text-sm opacity-90">Unlock exclusive features & content</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Advanced Analytics</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                  <Gift className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Exclusive Dates</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                  <Heart className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Guided Meditations</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
                  <Star className="w-6 h-6 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Custom Themes</div>
                </div>
              </div>
              <Link to={createPageUrl("PremiumFeatures")}>
                <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold">
                  {t.viewPremium}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.earnedBadges}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {earnedAchievements.map((achievement, index) => (
              <motion.div key={achievement.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 hover:shadow-xl transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3">{achievement.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{achievement.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-center gap-1 text-yellow-600 font-semibold">
                      <Zap className="w-4 h-4" />
                      <span>+{achievement.points}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.lockedBadges}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {lockedAchievements.map((achievement, index) => (
              <motion.div key={achievement.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                <Card className="bg-gray-100 border-2 border-gray-300 opacity-60">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-3 grayscale">{achievement.icon}</div>
                    <h3 className="font-bold text-gray-600 mb-1">{achievement.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                    <div className="text-xs text-gray-500">Unlock at {achievement.unlockAt} points</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t.pointsSystem}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {pointsActivities.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                    <Icon className="w-8 h-8 text-purple-600" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{item.activity}</div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600 font-bold">
                      <Zap className="w-5 h-5" />
                      <span>+{item.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}