import React, { useState } from "react";
import { Heart, Gift, Star, Trophy, Zap, Crown, Sparkles, Target, Calendar, TrendingUp, Medal, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const translations = {
  en: {
    title: "WIN AMAZING PRIZES!",
    subtitle: "Compete in monthly and yearly contests to win incredible rewards!",
    monthlyContest: "Monthly Contest",
    yearlyContest: "Yearly Contest",
    monthlyTitle: "Most Love Notes Sent",
    monthlyDesc: "Send the most love notes this month to win!",
    monthlyPrize: "$100 Gift Card",
    yearlyTitle: "Strongest Relationship Award",
    yearlyDesc: "Most overall engagement: goals achieved, milestones celebrated, activities completed",
    yearlyPrize: "$1,000 Grand Prize",
    currentStandings: "Current Standings",
    topContenders: "Top 5 Contenders",
    yourRank: "Your Rank",
    leader: "Current Leader",
    lastMonthWinner: "Last Month's Winner",
    timeLeft: "Time Left",
    enterNow: "Join the Competition",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your email to participate",
    enterButton: "START COMPETING",
    disclaimer: "By entering, you agree to receive promotional emails. You can unsubscribe at any time.",
    howToWin: "How to Win",
    monthlyHow: "Simply send love notes to your partner. The member who sends the most notes each month wins!",
    yearlyHow: "Engage with all features: send notes, achieve goals, celebrate milestones, complete date ideas, and more!",
    notesThisMonth: "love notes this month",
    engagementPoints: "engagement points this year",
    youAreRanked: "You are ranked #",
    notParticipating: "Start sending love notes to compete!",
    prizes: {
      premium: { title: "Premium Features Unlock", value: "Level 5+", description: "Advanced relationship analytics and AI coach access" },
      exclusive: { title: "Exclusive Date Packages", value: "Level 10+", description: "Premium restaurant vouchers and couples activities" },
      vip: { title: "VIP Membership", value: "Top 10", description: "Lifetime premium access and priority support" },
      bonus: { title: "Weekly Bonus Prizes", value: "Random Draw", description: "Active participants win surprise gifts weekly" }
    }
  },
  es: {
    title: "¡GANA PREMIOS INCREÍBLES!",
    subtitle: "¡Compite en concursos mensuales y anuales para ganar recompensas increíbles!",
    monthlyContest: "Concurso Mensual",
    yearlyContest: "Concurso Anual",
    monthlyTitle: "Más Notas de Amor Enviadas",
    monthlyDesc: "¡Envía la mayor cantidad de notas de amor este mes para ganar!",
    monthlyPrize: "Tarjeta de Regalo de $100",
    yearlyTitle: "Premio Relación Más Fuerte",
    yearlyDesc: "Mayor participación: metas logradas, hitos celebrados",
    yearlyPrize: "Gran Premio de $1,000",
    currentStandings: "Posiciones Actuales",
    topContenders: "Top 5 Competidores",
    yourRank: "Tu Posición",
    leader: "Líder Actual",
    lastMonthWinner: "Ganador del Mes Pasado",
    enterNow: "Únete a la Competencia",
    howToWin: "Cómo Ganar",
    monthlyHow: "Simplemente envía notas de amor. ¡El que envíe más notas gana!",
    yearlyHow: "Participa con todas las funciones del app",
    notesThisMonth: "notas de amor este mes",
    engagementPoints: "puntos este año",
    youAreRanked: "Estás en el puesto #",
    notParticipating: "¡Empieza a enviar notas para competir!",
    prizes: {
      premium: { title: "Desbloqueo Premium", value: "Nivel 5+", description: "Análisis avanzados" },
      exclusive: { title: "Paquetes Exclusivos", value: "Nivel 10+", description: "Vales premium" },
      vip: { title: "Membresía VIP", value: "Top 10", description: "Acceso de por vida" },
      bonus: { title: "Premios Semanales", value: "Sorteo", description: "Regalos sorpresa" }
    }
  },
  fr: {
    title: "GAGNEZ DES PRIX!",
    subtitle: "Participez aux concours mensuels et annuels!",
    monthlyContest: "Concours Mensuel",
    yearlyContest: "Concours Annuel",
    monthlyTitle: "Plus de Notes d'Amour",
    monthlyDesc: "Envoyez le plus de notes pour gagner!",
    monthlyPrize: "Carte-cadeau $100",
    yearlyTitle: "Relation la Plus Forte",
    yearlyDesc: "Engagement global",
    yearlyPrize: "Grand Prix $1,000",
    currentStandings: "Classement",
    topContenders: "Top 5",
    leader: "Leader",
    lastMonthWinner: "Gagnant du Mois Dernier",
    howToWin: "Comment Gagner",
    notesThisMonth: "notes ce mois",
    youAreRanked: "Vous êtes classé #",
    notParticipating: "Commencez à envoyer des notes!",
    prizes: {
      premium: { title: "Premium", value: "Niveau 5+", description: "Analytics avancés" },
      exclusive: { title: "Forfaits", value: "Niveau 10+", description: "Bons premium" },
      vip: { title: "VIP", value: "Top 10", description: "Accès à vie" },
      bonus: { title: "Bonus", value: "Tirage", description: "Cadeaux" }
    }
  },
  it: {
    title: "VINCI PREMI!",
    subtitle: "Partecipa ai concorsi!",
    monthlyContest: "Concorso Mensile",
    yearlyContest: "Concorso Annuale",
    monthlyTitle: "Più Note d'Amore",
    monthlyDesc: "Invia più note per vincere!",
    monthlyPrize: "Buono $100",
    yearlyTitle: "Relazione Più Forte",
    yearlyDesc: "Coinvolgimento globale",
    yearlyPrize: "Gran Premio $1,000",
    currentStandings: "Classifica",
    topContenders: "Top 5",
    leader: "Leader",
    lastMonthWinner: "Vincitore Mese Scorso",
    howToWin: "Come Vincere",
    notesThisMonth: "note questo mese",
    youAreRanked: "Sei al #",
    notParticipating: "Inizia a inviare note!",
    prizes: {
      premium: { title: "Premium", value: "Livello 5+", description: "Analytics" },
      exclusive: { title: "Pacchetti", value: "Livello 10+", description: "Voucher" },
      vip: { title: "VIP", value: "Top 10", description: "Accesso vita" },
      bonus: { title: "Bonus", value: "Estrazione", description: "Regali" }
    }
  },
  de: {
    title: "PREISE GEWINNEN!",
    subtitle: "An Wettbewerben teilnehmen!",
    monthlyContest: "Monatlich",
    yearlyContest: "Jährlich",
    monthlyTitle: "Meiste Botschaften",
    monthlyDesc: "Senden Sie die meisten Nachrichten!",
    monthlyPrize: "$100 Karte",
    yearlyTitle: "Stärkste Beziehung",
    yearlyDesc: "Größtes Engagement",
    yearlyPrize: "$1,000 Preis",
    currentStandings: "Rangliste",
    topContenders: "Top 5",
    leader: "Anführer",
    lastMonthWinner: "Gewinner Letzter Monat",
    howToWin: "Wie Gewinnen",
    notesThisMonth: "Nachrichten",
    youAreRanked: "Sie sind Rang #",
    notParticipating: "Nachrichten senden!",
    prizes: {
      premium: { title: "Premium", value: "Level 5+", description: "Analytics" },
      exclusive: { title: "Pakete", value: "Level 10+", description: "Gutscheine" },
      vip: { title: "VIP", value: "Top 10", description: "Lebenslang" },
      bonus: { title: "Bonus", value: "Ziehung", description: "Geschenke" }
    }
  }
};

export default function WinACruise() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [email, setEmail] = useState("");

  const { user: currentUser } = useAuth();

  // Get current period (YYYY-MM format)
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear().toString();

  // Get last month's period
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthPeriod = lastMonth.toISOString().slice(0, 7);

  // Fetch monthly leaderboard
  const { data: monthlyLeaderboard = [] } = useQuery({
    queryKey: ['monthlyLeaderboard', currentPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_participants')
        .select('*')
        .eq('contest_type', 'monthly_love_notes')
        .eq('period', currentPeriod);
      if (error) {
        console.error('Error fetching participants:', error);
        return [];
      }
      const participants = data || [];
      return participants.sort((a, b) => b.score - a.score).slice(0, 5);
    },
    initialData: [],
  });

  // Fetch yearly leaderboard
  const { data: yearlyLeaderboard = [] } = useQuery({
    queryKey: ['yearlyLeaderboard', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_participants')
        .select('*')
        .eq('contest_type', 'yearly_engagement')
        .eq('period', currentYear);
      if (error) {
        console.error('Error fetching participants:', error);
        return [];
      }
      const participants = data || [];
      return participants.sort((a, b) => b.score - a.score).slice(0, 5);
    },
    initialData: [],
  });

  // Fetch last month's winner
  const { data: lastMonthWinner } = useQuery({
    queryKey: ['lastMonthWinner', lastMonthPeriod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contest_winners')
        .select('*')
        .eq('contest_type', 'monthly_love_notes')
        .eq('period', lastMonthPeriod);
      if (error) {
        console.error('Error fetching winners:', error);
        return null;
      }
      const winners = data || [];
      return winners[0] || null;
    },
  });

  // Fetch user's current ranking
  const { data: userMonthlyRank } = useQuery({
    queryKey: ['userMonthlyRank', currentUser?.email, currentPeriod],
    queryFn: async () => {
      if (!currentUser) return null;
      if (!currentUser?.email) return null;
      const { data, error } = await supabase
        .from('contest_participants')
        .select('*')
        .eq('contest_type', 'monthly_love_notes')
        .eq('period', currentPeriod)
        .eq('user_email', currentUser.email);
      if (error) {
        console.error('Error fetching user rank:', error);
        return null;
      }
      const participants = data || [];
      return participants[0] || null;
    },
    enabled: !!currentUser,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("You're now competing for prizes! 🎉");
    setEmail("");
  };

  const monthlyLeader = monthlyLeaderboard[0];
  const yearlyLeader = yearlyLeaderboard[0];

  const prizes = [
    {
      icon: Sparkles,
      title: t.prizes.premium.title,
      value: t.prizes.premium.value,
      description: t.prizes.premium.description,
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Gift,
      title: t.prizes.exclusive.title,
      value: t.prizes.exclusive.value,
      description: t.prizes.exclusive.description,
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Crown,
      title: t.prizes.vip.title,
      value: t.prizes.vip.value,
      description: t.prizes.vip.description,
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: Star,
      title: t.prizes.bonus.title,
      value: t.prizes.bonus.value,
      description: t.prizes.bonus.description,
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl animate-pulse">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-2xl text-gray-700 mb-6 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {lastMonthWinner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-2xl border-4 border-yellow-300">
              <CardContent className="py-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Award className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">{t.lastMonthWinner}</h3>
                </div>
                <div className="text-3xl font-bold mb-1">🏆 {lastMonthWinner.winner_name} 🏆</div>
                <div className="text-lg opacity-90">{lastMonthWinner.final_score} {t.notesThisMonth}</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Monthly Contest */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-2xl h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm opacity-90">{t.monthlyContest}</div>
                      <CardTitle className="text-2xl">{t.monthlyTitle}</CardTitle>
                    </div>
                  </div>
                  <Calendar className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-white/90">{t.monthlyDesc}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">{t.monthlyPrize}</div>
                    <div className="text-sm opacity-90">Monthly Winner</div>
                  </div>
                  {monthlyLeader && (
                    <div className="border-t border-white/30 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">{t.leader}:</span>
                        <span className="font-bold">{monthlyLeader.user_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t.notesThisMonth}:</span>
                        <span className="font-bold">{monthlyLeader.score}</span>
                      </div>
                    </div>
                  )}
                </div>

                {userMonthlyRank && (
                  <div className="bg-white/20 rounded-lg p-4 mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{t.yourRank}:</span>
                      <span className="text-2xl font-bold">#{userMonthlyRank.rank || '?'}</span>
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      {userMonthlyRank.score} {t.notesThisMonth}
                    </div>
                  </div>
                )}

                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="font-bold mb-3">{t.topContenders}</h4>
                  <div className="space-y-2">
                    {monthlyLeaderboard.length > 0 ? (
                      monthlyLeaderboard.map((participant, index) => (
                        <div key={participant.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-6">#{index + 1}</span>
                            {index === 0 && <Crown className="w-4 h-4 text-yellow-300" />}
                            {index === 1 && <Medal className="w-4 h-4 text-gray-300" />}
                            {index === 2 && <Medal className="w-4 h-4 text-orange-400" />}
                            <span>{participant.user_name}</span>
                          </div>
                          <span className="font-semibold">{participant.score}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm opacity-80 text-center">{t.notParticipating}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Yearly Contest */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-2xl h-full">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm opacity-90">{t.yearlyContest}</div>
                      <CardTitle className="text-2xl">{t.yearlyTitle}</CardTitle>
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
                <p className="text-white/90">{t.yearlyDesc}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm mb-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">{t.yearlyPrize}</div>
                    <div className="text-sm opacity-90">Grand Prize Winner</div>
                  </div>
                  {yearlyLeader && (
                    <div className="border-t border-white/30 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">{t.leader}:</span>
                        <span className="font-bold">{yearlyLeader.user_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{t.engagementPoints}:</span>
                        <span className="font-bold">{yearlyLeader.score}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="font-bold mb-3">{t.topContenders}</h4>
                  <div className="space-y-2">
                    {yearlyLeaderboard.length > 0 ? (
                      yearlyLeaderboard.map((participant, index) => (
                        <div key={participant.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-6">#{index + 1}</span>
                            {index === 0 && <Crown className="w-4 h-4 text-yellow-300" />}
                            {index === 1 && <Medal className="w-4 h-4 text-gray-300" />}
                            {index === 2 && <Medal className="w-4 h-4 text-orange-400" />}
                            <span>{participant.user_name}</span>
                          </div>
                          <span className="font-semibold">{participant.score}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm opacity-80 text-center">{t.notParticipating}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <Card className="bg-white shadow-2xl border-4 border-yellow-400">
            <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardTitle className="text-3xl text-center">{t.enterNow}</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t.emailLabel} *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="h-14 text-lg"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-xl py-6 shadow-xl"
                >
                  <Trophy className="w-6 h-6 mr-2" />
                  {t.enterButton}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Additional Rewards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prizes.map((prize, index) => {
              const Icon = prize.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-300">
                    <CardContent className="pt-8">
                      <div className="flex items-start gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${prize.color} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {prize.title}
                            </h3>
                            <div className={`bg-gradient-to-br ${prize.color} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                              {prize.value}
                            </div>
                          </div>
                          <p className="text-gray-600">
                            {prize.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="py-12">
              <Zap className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-4">Start Competing Today!</h3>
              <p className="text-xl mb-6 max-w-2xl mx-auto opacity-90">
                The more you engage and strengthen your relationship, the more chances you have to win!
              </p>
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-xl px-12 py-6 shadow-2xl"
              >
                {t.enterButton}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}