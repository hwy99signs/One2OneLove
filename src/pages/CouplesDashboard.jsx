import React, { useMemo } from 'react';
import { Heart, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import * as journalService from '@/lib/journalService';
import * as goalsService from '@/lib/goalsService';
import * as milestonesService from '@/lib/milestonesService';
import { listMemories } from '@/lib/memoryService';
import { getActivityProgress } from '@/lib/activityService';
import MetricsOverview from '../components/dashboard/MetricsOverview';
import UpcomingActivities from '../components/dashboard/UpcomingActivities';
import MilestoneCelebration from '../components/dashboard/MilestoneCelebration';
import InsightsPanel from '../components/dashboard/InsightsPanel';

const copy = {
  en:{ welcome:'Welcome back', subtitle:'Your relationship journey at a glance', metrics:'Your Relationship Activity', upcoming:'Recommended Next Steps' },
  es:{ welcome:'Bienvenido de nuevo', subtitle:'Tu recorrido de relación de un vistazo', metrics:'Actividad de Tu Relación', upcoming:'Próximos Pasos Recomendados' },
  fr:{ welcome:'Bon retour', subtitle:'Votre parcours relationnel en un coup d’œil', metrics:'Activité de Votre Relation', upcoming:'Prochaines Étapes Recommandées' },
  it:{ welcome:'Bentornato', subtitle:'Il tuo percorso di relazione a colpo d’occhio', metrics:'Attività della Tua Relazione', upcoming:'Prossimi Passi Consigliati' },
  de:{ welcome:'Willkommen zurück', subtitle:'Deine Beziehungsreise auf einen Blick', metrics:'Deine Beziehungsaktivität', upcoming:'Empfohlene Nächste Schritte' },
};

export default function CouplesDashboard() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const { user } = useAuth();

  const { data: activityProgress = [] } = useQuery({ queryKey:['activityProgress'], queryFn:async () => user?.id ? getActivityProgress() : [], enabled:!!user?.id });
  const { data: goals = [] } = useQuery({ queryKey:['goals'], queryFn:() => goalsService.getGoals('-created_at') });
  const { data: milestones = [] } = useQuery({ queryKey:['milestones'], queryFn:() => milestonesService.getMilestones('-created_at') });
  const { data: journals = [] } = useQuery({ queryKey:['journals'], queryFn:() => journalService.getJournalEntries('-entry_date') });
  const { data: memories = [] } = useQuery({ queryKey:['memories'], queryFn:async () => user?.id ? listMemories(user.id) : [], enabled:!!user?.id });

  const allData = useMemo(() => ({ activityProgress, goals, milestones, journals, memories }), [activityProgress, goals, milestones, journals, memories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
          <div className="flex items-center justify-between gap-4"><div><h1 className="text-4xl font-black text-gray-900 md:text-5xl">{t.welcome}{user?.name ? `, ${user.name}` : ''}! 💕</h1><p className="mt-2 text-xl text-gray-600">{t.subtitle}</p></div><div className="hidden h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl md:flex"><Heart className="h-10 w-10 fill-white text-white"/></div></div>
        </motion.div>

        <MilestoneCelebration milestones={allData.milestones}/>
        <InsightsPanel data={allData}/>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="mb-8"><h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><TrendingUp className="h-6 w-6 text-purple-600"/>{t.metrics}</h2><MetricsOverview data={allData}/></motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}><h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><Sparkles className="h-6 w-6 text-purple-600"/>{t.upcoming}</h2><UpcomingActivities data={allData}/></motion.div>
      </div>
    </div>
  );
}
