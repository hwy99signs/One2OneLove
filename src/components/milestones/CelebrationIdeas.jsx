import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart, Gift, Calendar, Sparkles, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";

const translations = {
  en: {
    title: "Celebration Ideas",
    subtitle: "Make this milestone extra special with these personalized suggestions",
    loveNotePrompts: "Love Note Prompts",
    dateIdeas: "Date Ideas",
    giftSuggestions: "Gift Suggestions",
    surpriseIdeas: "Surprise Ideas",
    copy: "Copy",
    copied: "Copied!",
    copyFailed: "Could not copy this suggestion.",
    close: "Close",
    milestones: {
      first_date: {
        loveNotes: [
          "Remember our first date? My heart was racing, but the moment I saw you smile, I knew this was the beginning of something beautiful.",
          "That first date changed my life. Thank you for saying yes and for every moment since.",
          "I still get butterflies thinking about our first date. Here's to many more adventures together!"
        ],
        dates: [
          "Recreate your first date - visit the same place, order the same food",
          "Create a photo album of your journey from that first date to now",
          "Have a fancy dinner and reminisce about your first impressions"
        ],
        gifts: [
          "Custom illustration of your first date location",
          "Book about the place where you had your first date",
          "Personalized map with the date and location marked"
        ]
      },
      first_kiss: {
        loveNotes: [
          "Our first kiss... time stood still. That moment will forever be etched in my heart.",
          "I'll never forget the electricity I felt during our first kiss. You took my breath away.",
          "Every kiss since our first has been magical, but that first one? Pure perfection."
        ],
        dates: [
          "Return to the place where you had your first kiss",
          "Watch the sunset together and recreate that moment",
          "Have a romantic picnic where it all began"
        ],
        gifts: [
          "Custom star map showing the night sky from that moment",
          "Framed photo or artwork of the location",
          "Love letter sealed with a kiss (lipstick print!)"
        ]
      },
      first_love: {
        loveNotes: [
          "The day you said 'I love you' first changed everything. Those three words opened up a whole new world.",
          "I remember exactly where we were when you first said 'I love you'. My heart has been yours ever since.",
          "Hearing 'I love you' from you for the first time was like coming home. I love you more every day."
        ],
        dates: [
          "Revisit the place where those words were first spoken",
          "Write love letters to each other and read them over dinner",
          "Create a love story scrapbook together"
        ],
        gifts: [
          "Custom artwork with 'I love you' in different languages",
          "Heartbeat jewelry with the date engraved",
          "Memory box with mementos from your relationship"
        ]
      },
      moving_in: {
        loveNotes: [
          "Moving in together was the best decision we ever made. Coming home to you every day is a dream come true.",
          "Thank you for making our house a home. Every corner holds our memories and love.",
          "Living with you has shown me what true partnership looks like. Here's to our beautiful life together!"
        ],
        dates: [
          "Have a cozy home movie night with blankets and snacks",
          "Cook your favorite meal together in your kitchen",
          "Rearrange furniture or redecorate a room together"
        ],
        gifts: [
          "Custom home address sign or doormat",
          "Personalized home coordinates wall art",
          "Special household item you both wanted"
        ]
      },
      engagement: {
        loveNotes: [
          "The day you said 'yes' was the happiest day of my life. I can't wait to spend forever with you.",
          "When I got down on one knee, my heart was pounding. Your 'yes' made all my dreams come true.",
          "Being engaged to you is a constant reminder that fairytales do exist. I love you, my forever person."
        ],
        dates: [
          "Return to the proposal location for champagne",
          "Plan details of your future together",
          "Look through wedding planning magazines over brunch"
        ],
        gifts: [
          "Custom portrait from the proposal day",
          "Wedding planning journal or countdown calendar",
          "Engraved champagne glasses for toasting"
        ]
      },
      wedding: {
        loveNotes: [
          "Our wedding day was perfect because I married you. Thank you for choosing me as your forever.",
          "Standing at the altar with you, I knew I was the luckiest person alive. Happy Anniversary!",
          "Every year since our wedding has been better than the last. Here's to a lifetime of love and happiness."
        ],
        dates: [
          "Fancy dinner dressed in your wedding attire",
          "Watch your wedding video together with cake",
          "Renew your vows in a private ceremony"
        ],
        gifts: [
          "Wedding photo album or canvas print",
          "Jewelry to commemorate the years together",
          "Weekend getaway to a romantic destination"
        ]
      },
      anniversary: {
        loveNotes: [
          "Another year of loving you, another year of memories. Happy Anniversary to my everything!",
          "Time flies when you're with the one you love. Here's to many more years of happiness together.",
          "You're my yesterday, my today, and all of my tomorrows. Happy Anniversary, my love!"
        ],
        dates: [
          "Romantic dinner at your favorite restaurant",
          "Weekend getaway to somewhere new",
          "Surprise adventure or activity you've both wanted to try"
        ],
        gifts: [
          "Traditional anniversary gift for your year",
          "Custom couple's photo book of the past year",
          "Experience gift - concert, show, or class together"
        ]
      },
      first_vacation: {
        loveNotes: [
          "Our first vacation together showed me what adventure with you looks like. I want to explore the world with you.",
          "Those days away with you were magical. Thank you for being the perfect travel partner.",
          "From that first trip, I knew every adventure would be better with you by my side."
        ],
        dates: [
          "Plan your next vacation together over dinner",
          "Create a photo book from that trip",
          "Try cuisine from the place you visited"
        ],
        gifts: [
          "Scratch-off world map to track travels",
          "Custom luggage tags with your names",
          "Photo collage from your first trip"
        ]
      },
      met_family: {
        loveNotes: [
          "Meeting your family made me even more certain about us. Thank you for welcoming me into your world.",
          "I'll never forget how nervous I was meeting your family. They're amazing, just like you.",
          "Your family accepted me with open arms, and I'm so grateful to be part of it."
        ],
        dates: [
          "Host a dinner for your families together",
          "Look through family photos and share stories",
          "Plan a family reunion or gathering"
        ],
        gifts: [
          "Family photo frame with both families",
          "Custom family tree artwork",
          "Photo book of family gatherings"
        ]
      },
      custom: {
        loveNotes: [
          "This special moment in our journey deserves to be celebrated. You make every day extraordinary.",
          "Thank you for creating this beautiful memory with me. Here's to many more special moments!",
          "Celebrating this milestone reminds me how lucky I am to have you. I love you more every day."
        ],
        dates: [
          "Recreate the moment that made this milestone special",
          "Have a celebration dinner at your favorite spot",
          "Create new traditions around this special day"
        ],
        gifts: [
          "Custom jewelry or accessory with the date",
          "Personalized artwork commemorating the moment",
          "Memory book documenting this special time"
        ]
      }
    }
  },
  es: {
    title: "Ideas de Celebración",
    subtitle: "Haz que este hito sea extra especial con estas sugerencias personalizadas",
    loveNotePrompts: "Sugerencias de Notas de Amor",
    dateIdeas: "Ideas de Citas",
    giftSuggestions: "Sugerencias de Regalos",
    surpriseIdeas: "Ideas de Sorpresas",
    copy: "Copiar",
    copied: "¡Copiado!",
    copyFailed: "No se pudo copiar esta sugerencia.",
    close: "Cerrar",
    milestones: {
      first_date: {
        loveNotes: [
          "¿Recuerdas nuestra primera cita? Mi corazón latía rápido, pero cuando te vi sonreír, supe que era el comienzo de algo hermoso.",
          "Esa primera cita cambió mi vida. Gracias por decir que sí y por cada momento desde entonces.",
          "¡Todavía siento mariposas pensando en nuestra primera cita. Por muchas más aventuras juntos!"
        ],
        dates: [
          "Recrea tu primera cita - visita el mismo lugar, pide la misma comida",
          "Crea un álbum de fotos de tu viaje desde esa primera cita hasta ahora",
          "Cena elegante y recuerda tus primeras impresiones"
        ],
        gifts: [
          "Ilustración personalizada del lugar de tu primera cita",
          "Libro sobre el lugar donde tuvieron su primera cita",
          "Mapa personalizado con la fecha y ubicación marcadas"
        ]
      },
      first_kiss: {
        loveNotes: [
          "Nuestro primer beso... el tiempo se detuvo. Ese momento quedará grabado para siempre en mi corazón.",
          "Nunca olvidaré la electricidad que sentí durante nuestro primer beso. Me dejaste sin aliento.",
          "Cada beso desde nuestro primero ha sido mágico, pero ese primero? Pura perfección."
        ],
        dates: [
          "Regresa al lugar donde tuvieron su primer beso",
          "Miren juntos la puesta de sol y recreen ese momento",
          "Hagan un picnic romántico donde todo comenzó"
        ],
        gifts: [
          "Mapa estelar personalizado mostrando el cielo nocturno de ese momento",
          "Foto enmarcada u obra de arte del lugar",
          "Carta de amor sellada con un beso (¡huella de lápiz labial!)"
        ]
      }
    }
  },
  fr: {
    title: "Idées de Célébration",
    subtitle: "Rendez ce jalon extra spécial avec ces suggestions personnalisées",
    loveNotePrompts: "Suggestions de Notes d'Amour",
    dateIdeas: "Idées de Rendez-vous",
    giftSuggestions: "Suggestions de Cadeaux",
    surpriseIdeas: "Idées de Surprises",
    copy: "Copier",
    copied: "Copié!",
    copyFailed: "Impossible de copier cette suggestion.",
    close: "Fermer",
    milestones: {
      first_date: {
        loveNotes: [
          "Te souviens-tu de notre premier rendez-vous? Mon cœur battait la chamade, mais quand je t'ai vu sourire, j'ai su que c'était le début de quelque chose de beau.",
          "Ce premier rendez-vous a changé ma vie. Merci d'avoir dit oui et pour chaque moment depuis.",
          "J'ai toujours des papillons en pensant à notre premier rendez-vous. À beaucoup d'autres aventures ensemble!"
        ],
        dates: [
          "Recréez votre premier rendez-vous - visitez le même endroit, commandez la même nourriture",
          "Créez un album photo de votre parcours depuis ce premier rendez-vous",
          "Dîner élégant et remémorez-vous vos premières impressions"
        ],
        gifts: [
          "Illustration personnalisée du lieu de votre premier rendez-vous",
          "Livre sur l'endroit où vous avez eu votre premier rendez-vous",
          "Carte personnalisée avec la date et le lieu marqués"
        ]
      }
    }
  },
  it: {
    title: "Idee per la Celebrazione",
    subtitle: "Rendi questo traguardo extra speciale con questi suggerimenti personalizzati",
    loveNotePrompts: "Suggerimenti per Note d'Amore",
    dateIdeas: "Idee per Appuntamenti",
    giftSuggestions: "Suggerimenti per Regali",
    surpriseIdeas: "Idee per Sorprese",
    copy: "Copia",
    copied: "Copiato!",
    copyFailed: "Impossibile copiare questo suggerimento.",
    close: "Chiudi",
    milestones: {
      first_date: {
        loveNotes: [
          "Ricordi il nostro primo appuntamento? Il mio cuore batteva forte, ma nel momento in cui ti ho visto sorridere, ho saputo che era l'inizio di qualcosa di bello.",
          "Quel primo appuntamento ha cambiato la mia vita. Grazie per aver detto di sì e per ogni momento da allora.",
          "Ho ancora le farfalle nello stomaco pensando al nostro primo appuntamento. A molte altre avventure insieme!"
        ],
        dates: [
          "Ricrea il tuo primo appuntamento - visita lo stesso posto, ordina lo stesso cibo",
          "Crea un album fotografico del tuo viaggio da quel primo appuntamento ad oggi",
          "Cena elegante e ricorda le prime impressioni"
        ],
        gifts: [
          "Illustrazione personalizzata del luogo del primo appuntamento",
          "Libro sul posto dove hai avuto il tuo primo appuntamento",
          "Mappa personalizzata con data e luogo segnati"
        ]
      }
    }
  },
  de: {
    title: "Feier-Ideen",
    subtitle: "Mach diesen Meilenstein extra besonders mit diesen personalisierten Vorschlägen",
    loveNotePrompts: "Liebesbotschaft-Vorschläge",
    dateIdeas: "Date-Ideen",
    giftSuggestions: "Geschenkvorschläge",
    surpriseIdeas: "Überraschungs-Ideen",
    copy: "Kopieren",
    copied: "Kopiert!",
    copyFailed: "Dieser Vorschlag konnte nicht kopiert werden.",
    close: "Schließen",
    milestones: {
      first_date: {
        loveNotes: [
          "Erinnerst du dich an unser erstes Date? Mein Herz raste, aber als ich dich lächeln sah, wusste ich, das ist der Beginn von etwas Wunderschönem.",
          "Dieses erste Date hat mein Leben verändert. Danke, dass du ja gesagt hast und für jeden Moment seitdem.",
          "Ich hab immer noch Schmetterlinge im Bauch, wenn ich an unser erstes Date denke. Auf viele weitere Abenteuer zusammen!"
        ],
        dates: [
          "Stelle euer erstes Date nach - besucht denselben Ort, bestellt dasselbe Essen",
          "Erstelle ein Fotoalbum eurer Reise von diesem ersten Date bis jetzt",
          "Schickes Abendessen und erinnert euch an eure ersten Eindrücke"
        ],
        gifts: [
          "Personalisierte Illustration eures ersten Date-Ortes",
          "Buch über den Ort, wo ihr euer erstes Date hattet",
          "Personalisierte Karte mit Datum und Ort markiert"
        ]
      }
    }
  }
};


