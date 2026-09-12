import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Play, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GameLauncher, recoveredGameCards } from "@/components/activities/RelationshipGames";

const translations = {
  en: {
    title: "Cooperative Games",
    subtitle: "Play together, laugh together, grow together",
    back: "Back to Activities",
    featured: "Games You Can Play Now",
    recovered: "Recovered from the original One2OneLove build and brought forward for the new platform.",
    play: "Play Now"
  },
  es: {
    title: "Juegos Cooperativos",
    subtitle: "Jueguen juntos, rían juntos, crezcan juntos",
    back: "Volver a Actividades",
    featured: "Juegos Disponibles Ahora",
    recovered: "Recuperados de la versión original de One2OneLove y adaptados para la nueva plataforma.",
    play: "Jugar Ahora"
  },
  fr: {
    title: "Jeux Coopératifs",
    subtitle: "Jouez ensemble, riez ensemble, grandissez ensemble",
    back: "Retour aux Activités",
    featured: "Jeux Disponibles Maintenant",
    recovered: "Récupérés de la version originale de One2OneLove et adaptés à la nouvelle plateforme.",
    play: "Jouer Maintenant"
  },
  it: {
    title: "Giochi Cooperativi",
    subtitle: "Giocate insieme, ridete insieme, crescete insieme",
    back: "Torna alle Attività",
    featured: "Giochi Disponibili Ora",
    recovered: "Recuperati dalla versione originale di One2OneLove e portati nella nuova piattaforma.",
    play: "Gioca Ora"
  },
  de: {
    title: "Kooperative Spiele",
    subtitle: "Gemeinsam spielen, lachen und wachsen",
    back: "Zurück zu Aktivitäten",
    featured: "Jetzt Spielbare Spiele",
    recovered: "Aus dem ursprünglichen One2OneLove-Build wiederhergestellt und für die neue Plattform übernommen.",
    play: "Jetzt Spielen"
  }
};

export default function CooperativeGames() {
  const { currentLanguage } = useLanguage();
  const lang = translations[currentLanguage] ? currentLanguage : "en";
  const t = translations[lang];
  const [activeGame, setActiveGame] = useState(null);
  const games = recoveredGameCards(lang);

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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="max-w-3xl mx-auto mb-10 rounded-2xl bg-white/80 border border-green-100 p-4 text-center text-sm text-gray-600 shadow-sm">
          <Sparkles className="w-4 h-4 inline-block mr-2 text-green-600" />
          {t.recovered}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.featured}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <motion.div key={game.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.08 }}>
              <Card className="h-full border-2 border-transparent hover:border-green-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="text-5xl mb-3">{game.icon}</div>
                  <CardTitle className="text-xl">{game.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 min-h-[72px] mb-5">{game.description}</p>
                  <Button onClick={() => setActiveGame(game.id)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    <Play className="w-4 h-4 mr-2" />
                    {t.play}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {activeGame && <GameLauncher gameId={activeGame} lang={lang} onClose={() => setActiveGame(null)} />}
    </div>
  );
}
