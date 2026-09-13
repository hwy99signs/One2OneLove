
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, ArrowRight, RotateCcw, CheckCircle, AlertCircle, Lightbulb, Heart, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { communicationPracticeScenarios } from "@/components/communication/CommunicationPracticeScenarios";

const translations = {
  en: {
    title: "Communication Practice Simulator",
    subtitle: "Practice healthy communication patterns in realistic relationship scenarios",
    back: "Back to Support",
    selectScenario: "Select a Scenario",
    yourResponse: "Choose Your Response",
    feedback: "Feedback",
    tryAgain: "Try Again",
    nextScenario: "Next Scenario",
    excellent: "Excellent Choice!",
    good: "Good Approach",
    needsWork: "Needs Improvement",
    completed: "Scenario Complete!",
    scenario: "Scenario",
    of: "of",
    roundComplete: "Round Complete!",
    correctAnswers: "Correct Answers",
    wrongAnswers: "Wrong Answers",
    percentageScore: "Percentage Score",
    newRound: "Try Again",
    scenarios: {
      conflict: {
        title: "Resolving a Disagreement",
        situation: "Your partner forgot an important date you both agreed on. You feel disappointed and hurt.",
        options: [
          {
            text: "Why do you always forget important things? You never listen to me!",
            type: "poor",
            feedback: "This response uses accusatory language ('always', 'never') and attacks the person rather than addressing the behavior. It escalates conflict."
          },
          {
            text: "I feel hurt that our date was forgotten. Can we talk about what happened and how to prevent this?",
            type: "excellent",
            feedback: "Perfect! You used 'I' statements, expressed your feelings without blame, and opened the door for collaborative problem-solving."
          },
          {
            text: "Whatever, it's fine. I didn't care about it anyway.",
            type: "poor",
            feedback: "This dismissive response avoids the real issue and doesn't allow for genuine communication. Suppressing feelings can lead to resentment."
          },
          {
            text: "I'm disappointed this happened. I know you didn't mean to hurt me. Can we find a solution together?",
            type: "good",
            feedback: "Great approach! You acknowledged your feelings, gave benefit of the doubt, and invited collaboration. Consider being more specific about what happened."
          }
        ]
      },
      needs: {
        title: "Expressing Your Needs",
        situation: "You've been feeling disconnected lately and want more quality time together, but your partner has been very busy with work.",
        options: [
          {
            text: "You care more about work than about us. I guess I'm just not a priority anymore.",
            type: "poor",
            feedback: "This assumes negative intent and makes accusations. It puts your partner on the defensive rather than opening a constructive dialogue."
          },
          {
            text: "I miss spending quality time with you. I understand work is demanding. Can we schedule some time for just us this week?",
            type: "excellent",
            feedback: "Excellent! You expressed your needs clearly, showed understanding of their situation, and proposed a concrete solution."
          },
          {
            text: "I'll just wait until you have time for me, I guess.",
            type: "poor",
            feedback: "This passive approach doesn't communicate your needs clearly and may lead to resentment. Being direct about your needs is healthier."
          },
          {
            text: "I've been feeling a bit lonely lately. I know you're busy, but could we make time for a date night?",
            type: "good",
            feedback: "Good job expressing your feelings and making a request! To make it even better, be more specific about what quality time means to you."
          }
        ]
      },
      listening: {
        title: "Active Listening",
        situation: "Your partner is sharing stress about a difficult situation at work. They seem upset and need support.",
        options: [
          {
            text: "That's nothing. Let me tell you what happened to me today...",
            type: "poor",
            feedback: "This dismisses their feelings and shifts focus to yourself. When someone needs support, center their experience."
          },
          {
            text: "That sounds really stressful. Tell me more about what happened. How are you feeling about it?",
            type: "excellent",
            feedback: "Perfect active listening! You validated their feelings, showed interest, and invited them to share more without jumping to solutions."
          },
          {
            text: "You should just quit that job. Why do you even stay there?",
            type: "poor",
            feedback: "Jumping straight to advice without fully listening can feel dismissive. Ask first if they want advice or just need to vent."
          },
          {
            text: "I'm sorry you're going through this. That must be really hard. I'm here for you.",
            type: "good",
            feedback: "Good empathetic response! You validated their feelings and offered support. Consider asking follow-up questions to show deeper engagement."
          }
        ]
      },
      appreciation: {
        title: "Showing Appreciation",
        situation: "Your partner has been doing a lot around the house lately while you've been overwhelmed with other responsibilities.",
        options: [
          {
            text: "Thanks for doing the basics. That's what partners do.",
            type: "poor",
            feedback: "This minimizes their effort and sounds dismissive. Genuine appreciation means recognizing and valuing specific contributions."
          },
          {
            text: "I really appreciate how you've been taking care of things at home. It means so much, especially when I'm stressed. Thank you for being so supportive.",
            type: "excellent",
            feedback: "Beautiful! You were specific about what you appreciate, explained the impact, and expressed genuine gratitude. This strengthens your connection."
          },
          {
            text: "Yeah, I noticed. Good job.",
            type: "poor",
            feedback: "This acknowledgment is brief and lacks warmth or detail. Taking time to express heartfelt appreciation strengthens relationships."
          },
          {
            text: "Thank you for handling everything at home. You've really been helping me out.",
            type: "good",
            feedback: "Good acknowledgment! To make it more impactful, add specific details about what they did and how it made you feel."
          }
        ]
      }
    }
  },
  es: {
    title: "Simulador de Práctica de Comunicación",
    subtitle: "Practica patrones de comunicación saludables en escenarios realistas de relaciones",
    back: "Volver al Apoyo",
    selectScenario: "Selecciona un Escenario",
    yourResponse: "Elige Tu Respuesta",
    feedback: "Retroalimentación",
    tryAgain: "Intentar de Nuevo",
    nextScenario: "Siguiente Escenario",
    excellent: "¡Excelente Elección!",
    good: "Buen Enfoque",
    needsWork: "Necesita Mejorar",
    completed: "¡Escenario Completo!",
    scenario: "Escenario",
    of: "de",
    roundComplete: "¡Ronda Completada!",
    correctAnswers: "Respuestas Correctas",
    wrongAnswers: "Respuestas Incorrectas",
    percentageScore: "Puntuación Porcentual",
    newRound: "Intentar de Nuevo"
  },
  fr: {
    title: "Simulateur de Pratique de Communication",
    subtitle: "Pratiquez des schémas de communication sains dans des scénarios de relation réalistes",
    back: "Retour au Soutien",
    selectScenario: "Sélectionnez un Scénario",
    yourResponse: "Choisissez Votre Réponse",
    feedback: "Retour",
    tryAgain: "Réessayer",
    nextScenario: "Scénario Suivant",
    excellent: "Excellent Choix!",
    good: "Bonne Approche",
    needsWork: "Besoin d'Amélioration",
    completed: "Scénario Terminé!",
    scenario: "Scénario",
    of: "de",
    roundComplete: "Tour Terminé !",
    correctAnswers: "Bonnes Réponses",
    wrongAnswers: "Mauvaises Réponses",
    percentageScore: "Score en Pourcentage",
    newRound: "Réessayer"
  },
  it: {
    title: "Simulatore di Pratica di Comunicazione",
    subtitle: "Pratica modelli di comunicazione sani in scenari di relazione realistici",
    back: "Torna al Supporto",
    selectScenario: "Seleziona uno Scenario",
    yourResponse: "Scegli la Tua Risposta",
    feedback: "Feedback",
    tryAgain: "Riprova",
    nextScenario: "Prossimo Scenario",
    excellent: "Scelta Eccellente!",
    good: "Buon Approccio",
    needsWork: "Necessita Miglioramento",
    completed: "Scenario Completato!",
    scenario: "Scenario",
    of: "di",
    roundComplete: "Turno Completato!",
    correctAnswers: "Risposte Corrette",
    wrongAnswers: "Risposte Sbagliate",
    percentageScore: "Punteggio Percentuale",
    newRound: "Riprova"
  },
  de: {
    title: "Kommunikationspraxis-Simulator",
    subtitle: "Üben Sie gesunde Kommunikationsmuster in realistischen Beziehungsszenarien",
    back: "Zurück zur Unterstützung",
    selectScenario: "Wählen Sie ein Szenario",
    yourResponse: "Wählen Sie Ihre Antwort",
    feedback: "Rückmeldung",
    tryAgain: "Erneut Versuchen",
    nextScenario: "Nächstes Szenario",
    excellent: "Ausgezeichnete Wahl!",
    good: "Guter Ansatz",
    needsWork: "Verbesserungsbedarf",
    completed: "Szenario Abgeschlossen!",
    scenario: "Szenario",
    of: "von",
    roundComplete: "Runde Abgeschlossen!",
    correctAnswers: "Richtige Antworten",
    wrongAnswers: "Falsche Antworten",
    percentageScore: "Prozentwert",
    newRound: "Erneut Versuchen"
  }
};

