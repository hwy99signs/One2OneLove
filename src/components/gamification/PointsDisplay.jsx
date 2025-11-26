import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PointsDisplay() {
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
  const level = Math.floor(totalPoints / 100) + 1;

  if (!currentUser) return null;

  return (
    <Link to={createPageUrl("Achievements")}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-all"
      >
        <Zap className="w-5 h-5" />
        <div className="flex items-center gap-2">
          <span className="font-bold">{totalPoints.toLocaleString()}</span>
          <span className="text-xs opacity-90">pts</span>
        </div>
        <div className="w-px h-4 bg-white/30" />
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-semibold">Lvl {level}</span>
        </div>
      </motion.div>
    </Link>
  );
}