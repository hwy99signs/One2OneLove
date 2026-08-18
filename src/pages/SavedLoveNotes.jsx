import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, Loader2, LockKeyhole, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getSavedLoveNotes, removeSavedLoveNote } from "@/lib/loveNoteSaveService";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";

const copy = {
  en: {
    back: "Back to Love Notes",
    title: "Saved Love Notes",
    subtitle: "Keep the Love Notes that matter to you in one private place.",
    signInTitle: "Your saved Love Notes are private",
    signInText: "Sign in or create a free account to see the Love Notes you have chosen to keep.",
    signIn: "Sign in",
    signUp: "Create free account",
    unavailable: "Saved Love Notes are staged for the relaunch but the database feature has not been activated yet.",
    updateError: "We could not update your saved Love Notes. Please try again later.",
    from: "From",
    someone: "Someone special",
    remove: "Remove from saved",
    emptyTitle: "No saved Love Notes yet",
    emptyText: "When you save a revealed Love Note, it will appear here.",
  },
  es: {
    back: "Volver a Notas de Amor",
    title: "Notas de Amor Guardadas",
    subtitle: "Guarda en un lugar privado las Notas de Amor que significan más para ti.",
    signInTitle: "Tus Notas de Amor guardadas son privadas",
    signInText: "Inicia sesión o crea una cuenta gratis para ver las Notas de Amor que decidiste guardar.",
    signIn: "Iniciar sesión",
    signUp: "Crear cuenta gratis",
    unavailable: "Las Notas de Amor guardadas están preparadas para el relanzamiento, pero la función de base de datos aún no está activada.",
    updateError: "No pudimos actualizar tus Notas de Amor guardadas. Inténtalo más tarde.",
    from: "De",
    someone: "Alguien especial",
    remove: "Quitar de guardadas",
    emptyTitle: "Aún no hay Notas de Amor guardadas",
    emptyText: "Cuando guardes una Nota de Amor revelada, aparecerá aquí.",
  },
  fr: {
    back: "Retour aux Mots d’Amour",
    title: "Mots d’Amour Sauvegardés",
    subtitle: "Gardez les Mots d’Amour qui comptent dans un espace privé.",
    signInTitle: "Vos Mots d’Amour sauvegardés sont privés",
    signInText: "Connectez-vous ou créez un compte gratuit pour voir les Mots d’Amour que vous avez choisi de conserver.",
    signIn: "Se connecter",
    signUp: "Créer un compte gratuit",
    unavailable: "Les Mots d’Amour sauvegardés sont préparés pour le relancement, mais la fonction de base de données n’est pas encore activée.",
    updateError: "Impossible de mettre à jour vos Mots d’Amour sauvegardés. Réessayez plus tard.",
    from: "De",
    someone: "Quelqu’un de spécial",
    remove: "Retirer des sauvegardés",
    emptyTitle: "Aucun Mot d’Amour sauvegardé",
    emptyText: "Quand vous sauvegarderez un Mot d’Amour révélé, il apparaîtra ici.",
  },
  it: {
    back: "Torna alle Note d’Amore",
    title: "Note d’Amore Salvate",
    subtitle: "Conserva in un posto privato le Note d’Amore che contano per te.",
    signInTitle: "Le tue Note d’Amore salvate sono private",
    signInText: "Accedi o crea un account gratuito per vedere le Note d’Amore che hai scelto di conservare.",
    signIn: "Accedi",
    signUp: "Crea account gratuito",
    unavailable: "Le Note d’Amore salvate sono pronte per il rilancio, ma la funzione del database non è ancora attiva.",
    updateError: "Non è stato possibile aggiornare le Note d’Amore salvate. Riprova più tardi.",
    from: "Da",
    someone: "Qualcuno di speciale",
    remove: "Rimuovi dalle salvate",
    emptyTitle: "Nessuna Nota d’Amore salvata",
    emptyText: "Quando salverai una Nota d’Amore rivelata, apparirà qui.",
  },
  de: {
    back: "Zurück zu Liebesnotizen",
    title: "Gespeicherte Liebesnotizen",
    subtitle: "Bewahre wichtige Liebesnotizen an einem privaten Ort auf.",
    signInTitle: "Deine gespeicherten Liebesnotizen sind privat",
    signInText: "Melde dich an oder erstelle ein kostenloses Konto, um deine gespeicherten Liebesnotizen zu sehen.",
    signIn: "Anmelden",
    signUp: "Kostenloses Konto erstellen",
    unavailable: "Gespeicherte Liebesnotizen sind für den Relaunch vorbereitet, aber die Datenbankfunktion ist noch nicht aktiviert.",
    updateError: "Deine gespeicherten Liebesnotizen konnten nicht aktualisiert werden. Bitte versuche es später erneut.",
    from: "Von",
    someone: "Jemand Besonderes",
    remove: "Aus Gespeichert entfernen",
    emptyTitle: "Noch keine Liebesnotizen gespeichert",
    emptyText: "Wenn du eine enthüllte Liebesnotiz speicherst, erscheint sie hier.",
  },
  nl: {
    back: "Terug naar Liefdesbriefjes",
    title: "Bewaarde Liefdesbriefjes",
    subtitle: "Bewaar de Liefdesbriefjes die belangrijk voor je zijn op één privéplek.",
    signInTitle: "Je bewaarde Liefdesbriefjes zijn privé",
    signInText: "Log in of maak een gratis account om de Liefdesbriefjes te zien die je hebt bewaard.",
    signIn: "Inloggen",
    signUp: "Gratis account maken",
    unavailable: "Bewaarde Liefdesbriefjes zijn voorbereid voor de herlancering, maar de databasefunctie is nog niet geactiveerd.",
    updateError: "We konden je bewaarde Liefdesbriefjes niet bijwerken. Probeer het later opnieuw.",
    from: "Van",
    someone: "Iemand speciaal",
    remove: "Verwijderen uit bewaard",
    emptyTitle: "Nog geen Liefdesbriefjes bewaard",
    emptyText: "Wanneer je een onthuld Liefdesbriefje bewaart, verschijnt het hier.",
  },
};

