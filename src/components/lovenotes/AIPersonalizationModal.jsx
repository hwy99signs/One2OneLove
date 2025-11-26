import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
// AI personalization requires Supabase Edge Functions implementation
import { toast } from "sonner";

const personalityTraits = [
  "adventurous", "introverted", "extroverted", "sentimental", "humorous",
  "romantic", "practical", "creative", "analytical", "spontaneous",
  "thoughtful", "playful", "serious", "passionate", "calm"
];

export default function AIPersonalizationModal({ onClose, onNoteGenerated, currentLanguage }) {
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [sharedMemories, setSharedMemories] = useState("");
  const [insideJokes, setInsideJokes] = useState("");
  const [noteStyle, setNoteStyle] = useState("romantic");
  const [generating, setGenerating] = useState(false);

  const toggleTrait = (trait) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const generatePersonalizedNote = async () => {
    if (selectedTraits.length === 0) {
      toast.error("Please select at least one personality trait");
      return;
    }

    setGenerating(true);
    try {
      const prompt = `Generate a heartfelt, ${noteStyle} love note for my partner with the following characteristics:

Personality traits: ${selectedTraits.join(", ")}
${sharedMemories ? `Shared memories to reference: ${sharedMemories}` : ""}
${insideJokes ? `Inside jokes to incorporate: ${insideJokes}` : ""}

The note should:
- Be tailored to their personality traits
- Feel authentic and personal
- Be 2-3 paragraphs long
- ${sharedMemories ? "Naturally weave in the shared memories" : ""}
- ${insideJokes ? "Subtly include the inside jokes" : ""}
- Be in ${currentLanguage === 'es' ? 'Spanish' : currentLanguage === 'fr' ? 'French' : currentLanguage === 'it' ? 'Italian' : currentLanguage === 'de' ? 'German' : 'English'} language

Return ONLY the love note text, no titles or extra formatting.`;

      // TODO: Implement AI personalization with Supabase Edge Functions
      // const { data, error } = await supabase.functions.invoke('personalize-content', {
      //   body: { prompt, partnerName, selectedTraits, sharedMemories, insideJokes, noteStyle, currentLanguage }
      // });
      // if (error) throw error;
      // const response = data.content;
      
      // For now, show error message
      toast.error('AI personalization feature requires Supabase Edge Functions implementation');
      return;
      
      // Once implemented, uncomment below:
      // onNoteGenerated({
      //   title: "AI-Personalized Love Note",
      //   content: response,
      //   category: noteStyle,
      //   budget: "free",
      //   tags: ["ai-generated", "personalized", ...selectedTraits.slice(0, 3)],
      //   isAIGenerated: true
      // });
      // toast.success("Personalized note generated! 💕");
      // onClose();
    } catch (error) {
      console.error("Error generating note:", error);
      toast.error("Failed to generate note. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">AI-Personalized Love Note</h2>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Partner's Personality Traits *
            </label>
            <div className="flex flex-wrap gap-2">
              {personalityTraits.map((trait) => (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTraits.includes(trait)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Select 2-5 traits that best describe your partner</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Note Style
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["romantic", "playful", "deep"].map((style) => (
                <button
                  key={style}
                  onClick={() => setNoteStyle(style)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all capitalize ${
                    noteStyle === style
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Shared Memories (Optional)
            </label>
            <Textarea
              value={sharedMemories}
              onChange={(e) => setSharedMemories(e.target.value)}
              placeholder="E.g., 'Our first date at the beach, the time we got lost in Paris, stargazing on our anniversary...'"
              className="h-24"
            />
            <p className="text-xs text-gray-500 mt-1">The AI will naturally weave these into the note</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Inside Jokes (Optional)
            </label>
            <Textarea
              value={insideJokes}
              onChange={(e) => setInsideJokes(e.target.value)}
              placeholder="E.g., 'You always steal my fries, the way you pronounce croissant, our secret superhero names...'"
              className="h-24"
            />
            <p className="text-xs text-gray-500 mt-1">Add personal touches only you two understand</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-bold text-purple-900 mb-2">✨ How it works:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• AI analyzes your partner's personality traits</li>
              <li>• Crafts a unique note in their preferred tone</li>
              <li>• Weaves in your shared memories naturally</li>
              <li>• Adds subtle references to your inside jokes</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={generatePersonalizedNote}
              disabled={generating || selectedTraits.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Love Note
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}