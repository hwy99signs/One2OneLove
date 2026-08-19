import React, { useMemo, useState } from "react";
import { CalendarHeart, Heart, Loader2, Pencil, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";
import { supabase } from "@/lib/supabase";

const translations = {
  en: {
    title: "Anniversary Tracker",
    subtitle: "Keep one meaningful date visible and make space to celebrate the relationship you are building.",
    signIn: "Sign in to view and manage your anniversary.", signInButton: "Sign In",
    notSet: "Your anniversary date is not set yet.", setDate: "Set Anniversary Date", editDate: "Edit Date",
    save: "Save Anniversary", saving: "Saving...", cancel: "Cancel",
    next: "Next anniversary", days: "days to go", today: "Today is your anniversary!", years: "years together",
    privacy: "Your anniversary date is stored only on your own One2OneLove account profile. This tracker does not read another member’s private account row.",
    saved: "Anniversary updated.", error: "We could not update your anniversary.", invalid: "Choose a valid anniversary date.",
    celebrate: "Celebrate Intentionally",
    actions: [["Plan a Date Night", "Create intentional time together.", "/DateNight"], ["Visit Memory Lane", "Look back at moments you have created together.", "/MemoryLane"], ["Send a Love Note", "Deliver a private note to your mutually linked partner.", "/LoveNotes"]],
  },
  es: {
    title: "Seguimiento de Aniversario",
    subtitle: "Mantengan visible una fecha significativa y creen espacio para celebrar la relación que están construyendo.",
    signIn: "Inicia sesión para ver y administrar tu aniversario.", signInButton: "Iniciar Sesión",
    notSet: "Tu fecha de aniversario todavía no está establecida.", setDate: "Establecer Fecha de Aniversario", editDate: "Editar Fecha",
    save: "Guardar Aniversario", saving: "Guardando...", cancel: "Cancelar",
    next: "Próximo aniversario", days: "días restantes", today: "¡Hoy es su aniversario!", years: "años juntos",
    privacy: "Tu fecha de aniversario se guarda únicamente en tu propio perfil de One2OneLove. Este seguimiento no lee la cuenta privada de otro miembro.",
    saved: "Aniversario actualizado.", error: "No pudimos actualizar tu aniversario.", invalid: "Elige una fecha de aniversario válida.",
    celebrate: "Celebren con Intención",
    actions: [["Planear una Noche de Cita", "Creen tiempo intencional juntos.", "/DateNight"], ["Visitar el Carril de Recuerdos", "Miren los momentos que ya han creado juntos.", "/MemoryLane"], ["Enviar una Nota de Amor", "Entrega una nota privada a tu pareja vinculada mutuamente.", "/LoveNotes"]],
  },
  fr: {
    title: "Suivi d’Anniversaire",
    subtitle: "Gardez une date importante visible et créez un espace pour célébrer la relation que vous construisez.",
    signIn: "Connectez-vous pour voir et gérer votre anniversaire.", signInButton: "Se Connecter",
    notSet: "Votre date d’anniversaire n’est pas encore définie.", setDate: "Définir la Date d’Anniversaire", editDate: "Modifier la Date",
    save: "Enregistrer l’Anniversaire", saving: "Enregistrement...", cancel: "Annuler",
    next: "Prochain anniversaire", days: "jours restants", today: "Aujourd’hui, c’est votre anniversaire !", years: "années ensemble",
    privacy: "Votre date d’anniversaire est enregistrée uniquement dans votre propre profil One2OneLove. Ce suivi ne lit pas la ligne de compte privée d’un autre membre.",
    saved: "Anniversaire mis à jour.", error: "Nous n’avons pas pu mettre à jour votre anniversaire.", invalid: "Choisissez une date d’anniversaire valide.",
    celebrate: "Célébrer avec Intention",
    actions: [["Planifier une Soirée", "Créez du temps intentionnel ensemble.", "/DateNight"], ["Visiter l’Allée des Souvenirs", "Revenez sur les moments que vous avez déjà créés ensemble.", "/MemoryLane"], ["Envoyer une Note d’Amour", "Envoyez une note privée à votre partenaire lié réciproquement.", "/LoveNotes"]],
  },
  it: {
    title: "Monitoraggio Anniversario",
    subtitle: "Tenete visibile una data importante e create spazio per celebrare la relazione che state costruendo.",
    signIn: "Accedi per vedere e gestire il tuo anniversario.", signInButton: "Accedi",
    notSet: "La data del tuo anniversario non è ancora impostata.", setDate: "Imposta Data Anniversario", editDate: "Modifica Data",
    save: "Salva Anniversario", saving: "Salvataggio...", cancel: "Annulla",
    next: "Prossimo anniversario", days: "giorni rimanenti", today: "Oggi è il vostro anniversario!", years: "anni insieme",
    privacy: "La data dell’anniversario viene salvata solo nel tuo profilo One2OneLove. Questo strumento non legge la riga privata dell’account di un altro membro.",
    saved: "Anniversario aggiornato.", error: "Non è stato possibile aggiornare l’anniversario.", invalid: "Scegli una data di anniversario valida.",
    celebrate: "Celebrate con Intenzione",
    actions: [["Pianifica una Serata di Coppia", "Create tempo intenzionale insieme.", "/DateNight"], ["Visita il Viale dei Ricordi", "Ripercorrete i momenti che avete già creato insieme.", "/MemoryLane"], ["Invia una Nota d’Amore", "Invia una nota privata al partner collegato reciprocamente.", "/LoveNotes"]],
  },
  de: {
    title: "Jahrestags-Tracker",
    subtitle: "Haltet ein wichtiges Datum sichtbar und schafft Raum, um eure gemeinsame Beziehung bewusst zu feiern.",
    signIn: "Meldet euch an, um euren Jahrestag anzusehen und zu verwalten.", signInButton: "Anmelden",
    notSet: "Euer Jahrestagsdatum ist noch nicht festgelegt.", setDate: "Jahrestagsdatum Festlegen", editDate: "Datum Bearbeiten",
    save: "Jahrestag Speichern", saving: "Wird gespeichert...", cancel: "Abbrechen",
    next: "Nächster Jahrestag", days: "Tage verbleibend", today: "Heute ist euer Jahrestag!", years: "Jahre zusammen",
    privacy: "Euer Jahrestagsdatum wird ausschließlich im eigenen One2OneLove-Profil gespeichert. Dieser Tracker liest keine private Kontenzeile eines anderen Mitglieds.",
    saved: "Jahrestag aktualisiert.", error: "Der Jahrestag konnte nicht aktualisiert werden.", invalid: "Bitte wählt ein gültiges Jahrestagsdatum.",
    celebrate: "Bewusst Feiern",
    actions: [["Date Night Planen", "Schafft bewusst gemeinsame Zeit.", "/DateNight"], ["Erinnerungsgasse Besuchen", "Blickt auf gemeinsam geschaffene Momente zurück.", "/MemoryLane"], ["Liebesbotschaft Senden", "Sendet eine private Nachricht an euren gegenseitig verknüpften Partner.", "/LoveNotes"]],
  },
};

const localeMap = { en: "en-US", es: "es", fr: "fr", it: "it", de: "de" };

function anniversaryMetrics(value) {
  if (!value) return null;
  const original = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(original.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate(), 12);
  if (next < today) next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate(), 12);
  const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
  const yearsAtNext = Math.max(next.getFullYear() - original.getFullYear(), 0);
  return { original, next, daysUntil, yearsAtNext };
}

