import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getMutualPartnerDirectoryProfile } from "@/lib/coupleProfileService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, User, Mail, Calendar, MapPin, Edit, Save, X, Sparkles, ArrowRight, MessageCircle, Users, ArrowLeft, Loader2 } from "lucide-react";
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
    title: "Our Couple Profile", subtitle: "A private home base for the relationship details you choose to share.", back: "Back",
    yourProfile: "Your Profile", partnerProfile: "Partner Profile", memberSince: "Member since", personalInfo: "Personal Information", relationshipInfo: "Relationship Information",
    email: "Email", location: "Location", partnerName: "Partner Name", partnerEmail: "Partner Email", anniversary: "Anniversary", loveLanguage: "Love Language", relationshipStatus: "Relationship Status", bio: "About", interests: "Interests",
    editProfile: "Edit Profile", saveChanges: "Save Changes", saving: "Saving...", cancel: "Cancel", notSet: "Not set", signIn: "Please sign in to view your couple profile.",
    partnerNotLinked: "No mutual partner profile is linked yet.", mutualRequired: "For privacy, a partner profile appears only when both accounts list each other’s email address. Enter your partner’s email in your profile, and your partner must enter yours in theirs.",
    privacyTitle: "Mutual-link privacy", privacyCopy: "One2OneLove does not expose another member’s private account row here. Only safe directory fields are shown after the relationship link is reciprocal.",
    quickActions: "Do Something Together", updateSuccess: "Profile updated successfully.", updateError: "We could not update your profile.",
    locationPlaceholder: "City or area", partnerNamePlaceholder: "Partner's name", partnerEmailPlaceholder: "partner@example.com",
    actions: [
      ["Conversation Cards", "Start a private conversation with a thoughtful prompt.", "/ConversationCards", "message"],
      ["Date Night", "Turn available time and budget into intentional time together.", "/DateNight", "heart"],
      ["Relationship Rituals", "Choose a small repeatable habit for connection.", "/RelationshipRituals", "sparkles"],
      ["Relationship Goals", "Create a shared goal and work on it together.", "/RelationshipGoals", "users"]
    ],
    statuses: { single: "Single", dating: "Dating", engaged: "Engaged", married: "Married" },
    loveLanguages: { words_of_affirmation: "Words of Affirmation", quality_time: "Quality Time", receiving_gifts: "Receiving Gifts", acts_of_service: "Acts of Service", physical_touch: "Physical Touch" }
  },
  es: {
    title: "Nuestro Perfil de Pareja", subtitle: "Un espacio privado para los detalles de la relación que ustedes decidan compartir.", back: "Volver",
    yourProfile: "Tu Perfil", partnerProfile: "Perfil de tu Pareja", memberSince: "Miembro desde", personalInfo: "Información Personal", relationshipInfo: "Información de la Relación",
    email: "Correo Electrónico", location: "Ubicación", partnerName: "Nombre de la Pareja", partnerEmail: "Correo de la Pareja", anniversary: "Aniversario", loveLanguage: "Lenguaje del Amor", relationshipStatus: "Estado de la Relación", bio: "Acerca de", interests: "Intereses",
    editProfile: "Editar Perfil", saveChanges: "Guardar Cambios", saving: "Guardando...", cancel: "Cancelar", notSet: "No establecido", signIn: "Inicia sesión para ver tu perfil de pareja.",
    partnerNotLinked: "Todavía no hay un perfil de pareja vinculado mutuamente.", mutualRequired: "Por privacidad, el perfil de una pareja aparece solo cuando ambas cuentas indican el correo de la otra. Ingresa el correo de tu pareja en tu perfil y tu pareja debe ingresar el tuyo en el suyo.",
    privacyTitle: "Privacidad por vínculo mutuo", privacyCopy: "One2OneLove no expone aquí la cuenta privada de otro miembro. Solo se muestran campos seguros del directorio después de que el vínculo sea recíproco.",
    quickActions: "Hagan Algo Juntos", updateSuccess: "Perfil actualizado correctamente.", updateError: "No pudimos actualizar tu perfil.",
    locationPlaceholder: "Ciudad o zona", partnerNamePlaceholder: "Nombre de tu pareja", partnerEmailPlaceholder: "pareja@ejemplo.com",
    actions: [
      ["Tarjetas de Conversación", "Inicien una conversación privada con una pregunta significativa.", "/ConversationCards", "message"],
      ["Noche de Cita", "Conviertan el tiempo y presupuesto disponibles en tiempo intencional juntos.", "/DateNight", "heart"],
      ["Rituales de Relación", "Elijan un pequeño hábito repetible para fortalecer la conexión.", "/RelationshipRituals", "sparkles"],
      ["Metas de Relación", "Creen una meta compartida y trabajen en ella juntos.", "/RelationshipGoals", "users"]
    ],
    statuses: { single: "Soltero/a", dating: "Saliendo", engaged: "Comprometido/a", married: "Casado/a" },
    loveLanguages: { words_of_affirmation: "Palabras de Afirmación", quality_time: "Tiempo de Calidad", receiving_gifts: "Recibir Regalos", acts_of_service: "Actos de Servicio", physical_touch: "Contacto Físico" }
  },
  fr: {
    title: "Notre Profil de Couple", subtitle: "Un espace privé pour les informations relationnelles que vous choisissez de partager.", back: "Retour",
    yourProfile: "Votre Profil", partnerProfile: "Profil du Partenaire", memberSince: "Membre depuis", personalInfo: "Informations Personnelles", relationshipInfo: "Informations sur la Relation",
    email: "E-mail", location: "Localisation", partnerName: "Nom du Partenaire", partnerEmail: "E-mail du Partenaire", anniversary: "Anniversaire", loveLanguage: "Langage d’Amour", relationshipStatus: "Statut de la Relation", bio: "À Propos", interests: "Centres d’Intérêt",
    editProfile: "Modifier le Profil", saveChanges: "Enregistrer", saving: "Enregistrement...", cancel: "Annuler", notSet: "Non défini", signIn: "Connectez-vous pour voir votre profil de couple.",
    partnerNotLinked: "Aucun profil partenaire mutuellement lié pour le moment.", mutualRequired: "Pour protéger la vie privée, le profil du partenaire apparaît uniquement lorsque les deux comptes indiquent l’adresse e-mail de l’autre. Ajoutez l’e-mail de votre partenaire à votre profil et votre partenaire doit ajouter le vôtre au sien.",
    privacyTitle: "Confidentialité par lien mutuel", privacyCopy: "One2OneLove n’expose pas ici la ligne de compte privée d’un autre membre. Seuls les champs sûrs du répertoire sont affichés lorsque le lien est réciproque.",
    quickActions: "Faire Quelque Chose Ensemble", updateSuccess: "Profil mis à jour avec succès.", updateError: "Nous n’avons pas pu mettre à jour votre profil.",
    locationPlaceholder: "Ville ou région", partnerNamePlaceholder: "Nom de votre partenaire", partnerEmailPlaceholder: "partenaire@exemple.com",
    actions: [
      ["Cartes de Conversation", "Commencez une conversation privée avec une question réfléchie.", "/ConversationCards", "message"],
      ["Soirée en Couple", "Transformez votre temps et votre budget disponibles en moment intentionnel.", "/DateNight", "heart"],
      ["Rituels de Relation", "Choisissez une petite habitude répétée pour renforcer la connexion.", "/RelationshipRituals", "sparkles"],
      ["Objectifs de Relation", "Créez un objectif commun et avancez ensemble.", "/RelationshipGoals", "users"]
    ],
    statuses: { single: "Célibataire", dating: "En Couple", engaged: "Fiancé(e)", married: "Marié(e)" },
    loveLanguages: { words_of_affirmation: "Paroles Valorissantes", quality_time: "Moments de Qualité", receiving_gifts: "Recevoir des Cadeaux", acts_of_service: "Services Rendus", physical_touch: "Contact Physique" }
  },
  it: {
    title: "Il Nostro Profilo di Coppia", subtitle: "Uno spazio privato per i dettagli della relazione che scegliete di condividere.", back: "Indietro",
    yourProfile: "Il Tuo Profilo", partnerProfile: "Profilo del Partner", memberSince: "Membro dal", personalInfo: "Informazioni Personali", relationshipInfo: "Informazioni sulla Relazione",
    email: "Email", location: "Posizione", partnerName: "Nome del Partner", partnerEmail: "Email del Partner", anniversary: "Anniversario", loveLanguage: "Linguaggio dell’Amore", relationshipStatus: "Stato della Relazione", bio: "Informazioni", interests: "Interessi",
    editProfile: "Modifica Profilo", saveChanges: "Salva Modifiche", saving: "Salvataggio...", cancel: "Annulla", notSet: "Non impostato", signIn: "Accedi per vedere il profilo di coppia.",
    partnerNotLinked: "Non è ancora collegato un profilo partner reciproco.", mutualRequired: "Per proteggere la privacy, il profilo del partner appare solo quando entrambi gli account indicano l’email dell’altro. Inserisci l’email del partner nel tuo profilo e il partner deve inserire la tua nel proprio.",
    privacyTitle: "Privacy con collegamento reciproco", privacyCopy: "One2OneLove non espone qui la riga privata dell’account di un altro membro. Vengono mostrati solo campi sicuri della directory dopo che il collegamento è reciproco.",
    quickActions: "Fate Qualcosa Insieme", updateSuccess: "Profilo aggiornato con successo.", updateError: "Non è stato possibile aggiornare il profilo.",
    locationPlaceholder: "Città o zona", partnerNamePlaceholder: "Nome del partner", partnerEmailPlaceholder: "partner@esempio.com",
    actions: [
      ["Carte di Conversazione", "Iniziate una conversazione privata con una domanda significativa.", "/ConversationCards", "message"],
      ["Serata di Coppia", "Trasformate il tempo e il budget disponibili in tempo intenzionale insieme.", "/DateNight", "heart"],
      ["Rituali di Coppia", "Scegliete una piccola abitudine ripetibile per la connessione.", "/RelationshipRituals", "sparkles"],
      ["Obiettivi di Relazione", "Create un obiettivo condiviso e lavorateci insieme.", "/RelationshipGoals", "users"]
    ],
    statuses: { single: "Single", dating: "In Coppia", engaged: "Fidanzato/a", married: "Sposato/a" },
    loveLanguages: { words_of_affirmation: "Parole di Affermazione", quality_time: "Tempo di Qualità", receiving_gifts: "Ricevere Regali", acts_of_service: "Gesti di Servizio", physical_touch: "Contatto Fisico" }
  },
  de: {
    title: "Unser Paar-Profil", subtitle: "Ein privater Ausgangspunkt für Beziehungsdetails, die ihr freiwillig teilt.", back: "Zurück",
    yourProfile: "Dein Profil", partnerProfile: "Partnerprofil", memberSince: "Mitglied seit", personalInfo: "Persönliche Informationen", relationshipInfo: "Beziehungsinformationen",
    email: "E-Mail", location: "Standort", partnerName: "Name des Partners", partnerEmail: "E-Mail des Partners", anniversary: "Jahrestag", loveLanguage: "Liebessprache", relationshipStatus: "Beziehungsstatus", bio: "Über", interests: "Interessen",
    editProfile: "Profil Bearbeiten", saveChanges: "Änderungen Speichern", saving: "Wird gespeichert...", cancel: "Abbrechen", notSet: "Nicht festgelegt", signIn: "Bitte melde dich an, um euer Paar-Profil zu sehen.",
    partnerNotLinked: "Noch kein gegenseitig verknüpftes Partnerprofil.", mutualRequired: "Zum Schutz der Privatsphäre erscheint ein Partnerprofil nur, wenn beide Konten die E-Mail-Adresse des jeweils anderen hinterlegt haben. Trage die E-Mail deines Partners in deinem Profil ein; dein Partner muss deine E-Mail im eigenen Profil eintragen.",
    privacyTitle: "Datenschutz durch gegenseitige Verknüpfung", privacyCopy: "One2OneLove zeigt hier nicht die private Kontenzeile eines anderen Mitglieds. Erst bei gegenseitiger Verknüpfung werden ausschließlich sichere Verzeichnisfelder angezeigt.",
    quickActions: "Gemeinsam Aktiv Werden", updateSuccess: "Profil erfolgreich aktualisiert.", updateError: "Dein Profil konnte nicht aktualisiert werden.",
    locationPlaceholder: "Stadt oder Region", partnerNamePlaceholder: "Name deines Partners", partnerEmailPlaceholder: "partner@beispiel.de",
    actions: [
      ["Gesprächskarten", "Startet ein privates Gespräch mit einer durchdachten Frage.", "/ConversationCards", "message"],
      ["Date Night", "Macht aus verfügbarer Zeit und Budget bewusste gemeinsame Zeit.", "/DateNight", "heart"],
      ["Beziehungsrituale", "Wählt eine kleine wiederholbare Gewohnheit für mehr Verbindung.", "/RelationshipRituals", "sparkles"],
      ["Beziehungsziele", "Setzt ein gemeinsames Ziel und arbeitet zusammen daran.", "/RelationshipGoals", "users"]
    ],
    statuses: { single: "Single", dating: "In einer Beziehung", engaged: "Verlobt", married: "Verheiratet" },
    loveLanguages: { words_of_affirmation: "Worte der Anerkennung", quality_time: "Gemeinsame Zeit", receiving_gifts: "Geschenke Erhalten", acts_of_service: "Hilfsbereitschaft", physical_touch: "Körperliche Nähe" }
  }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };
