const fs = require('fs');
const path = 'scripts/add_missing_you_search_fix.cjs';
let src = fs.readFileSync(path, 'utf8');

const oldGeneratedMatch = `  return queryWords.every(queryWord =>\n    searchableWords.some(word => word.startsWith(queryWord))\n  );`;
const newGeneratedMatch = `  const getSearchForms = (term) => {\n    const forms = new Set([term, term + 's', term + 'es', term + 'ed', term + 'ing']);\n    if (term.endsWith('e') && term.length > 2) {\n      forms.add(term + 'd');\n      forms.add(term.slice(0, -1) + 'ing');\n    }\n    if (term.endsWith('y') && term.length > 2) {\n      forms.add(term.slice(0, -1) + 'ies');\n      forms.add(term.slice(0, -1) + 'ied');\n    }\n    return forms;\n  };\n\n  return queryWords.every(queryWord => {\n    const forms = getSearchForms(queryWord);\n    return searchableWords.some(word => forms.has(word));\n  });`;
if (!src.includes(oldGeneratedMatch)) throw new Error('Generated search match block not found');
src = src.replace(oldGeneratedMatch, newGeneratedMatch);

const oldTestMatch = `const testMatch = (text, query) => {\n  const queryWords = testWords(query);\n  const words = testWords(text);\n  return queryWords.every(q => words.some(w => w.startsWith(q)));\n};`;
const newTestMatch = `const testForms = (term) => {\n  const forms = new Set([term, term + 's', term + 'es', term + 'ed', term + 'ing']);\n  if (term.endsWith('e') && term.length > 2) {\n    forms.add(term + 'd');\n    forms.add(term.slice(0, -1) + 'ing');\n  }\n  if (term.endsWith('y') && term.length > 2) {\n    forms.add(term.slice(0, -1) + 'ies');\n    forms.add(term.slice(0, -1) + 'ied');\n  }\n  return forms;\n};\nconst testMatch = (text, query) => {\n  const queryWords = testWords(query);\n  const words = testWords(text);\n  return queryWords.every(q => {\n    const forms = testForms(q);\n    return words.some(w => forms.has(w));\n  });\n};`;
if (!src.includes(oldTestMatch)) throw new Error('Regression test match block not found');
src = src.replace(oldTestMatch, newTestMatch);

if (!src.includes("if (testMatch('The mission begins tomorrow.', 'miss'))")) throw new Error('Mission regression assertion missing');
fs.writeFileSync(path, src);
console.log('Search generator patched to use controlled word forms.');
