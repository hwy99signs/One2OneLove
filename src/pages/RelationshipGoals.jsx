import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import goalsService from "@/lib/goalsService";
import GoalForm from "../components/goals/GoalForm";
import GoalCard from "../components/goals/GoalCard";
import ProgressUpdateModal from "../components/goals/ProgressUpdateModal";

const translations = {
  en: {
    title: "Relationship Goals", subtitle: "Set meaningful goals together and track your journey to a stronger relationship", addGoal: "Add New Goal",
    activeGoals: "Active Goals", completedGoals: "Completed Goals", noActiveGoals: "No Active Goals", noActiveGoalsDesc: "Start setting goals to strengthen your relationship!",
    noCompletedGoals: "No Completed Goals Yet", noCompletedGoalsDesc: "Keep working on your goals—you’ll see them here when completed!", backToSupport: "Back to Support", loading: "Loading relationship goals...",
    goalAdded: "Goal added successfully! 💕", goalUpdated: "Goal updated successfully! ✨", goalDeleted: "Goal deleted", createError: "We could not create the goal.", updateError: "We could not update the goal.", deleteError: "We could not delete the goal.", deleteConfirm: "Delete this relationship goal? This cannot be undone.",
    stats: { totalGoals: "Total Goals", completed: "Completed", avgProgress: "Avg Progress" }
  },
  es: {
    title: "Metas de Relación", subtitle: "Establezcan metas significativas juntos y sigan su camino hacia una relación más fuerte", addGoal: "Agregar Nueva Meta",
    activeGoals: "Metas Activas", completedGoals: "Metas Completadas", noActiveGoals: "Sin Metas Activas", noActiveGoalsDesc: "¡Comiencen a establecer metas para fortalecer su relación!",
    noCompletedGoals: "Sin Metas Completadas Aún", noCompletedGoalsDesc: "Sigan trabajando en sus metas; aparecerán aquí cuando estén completadas.", backToSupport: "Volver al Soporte", loading: "Cargando metas de relación...",
    goalAdded: "¡Meta agregada exitosamente! 💕", goalUpdated: "¡Meta actualizada exitosamente! ✨", goalDeleted: "Meta eliminada", createError: "No pudimos crear la meta.", updateError: "No pudimos actualizar la meta.", deleteError: "No pudimos eliminar la meta.", deleteConfirm: "¿Eliminar esta meta de relación? Esta acción no se puede deshacer.",
    stats: { totalGoals: "Metas Totales", completed: "Completadas", avgProgress: "Progreso Promedio" }
  },
  fr: {
    title: "Objectifs de Relation", subtitle: "Fixez des objectifs significatifs ensemble et suivez votre parcours vers une relation plus forte", addGoal: "Ajouter un Nouvel Objectif",
    activeGoals: "Objectifs Actifs", completedGoals: "Objectifs Terminés", noActiveGoals: "Aucun Objectif Actif", noActiveGoalsDesc: "Commencez à fixer des objectifs pour renforcer votre relation !",
    noCompletedGoals: "Aucun Objectif Terminé", noCompletedGoalsDesc: "Continuez à avancer sur vos objectifs ; ils apparaîtront ici une fois terminés.", backToSupport: "Retour au Soutien", loading: "Chargement des objectifs relationnels...",
    goalAdded: "Objectif ajouté avec succès ! 💕", goalUpdated: "Objectif mis à jour avec succès ! ✨", goalDeleted: "Objectif supprimé", createError: "Nous n’avons pas pu créer l’objectif.", updateError: "Nous n’avons pas pu mettre à jour l’objectif.", deleteError: "Nous n’avons pas pu supprimer l’objectif.", deleteConfirm: "Supprimer cet objectif relationnel ? Cette action est irréversible.",
    stats: { totalGoals: "Objectifs Totaux", completed: "Terminés", avgProgress: "Progrès Moyen" }
  },
  it: {
    title: "Obiettivi di Relazione", subtitle: "Stabilite obiettivi significativi insieme e seguite il percorso verso una relazione più forte", addGoal: "Aggiungi Nuovo Obiettivo",
    activeGoals: "Obiettivi Attivi", completedGoals: "Obiettivi Completati", noActiveGoals: "Nessun Obiettivo Attivo", noActiveGoalsDesc: "Iniziate a stabilire obiettivi per rafforzare la relazione!",
    noCompletedGoals: "Nessun Obiettivo Completato", noCompletedGoalsDesc: "Continuate a lavorare sui vostri obiettivi; appariranno qui quando saranno completati.", backToSupport: "Torna al Supporto", loading: "Caricamento degli obiettivi di relazione...",
    goalAdded: "Obiettivo aggiunto con successo! 💕", goalUpdated: "Obiettivo aggiornato con successo! ✨", goalDeleted: "Obiettivo eliminato", createError: "Non è stato possibile creare l’obiettivo.", updateError: "Non è stato possibile aggiornare l’obiettivo.", deleteError: "Non è stato possibile eliminare l’obiettivo.", deleteConfirm: "Eliminare questo obiettivo di relazione? L’azione non può essere annullata.",
    stats: { totalGoals: "Obiettivi Totali", completed: "Completati", avgProgress: "Progresso Medio" }
  },
  de: {
    title: "Beziehungsziele", subtitle: "Setzt gemeinsam bedeutungsvolle Ziele und verfolgt euren Weg zu einer stärkeren Beziehung", addGoal: "Neues Ziel Hinzufügen",
    activeGoals: "Aktive Ziele", completedGoals: "Abgeschlossene Ziele", noActiveGoals: "Keine Aktiven Ziele", noActiveGoalsDesc: "Beginnt mit gemeinsamen Zielen, die eure Beziehung stärken.",
    noCompletedGoals: "Noch Keine Abgeschlossenen Ziele", noCompletedGoalsDesc: "Arbeitet weiter an euren Zielen; abgeschlossene Ziele erscheinen hier.", backToSupport: "Zurück zur Unterstützung", loading: "Beziehungsziele werden geladen...",
    goalAdded: "Ziel erfolgreich hinzugefügt! 💕", goalUpdated: "Ziel erfolgreich aktualisiert! ✨", goalDeleted: "Ziel gelöscht", createError: "Das Ziel konnte nicht erstellt werden.", updateError: "Das Ziel konnte nicht aktualisiert werden.", deleteError: "Das Ziel konnte nicht gelöscht werden.", deleteConfirm: "Dieses Beziehungsziel löschen? Dies kann nicht rückgängig gemacht werden.",
    stats: { totalGoals: "Ziele Gesamt", completed: "Abgeschlossen", avgProgress: "Durchschn. Fortschritt" }
  }
};

