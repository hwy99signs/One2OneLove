import React, { useMemo, useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Heart, RotateCcw, Save, Share2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";
import { saveLoveLanguagePreference } from "@/lib/loveLanguageService";
import { toast } from "sonner";

const IDS = ['words', 'quality', 'gifts', 'service', 'touch'];

const translations = {
  en: {
    title: "Love Language Reflection",
    subtitle: "Notice which kinds of care tend to feel most meaningful to you.",
    disclaimer: "This is an informal educational reflection, not a validated psychological assessment, diagnosis, or professional advice.",
    privacy: "Your answers stay on this page and are not saved or transmitted. Only your final preference is stored if you explicitly choose Save to Profile.",
    question: "Question", of: "of", previous: "Previous", next: "Next", finish: "See Reflection",
    resultTitle: "Your strongest preference in this reflection",
    resultNote: "Treat this as a conversation starter, not a fixed label. People can value several forms of care and preferences can change over time.",
    takeAgain: "Take Again", save: "Save to Profile", saving: "Saving...", saved: "Saved to Profile", signInToSave: "Sign in to save this preference to your profile.",
    saveSuccess: "Preference saved to your profile.", saveError: "We could not save that preference.", share: "Share Result", copied: "Result copied to your clipboard.", shareError: "We could not share that result.",
    labels: {
      words: ["Words of Affirmation", "Encouraging, appreciative, and affectionate words often feel especially meaningful."],
      quality: ["Quality Time", "Focused, undistracted time together often feels especially meaningful."],
      gifts: ["Thoughtful Gifts", "Thoughtful objects or surprises that show someone remembered you often feel especially meaningful."],
      service: ["Acts of Service", "Helpful actions that reduce a burden or show practical care often feel especially meaningful."],
      touch: ["Physical Affection", "Appropriate affectionate touch such as hugs, hand-holding, or closeness often feels especially meaningful."],
    },
    questions: [
      ["When you have had a difficult day, what usually feels most comforting?", ["Hearing caring and encouraging words", "Having uninterrupted time together", "Receiving a small thoughtful surprise", "Having someone take a task off my plate", "A warm hug or affectionate closeness"]],
      ["Which gesture is most likely to stay with you?", ["A sincere note about what they appreciate in me", "A planned evening with phones put away", "A gift chosen because they remembered something I mentioned", "They quietly handle something they know is stressing me", "They reach for my hand or hug me"]],
      ["When celebrating something important, what would you value most?", ["Hearing how proud they are of me", "Spending meaningful time celebrating together", "Receiving a symbolic or thoughtful present", "They organize or handle details so I can enjoy the moment", "Lots of affectionate closeness"]],
      ["What absence tends to feel most noticeable?", ["Very little verbal appreciation", "Not enough focused time together", "Important occasions being forgotten", "Feeling unsupported with practical responsibilities", "Very little affectionate touch"]],
      ["How do you most naturally show care?", ["I say or write encouraging things", "I make time and give full attention", "I bring thoughtful gifts or surprises", "I help with tasks or responsibilities", "I use affectionate touch"]],
      ["What makes an ordinary day feel special?", ["An unexpected compliment or loving message", "A meaningful conversation with no rush", "A small surprise chosen just for me", "Someone helping before I even ask", "A hug, cuddle, or hand squeeze"]],
      ["During conflict repair, what helps you reconnect?", ["Hearing sincere reassurance and accountability", "Sitting together and talking without distractions", "A small meaningful gesture showing they were thinking of me", "Seeing concrete action to address the issue", "Gentle affectionate contact when both people are comfortable"]],
      ["What best communicates 'I was thinking about you'?", ["A thoughtful message", "Making time specifically for me", "Bringing something meaningful home", "Doing something helpful for me", "Greeting me with affectionate touch"]],
      ["On a free weekend, which sounds most connecting?", ["Sharing appreciations and meaningful conversation", "Spending a long stretch of intentional time together", "Exchanging little surprises", "Working together on something that makes life easier", "Relaxing close together"]],
      ["Which request would feel most natural for you to make?", ["Tell me what you appreciate about me", "Can we have some uninterrupted time together?", "Bring me something that reminds you of us", "Could you help me with this task?", "Can I have a hug?"]],
    ],
  },
  es: {
    title: "Reflexión sobre Lenguajes del Amor",
    subtitle: "Observa qué tipos de cuidado suelen sentirse más significativos para ti.",
    disclaimer: "Esta es una reflexión educativa informal, no una evaluación psicológica validada, diagnóstico ni consejo profesional.",
    privacy: "Tus respuestas permanecen en esta página y no se guardan ni transmiten. Solo se guarda tu preferencia final si eliges explícitamente Guardar en el Perfil.",
    question: "Pregunta", of: "de", previous: "Anterior", next: "Siguiente", finish: "Ver Reflexión",
    resultTitle: "Tu preferencia más fuerte en esta reflexión",
    resultNote: "Úsala como punto de conversación, no como una etiqueta fija. Las personas pueden valorar varias formas de cuidado y las preferencias pueden cambiar.",
    takeAgain: "Repetir", save: "Guardar en el Perfil", saving: "Guardando...", saved: "Guardado en el Perfil", signInToSave: "Inicia sesión para guardar esta preferencia en tu perfil.",
    saveSuccess: "Preferencia guardada en tu perfil.", saveError: "No pudimos guardar esa preferencia.", share: "Compartir Resultado", copied: "Resultado copiado al portapapeles.", shareError: "No pudimos compartir ese resultado.",
    labels: {
      words: ["Palabras de Afirmación", "Las palabras de ánimo, aprecio y cariño suelen sentirse especialmente significativas."],
      quality: ["Tiempo de Calidad", "El tiempo enfocado y sin distracciones juntos suele sentirse especialmente significativo."],
      gifts: ["Regalos Significativos", "Los regalos o sorpresas pensados que muestran que alguien te recordó suelen sentirse especialmente significativos."],
      service: ["Actos de Servicio", "Las acciones útiles que reducen una carga o muestran cuidado práctico suelen sentirse especialmente significativas."],
      touch: ["Afecto Físico", "El contacto afectuoso apropiado, como abrazos, tomarse de la mano o cercanía, suele sentirse especialmente significativo."],
    },
    questions: [
      ["Después de un día difícil, ¿qué suele reconfortarte más?", ["Escuchar palabras cariñosas y de ánimo", "Tener tiempo juntos sin interrupciones", "Recibir una pequeña sorpresa considerada", "Que alguien me quite una tarea de encima", "Un abrazo cálido o cercanía afectuosa"]],
      ["¿Qué gesto probablemente recordarías más?", ["Una nota sincera sobre lo que aprecia de mí", "Una noche planeada con los teléfonos guardados", "Un regalo elegido porque recordó algo que mencioné", "Se encarga de algo que sabe que me estresa", "Busca mi mano o me abraza"]],
      ["Al celebrar algo importante, ¿qué valorarías más?", ["Escuchar lo orgulloso que está de mí", "Pasar tiempo significativo celebrando juntos", "Recibir un regalo simbólico o pensado", "Que organice detalles para que yo disfrute el momento", "Mucha cercanía afectuosa"]],
      ["¿Qué ausencia tiende a sentirse más?", ["Muy poca apreciación verbal", "No suficiente tiempo enfocado juntos", "Que se olviden ocasiones importantes", "Sentirme sin apoyo en responsabilidades prácticas", "Muy poco contacto afectuoso"]],
      ["¿Cómo muestras cariño de forma más natural?", ["Digo o escribo cosas de ánimo", "Hago tiempo y doy toda mi atención", "Doy regalos o sorpresas pensadas", "Ayudo con tareas o responsabilidades", "Uso contacto afectuoso"]],
      ["¿Qué hace especial un día normal?", ["Un cumplido o mensaje cariñoso inesperado", "Una conversación significativa sin prisas", "Una pequeña sorpresa elegida para mí", "Que alguien ayude antes de que lo pida", "Un abrazo, acurrucarse o apretar la mano"]],
      ["Después de un conflicto, ¿qué ayuda a reconectar?", ["Escuchar tranquilidad sincera y responsabilidad", "Sentarnos a hablar sin distracciones", "Un pequeño gesto significativo", "Ver acciones concretas para abordar el problema", "Contacto afectuoso suave cuando ambos están cómodos"]],
      ["¿Qué comunica mejor 'estaba pensando en ti'?", ["Un mensaje considerado", "Hacer tiempo específicamente para mí", "Traer algo significativo a casa", "Hacer algo útil por mí", "Recibirme con contacto afectuoso"]],
      ["En un fin de semana libre, ¿qué suena más conectivo?", ["Compartir apreciaciones y conversación significativa", "Pasar mucho tiempo intencional juntos", "Intercambiar pequeñas sorpresas", "Trabajar juntos en algo que facilite la vida", "Relajarnos cerca el uno del otro"]],
      ["¿Qué petición te saldría más naturalmente?", ["Dime qué aprecias de mí", "¿Podemos tener tiempo juntos sin interrupciones?", "Tráeme algo que te recuerde a nosotros", "¿Puedes ayudarme con esta tarea?", "¿Me das un abrazo?"]],
    ],
  },
  fr: {
    title: "Réflexion sur les Langages de l’Amour",
    subtitle: "Observez les formes d’attention qui ont tendance à être les plus significatives pour vous.",
    disclaimer: "Il s’agit d’une réflexion éducative informelle, et non d’une évaluation psychologique validée, d’un diagnostic ou d’un conseil professionnel.",
    privacy: "Vos réponses restent sur cette page et ne sont ni enregistrées ni transmises. Seule votre préférence finale est stockée si vous choisissez explicitement Enregistrer dans le Profil.",
    question: "Question", of: "sur", previous: "Précédente", next: "Suivante", finish: "Voir la Réflexion",
    resultTitle: "Votre préférence la plus forte dans cette réflexion",
    resultNote: "Considérez-la comme un point de départ pour discuter, pas comme une étiquette fixe. On peut apprécier plusieurs formes d’attention et les préférences peuvent évoluer.",
    takeAgain: "Recommencer", save: "Enregistrer dans le Profil", saving: "Enregistrement...", saved: "Enregistré dans le Profil", signInToSave: "Connectez-vous pour enregistrer cette préférence dans votre profil.",
    saveSuccess: "Préférence enregistrée dans votre profil.", saveError: "Nous n’avons pas pu enregistrer cette préférence.", share: "Partager le Résultat", copied: "Résultat copié dans le presse-papiers.", shareError: "Nous n’avons pas pu partager ce résultat.",
    labels: {
      words: ["Paroles Valorantes", "Les mots d’encouragement, d’appréciation et d’affection ont souvent une importance particulière."],
      quality: ["Temps de Qualité", "Le temps partagé avec attention et sans distraction a souvent une importance particulière."],
      gifts: ["Cadeaux Attentionnés", "Les cadeaux ou surprises qui montrent qu’on a pensé à vous ont souvent une importance particulière."],
      service: ["Services Rendus", "Les actions utiles qui allègent une charge ou montrent une attention pratique ont souvent une importance particulière."],
      touch: ["Affection Physique", "Le contact affectueux approprié, comme les câlins, se tenir la main ou la proximité, a souvent une importance particulière."],
    },
    questions: [
      ["Après une journée difficile, qu’est-ce qui vous réconforte le plus souvent ?", ["Entendre des paroles attentionnées et encourageantes", "Avoir du temps ensemble sans interruption", "Recevoir une petite surprise attentionnée", "Que quelqu’un prenne une tâche à ma place", "Un câlin chaleureux ou une proximité affectueuse"]],
      ["Quel geste resterait le plus dans votre mémoire ?", ["Une note sincère sur ce qu’on apprécie chez moi", "Une soirée prévue avec les téléphones rangés", "Un cadeau choisi parce qu’on s’est souvenu de quelque chose que j’avais dit", "La personne s’occupe de quelque chose qui me stresse", "Elle me prend la main ou me serre dans ses bras"]],
      ["Pour célébrer quelque chose d’important, que valoriseriez-vous le plus ?", ["Entendre à quel point on est fier de moi", "Passer un moment significatif à célébrer ensemble", "Recevoir un cadeau symbolique ou attentionné", "Que l’autre organise les détails pour que je profite du moment", "Beaucoup de proximité affectueuse"]],
      ["Quelle absence se fait le plus sentir ?", ["Très peu d’appréciation verbale", "Pas assez de temps attentif ensemble", "L’oubli des occasions importantes", "Le manque de soutien pour les responsabilités pratiques", "Très peu de contact affectueux"]],
      ["Comment montrez-vous le plus naturellement votre affection ?", ["Je dis ou j’écris des mots encourageants", "Je prends du temps et donne toute mon attention", "J’offre des cadeaux ou surprises réfléchis", "J’aide avec les tâches ou responsabilités", "J’utilise le contact affectueux"]],
      ["Qu’est-ce qui rend une journée ordinaire spéciale ?", ["Un compliment ou message affectueux inattendu", "Une conversation significative sans se presser", "Une petite surprise choisie pour moi", "Quelqu’un aide avant même que je demande", "Un câlin ou une main serrée"]],
      ["Après un conflit, qu’est-ce qui aide à renouer ?", ["Des paroles sincères de réassurance et de responsabilité", "S’asseoir ensemble et parler sans distractions", "Un petit geste significatif", "Voir des actions concrètes pour résoudre le problème", "Un contact doux lorsque les deux personnes sont à l’aise"]],
      ["Qu’est-ce qui communique le mieux « je pensais à toi » ?", ["Un message attentionné", "Du temps réservé spécialement pour moi", "Rapporter quelque chose de significatif", "Faire quelque chose d’utile pour moi", "M’accueillir avec un geste affectueux"]],
      ["Pendant un week-end libre, qu’est-ce qui semble le plus connectant ?", ["Partager des appréciations et une conversation profonde", "Passer une longue période de temps intentionnel ensemble", "Échanger de petites surprises", "Travailler ensemble sur quelque chose qui simplifie la vie", "Se détendre proches l’un de l’autre"]],
      ["Quelle demande vous semblerait la plus naturelle ?", ["Dis-moi ce que tu apprécies chez moi", "Pouvons-nous passer du temps ensemble sans interruption ?", "Rapporte-moi quelque chose qui te fait penser à nous", "Peux-tu m’aider avec cette tâche ?", "Puis-je avoir un câlin ?"]],
    ],
  },
  it: {
    title: "Riflessione sui Linguaggi dell’Amore",
    subtitle: "Osserva quali forme di cura tendono a essere più significative per te.",
    disclaimer: "Questa è una riflessione educativa informale, non una valutazione psicologica validata, una diagnosi o una consulenza professionale.",
    privacy: "Le tue risposte restano in questa pagina e non vengono salvate o trasmesse. Solo la preferenza finale viene memorizzata se scegli esplicitamente Salva nel Profilo.",
    question: "Domanda", of: "di", previous: "Precedente", next: "Successiva", finish: "Vedi Riflessione",
    resultTitle: "La preferenza più forte in questa riflessione",
    resultNote: "Usala come punto di partenza per una conversazione, non come etichetta fissa. Si possono apprezzare più forme di cura e le preferenze possono cambiare.",
    takeAgain: "Ripeti", save: "Salva nel Profilo", saving: "Salvataggio...", saved: "Salvato nel Profilo", signInToSave: "Accedi per salvare questa preferenza nel profilo.",
    saveSuccess: "Preferenza salvata nel profilo.", saveError: "Non è stato possibile salvare questa preferenza.", share: "Condividi Risultato", copied: "Risultato copiato negli appunti.", shareError: "Non è stato possibile condividere il risultato.",
    labels: {
      words: ["Parole di Apprezzamento", "Parole di incoraggiamento, apprezzamento e affetto spesso risultano particolarmente significative."],
      quality: ["Tempo di Qualità", "Il tempo insieme con attenzione piena e senza distrazioni spesso risulta particolarmente significativo."],
      gifts: ["Regali Premurosi", "Regali o sorprese che mostrano che qualcuno si è ricordato di te spesso risultano particolarmente significativi."],
      service: ["Gesti di Aiuto", "Azioni utili che alleggeriscono un peso o mostrano cura pratica spesso risultano particolarmente significative."],
      touch: ["Affetto Fisico", "Il contatto affettuoso appropriato, come abbracci, tenersi per mano o vicinanza, spesso risulta particolarmente significativo."],
    },
    questions: [
      ["Dopo una giornata difficile, cosa tende a confortarti di più?", ["Sentire parole affettuose e incoraggianti", "Avere tempo insieme senza interruzioni", "Ricevere una piccola sorpresa premurosa", "Che qualcuno si occupi di un compito al posto mio", "Un abbraccio caldo o vicinanza affettuosa"]],
      ["Quale gesto probabilmente ricorderesti più a lungo?", ["Una nota sincera su ciò che apprezza di me", "Una serata programmata con i telefoni messi via", "Un regalo scelto ricordando qualcosa che avevo detto", "Si occupa di qualcosa che sa che mi stressa", "Mi prende la mano o mi abbraccia"]],
      ["Quando celebri qualcosa di importante, cosa apprezzeresti di più?", ["Sentire quanto è orgoglioso di me", "Passare tempo significativo celebrando insieme", "Ricevere un regalo simbolico o premuroso", "Che organizzi i dettagli così posso godermi il momento", "Molta vicinanza affettuosa"]],
      ["Quale mancanza si nota di più?", ["Pochissimo apprezzamento verbale", "Non abbastanza tempo concentrato insieme", "Dimenticare occasioni importanti", "Sentirmi senza supporto nelle responsabilità pratiche", "Pochissimo contatto affettuoso"]],
      ["Come mostri più naturalmente affetto?", ["Dico o scrivo cose incoraggianti", "Trovo tempo e do tutta la mia attenzione", "Faccio regali o sorprese premurose", "Aiuto con compiti o responsabilità", "Uso il contatto affettuoso"]],
      ["Cosa rende speciale una giornata normale?", ["Un complimento o messaggio affettuoso inaspettato", "Una conversazione significativa senza fretta", "Una piccola sorpresa scelta per me", "Qualcuno aiuta prima ancora che io chieda", "Un abbraccio, coccole o una stretta di mano"]],
      ["Dopo un conflitto, cosa aiuta a riconnettersi?", ["Sentire rassicurazione sincera e responsabilità", "Sedersi insieme e parlare senza distrazioni", "Un piccolo gesto significativo", "Vedere azioni concrete per affrontare il problema", "Contatto affettuoso delicato quando entrambi sono a proprio agio"]],
      ["Cosa comunica meglio «stavo pensando a te»?", ["Un messaggio premuroso", "Dedicare tempo specificamente a me", "Portare a casa qualcosa di significativo", "Fare qualcosa di utile per me", "Accogliermi con contatto affettuoso"]],
      ["In un fine settimana libero, cosa sembra più connettivo?", ["Condividere apprezzamenti e conversazione significativa", "Passare un lungo periodo di tempo intenzionale insieme", "Scambiarci piccole sorprese", "Lavorare insieme su qualcosa che semplifica la vita", "Rilassarci vicini"]],
      ["Quale richiesta ti verrebbe più naturale?", ["Dimmi cosa apprezzi di me", "Possiamo avere del tempo insieme senza interruzioni?", "Portami qualcosa che ti faccia pensare a noi", "Puoi aiutarmi con questo compito?", "Posso avere un abbraccio?"]],
    ],
  },
  de: {
    title: "Reflexion zu Liebessprachen",
    subtitle: "Beobachtet, welche Formen von Fürsorge sich für euch besonders bedeutsam anfühlen.",
    disclaimer: "Dies ist eine informelle pädagogische Reflexion, kein validierter psychologischer Test, keine Diagnose und keine professionelle Beratung.",
    privacy: "Eure Antworten bleiben auf dieser Seite und werden weder gespeichert noch übertragen. Nur die endgültige Präferenz wird gespeichert, wenn ihr ausdrücklich Im Profil Speichern auswählt.",
    question: "Frage", of: "von", previous: "Zurück", next: "Weiter", finish: "Reflexion Anzeigen",
    resultTitle: "Eure stärkste Präferenz in dieser Reflexion",
    resultNote: "Nutzt das Ergebnis als Gesprächseinstieg, nicht als feste Bezeichnung. Menschen können mehrere Formen der Fürsorge schätzen und Präferenzen können sich verändern.",
    takeAgain: "Erneut Starten", save: "Im Profil Speichern", saving: "Wird gespeichert...", saved: "Im Profil Gespeichert", signInToSave: "Meldet euch an, um diese Präferenz im Profil zu speichern.",
    saveSuccess: "Präferenz im Profil gespeichert.", saveError: "Diese Präferenz konnte nicht gespeichert werden.", share: "Ergebnis Teilen", copied: "Ergebnis in die Zwischenablage kopiert.", shareError: "Das Ergebnis konnte nicht geteilt werden.",
    labels: {
      words: ["Wertschätzende Worte", "Ermutigende, wertschätzende und liebevolle Worte fühlen sich oft besonders bedeutsam an."],
      quality: ["Gemeinsame Qualitätszeit", "Fokussierte gemeinsame Zeit ohne Ablenkungen fühlt sich oft besonders bedeutsam an."],
      gifts: ["Aufmerksame Geschenke", "Durchdachte Geschenke oder Überraschungen, die zeigen, dass jemand an euch gedacht hat, fühlen sich oft besonders bedeutsam an."],
      service: ["Hilfreiche Handlungen", "Hilfreiche Handlungen, die Belastung reduzieren oder praktische Fürsorge zeigen, fühlen sich oft besonders bedeutsam an."],
      touch: ["Körperliche Zuneigung", "Angemessene liebevolle Berührung wie Umarmungen, Händchenhalten oder Nähe fühlt sich oft besonders bedeutsam an."],
    },
    questions: [
      ["Was tröstet euch nach einem schwierigen Tag meistens am stärksten?", ["Fürsorgliche und ermutigende Worte hören", "Ungestörte gemeinsame Zeit haben", "Eine kleine aufmerksame Überraschung bekommen", "Jemand übernimmt eine Aufgabe für mich", "Eine warme Umarmung oder liebevolle Nähe"]],
      ["Welche Geste würde euch wahrscheinlich am längsten in Erinnerung bleiben?", ["Eine ehrliche Nachricht darüber, was an mir geschätzt wird", "Ein geplanter Abend mit weggelegten Handys", "Ein Geschenk, das an etwas erinnert, das ich erwähnt habe", "Die Person erledigt etwas, von dem sie weiß, dass es mich stresst", "Sie nimmt meine Hand oder umarmt mich"]],
      ["Was würdet ihr bei einem wichtigen Erfolg am meisten schätzen?", ["Zu hören, wie stolz die Person auf mich ist", "Bedeutsame gemeinsame Zeit zum Feiern", "Ein symbolisches oder durchdachtes Geschenk", "Die andere Person organisiert Details, damit ich den Moment genießen kann", "Viel liebevolle Nähe"]],
      ["Welche Abwesenheit fällt am stärksten auf?", ["Sehr wenig verbale Wertschätzung", "Zu wenig fokussierte gemeinsame Zeit", "Wichtige Anlässe werden vergessen", "Zu wenig praktische Unterstützung", "Sehr wenig liebevolle Berührung"]],
      ["Wie zeigt ihr Fürsorge am natürlichsten?", ["Ich sage oder schreibe ermutigende Dinge", "Ich nehme mir Zeit und schenke volle Aufmerksamkeit", "Ich mache durchdachte Geschenke oder Überraschungen", "Ich helfe bei Aufgaben oder Verantwortlichkeiten", "Ich nutze liebevolle Berührung"]],
      ["Was macht einen gewöhnlichen Tag besonders?", ["Ein unerwartetes Kompliment oder eine liebevolle Nachricht", "Ein bedeutungsvolles Gespräch ohne Eile", "Eine kleine Überraschung speziell für mich", "Jemand hilft, bevor ich frage", "Eine Umarmung, Kuscheln oder ein Händedruck"]],
      ["Was hilft nach einem Konflikt bei der Wiederannäherung?", ["Ehrliche Beruhigung und Verantwortungsübernahme", "Gemeinsam ohne Ablenkungen sprechen", "Eine kleine bedeutsame Geste", "Konkrete Handlungen zur Lösung des Problems sehen", "Sanfte liebevolle Berührung, wenn beide sich wohlfühlen"]],
      ["Was vermittelt am besten „Ich habe an dich gedacht“?", ["Eine aufmerksame Nachricht", "Zeit speziell für mich reservieren", "Etwas Bedeutungsvolles mitbringen", "Etwas Hilfreiches für mich tun", "Mich mit liebevoller Berührung begrüßen"]],
      ["Was klingt an einem freien Wochenende am verbindendsten?", ["Wertschätzung und bedeutungsvolle Gespräche teilen", "Lange bewusste gemeinsame Zeit verbringen", "Kleine Überraschungen austauschen", "Gemeinsam an etwas arbeiten, das das Leben erleichtert", "Entspannt nah beieinander sein"]],
      ["Welche Bitte würdet ihr am natürlichsten äußern?", ["Sag mir, was du an mir schätzt", "Können wir ungestörte Zeit miteinander haben?", "Bring mir etwas mit, das dich an uns erinnert", "Kannst du mir bei dieser Aufgabe helfen?", "Kann ich eine Umarmung haben?"]],
    ],
  },
};

export default function LoveLanguageQuiz() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user } = useAuth();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const resultId = useMemo(() => {
    const scores = Object.fromEntries(IDS.map((id) => [id, 0]));
    answers.forEach((choice) => {
      const id = IDS[choice];
      if (id) scores[id] += 1;
    });
    return IDS.reduce((best, id) => scores[id] > scores[best] ? id : best, IDS[0]);
  }, [answers]);

  const selectAnswer = (choiceIndex) => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = choiceIndex;
    setAnswers(nextAnswers);
    setSaved(false);
    if (questionIndex === t.questions.length - 1) setShowResult(true);
    else setQuestionIndex((current) => current + 1);
  };

  const reset = () => {
    setQuestionIndex(0);
    setAnswers([]);
    setShowResult(false);
    setSaved(false);
  };

  const saveResult = async () => {
    if (!user?.id) {
      toast.error(t.signInToSave);
      return;
    }
    setSaving(true);
    try {
      await saveLoveLanguagePreference(user.id, resultId);
      setSaved(true);
      toast.success(t.saveSuccess);
    } catch {
      toast.error(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const shareResult = async () => {
    const [name, description] = t.labels[resultId];
    const text = `${t.title}: ${name}. ${description}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t.title, text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(t.copied);
      } else {
        throw new Error('Sharing unavailable');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error(t.shareError);
    }
  };

  if (showResult) {
    const [name, description] = t.labels[resultId];
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10 md:py-16">
        <div className="mx-auto max-w-3xl">
          <Card className="border-pink-100 shadow-lg">
            <CardHeader className="text-center">
              <Heart className="mx-auto h-14 w-14 fill-pink-100 text-pink-600" aria-hidden="true" />
              <CardTitle className="mt-3 text-3xl">{t.resultTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-6 text-center">
                <h1 className="text-3xl font-bold text-slate-900">{name}</h1>
                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-700">{description}</p>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">{t.resultNote}</p>
              <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />{t.privacy}</div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Button type="button" variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />{t.takeAgain}</Button>
                <Button type="button" variant="outline" onClick={shareResult}><Share2 className="mr-2 h-4 w-4" aria-hidden="true" />{t.share}</Button>
                <Button type="button" onClick={saveResult} disabled={saving || saved}>{saved ? <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}{saving ? t.saving : saved ? t.saved : t.save}</Button>
              </div>
              {!user && <p className="mt-3 text-center text-xs text-slate-500">{t.signInToSave}</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const [question, options] = t.questions[questionIndex];
  const answered = answers[questionIndex];

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <Heart className="mx-auto h-12 w-12 text-pink-600" aria-hidden="true" />
          <h1 className="mt-3 text-4xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{t.subtitle}</p>
          <p className="mt-4 rounded-2xl border border-purple-100 bg-white p-4 text-left text-sm leading-6 text-slate-700">{t.disclaimer}</p>
          <p className="mt-3 text-xs font-medium leading-5 text-emerald-800">{t.privacy}</p>
        </header>

        <Card className="mt-8 border-pink-100 shadow-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
              <span>{t.question} {questionIndex + 1} {t.of} {t.questions.length}</span>
              <span>{Math.round(((questionIndex + 1) / t.questions.length) * 100)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600" style={{ width: `${((questionIndex + 1) / t.questions.length) * 100}%` }} /></div>
            <h2 className="mt-6 text-2xl font-bold leading-8 text-slate-900">{question}</h2>
            <div className="mt-6 space-y-3">
              {options.map((option, index) => (
                <button key={option} type="button" onClick={() => selectAnswer(index)} className={`w-full rounded-2xl border p-4 text-left text-sm leading-6 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${answered === index ? 'border-pink-400 bg-pink-50 text-pink-950' : 'border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50/50'}`}>{option}</button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))} disabled={questionIndex === 0}><ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.previous}</Button>
              {answered !== undefined && questionIndex < t.questions.length - 1 && <Button type="button" onClick={() => setQuestionIndex((current) => current + 1)}>{t.next}<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>}
              {answered !== undefined && questionIndex === t.questions.length - 1 && <Button type="button" onClick={() => setShowResult(true)}>{t.finish}<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