export default function AnniversaryTracker() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const { user, isLoading, refreshUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [saving, setSaving] = useState(false);
  const metrics = useMemo(() => anniversaryMetrics(user?.anniversary_date), [user?.anniversary_date]);

  const originalLabel = metrics ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(metrics.original) : "";
  const nextLabel = metrics ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(metrics.next) : "";

  const openEditor = () => {
    setDateValue(user?.anniversary_date ? String(user.anniversary_date).slice(0, 10) : "");
    setEditing(true);
  };

  const saveDate = async () => {
    if (!user?.id || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      toast.error(t.invalid);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ anniversary_date: dateValue, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      if (refreshUserProfile) await refreshUserProfile();
      setEditing(false);
      toast.success(t.saved);
    } catch {
      toast.error(t.error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50"><Loader2 className="h-8 w-8 animate-spin text-pink-600" aria-label={t.title} /></main>;
  }

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4"><div className="max-w-lg text-center"><CalendarHeart className="mx-auto h-14 w-14 text-pink-600" aria-hidden="true" /><h1 className="mt-4 text-4xl font-bold text-slate-900">{t.title}</h1><p className="mt-3 text-slate-600">{t.signIn}</p><Button asChild className="mt-6"><Link to="/SignIn">{t.signInButton}</Link></Button></div></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg"><CalendarHeart className="h-8 w-8" aria-hidden="true" /></div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-3 text-xs font-medium leading-5 text-purple-800">{t.privacy}</p>
        </header>

        <section className="mt-9">
          {!metrics ? (
            <Card className="border-dashed border-pink-200 bg-white/90"><CardContent className="p-8 text-center"><Heart className="mx-auto h-10 w-10 text-pink-500" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-slate-900">{t.notSet}</h2><Button type="button" onClick={openEditor} className="mt-5"><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />{t.setDate}</Button></CardContent></Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              <Card><CardHeader><CardTitle className="text-base text-slate-500">{t.next}</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-slate-900">{nextLabel}</p><p className="mt-2 text-sm text-pink-700">{metrics.daysUntil === 0 ? t.today : `${metrics.daysUntil} ${t.days}`}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base text-slate-500">{t.years}</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold text-purple-700">{metrics.yearsAtNext}</p><p className="mt-2 text-sm text-slate-500">{originalLabel}</p></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base text-slate-500">{t.editDate}</CardTitle></CardHeader><CardContent><Button type="button" onClick={openEditor} variant="outline" className="w-full"><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />{t.editDate}</Button></CardContent></Card>
            </div>
          )}
        </section>

        {editing && (
          <Card className="mx-auto mt-6 max-w-xl border-pink-200">
            <CardHeader><CardTitle>{metrics ? t.editDate : t.setDate}</CardTitle></CardHeader>
            <CardContent>
              <Input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} aria-label={t.setDate} />
              <div className="mt-4 flex gap-3"><Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving} className="flex-1">{t.cancel}</Button><Button type="button" onClick={saveDate} disabled={saving} className="flex-1">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}{saving ? t.saving : t.save}</Button></div>
            </CardContent>
          </Card>
        )}

        <section className="mt-10" aria-labelledby="celebrate-heading">
          <h2 id="celebrate-heading" className="text-2xl font-bold text-slate-900">{t.celebrate}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {t.actions.map(([title, description, href]) => <Link key={href} to={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></Link>)}
          </div>
        </section>
      </div>
    </main>
  );
}
