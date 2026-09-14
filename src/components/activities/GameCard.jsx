import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
};

export default function GameCard({ game, index }) {
  const playLabel = game.cta || 'Play Now';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className="text-4xl">{game.icon}</div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${difficultyColors[game.difficulty]}`}>
              {game.difficulty}
            </span>
          </div>
          <CardTitle className="text-xl">{game.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{game.description}</p>
          {game.href ? (
            <Link
              to={game.href}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-green-600 hover:to-emerald-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {playLabel}
            </Link>
          ) : (
            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Play className="w-4 h-4 mr-2" />
              {playLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
