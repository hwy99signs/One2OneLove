import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Trophy, Clock, Star, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GameCard from "../components/activities/GameCard";

const translations = {
  en: {
    title: "Cooperative Games",
    subtitle: "Play together, laugh together, grow together",
    back: "Back to Activities",
    gamesPlayed: "Games Played",
    totalScore: "Total Score",
    avgTime: "Avg Time",
    featured: "Featured Games",
    allGames: "All Games",
    startGame: "Start Game"
  },
  es: {
    title: "Juegos Cooperativos",
    subtitle: "Jueguen juntos, rían juntos, crezcan juntos",
    back: "Volver a Actividades",
    gamesPlayed: "Juegos Jugados",
    totalScore: "Puntuación Total",
    avgTime: "Tiempo Promedio",
    featured: "Juegos Destacados",
    allGames: "Todos los Juegos",
    startGame: "Iniciar Juego"
  }
};

export default function CooperativeGames() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();

  const { user } = useAuth();

  const { data: games = [] } = useQuery({
    queryKey: ['cooperativeGames', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // TODO: Implement cooperative games service
      return [];
    },
    enabled: !!user?.id,
    initialData: []
  });

  const availableGames = [
    {
      id: 'trivia',
      name: 'Couple Trivia',
      description: 'Test how well you know each other with fun trivia questions',
      type: 'trivia',
      difficulty: 'easy',
      icon: '🎯'
    },
    {
      id: 'word_builder',
      name: 'Word Builder',
      description: 'Create words together and build your vocabulary as a team',
      type: 'word_game',
      difficulty: 'medium',
      icon: '📝'
    },
    {
      id: 'memory_match',
      name: 'Memory Match',
      description: 'Find matching pairs together and improve your memory',
      type: 'puzzle',
      difficulty: 'easy',
      icon: '🧩'
    },
    {
      id: 'story_creator',
      name: 'Story Creator',
      description: 'Create a story together by taking turns adding sentences',
      type: 'creative',
      difficulty: 'easy',
      icon: '📖'
    },
    {
      id: 'challenge_quest',
      name: 'Challenge Quest',
      description: 'Complete fun challenges together and earn points',
      type: 'challenge',
      difficulty: 'hard',
      icon: '🏆'
    },
    {
      id: 'conversation_cards',
      name: 'Conversation Cards',
      description: 'Deep and meaningful conversation prompts for couples',
      type: 'conversation',
      difficulty: 'medium',
      icon: '💬'
    }
  ];

  const stats = {
    gamesPlayed: games.length,
    totalScore: games.reduce((sum, g) => sum + (g.score || 0), 0),
    avgTime: games.length > 0 
      ? Math.round(games.reduce((sum, g) => sum + (g.duration_minutes || 0), 0) / games.length)
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("CoupleActivities")} className="inline-flex items-center text-gray-600 hover:text-green-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-xl">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </motion.div>

        {games.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-12">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">{stats.gamesPlayed}</div>
                <div className="text-sm opacity-90">{t.gamesPlayed}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">{stats.totalScore}</div>
                <div className="text-sm opacity-90">{t.totalScore}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">{stats.avgTime}m</div>
                <div className="text-sm opacity-90">{t.avgTime}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.featured}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableGames.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}