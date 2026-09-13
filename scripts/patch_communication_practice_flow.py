from pathlib import Path

p = Path('src/pages/CommunicationPractice.jsx')
s = p.read_text()

needle = "const ROUND_SIZE = 20;\n"
insert = '''const ROUND_SIZE = 20;\n\nconst sessionLabels = {\n  en: { nextQuestion: \"Next Question\", endSession: \"End Session\", reportCard: \"Session Report\", questionsAnswered: \"Questions Answered\" },\n  es: { nextQuestion: \"Siguiente Pregunta\", endSession: \"Finalizar Sesión\", reportCard: \"Informe de la Sesión\", questionsAnswered: \"Preguntas Respondidas\" },\n  fr: { nextQuestion: \"Question Suivante\", endSession: \"Terminer la Session\", reportCard: \"Bilan de la Session\", questionsAnswered: \"Questions Répondues\" },\n  it: { nextQuestion: \"Domanda Successiva\", endSession: \"Termina Sessione\", reportCard: \"Rapporto della Sessione\", questionsAnswered: \"Domande Risposte\" },\n  de: { nextQuestion: \"Nächste Frage\", endSession: \"Sitzung Beenden\", reportCard: \"Sitzungsbericht\", questionsAnswered: \"Beantwortete Fragen\" }\n};\n\nconst shuffleArray = (items) => {\n  const shuffled = [...items];\n  for (let i = shuffled.length - 1; i > 0; i -= 1) {\n    const j = Math.floor(Math.random() * (i + 1));\n    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];\n  }\n  return shuffled;\n};\n\nconst buildScenarioList = (roundScenarioIds, scenarios) => {\n  const correctPositions = shuffleArray(\n    roundScenarioIds.map((_, index) => index % 4)\n  );\n\n  return roundScenarioIds.map((key, index) => {\n    const source = scenarios[key];\n    const correct = source.options.find(option => option.type === 'excellent');\n    const others = shuffleArray(source.options.filter(option => option.type !== 'excellent'));\n    const options = [...others];\n    options.splice(correctPositions[index], 0, correct);\n\n    return {\n      id: key,\n      ...source,\n      options\n    };\n  });\n};\n'''
if needle not in s:
    raise SystemExit('ROUND_SIZE marker not found')
s = s.replace(needle, insert, 1)

s = s.replace(
"  const t = translations[currentLanguage] || translations.en;\n  const scenarios = communicationPracticeScenarios[currentLanguage] || communicationPracticeScenarios.en;\n",
"  const t = translations[currentLanguage] || translations.en;\n  const sessionText = sessionLabels[currentLanguage] || sessionLabels.en;\n  const scenarios = communicationPracticeScenarios[currentLanguage] || communicationPracticeScenarios.en;\n",
1)

s = s.replace(
"  const [roundResults, setRoundResults] = useState({});\n\n  const scenarioList = useMemo(() => roundScenarioIds.map(key => ({\n    id: key,\n    ...scenarios[key],\n    options: [...scenarios[key].options].sort(() => Math.random() - 0.5)\n  })), [roundScenarioIds, scenarios]);\n",
"  const [roundResults, setRoundResults] = useState({});\n  const [sessionEnded, setSessionEnded] = useState(false);\n\n  const scenarioList = useMemo(\n    () => buildScenarioList(roundScenarioIds, scenarios),\n    [roundScenarioIds, scenarios]\n  );\n",
1)

s = s.replace(
"  const roundComplete = answeredCount === ROUND_SIZE;\n",
"  const roundComplete = answeredCount === ROUND_SIZE;\n  const sessionFinished = sessionEnded || roundComplete;\n",
1)

