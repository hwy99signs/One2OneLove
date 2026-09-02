import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Heart, Loader2, LockKeyhole, Mail, MapPin, MessageCircle, Pencil, Save, ShieldCheck, Target, UserRound, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { updateUserProfile } from '@/lib/profileService';

const COPY = {
  en: {
    title: 'My Profile', subtitle: 'Choose what helps One2OneLove personalize your experience. Relaunch member discovery is intentionally minimal.', edit: 'Edit Profile', save: 'Save Changes', saving: 'Saving…', cancel: 'Cancel',
    signInTitle: 'Sign in to view your profile', signInDesc: 'Account details are available only after sign-in.', signIn: 'Sign In', createFree: 'Create Free Account',
    account: 'Account', memberSince: 'Member since', email: 'Account email', personal: 'Member Details', relationship: 'Relationship Details',
    name: 'Name', bio: 'Short bio', location: 'General location', status: 'Relationship status', anniversary: 'Anniversary', partnerName: 'Partner name', loveLanguage: 'Love Language', notSet: 'Not set',
    publicTitle: 'What other members can discover', publicNote: 'The relaunch member directory may show only your display name, optional profile image, short bio and member-since date.',
    privateTitle: 'Account-private details', privateNote: 'Your account email, location, relationship status, anniversary, partner information and Love Language remain account-private and are not part of member discovery. Partner email is not collected in the relaunch profile because there is not yet a reviewed partner-linking workflow that needs it.',
    saved: 'Profile updated.', failed: 'Unable to save your profile right now.', regularOnly: 'Profile editing is currently available for regular member accounts only.',
    statuses: { single: 'Single', dating: 'Dating', engaged: 'Engaged', married: 'Married', complicated: 'Complicated' },
    loveLanguages: { words_of_affirmation: 'Words of Affirmation', quality_time: 'Quality Time', receiving_gifts: 'Receiving Gifts', acts_of_service: 'Acts of Service', physical_touch: 'Physical Touch' },
    placeholders: { bio: 'A short description other members may see…', location: 'City or region', partnerName: 'Optional' },
    tools: 'Your One2OneLove tools', actions: { loveNotes: 'Love Notes', community: 'Live Community', dateIdeas: 'Date Ideas', quiz: 'Love Language Quiz', chat: 'Private Chat', goals: 'Relationship Goals' },
  },
  es: {
    title: 'Mi Perfil', subtitle: 'Elige qué ayuda a personalizar tu experiencia. El descubrimiento de miembros del relanzamiento es intencionalmente mínimo.', edit: 'Editar Perfil', save: 'Guardar Cambios', saving: 'Guardando…', cancel: 'Cancelar', signInTitle: 'Inicia sesión para ver tu perfil', signInDesc: 'Los datos de la cuenta solo están disponibles después de iniciar sesión.', signIn: 'Iniciar Sesión', createFree: 'Crear Cuenta Gratis', account: 'Cuenta', memberSince: 'Miembro desde', email: 'Correo de la cuenta', personal: 'Datos del Miembro', relationship: 'Datos de Relación', name: 'Nombre', bio: 'Biografía corta', location: 'Ubicación general', status: 'Estado de relación', anniversary: 'Aniversario', partnerName: 'Nombre de pareja', loveLanguage: 'Lenguaje del Amor', notSet: 'No establecido', publicTitle: 'Lo que otros miembros pueden descubrir', publicNote: 'El directorio del relanzamiento solo puede mostrar tu nombre visible, imagen de perfil opcional, biografía corta y fecha de incorporación.', privateTitle: 'Datos privados de la cuenta', privateNote: 'Tu correo, ubicación, estado de relación, aniversario, información de pareja y Lenguaje del Amor permanecen privados y no forman parte del descubrimiento de miembros. El correo de la pareja no se recopila porque todavía no existe un flujo revisado de vinculación de parejas que lo necesite.', saved: 'Perfil actualizado.', failed: 'No se pudo guardar el perfil ahora.', regularOnly: 'La edición está disponible actualmente solo para miembros regulares.', statuses: { single: 'Soltero/a', dating: 'Saliendo', engaged: 'Comprometido/a', married: 'Casado/a', complicated: 'Es complicado' }, loveLanguages: { words_of_affirmation: 'Palabras de Afirmación', quality_time: 'Tiempo de Calidad', receiving_gifts: 'Recibir Regalos', acts_of_service: 'Actos de Servicio', physical_touch: 'Contacto Físico' }, placeholders: { bio: 'Una breve descripción que otros miembros pueden ver…', location: 'Ciudad o región', partnerName: 'Opcional' }, tools: 'Tus herramientas One2OneLove', actions: { loveNotes: 'Love Notes', community: 'Comunidad en Vivo', dateIdeas: 'Ideas para Citas', quiz: 'Quiz de Lenguaje del Amor', chat: 'Chat Privado', goals: 'Metas de Relación' },
  },
  fr: {
    title: 'Mon Profil', subtitle: 'Choisissez ce qui personnalise votre expérience. La découverte des membres est volontairement minimale pour la relance.', edit: 'Modifier le Profil', save: 'Enregistrer', saving: 'Enregistrement…', cancel: 'Annuler', signInTitle: 'Connectez-vous pour voir votre profil', signInDesc: 'Les informations du compte sont disponibles uniquement après connexion.', signIn: 'Se Connecter', createFree: 'Créer un Compte Gratuit', account: 'Compte', memberSince: 'Membre depuis', email: 'E-mail du compte', personal: 'Informations du Membre', relationship: 'Informations de Relation', name: 'Nom', bio: 'Courte biographie', location: 'Localisation générale', status: 'Statut de relation', anniversary: 'Anniversaire', partnerName: 'Nom du partenaire', loveLanguage: "Langage d'Amour", notSet: 'Non défini', publicTitle: 'Ce que les autres membres peuvent découvrir', publicNote: 'L’annuaire de relance peut afficher uniquement votre nom affiché, image de profil facultative, courte bio et date d’adhésion.', privateTitle: 'Informations privées du compte', privateNote: 'Votre e-mail, localisation, statut relationnel, anniversaire, informations du partenaire et Langage d’Amour restent privés et ne font pas partie de la découverte des membres. L’e-mail du partenaire n’est pas collecté tant qu’un flux de liaison examiné n’en a pas besoin.', saved: 'Profil mis à jour.', failed: "Impossible d'enregistrer votre profil pour le moment.", regularOnly: 'La modification est actuellement réservée aux membres réguliers.', statuses: { single: 'Célibataire', dating: 'En couple', engaged: 'Fiancé(e)', married: 'Marié(e)', complicated: 'Compliqué' }, loveLanguages: { words_of_affirmation: "Paroles d'Affirmation", quality_time: 'Temps de Qualité', receiving_gifts: 'Recevoir des Cadeaux', acts_of_service: 'Services Rendus', physical_touch: 'Toucher Physique' }, placeholders: { bio: 'Une courte description visible par les autres membres…', location: 'Ville ou région', partnerName: 'Optionnel' }, tools: 'Vos outils One2OneLove', actions: { loveNotes: 'Love Notes', community: 'Communauté en Direct', dateIdeas: 'Idées de Rendez-vous', quiz: "Quiz des Langages d'Amour", chat: 'Chat Privé', goals: 'Objectifs de Relation' },
  },
  it: {
    title: 'Il Mio Profilo', subtitle: 'Scegli cosa personalizza la tua esperienza. La scoperta membri del rilancio è volutamente minima.', edit: 'Modifica Profilo', save: 'Salva Modifiche', saving: 'Salvataggio…', cancel: 'Annulla', signInTitle: 'Accedi per vedere il tuo profilo', signInDesc: 'I dati dell’account sono disponibili solo dopo l’accesso.', signIn: 'Accedi', createFree: 'Crea Account Gratuito', account: 'Account', memberSince: 'Membro dal', email: 'Email account', personal: 'Dati del Membro', relationship: 'Dati della Relazione', name: 'Nome', bio: 'Breve bio', location: 'Posizione generale', status: 'Stato della relazione', anniversary: 'Anniversario', partnerName: 'Nome del partner', loveLanguage: "Linguaggio dell'Amore", notSet: 'Non impostato', publicTitle: 'Cosa possono scoprire gli altri membri', publicNote: 'La directory del rilancio può mostrare solo nome visibile, immagine profilo opzionale, breve bio e data di iscrizione.', privateTitle: 'Dati privati dell’account', privateNote: 'Email account, posizione, stato della relazione, anniversario, dati del partner e Linguaggio dell’Amore restano privati e non fanno parte della scoperta membri. L’email del partner non viene raccolta finché un flusso revisionato non ne avrà bisogno.', saved: 'Profilo aggiornato.', failed: 'Impossibile salvare il profilo.', regularOnly: 'La modifica è disponibile solo per membri regolari.', statuses: { single: 'Single', dating: 'In coppia', engaged: 'Fidanzato/a', married: 'Sposato/a', complicated: 'Complicato' }, loveLanguages: { words_of_affirmation: 'Parole di Affermazione', quality_time: 'Tempo di Qualità', receiving_gifts: 'Ricevere Regali', acts_of_service: 'Atti di Servizio', physical_touch: 'Contatto Fisico' }, placeholders: { bio: 'Una breve descrizione visibile agli altri membri…', location: 'Città o regione', partnerName: 'Opzionale' }, tools: 'I tuoi strumenti One2OneLove', actions: { loveNotes: 'Love Notes', community: 'Community Live', dateIdeas: 'Idee per Appuntamenti', quiz: "Quiz del Linguaggio dell'Amore", chat: 'Chat Privata', goals: 'Obiettivi di Relazione' },
  },
  de: {
    title: 'Mein Profil', subtitle: 'Wähle, was deine Erfahrung personalisiert. Die Mitgliedersuche ist beim Relaunch bewusst minimal.', edit: 'Profil Bearbeiten', save: 'Änderungen Speichern', saving: 'Speichern…', cancel: 'Abbrechen', signInTitle: 'Melde dich an, um dein Profil zu sehen', signInDesc: 'Kontodaten sind nur nach der Anmeldung verfügbar.', signIn: 'Anmelden', createFree: 'Kostenloses Konto Erstellen', account: 'Konto', memberSince: 'Mitglied seit', email: 'Konto-E-Mail', personal: 'Mitgliederdaten', relationship: 'Beziehungsdaten', name: 'Name', bio: 'Kurze Bio', location: 'Allgemeiner Ort', status: 'Beziehungsstatus', anniversary: 'Jahrestag', partnerName: 'Name des Partners', loveLanguage: 'Liebessprache', notSet: 'Nicht festgelegt', publicTitle: 'Was andere Mitglieder entdecken können', publicNote: 'Das Relaunch-Verzeichnis kann nur Anzeigename, optionales Profilbild, kurze Bio und Beitrittsdatum zeigen.', privateTitle: 'Private Kontodaten', privateNote: 'Konto-E-Mail, Ort, Beziehungsstatus, Jahrestag, Partnerdaten und Liebessprache bleiben privat und sind nicht Teil der Mitgliedersuche. Eine Partner-E-Mail wird nicht erfasst, solange kein geprüfter Verknüpfungsprozess sie benötigt.', saved: 'Profil aktualisiert.', failed: 'Profil kann derzeit nicht gespeichert werden.', regularOnly: 'Die Bearbeitung ist derzeit regulären Mitgliedern vorbehalten.', statuses: { single: 'Single', dating: 'In einer Beziehung', engaged: 'Verlobt', married: 'Verheiratet', complicated: 'Kompliziert' }, loveLanguages: { words_of_affirmation: 'Worte der Anerkennung', quality_time: 'Zweisamkeit', receiving_gifts: 'Geschenke', acts_of_service: 'Hilfsbereitschaft', physical_touch: 'Körperliche Nähe' }, placeholders: { bio: 'Eine kurze Beschreibung, die andere Mitglieder sehen können…', location: 'Stadt oder Region', partnerName: 'Optional' }, tools: 'Deine One2OneLove-Werkzeuge', actions: { loveNotes: 'Love Notes', community: 'Live-Community', dateIdeas: 'Date-Ideen', quiz: 'Liebessprachen-Quiz', chat: 'Privater Chat', goals: 'Beziehungsziele' },
  },
  nl: {
    title: 'Mijn Profiel', subtitle: 'Kies wat je ervaring personaliseert. Leden ontdekken is bij de herlancering bewust minimaal.', edit: 'Profiel Bewerken', save: 'Wijzigingen Opslaan', saving: 'Opslaan…', cancel: 'Annuleren', signInTitle: 'Log in om je profiel te bekijken', signInDesc: 'Accountgegevens zijn alleen beschikbaar na inloggen.', signIn: 'Inloggen', createFree: 'Gratis Account Maken', account: 'Account', memberSince: 'Lid sinds', email: 'Account-e-mail', personal: 'Lidgegevens', relationship: 'Relatiegegevens', name: 'Naam', bio: 'Korte bio', location: 'Algemene locatie', status: 'Relatiestatus', anniversary: 'Jubileum', partnerName: 'Naam partner', loveLanguage: 'Liefdestaal', notSet: 'Niet ingesteld', publicTitle: 'Wat andere leden kunnen ontdekken', publicNote: 'De herlanceringsdirectory kan alleen je weergavenaam, optionele profielfoto, korte bio en lid-sindsdatum tonen.', privateTitle: 'Privé-accountgegevens', privateNote: 'Account-e-mail, locatie, relatiestatus, jubileum, partnergegevens en Liefdestaal blijven privé en maken geen deel uit van leden ontdekken. Partner-e-mail wordt niet verzameld zolang een beoordeelde koppeling die niet nodig heeft.', saved: 'Profiel bijgewerkt.', failed: 'Je profiel kan nu niet worden opgeslagen.', regularOnly: 'Profielbewerking is momenteel alleen beschikbaar voor gewone leden.', statuses: { single: 'Single', dating: 'Aan het daten', engaged: 'Verloofd', married: 'Getrouwd', complicated: 'Ingewikkeld' }, loveLanguages: { words_of_affirmation: 'Woorden van Bevestiging', quality_time: 'Kwaliteitstijd', receiving_gifts: 'Cadeaus Ontvangen', acts_of_service: 'Dienstbaarheid', physical_touch: 'Lichamelijke Aanraking' }, placeholders: { bio: 'Een korte beschrijving die andere leden kunnen zien…', location: 'Stad of regio', partnerName: 'Optioneel' }, tools: 'Jouw One2OneLove-tools', actions: { loveNotes: 'Love Notes', community: 'Live Community', dateIdeas: 'Date-ideeën', quiz: 'Liefdestaalquiz', chat: 'Privéchat', goals: 'Relatiedoelen' },
  },
  pt: {
    title: 'Meu Perfil', subtitle: 'Escolha o que personaliza sua experiência. A descoberta de membros do relançamento é intencionalmente mínima.', edit: 'Editar Perfil', save: 'Salvar Alterações', saving: 'Salvando…', cancel: 'Cancelar', signInTitle: 'Entre para ver seu perfil', signInDesc: 'Os dados da conta ficam disponíveis somente após entrar.', signIn: 'Entrar', createFree: 'Criar Conta Grátis', account: 'Conta', memberSince: 'Membro desde', email: 'E-mail da conta', personal: 'Dados do Membro', relationship: 'Dados do Relacionamento', name: 'Nome', bio: 'Bio curta', location: 'Localização geral', status: 'Status do relacionamento', anniversary: 'Aniversário', partnerName: 'Nome do parceiro', loveLanguage: 'Linguagem do Amor', notSet: 'Não definido', publicTitle: 'O que outros membros podem descobrir', publicNote: 'O diretório do relançamento pode mostrar apenas seu nome de exibição, imagem de perfil opcional, bio curta e data de entrada.', privateTitle: 'Dados privados da conta', privateNote: 'E-mail da conta, localização, status do relacionamento, aniversário, dados do parceiro e Linguagem do Amor permanecem privados e não fazem parte da descoberta de membros. O e-mail do parceiro não é coletado enquanto um fluxo revisado não precisar dele.', saved: 'Perfil atualizado.', failed: 'Não foi possível salvar seu perfil agora.', regularOnly: 'A edição está disponível atualmente apenas para membros regulares.', statuses: { single: 'Solteiro(a)', dating: 'Namorando', engaged: 'Noivo(a)', married: 'Casado(a)', complicated: 'Complicado' }, loveLanguages: { words_of_affirmation: 'Palavras de Afirmação', quality_time: 'Tempo de Qualidade', receiving_gifts: 'Receber Presentes', acts_of_service: 'Atos de Serviço', physical_touch: 'Toque Físico' }, placeholders: { bio: 'Uma breve descrição que outros membros podem ver…', location: 'Cidade ou região', partnerName: 'Opcional' }, tools: 'Suas ferramentas One2OneLove', actions: { loveNotes: 'Love Notes', community: 'Comunidade ao Vivo', dateIdeas: 'Ideias de Encontro', quiz: 'Quiz de Linguagem do Amor', chat: 'Chat Privado', goals: 'Metas de Relacionamento' },
  },
};

