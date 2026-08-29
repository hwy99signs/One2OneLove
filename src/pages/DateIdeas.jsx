import React, { useMemo, useState } from "react";
import { ArrowLeft, Bookmark, Check, Heart, Plus, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";
import CustomDateForm from "../components/dateideas/CustomDateForm";

const translations = {
  en: {
    title: "Date Ideas", subtitle: "Simple inspiration plus a private place to save your own ideas.", back: "Back", planner: "Open Date Night planner", inspiration: "O2OL inspiration", privateIdeas: "My private ideas", add: "Add private idea", edit: "Edit", all: "All categories", empty: "You have not saved a private date idea yet.", signIn: "Sign in to create and save your own private date ideas.", privateNote: "Your saved ideas belong to your account only. They are not automatically shared with a partner or the community.", favorite: "Favorite", done: "Done", delete: "Delete", deleteConfirm: "Delete this private date idea?", created: "Date idea saved.", updated: "Date idea updated.", deleted: "Date idea deleted.", saveError: "We could not save the date idea.", updateError: "We could not update the date idea.", deleteError: "We could not delete the date idea.",
    categories: { all: "All categories", romantic: "Romantic", adventure: "Adventure", relaxing: "Relaxing", indoor: "Indoor", outdoor: "Outdoor", creative: "Creative" },
    ideas: [
      ["romantic", "Sunset Pause", "Choose a safe place with a good view, bring a favorite drink, and spend the last 30 minutes before sunset talking without phones."],
      ["creative", "Two-Person Playlist", "Each person chooses five songs that tell part of your relationship story. Listen together and explain why each song matters."],
      ["outdoor", "Neighborhood Explorer", "Walk an area you do not usually visit. Pick one snack stop, one interesting place to browse, and one place to sit and talk."],
      ["indoor", "Home Bistro", "Use food you already have, change the table setting, add music, and treat an ordinary meal like a planned date."],
      ["adventure", "Choose for Each Other", "Each person secretly chooses one small part of the date for the other—a snack, activity, song, or surprise stop."],
      ["relaxing", "Coffee & Curiosity", "Share coffee, tea, or dessert and each bring one question you have never asked—or have not asked in a long time."],
    ],
  },
  es: {
    title: "Ideas para Citas", subtitle: "Inspiración sencilla y un lugar privado para guardar tus propias ideas.", back: "Volver", planner: "Abrir planificador de Noche de Cita", inspiration: "Inspiración O2OL", privateIdeas: "Mis ideas privadas", add: "Agregar idea privada", edit: "Editar", all: "Todas las categorías", empty: "Aún no has guardado una idea privada para una cita.", signIn: "Inicia sesión para crear y guardar tus propias ideas privadas.", privateNote: "Tus ideas guardadas pertenecen solo a tu cuenta. No se comparten automáticamente con tu pareja ni con la comunidad.", favorite: "Favorita", done: "Hecha", delete: "Eliminar", deleteConfirm: "¿Eliminar esta idea privada?", created: "Idea guardada.", updated: "Idea actualizada.", deleted: "Idea eliminada.", saveError: "No pudimos guardar la idea.", updateError: "No pudimos actualizar la idea.", deleteError: "No pudimos eliminar la idea.",
    categories: { all: "Todas las categorías", romantic: "Romántica", adventure: "Aventura", relaxing: "Relajante", indoor: "Interior", outdoor: "Exterior", creative: "Creativa" },
    ideas: [
      ["romantic", "Pausa al Atardecer", "Elijan un lugar seguro con buena vista, lleven una bebida favorita y pasen los últimos 30 minutos antes del atardecer conversando sin teléfonos."],
      ["creative", "Playlist de Dos", "Cada uno elige cinco canciones que cuenten parte de la historia de su relación. Escúchenlas juntos y expliquen por qué importan."],
      ["outdoor", "Explorar el Vecindario", "Caminen por una zona que no suelen visitar. Elijan una parada para comer, un lugar interesante y un sitio para sentarse a hablar."],
      ["indoor", "Bistró en Casa", "Usen comida que ya tengan, cambien la mesa, agreguen música y conviertan una comida normal en una cita planeada."],
      ["adventure", "Elegir el Uno por el Otro", "Cada persona elige en secreto una parte pequeña de la cita para la otra: snack, actividad, canción o parada sorpresa."],
      ["relaxing", "Café y Curiosidad", "Compartan café, té o postre y cada uno lleve una pregunta que nunca haya hecho o que no haga desde hace mucho."],
    ],
  },
  fr: {
    title: "Idées de Rendez-vous", subtitle: "De l’inspiration simple et un espace privé pour enregistrer vos propres idées.", back: "Retour", planner: "Ouvrir le planificateur de soirée", inspiration: "Inspiration O2OL", privateIdeas: "Mes idées privées", add: "Ajouter une idée privée", edit: "Modifier", all: "Toutes les catégories", empty: "Vous n’avez pas encore enregistré d’idée privée.", signIn: "Connectez-vous pour créer et enregistrer vos propres idées privées.", privateNote: "Vos idées enregistrées appartiennent uniquement à votre compte. Elles ne sont pas partagées automatiquement avec un partenaire ou la communauté.", favorite: "Favori", done: "Fait", delete: "Supprimer", deleteConfirm: "Supprimer cette idée privée ?", created: "Idée enregistrée.", updated: "Idée mise à jour.", deleted: "Idée supprimée.", saveError: "Impossible d’enregistrer l’idée.", updateError: "Impossible de mettre à jour l’idée.", deleteError: "Impossible de supprimer l’idée.",
    categories: { all: "Toutes les catégories", romantic: "Romantique", adventure: "Aventure", relaxing: "Détente", indoor: "Intérieur", outdoor: "Extérieur", creative: "Créatif" },
    ideas: [
      ["romantic", "Pause au Coucher du Soleil", "Choisissez un lieu sûr avec une belle vue, apportez une boisson préférée et passez les 30 dernières minutes avant le coucher du soleil à parler sans téléphone."],
      ["creative", "Playlist à Deux", "Chacun choisit cinq chansons qui racontent une partie de votre histoire. Écoutez-les ensemble et expliquez pourquoi elles comptent."],
      ["outdoor", "Explorer un Quartier", "Promenez-vous dans un secteur que vous connaissez peu. Choisissez une collation, un endroit à découvrir et un lieu pour vous asseoir et parler."],
      ["indoor", "Bistrot à la Maison", "Utilisez ce que vous avez déjà, changez la table, ajoutez de la musique et transformez un repas ordinaire en rendez-vous."],
      ["adventure", "Choisir l’un pour l’autre", "Chacun choisit secrètement une petite partie du rendez-vous pour l’autre : collation, activité, chanson ou arrêt surprise."],
      ["relaxing", "Café & Curiosité", "Partagez un café, un thé ou un dessert et apportez chacun une question jamais posée ou oubliée depuis longtemps."],
    ],
  },
  it: {
    title: "Idee per Appuntamenti", subtitle: "Ispirazione semplice e uno spazio privato per salvare le vostre idee.", back: "Indietro", planner: "Apri il planner della serata", inspiration: "Ispirazione O2OL", privateIdeas: "Le mie idee private", add: "Aggiungi idea privata", edit: "Modifica", all: "Tutte le categorie", empty: "Non hai ancora salvato un’idea privata.", signIn: "Accedi per creare e salvare le tue idee private.", privateNote: "Le idee salvate appartengono solo al tuo account. Non vengono condivise automaticamente con il partner o la community.", favorite: "Preferita", done: "Fatta", delete: "Elimina", deleteConfirm: "Eliminare questa idea privata?", created: "Idea salvata.", updated: "Idea aggiornata.", deleted: "Idea eliminata.", saveError: "Non è stato possibile salvare l’idea.", updateError: "Non è stato possibile aggiornare l’idea.", deleteError: "Non è stato possibile eliminare l’idea.",
    categories: { all: "Tutte le categorie", romantic: "Romantico", adventure: "Avventura", relaxing: "Rilassante", indoor: "Al chiuso", outdoor: "All’aperto", creative: "Creativo" },
    ideas: [
      ["romantic", "Pausa al Tramonto", "Scegliete un posto sicuro con una bella vista, portate una bevanda preferita e trascorrete gli ultimi 30 minuti prima del tramonto parlando senza telefoni."],
      ["creative", "Playlist per Due", "Ognuno sceglie cinque canzoni che raccontano una parte della vostra storia. Ascoltatele insieme e spiegate perché sono importanti."],
      ["outdoor", "Esplora il Quartiere", "Passeggiate in una zona che visitate raramente. Scegliete uno snack, un posto interessante e un luogo dove sedervi a parlare."],
      ["indoor", "Bistrot a Casa", "Usate il cibo che avete già, cambiate la tavola, aggiungete musica e trasformate un pasto normale in un appuntamento."],
      ["adventure", "Scegliere l’uno per l’altro", "Ognuno sceglie in segreto una piccola parte dell’appuntamento per l’altro: snack, attività, canzone o tappa sorpresa."],
      ["relaxing", "Caffè e Curiosità", "Condividete caffè, tè o dessert e portate ciascuno una domanda mai fatta o non fatta da molto tempo."],
    ],
  },
  de: {
    title: "Date-Ideen", subtitle: "Einfache Inspiration und ein privater Ort für deine eigenen Ideen.", back: "Zurück", planner: "Date-Night-Planer öffnen", inspiration: "O2OL-Inspiration", privateIdeas: "Meine privaten Ideen", add: "Private Idee hinzufügen", edit: "Bearbeiten", all: "Alle Kategorien", empty: "Du hast noch keine private Date-Idee gespeichert.", signIn: "Melde dich an, um eigene private Date-Ideen zu erstellen und zu speichern.", privateNote: "Gespeicherte Ideen gehören nur zu deinem Konto. Sie werden nicht automatisch mit Partnern oder der Community geteilt.", favorite: "Favorit", done: "Erledigt", delete: "Löschen", deleteConfirm: "Diese private Date-Idee löschen?", created: "Date-Idee gespeichert.", updated: "Date-Idee aktualisiert.", deleted: "Date-Idee gelöscht.", saveError: "Die Date-Idee konnte nicht gespeichert werden.", updateError: "Die Date-Idee konnte nicht aktualisiert werden.", deleteError: "Die Date-Idee konnte nicht gelöscht werden.",
    categories: { all: "Alle Kategorien", romantic: "Romantisch", adventure: "Abenteuer", relaxing: "Entspannend", indoor: "Drinnen", outdoor: "Draußen", creative: "Kreativ" },
    ideas: [
      ["romantic", "Sonnenuntergangspause", "Wählt einen sicheren Ort mit schöner Aussicht, nehmt ein Lieblingsgetränk mit und verbringt die letzten 30 Minuten vor Sonnenuntergang ohne Handys im Gespräch."],
      ["creative", "Playlist für Zwei", "Jeder wählt fünf Songs, die einen Teil eurer Beziehungsgeschichte erzählen. Hört sie gemeinsam und erklärt, warum sie wichtig sind."],
      ["outdoor", "Nachbarschaft Entdecken", "Geht durch eine Gegend, die ihr selten besucht. Wählt einen Snack-Stopp, einen interessanten Ort und einen Platz zum Sitzen und Reden."],
      ["indoor", "Bistro Zuhause", "Nutzt vorhandenes Essen, deckt den Tisch anders, macht Musik an und verwandelt eine normale Mahlzeit in ein geplantes Date."],
      ["adventure", "Füreinander Auswählen", "Jeder wählt heimlich einen kleinen Teil des Dates für den anderen: Snack, Aktivität, Song oder Überraschungsstopp."],
      ["relaxing", "Kaffee & Neugier", "Teilt Kaffee, Tee oder Dessert und bringt jeweils eine Frage mit, die ihr noch nie oder lange nicht gestellt habt."],
    ],
  },
};

const writableFields = ["title", "description", "category", "budget", "location_type", "occasion", "relationship_stage"];
const pickWritable = (source) => Object.fromEntries(writableFields.map((key) => [key, source[key]]));

export default function DateIdeas() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: customIdeas = [], isLoading } = useQuery({
    queryKey: ["custom-date-ideas", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_date_ideas")
        .select("id,title,description,category,budget,location_type,occasion,relationship_stage,is_favorite,is_completed,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    initialData: [],
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["custom-date-ideas", user?.id] });

  const saveMutation = useMutation({
    mutationFn: async (idea) => {
      if (!user?.id) throw new Error(t.signIn);
      if (editing?.id) {
        const { error } = await supabase.from("custom_date_ideas").update(pickWritable(idea)).eq("id", editing.id).eq("user_id", user.id);
        if (error) throw error;
        return "updated";
      }
      const { error } = await supabase.from("custom_date_ideas").insert({ ...pickWritable(idea), user_id: user.id, is_favorite: false, is_completed: false });
      if (error) throw error;
      return "created";
    },
    onSuccess: (kind) => {
      refresh();
      toast.success(kind === "updated" ? t.updated : t.created);
      setEditing(null);
      setShowForm(false);
    },
    onError: () => toast.error(editing ? t.updateError : t.saveError),
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, patch }) => {
      const { error } = await supabase.from("custom_date_ideas").update(patch).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error(t.updateError),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("custom_date_ideas").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success(t.deleted); },
    onError: () => toast.error(t.deleteError),
  });

  const inspiration = useMemo(() => t.ideas.filter(([ideaCategory]) => category === "all" || ideaCategory === category), [category, t]);
  const privateIdeas = useMemo(() => customIdeas.filter((idea) => category === "all" || idea.category === category), [category, customIdeas]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-white hover:text-purple-700"><ArrowLeft className="h-4 w-4" />{t.back}</Link>
          <Button asChild variant="outline"><Link to={createPageUrl("DateNight")}><Sparkles className="mr-2 h-4 w-4" />{t.planner}</Link></Button>
        </div>

        <header className="mx-auto my-10 max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white"><Heart className="h-8 w-8" /></div>
          <h1 className="text-4xl font-bold text-gray-950 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-64" aria-label={t.all}><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(t.categories).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          {user && <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />{t.add}</Button>}
        </div>

        {showForm && user && (
          <div className="mb-10">
            <CustomDateForm dateIdea={editing} onSubmit={(idea) => saveMutation.mutate(idea)} onCancel={() => { setShowForm(false); setEditing(null); }} />
          </div>
        )}

        <section>
          <h2 className="text-2xl font-bold text-gray-950">{t.inspiration}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {inspiration.map(([ideaCategory, title, description]) => (
              <Card key={`${ideaCategory}-${title}`} className="border-pink-100 shadow-sm">
                <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                <CardContent><p className="leading-7 text-gray-600">{description}</p><span className="mt-4 inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">{t.categories[ideaCategory]}</span></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-2xl font-bold text-gray-950">{t.privateIdeas}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{t.privateNote}</p></div>
          </div>

          {!user ? (
            <Card className="mt-5"><CardContent className="p-6 text-gray-700">{t.signIn}</CardContent></Card>
          ) : isLoading ? (
            <div className="mt-5 h-28 animate-pulse rounded-2xl bg-white" />
          ) : privateIdeas.length === 0 ? (
            <Card className="mt-5"><CardContent className="p-6 text-gray-600">{t.empty}</CardContent></Card>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {privateIdeas.map((idea) => (
                <Card key={idea.id} className="border-purple-100 shadow-sm">
                  <CardHeader><CardTitle>{idea.title}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="leading-7 text-gray-600">{idea.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">{t.categories[idea.category] || idea.category}</span>
                      {idea.is_favorite && <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">{t.favorite}</span>}
                      {idea.is_completed && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{t.done}</span>}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => patchMutation.mutate({ id: idea.id, patch: { is_favorite: !idea.is_favorite } })}><Bookmark className="mr-2 h-4 w-4" />{t.favorite}</Button>
                      <Button size="sm" variant="outline" onClick={() => patchMutation.mutate({ id: idea.id, patch: { is_completed: !idea.is_completed } })}><Check className="mr-2 h-4 w-4" />{t.done}</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(idea); setShowForm(true); }}>{t.edit}</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => window.confirm(t.deleteConfirm) && deleteMutation.mutate(idea.id)}><Trash2 className="mr-2 h-4 w-4" />{t.delete}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
