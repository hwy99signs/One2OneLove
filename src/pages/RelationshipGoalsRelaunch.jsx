import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Edit3, Loader2, Plus, Target, Trash2, TrendingUp, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import {
  createRelationshipGoal,
  deleteRelationshipGoal,
  listRelationshipGoals,
  updateRelationshipGoal,
  updateRelationshipGoalProgress,
} from '@/lib/relationshipGoalsService';

const COPY = {
  en: { locale: 'en-US', title: 'Relationship Goals', subtitle: 'Set a meaningful goal, break it into small steps, and track your progress.', back: 'Back to Support', add: 'Add Goal', active: 'Active Goals', completed: 'Completed Goals', total: 'Total Goals', avg: 'Average Progress', empty: 'No goals yet', emptyDesc: 'Create one focused goal you want to work toward.', signInTitle: 'Sign in to use Relationship Goals', signInDesc: 'Your goals are private account data and are available to signed-in members.', signIn: 'Sign In', createFree: 'Create Free Account', edit: 'Edit', delete: 'Delete', progress: 'Progress', updateProgress: 'Update Progress', target: 'Target', steps: 'Action Steps', noSteps: 'No action steps yet.', formAdd: 'Add Relationship Goal', formEdit: 'Edit Relationship Goal', goalTitle: 'Goal title', titlePlaceholder: 'e.g., Make one evening a week distraction-free', description: 'Description', descriptionPlaceholder: 'Why does this goal matter?', category: 'Category', targetDate: 'Target date', addStep: 'Add step', stepPlaceholder: 'A small action you can actually do', save: 'Save Goal', cancel: 'Cancel', saving: 'Saving…', progressTitle: 'Update Progress', markComplete: '100% marks this goal complete.', update: 'Update', privateNote: 'This goal is private to your account. SMS reminders and partner-sharing are not presented until those services are genuinely implemented.', created: 'Goal saved.', updated: 'Goal updated.', deleted: 'Goal deleted.', failed: 'Relationship Goals is temporarily unavailable.', categories: { communication: 'Communication', quality_time: 'Quality Time', intimacy: 'Intimacy', personal_growth: 'Personal Growth', financial: 'Financial', family: 'Family', health: 'Health & Wellness', adventure: 'Adventure & Travel', home: 'Home & Living', career: 'Career & Goals' } },
  es: { locale: 'es-ES', title: 'Metas de Relación', subtitle: 'Define una meta significativa, divídela en pasos pequeños y sigue tu progreso.', back: 'Volver al Soporte', add: 'Agregar Meta', active: 'Metas Activas', completed: 'Metas Completadas', total: 'Metas Totales', avg: 'Progreso Promedio', empty: 'Aún no hay metas', emptyDesc: 'Crea una meta concreta en la que quieras trabajar.', signInTitle: 'Inicia sesión para usar Metas de Relación', signInDesc: 'Tus metas son datos privados de tu cuenta y están disponibles para miembros con sesión iniciada.', signIn: 'Iniciar Sesión', createFree: 'Crear Cuenta Gratis', edit: 'Editar', delete: 'Eliminar', progress: 'Progreso', updateProgress: 'Actualizar Progreso', target: 'Objetivo', steps: 'Pasos de Acción', noSteps: 'Aún no hay pasos de acción.', formAdd: 'Agregar Meta de Relación', formEdit: 'Editar Meta de Relación', goalTitle: 'Título de la meta', titlePlaceholder: 'ej., Tener una noche sin distracciones cada semana', description: 'Descripción', descriptionPlaceholder: '¿Por qué importa esta meta?', category: 'Categoría', targetDate: 'Fecha objetivo', addStep: 'Agregar paso', stepPlaceholder: 'Una acción pequeña que realmente puedas hacer', save: 'Guardar Meta', cancel: 'Cancelar', saving: 'Guardando…', progressTitle: 'Actualizar Progreso', markComplete: '100% marca esta meta como completada.', update: 'Actualizar', privateNote: 'Esta meta es privada en tu cuenta. Los recordatorios SMS y compartir con pareja no se muestran hasta que esos servicios estén realmente implementados.', created: 'Meta guardada.', updated: 'Meta actualizada.', deleted: 'Meta eliminada.', failed: 'Metas de Relación no está disponible temporalmente.', categories: { communication: 'Comunicación', quality_time: 'Tiempo de Calidad', intimacy: 'Intimidad', personal_growth: 'Crecimiento Personal', financial: 'Finanzas', family: 'Familia', health: 'Salud y Bienestar', adventure: 'Aventura y Viajes', home: 'Hogar y Vida', career: 'Carrera y Metas' } },
  fr: { locale: 'fr-FR', title: 'Objectifs de Relation', subtitle: 'Fixez un objectif significatif, divisez-le en petites étapes et suivez vos progrès.', back: 'Retour au Support', add: 'Ajouter un Objectif', active: 'Objectifs Actifs', completed: 'Objectifs Terminés', total: 'Objectifs Totaux', avg: 'Progrès Moyen', empty: 'Aucun objectif pour le moment', emptyDesc: 'Créez un objectif précis sur lequel vous souhaitez travailler.', signInTitle: 'Connectez-vous pour utiliser les Objectifs de Relation', signInDesc: 'Vos objectifs sont des données privées de votre compte et sont disponibles aux membres connectés.', signIn: 'Se Connecter', createFree: 'Créer un Compte Gratuit', edit: 'Modifier', delete: 'Supprimer', progress: 'Progrès', updateProgress: 'Mettre à Jour', target: 'Cible', steps: "Étapes d'Action", noSteps: "Aucune étape d'action pour le moment.", formAdd: 'Ajouter un Objectif de Relation', formEdit: 'Modifier un Objectif de Relation', goalTitle: "Titre de l'objectif", titlePlaceholder: 'Ex. : réserver une soirée sans distractions chaque semaine', description: 'Description', descriptionPlaceholder: 'Pourquoi cet objectif est-il important ?', category: 'Catégorie', targetDate: 'Date cible', addStep: 'Ajouter une étape', stepPlaceholder: 'Une petite action réalisable', save: "Enregistrer l'Objectif", cancel: 'Annuler', saving: 'Enregistrement…', progressTitle: 'Mettre à Jour le Progrès', markComplete: '100 % marque cet objectif comme terminé.', update: 'Mettre à Jour', privateNote: "Cet objectif est privé dans votre compte. Les rappels SMS et le partage avec un partenaire ne sont pas affichés tant que ces services ne sont pas réellement mis en œuvre.", created: 'Objectif enregistré.', updated: 'Objectif mis à jour.', deleted: 'Objectif supprimé.', failed: 'Les Objectifs de Relation sont temporairement indisponibles.', categories: { communication: 'Communication', quality_time: 'Temps de Qualité', intimacy: 'Intimité', personal_growth: 'Croissance Personnelle', financial: 'Finances', family: 'Famille', health: 'Santé et Bien-être', adventure: 'Aventure et Voyage', home: 'Maison et Vie', career: 'Carrière et Objectifs' } },
  it: { locale: 'it-IT', title: 'Obiettivi di Relazione', subtitle: 'Definisci un obiettivo significativo, dividilo in piccoli passi e monitora i progressi.', back: 'Torna al Supporto', add: 'Aggiungi Obiettivo', active: 'Obiettivi Attivi', completed: 'Obiettivi Completati', total: 'Obiettivi Totali', avg: 'Progresso Medio', empty: 'Nessun obiettivo ancora', emptyDesc: 'Crea un obiettivo preciso su cui vuoi lavorare.', signInTitle: 'Accedi per usare gli Obiettivi di Relazione', signInDesc: 'I tuoi obiettivi sono dati privati del tuo account e sono disponibili ai membri che hanno effettuato l’accesso.', signIn: 'Accedi', createFree: 'Crea Account Gratuito', edit: 'Modifica', delete: 'Elimina', progress: 'Progresso', updateProgress: 'Aggiorna Progresso', target: 'Obiettivo', steps: "Passi d'Azione", noSteps: 'Nessun passo ancora.', formAdd: 'Aggiungi Obiettivo di Relazione', formEdit: 'Modifica Obiettivo di Relazione', goalTitle: 'Titolo dell’obiettivo', titlePlaceholder: 'es., una sera senza distrazioni ogni settimana', description: 'Descrizione', descriptionPlaceholder: 'Perché questo obiettivo è importante?', category: 'Categoria', targetDate: 'Data obiettivo', addStep: 'Aggiungi passo', stepPlaceholder: 'Una piccola azione che puoi davvero fare', save: 'Salva Obiettivo', cancel: 'Annulla', saving: 'Salvataggio…', progressTitle: 'Aggiorna Progresso', markComplete: '100% segna questo obiettivo come completato.', update: 'Aggiorna', privateNote: 'Questo obiettivo è privato nel tuo account. Promemoria SMS e condivisione con il partner non vengono mostrati finché i servizi non sono realmente implementati.', created: 'Obiettivo salvato.', updated: 'Obiettivo aggiornato.', deleted: 'Obiettivo eliminato.', failed: 'Gli Obiettivi di Relazione non sono temporaneamente disponibili.', categories: { communication: 'Comunicazione', quality_time: 'Tempo di Qualità', intimacy: 'Intimità', personal_growth: 'Crescita Personale', financial: 'Finanze', family: 'Famiglia', health: 'Salute e Benessere', adventure: 'Avventura e Viaggi', home: 'Casa e Vita', career: 'Carriera e Obiettivi' } },
  de: { locale: 'de-DE', title: 'Beziehungsziele', subtitle: 'Setzen Sie ein sinnvolles Ziel, teilen Sie es in kleine Schritte und verfolgen Sie den Fortschritt.', back: 'Zurück zum Support', add: 'Ziel Hinzufügen', active: 'Aktive Ziele', completed: 'Abgeschlossene Ziele', total: 'Ziele Gesamt', avg: 'Durchschnittlicher Fortschritt', empty: 'Noch keine Ziele', emptyDesc: 'Erstellen Sie ein konkretes Ziel, an dem Sie arbeiten möchten.', signInTitle: 'Melden Sie sich für Beziehungsziele an', signInDesc: 'Ihre Ziele sind private Kontodaten und stehen angemeldeten Mitgliedern zur Verfügung.', signIn: 'Anmelden', createFree: 'Kostenloses Konto Erstellen', edit: 'Bearbeiten', delete: 'Löschen', progress: 'Fortschritt', updateProgress: 'Fortschritt Aktualisieren', target: 'Ziel', steps: 'Aktionsschritte', noSteps: 'Noch keine Aktionsschritte.', formAdd: 'Beziehungsziel Hinzufügen', formEdit: 'Beziehungsziel Bearbeiten', goalTitle: 'Zieltitel', titlePlaceholder: 'z. B. jede Woche einen ablenkungsfreien Abend', description: 'Beschreibung', descriptionPlaceholder: 'Warum ist dieses Ziel wichtig?', category: 'Kategorie', targetDate: 'Zieldatum', addStep: 'Schritt Hinzufügen', stepPlaceholder: 'Eine kleine, realistische Handlung', save: 'Ziel Speichern', cancel: 'Abbrechen', saving: 'Speichern…', progressTitle: 'Fortschritt Aktualisieren', markComplete: '100 % markiert dieses Ziel als abgeschlossen.', update: 'Aktualisieren', privateNote: 'Dieses Ziel bleibt privat in Ihrem Konto. SMS-Erinnerungen und Partnerfreigabe werden erst angezeigt, wenn diese Dienste tatsächlich implementiert sind.', created: 'Ziel gespeichert.', updated: 'Ziel aktualisiert.', deleted: 'Ziel gelöscht.', failed: 'Beziehungsziele sind vorübergehend nicht verfügbar.', categories: { communication: 'Kommunikation', quality_time: 'Qualitätszeit', intimacy: 'Intimität', personal_growth: 'Persönliches Wachstum', financial: 'Finanzen', family: 'Familie', health: 'Gesundheit & Wellness', adventure: 'Abenteuer & Reisen', home: 'Zuhause & Leben', career: 'Karriere & Ziele' } },
  nl: { locale: 'nl-NL', title: 'Relatiedoelen', subtitle: 'Stel een betekenisvol doel, verdeel het in kleine stappen en volg je voortgang.', back: 'Terug naar Support', add: 'Doel Toevoegen', active: 'Actieve Doelen', completed: 'Voltooide Doelen', total: 'Totaal Doelen', avg: 'Gemiddelde Voortgang', empty: 'Nog geen doelen', emptyDesc: 'Maak één concreet doel waaraan je wilt werken.', signInTitle: 'Log in om Relatiedoelen te gebruiken', signInDesc: 'Je doelen zijn privégegevens van je account en zijn beschikbaar voor ingelogde leden.', signIn: 'Inloggen', createFree: 'Gratis Account Maken', edit: 'Bewerken', delete: 'Verwijderen', progress: 'Voortgang', updateProgress: 'Voortgang Bijwerken', target: 'Doeldatum', steps: 'Actiestappen', noSteps: 'Nog geen actiestappen.', formAdd: 'Relatiedoel Toevoegen', formEdit: 'Relatiedoel Bewerken', goalTitle: 'Titel van doel', titlePlaceholder: 'bijv. elke week één avond zonder afleiding', description: 'Beschrijving', descriptionPlaceholder: 'Waarom is dit doel belangrijk?', category: 'Categorie', targetDate: 'Doeldatum', addStep: 'Stap Toevoegen', stepPlaceholder: 'Een kleine actie die je echt kunt uitvoeren', save: 'Doel Opslaan', cancel: 'Annuleren', saving: 'Opslaan…', progressTitle: 'Voortgang Bijwerken', markComplete: '100% markeert dit doel als voltooid.', update: 'Bijwerken', privateNote: 'Dit doel blijft privé in je account. Sms-herinneringen en delen met een partner worden pas getoond wanneer die diensten echt zijn gebouwd.', created: 'Doel opgeslagen.', updated: 'Doel bijgewerkt.', deleted: 'Doel verwijderd.', failed: 'Relatiedoelen zijn tijdelijk niet beschikbaar.', categories: { communication: 'Communicatie', quality_time: 'Kwaliteitstijd', intimacy: 'Intimiteit', personal_growth: 'Persoonlijke Groei', financial: 'Financieel', family: 'Familie', health: 'Gezondheid & Welzijn', adventure: 'Avontuur & Reizen', home: 'Huis & Leven', career: 'Carrière & Doelen' } },
};

