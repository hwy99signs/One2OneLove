import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, X, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { uploadMilestonePhotos } from "@/lib/milestonesService";

const translations = {
  en: {
    title: "Add Milestone",
    editTitle: "Edit Milestone",
    milestoneType: "Milestone Type",
    milestoneTitle: "Title",
    date: "Date",
    description: "Description",
    location: "Location",
    partnerEmail: "Partner's Email",
    recurAnnually: "Celebrate Annually",
    enableReminder: "Enable Reminder",
    uploadPhotos: "Upload Photos",
    cancel: "Cancel",
    save: "Save Milestone",
    types: {
      first_date: "First Date",
      first_kiss: "First Kiss",
      first_love: "First 'I Love You'",
      moving_in: "Moving In Together",
      engagement: "Engagement",
      wedding: "Wedding",
      anniversary: "Anniversary",
      first_vacation: "First Vacation Together",
      met_family: "Met the Family",
      custom: "Custom Milestone"
    },
    placeholders: {
      title: "e.g., Our First Date",
      description: "Tell the story of this special moment...",
      location: "e.g., Central Park, New York",
      partnerEmail: "partner@example.com"
    }
  },
  es: {
    title: "Agregar Hito",
    editTitle: "Editar Hito",
    milestoneType: "Tipo de Hito",
    milestoneTitle: "Título",
    date: "Fecha",
    description: "Descripción",
    location: "Ubicación",
    partnerEmail: "Email de la Pareja",
    recurAnnually: "Celebrar Anualmente",
    enableReminder: "Habilitar Recordatorio",
    uploadPhotos: "Subir Fotos",
    cancel: "Cancelar",
    save: "Guardar Hito",
    types: {
      first_date: "Primera Cita",
      first_kiss: "Primer Beso",
      first_love: "Primer 'Te Amo'",
      moving_in: "Mudarse Juntos",
      engagement: "Compromiso",
      wedding: "Boda",
      anniversary: "Aniversario",
      first_vacation: "Primeras Vacaciones Juntos",
      met_family: "Conocer a la Familia",
      custom: "Hito Personalizado"
    },
    placeholders: {
      title: "ej., Nuestra Primera Cita",
      description: "Cuenta la historia de este momento especial...",
      location: "ej., Parque Central, Nueva York",
      partnerEmail: "pareja@ejemplo.com"
    }
  },
  fr: {
    title: "Ajouter un Jalon",
    editTitle: "Modifier le Jalon",
    milestoneType: "Type de Jalon",
    milestoneTitle: "Titre",
    date: "Date",
    description: "Description",
    location: "Lieu",
    partnerEmail: "Email du Partenaire",
    recurAnnually: "Célébrer Annuellement",
    enableReminder: "Activer le Rappel",
    uploadPhotos: "Télécharger des Photos",
    cancel: "Annuler",
    save: "Enregistrer le Jalon",
    types: {
      first_date: "Premier Rendez-vous",
      first_kiss: "Premier Baiser",
      first_love: "Premier 'Je t'aime'",
      moving_in: "Emménager Ensemble",
      engagement: "Fiançailles",
      wedding: "Mariage",
      anniversary: "Anniversaire",
      first_vacation: "Premières Vacances Ensemble",
      met_family: "Rencontrer la Famille",
      custom: "Jalon Personnalisé"
    },
    placeholders: {
      title: "ex., Notre Premier Rendez-vous",
      description: "Racontez l'histoire de ce moment spécial...",
      location: "ex., Central Park, New York",
      partnerEmail: "partenaire@exemple.com"
    }
  },
  it: {
    title: "Aggiungi Traguardo",
    editTitle: "Modifica Traguardo",
    milestoneType: "Tipo di Traguardo",
    milestoneTitle: "Titolo",
    date: "Data",
    description: "Descrizione",
    location: "Luogo",
    partnerEmail: "Email del Partner",
    recurAnnually: "Celebrare Annualmente",
    enableReminder: "Abilita Promemoria",
    uploadPhotos: "Carica Foto",
    cancel: "Annulla",
    save: "Salva Traguardo",
    types: {
      first_date: "Primo Appuntamento",
      first_kiss: "Primo Bacio",
      first_love: "Primo 'Ti Amo'",
      moving_in: "Andare a Vivere Insieme",
      engagement: "Fidanzamento",
      wedding: "Matrimonio",
      anniversary: "Anniversario",
      first_vacation: "Prima Vacanza Insieme",
      met_family: "Conoscere la Famiglia",
      custom: "Traguardo Personalizzato"
    },
    placeholders: {
      title: "es., Il Nostro Primo Appuntamento",
      description: "Racconta la storia di questo momento speciale...",
      location: "es., Central Park, New York",
      partnerEmail: "partner@esempio.com"
    }
  },
  de: {
    title: "Meilenstein Hinzufügen",
    editTitle: "Meilenstein Bearbeiten",
    milestoneType: "Meilenstein-Typ",
    milestoneTitle: "Titel",
    date: "Datum",
    description: "Beschreibung",
    location: "Ort",
    partnerEmail: "Partner-E-Mail",
    recurAnnually: "Jährlich Feiern",
    enableReminder: "Erinnerung Aktivieren",
    uploadPhotos: "Fotos Hochladen",
    cancel: "Abbrechen",
    save: "Meilenstein Speichern",
    types: {
      first_date: "Erstes Date",
      first_kiss: "Erster Kuss",
      first_love: "Erstes 'Ich liebe dich'",
      moving_in: "Zusammenziehen",
      engagement: "Verlobung",
      wedding: "Hochzeit",
      anniversary: "Jahrestag",
      first_vacation: "Erster Urlaub Zusammen",
      met_family: "Familie Kennengelernt",
      custom: "Benutzerdefinierter Meilenstein"
    },
    placeholders: {
      title: "z.B., Unser Erstes Date",
      description: "Erzähle die Geschichte dieses besonderen Moments...",
      location: "z.B., Central Park, New York",
      partnerEmail: "partner@beispiel.de"
    }
  }
};

