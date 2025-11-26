import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Unlock, Sparkles, Trophy, Crown, Star, TrendingUp, Heart, Calendar, Brain, Palette, Headphones, ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const translations = {
  en: {
    title: "Premium Features",
    subtitle: "Unlock exclusive content and advanced tools as you progress",
    unlocked: "Unlocked",
    locked: "Locked",
    unlockAt: "Unlock at",
    points: "points",
    level: "Level",
    yourProgress: "Your Progress",
    topRank: "Top",
    leaderboard: "on Leaderboard",
    back: "Back",
    activateNow: "Activate Now",
    viewDetails: "View Details"
  },
  es: {
    title: "Funciones Premium",
    subtitle: "Desbloquea contenido exclusivo y herramientas avanzadas a medida que progresas",
    unlocked: "Desbloqueado",
    locked: "Bloqueado",
    unlockAt: "Desbloquear en",
    points: "puntos",
    level: "Nivel",
    yourProgress: "Tu Progreso",
    topRank: "Top",
    leaderboard: "en la Clasificación",
    back: "Volver",
    activateNow: "Activar Ahora",
    viewDetails: "Ver Detalles"
  },
  fr: {
    title: "Fonctionnalités Premium",
    subtitle: "Débloquez du contenu exclusif et des outils avancés au fur et à mesure",
    unlocked: "Débloqué",
    locked: "Verrouillé",
    unlockAt: "Débloquer à",
    points: "points",
    level: "Niveau",
    yourProgress: "Votre Progrès",
    topRank: "Top",
    leaderboard: "au Classement",
    back: "Retour",
    activateNow: "Activer Maintenant",
    viewDetails: "Voir Détails"
  },
  it: {
    title: "Funzionalità Premium",
    subtitle: "Sblocca contenuti esclusivi e strumenti avanzati mentre progredisci",
    unlocked: "Sbloccato",
    locked: "Bloccato",
    unlockAt: "Sblocca a",
    points: "punti",
    level: "Livello",
    yourProgress: "I Tuoi Progressi",
    topRank: "Top",
    leaderboard: "in Classifica",
    back: "Indietro",
    activateNow: "Attiva Ora",
    viewDetails: "Vedi Dettagli"
  },
  de: {
    title: "Premium-Funktionen",
    subtitle: "Schalten Sie exklusive Inhalte und erweiterte Tools frei, während Sie vorankommen",
    unlocked: "Freigeschaltet",
    locked: "Gesperrt",
    unlockAt: "Freischalten bei",
    points: "Punkte",
    level: "Level",
    yourProgress: "Ihr Fortschritt",
    topRank: "Top",
    leaderboard: "auf Bestenliste",
    back: "Zurück",
    activateNow: "Jetzt Aktivieren",
    viewDetails: "Details Ansehen"
  }
};

const premiumFeatures = [
  {
    id: 1,
    name: "Advanced Relationship Analytics",
    description: "Deep insights into your relationship patterns, communication styles, and growth metrics with AI-powered analysis",
    icon: TrendingUp,
    color: "from-purple-500 to-indigo-600",
    unlockPoints: 500,
    unlockLevel: 5,
    type: "advanced_analytics"
  },
  {
    id: 2,
    name: "Exclusive Date Night Packages",
    description: "Premium curated date experiences, restaurant recommendations, and romantic getaway ideas tailored to your preferences",
    icon: Heart,
    color: "from-pink-500 to-rose-600",
    unlockPoints: 750,
    unlockLevel: 8,
    type: "exclusive_date_package"
  },
  {
    id: 3,
    name: "Guided Couples Meditation",
    description: "Personalized meditation sessions designed for couples to strengthen emotional connection and reduce stress together",
    icon: Headphones,
    color: "from-cyan-500 to-blue-600",
    unlockPoints: 1000,
    unlockLevel: 10,
    type: "guided_meditation"
  },
  {
    id: 4,
    name: "Custom App Themes",
    description: "Unlock beautiful custom color themes and visual styles to personalize your relationship journey",
    icon: Palette,
    color: "from-orange-500 to-amber-600",
    unlockPoints: 300,
    unlockLevel: 3,
    type: "custom_theme"
  },
  {
    id: 5,
    name: "Advanced AI Relationship Coach",
    description: "Enhanced AI coach with unlimited conversations, deeper insights, and personalized action plans for your relationship",
    icon: Brain,
    color: "from-emerald-500 to-teal-600",
    unlockPoints: 1500,
    unlockLevel: 15,
    type: "advanced_ai_coach"
  },
  {
    id: 6,
    name: "Unlimited Love Notes",
    description: "Send unlimited personalized love notes with premium templates and scheduling features",
    icon: Sparkles,
    color: "from-fuchsia-500 to-pink-600",
    unlockPoints: 200,
    unlockLevel: 2,
    type: "unlimited_notes"
  },
  {
    id: 7,
    name: "VIP Support & Priority Access",
    description: "Get priority support, early access to new features, and exclusive content updates",
    icon: Crown,
    color: "from-yellow-400 to-orange-500",
    unlockPoints: 2000,
    unlockLevel: 20,
    rankRequired: 10,
    type: "vip_support"
  },
  {
    id: 8,
    name: "Premium Relationship Library",
    description: "Access exclusive articles, videos, and courses from top relationship experts worldwide",
    icon: Calendar,
    color: "from-violet-500 to-purple-600",
    unlockPoints: 1200,
    unlockLevel: 12,
    type: "premium_content"
  }
];

