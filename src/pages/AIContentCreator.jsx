import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Sparkles, Heart, MessageCircle, Gift, Calendar, Loader2, Copy, Check, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    title: "AI Content Creator",
    subtitle: "Let AI help you create personalized content for your relationship",
    back: "Back",
    contentType: "Content Type",
    contentTypes: {
      loveNote: "Love Note",
      apology: "Apology Message",
      anniversary: "Anniversary Message",
      dateIdea: "Date Night Idea",
      conversation: "Conversation Starter",
      appreciation: "Words of Appreciation"
    },
    tone: "Tone",
    tones: { romantic: "Romantic", playful: "Playful", sincere: "Sincere", passionate: "Passionate", sweet: "Sweet", funny: "Funny" },
    length: "Length",
    lengths: { short: "Short", medium: "Medium", long: "Long" },
    additionalDetails: "Additional Details (Optional)",
    detailsPlaceholder: "Add any specific details, memories, or context...",
    partnerName: "Partner's Name (Optional)",
    partnerNamePlaceholder: "Your partner's name",
    generate: "Generate with AI",
    generating: "Creating...",
    result: "Your Generated Content",
    copy: "Copy",
    copied: "Copied!",
    download: "Download",
    regenerate: "Generate Again",
    edit: "Edit & Personalize"
  },
  es: {
    title: "Creador de Contenido IA",
    subtitle: "Deja que la IA te ayude a crear contenido personalizado para tu relación",
    back: "Volver",
    contentType: "Tipo de Contenido",
    contentTypes: {
      loveNote: "Nota de Amor",
      apology: "Mensaje de Disculpa",
      anniversary: "Mensaje de Aniversario",
      dateIdea: "Idea para Cita",
      conversation: "Iniciador de Conversación",
      appreciation: "Palabras de Apreciación"
    },
    tone: "Tono",
    tones: { romantic: "Romántico", playful: "Juguetón", sincere: "Sincero", passionate: "Apasionado", sweet: "Dulce", funny: "Divertido" },
    length: "Longitud",
    lengths: { short: "Corto", medium: "Medio", long: "Largo" },
    additionalDetails: "Detalles Adicionales (Opcional)",
    detailsPlaceholder: "Agrega detalles específicos, recuerdos o contexto...",
    partnerName: "Nombre de tu Pareja (Opcional)",
    partnerNamePlaceholder: "Nombre de tu pareja",
    generate: "Generar con IA",
    generating: "Creando...",
    result: "Tu Contenido Generado",
    copy: "Copiar",
    copied: "¡Copiado!",
    download: "Descargar",
    regenerate: "Generar Nuevamente",
    edit: "Editar y Personalizar"
  },
  fr: {
    title: "Créateur de Contenu IA",
    subtitle: "Laissez l'IA vous aider à créer du contenu personnalisé pour votre relation",
    back: "Retour",
    contentType: "Type de Contenu",
    contentTypes: {
      loveNote: "Note d'Amour",
      apology: "Message d'Excuses",
      anniversary: "Message d'Anniversaire",
      dateIdea: "Idée de Rendez-vous",
      conversation: "Démarreur de Conversation",
      appreciation: "Mots d'Appréciation"
    },
    tone: "Ton",
    tones: { romantic: "Romantique", playful: "Enjoué", sincere: "Sincère", passionate: "Passionné", sweet: "Doux", funny: "Drôle" },
    length: "Longueur",
    lengths: { short: "Court", medium: "Moyen", long: "Long" },
    additionalDetails: "Détails Supplémentaires (Optionnel)",
    detailsPlaceholder: "Ajoutez des détails spécifiques, des souvenirs ou du contexte...",
    partnerName: "Nom du Partenaire (Optionnel)",
    partnerNamePlaceholder: "Nom de votre partenaire",
    generate: "Générer avec IA",
    generating: "Création...",
    result: "Votre Contenu Généré",
    copy: "Copier",
    copied: "Copié!",
    download: "Télécharger",
    regenerate: "Générer à Nouveau",
    edit: "Modifier et Personnaliser"
  },
  it: {
    title: "Creatore di Contenuti IA",
    subtitle: "Lascia che l'IA ti aiuti a creare contenuti personalizzati per la tua relazione",
    back: "Indietro",
    contentType: "Tipo di Contenuto",
    contentTypes: {
      loveNote: "Nota d'Amore",
      apology: "Messaggio di Scuse",
      anniversary: "Messaggio di Anniversario",
      dateIdea: "Idea per Appuntamento",
      conversation: "Avviatore di Conversazione",
      appreciation: "Parole di Apprezzamento"
    },
    tone: "Tono",
    tones: { romantic: "Romantico", playful: "Giocoso", sincere: "Sincero", passionate: "Appassionato", sweet: "Dolce", funny: "Divertente" },
    length: "Lunghezza",
    lengths: { short: "Breve", medium: "Media", long: "Lungo" },
    additionalDetails: "Dettagli Aggiuntivi (Opzionale)",
    detailsPlaceholder: "Aggiungi dettagli specifici, ricordi o contesto...",
    partnerName: "Nome del Partner (Opzionale)",
    partnerNamePlaceholder: "Nome del tuo partner",
    generate: "Genera con IA",
    generating: "Creazione...",
    result: "Il Tuo Contenuto Generato",
    copy: "Copia",
    copied: "Copiato!",
    download: "Scarica",
    regenerate: "Genera di Nuovo",
    edit: "Modifica e Personalizza"
  },
  de: {
    title: "KI-Content-Ersteller",
    subtitle: "Lassen Sie KI Ihnen helfen, personalisierten Inhalt für Ihre Beziehung zu erstellen",
    back: "Zurück",
    contentType: "Inhaltstyp",
    contentTypes: {
      loveNote: "Liebesbotschaft",
      apology: "Entschuldigungsnachricht",
      anniversary: "Jubiläumsnachricht",
      dateIdea: "Date-Idee",
      conversation: "Gesprächsstarter",
      appreciation: "Wertschätzungsworte"
    },
    tone: "Ton",
    tones: { romantic: "Romantisch", playful: "Verspielt", sincere: "Aufrichtig", passionate: "Leidenschaftlich", sweet: "Süß", funny: "Lustig" },
    length: "Länge",
    lengths: { short: "Kurz", medium: "Mittel", long: "Lang" },
    additionalDetails: "Zusätzliche Details (Optional)",
    detailsPlaceholder: "Fügen Sie spezifische Details, Erinnerungen oder Kontext hinzu...",
    partnerName: "Name des Partners (Optional)",
    partnerNamePlaceholder: "Name Ihres Partners",
    generate: "Mit KI Generieren",
    generating: "Erstellen...",
    result: "Ihr Generierter Inhalt",
    copy: "Kopieren",
    copied: "Kopiert!",
    download: "Herunterladen",
    regenerate: "Erneut Generieren",
    edit: "Bearbeiten & Personalisieren"
  }
};

