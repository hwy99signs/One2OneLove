import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, User, Mail, Calendar, MapPin, Edit, Save, X, Sparkles, Gift, TrendingUp, Award, ArrowRight, MessageCircle, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const translations = {
  en: {
    title: "Our Couple Profile",
    subtitle: "Your shared journey together",
    back: "Back",
    memberSince: "Member since",
    partner1: "Partner 1",
    partner2: "Partner 2",
    personalInfo: "Personal Information",
    relationshipInfo: "Relationship Info",
    email: "Email",
    location: "Location",
    partner: "Partner",
    anniversary: "Anniversary",
    loveLanguage: "Love Language",
    relationshipStatus: "Relationship Status",
    activity: "Activity",
    loveNotesSent: "Love Notes Sent",
    memoriesCreated: "Memories Created",
    quizzesTaken: "Quizzes Taken",
    streakDays: "Day Streak",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    notSet: "Not set",
    quickActions: "Quick Actions Together",
    recentActivity: "Recent Activity",
    recommendationsTitle: "Recommendations for You Both",
    noActivity: "No recent activity",
    viewAll: "View All",
    actions: {
      sendLoveNote: "Send Love Note",
      createMemory: "Create Memory",
      aiCreator: "AI Creator",
      dateIdeas: "Date Ideas"
    },
    recommendations: {
      loveQuiz: "Take the Love Language Quiz",
      loveQuizDesc: "Discover how you both express love",
      planDate: "Plan a Date Night",
      planDateDesc: "Browse creative date ideas for your next adventure",
      createMemory: "Create a Memory",
      createMemoryDesc: "Capture a special moment from your relationship",
      setGoals: "Set Relationship Goals",
      setGoalsDesc: "Work together on shared goals"
    },
    loveLanguages: {
      words_of_affirmation: "Words of Affirmation",
      quality_time: "Quality Time",
      receiving_gifts: "Receiving Gifts",
      acts_of_service: "Acts of Service",
      physical_touch: "Physical Touch"
    },
    statuses: {
      single: "Single",
      dating: "Dating",
      engaged: "Engaged",
      married: "Married"
    }
  },
  es: {
    title: "Nuestro Perfil de Pareja",
    subtitle: "Su viaje compartido juntos",
    back: "Volver",
    memberSince: "Miembro desde",
    partner1: "Pareja 1",
    partner2: "Pareja 2",
    personalInfo: "Información Personal",
    relationshipInfo: "Información de Relación",
    email: "Correo Electrónico",
    location: "Ubicación",
    partner: "Pareja",
    anniversary: "Aniversario",
    loveLanguage: "Lenguaje del Amor",
    relationshipStatus: "Estado de Relación",
    activity: "Actividad",
    loveNotesSent: "Notas de Amor Enviadas",
    memoriesCreated: "Recuerdos Creados",
    quizzesTaken: "Cuestionarios Realizados",
    streakDays: "Racha de Días",
    editProfile: "Editar Perfil",
    saveChanges: "Guardar Cambios",
    cancel: "Cancelar",
    notSet: "No establecido",
    quickActions: "Acciones Rápidas Juntos",
    recentActivity: "Actividad Reciente",
    recommendationsTitle: "Recomendaciones para Ambos",
    noActivity: "No hay actividad reciente",
    viewAll: "Ver Todo"
  },
  fr: {
    title: "Notre Profil de Couple",
    subtitle: "Votre parcours partagé ensemble",
    back: "Retour",
    memberSince: "Membre depuis",
    partner1: "Partenaire 1",
    partner2: "Partenaire 2",
    personalInfo: "Informations Personnelles",
    relationshipInfo: "Informations sur la Relation",
    email: "E-mail",
    location: "Localisation",
    partner: "Partenaire",
    anniversary: "Anniversaire",
    loveLanguage: "Langage d'Amour",
    relationshipStatus: "Statut de Relation",
    activity: "Activité",
    loveNotesSent: "Notes d'Amour Envoyées",
    memoriesCreated: "Souvenirs Créés",
    quizzesTaken: "Quiz Réalisés",
    streakDays: "Série de Jours",
    editProfile: "Modifier le Profil",
    saveChanges: "Enregistrer les Modifications",
    cancel: "Annuler",
    notSet: "Non défini",
    quickActions: "Actions Rapides Ensemble",
    recentActivity: "Activité Récente",
    recommendationsTitle: "Recommandations pour Vous Deux",
    noActivity: "Aucune activité récente",
    viewAll: "Voir Tout"
  },
  it: {
    title: "Il Nostro Profilo di Coppia",
    subtitle: "Il vostro viaggio condiviso insieme",
    back: "Indietro",
    memberSince: "Membro dal",
    partner1: "Partner 1",
    partner2: "Partner 2",
    personalInfo: "Informazioni Personali",
    relationshipInfo: "Informazioni sulla Relazione",
    email: "Email",
    location: "Posizione",
    partner: "Partner",
    anniversary: "Anniversario",
    loveLanguage: "Linguaggio dell'Amore",
    relationshipStatus: "Stato della Relazione",
    activity: "Attività",
    loveNotesSent: "Note d'Amore Inviate",
    memoriesCreated: "Ricordi Creati",
    quizzesTaken: "Quiz Completati",
    streakDays: "Serie di Giorni",
    editProfile: "Modifica Profilo",
    saveChanges: "Salva Modifiche",
    cancel: "Annulla",
    notSet: "Non impostato",
    quickActions: "Azioni Rapide Insieme",
    recentActivity: "Attività Recente",
    recommendationsTitle: "Raccomandazioni per Entrambi",
    noActivity: "Nessuna attività recente",
    viewAll: "Visualizza Tutto"
  },
  de: {
    title: "Unser Paar-Profil",
    subtitle: "Eure gemeinsame Reise",
    back: "Zurück",
    memberSince: "Mitglied seit",
    partner1: "Partner 1",
    partner2: "Partner 2",
    personalInfo: "Persönliche Informationen",
    relationshipInfo: "Beziehungsinformationen",
    email: "E-Mail",
    location: "Standort",
    partner: "Partner",
    anniversary: "Jubiläum",
    loveLanguage: "Liebessprache",
    relationshipStatus: "Beziehungsstatus",
    activity: "Aktivität",
    loveNotesSent: "Gesendete Liebesbotschaften",
    memoriesCreated: "Erstellte Erinnerungen",
    quizzesTaken: "Absolvierte Quiz",
    streakDays: "Tage-Serie",
    editProfile: "Profil Bearbeiten",
    saveChanges: "Änderungen Speichern",
    cancel: "Abbrechen",
    notSet: "Nicht festgelegt",
    quickActions: "Schnellaktionen Zusammen",
    recentActivity: "Letzte Aktivität",
    recommendationsTitle: "Empfehlungen für Euch Beide",
    noActivity: "Keine letzte Aktivität",
    viewAll: "Alle Anzeigen"
  }
};

