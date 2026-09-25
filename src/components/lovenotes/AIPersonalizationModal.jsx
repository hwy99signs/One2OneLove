import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { generateRelationshipContent } from "@/lib/aiService";

const LOVE_NOTE_MAX_CHARACTERS = 171;
const sanitizeGeneratedLoveNote = (value) => Array.from(String(value || "").replace(/\p{Extended_Pictographic}/gu, "").trim()).slice(0, LOVE_NOTE_MAX_CHARACTERS).join("");
import { toast } from "sonner";

const personalityTraits = [
  "adventurous", "introverted", "extroverted", "sentimental", "humorous",
  "romantic", "practical", "creative", "analytical", "spontaneous",
  "thoughtful", "playful", "serious", "passionate", "calm"
];

const COPY = {
  en: {
    title:"AI-Personalized Love Note", close:"Close", personality:"Partner’s Personality Traits *", traitHelp:"Select 2–5 traits that best describe your partner",
    noteStyle:"Note Style", sharedMemories:"Shared Memories (Optional)", sharedPlaceholder:"E.g., our first date at the beach, getting lost in Paris, or stargazing on our anniversary…",
    sharedHelp:"The AI will naturally weave these into the note", insideJokes:"Inside Jokes (Optional)", insidePlaceholder:"E.g., you always steal my fries, the way you pronounce croissant, or our secret superhero names…",
    insideHelp:"Add personal touches only you two understand", how:"✨ How it works:", steps:["AI analyzes your partner's personality traits","Crafts a unique note in your chosen tone","Weaves in your shared memories naturally","Adds subtle references to your inside jokes"],
    cancel:"Cancel", generating:"Generating…", generate:"Generate Love Note", chooseTrait:"Please select at least one personality trait", success:"Personalized note generated! 💕",
    error:"Failed to generate note. Please try again.", noContent:"AI personalization returned no content.",
    traits:{adventurous:"Adventurous",introverted:"Introverted",extroverted:"Extroverted",sentimental:"Sentimental",humorous:"Humorous",romantic:"Romantic",practical:"Practical",creative:"Creative",analytical:"Analytical",spontaneous:"Spontaneous",thoughtful:"Thoughtful",playful:"Playful",serious:"Serious",passionate:"Passionate",calm:"Calm"},
    styles:{romantic:"Romantic",playful:"Playful",deep:"Deep"}
  },
  es: {
    title:"Nota de Amor Personalizada con IA", close:"Cerrar", personality:"Rasgos de Personalidad de tu Pareja *", traitHelp:"Selecciona de 2 a 5 rasgos que describan mejor a tu pareja",
    noteStyle:"Estilo de la Nota", sharedMemories:"Recuerdos Compartidos (Opcional)", sharedPlaceholder:"Ej.: nuestra primera cita en la playa, cuando nos perdimos en París o mirar las estrellas en nuestro aniversario…",
    sharedHelp:"La IA incorporará estos recuerdos de forma natural", insideJokes:"Bromas Internas (Opcional)", insidePlaceholder:"Ej.: siempre me robas las papas fritas, cómo pronuncias croissant o nuestros nombres secretos de superhéroes…",
    insideHelp:"Añade detalles personales que solo ustedes dos entienden", how:"✨ Cómo funciona:", steps:["La IA analiza los rasgos de personalidad de tu pareja","Crea una nota única con el tono que elijas","Integra naturalmente sus recuerdos compartidos","Añade referencias sutiles a sus bromas internas"],
    cancel:"Cancelar", generating:"Generando…", generate:"Generar Nota de Amor", chooseTrait:"Selecciona al menos un rasgo de personalidad", success:"¡Nota personalizada generada! 💕",
    error:"No se pudo generar la nota. Inténtalo de nuevo.", noContent:"La personalización con IA no devolvió contenido.",
    traits:{adventurous:"Aventurero/a",introverted:"Introvertido/a",extroverted:"Extrovertido/a",sentimental:"Sentimental",humorous:"Con sentido del humor",romantic:"Romántico/a",practical:"Práctico/a",creative:"Creativo/a",analytical:"Analítico/a",spontaneous:"Espontáneo/a",thoughtful:"Atento/a",playful:"Juguetón/a",serious:"Serio/a",passionate:"Apasionado/a",calm:"Tranquilo/a"},
    styles:{romantic:"Romántica",playful:"Juguetona",deep:"Profunda"}
  },
  fr: {
    title:"Note d’Amour Personnalisée par IA", close:"Fermer", personality:"Traits de Personnalité de Votre Partenaire *", traitHelp:"Sélectionnez 2 à 5 traits qui décrivent le mieux votre partenaire",
    noteStyle:"Style de la Note", sharedMemories:"Souvenirs Partagés (Facultatif)", sharedPlaceholder:"Ex. : notre premier rendez-vous à la plage, quand nous nous sommes perdus à Paris ou les étoiles lors de notre anniversaire…",
    sharedHelp:"L’IA intégrera naturellement ces souvenirs dans la note", insideJokes:"Blagues Entre Vous (Facultatif)", insidePlaceholder:"Ex. : tu me voles toujours mes frites, ta façon de prononcer croissant ou nos noms secrets de super-héros…",
    insideHelp:"Ajoutez des détails personnels que vous seuls comprenez", how:"✨ Comment ça marche :", steps:["L’IA analyse les traits de personnalité de votre partenaire","Crée une note unique dans le ton choisi","Intègre naturellement vos souvenirs partagés","Ajoute des références subtiles à vos blagues privées"],
    cancel:"Annuler", generating:"Génération…", generate:"Générer une Note d’Amour", chooseTrait:"Sélectionnez au moins un trait de personnalité", success:"Note personnalisée générée ! 💕",
    error:"Impossible de générer la note. Veuillez réessayer.", noContent:"La personnalisation par IA n’a renvoyé aucun contenu.",
    traits:{adventurous:"Aventureux/se",introverted:"Introverti/e",extroverted:"Extraverti/e",sentimental:"Sentimental/e",humorous:"Avec de l’humour",romantic:"Romantique",practical:"Pratique",creative:"Créatif/ve",analytical:"Analytique",spontaneous:"Spontané/e",thoughtful:"Attentionné/e",playful:"Joueur/se",serious:"Sérieux/se",passionate:"Passionné/e",calm:"Calme"},
    styles:{romantic:"Romantique",playful:"Joueuse",deep:"Profonde"}
  },
  it: {
    title:"Nota d’Amore Personalizzata con IA", close:"Chiudi", personality:"Tratti della Personalità del Partner *", traitHelp:"Seleziona da 2 a 5 tratti che descrivono meglio il tuo partner",
    noteStyle:"Stile della Nota", sharedMemories:"Ricordi Condivisi (Facoltativo)", sharedPlaceholder:"Es.: il nostro primo appuntamento in spiaggia, quando ci siamo persi a Parigi o le stelle durante il nostro anniversario…",
    sharedHelp:"L’IA integrerà naturalmente questi ricordi nella nota", insideJokes:"Battute tra Voi (Facoltativo)", insidePlaceholder:"Es.: mi rubi sempre le patatine, come pronunci croissant o i nostri nomi segreti da supereroi…",
    insideHelp:"Aggiungi dettagli personali che capite solo voi due", how:"✨ Come funziona:", steps:["L’IA analizza i tratti della personalità del tuo partner","Crea una nota unica con il tono scelto","Integra naturalmente i vostri ricordi condivisi","Aggiunge riferimenti discreti alle vostre battute private"],
    cancel:"Annulla", generating:"Generazione…", generate:"Genera Nota d’Amore", chooseTrait:"Seleziona almeno un tratto della personalità", success:"Nota personalizzata generata! 💕",
    error:"Impossibile generare la nota. Riprova.", noContent:"La personalizzazione con IA non ha restituito contenuti.",
    traits:{adventurous:"Avventuroso/a",introverted:"Introverso/a",extroverted:"Estroverso/a",sentimental:"Sentimentale",humorous:"Spiritoso/a",romantic:"Romantico/a",practical:"Pratico/a",creative:"Creativo/a",analytical:"Analitico/a",spontaneous:"Spontaneo/a",thoughtful:"Premuroso/a",playful:"Giocoso/a",serious:"Serio/a",passionate:"Appassionato/a",calm:"Calmo/a"},
    styles:{romantic:"Romantica",playful:"Giocosa",deep:"Profonda"}
  },
  de: {
    title:"KI-Personalisierte Liebesnachricht", close:"Schließen", personality:"Persönlichkeitsmerkmale Ihres Partners *", traitHelp:"Wählen Sie 2–5 Merkmale, die Ihren Partner am besten beschreiben",
    noteStyle:"Stil der Nachricht", sharedMemories:"Gemeinsame Erinnerungen (Optional)", sharedPlaceholder:"Z. B. unser erstes Date am Strand, als wir uns in Paris verliefen, oder Sterne an unserem Jahrestag…",
    sharedHelp:"Die KI baut diese Erinnerungen natürlich in die Nachricht ein", insideJokes:"Insiderwitze (Optional)", insidePlaceholder:"Z. B. du klaust immer meine Pommes, wie du Croissant aussprichst, oder unsere geheimen Superheldennamen…",
    insideHelp:"Fügen Sie persönliche Details hinzu, die nur Sie beide verstehen", how:"✨ So funktioniert es:", steps:["Die KI analysiert die Persönlichkeitsmerkmale Ihres Partners","Erstellt eine einzigartige Nachricht im gewählten Ton","Verwebt gemeinsame Erinnerungen natürlich","Fügt dezente Hinweise auf Ihre Insiderwitze ein"],
    cancel:"Abbrechen", generating:"Wird erstellt…", generate:"Liebesnachricht Erstellen", chooseTrait:"Wählen Sie mindestens ein Persönlichkeitsmerkmal", success:"Personalisierte Nachricht erstellt! 💕",
    error:"Die Nachricht konnte nicht erstellt werden. Bitte versuchen Sie es erneut.", noContent:"Die KI-Personalisierung hat keinen Inhalt zurückgegeben.",
    traits:{adventurous:"Abenteuerlustig",introverted:"Introvertiert",extroverted:"Extrovertiert",sentimental:"Sentimental",humorous:"Humorvoll",romantic:"Romantisch",practical:"Praktisch",creative:"Kreativ",analytical:"Analytisch",spontaneous:"Spontan",thoughtful:"Aufmerksam",playful:"Verspielt",serious:"Ernst",passionate:"Leidenschaftlich",calm:"Ruhig"},
    styles:{romantic:"Romantisch",playful:"Verspielt",deep:"Tiefgründig"}
  }
};

