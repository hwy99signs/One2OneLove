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
const rejectPattern = (content, pattern, label) => {
  if (pattern.test(content)) failures.push(`Unsafe ${label}: ${pattern}`);
};

const influencerPage = read('src/pages/InfluencerSignup.jsx');
const professionalPage = read('src/pages/ProfessionalSignup.jsx');
const therapistPage = read('src/pages/TherapistSignup.jsx');
for (const [page, content] of [
  ['src/pages/InfluencerSignup.jsx', influencerPage],
  ['src/pages/ProfessionalSignup.jsx', professionalPage],
  ['src/pages/TherapistSignup.jsx', therapistPage],
]) {
  for (const language of languages) requireText(content, `${language}:`, `${language} translation in ${page}`);
  rejectPattern(content, /123456|tempPassword|<form|<Input|<Textarea|registerInfluencer|registerProfessional|registerTherapist|supabase|useAuth/, `active legacy partner intake in ${page}`);
}
requireText(influencerPage, '/RoomCreatorAccess', 'Global Room creator pathway');
requireText(professionalPage, 'Post Launch', 'professional post-launch state');
requireText(therapistPage, 'Post Launch', 'therapist post-launch state');

// Preserve hardened future partner infrastructure even while its public intake is inactive.
const influencerService = read('src/lib/influencerService.js');
requireText(influencerService, "status: 'pending'", 'influencer pending default');
const professionalService = read('src/lib/professionalService.js');
requireText(professionalService, "status: 'pending'", 'professional pending default');

const partnerSql = read('supabase-partner-profile-security.sql');
requireText(partnerSql, 'influencers can create pending own profile', 'influencer pending insert RLS');
requireText(partnerSql, 'professionals can create pending own profile', 'professional pending insert RLS');
rejectPattern(partnerSql, /status\s*=\s*'approved'.*auth\.uid\(\)/s, 'self-approval policy');

if (failures.length) {
  console.error('\nO2OL partner integrity verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL partner integrity verification passed.');
