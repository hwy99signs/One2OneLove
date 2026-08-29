import React, { useState } from "react";
import { BookOpen, Heart, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import BuddyCard from "../components/community/BuddyCard";
import PostStoryForm from "../components/community/PostStoryForm";
import StoryCard from "../components/community/StoryCard";
import { getMyBuddies } from "@/lib/buddyService";
import { createStory, getStories, toggleHelpfulStory, toggleLikeStory } from "@/lib/successStoriesService";

const translations = {
  en: {
    title: "Community", subtitle: "Real member stories and private social connections, with launch-safe moderation and privacy.", stories: "Relationship Stories", buddies: "My Buddies", search: "Search approved stories...", share: "Share a Story", find: "Find Friends", signIn: "Sign in to share stories or view your buddy connections.", signInButton: "Sign In", noStories: "No approved stories match your search yet.", noBuddies: "You do not have any accepted buddy connections yet.", pending: "Story submitted for review. It will not appear publicly unless it is approved.", createError: "We could not submit your story.", interactionError: "We could not update that story reaction.", signInInteraction: "Sign in to react to community stories.", forums: "Discussion Forums — Post Launch", forumsCopy: "The old forum shell was removed because its backend was no longer active. Real forums will return only with working posts, replies, reporting, and moderation.", privacy: "Community stories are public only after approval. Buddy cards use the privacy-safe member directory and do not display private email addresses." },
  es: {
    title: "Comunidad", subtitle: "Historias reales de miembros y conexiones sociales privadas, con moderación y privacidad seguras para el lanzamiento.", stories: "Historias de Relaciones", buddies: "Mis Compañeros", search: "Buscar historias aprobadas...", share: "Compartir una Historia", find: "Encontrar Amigos", signIn: "Inicia sesión para compartir historias o ver tus conexiones.", signInButton: "Iniciar Sesión", noStories: "Aún no hay historias aprobadas que coincidan con tu búsqueda.", noBuddies: "Aún no tienes conexiones de compañero aceptadas.", pending: "Historia enviada para revisión. No aparecerá públicamente a menos que sea aprobada.", createError: "No pudimos enviar tu historia.", interactionError: "No pudimos actualizar esa reacción.", signInInteraction: "Inicia sesión para reaccionar a las historias de la comunidad.", forums: "Foros de Discusión — Después del Lanzamiento", forumsCopy: "El antiguo foro fue eliminado porque su backend ya no estaba activo. Los foros reales volverán solo con publicaciones, respuestas, reportes y moderación funcionales.", privacy: "Las historias son públicas solo después de ser aprobadas. Las tarjetas de compañeros usan el directorio seguro y no muestran correos privados." },
  fr: {
    title: "Communauté", subtitle: "De vraies histoires de membres et des connexions sociales privées, avec modération et confidentialité adaptées au lancement.", stories: "Histoires Relationnelles", buddies: "Mes Compagnons", search: "Rechercher des histoires approuvées...", share: "Partager une Histoire", find: "Trouver des Amis", signIn: "Connectez-vous pour partager une histoire ou voir vos connexions.", signInButton: "Se Connecter", noStories: "Aucune histoire approuvée ne correspond encore à votre recherche.", noBuddies: "Vous n’avez encore aucune connexion acceptée.", pending: "Histoire envoyée pour examen. Elle ne sera pas publique sans approbation.", createError: "Nous n’avons pas pu envoyer votre histoire.", interactionError: "Nous n’avons pas pu mettre à jour cette réaction.", signInInteraction: "Connectez-vous pour réagir aux histoires de la communauté.", forums: "Forums de Discussion — Après le Lancement", forumsCopy: "L’ancien forum a été retiré car son backend n’était plus actif. De vrais forums reviendront uniquement avec publications, réponses, signalement et modération fonctionnels.", privacy: "Les histoires ne deviennent publiques qu’après approbation. Les cartes de compagnons utilisent l’annuaire sécurisé et n’affichent pas d’adresses e-mail privées." },
  it: {
    title: "Comunità", subtitle: "Storie reali dei membri e connessioni sociali private, con moderazione e privacy adatte al lancio.", stories: "Storie di Relazione", buddies: "I Miei Compagni", search: "Cerca storie approvate...", share: "Condividi una Storia", find: "Trova Amici", signIn: "Accedi per condividere storie o vedere le tue connessioni.", signInButton: "Accedi", noStories: "Nessuna storia approvata corrisponde ancora alla ricerca.", noBuddies: "Non hai ancora connessioni accettate.", pending: "Storia inviata per revisione. Non apparirà pubblicamente senza approvazione.", createError: "Non è stato possibile inviare la storia.", interactionError: "Non è stato possibile aggiornare la reazione.", signInInteraction: "Accedi per reagire alle storie della community.", forums: "Forum di Discussione — Dopo il Lancio", forumsCopy: "Il vecchio forum è stato rimosso perché il backend non era più attivo. I forum reali torneranno solo con post, risposte, segnalazioni e moderazione funzionanti.", privacy: "Le storie diventano pubbliche solo dopo approvazione. Le schede dei compagni usano l’elenco sicuro e non mostrano email private." },
  de: {
    title: "Community", subtitle: "Echte Mitgliedergeschichten und private soziale Verbindungen mit startgerechter Moderation und Privatsphäre.", stories: "Beziehungsgeschichten", buddies: "Meine Buddies", search: "Genehmigte Geschichten suchen...", share: "Geschichte Teilen", find: "Freunde Finden", signIn: "Melde dich an, um Geschichten zu teilen oder deine Buddy-Verbindungen zu sehen.", signInButton: "Anmelden", noStories: "Noch keine genehmigte Geschichte passt zu deiner Suche.", noBuddies: "Du hast noch keine angenommenen Buddy-Verbindungen.", pending: "Geschichte zur Prüfung eingereicht. Sie wird nur nach Genehmigung öffentlich angezeigt.", createError: "Die Geschichte konnte nicht eingereicht werden.", interactionError: "Die Reaktion konnte nicht aktualisiert werden.", signInInteraction: "Melde dich an, um auf Community-Geschichten zu reagieren.", forums: "Diskussionsforen — Nach dem Start", forumsCopy: "Die frühere Forumshülle wurde entfernt, weil ihr Backend nicht mehr aktiv war. Echte Foren kehren erst mit funktionierenden Beiträgen, Antworten, Meldungen und Moderation zurück.", privacy: "Geschichten werden erst nach Genehmigung öffentlich. Buddy-Karten verwenden das datenschutzsichere Mitgliederverzeichnis und zeigen keine privaten E-Mail-Adressen." },
};

export default function Community() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('stories');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStoryForm, setShowStoryForm] = useState(false);

  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ['community-stories', searchQuery],
    queryFn: () => getStories('-created_at', null, searchQuery || null),
    initialData: [],
  });

  const { data: buddies = [], isLoading: buddiesLoading } = useQuery({
    queryKey: ['community-buddies', user?.id],
    queryFn: () => getMyBuddies(user?.id),
    enabled: Boolean(user?.id),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: createStory,
    onSuccess: () => {
      setShowStoryForm(false);
      toast.success(t.pending);
    },
    onError: () => toast.error(t.createError),
  });

  const likeMutation = useMutation({
    mutationFn: ({ story }) => toggleLikeStory(story.id, story.userHasLiked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-stories'] }),
    onError: () => toast.error(t.interactionError),
  });

  const helpfulMutation = useMutation({
    mutationFn: ({ story }) => toggleHelpfulStory(story.id, story.userMarkedHelpful),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-stories'] }),
    onError: () => toast.error(t.interactionError),
  });

  const requireUser = (callback) => (story) => {
    if (!user) {
      toast.error(t.signInInteraction);
      return;
    }
    callback(story);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <Users className="mx-auto h-14 w-14 text-purple-700" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </header>

        <div className="mx-auto mt-8 flex max-w-xl rounded-2xl border border-purple-100 bg-white p-1 shadow-sm" role="tablist" aria-label={t.title}>
          <button type="button" role="tab" aria-selected={activeTab === 'stories'} onClick={() => setActiveTab('stories')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === 'stories' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-purple-50'}`}><BookOpen className="mr-2 inline h-4 w-4" aria-hidden="true" />{t.stories}</button>
          <button type="button" role="tab" aria-selected={activeTab === 'buddies'} onClick={() => setActiveTab('buddies')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === 'buddies' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-purple-50'}`}><Heart className="mr-2 inline h-4 w-4" aria-hidden="true" />{t.buddies}</button>
        </div>

        <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" aria-hidden="true" /><p>{t.privacy}</p></div></div>

        {activeTab === 'stories' ? (
          <section className="mt-8" aria-labelledby="community-stories-heading">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 id="community-stories-heading" className="text-2xl font-bold text-slate-900">{t.stories}</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t.search} className="pl-9 sm:w-72" /></div>
                {user ? <Button onClick={() => setShowStoryForm(true)}>{t.share}</Button> : <Button asChild variant="outline"><Link to="/SignIn">{t.signInButton}</Link></Button>}
              </div>
            </div>

            {showStoryForm && <div className="mx-auto mt-6 max-w-3xl"><PostStoryForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowStoryForm(false)} /></div>}

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {!storiesLoading && stories.length === 0 && <p className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">{t.noStories}</p>}
              {stories.map((story) => <StoryCard key={story.id} story={story} onLike={requireUser((item) => likeMutation.mutate({ story: item }))} onMarkHelpful={requireUser((item) => helpfulMutation.mutate({ story: item }))} />)}
            </div>
          </section>
        ) : (
          <section className="mt-8" aria-labelledby="community-buddies-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 id="community-buddies-heading" className="text-2xl font-bold text-slate-900">{t.buddies}</h2>{user && <Button asChild><Link to="/FindFriends"><UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />{t.find}</Link></Button>}</div>
            {!user ? <Card className="mt-6"><CardContent className="p-8 text-center"><p className="text-slate-600">{t.signIn}</p><Button asChild className="mt-4"><Link to="/SignIn">{t.signInButton}</Link></Button></CardContent></Card> : <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{!buddiesLoading && buddies.length === 0 && <p className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">{t.noBuddies}</p>}{buddies.map((buddy) => <BuddyCard key={buddy.request_id || buddy.id} buddy={buddy} />)}</div>}
          </section>
        )}

        <Card className="mt-10 border-slate-200 bg-slate-50"><CardContent className="p-6"><h2 className="font-bold text-slate-900">{t.forums}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t.forumsCopy}</p></CardContent></Card>
      </div>
    </main>
  );
}