const actionIcons = { message: MessageCircle, heart: Heart, sparkles: Sparkles, users: Users };

function formatMonthYear(value, language) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(localeMap[language] || localeMap.en, { month: 'long', year: 'numeric' }).format(date);
}

function formatDate(value, language) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(localeMap[language] || localeMap.en, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function ProfileIdentity({ profile, label, t, language, showEmail = false }) {
  const name = profile?.name || profile?.full_name || label;
  const memberSince = formatMonthYear(profile?.created_at || profile?.created_date, language);
  const interests = Array.isArray(profile?.interests) ? profile.interests.filter(Boolean).slice(0, 8) : [];

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="text-center">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="mx-auto h-20 w-20 rounded-full object-cover shadow-md" loading="lazy" />
        ) : (
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-md">
            <User className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
        )}
        <CardTitle className="mt-3 text-2xl">{name}</CardTitle>
        {memberSince && <p className="text-sm text-slate-500">{t.memberSince} {memberSince}</p>}
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {showEmail && profile?.email && (
          <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-pink-600" aria-hidden="true" /><div><p className="text-xs text-slate-500">{t.email}</p><p className="break-all font-medium text-slate-800">{profile.email}</p></div></div>
        )}
        {profile?.location && (
          <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-pink-600" aria-hidden="true" /><div><p className="text-xs text-slate-500">{t.location}</p><p className="font-medium text-slate-800">{profile.location}</p></div></div>
        )}
        {profile?.relationship_status && (
          <div className="flex items-start gap-3"><Heart className="mt-0.5 h-4 w-4 text-pink-600" aria-hidden="true" /><div><p className="text-xs text-slate-500">{t.relationshipStatus}</p><p className="font-medium text-slate-800">{t.statuses[profile.relationship_status] || profile.relationship_status}</p></div></div>
        )}
        {profile?.bio && <div><p className="text-xs text-slate-500">{t.bio}</p><p className="mt-1 leading-6 text-slate-700">{profile.bio}</p></div>}
        {interests.length > 0 && (
          <div><p className="text-xs text-slate-500">{t.interests}</p><div className="mt-2 flex flex-wrap gap-2">{interests.map((interest) => <span key={interest} className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">{interest}</span>)}</div></div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CouplesProfile() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user: currentUser, isLoading, refreshUserProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: partnerUser, isLoading: partnerLoading } = useQuery({
    queryKey: ['mutualPartnerDirectory', currentUser?.id],
    queryFn: getMutualPartnerDirectoryProfile,
    enabled: !!currentUser?.id,
    retry: false,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!isEditing || !currentUser) return;
    setEditData({
      location: currentUser.location || '',
      partner_name: currentUser.partner_name || '',
      partner_email: currentUser.partner_email || '',
      anniversary_date: currentUser.anniversary_date || '',
      love_language: currentUser.love_language || '',
      relationship_status: currentUser.relationship_status || '',
    });
  }, [isEditing, currentUser]);

  const updateMutation = useMutation({
    mutationFn: async (values) => {
      if (!currentUser?.id) throw new Error('Authentication required');
      const updates = {
        location: values.location.trim() || null,
        partner_name: values.partner_name.trim() || null,
        partner_email: values.partner_email.trim().toLowerCase() || null,
        anniversary_date: values.anniversary_date || null,
        love_language: values.love_language || null,
        relationship_status: values.relationship_status || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('users').update(updates).eq('id', currentUser.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshUserProfile();
      await queryClient.invalidateQueries({ queryKey: ['mutualPartnerDirectory', currentUser?.id] });
      setIsEditing(false);
      toast.success(t.updateSuccess);
    },
    onError: () => toast.error(t.updateError),
  });

  const currentRelationship = useMemo(() => ([
    [t.partnerName, currentUser?.partner_name || t.notSet],
    [t.anniversary, formatDate(currentUser?.anniversary_date, currentLanguage) || t.notSet],
    [t.loveLanguage, currentUser?.love_language ? (t.loveLanguages[currentUser.love_language] || currentUser.love_language) : t.notSet],
  ]), [currentUser, currentLanguage, t]);

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"><div className="flex items-center gap-3 text-slate-600" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.title}</div></main>;
  }

  if (!currentUser) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4"><Card className="max-w-lg"><CardContent className="p-8 text-center"><User className="mx-auto h-10 w-10 text-pink-600" aria-hidden="true" /><p className="mt-4 text-slate-700">{t.signIn}</p></CardContent></Card></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Link to={createPageUrl('CouplesDashboard')} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-pink-700"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}</Link>

        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-7 max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Heart className="h-8 w-8 fill-white text-white" aria-hidden="true" /></div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </motion.header>

        <section className="mt-9 grid gap-6 lg:grid-cols-2" aria-label={t.title}>
          <div>
            <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-900">{t.yourProfile}</h2><Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" aria-hidden="true" />{t.editProfile}</Button></div>
            <ProfileIdentity profile={currentUser} label={t.yourProfile} t={t} language={currentLanguage} showEmail />
            <Card className="mt-4 border-slate-200"><CardHeader><CardTitle className="text-lg">{t.relationshipInfo}</CardTitle></CardHeader><CardContent className="space-y-3">{currentRelationship.map(([label, value]) => <div key={label}><p className="text-xs text-slate-500">{label}</p><p className="font-medium text-slate-800">{value}</p></div>)}</CardContent></Card>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-bold text-slate-900">{t.partnerProfile}</h2>
            {partnerLoading ? (
              <Card><CardContent className="flex min-h-64 items-center justify-center gap-3 p-8 text-slate-600" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.partnerProfile}</CardContent></Card>
            ) : partnerUser ? (
              <ProfileIdentity profile={partnerUser} label={t.partnerProfile} t={t} language={currentLanguage} />
            ) : (
              <Card className="border-dashed border-pink-200 bg-white/80"><CardContent className="p-8 text-center"><Users className="mx-auto h-10 w-10 text-pink-600" aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-slate-900">{t.partnerNotLinked}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{t.mutualRequired}</p></CardContent></Card>
            )}
          </div>
        </section>

        <aside className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><div className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" aria-hidden="true" /><div><h2 className="font-bold text-indigo-950">{t.privacyTitle}</h2><p className="mt-1 text-sm leading-6 text-indigo-900/80">{t.privacyCopy}</p></div></div></aside>

        <section className="mt-10" aria-labelledby="couple-actions-heading">
          <h2 id="couple-actions-heading" className="text-2xl font-bold text-slate-900">{t.quickActions}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.actions.map(([title, description, href, iconKey]) => {
              const Icon = actionIcons[iconKey] || Heart;
              return <Link key={href} to={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"><Icon className="h-6 w-6 text-pink-600" aria-hidden="true" /><h3 className="mt-4 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><ArrowRight className="mt-4 h-4 w-4 text-pink-600 transition group-hover:translate-x-1" aria-hidden="true" /></Link>;
            })}
          </div>
        </section>

        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => !updateMutation.isPending && setIsEditing(false)}>
            <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="couple-profile-edit-title" onClick={(event) => event.stopPropagation()}>
              <CardHeader><div className="flex items-center justify-between gap-4"><CardTitle id="couple-profile-edit-title">{t.editProfile}</CardTitle><Button type="button" variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending} aria-label={t.cancel}><X className="h-5 w-5" aria-hidden="true" /></Button></div></CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">{t.location}<Input className="mt-2" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} placeholder={t.locationPlaceholder} /></label>
                <label className="block text-sm font-medium text-slate-700">{t.partnerName}<Input className="mt-2" value={editData.partner_name || ''} onChange={(e) => setEditData({ ...editData, partner_name: e.target.value })} placeholder={t.partnerNamePlaceholder} /></label>
                <label className="block text-sm font-medium text-slate-700">{t.partnerEmail}<Input className="mt-2" type="email" autoComplete="email" value={editData.partner_email || ''} onChange={(e) => setEditData({ ...editData, partner_email: e.target.value })} placeholder={t.partnerEmailPlaceholder} /></label>
                <label className="block text-sm font-medium text-slate-700">{t.anniversary}<Input className="mt-2" type="date" value={editData.anniversary_date || ''} onChange={(e) => setEditData({ ...editData, anniversary_date: e.target.value })} /></label>
                <div><label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="couple-status">{t.relationshipStatus}</label><Select value={editData.relationship_status || ''} onValueChange={(value) => setEditData({ ...editData, relationship_status: value })}><SelectTrigger id="couple-status"><SelectValue placeholder={t.notSet} /></SelectTrigger><SelectContent>{Object.entries(t.statuses).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                <div><label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="couple-love-language">{t.loveLanguage}</label><Select value={editData.love_language || ''} onValueChange={(value) => setEditData({ ...editData, love_language: value })}><SelectTrigger id="couple-love-language"><SelectValue placeholder={t.notSet} /></SelectTrigger><SelectContent>{Object.entries(t.loveLanguages).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
                <p className="rounded-xl bg-pink-50 p-3 text-xs leading-5 text-pink-900">{t.mutualRequired}</p>
                <div className="flex gap-3 pt-2"><Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending}>{t.cancel}</Button><Button type="button" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600" onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>{updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{t.saving}</> : <><Save className="mr-2 h-4 w-4" aria-hidden="true" />{t.saveChanges}</>}</Button></div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