// Small relaunch additions are kept separate so the existing professionally translated
// profile copy stays untouched while new UI receives the same language treatment.
const PROFILE_I18N_EXTRAS = {
  en: { locale: 'en-US', profileSetup: 'Profile setup', memberFallback: 'Member', actions: { loveNotes: 'Love Notes' } },
  es: { locale: 'es-ES', profileSetup: 'Configuración del perfil', memberFallback: 'Miembro', actions: { loveNotes: 'Notas de Amor' } },
  fr: { locale: 'fr-FR', profileSetup: 'Configuration du profil', memberFallback: 'Membre', actions: { loveNotes: 'Mots d’Amour' } },
  it: { locale: 'it-IT', profileSetup: 'Configurazione del profilo', memberFallback: 'Membro', actions: { loveNotes: 'Note d’Amore' } },
  de: { locale: 'de-DE', profileSetup: 'Profileinrichtung', memberFallback: 'Mitglied', actions: { loveNotes: 'Liebesnotizen' } },
  nl: { locale: 'nl-NL', profileSetup: 'Profielinstelling', memberFallback: 'Lid', actions: { loveNotes: 'Liefdesbriefjes' } },
  pt: { locale: 'pt-BR', profileSetup: 'Configuração do perfil', memberFallback: 'Membro', actions: { loveNotes: 'Notas de Amor' } },
};

