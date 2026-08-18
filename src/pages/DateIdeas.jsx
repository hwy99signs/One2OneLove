import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, Check, Coffee, Film, Heart, MapPin, Music, Pencil, Plus, Sparkles, Star, Trash2, Utensils, Waves, Mountain, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomDateForm from '@/components/dateideas/CustomDateForm';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { getBuiltInDateIdeas } from '@/lib/dateIdeasCatalog';
import {
  createMyDateIdea,
  deleteMyDateIdea,
  listMyDateIdeas,
  saveBuiltInDateIdea,
  updateMyDateIdea,
} from '@/lib/dateIdeasService';

const translations = {
  en: {
    title: 'Date Ideas', subtitle: 'Simple ways to spend intentional time together.', back: 'Back', explore: 'Explore Ideas', mine: 'My Ideas', saved: 'Saved', create: 'Create Your Own', signInHint: 'Browse freely. Sign in only when you want to save or create an idea.', signIn: 'Sign in to save', accountUnavailable: 'Your saved Date Ideas are temporarily unavailable, but you can still browse the built-in ideas.', noIdeas: 'No Date Ideas match those filters.', filters: 'Filters', all: 'All', category: 'Category', budget: 'Budget', location: 'Location', occasion: 'Occasion', stage: 'Relationship stage', duration: 'Suggested time', save: 'Save', savedLabel: 'Saved', details: 'Details', hideDetails: 'Hide details', favorite: 'Favorite', removeFavorite: 'Remove favorite', done: 'Mark done', undoDone: 'Mark not done', edit: 'Edit', delete: 'Delete', created: 'Date Idea saved!', updated: 'Date Idea updated!', deleted: 'Date Idea deleted', complete: 'Nice — marked done!', categories: { romantic: 'Romantic', adventure: 'Adventure', relaxing: 'Relaxing', indoor: 'Indoor', outdoor: 'Outdoor', creative: 'Creative' }, budgets: { free: 'Free', low: 'Low ($)', medium: 'Medium ($$)', high: 'High ($$$)' }, locations: { home: 'Home', outdoor: 'Outdoor', restaurant: 'Restaurant', activity_center: 'Activity Center', cultural: 'Cultural', nature: 'Nature', urban: 'Urban' }, occasions: { regular: 'Regular Date', anniversary: 'Anniversary', birthday: 'Birthday', valentines: "Valentine's Day", special: 'Special', apology: 'Reconnection', celebration: 'Celebration' }, stages: { new: 'New Relationship', dating: 'Dating', committed: 'Committed', married: 'Married', long_term: 'Long-term', any: 'Any Stage' },
  },
  es: {
    title: 'Ideas para Citas', subtitle: 'Formas sencillas de pasar tiempo de calidad juntos.', back: 'Volver', explore: 'Explorar Ideas', mine: 'Mis Ideas', saved: 'Guardadas', create: 'Crear la Tuya', signInHint: 'Explora libremente. Inicia sesión solo cuando quieras guardar o crear una idea.', signIn: 'Inicia sesión para guardar', accountUnavailable: 'Tus ideas guardadas no están disponibles temporalmente, pero puedes seguir explorando.', noIdeas: 'Ninguna idea coincide con esos filtros.', filters: 'Filtros', all: 'Todas', category: 'Categoría', budget: 'Presupuesto', location: 'Lugar', occasion: 'Ocasión', stage: 'Etapa de la relación', duration: 'Tiempo sugerido', save: 'Guardar', savedLabel: 'Guardada', details: 'Detalles', hideDetails: 'Ocultar detalles', favorite: 'Favorita', removeFavorite: 'Quitar favorita', done: 'Marcar hecha', undoDone: 'Marcar no hecha', edit: 'Editar', delete: 'Eliminar', created: '¡Idea guardada!', updated: '¡Idea actualizada!', deleted: 'Idea eliminada', complete: '¡Listo, marcada como hecha!', categories: { romantic: 'Romántica', adventure: 'Aventura', relaxing: 'Relajante', indoor: 'Interior', outdoor: 'Exterior', creative: 'Creativa' }, budgets: { free: 'Gratis', low: 'Bajo ($)', medium: 'Medio ($$)', high: 'Alto ($$$)' }, locations: { home: 'Casa', outdoor: 'Exterior', restaurant: 'Restaurante', activity_center: 'Centro de actividades', cultural: 'Cultural', nature: 'Naturaleza', urban: 'Urbano' }, occasions: { regular: 'Cita normal', anniversary: 'Aniversario', birthday: 'Cumpleaños', valentines: 'San Valentín', special: 'Especial', apology: 'Reconexión', celebration: 'Celebración' }, stages: { new: 'Relación nueva', dating: 'Saliendo', committed: 'Comprometida', married: 'Casados', long_term: 'Largo plazo', any: 'Cualquier etapa' },
  },
  fr: {
    title: 'Idées de Rendez-vous', subtitle: 'Des façons simples de passer un moment intentionnel ensemble.', back: 'Retour', explore: 'Explorer', mine: 'Mes Idées', saved: 'Enregistrées', create: 'Créer la Vôtre', signInHint: 'Explorez librement. Connectez-vous seulement pour enregistrer ou créer une idée.', signIn: 'Se connecter pour enregistrer', accountUnavailable: 'Vos idées enregistrées sont temporairement indisponibles, mais vous pouvez continuer à explorer.', noIdeas: 'Aucune idée ne correspond à ces filtres.', filters: 'Filtres', all: 'Toutes', category: 'Catégorie', budget: 'Budget', location: 'Lieu', occasion: 'Occasion', stage: 'Étape de la relation', duration: 'Durée suggérée', save: 'Enregistrer', savedLabel: 'Enregistrée', details: 'Détails', hideDetails: 'Masquer', favorite: 'Favorite', removeFavorite: 'Retirer des favorites', done: 'Marquer faite', undoDone: 'Marquer non faite', edit: 'Modifier', delete: 'Supprimer', created: 'Idée enregistrée !', updated: 'Idée mise à jour !', deleted: 'Idée supprimée', complete: 'Parfait — marquée comme faite !', categories: { romantic: 'Romantique', adventure: 'Aventure', relaxing: 'Détente', indoor: 'Intérieur', outdoor: 'Extérieur', creative: 'Créatif' }, budgets: { free: 'Gratuit', low: 'Bas ($)', medium: 'Moyen ($$)', high: 'Élevé ($$$)' }, locations: { home: 'Maison', outdoor: 'Extérieur', restaurant: 'Restaurant', activity_center: "Centre d'activités", cultural: 'Culturel', nature: 'Nature', urban: 'Urbain' }, occasions: { regular: 'Rendez-vous habituel', anniversary: 'Anniversaire', birthday: 'Anniversaire de naissance', valentines: 'Saint-Valentin', special: 'Spécial', apology: 'Reconnexion', celebration: 'Célébration' }, stages: { new: 'Nouvelle relation', dating: 'Fréquentation', committed: 'Engagés', married: 'Mariés', long_term: 'Long terme', any: 'Toutes les étapes' },
  },
  it: {
    title: 'Idee per Appuntamenti', subtitle: 'Modi semplici per trascorrere tempo intenzionale insieme.', back: 'Indietro', explore: 'Esplora Idee', mine: 'Le Mie Idee', saved: 'Salvate', create: 'Crea la Tua', signInHint: 'Esplora liberamente. Accedi solo quando vuoi salvare o creare un’idea.', signIn: 'Accedi per salvare', accountUnavailable: 'Le tue idee salvate non sono disponibili al momento, ma puoi continuare a esplorare.', noIdeas: 'Nessuna idea corrisponde a questi filtri.', filters: 'Filtri', all: 'Tutte', category: 'Categoria', budget: 'Budget', location: 'Luogo', occasion: 'Occasione', stage: 'Fase della relazione', duration: 'Tempo suggerito', save: 'Salva', savedLabel: 'Salvata', details: 'Dettagli', hideDetails: 'Nascondi dettagli', favorite: 'Preferita', removeFavorite: 'Rimuovi preferita', done: 'Segna fatta', undoDone: 'Segna non fatta', edit: 'Modifica', delete: 'Elimina', created: 'Idea salvata!', updated: 'Idea aggiornata!', deleted: 'Idea eliminata', complete: 'Fatto — segnata come completata!', categories: { romantic: 'Romantico', adventure: 'Avventura', relaxing: 'Rilassante', indoor: 'Al chiuso', outdoor: 'All’aperto', creative: 'Creativo' }, budgets: { free: 'Gratis', low: 'Basso ($)', medium: 'Medio ($$)', high: 'Alto ($$$)' }, locations: { home: 'Casa', outdoor: 'All’aperto', restaurant: 'Ristorante', activity_center: 'Centro attività', cultural: 'Culturale', nature: 'Natura', urban: 'Urbano' }, occasions: { regular: 'Appuntamento normale', anniversary: 'Anniversario', birthday: 'Compleanno', valentines: 'San Valentino', special: 'Speciale', apology: 'Riconnessione', celebration: 'Celebrazione' }, stages: { new: 'Nuova relazione', dating: 'Frequentazione', committed: 'Impegnati', married: 'Sposati', long_term: 'Lungo termine', any: 'Qualsiasi fase' },
  },
  de: {
    title: 'Date-Ideen', subtitle: 'Einfache Möglichkeiten, bewusst Zeit miteinander zu verbringen.', back: 'Zurück', explore: 'Ideen Entdecken', mine: 'Meine Ideen', saved: 'Gespeichert', create: 'Eigene Idee', signInHint: 'Stöbern Sie frei. Melden Sie sich erst an, wenn Sie speichern oder erstellen möchten.', signIn: 'Zum Speichern anmelden', accountUnavailable: 'Ihre gespeicherten Date-Ideen sind vorübergehend nicht verfügbar; die eingebauten Ideen können Sie weiter ansehen.', noIdeas: 'Keine Date-Idee passt zu diesen Filtern.', filters: 'Filter', all: 'Alle', category: 'Kategorie', budget: 'Budget', location: 'Ort', occasion: 'Anlass', stage: 'Beziehungsphase', duration: 'Empfohlene Zeit', save: 'Speichern', savedLabel: 'Gespeichert', details: 'Details', hideDetails: 'Details ausblenden', favorite: 'Favorit', removeFavorite: 'Favorit entfernen', done: 'Als erledigt markieren', undoDone: 'Als nicht erledigt markieren', edit: 'Bearbeiten', delete: 'Löschen', created: 'Date-Idee gespeichert!', updated: 'Date-Idee aktualisiert!', deleted: 'Date-Idee gelöscht', complete: 'Erledigt — als gemacht markiert!', categories: { romantic: 'Romantisch', adventure: 'Abenteuer', relaxing: 'Entspannt', indoor: 'Drinnen', outdoor: 'Draußen', creative: 'Kreativ' }, budgets: { free: 'Kostenlos', low: 'Niedrig ($)', medium: 'Mittel ($$)', high: 'Hoch ($$$)' }, locations: { home: 'Zuhause', outdoor: 'Draußen', restaurant: 'Restaurant', activity_center: 'Aktivitätszentrum', cultural: 'Kulturell', nature: 'Natur', urban: 'Städtisch' }, occasions: { regular: 'Normales Date', anniversary: 'Jahrestag', birthday: 'Geburtstag', valentines: 'Valentinstag', special: 'Besonders', apology: 'Wiederannäherung', celebration: 'Feier' }, stages: { new: 'Neue Beziehung', dating: 'Dating', committed: 'Fest', married: 'Verheiratet', long_term: 'Langfristig', any: 'Jede Phase' },
  },
  nl: {
    title: 'Date-ideeën', subtitle: 'Eenvoudige manieren om bewust tijd samen door te brengen.', back: 'Terug', explore: 'Ontdek Ideeën', mine: 'Mijn Ideeën', saved: 'Opgeslagen', create: 'Maak Je Eigen Idee', signInHint: 'Blader vrij rond. Log pas in wanneer je een idee wilt opslaan of maken.', signIn: 'Log in om op te slaan', accountUnavailable: 'Je opgeslagen Date-ideeën zijn tijdelijk niet beschikbaar, maar je kunt de ingebouwde ideeën blijven bekijken.', noIdeas: 'Geen Date-idee past bij deze filters.', filters: 'Filters', all: 'Alle', category: 'Categorie', budget: 'Budget', location: 'Locatie', occasion: 'Gelegenheid', stage: 'Relatiefase', duration: 'Aanbevolen tijd', save: 'Opslaan', savedLabel: 'Opgeslagen', details: 'Details', hideDetails: 'Details verbergen', favorite: 'Favoriet', removeFavorite: 'Favoriet verwijderen', done: 'Markeer gedaan', undoDone: 'Markeer niet gedaan', edit: 'Bewerken', delete: 'Verwijderen', created: 'Date-idee opgeslagen!', updated: 'Date-idee bijgewerkt!', deleted: 'Date-idee verwijderd', complete: 'Mooi — gemarkeerd als gedaan!', categories: { romantic: 'Romantisch', adventure: 'Avontuur', relaxing: 'Ontspannen', indoor: 'Binnen', outdoor: 'Buiten', creative: 'Creatief' }, budgets: { free: 'Gratis', low: 'Laag ($)', medium: 'Gemiddeld ($$)', high: 'Hoog ($$$)' }, locations: { home: 'Thuis', outdoor: 'Buiten', restaurant: 'Restaurant', activity_center: 'Activiteitencentrum', cultural: 'Cultureel', nature: 'Natuur', urban: 'Stedelijk' }, occasions: { regular: 'Gewone date', anniversary: 'Jubileum', birthday: 'Verjaardag', valentines: 'Valentijnsdag', special: 'Speciaal', apology: 'Opnieuw verbinden', celebration: 'Viering' }, stages: { new: 'Nieuwe relatie', dating: 'Daten', committed: 'Vaste relatie', married: 'Getrouwd', long_term: 'Langdurig', any: 'Elke fase' },
  },
};

