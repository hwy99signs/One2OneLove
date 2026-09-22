import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, Edit, Trash2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    progress: "Progress",
    targetDate: "Target",
    status: {
      in_progress: "In Progress",
      completed: "Completed",
      paused: "Paused"
    },
    actionSteps: "Action Steps",
    edit: "Edit",
    delete: "Delete",
    updateProgress: "Update Progress",
    daysOverdue: "days overdue",
    daysLeft: "days left"
  },
  es: {
    progress: "Progreso",
    targetDate: "Objetivo",
    status: {
      in_progress: "En Progreso",
      completed: "Completado",
      paused: "Pausado"
    },
    actionSteps: "Pasos de Acción",
    edit: "Editar",
    delete: "Eliminar",
    updateProgress: "Actualizar Progreso",
    daysOverdue: "días de retraso",
    daysLeft: "días restantes"
  },
  fr: {
    progress: "Progrès",
    targetDate: "Cible",
    status: {
      in_progress: "En Cours",
      completed: "Terminé",
      paused: "En Pause"
    },
    actionSteps: "Étapes d'Action",
    edit: "Modifier",
    delete: "Supprimer",
    updateProgress: "Mettre à Jour le Progrès",
    daysOverdue: "jours de retard",
    daysLeft: "jours restants"
  },
  it: {
    progress: "Progresso",
    targetDate: "Obiettivo",
    status: {
      in_progress: "In Corso",
      completed: "Completato",
      paused: "In Pausa"
    },
    actionSteps: "Passi d'Azione",
    edit: "Modifica",
    delete: "Elimina",
    updateProgress: "Aggiorna Progresso",
    daysOverdue: "giorni di ritardo",
    daysLeft: "giorni rimasti"
  },
  de: {
    progress: "Fortschritt",
    targetDate: "Ziel",
    status: {
      in_progress: "In Bearbeitung",
      completed: "Abgeschlossen",
      paused: "Pausiert"
    },
    actionSteps: "Aktionsschritte",
    edit: "Bearbeiten",
    delete: "Löschen",
    updateProgress: "Fortschritt Aktualisieren",
    daysOverdue: "Tage überfällig",
    daysLeft: "Tage übrig"
  }
};

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

export default function GoalCard({ goal, onEdit, onDelete, onUpdateProgress }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const getDaysRemaining = () => {
    const today = new Date();
    const target = new Date(`${goal.target_date}T00:00:00`);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isOverdue = daysRemaining < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-200">
        <CardHeader>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${categoryColors[goal.category]} rounded-xl flex items-center justify-center shadow-lg`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(goal)}
                aria-label={`${t.edit}: ${goal.title}`}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(goal.id)}
                aria-label={`${t.delete}: ${goal.title}`}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {goal.title}
          </CardTitle>
          {goal.description && (
            <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={goal.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
              {goal.status === 'completed' ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {t.status[goal.status]}
            </Badge>
            <Badge variant="outline" className={isOverdue ? 'text-red-600 border-red-300' : ''}>
              <Calendar className="w-3 h-3 mr-1" />
              {isOverdue ? `${Math.abs(daysRemaining)} ${t.daysOverdue}` : `${daysRemaining} ${t.daysLeft}`}
            </Badge>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t.progress}</span>
              <span className="text-sm font-bold text-pink-600">{goal.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
              />
            </div>
          </div>

          {goal.action_steps && goal.action_steps.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t.actionSteps}</p>
              <ul className="space-y-1">
                {goal.action_steps.slice(0, 3).map((step, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {goal.status !== 'completed' && (
            <Button
              onClick={() => onUpdateProgress(goal)}
              variant="outline"
              className="w-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {t.updateProgress}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}