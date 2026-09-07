import React, { useState } from "react";
import { Heart, Users, MessageCircle, Plus, Search, X, UserPlus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ForumCard from "../components/community/ForumCard";
import ForumPostCard from "../components/community/ForumPostCard";
import { useAuth } from "@/contexts/AuthContext";
import { getMyBuddies } from "@/lib/buddyService";
import StoryCard from "../components/community/StoryCard";
import BuddyCard from "../components/community/BuddyCard";
import PostStoryForm from "../components/community/PostStoryForm";
import {
  getStories,
  createStory,
  toggleLikeStory,
  toggleHelpfulStory
} from "@/lib/successStoriesService";

const translations = {
  en: {
    title: "Community",
    subtitle: "Connect, share, and grow together with the One2OneLove community",
    relationshipRoom: "Relationship Room",
    relationshipRoomDesc: "Public topic-based conversations where O2OL, Amora, approved hosts, and community members can discuss relationship questions together.",
    roomDetail: "Live participant count will be shown when the room opens. No private member-to-member messaging.",
    groupActivities: "Group Activities",
    groupActivitiesDesc: "Shared community activities designed to bring couples together around fun, connection, and relationship-focused experiences.",
    comingSoon: "Coming Soon",
    forums: "Discussion Forums",
    stories: "Success Stories",
    buddies: "Buddy System",
    searchPlaceholder: "Search community...",
    shareStory: "Share Your Love Story",
    findBuddy: "Find a Buddy",
    forumsDesc: "Join heartfelt discussions on topics that matter to your relationship",
    storiesDesc: "Read and share relationship journeys that can encourage others",
    buddiesDesc: "Connect with other couples for mutual support and friendship",
    noResults: "No results found",
    storyShared: "Your story has been shared with the community!",
    backToForums: "← Back to Forums",
    noPostsYet: "No posts yet. Be the first to start a meaningful discussion!",
    errorSharing: "Failed to share your story. Please try again.",
    errorLike: "Failed to update like. Please try again.",
    errorHelpful: "Failed to update helpful. Please try again."
  },
  es: {
    title: "Comunidad",
    subtitle: "Conéctate, comparte y crece junto con la comunidad One2OneLove",
    relationshipRoom: "Sala de Relaciones",
    relationshipRoomDesc: "Conversaciones públicas por temas donde O2OL, Amora, anfitriones aprobados y miembros pueden hablar juntos sobre preguntas de relaciones.",
    roomDetail: "El conteo de participantes se mostrará cuando la sala abra. No habrá mensajería privada entre miembros.",
    groupActivities: "Actividades Grupales",
    groupActivitiesDesc: "Actividades comunitarias compartidas para reunir parejas alrededor de diversión, conexión y experiencias enfocadas en relaciones.",
    comingSoon: "Próximamente",
    forums: "Foros de Discusión",
    stories: "Historias de Éxito",
    buddies: "Sistema de Compañeros",
    searchPlaceholder: "Buscar en la comunidad...",
    shareStory: "Comparte Tu Historia de Amor",
    findBuddy: "Encontrar un Compañero",
    forumsDesc: "Únete a conversaciones sinceras sobre temas importantes para tu relación",
    storiesDesc: "Lee y comparte historias de relaciones que puedan animar a otros",
    buddiesDesc: "Conéctate con otras parejas para apoyo mutuo y amistad",
    noResults: "No se encontraron resultados",
    storyShared: "¡Tu historia ha sido compartida con la comunidad!",
    backToForums: "← Volver a los Foros",
    noPostsYet: "Aún no hay publicaciones. ¡Sé el primero en iniciar una conversación significativa!",
    errorSharing: "No se pudo compartir tu historia. Inténtalo de nuevo.",
    errorLike: "No se pudo actualizar el me gusta.",
    errorHelpful: "No se pudo actualizar útil."
  },
  fr: {
    title: "Communauté",
    subtitle: "Connectez-vous, partagez et grandissez avec la communauté One2OneLove",
    relationshipRoom: "Salon des Relations",
    relationshipRoomDesc: "Des conversations publiques par thèmes où O2OL, Amora, des animateurs approuvés et les membres peuvent échanger autour de questions relationnelles.",
    roomDetail: "Le nombre de participants sera affiché à l'ouverture du salon. Pas de messagerie privée entre membres.",
    groupActivities: "Activités de Groupe",
    groupActivitiesDesc: "Des activités communautaires partagées pour réunir les couples autour du plaisir, de la connexion et d'expériences relationnelles.",
    comingSoon: "Bientôt Disponible",
    forums: "Forums de Discussion",
    stories: "Histoires de Succès",
    buddies: "Système de Compagnons",
    searchPlaceholder: "Rechercher dans la communauté...",
    shareStory: "Partagez Votre Histoire d'Amour",
    findBuddy: "Trouver un Compagnon",
    forumsDesc: "Participez à des discussions sincères sur des sujets importants pour votre relation",
    storiesDesc: "Lisez et partagez des parcours relationnels qui peuvent encourager les autres",
    buddiesDesc: "Connectez-vous avec d'autres couples pour le soutien mutuel et l'amitié",
    noResults: "Aucun résultat trouvé",
    storyShared: "Votre histoire a été partagée avec la communauté !",
    backToForums: "← Retour aux Forums",
    noPostsYet: "Pas encore de publications. Soyez le premier à lancer une discussion !",
    errorSharing: "Impossible de partager votre histoire. Veuillez réessayer.",
    errorLike: "Impossible de mettre à jour le j'aime.",
    errorHelpful: "Impossible de mettre à jour utile."
  },
  it: {
    title: "Comunità",
    subtitle: "Connettiti, condividi e cresci con la comunità One2OneLove",
    relationshipRoom: "Sala delle Relazioni",
    relationshipRoomDesc: "Conversazioni pubbliche per temi dove O2OL, Amora, host approvati e membri possono discutere insieme domande sulle relazioni.",
    roomDetail: "Il conteggio dei partecipanti sarà mostrato quando la sala aprirà. Nessuna messaggistica privata tra membri.",
    groupActivities: "Attività di Gruppo",
    groupActivitiesDesc: "Attività comunitarie condivise per riunire le coppie attorno a divertimento, connessione ed esperienze focalizzate sulle relazioni.",
    comingSoon: "Prossimamente",
    forums: "Forum di Discussione",
    stories: "Storie di Successo",
    buddies: "Sistema di Compagni",
    searchPlaceholder: "Cerca nella comunità...",
    shareStory: "Condividi la Tua Storia d'Amore",
    findBuddy: "Trova un Compagno",
    forumsDesc: "Partecipa a discussioni sincere su temi importanti per la tua relazione",
    storiesDesc: "Leggi e condividi percorsi relazionali che possono incoraggiare gli altri",
    buddiesDesc: "Connettiti con altre coppie per supporto reciproco e amicizia",
    noResults: "Nessun risultato trovato",
    storyShared: "La tua storia è stata condivisa con la comunità!",
    backToForums: "← Torna ai Forum",
    noPostsYet: "Nessun post ancora. Sii il primo a iniziare una discussione!",
    errorSharing: "Impossibile condividere la storia. Riprova.",
    errorLike: "Impossibile aggiornare il mi piace.",
    errorHelpful: "Impossibile aggiornare utile."
  },
  de: {
    title: "Gemeinschaft",
    subtitle: "Verbinde dich, teile und wachse gemeinsam mit der One2OneLove-Community",
    relationshipRoom: "Beziehungsraum",
    relationshipRoomDesc: "Öffentliche themenbasierte Gespräche, in denen O2OL, Amora, freigegebene Gastgeber und Mitglieder gemeinsam Beziehungsfragen diskutieren können.",
    roomDetail: "Die Live-Teilnehmerzahl wird angezeigt, sobald der Raum öffnet. Keine privaten Nachrichten zwischen Mitgliedern.",
    groupActivities: "Gruppenaktivitäten",
    groupActivitiesDesc: "Gemeinsame Community-Aktivitäten, die Paare durch Spaß, Verbindung und beziehungsorientierte Erlebnisse zusammenbringen.",
    comingSoon: "Demnächst",
    forums: "Diskussionsforen",
    stories: "Erfolgsgeschichten",
    buddies: "Buddy-System",
    searchPlaceholder: "In der Gemeinschaft suchen...",
    shareStory: "Teile Deine Liebesgeschichte",
    findBuddy: "Einen Buddy Finden",
    forumsDesc: "Nimm an aufrichtigen Diskussionen über wichtige Beziehungsthemen teil",
    storiesDesc: "Lies und teile Beziehungsgeschichten, die andere ermutigen können",
    buddiesDesc: "Verbinde dich mit anderen Paaren für gegenseitige Unterstützung und Freundschaft",
    noResults: "Keine Ergebnisse gefunden",
    storyShared: "Deine Geschichte wurde mit der Community geteilt!",
    backToForums: "← Zurück zu den Foren",
    noPostsYet: "Noch keine Beiträge. Starte die erste sinnvolle Diskussion!",
    errorSharing: "Die Geschichte konnte nicht geteilt werden. Bitte versuche es erneut.",
    errorLike: "Like konnte nicht aktualisiert werden.",
    errorHelpful: "Hilfreich konnte nicht aktualisiert werden."
  }
};

export default function Community() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("forums");
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [selectedForum, setSelectedForum] = useState(null);

  const { data: forums = [] } = useQuery({
    queryKey: ["forums"],
    queryFn: () => Promise.resolve([]),
    initialData: []
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["stories", searchQuery],
    queryFn: () => getStories("-created_at", null, searchQuery || null),
    initialData: []
  });

  const { data: myBuddies = [] } = useQuery({
    queryKey: ["myBuddies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await getMyBuddies(user.id);
      } catch (error) {
        console.error("Error fetching buddies:", error);
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: []
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ["forumPosts", selectedForum?.id],
    queryFn: () => Promise.resolve([]),
    enabled: !!selectedForum,
    initialData: []
  });

  const createStoryMutation = useMutation({
    mutationFn: (data) => createStory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success(t.storyShared);
      setShowStoryForm(false);
    },
    onError: () => toast.error(t.errorSharing)
  });

  const handleLikeStory = async (story) => {
    try {
      await toggleLikeStory(story.id, story.userHasLiked);
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    } catch (error) {
      toast.error(t.errorLike);
    }
  };

  const handleMarkHelpful = async (story) => {
    try {
      await toggleHelpfulStory(story.id, story.userMarkedHelpful);
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    } catch (error) {
      toast.error(t.errorHelpful);
    }
  };

  const filteredForums = forums.filter((forum) =>
    forum.forum_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    forum.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link to={createPageUrl("Chat")}>
            <Card className="h-full border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">{t.comingSoon}</div>
              <CardHeader>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-2xl pr-24">{t.relationshipRoom}</CardTitle>
                <p className="text-gray-600 leading-relaxed">{t.relationshipRoomDesc}</p>
                <p className="text-sm text-purple-700 font-medium pt-2">{t.roomDetail}</p>
              </CardHeader>
            </Card>
          </Link>

          <Card className="h-full border-2 border-pink-100 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">{t.comingSoon}</div>
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl pr-24">{t.groupActivities}</CardTitle>
              <p className="text-gray-600 leading-relaxed">{t.groupActivitiesDesc}</p>
            </CardHeader>
          </Card>
        </div>

        <div className="mb-8 relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-lg rounded-full shadow-lg"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Clear search">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-14 bg-white shadow-lg">
            <TabsTrigger value="forums" className="text-base font-semibold">
              <MessageCircle className="w-5 h-5 mr-2" />
              {t.forums}
            </TabsTrigger>
            <TabsTrigger value="stories" className="text-base font-semibold">
              <BookOpen className="w-5 h-5 mr-2" />
              {t.stories}
            </TabsTrigger>
            <TabsTrigger value="buddies" className="text-base font-semibold">
              <UserPlus className="w-5 h-5 mr-2" />
              {t.buddies}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forums" className="mt-8">
            {selectedForum ? (
              <div>
                <Button onClick={() => setSelectedForum(null)} variant="outline" className="mb-6">{t.backToForums}</Button>
                <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-3">
                      <span className="text-4xl">{selectedForum.icon || "💬"}</span>
                      {selectedForum.forum_name}
                    </CardTitle>
                    <p className="text-white/90">{selectedForum.description}</p>
                  </CardHeader>
                </Card>
                <div className="grid gap-6">
                  {forumPosts.map((post) => (
                    <ForumPostCard key={post.id} post={post} onLike={() => {}} onReply={() => {}} />
                  ))}
                  {forumPosts.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">{t.noPostsYet}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="text-center text-gray-600 mb-6">{t.forumsDesc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredForums.map((forum) => (
                    <ForumCard key={forum.id} forum={forum} onClick={() => setSelectedForum(forum)} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="stories" className="mt-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <p className="text-gray-600">{t.storiesDesc}</p>
              <Button onClick={() => setShowStoryForm(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="w-5 h-5 mr-2" />
                {t.shareStory}
              </Button>
            </div>

            <AnimatePresence>
              {showStoryForm && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8">
                  <PostStoryForm onSubmit={(data) => createStoryMutation.mutate(data)} onCancel={() => setShowStoryForm(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} onLike={() => handleLikeStory(story)} onMarkHelpful={() => handleMarkHelpful(story)} />
              ))}
            </div>

            {stories.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{t.noResults}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="buddies" className="mt-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <p className="text-gray-600">{t.buddiesDesc}</p>
              <Link to={createPageUrl("FindFriends")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <UserPlus className="w-5 h-5 mr-2" />
                  {t.findBuddy}
                </Button>
              </Link>
            </div>

            {myBuddies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBuddies.map((buddy) => (
                  <BuddyCard key={buddy.id} buddy={buddy} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{t.noResults}</p>
                <Link to={createPageUrl("FindFriends")}>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <UserPlus className="w-5 h-5 mr-2" />
                    {t.findBuddy}
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