const MILESTONE_TYPES = [
  "first_date", "first_kiss", "first_love", "moving_in", "engagement",
  "wedding", "anniversary", "first_vacation", "met_family", "custom"
];

const MILESTONE_LABELS = {
  en: { first_date:"First Date", first_kiss:"First Kiss", first_love:"First 'I Love You'", moving_in:"Moving In Together", engagement:"Engagement", wedding:"Wedding", anniversary:"Anniversary", first_vacation:"First Vacation Together", met_family:"Meeting the Family", custom:"Special Milestone" },
  es: { first_date:"Primera Cita", first_kiss:"Primer Beso", first_love:"Primer 'Te Amo'", moving_in:"Mudarse Juntos", engagement:"Compromiso", wedding:"Boda", anniversary:"Aniversario", first_vacation:"Primeras Vacaciones Juntos", met_family:"Conocer a la Familia", custom:"Hito Especial" },
  fr: { first_date:"Premier Rendez-vous", first_kiss:"Premier Baiser", first_love:"Premier 'Je t'aime'", moving_in:"Emménagement Ensemble", engagement:"Fiançailles", wedding:"Mariage", anniversary:"Anniversaire", first_vacation:"Premières Vacances Ensemble", met_family:"Rencontre avec la Famille", custom:"Jalon Spécial" },
  it: { first_date:"Primo Appuntamento", first_kiss:"Primo Bacio", first_love:"Primo 'Ti Amo'", moving_in:"Andare a Vivere Insieme", engagement:"Fidanzamento", wedding:"Matrimonio", anniversary:"Anniversario", first_vacation:"Prima Vacanza Insieme", met_family:"Conoscere la Famiglia", custom:"Traguardo Speciale" },
  de: { first_date:"Erstes Date", first_kiss:"Erster Kuss", first_love:"Erstes 'Ich liebe dich'", moving_in:"Zusammenziehen", engagement:"Verlobung", wedding:"Hochzeit", anniversary:"Jahrestag", first_vacation:"Erster Gemeinsamer Urlaub", met_family:"Die Familie Kennenlernen", custom:"Besonderer Meilenstein" }
};

