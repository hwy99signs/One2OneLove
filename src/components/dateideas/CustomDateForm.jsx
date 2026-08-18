import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    create: 'Create Your Own Date Idea', edit: 'Edit Date Idea', title: 'Date title', titlePlaceholder: 'e.g., Sunset Picnic', description: 'Description', descriptionPlaceholder: 'What would make this date enjoyable?', category: 'Category', budget: 'Budget', location: 'Location type', occasion: 'Occasion', stage: 'Relationship stage', cancel: 'Cancel', save: 'Save Date Idea',
    categories: { romantic: 'Romantic', adventure: 'Adventure', relaxing: 'Relaxing', indoor: 'Indoor', outdoor: 'Outdoor', creative: 'Creative' },
    budgets: { free: 'Free', low: 'Low ($)', medium: 'Medium ($$)', high: 'High ($$$)' },
    locations: { home: 'Home', outdoor: 'Outdoor', restaurant: 'Restaurant', activity_center: 'Activity Center', cultural: 'Cultural', nature: 'Nature', urban: 'Urban' },
    occasions: { regular: 'Regular Date', anniversary: 'Anniversary', birthday: 'Birthday', valentines: "Valentine's Day", special: 'Special', apology: 'Reconnection', celebration: 'Celebration' },
    stages: { new: 'New Relationship', dating: 'Dating', committed: 'Committed', married: 'Married', long_term: 'Long-term', any: 'Any Stage' },
  },
  es: {
    create: 'Crea Tu Propia Idea de Cita', edit: 'Editar Idea de Cita', title: 'Título de la cita', titlePlaceholder: 'Ej.: Picnic al atardecer', description: 'Descripción', descriptionPlaceholder: '¿Qué haría agradable esta cita?', category: 'Categoría', budget: 'Presupuesto', location: 'Tipo de lugar', occasion: 'Ocasión', stage: 'Etapa de la relación', cancel: 'Cancelar', save: 'Guardar Idea', categories: { romantic: 'Romántica', adventure: 'Aventura', relaxing: 'Relajante', indoor: 'Interior', outdoor: 'Exterior', creative: 'Creativa' }, budgets: { free: 'Gratis', low: 'Bajo ($)', medium: 'Medio ($$)', high: 'Alto ($$$)' }, locations: { home: 'Casa', outdoor: 'Exterior', restaurant: 'Restaurante', activity_center: 'Centro de actividades', cultural: 'Cultural', nature: 'Naturaleza', urban: 'Urbano' }, occasions: { regular: 'Cita normal', anniversary: 'Aniversario', birthday: 'Cumpleaños', valentines: 'San Valentín', special: 'Especial', apology: 'Reconexión', celebration: 'Celebración' }, stages: { new: 'Relación nueva', dating: 'Saliendo', committed: 'Comprometida', married: 'Casados', long_term: 'Largo plazo', any: 'Cualquier etapa' },
  },
  fr: {
    create: 'Créez Votre Propre Idée de Rendez-vous', edit: "Modifier l'Idée", title: 'Titre', titlePlaceholder: 'Ex. : Pique-nique au coucher du soleil', description: 'Description', descriptionPlaceholder: 'Qu’est-ce qui rendrait ce rendez-vous agréable ?', category: 'Catégorie', budget: 'Budget', location: 'Type de lieu', occasion: 'Occasion', stage: 'Étape de la relation', cancel: 'Annuler', save: "Enregistrer l'Idée", categories: { romantic: 'Romantique', adventure: 'Aventure', relaxing: 'Détente', indoor: 'Intérieur', outdoor: 'Extérieur', creative: 'Créatif' }, budgets: { free: 'Gratuit', low: 'Bas ($)', medium: 'Moyen ($$)', high: 'Élevé ($$$)' }, locations: { home: 'Maison', outdoor: 'Extérieur', restaurant: 'Restaurant', activity_center: "Centre d'activités", cultural: 'Culturel', nature: 'Nature', urban: 'Urbain' }, occasions: { regular: 'Rendez-vous habituel', anniversary: 'Anniversaire', birthday: 'Anniversaire de naissance', valentines: 'Saint-Valentin', special: 'Spécial', apology: 'Reconnexion', celebration: 'Célébration' }, stages: { new: 'Nouvelle relation', dating: 'Fréquentation', committed: 'Engagés', married: 'Mariés', long_term: 'Long terme', any: 'Toutes les étapes' },
  },
  it: {
    create: 'Crea la Tua Idea per un Appuntamento', edit: "Modifica l'Idea", title: 'Titolo', titlePlaceholder: 'Es.: Picnic al tramonto', description: 'Descrizione', descriptionPlaceholder: 'Cosa renderebbe piacevole questo appuntamento?', category: 'Categoria', budget: 'Budget', location: 'Tipo di luogo', occasion: 'Occasione', stage: 'Fase della relazione', cancel: 'Annulla', save: "Salva l'Idea", categories: { romantic: 'Romantico', adventure: 'Avventura', relaxing: 'Rilassante', indoor: 'Al chiuso', outdoor: "All'aperto", creative: 'Creativo' }, budgets: { free: 'Gratis', low: 'Basso ($)', medium: 'Medio ($$)', high: 'Alto ($$$)' }, locations: { home: 'Casa', outdoor: "All'aperto", restaurant: 'Ristorante', activity_center: 'Centro attività', cultural: 'Culturale', nature: 'Natura', urban: 'Urbano' }, occasions: { regular: 'Appuntamento normale', anniversary: 'Anniversario', birthday: 'Compleanno', valentines: 'San Valentino', special: 'Speciale', apology: 'Riconnessione', celebration: 'Celebrazione' }, stages: { new: 'Nuova relazione', dating: 'Frequentazione', committed: 'Impegnati', married: 'Sposati', long_term: 'Lungo termine', any: 'Qualsiasi fase' },
  },
  de: {
    create: 'Eigene Date-Idee Erstellen', edit: 'Date-Idee Bearbeiten', title: 'Titel', titlePlaceholder: 'z. B. Sonnenuntergangspicknick', description: 'Beschreibung', descriptionPlaceholder: 'Was würde dieses Date schön machen?', category: 'Kategorie', budget: 'Budget', location: 'Ortstyp', occasion: 'Anlass', stage: 'Beziehungsphase', cancel: 'Abbrechen', save: 'Date-Idee Speichern', categories: { romantic: 'Romantisch', adventure: 'Abenteuer', relaxing: 'Entspannt', indoor: 'Drinnen', outdoor: 'Draußen', creative: 'Kreativ' }, budgets: { free: 'Kostenlos', low: 'Niedrig ($)', medium: 'Mittel ($$)', high: 'Hoch ($$$)' }, locations: { home: 'Zuhause', outdoor: 'Draußen', restaurant: 'Restaurant', activity_center: 'Aktivitätszentrum', cultural: 'Kulturell', nature: 'Natur', urban: 'Städtisch' }, occasions: { regular: 'Normales Date', anniversary: 'Jahrestag', birthday: 'Geburtstag', valentines: 'Valentinstag', special: 'Besonders', apology: 'Wiederannäherung', celebration: 'Feier' }, stages: { new: 'Neue Beziehung', dating: 'Dating', committed: 'Fest', married: 'Verheiratet', long_term: 'Langfristig', any: 'Jede Phase' },
  },
  nl: {
    create: 'Maak Je Eigen Date-idee', edit: 'Date-idee Bewerken', title: 'Titel', titlePlaceholder: 'Bijv. picknick bij zonsondergang', description: 'Beschrijving', descriptionPlaceholder: 'Wat zou deze date leuk maken?', category: 'Categorie', budget: 'Budget', location: 'Soort locatie', occasion: 'Gelegenheid', stage: 'Relatiefase', cancel: 'Annuleren', save: 'Date-idee Opslaan', categories: { romantic: 'Romantisch', adventure: 'Avontuur', relaxing: 'Ontspannen', indoor: 'Binnen', outdoor: 'Buiten', creative: 'Creatief' }, budgets: { free: 'Gratis', low: 'Laag ($)', medium: 'Gemiddeld ($$)', high: 'Hoog ($$$)' }, locations: { home: 'Thuis', outdoor: 'Buiten', restaurant: 'Restaurant', activity_center: 'Activiteitencentrum', cultural: 'Cultureel', nature: 'Natuur', urban: 'Stedelijk' }, occasions: { regular: 'Gewone date', anniversary: 'Jubileum', birthday: 'Verjaardag', valentines: 'Valentijnsdag', special: 'Speciaal', apology: 'Opnieuw verbinden', celebration: 'Viering' }, stages: { new: 'Nieuwe relatie', dating: 'Daten', committed: 'Vaste relatie', married: 'Getrouwd', long_term: 'Langdurig', any: 'Elke fase' },
  },
};