const ROUND_SIZE = 20;

const sessionLabels = {
  en: { nextQuestion: "Next Question", endSession: "End Session", reportCard: "Session Report", questionsAnswered: "Questions Answered", exit: "Exit" },
  es: { nextQuestion: "Siguiente Pregunta", endSession: "Finalizar Sesión", reportCard: "Informe de la Sesión", questionsAnswered: "Preguntas Respondidas", exit: "Salir" },
  fr: { nextQuestion: "Question Suivante", endSession: "Terminer la Session", reportCard: "Bilan de la Session", questionsAnswered: "Questions Répondues", exit: "Quitter" },
  it: { nextQuestion: "Domanda Successiva", endSession: "Termina Sessione", reportCard: "Rapporto della Sessione", questionsAnswered: "Domande Risposte", exit: "Esci" },
  de: { nextQuestion: "Nächste Frage", endSession: "Sitzung Beenden", reportCard: "Sitzungsbericht", questionsAnswered: "Beantwortete Fragen", exit: "Beenden" }
};

const shuffleArray = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const buildScenarioList = (roundScenarioIds, scenarios) => {
  const correctPositions = shuffleArray(
    roundScenarioIds.map((_, index) => index % 4)
  );

  return roundScenarioIds.map((key, index) => {
    const source = scenarios[key];
    const correct = source.options.find(option => option.type === 'excellent');
    const others = shuffleArray(source.options.filter(option => option.type !== 'excellent'));
    const options = [...others];
    options.splice(correctPositions[index], 0, correct);

    return {
      id: key,
      ...source,
      options
    };
  });
};

