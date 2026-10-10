import React, { useEffect, useState } from "react";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Trophy, Clock, Star, Play, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GameCard from "../components/activities/GameCard";
import { getCooperativeGameHistory } from "@/lib/activityService";
import OpenHouseBrowseNotice from "@/components/launch/OpenHouseBrowseNotice";
import { apiRequest } from "@/lib/apiClient";

const translations = {
  en: {
    title: "Relationship Games",
    subtitle: "Play together, laugh together, grow together",
    back: "Back to Activities",
    gamesPlayed: "Games Played",
    totalScore: "Total Score",
    avgTime: "Avg Time",
    featured: "Featured Games",
    allGames: "All Games",
    startGame: "Start Game",
    scratchName: "LOVE SCRATCH GAME",
    scratchDesc: "Scratch, reveal, and talk through meaningful questions together.",
    whatShouldName: "What Should They Do?",
    whatShouldDesc: "Vote on real-life relationship dilemmas, then see how other people answered.",
    likeMindedName: "Like Minded?",
    likeMindedDesc: "Answer privately, lock your choice, reveal together, and see where you naturally align.", publicAccess:"NO ACCOUNT",freeAccess:"FREE ACCOUNT",tokenAccess:"CREDIT", pestsName:"PEST'S", pestsDesc:"The tiny pest is loose! Chase the ant, the fly and the mosquito through kitchens, porches and bedrooms \u2014 it gets faster every catch.", scrablukoName:"Scrabluko", scrablukoDesc:"Scrabble letters, crossword clues, sudoku calm. Build words, solve the clue, keep your cool.", catBrain:"Brain & Puzzle", catArcade:"Arcade & Quick Play", freeBanner:"Launch weekend \u2014 ALL GAMES FREE until Sunday, Oct 11 at 11:59 PM!"
  },
  es: {
    title: "Juegos de Relaciones",
    subtitle: "Jueguen juntos, rían juntos, crezcan juntos",
    back: "Volver a Actividades",
    gamesPlayed: "Juegos Jugados",
    totalScore: "Puntuación Total",
    avgTime: "Tiempo Promedio",
    featured: "Juegos Destacados",
    allGames: "Todos los Juegos",
    startGame: "Iniciar Juego",
    scratchName: "LOVE SCRATCH GAME",
    scratchDesc: "Rasquen, revelen y conversen juntos sobre preguntas significativas.",
    whatShouldName: "¿Qué Deberían Hacer?",
    whatShouldDesc: "Vota en dilemas reales de relaciones y luego mira cómo respondieron otras personas.",
    likeMindedName: "¿Piensan Igual?",
    likeMindedDesc: "Respondan en privado, bloqueen su elección, revelen juntos y descubran dónde coinciden.", publicAccess:"SIN CUENTA",freeAccess:"CUENTA GRATIS",tokenAccess:"CRÉDITO", pestsName:"PEST'S", pestsDesc:"¡La pequeña plaga anda suelta! Persigue a la hormiga, la mosca y el mosquito por cocinas, porches y dormitorios: se acelera con cada captura.", scrablukoName:"Scrabluko", scrablukoDesc:"Letras de Scrabble, pistas de crucigrama, calma de sudoku. Forma palabras, resuelve la pista, mantén la calma.", catBrain:"Mente y lógica", catArcade:"Arcade y juego rápido", freeBanner:"Fin de semana de lanzamiento: ¡TODOS LOS JUEGOS GRATIS hasta el domingo 11 de octubre a las 11:59 PM!"
  },
  fr: {
    title: "Jeux Relationnels",
    subtitle: "Jouez ensemble, riez ensemble, grandissez ensemble",
    back: "Retour aux Activités",
    gamesPlayed: "Parties Jouées",
    totalScore: "Score Total",
    avgTime: "Temps Moyen",
    featured: "Jeux en Vedette",
    allGames: "Tous les Jeux",
    startGame: "Commencer",
    scratchName: "LOVE SCRATCH GAME",
    scratchDesc: "Grattez, révélez et échangez ensemble autour de questions significatives.",
    whatShouldName: "Que Devraient-Ils Faire ?",
    whatShouldDesc: "Votez sur des dilemmes relationnels réels, puis découvrez les réponses des autres.",
    likeMindedName: "Même Longueur d’Onde ?",
    likeMindedDesc: "Répondez en privé, verrouillez, révélez ensemble et découvrez vos points d’accord.", publicAccess:"SANS COMPTE",freeAccess:"COMPTE GRATUIT",tokenAccess:"CRÉDIT", pestsName:"PEST'S", pestsDesc:"Le petit nuisible est en liberté ! Poursuivez la fourmi, la mouche et le moustique dans les cuisines, les vérandas et les chambres \u2014 il accélère à chaque prise.", scrablukoName:"Scrabluko", scrablukoDesc:"Lettres de Scrabble, indices de mots croisés, calme du sudoku. Formez des mots, résolvez l'indice, gardez votre sang-froid.", catBrain:"Cerveau et casse-tête", catArcade:"Arcade et jeu rapide", freeBanner:"Week-end de lancement \u2014 TOUS LES JEUX GRATUITS jusqu'au dimanche 11 octobre à 23 h 59 !"
  },
  it: {
    title: "Giochi Relazionali",
    subtitle: "Giocate insieme, ridete insieme, crescete insieme",
    back: "Torna alle Attività",
    gamesPlayed: "Partite Giocate",
    totalScore: "Punteggio Totale",
    avgTime: "Tempo Medio",
    featured: "Giochi in Evidenza",
    allGames: "Tutti i Giochi",
    startGame: "Inizia Gioco",
    scratchName: "LOVE SCRATCH GAME",
    scratchDesc: "Grattate, scoprite e parlate insieme di domande significative.",
    whatShouldName: "Cosa Dovrebbero Fare?",
    whatShouldDesc: "Vota su dilemmi relazionali realistici e poi scopri come hanno risposto gli altri.",
    likeMindedName: "Sulla Stessa Lunghezza d’Onda?",
    likeMindedDesc: "Rispondete in privato, bloccate, rivelate insieme e scoprite dove siete allineati.", publicAccess:"SENZA ACCOUNT",freeAccess:"ACCOUNT GRATUITO",tokenAccess:"CREDITO", pestsName:"PEST'S", pestsDesc:"Il piccolo insetto è in libertà! Insegui la formica, la mosca e la zanzara tra cucine, verande e camere da letto: accelera a ogni cattura.", scrablukoName:"Scrabluko", scrablukoDesc:"Lettere dello Scarabeo, indizi da cruciverba, calma da sudoku. Componi parole, risolvi l'indizio, mantieni la calma.", catBrain:"Mente e rompicapi", catArcade:"Arcade e gioco veloce", freeBanner:"Weekend di lancio \u2014 TUTTI I GIOCHI GRATIS fino a domenica 11 ottobre alle 23:59!"
  },
  de: {
    title: "Beziehungsspiele",
    subtitle: "Spielt zusammen, lacht zusammen, wachst zusammen",
    back: "Zurück zu Aktivitäten",
    gamesPlayed: "Gespielte Spiele",
    totalScore: "Gesamtpunktzahl",
    avgTime: "Ø Zeit",
    featured: "Empfohlene Spiele",
    allGames: "Alle Spiele",
    startGame: "Spiel Starten",
    scratchName: "LOVE SCRATCH GAME",
    scratchDesc: "Rubbeln, aufdecken und gemeinsam über bedeutungsvolle Fragen sprechen.",
    whatShouldName: "Was Sollten Sie Tun?",
    whatShouldDesc: "Stimme über realistische Beziehungsdilemmata ab und sieh danach, wie andere geantwortet haben.",
    likeMindedName: "Gleich Gesinnt?",
    likeMindedDesc: "Antwortet privat, sperrt eure Wahl, deckt gemeinsam auf und entdeckt eure Übereinstimmungen.", publicAccess:"OHNE KONTO",freeAccess:"KOSTENLOSES KONTO",tokenAccess:"CREDIT", pestsName:"PEST'S", pestsDesc:"Der kleine Plagegeist ist los! Jage die Ameise, die Fliege und die Mücke durch Küchen, Veranden und Schlafzimmer \u2014 mit jedem Fang wird sie schneller.", scrablukoName:"Scrabluko", scrablukoDesc:"Scrabble-Buchstaben, Kreuzworträtsel-Hinweise, Sudoku-Ruhe. Bilde Wörter, löse den Hinweis, bleib gelassen.", catBrain:"Kopf & Puzzle", catArcade:"Arcade & schnelles Spiel", freeBanner:"Start-Wochenende \u2014 ALLE SPIELE GRATIS bis Sonntag, 11. Oktober, 23:59 Uhr!"
  }
};

