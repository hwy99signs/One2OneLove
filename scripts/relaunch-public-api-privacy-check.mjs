import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const migrationPath = 'supabase/migrations/20260902010000_one2onelove_public_api_advisor_hardening.sql';

const failures = [];
const check = (name, pass, detail) => {
  if (pass) {
    console.log(`✅ ${name}`);
  } else {
    failures.push(`${name}: ${detail}`);
    console.error(`❌ ${name}: ${detail}`);
  }
};

check('public API hardening migration exists', fs.existsSync(path.join(root, migrationPath)), migrationPath);
const migration = fs.existsSync(path.join(root, migrationPath)) ? read(migrationPath) : '';
const routes = read('src/pages/index.jsx');

check(
  'legacy contest route remains fenced',
  routes.includes('["/WinACruise", RelaunchUnavailable]'),
  'WinACruise must remain unavailable while raw contest browser access is revoked.'
);
check(
  'relaunch Community uses LiveCommunity',
  routes.includes('import Community from "./LiveCommunity";'),
  'The retired forum/Success Stories page must not silently replace LiveCommunity.'
);
check(
  'contest participant browser privileges are revoked',
  migration.includes('revoke all on table public.contest_participants from anon, authenticated'),
  'Contest rows include direct account identifiers and must remain backend-only.'
);
check(
  'contest winner browser privileges are revoked',
  migration.includes('revoke all on table public.contest_winners from anon, authenticated'),
  'Winner rows include direct account identifiers and must remain backend-only.'
);
check(
  'anonymous legacy community reads are removed',
  ['public.communities', 'public.post_comments', 'public.post_shares'].every((table) =>
    migration.includes(`revoke select on table ${table} from anon`)
  ),
  'Anonymous visitors do not need raw legacy forum tables in the relaunch.'
);
check(
  'reaction identity tables are not anonymously readable',
  ['public.comment_likes', 'public.post_likes'].every((table) =>
    migration.includes(`revoke select on table ${table} from anon`)
  ),
  'Raw like rows expose member UUIDs.'
);
check(
  'reaction reads are caller-scoped',
  migration.includes('create policy "comment_likes_own_select"') &&
    migration.includes('create policy "post_likes_own_select"') &&
    migration.includes('using ((select auth.uid()) = user_id)'),
  'Authenticated members must not receive raw lists of other members who reacted.'
);
check(
  'raw Success Stories are not anonymously readable',
  migration.includes('revoke select on table public.success_stories from anon'),
  'The base table includes user/moderation internals.'
);
check(
  'approved-story broad raw policy is retired',
  migration.includes('drop policy if exists "allow_approved_select_stories" on public.success_stories') &&
    migration.includes('create policy "success_stories_own_select"'),
  'Members may read their own raw story rows only until a safe public projection is deliberately introduced.'
);

const requiredIndexes = [
  'contact_messages_user_id_idx',
  'love_note_saves_invitation_id_idx',
  'room_message_reactions_user_id_idx',
  'room_message_reports_reporter_id_idx',
  'room_messages_user_id_idx',
];
check(
  'advisor-requested foreign-key indexes are staged',
  requiredIndexes.every((index) => migration.includes(`create index if not exists ${index}`)),
  'All five missing FK indexes from the final advisor pass must remain in the staged migration.'
);
check(
  'duplicate buddy-request indexes are staged for removal',
  ['idx_buddy_requests_from_user', 'idx_buddy_requests_to_user', 'idx_buddy_requests_status'].every((index) =>
    migration.includes(`drop index if exists public.${index}`)
  ),
  'Only duplicate non-unique buddy-request indexes should be removed.'
);

if (failures.length) {
  console.error(`\n⛔ Public API privacy check failed with ${failures.length} blocker(s).`);
  process.exit(1);
}

console.log('\n✅ Relaunch public API privacy guard passed.');
