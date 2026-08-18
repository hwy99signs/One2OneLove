import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const migration = read('supabase/migrations/20260818_profile_picture_storage_hardening.sql');
const service = read('src/lib/profileService.js');
const profile = read('src/pages/ProfileRelaunchSafe.jsx');

requireText(migration, "'profile-pictures',\n  'profile-pictures',\n  true,\n  5242880", 'Profile-picture bucket must stay intentionally public with a 5 MiB limit.');
requireText(migration, "'image/jpeg'", 'Profile-picture bucket must allow JPEG.');
requireText(migration, "'image/png'", 'Profile-picture bucket must allow PNG.');
requireText(migration, "'image/webp'", 'Profile-picture bucket must allow WebP.');
requireText(migration, "'image/gif'", 'Profile-picture bucket must allow GIF.');
forbidText(migration, 'image/svg+xml', 'SVG must remain outside the profile-picture MIME allowlist.');

for (const operation of ['select', 'insert', 'update', 'delete']) {
  requireText(migration, `as restrictive\nfor ${operation}\nto public`, `Profile-picture ${operation.toUpperCase()} must have a restrictive bucket boundary.`);
}
requireText(migration, "bucket_id <> 'profile-pictures'", 'Restrictive policies must pass unrelated Storage buckets through unchanged.');
requireText(migration, "(storage.foldername(name))[1] = auth.uid()::text", 'Profile-picture Storage ownership must be derived from the first object-path folder.');
requireText(migration, 'O2OL profile owners can upload pictures', 'Authenticated owner upload grant must exist.');
requireText(migration, 'O2OL profile owners can update pictures', 'Authenticated owner update grant must exist.');
requireText(migration, 'O2OL profile owners can delete pictures', 'Authenticated owner delete grant must exist.');
requireText(migration, 'O2OL profile owners can list pictures', 'Authenticated owner metadata/list grant must exist.');

requireText(service, 'await ensureRegularUserAccess(userId)', 'Profile-picture service must authenticate/authorize the requested owner before Storage access.');
requireText(service, 'const filePath = `${userId}/${fileName}`', 'Profile-picture client must use the owner-folder object-key contract.');
requireText(service, "file.size > 5 * 1024 * 1024", 'Client should mirror the 5 MiB server bucket limit.');
requireText(service, "['jpg', 'jpeg', 'png', 'webp', 'gif']", 'Client should mirror the approved profile-image extensions.');
requireText(service, ".from('profile-pictures')", 'Profile-picture service must stay on the dedicated bucket.');
requireText(service, '.getPublicUrl(filePath)', 'Public avatar URLs are intentional for discoverable profile images.');
requireText(profile, 'name, profile image, short bio, general location, relationship status and member-since date', 'Profile disclosure must tell members that the profile image is discoverable.');

if (failures.length) {
  console.error('\nProfile-picture Storage preflight blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Profile-picture Storage preflight passed: avatar delivery is public by design while Storage list/write/delete operations are owner-only and size/MIME constrained.');
