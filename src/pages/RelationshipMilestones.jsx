
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Calendar, Sparkles, Gift, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import MilestoneForm from "../components/milestones/MilestoneForm";
import MilestoneCard from "../components/milestones/MilestoneCard";
import CelebrationIdeas from "../components/milestones/CelebrationIdeas";
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from "@/lib/milestonesService";

const translations = {
  en: {
    title: "Relationship Milestones & Anniversaries",
    subtitle: "Celebrate and remember the special moments that define your love story. Never miss an important date!",
    addMilestone: "Add Milestone",
    noMilestones: "No Milestones Yet",
    noMilestonesDesc: "Start documenting your beautiful journey together by adding your first milestone!",
    upcoming: "Upcoming Celebrations",
    past: "Your Love Story Timeline",
    celebrationIdeas: "Celebration Ideas",
    days: "days",
    today: "Today!",
    milestoneAdded: "Milestone added successfully! 💕",
    milestoneUpdated: "Milestone updated successfully! ✨",
    milestoneDeleted: "Milestone deleted",
    errorAdding: "Error adding milestone",
    errorUpdating: "Error updating milestone",
    errorDeleting: "Error deleting milestone",
    quickActions: "Quick Celebration Actions",
    quickActionsSubtitle: "Make your special days unforgettable",
    sendLoveNote: "Send Love Note",
    sendLoveNoteDesc: "Express your feelings with a heartfelt message",
    browseDateIdeas: "Browse Date Ideas",
    browseDateIdeasDesc: "Find inspiration for romantic dates",
    shopGifts: "Gift Suggestions",
    shopGiftsDesc: "Thoughtful presents for your loved one",
    back: "Back",
  },
  es: {
    title: "Hitos de la Relación y Aniversarios",
    subtitle: "Celebra y recuerda los momentos especiales que definen tu historia de amor. ¡No te pierdas ninguna fecha importante!",
    addMilestone: "Agregar Hito",
    noMilestones: "Aún No Hay Hitos",
    noMilestonesDesc: "¡Comienza a documentar tu hermoso viaje juntos agregando tu primer hito!",
    upcoming: "Celebraciones Próximas",
    past: "Línea de Tiempo de Tu Historia de Amor",
    celebrationIdeas: "Ideas de Celebración",
    days: "días",
    today: "¡Hoy!",
    milestoneAdded: "¡Hito agregado exitosamente! 💕",
    milestoneUpdated: "¡Hito actualizado exitosamente! ✨",
    milestoneDeleted: "Hito eliminado",
    errorAdding: "Error al agregar hito",
    errorUpdating: "Error al actualizar hito",
    errorDeleting: "Error al eliminar hito",
    quickActions: "Acciones Rápidas de Celebración",
    quickActionsSubtitle: "Haz tus días especiales inolvidables",
    sendLoveNote: "Enviar Nota de Amor",
    sendLoveNoteDesc: "Expresa tus sentimientos con un mensaje sincero",
    browseDateIdeas: "Explorar Ideas de Citas",
    browseDateIdeasDesc: "Encuentra inspiración para citas románticas",
    shopGifts: "Sugerencias de Regalos",
    shopGiftsDesc: "Regalos considerados para tu ser querido",
    back: "Volver",
  },
  fr: {
    title: "Jalons de la Relation et Anniversaires",
    subtitle: "Célébrez et souvenez-vous des moments spéciaux qui définissent votre histoire d'amour. Ne manquez jamais une date importante!",
    addMilestone: "Ajouter un Jalon",
    noMilestones: "Pas Encore de Jalons",
    noMilestonesDesc: "Commencez à documenter votre beau voyage ensemble en ajoutant votre premier jalon!",
    upcoming: "Célébrations à Venir",
    past: "Chronologie de Votre Histoire d'Amour",
    celebrationIdeas: "Idées de Célébration",
    days: "jours",
    today: "Aujourd'hui!",
    milestoneAdded: "Jalon ajouté avec succès! 💕",
    milestoneUpdated: "Jalon mis à jour avec succès! ✨",
    milestoneDeleted: "Jalon supprimé",
    errorAdding: "Erreur lors de l'ajout du jalon",
    errorUpdating: "Erreur lors de la mise à jour du jalon",
    errorDeleting: "Erreur lors de la suppression du jalon",
    quickActions: "Actions Rapides de Célébration",
    quickActionsSubtitle: "Rendez vos jours spéciaux inoubliables",
    sendLoveNote: "Envoyer Note d'Amour",
    sendLoveNoteDesc: "Exprimez vos sentiments avec un message sincère",
    browseDateIdeas: "Parcourir Idées de Rendez-vous",
    browseDateIdeasDesc: "Trouvez l'inspiration pour des rendez-vous romantiques",
    shopGifts: "Suggestions de Cadeaux",
    shopGiftsDesc: "Cadeaux attentionnés pour votre bien-aimé(e)",
    back: "Retour",
  },
  it: {
    title: "Traguardi della Relazione e Anniversari",
    subtitle: "Celebra e ricorda i momenti speciali che definiscono la tua storia d'amore. Non perdere mai una data importante!",
    addMilestone: "Aggiungi Traguardo",
    noMilestones: "Nessun Traguardo Ancora",
    noMilestonesDesc: "Inizia a documentare il tuo bellissimo viaggio insieme aggiungendo il tuo primo traguardo!",
    upcoming: "Celebrazioni in Arrivo",
    past: "Cronologia della Tua Storia d'Amore",
    celebrationIdeas: "Idee per la Celebrazione",
    days: "giorni",
    today: "Oggi!",
    milestoneAdded: "Traguardo aggiunto con successo! 💕",
    milestoneUpdated: "Traguardo aggiornato con successo! ✨",
    milestoneDeleted: "Traguardo eliminato",
    errorAdding: "Errore nell'aggiunta del traguardo",
    errorUpdating: "Errore nell'aggiornamento del traguardo",
    errorDeleting: "Errore nell'eliminazione del traguardo",
    quickActions: "Azioni Rapide per la Celebrazione",
    quickActionsSubtitle: "Rendi i tuoi giorni speciali indimenticabili",
    sendLoveNote: "Invia Nota d'Amore",
    sendLoveNoteDesc: "Esprimi i tuoi sentimenti con un messaggio sincero",
    browseDateIdeas: "Sfoglia Idee per Appuntamenti",
    browseDateIdeasDesc: "Trova ispirazione per appuntamenti romantici",
    shopGifts: "Suggerimenti per Regali",
    shopGiftsDesc: "Regali premurosi per la persona amata",
    back: "Indietro",
  },
  de: {
    title: "Beziehungs-Meilensteine & Jahrestage",
    subtitle: "Feiere und erinnere dich an die besonderen Momente, die eure Liebesgeschichte ausmachen. Verpasse nie ein wichtiges Datum!",
    addMilestone: "Meilenstein Hinzufügen",
    noMilestones: "Noch Keine Meilensteine",
    noMilestonesDesc: "Beginne, eure wundervolle gemeinsame Reise zu dokumentieren, indem du deinen ersten Meilenstein hinzufügst!",
    upcoming: "Bevorstehende Feiern",
    past: "Eure Liebesgeschichte-Zeitlinie",
    celebrationIdeas: "Feier-Ideen",
    days: "Tage",
    today: "Heute!",
    milestoneAdded: "Meilenstein erfolgreich hinzugefügt! 💕",
    milestoneUpdated: "Meilenstein erfolgreich aktualisiert! ✨",
    milestoneDeleted: "Meilenstein gelöscht",
    errorAdding: "Fehler beim Hinzufügen des Meilensteins",
    errorUpdating: "Fehler beim Aktualisieren des Meilensteins",
    errorDeleting: "Fehler beim Löschen des Meilensteins",
    quickActions: "Schnelle Feier-Aktionen",
    quickActionsSubtitle: "Mach deine besonderen Tage unvergesslich",
    sendLoveNote: "Liebesbotschaft Senden",
    sendLoveNoteDesc: "Drücke deine Gefühle mit einer herzlichen Nachricht aus",
    browseDateIdeas: "Date-Ideen Durchsuchen",
    browseDateIdeasDesc: "Finde Inspiration für romantische Dates",
    shopGifts: "Geschenkvorschläge",
    shopGiftsDesc: "Durchdachte Geschenke für deine Liebsten",
    back: "Zurück",
  }
};

