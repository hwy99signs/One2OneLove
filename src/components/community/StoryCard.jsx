import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Star, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    featured: "Featured",
    anonymous: "Anonymous",
    helpful: "helpful",
    storyTypes: {
      success: "Success Story",
      challenge: "Challenge Overcome",
      advice: "Heartfelt Advice",
      milestone: "Beautiful Milestone",
      transformation: "Love Transformation"
    }
  },
  es: {
    featured: "Destacado",
    anonymous: "Anónimo",
    helpful: "útil",
    storyTypes: {
      success: "Historia de Éxito",
      challenge: "Desafío Superado",
      advice: "Consejo Sincero",
      milestone: "Hermoso Hito",
      transformation: "Transformación del Amor"
    }
  },
  fr: {
    featured: "En Vedette",
    anonymous: "Anonyme",
    helpful: "utile",
    storyTypes: {
      success: "Histoire de Succès",
      challenge: "Défi Surmonté",
      advice: "Conseil Sincère",
      milestone: "Beau Jalon",
      transformation: "Transformation de l'Amour"
    }
  },
  it: {
    featured: "In Evidenza",
    anonymous: "Anonimo",
    helpful: "utile",
    storyTypes: {
      success: "Storia di Successo",
      challenge: "Sfida Superata",
      advice: "Consiglio Sincero",
      milestone: "Bellissimo Traguardo",
      transformation: "Trasformazione dell'Amore"
    }
  },
  de: {
    featured: "Hervorgehoben",
    anonymous: "Anonym",
    helpful: "hilfreich",
    storyTypes: {
      success: "Erfolgsgeschichte",
      challenge: "Herausforderung Überwunden",
      advice: "Herzlicher Rat",
      milestone: "Wunderschöner Meilenstein",
      transformation: "Liebestransformation"
    }
  }
};

export default function StoryCard({ story, onLike, onMarkHelpful }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const storyTypeColors = {
    success: "bg-green-100 text-green-800",
    challenge: "bg-orange-100 text-orange-800",
    advice: "bg-blue-100 text-blue-800",
    milestone: "bg-purple-100 text-purple-800",
    transformation: "bg-pink-100 text-pink-800"
  };

  const storyTypeIcons = {
    success: "🎉",
    challenge: "💪",
    advice: "💡",
    milestone: "🏆",
    transformation: "✨"
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={storyTypeColors[story.story_type]}>
            {storyTypeIcons[story.story_type]} {t.storyTypes[story.story_type] || story.story_type}
          </Badge>
          {story.is_featured && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 mr-1" />
              {t.featured}
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">{story.title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <span>{story.is_anonymous ? t.anonymous : story.author_name}</span>
          {story.relationship_length && (
            <>
              <span>•</span>
              <span>{story.relationship_length}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 leading-relaxed mb-4 line-clamp-4">{story.content}</p>
        
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {story.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button size="sm" variant="ghost" onClick={() => onLike(story)} className="gap-1">
            <Heart className={`w-4 h-4 ${story.userHasLiked ? 'fill-pink-500 text-pink-500' : ''}`} />
            {story.likes_count || 0}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onMarkHelpful(story)} className="gap-1">
            <ThumbsUp className={`w-4 h-4 ${story.userMarkedHelpful ? 'fill-blue-500 text-blue-500' : ''}`} />
            {story.helpful_count || 0} {t.helpful}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}