const emptyGoal = () => ({ title: '', description: '', category: 'communication', target_date: '', action_steps: [''] });

export default function RelationshipGoalsRelaunch() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formGoal, setFormGoal] = useState(null);
  const [progressGoal, setProgressGoal] = useState(null);

  const goalsQuery = useQuery({
    queryKey: ['relationship-goals', user?.id],
    queryFn: listRelationshipGoals,
    enabled: Boolean(isAuthenticated && user?.id),
    retry: 1,
  });
  const goals = goalsQuery.data || [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['relationship-goals'] });
  const createMutation = useMutation({ mutationFn: createRelationshipGoal, onSuccess: () => { void refresh(); setFormGoal(null); toast.success(t.created); }, onError: () => toast.error(t.failed) });
  const updateMutation = useMutation({ mutationFn: ({ id, values }) => updateRelationshipGoal(id, values), onSuccess: () => { void refresh(); setFormGoal(null); toast.success(t.updated); }, onError: () => toast.error(t.failed) });
  const deleteMutation = useMutation({ mutationFn: deleteRelationshipGoal, onSuccess: () => { void refresh(); toast.success(t.deleted); }, onError: () => toast.error(t.failed) });
  const progressMutation = useMutation({ mutationFn: ({ id, progress }) => updateRelationshipGoalProgress(id, progress), onSuccess: () => { void refresh(); setProgressGoal(null); toast.success(t.updated); }, onError: () => toast.error(t.failed) });

  const active = goals.filter((goal) => goal.status !== 'completed');
  const completed = goals.filter((goal) => goal.status === 'completed');
  const avg = goals.length ? Math.round(goals.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) / goals.length) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <Target className="mx-auto h-16 w-16 text-purple-500" />
          <h1 className="mt-5 text-3xl font-bold text-gray-900">{t.signInTitle}</h1>
          <p className="mt-3 text-gray-600">{t.signInDesc}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate(`/SignIn?returnTo=${encodeURIComponent('/RelationshipGoals')}`)}>{t.signIn}</Button>
            <Button variant="outline" onClick={() => navigate(`/SignUp?returnTo=${encodeURIComponent('/RelationshipGoals')}`)}>{t.createFree}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link to={createPageUrl('CoupleSupport')} className="inline-flex items-center rounded-xl px-4 py-2 text-gray-600 hover:bg-white/70 hover:text-purple-700"><ArrowLeft className="mr-2 h-5 w-5" />{t.back}</Link>

        <div className="my-9 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Target className="h-10 w-10 text-white" /></div>
          <h1 className="mt-5 text-4xl font-bold text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">{t.subtitle}</p>
          <Button onClick={() => setFormGoal(emptyGoal())} className="mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"><Plus className="mr-2 h-4 w-4" />{t.add}</Button>
        </div>

        {goalsQuery.isError && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{t.failed}</div>}

        {goals.length > 0 && (
          <div className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat icon={Target} value={goals.length} label={t.total} />
            <Stat icon={CheckCircle2} value={completed.length} label={t.completed} />
            <Stat icon={TrendingUp} value={`${avg}%`} label={t.avg} />
          </div>
        )}

        {goalsQuery.isLoading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500" /></div>
        ) : goals.length === 0 ? (
          <div className="py-16 text-center"><Target className="mx-auto h-16 w-16 text-gray-300" /><h2 className="mt-4 text-2xl font-bold text-gray-600">{t.empty}</h2><p className="mt-2 text-gray-500">{t.emptyDesc}</p></div>
        ) : (
          <>
            {active.length > 0 && <GoalSection title={t.active} goals={active} t={t} onEdit={(goal) => setFormGoal({ ...goal, action_steps: goal.action_steps?.length ? goal.action_steps : [''] })} onDelete={(goal) => { if (window.confirm(`${t.delete}: ${goal.title}?`)) deleteMutation.mutate(goal.id); }} onProgress={setProgressGoal} />}
            {completed.length > 0 && <GoalSection title={t.completed} goals={completed} t={t} onEdit={(goal) => setFormGoal({ ...goal, action_steps: goal.action_steps?.length ? goal.action_steps : [''] })} onDelete={(goal) => { if (window.confirm(`${t.delete}: ${goal.title}?`)) deleteMutation.mutate(goal.id); }} onProgress={setProgressGoal} />}
          </>
        )}
      </div>

      <AnimatePresence>
        {formGoal && <GoalModal key="goal-modal" value={formGoal} t={t} onCancel={() => setFormGoal(null)} busy={createMutation.isPending || updateMutation.isPending} onSave={(values) => formGoal.id ? updateMutation.mutate({ id: formGoal.id, values }) : createMutation.mutate(values)} />}
        {progressGoal && <ProgressModal key="progress-modal" goal={progressGoal} t={t} busy={progressMutation.isPending} onCancel={() => setProgressGoal(null)} onSave={(progress) => progressMutation.mutate({ id: progressGoal.id, progress })} />}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon: Icon, value, label }) {
  return <Card className="border-0 shadow-sm"><CardContent className="p-5 text-center"><Icon className="mx-auto h-6 w-6 text-purple-600" /><div className="mt-2 text-3xl font-bold text-gray-900">{value}</div><div className="text-sm text-gray-500">{label}</div></CardContent></Card>;
}

