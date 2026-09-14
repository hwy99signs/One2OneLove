import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Heart, BookOpen, Target, Calendar, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';

const copy = {
  en:{ streak:'Current Streak', days:'days', activities:'Activities Done', total:'total', goals:'Active Goals', goalsSuffix:'goals', memories:'Memories', saved:'saved', journals:'Journal Entries', entries:'entries', milestones:'Upcoming Milestones', next30:'next 30 days' },
  es:{ streak:'Racha Actual', days:'días', activities:'Actividades Completadas', total:'total', goals:'Metas Activas', goalsSuffix:'metas', memories:'Recuerdos', saved:'guardados', journals:'Entradas de Diario', entries:'entradas', milestones:'Hitos Próximos', next30:'próximos 30 días' },
  fr:{ streak:'Série Actuelle', days:'jours', activities:'Activités Terminées', total:'total', goals:'Objectifs Actifs', goalsSuffix:'objectifs', memories:'Souvenirs', saved:'enregistrés', journals:'Entrées du Journal', entries:'entrées', milestones:'Jalons à Venir', next30:'30 prochains jours' },
  it:{ streak:'Serie Attuale', days:'giorni', activities:'Attività Completate', total:'totale', goals:'Obiettivi Attivi', goalsSuffix:'obiettivi', memories:'Ricordi', saved:'salvati', journals:'Voci del Diario', entries:'voci', milestones:'Traguardi in Arrivo', next30:'prossimi 30 giorni' },
  de:{ streak:'Aktuelle Serie', days:'Tage', activities:'Erledigte Aktivitäten', total:'gesamt', goals:'Aktive Ziele', goalsSuffix:'Ziele', memories:'Erinnerungen', saved:'gespeichert', journals:'Journaleinträge', entries:'Einträge', milestones:'Bevorstehende Meilensteine', next30:'nächste 30 Tage' },
};

export default function MetricsOverview({ data }) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;

  const metrics = useMemo(() => {
    const maxStreak = Math.max(...(data.activityProgress || []).map(p => p.streak_days || 0), 0);
    const completedGoals = (data.goals || []).filter(g => g.status === 'completed').length;
    const totalActivities = (data.journals || []).length + (data.memories || []).length + completedGoals;
    const activeGoals = (data.goals || []).filter(g => g.status === 'in_progress' || g.status === 'in progress').length;
    const upcomingMilestones = (data.milestones || []).filter(m => {
      const rawDate = m.date || m.milestone_date;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return false;
      const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 30;
    }).length;
    return {
      maxStreak,
      totalActivities,
      activeGoals,
      upcomingMilestones,
      journalEntries: (data.journals || []).length,
      memories: (data.memories || []).length,
    };
  }, [data]);

  const metricCards = [
    { icon: Flame, label: t.streak, value: metrics.maxStreak, suffix: t.days, color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-50' },
    { icon: Heart, label: t.activities, value: metrics.totalActivities, suffix: t.total, color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50' },
    { icon: Target, label: t.goals, value: metrics.activeGoals, suffix: t.goalsSuffix, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50' },
    { icon: Camera, label: t.memories, value: metrics.memories, suffix: t.saved, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50' },
    { icon: BookOpen, label: t.journals, value: metrics.journalEntries, suffix: t.entries, color: 'from-purple-500 to-indigo-600', bgColor: 'bg-purple-50' },
    { icon: Calendar, label: t.milestones, value: metrics.upcomingMilestones, suffix: t.next30, color: 'from-amber-500 to-yellow-600', bgColor: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {metricCards.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div key={metric.label} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:index * 0.05 }}>
            <Card className={`${metric.bgColor} border-0 shadow-lg transition-shadow hover:shadow-xl`}>
              <CardContent className="p-4">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${metric.color}`}><Icon className="h-5 w-5 text-white"/></div>
                <div className="mb-1 text-3xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-xs font-medium text-gray-600">{metric.label}</div>
                <div className="mt-1 text-xs text-gray-500">{metric.suffix}</div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
