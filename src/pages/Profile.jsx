import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Edit, Heart, Mail, MapPin, Save, Sparkles, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    back: "Back", title: "My Profile", subtitle: "Keep the relationship details you want O2OL to use current.", edit: "Edit profile", save: "Save changes", cancel: "Cancel", signIn: "Sign in to view and edit your profile.", email: "Email", memberSince: "Member since", name: "Name", location: "Location", bio: "About me", status: "Relationship status", loveLanguage: "Love language", anniversary: "Anniversary date", notSet: "Not set", saved: "Profile updated.", saveError: "We could not update your profile.", privateNote: "These account details are private unless a specific O2OL feature clearly says otherwise. Partner connection is handled through the reciprocal Couple Profile flow.", relationshipTools: "Relationship shortcuts", coupleProfile: "Couple Profile", coupleProfileDesc: "Connect with a partner using the secure reciprocal-link flow.", dashboard: "Couples Dashboard", dashboardDesc: "Open your relationship tools in one place.", anniversaryTool: "Anniversary Tracker", anniversaryDesc: "View your anniversary countdown and planning shortcuts.", goals: "Relationship Goals", goalsDesc: "Create and track real relationship goals.", loveNotes: "Love Notes", loveNotesDesc: "Send notes only to your reciprocally linked partner.", open: "Open", statuses: { single: "Single", dating: "Dating", committed: "Committed", engaged: "Engaged", married: "Married", partnership: "Partnership", complicated: "It’s complicated" }, languages: { words: "Words of affirmation", time: "Quality time", gifts: "Receiving gifts", service: "Acts of service", touch: "Physical touch" },
  },
  es: {
    back: "Volver", title: "Mi Perfil", subtitle: "Mantén actualizados los datos de relación que quieres usar en O2OL.", edit: "Editar perfil", save: "Guardar cambios", cancel: "Cancelar", signIn: "Inicia sesión para ver y editar tu perfil.", email: "Correo", memberSince: "Miembro desde", name: "Nombre", location: "Ubicación", bio: "Sobre mí", status: "Estado de la relación", loveLanguage: "Lenguaje del amor", anniversary: "Fecha de aniversario", notSet: "Sin configurar", saved: "Perfil actualizado.", saveError: "No pudimos actualizar tu perfil.", privateNote: "Estos datos de cuenta son privados salvo que una función de O2OL indique claramente lo contrario. La conexión de pareja se gestiona mediante el flujo recíproco de Perfil de Pareja.", relationshipTools: "Accesos de relación", coupleProfile: "Perfil de Pareja", coupleProfileDesc: "Conecta con tu pareja mediante el flujo seguro de enlace recíproco.", dashboard: "Panel de Pareja", dashboardDesc: "Abre tus herramientas de relación en un solo lugar.", anniversaryTool: "Rastreador de Aniversario", anniversaryDesc: "Consulta la cuenta regresiva y accesos de planificación.", goals: "Metas de Relación", goalsDesc: "Crea y sigue metas reales de relación.", loveNotes: "Notas de Amor", loveNotesDesc: "Envía notas solo a tu pareja vinculada recíprocamente.", open: "Abrir", statuses: { single: "Soltero/a", dating: "Saliendo", committed: "Comprometido/a", engaged: "Prometido/a", married: "Casado/a", partnership: "Pareja estable", complicated: "Es complicado" }, languages: { words: "Palabras de afirmación", time: "Tiempo de calidad", gifts: "Recibir regalos", service: "Actos de servicio", touch: "Contacto físico" },
  },
  fr: {
    back: "Retour", title: "Mon Profil", subtitle: "Gardez à jour les informations relationnelles que vous souhaitez utiliser dans O2OL.", edit: "Modifier le profil", save: "Enregistrer", cancel: "Annuler", signIn: "Connectez-vous pour voir et modifier votre profil.", email: "E-mail", memberSince: "Membre depuis", name: "Nom", location: "Lieu", bio: "À propos de moi", status: "Statut relationnel", loveLanguage: "Langage de l’amour", anniversary: "Date d’anniversaire", notSet: "Non défini", saved: "Profil mis à jour.", saveError: "Impossible de mettre à jour votre profil.", privateNote: "Ces informations de compte restent privées sauf indication claire d’une fonction O2OL. La connexion avec un partenaire passe par le flux réciproque sécurisé du Profil de Couple.", relationshipTools: "Raccourcis relationnels", coupleProfile: "Profil de Couple", coupleProfileDesc: "Connectez un partenaire grâce au flux sécurisé de lien réciproque.", dashboard: "Tableau de Bord du Couple", dashboardDesc: "Ouvrez vos outils relationnels au même endroit.", anniversaryTool: "Suivi d’Anniversaire", anniversaryDesc: "Consultez le compte à rebours et les raccourcis de planification.", goals: "Objectifs de Relation", goalsDesc: "Créez et suivez de vrais objectifs relationnels.", loveNotes: "Notes d’Amour", loveNotesDesc: "Envoyez des notes uniquement à votre partenaire lié réciproquement.", open: "Ouvrir", statuses: { single: "Célibataire", dating: "En couple / fréquentation", committed: "Engagé", engaged: "Fiancé", married: "Marié", partnership: "Partenariat", complicated: "C’est compliqué" }, languages: { words: "Paroles valorisantes", time: "Moments de qualité", gifts: "Recevoir des cadeaux", service: "Services rendus", touch: "Toucher physique" },
  },
  it: {
    back: "Indietro", title: "Il Mio Profilo", subtitle: "Mantieni aggiornati i dettagli della relazione che vuoi usare in O2OL.", edit: "Modifica profilo", save: "Salva modifiche", cancel: "Annulla", signIn: "Accedi per vedere e modificare il tuo profilo.", email: "Email", memberSince: "Membro dal", name: "Nome", location: "Posizione", bio: "Su di me", status: "Stato della relazione", loveLanguage: "Linguaggio dell’amore", anniversary: "Data anniversario", notSet: "Non impostato", saved: "Profilo aggiornato.", saveError: "Non è stato possibile aggiornare il profilo.", privateNote: "Questi dati dell’account restano privati salvo indicazione chiara di una funzione O2OL. Il collegamento con il partner avviene tramite il flusso reciproco sicuro del Profilo di Coppia.", relationshipTools: "Scorciatoie di relazione", coupleProfile: "Profilo di Coppia", coupleProfileDesc: "Collega un partner usando il flusso sicuro di collegamento reciproco.", dashboard: "Dashboard di Coppia", dashboardDesc: "Apri gli strumenti di relazione in un unico posto.", anniversaryTool: "Tracker Anniversario", anniversaryDesc: "Visualizza il conto alla rovescia e le scorciatoie di pianificazione.", goals: "Obiettivi di Relazione", goalsDesc: "Crea e monitora obiettivi reali di relazione.", loveNotes: "Note d’Amore", loveNotesDesc: "Invia note solo al partner collegato reciprocamente.", open: "Apri", statuses: { single: "Single", dating: "Frequentazione", committed: "Impegnata", engaged: "Fidanzati ufficialmente", married: "Sposati", partnership: "Partnership", complicated: "È complicato" }, languages: { words: "Parole di affermazione", time: "Tempo di qualità", gifts: "Ricevere regali", service: "Gesti di servizio", touch: "Contatto fisico" },
  },
  de: {
    back: "Zurück", title: "Mein Profil", subtitle: "Halte die Beziehungsangaben aktuell, die du in O2OL verwenden möchtest.", edit: "Profil bearbeiten", save: "Änderungen speichern", cancel: "Abbrechen", signIn: "Melde dich an, um dein Profil anzusehen und zu bearbeiten.", email: "E-Mail", memberSince: "Mitglied seit", name: "Name", location: "Ort", bio: "Über mich", status: "Beziehungsstatus", loveLanguage: "Liebessprache", anniversary: "Jahrestagsdatum", notSet: "Nicht festgelegt", saved: "Profil aktualisiert.", saveError: "Das Profil konnte nicht aktualisiert werden.", privateNote: "Diese Kontodaten bleiben privat, sofern eine O2OL-Funktion nicht klar etwas anderes angibt. Die Partnerverknüpfung erfolgt über den sicheren gegenseitigen Paar-Profil-Ablauf.", relationshipTools: "Beziehungs-Shortcuts", coupleProfile: "Paar-Profil", coupleProfileDesc: "Verbinde einen Partner über den sicheren gegenseitigen Verknüpfungsablauf.", dashboard: "Paar-Dashboard", dashboardDesc: "Öffne deine Beziehungswerkzeuge an einem Ort.", anniversaryTool: "Jahrestags-Tracker", anniversaryDesc: "Sieh Countdown und Planungs-Shortcuts für euren Jahrestag.", goals: "Beziehungsziele", goalsDesc: "Erstelle und verfolge echte Beziehungsziele.", loveNotes: "Liebesbotschaften", loveNotesDesc: "Sende Nachrichten nur an deinen gegenseitig verknüpften Partner.", open: "Öffnen", statuses: { single: "Single", dating: "Dating", committed: "Fest verbunden", engaged: "Verlobt", married: "Verheiratet", partnership: "Partnerschaft", complicated: "Es ist kompliziert" }, languages: { words: "Worte der Anerkennung", time: "Gemeinsame Zeit", gifts: "Geschenke erhalten", service: "Hilfsbereitschaft", touch: "Körperliche Nähe" },
  },
};