export default function CooperativeGames() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();

  const { user } = useAuth();
  const freeMemberAccess = Boolean(user?.id);
  const launchFreeGuest = Date.now() <= Date.parse('2026-10-12T04:59:59.999Z');

  const { data: gameCatalog = [] } = useQuery({
    queryKey: ['gameCatalog', user?.id],
    queryFn: async () => (await apiRequest('/api/games/catalog'))?.games || [],
    enabled: freeMemberAccess,
    staleTime: 60_000
  });
  const catalogById = Object.fromEntries((gameCatalog||[]).map(g => [g.id,g]));
  const activePromotion = (gameCatalog||[]).map(g=>g.promotion).find(Boolean) || (launchFreeGuest ? {name:'ALL GAMES FREE',free:true} : null);
  const temporaryFreeGames = Boolean(activePromotion?.free);

  useEffect(()=>{
    if(!freeMemberAccess)return;
    const timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    if(timeZone)apiRequest('/api/games/timezone',{method:'POST',body:{timeZone}}).catch(()=>{});
  },[freeMemberAccess,user?.id]);

  const gamePrice = id => {
    const q=catalogById[id];
    const cents=q?.priceCents!=null ? Number(q.priceCents) : (launchFreeGuest ? 0 : 49);
    return {
      priceCents:cents,
      priceLabel:cents===0 ? '$0.00 / FREE today' : '

  const { data: games = [] } = useQuery({
    queryKey: ['cooperativeGames', user?.id],
    queryFn: async () => user?.id ? getCooperativeGameHistory() : [],
    enabled: freeMemberAccess
  });

  const availableGames = [
    { id:'like_minded', image:'/game-cards/card-like-minded.jpg', name:t.likeMindedName, description:t.likeMindedDesc, type:'connection', difficulty:'easy-to-deep', icon:'🧠', link:'LikeMinded', ...gamePrice('like_minded'), playLabel:gamePrice('like_minded').free?'Play FREE':t.startGame, accessLabel:gamePrice('like_minded').free?'FREE TODAY':t.tokenAccess, category:'brain' },
    { id:'what_should_they_do', image:'/game-cards/card-what-should.jpg', name:t.whatShouldName, description:t.whatShouldDesc, type:'social-voting', difficulty:'easy', icon:'🗳️', link:'WhatShouldTheyDo', ...gamePrice('what_should_they_do'), playLabel:gamePrice('what_should_they_do').free?'Play FREE':t.startGame, accessLabel:gamePrice('what_should_they_do').free?'FREE TODAY':t.tokenAccess, category:'brain' },
    { id:'scrabluko', image:'/game-cards/card-scrabluko.jpg', name:t.scrablukoName, description:t.scrablukoDesc, type:'word', difficulty:'easy-to-difficult', icon:'🔤', link:'Scrabluko', ...gamePrice('scrabluko'), playLabel:gamePrice('scrabluko').free?'Play FREE':t.startGame, accessLabel:gamePrice('scrabluko').free?'FREE TODAY':t.tokenAccess, category:'brain' },
    { id:'scratch', image:'/game-cards/card-love-scratch.jpg', name:t.scratchName, description:t.scratchDesc, type:'conversation', difficulty:'easy', icon:'💗', link:'ScratchGame', ...gamePrice('scratch'), playLabel:gamePrice('scratch').free?'Play FREE':t.startGame, accessLabel:gamePrice('scratch').free?'FREE TODAY':t.tokenAccess, category:'arcade' },
    { id:'pests', image:'/game-cards/card-pests.jpg', name:t.pestsName, description:t.pestsDesc, type:'arcade', difficulty:'easy-to-difficult', icon:'🐜', link:'Pests', ...gamePrice('pests'), playLabel:gamePrice('pests').free?'Play FREE':t.startGame, accessLabel:gamePrice('pests').free?'FREE TODAY':t.tokenAccess, category:'arcade' }
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
      {!freeMemberAccess && <div className="mx-auto max-w-7xl px-4 pt-8"><OpenHouseBrowseNotice /></div>}
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

        {temporaryFreeGames && (
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 py-4 text-center text-lg font-black text-white shadow-lg">
            🎉 {activePromotion?.name ? `${activePromotion.name} — all games FREE today. No credits used.` : t.freeBanner}
          </div>
        )}

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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.catBrain}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {availableGames.filter((g) => g.category === 'brain').map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.catArcade}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableGames.filter((g) => g.category === 'arcade').map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}+(cents/100).toFixed(2),
      free:cents===0,
      leaderboard:Boolean(q?.leaderboard),
      scoreLabel:q?.scoreLabel||null
    };
  };

  const { data: games = [] } = useQuery({
    queryKey: ['cooperativeGames', user?.id],
    queryFn: async () => user?.id ? getCooperativeGameHistory() : [],
    enabled: freeMemberAccess
  });

  const availableGames = [
    {
      id: 'like_minded',
      image: '/game-cards/card-like-minded.jpg',
      name: t.likeMindedName,
      description: t.likeMindedDesc,
      type: 'connection',
      difficulty: 'easy-to-deep',
      icon: '🧠',
      link: 'LikeMinded',
      playLabel: temporaryFreeGames ? 'Play FREE' : t.startGame,
      accessLabel: temporaryFreeGames ? 'FREE THROUGH SUNDAY' : t.tokenAccess,
      category: 'brain'
    },
    {
      id: 'scrabluko',
      image: '/game-cards/card-scrabluko.jpg',
      name: t.scrablukoName,
      description: t.scrablukoDesc,
      type: 'word',
      difficulty: 'easy-to-difficult',
      icon: '🔤',
      link: 'Scrabluko',
      playLabel: temporaryFreeGames ? 'Play FREE' : t.startGame,
      accessLabel: temporaryFreeGames ? 'FREE THROUGH SUNDAY' : t.tokenAccess,
      category: 'brain'
    },
    {
      id: 'what_should_they_do',
      image: '/game-cards/card-what-should.jpg',
      name: t.whatShouldName,
      description: t.whatShouldDesc,
      type: 'social-voting',
      difficulty: 'easy',
      icon: '🗳️',
      link: 'WhatShouldTheyDo',
      playLabel: temporaryFreeGames ? 'Play FREE' : t.startGame,
      accessLabel: temporaryFreeGames ? 'FREE THROUGH SUNDAY' : t.tokenAccess,
      category: 'brain'
    },
    {
      id: 'o2ol_scratch',
      image: '/game-cards/card-love-scratch.jpg',
      name: t.scratchName,
      description: t.scratchDesc,
      type: 'conversation',
      difficulty: 'easy',
      icon: '💗',
      link: 'ScratchGame',
      playLabel: temporaryFreeGames ? 'Play FREE' : t.startGame,
      accessLabel: temporaryFreeGames ? 'FREE THROUGH SUNDAY' : t.tokenAccess,
      category: 'arcade'
    },
    {
      id: 'pests',
      image: '/game-cards/card-pests.jpg',
      name: t.pestsName,
      description: t.pestsDesc,
      type: 'arcade',
      difficulty: 'easy-to-difficult',
      icon: '🐜',
      link: 'Pests',
      playLabel: temporaryFreeGames ? 'Play FREE' : t.startGame,
      accessLabel: temporaryFreeGames ? 'FREE THROUGH SUNDAY' : t.tokenAccess,
      category: 'arcade'
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
      {!freeMemberAccess && <div className="mx-auto max-w-7xl px-4 pt-8"><OpenHouseBrowseNotice /></div>}
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

        {temporaryFreeGames && (
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-6 py-4 text-center text-lg font-black text-white shadow-lg">
            🎉 {t.freeBanner}
          </div>
        )}

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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.catBrain}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {availableGames.filter((g) => g.category === 'brain').map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.catArcade}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableGames.filter((g) => g.category === 'arcade').map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}