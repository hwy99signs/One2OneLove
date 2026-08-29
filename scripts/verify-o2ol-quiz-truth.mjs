import fs from 'node:fs';
import path from 'node:path';

const failures = [];
const root = process.cwd();
const languages = ['en', 'es', 'fr', 'it', 'de'];

function read(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required quiz file: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function requireText(content, text, label) {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

function rejectPattern(content, pattern, label) {
  if (pattern.test(content)) failures.push(`Unsafe or misleading ${label}: ${pattern}`);
}

const library = read('src/pages/RelationshipQuizzes.jsx');
const quiz = read('src/pages/LoveLanguageQuiz.jsx');
const service = read('src/lib/loveLanguageService.js');

for (const language of languages) {
  requireText(library, `${language}:`, `${language} quiz library translation`);
  requireText(quiz, `${language}:`, `${language} love language translation`);
}

requireText(library, '/LoveLanguageQuiz', 'working Love Language route');
requireText(library, 'not validated psychological assessments', 'English assessment limitation');
requireText(library, 'diagnoses', 'English diagnostic limitation');
requireText(quiz, 'Your answers stay on this page and are not saved or transmitted', 'English answer privacy promise');
requireText(quiz, 'not a validated psychological assessment', 'English live-quiz assessment limitation');
requireText(quiz, 'Save to Profile', 'explicit opt-in profile save');
requireText(quiz, 'navigator.share', 'real device share support');
requireText(quiz, 'navigator.clipboard', 'share clipboard fallback');
requireText(service, ".eq('id', userId)", 'owner-scoped preference update');
requireText(service, ".select('love_language')", 'minimal preference return fields');

rejectPattern(library, /alert\s*\(/, 'placeholder quiz alerts');
rejectPattern(library, /expert-designed|clinically validated|professional assessment/i, 'unverified quiz provenance claim');
rejectPattern(quiz, /localStorage|sessionStorage|\.insert\(|quiz_results/i, 'quiz answer persistence');
rejectPattern(quiz, /console\.(log|warn|error|debug|info|trace)/, 'quiz browser diagnostics');
rejectPattern(service, /console\.(log|warn|error|debug|info|trace)/, 'love-language service browser diagnostics');
rejectPattern(service, /\.select\(\s*['"]\*['"]\s*\)/, 'wildcard profile return');

if (failures.length) {
  console.error('\nO2OL quiz truth/privacy verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL quiz truth/privacy verification passed.');