const localeMap = { en: "en-US", es: "es", fr: "fr", it: "it", de: "de" };
const editableFields = ["name", "location", "bio", "relationship_status", "love_language", "anniversary_date"];
const normalize = (user) => Object.fromEntries(editableFields.map((field) => [field, user?.[field] || ""]));

const shortcuts = [
  ["coupleProfile", "coupleProfileDesc", "CouplesProfile"],
  ["dashboard", "dashboardDesc", "CouplesDashboard"],
  ["anniversaryTool", "anniversaryDesc", "AnniversaryTracker"],
  ["goals", "goalsDesc", "RelationshipGoals"],
  ["loveNotes", "loveNotesDesc", "LoveNotes"],
];

export default function Profile() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const { user, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(() => normalize(user));

  const joined = useMemo(() => user?.created_at ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(user.created_at)) : t.notSet, [locale, t.notSet, user?.created_at]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error(t.signIn);
      const payload = Object.fromEntries(editableFields.map((field) => [field, formData[field] || null]));
      const { error } = await supabase.from("users").update(payload).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshUserProfile?.();
      toast.success(t.saved);
      setEditing(false);
    },
    onError: () => toast.error(t.saveError),
  });

  if (!user) {
    return <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-16"><Card className="mx-auto max-w-xl"><CardContent className="p-8 text-center"><p className="text-gray-700">{t.signIn}</p><Button asChild className="mt-5"><Link to={createPageUrl("SignIn")}>{t.signIn}</Link></Button></CardContent></Card></main>;
  }

  const displayedName = user.name || user.email?.split("@")[0] || t.title;
  const initial = displayedName.slice(0, 1).toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-white hover:text-purple-700"><ArrowLeft className="h-4 w-4" />{t.back}</Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-purple-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-purple-700 to-pink-600 px-6 py-8 text-white md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                {user.avatar_url ? <img src={user.avatar_url} alt={displayedName} className="h-20 w-20 rounded-full border-4 border-white/80 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-white/20 text-3xl font-bold">{initial}</div>}
                <div><h1 className="text-3xl font-bold md:text-4xl">{displayedName}</h1><p className="mt-1 text-white/85">{t.subtitle}</p></div>
              </div>
              {!editing ? <Button type="button" variant="secondary" onClick={() => { setFormData(normalize(user)); setEditing(true); }}><Edit className="mr-2 h-4 w-4" />{t.edit}</Button> : <Button type="button" variant="secondary" onClick={() => { setFormData(normalize(user)); setEditing(false); }}><X className="mr-2 h-4 w-4" />{t.cancel}</Button>}
            </div>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-gray-700"><Mail className="h-5 w-5 text-purple-600" /><div><div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.email}</div><div>{user.email}</div></div></div>
              <div className="flex items-center gap-3 text-gray-700"><CalendarDays className="h-5 w-5 text-purple-600" /><div><div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.memberSince}</div><div>{joined}</div></div></div>
              <div className="rounded-2xl bg-purple-50 p-4 text-sm leading-6 text-purple-900">{t.privateNote}</div>
            </div>

            <div className="space-y-4">
              <ProfileField icon={User} label={t.name} editing={editing}><Input value={formData.name} onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))} maxLength={120} /></ProfileField>
              <ProfileField icon={MapPin} label={t.location} editing={editing}><Input value={formData.location} onChange={(e) => setFormData((current) => ({ ...current, location: e.target.value }))} maxLength={160} /></ProfileField>
              <ProfileField icon={Heart} label={t.status} editing={editing} display={t.statuses[user.relationship_status] || user.relationship_status || t.notSet}>
                <Select value={formData.relationship_status || "single"} onValueChange={(value) => setFormData((current) => ({ ...current, relationship_status: value }))}><SelectTrigger aria-label={t.status}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(t.statuses).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              </ProfileField>
              <ProfileField icon={Sparkles} label={t.loveLanguage} editing={editing} display={t.languages[user.love_language] || user.love_language || t.notSet}>
                <Select value={formData.love_language || "words"} onValueChange={(value) => setFormData((current) => ({ ...current, love_language: value }))}><SelectTrigger aria-label={t.loveLanguage}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(t.languages).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              </ProfileField>
              <ProfileField icon={CalendarDays} label={t.anniversary} editing={editing} display={user.anniversary_date ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${user.anniversary_date}T00:00:00`)) : t.notSet}><Input type="date" value={formData.anniversary_date} onChange={(e) => setFormData((current) => ({ ...current, anniversary_date: e.target.value }))} /></ProfileField>
              <div><label className="mb-2 block text-sm font-semibold text-gray-700">{t.bio}</label>{editing ? <Textarea value={formData.bio} onChange={(e) => setFormData((current) => ({ ...current, bio: e.target.value }))} maxLength={1200} className="min-h-28" /> : <p className="rounded-xl bg-gray-50 p-4 leading-7 text-gray-700">{user.bio || t.notSet}</p>}</div>
              {editing && <Button type="button" className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}><Save className="mr-2 h-4 w-4" />{t.save}</Button>}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-950">{t.relationshipTools}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map(([titleKey, descKey, page]) => <Card key={page} className="border-purple-100 shadow-sm"><CardHeader><CardTitle>{t[titleKey]}</CardTitle></CardHeader><CardContent className="flex h-full flex-col"><p className="flex-1 leading-7 text-gray-600">{t[descKey]}</p><Button asChild variant="outline" className="mt-5"><Link to={createPageUrl(page)}>{t.open}</Link></Button></CardContent></Card>)}
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({ icon: Icon, label, editing, display, children }) {
  return <div><label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Icon className="h-4 w-4 text-purple-600" />{label}</label>{editing ? children : <div className="rounded-xl bg-gray-50 px-4 py-3 text-gray-700">{display || children?.props?.value || "—"}</div>}</div>;
}
