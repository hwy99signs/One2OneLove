import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, X } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    createCustomDate: "Create Custom Date Idea",
    editDate: "Edit Date Idea",
    title: "Date Title",
    titlePlaceholder: "e.g., Sunset Picnic",
    description: "Description",
    descriptionPlaceholder: "Describe your date idea...",
    category: "Category",
    budget: "Budget",
    locationType: "Location Type",
    occasion: "Occasion",
    relationshipStage: "Relationship Stage",
    difficulty: "Difficulty",
    duration: "Duration (hours)",
    shareWithPartner: "Share with partner",
    makePublic: "Share with community",
    cancel: "Cancel",
    save: "Save Date Idea",
    categories: { romantic: "Romantic", adventure: "Adventure", relaxing: "Relaxing", indoor: "Indoor", outdoor: "Outdoor", creative: "Creative" },
    budgets: { free: "Free", low: "Low ($)", medium: "Medium ($)", high: "High ($$)" },
    locations: { home: "Home", outdoor: "Outdoor", restaurant: "Restaurant", activity_center: "Activity Center", cultural: "Cultural", nature: "Nature", urban: "Urban" },
    occasions: { regular: "Regular Date", anniversary: "Anniversary", birthday: "Birthday", valentines: "Valentine's Day", special: "Special", apology: "Apology", celebration: "Celebration" },
    stages: { new: "New Relationship", dating: "Dating", committed: "Committed", married: "Married", long_term: "Long-term", any: "Any Stage" },
    difficulties: { easy: "Easy", medium: "Medium", hard: "Hard" }
  },
  es: {
    createCustomDate: "Crear Idea de Cita Personalizada", editDate: "Editar Idea de Cita", title: "Título de la Cita", titlePlaceholder: "p. ej., Picnic al Atardecer",
    description: "Descripción", descriptionPlaceholder: "Describe tu idea de cita...", category: "Categoría", budget: "Presupuesto", locationType: "Tipo de Lugar",
    occasion: "Ocasión", relationshipStage: "Etapa de la Relación", difficulty: "Dificultad", duration: "Duración (horas)",
    shareWithPartner: "Compartir con la pareja", makePublic: "Compartir con la comunidad", cancel: "Cancelar", save: "Guardar Idea de Cita",
    categories: { romantic: "Romántica", adventure: "Aventura", relaxing: "Relajante", indoor: "Interior", outdoor: "Aire Libre", creative: "Creativa" },
    budgets: { free: "Gratis", low: "Bajo ($)", medium: "Medio ($)", high: "Alto ($$)" },
    locations: { home: "Casa", outdoor: "Aire Libre", restaurant: "Restaurante", activity_center: "Centro de Actividades", cultural: "Cultural", nature: "Naturaleza", urban: "Urbano" },
    occasions: { regular: "Cita Normal", anniversary: "Aniversario", birthday: "Cumpleaños", valentines: "Día de San Valentín", special: "Especial", apology: "Disculpa", celebration: "Celebración" },
    stages: { new: "Relación Nueva", dating: "Saliendo", committed: "Comprometida", married: "Casada", long_term: "A Largo Plazo", any: "Cualquier Etapa" },
    difficulties: { easy: "Fácil", medium: "Media", hard: "Difícil" }
  },
  fr: {
    createCustomDate: "Créer une Idée de Rendez-vous Personnalisée", editDate: "Modifier l’Idée de Rendez-vous", title: "Titre du Rendez-vous", titlePlaceholder: "p. ex., Pique-nique au Coucher du Soleil",
    description: "Description", descriptionPlaceholder: "Décrivez votre idée de rendez-vous...", category: "Catégorie", budget: "Budget", locationType: "Type de Lieu",
    occasion: "Occasion", relationshipStage: "Étape de la Relation", difficulty: "Difficulté", duration: "Durée (heures)",
    shareWithPartner: "Partager avec le partenaire", makePublic: "Partager avec la communauté", cancel: "Annuler", save: "Enregistrer l’Idée",
    categories: { romantic: "Romantique", adventure: "Aventure", relaxing: "Détente", indoor: "Intérieur", outdoor: "Extérieur", creative: "Créatif" },
    budgets: { free: "Gratuit", low: "Faible ($)", medium: "Moyen ($)", high: "Élevé ($$)" },
    locations: { home: "Maison", outdoor: "Extérieur", restaurant: "Restaurant", activity_center: "Centre d’Activités", cultural: "Culturel", nature: "Nature", urban: "Urbain" },
    occasions: { regular: "Rendez-vous Ordinaire", anniversary: "Anniversaire", birthday: "Anniversaire de Naissance", valentines: "Saint-Valentin", special: "Spécial", apology: "Excuses", celebration: "Célébration" },
    stages: { new: "Nouvelle Relation", dating: "Relation en Cours", committed: "Engagée", married: "Mariée", long_term: "Long Terme", any: "Toute Étape" },
    difficulties: { easy: "Facile", medium: "Moyenne", hard: "Difficile" }
  },
  it: {
    createCustomDate: "Crea Idea per Appuntamento Personalizzata", editDate: "Modifica Idea per Appuntamento", title: "Titolo dell’Appuntamento", titlePlaceholder: "es., Picnic al Tramonto",
    description: "Descrizione", descriptionPlaceholder: "Descrivi la tua idea per l’appuntamento...", category: "Categoria", budget: "Budget", locationType: "Tipo di Luogo",
    occasion: "Occasione", relationshipStage: "Fase della Relazione", difficulty: "Difficoltà", duration: "Durata (ore)",
    shareWithPartner: "Condividi con il partner", makePublic: "Condividi con la community", cancel: "Annulla", save: "Salva Idea per Appuntamento",
    categories: { romantic: "Romantico", adventure: "Avventura", relaxing: "Rilassante", indoor: "Al Chiuso", outdoor: "All’Aperto", creative: "Creativo" },
    budgets: { free: "Gratis", low: "Basso ($)", medium: "Medio ($)", high: "Alto ($$)" },
    locations: { home: "Casa", outdoor: "All’Aperto", restaurant: "Ristorante", activity_center: "Centro Attività", cultural: "Culturale", nature: "Natura", urban: "Urbano" },
    occasions: { regular: "Appuntamento Normale", anniversary: "Anniversario", birthday: "Compleanno", valentines: "San Valentino", special: "Speciale", apology: "Scuse", celebration: "Celebrazione" },
    stages: { new: "Nuova Relazione", dating: "Frequentazione", committed: "Impegnata", married: "Sposata", long_term: "Lungo Termine", any: "Qualsiasi Fase" },
    difficulties: { easy: "Facile", medium: "Media", hard: "Difficile" }
  },
  de: {
    createCustomDate: "Eigene Date-Idee Erstellen", editDate: "Date-Idee Bearbeiten", title: "Date-Titel", titlePlaceholder: "z. B. Picknick bei Sonnenuntergang",
    description: "Beschreibung", descriptionPlaceholder: "Beschreibe deine Date-Idee...", category: "Kategorie", budget: "Budget", locationType: "Ortstyp",
    occasion: "Anlass", relationshipStage: "Beziehungsphase", difficulty: "Schwierigkeit", duration: "Dauer (Stunden)",
    shareWithPartner: "Mit Partner teilen", makePublic: "Mit der Community teilen", cancel: "Abbrechen", save: "Date-Idee Speichern",
    categories: { romantic: "Romantisch", adventure: "Abenteuer", relaxing: "Entspannend", indoor: "Drinnen", outdoor: "Draußen", creative: "Kreativ" },
    budgets: { free: "Kostenlos", low: "Niedrig ($)", medium: "Mittel ($)", high: "Hoch ($$)" },
    locations: { home: "Zuhause", outdoor: "Draußen", restaurant: "Restaurant", activity_center: "Aktivitätszentrum", cultural: "Kulturell", nature: "Natur", urban: "Städtisch" },
    occasions: { regular: "Normales Date", anniversary: "Jahrestag", birthday: "Geburtstag", valentines: "Valentinstag", special: "Besonders", apology: "Entschuldigung", celebration: "Feier" },
    stages: { new: "Neue Beziehung", dating: "Dating", committed: "Feste Beziehung", married: "Verheiratet", long_term: "Langfristig", any: "Jede Phase" },
    difficulties: { easy: "Einfach", medium: "Mittel", hard: "Schwierig" }
  }
};