export default function AIPersonalizationModal({ onClose, onNoteGenerated, currentLanguage }) {
  const [selectedTraits, setSelectedTraits] = useState([]);
  const [sharedMemories, setSharedMemories] = useState("");
  const [insideJokes, setInsideJokes] = useState("");
  const [noteStyle, setNoteStyle] = useState("romantic");
  const [generating, setGenerating] = useState(false);
  const language = ["en","es","fr","it","de"].includes(currentLanguage) ? currentLanguage : "en";
  const t = COPY[language];

  const toggleTrait = (trait) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else {
      setSelectedTraits([...selectedTraits, trait]);
    }
  };

  const generatePersonalizedNote = async () => {
    if (selectedTraits.length === 0) {
      toast.error(t.chooseTrait);
      return;
    }

    setGenerating(true);
    try {
      const details = [
        `Partner personality traits: ${selectedTraits.join(", ")}`,
        sharedMemories ? `Shared memories: ${sharedMemories}` : "",
        insideJokes ? `Inside jokes: ${insideJokes}` : "",
        "Write one concise love note of no more than 171 characters including spaces. Do not use emojis. Naturally weave in the details without inventing facts. Return only the love note text."
      ].filter(Boolean).join("\n");

      const response = await generateRelationshipContent({
        contentType: "loveNote",
        tone: noteStyle,
        length: "medium",
        details,
        partnerName: "",
        language: currentLanguage,
      });

      if (!response) throw new Error(t.noContent);
      const sanitized = sanitizeGeneratedLoveNote(response);
      if (!sanitized) throw new Error(t.noContent);
      onNoteGenerated({
        title: t.title,
        content: sanitized,
        category: noteStyle,
        budget: "free",
        tags: ["ai-generated", "personalized", ...selectedTraits.slice(0, 3)],
        isAIGenerated: true
      });
      toast.success(t.success);
      onClose();
    } catch (error) {
      console.error("Error generating note:", error);
      toast.error(language === "en" ? (error?.message || t.error) : t.error);
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-love-note-title"
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <h2 id="ai-love-note-title" className="text-2xl font-bold">{t.title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label={t.close} className="text-white hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="block text-sm font-bold text-gray-700 mb-3">{t.personality}</p>
            <div className="flex flex-wrap gap-2">
              {personalityTraits.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  aria-pressed={selectedTraits.includes(trait)}
                  onClick={() => toggleTrait(trait)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTraits.includes(trait)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.traits[trait] || trait}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{t.traitHelp}</p>
          </div>

          <div>
            <p className="block text-sm font-bold text-gray-700 mb-2">{t.noteStyle}</p>
            <div className="grid grid-cols-3 gap-3">
              {["romantic", "playful", "deep"].map((style) => (
                <button
                  key={style}
                  type="button"
                  aria-pressed={noteStyle === style}
                  onClick={() => setNoteStyle(style)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all capitalize ${
                    noteStyle === style
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.styles[style] || style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="ai-shared-memories" className="block text-sm font-bold text-gray-700 mb-2">{t.sharedMemories}</label>
            <Textarea
              id="ai-shared-memories"
              value={sharedMemories}
              onChange={(e) => setSharedMemories(e.target.value)}
              placeholder={t.sharedPlaceholder}
              className="h-24"
            />
            <p className="text-xs text-gray-500 mt-1">{t.sharedHelp}</p>
          </div>

          <div>
            <label htmlFor="ai-inside-jokes" className="block text-sm font-bold text-gray-700 mb-2">{t.insideJokes}</label>
            <Textarea
              id="ai-inside-jokes"
              value={insideJokes}
              onChange={(e) => setInsideJokes(e.target.value)}
              placeholder={t.insidePlaceholder}
              className="h-24"
            />
            <p className="text-xs text-gray-500 mt-1">{t.insideHelp}</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4">
            <h4 className="font-bold text-purple-900 mb-2">{t.how}</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              {t.steps.map((step) => <li key={step}>• {step}</li>)}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={generating}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={generatePersonalizedNote}
              disabled={generating || selectedTraits.length === 0}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {generating ? (
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
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}