const TOOL_LINKS = [
  { key: 'loveNotes', path: '/LoveNotes', icon: Heart },
  { key: 'community', path: '/Community', icon: MessageCircle },
  { key: 'dateIdeas', path: '/DateIdeas', icon: CalendarDays },
  { key: 'quiz', path: '/LoveLanguageQuiz', icon: Heart },
  { key: 'chat', path: '/Chat', icon: MessageCircle },
  { key: 'goals', path: '/RelationshipGoals', icon: Target },
];

const optionalText = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || null;
};

const formFromUser = (user) => ({
  name: user?.name || '',
  bio: user?.bio || '',
  location: user?.location || '',
  relationship_status: user?.relationship_status || '',
  anniversary_date: user?.anniversary_date || '',
  partner_name: user?.partner_name || '',
  love_language: user?.love_language || '',
});

const display = (value, fallback) => value || fallback;
const formatDate = (value, fallback, locale) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ProfileRelaunchSafe() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const baseCopy = COPY[language];
  const extras = PROFILE_I18N_EXTRAS[language] || PROFILE_I18N_EXTRAS.en;
  const t = { ...baseCopy, ...extras, actions: { ...baseCopy.actions, ...extras.actions } };
  const { user, isAuthenticated, isLoading, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => formFromUser(user));

  useEffect(() => {
    if (!editing) setForm(formFromUser(user));
  }, [user, editing]);

  const setupPercent = useMemo(() => {
    if (!user) return 0;
    const fields = [user.name, user.bio, user.location, user.relationship_status, user.love_language];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  if (isLoading) {
    return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-16">
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="p-8">
            <LockKeyhole className="mx-auto h-12 w-12 text-purple-500" />
            <h1 className="mt-4 text-2xl font-black text-gray-900">{t.signInTitle}</h1>
            <p className="mt-2 text-gray-600">{t.signInDesc}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => navigate('/SignIn?returnTo=%2FProfile')}>{t.signIn}</Button>
              <Button variant="outline" onClick={() => navigate('/SignUp?returnTo=%2FProfile')}>{t.createFree}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canEdit = !user.user_type || user.user_type === 'regular';
  const initials = String(user.name || t.memberFallback).trim().slice(0, 1).toUpperCase() || t.memberFallback.slice(0, 1).toUpperCase();

  const save = async () => {
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        name: optionalText(form.name),
        bio: optionalText(form.bio),
        location: optionalText(form.location),
        relationship_status: optionalText(form.relationship_status),
        anniversary_date: optionalText(form.anniversary_date),
        partner_name: optionalText(form.partner_name),
        love_language: optionalText(form.love_language),
      });
      await refreshUserProfile();
      setEditing(false);
      toast.success(t.saved);
    } catch (error) {
      console.error('Profile save failed:', error);
      toast.error(error?.message || t.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-pink-100">
              {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.name || t.memberFallback} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-2xl font-black text-white">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-pink-700">{t.account}</p>
              <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">{t.title}</h1>
              <p className="mt-1 max-w-2xl text-gray-600">{t.subtitle}</p>
            </div>
          </div>
          {canEdit ? (
            editing ? (
              <div className="flex gap-2">
                <Button variant="outline" disabled={saving} onClick={() => { setEditing(false); setForm(formFromUser(user)); }}><X className="mr-2 h-4 w-4" />{t.cancel}</Button>
                <Button disabled={saving} onClick={() => void save()} className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? t.saving : t.save}</Button>
              </div>
            ) : <Button onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />{t.edit}</Button>
          ) : <p className="max-w-sm rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{t.regularOnly}</p>}
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t.account}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field icon={Mail} label={t.email} value={display(user.email, t.notSet)} />
                <Field icon={CalendarDays} label={t.memberSince} value={formatDate(user.created_at, t.notSet, t.locale)} />
                <div className="rounded-2xl bg-purple-50 p-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-bold text-purple-900">{t.profileSetup}</span><span className="text-sm font-black text-purple-700">{setupPercent}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-100"><div className="h-full rounded-full bg-purple-600" style={{ width: `${setupPercent}%` }} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-700" />{t.publicTitle}</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-6 text-blue-950">{t.publicNote}</p></CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/60">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-slate-700" />{t.privateTitle}</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-6 text-slate-700">{t.privateNote}</p></CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t.personal}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {editing ? (
                  <>
                    <EditField label={t.name}><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={120} /></EditField>
                    <EditField label={t.bio}><Textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder={t.placeholders.bio} maxLength={500} /></EditField>
                    <EditField label={t.location}><Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder={t.placeholders.location} maxLength={120} /></EditField>
                    <EditField label={t.status}><Select value={form.relationship_status || undefined} onValueChange={(value) => setForm((current) => ({ ...current, relationship_status: value }))}><SelectTrigger><SelectValue placeholder={t.notSet} /></SelectTrigger><SelectContent>{Object.entries(t.statuses).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></EditField>
                  </>
                ) : (
                  <>
                    <Field icon={UserRound} label={t.name} value={display(user.name, t.notSet)} />
                    <Field icon={Heart} label={t.bio} value={display(user.bio, t.notSet)} />
                    <Field icon={MapPin} label={t.location} value={display(user.location, t.notSet)} />
                    <Field icon={Users} label={t.status} value={t.statuses[user.relationship_status] || display(user.relationship_status, t.notSet)} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t.relationship}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {editing ? (
                  <>
                    <EditField label={t.anniversary}><Input type="date" value={form.anniversary_date || ''} onChange={(event) => setForm((current) => ({ ...current, anniversary_date: event.target.value }))} /></EditField>
                    <EditField label={t.partnerName}><Input value={form.partner_name} onChange={(event) => setForm((current) => ({ ...current, partner_name: event.target.value }))} placeholder={t.placeholders.partnerName} maxLength={120} /></EditField>
                    <EditField label={t.loveLanguage}><Select value={form.love_language || undefined} onValueChange={(value) => setForm((current) => ({ ...current, love_language: value }))}><SelectTrigger><SelectValue placeholder={t.notSet} /></SelectTrigger><SelectContent>{Object.entries(t.loveLanguages).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></EditField>
                  </>
                ) : (
                  <>
                    <Field icon={CalendarDays} label={t.anniversary} value={formatDate(user.anniversary_date, t.notSet, t.locale)} />
                    <Field icon={UserRound} label={t.partnerName} value={display(user.partner_name, t.notSet)} />
                    <Field icon={Heart} label={t.loveLanguage} value={t.loveLanguages[user.love_language] || display(user.love_language, t.notSet)} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-7">
          <CardHeader><CardTitle>{t.tools}</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_LINKS.map(({ key, path, icon: Icon }) => <Link key={key} to={path} className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 font-semibold text-gray-800 transition hover:border-pink-200 hover:bg-pink-50"><Icon className="h-5 w-5 text-pink-600" />{t.actions[key]}</Link>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return <div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gray-100 text-gray-600"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-sm font-medium text-gray-500">{label}</p><p className="mt-0.5 break-words text-gray-900">{value}</p></div></div>;
}

function EditField({ label, children }) {
  return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
