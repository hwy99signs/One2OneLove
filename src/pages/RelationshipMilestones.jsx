import React, { useState } from "react";
import { Calendar, Heart, Plus, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";
import CelebrationIdeas from "../components/milestones/CelebrationIdeas";
import MilestoneCard from "../components/milestones/MilestoneCard";
import MilestoneForm from "../components/milestones/MilestoneForm";
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  updateMilestone,
} from "@/lib/milestonesService";

const translations = {
  en: {
    title: "Relationship Milestones",
    subtitle: "Keep meaningful relationship dates visible and celebrate the moments that matter to you.",
    add: "Add Milestone",
    upcoming: "Upcoming Celebrations",
    history: "Milestone History",
    empty: "No milestones yet",
    emptyDesc: "Add a meaningful date when you are ready to begin your relationship timeline.",
    ideas: "Celebration Ideas",
    today: "Today!",
    days: "days",
    added: "Milestone added.",
    updated: "Milestone updated.",
    deleted: "Milestone deleted.",
    addError: "We could not add that milestone.",
    updateError: "We could not update that milestone.",
    deleteError: "We could not delete that milestone.",
    deleteConfirm: "Delete this milestone? This cannot be undone.",
    quick: "Keep the Celebration Going",
    quickDesc: "Use another real One2OneLove tool to make the moment intentional.",
    loveNote: "Send a Love Note",
    loveNoteDesc: "Write a private note to your mutually linked partner.",
    dateNight: "Plan a Date Night",
    dateNightDesc: "Make intentional time together around your schedule and preferences.",
  },
  es: {
    title: "Hitos de la Relación",
    subtitle: "Mantengan visibles las fechas significativas y celebren los momentos que importan para ustedes.",
    add: "Agregar Hito",
    upcoming: "Próximas Celebraciones",
    history: "Historia de Hitos",
    empty: "Aún no hay hitos",
    emptyDesc: "Agreguen una fecha significativa cuando estén listos para comenzar su línea de tiempo.",
    ideas: "Ideas de Celebración",
    today: "¡Hoy!",
    days: "días",
    added: "Hito agregado.",
    updated: "Hito actualizado.",
    deleted: "Hito eliminado.",
    addError: "No pudimos agregar ese hito.",
    updateError: "No pudimos actualizar ese hito.",
    deleteError: "No pudimos eliminar ese hito.",
    deleteConfirm: "¿Eliminar este hito? Esta acción no se puede deshacer.",
    quick: "Continúen la Celebración",
    quickDesc: "Usen otra herramienta real de One2OneLove para hacer el momento más intencional.",
    loveNote: "Enviar una Nota de Amor",
    loveNoteDesc: "Escribe una nota privada a tu pareja vinculada mutuamente.",
    dateNight: "Planear una Noche de Cita",
    dateNightDesc: "Creen tiempo intencional juntos según su horario y preferencias.",
  },
  fr: {
    title: "Jalons de la Relation",
    subtitle: "Gardez les dates importantes visibles et célébrez les moments qui comptent pour vous.",
    add: "Ajouter un Jalon",
    upcoming: "Célébrations à Venir",
    history: "Historique des Jalons",
    empty: "Aucun jalon pour le moment",
    emptyDesc: "Ajoutez une date importante lorsque vous êtes prêts à commencer votre chronologie relationnelle.",
    ideas: "Idées de Célébration",
    today: "Aujourd’hui !",
    days: "jours",
    added: "Jalon ajouté.",
    updated: "Jalon mis à jour.",
    deleted: "Jalon supprimé.",
    addError: "Nous n’avons pas pu ajouter ce jalon.",
    updateError: "Nous n’avons pas pu mettre à jour ce jalon.",
    deleteError: "Nous n’avons pas pu supprimer ce jalon.",
    deleteConfirm: "Supprimer ce jalon ? Cette action est irréversible.",
    quick: "Poursuivre la Célébration",
    quickDesc: "Utilisez un autre outil One2OneLove réellement disponible pour rendre ce moment intentionnel.",
    loveNote: "Envoyer une Note d’Amour",
    loveNoteDesc: "Écrivez une note privée à votre partenaire lié réciproquement.",
    dateNight: "Planifier une Soirée",
    dateNightDesc: "Créez du temps intentionnel ensemble selon votre emploi du temps et vos préférences.",
  },
  it: {
    title: "Traguardi della Relazione",
    subtitle: "Tenete visibili le date significative e celebrate i momenti importanti per voi.",
    add: "Aggiungi Traguardo",
    upcoming: "Celebrazioni in Arrivo",
    history: "Storia dei Traguardi",
    empty: "Nessun traguardo per ora",
    emptyDesc: "Aggiungete una data significativa quando siete pronti a iniziare la vostra cronologia di coppia.",
    ideas: "Idee per la Celebrazione",
    today: "Oggi!",
    days: "giorni",
    added: "Traguardo aggiunto.",
    updated: "Traguardo aggiornato.",
    deleted: "Traguardo eliminato.",
    addError: "Non è stato possibile aggiungere quel traguardo.",
    updateError: "Non è stato possibile aggiornare quel traguardo.",
    deleteError: "Non è stato possibile eliminare quel traguardo.",
    deleteConfirm: "Eliminare questo traguardo? L’azione non può essere annullata.",
    quick: "Continuate la Celebrazione",
    quickDesc: "Usate un altro strumento One2OneLove realmente disponibile per rendere il momento intenzionale.",
    loveNote: "Invia una Nota d’Amore",
    loveNoteDesc: "Scrivi una nota privata al partner collegato reciprocamente.",
    dateNight: "Pianifica una Serata di Coppia",
    dateNightDesc: "Create tempo intenzionale insieme in base al vostro programma e alle preferenze.",
  },
  de: {
    title: "Beziehungsmeilensteine",
    subtitle: "Haltet wichtige Beziehungsdaten sichtbar und feiert die Momente, die für euch Bedeutung haben.",
    add: "Meilenstein Hinzufügen",
    upcoming: "Bevorstehende Feiern",
    history: "Meilenstein-Verlauf",
    empty: "Noch keine Meilensteine",
    emptyDesc: "Fügt ein wichtiges Datum hinzu, sobald ihr eure Beziehungszeitlinie beginnen möchtet.",
    ideas: "Feier-Ideen",
    today: "Heute!",
    days: "Tage",
    added: "Meilenstein hinzugefügt.",
    updated: "Meilenstein aktualisiert.",
    deleted: "Meilenstein gelöscht.",
    addError: "Dieser Meilenstein konnte nicht hinzugefügt werden.",
    updateError: "Dieser Meilenstein konnte nicht aktualisiert werden.",
    deleteError: "Dieser Meilenstein konnte nicht gelöscht werden.",
    deleteConfirm: "Diesen Meilenstein löschen? Dies kann nicht rückgängig gemacht werden.",
    quick: "Die Feier Fortsetzen",
    quickDesc: "Nutzt ein weiteres tatsächlich verfügbares One2OneLove-Werkzeug, um den Moment bewusst zu gestalten.",
    loveNote: "Liebesbotschaft Senden",
    loveNoteDesc: "Schreibt eine private Nachricht an euren gegenseitig verknüpften Partner.",
    dateNight: "Date Night Planen",
    dateNightDesc: "Schafft bewusste gemeinsame Zeit passend zu eurem Zeitplan und euren Vorlieben.",
  },
};