export default function CustomDateForm({ dateIdea, onSubmit, onCancel, isLoading = false }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState(dateIdea || {
    title: "",
    description: "",
    category: "romantic",
    budget: "medium",
    location_type: "outdoor",
    occasion: "regular",
    relationship_stage: "any",
    difficulty: "easy",
    duration_hours: 2,
    is_public: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6" />
            {dateIdea ? t.editDate : t.createCustomDate}
          </CardTitle>
          <button type="button" onClick={onCancel} aria-label={t.cancel} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="custom-date-title" className="block text-sm font-semibold text-gray-700 mb-2">{t.title} *</label>
            <Input
              id="custom-date-title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder={t.titlePlaceholder}
              required
            />
          </div>

          <div>
            <label htmlFor="custom-date-description" className="block text-sm font-semibold text-gray-700 mb-2">{t.description} *</label>
            <Textarea
              id="custom-date-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t.descriptionPlaceholder}
              className="h-24"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.category}</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger aria-label={t.category}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.budget}</label>
              <Select value={formData.budget} onValueChange={(value) => setFormData({...formData, budget: value})}>
                <SelectTrigger aria-label={t.budget}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.budgets).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.locationType}</label>
              <Select value={formData.location_type} onValueChange={(value) => setFormData({...formData, location_type: value})}>
                <SelectTrigger aria-label={t.locationType}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.locations).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.occasion}</label>
              <Select value={formData.occasion} onValueChange={(value) => setFormData({...formData, occasion: value})}>
                <SelectTrigger aria-label={t.occasion}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.occasions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.relationshipStage}</label>
              <Select value={formData.relationship_stage} onValueChange={(value) => setFormData({...formData, relationship_stage: value})}>
                <SelectTrigger aria-label={t.relationshipStage}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.stages).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.difficulty}</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                <SelectTrigger aria-label={t.difficulty}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.difficulties).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="custom-date-duration" className="block text-sm font-semibold text-gray-700 mb-2">{t.duration}</label>
              <Input
                id="custom-date-duration"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData({...formData, duration_hours: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">{t.makePublic}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              {t.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}