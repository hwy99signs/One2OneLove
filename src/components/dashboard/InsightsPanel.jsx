import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Heart, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InsightsPanel({ data }) {
  const insights = useMemo(() => {
    const result = [];
    const recentJournals = (data.journals || []).slice(0,10);
    const positiveMoods = recentJournals.filter(j => ['happy','grateful','excited','loving','peaceful'].includes(j.mood)).length;

    if (positiveMoods >= 7) {
      result.push({ icon:Heart, color:'text-pink-600', bgColor:'bg-pink-50', insight:'Your recent reflections show a lot of positive connection. Keep naming what is working so it does not become invisible.', type:'positive' });
    } else if (positiveMoods <= 4 && recentJournals.length >= 5) {
      result.push({ icon:Brain, color:'text-purple-600', bgColor:'bg-purple-50', insight:'Your recent reflections show some strain. Communication Practice or Relationship Goals may give you a constructive place to start.', type:'suggestion' });
    }

    const maxStreak = Math.max(...(data.activityProgress || []).map(p => p.streak_days || 0),0);
    if (maxStreak >= 7) result.push({ icon:Zap, color:'text-orange-600', bgColor:'bg-orange-50', insight:`You have a ${maxStreak}-day activity streak. Consistency matters more than perfection.`, type:'achievement' });

    const activeGoals = (data.goals || []).filter(g => g.status === 'in_progress' || g.status === 'in progress');
    const progressingGoals = activeGoals.filter(g => Number(g.progress || 0) > 25);
    if (progressingGoals.length > 0 && activeGoals.length > 0) result.push({ icon:TrendingUp, color:'text-green-600', bgColor:'bg-green-50', insight:`You're making progress on ${progressingGoals.length} of ${activeGoals.length} active relationship goals.`, type:'progress' });

    const recentMemories = (data.memories || []).filter(m => {
      const raw = m.created_date || m.created_at || m.memory_date;
      const date = new Date(raw);
      return !Number.isNaN(date.getTime()) && Math.floor((Date.now() - date.getTime()) / 86400000) <= 30;
    });
    if (recentMemories.length >= 3) result.push({ icon:Heart, color:'text-rose-600', bgColor:'bg-rose-50', insight:`You've captured ${recentMemories.length} memories this month. Your relationship story is growing.`, type:'positive' });

    return result.slice(0,3);
  }, [data]);

  if (insights.length === 0) return null;

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><TrendingUp className="h-6 w-6 text-purple-600"/>Relationship Insights</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight,index) => { const Icon=insight.icon; return <motion.div key={index} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.2+index*0.05}}><Card className={`${insight.bgColor} border-0`}><CardContent className="p-4"><div className="flex items-start gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}><Icon className={`h-5 w-5 ${insight.color}`}/></div><p className="text-sm leading-relaxed text-gray-700">{insight.insight}</p></div></CardContent></Card></motion.div>; })}
      </div>
    </motion.div>
  );
}
