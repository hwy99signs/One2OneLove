import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const languages = ['en', 'es', 'fr', 'it', 'de'];

function read(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

function requireText(content, text, label) {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
}

function rejectText(content, text, label) {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
}

const page = read('src/pages/SharedJournals.jsx');
const form = read('src/components/activities/JournalForm.jsx');
const entry = read('src/components/activities/JournalEntry.jsx');
const service = read('src/lib/journalService.js');
const sql = read('supabase-shared-journal-partner-sharing.sql');

for (const language of languages) {
  requireText(page, `${language}:`, `${language} Shared Journals page translation`);
  requireText(form, `${language}:`, `${language} Journal form translation`);
  requireText(entry, `${language}:`, `${language} Journal entry translation`);
}

requireText(sql, 'shared_with_partner boolean not null default false', 'private-by-default database flag');
requireText(sql, 'private.is_mutual_partner_pair', 'mutual partner helper');
requireText(sql, 'shared_with_partner = true', 'explicit share read policy');
requireText(sql, 'Mutual partners can view shared journal entries', 'partner read policy');

requireText(service, 'JOURNAL_FIELDS', 'explicit journal column list');
requireText(service, 'shared_with_partner', 'journal share flag');
requireText(service, 'isOwn', 'journal ownership marker');
rejectText(service, ".select('*')", 'wildcard journal reads');
rejectText(service, 'console.', 'journal browser diagnostics');

requireText(form, 'shared_with_partner: Boolean(entry?.shared_with_partner)', 'private form default');
requireText(form, 'event.target.checked', 'explicit share toggle');
requireText(page, 'privacy:', 'visible privacy explanation');
requireText(entry, 'entry.isOwn !== false', 'read-only partner ownership rule');
requireText(entry, 'entry.shared_with_partner', 'privacy badge state');
rejectText(page, ".from('users')", 'private account lookup in journal page');
rejectText(form, ".from('users')", 'private account lookup in journal form');

if (failures.length) {
  console.error('\nO2OL Shared Journals privacy verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL Shared Journals privacy verification passed.');
