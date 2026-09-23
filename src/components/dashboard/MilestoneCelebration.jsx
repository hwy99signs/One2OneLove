import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PartyPopper, Gift, Calendar, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from '@/Layout';
import { calendarDayDifference, parseLocalDate } from '@/utils/localDate';

const copy = {
  en:{ today:'🎉 TODAY!', tomorrow:'Tomorrow', inDays:n=>`In ${n} days`, celebrate:'Celebrate Now! 🎊', plan:'Plan Celebration' },
  es:{ today:'🎉 ¡HOY!', tomorrow:'Mañana', inDays:n=>`En ${n} días`, celebrate:'¡Celebrar Ahora! 🎊', plan:'Planear Celebración' },
  fr:{ today:'🎉 AUJOURD’HUI !', tomorrow:'Demain', inDays:n=>`Dans ${n} jours`, celebrate:'Célébrer Maintenant ! 🎊', plan:'Préparer la Célébration' },
  it:{ today:'🎉 OGGI!', tomorrow:'Domani', inDays:n=>`Tra ${n} giorni`, celebrate:'Festeggia Ora! 🎊', plan:'Pianifica la Celebrazione' },
  de:{ today:'🎉 HEUTE!', tomorrow:'Morgen', inDays:n=>`In ${n} Tagen`, celebrate:'Jetzt Feiern! 🎊', plan:'Feier Planen' },
};

const localeByLanguage = { en:'en-US', es:'es-ES', fr:'fr-FR', it:'it-IT', de:'de-DE' };

export default function MilestoneCelebration({ milestones }) {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const locale = localeByLanguage[currentLanguage] || localeByLanguage.en;

  const upcomingMilestone = useMemo(() => {
    const upcoming = milestones
      .filter(m => {
        const diff = calendarDayDifference(m.date);
        return diff !== null && diff >= 0 && diff <= 7;
      })
      .sort((a, b) => (parseLocalDate(a.date)?.getTime() || 0) - (parseLocalDate(b.date)?.getTime() || 0));
    return upcoming[0] || null;
  }, [milestones]);

  if (!upcomingMilestone) return null;

  const milestoneDate = parseLocalDate(upcomingMilestone.date);
  const daysUntil = calendarDayDifference(upcomingMilestone.date);
  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const whenLabel = isToday ? t.today : isTomorrow ? t.tomorrow : t.inDays(daysUntil);
  const formattedDate = new Intl.DateTimeFormat(locale, { year:'numeric', month:'long', day:'numeric' }).format(milestoneDate);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="mb-8">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
          <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <CardContent className="relative z-10 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  {isToday ? <PartyPopper className="h-8 w-8 text-white" /> : <Gift className="h-8 w-8 text-white" />}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2"><Calendar className="h-5 w-5"/><span className="text-sm font-semibold opacity-90">{whenLabel}</span></div>
                  <h3 className="mb-2 text-2xl font-bold md:text-3xl">{upcomingMilestone.title}</h3>
                  <p data-dashboard-milestone-date={upcomingMilestone.date} className="mb-1 text-white/90">{formattedDate}</p>
                  {upcomingMilestone.description && <p className="max-w-2xl text-sm text-white/80">{upcomingMilestone.description}</p>}
                </div>
              </div>
              <Link to={createPageUrl("RelationshipMilestones")}>
                <Button size="lg" className="bg-white font-semibold text-purple-600 shadow-xl hover:bg-white/90">{isToday ? t.celebrate : t.plan}<ArrowRight className="ml-2 h-5 w-5"/></Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
