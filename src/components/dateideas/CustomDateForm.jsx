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
    createCustomDate: "Create Custom Date Idea",
    editDate: "Edit Date Idea",
    title: "Date Title",
    titlePlaceholder: "e.g., Sunset Picnic",
    description: "Description",
    descriptionPlaceholder: "Describe your date idea...",
    category: "Category",
    budget: "Budget",
    locationType: "Location Type",
    occasion: "Occasion",
    relationshipStage: "Relationship Stage",
    difficulty: "Difficulty",
    duration: "Duration (hours)",
    shareWithPartner: "Share with partner",
    makePublic: "Share with community",
    cancel: "Cancel",
    save: "Save Date Idea",
    categories: { romantic: "Romantic", adventure: "Adventure", relaxing: "Relaxing", indoor: "Indoor", outdoor: "Outdoor", creative: "Creative" },
    budgets: { free: "Free", low: "Low ($)", medium: "Medium ($$)", high: "High ($$$)" },
    locations: { home: "Home", outdoor: "Outdoor", restaurant: "Restaurant", activity_center: "Activity Center", cultural: "Cultural", nature: "Nature", urban: "Urban" },
    occasions: { regular: "Regular Date", anniversary: "Anniversary", birthday: "Birthday", valentines: "Valentine's Day", special: "Special", apology: "Apology", celebration: "Celebration" },
    stages: { new: "New Relationship", dating: "Dating", committed: "Committed", married: "Married", long_term: "Long-term", any: "Any Stage" },
    difficulties: { easy: "Easy", medium: "Medium", hard: "Hard" }
  }
};

export default function CustomDateForm({ dateIdea, onSubmit, onCancel, isLoading = false }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState(dateIdea || {
    title: "",
    description: "",
    category: "romantic",
    budget: "medium",
    location_type: "outdoor",
    occasion: "regular",
    relationship_stage: "any",
    difficulty: "easy",
    duration_hours: 2,
    is_public: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-white shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6" />
            {dateIdea ? t.editDate : t.createCustomDate}
          </CardTitle>
          <button onClick={onCancel} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.title} *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder={t.titlePlaceholder}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.description} *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t.descriptionPlaceholder}
              className="h-24"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.category}</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.budget}</label>
              <Select value={formData.budget} onValueChange={(value) => setFormData({...formData, budget: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.budgets).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.locationType}</label>
              <Select value={formData.location_type} onValueChange={(value) => setFormData({...formData, location_type: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.locations).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.occasion}</label>
              <Select value={formData.occasion} onValueChange={(value) => setFormData({...formData, occasion: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.occasions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.relationshipStage}</label>
              <Select value={formData.relationship_stage} onValueChange={(value) => setFormData({...formData, relationship_stage: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.stages).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.difficulty}</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(t.difficulties).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.duration}</label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration_hours}
                onChange={(e) => setFormData({...formData, duration_hours: parseFloat(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">{t.makePublic}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              {t.save}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}