const FALLBACK_IDEAS = {
  en: {
    loveNotes: label => [
      `Celebrating this milestone — ${label} — reminds me how much our journey together means to me.`,
      `${label} is part of our story, and I am grateful I get to share it with you.`,
      `Thank you for turning ${label} into a memory I will always treasure.`
    ],
    dates: label => [
      `Recreate a favorite moment connected to ${label} and talk about what you remember most.`,
      `Plan a special date inspired by ${label}.`,
      `Create a new tradition for celebrating ${label} together.`
    ],
    gifts: label => [
      `A personalized keepsake that represents ${label}.`,
      `A framed photo or custom artwork connected to ${label}.`,
      `A memory book with photos and notes about ${label} and your journey since.`
    ]
  },
  es: {
    loveNotes: label => [
      `Celebrar este hito — ${label} — me recuerda cuánto significa para mí nuestro camino juntos.`,
      `${label} forma parte de nuestra historia y agradezco poder compartirla contigo.`,
      `Gracias por convertir ${label} en un recuerdo que siempre atesoraré.`
    ],
    dates: label => [
      `Recreen un momento favorito relacionado con ${label} y hablen de lo que más recuerdan.`,
      `Planeen una cita especial inspirada en ${label}.`,
      `Creen una nueva tradición para celebrar juntos ${label}.`
    ],
    gifts: label => [
      `Un recuerdo personalizado que represente ${label}.`,
      `Una foto enmarcada o una obra personalizada relacionada con ${label}.`,
      `Un libro de recuerdos con fotos y notas sobre ${label} y todo lo vivido desde entonces.`
    ]
  },
  fr: {
    loveNotes: label => [
      `Célébrer ce jalon — ${label} — me rappelle à quel point notre parcours ensemble compte pour moi.`,
      `${label} fait partie de notre histoire, et je suis reconnaissant(e) de la partager avec toi.`,
      `Merci d’avoir transformé ${label} en un souvenir que je chérirai toujours.`
    ],
    dates: label => [
      `Recréez un moment préféré lié à ${label} et partagez ce dont vous vous souvenez le plus.`,
      `Organisez un rendez-vous spécial inspiré par ${label}.`,
      `Créez une nouvelle tradition pour célébrer ${label} ensemble.`
    ],
    gifts: label => [
      `Un souvenir personnalisé qui représente ${label}.`,
      `Une photo encadrée ou une œuvre personnalisée liée à ${label}.`,
      `Un livre de souvenirs avec des photos et des mots sur ${label} et votre parcours depuis.`
    ]
  },
  it: {
    loveNotes: label => [
      `Celebrare questo traguardo — ${label} — mi ricorda quanto significhi per me il nostro cammino insieme.`,
      `${label} fa parte della nostra storia e sono grato/a di poterla condividere con te.`,
      `Grazie per aver trasformato ${label} in un ricordo che conserverò per sempre.`
    ],
    dates: label => [
      `Ricreate un momento speciale legato a ${label} e raccontatevi ciò che ricordate di più.`,
      `Organizzate un appuntamento speciale ispirato a ${label}.`,
      `Create una nuova tradizione per celebrare insieme ${label}.`
    ],
    gifts: label => [
      `Un ricordo personalizzato che rappresenti ${label}.`,
      `Una foto incorniciata o un’opera personalizzata legata a ${label}.`,
      `Un album dei ricordi con foto e messaggi su ${label} e sul vostro percorso da allora.`
    ]
  },
  de: {
    loveNotes: label => [
      `Diesen Meilenstein – ${label} – zu feiern erinnert mich daran, wie viel mir unser gemeinsamer Weg bedeutet.`,
      `${label} ist ein Teil unserer Geschichte, und ich bin dankbar, sie mit dir teilen zu dürfen.`,
      `Danke, dass ${label} zu einer Erinnerung geworden ist, die ich immer in Ehren halten werde.`
    ],
    dates: label => [
      `Erlebt einen Lieblingsmoment rund um ${label} noch einmal und erzählt euch, woran ihr euch am liebsten erinnert.`,
      `Plant ein besonderes Date, das von ${label} inspiriert ist.`,
      `Schafft eine neue Tradition, um ${label} gemeinsam zu feiern.`
    ],
    gifts: label => [
      `Ein personalisiertes Erinnerungsstück, das ${label} symbolisiert.`,
      `Ein gerahmtes Foto oder individuelles Kunstwerk zu ${label}.`,
      `Ein Erinnerungsbuch mit Fotos und Notizen über ${label} und euren gemeinsamen Weg seitdem.`
    ]
  }
};