const ProfileCard = ({ partnerLabel, user, isEditing, editData, onEditChange, t, isCurrentUser }) => {
  const joinDate = user?.created_date ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';
  
  const stats = [
    { icon: Heart, label: t.loveNotesSent, value: user?.love_notes_sent || 0, color: "text-pink-600", bg: "bg-pink-100" },
    { icon: Calendar, label: t.memoriesCreated, value: 0, color: "text-purple-600", bg: "bg-purple-100" },
    { icon: TrendingUp, label: t.streakDays, value: user?.streak_days || 0, color: "text-blue-600", bg: "bg-blue-100" },
    { icon: Award, label: t.quizzesTaken, value: 0, color: "text-orange-600", bg: "bg-orange-100" }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4 shadow-xl">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-1">
          {user?.full_name || partnerLabel}
        </h2>
        <p className="text-gray-600 text-sm">{t.memberSince} {joinDate}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-2`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Personal Info */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t.personalInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-pink-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t.email}</p>
              <p className="font-medium text-gray-900 text-sm">{user?.email || t.notSet}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-pink-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t.location}</p>
              {isEditing && isCurrentUser ? (
                <Input
                  value={editData.location || ""}
                  onChange={(e) => onEditChange({...editData, location: e.target.value})}
                  placeholder="Enter location"
                  className="h-8 text-sm"
                />
              ) : (
                <p className="font-medium text-gray-900 text-sm">{user?.location || t.notSet}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relationship Info */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t.relationshipInfo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Heart className="w-4 h-4 text-pink-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t.relationshipStatus}</p>
              {isEditing && isCurrentUser ? (
                <Select 
                  value={editData.relationship_status || ""} 
                  onValueChange={(value) => onEditChange({...editData, relationship_status: value})}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(translations.en.statuses).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-gray-900 text-sm">
                  {user?.relationship_status ? t.statuses[user.relationship_status] : t.notSet}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="w-4 h-4 text-pink-500 mt-1 fill-current" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t.partner}</p>
              {isEditing && isCurrentUser ? (
                <Input
                  value={editData.partner_name || ""}
                  onChange={(e) => onEditChange({...editData, partner_name: e.target.value})}
                  placeholder="Partner's name"
                  className="h-8 text-sm"
                />
              ) : (
                <p className="font-medium text-gray-900 text-sm">{user?.partner_name || t.notSet}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-pink-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t.anniversary}</p>
              {isEditing && isCurrentUser ? (
                <Input
                  type="date"
                  value={editData.anniversary_date || ""}
                  onChange={(e) => onEditChange({...editData, anniversary_date: e.target.value})}
                  className="h-8 text-sm"
                />
              ) : (
                <p className="font-medium text-gray-900 text-sm">
                  {user?.anniversary_date ? new Date(user.anniversary_date).toLocaleDateString() : t.notSet}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="w-4 h-4 text-pink-500 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t.loveLanguage}</p>
              {isEditing && isCurrentUser ? (
                <Select 
                  value={editData.love_language || ""} 
                  onValueChange={(value) => onEditChange({...editData, love_language: value})}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select love language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(translations.en.loveLanguages).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-gray-900 text-sm">
                  {user?.love_language ? t.loveLanguages[user.love_language] : t.notSet}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CouplesProfile() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const { user: currentUser, isLoading } = useAuth();

  const { data: partnerUser, isLoading: partnerLoading } = useQuery({
    queryKey: ['partnerUser', currentUser?.partner_email],
    queryFn: async () => {
      if (!currentUser?.partner_email) return null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', currentUser.partner_email)
          .single();
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    },
    enabled: !!currentUser?.partner_email,
    initialData: null
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) {
        console.error('Error fetching memories:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentUser?.id,
    initialData: [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser?.id) throw new Error('User not authenticated');
      const { data: result, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', currentUser.id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update profile");
    }
  });

  const handleEdit = () => {
    setEditData({
      location: currentUser?.location || "",
      partner_name: currentUser?.partner_name || "",
      partner_email: currentUser?.partner_email || "",
      anniversary_date: currentUser?.anniversary_date || "",
      love_language: currentUser?.love_language || "",
      relationship_status: currentUser?.relationship_status || ""
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading couple profile...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    { icon: Heart, label: t.actions.sendLoveNote, color: "from-pink-500 to-rose-500", link: "LoveNotes" },
    { icon: Calendar, label: t.actions.createMemory, color: "from-purple-500 to-indigo-500", link: "MemoryLane" },
    { icon: Sparkles, label: t.actions.aiCreator, color: "from-blue-500 to-cyan-500", link: "AIContentCreator" },
    { icon: Gift, label: t.actions.dateIdeas, color: "from-orange-500 to-yellow-500", link: "DateIdeas" }
  ];

  const recommendationsList = [
    { title: t.recommendations?.loveQuiz || "Take the Love Language Quiz", description: t.recommendations?.loveQuizDesc || "Discover how you both express love", link: "LoveLanguageQuiz", icon: Heart },
    { title: t.recommendations?.planDate || "Plan a Date Night", description: t.recommendations?.planDateDesc || "Browse creative date ideas", link: "DateIdeas", icon: Calendar },
    { title: t.recommendations?.createMemory || "Create a Memory", description: t.recommendations?.createMemoryDesc || "Capture a special moment", link: "MemoryLane", icon: MessageCircle },
    { title: t.recommendations?.setGoals || "Set Relationship Goals", description: t.recommendations?.setGoalsDesc || "Work together on shared goals", link: "RelationshipGoals", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 font-dancing">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.quickActions}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl(action.link)}>
                    <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-pink-200">
                      <CardContent className="pt-6 text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <p className="font-semibold text-gray-900">{action.label}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Two Partner Profiles Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProfileCard
              partnerLabel={t.partner1}
              user={currentUser}
              isEditing={isEditing}
              editData={editData}
              onEditChange={setEditData}
              t={t}
              isCurrentUser={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ProfileCard
              partnerLabel={t.partner2}
              user={partnerUser}
              isEditing={false}
              editData={{}}
              onEditChange={() => {}}
              t={t}
              isCurrentUser={false}
            />
          </motion.div>
        </div>

        {/* Shared Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t.recentActivity}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memories.length > 0 ? (
                <div className="space-y-4">
                  {memories.slice(0, 5).map((memory) => (
                    <div key={memory.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{memory.title}</p>
                        <p className="text-sm text-gray-600">{new Date(memory.memory_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 mt-1">By {memory.created_by}</p>
                      </div>
                    </div>
                  ))}
                  <Link to={createPageUrl("MemoryLane")}>
                    <Button variant="outline" className="w-full">
                      {t.viewAll}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">{t.noActivity}</p>
                  <Link to={createPageUrl("MemoryLane")}>
                    <Button variant="outline">
                      {t.actions.createMemory}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {t.recommendationsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {recommendationsList.map((rec, index) => {
                  const Icon = rec.icon;
                  return (
                    <Link key={index} to={createPageUrl(rec.link)}>
                      <div className="flex flex-col items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all cursor-pointer border border-purple-100 h-full">
                        <Icon className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{rec.title}</p>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto mt-auto" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit/Save Buttons */}
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-center"
          >
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8"
            >
              <Save className="w-4 h-4 mr-2" />
              {t.saveChanges}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="px-8">
              <X className="w-4 h-4 mr-2" />
              {t.cancel}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button 
              onClick={handleEdit}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8 py-6 text-lg"
            >
              <Edit className="w-5 h-5 mr-2" />
              {t.editProfile}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}