const pickRoundIds = (allIds, previousIds = []) => {
  const previous = new Set(previousIds);
  const fresh = allIds.filter(id => !previous.has(id));
  const preferred = fresh.length >= ROUND_SIZE ? fresh : allIds;
  return [...preferred].sort(() => Math.random() - 0.5).slice(0, ROUND_SIZE);
};

export default function CommunicationPractice() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const sessionText = sessionLabels[currentLanguage] || sessionLabels.en;
  const scenarios = communicationPracticeScenarios[currentLanguage] || communicationPracticeScenarios.en;
  
  const allScenarioIds = Object.keys(scenarios);
  const [roundScenarioIds, setRoundScenarioIds] = useState(() => pickRoundIds(allScenarioIds));
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState([]);
  const [roundResults, setRoundResults] = useState({});
  const [sessionEnded, setSessionEnded] = useState(false);

  const scenarioList = useMemo(
    () => buildScenarioList(roundScenarioIds, scenarios),
    [roundScenarioIds, scenarios]
  );

  const correctAnswers = Object.values(roundResults).filter(Boolean).length;
  const answeredCount = Object.keys(roundResults).length;
  const wrongAnswers = answeredCount - correctAnswers;
  const percentageScore = answeredCount ? Math.round((correctAnswers / answeredCount) * 100) : 0;
  const roundComplete = answeredCount === ROUND_SIZE;
  const sessionFinished = sessionEnded || roundComplete;

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setSelectedResponse(null);
    setShowFeedback(false);
  };

  const handleResponseSelect = (option) => {
    setSelectedResponse(option);
    setShowFeedback(true);

    if (!(selectedScenario.id in roundResults)) {
      setRoundResults(prev => ({ ...prev, [selectedScenario.id]: option.type === 'excellent' }));
    }

    if (!completedScenarios.includes(selectedScenario.id)) {
      setCompletedScenarios(prev => [...prev, selectedScenario.id]);
    }

    if (option.type === 'excellent') {
      toast.success(t.completed);
    }
  };

  const handleNextScenario = () => {
    const currentIndex = scenarioList.findIndex(s => s.id === selectedScenario.id);
    const unanswered = scenarioList.find((scenario, index) => index > currentIndex && !(scenario.id in roundResults))
      || scenarioList.find(scenario => !(scenario.id in roundResults));
    if (answeredCount >= ROUND_SIZE || !unanswered) {
      setSelectedScenario(null);
      setSelectedResponse(null);
      setShowFeedback(false);
      return;
    }
    handleScenarioSelect(unanswered);
  };

  const handleEndSession = () => {
    setSessionEnded(true);
    setSelectedScenario(null);
    setSelectedResponse(null);
    setShowFeedback(false);
  };

  const handleNewRound = () => {
    const previousRound = roundScenarioIds;
    setRoundScenarioIds(pickRoundIds(allScenarioIds, previousRound));
    setSelectedScenario(null);
    setSelectedResponse(null);
    setShowFeedback(false);
    setCompletedScenarios([]);
    setRoundResults({});
    setSessionEnded(false);
  };

  const getFeedbackIcon = (type) => {
    switch(type) {
      case 'excellent':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'good':
        return <Lightbulb className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
    }
  };

  const getFeedbackColor = (type) => {
    switch(type) {
      case 'excellent':
        return 'from-green-50 to-emerald-50 border-green-300';
      case 'good':
        return 'from-blue-50 to-cyan-50 border-blue-300';
      default:
        return 'from-orange-50 to-yellow-50 border-orange-300';
    }
  };

  const roundSummary = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 text-center"
    >
      <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h3 className="text-3xl font-bold text-gray-900 mb-6">{sessionText.reportCard}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200">
          <div className="text-sm text-gray-600">{sessionText.questionsAnswered}</div>
          <div className="text-3xl font-bold text-blue-600">{answeredCount}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
          <div className="text-sm text-gray-600">{t.correctAnswers}</div>
          <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
          <div className="text-sm text-gray-600">{t.wrongAnswers}</div>
          <div className="text-3xl font-bold text-red-600">{wrongAnswers}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-200">
          <div className="text-sm text-gray-600">{t.percentageScore}</div>
          <div className="text-3xl font-bold text-purple-600">{percentageScore}%</div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <Button onClick={handleNewRound} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8">
          <RotateCcw className="w-4 h-4 mr-2" />
          {t.newRound}
        </Button>
        <Button asChild variant="outline" className="flex-1 px-8">
          <Link to={createPageUrl("CoupleSupport")}>
            {sessionText.exit}
          </Link>
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            to={createPageUrl("CoupleSupport")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 font-dancing">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        {sessionFinished && !selectedScenario ? roundSummary : !selectedScenario ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t.selectScenario}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenarioList.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-300 relative"
                    onClick={() => handleScenarioSelect(scenario)}
                  >
                    {completedScenarios.includes(scenario.id) && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {scenario.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{scenario.situation}</p>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Start Practice
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {selectedScenario.title}
                  </CardTitle>
                  {!showFeedback && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedScenario(null)}
                    >
                      ← Back
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {selectedScenario.situation}
                </p>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t.yourResponse}
              </h3>
              <div className="space-y-4">
                <AnimatePresence>
                  {selectedScenario.options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <button
                        onClick={() => handleResponseSelect(option)}
                        disabled={showFeedback}
                        className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                          selectedResponse === option
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                        } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <p className="text-gray-900">{option.text}</p>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {showFeedback && selectedResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className={`bg-gradient-to-br ${getFeedbackColor(selectedResponse.type)} border-2`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {getFeedbackIcon(selectedResponse.type)}
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          {selectedResponse.type === 'excellent' ? t.excellent : t.needsWork}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-800 text-lg leading-relaxed mb-6">
                        {selectedResponse.feedback}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleNextScenario}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          {sessionText.nextQuestion}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                          onClick={handleEndSession}
                          variant="outline"
                          className="flex-1"
                        >
                          {sessionText.endSession}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
