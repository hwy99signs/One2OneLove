import React, { useState } from "react";
import { Heart, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/Layout";

const translations = {
  en: { title: "Share Your Relationship Story", storyType: "Story Type", storyTitle: "Title", yourStory: "Your Story", relationshipLength: "Relationship Length", tags: "Tags (comma separated)", postAnonymously: "Post anonymously if approved", review: "Every new story is submitted for review first. It will not become public unless it is approved.", cancel: "Cancel", shareStory: "Submit for Review", types: { success: "💕 Success Story", challenge: "💪 Challenge Overcome", advice: "💡 Heartfelt Advice", milestone: "🏆 Beautiful Milestone", transformation: "✨ Relationship Transformation" }, placeholders: { title: "Give your story a clear title...", story: "Share the experience you would like the community to learn from...", length: "e.g., 2 years", tags: "e.g., communication, trust, growth" } },
  es: { title: "Comparte Tu Historia de Relación", storyType: "Tipo de Historia", storyTitle: "Título", yourStory: "Tu Historia", relationshipLength: "Duración de la Relación", tags: "Etiquetas (separadas por comas)", postAnonymously: "Publicar de forma anónima si se aprueba", review: "Cada nueva historia se envía primero a revisión. No será pública a menos que sea aprobada.", cancel: "Cancelar", shareStory: "Enviar para Revisión", types: { success: "💕 Historia de Éxito", challenge: "💪 Desafío Superado", advice: "💡 Consejo Sincero", milestone: "🏆 Hermoso Hito", transformation: "✨ Transformación de la Relación" }, placeholders: { title: "Dale un título claro a tu historia...", story: "Comparte la experiencia que deseas que la comunidad conozca...", length: "ej., 2 años", tags: "ej., comunicación, confianza, crecimiento" } },
  fr: { title: "Partagez Votre Histoire Relationnelle", storyType: "Type d’Histoire", storyTitle: "Titre", yourStory: "Votre Histoire", relationshipLength: "Durée de la Relation", tags: "Tags (séparés par des virgules)", postAnonymously: "Publier anonymement si approuvé", review: "Chaque nouvelle histoire est d’abord soumise à examen. Elle ne devient publique qu’après approbation.", cancel: "Annuler", shareStory: "Soumettre pour Examen", types: { success: "💕 Histoire de Succès", challenge: "💪 Défi Surmonté", advice: "💡 Conseil Sincère", milestone: "🏆 Beau Jalon", transformation: "✨ Transformation Relationnelle" }, placeholders: { title: "Donnez un titre clair à votre histoire...", story: "Partagez l’expérience dont vous souhaitez faire profiter la communauté...", length: "ex., 2 ans", tags: "ex., communication, confiance, croissance" } },
  it: { title: "Condividi la Tua Storia di Relazione", storyType: "Tipo di Storia", storyTitle: "Titolo", yourStory: "La Tua Storia", relationshipLength: "Durata della Relazione", tags: "Tag (separati da virgole)", postAnonymously: "Pubblica in forma anonima se approvata", review: "Ogni nuova storia viene prima inviata alla revisione. Non diventerà pubblica senza approvazione.", cancel: "Annulla", shareStory: "Invia per Revisione", types: { success: "💕 Storia di Successo", challenge: "💪 Sfida Superata", advice: "💡 Consiglio Sincero", milestone: "🏆 Bellissimo Traguardo", transformation: "✨ Trasformazione della Relazione" }, placeholders: { title: "Dai un titolo chiaro alla tua storia...", story: "Condividi l’esperienza che vorresti far conoscere alla community...", length: "es., 2 anni", tags: "es., comunicazione, fiducia, crescita" } },
  de: { title: "Teile Deine Beziehungsgeschichte", storyType: "Geschichtentyp", storyTitle: "Titel", yourStory: "Deine Geschichte", relationshipLength: "Beziehungsdauer", tags: "Tags (durch Kommas getrennt)", postAnonymously: "Bei Genehmigung anonym veröffentlichen", review: "Jede neue Geschichte wird zuerst zur Prüfung eingereicht. Sie wird nur nach Genehmigung öffentlich.", cancel: "Abbrechen", shareStory: "Zur Prüfung Einreichen", types: { success: "💕 Erfolgsgeschichte", challenge: "💪 Herausforderung Überwunden", advice: "💡 Herzlicher Rat", milestone: "🏆 Besonderer Meilenstein", transformation: "✨ Beziehungsveränderung" }, placeholders: { title: "Gib deiner Geschichte einen klaren Titel...", story: "Teile die Erfahrung, von der die Community lernen kann...", length: "z.B., 2 Jahre", tags: "z.B., Kommunikation, Vertrauen, Wachstum" } },
};

export default function PostStoryForm({ onSubmit, onCancel }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState({ story_type: "success", title: "", content: "", is_anonymous: true, relationship_length: "", tags: "" });

  const handleSubmit = (event) => {
    event.preventDefault();
    const tags = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
    onSubmit({ ...formData, tags });
  };

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-2xl"><Heart className="h-6 w-6" aria-hidden="true" />{t.title}</CardTitle><button type="button" onClick={onCancel} aria-label={t.cancel} className="rounded-lg p-1 text-white hover:bg-white/10"><X className="h-6 w-6" aria-hidden="true" /></button></div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-5 flex gap-3 rounded-xl bg-purple-50 p-4 text-sm leading-6 text-purple-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{t.review}</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">{t.storyType} *<Select value={formData.story_type} onValueChange={(value) => setFormData({ ...formData, story_type: value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(t.types).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
          <label className="block text-sm font-semibold text-gray-700">{t.storyTitle} *<Input className="mt-2" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder={t.placeholders.title} minLength={3} maxLength={160} required /></label>
          <label className="block text-sm font-semibold text-gray-700">{t.yourStory} *<Textarea className="mt-2 min-h-36" value={formData.content} onChange={(event) => setFormData({ ...formData, content: event.target.value })} placeholder={t.placeholders.story} minLength={20} maxLength={10000} required /></label>
          <label className="block text-sm font-semibold text-gray-700">{t.relationshipLength}<Input className="mt-2" value={formData.relationship_length} onChange={(event) => setFormData({ ...formData, relationship_length: event.target.value })} placeholder={t.placeholders.length} maxLength={120} /></label>
          <label className="block text-sm font-semibold text-gray-700">{t.tags}<Input className="mt-2" value={formData.tags} onChange={(event) => setFormData({ ...formData, tags: event.target.value })} placeholder={t.placeholders.tags} maxLength={300} /></label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={formData.is_anonymous} onChange={(event) => setFormData({ ...formData, is_anonymous: event.target.checked })} className="h-4 w-4 rounded text-purple-600 focus:ring-purple-500" /><span className="text-sm text-gray-700">{t.postAnonymously}</span></label>
          <div className="flex gap-3 pt-3"><Button type="button" variant="outline" className="flex-1" onClick={onCancel}>{t.cancel}</Button><Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">{t.shareStory}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