export default function MilestoneForm({ milestone, onSubmit, onCancel, isLoading }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState({
    milestone_type: milestone?.milestone_type || 'first_date',
    title: milestone?.title || '',
    date: milestone?.date || '',
    description: milestone?.description || '',
    location: milestone?.location || '',
    partner_email: milestone?.partner_email || '',
    is_recurring: milestone?.is_recurring || false,
    reminder_enabled: milestone?.reminder_enabled !== false,
    media_urls: milestone?.media_urls || []
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload files to Supabase Storage
      const urls = await uploadMilestonePhotos(files, milestone?.id);
      
      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, ...urls]
      }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter(u => u !== url)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {milestone ? t.editTitle : t.title}
              </CardTitle>
              <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>{t.milestoneType}</Label>
                <Select
                  value={formData.milestone_type}
                  onValueChange={(value) => setFormData({ ...formData, milestone_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.types).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t.milestoneTitle} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t.placeholders.title}
                  required
                />
              </div>

              <div>
                <Label>{t.date} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(new Date(formData.date), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>{t.description}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.placeholders.description}
                  rows={4}
                />
              </div>

              <div>
                <Label>{t.location}</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t.placeholders.location}
                />
              </div>

              <div>
                <Label>{t.partnerEmail}</Label>
                <Input
                  type="email"
                  value={formData.partner_email}
                  onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
                  placeholder={t.placeholders.partnerEmail}
                />
              </div>

              <div>
                <Label>{t.uploadPhotos}</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-400 cursor-pointer transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Click to upload photos
                      </>
                    )}
                  </label>
                </div>
                {formData.media_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {formData.media_urls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                  />
                  <Label>{t.recurAnnually}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                  <Label>{t.enableReminder}</Label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t.save}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}