const emptyIdea = {
  title: '',
  description: '',
  category: 'romantic',
  budget: 'medium',
  location_type: 'outdoor',
  occasion: 'regular',
  relationship_stage: 'any',
};

export default function CustomDateForm({ dateIdea = null, onSubmit, onCancel, isSaving = false }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState(() => ({ ...emptyIdea, ...(dateIdea || {}) }));

  const update = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      budget: formData.budget,
      location_type: formData.location_type,
      occasion: formData.occasion,
      relationship_stage: formData.relationship_stage,
    });
  };

  return (
    <Card className="overflow-hidden bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl"><Heart className="h-6 w-6" />{dateIdea ? t.edit : t.create}</CardTitle>
          <button type="button" onClick={onCancel} aria-label={t.cancel} className="rounded-full p-1 text-white hover:bg-white/15"><X className="h-6 w-6" /></button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">{t.title} *</label>
            <Input value={formData.title} onChange={(event) => update('title', event.target.value.slice(0, 120))} placeholder={t.titlePlaceholder} required maxLength={120} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold text-gray-700">{t.description}</label><span className="text-xs text-gray-400">{formData.description.length}/1200</span></div>
            <Textarea value={formData.description} onChange={(event) => update('description', event.target.value.slice(0, 1200))} placeholder={t.descriptionPlaceholder} rows={4} maxLength={1200} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldSelect label={t.category} value={formData.category} onChange={(value) => update('category', value)} options={t.categories} />
            <FieldSelect label={t.budget} value={formData.budget} onChange={(value) => update('budget', value)} options={t.budgets} />
            <FieldSelect label={t.location} value={formData.location_type} onChange={(value) => update('location_type', value)} options={t.locations} />
            <FieldSelect label={t.occasion} value={formData.occasion} onChange={(value) => update('occasion', value)} options={t.occasions} />
            <FieldSelect label={t.stage} value={formData.relationship_stage} onChange={(value) => update('relationship_stage', value)} options={t.stages} />
          </div>

          <p className="rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-800">Your custom Date Idea is saved privately to your account. Nothing is shared with another member automatically.</p>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>{t.cancel}</Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" disabled={isSaving || !formData.title.trim()}>{isSaving ? 'Saving…' : t.save}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
