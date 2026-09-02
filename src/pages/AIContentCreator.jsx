import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Heart, Loader2, MessageCircle, Gift, Calendar, Sparkles, RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/Layout';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { createPageUrl } from '@/utils';
import { generateRelationshipContent, newAiContentRequestId } from '@/lib/aiContentCreatorService';

const translations = {
  en: {
    title: 'AI Content Creator', subtitle: 'Create a thoughtful starting draft, then make it yours.', back: 'Back',
    safetyNote: 'AI drafts are suggestions, not facts about your relationship. Review anything personal before using it.',
    generator: 'Create relationship content', contentType: 'Content type', tone: 'Tone', length: 'Length',
    partnerName: "Partner's name (optional)", partnerPlaceholder: "Your partner's name", details: 'Details (optional)',
    detailsPlaceholder: 'Add the real details, memories, or context you want the draft to reflect…', generate: 'Generate with AI', generating: 'Creating…',
    result: 'Your draft', resultHint: 'Review and edit it before you send or use it.', emptyResult: 'Your generated draft will appear here. Nothing is automatically sent to anyone.',
    copy: 'Copy', copied: 'Copied!', download: 'Download', again: 'Generate a new version', retry: 'Retry same request', recovered: 'Recovered your completed draft.',
    staged: 'AI generation is staged but not activated in this environment yet.', membership: 'AI Content Creator is a Membership feature.', upgrade: 'View Membership', signIn: 'Sign in',
    limit: 'You reached the current AI usage limit. Try again later.', unavailable: 'AI Content Creator is temporarily unavailable.', selectFirst: 'Choose a content type and tone first.',
    contentTypes: { loveNote: 'Love Note', apology: 'Apology Message', anniversary: 'Anniversary Message', dateIdea: 'Date Night Idea', conversation: 'Conversation Starter', appreciation: 'Words of Appreciation' },
    tones: { romantic: 'Romantic', playful: 'Playful', sincere: 'Sincere', passionate: 'Passionate', sweet: 'Sweet', funny: 'Funny' },
    lengths: { short: 'Short', medium: 'Medium', long: 'Long' },
  },
  es: {
    title: 'Creador de Contenido IA', subtitle: 'Crea un borrador útil y luego hazlo tuyo.', back: 'Volver',
    safetyNote: 'Los borradores de IA son sugerencias, no hechos sobre tu relación. Revisa cualquier contenido personal antes de usarlo.',
    generator: 'Crear contenido para la relación', contentType: 'Tipo de contenido', tone: 'Tono', length: 'Longitud', partnerName: 'Nombre de tu pareja (opcional)', partnerPlaceholder: 'Nombre de tu pareja', details: 'Detalles (opcional)', detailsPlaceholder: 'Agrega detalles, recuerdos o contexto reales que quieras reflejar…', generate: 'Generar con IA', generating: 'Creando…',
    result: 'Tu borrador', resultHint: 'Revísalo y edítalo antes de enviarlo o usarlo.', emptyResult: 'Tu borrador generado aparecerá aquí. No se envía nada automáticamente a nadie.',
    copy: 'Copiar', copied: '¡Copiado!', download: 'Descargar', again: 'Generar una nueva versión', retry: 'Reintentar la misma solicitud', recovered: 'Se recuperó tu borrador completado.',
    staged: 'La generación con IA está preparada pero aún no está activada en este entorno.', membership: 'El Creador de Contenido IA es una función de Membresía.', upgrade: 'Ver Membresía', signIn: 'Iniciar sesión', limit: 'Alcanzaste el límite actual de uso de IA. Intenta más tarde.', unavailable: 'El Creador de Contenido IA no está disponible temporalmente.', selectFirst: 'Elige primero el tipo de contenido y el tono.',
    contentTypes: { loveNote: 'Nota de Amor', apology: 'Mensaje de Disculpa', anniversary: 'Mensaje de Aniversario', dateIdea: 'Idea para una Cita', conversation: 'Iniciador de Conversación', appreciation: 'Palabras de Aprecio' },
    tones: { romantic: 'Romántico', playful: 'Juguetón', sincere: 'Sincero', passionate: 'Apasionado', sweet: 'Dulce', funny: 'Divertido' }, lengths: { short: 'Corto', medium: 'Medio', long: 'Largo' },
  },
  fr: {
    title: 'Créateur de Contenu IA', subtitle: 'Créez un bon premier brouillon, puis personnalisez-le.', back: 'Retour',
    safetyNote: 'Les brouillons IA sont des suggestions, pas des faits sur votre relation. Relisez tout contenu personnel avant de l’utiliser.',
    generator: 'Créer du contenu relationnel', contentType: 'Type de contenu', tone: 'Ton', length: 'Longueur', partnerName: 'Nom du partenaire (facultatif)', partnerPlaceholder: 'Nom de votre partenaire', details: 'Détails (facultatif)', detailsPlaceholder: 'Ajoutez les vrais détails, souvenirs ou contexte à refléter…', generate: "Générer avec l'IA", generating: 'Création…',
    result: 'Votre brouillon', resultHint: "Relisez-le et modifiez-le avant de l'envoyer ou de l'utiliser.", emptyResult: 'Votre brouillon généré apparaîtra ici. Rien n’est envoyé automatiquement à qui que ce soit.',
    copy: 'Copier', copied: 'Copié !', download: 'Télécharger', again: 'Générer une nouvelle version', retry: 'Réessayer la même demande', recovered: 'Votre brouillon terminé a été récupéré.',
    staged: "La génération IA est préparée mais n'est pas encore activée dans cet environnement.", membership: 'Le Créateur de Contenu IA est une fonction d’adhésion.', upgrade: "Voir l'abonnement", signIn: 'Se connecter', limit: "Vous avez atteint la limite actuelle d'utilisation de l'IA. Réessayez plus tard.", unavailable: 'Le Créateur de Contenu IA est temporairement indisponible.', selectFirst: "Choisissez d'abord le type de contenu et le ton.",
    contentTypes: { loveNote: "Mot d'Amour", apology: "Message d'Excuses", anniversary: "Message d'Anniversaire", dateIdea: 'Idée de Rendez-vous', conversation: 'Début de Conversation', appreciation: "Mots d'Appréciation" },
    tones: { romantic: 'Romantique', playful: 'Enjoué', sincere: 'Sincère', passionate: 'Passionné', sweet: 'Doux', funny: 'Drôle' }, lengths: { short: 'Court', medium: 'Moyen', long: 'Long' },
  },
  it: {
    title: 'Creatore di Contenuti IA', subtitle: 'Crea una buona prima bozza, poi rendila tua.', back: 'Indietro',
    safetyNote: 'Le bozze IA sono suggerimenti, non fatti sulla tua relazione. Rivedi qualsiasi contenuto personale prima di usarlo.',
    generator: 'Crea contenuti per la relazione', contentType: 'Tipo di contenuto', tone: 'Tono', length: 'Lunghezza', partnerName: 'Nome del partner (facoltativo)', partnerPlaceholder: 'Nome del tuo partner', details: 'Dettagli (facoltativo)', detailsPlaceholder: 'Aggiungi dettagli, ricordi o contesto reali da riflettere…', generate: 'Genera con IA', generating: 'Creazione…',
    result: 'La tua bozza', resultHint: 'Rileggila e modificala prima di inviarla o usarla.', emptyResult: 'La bozza generata apparirà qui. Nulla viene inviato automaticamente a nessuno.',
    copy: 'Copia', copied: 'Copiato!', download: 'Scarica', again: 'Genera una nuova versione', retry: 'Riprova la stessa richiesta', recovered: 'La tua bozza completata è stata recuperata.',
    staged: 'La generazione IA è pronta ma non è ancora attivata in questo ambiente.', membership: 'Il Creatore di Contenuti IA è una funzione di abbonamento.', upgrade: 'Vedi Abbonamento', signIn: 'Accedi', limit: "Hai raggiunto il limite attuale di utilizzo dell'IA. Riprova più tardi.", unavailable: 'Il Creatore di Contenuti IA è temporaneamente non disponibile.', selectFirst: 'Scegli prima il tipo di contenuto e il tono.',
    contentTypes: { loveNote: "Nota d'Amore", apology: 'Messaggio di Scuse', anniversary: 'Messaggio di Anniversario', dateIdea: 'Idea per Appuntamento', conversation: 'Spunto di Conversazione', appreciation: 'Parole di Apprezzamento' },
    tones: { romantic: 'Romantico', playful: 'Giocoso', sincere: 'Sincero', passionate: 'Appassionato', sweet: 'Dolce', funny: 'Divertente' }, lengths: { short: 'Breve', medium: 'Media', long: 'Lunga' },
  },
  de: {
    title: 'KI-Content-Ersteller', subtitle: 'Erstellen Sie einen guten ersten Entwurf und machen Sie ihn dann zu Ihrem eigenen.', back: 'Zurück',
    safetyNote: 'KI-Entwürfe sind Vorschläge, keine Tatsachen über Ihre Beziehung. Prüfen Sie persönliche Inhalte, bevor Sie sie verwenden.',
    generator: 'Beziehungsinhalt erstellen', contentType: 'Inhaltstyp', tone: 'Ton', length: 'Länge', partnerName: 'Name des Partners (optional)', partnerPlaceholder: 'Name Ihres Partners', details: 'Details (optional)', detailsPlaceholder: 'Fügen Sie echte Details, Erinnerungen oder Kontext hinzu…', generate: 'Mit KI generieren', generating: 'Wird erstellt…',
    result: 'Ihr Entwurf', resultHint: 'Prüfen und bearbeiten Sie ihn vor dem Senden oder Verwenden.', emptyResult: 'Ihr erstellter Entwurf erscheint hier. Nichts wird automatisch an andere gesendet.',
    copy: 'Kopieren', copied: 'Kopiert!', download: 'Herunterladen', again: 'Neue Version generieren', retry: 'Dieselbe Anfrage erneut versuchen', recovered: 'Ihr fertiger Entwurf wurde wiederhergestellt.',
    staged: 'Die KI-Generierung ist vorbereitet, aber in dieser Umgebung noch nicht aktiviert.', membership: 'Der KI-Content-Ersteller ist eine Mitgliedschaftsfunktion.', upgrade: 'Mitgliedschaft ansehen', signIn: 'Anmelden', limit: 'Sie haben das aktuelle KI-Nutzungslimit erreicht. Versuchen Sie es später erneut.', unavailable: 'Der KI-Content-Ersteller ist vorübergehend nicht verfügbar.', selectFirst: 'Wählen Sie zuerst Inhaltstyp und Ton.',
    contentTypes: { loveNote: 'Liebesbotschaft', apology: 'Entschuldigung', anniversary: 'Jubiläumsnachricht', dateIdea: 'Date-Idee', conversation: 'Gesprächsstarter', appreciation: 'Worte der Wertschätzung' },
    tones: { romantic: 'Romantisch', playful: 'Verspielt', sincere: 'Aufrichtig', passionate: 'Leidenschaftlich', sweet: 'Liebevoll', funny: 'Lustig' }, lengths: { short: 'Kurz', medium: 'Mittel', long: 'Lang' },
  },
  nl: {
    title: 'AI Contentmaker', subtitle: 'Maak een sterke eerste versie en pas die daarna aan tot hij echt van jou is.', back: 'Terug',
    safetyNote: 'AI-concepten zijn suggesties, geen feiten over je relatie. Controleer persoonlijke inhoud voordat je die gebruikt.',
    generator: 'Relatiecontent maken', contentType: 'Soort content', tone: 'Toon', length: 'Lengte', partnerName: 'Naam van je partner (optioneel)', partnerPlaceholder: 'Naam van je partner', details: 'Details (optioneel)', detailsPlaceholder: 'Voeg echte details, herinneringen of context toe die je wilt laten terugkomen…', generate: 'Genereren met AI', generating: 'Bezig met maken…',
    result: 'Je concept', resultHint: 'Lees en bewerk het voordat je het verstuurt of gebruikt.', emptyResult: 'Je gegenereerde concept verschijnt hier. Er wordt niets automatisch naar iemand verzonden.',
    copy: 'Kopiëren', copied: 'Gekopieerd!', download: 'Downloaden', again: 'Nieuwe versie genereren', retry: 'Dezelfde aanvraag opnieuw proberen', recovered: 'Je voltooide concept is hersteld.',
    staged: 'AI-generatie is voorbereid maar in deze omgeving nog niet geactiveerd.', membership: 'AI Contentmaker is een lidmaatschapsfunctie.', upgrade: 'Bekijk Lidmaatschap', signIn: 'Inloggen', limit: 'Je hebt de huidige AI-gebruikslimiet bereikt. Probeer het later opnieuw.', unavailable: 'AI Contentmaker is tijdelijk niet beschikbaar.', selectFirst: 'Kies eerst het soort content en de toon.',
    contentTypes: { loveNote: 'Liefdesbriefje', apology: 'Excuses', anniversary: 'Jubileumbericht', dateIdea: 'Date-idee', conversation: 'Gespreksstarter', appreciation: 'Woorden van waardering' },
    tones: { romantic: 'Romantisch', playful: 'Speels', sincere: 'Oprecht', passionate: 'Gepassioneerd', sweet: 'Lief', funny: 'Grappig' }, lengths: { short: 'Kort', medium: 'Gemiddeld', long: 'Lang' },
  },
};

