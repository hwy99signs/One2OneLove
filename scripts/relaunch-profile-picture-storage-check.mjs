import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => { if (!source.includes(needle)) failures.push(label); };
const forbidText = (source, needle, label) => { if (source.includes(needle)) failures.push(label); };

const migration = read('supabase/migrations/20260818_profile_picture_storage_hardening.sql');
const service = read('src/lib/profileService.js');
const profile = read('src/pages/ProfileRelaunchSafe.jsx');
const directory = read('supabase/migrations/20260818_member_directory_minimization.sql');

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
requireText(migration, "(storage.foldername(name))[1] = auth.uid()::text", 'Profile-picture Storage ownership must be derived from the authenticated owner folder.');
requireText(migration, 'O2OL profile owners can upload pictures', 'Authenticated owner upload grant must exist.');
requireText(migration, 'O2OL profile owners can update pictures', 'Authenticated owner update grant must exist.');
requireText(migration, 'O2OL profile owners can delete pictures', 'Authenticated owner delete grant must exist.');
requireText(migration, 'O2OL profile owners can list pictures', 'Authenticated owner metadata/list grant must exist.');

requireText(service, 'await ensureRegularUserAccess(userId)', 'Profile-picture service must authenticate/authorize the requested owner before Storage access.');
requireText(service, 'const filePath = `${userId}/${fileName}`', 'Profile-picture client must use the owner-folder object-key contract.');
requireText(service, "file.size > 5 * 1024 * 1024", 'Client should mirror the 5 MiB server bucket limit.');
requireText(service, "['jpg', 'jpeg', 'png', 'webp', 'gif']", 'Client should mirror the approved profile-image extensions.');
requireText(service, ".from('profile-pictures')", 'Profile-picture service must stay on the dedicated bucket.');
requireText(service, '.getPublicUrl(filePath)', 'Public avatar delivery is intentional for the optional discoverable profile image.');

requireText(directory, 'avatar_url', 'The minimized member directory may expose the optional avatar URL.');
forbidText(directory, 'relationship_status,', 'Avatar discoverability must not imply relationship-status discoverability.');
forbidText(directory, 'location,', 'Avatar discoverability must not imply location discoverability.');
requireText(profile, 'only your display name, optional profile image, short bio and member-since date', 'Profile disclosure must match the minimized member directory.');
requireText(profile, 'location, relationship status, anniversary, partner information and Love Language remain account-private', 'Profile must explicitly distinguish private relationship/location fields from the discoverable avatar.');

if (failures.length) {
  console.error('\nProfile-picture Storage preflight blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Profile-picture Storage preflight passed: optional avatars are publicly deliverable by URL while Storage list/write/delete remain owner-only and the member directory stays privacy-minimized.');