export default function SavedLoveNotes() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  const loadNotes = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await getSavedLoveNotes();
      setNotes(data);
    } catch (loadError) {
      console.warn("Saved Love Notes unavailable:", loadError);
      setError(t.unavailable);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) void loadNotes();
  }, [authLoading, user?.id, currentLanguage]);

  const removeNote = async (invitationId) => {
    setRemovingId(invitationId);
    setError("");
    try {
      await removeSavedLoveNote(invitationId);
      setNotes((current) => current.filter((item) => item.invitation_id !== invitationId));
    } catch (removeError) {
      console.warn("Unable to remove saved Love Note:", removeError);
      setError(t.updateError);
    } finally {
      setRemovingId("");
    }
  };

  const returnTo = encodeURIComponent("/SavedLoveNotes");

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-5 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate("/LoveNotes")} className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> {t.back}
        </button>

        <header className="mt-7 rounded-[2rem] border border-white bg-white p-7 shadow-xl sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-pink-700">
            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" /> One2OneLove
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{t.subtitle}</p>
        </header>

        {authLoading ? (
          <div className="mt-8 flex items-center justify-center rounded-[1.75rem] bg-white p-12 shadow-sm"><Loader2 className="h-6 w-6 animate-spin text-pink-600" /></div>
        ) : !user ? (
          <section className="mt-8 rounded-[1.75rem] border border-white bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700"><LockKeyhole className="h-6 w-6" /></div>
            <h2 className="mt-5 text-2xl font-black text-slate-950">{t.signInTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{t.signInText}</p>
            <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
              <Link to={`/SignIn?returnTo=${returnTo}`} className="rounded-2xl bg-pink-600 px-5 py-3 text-sm font-black text-white">{t.signIn}</Link>
              <Link to={`/SignUp?returnTo=${returnTo}`} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">{t.signUp}</Link>
            </div>
          </section>
        ) : (
          <>
            {error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{error}</div>}

            {loading ? (
              <div className="mt-8 flex items-center justify-center rounded-[1.75rem] bg-white p-12 shadow-sm"><Loader2 className="h-6 w-6 animate-spin text-pink-600" /></div>
            ) : notes.length ? (
              <section className="mt-8 grid gap-5 md:grid-cols-2">
                {notes.map((item) => {
                  const note = item.love_note_invitations || {};
                  const sender = note.sender_name || t.someone;
                  return (
                    <article key={item.id} className="rounded-[1.75rem] border border-white bg-white p-6 shadow-lg">
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-pink-600">{t.from} {sender}</div>
                      <div className="mt-5 -rotate-1 rounded-sm border border-yellow-300 bg-yellow-100 p-6 shadow-md">
                        <p className="text-base font-semibold leading-7 text-slate-800">{note.note_content || "Love Note"}</p>
                        <div className="mt-5 text-right text-sm font-bold text-slate-600">— {sender} 💕</div>
                      </div>
                      <button type="button" onClick={() => removeNote(item.invitation_id)} disabled={removingId === item.invitation_id} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-red-600 disabled:opacity-50">
                        <Trash2 className="h-4 w-4" /> {t.remove}
                      </button>
                    </article>
                  );
                })}
              </section>
            ) : (
              <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center">
                <Heart className="mx-auto h-8 w-8 text-pink-300" />
                <div className="mt-4 text-lg font-black">{t.emptyTitle}</div>
                <p className="mt-2 text-sm text-slate-500">{t.emptyText}</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
