const fs = require('fs');
const path = 'src/pages/CommunicationPractice.jsx';
let page = fs.readFileSync(path, 'utf8');

const importAnchor = 'import { createPageUrl } from "@/utils";';
if (!page.includes(importAnchor)) throw new Error('CommunicationPractice import anchor not found');
if (!page.includes('communicationPracticeScenarios')) {
  page = page.replace(importAnchor, `${importAnchor}\nimport { communicationPracticeScenarios } from "@/components/communication/CommunicationPracticeScenarios";`);
}

const oldLine = '  const scenarios = t.scenarios || translations.en.scenarios;';
const newLine = '  const scenarios = communicationPracticeScenarios[currentLanguage] || communicationPracticeScenarios.en;';
if (!page.includes(oldLine) && !page.includes(newLine)) throw new Error('Scenario source line not found');
page = page.replace(oldLine, newLine);

fs.writeFileSync(path, page);
console.log('Communication Practice now uses the localized 20-scenario library.');
