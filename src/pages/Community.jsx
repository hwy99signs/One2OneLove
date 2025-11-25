import React, { useState } from "react";
import { Heart, Users, MessageCircle, TrendingUp, Plus, Search, X, UserPlus, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
// Base44 removed - using Supabase instead
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
    subtitle: "Connect, share, and grow together with other couples",
    forums: "Discussion Forums",
    stories: "Success Stories",
    buddies: "Buddy System",
    searchPlaceholder: "Search community...",
    createPost: "Create Post",
    shareStory: "Share Your Love Story",
    findBuddy: "Find a Buddy",
    forumsDesc: "Join heartfelt discussions on topics that matter to your relationship",
    storiesDesc: "Read and share beautiful relationship journeys that inspire love",
    buddiesDesc: "Connect with other couples for mutual support and friendship",
    noResults: "No results found",
    storyShared: "Your beautiful story has been shared with the community! 💕",
    buddyRequested: "Buddy request sent!",
    backToForums: "← Back to Forums",
    noPostsYet: "No posts yet. Be the first to start a meaningful discussion!",
    errorSharing: "Failed to share your story. Please try again with love.",
    errorLike: "Failed to update like. Please try again.",
    errorHelpful: "Failed to update helpful. Please try again.",
    categories: {
      long_distance: "Long Distance",
      premarital: "Pre-marital",
      marriage: "Marriage",
      dating: "Dating",
      lgbtq: "LGBTQ+",
      parenting: "Parenting",
      conflict_resolution: "Conflict Resolution",
      intimacy: "Intimacy",
      communication: "Communication",
      general: "General"
    }
  },
  es: {
    title: "Comunidad",
    subtitle: "Conéctate, comparte y crece junto con otras parejas",
    forums: "Foros de Discusión",
    stories: "Historias de Éxito",
    buddies: "Sistema de Compañeros",
    searchPlaceholder: "Buscar en la comunidad...",
    createPost: "Crear Publicación",
    shareStory: "Comparte Tu Historia de Amor",
    findBuddy: "Encontrar un Compañero",
    forumsDesc: "Únete a conversaciones sinceras sobre temas que importan a tu relación",
    storiesDesc: "Lee y comparte hermosos viajes de relaciones que inspiran amor",
    buddiesDesc: "Conéctate con otras parejas para apoyo mutuo y amistad",
    noResults: "No se encontraron resultados",
    storyShared: "¡Tu hermosa historia ha sido compartida con la comunidad! 💕",
    buddyRequested: "¡Solicitud de compañero enviada!",
    backToForums: "← Volver a los Foros",
    noPostsYet: "Aún no hay publicaciones. ¡Sé el primero en iniciar una conversación significativa!",
    errorSharing: "No se pudo compartir tu historia. Por favor, inténtalo de nuevo con amor.",
    errorLike: "No se pudo actualizar el me gusta. Por favor, inténtalo de nuevo.",
    errorHelpful: "No se pudo actualizar útil. Por favor, inténtalo de nuevo.",
    categories: {
      long_distance: "Distancia Larga",
      premarital: "Pre-matrimonial",
      marriage: "Matrimonio",
      dating: "Citas",
      lgbtq: "LGBTQ+",
      parenting: "Paternidad",
      conflict_resolution: "Resolución de Conflictos",
      intimacy: "Intimidad",
      communication: "Comunicación",
      general: "General"
    }
  },
  fr: {
    title: "Communauté",
    subtitle: "Connectez-vous, partagez et grandissez ensemble avec d'autres couples",
    forums: "Forums de Discussion",
    stories: "Histoires de Succès",
    buddies: "Système de Compagnons",
    searchPlaceholder: "Rechercher dans la communauté...",
    createPost: "Créer une Publication",
    shareStory: "Partagez Votre Histoire d'Amour",
    findBuddy: "Trouver un Compagnon",
    forumsDesc: "Rejoignez des discussions sincères sur des sujets qui comptent pour votre relation",
    storiesDesc: "Lisez et partagez de beaux parcours relationnels qui inspirent l'amour",
    buddiesDesc: "Connectez-vous avec d'autres couples pour un soutien mutuel et l'amitié",
    noResults: "Aucun résultat trouvé",
    storyShared: "Votre belle histoire a été partagée avec la communauté ! 💕",
    buddyRequested: "Demande de compagnon envoyée !",
    backToForums: "← Retour aux Forums",
    noPostsYet: "Pas encore de publications. Soyez le premier à démarrer une discussion significative !",
    errorSharing: "Échec du partage de votre histoire. Veuillez réessayer avec amour.",
    errorLike: "Échec de la mise à jour du j'aime. Veuillez réessayer.",
    errorHelpful: "Échec de la mise à jour utile. Veuillez réessayer.",
    categories: {
      long_distance: "Relation à Distance",
      premarital: "Pré-matrimonial",
      marriage: "Mariage",
      dating: "Rencontres",
      lgbtq: "LGBTQ+",
      parenting: "Parentalité",
      conflict_resolution: "Résolution de Conflits",
      intimacy: "Intimité",
      communication: "Communication",
      general: "Général"
    }
  },
  it: {
    title: "Comunità",
    subtitle: "Connettiti, condividi e cresci insieme ad altre coppie",
    forums: "Forum di Discussione",
    stories: "Storie di Successo",
    buddies: "Sistema di Compagni",
    searchPlaceholder: "Cerca nella comunità...",
    createPost: "Crea Post",
    shareStory: "Condividi la Tua Storia d'Amore",
    findBuddy: "Trova un Compagno",
    forumsDesc: "Unisciti a discussioni sincere su argomenti che contano per la tua relazione",
    storiesDesc: "Leggi e condividi bellissimi viaggi di relazioni che ispirano l'amore",
    buddiesDesc: "Connettiti con altre coppie per supporto reciproco e amicizia",
    noResults: "Nessun risultato trovato",
    storyShared: "La tua bellissima storia è stata condivisa con la comunità! 💕",
    buddyRequested: "Richiesta di compagno inviata!",
    backToForums: "← Torna ai Forum",
    noPostsYet: "Nessun post ancora. Sii il primo a iniziare una discussione significativa!",
    errorSharing: "Impossibile condividere la tua storia. Per favore, riprova con amore.",
    errorLike: "Impossibile aggiornare il mi piace. Per favore, riprova.",
    errorHelpful: "Impossibile aggiornare utile. Per favore, riprova.",
    categories: {
      long_distance: "Distanza Larga",
      premarital: "Pre-matrimoniale",
      marriage: "Matrimonio",
      dating: "Appuntamenti",
      lgbtq: "LGBTQ+",
      parenting: "Genitorialità",
      conflict_resolution: "Risoluzione dei Conflitti",
      intimacy: "Intimità",
      communication: "Comunicazione",
      general: "Generale"
    }
  },
  de: {
    title: "Gemeinschaft",
    subtitle: "Verbinde dich, teile und wachse gemeinsam mit anderen Paaren",
    forums: "Diskussionsforen",
    stories: "Erfolgsgeschichten",
    buddies: "Buddy-System",
    searchPlaceholder: "In der Gemeinschaft suchen...",
    createPost: "Beitrag Erstellen",
    shareStory: "Teile Deine Liebesgeschichte",
    findBuddy: "Einen Buddy Finden",
    forumsDesc: "Nimm an herzlichen Diskussionen über Themen teil, die für deine Beziehung wichtig sind",
    storiesDesc: "Lies und teile wunderschöne Beziehungsreisen, die Liebe inspirieren",
    buddiesDesc: "Verbinde dich mit anderen Paaren für gegenseitige Unterstützung und Freundschaft",
    noResults: "Keine Ergebnisse gefunden",
    storyShared: "Deine wunderschöne Geschichte wurde mit der Gemeinschaft geteilt! 💕",
    buddyRequested: "Buddy-Anfrage gesendet!",
    backToForums: "← Zurück zu den Foren",
    noPostsYet: "Noch keine Beiträge. Sei der Erste, der eine bedeutsame Diskussion startet!",
    errorSharing: "Geschichte konnte nicht geteilt werden. Bitte versuche es mit Liebe erneut.",
    errorLike: "Like konnte nicht aktualisiert werden. Bitte versuche es erneut.",
    errorHelpful: "Hilfreich konnte nicht aktualisiert werden. Bitte versuche es erneut.",
    categories: {
      long_distance: "Fernbeziehung",
      premarital: "Voreheliche",
      marriage: "Ehe",
      dating: "Dating",
      lgbtq: "LGBTQ+",
      parenting: "Elternschaft",
      conflict_resolution: "Konfliktlösung",
      intimacy: "Intimität",
      communication: "Kommunikation",
      general: "Allgemein"
    }
  }
};

