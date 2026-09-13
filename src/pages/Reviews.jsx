import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Heart, ArrowLeft, Quote, Loader2, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { getPublishedReviews } from "@/lib/reviewService";

const locales = { en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", de: "de-DE" };

const translations = {
  en: {
    title: "Reviews",
    subtitle: "Read real reviews shared by One2OneLove members.",
    back: "Back",
    averageRating: "Average Rating",
    totalReviews: "Total Reviews",
    leaveReview: "Leave a Review",
    noReviewsTitle: "No reviews yet",
    noReviewsBody: "There are no published reviews yet. Be the first member to share your experience.",
    loading: "Loading reviews...",
    unavailable: "Reviews are temporarily unavailable. Please try again later."
  },
  es: {
    title: "Reseñas",
    subtitle: "Lee reseñas reales compartidas por miembros de One2OneLove.",
    back: "Volver",
    averageRating: "Calificación Promedio",
    totalReviews: "Total de Reseñas",
    leaveReview: "Dejar una Reseña",
    noReviewsTitle: "Aún no hay reseñas",
    noReviewsBody: "Todavía no hay reseñas publicadas. Sé el primer miembro en compartir tu experiencia.",
    loading: "Cargando reseñas...",
    unavailable: "Las reseñas no están disponibles temporalmente. Inténtalo de nuevo más tarde."
  },
  fr: {
    title: "Avis",
    subtitle: "Lisez de vrais avis partagés par les membres de One2OneLove.",
    back: "Retour",
    averageRating: "Note Moyenne",
    totalReviews: "Total des Avis",
    leaveReview: "Laisser un Avis",
    noReviewsTitle: "Aucun avis pour le moment",
    noReviewsBody: "Aucun avis n'a encore été publié. Soyez le premier membre à partager votre expérience.",
    loading: "Chargement des avis...",
    unavailable: "Les avis sont temporairement indisponibles. Veuillez réessayer plus tard."
  },
  it: {
    title: "Recensioni",
    subtitle: "Leggi recensioni reali condivise dai membri di One2OneLove.",
    back: "Indietro",
    averageRating: "Valutazione Media",
    totalReviews: "Totale Recensioni",
    leaveReview: "Lascia una Recensione",
    noReviewsTitle: "Nessuna recensione",
    noReviewsBody: "Non ci sono ancora recensioni pubblicate. Sii il primo membro a condividere la tua esperienza.",
    loading: "Caricamento recensioni...",
    unavailable: "Le recensioni non sono temporaneamente disponibili. Riprova più tardi."
  },
  de: {
    title: "Bewertungen",
    subtitle: "Lesen Sie echte Bewertungen von One2OneLove-Mitgliedern.",
    back: "Zurück",
    averageRating: "Durchschnittliche Bewertung",
    totalReviews: "Gesamtbewertungen",
    leaveReview: "Bewertung Abgeben",
    noReviewsTitle: "Noch keine Bewertungen",
    noReviewsBody: "Es wurden noch keine Bewertungen veröffentlicht. Teilen Sie als erstes Mitglied Ihre Erfahrung.",
    loading: "Bewertungen werden geladen...",
    unavailable: "Bewertungen sind vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut."
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

export default function Reviews() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = locales[currentLanguage] || locales.en;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getPublishedReviews();
        if (active) setReviews(data);
      } catch (error) {
        console.error("Unable to load reviews:", error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReviews();
    return () => { active = false; };
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-7">{t.subtitle}</p>
          <Link to={createPageUrl("LeaveReview")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all">
            <PenLine size={19} />{t.leaveReview}
          </Link>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span>{t.loading}</span>
          </div>
        ) : loadError ? (
          <Card className="max-w-3xl mx-auto shadow-lg">
            <CardContent className="p-8 text-center text-gray-700">{t.unavailable}</CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="max-w-3xl mx-auto shadow-xl border-2 border-purple-100">
            <CardContent className="p-10 text-center">
              <Quote className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.noReviewsTitle}</h2>
              <p className="text-gray-600 mb-6">{t.noReviewsBody}</p>
              <Link to={createPageUrl("LeaveReview")} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold">
                <PenLine size={18} />{t.leaveReview}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-4xl mx-auto mb-12">
              <Card className="shadow-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star key={value} className={`w-8 h-8 ${averageRating && value <= Math.round(Number(averageRating)) ? "fill-yellow-300 text-yellow-300" : "text-white/40"}`} />
                    ))}
                  </div>
                  <div className="text-6xl font-bold mb-2">{averageRating}</div>
                  <div className="text-xl opacity-90 mb-1">{t.averageRating}</div>
                  <div className="opacity-75">{reviews.length} {t.totalReviews}</div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {reviews.map((review, index) => {
                const country = formatCountry(review.country, currentLanguage);
                const location = [review.city, country].filter(Boolean).join(", ");
                return (
                  <motion.div key={review.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + index * 0.04 }}>
                    <Card className="h-full hover:shadow-2xl transition-all border-2 border-transparent hover:border-pink-200">
                      <CardContent className="p-6">
                        <Quote className="w-8 h-8 text-pink-300 mb-4" />
                        <div className="flex gap-1 mb-4" aria-label={`${review.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star key={value} className={`w-5 h-5 ${value <= Number(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{review.review_text}</p>
                        <div className="border-t pt-4">
                          <div className="font-semibold text-gray-900">{review.reviewer_name}</div>
                          {location && <div className="text-sm text-gray-500">{location}</div>}
                          <div className="text-xs text-gray-400 mt-1">{formatDate(review.created_at)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
