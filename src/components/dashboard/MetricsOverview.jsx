import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Heart, BookOpen, Target, Calendar, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MetricsOverview({ data }) {
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
    { icon: Flame, label: 'Current Streak', value: metrics.maxStreak, suffix: 'days', color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-50' },
    { icon: Heart, label: 'Activities Done', value: metrics.totalActivities, suffix: 'total', color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50' },
    { icon: Target, label: 'Active Goals', value: metrics.activeGoals, suffix: 'goals', color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50' },
    { icon: Camera, label: 'Memories', value: metrics.memories, suffix: 'saved', color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50' },
    { icon: BookOpen, label: 'Journal Entries', value: metrics.journalEntries, suffix: 'entries', color: 'from-purple-500 to-indigo-600', bgColor: 'bg-purple-50' },
    { icon: Calendar, label: 'Upcoming Milestones', value: metrics.upcomingMilestones, suffix: 'next 30 days', color: 'from-amber-500 to-yellow-600', bgColor: 'bg-amber-50' },
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
