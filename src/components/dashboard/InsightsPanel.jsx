import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Heart, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/Layout';
import { parseLocalDate } from '@/utils/localDate';

const copy = {
  en:{ title:'Relationship Insights', positive:'Your recent reflections show a lot of positive connection. Keep naming what is working so it does not become invisible.', strain:'Your recent reflections show some strain. Communication Practice or Relationship Goals may give you a constructive place to start.', streak:n=>`You have a ${n}-day activity streak. Consistency matters more than perfection.`, goals:(a,b)=>`You're making progress on ${a} of ${b} active relationship goals.`, memories:n=>`You've captured ${n} memories this month. Your relationship story is growing.` },
  es:{ title:'Perspectivas de la Relación', positive:'Tus reflexiones recientes muestran mucha conexión positiva. Sigue nombrando lo que funciona para que no pase desapercibido.', strain:'Tus reflexiones recientes muestran algo de tensión. Práctica de Comunicación o Metas de Relación pueden darte un punto de partida constructivo.', streak:n=>`Tienes una racha de actividad de ${n} días. La constancia importa más que la perfección.`, goals:(a,b)=>`Estás avanzando en ${a} de ${b} metas activas de relación.`, memories:n=>`Has guardado ${n} recuerdos este mes. La historia de su relación sigue creciendo.` },
  fr:{ title:'Aperçus de la Relation', positive:'Vos réflexions récentes montrent beaucoup de connexion positive. Continuez à nommer ce qui fonctionne pour que cela ne devienne pas invisible.', strain:'Vos réflexions récentes montrent une certaine tension. La Pratique de la Communication ou les Objectifs de Relation peuvent offrir un point de départ constructif.', streak:n=>`Vous avez une série d’activité de ${n} jours. La régularité compte plus que la perfection.`, goals:(a,b)=>`Vous progressez sur ${a} des ${b} objectifs relationnels actifs.`, memories:n=>`Vous avez enregistré ${n} souvenirs ce mois-ci. Votre histoire relationnelle continue de grandir.` },
  it:{ title:'Approfondimenti sulla Relazione', positive:'Le riflessioni recenti mostrano molta connessione positiva. Continuate a riconoscere ciò che funziona, così non diventa invisibile.', strain:'Le riflessioni recenti mostrano un po’ di tensione. Pratica di Comunicazione o Obiettivi di Relazione possono offrire un punto di partenza costruttivo.', streak:n=>`Hai una serie di attività di ${n} giorni. La costanza conta più della perfezione.`, goals:(a,b)=>`Stai facendo progressi su ${a} di ${b} obiettivi di relazione attivi.`, memories:n=>`Hai salvato ${n} ricordi questo mese. La vostra storia di coppia continua a crescere.` },
  de:{ title:'Beziehungs-Einblicke', positive:'Eure jüngsten Reflexionen zeigen viel positive Verbindung. Benennt weiter, was gut funktioniert, damit es nicht unsichtbar wird.', strain:'Eure jüngsten Reflexionen zeigen etwas Belastung. Kommunikationsübungen oder Beziehungsziele können einen konstruktiven Ausgangspunkt bieten.', streak:n=>`Du hast eine Aktivitätsserie von ${n} Tagen. Beständigkeit ist wichtiger als Perfektion.`, goals:(a,b)=>`Du machst bei ${a} von ${b} aktiven Beziehungszielen Fortschritte.`, memories:n=>`Du hast diesen Monat ${n} Erinnerungen festgehalten. Eure Beziehungsgeschichte wächst weiter.` },
};

export default function InsightsPanel({ data }) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;

  const insights = useMemo(() => {
    const result = [];
    const recentJournals = (data.journals || []).slice(0,10);
    const positiveMoods = recentJournals.filter(j => ['happy','grateful','excited','loving','peaceful'].includes(j.mood)).length;

    if (positiveMoods >= 7) {
      result.push({ icon:Heart, color:'text-pink-600', bgColor:'bg-pink-50', insight:t.positive, type:'positive' });
    } else if (positiveMoods <= 4 && recentJournals.length >= 5) {
      result.push({ icon:Brain, color:'text-purple-600', bgColor:'bg-purple-50', insight:t.strain, type:'suggestion' });
    }

    const maxStreak = Math.max(...(data.activityProgress || []).map(p => p.streak_days || 0),0);
    if (maxStreak >= 7) result.push({ icon:Zap, color:'text-orange-600', bgColor:'bg-orange-50', insight:t.streak(maxStreak), type:'achievement' });

    const activeGoals = (data.goals || []).filter(g => g.status === 'in_progress' || g.status === 'in progress');
    const progressingGoals = activeGoals.filter(g => Number(g.progress || 0) > 25);
    if (progressingGoals.length > 0 && activeGoals.length > 0) result.push({ icon:TrendingUp, color:'text-green-600', bgColor:'bg-green-50', insight:t.goals(progressingGoals.length, activeGoals.length), type:'progress' });

    const recentMemories = (data.memories || []).filter(m => {
      const raw = m.created_date || m.created_at || m.memory_date;
      const date = parseLocalDate(raw);
      return Boolean(date) && Math.floor((Date.now() - date.getTime()) / 86400000) <= 30;
    });
    if (recentMemories.length >= 3) result.push({ icon:Heart, color:'text-rose-600', bgColor:'bg-rose-50', insight:t.memories(recentMemories.length), type:'positive' });

    return result.slice(0,3);
  }, [data, t]);

  if (insights.length === 0) return null;

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900"><TrendingUp className="h-6 w-6 text-purple-600"/>{t.title}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight,index) => { const Icon=insight.icon; return <motion.div key={index} initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.2+index*0.05}}><Card className={`${insight.bgColor} border-0`}><CardContent className="p-4"><div className="flex items-start gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}><Icon className={`h-5 w-5 ${insight.color}`}/></div><p className="text-sm leading-relaxed text-gray-700">{insight.insight}</p></div></CardContent></Card></motion.div>; })}
      </div>
    </motion.div>
  );
}