function toLocalDate(value) {
  return new Date(`${String(value).slice(0, 10)}T12:00:00`);
}

function daysUntil(value) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.ceil((toLocalDate(value).getTime() - today.getTime()) / 86400000);
}

function nextRecurringDate(value) {
  const original = toLocalDate(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate(), 12);
  if (next < today) next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate(), 12);
  return next.toISOString().slice(0, 10);
}

export default function RelationshipMilestones() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones"],
    queryFn: () => getMilestones("-date"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: createMilestone,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setShowForm(false);
      setEditingMilestone(null);
      toast.success(t.added);
    },
    onError: () => toast.error(t.addError),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMilestone(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["milestones"] });
      setShowForm(false);
      setEditingMilestone(null);
      toast.success(t.updated);
    },
    onError: () => toast.error(t.updateError),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["milestones"] });
      toast.success(t.deleted);
    },
    onError: () => toast.error(t.deleteError),
  });

  const displayMilestones = milestones.map((milestone) => ({
    ...milestone,
    displayDate: milestone.is_recurring ? nextRecurringDate(milestone.date) : milestone.date,
  }));

  const upcomingMilestones = displayMilestones
    .filter((milestone) => {
      const remaining = daysUntil(milestone.displayDate);
      return remaining >= 0 && remaining <= 60;
    })
    .sort((a, b) => daysUntil(a.displayDate) - daysUntil(b.displayDate));

  const historyMilestones = milestones
    .filter((milestone) => milestone.is_recurring || daysUntil(milestone.date) < 0)
    .sort((a, b) => toLocalDate(b.date) - toLocalDate(a.date));

  const openNew = () => {
    setEditingMilestone(null);
    setShowForm(true);
  };

  const editMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setShowForm(true);
  };

  const removeMilestone = (id) => {
    if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl">
            <Heart className="h-10 w-10 fill-current" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <Button type="button" onClick={openNew} className="mt-6 bg-gradient-to-r from-pink-500 to-purple-600">
            <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
            {t.add}
          </Button>
        </header>

        <AnimatePresence>
          {showForm && (
            <div className="mt-8">
              <MilestoneForm
                milestone={editingMilestone}
                onSubmit={(data) => {
                  if (editingMilestone) updateMutation.mutate({ id: editingMilestone.id, data });
                  else createMutation.mutate(data);
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingMilestone(null);
                }}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </div>
          )}
        </AnimatePresence>

        {upcomingMilestones.length > 0 && (
          <section className="mt-12" aria-labelledby="upcoming-milestones-heading">
            <h2 id="upcoming-milestones-heading" className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <Calendar className="h-6 w-6 text-pink-600" aria-hidden="true" />
              {t.upcoming}
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMilestones.map((milestone) => {
                const remaining = daysUntil(milestone.displayDate);
                return (
                  <motion.article key={milestone.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-pink-700">{remaining === 0 ? t.today : `${remaining} ${t.days}`}</span>
                      <Sparkles className="h-5 w-5 text-purple-500" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{milestone.title}</h3>
                    {milestone.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{milestone.description}</p>}
                    <Button type="button" onClick={() => setSelectedMilestone(milestone)} className="mt-5 w-full" variant="outline">
                      <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t.ideas}
                    </Button>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}

        {historyMilestones.length > 0 && (
          <section className="mt-12" aria-labelledby="milestone-history-heading">
            <h2 id="milestone-history-heading" className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <Heart className="h-6 w-6 text-purple-600" aria-hidden="true" />
              {t.history}
            </h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {historyMilestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={editMilestone}
                  onDelete={removeMilestone}
                  onCelebrate={() => setSelectedMilestone(milestone)}
                />
              ))}
            </div>
          </section>
        )}

        {!showForm && milestones.length === 0 && (
          <section className="py-20 text-center">
            <Heart className="mx-auto h-20 w-20 text-slate-300" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-bold text-slate-700">{t.empty}</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500">{t.emptyDesc}</p>
            <Button type="button" onClick={openNew} className="mt-6">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.add}
            </Button>
          </section>
        )}

        {milestones.length > 0 && (
          <section className="mt-14 rounded-3xl bg-gradient-to-r from-pink-600 to-purple-600 p-8 text-white shadow-xl md:p-10">
            <h2 className="text-2xl font-bold">{t.quick}</h2>
            <p className="mt-2 max-w-2xl text-white/90">{t.quickDesc}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Link to="/LoveNotes" className="rounded-2xl bg-white/15 p-5 transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Heart className="h-6 w-6" aria-hidden="true" />
                <h3 className="mt-3 font-bold">{t.loveNote}</h3>
                <p className="mt-1 text-sm text-white/90">{t.loveNoteDesc}</p>
              </Link>
              <Link to="/DateNight" className="rounded-2xl bg-white/15 p-5 transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Calendar className="h-6 w-6" aria-hidden="true" />
                <h3 className="mt-3 font-bold">{t.dateNight}</h3>
                <p className="mt-1 text-sm text-white/90">{t.dateNightDesc}</p>
              </Link>
            </div>
          </section>
        )}

        <AnimatePresence>
          {selectedMilestone && (
            <CelebrationIdeas milestone={selectedMilestone} onClose={() => setSelectedMilestone(null)} />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
