import React, { useState } from "react";
import { Heart, Coffee, Utensils, Film, Music, MapPin, Star, Sparkles, Home, TreePine, Waves, Mountain, Plus, Filter, ArrowLeft, Bookmark, Share2, Check, X, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getDateIdeasForLanguage, matchesDateIdeaFilter } from "../components/dateideas/dateIdeasLibrary";
import { DATE_IDEAS_UI } from "../components/dateideas/dateIdeasUiCopy";
import { createCalendarEvent } from "@/lib/calendarService";

const translations = {
  en: {
    title: "Date Ideas for Couples",
    subtitle: "52 date ideas — one for every week of the year",
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
    week: "Week",
    close: "Close",
    locations: "Location",
    occasions: "Occasion",
    stages: "Relationship Stage",
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
  const t = DATE_IDEAS_UI[currentLanguage] || DATE_IDEAS_UI.en;
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'custom', 'saved'
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduledEvent, setScheduledEvent] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);

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
        .eq('user_id', currentUser?.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDates'] });
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

  const iconMap = {
    heart: Heart,
    coffee: Coffee,
    utensils: Utensils,
    film: Film,
    music: Music,
    map: MapPin,
    star: Star,
    sparkles: Sparkles,
    home: Home,
    tree: TreePine,
    waves: Waves,
    mountain: Mountain,
  };

  const dateIdeaColors = [
    'from-purple-500 to-pink-500',
    'from-orange-500 to-red-500',
    'from-amber-500 to-orange-500',
    'from-blue-500 to-purple-500',
    'from-pink-500 to-rose-500',
    'from-green-500 to-emerald-500',
    'from-cyan-500 to-blue-500',
    'from-teal-500 to-cyan-500',
  ];

  const BUILTIN_DATE_STATE_PREFIX = '__o2ol_builtin_date__:';

  const basePredefinedDateIdeas = getDateIdeasForLanguage(currentLanguage).map((idea, index) => ({
    ...idea,
    icon: iconMap[idea.iconKey] || Heart,
    color: dateIdeaColors[index % dateIdeaColors.length]
  }));

  const builtInStateRecords = customDates.filter(record =>
    String(record.title || '').startsWith(BUILTIN_DATE_STATE_PREFIX)
  );
  const customOnlyDates = customDates.filter(record =>
    !String(record.title || '').startsWith(BUILTIN_DATE_STATE_PREFIX)
  );
  const builtInStateById = new Map(
    builtInStateRecords.map(record => [
      String(record.title).slice(BUILTIN_DATE_STATE_PREFIX.length),
      record
    ])
  );

  const predefinedDateIdeas = basePredefinedDateIdeas.map(idea => {
    const stateRecord = builtInStateById.get(String(idea.id));
    return {
      ...idea,
      user_record_id: stateRecord?.id || null,
      is_favorite: Boolean(stateRecord?.is_favorite),
      is_completed: Boolean(stateRecord?.is_completed)
    };
  });

  const savedIdeas = [
    ...predefinedDateIdeas.filter(idea => idea.is_favorite),
    ...customOnlyDates.filter(idea => idea.is_favorite)
  ];

  const allIdeas = viewMode === 'custom'
    ? customOnlyDates
    : viewMode === 'saved'
    ? savedIdeas
    : [...predefinedDateIdeas, ...customOnlyDates];

  const filteredIdeas = allIdeas.filter(idea => (
    matchesDateIdeaFilter(idea, 'category', selectedCategory) &&
    matchesDateIdeaFilter(idea, 'budget', selectedBudget) &&
    matchesDateIdeaFilter(idea, 'location', selectedLocation) &&
    matchesDateIdeaFilter(idea, 'occasion', selectedOccasion) &&
    matchesDateIdeaFilter(idea, 'stage', selectedStage)
  ));

  const requireSignedIn = () => {
    if (currentUser?.id) return true;
    toast.error(t.signInRequired);
    return false;
  };

  const firstFilterValue = (value) => Array.isArray(value) ? value[0] : (value || null);

  const persistBuiltInState = async (idea, updates) => {
    if (idea.user_record_id) {
      return updateDateMutation.mutateAsync({ id: idea.user_record_id, data: updates });
    }

    const { data, error } = await supabase
      .from('custom_date_ideas')
      .insert({
        user_id: currentUser.id,
        title: `${BUILTIN_DATE_STATE_PREFIX}${idea.id}`,
        description: idea.title,
        category: firstFilterValue(idea.categories || idea.category),
        budget: idea.budget || null,
        location_type: firstFilterValue(idea.locations || idea.location_type),
        occasion: firstFilterValue(idea.occasions || idea.occasion),
        relationship_stage: firstFilterValue(idea.stages || idea.relationship_stage),
        is_favorite: false,
        is_completed: false,
        ...updates
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const handleSaveDate = async (idea) => {
    if (!requireSignedIn()) return;
    try {
      const nextSaved = !Boolean(idea.is_favorite);
      let record = null;
      if (idea.week) {
        record = await persistBuiltInState(idea, { is_favorite: nextSaved });
      } else if (idea.id) {
        record = await updateDateMutation.mutateAsync({ id: idea.id, data: { is_favorite: nextSaved } });
      }
      queryClient.invalidateQueries({ queryKey: ['customDates', currentUser.id] });
      setSelectedIdea(current => current && current.id === idea.id
        ? { ...current, is_favorite: nextSaved, user_record_id: record?.id || current.user_record_id }
        : current);
      toast.success(nextSaved ? t.dateSaved : t.dateUnsaved);
    } catch (error) {
      console.error('Error saving date idea:', error);
      toast.error(t.actionFailed);
    }
  };

  const buildShareText = (idea) => {
    const pieces = [idea.title, idea.description];
    if (idea.budget) pieces.push(`${t.budget}: ${t.budgetOptions?.[idea.budget] || idea.budget}`);
    const locations = formatOptionList(idea.locations || idea.location_type, t.locationOptions);
    if (locations) pieces.push(`${t.locations}: ${locations}`);
    return pieces.filter(Boolean).join('\n\n');
  };

  const shareText = async ({ title, text, successMessage, copiedMessage }) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        toast.success(successMessage);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(copiedMessage);
        return;
      }
      toast.error(t.shareUnavailable);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Error sharing date:', error);
        toast.error(t.actionFailed);
      }
    }
  };

  const handleShareDate = async (idea) => {
    await shareText({
      title: idea.title,
      text: buildShareText(idea),
      successMessage: t.dateShared,
      copiedMessage: t.shareCopied
    });
  };

  const handleCompleteDate = async (idea) => {
    if (!requireSignedIn()) return;
    if (idea.is_completed) return;
    try {
      let record = null;
      if (idea.week) {
        record = await persistBuiltInState(idea, { is_completed: true });
      } else if (idea.id) {
        record = await updateDateMutation.mutateAsync({ id: idea.id, data: { is_completed: true } });
      }
      queryClient.invalidateQueries({ queryKey: ['customDates', currentUser.id] });
      setSelectedIdea(current => current && current.id === idea.id
        ? { ...current, is_completed: true, user_record_id: record?.id || current.user_record_id }
        : current);
      toast.success(t.dateCompleted);
    } catch (error) {
      console.error('Error completing date idea:', error);
      toast.error(t.actionFailed);
    }
  };

  const openSchedule = () => {
    if (!requireSignedIn()) return;
    setScheduleDate('');
    setScheduleTime('');
    setScheduledEvent(null);
    setShowScheduleForm(true);
  };

  const handleScheduleDate = async () => {
    if (!requireSignedIn()) return;
    if (!scheduleDate || !scheduleTime) {
      toast.error(t.scheduleRequired);
      return;
    }
    try {
      setIsScheduling(true);
      const event = await createCalendarEvent(currentUser.id, {
        title: selectedIdea.title,
        description: selectedIdea.description || null,
        event_date: scheduleDate,
        event_time: scheduleTime,
        event_type: 'date',
        location: formatOptionList(selectedIdea.locations || selectedIdea.location_type, t.locationOptions) || null,
        notes: selectedIdea.week ? `One2OneLove Date Idea • Week ${selectedIdea.week}/52` : 'One2OneLove Date Idea',
        color: 'pink',
        reminder_enabled: true,
        reminder_days_before: 1
      });
      setScheduledEvent({
        id: event?.id || null,
        title: selectedIdea.title,
        date: scheduleDate,
        time: scheduleTime
      });
      toast.success(t.dateScheduled);
    } catch (error) {
      console.error('Error scheduling date idea:', error);
      toast.error(error?.message || t.actionFailed);
    } finally {
      setIsScheduling(false);
    }
  };

  const formatScheduledDate = (dateValue, timeValue) => {
    if (!dateValue) return '';
    try {
      const value = new Date(`${dateValue}T${timeValue || '12:00'}`);
      return new Intl.DateTimeFormat(currentLanguage || 'en', {
        dateStyle: 'full',
        timeStyle: timeValue ? 'short' : undefined
      }).format(value);
    } catch {
      return `${dateValue}${timeValue ? ` ${timeValue}` : ''}`;
    }
  };

  const handleShareScheduledDate = async () => {
    if (!scheduledEvent || !selectedIdea) return;
    const when = formatScheduledDate(scheduledEvent.date, scheduledEvent.time);
    await shareText({
      title: selectedIdea.title,
      text: `${selectedIdea.title}\n${t.scheduledFor}: ${when}\n\n${selectedIdea.description || ''}`.trim(),
      successMessage: t.scheduleShared,
      copiedMessage: t.scheduleShareCopied
    });
  };

  const openDateIdea = (idea) => {
    setSelectedIdea(idea);
    setShowScheduleForm(false);
    setScheduleDate('');
    setScheduleTime('');
    setScheduledEvent(null);
  };

  const localToday = (() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  })();

  const formatOptionList = (values, optionMap) => {
    const list = Array.isArray(values) ? values : values ? [values] : [];
    return list.map(value => optionMap?.[value] || String(value).replaceAll('_', ' ')).join(' • ');
  };

  const formatDifficulty = (value) => {
    if (!value) return '';
    const text = String(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
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
              {t.savedDates} ({savedIdeas.length})
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
            <h3 className="text-lg font-semibold text-gray-900">{t.filters}</h3>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea, index) => {
            const Icon = idea.icon || Heart;
            return (
              <motion.button
                type="button"
                key={idea.id || `${idea.title}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.015, 0.25) }}
                onClick={() => openDateIdea(idea)}
                className="w-full min-h-[86px] bg-white rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all duration-200 px-4 py-4 text-left flex items-center gap-4"
              >
                <div className={`w-11 h-11 flex-shrink-0 bg-gradient-to-br ${idea.color || 'from-pink-500 to-purple-600'} rounded-xl flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-gray-900 leading-snug">{idea.title}</span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedIdea && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-4"
              onClick={() => setSelectedIdea(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-2xl"
                onClick={(event) => event.stopPropagation()}
                onMouseLeave={() => { if (!showScheduleForm) setSelectedIdea(null); }}
              >
                <Card className="bg-white shadow-2xl border-2 border-pink-100 max-h-[85vh] overflow-y-auto">
                  <CardHeader className="relative pr-14">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t.close || 'Close'}
                      onClick={() => setSelectedIdea(null)}
                      className="absolute right-3 top-3 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                      {(() => {
                        const DetailIcon = selectedIdea.icon || Heart;
                        return (
                          <div className={`w-14 h-14 flex-shrink-0 bg-gradient-to-br ${selectedIdea.color || 'from-pink-500 to-purple-600'} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <DetailIcon className="w-7 h-7 text-white" />
                          </div>
                        );
                      })()}
                      <div>
                        {selectedIdea.week && (
                          <p className="text-sm font-semibold text-pink-600 mb-1">{t.week || 'Week'} {selectedIdea.week} / 52</p>
                        )}
                        <CardTitle className="text-2xl font-bold text-gray-900">{selectedIdea.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{selectedIdea.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
                      <div><span className="text-gray-500">{t.difficulty}:</span> <span className="font-semibold text-gray-800">{t.difficultyOptions?.[selectedIdea.difficulty] || formatDifficulty(selectedIdea.difficulty)}</span></div>
                      <div><span className="text-gray-500">{t.duration}:</span> <span className="font-semibold text-gray-800">{selectedIdea.duration || (selectedIdea.duration_hours ? `${selectedIdea.duration_hours}h` : '')}</span></div>
                      <div><span className="text-gray-500">{t.budget}:</span> <span className="font-semibold text-gray-800">{t.budgetOptions?.[selectedIdea.budget] || selectedIdea.budget}</span></div>
                      <div><span className="text-gray-500">{t.locations || t.locationLabel}:</span> <span className="font-semibold text-gray-800">{formatOptionList(selectedIdea.locations || selectedIdea.location_type, t.locationOptions)}</span></div>
                      <div className="sm:col-span-2"><span className="text-gray-500">{t.occasions || t.occasionLabel}:</span> <span className="font-semibold text-gray-800">{formatOptionList(selectedIdea.occasions || selectedIdea.occasion, t.occasionOptions)}</span></div>
                      <div className="sm:col-span-2"><span className="text-gray-500">{t.stages || t.stageLabel}:</span> <span className="font-semibold text-gray-800">{formatOptionList(selectedIdea.stages || selectedIdea.relationship_stage, t.stageOptions)}</span></div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveDate(selectedIdea)}
                        className={selectedIdea.is_favorite ? 'bg-pink-50 border-pink-300' : ''}
                      >
                        <Bookmark className={`w-4 h-4 mr-2 ${selectedIdea.is_favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                        {selectedIdea.is_favorite ? t.saved : t.addToSaved}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleShareDate(selectedIdea)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        {t.shareWithPartner}
                      </Button>
                      <Button size="sm" variant="outline" onClick={openSchedule}>
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {t.schedule}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteDate(selectedIdea)}
                        disabled={Boolean(selectedIdea.is_completed)}
                        className={selectedIdea.is_completed ? 'bg-green-50 border-green-300 text-green-700' : ''}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {selectedIdea.is_completed ? t.done : t.markComplete}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showScheduleForm && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="mt-4 rounded-xl border border-purple-200 bg-purple-50/60 p-4"
                        >
                          {!scheduledEvent ? (
                            <>
                              <div className="flex items-center gap-2 mb-4">
                                <CalendarDays className="w-5 h-5 text-purple-600" />
                                <h4 className="font-bold text-gray-900">{t.scheduleTitle}</h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.scheduleDate}</label>
                                  <Input
                                    type="date"
                                    min={localToday}
                                    value={scheduleDate}
                                    onChange={(event) => setScheduleDate(event.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t.scheduleTime}</label>
                                  <div className="relative">
                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <Input
                                      type="time"
                                      value={scheduleTime}
                                      onChange={(event) => setScheduleTime(event.target.value)}
                                      className="pl-9"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-4">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowScheduleForm(false)}
                                  disabled={isScheduling}
                                >
                                  {t.cancel}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleScheduleDate}
                                  disabled={isScheduling || !scheduleDate || !scheduleTime}
                                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                                >
                                  <CalendarDays className="w-4 h-4 mr-2" />
                                  {isScheduling ? t.scheduling : t.scheduleAction}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-900 mb-1">{t.dateScheduled}</p>
                              <p className="text-sm text-gray-700 mb-4">
                                {t.scheduledFor}: {formatScheduledDate(scheduledEvent.date, scheduledEvent.time)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" size="sm" onClick={handleShareScheduledDate} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                                  <Share2 className="w-4 h-4 mr-2" />
                                  {t.shareSchedule}
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowScheduleForm(false)}>
                                  {t.close}
                                </Button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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