export default function Community() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get current user from Supabase

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('forums');
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [selectedForum, setSelectedForum] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => Promise.resolve(null), // Base44 removed
  });

  const { data: forums = [] } = useQuery({
    queryKey: ['forums'],
    queryFn: () => Promise.resolve([]), // Base44 removed
    initialData: [],
  });

  // Fetch stories from Supabase
  const { data: stories = [] } = useQuery({
    queryKey: ['stories', searchQuery],
    queryFn: () => getStories('-created_at', null, searchQuery || null),
    initialData: [],
  });

  // Fetch REAL buddies from Supabase
  const { data: myBuddies = [] } = useQuery({
    queryKey: ['myBuddies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('📋 Fetching buddies for user:', user.id);
      try {
        const buddies = await getMyBuddies(user.id);
        console.log('✅ Fetched buddies:', buddies);
        return buddies;
      } catch (error) {
        console.error('❌ Error fetching buddies:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    initialData: [],
  });

  // Filter buddies - accepted friends only (from Supabase)
  const activeBuddies = myBuddies;
  const pendingBuddies = []; // No pending here, those are in FriendRequests page

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts', selectedForum?.id],
    queryFn: async () => {
      if (!selectedForum) return [];
      return Promise.resolve([]); // Base44 removed
    },
    enabled: !!selectedForum,
    initialData: [],
  });

  const createStoryMutation = useMutation({
    mutationFn: (data) => createStory(data), // Stories are auto-approved in the service
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success(t.storyShared);
      setShowStoryForm(false);
    },
    onError: (error) => {
      console.error('Error creating story:', error);
      toast.error(t.errorSharing);
    }
  });

  // Handle story like
  const handleLikeStory = async (story) => {
    try {
      await toggleLikeStory(story.id, story.userHasLiked);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t.errorLike);
    }
  };

  // Handle story helpful
  const handleMarkHelpful = async (story) => {
    try {
      await toggleHelpfulStory(story.id, story.userMarkedHelpful);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    } catch (error) {
      console.error('Error toggling helpful:', error);
      toast.error(t.errorHelpful);
    }
  };

  const updateBuddyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BuddyMatch.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBuddies'] });
    }
  });

  const handleAcceptBuddy = async (buddy) => {
    await updateBuddyMutation.mutateAsync({
      id: buddy.id,
      data: { ...buddy, status: 'active' }
    });
    toast.success("Buddy accepted!");
  };

  const handleDeclineBuddy = async (buddy) => {
    await updateBuddyMutation.mutateAsync({
      id: buddy.id,
      data: { ...buddy, status: 'inactive' }
    });
    toast.success("Buddy declined");
  };

  const filteredForums = forums.filter(forum =>
    forum.forum_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    forum.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stories are already filtered by searchQuery in the getStories function
  const filteredStories = stories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="mb-8 relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-lg rounded-full shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
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
                <Button onClick={() => setSelectedForum(null)} variant="outline" className="mb-6">
                  {t.backToForums}
                </Button>
                <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-3">
                      <span className="text-4xl">{selectedForum.icon || '💬'}</span>
                      {selectedForum.forum_name}
                    </CardTitle>
                    <p className="text-white/90">{selectedForum.description}</p>
                  </CardHeader>
                </Card>

                <div className="grid gap-6">
                  {forumPosts.map((post) => (
                    <ForumPostCard
                      key={post.id}
                      post={post}
                      onLike={() => {}}
                      onReply={() => {}}
                    />
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
                    <ForumCard
                      key={forum.id}
                      forum={forum}
                      onClick={() => setSelectedForum(forum)}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="stories" className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">{t.storiesDesc}</p>
              <Button
                onClick={() => setShowStoryForm(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t.shareStory}
              </Button>
            </div>

            <AnimatePresence>
              {showStoryForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8"
                >
                  <PostStoryForm
                    onSubmit={(data) => createStoryMutation.mutate(data)}
                    onCancel={() => setShowStoryForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onLike={() => handleLikeStory(story)}
                  onMarkHelpful={() => handleMarkHelpful(story)}
                />
              ))}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{t.noResults}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="buddies" className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">{t.buddiesDesc}</p>
              <Link to={createPageUrl("FindFriends")}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                <UserPlus className="w-5 h-5 mr-2" />
                {t.findBuddy}
              </Button>
              </Link>
            </div>

            {/* Active Friends */}
            {activeBuddies.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Friends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeBuddies.map((buddy) => (
                    <BuddyCard
                      key={buddy.id}
                      buddy={buddy}
                      onAccept={handleAcceptBuddy}
                      onDecline={handleDeclineBuddy}
                      showActions={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Requests */}
            {pendingBuddies.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Pending Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingBuddies.map((buddy) => (
                <BuddyCard
                  key={buddy.id}
                  buddy={buddy}
                  onAccept={handleAcceptBuddy}
                  onDecline={handleDeclineBuddy}
                      showActions={true}
                />
              ))}
            </div>
              </div>
            )}

            {/* Empty State */}
            {activeBuddies.length === 0 && pendingBuddies.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You don't have any buddies yet</p>
                <Link to={createPageUrl("FindFriends")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Find Your First Buddy
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