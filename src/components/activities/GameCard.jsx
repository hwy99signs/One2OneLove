import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Star, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GameLeaderboard from "./GameLeaderboard";

const difficultyColors = {
  easy: 'bg-green-600 text-white',
  'easy-to-deep': 'bg-violet-600 text-white',
  'easy-to-difficult': 'bg-orange-600 text-white',
  medium: 'bg-amber-500 text-white',
  hard: 'bg-red-600 text-white'
};
const difficultyColor = (d) => difficultyColors[d] || 'bg-slate-900/85 text-white';
const difficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  'easy-to-deep': 'Easy to Deep',
  'easy-to-difficult': 'Easy - Difficult'
};
const difficultyLabel = (d) => difficultyLabels[d] || d;

export default function GameCard({ game, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
        {game.image ? (<>
          <div className="relative">
            <img src={game.image} alt={game.name} loading="lazy" className="block aspect-[1663/946] w-full object-cover" />
            <span className={`absolute right-3 top-3 px-3 py-1 rounded-full text-xs font-semibold shadow ${difficultyColor(game.difficulty)}`}>
              {difficultyLabel(game.difficulty)}
            </span>
          </div>
          <CardHeader className="pb-0 pt-4">
            <CardTitle className="text-xl">{game.name}</CardTitle>
          </CardHeader>
        </>) : (
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{game.icon}</div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColor(game.difficulty)}`}>
              {difficultyLabel(game.difficulty)}
            </span>
          </div>
          <CardTitle className="text-xl">{game.name}</CardTitle>
        </CardHeader>)}
        <CardContent>
          <p className="text-gray-600 mb-4">{game.description}</p>
          {game.leaderboard&&<GameLeaderboard game={game.id} compact className="mb-4"/>}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {game.accessLabel && <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700"><LockKeyhole className="h-3.5 w-3.5"/>{game.accessLabel}</div>}
            {game.priceLabel && <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${game.priceCents===0?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-700'}`}>{game.priceLabel}</div>}
          </div>
          {game.href ? (
            <a href={game.href}>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                {game.playLabel || 'Play Now'}
              </Button>
            </a>
          ) : game.link ? (
            <Link to={createPageUrl(game.link)}>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                {game.playLabel || 'Play Now'}
              </Button>
            </Link>
          ) : (
            <Button disabled className="w-full bg-slate-300 text-slate-600">
              Planned
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}