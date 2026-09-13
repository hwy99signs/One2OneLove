const fs = require('fs');
const pagePath = 'src/pages/LoveNotes.jsx';
let page = fs.readFileSync(pagePath, 'utf8');

const oldMatch = `  return queryWords.every(queryWord =>\n    searchableWords.some(word => word.startsWith(queryWord))\n  );`;
const newMatch = `  const getSearchForms = (term) => {\n    const forms = new Set([term, term + 's', term + 'es', term + 'ed', term + 'ing']);\n    if (term.endsWith('e') && term.length > 2) {\n      forms.add(term + 'd');\n      forms.add(term.slice(0, -1) + 'ing');\n    }\n    if (term.endsWith('y') && term.length > 2) {\n      forms.add(term.slice(0, -1) + 'ies');\n      forms.add(term.slice(0, -1) + 'ied');\n    }\n    return forms;\n  };\n\n  return queryWords.every(queryWord => {\n    const forms = getSearchForms(queryWord);\n    return searchableWords.some(word => forms.has(word));\n  });`;

if (!page.includes(oldMatch)) throw new Error('Generated prefix search block not found');
page = page.replace(oldMatch, newMatch);
fs.writeFileSync(pagePath, page);

const words = (value) => String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) || [];
const forms = (term) => {
  const out = new Set([term, term + 's', term + 'es', term + 'ed', term + 'ing']);
  if (term.endsWith('e') && term.length > 2) {
    out.add(term + 'd');
    out.add(term.slice(0, -1) + 'ing');
  }
  if (term.endsWith('y') && term.length > 2) {
    out.add(term.slice(0, -1) + 'ies');
    out.add(term.slice(0, -1) + 'ied');
  }
  return out;
};
const matches = (text, query) => {
  const textWords = words(text);
  return words(query).every(term => {
    const allowed = forms(term);
    return textWords.some(word => allowed.has(word));
  });
};

for (const bad of ['Give yourself permission to heal.', 'The mission begins tomorrow.', 'Your submission was received.']) {
  if (matches(bad, 'miss')) throw new Error(`Search false positive for: ${bad}`);
}
for (const good of ['I miss you.', "You're missed today.", 'I am missing you.', 'She misses her friend.']) {
  if (!matches(good, 'miss')) throw new Error(`Search false negative for: ${good}`);
}
console.log('Word-form Love Notes search checks passed.');
