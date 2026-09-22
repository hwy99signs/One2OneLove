import React, { useState, useEffect } from "react";
import { Heart, Calendar, Plus, Edit2, Trash2, Gift, PartyPopper, Cake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from "@/lib/milestonesService";

const translations = {
  en: {
    title: "Anniversary Tracker",
    subtitle: "Never miss an important date! Track your relationship milestones and celebrate together",
    addMilestone: "Add Milestone",
    editMilestone: "Edit Milestone",
    addNewMilestone: "Add New Milestone",
    titleLabel: "Title",
    titlePlaceholder: "e.g., Our Anniversary",
    dateLabel: "Date",
    typeLabel: "Type",
    notesLabel: "Notes (optional)",
    notesPlaceholder: "Add any special notes...",
    cancel: "Cancel",
    update: "Update",
    add: "Add",
    milestone: "Milestone",
    noMilestones: "No milestones yet",
    startTracking: "Start tracking your special moments together",
    addFirstMilestone: "Add Your First Milestone",
    milestoneAdded: "Milestone added! 🎉",
    milestoneUpdated: "Milestone updated! 💕",
    milestoneDeleted: "Milestone deleted",
    loadError: "Unable to load milestones.", saveError: "Unable to save milestone.", deleteError: "Unable to delete milestone.", deleteConfirm: "Are you sure you want to delete this milestone?", editAction: "Edit milestone", deleteAction: "Delete milestone",
    fillRequired: "Please fill in all required fields",
    passed: "Passed",
    today: "Today!",
    yearsAway: "year(s) away",
    monthsAway: "month(s) away",
    daysAway: "day(s) away",
    celebrationIdeas: "Celebration Ideas",
    celebrationSubtitle: "Make your special days unforgettable with thoughtful gestures, romantic dates, and meaningful celebrations",
    sendLoveNotes: "Send Love Notes",
    sendLoveNotesDesc: "Express your feelings with a heartfelt message",
    planDate: "Plan a Date",
    planDateDesc: "Browse our date ideas for inspiration",
    giveGift: "Give a Gift",
    giveGiftDesc: "Show your love with a thoughtful present",
    milestoneTypes: {
      anniversary: "Anniversary",
      firstDate: "First Date",
      firstKiss: "First Kiss",
      birthday: "Birthday",
      special: "Special Event"
    }
  },
  es: {
    title: "Rastreador de Aniversarios",
    subtitle: "¡No te pierdas ninguna fecha importante! Rastrea tus hitos de relación y celebra juntos",
    addMilestone: "Agregar Hito",
    editMilestone: "Editar Hito",
    addNewMilestone: "Agregar Nuevo Hito",
    titleLabel: "Título",
    titlePlaceholder: "p.ej., Nuestro Aniversario",
    dateLabel: "Fecha",
    typeLabel: "Tipo",
    notesLabel: "Notas (opcional)",
    notesPlaceholder: "Agrega notas especiales...",
    cancel: "Cancelar",
    update: "Actualizar",
    add: "Agregar",
    milestone: "Hito",
    noMilestones: "No hay hitos todavía",
    startTracking: "Comienza a rastrear tus momentos especiales juntos",
    addFirstMilestone: "Agrega Tu Primer Hito",
    milestoneAdded: "¡Hito agregado! 🎉",
    milestoneUpdated: "¡Hito actualizado! 💕",
    milestoneDeleted: "Hito eliminado",
    loadError: "No se pudieron cargar los hitos.", saveError: "No se pudo guardar el hito.", deleteError: "No se pudo eliminar el hito.", deleteConfirm: "¿Seguro que quieres eliminar este hito?", editAction: "Editar hito", deleteAction: "Eliminar hito",
    fillRequired: "Por favor completa todos los campos requeridos",
    passed: "Pasado",
    today: "¡Hoy!",
    yearsAway: "año(s) restantes",
    monthsAway: "mes(es) restantes",
    daysAway: "día(s) restantes",
    celebrationIdeas: "Ideas de Celebración",
    celebrationSubtitle: "Haz tus días especiales inolvidables con gestos reflexivos, citas románticas y celebraciones significativas",
    sendLoveNotes: "Enviar Notas de Amor",
    sendLoveNotesDesc: "Expresa tus sentimientos con un mensaje sincero",
    planDate: "Planear una Cita",
    planDateDesc: "Navega por nuestras ideas de citas para inspiración",
    giveGift: "Dar un Regalo",
    giveGiftDesc: "Muestra tu amor con un regalo considerado",
    milestoneTypes: {
      anniversary: "Aniversario",
      firstDate: "Primera Cita",
      firstKiss: "Primer Beso",
      birthday: "Cumpleaños",
      special: "Evento Especial"
    }
  },
  fr: {
    title: "Suivi des Anniversaires",
    subtitle: "Ne manquez jamais une date importante! Suivez vos jalons relationnels et célébrez ensemble",
    addMilestone: "Ajouter un Jalon",
    editMilestone: "Modifier le Jalon",
    addNewMilestone: "Ajouter un Nouveau Jalon",
    titleLabel: "Titre",
    titlePlaceholder: "par ex., Notre Anniversaire",
    dateLabel: "Date",
    typeLabel: "Type",
    notesLabel: "Notes (facultatif)",
    notesPlaceholder: "Ajoutez des notes spéciales...",
    cancel: "Annuler",
    update: "Mettre à jour",
    add: "Ajouter",
    milestone: "Jalon",
    noMilestones: "Pas encore de jalons",
    startTracking: "Commencez à suivre vos moments spéciaux ensemble",
    addFirstMilestone: "Ajoutez Votre Premier Jalon",
    milestoneAdded: "Jalon ajouté! 🎉",
    milestoneUpdated: "Jalon mis à jour! 💕",
    milestoneDeleted: "Jalon supprimé",
    loadError: "Impossible de charger les jalons.", saveError: "Impossible d’enregistrer le jalon.", deleteError: "Impossible de supprimer le jalon.", deleteConfirm: "Voulez-vous vraiment supprimer ce jalon ?", editAction: "Modifier le jalon", deleteAction: "Supprimer le jalon",
    fillRequired: "Veuillez remplir tous les champs obligatoires",
    passed: "Passé",
    today: "Aujourd'hui!",
    yearsAway: "an(s) restants",
    monthsAway: "mois restants",
    daysAway: "jour(s) restants",
    celebrationIdeas: "Idées de Célébration",
    celebrationSubtitle: "Rendez vos journées spéciales inoubliables avec des gestes attentionnés, des rendez-vous romantiques et des célébrations significatives",
    sendLoveNotes: "Envoyer des Notes d'Amour",
    sendLoveNotesDesc: "Exprimez vos sentiments avec un message sincère",
    planDate: "Planifier un Rendez-vous",
    planDateDesc: "Parcourez nos idées de rendez-vous pour inspiration",
    giveGift: "Offrir un Cadeau",
    giveGiftDesc: "Montrez votre amour avec un cadeau attentionné",
    milestoneTypes: {
      anniversary: "Anniversaire",
      firstDate: "Premier Rendez-vous",
      firstKiss: "Premier Baiser",
      birthday: "Anniversaire",
      special: "Événement Spécial"
    }
  },
  it: {
    title: "Tracker Anniversari",
    subtitle: "Non perdere mai una data importante! Traccia i tuoi traguardi di relazione e celebra insieme",
    addMilestone: "Aggiungi Traguardo",
    editMilestone: "Modifica Traguardo",
    addNewMilestone: "Aggiungi Nuovo Traguardo",
    titleLabel: "Titolo",
    titlePlaceholder: "es., Il Nostro Anniversario",
    dateLabel: "Data",
    typeLabel: "Tipo",
    notesLabel: "Note (facoltativo)",
    notesPlaceholder: "Aggiungi note speciali...",
    cancel: "Annulla",
    update: "Aggiorna",
    add: "Aggiungi",
    milestone: "Traguardo",
    noMilestones: "Nessun traguardo ancora",
    startTracking: "Inizia a tracciare i tuoi momenti speciali insieme",
    addFirstMilestone: "Aggiungi Il Tuo Primo Traguardo",
    milestoneAdded: "Traguardo aggiunto! 🎉",
    milestoneUpdated: "Traguardo aggiornato! 💕",
    milestoneDeleted: "Traguardo eliminato",
    loadError: "Impossibile caricare i traguardi.", saveError: "Impossibile salvare il traguardo.", deleteError: "Impossibile eliminare il traguardo.", deleteConfirm: "Vuoi davvero eliminare questo traguardo?", editAction: "Modifica traguardo", deleteAction: "Elimina traguardo",
    fillRequired: "Per favore compila tutti i campi obbligatori",
    passed: "Passato",
    today: "Oggi!",
    yearsAway: "anno/i rimanenti",
    monthsAway: "mese/i rimanenti",
    daysAway: "giorno/i rimanenti",
    celebrationIdeas: "Idee per Celebrazioni",
    celebrationSubtitle: "Rendi i tuoi giorni speciali indimenticabili con gesti premurosi, appuntamenti romantici e celebrazioni significative",
    sendLoveNotes: "Invia Note d'Amore",
    sendLoveNotesDesc: "Esprimi i tuoi sentimenti con un messaggio sincero",
    planDate: "Pianifica un Appuntamento",
    planDateDesc: "Sfoglia le nostre idee per appuntamenti per ispirazione",
    giveGift: "Fai un Regalo",
    giveGiftDesc: "Mostra il tuo amore con un regalo premuroso",
    milestoneTypes: {
      anniversary: "Anniversario",
      firstDate: "Primo Appuntamento",
      firstKiss: "Primo Bacio",
      birthday: "Compleanno",
      special: "Evento Speciale"
    }
  },
  de: {
    title: "Jahrestags-Tracker",
    subtitle: "Verpassen Sie nie ein wichtiges Datum! Verfolgen Sie Ihre Beziehungsmeilensteine und feiern Sie zusammen",
    addMilestone: "Meilenstein Hinzufügen",
    editMilestone: "Meilenstein Bearbeiten",
    addNewMilestone: "Neuen Meilenstein Hinzufügen",
    titleLabel: "Titel",
    titlePlaceholder: "z.B., Unser Jahrestag",
    dateLabel: "Datum",
    typeLabel: "Typ",
    notesLabel: "Notizen (optional)",
    notesPlaceholder: "Besondere Notizen hinzufügen...",
    cancel: "Abbrechen",
    update: "Aktualisieren",
    add: "Hinzufügen",
    milestone: "Meilenstein",
    noMilestones: "Noch keine Meilensteine",
    startTracking: "Beginnen Sie, Ihre besonderen Momente gemeinsam zu verfolgen",
    addFirstMilestone: "Fügen Sie Ihren Ersten Meilenstein Hinzu",
    milestoneAdded: "Meilenstein hinzugefügt! 🎉",
    milestoneUpdated: "Meilenstein aktualisiert! 💕",
    milestoneDeleted: "Meilenstein gelöscht",
    loadError: "Meilensteine konnten nicht geladen werden.", saveError: "Meilenstein konnte nicht gespeichert werden.", deleteError: "Meilenstein konnte nicht gelöscht werden.", deleteConfirm: "Möchten Sie diesen Meilenstein wirklich löschen?", editAction: "Meilenstein bearbeiten", deleteAction: "Meilenstein löschen",
    fillRequired: "Bitte füllen Sie alle erforderlichen Felder aus",
    passed: "Vergangen",
    today: "Heute!",
    yearsAway: "Jahr(e) entfernt",
    monthsAway: "Monat(e) entfernt",
    daysAway: "Tag(e) entfernt",
    celebrationIdeas: "Feier-Ideen",
    celebrationSubtitle: "Machen Sie Ihre besonderen Tage unvergesslich mit durchdachten Gesten, romantischen Dates und bedeutungsvollen Feiern",
    sendLoveNotes: "Liebesbotschaften Senden",
    sendLoveNotesDesc: "Drücken Sie Ihre Gefühle mit einer herzlichen Nachricht aus",
    planDate: "Ein Date Planen",
    planDateDesc: "Durchsuchen Sie unsere Date-Ideen für Inspiration",
    giveGift: "Ein Geschenk Geben",
    giveGiftDesc: "Zeigen Sie Ihre Liebe mit einem durchdachten Geschenk",
    milestoneTypes: {
      anniversary: "Jahrestag",
      firstDate: "Erstes Date",
      firstKiss: "Erster Kuss",
      birthday: "Geburtstag",
      special: "Besonderes Ereignis"
    }
  },
  nl: {
    title: "Jubileum Tracker",
    subtitle: "Mis nooit een belangrijke datum! Volg je relatiejubilea en vier samen",
    addMilestone: "Mijlpaal Toevoegen",
    editMilestone: "Mijlpaal Bewerken",
    addNewMilestone: "Nieuwe Mijlpaal Toevoegen",
    titleLabel: "Titel",
    titlePlaceholder: "bijv., Ons Jubileum",
    dateLabel: "Datum",
    typeLabel: "Type",
    notesLabel: "Notities (optioneel)",
    notesPlaceholder: "Voeg speciale notities toe...",
    cancel: "Annuleren",
    update: "Bijwerken",
    add: "Toevoegen",
    milestone: "Mijlpaal",
    noMilestones: "Nog geen mijlpalen",
    startTracking: "Begin met het volgen van je speciale momenten samen",
    addFirstMilestone: "Voeg Je Eerste Mijlpaal Toe",
    milestoneAdded: "Mijlpaal toegevoegd! 🎉",
    milestoneUpdated: "Mijlpaal bijgewerkt! 💕",
    milestoneDeleted: "Mijlpaal verwijderd",
    fillRequired: "Vul alle verplichte velden in",
    passed: "Voorbij",
    today: "Vandaag!",
    yearsAway: "jaar verwijderd",
    monthsAway: "maanden verwijderd",
    daysAway: "dagen verwijderd",
    celebrationIdeas: "Viering Ideeën",
    celebrationSubtitle: "Maak je speciale dagen onvergetelijk met doordachte gebaren, romantische dates en betekenisvolle vieringen",
    sendLoveNotes: "Stuur Liefdebriefjes",
    sendLoveNotesDesc: "Druk je gevoelens uit met een oprecht bericht",
    planDate: "Plan een Date",
    planDateDesc: "Blader door onze date-ideeën voor inspiratie",
    giveGift: "Geef een Cadeau",
    giveGiftDesc: "Toon je liefde met een doordacht cadeau",
    milestoneTypes: {
      anniversary: "Jubileum",
      firstDate: "Eerste Date",
      firstKiss: "Eerste Kus",
      birthday: "Verjaardag",
      special: "Speciaal Evenement"
    }
  },
  pt: {
    title: "Rastreador de Aniversários",
    subtitle: "Nunca perca uma data importante! Rastreie seus marcos de relacionamento e celebre juntos",
    addMilestone: "Adicionar Marco",
    editMilestone: "Editar Marco",
    addNewMilestone: "Adicionar Novo Marco",
    titleLabel: "Título",
    titlePlaceholder: "ex., Nosso Aniversário",
    dateLabel: "Data",
    typeLabel: "Tipo",
    notesLabel: "Notas (opcional)",
    notesPlaceholder: "Adicione notas especiais...",
    cancel: "Cancelar",
    update: "Atualizar",
    add: "Adicionar",
    milestone: "Marco",
    noMilestones: "Nenhum marco ainda",
    startTracking: "Comece a rastrear seus momentos especiais juntos",
    addFirstMilestone: "Adicione Seu Primeiro Marco",
    milestoneAdded: "Marco adicionado! 🎉",
    milestoneUpdated: "Marco atualizado! 💕",
    milestoneDeleted: "Marco excluído",
    fillRequired: "Por favor, preencha todos os campos obrigatórios",
    passed: "Passou",
    today: "Hoje!",
    yearsAway: "ano(s) restantes",
    monthsAway: "mês(es) restantes",
    daysAway: "dia(s) restantes",
    celebrationIdeas: "Ideias de Celebração",
    celebrationSubtitle: "Torne seus dias especiais inesquecíveis com gestos atenciosos, encontros românticos e celebrações significativas",
    sendLoveNotes: "Enviar Notas de Amor",
    sendLoveNotesDesc: "Expresse seus sentimentos com uma mensagem sincera",
    planDate: "Planejar um Encontro",
    planDateDesc: "Navegue por nossas ideias de encontros para inspiração",
    giveGift: "Dar um Presente",
    giveGiftDesc: "Mostre seu amor com um presente atencioso",
    milestoneTypes: {
      anniversary: "Aniversário",
      firstDate: "Primeiro Encontro",
      firstKiss: "Primeiro Beijo",
      birthday: "Aniversário",
      special: "Evento Especial"
    }
  }
};

export default function AnniversaryTracker() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const localDate = (value) => new Date(`${String(value || '').slice(0, 10)}T00:00:00`);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'anniversary',
    notes: ''
  });

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setMilestones([]);
      return undefined;
    }

    getMilestones('date')
      .then((rows) => {
        if (cancelled) return;
        setMilestones((rows || []).map((milestone) => ({
          ...milestone,
          type: milestone.milestone_type,
          notes: milestone.description || ''
        })));
      })
      .catch((error) => {
        if (!cancelled) toast.error(currentLanguage === 'en' ? (error?.message || t.loadError) : t.loadError);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  const milestoneTypes = [
    { id: 'anniversary', label: t.milestoneTypes.anniversary, icon: Heart, color: 'from-pink-500 to-rose-600' },
    { id: 'first_date', label: t.milestoneTypes.firstDate, icon: Calendar, color: 'from-purple-500 to-pink-600' },
    { id: 'first_kiss', label: t.milestoneTypes.firstKiss, icon: Heart, color: 'from-red-500 to-pink-600' },
    { id: 'birthday', label: t.milestoneTypes.birthday, icon: Cake, color: 'from-yellow-500 to-orange-600' },
    { id: 'special', label: t.milestoneTypes.special, icon: Star, color: 'from-blue-500 to-cyan-600' }
  ];

  const calculateTimeUntil = (date) => {
    const now = new Date();
    const target = localDate(date);
    const diff = target - now;

    if (diff < 0) {
      return { passed: true, text: t.passed };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
      return { passed: false, text: `${years} ${t.yearsAway}` };
    } else if (months > 0) {
      return { passed: false, text: `${months} ${t.monthsAway}` };
    } else if (days > 0) {
      return { passed: false, text: `${days} ${t.daysAway}` };
    } else {
      return { passed: false, text: t.today };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error(t.fillRequired);
      return;
    }

    const payload = {
      title: formData.title,
      date: formData.date,
      milestone_type: formData.type,
      description: formData.notes || null,
      is_recurring: ['anniversary', 'birthday'].includes(formData.type),
      reminder_enabled: true,
      reminder_days_before: 7
    };

    try {
      if (editingId) {
        const saved = await updateMilestone(editingId, payload);
        setMilestones((current) => current.map((m) => m.id === editingId
          ? { ...saved, type: saved.milestone_type, notes: saved.description || '' }
          : m));
        toast.success(t.milestoneUpdated);
      } else {
        const saved = await createMilestone(payload);
        setMilestones((current) => [...current, { ...saved, type: saved.milestone_type, notes: saved.description || '' }]);
        toast.success(t.milestoneAdded);
      }

      setFormData({ title: '', date: '', type: 'anniversary', notes: '' });
      setShowAddForm(false);
      setEditingId(null);
    } catch (error) {
      toast.error(currentLanguage === 'en' ? (error?.message || t.saveError) : t.saveError);
    }
  };

  const handleEdit = (milestone) => {
    setFormData({
      title: milestone.title || '',
      date: String(milestone.date || '').slice(0, 10),
      type: milestone.milestone_type || milestone.type || 'anniversary',
      notes: milestone.description || milestone.notes || ''
    });
    setEditingId(milestone.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.deleteConfirm || translations.en.deleteConfirm)) return;
    try {
      await deleteMilestone(id);
      setMilestones((current) => current.filter((m) => m.id !== id));
      toast.success(t.milestoneDeleted);
    } catch (error) {
      toast.error(currentLanguage === 'en' ? (error?.message || t.deleteError) : t.deleteError);
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => localDate(a.date) - localDate(b.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Add Button */}
        <div className="mb-8 flex justify-center">
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setFormData({ title: '', date: '', type: 'anniversary', notes: '' });
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg px-8 py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.addMilestone}
          </Button>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="shadow-xl border-2 border-pink-200">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">
                    {editingId ? t.editMilestone : t.addNewMilestone}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.titleLabel} *
                      </label>
                      <Input
                        placeholder={t.titlePlaceholder}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.dateLabel} *
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.typeLabel}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {milestoneTypes.map((type) => {
                          const Icon = type.icon;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, type: type.id })}
                              className={`p-3 rounded-xl border-2 transition-all text-center ${
                                formData.type === type.id
                                  ? 'border-pink-500 bg-pink-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon className={`w-6 h-6 mx-auto mb-1 ${
                                formData.type === type.id ? 'text-pink-600' : 'text-gray-400'
                              }`} />
                              <span className="text-xs font-medium text-gray-900">{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.notesLabel}
                      </label>
                      <Input
                        placeholder={t.notesPlaceholder}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingId(null);
                          setFormData({ title: '', date: '', type: 'anniversary', notes: '' });
                        }}
                      >
                        {t.cancel}
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      >
                        {editingId ? t.update : t.add} {t.milestone}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Milestones List */}
        {sortedMilestones.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Calendar className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">
              {t.noMilestones}
            </h3>
            <p className="text-gray-500 mb-6">
              {t.startTracking}
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.addFirstMilestone}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {sortedMilestones.map((milestone, index) => {
              const typeInfo = milestoneTypes.find(t => t.id === milestone.type) || milestoneTypes[milestoneTypes.length - 1];
              const Icon = typeInfo.icon;
              const countdown = calculateTimeUntil(milestone.date);

              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-14 h-14 bg-gradient-to-br ${typeInfo.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {milestone.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {localDate(milestone.date).toLocaleDateString(currentLanguage === 'en' ? 'en-US' : currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'fr' ? 'fr-FR' : currentLanguage === 'it' ? 'it-IT' : currentLanguage === 'de' ? 'de-DE' : currentLanguage === 'nl' ? 'nl-NL' : 'pt-PT', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {milestone.notes && (
                              <p className="text-sm text-gray-700 italic">
                                {milestone.notes}
                              </p>
                            )}
                            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                              countdown.passed
                                ? 'bg-gray-100 text-gray-600'
                                : countdown.text === t.today
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse'
                                : 'bg-pink-100 text-pink-700'
                            }`}>
                              {countdown.text === t.today ? (
                                <span className="flex items-center gap-1">
                                  <PartyPopper className="w-4 h-4" />
                                  {t.today} 🎉
                                </span>
                              ) : (
                                countdown.text
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(milestone)}
                            aria-label={t.editAction || translations.en.editAction}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(milestone.id)}
                            aria-label={t.deleteAction || translations.en.deleteAction}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Ideas Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <Gift className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            {t.celebrationIdeas}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t.celebrationSubtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <Heart className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">{t.sendLoveNotes}</h3>
              <p className="text-sm opacity-90">{t.sendLoveNotesDesc}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <Calendar className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">{t.planDate}</h3>
              <p className="text-sm opacity-90">{t.planDateDesc}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm">
              <Gift className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">{t.giveGift}</h3>
              <p className="text-sm opacity-90">{t.giveGiftDesc}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}