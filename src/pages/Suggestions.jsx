import React, { useEffect, useState } from "react";
import { useLanguage } from "@/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiRequest } from "@/lib/apiClient";

const translations = {
  en: {
    title: "Share Your Ideas",
    subtitle: "Help us improve One 2 One Love with your suggestions",
    back: "Back",
    yourName: "Your Name (Optional)",
    email: "Your Email (Optional)",
    suggestionType: "Suggestion Type",
    suggestion: "Your Suggestion",
    submit: "Submit Suggestion",
    successMessage: "Thank you for your suggestion! We'll review it carefully. 💡",
    errorMessage: "Your suggestion could not be submitted. Please try again.",
    unavailable: "Suggestions are temporarily unavailable while launch storage is being finalized.",
    types: { feature: "New Feature", improvement: "Improvement", bug: "Bug Report", other: "Other" },
    placeholder: "Tell us your idea in detail..."
  },
  es: {
    title: "Comparte Tus Ideas",
    subtitle: "Ayúdanos a mejorar One 2 One Love con tus sugerencias",
    back: "Volver",
    yourName: "Tu Nombre (Opcional)",
    email: "Tu Email (Opcional)",
    suggestionType: "Tipo de Sugerencia",
    suggestion: "Tu Sugerencia",
    submit: "Enviar Sugerencia",
    successMessage: "¡Gracias por tu sugerencia! La revisaremos cuidadosamente. 💡",
    errorMessage: "No se pudo enviar tu sugerencia. Inténtalo de nuevo.",
    unavailable: "Las sugerencias no están disponibles temporalmente mientras finalizamos el almacenamiento de lanzamiento.",
    types: { feature: "Nueva Función", improvement: "Mejora", bug: "Reporte de Error", other: "Otro" },
    placeholder: "Cuéntanos tu idea en detalle..."
  },
  fr: {
    title: "Partagez Vos Idées",
    subtitle: "Aidez-nous à améliorer One 2 One Love avec vos suggestions",
    back: "Retour",
    yourName: "Votre Nom (Optionnel)",
    email: "Votre Email (Optionnel)",
    suggestionType: "Type de Suggestion",
    suggestion: "Votre Suggestion",
    submit: "Soumettre la Suggestion",
    successMessage: "Merci pour votre suggestion! Nous l'examinerons attentivement. 💡",
    errorMessage: "Votre suggestion n’a pas pu être envoyée. Veuillez réessayer.",
    unavailable: "Les suggestions sont temporairement indisponibles pendant la finalisation du stockage de lancement.",
    types: { feature: "Nouvelle Fonctionnalité", improvement: "Amélioration", bug: "Rapport de Bug", other: "Autre" },
    placeholder: "Parlez-nous de votre idée en détail..."
  },
  it: {
    title: "Condividi le Tue Idee",
    subtitle: "Aiutaci a migliorare One 2 One Love con i tuoi suggerimenti",
    back: "Indietro",
    yourName: "Il Tuo Nome (Opzionale)",
    email: "La Tua Email (Opzionale)",
    suggestionType: "Tipo di Suggerimento",
    suggestion: "Il Tuo Suggerimento",
    submit: "Invia Suggerimento",
    successMessage: "Grazie per il tuo suggerimento! Lo esamineremo attentamente. 💡",
    errorMessage: "Impossibile inviare il suggerimento. Riprova.",
    unavailable: "I suggerimenti non sono temporaneamente disponibili mentre finalizziamo l’archiviazione per il lancio.",
    types: { feature: "Nuova Funzionalità", improvement: "Miglioramento", bug: "Segnalazione Bug", other: "Altro" },
    placeholder: "Raccontaci la tua idea in dettaglio..."
  },
  de: {
    title: "Teilen Sie Ihre Ideen",
    subtitle: "Helfen Sie uns, One 2 One Love mit Ihren Vorschlägen zu verbessern",
    back: "Zurück",
    yourName: "Ihr Name (Optional)",
    email: "Ihre E-Mail (Optional)",
    suggestionType: "Vorschlagstyp",
    suggestion: "Ihr Vorschlag",
    submit: "Vorschlag Einreichen",
    successMessage: "Vielen Dank für Ihren Vorschlag! Wir werden ihn sorgfältig prüfen. 💡",
    errorMessage: "Ihr Vorschlag konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
    unavailable: "Vorschläge sind vorübergehend nicht verfügbar, während der Launch-Speicher fertiggestellt wird.",
    types: { feature: "Neue Funktion", improvement: "Verbesserung", bug: "Fehlerbericht", other: "Sonstiges" },
    placeholder: "Erzählen Sie uns im Detail von Ihrer Idee..."
  }
};

export default function Suggestions() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState({ name: "", email: "", type: "feature", suggestion: "" });
  const [submitting, setSubmitting] = useState(false);
  const [storageReady, setStorageReady] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest('/api/suggestions/readiness')
      .then(payload => { if (active) setStorageReady(payload?.ready === true); })
      .catch(() => { if (active) setStorageReady(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (storageReady !== true) return toast.error(t.unavailable);
    setSubmitting(true);
    try {
      await apiRequest('/api/suggestions', { method: 'POST', body: formData });
      toast.success(t.successMessage);
      setFormData({ name: "", email: "", type: "feature", suggestion: "" });
    } catch (error) {
      toast.error(error?.message || t.errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-6 shadow-xl">
            <Lightbulb className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">💡 {t.suggestion}</CardTitle>
            </CardHeader>
            <CardContent>
              {storageReady === false && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                  {t.unavailable}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="suggestion-name" className="block text-sm font-medium text-gray-700 mb-2">{t.yourName}</label>
                    <Input id="suggestion-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12" />
                  </div>
                  <div>
                    <label htmlFor="suggestion-email" className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
                    <Input id="suggestion-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12" />
                  </div>
                </div>
                <div>
                  <label htmlFor="suggestion-type" className="block text-sm font-medium text-gray-700 mb-2">{t.suggestionType}</label>
                  <select id="suggestion-type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full h-12 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    {Object.entries(t.types).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="suggestion-text" className="block text-sm font-medium text-gray-700 mb-2">{t.suggestion}</label>
                  <Textarea id="suggestion-text" value={formData.suggestion} onChange={(e) => setFormData({...formData, suggestion: e.target.value})} required className="h-40" placeholder={t.placeholder} />
                </div>
                <Button type="submit" disabled={submitting || storageReady !== true} className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-lg">
                  {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                  {t.submit}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}