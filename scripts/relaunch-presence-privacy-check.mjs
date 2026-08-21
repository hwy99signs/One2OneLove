import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const service = read('src/lib/presenceService.js');
const component = read('src/components/presence/UserPresenceIndicator.jsx');

check(
  'presence service accepts only the five active launch languages',
  service.includes("const ACTIVE_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'de'])")
    && !service.includes("'nl'"),
  'Presence formatting must follow the active EN/ES/FR/IT/DE relaunch language set.'
);
check(
  'presence service validates member UUIDs before reads and realtime filters',
  service.includes('const UUID_PATTERN =')
    && service.includes('const validUserId =')
    && service.includes('if (!validUserId(userId)) return offlinePresence')
    && service.includes('.filter(validUserId)'),
  'Malformed browser IDs must not reach presence queries or realtime filters.'
);
check(
  'presence subscriptions are independent instead of one global singleton',
  service.includes('const activePresenceSubscriptions = new Set()')
    && service.includes('presenceSubscriptionCounter += 1')
    && service.includes('activePresenceSubscriptions.add(channel)')
    && service.includes('unsubscribeFromPresence = (subscription = null)')
    && !service.includes('let presenceSubscription = null'),
  'Each badge/listener must own its channel so one avatar cannot unsubscribe another avatar.'
);
check(
  'presence channel names do not contain member UUIDs',
  service.includes('`user-presence-changes:${presenceSubscriptionCounter}`')
    && !service.includes("ids.join('-')"),
  'Opaque channel names reduce unnecessary member-identifier exposure in client diagnostics.'
);
check(
  'presence service uses language-neutral operational error codes',
  service.includes("'O2OL_PRESENCE_STATUS_INVALID'")
    && service.includes("'O2OL_AUTH_REQUIRED'")
    && service.includes("'O2OL_PRESENCE_UPDATE_FAILED'"),
  'Service failures should not become English-only member-facing copy.'
);
check(
  'shared presence UI has exactly five active language blocks',
  ['en:', 'es:', 'fr:', 'it:', 'de:'].every((key) => component.includes(key))
    && !component.includes('nl:'),
  'Online/offline/loading/status/count labels must be available in every active language.'
);
check(
  'shared presence UI never uses external generated avatars',
  component.includes("from '@/lib/memberMedia'")
    && component.includes('safeMemberAvatarUrl(avatarUrl)')
    && !component.includes('api.dicebear.com'),
  'Missing avatars must fall back locally rather than contact a third-party avatar generator.'
);
check(
  'member badges subscribe only to their own requested member ID',
  (component.match(/subscribeToPresence\([\s\S]*?\}, \[userId\]\)/g) || []).length >= 2
    && component.includes('unsubscribeFromPresence(subscription)'),
  'Per-member badges must use filtered independent realtime listeners and clean them up.'
);
check(
  'presence UI does not log member UUIDs',
  !component.includes('Presence update for user:')
    && !component.includes('console.log('),
  'Shared presence rendering must not place member identifiers in browser debug logs.'
);
check(
  'presence UI replaces English hard-coded status text with localized copy',
  component.includes("const UI_COPY =")
    && component.includes('t.online')
    && component.includes('t.offline')
    && component.includes('t.away')
    && component.includes('t.busy')
    && component.includes('copy().loading')
    && !component.includes("'Loading...'")
    && !component.includes('>Online<')
    && !component.includes('>Offline<'),
  'Presence components must not bypass the multilingual runtime with literal English status labels.'
);

console.log('\nOne2OneLove shared presence privacy/i18n check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
