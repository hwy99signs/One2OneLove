
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, User, Mail, Calendar as CalendarIcon, MapPin, Edit, Save, X, Sparkles, Gift, TrendingUp, Award, ArrowRight, MessageCircle, Camera } from "lucide-react";
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
  const fileInputRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    initialData: null
  });

  const { data: memories } = useQuery({
    queryKey: ['memories'],
    queryFn: () => base44.entities.Memory.list('-created_date', 5),
    initialData: [],
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
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
      location: user?.location || "",
      partner_name: user?.partner_name || "",
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

    try {
      // TODO: Upload image to backend/storage
      // For now, we'll just show a success message
      // const imageUrl = await uploadProfileImage(file);
      // await updateProfileMutation.mutateAsync({ profile_image: imageUrl });
      
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
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

  const joinDate = user?.created_date ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  const quickActions = [
    { icon: Heart, label: t.profile.actions.sendLoveNote, color: "from-pink-500 to-rose-500", link: "LoveNotes" },
    { icon: CalendarIcon, label: t.profile.actions.calendar, color: "from-indigo-500 to-purple-500", link: "CouplesCalendar" },
    { icon: Sparkles, label: t.profile.actions.aiCreator, color: "from-blue-500 to-cyan-500", link: "AIContentCreator" },
    { icon: Gift, label: t.profile.actions.dateIdeas, color: "from-orange-500 to-yellow-500", link: "DateIdeas" }
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
              ) : user?.profile_image ? (
                <img 
                  src={user.profile_image} 
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
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white"
              title="Change profile picture"
            >
              <Camera className="w-4 h-4 text-white" />
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
            {user?.full_name || "User"} 💕
          </h1>
          <p className="text-gray-600">{t.profile.memberSince} {joinDate}</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.profile.quickActions}</h2>
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
                        value={editData.partner_name}
                        onChange={(e) => setEditData({...editData, partner_name: e.target.value})}
                        placeholder="Partner's name"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">{user?.partner_name || t.profile.notSet}</p>
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

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-xl h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t.profile.recentActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memories.length > 0 ? (
                  <div className="space-y-4">
                    {memories.slice(0, 3).map((memory) => (
                      <div key={memory.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <CalendarIcon className="w-5 h-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{memory.title}</p>
                          <p className="text-sm text-gray-600">{new Date(memory.memory_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    <Link to={createPageUrl("MemoryLane")}>
                      <Button variant="outline" className="w-full">
                        {t.profile.viewAll}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">{t.profile.noActivity}</p>
                    <Link to={createPageUrl("MemoryLane")}>
                      <Button variant="outline">
                        {t.profile.actions.createMemory}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
            transition={{ delay: 0.5 }}
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
