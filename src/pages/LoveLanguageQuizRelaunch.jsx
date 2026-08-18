import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Clock, Gift, Hand, Heart, MessageCircle, RotateCcw, Save, Share2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { saveLoveLanguage } from '@/lib/profileService';

const RESULT_STORAGE_KEY = 'o2ol-love-language-result';
const LANGUAGE_ORDER = ['words', 'quality', 'gifts', 'service', 'touch'];
const PAIRS = [
  ['words', 'quality'],
  ['words', 'gifts'],
  ['words', 'service'],
  ['words', 'touch'],
  ['quality', 'gifts'],
  ['quality', 'service'],
  ['quality', 'touch'],
  ['gifts', 'service'],
  ['gifts', 'touch'],
  ['service', 'touch'],
];

const COPY = {
  en: {
    title: 'Love Language Quiz', subtitle: 'A quick reflection on the ways you most naturally feel cared for.', question: 'Which would mean more to you?', of: 'of', previous: 'Previous', restart: 'Restart', strongest: 'Your strongest match', closeSecond: 'Close second', meaning: 'What this may tell you', reflection: 'This is an informal reflection tool, not a clinical or validated assessment. Use the result as a conversation starter, not a label.', save: 'Save to Profile', saved: 'Saved to Profile', saving: 'Saving…', createToSave: 'Create a free account to save this result', signIn: 'Sign in to save', share: 'Share Result', shared: 'Result copied to your clipboard', again: 'Take Quiz Again', answerAll: 'Choose one response for each comparison.', saveSuccess: 'Love Language saved to your profile.', saveError: 'Unable to save your result right now.', shareIntro: 'My strongest Love Language match is', takeQuiz: 'Take the free One2OneLove Love Language Quiz:',
    names: { words: 'Words of Affirmation', quality: 'Quality Time', gifts: 'Receiving Gifts', service: 'Acts of Service', touch: 'Physical Touch' },
    choices: { words: 'Hearing or reading sincere words of appreciation.', quality: 'Having focused, unrushed time together.', gifts: 'Receiving a thoughtful token that shows I was remembered.', service: 'Having someone notice what would help and do it.', touch: 'Feeling warm, welcome physical affection.' },
    descriptions: { words: 'Encouraging, appreciative words tend to land deeply for you. Specific reassurance and sincere recognition may matter more than grand gestures.', quality: 'Attention is the gift. You may feel closest when someone is fully present and makes intentional time for the relationship.', gifts: 'The meaning behind a thoughtful object or surprise may feel powerful because it shows someone remembered, noticed, and chose with you in mind.', service: 'Helpful action often speaks loudly for you. Reliability, follow-through, and practical support may make care feel tangible.', touch: 'Warm physical connection may help you feel close and reassured. Consent, comfort, and mutual preference always matter.' },
  },
  es: {
    title: 'Quiz de Lenguaje del Amor', subtitle: 'Una reflexión rápida sobre las formas en que más naturalmente te sientes querido/a.', question: '¿Cuál de estas opciones significaría más para ti?', of: 'de', previous: 'Anterior', restart: 'Reiniciar', strongest: 'Tu coincidencia más fuerte', closeSecond: 'Segunda coincidencia cercana', meaning: 'Lo que esto puede decirte', reflection: 'Esta es una herramienta informal de reflexión, no una evaluación clínica ni validada. Usa el resultado para conversar, no como una etiqueta.', save: 'Guardar en el Perfil', saved: 'Guardado en el Perfil', saving: 'Guardando…', createToSave: 'Crea una cuenta gratis para guardar este resultado', signIn: 'Inicia sesión para guardar', share: 'Compartir Resultado', shared: 'Resultado copiado al portapapeles', again: 'Hacer el Quiz Otra Vez', answerAll: 'Elige una respuesta en cada comparación.', saveSuccess: 'Lenguaje del amor guardado en tu perfil.', saveError: 'No se pudo guardar el resultado ahora.', shareIntro: 'Mi coincidencia principal de Lenguaje del Amor es', takeQuiz: 'Haz gratis el Quiz de Lenguaje del Amor de One2OneLove:',
    names: { words: 'Palabras de Afirmación', quality: 'Tiempo de Calidad', gifts: 'Recibir Regalos', service: 'Actos de Servicio', touch: 'Contacto Físico' },
    choices: { words: 'Escuchar o leer palabras sinceras de aprecio.', quality: 'Tener tiempo juntos con atención completa y sin prisas.', gifts: 'Recibir un detalle pensado que demuestre que me recordaron.', service: 'Que alguien note lo que me ayudaría y lo haga.', touch: 'Sentir afecto físico cálido y bienvenido.' },
    descriptions: { words: 'Las palabras sinceras de ánimo y reconocimiento pueden llegar muy profundamente para ti.', quality: 'La atención es el regalo. Puedes sentirte más cerca cuando alguien está plenamente presente y reserva tiempo intencional.', gifts: 'El significado detrás de un detalle puede sentirse poderoso porque demuestra que alguien te recordó y pensó en ti.', service: 'Las acciones útiles suelen hablar fuerte para ti. La confiabilidad y el apoyo práctico pueden hacer tangible el cariño.', touch: 'La conexión física cálida puede ayudarte a sentir cercanía y seguridad. El consentimiento y la comodidad mutua siempre importan.' },
  },
  fr: {
    title: "Quiz sur les Langages de l'Amour", subtitle: 'Une réflexion rapide sur les façons dont vous vous sentez naturellement aimé(e).', question: 'Laquelle de ces options compterait le plus pour vous ?', of: 'sur', previous: 'Précédente', restart: 'Recommencer', strongest: 'Votre correspondance la plus forte', closeSecond: 'Deuxième correspondance proche', meaning: 'Ce que cela peut vous indiquer', reflection: "Il s'agit d'un outil de réflexion informel, et non d'une évaluation clinique ou validée. Utilisez le résultat pour ouvrir une conversation, pas comme une étiquette.", save: 'Enregistrer dans le Profil', saved: 'Enregistré dans le Profil', saving: 'Enregistrement…', createToSave: 'Créez un compte gratuit pour enregistrer ce résultat', signIn: 'Se connecter pour enregistrer', share: 'Partager le Résultat', shared: 'Résultat copié dans le presse-papiers', again: 'Refaire le Quiz', answerAll: 'Choisissez une réponse pour chaque comparaison.', saveSuccess: "Langage de l'amour enregistré dans votre profil.", saveError: "Impossible d'enregistrer votre résultat maintenant.", shareIntro: "Ma correspondance principale de Langage de l'Amour est", takeQuiz: "Faites gratuitement le Quiz sur les Langages de l'Amour de One2OneLove :",
    names: { words: 'Paroles Valorisantes', quality: 'Moments de Qualité', gifts: 'Recevoir des Cadeaux', service: 'Services Rendus', touch: 'Toucher Physique' },
    choices: { words: "Entendre ou lire des mots sincères d'appréciation.", quality: 'Avoir du temps ensemble, pleinement attentif et sans précipitation.', gifts: "Recevoir une petite attention qui montre qu'on a pensé à moi.", service: "Que quelqu'un remarque ce qui pourrait m'aider et le fasse.", touch: 'Ressentir une affection physique chaleureuse et bienvenue.' },
    descriptions: { words: "Les mots sincères d'encouragement et de reconnaissance peuvent vous toucher profondément.", quality: "L'attention est le cadeau. Vous pouvez vous sentir plus proche lorsque quelqu'un est pleinement présent et réserve du temps intentionnel.", gifts: "Le sens derrière une attention peut être puissant parce qu'il montre que quelqu'un s'est souvenu de vous et a pensé à vous.", service: "Les gestes utiles parlent souvent fort pour vous. La fiabilité et le soutien pratique peuvent rendre l'affection concrète.", touch: 'Une connexion physique chaleureuse peut renforcer la proximité et le réconfort. Le consentement et le confort mutuel restent essentiels.' },
  },
  it: {
    title: "Quiz sui Linguaggi dell'Amore", subtitle: 'Una breve riflessione sui modi in cui ti senti più naturalmente amato/a.', question: 'Quale di queste opzioni avrebbe più significato per te?', of: 'di', previous: 'Precedente', restart: 'Ricomincia', strongest: 'La tua corrispondenza più forte', closeSecond: 'Seconda corrispondenza vicina', meaning: 'Cosa può suggerirti', reflection: 'Questo è uno strumento informale di riflessione, non una valutazione clinica o validata. Usa il risultato per iniziare una conversazione, non come etichetta.', save: 'Salva nel Profilo', saved: 'Salvato nel Profilo', saving: 'Salvataggio…', createToSave: 'Crea un account gratuito per salvare questo risultato', signIn: 'Accedi per salvare', share: 'Condividi Risultato', shared: 'Risultato copiato negli appunti', again: 'Rifai il Quiz', answerAll: 'Scegli una risposta per ogni confronto.', saveSuccess: "Linguaggio dell'amore salvato nel profilo.", saveError: 'Impossibile salvare il risultato in questo momento.', shareIntro: "La mia corrispondenza principale del Linguaggio dell'Amore è", takeQuiz: "Fai gratis il Quiz sui Linguaggi dell'Amore di One2OneLove:",
    names: { words: 'Parole di Affermazione', quality: 'Tempo di Qualità', gifts: 'Ricevere Regali', service: 'Atti di Servizio', touch: 'Contatto Fisico' },
    choices: { words: 'Sentire o leggere parole sincere di apprezzamento.', quality: 'Avere tempo insieme con piena attenzione e senza fretta.', gifts: 'Ricevere un pensiero che dimostri che qualcuno si è ricordato di me.', service: 'Che qualcuno noti cosa potrebbe aiutarmi e lo faccia.', touch: 'Sentire un affetto fisico caldo e gradito.' },
    descriptions: { words: 'Parole sincere di incoraggiamento e riconoscimento possono arrivarti molto in profondità.', quality: "L'attenzione è il regalo. Potresti sentirti più vicino/a quando qualcuno è pienamente presente e dedica tempo intenzionale.", gifts: 'Il significato dietro un pensiero può essere potente perché mostra che qualcuno si è ricordato di te.', service: "Le azioni utili spesso parlano forte per te. Affidabilità e sostegno pratico possono rendere concreto l'affetto.", touch: 'Una connessione fisica calorosa può aumentare vicinanza e rassicurazione. Consenso e comfort reciproco sono sempre fondamentali.' },
  },
  de: {
    title: 'Love-Language-Quiz', subtitle: 'Eine kurze Reflexion darüber, auf welche Weise Sie sich besonders wertgeschätzt fühlen.', question: 'Welche dieser Möglichkeiten würde Ihnen mehr bedeuten?', of: 'von', previous: 'Zurück', restart: 'Neu starten', strongest: 'Ihre stärkste Übereinstimmung', closeSecond: 'Knapp dahinter', meaning: 'Was das bedeuten könnte', reflection: 'Dies ist ein informelles Reflexionswerkzeug, keine klinische oder validierte Beurteilung. Nutzen Sie das Ergebnis als Gesprächseinstieg, nicht als Etikett.', save: 'Im Profil Speichern', saved: 'Im Profil Gespeichert', saving: 'Speichern…', createToSave: 'Kostenloses Konto erstellen, um dieses Ergebnis zu speichern', signIn: 'Zum Speichern anmelden', share: 'Ergebnis Teilen', shared: 'Ergebnis in die Zwischenablage kopiert', again: 'Quiz Erneut Machen', answerAll: 'Wählen Sie bei jedem Vergleich eine Antwort.', saveSuccess: 'Love Language im Profil gespeichert.', saveError: 'Das Ergebnis kann gerade nicht gespeichert werden.', shareIntro: 'Meine stärkste Love-Language-Übereinstimmung ist', takeQuiz: 'Mach das kostenlose One2OneLove Love-Language-Quiz:',
    names: { words: 'Worte der Anerkennung', quality: 'Gemeinsame Qualitätszeit', gifts: 'Geschenke Erhalten', service: 'Hilfsbereite Taten', touch: 'Körperliche Nähe' },
    choices: { words: 'Aufrichtige Worte der Wertschätzung hören oder lesen.', quality: 'Konzentrierte, ungestörte Zeit miteinander haben.', gifts: 'Eine durchdachte Kleinigkeit bekommen, die zeigt, dass an mich gedacht wurde.', service: 'Dass jemand merkt, was mir helfen würde, und es einfach tut.', touch: 'Warme, willkommene körperliche Zuneigung spüren.' },
    descriptions: { words: 'Aufrichtige Ermutigung und Anerkennung können Sie besonders tief erreichen.', quality: 'Aufmerksamkeit ist das Geschenk. Nähe kann besonders entstehen, wenn jemand ganz präsent ist und bewusst Zeit einplant.', gifts: 'Die Bedeutung hinter einer Aufmerksamkeit kann stark sein, weil sie zeigt, dass jemand an Sie gedacht hat.', service: 'Hilfreiche Handlungen sprechen für Sie oft besonders deutlich. Verlässlichkeit und praktische Unterstützung können Fürsorge greifbar machen.', touch: 'Warme körperliche Verbindung kann Nähe und Sicherheit stärken. Zustimmung und gegenseitiges Wohlbefinden sind immer entscheidend.' },
  },
  nl: {
    title: 'Liefdestaal Quiz', subtitle: 'Een korte reflectie op de manieren waarop jij je het meest vanzelfsprekend geliefd voelt.', question: 'Welke van deze twee zou meer voor jou betekenen?', of: 'van', previous: 'Vorige', restart: 'Opnieuw', strongest: 'Je sterkste match', closeSecond: 'Goede tweede', meaning: 'Wat dit je kan vertellen', reflection: 'Dit is een informele reflectietool, geen klinische of gevalideerde beoordeling. Gebruik de uitslag als gespreksstarter, niet als etiket.', save: 'Opslaan in Profiel', saved: 'Opgeslagen in Profiel', saving: 'Opslaan…', createToSave: 'Maak een gratis account om deze uitslag op te slaan', signIn: 'Log in om op te slaan', share: 'Deel Uitslag', shared: 'Uitslag naar je klembord gekopieerd', again: 'Doe de Quiz Opnieuw', answerAll: 'Kies bij elke vergelijking één antwoord.', saveSuccess: 'Liefdestaal opgeslagen in je profiel.', saveError: 'Je uitslag kan nu niet worden opgeslagen.', shareIntro: 'Mijn sterkste Liefdestaal-match is', takeQuiz: 'Doe de gratis One2OneLove Liefdestaal Quiz:',
    names: { words: 'Bevestigende Woorden', quality: 'Kwaliteitstijd', gifts: 'Cadeaus Ontvangen', service: 'Daden van Dienstbaarheid', touch: 'Fysieke Aanraking' },
    choices: { words: 'Oprechte woorden van waardering horen of lezen.', quality: 'Gerichte, ongestoorde tijd samen hebben.', gifts: 'Een attent gebaar krijgen waaruit blijkt dat iemand aan mij dacht.', service: 'Dat iemand ziet wat mij zou helpen en het gewoon doet.', touch: 'Warme, welkome lichamelijke genegenheid voelen.' },
    descriptions: { words: 'Oprechte aanmoediging en erkenning kunnen bij jou extra diep binnenkomen.', quality: 'Aandacht is het cadeau. Je kunt je het meest verbonden voelen wanneer iemand volledig aanwezig is en bewust tijd maakt.', gifts: 'De betekenis achter een attent gebaar kan krachtig voelen omdat het laat zien dat iemand aan je dacht.', service: 'Behulpzame acties spreken voor jou vaak luid. Betrouwbaarheid en praktische steun kunnen zorg tastbaar maken.', touch: 'Warme lichamelijke verbinding kan nabijheid en geruststelling versterken. Toestemming en wederzijds comfort blijven altijd belangrijk.' },
  },
};

