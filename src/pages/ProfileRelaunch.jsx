import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Heart, LockKeyhole, Mail, MapPin, MessageCircle, Pencil, Save, Target, UserRound, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
    title: 'My Profile', subtitle: 'Keep the details One2OneLove uses to personalize your experience.', edit: 'Edit Profile', save: 'Save Changes', saving: 'Saving…', cancel: 'Cancel', signInTitle: 'Sign in to view your profile', signInDesc: 'Your profile is private account information.', signIn: 'Sign In', createFree: 'Create Free Account', account: 'Account', memberSince: 'Member since', email: 'Email', profileSetup: 'Profile setup', personal: 'Personal Details', relationship: 'Relationship Details', name: 'Name', bio: 'Bio', location: 'Location', status: 'Relationship status', anniversary: 'Anniversary', partnerName: 'Partner name', partnerEmail: "Partner's email", loveLanguage: 'Love Language', notSet: 'Not set', partnerNote: 'Partner information is stored only as part of your profile. It does not automatically link two One2OneLove accounts.', tools: 'Your One2OneLove tools', privateNote: 'Your profile is private. Public member discovery uses a separate privacy-safe directory rather than exposing this full record.', saved: 'Profile updated.', failed: 'Unable to save your profile right now.', regularOnly: 'Profile editing is currently available for regular member accounts only.', actions: { loveNotes: 'Love Notes', community: 'Live Community', dateIdeas: 'Date Ideas', quiz: 'Love Language Quiz', chat: 'Private Chat', goals: 'Relationship Goals' }, statuses: { single: 'Single', dating: 'Dating', engaged: 'Engaged', married: 'Married', complicated: 'Complicated' }, loveLanguages: { words_of_affirmation: 'Words of Affirmation', quality_time: 'Quality Time', receiving_gifts: 'Receiving Gifts', acts_of_service: 'Acts of Service', physical_touch: 'Physical Touch' }, placeholders: { bio: 'A short description about you…', location: 'City or region', partnerName: 'Optional', partnerEmail: 'Optional' },
  },
  es: {
    title: 'Mi Perfil', subtitle: 'Mantén los datos que One2OneLove usa para personalizar tu experiencia.', edit: 'Editar Perfil', save: 'Guardar Cambios', saving: 'Guardando…', cancel: 'Cancelar', signInTitle: 'Inicia sesión para ver tu perfil', signInDesc: 'Tu perfil es información privada de tu cuenta.', signIn: 'Iniciar Sesión', createFree: 'Crear Cuenta Gratis', account: 'Cuenta', memberSince: 'Miembro desde', email: 'Correo', profileSetup: 'Configuración del perfil', personal: 'Datos Personales', relationship: 'Datos de Relación', name: 'Nombre', bio: 'Biografía', location: 'Ubicación', status: 'Estado de relación', anniversary: 'Aniversario', partnerName: 'Nombre de pareja', partnerEmail: 'Correo de pareja', loveLanguage: 'Lenguaje del Amor', notSet: 'No establecido', partnerNote: 'La información de tu pareja se guarda solo como parte de tu perfil. No conecta automáticamente dos cuentas de One2OneLove.', tools: 'Tus herramientas de One2OneLove', privateNote: 'Tu perfil es privado. El descubrimiento de miembros usa un directorio separado y seguro para la privacidad.', saved: 'Perfil actualizado.', failed: 'No se pudo guardar tu perfil ahora.', regularOnly: 'La edición de perfil está disponible actualmente solo para cuentas de miembros regulares.', actions: { loveNotes: 'Notas de Amor', community: 'Comunidad en Vivo', dateIdeas: 'Ideas para Citas', quiz: 'Quiz de Lenguaje del Amor', chat: 'Chat Privado', goals: 'Metas de Relación' }, statuses: { single: 'Soltero/a', dating: 'Saliendo', engaged: 'Comprometido/a', married: 'Casado/a', complicated: 'Es complicado' }, loveLanguages: { words_of_affirmation: 'Palabras de Afirmación', quality_time: 'Tiempo de Calidad', receiving_gifts: 'Recibir Regalos', acts_of_service: 'Actos de Servicio', physical_touch: 'Contacto Físico' }, placeholders: { bio: 'Una breve descripción sobre ti…', location: 'Ciudad o región', partnerName: 'Opcional', partnerEmail: 'Opcional' },
  },
  fr: {
    title: 'Mon Profil', subtitle: 'Gardez à jour les informations que One2OneLove utilise pour personnaliser votre expérience.', edit: 'Modifier le Profil', save: 'Enregistrer', saving: 'Enregistrement…', cancel: 'Annuler', signInTitle: 'Connectez-vous pour voir votre profil', signInDesc: 'Votre profil contient des informations privées du compte.', signIn: 'Se Connecter', createFree: 'Créer un Compte Gratuit', account: 'Compte', memberSince: 'Membre depuis', email: 'E-mail', profileSetup: 'Configuration du profil', personal: 'Informations Personnelles', relationship: 'Informations de Relation', name: 'Nom', bio: 'Biographie', location: 'Localisation', status: 'Statut de relation', anniversary: 'Anniversaire', partnerName: 'Nom du partenaire', partnerEmail: 'E-mail du partenaire', loveLanguage: "Langage d'Amour", notSet: 'Non défini', partnerNote: "Les informations du partenaire sont enregistrées uniquement dans votre profil. Elles ne relient pas automatiquement deux comptes One2OneLove.", tools: 'Vos outils One2OneLove', privateNote: "Votre profil est privé. La découverte des membres utilise un annuaire séparé respectueux de la vie privée.", saved: 'Profil mis à jour.', failed: "Impossible d'enregistrer votre profil pour le moment.", regularOnly: 'La modification du profil est actuellement disponible uniquement pour les comptes de membres réguliers.', actions: { loveNotes: "Notes d'Amour", community: 'Communauté en Direct', dateIdeas: 'Idées de Rendez-vous', quiz: "Quiz des Langages d'Amour", chat: 'Chat Privé', goals: 'Objectifs de Relation' }, statuses: { single: 'Célibataire', dating: 'En couple', engaged: 'Fiancé(e)', married: 'Marié(e)', complicated: 'Compliqué' }, loveLanguages: { words_of_affirmation: "Paroles d'Affirmation", quality_time: 'Temps de Qualité', receiving_gifts: 'Recevoir des Cadeaux', acts_of_service: 'Services Rendus', physical_touch: 'Toucher Physique' }, placeholders: { bio: 'Une courte description de vous…', location: 'Ville ou région', partnerName: 'Optionnel', partnerEmail: 'Optionnel' },
  },
  it: {
    title: 'Il Mio Profilo', subtitle: 'Mantieni aggiornati i dati che One2OneLove usa per personalizzare la tua esperienza.', edit: 'Modifica Profilo', save: 'Salva Modifiche', saving: 'Salvataggio…', cancel: 'Annulla', signInTitle: 'Accedi per vedere il tuo profilo', signInDesc: 'Il tuo profilo contiene informazioni private del tuo account.', signIn: 'Accedi', createFree: 'Crea Account Gratuito', account: 'Account', memberSince: 'Membro dal', email: 'Email', profileSetup: 'Configurazione profilo', personal: 'Dati Personali', relationship: 'Dati della Relazione', name: 'Nome', bio: 'Biografia', location: 'Posizione', status: 'Stato della relazione', anniversary: 'Anniversario', partnerName: 'Nome del partner', partnerEmail: 'Email del partner', loveLanguage: "Linguaggio dell'Amore", notSet: 'Non impostato', partnerNote: 'Le informazioni del partner vengono salvate solo nel tuo profilo. Non collegano automaticamente due account One2OneLove.', tools: 'I tuoi strumenti One2OneLove', privateNote: 'Il tuo profilo è privato. La scoperta dei membri usa una directory separata e sicura per la privacy.', saved: 'Profilo aggiornato.', failed: 'Impossibile salvare il profilo in questo momento.', regularOnly: 'La modifica del profilo è attualmente disponibile solo per gli account dei membri regolari.', actions: { loveNotes: "Note d'Amore", community: 'Comunità Live', dateIdeas: 'Idee per Appuntamenti', quiz: "Quiz del Linguaggio dell'Amore", chat: 'Chat Privata', goals: 'Obiettivi di Relazione' }, statuses: { single: 'Single', dating: 'In coppia', engaged: 'Fidanzato/a', married: 'Sposato/a', complicated: 'Complicato' }, loveLanguages: { words_of_affirmation: 'Parole di Affermazione', quality_time: 'Tempo di Qualità', receiving_gifts: 'Ricevere Regali', acts_of_service: 'Atti di Servizio', physical_touch: 'Contatto Fisico' }, placeholders: { bio: 'Una breve descrizione di te…', location: 'Città o regione', partnerName: 'Opzionale', partnerEmail: 'Opzionale' },
  },
  de: {
    title: 'Mein Profil', subtitle: 'Halten Sie die Angaben aktuell, mit denen One2OneLove Ihre Erfahrung personalisiert.', edit: 'Profil Bearbeiten', save: 'Änderungen Speichern', saving: 'Speichern…', cancel: 'Abbrechen', signInTitle: 'Melden Sie sich an, um Ihr Profil zu sehen', signInDesc: 'Ihr Profil enthält private Kontoinformationen.', signIn: 'Anmelden', createFree: 'Kostenloses Konto Erstellen', account: 'Konto', memberSince: 'Mitglied seit', email: 'E-Mail', profileSetup: 'Profileinrichtung', personal: 'Persönliche Angaben', relationship: 'Beziehungsangaben', name: 'Name', bio: 'Biografie', location: 'Ort', status: 'Beziehungsstatus', anniversary: 'Jahrestag', partnerName: 'Name des Partners', partnerEmail: 'E-Mail des Partners', loveLanguage: 'Liebessprache', notSet: 'Nicht festgelegt', partnerNote: 'Partnerinformationen werden nur als Teil Ihres Profils gespeichert. Sie verknüpfen nicht automatisch zwei One2OneLove-Konten.', tools: 'Ihre One2OneLove-Werkzeuge', privateNote: 'Ihr Profil ist privat. Die Mitgliedersuche verwendet ein separates datenschutzsicheres Verzeichnis.', saved: 'Profil aktualisiert.', failed: 'Profil kann derzeit nicht gespeichert werden.', regularOnly: 'Die Profilbearbeitung ist derzeit nur für reguläre Mitgliedskonten verfügbar.', actions: { loveNotes: 'Love Notes', community: 'Live-Community', dateIdeas: 'Date-Ideen', quiz: 'Liebessprachen-Quiz', chat: 'Privater Chat', goals: 'Beziehungsziele' }, statuses: { single: 'Single', dating: 'In einer Beziehung', engaged: 'Verlobt', married: 'Verheiratet', complicated: 'Kompliziert' }, loveLanguages: { words_of_affirmation: 'Worte der Anerkennung', quality_time: 'Zweisamkeit', receiving_gifts: 'Geschenke', acts_of_service: 'Hilfsbereitschaft', physical_touch: 'Körperliche Nähe' }, placeholders: { bio: 'Eine kurze Beschreibung über Sie…', location: 'Stadt oder Region', partnerName: 'Optional', partnerEmail: 'Optional' },
  },
  nl: {
    title: 'Mijn Profiel', subtitle: 'Houd de gegevens bij die One2OneLove gebruikt om je ervaring te personaliseren.', edit: 'Profiel Bewerken', save: 'Wijzigingen Opslaan', saving: 'Opslaan…', cancel: 'Annuleren', signInTitle: 'Log in om je profiel te bekijken', signInDesc: 'Je profiel bevat privé-accountinformatie.', signIn: 'Inloggen', createFree: 'Gratis Account Maken', account: 'Account', memberSince: 'Lid sinds', email: 'E-mail', profileSetup: 'Profielinstelling', personal: 'Persoonlijke Gegevens', relationship: 'Relatiegegevens', name: 'Naam', bio: 'Biografie', location: 'Locatie', status: 'Relatiestatus', anniversary: 'Jubileum', partnerName: 'Naam partner', partnerEmail: 'E-mail partner', loveLanguage: 'Liefdestaal', notSet: 'Niet ingesteld', partnerNote: 'Partnergegevens worden alleen als onderdeel van je profiel opgeslagen. Ze koppelen niet automatisch twee One2OneLove-accounts.', tools: 'Jouw One2OneLove-tools', privateNote: 'Je profiel is privé. Leden ontdekken gebeurt via een aparte privacyveilige directory.', saved: 'Profiel bijgewerkt.', failed: 'Je profiel kan nu niet worden opgeslagen.', regularOnly: 'Profielbewerking is momenteel alleen beschikbaar voor gewone ledenaccounts.', actions: { loveNotes: 'Love Notes', community: 'Live Community', dateIdeas: 'Date-ideeën', quiz: 'Liefdestaalquiz', chat: 'Privéchat', goals: 'Relatiedoelen' }, statuses: { single: 'Single', dating: 'Aan het daten', engaged: 'Verloofd', married: 'Getrouwd', complicated: 'Ingewikkeld' }, loveLanguages: { words_of_affirmation: 'Woorden van Bevestiging', quality_time: 'Kwaliteitstijd', receiving_gifts: 'Cadeaus Ontvangen', acts_of_service: 'Dienstbaarheid', physical_touch: 'Lichamelijke Aanraking' }, placeholders: { bio: 'Een korte beschrijving over jezelf…', location: 'Stad of regio', partnerName: 'Optioneel', partnerEmail: 'Optioneel' },
  },
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
  partner_email: user?.partner_email || '',
  love_language: user?.love_language || '',
});

