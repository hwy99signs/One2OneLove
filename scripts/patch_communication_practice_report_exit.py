from pathlib import Path

p = Path('src/pages/CommunicationPractice.jsx')
s = p.read_text()

replacements = {
'''  en: { nextQuestion: "Next Question", endSession: "End Session", reportCard: "Session Report", questionsAnswered: "Questions Answered" },''':
'''  en: { nextQuestion: "Next Question", endSession: "End Session", reportCard: "Session Report", questionsAnswered: "Questions Answered", exit: "Exit" },''',
'''  es: { nextQuestion: "Siguiente Pregunta", endSession: "Finalizar Sesión", reportCard: "Informe de la Sesión", questionsAnswered: "Preguntas Respondidas" },''':
'''  es: { nextQuestion: "Siguiente Pregunta", endSession: "Finalizar Sesión", reportCard: "Informe de la Sesión", questionsAnswered: "Preguntas Respondidas", exit: "Salir" },''',
'''  fr: { nextQuestion: "Question Suivante", endSession: "Terminer la Session", reportCard: "Bilan de la Session", questionsAnswered: "Questions Répondues" },''':
'''  fr: { nextQuestion: "Question Suivante", endSession: "Terminer la Session", reportCard: "Bilan de la Session", questionsAnswered: "Questions Répondues", exit: "Quitter" },''',
'''  it: { nextQuestion: "Domanda Successiva", endSession: "Termina Sessione", reportCard: "Rapporto della Sessione", questionsAnswered: "Domande Risposte" },''':
'''  it: { nextQuestion: "Domanda Successiva", endSession: "Termina Sessione", reportCard: "Rapporto della Sessione", questionsAnswered: "Domande Risposte", exit: "Esci" },''',
'''  de: { nextQuestion: "Nächste Frage", endSession: "Sitzung Beenden", reportCard: "Sitzungsbericht", questionsAnswered: "Beantwortete Fragen" }''':
'''  de: { nextQuestion: "Nächste Frage", endSession: "Sitzung Beenden", reportCard: "Sitzungsbericht", questionsAnswered: "Beantwortete Fragen", exit: "Beenden" }'''
}

for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'Missing session label block: {old}')
    s = s.replace(old, new, 1)

old = '''      <Button onClick={handleNewRound} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8">\n        <RotateCcw className="w-4 h-4 mr-2" />\n        {t.newRound}\n      </Button>'''
new = '''      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">\n        <Button onClick={handleNewRound} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8">\n          <RotateCcw className="w-4 h-4 mr-2" />\n          {t.newRound}\n        </Button>\n        <Button asChild variant="outline" className="flex-1 px-8">\n          <Link to={createPageUrl("CoupleSupport")}>\n            {sessionText.exit}\n          </Link>\n        </Button>\n      </div>'''

if old not in s:
    raise SystemExit('Report-card Try Again button block not found')
s = s.replace(old, new, 1)

p.write_text(s)
print('Added report-card Exit option.')
