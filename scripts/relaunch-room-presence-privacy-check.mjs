import fs from 'node:fs';

const failures = [];
const file = 'src/lib/roomPresenceService.js';
const source = fs.readFileSync(file, 'utf8');

for (const required of [
  'const ROOM_SLUGS = new Set([',
  '"global-relationship-room"',
  'const requireRoomSlug = (roomSlug) =>',
  '`one2onelove-room-presence:${roomSlug}:${userId}`',
  '`o2ol-presence:${roomSlug}:${userId}`',
  'const cleanupPresenceChannel = (channel) =>',
  'Promise.resolve(channel.untrack?.())',
  'export function joinRoomPresence(roomSlug, _user, onCountChange)',
  'const { data, error } = await supabase.auth.getUser();',
  'const presenceKey = await privatePresenceKey(slug, userId);',
  'await channel.track({ joined_at: new Date().toISOString() });',
  'export function enterPublicRoom(roomSlug, _presenceKey, onCountChange)',
  'const key = await privatePresenceKey(slug, userId);',
]) {
  if (!source.includes(required)) failures.push(`${file}: missing room-presence privacy safeguard ${required}.`);
}

for (const forbidden of [
  '`one2onelove-room-presence:${userId}`',
  '`o2ol-presence:${userId}`',
  'privatePresenceKey(user.id)',
  'privatePresenceKey(data.user.id)',
  'console.warn("Unable to hash Live Room presence key:", error)',
  'channel.track({ user_id:',
  'channel.track({ name:',
  'channel.track({ email:',
]) {
  if (source.includes(forbidden)) failures.push(`${file}: cross-room correlation, caller identity, raw errors or profile-bearing Presence payload remains (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove room presence privacy check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Live Room Presence is room-scoped, Auth-derived, aggregate-only and cleanup-safe without cross-room identity correlation.');
