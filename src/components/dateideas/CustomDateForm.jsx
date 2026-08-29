import React, { useState } from "react";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    create: "Create a Private Date Idea", edit: "Edit Date Idea", title: "Date title", titlePlaceholder: "e.g., Sunset picnic", description: "Description", descriptionPlaceholder: "Describe the date idea...", category: "Category", budget: "Budget", location: "Location type", occasion: "Occasion", stage: "Relationship stage", privacy: "Saved date ideas are private to your account. They are not shared with a partner or community automatically.", cancel: "Cancel", save: "Save date idea",
    categories: { romantic: "Romantic", adventure: "Adventure", relaxing: "Relaxing", indoor: "Indoor", outdoor: "Outdoor", creative: "Creative" },
    budgets: { free: "Free", low: "Low cost", medium: "Medium", high: "Higher cost" },
    locations: { home: "Home", outdoor: "Outdoor", restaurant: "Restaurant", activity_center: "Activity center", cultural: "Cultural", nature: "Nature", urban: "Urban" },
    occasions: { regular: "Regular date", anniversary: "Anniversary", birthday: "Birthday", valentines: "Valentine's Day", special: "Special", apology: "Repair / apology", celebration: "Celebration" },
    stages: { new: "New relationship", dating: "Dating", committed: "Committed", married: "Married", long_term: "Long-term", any: "Any stage" },
  },
  es: {
    create: "Crear una Idea de Cita Privada", edit: "Editar Idea de Cita", title: "Título de la cita", titlePlaceholder: "p. ej., Picnic al atardecer", description: "Descripción", descriptionPlaceholder: "Describe la idea de la cita...", category: "Categoría", budget: "Presupuesto", location: "Tipo de lugar", occasion: "Ocasión", stage: "Etapa de la relación", privacy: "Las ideas guardadas son privadas de tu cuenta. No se comparten automáticamente con tu pareja ni con la comunidad.", cancel: "Cancelar", save: "Guardar idea",
    categories: { romantic: "Romántica", adventure: "Aventura", relaxing: "Relajante", indoor: "Interior", outdoor: "Exterior", creative: "Creativa" },
    budgets: { free: "Gratis", low: "Bajo costo", medium: "Medio", high: "Costo mayor" },
    locations: { home: "Casa", outdoor: "Exterior", restaurant: "Restaurante", activity_center: "Centro de actividades", cultural: "Cultural", nature: "Naturaleza", urban: "Urbano" },
    occasions: { regular: "Cita regular", anniversary: "Aniversario", birthday: "Cumpleaños", valentines: "San Valentín", special: "Especial", apology: "Reparación / disculpa", celebration: "Celebración" },
    stages: { new: "Relación nueva", dating: "Citas", committed: "Comprometida", married: "Casados", long_term: "Largo plazo", any: "Cualquier etapa" },
  },
  fr: {
    create: "Créer une Idée de Rendez-vous Privée", edit: "Modifier l’Idée", title: "Titre du rendez-vous", titlePlaceholder: "ex. Pique-nique au coucher du soleil", description: "Description", descriptionPlaceholder: "Décrivez l’idée de rendez-vous...", category: "Catégorie", budget: "Budget", location: "Type de lieu", occasion: "Occasion", stage: "Étape de la relation", privacy: "Les idées enregistrées restent privées dans votre compte. Elles ne sont pas partagées automatiquement avec un partenaire ou la communauté.", cancel: "Annuler", save: "Enregistrer l’idée",
    categories: { romantic: "Romantique", adventure: "Aventure", relaxing: "Détente", indoor: "Intérieur", outdoor: "Extérieur", creative: "Créatif" },
    budgets: { free: "Gratuit", low: "Petit budget", medium: "Moyen", high: "Budget supérieur" },
    locations: { home: "Maison", outdoor: "Extérieur", restaurant: "Restaurant", activity_center: "Centre d’activités", cultural: "Culturel", nature: "Nature", urban: "Urbain" },
    occasions: { regular: "Rendez-vous régulier", anniversary: "Anniversaire", birthday: "Anniversaire personnel", valentines: "Saint-Valentin", special: "Spécial", apology: "Réparation / excuses", celebration: "Célébration" },
    stages: { new: "Nouvelle relation", dating: "Fréquentation", committed: "Engagée", married: "Mariés", long_term: "Long terme", any: "Toute étape" },
  },
  it: {
    create: "Crea un’Idea di Appuntamento Privata", edit: "Modifica Idea", title: "Titolo dell’appuntamento", titlePlaceholder: "es. Picnic al tramonto", description: "Descrizione", descriptionPlaceholder: "Descrivi l’idea per l’appuntamento...", category: "Categoria", budget: "Budget", location: "Tipo di luogo", occasion: "Occasione", stage: "Fase della relazione", privacy: "Le idee salvate restano private nel tuo account. Non vengono condivise automaticamente con il partner o la community.", cancel: "Annulla", save: "Salva idea",
    categories: { romantic: "Romantico", adventure: "Avventura", relaxing: "Rilassante", indoor: "Al chiuso", outdoor: "All’aperto", creative: "Creativo" },
    budgets: { free: "Gratis", low: "Basso costo", medium: "Medio", high: "Costo maggiore" },
    locations: { home: "Casa", outdoor: "All’aperto", restaurant: "Ristorante", activity_center: "Centro attività", cultural: "Culturale", nature: "Natura", urban: "Urbano" },
    occasions: { regular: "Appuntamento normale", anniversary: "Anniversario", birthday: "Compleanno", valentines: "San Valentino", special: "Speciale", apology: "Riparazione / scuse", celebration: "Celebrazione" },
    stages: { new: "Nuova relazione", dating: "Frequentazione", committed: "Impegnata", married: "Sposati", long_term: "Lungo termine", any: "Qualsiasi fase" },
  },
  de: {
    create: "Private Date-Idee Erstellen", edit: "Date-Idee Bearbeiten", title: "Titel des Dates", titlePlaceholder: "z. B. Picknick bei Sonnenuntergang", description: "Beschreibung", descriptionPlaceholder: "Beschreibe die Date-Idee...", category: "Kategorie", budget: "Budget", location: "Ortstyp", occasion: "Anlass", stage: "Beziehungsphase", privacy: "Gespeicherte Date-Ideen bleiben privat in deinem Konto. Sie werden nicht automatisch mit Partnern oder der Community geteilt.", cancel: "Abbrechen", save: "Date-Idee speichern",
    categories: { romantic: "Romantisch", adventure: "Abenteuer", relaxing: "Entspannend", indoor: "Drinnen", outdoor: "Draußen", creative: "Kreativ" },
    budgets: { free: "Kostenlos", low: "Günstig", medium: "Mittel", high: "Höhere Kosten" },
    locations: { home: "Zuhause", outdoor: "Draußen", restaurant: "Restaurant", activity_center: "Aktivitätszentrum", cultural: "Kulturell", nature: "Natur", urban: "Städtisch" },
    occasions: { regular: "Normales Date", anniversary: "Jahrestag", birthday: "Geburtstag", valentines: "Valentinstag", special: "Besonders", apology: "Reparatur / Entschuldigung", celebration: "Feier" },
    stages: { new: "Neue Beziehung", dating: "Dating", committed: "Fest verbunden", married: "Verheiratet", long_term: "Langfristig", any: "Jede Phase" },
  },
};