export default function AIContentCreator() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState({
    contentType: "",
    tone: "",
    length: "medium",
    details: "",
    partnerName: ""
  });
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const contentTypeIcons = {
    loveNote: Heart,
    apology: MessageCircle,
    anniversary: Calendar,
    dateIdea: Gift,
    conversation: MessageCircle,
    appreciation: Heart
  };

  const handleGenerate = async () => {
    if (!formData.contentType || !formData.tone) {
      toast.error("Please select content type and tone");
      return;
    }

    setIsGenerating(true);

    try {
      const lengthGuide = {
        short: "50-100 words",
        medium: "150-250 words",
        long: "300-400 words"
      };

      const prompt = `Create a ${formData.tone} ${formData.contentType} for someone's romantic partner. 
      ${formData.partnerName ? `The partner's name is ${formData.partnerName}.` : ''}
      Length: ${lengthGuide[formData.length]}.
      ${formData.details ? `Additional context: ${formData.details}` : ''}
      
      Make it heartfelt, genuine, and personal. Use beautiful language and emotional depth.`;

      // TODO: Implement AI content generation with Supabase Edge Functions or external AI service (OpenAI, Anthropic, etc.)
      // This requires setting up an Edge Function that calls an AI API
      throw new Error('AI Content Creator feature requires implementation with Supabase Edge Functions or external AI service');
      
      // Example implementation would be:
      // const { data, error } = await supabase.functions.invoke('generate-content', {
      //   body: { prompt, contentType, tone, length, partnerName, details }
      // });
      // if (error) throw error;
      // setGeneratedContent(data.content);
      
      toast.error('AI Content Creator feature requires implementation');
    } catch (error) {
      toast.error("Failed to generate content. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.contentType}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Generate Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.contentType} *
                </label>
                <Select value={formData.contentType} onValueChange={(value) => setFormData({...formData, contentType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.contentType} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.contentTypes).map(([key, label]) => {
                      const Icon = contentTypeIcons[key];
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.tone} *
                </label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({...formData, tone: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.tone} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.tones).map(([key, label]) => (
                      <SelectItem key={key} value={label.toLowerCase()}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.length}
                </label>
                <Select value={formData.length} onValueChange={(value) => setFormData({...formData, length: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.lengths).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.partnerName}
                </label>
                <Input
                  value={formData.partnerName}
                  onChange={(e) => setFormData({...formData, partnerName: e.target.value})}
                  placeholder={t.partnerNamePlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.additionalDetails}
                </label>
                <Textarea
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  placeholder={t.detailsPlaceholder}
                  className="min-h-32"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold text-lg py-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t.generate}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.result}</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {generatedContent ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {generatedContent}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="flex-1"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            {t.copied}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            {t.copy}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t.download}
                      </Button>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t.regenerate}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Fill in the form and click generate to create AI-powered content
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}