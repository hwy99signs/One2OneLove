import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, Edit, Trash2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    progress: "Progress", targetDate: "Target", actionSteps: "Action Steps", updateProgress: "Update Progress",
    editLabel: "Edit goal", deleteLabel: "Delete goal", completed: "Completed!", daysLeft: "days left", overdue: "days overdue", today: "Due today",
    status: { in_progress: "In Progress", completed: "Completed", paused: "Paused" }
  },
  es: {
    progress: "Progreso", targetDate: "Objetivo", actionSteps: "Pasos de Acción", updateProgress: "Actualizar Progreso",
    editLabel: "Editar meta", deleteLabel: "Eliminar meta", completed: "¡Completada!", daysLeft: "días restantes", overdue: "días de retraso", today: "Vence hoy",
    status: { in_progress: "En Progreso", completed: "Completada", paused: "Pausada" }
  },
  fr: {
    progress: "Progrès", targetDate: "Échéance", actionSteps: "Étapes d’Action", updateProgress: "Mettre à Jour le Progrès",
    editLabel: "Modifier l’objectif", deleteLabel: "Supprimer l’objectif", completed: "Terminé !", daysLeft: "jours restants", overdue: "jours de retard", today: "Échéance aujourd’hui",
    status: { in_progress: "En Cours", completed: "Terminé", paused: "En Pause" }
  },
  it: {
    progress: "Progresso", targetDate: "Scadenza", actionSteps: "Passi d’Azione", updateProgress: "Aggiorna Progresso",
    editLabel: "Modifica obiettivo", deleteLabel: "Elimina obiettivo", completed: "Completato!", daysLeft: "giorni rimanenti", overdue: "giorni di ritardo", today: "Scade oggi",
    status: { in_progress: "In Corso", completed: "Completato", paused: "In Pausa" }
  },
  de: {
    progress: "Fortschritt", targetDate: "Zieldatum", actionSteps: "Aktionsschritte", updateProgress: "Fortschritt Aktualisieren",
    editLabel: "Ziel bearbeiten", deleteLabel: "Ziel löschen", completed: "Abgeschlossen!", daysLeft: "Tage verbleibend", overdue: "Tage überfällig", today: "Heute fällig",
    status: { in_progress: "In Bearbeitung", completed: "Abgeschlossen", paused: "Pausiert" }
  }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

const categoryColors = {
  communication: "from-blue-500 to-cyan-500",
  quality_time: "from-pink-500 to-rose-500",
  intimacy: "from-red-500 to-pink-500",
  personal_growth: "from-green-500 to-emerald-500",
  financial: "from-yellow-500 to-orange-500",
  family: "from-purple-500 to-pink-500",
  health: "from-teal-500 to-green-500",
  adventure: "from-orange-500 to-red-500",
  home: "from-indigo-500 to-purple-500",
  career: "from-gray-500 to-slate-500"
};

function daysFromToday(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function GoalCard({ goal, onEdit, onDelete, onUpdateProgress }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const daysRemaining = daysFromToday(goal.target_date);
  const progress = Math.min(Math.max(Number(goal.progress) || 0, 0), 100);
  const statusLabel = t.status[goal.status] || goal.status || t.status.in_progress;
  const colorClass = categoryColors[goal.category] || categoryColors.communication;
  const targetDateLabel = goal.target_date
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${goal.target_date}T12:00:00`))
    : null;

  let deadlineLabel = targetDateLabel;
  if (goal.status === 'completed') deadlineLabel = t.completed;
  else if (daysRemaining === 0) deadlineLabel = t.today;
  else if (daysRemaining !== null && daysRemaining < 0) deadlineLabel = `${Math.abs(daysRemaining)} ${t.overdue}`;
  else if (daysRemaining !== null) deadlineLabel = `${daysRemaining} ${t.daysLeft}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <Card className="border-2 border-transparent transition-all hover:border-pink-200 hover:shadow-xl">
        <CardHeader>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass} shadow-lg`}>
              <TrendingUp className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" type="button" onClick={() => onEdit(goal)} className="text-gray-400 hover:text-gray-600" aria-label={t.editLabel}>
                <Edit className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" type="button" onClick={() => onDelete(goal.id)} className="text-gray-400 hover:text-red-600" aria-label={t.deleteLabel}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">{goal.title}</CardTitle>
          {goal.description && <p className="mt-2 text-sm text-gray-600">{goal.description}</p>}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={goal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
              {goal.status === 'completed' ? <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" /> : <Clock className="mr-1 h-3 w-3" aria-hidden="true" />}
              {statusLabel}
            </Badge>
            {deadlineLabel && (
              <Badge variant="outline" className={daysRemaining !== null && daysRemaining < 0 && goal.status !== 'completed' ? 'border-red-300 text-red-600' : ''} title={targetDateLabel || undefined}>
                <Calendar className="mr-1 h-3 w-3" aria-hidden="true" />{deadlineLabel}
              </Badge>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t.progress}</span>
              <span className="text-sm font-bold text-pink-600">{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-pink-500 to-purple-600" />
            </div>
          </div>

          {goal.action_steps?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">{t.actionSteps}</p>
              <ul className="space-y-1">
                {goal.action_steps.slice(0, 3).map((step, index) => (
                  <li key={`${step}-${index}`} className="flex items-start gap-2 text-sm text-gray-600"><span className="mt-1 text-pink-500" aria-hidden="true">•</span><span className="flex-1">{step}</span></li>
                ))}
              </ul>
            </div>
          )}

          {goal.status !== 'completed' && (
            <Button type="button" onClick={() => onUpdateProgress(goal)} variant="outline" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" aria-hidden="true" />{t.updateProgress}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