function localizedFallbackIdeas(language, milestoneType) {
  const safeLanguage = MILESTONE_LABELS[language] ? language : "en";
  const safeType = MILESTONE_TYPES.includes(milestoneType) ? milestoneType : "custom";
  const label = MILESTONE_LABELS[safeLanguage][safeType];
  const template = FALLBACK_IDEAS[safeLanguage];
  return {
    loveNotes: template.loveNotes(label),
    dates: template.dates(label),
    gifts: template.gifts(label)
  };
}

function getMilestoneIdeas(language, milestoneType) {
  const safeLanguage = translations[language] ? language : "en";
  const safeType = MILESTONE_TYPES.includes(milestoneType) ? milestoneType : "custom";
  return translations[safeLanguage].milestones[safeType] || localizedFallbackIdeas(safeLanguage, safeType);
}

export default function CelebrationIdeas({ milestone, onClose }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [copiedIndex, setCopiedIndex] = useState(null);

  const ideas = getMilestoneIdeas(currentLanguage, milestone?.milestone_type);

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success(t.copied);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error(t.copyFailed);
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
        aria-labelledby="celebration-ideas-title"
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="celebration-ideas-title" className="text-3xl font-bold mb-2">{t.title}</h2>
              <p className="text-white/90">{t.subtitle}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t.close} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Love Note Prompts */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-pink-500" />
              <h3 className="text-2xl font-bold text-gray-900">{t.loveNotePrompts}</h3>
            </div>
            <div className="space-y-3">
              {ideas.loveNotes.map((note, idx) => (
                <Card key={idx} className="border-2 border-pink-100 hover:border-pink-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-gray-700 leading-relaxed flex-1">{note}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(note, `note-${idx}`)}
                        aria-label={t.copy}
                        className="flex-shrink-0"
                      >
                        {copiedIndex === `note-${idx}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Date Ideas */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-purple-500" />
              <h3 className="text-2xl font-bold text-gray-900">{t.dateIdeas}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {ideas.dates.map((date, idx) => (
                <Card key={idx} className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-gray-700">{date}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Gift Suggestions */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-blue-500" />
              <h3 className="text-2xl font-bold text-gray-900">{t.giftSuggestions}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {ideas.gifts.map((gift, idx) => (
                <Card key={idx} className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-gray-700">{gift}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t">
          <Button onClick={onClose} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg py-6">
            {t.close}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}