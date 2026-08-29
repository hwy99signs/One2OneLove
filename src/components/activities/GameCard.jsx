import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock3 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
};

export default function GameCard({ game, index, difficultyLabels, playLabel, comingSoonLabel }) {
  const difficultyLabel = difficultyLabels?.[game.difficulty] || game.difficulty;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-green-200 hover:shadow-xl">
        <CardHeader>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="text-4xl" aria-hidden="true">{game.icon}</div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyColors[game.difficulty] || 'bg-gray-100 text-gray-700'}`}>
              {difficultyLabel}
            </span>
          </div>
          <CardTitle className="text-xl">{game.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col">
          <p className="mb-4 text-gray-600">{game.description}</p>
          <div className="mt-auto">
            {game.href ? (
              <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                <Link to={game.href}>
                  <Play className="mr-2 h-4 w-4" aria-hidden="true" />{playLabel}
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" className="w-full" disabled>
                <Clock3 className="mr-2 h-4 w-4" aria-hidden="true" />{comingSoonLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
