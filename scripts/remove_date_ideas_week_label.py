from pathlib import Path

p = Path('src/pages/DateIdeas.jsx')
s = p.read_text()

old = '''                        {selectedIdea.week && (\n                          <p className="text-sm font-semibold text-pink-600 mb-1">{t.week || 'Week'} {selectedIdea.week} / 52</p>\n                        )}\n'''

if old not in s:
    raise SystemExit('Week label block not found')

s = s.replace(old, '', 1)
p.write_text(s)
print('Removed visible Week X / 52 label from Date Ideas detail cards.')