const ICONS = { star: Star, utensils: Utensils, coffee: Coffee, film: Film, music: Music, mountain: Mountain, waves: Waves, sparkles: Sparkles, map: MapPin };

export default function DateIdeas() {
  const { currentLanguage } = useLanguage();
  const language = translations[currentLanguage] ? currentLanguage : 'en';
  const t = translations[language];
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState('explore');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({ category: 'all', budget: 'all', location_type: 'all', occasion: 'all', relationship_stage: 'all' });

  const builtIns = useMemo(() => getBuiltInDateIdeas(language), [language]);

  const myIdeasQuery = useQuery({
    queryKey: ['dateIdeas', user?.id],
    queryFn: listMyDateIdeas,
    enabled: Boolean(isAuthenticated && user?.id),
    retry: 1,
  });

  const myIdeas = myIdeasQuery.data || [];
  const savedIdeas = myIdeas.filter((idea) => idea.is_favorite);

  const requireAccount = () => {
    if (isAuthenticated && user?.id) return true;
    navigate(`/SignIn?returnTo=${encodeURIComponent('/DateIdeas')}`);
    return false;
  };

  const refreshMine = () => queryClient.invalidateQueries({ queryKey: ['dateIdeas'] });

  const createMutation = useMutation({
    mutationFn: createMyDateIdea,
    onSuccess: () => {
      void refreshMine();
      setShowCustomForm(false);
      setEditingIdea(null);
      setView('mine');
      toast.success(t.created);
    },
    onError: (error) => toast.error(error?.message || t.accountUnavailable),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => updateMyDateIdea(id, patch),
    onSuccess: () => {
      void refreshMine();
      setShowCustomForm(false);
      setEditingIdea(null);
      toast.success(t.updated);
    },
    onError: (error) => toast.error(error?.message || t.accountUnavailable),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMyDateIdea,
    onSuccess: () => {
      void refreshMine();
      toast.success(t.deleted);
    },
    onError: (error) => toast.error(error?.message || t.accountUnavailable),
  });

  const saveBuiltInMutation = useMutation({
    mutationFn: saveBuiltInDateIdea,
    onSuccess: () => {
      void refreshMine();
      toast.success(t.created);
    },
    onError: (error) => toast.error(error?.message || t.accountUnavailable),
  });

  const openCreate = () => {
    if (!requireAccount()) return;
    setEditingIdea(null);
    setShowCustomForm(true);
  };

  const openEdit = (idea) => {
    if (!requireAccount()) return;
    setEditingIdea(idea);
    setShowCustomForm(true);
  };

  const handleCustomSubmit = (values) => {
    if (!requireAccount()) return;
    if (editingIdea?.id) updateMutation.mutate({ id: editingIdea.id, patch: values });
    else createMutation.mutate(values);
  };

  const toggleFavorite = (idea) => {
    if (!requireAccount()) return;
    updateMutation.mutate({ id: idea.id, patch: { is_favorite: !idea.is_favorite } });
  };

  const toggleComplete = (idea) => {
    if (!requireAccount()) return;
    updateMutation.mutate({ id: idea.id, patch: { is_completed: !idea.is_completed } }, {
      onSuccess: () => {
        void refreshMine();
        toast.success(!idea.is_completed ? t.complete : t.updated);
      },
    });
  };

  const removeIdea = (idea) => {
    if (!requireAccount()) return;
    if (!window.confirm(`${t.delete}: ${idea.title}?`)) return;
    deleteMutation.mutate(idea.id);
  };

  const saveBuiltIn = (idea) => {
    if (!requireAccount()) return;
    saveBuiltInMutation.mutate(idea);
  };

  const sourceIdeas = view === 'explore' ? builtIns : view === 'saved' ? savedIdeas : myIdeas;
  const filteredIdeas = sourceIdeas.filter((idea) => {
    if (filters.category !== 'all' && idea.category !== filters.category) return false;
    if (filters.budget !== 'all' && idea.budget !== filters.budget) return false;
    if (filters.location_type !== 'all' && idea.location_type !== filters.location_type) return false;
    if (filters.occasion !== 'all' && idea.occasion !== filters.occasion) return false;
    if (filters.relationship_stage !== 'all' && idea.relationship_stage !== 'any' && idea.relationship_stage !== filters.relationship_stage) return false;
    return true;
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link to={createPageUrl('Home')} className="mb-6 inline-flex items-center rounded-xl px-4 py-2 text-gray-600 transition hover:bg-white/70 hover:text-purple-700"><ArrowLeft className="mr-2 h-5 w-5" />{t.back}</Link>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-9 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Heart className="h-10 w-10 fill-white text-white" /></div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">{t.subtitle}</p>
          {!isAuthenticated && <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">{t.signInHint}</p>}
        </motion.div>

        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Tab active={view === 'explore'} onClick={() => setView('explore')}>{t.explore}</Tab>
            <Tab active={view === 'mine'} onClick={() => isAuthenticated ? setView('mine') : requireAccount()}>{t.mine}{isAuthenticated ? ` (${myIdeas.length})` : ''}</Tab>
            <Tab active={view === 'saved'} onClick={() => isAuthenticated ? setView('saved') : requireAccount()}><Bookmark className="mr-2 h-4 w-4" />{t.saved}{isAuthenticated ? ` (${savedIdeas.length})` : ''}</Tab>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"><Plus className="mr-2 h-4 w-4" />{t.create}</Button>
        </div>

        <AnimatePresence>
          {showCustomForm && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="mb-8">
              <CustomDateForm
                dateIdea={editingIdea}
                onSubmit={handleCustomSubmit}
                onCancel={() => { setShowCustomForm(false); setEditingIdea(null); }}
                isSaving={isSaving}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isAuthenticated && myIdeasQuery.isError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{t.accountUnavailable}</div>
        )}

        <Card className="mb-8 border-0 bg-white/80 shadow-sm">
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-600" /><span className="text-sm font-semibold text-gray-700">{t.filters}</span></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <FilterSelect label={t.category} value={filters.category} options={t.categories} allLabel={t.all} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
              <FilterSelect label={t.budget} value={filters.budget} options={t.budgets} allLabel={t.all} onChange={(value) => setFilters((current) => ({ ...current, budget: value }))} />
              <FilterSelect label={t.location} value={filters.location_type} options={t.locations} allLabel={t.all} onChange={(value) => setFilters((current) => ({ ...current, location_type: value }))} />
              <FilterSelect label={t.occasion} value={filters.occasion} options={t.occasions} allLabel={t.all} onChange={(value) => setFilters((current) => ({ ...current, occasion: value }))} />
              <FilterSelect label={t.stage} value={filters.relationship_stage} options={t.stages} allLabel={t.all} onChange={(value) => setFilters((current) => ({ ...current, relationship_stage: value }))} />
            </div>
          </CardContent>
        </Card>

        {filteredIdeas.length === 0 ? (
          <div className="py-14 text-center"><Heart className="mx-auto mb-4 h-14 w-14 text-gray-300" /><p className="text-gray-500">{t.noIdeas}</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIdeas.map((idea, index) => (
              <DateIdeaCard
                key={idea.id}
                idea={idea}
                index={index}
                t={t}
                expanded={expandedId === idea.id}
                onToggleDetails={() => setExpandedId((current) => current === idea.id ? null : idea.id)}
                onSaveBuiltIn={saveBuiltIn}
                onFavorite={toggleFavorite}
                onComplete={toggleComplete}
                onEdit={openEdit}
                onDelete={removeIdea}
                busy={saveBuiltInMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return <Button type="button" variant={active ? 'default' : 'outline'} onClick={onClick} className={active ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}>{children}</Button>;
}

function FilterSelect({ label, value, options, allLabel, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">{allLabel}</SelectItem>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function DateIdeaCard({ idea, index, t, expanded, onToggleDetails, onSaveBuiltIn, onFavorite, onComplete, onEdit, onDelete, busy }) {
  const Icon = idea.source === 'builtin' ? (ICONS[idea.icon] || Heart) : Heart;
  const custom = idea.source !== 'builtin' && !String(idea.id).startsWith('builtin-');

  const option = (map, value) => map?.[value] || value || '—';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index * 0.04, 0.3) }}>
      <Card className="h-full overflow-hidden border-2 border-transparent transition hover:border-pink-200 hover:shadow-xl">
        <CardHeader>
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${idea.color || 'from-pink-500 to-purple-600'} shadow-lg`}><Icon className="h-7 w-7 text-white" /></div>
          <CardTitle className="flex items-start gap-2 text-xl"><span className="flex-1">{idea.title}</span>{idea.is_completed && <Check className="mt-1 h-5 w-5 flex-shrink-0 text-green-600" />}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 leading-relaxed text-gray-600">{idea.description || '—'}</p>

          <button type="button" onClick={onToggleDetails} className="mb-3 flex w-full items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            <span>{expanded ? t.hideDetails : t.details}</span>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expanded && (
            <div className="mb-4 space-y-2 rounded-xl border border-gray-100 bg-white p-3 text-sm">
              <Meta label={t.category} value={option(t.categories, idea.category)} />
              <Meta label={t.budget} value={option(t.budgets, idea.budget)} />
              <Meta label={t.location} value={option(t.locations, idea.location_type)} />
              <Meta label={t.occasion} value={option(t.occasions, idea.occasion)} />
              <Meta label={t.stage} value={option(t.stages, idea.relationship_stage)} />
              {idea.duration && <Meta label={t.duration} value={idea.duration} />}
            </div>
          )}

          {idea.source === 'builtin' ? (
            <Button type="button" onClick={() => onSaveBuiltIn(idea)} disabled={busy} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"><Bookmark className="mr-2 h-4 w-4" />{t.save}</Button>
          ) : custom ? (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => onFavorite(idea)} disabled={busy}><Bookmark className={`mr-2 h-4 w-4 ${idea.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />{idea.is_favorite ? t.removeFavorite : t.favorite}</Button>
              <Button type="button" variant="outline" onClick={() => onComplete(idea)} disabled={busy}><Check className="mr-2 h-4 w-4" />{idea.is_completed ? t.undoDone : t.done}</Button>
              <Button type="button" variant="outline" onClick={() => onEdit(idea)} disabled={busy}><Pencil className="mr-2 h-4 w-4" />{t.edit}</Button>
              <Button type="button" variant="outline" onClick={() => onDelete(idea)} disabled={busy} className="text-red-600 hover:text-red-700"><Trash2 className="mr-2 h-4 w-4" />{t.delete}</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Meta({ label, value }) {
  return <div className="flex items-start justify-between gap-3"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-700">{value}</span></div>;
}
