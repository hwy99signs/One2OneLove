import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, X } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Share Your Love Story",
    storyType: "Story Type",
    storyTitle: "Title",
    yourStory: "Your Story",
    relationshipLength: "Relationship Length",
    tags: "Tags (comma separated)",
    postAnonymously: "Post anonymously",
    cancel: "Cancel",
    shareStory: "Share Your Story",
    types: {
      success: "💕 Success Story",
      challenge: "💪 Challenge Overcome",
      advice: "💡 Heartfelt Advice",
      milestone: "🏆 Beautiful Milestone",
      transformation: "✨ Love Transformation"
    },
    placeholders: {
      title: "Give your love story a beautiful title...",
      story: "Share your heartwarming experience and inspire others with your journey of love...",
      length: "e.g., 2 years, 6 months of pure bliss",
      tags: "e.g., communication, trust, growth, forever"
    }
  },
  es: {
    title: "Comparte Tu Historia de Amor",
    storyType: "Tipo de Historia",
    storyTitle: "Título",
    yourStory: "Tu Historia",
    relationshipLength: "Duración de la Relación",
    tags: "Etiquetas (separadas por comas)",
    postAnonymously: "Publicar de forma anónima",
    cancel: "Cancelar",
    shareStory: "Comparte Tu Historia",
    types: {
      success: "💕 Historia de Éxito",
      challenge: "💪 Desafío Superado",
      advice: "💡 Consejo Sincero",
      milestone: "🏆 Hermoso Hito",
      transformation: "✨ Transformación del Amor"
    },
    placeholders: {
      title: "Dale un hermoso título a tu historia de amor...",
      story: "Comparte tu experiencia conmovedora e inspira a otros con tu viaje de amor...",
      length: "ej., 2 años, 6 meses de pura felicidad",
      tags: "ej., comunicación, confianza, crecimiento, para siempre"
    }
  },
  fr: {
    title: "Partagez Votre Histoire d'Amour",
    storyType: "Type d'Histoire",
    storyTitle: "Titre",
    yourStory: "Votre Histoire",
    relationshipLength: "Durée de la Relation",
    tags: "Tags (séparés par des virgules)",
    postAnonymously: "Publier anonymement",
    cancel: "Annuler",
    shareStory: "Partagez Votre Histoire",
    types: {
      success: "💕 Histoire de Succès",
      challenge: "💪 Défi Surmonté",
      advice: "💡 Conseil Sincère",
      milestone: "🏆 Beau Jalon",
      transformation: "✨ Transformation de l'Amour"
    },
    placeholders: {
      title: "Donnez un beau titre à votre histoire d'amour...",
      story: "Partagez votre expérience touchante et inspirez les autres avec votre parcours d'amour...",
      length: "ex., 2 ans, 6 mois de pur bonheur",
      tags: "ex., communication, confiance, croissance, pour toujours"
    }
  },
  it: {
    title: "Condividi la Tua Storia d'Amore",
    storyType: "Tipo di Storia",
    storyTitle: "Titolo",
    yourStory: "La Tua Storia",
    relationshipLength: "Durata della Relazione",
    tags: "Tag (separati da virgole)",
    postAnonymously: "Pubblica in modo anonimo",
    cancel: "Annulla",
    shareStory: "Condividi la Tua Storia",
    types: {
      success: "💕 Storia di Successo",
      challenge: "💪 Sfida Superata",
      advice: "💡 Consiglio Sincero",
      milestone: "🏆 Bellissimo Traguardo",
      transformation: "✨ Trasformazione dell'Amore"
    },
    placeholders: {
      title: "Dai un bellissimo titolo alla tua storia d'amore...",
      story: "Condividi la tua esperienza commovente e ispira gli altri con il tuo viaggio d'amore...",
      length: "es., 2 anni, 6 mesi di pura felicità",
      tags: "es., comunicazione, fiducia, crescita, per sempre"
    }
  },
  de: {
    title: "Teile Deine Liebesgeschichte",
    storyType: "Geschichtentyp",
    storyTitle: "Titel",
    yourStory: "Deine Geschichte",
    relationshipLength: "Beziehungsdauer",
    tags: "Tags (durch Kommas getrennt)",
    postAnonymously: "Anonym veröffentlichen",
    cancel: "Abbrechen",
    shareStory: "Teile Deine Geschichte",
    types: {
      success: "💕 Erfolgsgeschichte",
      challenge: "💪 Herausforderung Überwunden",
      advice: "💡 Herzlicher Rat",
      milestone: "🏆 Wunderschöner Meilenstein",
      transformation: "✨ Liebestransformation"
    },
    placeholders: {
      title: "Gib deiner Liebesgeschichte einen wunderschönen Titel...",
      story: "Teile deine herzerwärmende Erfahrung und inspiriere andere mit deiner Liebesreise...",
      length: "z.B., 2 Jahre, 6 Monate reines Glück",
      tags: "z.B., Kommunikation, Vertrauen, Wachstum, für immer"
    }
  }
};

export default function PostStoryForm({ onSubmit, onCancel }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState({
    story_type: "success",
    title: "",
    content: "",
    is_anonymous: true,
    relationship_length: "",
    tags: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    onSubmit({
      ...formData,
      tags: tagsArray
      // moderation_status is automatically set to 'approved' in the service
    });
  };

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6" />
            {t.title}
          </CardTitle>
          <button onClick={onCancel} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.storyType} *</label>
            <Select value={formData.story_type} onValueChange={(value) => setFormData({...formData, story_type: value})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="success">{t.types.success}</SelectItem>
                <SelectItem value="challenge">{t.types.challenge}</SelectItem>
                <SelectItem value="advice">{t.types.advice}</SelectItem>
                <SelectItem value="milestone">{t.types.milestone}</SelectItem>
                <SelectItem value="transformation">{t.types.transformation}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.storyTitle} *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder={t.placeholders.title}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.yourStory} *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder={t.placeholders.story}
              className="h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.relationshipLength}</label>
            <Input
              value={formData.relationship_length}
              onChange={(e) => setFormData({...formData, relationship_length: e.target.value})}
              placeholder={t.placeholders.length}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.tags}</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder={t.placeholders.tags}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_anonymous}
                onChange={(e) => setFormData({...formData, is_anonymous: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">{t.postAnonymously}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              {t.cancel}
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              {t.shareStory}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}