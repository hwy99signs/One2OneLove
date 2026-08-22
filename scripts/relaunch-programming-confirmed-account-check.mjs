import fs from 'node:fs';

const failures = [];
const files = [
  'supabase/functions/book-creator-programming-slot/index.ts',
  'supabase/functions/manage-o2ol-programming/index.ts',
  'supabase/functions/report-programming/index.ts',
  'supabase/functions/moderate-programming/index.ts',
];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const authIndex = source.indexOf('auth.getUser');
  const confirmedIndex = source.indexOf('EMAIL_CONFIRMATION_REQUIRED');
  const serviceRoleIndex = source.indexOf("createClient(supabaseUrl, serviceRoleKey");

  if (authIndex < 0) failures.push(`${file}: server-side authenticated-user validation is missing.`);
  if (confirmedIndex < 0) failures.push(`${file}: confirmed-account enforcement is missing.`);
  if (authIndex >= 0 && confirmedIndex >= 0 && confirmedIndex < authIndex) {
    failures.push(`${file}: confirmation must be checked after the authenticated user is resolved.`);
  }
  if (serviceRoleIndex >= 0 && confirmedIndex >= 0 && confirmedIndex > serviceRoleIndex) {
    failures.push(`${file}: confirmation must be checked before service-role data access begins.`);
  }
}

if (failures.length) {
  console.error('\nProgramming confirmed-account blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Programming confirmed-account preflight passed: creator booking, O2OL staff scheduling, member reporting and moderation all require a confirmed authenticated account before privileged data access.');
