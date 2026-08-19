import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const languages = ['en', 'es', 'fr', 'it', 'de'];

const read = (file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
};

const requireText = (content, text, label) => {
  if (!content.includes(text)) failures.push(`Missing ${label}: ${text}`);
};

const rejectText = (content, text, label) => {
  if (content.includes(text)) failures.push(`Unsafe ${label}: ${text}`);
};

for (const [page, profileLookup] of [
  ['src/pages/InfluencerSignup.jsx', 'getInfluencerProfile'],
  ['src/pages/ProfessionalSignup.jsx', 'getProfessionalProfile'],
]) {
  const content = read(page);
  for (const language of languages) requireText(content, `${language}:`, `${language} translation in ${page}`);
  requireText(content, profileLookup, `persisted profile verification in ${page}`);
  requireText(content, "persisted.profile.status !== 'pending'", `pending moderation verification in ${page}`);
  requireText(content, 'result?.user?.id', `created user identity verification in ${page}`);
  rejectText(content, '123456', `placeholder verification code in ${page}`);
  rejectText(content, 'tempPassword', `temporary password in ${page}`);
}

const influencerService = read('src/lib/influencerService.js');
requireText(influencerService, "status: 'pending'", 'influencer pending default');
const professionalService = read('src/lib/professionalService.js');
requireText(professionalService, "status: 'pending'", 'professional pending default');

const partnerSql = read('supabase-partner-profile-security.sql');
requireText(partnerSql, 'influencers can create pending own profile', 'influencer pending insert RLS');
requireText(partnerSql, 'professionals can create pending own profile', 'professional pending insert RLS');

if (failures.length) {
  console.error('\nO2OL partner integrity verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL partner integrity verification passed.');