old = '''  const handleResponseSelect = (option) => {\n    setSelectedResponse(option);\n    setShowFeedback(true);\n\n    if (!(selectedScenario.id in roundResults)) {\n      setRoundResults(prev => ({ ...prev, [selectedScenario.id]: option.type === 'excellent' }));\n    }\n    \n    if (option.type === 'excellent' && !completedScenarios.includes(selectedScenario.id)) {\n      setCompletedScenarios([...completedScenarios, selectedScenario.id]);\n      toast.success(t.completed);\n    }\n  };\n'''
new = '''  const handleResponseSelect = (option) => {\n    setSelectedResponse(option);\n    setShowFeedback(true);\n\n    if (!(selectedScenario.id in roundResults)) {\n      setRoundResults(prev => ({ ...prev, [selectedScenario.id]: option.type === 'excellent' }));\n    }\n\n    if (!completedScenarios.includes(selectedScenario.id)) {\n      setCompletedScenarios(prev => [...prev, selectedScenario.id]);\n    }\n\n    if (option.type === 'excellent') {\n      toast.success(t.completed);\n    }\n  };\n'''
if old not in s:
    raise SystemExit('handleResponseSelect block not found')
s = s.replace(old, new, 1)

old = '''  const handleTryAgain = () => {\n    setSelectedResponse(null);\n    setShowFeedback(false);\n  };\n\n'''
s = s.replace(old, '', 1)

s = s.replace(
"  const handleNewRound = () => {\n",
"  const handleEndSession = () => {\n    setSessionEnded(true);\n    setSelectedScenario(null);\n    setSelectedResponse(null);\n    setShowFeedback(false);\n  };\n\n  const handleNewRound = () => {\n",
1)

s = s.replace(
"    setRoundResults({});\n  };\n",
"    setRoundResults({});\n    setSessionEnded(false);\n  };\n",
1)

s = s.replace(
"      <h3 className=\"text-3xl font-bold text-gray-900 mb-6\">{t.roundComplete}</h3>\n      <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6\">\n",
"      <h3 className=\"text-3xl font-bold text-gray-900 mb-6\">{sessionText.reportCard}</h3>\n      <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-6\">\n        <div className=\"bg-white rounded-xl p-5 shadow-sm border border-blue-200\">\n          <div className=\"text-sm text-gray-600\">{sessionText.questionsAnswered}</div>\n          <div className=\"text-3xl font-bold text-blue-600\">{answeredCount}</div>\n        </div>\n",
1)

s = s.replace(
"        {roundComplete && !selectedScenario ? roundSummary : !selectedScenario ? (\n",
"        {sessionFinished && !selectedScenario ? roundSummary : !selectedScenario ? (\n",
1)

s = s.replace(
'''                  <Button\n                    variant="ghost"\n                    size="sm"\n                    onClick={() => setSelectedScenario(null)}\n                  >\n                    ← Back\n                  </Button>\n''',
'''                  {!showFeedback && (\n                    <Button\n                      variant="ghost"\n                      size="sm"\n                      onClick={() => setSelectedScenario(null)}\n                    >\n                      ← Back\n                    </Button>\n                  )}\n''',
1)

s = s.replace(
"                          {selectedResponse.type === 'excellent' ? t.excellent : \n                           selectedResponse.type === 'good' ? t.good : t.needsWork}\n",
"                          {selectedResponse.type === 'excellent' ? t.excellent : t.needsWork}\n",
1)

old_actions = '''                      <div className="flex gap-3">\n                        {selectedResponse.type !== 'excellent' && (\n                          <Button\n                            onClick={handleTryAgain}\n                            variant="outline"\n                            className="flex-1"\n                          >\n                            <RotateCcw className="w-4 h-4 mr-2" />\n                            {t.tryAgain}\n                          </Button>\n                        )}\n                        <Button\n                          onClick={handleNextScenario}\n                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"\n                        >\n                          {t.nextScenario}\n                          <ArrowRight className="w-4 h-4 ml-2" />\n                        </Button>\n                      </div>\n'''
new_actions = '''                      <div className="flex flex-col sm:flex-row gap-3">\n                        <Button\n                          onClick={handleNextScenario}\n                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"\n                        >\n                          {sessionText.nextQuestion}\n                          <ArrowRight className="w-4 h-4 ml-2" />\n                        </Button>\n                        <Button\n                          onClick={handleEndSession}\n                          variant="outline"\n                          className="flex-1"\n                        >\n                          {sessionText.endSession}\n                        </Button>\n                      </div>\n'''
if old_actions not in s:
    raise SystemExit('feedback action block not found')
s = s.replace(old_actions, new_actions, 1)

p.write_text(s)
print('Patched Communication Practice flow.')