export default function RelationshipGoals() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [updatingGoal, setUpdatingGoal] = useState(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['relationship-goals'],
    queryFn: () => goalsService.getGoals('-created_at'),
    initialData: [],
  });

  const refreshGoals = () => queryClient.invalidateQueries({ queryKey: ['relationship-goals'] });

  const createMutation = useMutation({
    mutationFn: (data) => goalsService.createGoal(data),
    onSuccess: () => {
      refreshGoals();
      setShowForm(false);
      setEditingGoal(null);
      toast.success(t.goalAdded);
    },
    onError: () => toast.error(t.createError),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => goalsService.updateGoal(id, data),
    onSuccess: () => {
      refreshGoals();
      setShowForm(false);
      setEditingGoal(null);
      setUpdatingGoal(null);
      toast.success(t.goalUpdated);
    },
    onError: () => toast.error(t.updateError),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => goalsService.deleteGoal(id),
    onSuccess: () => {
      refreshGoals();
      toast.success(t.goalDeleted);
    },
    onError: () => toast.error(t.deleteError),
  });

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status !== 'completed'), [goals]);
  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === 'completed'), [goals]);
  const stats = useMemo(() => {
    const totalProgress = goals.reduce((sum, goal) => sum + (Number(goal.progress) || 0), 0);
    return {
      total: goals.length,
      completed: completedGoals.length,
      avgProgress: goals.length ? Math.round(totalProgress / goals.length) : 0,
    };
  }, [goals, completedGoals.length]);

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(id);
  };

  const openNewGoal = () => {
    setEditingGoal(null);
    setShowForm(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link to={createPageUrl("CoupleSupport")} className="mb-6 inline-flex items-center rounded-xl px-4 py-2 text-gray-600 transition-all hover:bg-purple-50 hover:text-purple-600">
          <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />{t.backToSupport}
        </Link>

        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Target className="h-10 w-10 text-white" aria-hidden="true" /></div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mb-6 max-w-3xl text-lg text-gray-600 md:text-xl">{t.subtitle}</p>
          <Button type="button" onClick={openNewGoal} className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-6 text-lg text-white shadow-xl hover:from-pink-600 hover:to-purple-700">
            <Plus className="mr-2 h-5 w-5" aria-hidden="true" />{t.addGoal}
          </Button>
        </motion.header>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-600" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.loading}</div>
        ) : (
          <>
            {goals.length > 0 && (
              <section className="mb-12 grid gap-6 md:grid-cols-3" aria-label={t.title}>
                <div className="rounded-2xl bg-white p-6 text-center shadow-lg"><TrendingUp className="mx-auto mb-2 h-8 w-8 text-blue-600" aria-hidden="true" /><div className="mb-1 text-3xl font-bold text-gray-900">{stats.total}</div><div className="text-sm text-gray-600">{t.stats.totalGoals}</div></div>
                <div className="rounded-2xl bg-white p-6 text-center shadow-lg"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" aria-hidden="true" /><div className="mb-1 text-3xl font-bold text-gray-900">{stats.completed}</div><div className="text-sm text-gray-600">{t.stats.completed}</div></div>
                <div className="rounded-2xl bg-white p-6 text-center shadow-lg"><Target className="mx-auto mb-2 h-8 w-8 text-purple-600" aria-hidden="true" /><div className="mb-1 text-3xl font-bold text-gray-900">{stats.avgProgress}%</div><div className="text-sm text-gray-600">{t.stats.avgProgress}</div></div>
              </section>
            )}

            {activeGoals.length > 0 && (
              <section className="mb-12" aria-labelledby="active-goals-heading">
                <h2 id="active-goals-heading" className="mb-6 flex items-center gap-3 text-3xl font-bold text-gray-900"><TrendingUp className="h-8 w-8 text-pink-600" aria-hidden="true" />{t.activeGoals}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={(selected) => { setEditingGoal(selected); setShowForm(true); }} onDelete={handleDelete} onUpdateProgress={setUpdatingGoal} />)}
                </div>
              </section>
            )}

            {completedGoals.length > 0 && (
              <section className="mb-12" aria-labelledby="completed-goals-heading">
                <h2 id="completed-goals-heading" className="mb-6 flex items-center gap-3 text-3xl font-bold text-gray-900"><CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />{t.completedGoals}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {completedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={(selected) => { setEditingGoal(selected); setShowForm(true); }} onDelete={handleDelete} onUpdateProgress={setUpdatingGoal} />)}
                </div>
              </section>
            )}

            {goals.length === 0 && !showForm && (
              <div className="py-16 text-center"><Target className="mx-auto mb-6 h-24 w-24 text-gray-300" aria-hidden="true" /><h2 className="mb-3 text-2xl font-bold text-gray-600">{t.noActiveGoals}</h2><p className="mx-auto max-w-md text-lg text-gray-500">{t.noActiveGoalsDesc}</p></div>
            )}
          </>
        )}

        <AnimatePresence>
          {showForm && <GoalForm goal={editingGoal} onSubmit={(data) => editingGoal ? updateMutation.mutate({ id: editingGoal.id, data }) : createMutation.mutate(data)} onCancel={() => { setShowForm(false); setEditingGoal(null); }} isLoading={createMutation.isPending || updateMutation.isPending} />}
        </AnimatePresence>

        <AnimatePresence>
          {updatingGoal && <ProgressUpdateModal goal={updatingGoal} onUpdate={(data) => updateMutation.mutate({ id: updatingGoal.id, data })} onCancel={() => setUpdatingGoal(null)} isLoading={updateMutation.isPending} />}
        </AnimatePresence>
      </div>
    </main>
  );
}
