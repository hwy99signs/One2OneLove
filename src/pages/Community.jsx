import React, { useState } from "react";
import { Heart, Users, MessageCircle, TrendingUp, Plus, Search, X, UserPlus, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { base44 } from "@/api/base44Client";
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

const translations = {
  en: {
    title: "Community",
    subtitle: "Connect, share, and grow together with other couples",
    forums: "Discussion Forums",
    stories: "Success Stories",
    buddies: "Buddy System",
    searchPlaceholder: "Search community...",
    createPost: "Create Post",
    shareStory: "Share Story",
    findBuddy: "Find a Buddy",
    forumsDesc: "Join discussions on topics that matter to you",
    storiesDesc: "Read and share relationship journeys",
    buddiesDesc: "Connect with others for mutual support",
    noResults: "No results found",
    storyShared: "Story shared successfully!",
    buddyRequested: "Buddy request sent!",
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
    queryFn: () => base44.auth.me(),
  });

  const { data: forums = [] } = useQuery({
    queryKey: ['forums'],
    queryFn: () => base44.entities.DiscussionForum.list(),
    initialData: [],
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const allStories = await base44.entities.CommunityStory.filter({ moderation_status: 'approved' });
      return allStories.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
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
      return await base44.entities.ForumPost.filter({ forum_id: selectedForum.id });
    },
    enabled: !!selectedForum,
    initialData: [],
  });

  const createStoryMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunityStory.create({
      ...data,
      author_name: data.is_anonymous ? 'Anonymous' : currentUser?.full_name || 'User'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success(t.storyShared);
      setShowStoryForm(false);
    }
  });

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

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  ← Back to Forums
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
                      <p className="text-gray-600">No posts yet. Be the first to start a discussion!</p>
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
                  onLike={() => {}}
                  onMarkHelpful={() => {}}
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