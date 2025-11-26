import React, { useState } from "react";
import { Heart, Coffee, Utensils, Film, Music, MapPin, Star, Sparkles, Home, TreePine, Waves, Mountain, Plus, Filter, ArrowLeft, Bookmark, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import CustomDateForm from "../components/dateideas/CustomDateForm";

const translations = {
  en: {
    title: "Date Ideas for Couples",
    subtitle: "Discover creative and romantic ways to spend quality time together",
    back: "Back",
    categoryLabel: "Category",
    budgetLabel: "Budget",
    locationLabel: "Location",
    occasionLabel: "Occasion",
    stageLabel: "Relationship Stage",
    showingIdeas: "Showing",
    ideas: "date ideas",
    difficulty: "Difficulty",
    duration: "Duration",
    budget: "Budget",
    getDetails: "Get Details",
    noIdeasFound: "No date ideas found",
    tryAdjusting: "Try adjusting your filters",
    createCustom: "Create Custom Date",
    myCustomDates: "My Custom Dates",
    allDates: "All Date Ideas",
    savedDates: "Saved Dates",
    markComplete: "Mark as Done",
    addToSaved: "Save",
    shareWithPartner: "Share",
    dateSaved: "Date idea saved!",
    dateShared: "Shared with partner!",
    dateCompleted: "Marked as completed!",
    customDateCreated: "Custom date created!",
    categories: {
      all: "All Ideas",
      romantic: "Romantic",
      adventure: "Adventure",
      relaxing: "Relaxing",
      indoor: "Indoor",
      outdoor: "Outdoor",
      creative: "Creative"
    },
    budgetOptions: {
      all: "All Budgets",
      free: "Free",
      low: "Low ($)",
      medium: "Medium ($$)",
      high: "High ($$$)"
    },
    locationOptions: {
      all: "All Locations",
      home: "Home",
      outdoor: "Outdoor",
      restaurant: "Restaurant",
      activity_center: "Activity Center",
      cultural: "Cultural",
      nature: "Nature",
      urban: "Urban"
    },
    occasionOptions: {
      all: "All Occasions",
      regular: "Regular Date",
      anniversary: "Anniversary",
      birthday: "Birthday",
      valentines: "Valentine's Day",
      special: "Special",
      apology: "Apology",
      celebration: "Celebration"
    },
    stageOptions: {
      all: "All Stages",
      new: "New Relationship",
      dating: "Dating",
      committed: "Committed",
      married: "Married",
      long_term: "Long-term"
    },
    dateIdeas: {
      stargazing: { title: "Stargazing Picnic", description: "Pack a basket with your favorite foods, find a quiet spot away from city lights, and spend the evening watching the stars together.", difficulty: "Easy", duration: "2-3 hours", location_type: "nature", occasion: "regular", relationship_stage: "any" },
      cookingClass: { title: "Cooking Class Together", description: "Take a cooking class and learn to make a new cuisine together. Then enjoy the delicious meal you created!", difficulty: "Medium", duration: "3-4 hours", location_type: "activity_center", occasion: "regular", relationship_stage: "any" },
      coffeeHopping: { title: "Coffee Shop Hopping", description: "Visit 3-4 local coffee shops, try different drinks at each, and enjoy conversations in cozy atmospheres.", difficulty: "Easy", duration: "3-4 hours", location_type: "urban", occasion: "regular", relationship_stage: "any" },
      movieMarathon: { title: "Movie Marathon at Home", description: "Create a cozy fort with blankets and pillows, make popcorn, and binge-watch your favorite movie series.", difficulty: "Easy", duration: "4-6 hours", location_type: "home", occasion: "regular", relationship_stage: "any" },
      liveMusic: { title: "Live Music Night", description: "Find a local venue with live music, enjoy the performance together, and maybe even dance a little!", difficulty: "Easy", duration: "3-4 hours", location_type: "cultural", occasion: "special", relationship_stage: "any" },
      hiking: { title: "Hiking Adventure", description: "Choose a scenic trail, pack water and snacks, and enjoy nature together while getting some exercise.", difficulty: "Medium", duration: "3-5 hours", location_type: "nature", occasion: "regular", relationship_stage: "any" },
      beachSunset: { title: "Beach Sunset", description: "Visit the beach in the evening, walk along the shore, and watch the sunset together.", difficulty: "Easy", duration: "2-3 hours", location_type: "nature", occasion: "regular", relationship_stage: "any" },
      paintSip: { title: "Paint and Sip Night", description: "Set up at home with canvases, paints, wine, and create artwork together while enjoying each other's company.", difficulty: "Easy", duration: "2-3 hours", location_type: "home", occasion: "regular", relationship_stage: "any" },
      exploreNeighborhood: { title: "Explore a New Neighborhood", description: "Pick a neighborhood you've never been to and explore together - try local shops, cafes, and restaurants.", difficulty: "Easy", duration: "4-5 hours", location_type: "urban", occasion: "regular", relationship_stage: "any" }
    }
  }
};

export default function DateIdeas() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'custom', 'saved'

  const { user: currentUser } = useAuth();

  const { data: customDates = [] } = useQuery({
    queryKey: ['customDates', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('custom_date_ideas')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching custom dates:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const { data: savedDates = [] } = useQuery({
    queryKey: ['savedDates', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('custom_date_ideas')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching saved dates:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const createDateMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const { data: result, error } = await supabase
        .from('custom_date_ideas')
        .insert({ ...data, user_id: currentUser.id })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDates'] });
      toast.success(t.customDateCreated);
      setShowCustomForm(false);
    }
  });

  const updateDateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('custom_date_ideas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDates'] });
      queryClient.invalidateQueries({ queryKey: ['savedDates'] });
    }
  });

  const categories = [
    { id: 'all', name: t.categories.all, icon: Heart },
    { id: 'romantic', name: t.categories.romantic, icon: Heart },
    { id: 'adventure', name: t.categories.adventure, icon: Mountain },
    { id: 'relaxing', name: t.categories.relaxing, icon: Waves },
    { id: 'indoor', name: t.categories.indoor, icon: Home },
    { id: 'outdoor', name: t.categories.outdoor, icon: TreePine },
    { id: 'creative', name: t.categories.creative, icon: Sparkles },
  ];

  const predefinedDateIdeas = [
    {
      id: 1,
      title: t.dateIdeas.stargazing.title,
      description: t.dateIdeas.stargazing.description,
      category: 'romantic',
      budget: 'free',
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      difficulty: t.dateIdeas.stargazing.difficulty,
      duration: t.dateIdeas.stargazing.duration,
      location_type: t.dateIdeas.stargazing.location_type,
      occasion: t.dateIdeas.stargazing.occasion,
      relationship_stage: t.dateIdeas.stargazing.relationship_stage
    },
    {
      id: 2,
      title: t.dateIdeas.cookingClass.title,
      description: t.dateIdeas.cookingClass.description,
      category: 'creative',
      budget: 'medium',
      icon: Utensils,
      color: 'from-orange-500 to-red-500',
      difficulty: t.dateIdeas.cookingClass.difficulty,
      duration: t.dateIdeas.cookingClass.duration,
      location_type: t.dateIdeas.cookingClass.location_type,
      occasion: t.dateIdeas.cookingClass.occasion,
      relationship_stage: t.dateIdeas.cookingClass.relationship_stage
    },
    {
      id: 3,
      title: t.dateIdeas.coffeeHopping.title,
      description: t.dateIdeas.coffeeHopping.description,
      category: 'relaxing',
      budget: 'low',
      icon: Coffee,
      color: 'from-amber-500 to-orange-500',
      difficulty: t.dateIdeas.coffeeHopping.difficulty,
      duration: t.dateIdeas.coffeeHopping.duration,
      location_type: t.dateIdeas.coffeeHopping.location_type,
      occasion: t.dateIdeas.coffeeHopping.occasion,
      relationship_stage: t.dateIdeas.coffeeHopping.relationship_stage
    },
    {
      id: 4,
      title: t.dateIdeas.movieMarathon.title,
      description: t.dateIdeas.movieMarathon.description,
      category: 'indoor',
      budget: 'free',
      icon: Film,
      color: 'from-blue-500 to-purple-500',
      difficulty: t.dateIdeas.movieMarathon.difficulty,
      duration: t.dateIdeas.movieMarathon.duration,
      location_type: t.dateIdeas.movieMarathon.location_type,
      occasion: t.dateIdeas.movieMarathon.occasion,
      relationship_stage: t.dateIdeas.movieMarathon.relationship_stage
    },
    {
      id: 5,
      title: t.dateIdeas.liveMusic.title,
      description: t.dateIdeas.liveMusic.description,
      category: 'romantic',
      budget: 'medium',
      icon: Music,
      color: 'from-pink-500 to-rose-500',
      difficulty: t.dateIdeas.liveMusic.difficulty,
      duration: t.dateIdeas.liveMusic.duration,
      location_type: t.dateIdeas.liveMusic.location_type,
      occasion: t.dateIdeas.liveMusic.occasion,
      relationship_stage: t.dateIdeas.liveMusic.relationship_stage
    },
    {
      id: 6,
      title: t.dateIdeas.hiking.title,
      description: t.dateIdeas.hiking.description,
      category: 'adventure',
      budget: 'free',
      icon: Mountain,
      color: 'from-green-500 to-emerald-500',
      difficulty: t.dateIdeas.hiking.difficulty,
      duration: t.dateIdeas.hiking.duration,
      location_type: t.dateIdeas.hiking.location_type,
      occasion: t.dateIdeas.hiking.occasion,
      relationship_stage: t.dateIdeas.hiking.relationship_stage
    },
    {
      id: 7,
      title: t.dateIdeas.beachSunset.title,
      description: t.dateIdeas.beachSunset.description,
      category: 'outdoor',
      budget: 'free',
      icon: Waves,
      color: 'from-cyan-500 to-blue-500',
      difficulty: t.dateIdeas.beachSunset.difficulty,
      duration: t.dateIdeas.beachSunset.duration,
      location_type: t.dateIdeas.beachSunset.location_type,
      occasion: t.dateIdeas.beachSunset.occasion,
      relationship_stage: t.dateIdeas.beachSunset.relationship_stage
    },
    {
      id: 8,
      title: t.dateIdeas.paintSip.title,
      description: t.dateIdeas.paintSip.description,
      category: 'creative',
      budget: 'low',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      difficulty: t.dateIdeas.paintSip.difficulty,
      duration: t.dateIdeas.paintSip.duration,
      location_type: t.dateIdeas.paintSip.location_type,
      occasion: t.dateIdeas.paintSip.occasion,
      relationship_stage: t.dateIdeas.paintSip.relationship_stage
    },
    {
      id: 9,
      title: t.dateIdeas.exploreNeighborhood.title,
      description: t.dateIdeas.exploreNeighborhood.description,
      category: 'adventure',
      budget: 'medium',
      icon: MapPin,
      color: 'from-teal-500 to-cyan-500',
      difficulty: t.dateIdeas.exploreNeighborhood.difficulty,
      duration: t.dateIdeas.exploreNeighborhood.duration,
      location_type: t.dateIdeas.exploreNeighborhood.location_type,
      occasion: t.dateIdeas.exploreNeighborhood.occasion,
      relationship_stage: t.dateIdeas.exploreNeighborhood.relationship_stage
    },
  ];

  const allIdeas = viewMode === 'custom' 
    ? customDates 
    : viewMode === 'saved'
    ? [...savedDates, ...predefinedDateIdeas.filter(idea => savedDates.some(saved => saved.title === idea.title))]
    : [...predefinedDateIdeas, ...customDates];

  const filteredIdeas = allIdeas.filter(idea => {
    const categoryMatch = selectedCategory === 'all' || idea.category === selectedCategory;
    const budgetMatch = selectedBudget === 'all' || idea.budget === selectedBudget;
    const locationMatch = selectedLocation === 'all' || idea.location_type === selectedLocation;
    const occasionMatch = selectedOccasion === 'all' || idea.occasion === selectedOccasion;
    const stageMatch = selectedStage === 'all' || idea.relationship_stage === selectedStage || idea.relationship_stage === 'any';
    return categoryMatch && budgetMatch && locationMatch && occasionMatch && stageMatch;
  });

  const handleSaveDate = async (idea) => {
    if (idea.id && idea.created_by === currentUser?.email) {
      await updateDateMutation.mutateAsync({
        id: idea.id,
        data: { ...idea, is_favorite: !idea.is_favorite }
      });
      toast.success(idea.is_favorite ? "Removed from saved" : t.dateSaved);
    }
  };

  const handleShareDate = async (idea) => {
    const partnerEmail = localStorage.getItem('partnerEmail');
    if (!partnerEmail) {
      toast.error("Please set your partner's email in profile");
      return;
    }
    
    if (idea.id && idea.created_by === currentUser?.email) {
      await updateDateMutation.mutateAsync({
        id: idea.id,
        data: { ...idea, partner_email: partnerEmail }
      });
      toast.success(t.dateShared);
    }
  };

  const handleCompleteDate = async (idea) => {
    if (idea.id && idea.created_by === currentUser?.email) {
      await updateDateMutation.mutateAsync({
        id: idea.id,
        data: { ...idea, completed: true, completed_date: new Date().toISOString() }
      });
      toast.success(t.dateCompleted);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="mb-8 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode('all')}
              variant={viewMode === 'all' ? 'default' : 'outline'}
              className={viewMode === 'all' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.allDates}
            </Button>
            <Button
              onClick={() => setViewMode('custom')}
              variant={viewMode === 'custom' ? 'default' : 'outline'}
              className={viewMode === 'custom' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.myCustomDates} ({customDates.length})
            </Button>
            <Button
              onClick={() => setViewMode('saved')}
              variant={viewMode === 'saved' ? 'default' : 'outline'}
              className={viewMode === 'saved' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {t.savedDates} ({savedDates.length})
            </Button>
          </div>
          <Button
            onClick={() => setShowCustomForm(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.createCustom}
          </Button>
        </div>

        <AnimatePresence>
          {showCustomForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <CustomDateForm
                onSubmit={(data) => createDateMutation.mutate(data)}
                onCancel={() => setShowCustomForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder={t.categoryLabel} /></SelectTrigger>
              <SelectContent>
                {Object.entries(t.categories).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
              <SelectTrigger><SelectValue placeholder={t.budgetLabel} /></SelectTrigger>
              <SelectContent>
                {Object.entries(t.budgetOptions).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger><SelectValue placeholder={t.locationLabel} /></SelectTrigger>
              <SelectContent>
                {Object.entries(t.locationOptions).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
              <SelectTrigger><SelectValue placeholder={t.occasionLabel} /></SelectTrigger>
              <SelectContent>
                {Object.entries(t.occasionOptions).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger><SelectValue placeholder={t.stageLabel} /></SelectTrigger>
              <SelectContent>
                {Object.entries(t.stageOptions).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600">
            {t.showingIdeas} <span className="font-bold text-pink-600">{filteredIdeas.length}</span> {t.ideas}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIdeas.map((idea, index) => {
            const Icon = idea.icon || Heart;
            const isCustom = idea.created_by === currentUser?.email;
            return (
              <motion.div
                key={idea.id || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-pink-200">
                  <CardHeader>
                    <div className={`w-16 h-16 bg-gradient-to-br ${idea.color || 'from-pink-500 to-purple-600'} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {idea.title}
                      {idea.completed && <Check className="inline-block w-5 h-5 text-green-600 ml-2" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 leading-relaxed">{idea.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t.difficulty}:</span>
                        <span className="font-semibold text-gray-700">{idea.difficulty}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t.duration}:</span>
                        <span className="font-semibold text-gray-700">{idea.duration || `${idea.duration_hours}h`}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t.budget}:</span>
                        <span className="font-semibold text-gray-700 capitalize">{idea.budget}</span>
                      </div>
                    </div>

                    {isCustom && (
                      <div className="flex gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveDate(idea)}
                          className={idea.is_favorite ? 'bg-pink-50 border-pink-300' : ''}
                        >
                          <Bookmark className={`w-4 h-4 ${idea.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShareDate(idea)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {!idea.completed && (
                          <Button size="sm" variant="outline" onClick={() => handleCompleteDate(idea)}>
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}

                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                      {t.getDetails}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noIdeasFound}</h3>
            <p className="text-gray-500">{t.tryAdjusting}</p>
          </div>
        )}
      </div>
    </div>
  );
}