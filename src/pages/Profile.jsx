
import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, User, Mail, Calendar as CalendarIcon, MapPin, Edit, Save, X, Sparkles, Gift, TrendingUp, Award, ArrowRight, MessageCircle, Camera, BookOpen, Target, CalendarDays, Palette, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProfilePicture, updateUserProfile } from "@/lib/profileService";
import SubscriptionCard from "@/components/profile/SubscriptionCard";

const translations = {
  en: {
    profile: { 
      title: "My Profile",
      memberSince: "Member since", 
      personalInfo: "Personal Information", 
      relationshipInfo: "Relationship Info", 
      email: "Email", 
      location: "Location", 
      partner: "Partner", 
      anniversary: "Anniversary", 
      loveLanguage: "Love Language", 
      relationshipStatus: "Relationship Status",
      yourActivity: "Your Activity", 
      loveNotesSent: "Love Notes Sent", 
      memoriesCreated: "Memories Created", 
      quizzesTaken: "Quizzes Taken",
      streakDays: "Day Streak",
      editProfile: "Edit Profile", 
      saveChanges: "Save Changes",
      cancel: "Cancel",
      settings: "Settings",
      notSet: "Not set",
      quickActions: "Quick Actions",
      recentActivity: "Recent Activity",
      recommendationsTitle: "Recommendations",
      noActivity: "No recent activity",
      viewAll: "View All",
      completeProfile: "Complete Your Profile",
      completeProfileDesc: "Add your relationship details and love language",
      ourCalendar: "Our Calendar",
      actions: {
        sendLoveNote: "Send Love Note",
        createMemory: "Create Memory",
        aiCreator: "AI Creator",
        dateIdeas: "Date Ideas",
        calendar: "Our Calendar"
      },
      recommendations: {
        loveQuiz: "Take the Love Language Quiz",
        loveQuizDesc: "Discover how you and your partner express love",
        planDate: "Plan a Date Night",
        planDateDesc: "Browse creative date ideas for your next adventure",
        createMemory: "Create a Memory",
        createMemoryDesc: "Capture a special moment from your relationship"
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
    }
  },
  es: {
    profile: { 
      title: "Mi Perfil",
      memberSince: "Miembro desde", 
      personalInfo: "Información Personal", 
      relationshipInfo: "Información de Relación", 
      email: "Correo Electrónico", 
      location: "Ubicación", 
      partner: "Pareja", 
      anniversary: "Aniversario", 
      loveLanguage: "Lenguaje del Amor", 
      relationshipStatus: "Estado de Relación",
      yourActivity: "Tu Actividad", 
      loveNotesSent: "Notas de Amor Enviadas", 
      memoriesCreated: "Recuerdos Creados", 
      quizzesTaken: "Cuestionarios Realizados",
      streakDays: "Racha de Días",
      editProfile: "Editar Perfil", 
      saveChanges: "Guardar Cambios",
      cancel: "Cancelar",
      settings: "Configuración",
      notSet: "No establecido",
      quickActions: "Acciones Rápidas",
      recentActivity: "Actividad Reciente",
      recommendationsTitle: "Recomendaciones",
      noActivity: "No hay actividad reciente",
      viewAll: "Ver Todo",
      completeProfile: "Completa Tu Perfil",
      completeProfileDesc: "Agrega tus detalles de relación y lenguaje del amor",
      ourCalendar: "Nuestro Calendario",
      actions: {
        sendLoveNote: "Enviar Nota de Amor",
        createMemory: "Crear Recuerdo",
        aiCreator: "Creador IA",
        dateIdeas: "Ideas para Citas",
        calendar: "Nuestro Calendario"
      },
      recommendations: {
        loveQuiz: "Hacer el Quiz del Lenguaje del Amor",
        loveQuizDesc: "Descubre cómo tú y tu pareja expresan amor",
        planDate: "Planear una Noche de Cita",
        planDateDesc: "Explora ideas creativas para tu próxima aventura",
        createMemory: "Crear un Recuerdo",
        createMemoryDesc: "Captura un momento especial de tu relación"
      },
      loveLanguages: {
        words_of_affirmation: "Palabras de Afirmación",
        quality_time: "Tiempo de Calidad",
        receiving_gifts: "Recibir Regalos",
        acts_of_service: "Actos de Servicio",
        physical_touch: "Contacto Físico"
      },
      statuses: {
        single: "Soltero/a",
        dating: "Saliendo",
        engaged: "Comprometido/a",
        married: "Casado/a"
      }
    }
  },
  fr: {
    profile: { 
      title: "Mon Profil",
      memberSince: "Membre depuis", 
      personalInfo: "Informations Personnelles", 
      relationshipInfo: "Informations sur la Relation", 
      email: "E-mail", 
      location: "Localisation", 
      partner: "Partenaire", 
      anniversary: "Anniversaire", 
      loveLanguage: "Langage d'Amour", 
      relationshipStatus: "Statut de Relation",
      yourActivity: "Votre Activité", 
      loveNotesSent: "Notes d'Amour Envoyées", 
      memoriesCreated: "Souvenirs Créés", 
      quizzesTaken: "Quiz Réalisés",
      streakDays: "Série de Jours",
      editProfile: "Modifier le Profil", 
      saveChanges: "Enregistrer les Modifications",
      cancel: "Annuler",
      settings: "Paramètres",
      notSet: "Non défini",
      quickActions: "Actions Rapides",
      recentActivity: "Activité Récente",
      recommendationsTitle: "Recommandations",
      noActivity: "Aucune activité récente",
      viewAll: "Voir Tout",
      completeProfile: "Complétez Votre Profil",
      completeProfileDesc: "Ajoutez vos détails de relation et langage d'amour",
      ourCalendar: "Notre Calendrier",
      actions: {
        sendLoveNote: "Envoyer Note d'Amour",
        createMemory: "Créer Souvenir",
        aiCreator: "Créateur IA",
        dateIdeas: "Idées de Rendez-vous",
        calendar: "Notre Calendrier"
      },
      recommendations: {
        loveQuiz: "Faire le Quiz sur les Langages d'Amour",
        loveQuizDesc: "Découvrez comment vous et votre partenaire exprimez l'amour",
        planDate: "Planifier une Soirée",
        planDateDesc: "Parcourez des idées créatives pour votre prochaine aventure",
        createMemory: "Créer un Souvenir",
        createMemoryDesc: "Capturez un moment spécial de votre relation"
      },
      loveLanguages: {
        words_of_affirmation: "Mots d'Affirmation",
        quality_time: "Temps de Qualité",
        receiving_gifts: "Recevoir des Cadeaux",
        acts_of_service: "Actes de Service",
        physical_touch: "Contact Physique"
      },
      statuses: {
        single: "Célibataire",
        dating: "En Couple",
        engaged: "Fiancé(e)",
        married: "Marié(e)"
      }
    }
  },
  it: {
    profile: { 
      title: "Il Mio Profilo",
      memberSince: "Membro dal", 
      personalInfo: "Informazioni Personali", 
      relationshipInfo: "Informazioni sulla Relazione", 
      email: "Email", 
      location: "Posizione", 
      partner: "Partner", 
      anniversary: "Anniversario", 
      loveLanguage: "Linguaggio dell'Amore", 
      relationshipStatus: "Stato della Relazione",
      yourActivity: "La Tua Attività", 
      loveNotesSent: "Note d'Amore Inviate", 
      memoriesCreated: "Ricordi Creati", 
      quizzesTaken: "Quiz Completati",
      streakDays: "Serie di Giorni",
      editProfile: "Modifica Profilo", 
      saveChanges: "Salva Modifiche",
      cancel: "Annulla",
      settings: "Impostazioni",
      notSet: "Non impostato",
      quickActions: "Azioni Rapide",
      recentActivity: "Attività Recente",
      recommendationsTitle: "Raccomandazioni",
      noActivity: "Nessuna attività recente",
      viewAll: "Visualizza Tutto",
      completeProfile: "Completa il Tuo Profilo",
      completeProfileDesc: "Aggiungi i dettagli della tua relazione e il linguaggio dell'amore",
      ourCalendar: "Il Nostro Calendario",
      actions: {
        sendLoveNote: "Invia Nota d'Amore",
        createMemory: "Crea Ricordo",
        aiCreator: "Creatore IA",
        dateIdeas: "Idee per Appuntamenti",
        calendar: "Il Nostro Calendario"
      },
      recommendations: {
        loveQuiz: "Fai il Quiz sul Linguaggio dell'Amore",
        loveQuizDesc: "Scopri come tu e il tuo partner esprimete l'amore",
        planDate: "Pianifica una Serata",
        planDateDesc: "Sfoglia idee creative per la tua prossima avventura",
        createMemory: "Crea un Ricordo",
        createMemoryDesc: "Cattura un momento speciale della tua relazione"
      },
      loveLanguages: {
        words_of_affirmation: "Parole di Affermazione",
        quality_time: "Tempo di Qualità",
        receiving_gifts: "Ricevere Regali",
        acts_of_service: "Atti di Servizio",
        physical_touch: "Contatto Fisico"
      },
      statuses: {
        single: "Single",
        dating: "Frequentazione",
        engaged: "Fidanzato/a",
        married: "Sposato/a"
      }
    }
  },
  de: {
    profile: { 
      title: "Mein Profil",
      memberSince: "Mitglied seit", 
      personalInfo: "Persönliche Informationen", 
      relationshipInfo: "Beziehungsinformationen", 
      email: "E-Mail", 
      location: "Standort", 
      partner: "Partner", 
      anniversary: "Jubiläum", 
      loveLanguage: "Liebessprache", 
      relationshipStatus: "Beziehungsstatus",
      yourActivity: "Ihre Aktivität", 
      loveNotesSent: "Gesendete Liebesbotschaften", 
      memoriesCreated: "Erstellte Erinnerungen", 
      quizzesTaken: "Absolvierte Quiz",
      streakDays: "Tage-Serie",
      editProfile: "Profil Bearbeiten", 
      saveChanges: "Änderungen Speichern",
      cancel: "Abbrechen",
      settings: "Einstellungen",
      notSet: "Nicht festgelegt",
      quickActions: "Schnellaktionen",
      recentActivity: "Letzte Aktivität",
      recommendationsTitle: "Empfehlungen",
      noActivity: "Keine letzte Aktivität",
      viewAll: "Alle Anzeigen",
      completeProfile: "Vervollständigen Sie Ihr Profil",
      completeProfileDesc: "Fügen Sie Ihre Beziehungsdetails und Liebessprache hinzu",
      ourCalendar: "Unser Kalender",
      actions: {
        sendLoveNote: "Liebesbotschaft Senden",
        createMemory: "Erinnerung Erstellen",
        aiCreator: "KI-Ersteller",
        dateIdeas: "Date-Ideen",
        calendar: "Unser Kalender"
      },
      recommendations: {
        loveQuiz: "Liebessprachen-Quiz Machen",
        loveQuizDesc: "Entdecken Sie, wie Sie und Ihr Partner Liebe ausdrücken",
        planDate: "Date-Abend Planen",
        planDateDesc: "Durchsuchen Sie kreative Ideen für Ihr nächstes Abenteuer",
        createMemory: "Erinnerung Erstellen",
        createMemoryDesc: "Halten Sie einen besonderen Moment Ihrer Beziehung fest"
      },
      loveLanguages: {
        words_of_affirmation: "Worte der Bestätigung",
        quality_time: "Qualitätszeit",
        receiving_gifts: "Geschenke Erhalten",
        acts_of_service: "Dienstleistungen",
        physical_touch: "Körperliche Berührung"
      },
      statuses: {
        single: "Single",
        dating: "Dating",
        engaged: "Verlobt",
        married: "Verheiratet"
      }
    }
  },
  nl: {
    profile: { 
      title: "Mijn Profiel",
      memberSince: "Lid sinds", 
      personalInfo: "Persoonlijke Informatie", 
      relationshipInfo: "Relatie Informatie", 
      email: "E-mail", 
      location: "Locatie", 
      partner: "Partner", 
      anniversary: "Jubileum", 
      loveLanguage: "Liefdetaal", 
      relationshipStatus: "Relatiestatus",
      yourActivity: "Jouw Activiteit", 
      loveNotesSent: "Verzonden Liefdebriefjes", 
      memoriesCreated: "Gemaakte Herinneringen", 
      quizzesTaken: "Voltooide Quizzen",
      streakDays: "Dagen Streak",
      editProfile: "Profiel Bewerken", 
      saveChanges: "Wijzigingen Opslaan",
      cancel: "Annuleren",
      settings: "Instellingen",
      notSet: "Niet ingesteld",
      quickActions: "Snelle Acties",
      recentActivity: "Recente Activiteit",
      recommendationsTitle: "Aanbevelingen",
      noActivity: "Geen recente activiteit",
      viewAll: "Bekijk Alles",
      completeProfile: "Voltooi Je Profiel",
      completeProfileDesc: "Voeg je relatiedetails en liefdetaal toe",
      ourCalendar: "Onze Kalender",
      actions: {
        sendLoveNote: "Liefdebriefje Sturen",
        createMemory: "Herinnering Maken",
        aiCreator: "AI Maker",
        dateIdeas: "Date Ideeën",
        calendar: "Onze Kalender"
      },
      recommendations: {
        loveQuiz: "Doe de Liefdetalen Quiz",
        loveQuizDesc: "Ontdek hoe jij en je partner liefde uiten",
        planDate: "Plan een Date Avond",
        planDateDesc: "Blader door creatieve ideeën voor je volgende avontuur",
        createMemory: "Maak een Herinnering",
        createMemoryDesc: "Leg een speciaal moment van je relatie vast"
      },
      loveLanguages: {
        words_of_affirmation: "Bevestigende Woorden",
        quality_time: "Kwaliteitstijd",
        receiving_gifts: "Cadeaus Ontvangen",
        acts_of_service: "Dienstbaarheid",
        physical_touch: "Fysieke Aanraking"
      },
      statuses: {
        single: "Alleenstaand",
        dating: "Dating",
        engaged: "Verloofd",
        married: "Getrouwd"
      }
    }
  },
  pt: {
    profile: { 
      title: "Meu Perfil",
      memberSince: "Membro desde", 
      personalInfo: "Informações Pessoais", 
      relationshipInfo: "Informações do Relacionamento", 
      email: "E-mail", 
      location: "Localização", 
      partner: "Parceiro(a)", 
      anniversary: "Aniversário", 
      loveLanguage: "Linguagem do Amor", 
      relationshipStatus: "Status do Relacionamento",
      yourActivity: "Sua Atividade", 
      loveNotesSent: "Notas de Amor Enviadas", 
      memoriesCreated: "Memórias Criadas", 
      quizzesTaken: "Questionários Realizados",
      streakDays: "Sequência de Dias",
      editProfile: "Editar Perfil", 
      saveChanges: "Salvar Alterações",
      cancel: "Cancelar",
      settings: "Configurações",
      notSet: "Não definido",
      quickActions: "Ações Rápidas",
      recentActivity: "Atividade Recente",
      recommendationsTitle: "Recomendações",
      noActivity: "Nenhuma atividade recente",
      viewAll: "Ver Tudo",
      completeProfile: "Complete Seu Perfil",
      completeProfileDesc: "Adicione seus detalhes de relacionamento e linguagem do amor",
      ourCalendar: "Nosso Calendário",
      actions: {
        sendLoveNote: "Enviar Nota de Amor",
        createMemory: "Criar Memória",
        aiCreator: "Criador IA",
        dateIdeas: "Ideias de Encontros",
        calendar: "Nosso Calendário"
      },
      recommendations: {
        loveQuiz: "Fazer o Quiz das Linguagens do Amor",
        loveQuizDesc: "Descubra como você e seu parceiro expressam amor",
        planDate: "Planejar uma Noite de Encontro",
        planDateDesc: "Navegue por ideias criativas para sua próxima aventura",
        createMemory: "Criar uma Memória",
        createMemoryDesc: "Capture um momento especial do seu relacionamento"
      },
      loveLanguages: {
        words_of_affirmation: "Palavras de Afirmação",
        quality_time: "Tempo de Qualidade",
        receiving_gifts: "Receber Presentes",
        acts_of_service: "Atos de Serviço",
        physical_touch: "Toque Físico"
      },
      statuses: {
        single: "Solteiro(a)",
        dating: "Namorando",
        engaged: "Noivo(a)",
        married: "Casado(a)"
      }
    }
  }
};

export default function Profile() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { user, isLoading, refreshUserProfile } = useAuth();
  const isRegularUser = !user?.user_type || user.user_type === "regular";

  // Mock memories data for now (can be replaced with actual query later)
  const memories = [];

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!isRegularUser) throw new Error('Profile updates are available for regular users only');
      return await updateUserProfile(user.id, data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
      await refreshUserProfile();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    }
  });

  const handleEdit = () => {
    setEditData({
      location: user?.location || "",
      partner_email: user?.partner_email || "",
      anniversary_date: user?.anniversary_date || "",
      love_language: user?.love_language || "",
      relationship_status: user?.relationship_status || ""
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      toast.error('Please sign in to upload a profile picture');
      return;
    }

    if (!isRegularUser) {
      toast.error('Profile photos are currently available for regular users only');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setProfileImage(file);
    setUploadingImage(true);

    try {
      // Upload image to Supabase Storage
      const imageUrl = await uploadProfilePicture(file, user.id);
      
      // Update user profile with new image URL
      await updateUserProfile(user.id, { avatar_url: imageUrl });
      await refreshUserProfile();
      
      toast.success('Profile image updated successfully!');
      setImagePreview(null);
      setProfileImage(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image. Please try again.');
      setImagePreview(null);
      setProfileImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
          <Link to={createPageUrl("SignIn")}>
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user && !isRegularUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center">
          <Heart className="w-10 h-10 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile coming soon</h2>
          <p className="text-gray-600 mb-6">
            Profile management is currently available for regular members only. Please use your dedicated portal to update your professional details.
          </p>
          <Link to={createPageUrl("Home")}>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  // Get profile completion from backend (automatically calculated by database trigger)
  // Fallback to frontend calculation if backend values are not available
  const completionPercentage = user?.profile_completion_percentage ?? 
    (() => {
      const profileFields = [
        user?.name,
        user?.email,
        user?.location,
        user?.partner_email,
        user?.anniversary_date,
        user?.love_language,
        user?.relationship_status,
        user?.avatar_url,
        user?.date_frequency,
        user?.communication_style,
        user?.conflict_resolution,
        user?.interests,
        user?.bio,
        user?.partner_name
      ];
      const completed = profileFields.filter(field => {
        if (Array.isArray(field) || (typeof field === 'object' && field !== null)) {
          return Array.isArray(field) ? field.length > 0 : Object.keys(field).length > 0;
        }
        return field !== null && field !== undefined && field !== '';
      }).length;
      return Math.round((completed / profileFields.length) * 100);
    })();
  
  const completedFields = user?.profile_completed_fields ?? 
    (() => {
      const profileFields = [
        user?.name,
        user?.email,
        user?.location,
        user?.partner_email,
        user?.anniversary_date,
        user?.love_language,
        user?.relationship_status,
        user?.avatar_url,
        user?.date_frequency,
        user?.communication_style,
        user?.conflict_resolution,
        user?.interests,
        user?.bio,
        user?.partner_name
      ];
      return profileFields.filter(field => {
        if (Array.isArray(field) || (typeof field === 'object' && field !== null)) {
          return Array.isArray(field) ? field.length > 0 : Object.keys(field).length > 0;
        }
        return field !== null && field !== undefined && field !== '';
      }).length;
    })();
  
  const totalFields = user?.profile_total_fields ?? 14;

  const quickActions = [
    { icon: Heart, label: "Send Love Note", color: "bg-gradient-to-br from-pink-500 to-rose-500", link: "LoveNotes" },
    { icon: BookOpen, label: "My Diary", color: "bg-gradient-to-br from-purple-500 to-indigo-500", link: "SharedJournals" },
    { icon: Target, label: "Relationship Goals", color: "bg-gradient-to-br from-pink-500 to-rose-500", link: "RelationshipGoals" },
    { icon: CalendarDays, label: "Our Calendar", color: "bg-gradient-to-br from-purple-500 to-indigo-500", link: "CouplesCalendar" },
    { icon: Sparkles, label: "AI Creator", color: "bg-gradient-to-br from-blue-500 to-cyan-500", link: "AIContentCreator" },
    { icon: Gift, label: "Date Ideas", color: "bg-gradient-to-br from-orange-500 to-yellow-500", link: "DateIdeas" }
  ];

  const stats = [
    { icon: Heart, label: t.profile.loveNotesSent, value: user?.love_notes_sent || 0, color: "text-pink-600", bg: "bg-pink-100" },
    { icon: CalendarIcon, label: t.profile.memoriesCreated, value: memories.length, color: "text-purple-600", bg: "bg-purple-100" },
    { icon: TrendingUp, label: t.profile.streakDays, value: user?.streak_days || 0, color: "text-blue-600", bg: "bg-blue-100" },
    { icon: Award, label: t.profile.quizzesTaken, value: 3, color: "text-orange-600", bg: "bg-orange-100" }
  ];

  const isProfileIncomplete = !user?.partner_name || !user?.love_language || !user?.anniversary_date;

  const recommendationsList = [
    { title: t.profile.recommendations.loveQuiz, description: t.profile.recommendations.loveQuizDesc, link: "LoveLanguageQuiz", icon: Heart },
    { title: t.profile.recommendations.planDate, description: t.profile.recommendations.planDateDesc, link: "DateIdeas", icon: CalendarIcon },
    { title: t.profile.recommendations.createMemory, description: t.profile.recommendations.createMemoryDesc, link: "MemoryLane", icon: MessageCircle }
  ];

  if (isProfileIncomplete) {
    recommendationsList.unshift({
      title: t.profile.completeProfile,
      description: t.profile.completeProfileDesc,
      link: "#",
      icon: User,
      action: handleEdit
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-xl">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <button
              onClick={handleImageClick}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Change profile picture"
            >
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            {user?.name || user?.email?.split('@')[0] || "User"} 💕
          </h1>
          <p className="text-gray-600 mb-6">{t.profile.memberSince} {joinDate}</p>
          
          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md mx-auto mb-8"
          >
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Profile Completion</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{completionPercentage}%</span>
                </div>
                <div className="mb-2">
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">{completedFields}/{totalFields} Complete</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} to={createPageUrl(action.link)}>
                  <Card className="hover:shadow-xl transition-all cursor-pointer border border-gray-200 hover:border-pink-300 h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <p className="font-semibold text-gray-900">{action.label}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity & Active Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-4">No recent activity</p>
                  <Link to={createPageUrl("MemoryLane")}>
                    <Button variant="outline" className="rounded-lg">
                      Create Memory
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Active Goals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-4">No active goals yet</p>
                  <Link to={createPageUrl("RelationshipGoals")}>
                    <Button variant="outline" className="rounded-lg">
                      Set Your First Goal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preferences & Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Preferences & Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Preferred Date Frequency */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-600 mb-3">
                    <CalendarIcon className="w-5 h-5" />
                    <span className="font-semibold">Preferred Date Frequency</span>
                  </div>
                  <p className="text-gray-500 text-sm">{user?.date_frequency || "Not set"}</p>
                </div>

                {/* Communication Style */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-600 mb-3">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">Communication Style</span>
                  </div>
                  <p className="text-gray-500 text-sm">{user?.communication_style || "Not set"}</p>
                </div>

                {/* Conflict Resolution */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-600 mb-3">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">Conflict Resolution</span>
                  </div>
                  <p className="text-gray-500 text-sm">{user?.conflict_resolution || "Not set"}</p>
                </div>

                {/* Interests & Hobbies */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-600 mb-3">
                    <Gift className="w-5 h-5" />
                    <span className="font-semibold">Interests & Hobbies</span>
                  </div>
                  <p className="text-gray-500 text-sm">{user?.interests || "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suggested Improvements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <Card className="shadow-lg border-2 border-orange-200 bg-gradient-to-br from-orange-50/50 to-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Lightbulb className="w-5 h-5" />
                Suggested Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Add a personal bio */}
                <Card className="bg-yellow-50/80 border border-orange-200 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Add a personal bio</h4>
                        <p className="text-sm text-gray-600">Share more about yourself</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Connect with your partner */}
                <Link to={createPageUrl("Community")}>
                  <Card className="bg-yellow-50/80 border border-orange-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Connect with your partner</h4>
                          <p className="text-sm text-gray-600">Link your profiles together</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Set relationship goals */}
                <Link to={createPageUrl("RelationshipGoals")}>
                  <Card className="bg-yellow-50/80 border border-orange-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Set relationship goals</h4>
                          <p className="text-sm text-gray-600">Define what you want to achieve</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Add your interests */}
                <button onClick={handleEdit} className="text-left">
                  <Card className="bg-yellow-50/80 border border-orange-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Add your interests</h4>
                          <p className="text-sm text-gray-600">Help us personalize your experience</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>

                {/* Complete preferences */}
                <button onClick={handleEdit} className="text-left">
                  <Card className="bg-yellow-50/80 border border-orange-200 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Complete preferences</h4>
                          <p className="text-sm text-gray-600">Set communication and date preferences</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Personal Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.profile.personalInfo}</span>
                  {!isEditing && (
                    <Button size="sm" variant="ghost" onClick={handleEdit}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-pink-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t.profile.email}</p>
                    <p className="font-medium text-gray-900">{user?.email || t.profile.notSet}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-pink-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t.profile.location}</p>
                    {isEditing ? (
                      <Input
                        value={editData.location}
                        onChange={(e) => setEditData({...editData, location: e.target.value})}
                        placeholder="Enter location"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{user?.location || t.profile.notSet}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Relationship Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-xl h-full">
              <CardHeader>
                <CardTitle>{t.profile.relationshipInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t.profile.relationshipStatus}</p>
                    {isEditing ? (
                      <Select 
                        value={editData.relationship_status} 
                        onValueChange={(value) => setEditData({...editData, relationship_status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t.profile.statuses).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-gray-900">
                        {user?.relationship_status ? t.profile.statuses[user.relationship_status] : t.profile.notSet}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-500 mt-0.5 fill-current" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t.profile.partner}</p>
                    {isEditing ? (
                      <Input
                        value={editData.partner_email}
                        onChange={(e) => setEditData({...editData, partner_email: e.target.value})}
                        placeholder="Partner's email"
                        type="email"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{user?.partner_email || t.profile.notSet}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-pink-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t.profile.anniversary}</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.anniversary_date}
                        onChange={(e) => setEditData({...editData, anniversary_date: e.target.value})}
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {user?.anniversary_date ? new Date(user.anniversary_date).toLocaleDateString() : t.profile.notSet}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-pink-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{t.profile.loveLanguage}</p>
                    {isEditing ? (
                      <Select 
                        value={editData.love_language} 
                        onValueChange={(value) => setEditData({...editData, love_language: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select love language" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(t.profile.loveLanguages).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium text-gray-900">
                        {user?.love_language ? t.profile.loveLanguages[user.love_language] : t.profile.notSet}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscription Info */}
          <SubscriptionCard user={user} currentLanguage={currentLanguage} />
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {t.profile.recommendationsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {recommendationsList.map((rec, index) => {
                  const Icon = rec.icon;
                  return rec.action ? (
                    <button
                      key={index}
                      onClick={rec.action}
                      className="flex flex-col items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all cursor-pointer border border-purple-100 text-left"
                    >
                      <Icon className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{rec.title}</p>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </button>
                  ) : (
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

        {isEditing && (
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
              {t.profile.saveChanges}
            </Button>
            <Button onClick={handleCancel} variant="outline" className="px-8">
              <X className="w-4 h-4 mr-2" />
              {t.profile.cancel}
            </Button>
          </motion.div>
        )}

        {!isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button 
              onClick={handleEdit}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-8 py-6 text-lg"
            >
              <Edit className="w-5 h-5 mr-2" />
              {t.profile.editProfile}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
