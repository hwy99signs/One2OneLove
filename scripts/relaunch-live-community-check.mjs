import fs from 'node:fs';

const failures = [];
const roomsFile = 'src/lib/liveCommunityRooms.js';
const communityFile = 'src/pages/LiveCommunity.jsx';
const messageServiceFile = 'src/lib/liveRoomMessageService.js';
const presenceServiceFile = 'src/lib/roomPresenceService.js';
const hostServiceFile = 'src/lib/liveRoomHostService.js';

const rooms = fs.readFileSync(roomsFile, 'utf8');
const community = fs.readFileSync(communityFile, 'utf8');
const messageService = fs.readFileSync(messageServiceFile, 'utf8');
const presenceService = fs.readFileSync(presenceServiceFile, 'utf8');
const hostService = fs.readFileSync(hostServiceFile, 'utf8');

for (const required of [
  'slug: "global-relationship-room"',
  'name: "Global Relationship Room"',
  'description: "One Room. Many Voices. Stronger Relationships."',
  'isGlobal: true',
]) {
  if (!rooms.includes(required)) failures.push(`${roomsFile}: missing approved Global Relationship Room marker ${required}.`);
}

for (const language of ['es', 'fr', 'it', 'de']) {
  const languageBlock = new RegExp(`${language}:\\s*\\{[\\s\\S]*?"global-relationship-room":\\s*\\{`);
  if (!languageBlock.test(rooms)) failures.push(`${roomsFile}: Global Relationship Room is missing ${language} localization.`);
}

for (const required of ['programmingTitle:', 'programmingText:', '{t.programmingTitle}', '{t.programmingText}']) {
  if (!community.includes(required)) failures.push(`${communityFile}: missing permanent programming notice binding ${required}.`);
}

for (const required of [
  'export async function listLiveRoomMessages',
  'export async function sendLiveRoomMessage',
  'export async function reportLiveRoomMessage',
  'export async function toggleLiveRoomReaction',
  'export const subscribeToLiveRoomMessages = subscribeToRoomMessages',
]) {
  if (!messageService.includes(required)) failures.push(`${messageServiceFile}: missing LiveRoom compatibility export ${required}.`);
}

for (const required of ['export function buildPublicPresenceKey', 'export function enterPublicRoom', 'export function leavePublicRoom']) {
  if (!presenceService.includes(required)) failures.push(`${presenceServiceFile}: missing LiveRoom presence compatibility export ${required}.`);
}

for (const required of ['const normalizeRequest =', 'text: prompt']) {
  if (!hostService.includes(required)) failures.push(`${hostServiceFile}: missing normalized LiveRoom host compatibility ${required}.`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Live Community check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Global Relationship Room, programming notice and Live Room service compatibility are locked for the relaunch branch.');