const formatDate = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ProfileRelaunch() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
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
    const completed = fields.filter((value) => String(value || '').trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [user]);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-16">
        <Card className="mx-auto max-w-xl border-pink-100 shadow-xl">
          <CardContent className="p-8 text-center">
            <UserRound className="mx-auto mb-4 h-14 w-14 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">{t.signInTitle}</h1>
            <p className="mt-2 text-gray-600">{t.signInDesc}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/SignIn?returnTo=/Profile')}>{t.signIn}</Button>
              <Button variant="outline" onClick={() => navigate('/SignUp?returnTo=/Profile')}>{t.createFree}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegular = !user.user_type || user.user_type === 'regular';

  const handleSave = async () => {
    if (!isRegular || saving) return;
    const name = String(form.name || '').trim();
    if (!name) {
      toast.error(`${t.name} is required.`);
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        name: name.slice(0, 120),
        bio: optionalText(form.bio),
        location: optionalText(form.location),
        relationship_status: optionalText(form.relationship_status),
        anniversary_date: optionalText(form.anniversary_date),
        partner_name: optionalText(form.partner_name),
        partner_email: optionalText(form.partner_email),
        love_language: optionalText(form.love_language),
      });
      await refreshUserProfile();
      setEditing(false);
      toast.success(t.saved);
    } catch (error) {
      console.error('Profile relaunch save failed:', error);
      toast.error(t.failed);
    } finally {
      setSaving(false);
    }
  };

  const display = (value) => String(value || '').trim() || t.notSet;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 p-7 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold ring-1 ring-white/30">
                {(user.name || user.email || 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">{t.title}</p>
                <h1 className="mt-1 text-3xl font-bold">{user.name || 'Member'}</h1>
                <p className="mt-1 text-white/80">{t.memberSince} {formatDate(user.created_at, '—')}</p>
              </div>
            </div>
            {isRegular ? (
              editing ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { setEditing(false); setForm(formFromUser(user)); }} disabled={saving}><X className="mr-2 h-4 w-4" />{t.cancel}</Button>
                  <Button className="bg-white text-purple-700 hover:bg-white/90" onClick={handleSave} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? t.saving : t.save}</Button>
                </div>
              ) : (
                <Button className="bg-white text-purple-700 hover:bg-white/90" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />{t.edit}</Button>
              )
            ) : null}
          </div>
        </section>

        {!isRegular && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5 text-sm text-amber-900">{t.regularOnly}</CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>{t.personal}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <Field icon={Mail} label={t.email} value={user.email || '—'} />
                {editing ? (
                  <>
                    <EditField label={t.name}><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={120} /></EditField>
                    <EditField label={t.location}><Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder={t.placeholders.location} maxLength={160} /></EditField>
                    <EditField label={t.bio}><Textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder={t.placeholders.bio} maxLength={1000} /></EditField>
                  </>
                ) : (
                  <>
                    <Field icon={UserRound} label={t.name} value={display(user.name)} />
                    <Field icon={MapPin} label={t.location} value={display(user.location)} />
                    <div><p className="text-sm font-medium text-gray-500">{t.bio}</p><p className="mt-1 whitespace-pre-wrap text-gray-800">{display(user.bio)}</p></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>{t.relationship}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {editing ? (
                  <>
                    <EditField label={t.status}>
                      <Select value={form.relationship_status || undefined} onValueChange={(value) => setForm((current) => ({ ...current, relationship_status: value }))}>
                        <SelectTrigger><SelectValue placeholder={t.notSet} /></SelectTrigger>
                        <SelectContent>{Object.entries(t.statuses).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                    </EditField>
                    <EditField label={t.anniversary}><Input type="date" value={form.anniversary_date || ''} onChange={(event) => setForm((current) => ({ ...current, anniversary_date: event.target.value }))} /></EditField>
                    <EditField label={t.partnerName}><Input value={form.partner_name} onChange={(event) => setForm((current) => ({ ...current, partner_name: event.target.value }))} placeholder={t.placeholders.partnerName} maxLength={120} /></EditField>
                    <EditField label={t.partnerEmail}><Input type="email" value={form.partner_email} onChange={(event) => setForm((current) => ({ ...current, partner_email: event.target.value }))} placeholder={t.placeholders.partnerEmail} maxLength={320} /></EditField>
                    <EditField label={t.loveLanguage}>
                      <Select value={form.love_language || undefined} onValueChange={(value) => setForm((current) => ({ ...current, love_language: value }))}>
                        <SelectTrigger><SelectValue placeholder={t.notSet} /></SelectTrigger>
                        <SelectContent>{Object.entries(t.loveLanguages).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                    </EditField>
                  </>
                ) : (
                  <>
                    <Field icon={Heart} label={t.status} value={t.statuses[user.relationship_status] || display(user.relationship_status)} />
                    <Field icon={CalendarDays} label={t.anniversary} value={formatDate(user.anniversary_date, t.notSet)} />
                    <Field icon={UserRound} label={t.partnerName} value={display(user.partner_name)} />
                    <Field icon={Mail} label={t.partnerEmail} value={display(user.partner_email)} />
                    <Field icon={Heart} label={t.loveLanguage} value={t.loveLanguages[user.love_language] || display(user.love_language)} />
                  </>
                )}
                <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">{t.partnerNote}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>{t.account}</CardTitle></CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-gray-600">{t.profileSetup}</span><span className="font-bold text-purple-700">{setupPercent}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600" style={{ width: `${setupPercent}%` }} /></div>
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-purple-50 p-4 text-sm text-purple-900"><LockKeyhole className="mt-0.5 h-5 w-5 flex-none" /><p>{t.privateNote}</p></div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle>{t.tools}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {TOOL_LINKS.map(({ key, path, icon: Icon }) => (
                  <Link key={key} to={path} className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-pink-200 hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700"><Icon className="h-5 w-5" /></div>
                    <span className="min-w-0 flex-1 font-medium text-gray-800">{t.actions[key]}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-pink-500" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gray-100 text-gray-600"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0"><p className="text-sm font-medium text-gray-500">{label}</p><p className="mt-0.5 break-words text-gray-900">{value}</p></div>
    </div>
  );
}

function EditField({ label, children }) {
  return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>{children}</div>;
}