const ICONS = {
  words: MessageCircle,
  quality: Clock,
  gifts: Gift,
  service: Hand,
  touch: Heart,
};

const COLORS = {
  words: 'from-blue-500 to-cyan-500',
  quality: 'from-purple-500 to-pink-500',
  gifts: 'from-pink-500 to-red-500',
  service: 'from-green-500 to-emerald-500',
  touch: 'from-rose-500 to-pink-500',
};

const scoreAnswers = (answers) => {
  const scores = Object.fromEntries(LANGUAGE_ORDER.map((id) => [id, 0]));
  for (const value of Object.values(answers || {})) {
    if (Object.prototype.hasOwnProperty.call(scores, value)) scores[value] += 1;
  }
  const ranked = [...LANGUAGE_ORDER].sort((a, b) => scores[b] - scores[a] || LANGUAGE_ORDER.indexOf(a) - LANGUAGE_ORDER.indexOf(b));
  return { scores, primary: ranked[0], secondary: ranked[1] };
};

const savePendingResult = (result) => {
  try {
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ ...result, savedAt: Date.now() }));
  } catch {
    // Session storage is convenience only; quiz result remains in component state.
  }
};

const loadPendingResult = () => {
  try {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.primary || !LANGUAGE_ORDER.includes(parsed.primary)) return null;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function LoveLanguageQuizRelaunch() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const { user, isAuthenticated, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const restored = useMemo(() => loadPendingResult(), []);
  const [currentQuestion, setCurrentQuestion] = useState(restored ? PAIRS.length : 0);
  const [answers, setAnswers] = useState(restored?.answers || {});
  const [result, setResult] = useState(restored ? { primary: restored.primary, secondary: restored.secondary, scores: restored.scores || {} } : null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(false);
  }, [user?.id, result?.primary]);

  const finishQuiz = (finalAnswers) => {
    if (Object.keys(finalAnswers).length !== PAIRS.length) {
      toast.error(t.answerAll);
      return;
    }
    const scored = scoreAnswers(finalAnswers);
    setAnswers(finalAnswers);
    setResult(scored);
    setCurrentQuestion(PAIRS.length);
    savePendingResult({ ...scored, answers: finalAnswers });
  };

  const choose = (value) => {
    const next = { ...answers, [currentQuestion]: value };
    if (currentQuestion === PAIRS.length - 1) finishQuiz(next);
    else {
      setAnswers(next);
      setCurrentQuestion((index) => index + 1);
    }
  };

  const restart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setIsSaved(false);
    try { sessionStorage.removeItem(RESULT_STORAGE_KEY); } catch { /* noop */ }
  };

  const saveResult = async () => {
    if (!result?.primary) return;
    if (!isAuthenticated || !user?.id) {
      savePendingResult({ ...result, answers });
      navigate(`/SignIn?returnTo=${encodeURIComponent('/LoveLanguageQuiz')}`);
      return;
    }

    setIsSaving(true);
    try {
      await saveLoveLanguage(user.id, result.primary);
      await refreshUserProfile();
      setIsSaved(true);
      toast.success(t.saveSuccess);
    } catch (error) {
      console.error('Unable to save Love Language result:', error);
      toast.error(t.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const createAccount = () => {
    if (!result?.primary) return;
    savePendingResult({ ...result, answers });
    navigate(`/SignUp?returnTo=${encodeURIComponent('/LoveLanguageQuiz')}`);
  };

  const shareResult = async () => {
    if (!result?.primary) return;
    const url = `${window.location.origin}/LoveLanguageQuiz`;
    const text = `${t.shareIntro} ${t.names[result.primary]}. ${t.takeQuiz} ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: t.title, text, url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.shared);
    } catch {
      toast.error(t.saveError);
    }
  };

  if (result) {
    const primary = result.primary;
    const secondary = result.secondary;
    const PrimaryIcon = ICONS[primary];
    const showSecondary = secondary && result.scores?.[secondary] >= Math.max(0, (result.scores?.[primary] || 0) - 1);

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="overflow-hidden border-0 bg-white shadow-2xl">
              <CardContent className="p-7 text-center sm:p-10">
                <div className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${COLORS[primary]} shadow-xl`}>
                  <PrimaryIcon className="h-12 w-12 text-white" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-600">{t.strongest}</p>
                <h1 className="mt-2 text-4xl font-bold text-gray-900 sm:text-5xl">{t.names[primary]}</h1>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-700">{t.descriptions[primary]}</p>

                {showSecondary && (
                  <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-purple-100 bg-purple-50 p-4 text-left">
                    <p className="text-xs font-bold uppercase tracking-wide text-purple-600">{t.closeSecond}</p>
                    <p className="mt-1 font-semibold text-gray-800">{t.names[secondary]}</p>
                  </div>
                )}

                <div className="mx-auto mt-7 max-w-2xl rounded-2xl bg-gray-50 p-5 text-left">
                  <h2 className="font-bold text-gray-900">{t.meaning}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.reflection}</p>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {isAuthenticated ? (
                    <Button onClick={saveResult} disabled={isSaving || isSaved} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                      {isSaved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                      {isSaved ? t.saved : isSaving ? t.saving : t.save}
                    </Button>
                  ) : (
                    <>
                      <Button onClick={createAccount} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"><UserPlus className="mr-2 h-4 w-4" />{t.createToSave}</Button>
                      <Button variant="outline" onClick={saveResult}>{t.signIn}</Button>
                    </>
                  )}
                  <Button variant="outline" onClick={shareResult}><Share2 className="mr-2 h-4 w-4" />{t.share}</Button>
                  <Button variant="outline" onClick={restart}><RotateCcw className="mr-2 h-4 w-4" />{t.again}</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const pair = PAIRS[currentQuestion];
  const options = pair || PAIRS[0];
  const progress = ((currentQuestion + 1) / PAIRS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Heart className="h-10 w-10 fill-white text-white" /></div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">{t.subtitle}</p>
        </motion.div>

        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-600"><span>{currentQuestion + 1} {t.of} {PAIRS.length}</span><button type="button" onClick={restart} className="font-semibold text-purple-600 hover:text-purple-700">{t.restart}</button></div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200"><motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600" /></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion} initial={{ opacity: 0, x: 35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -35 }}>
            <Card className="border-0 bg-white shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">{t.question}</h2>
                <div className="space-y-4">
                  {options.map((id) => {
                    const Icon = ICONS[id];
                    return (
                      <button key={id} type="button" onClick={() => choose(id)} className="group flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 p-5 text-left transition hover:border-pink-400 hover:bg-pink-50">
                        <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${COLORS[id]}`}><Icon className="h-6 w-6 text-white" /></span>
                        <span className="flex-1 text-base font-medium leading-relaxed text-gray-700">{t.choices[id]}</span>
                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-pink-500 opacity-60 transition group-hover:translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5">
          {currentQuestion > 0 && (
            <Button variant="outline" onClick={() => setCurrentQuestion((index) => Math.max(0, index - 1))}><ChevronLeft className="mr-2 h-4 w-4" />{t.previous}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