export default function PremiumFeatures() {
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

  const { data: unlockedRewards = [] } = useQuery({
    queryKey: ['premiumRewards', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      // TODO: Implement premium rewards service
      return [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const totalPoints = userPoints.reduce((sum, p) => sum + (p.points_earned || p.points || 0), 0);
  const level = Math.floor(totalPoints / 100) + 1;

  const isFeatureUnlocked = (feature) => {
    return totalPoints >= feature.unlockPoints || 
           level >= feature.unlockLevel ||
           unlockedRewards.some(r => r.reward_type === feature.type);
  };

  const unlockedFeatures = premiumFeatures.filter(f => isFeatureUnlocked(f));
  const lockedFeatures = premiumFeatures.filter(f => !isFeatureUnlocked(f));

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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <Card className="mb-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">{t.yourProgress}</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-2" />
                <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
                <div className="text-sm opacity-90">{t.points}</div>
              </div>
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto mb-2" />
                <div className="text-3xl font-bold">{t.level} {level}</div>
                <div className="text-sm opacity-90">Current Level</div>
              </div>
              <div className="text-center">
                <Unlock className="w-12 h-12 mx-auto mb-2" />
                <div className="text-3xl font-bold">{unlockedFeatures.length}/{premiumFeatures.length}</div>
                <div className="text-sm opacity-90">{t.unlocked}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {unlockedFeatures.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Unlock className="w-8 h-8 text-green-600" />
              {t.unlocked} Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {unlockedFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 hover:shadow-xl transition-all h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Unlock className="w-3 h-3" />
                            {t.unlocked}
                          </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
                          {feature.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                        <Button className={`w-full bg-gradient-to-r ${feature.color} text-white`}>
                          {t.activateNow}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {lockedFeatures.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Lock className="w-8 h-8 text-gray-400" />
              {t.locked} Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {lockedFeatures.map((feature, index) => {
                const Icon = feature.icon;
                const pointsNeeded = feature.unlockPoints - totalPoints;
                const levelsNeeded = feature.unlockLevel - level;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-50 border-2 border-gray-300 hover:shadow-lg transition-all h-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-200/50 backdrop-blur-[1px]" />
                      <CardHeader className="relative">
                        <div className="flex items-start justify-between">
                          <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg opacity-60`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {t.locked}
                          </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-700 mt-4">
                          {feature.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="relative">
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                        <div className="space-y-2">
                          {pointsNeeded > 0 && (
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sm text-gray-600">{t.unlockAt}:</span>
                              <span className="font-bold text-purple-600">
                                {pointsNeeded.toLocaleString()} {t.points}
                              </span>
                            </div>
                          )}
                          {levelsNeeded > 0 && (
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sm text-gray-600">{t.level}:</span>
                              <span className="font-bold text-blue-600">
                                {feature.unlockLevel}
                              </span>
                            </div>
                          )}
                          {feature.rankRequired && (
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sm text-gray-600">{t.topRank}:</span>
                              <span className="font-bold text-yellow-600">
                                {feature.rankRequired} {t.leaderboard}
                              </span>
                            </div>
                          )}
                        </div>
                        <Link to={createPageUrl("Achievements")}>
                          <Button variant="outline" className="w-full mt-4">
                            {t.viewDetails}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}