function GoalSection({ title, goals, t, onEdit, onDelete, onProgress }) {
  return <section className="mb-10"><h2 className="mb-5 text-2xl font-bold text-gray-900">{title}</h2><div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} t={t} onEdit={onEdit} onDelete={onDelete} onProgress={onProgress} />)}</div></section>;
}

function GoalCard({ goal, t, onEdit, onDelete, onProgress }) {
  const target = goal.target_date ? new Date(`${goal.target_date}T00:00:00`) : null;
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">{goal.title}</CardTitle>
          <div className="flex gap-1"><button type="button" onClick={() => onEdit(goal)} aria-label={t.edit} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-purple-600"><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => onDelete(goal)} aria-label={t.delete} className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>
        </div>
        {goal.description && <p className="mt-2 text-sm leading-relaxed text-gray-600">{goal.description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="h-4 w-4" /><span>{t.target}: {target && !Number.isNaN(target.getTime()) ? target.toLocaleDateString(t.locale) : '—'}</span></div>
        <div><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-gray-600">{t.progress}</span><span className="font-bold text-purple-600">{goal.progress || 0}%</span></div><div className="h-3 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-gradient-to-r from-pink-500 to-purple-600" style={{ width: `${Math.max(0, Math.min(100, Number(goal.progress || 0)))}%` }} /></div></div>
        <div><p className="mb-2 text-sm font-semibold text-gray-700">{t.steps}</p>{goal.action_steps?.length ? <ul className="space-y-1">{goal.action_steps.slice(0, 5).map((step, index) => <li key={`${goal.id}-${index}`} className="flex gap-2 text-sm text-gray-600"><span className="text-pink-500">•</span><span>{step}</span></li>)}</ul> : <p className="text-sm text-gray-400">{t.noSteps}</p>}</div>
        {goal.status !== 'completed' && <Button variant="outline" className="w-full" onClick={() => onProgress(goal)}><TrendingUp className="mr-2 h-4 w-4" />{t.updateProgress}</Button>}
      </CardContent>
    </Card>
  );
}

function GoalModal({ value, t, onCancel, onSave, busy }) {
  const [form, setForm] = useState(() => ({ ...emptyGoal(), ...value, action_steps: value.action_steps?.length ? [...value.action_steps] : [''] }));
  const update = (field, next) => setForm((current) => ({ ...current, [field]: next }));
  const updateStep = (index, next) => setForm((current) => ({ ...current, action_steps: current.action_steps.map((step, stepIndex) => stepIndex === index ? next : step) }));
  const removeStep = (index) => setForm((current) => ({ ...current, action_steps: current.action_steps.filter((_, stepIndex) => stepIndex !== index) }));
  const submit = (event) => { event.preventDefault(); onSave({ title: form.title, description: form.description, category: form.category, target_date: form.target_date, action_steps: form.action_steps }); };

  return <ModalShell onCancel={onCancel}><form onSubmit={submit} className="space-y-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">{value.id ? t.formEdit : t.formAdd}</h2><button type="button" onClick={onCancel} className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">{t.goalTitle}</label><Input value={form.title} maxLength={160} required onChange={(event) => update('title', event.target.value)} placeholder={t.titlePlaceholder} /></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">{t.description}</label><Textarea value={form.description || ''} maxLength={1600} rows={4} onChange={(event) => update('description', event.target.value)} placeholder={t.descriptionPlaceholder} /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-gray-700">{t.category}</label><Select value={form.category} onValueChange={(next) => update('category', next)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(t.categories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div><label className="mb-2 block text-sm font-semibold text-gray-700">{t.targetDate}</label><Input type="date" value={form.target_date || ''} required onChange={(event) => update('target_date', event.target.value)} /></div></div><div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold text-gray-700">{t.steps}</label><button type="button" onClick={() => setForm((current) => ({ ...current, action_steps: [...current.action_steps, ''] }))} disabled={form.action_steps.length >= 20} className="text-sm font-semibold text-purple-600 hover:text-purple-700">+ {t.addStep}</button></div><div className="space-y-2">{form.action_steps.map((step, index) => <div key={index} className="flex gap-2"><Input value={step} maxLength={300} onChange={(event) => updateStep(index, event.target.value)} placeholder={t.stepPlaceholder} /><button type="button" onClick={() => removeStep(index)} disabled={form.action_steps.length === 1} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}</div></div><p className="rounded-xl bg-purple-50 p-3 text-sm text-purple-800">{t.privateNote}</p><div className="flex gap-3"><Button type="button" variant="outline" onClick={onCancel} className="flex-1">{t.cancel}</Button><Button type="submit" disabled={busy || !form.title.trim() || !form.target_date} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{busy ? t.saving : t.save}</Button></div></form></ModalShell>;
}

function ProgressModal({ goal, t, onCancel, onSave, busy }) {
  const [progress, setProgress] = useState(Number(goal.progress || 0));
  return <ModalShell onCancel={onCancel}><div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">{t.progressTitle}</h2><button type="button" onClick={onCancel} className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button></div><div className="mt-6"><div className="mb-3 flex justify-between"><span className="font-medium text-gray-700">{goal.title}</span><span className="font-bold text-purple-600">{progress}%</span></div><input type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} className="w-full" /><p className="mt-3 text-sm text-gray-500">{t.markComplete}</p></div><div className="mt-6 flex gap-3"><Button type="button" variant="outline" onClick={onCancel} className="flex-1">{t.cancel}</Button><Button type="button" onClick={() => onSave(progress)} disabled={busy} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t.update}</Button></div></ModalShell>;
}

function ModalShell({ children, onCancel }) {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}><motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">{children}</motion.div></motion.div>;
}