const normalizeDateIdea = (dateIdea) => ({
  title: dateIdea?.title || "",
  description: dateIdea?.description || "",
  category: dateIdea?.category || "romantic",
  budget: dateIdea?.budget || "medium",
  location_type: dateIdea?.location_type || "outdoor",
  occasion: dateIdea?.occasion || "regular",
  relationship_stage: dateIdea?.relationship_stage || "any",
});

export default function CustomDateForm({ dateIdea, onSubmit, onCancel }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState(() => normalizeDateIdea(dateIdea));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(normalizeDateIdea(formData));
  };

  const renderSelect = (label, key, values) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <Select value={formData[key]} onValueChange={(value) => setFormData((current) => ({ ...current, [key]: value }))}>
        <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(values).map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card className="overflow-hidden bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-2xl"><Heart className="h-6 w-6" aria-hidden="true" />{dateIdea ? t.edit : t.create}</CardTitle>
          <button type="button" onClick={onCancel} className="rounded-full p-2 hover:bg-white/15" aria-label={t.cancel}><X className="h-5 w-5" /></button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">{t.title} *</label>
            <Input value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} placeholder={t.titlePlaceholder} maxLength={120} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">{t.description} *</label>
            <Textarea value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} placeholder={t.descriptionPlaceholder} className="min-h-28" maxLength={1200} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {renderSelect(t.category, "category", t.categories)}
            {renderSelect(t.budget, "budget", t.budgets)}
            {renderSelect(t.location, "location_type", t.locations)}
            {renderSelect(t.occasion, "occasion", t.occasions)}
            {renderSelect(t.stage, "relationship_stage", t.stages)}
          </div>
          <p className="rounded-xl bg-purple-50 px-4 py-3 text-sm leading-6 text-purple-900">{t.privacy}</p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>{t.cancel}</Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">{t.save}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