export default function RelationshipMilestones() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => getMilestones('-date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => createMilestone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setShowForm(false);
      setEditingMilestone(null);
      toast.success(t.milestoneAdded);
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error(t.errorAdding);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setShowForm(false);
      setEditingMilestone(null);
      toast.success(t.milestoneUpdated);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(t.errorUpdating);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      toast.success(t.milestoneDeleted);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(t.errorDeleting);
    }
  });

  const handleSubmit = (data) => {
    if (editingMilestone) {
      updateMutation.mutate({ id: editingMilestone.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      deleteMutation.mutate(id);
    }
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const milestoneDate = new Date(date);
    milestoneDate.setHours(0, 0, 0, 0);
    const diffTime = milestoneDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getNextAnniversary = (originalDate) => {
    const today = new Date();
    const original = new Date(originalDate);
    const thisYear = new Date(today.getFullYear(), original.getMonth(), original.getDate());
    
    if (thisYear < today) {
      return new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
    }
    return thisYear;
  };

  const upcomingMilestones = milestones
    .map(m => {
      if (m.is_recurring) {
        const nextDate = getNextAnniversary(m.date);
        return { ...m, displayDate: nextDate.toISOString().split('T')[0] };
      }
      return { ...m, displayDate: m.date };
    })
    .filter(m => {
      const days = getDaysUntil(m.displayDate);
      return days >= 0 && days <= 60;
    })
    .sort((a, b) => getDaysUntil(a.displayDate) - getDaysUntil(b.displayDate));

  const pastMilestones = milestones
    .filter(m => !m.is_recurring && getDaysUntil(m.date) < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-dancing">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {t.subtitle}
          </p>
          <Button
            onClick={() => {
              setEditingMilestone(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.addMilestone}
          </Button>
        </motion.div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <MilestoneForm
              milestone={editingMilestone}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMilestone(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Upcoming Celebrations */}
        {upcomingMilestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-pink-600" />
              <h2 className="text-3xl font-bold text-gray-900">{t.upcoming}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMilestones.map((milestone) => {
                const daysUntil = getDaysUntil(milestone.displayDate);
                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl p-6 border-2 shadow-lg ${
                      daysUntil === 0 
                        ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 animate-pulse' 
                        : 'bg-gradient-to-br from-pink-100 to-purple-100 border-pink-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-semibold ${
                        daysUntil === 0 ? 'text-orange-700' : 'text-pink-700'
                      }`}>
                        {daysUntil === 0 ? `🎉 ${t.today}` : `${daysUntil} ${t.days}`}
                      </span>
                      <Sparkles className={`w-5 h-5 ${
                        daysUntil === 0 ? 'text-yellow-500' : 'text-purple-500'
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{milestone.description}</p>
                    <Button
                      onClick={() => setSelectedMilestone(milestone)}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t.celebrationIdeas}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Past Milestones */}
        {pastMilestones.length > 0 || milestones.filter(m => m.is_recurring).length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900">{t.past}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...milestones.filter(m => m.is_recurring), ...pastMilestones].map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCelebrate={() => setSelectedMilestone(milestone)}
                />
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Empty State */}
        {!showForm && milestones.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-600 mb-3">{t.noMilestones}</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              {t.noMilestonesDesc}
            </p>
          </motion.div>
        )}

        {/* Quick Actions Section */}
        {milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl"
          >
            <Gift className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">
              {t.quickActions}
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t.quickActionsSubtitle}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <Link to={createPageUrl("LoveNotes")}>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer">
                  <Heart className="w-8 h-8 mb-3 fill-current" />
                  <h3 className="font-bold text-lg mb-2">{t.sendLoveNote}</h3>
                  <p className="text-sm opacity-90">{t.sendLoveNoteDesc}</p>
                </div>
              </Link>
              <Link to={createPageUrl("DateIdeas")}>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer">
                  <Calendar className="w-8 h-8 mb-3" />
                  <h3 className="font-bold text-lg mb-2">{t.browseDateIdeas}</h3>
                  <p className="text-sm opacity-90">{t.browseDateIdeasDesc}</p>
                </div>
              </Link>
              <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm hover:bg-white/30 transition-all cursor-pointer"
                   onClick={() => selectedMilestone && setSelectedMilestone(upcomingMilestones[0] || milestones[0])}>
                <Gift className="w-8 h-8 mb-3" />
                <h3 className="font-bold text-lg mb-2">{t.shopGifts}</h3>
                <p className="text-sm opacity-90">{t.shopGiftsDesc}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Celebration Ideas Modal */}
        <AnimatePresence>
          {selectedMilestone && (
            <CelebrationIdeas
              milestone={selectedMilestone}
              onClose={() => setSelectedMilestone(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
