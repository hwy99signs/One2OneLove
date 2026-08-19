import React, { useMemo, useState } from 'react';
import { ArrowLeft, Coffee, Film, Heart, MapPin, Mountain, Music, Sparkles, Star, Utensils, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/Layout';
import { getBuiltInDateIdeas } from '@/lib/dateIdeasCatalog';

const COPY = {
  en: {
    title: 'Date Ideas', subtitle: 'Simple ways to spend intentional time together.', back: 'Back', filters: 'Find an idea that fits', all: 'All',
    category: 'Category', budget: 'Budget', location: 'Location', occasion: 'Occasion', stage: 'Relationship stage', duration: 'Suggested time', noIdeas: 'No Date Ideas match those filters.',
    stagedTitle: 'Private Date Idea tools are staged', stagedText: 'The built-in catalog remains free to browse. Saving, creating, favoriting and completion tracking will be activated only after the private account-storage migration passes controlled ownership tests.',
    categories: { romantic: 'Romantic', adventure: 'Adventure', relaxing: 'Relaxing', indoor: 'Indoor', outdoor: 'Outdoor', creative: 'Creative' },
    budgets: { free: 'Free', low: 'Low ($)', medium: 'Medium ($$)', high: 'High ($$$)' },
    locations: { home: 'Home', outdoor: 'Outdoor', restaurant: 'Restaurant', activity_center: 'Activity Center', cultural: 'Cultural', nature: 'Nature', urban: 'Urban' },
    occasions: { regular: 'Regular Date', anniversary: 'Anniversary', birthday: 'Birthday', valentines: "Valentine's Day", special: 'Special', apology: 'Reconnection', celebration: 'Celebration' },
    stages: { new: 'New Relationship', dating: 'Dating', committed: 'Committed', married: 'Married', long_term: 'Long-term', any: 'Any Stage' },
    durations: { '1–2 hr': '1–2 hr', '2–3 hr': '2–3 hr', '3–4 hr': '3–4 hr', '3–5 hr': '3–5 hr' },
  },
  es: {
    title: 'Ideas para Citas', subtitle: 'Formas sencillas de pasar tiempo de calidad juntos.', back: 'Volver', filters: 'Encuentra una idea adecuada', all: 'Todas', category: 'Categoría', budget: 'Presupuesto', location: 'Lugar', occasion: 'Ocasión', stage: 'Etapa de la relación', duration: 'Tiempo sugerido', noIdeas: 'Ninguna idea coincide con esos filtros.',
    stagedTitle: 'Las herramientas privadas están preparadas', stagedText: 'El catálogo integrado sigue siendo gratuito. Guardar, crear, marcar favoritas y registrar actividades se activará solo después de que el almacenamiento privado pase las pruebas de propiedad.',
    categories: { romantic: 'Romántica', adventure: 'Aventura', relaxing: 'Relajante', indoor: 'Interior', outdoor: 'Exterior', creative: 'Creativa' }, budgets: { free: 'Gratis', low: 'Bajo ($)', medium: 'Medio ($$)', high: 'Alto ($$$)' }, locations: { home: 'Casa', outdoor: 'Exterior', restaurant: 'Restaurante', activity_center: 'Centro de actividades', cultural: 'Cultural', nature: 'Naturaleza', urban: 'Urbano' }, occasions: { regular: 'Cita normal', anniversary: 'Aniversario', birthday: 'Cumpleaños', valentines: 'San Valentín', special: 'Especial', apology: 'Reconexión', celebration: 'Celebración' }, stages: { new: 'Relación nueva', dating: 'Saliendo', committed: 'Comprometida', married: 'Casados', long_term: 'Largo plazo', any: 'Cualquier etapa' },
    durations: { '1–2 hr': '1–2 h', '2–3 hr': '2–3 h', '3–4 hr': '3–4 h', '3–5 hr': '3–5 h' },
  },
  fr: {
    title: 'Idées de Rendez-vous', subtitle: 'Des façons simples de passer un moment intentionnel ensemble.', back: 'Retour', filters: 'Trouvez une idée adaptée', all: 'Toutes', category: 'Catégorie', budget: 'Budget', location: 'Lieu', occasion: 'Occasion', stage: 'Étape de la relation', duration: 'Durée suggérée', noIdeas: 'Aucune idée ne correspond à ces filtres.',
    stagedTitle: 'Les outils privés sont préparés', stagedText: 'Le catalogue intégré reste gratuit. Enregistrement, création, favoris et suivi seront activés seulement après les tests contrôlés de propriété du stockage privé.',
    categories: { romantic: 'Romantique', adventure: 'Aventure', relaxing: 'Détente', indoor: 'Intérieur', outdoor: 'Extérieur', creative: 'Créatif' }, budgets: { free: 'Gratuit', low: 'Bas ($)', medium: 'Moyen ($$)', high: 'Élevé ($$$)' }, locations: { home: 'Maison', outdoor: 'Extérieur', restaurant: 'Restaurant', activity_center: "Centre d'activités", cultural: 'Culturel', nature: 'Nature', urban: 'Urbain' }, occasions: { regular: 'Rendez-vous habituel', anniversary: 'Anniversaire', birthday: 'Anniversaire de naissance', valentines: 'Saint-Valentin', special: 'Spécial', apology: 'Reconnexion', celebration: 'Célébration' }, stages: { new: 'Nouvelle relation', dating: 'Fréquentation', committed: 'Engagés', married: 'Mariés', long_term: 'Long terme', any: 'Toutes les étapes' },
    durations: { '1–2 hr': '1–2 h', '2–3 hr': '2–3 h', '3–4 hr': '3–4 h', '3–5 hr': '3–5 h' },
  },
  it: {
    title: 'Idee per Appuntamenti', subtitle: 'Modi semplici per trascorrere tempo intenzionale insieme.', back: 'Indietro', filters: 'Trova un’idea adatta', all: 'Tutte', category: 'Categoria', budget: 'Budget', location: 'Luogo', occasion: 'Occasione', stage: 'Fase della relazione', duration: 'Tempo suggerito', noIdeas: 'Nessuna idea corrisponde a questi filtri.',
    stagedTitle: 'Gli strumenti privati sono in preparazione', stagedText: 'Il catalogo integrato resta gratuito. Salvataggio, creazione, preferiti e completamento saranno attivati solo dopo i test controllati di proprietà dello storage privato.',
    categories: { romantic: 'Romantico', adventure: 'Avventura', relaxing: 'Rilassante', indoor: 'Al chiuso', outdoor: 'All’aperto', creative: 'Creativo' }, budgets: { free: 'Gratis', low: 'Basso ($)', medium: 'Medio ($$)', high: 'Alto ($$$)' }, locations: { home: 'Casa', outdoor: 'All’aperto', restaurant: 'Ristorante', activity_center: 'Centro attività', cultural: 'Culturale', nature: 'Natura', urban: 'Urbano' }, occasions: { regular: 'Appuntamento normale', anniversary: 'Anniversario', birthday: 'Compleanno', valentines: 'San Valentino', special: 'Speciale', apology: 'Riconnessione', celebration: 'Celebrazione' }, stages: { new: 'Nuova relazione', dating: 'Frequentazione', committed: 'Impegnati', married: 'Sposati', long_term: 'Lungo termine', any: 'Qualsiasi fase' },
    durations: { '1–2 hr': '1–2 ore', '2–3 hr': '2–3 ore', '3–4 hr': '3–4 ore', '3–5 hr': '3–5 ore' },
  },
  de: {
    title: 'Date-Ideen', subtitle: 'Einfache Möglichkeiten, bewusst Zeit miteinander zu verbringen.', back: 'Zurück', filters: 'Finde eine passende Idee', all: 'Alle', category: 'Kategorie', budget: 'Budget', location: 'Ort', occasion: 'Anlass', stage: 'Beziehungsphase', duration: 'Empfohlene Zeit', noIdeas: 'Keine Date-Idee passt zu diesen Filtern.',
    stagedTitle: 'Private Date-Ideen-Werkzeuge sind vorbereitet', stagedText: 'Der integrierte Katalog bleibt kostenlos. Speichern, Erstellen, Favoriten und Erledigt-Tracking werden erst nach kontrollierten Eigentümertests des privaten Speichers aktiviert.',
    categories: { romantic: 'Romantisch', adventure: 'Abenteuer', relaxing: 'Entspannt', indoor: 'Drinnen', outdoor: 'Draußen', creative: 'Kreativ' }, budgets: { free: 'Kostenlos', low: 'Niedrig ($)', medium: 'Mittel ($$)', high: 'Hoch ($$$)' }, locations: { home: 'Zuhause', outdoor: 'Draußen', restaurant: 'Restaurant', activity_center: 'Aktivitätszentrum', cultural: 'Kulturell', nature: 'Natur', urban: 'Städtisch' }, occasions: { regular: 'Normales Date', anniversary: 'Jahrestag', birthday: 'Geburtstag', valentines: 'Valentinstag', special: 'Besonders', apology: 'Wiederannäherung', celebration: 'Feier' }, stages: { new: 'Neue Beziehung', dating: 'Dating', committed: 'Fest', married: 'Verheiratet', long_term: 'Langfristig', any: 'Jede Phase' },
    durations: { '1–2 hr': '1–2 Std.', '2–3 hr': '2–3 Std.', '3–4 hr': '3–4 Std.', '3–5 hr': '3–5 Std.' },
  },
  nl: {
    title: 'Date-ideeën', subtitle: 'Eenvoudige manieren om bewust tijd samen door te brengen.', back: 'Terug', filters: 'Vind een passend idee', all: 'Alle', category: 'Categorie', budget: 'Budget', location: 'Locatie', occasion: 'Gelegenheid', stage: 'Relatiefase', duration: 'Aanbevolen tijd', noIdeas: 'Geen Date-idee past bij deze filters.',
    stagedTitle: 'Privé Date-idee-tools zijn voorbereid', stagedText: 'De ingebouwde catalogus blijft gratis. Opslaan, maken, favorieten en voltooiing worden pas geactiveerd nadat privé-opslag gecontroleerde eigendomstests heeft doorstaan.',
    categories: { romantic: 'Romantisch', adventure: 'Avontuur', relaxing: 'Ontspannen', indoor: 'Binnen', outdoor: 'Buiten', creative: 'Creatief' }, budgets: { free: 'Gratis', low: 'Laag ($)', medium: 'Gemiddeld ($$)', high: 'Hoog ($$$)' }, locations: { home: 'Thuis', outdoor: 'Buiten', restaurant: 'Restaurant', activity_center: 'Activiteitencentrum', cultural: 'Cultureel', nature: 'Natuur', urban: 'Stedelijk' }, occasions: { regular: 'Gewone date', anniversary: 'Jubileum', birthday: 'Verjaardag', valentines: 'Valentijnsdag', special: 'Speciaal', apology: 'Opnieuw verbinden', celebration: 'Viering' }, stages: { new: 'Nieuwe relatie', dating: 'Daten', committed: 'Vaste relatie', married: 'Getrouwd', long_term: 'Langdurig', any: 'Elke fase' },
    durations: { '1–2 hr': '1–2 uur', '2–3 hr': '2–3 uur', '3–4 hr': '3–4 uur', '3–5 hr': '3–5 uur' },
  },
};

const ICONS = { star: Star, utensils: Utensils, coffee: Coffee, film: Film, music: Music, mountain: Mountain, waves: Waves, sparkles: Sparkles, map: MapPin };

export default function DateIdeasRelaunchBrowse() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const ideas = useMemo(() => getBuiltInDateIdeas(language), [language]);
  const [filters, setFilters] = useState({ category: 'all', budget: 'all', location_type: 'all', occasion: 'all', relationship_stage: 'all' });

  const visible = ideas.filter((idea) => {
    if (filters.category !== 'all' && idea.category !== filters.category) return false;
    if (filters.budget !== 'all' && idea.budget !== filters.budget) return false;
    if (filters.location_type !== 'all' && idea.location_type !== filters.location_type) return false;
    if (filters.occasion !== 'all' && idea.occasion !== filters.occasion) return false;
    if (filters.relationship_stage !== 'all' && idea.relationship_stage !== 'any' && idea.relationship_stage !== filters.relationship_stage) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="inline-flex items-center rounded-xl px-4 py-2 text-gray-600 transition hover:bg-white/70 hover:text-purple-700"><ArrowLeft className="mr-2 h-5 w-5" />{t.back}</Link>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Heart className="h-10 w-10 fill-white text-white" /></div>
          <h1 className="text-4xl font-black text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mt-3 text-lg text-gray-600">{t.subtitle}</p>
        </motion.div>

        <div className="mx-auto mt-7 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 flex-none text-amber-700" /><div><p className="font-black">{t.stagedTitle}</p><p className="mt-1">{t.stagedText}</p></div></div>
        </div>

        <Card className="mt-8 border-0 bg-white/85 shadow-sm">
          <CardHeader><CardTitle className="text-lg">{t.filters}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Filter label={t.category} value={filters.category} options={t.categories} all={t.all} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
            <Filter label={t.budget} value={filters.budget} options={t.budgets} all={t.all} onChange={(value) => setFilters((current) => ({ ...current, budget: value }))} />
            <Filter label={t.location} value={filters.location_type} options={t.locations} all={t.all} onChange={(value) => setFilters((current) => ({ ...current, location_type: value }))} />
            <Filter label={t.occasion} value={filters.occasion} options={t.occasions} all={t.all} onChange={(value) => setFilters((current) => ({ ...current, occasion: value }))} />
            <Filter label={t.stage} value={filters.relationship_stage} options={t.stages} all={t.all} onChange={(value) => setFilters((current) => ({ ...current, relationship_stage: value }))} />
          </CardContent>
        </Card>

        {!visible.length ? (
          <div className="py-16 text-center"><Heart className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-3 text-gray-500">{t.noIdeas}</p></div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((idea, index) => {
              const Icon = ICONS[idea.icon] || Heart;
              return (
                <motion.div key={idea.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index * 0.04, 0.28) }}>
                  <Card className="h-full border-2 border-transparent transition hover:border-pink-200 hover:shadow-xl">
                    <CardHeader><div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${idea.color || 'from-pink-500 to-purple-600'} shadow-lg`}><Icon className="h-7 w-7 text-white" /></div><CardTitle className="text-xl">{idea.title}</CardTitle></CardHeader>
                    <CardContent><p className="leading-7 text-gray-600">{idea.description}</p><div className="mt-5 space-y-2 rounded-xl bg-gray-50 p-3 text-sm"><Meta label={t.category} value={t.categories[idea.category] || idea.category} /><Meta label={t.budget} value={t.budgets[idea.budget] || idea.budget} /><Meta label={t.location} value={t.locations[idea.location_type] || idea.location_type} /><Meta label={t.occasion} value={t.occasions[idea.occasion] || idea.occasion} /><Meta label={t.stage} value={t.stages[idea.relationship_stage] || idea.relationship_stage} /><Meta label={t.duration} value={t.durations[idea.duration] || idea.duration} /></div></CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Filter({ label, value, options, all, onChange }) {
  return <div><label className="mb-1 block text-xs font-bold text-gray-500">{label}</label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{all}</SelectItem>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select></div>;
}

function Meta({ label, value }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-gray-500">{label}</span><span className="text-right font-semibold text-gray-700">{value || '—'}</span></div>;
}