const CONTENT_ICONS = {
  loveNote: Heart,
  apology: MessageCircle,
  anniversary: Calendar,
  dateIdea: Gift,
  conversation: MessageCircle,
  appreciation: Heart,
};

const STAGED_CODES = new Set(['PREMIUM_AI_NOT_ENABLED', 'MEMBERSHIP_GATING_NOT_READY', 'BACKEND_NOT_CONFIGURED']);

export default function AIContentCreator() {
  const { currentLanguage } = useLanguage();
  const language = translations[currentLanguage] ? currentLanguage : 'en';
  const t = translations[language];
  const navigate = useNavigate();
  const access = useFeatureAccess('ai_content_creator');

  const [formData, setFormData] = useState({ contentType: '', tone: '', length: 'medium', partnerName: '', details: '' });
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastRequestId, setLastRequestId] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  const updateField = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const presentError = (error) => {
    const code = error?.code || error?.message || 'UNKNOWN';
    setGenerationError(code);
    if (STAGED_CODES.has(code)) return t.staged;
    if (code === 'MEMBERSHIP_REQUIRED') return t.membership;
    if (code === 'AUTHENTICATION_REQUIRED' || code === 'EMAIL_NOT_CONFIRMED') return t.signIn;
    if (code === 'AI_USAGE_LIMIT_REACHED') return t.limit;
    if (code === 'REQUEST_IN_PROGRESS' || code === 'AI_RESULT_RECONCILIATION_REQUIRED') return t.unavailable;
    return t.unavailable;
  };

  const handleGenerate = async ({ retrySameRequest = false } = {}) => {
    if (!formData.contentType || !formData.tone) {
      toast.error(t.selectFirst);
      return;
    }

    if (access.needsSignIn) {
      navigate(`/SignIn?returnTo=${encodeURIComponent('/AIContentCreator')}`);
      return;
    }
    if (access.needsUpgrade) {
      navigate('/Subscription');
      return;
    }

    const requestId = retrySameRequest && lastRequestId ? lastRequestId : newAiContentRequestId();
    setLastRequestId(requestId);
    setGenerationError(null);
    setIsGenerating(true);

    try {
      const result = await generateRelationshipContent({ ...formData, language, requestId });
      setGeneratedContent(result.content);
      setGenerationError(null);
      if (result.idempotent) toast.success(t.recovered);
    } catch (error) {
      toast.error(presentError(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      toast.success(t.copied);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t.unavailable);
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `one2onelove-${formData.contentType || 'draft'}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link to={createPageUrl('Home')} className="mb-8 inline-flex items-center rounded-xl px-4 py-2 text-gray-600 transition hover:bg-white/70 hover:text-purple-700">
          <ArrowLeft className="mr-2 h-5 w-5" /> {t.back}
        </Link>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">{t.subtitle}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">{t.safetyNote}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-600" />{t.generator}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.contentType} *</label>
                <Select value={formData.contentType} onValueChange={(value) => updateField('contentType', value)}>
                  <SelectTrigger><SelectValue placeholder={t.contentType} /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.contentTypes).map(([key, label]) => {
                      const Icon = CONTENT_ICONS[key] || Heart;
                      return <SelectItem key={key} value={key}><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.tone} *</label>
                <Select value={formData.tone} onValueChange={(value) => updateField('tone', value)}>
                  <SelectTrigger><SelectValue placeholder={t.tone} /></SelectTrigger>
                  <SelectContent>{Object.entries(t.tones).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.length}</label>
                <Select value={formData.length} onValueChange={(value) => updateField('length', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(t.lengths).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t.partnerName}</label>
                <Input value={formData.partnerName} maxLength={80} onChange={(event) => updateField('partnerName', event.target.value)} placeholder={t.partnerPlaceholder} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{t.details}</label>
                  <span className="text-xs text-gray-400">{formData.details.length}/1200</span>
                </div>
                <Textarea value={formData.details} maxLength={1200} rows={6} onChange={(event) => updateField('details', event.target.value)} placeholder={t.detailsPlaceholder} />
              </div>

              {!access.hasAccess && access.needsUpgrade && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                  {t.membership}
                  <button type="button" onClick={() => navigate('/Subscription')} className="ml-2 font-semibold underline">{t.upgrade}</button>
                </div>
              )}

              <Button onClick={() => void handleGenerate()} disabled={isGenerating || access.isLoading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.generating}</> : <><Sparkles className="mr-2 h-4 w-4" />{t.generate}</>}
              </Button>

              {generationError && lastRequestId && (
                <button type="button" onClick={() => void handleGenerate({ retrySameRequest: true })} disabled={isGenerating} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  <RotateCcw className="h-4 w-4" /> {t.retry}
                </button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{t.result}</CardTitle>
              <p className="text-sm text-gray-500">{t.resultHint}</p>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <Textarea value={generatedContent} onChange={(event) => setGeneratedContent(event.target.value.slice(0, 4000))} rows={16} className="min-h-[360px] bg-white leading-relaxed" />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleCopy}>{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? t.copied : t.copy}</Button>
                    <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />{t.download}</Button>
                    <Button variant="outline" onClick={() => void handleGenerate()} disabled={isGenerating}><RotateCcw className="mr-2 h-4 w-4" />{t.again}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[430px] items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 p-8 text-center">
                  <div>
                    <Sparkles className="mx-auto mb-4 h-12 w-12 text-purple-300" />
                    <p className="font-medium text-gray-600">{t.result}</p>
                    <p className="mt-2 max-w-sm text-sm text-gray-400">{t.emptyResult}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
