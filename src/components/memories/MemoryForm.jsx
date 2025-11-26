import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Upload, X, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    editMemory: "Edit Memory",
    createMemory: "Create New Memory",
    memoryTitle: "Memory Title",
    titlePlaceholder: "Our first date, Beach vacation, Anniversary dinner...",
    description: "Description",
    descriptionPlaceholder: "Describe this beautiful moment... what happened, how you felt, what made it special...",
    date: "Date",
    pickDate: "Pick a date",
    location: "Location",
    locationPlaceholder: "Paris, France",
    tags: "Tags (comma-separated)",
    tagsPlaceholder: "romantic, vacation, surprise, anniversary...",
    shareWith: "Share with Partner (Optional)",
    partnerEmailPlaceholder: "partner@email.com",
    partnerEmailHint: "Enter your partner's email to share this memory with them",
    photosVideos: "Photos & Videos",
    uploading: "Uploading...",
    uploadPrompt: "Click to upload photos or videos",
    uploadHint: "PNG, JPG, MP4, MOV up to 10MB each",
    cancel: "Cancel",
    saveMemory: "Save Memory",
    saving: "Saving...",
    uploadSuccess: "file(s) uploaded successfully!",
    uploadFailed: "Failed to upload files"
  },
  es: {
    editMemory: "Editar Recuerdo",
    createMemory: "Crear Nuevo Recuerdo",
    memoryTitle: "Título del Recuerdo",
    titlePlaceholder: "Nuestra primera cita, Vacaciones en la playa, Cena de aniversario...",
    description: "Descripción",
    descriptionPlaceholder: "Describe este hermoso momento... qué sucedió, cómo te sentiste, qué lo hizo especial...",
    date: "Fecha",
    pickDate: "Seleccionar fecha",
    location: "Ubicación",
    locationPlaceholder: "París, Francia",
    tags: "Etiquetas (separadas por comas)",
    tagsPlaceholder: "romántico, vacaciones, sorpresa, aniversario...",
    shareWith: "Compartir con Pareja (Opcional)",
    partnerEmailPlaceholder: "pareja@email.com",
    partnerEmailHint: "Ingresa el correo de tu pareja para compartir este recuerdo",
    photosVideos: "Fotos y Videos",
    uploading: "Subiendo...",
    uploadPrompt: "Haz clic para subir fotos o videos",
    uploadHint: "PNG, JPG, MP4, MOV hasta 10MB cada uno",
    cancel: "Cancelar",
    saveMemory: "Guardar Recuerdo",
    saving: "Guardando...",
    uploadSuccess: "archivo(s) subido(s) exitosamente!",
    uploadFailed: "Error al subir archivos"
  },
  fr: {
    editMemory: "Modifier le Souvenir",
    createMemory: "Créer un Nouveau Souvenir",
    memoryTitle: "Titre du Souvenir",
    titlePlaceholder: "Notre premier rendez-vous, Vacances à la plage, Dîner d'anniversaire...",
    description: "Description",
    descriptionPlaceholder: "Décrivez ce beau moment... ce qui s'est passé, ce que vous avez ressenti, ce qui l'a rendu spécial...",
    date: "Date",
    pickDate: "Choisir une date",
    location: "Lieu",
    locationPlaceholder: "Paris, France",
    tags: "Étiquettes (séparées par des virgules)",
    tagsPlaceholder: "romantique, vacances, surprise, anniversaire...",
    shareWith: "Partager avec Partenaire (Facultatif)",
    partnerEmailPlaceholder: "partenaire@email.com",
    partnerEmailHint: "Entrez l'e-mail de votre partenaire pour partager ce souvenir",
    photosVideos: "Photos et Vidéos",
    uploading: "Téléchargement...",
    uploadPrompt: "Cliquez pour télécharger des photos ou vidéos",
    uploadHint: "PNG, JPG, MP4, MOV jusqu'à 10 Mo chacun",
    cancel: "Annuler",
    saveMemory: "Enregistrer le Souvenir",
    saving: "Enregistrement...",
    uploadSuccess: "fichier(s) téléchargé(s) avec succès!",
    uploadFailed: "Échec du téléchargement des fichiers"
  },
  it: {
    editMemory: "Modifica Ricordo",
    createMemory: "Crea Nuovo Ricordo",
    memoryTitle: "Titolo del Ricordo",
    titlePlaceholder: "Il nostro primo appuntamento, Vacanza in spiaggia, Cena di anniversario...",
    description: "Descrizione",
    descriptionPlaceholder: "Descrivi questo bellissimo momento... cosa è successo, come ti sei sentito, cosa lo ha reso speciale...",
    date: "Data",
    pickDate: "Scegli una data",
    location: "Posizione",
    locationPlaceholder: "Parigi, Francia",
    tags: "Tag (separati da virgole)",
    tagsPlaceholder: "romantico, vacanza, sorpresa, anniversario...",
    shareWith: "Condividi con Partner (Facoltativo)",
    partnerEmailPlaceholder: "partner@email.com",
    partnerEmailHint: "Inserisci l'email del tuo partner per condividere questo ricordo",
    photosVideos: "Foto e Video",
    uploading: "Caricamento...",
    uploadPrompt: "Clicca per caricare foto o video",
    uploadHint: "PNG, JPG, MP4, MOV fino a 10MB ciascuno",
    cancel: "Annulla",
    saveMemory: "Salva Ricordo",
    saving: "Salvataggio...",
    uploadSuccess: "file caricato/i con successo!",
    uploadFailed: "Caricamento dei file non riuscito"
  },
  de: {
    editMemory: "Erinnerung Bearbeiten",
    createMemory: "Neue Erinnerung Erstellen",
    memoryTitle: "Erinnerungstitel",
    titlePlaceholder: "Unser erstes Date, Strandurlaub, Jubiläumsessen...",
    description: "Beschreibung",
    descriptionPlaceholder: "Beschreiben Sie diesen schönen Moment... was ist passiert, wie Sie sich gefühlt haben, was ihn besonders gemacht hat...",
    date: "Datum",
    pickDate: "Datum auswählen",
    location: "Ort",
    locationPlaceholder: "Paris, Frankreich",
    tags: "Tags (durch Kommas getrennt)",
    tagsPlaceholder: "romantisch, urlaub, überraschung, jubiläum...",
    shareWith: "Mit Partner Teilen (Optional)",
    partnerEmailPlaceholder: "partner@email.com",
    partnerEmailHint: "Geben Sie die E-Mail Ihres Partners ein, um diese Erinnerung zu teilen",
    photosVideos: "Fotos & Videos",
    uploading: "Hochladen...",
    uploadPrompt: "Klicken Sie, um Fotos oder Videos hochzuladen",
    uploadHint: "PNG, JPG, MP4, MOV bis zu 10 MB jeweils",
    cancel: "Abbrechen",
    saveMemory: "Erinnerung Speichern",
    saving: "Speichern...",
    uploadSuccess: "Datei(en) erfolgreich hochgeladen!",
    uploadFailed: "Hochladen der Dateien fehlgeschlagen"
  },
  nl: {
    editMemory: "Herinnering Bewerken",
    createMemory: "Nieuwe Herinnering Maken",
    memoryTitle: "Herinneringstitel",
    titlePlaceholder: "Onze eerste date, Strandvakantie, Jubileumdiner...",
    description: "Beschrijving",
    descriptionPlaceholder: "Beschrijf dit mooie moment... wat er gebeurde, hoe je je voelde, wat het speciaal maakte...",
    date: "Datum",
    pickDate: "Kies een datum",
    location: "Locatie",
    locationPlaceholder: "Parijs, Frankrijk",
    tags: "Tags (gescheiden door komma's)",
    tagsPlaceholder: "romantisch, vakantie, verrassing, jubileum...",
    shareWith: "Delen met Partner (Optioneel)",
    partnerEmailPlaceholder: "partner@email.com",
    partnerEmailHint: "Voer de e-mail van je partner in om deze herinnering te delen",
    photosVideos: "Foto's & Video's",
    uploading: "Uploaden...",
    uploadPrompt: "Klik om foto's of video's te uploaden",
    uploadHint: "PNG, JPG, MP4, MOV tot 10MB elk",
    cancel: "Annuleren",
    saveMemory: "Herinnering Opslaan",
    saving: "Opslaan...",
    uploadSuccess: "bestand(en) succesvol geüpload!",
    uploadFailed: "Uploaden van bestanden mislukt"
  },
  pt: {
    editMemory: "Editar Memória",
    createMemory: "Criar Nova Memória",
    memoryTitle: "Título da Memória",
    titlePlaceholder: "Nosso primeiro encontro, Férias na praia, Jantar de aniversário...",
    description: "Descrição",
    descriptionPlaceholder: "Descreva este belo momento... o que aconteceu, como você se sentiu, o que o tornou especial...",
    date: "Data",
    pickDate: "Escolher uma data",
    location: "Localização",
    locationPlaceholder: "Paris, França",
    tags: "Tags (separadas por vírgulas)",
    tagsPlaceholder: "romântico, férias, surpresa, aniversário...",
    shareWith: "Compartilhar com Parceiro (Opcional)",
    partnerEmailPlaceholder: "parceiro@email.com",
    partnerEmailHint: "Digite o e-mail do seu parceiro para compartilhar esta memória",
    photosVideos: "Fotos e Vídeos",
    uploading: "Enviando...",
    uploadPrompt: "Clique para enviar fotos ou vídeos",
    uploadHint: "PNG, JPG, MP4, MOV até 10MB cada",
    cancel: "Cancelar",
    saveMemory: "Salvar Memória",
    saving: "Salvando...",
    uploadSuccess: "arquivo(s) enviado(s) com sucesso!",
    uploadFailed: "Falha ao enviar arquivos"
  }
};

