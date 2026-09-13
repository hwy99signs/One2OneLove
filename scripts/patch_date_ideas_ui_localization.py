from pathlib import Path

p = Path('src/pages/DateIdeas.jsx')
s = p.read_text()

anchor = 'import { getDateIdeasForLanguage, matchesDateIdeaFilter } from "../components/dateideas/dateIdeasLibrary";'
replacement = anchor + '\nimport { DATE_IDEAS_UI } from "../components/dateideas/dateIdeasUiCopy";'
if anchor not in s:
    raise SystemExit('Date Ideas library import not found')
s = s.replace(anchor, replacement, 1)

old = '  const t = translations[currentLanguage] || translations.en;'
new = '  const t = DATE_IDEAS_UI[currentLanguage] || DATE_IDEAS_UI.en;'
if old not in s:
    raise SystemExit('Translation selector not found')
s = s.replace(old, new, 1)

s = s.replace('<h3 className="text-lg font-semibold text-gray-900">Filters</h3>', '<h3 className="text-lg font-semibold text-gray-900">{t.filters}</h3>', 1)
s = s.replace('{formatDifficulty(selectedIdea.difficulty)}</span>', '{t.difficultyOptions?.[selectedIdea.difficulty] || formatDifficulty(selectedIdea.difficulty)}</span>', 1)

p.write_text(s)
print('Date Ideas UI connected to the seven-language copy map.')
