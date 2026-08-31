import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const service = read('src/lib/presenceService.js');
const component = read('src/components/presence/UserPresenceIndicator.jsx');
const firstDirectory = read('supabase/migrations/20260817_member_directory_privacy.sql');
const minimizedDirectory = read('supabase/migrations/20260818_member_directory_minimization.sql');
const firstPresence = read('supabase/migrations/20260817_presence_security_hardening.sql');
const reconciliation = read('supabase/migrations/20260820100500_presence_directory_privacy_reconciliation.sql');
const sourceMinimization = read('supabase/migrations/20260820151000_member_directory_source_minimization.sql');
const activeAccountGuard = read('supabase/migrations/20260822003000_member_directory_active_account_guard.sql');
const canonicalFinal = read('supabase/migrations/20260822004500_presence_directory_privacy_final.sql');
const executionLedger = read('docs/PRODUCTION_APPROVAL_EXECUTION.md');
const approvalQueue = read('docs/RELAUNCH_APPROVAL_QUEUE.md');

const directoryProjectionIsMinimal = (source) => {
  const select = source.match(/as\s+select([\s\S]*?)from\s+public\.users/i)?.[1] || '';
  return select.includes('id')
    && select.includes('name')
    && select.includes('avatar_url')
    && select.includes('bio')
    && select.includes('created_at')
    && !select.includes('email')
    && !select.includes('relationship_status')
    && !select.includes('location')
    && !select.includes('partner_')
    && !select.includes('interests')
    && !select.includes('user_type');
};

const presenceMigrationIsNeutral = (source) =>
  source.includes('security_invoker = true')
  && !/\bas\s+last_seen_text\b/i.test(source)
  && source.includes('security invoker')
  && source.includes("set search_path = ''");

const synchronizedSource = reconciliation.match(/create table if not exists public\.user_directory_profiles\s*\(([\s\S]*?)\);/i)?.[1] || '';

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
  'invalid requested member filters fail closed instead of subscribing to all presence',
  service.includes('const requestedIds = Array.isArray(userIds) ? userIds : null')
    && service.includes('if (requestedIds && !ids.length) return null;'),
  'A malformed explicitly filtered subscription must become no subscription, never an all-member realtime stream.'
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
  component.includes('const UI_COPY =')
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
check(
  'earliest member-directory migrations never expose broader profile fields',
  directoryProjectionIsMinimal(firstDirectory)
    && directoryProjectionIsMinimal(minimizedDirectory)
    && firstDirectory.includes('security_invoker = true')
    && minimizedDirectory.includes('security_invoker = true'),
  'Fresh migration order must never temporarily expose location, relationship status or other profile fields, and views must respect caller privileges.'
);
check(
  'earliest member-directory projection excludes inactive accounts',
  firstDirectory.includes('coalesce(is_active, true) = true')
    && firstDirectory.includes("coalesce(user_type, 'regular') = 'regular'"),
  'Ordinary member discovery must never intentionally include a deactivated account.'
);
check(
  'synchronized directory source starts with exactly the safe discovery fields',
  synchronizedSource.includes('id uuid')
    && synchronizedSource.includes('name text')
    && synchronizedSource.includes('avatar_url text')
    && synchronizedSource.includes('bio text')
    && synchronizedSource.includes('created_at timestamptz')
    && !synchronizedSource.includes('relationship_status')
    && !synchronizedSource.includes('user_type')
    && !synchronizedSource.includes('location')
    && !synchronizedSource.includes('interests')
    && !synchronizedSource.includes('email'),
  'Fresh #8C migration must not expose a broader signed-in-readable synchronization table before later reconciliation.'
);
check(
  'historical source minimization removes non-discovery fields',
  ['relationship_status', 'user_type', 'location', 'interests'].every((field) => sourceMinimization.includes(`drop column if exists ${field}`))
    && sourceMinimization.includes('security_invoker = true'),
  'The already-executed #8C-A migration must retain its five-field source contract in source history.'
);
check(
  'final active-account guard removes inactive/non-regular accounts from discovery',
  activeAccountGuard.includes("coalesce(new.user_type, 'regular') <> 'regular'")
    && activeAccountGuard.includes('coalesce(new.is_active, true) <> true')
    && activeAccountGuard.includes('update of name, avatar_url, bio, user_type, is_active')
    && activeAccountGuard.includes('and coalesce(u.is_active, true) = true')
    && activeAccountGuard.includes("and coalesce(u.user_type, 'regular') = 'regular'"),
  'Final synchronized discovery must delete deactivated/non-regular accounts and restore them only when eligible again.'
);
check(
  'initial presence migration is neutral and caller-safe before reconciliation',
  presenceMigrationIsNeutral(firstPresence)
    && firstPresence.includes('o2ol_private.write_user_presence')
    && firstPresence.includes("'O2OL_PRESENCE_OWN_ONLY'")
    && !firstPresence.includes('set search_path = public'),
  'A fresh environment must not rely on a later repair migration for caller-bound writes, invoker reads or language-neutral presence data.'
);
check(
  'historical #8C reconciliation preserves neutral caller-bound presence',
  presenceMigrationIsNeutral(reconciliation)
    && reconciliation.includes('o2ol_private.write_user_presence')
    && reconciliation.includes("'O2OL_PRESENCE_OWN_ONLY'")
    && !reconciliation.includes('set search_path = public'),
  'The already-executed #8C migration source must continue documenting its reviewed security contract.'
);
check(
  'canonical final-state migration converges to the strict privacy contract',
  canonicalFinal.includes('only active regular accounts are discoverable')
    && canonicalFinal.includes('drop column if exists relationship_status')
    && canonicalFinal.includes('drop column if exists email')
    && canonicalFinal.includes('coalesce(new.is_active, true) <> true')
    && canonicalFinal.includes('Authenticated members can view discoverable presence')
    && canonicalFinal.includes("'O2OL_PRESENCE_OWN_ONLY'")
    && canonicalFinal.includes('join public.member_directory md on md.id = up.user_id')
    && canonicalFinal.includes('security_invoker = true')
    && !/\bas\s+last_seen_text\b/i.test(canonicalFinal),
  'Any fresh/drift recovery reference must converge to active-member-only discovery and neutral caller-safe presence.'
);
check(
  'completed production #8C and #8C-A are governance-locked against replay',
  executionLedger.includes('#8C — Presence + member-directory privacy — COMPLETE')
    && executionLedger.includes('#8C-A — Member-directory source minimization — COMPLETE')
    && executionLedger.includes('Do not reapply it.')
    && approvalQueue.includes('must **not** be applied to the existing production project merely because it is newer')
    && !approvalQueue.includes('### #8C — Presence + member-directory privacy — PENDING'),
  'A newer reconciliation file must never cause already-completed production approvals to be repeated.'
);

console.log('\nOne2OneLove shared presence privacy/i18n check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name} — ${item.detail}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
