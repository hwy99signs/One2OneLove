import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Globe2, MapPin, Star, UserRound, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { submitReview } from "@/lib/reviewService";

const locales = { en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", de: "de-DE" };

const translations = {
  en: {
    title: "Leave a Review",
    subtitle: "Share your experience with the One2One Love Platform.",
    back: "Back to Reviews",
    signInTitle: "Sign in to leave a review",
    signInBody: "Reviews are available to signed-in One2OneLove members.",
    signIn: "Sign In",
    profileTitle: "Review identity",
    profileNote: "Your name, city, and country come directly from your profile and cannot be changed on this form.",
    name: "Name",
    city: "City",
    country: "Country",
    date: "Date",
    missing: "Your profile must include your name, city, and country before you can leave a review.",
    updateProfile: "Update Profile",
    rating: "Your Rating",
    review: "Your Review",
    placeholder: "Tell others about your experience with One2OneLove...",
    submit: "Submit Review",
    submitting: "Submitting...",
    success: "Thank you. Your review has been submitted.",
    selectRating: "Please select a star rating.",
    reviewRequired: "Please write at least 10 characters in your review.",
    dateNote: "The review date is added automatically when you submit."
  },
  es: {
    title: "Dejar una Reseña",
    subtitle: "Comparte tu experiencia con la Plataforma One2One Love.",
    back: "Volver a Reseñas",
    signInTitle: "Inicia sesión para dejar una reseña",
    signInBody: "Las reseñas están disponibles para miembros de One2OneLove que hayan iniciado sesión.",
    signIn: "Iniciar Sesión",
    profileTitle: "Identidad de la reseña",
    profileNote: "Tu nombre, ciudad y país provienen directamente de tu perfil y no pueden cambiarse en este formulario.",
    name: "Nombre", city: "Ciudad", country: "País", date: "Fecha",
    missing: "Tu perfil debe incluir nombre, ciudad y país antes de dejar una reseña.",
    updateProfile: "Actualizar Perfil",
    rating: "Tu Calificación", review: "Tu Reseña",
    placeholder: "Cuéntales a otros sobre tu experiencia con One2OneLove...",
    submit: "Enviar Reseña", submitting: "Enviando...",
    success: "Gracias. Tu reseña ha sido enviada.",
    selectRating: "Selecciona una calificación con estrellas.",
    reviewRequired: "Escribe al menos 10 caracteres en tu reseña.",
    dateNote: "La fecha de la reseña se añade automáticamente al enviarla."
  },
  fr: {
    title: "Laisser un Avis",
    subtitle: "Partagez votre expérience avec la plateforme One2One Love.",
    back: "Retour aux Avis",
    signInTitle: "Connectez-vous pour laisser un avis",
    signInBody: "Les avis sont réservés aux membres One2OneLove connectés.",
    signIn: "Se Connecter",
    profileTitle: "Identité de l'avis",
    profileNote: "Votre nom, ville et pays proviennent directement de votre profil et ne peuvent pas être modifiés ici.",
    name: "Nom", city: "Ville", country: "Pays", date: "Date",
    missing: "Votre profil doit inclure votre nom, votre ville et votre pays avant de laisser un avis.",
    updateProfile: "Mettre à Jour le Profil",
    rating: "Votre Note", review: "Votre Avis",
    placeholder: "Parlez aux autres de votre expérience avec One2OneLove...",
    submit: "Envoyer l'Avis", submitting: "Envoi...",
    success: "Merci. Votre avis a été envoyé.",
    selectRating: "Veuillez sélectionner une note en étoiles.",
    reviewRequired: "Veuillez écrire au moins 10 caractères.",
    dateNote: "La date de l'avis est ajoutée automatiquement lors de l'envoi."
  },
  it: {
    title: "Lascia una Recensione",
    subtitle: "Condividi la tua esperienza con la piattaforma One2One Love.",
    back: "Torna alle Recensioni",
    signInTitle: "Accedi per lasciare una recensione",
    signInBody: "Le recensioni sono disponibili per i membri One2OneLove che hanno effettuato l'accesso.",
    signIn: "Accedi",
    profileTitle: "Identità della recensione",
    profileNote: "Nome, città e paese provengono direttamente dal tuo profilo e non possono essere modificati qui.",
    name: "Nome", city: "Città", country: "Paese", date: "Data",
    missing: "Il tuo profilo deve includere nome, città e paese prima di lasciare una recensione.",
    updateProfile: "Aggiorna Profilo",
    rating: "La Tua Valutazione", review: "La Tua Recensione",
    placeholder: "Racconta agli altri la tua esperienza con One2OneLove...",
    submit: "Invia Recensione", submitting: "Invio...",
    success: "Grazie. La tua recensione è stata inviata.",
    selectRating: "Seleziona una valutazione in stelle.",
    reviewRequired: "Scrivi almeno 10 caratteri nella recensione.",
    dateNote: "La data della recensione viene aggiunta automaticamente al momento dell'invio."
  },
  de: {
    title: "Bewertung Abgeben",
    subtitle: "Teilen Sie Ihre Erfahrung mit der One2One Love Plattform.",
    back: "Zurück zu Bewertungen",
    signInTitle: "Anmelden, um eine Bewertung abzugeben",
    signInBody: "Bewertungen können von angemeldeten One2OneLove-Mitgliedern abgegeben werden.",
    signIn: "Anmelden",
    profileTitle: "Bewertungsidentität",
    profileNote: "Name, Stadt und Land werden direkt aus Ihrem Profil übernommen und können hier nicht geändert werden.",
    name: "Name", city: "Stadt", country: "Land", date: "Datum",
    missing: "Ihr Profil muss Name, Stadt und Land enthalten, bevor Sie eine Bewertung abgeben können.",
    updateProfile: "Profil Aktualisieren",
    rating: "Ihre Bewertung", review: "Ihre Rezension",
    placeholder: "Erzählen Sie anderen von Ihrer Erfahrung mit One2OneLove...",
    submit: "Bewertung Senden", submitting: "Wird gesendet...",
    success: "Vielen Dank. Ihre Bewertung wurde eingereicht.",
    selectRating: "Bitte wählen Sie eine Sternebewertung.",
    reviewRequired: "Bitte schreiben Sie mindestens 10 Zeichen.",
    dateNote: "Das Bewertungsdatum wird beim Absenden automatisch hinzugefügt."
  }
};

function formatCountry(value, language) {
  const country = String(value || "").trim();
  if (!country) return "";

  if (/^[A-Za-z]{2}$/.test(country) && typeof Intl.DisplayNames === "function") {
    try {
      return new Intl.DisplayNames([locales[language] || locales.en], { type: "region" }).of(country.toUpperCase()) || country;
    } catch {
      return country;
    }
  }

  return country;
}

function notifyError(message) {
  toast({ title: message, variant: "destructive" });
}

export default function LeaveReview() {
  const { currentLanguage } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const t = translations[currentLanguage] || translations.en;
  const locale = locales[currentLanguage] || locales.en;
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const profile = useMemo(() => ({
    name: String(user?.name || "").trim(),
    city: String(user?.city || user?.location || "").trim(),
    country: String(user?.country || "").trim(),
  }), [user]);

  const profileComplete = Boolean(profile.name && profile.city && profile.country);
  const displayCountry = formatCountry(profile.country, currentLanguage);
  const displayDate = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date());

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!rating) {
      notifyError(t.selectRating);
      return;
    }

    if (reviewText.trim().length < 10) {
      notifyError(t.reviewRequired);
      return;
    }

    if (!profileComplete) {
      notifyError(t.missing);
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({ rating, reviewText });
      toast({ title: t.success });
      navigate(createPageUrl("Reviews"));
    } catch (error) {
      notifyError(error?.message || "Unable to submit your review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl("Reviews")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 rounded-xl mb-6">
            <ArrowLeft size={20} className="mr-2" />{t.back}
          </Link>
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <UserRound className="w-14 h-14 mx-auto mb-4 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.signInTitle}</h1>
              <p className="text-gray-600 mb-6">{t.signInBody}</p>
              <Button onClick={() => navigate(createPageUrl("SignIn"))} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">{t.signIn}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link to={createPageUrl("Reviews")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl mb-6 transition-all">
          <ArrowLeft size={20} className="mr-2" />{t.back}
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <Card className="shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <section className="rounded-2xl bg-purple-50 border border-purple-100 p-5 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{t.profileTitle}</h2>
              <p className="text-sm text-gray-600 mb-5">{t.profileNote}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <ProfileValue icon={<UserRound size={18} />} label={t.name} value={profile.name} />
                <ProfileValue icon={<MapPin size={18} />} label={t.city} value={profile.city} />
                <ProfileValue icon={<Globe2 size={18} />} label={t.country} value={displayCountry} />
                <ProfileValue icon={<CalendarDays size={18} />} label={t.date} value={displayDate} />
              </div>
              <p className="text-xs text-gray-500 mt-4">{t.dateNote}</p>

              {!profileComplete && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <p className="text-sm font-semibold mb-3">{t.missing}</p>
                  <Link to={createPageUrl("Profile")} className="inline-flex px-4 py-2 bg-white border border-amber-300 rounded-lg font-bold text-sm hover:bg-amber-100">{t.updateProfile}</Link>
                </div>
              )}
            </section>

            <form onSubmit={handleSubmit}>
              <div className="mb-7">
                <label className="block font-bold text-gray-900 mb-3">{t.rating} *</label>
                <div className="flex gap-2" role="radiogroup" aria-label={t.rating}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                      aria-checked={rating === value}
                      role="radio"
                    >
                      <Star className={`w-9 h-9 ${value <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-7">
                <label className="block font-bold text-gray-900 mb-3" htmlFor="review-text">{t.review} *</label>
                <Textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder={t.placeholder}
                  maxLength={2000}
                  rows={7}
                  required
                />
                <div className="text-right text-xs text-gray-400 mt-2">{reviewText.length}/2000</div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !profileComplete}
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white disabled:opacity-50"
              >
                {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.submitting}</> : t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileValue({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">{icon}{label}</div>
      <div className="font-semibold text-gray-900 min-h-6">{value || "—"}</div>
    </div>
  );
}
