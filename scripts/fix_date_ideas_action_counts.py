from pathlib import Path
p = Path('src/pages/DateIdeas.jsx')
s = p.read_text()
old = '{t.myCustomDates} ({customDates.length})'
new = '{t.myCustomDates} ({customOnlyDates.length})'
if old not in s:
    raise SystemExit('Custom date count anchor not found')
p.write_text(s.replace(old, new, 1))
print('Hidden built-in state records excluded from custom-date count.')
