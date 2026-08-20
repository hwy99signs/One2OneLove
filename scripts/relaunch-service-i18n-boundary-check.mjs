import fs from 'node:fs';

const failures = [];
const files = [
  'src/lib/creatorProgrammingService.js',
  'src/lib/o2olProgrammingService.js',
  'src/lib/programmingReminderService.js',
  'src/lib/supportRequestService.js',
];

const sources = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, 'utf8')]));

const requireText = (file, pattern, message) => {
  if (!pattern.test(sources[file])) failures.push(`${file}: ${message}`);
};
const forbidText = (file, pattern, message) => {
  if (pattern.test(sources[file])) failures.push(`${file}: ${message}`);
};

requireText('src/lib/creatorProgrammingService.js', /O2OL_CREATOR_PROGRAMMING_DISABLED/, 'creator service must use stable language-neutral error codes.');
requireText('src/lib/creatorProgrammingService.js', /O2OL_CREATOR_PROGRAMMING_BOOK_FAILED/, 'creator booking must have a stable fallback code.');
requireText('src/lib/creatorProgrammingService.js', /O2OL_CREATOR_PROGRAMMING_\$\{providerCode\}/, 'creator booking may preserve only sanitized backend error codes.');

requireText('src/lib/o2olProgrammingService.js', /O2OL_PROGRAMMING_MANAGE_FAILED/, 'O2OL admin service must use a stable management error code.');
requireText('src/lib/o2olProgrammingService.js', /O2OL_PROGRAMMING_BOOK_FAILED/, 'O2OL admin booking must use a stable error code.');
requireText('src/lib/o2olProgrammingService.js', /O2OL_PROGRAMMING_CANCEL_FAILED/, 'O2OL admin cancellation must use a stable error code.');

requireText('src/lib/programmingReminderService.js', /O2OL_PROGRAMMING_REMINDER_UPDATE_FAILED/, 'reminder service must use a stable update error code.');

requireText('src/lib/supportRequestService.js', /const safeErrorCode =/, 'support service must validate backend error codes before surfacing them.');
requireText('src/lib/supportRequestService.js', /\^\[A-Z\]\[A-Z0-9_\]\{2,79\}\$/, 'support service must accept only stable uppercase application codes.');
requireText('src/lib/supportRequestService.js', /return fallback;/, 'support service must fall back to a stable application code.');

for (const file of files) {
  forbidText(file, /throw new Error\(['"][A-Z][a-z][^'"]*[ .][^'"]*['"]\)/, 'service layer must not throw user-facing English prose.');
  forbidText(file, /error\?\.message\s*\|\|\s*['"](?:Unable|Sign|Creator|Programming|O2OL|Support)/, 'raw connector/backend prose must not be used as an English fallback.');
}

forbidText('src/lib/supportRequestService.js', /return error\?\.message\s*\|\|/, 'support service must not return raw connector/provider prose.');

if (failures.length) {
  console.error('\n⛔ One2OneLove service multilingual boundary check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Programming, reminder and support services keep operational errors language-neutral so localized UI copy remains authoritative.');