export default function MemoryForm({ memory, onSubmit, onCancel, isLoading }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState({
    title: memory?.title || '',
    description: memory?.description || '',
    memory_date: memory?.memory_date ? new Date(memory.memory_date) : new Date(),
    location: memory?.location || '',
    tags: memory?.tags?.join(', ') || '',
    media_urls: memory?.media_urls || [],
    is_favorite: memory?.is_favorite || false,
    partner_email: memory?.partner_email || '',
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);

  const handleFileUpload = async (files) => {
    setUploadingFiles(true);
    const newUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => [...prev, { name: file.name, status: 'uploading' }]);
        
        // TODO: Implement file upload with Supabase Storage
        // const { data, error } = await supabase.storage
        //   .from('memories')
        //   .upload(`${user.id}/${Date.now()}_${file.name}`, file);
        // if (error) throw error;
        // const { data: { publicUrl } } = supabase.storage
        //   .from('memories')
        //   .getPublicUrl(data.path);
        // const file_url = publicUrl;
        throw new Error('File upload requires Supabase Storage implementation');
        newUrls.push(file_url);
        
        setUploadProgress(prev => 
          prev.map(p => p.name === file.name ? { ...p, status: 'completed' } : p)
        );
      }

      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, ...newUrls]
      }));
      
      toast.success(`${files.length} ${t.uploadSuccess}`);
    } catch (error) {
      toast.error(t.uploadFailed);
    } finally {
      setUploadingFiles(false);
      setUploadProgress([]);
    }
  };

  const handleRemoveMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSubmit({
      ...formData,
      tags: tagsArray,
      memory_date: formData.memory_date instanceof Date 
        ? formData.memory_date.toISOString().split('T')[0]
        : formData.memory_date
    });
  };

  const isVideo = (url) => {
    return url?.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-pink-200"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {memory ? t.editMemory : t.createMemory}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.memoryTitle} *
          </label>
          <Input
            placeholder={t.titlePlaceholder}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="text-lg"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.description}
          </label>
          <Textarea
            placeholder={t.descriptionPlaceholder}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="h-32 resize-none"
          />
        </div>

        {/* Date and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.date} *
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4 text-pink-500" />
                  {formData.memory_date ? format(formData.memory_date, 'PPP') : t.pickDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.memory_date}
                  onSelect={(date) => setFormData({ ...formData, memory_date: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.location}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
              <Input
                placeholder={t.locationPlaceholder}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.tags}
          </label>
          <Input
            placeholder={t.tagsPlaceholder}
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        {/* Partner Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.shareWith}
          </label>
          <Input
            type="email"
            placeholder={t.partnerEmailPlaceholder}
            value={formData.partner_email}
            onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t.partnerEmailHint}
          </p>
        </div>

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.photosVideos}
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              className="hidden"
              id="media-upload"
              disabled={uploadingFiles}
            />
            <label htmlFor="media-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                {uploadingFiles ? t.uploading : t.uploadPrompt}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t.uploadHint}
              </p>
            </label>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                  <span className="text-gray-600">{progress.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Media Preview */}
          {formData.media_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {formData.media_urls.map((url, index) => (
                <div key={index} className="relative group">
                  {isVideo(url) ? (
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <video src={url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={`Memory ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {t.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.saving}
              </>
            ) : (
              <>{t.saveMemory}</>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}