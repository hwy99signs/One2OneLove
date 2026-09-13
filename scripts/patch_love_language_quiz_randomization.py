from pathlib import Path

p = Path('src/pages/LoveLanguageQuiz.jsx')
s = p.read_text()

old = 'import React, { useState } from "react";'
new = 'import React, { useState, useMemo } from "react";'
if old not in s:
    raise SystemExit('React import not found')
s = s.replace(old, new, 1)

anchor = 'import { toast } from "sonner";'
addition = anchor + '\nimport { buildLoveLanguageQuizSession } from "@/components/lovelanguage/LoveLanguageQuestionBank";'
if anchor not in s:
    raise SystemExit('Import anchor not found')
s = s.replace(anchor, addition, 1)

state_anchor = '  const [showResults, setShowResults] = useState(false);'
state_replacement = state_anchor + '\n  const [quizSeed, setQuizSeed] = useState(0);'
if state_anchor not in s:
    raise SystemExit('State anchor not found')
s = s.replace(state_anchor, state_replacement, 1)

old_questions = '''  const questions = t.questions.map((q, index) => ({
    question: q.question,
    options: [
      { text: q.options[0], value: 'words' },
      { text: q.options[1], value: 'quality' },
      { text: q.options[2], value: 'gifts' },
      { text: q.options[3], value: 'service' },
      { text: q.options[4], value: 'touch' },
    ]
  }));'''
new_questions = '''  const questions = useMemo(
    () => buildLoveLanguageQuizSession(t.questions, currentLanguage, 15),
    [t.questions, currentLanguage, quizSeed]
  );'''
if old_questions not in s:
    raise SystemExit('Original questions mapping block not found')
s = s.replace(old_questions, new_questions, 1)

reset_anchor = '''  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setIsSaved(false);
  };'''
reset_replacement = '''  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setIsSaved(false);
    setQuizSeed(seed => seed + 1);
  };'''
if reset_anchor not in s:
    raise SystemExit('Reset block not found')
s = s.replace(reset_anchor, reset_replacement, 1)

p.write_text(s)
print('Love Language quiz wired to 100-question randomized bank with 15-question sessions.')
