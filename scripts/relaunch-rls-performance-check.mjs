import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationPath = 'supabase/migrations/20260902011000_one2onelove_rls_initplan_performance.sql';
const remainingMigrationPath = 'supabase/migrations/20260902013000_one2onelove_remaining_rls_initplan_performance.sql';
const migration = fs.existsSync(path.join(root, migrationPath))
  ? fs.readFileSync(path.join(root, migrationPath), 'utf8')
  : '';
const remainingMigration = fs.existsSync(path.join(root, remainingMigrationPath))
  ? fs.readFileSync(path.join(root, remainingMigrationPath), 'utf8')
  : '';

const failures = [];
const check = (name, pass, detail) => {
  if (pass) console.log(`✅ ${name}`);
  else {
    failures.push(`${name}: ${detail}`);
    console.error(`❌ ${name}: ${detail}`);
  }
};

check('RLS performance migration exists', Boolean(migration), migrationPath);
check('remaining RLS performance migration exists', Boolean(remainingMigration), remainingMigrationPath);

const requiredPolicies = [
  'Users can delete own calendar events',
  'Users can insert own calendar events',
  'Users can update own calendar events',
  'Users can view own calendar events',
  'Users can delete friend requests they sent',
  'Users can send friend requests',
  'Users can update friend requests they received',
  'Users can view friend requests involving them',
  'Users can delete own goals',
  'Users can insert own goals',
  'Users can update own goals',
  'Users can view own goals',
  'Users can delete own goal steps',
  'Users can insert own goal steps',
  'Users can update own goal steps',
  'Users can view own goal steps',
  'Mutual partners can view shared journal entries',
  'Users can delete own journal entries',
  'Users can insert own journal entries',
  'Users can update own journal entries',
  'Users can view own journal entries',
  'Users can view own payment history',
  'Users can view own subscription changes',
  'love_note_participants_select_own',
];

check(
  'all targeted advisor policies are preserved',
  requiredPolicies.every((policy) => migration.includes(`alter policy "${policy}"`)),
  'Every live policy targeted by the first advisor pass must remain explicitly named.'
);
check(
  'optimized policies use auth initplans',
  migration.includes('(select auth.uid())'),
  'Use (select auth.uid()) so PostgreSQL evaluates the identity once per statement.'
);
check(
  'calendar update still constrains USING and WITH CHECK',
  /alter policy "Users can update own calendar events"[\s\S]*?using \(\(select auth\.uid\(\)\) = user_id\)[\s\S]*?with check \(\(select auth\.uid\(\)\) = user_id\)/.test(migration),
  'The update policy must preserve both read-target and write-target ownership checks.'
);
check(
  'friend-request receiver update remains receiver-only',
  /alter policy "Users can update friend requests they received"[\s\S]*?using \(\(select auth\.uid\(\)\) = receiver_id\)[\s\S]*?with check \(\(select auth\.uid\(\)\) = receiver_id\)/.test(migration),
  'The optimization must not broaden who can accept/update a request.'
);
check(
  'shared journal partner rule is preserved',
  migration.includes('private.is_mutual_partner_pair(user_id, (select auth.uid()))'),
  'Shared journal partner visibility must remain mutual-partner-only.'
);
check(
  'Love Note participant rule is preserved',
  migration.includes('sender_user_id = (select auth.uid())') &&
    migration.includes('recipient_user_id = (select auth.uid())'),
  'Love Note history must remain sender-or-recipient-only.'
);

const remainingTables = [
  'gamification_points',
  'badges',
  'memories',
  'custom_date_ideas',
  'sent_love_notes',
  'scheduled_love_notes',
  'buddy_matches',
  'story_helpful',
  'therapist_profiles',
  'success_stories',
  'message_reactions',
  'starred_messages',
  'pinned_messages',
  'forwarded_messages',
  'relationship_milestones',
  'post_shares',
  'story_likes',
  'comment_likes',
  'contact_messages',
  'communities',
  'community_posts',
  'post_comments',
  'post_likes',
];

check(
  'remaining optimization is scoped to the verified O2OL table allowlist',
  remainingTables.every((table) => remainingMigration.includes(`'${table}'`)) &&
    !remainingMigration.includes('trend2content_') &&
    !remainingMigration.includes('estimate_ai.'),
  'The second pass must stay inside the verified One2OneLove policy inventory and avoid shared-project products.'
);
check(
  'remaining optimization preserves policy semantics mechanically',
  remainingMigration.includes("'auth.uid()'") &&
    remainingMigration.includes("'(select auth.uid())'") &&
    remainingMigration.includes('replace('),
  'The second pass may only replace raw auth.uid() evaluation with an initplan expression.'
);
check(
  'remaining optimization is drift guarded at exactly 64 policies',
  /optimized_count\s*<>\s*64/.test(remainingMigration) &&
    remainingMigration.includes('raise exception'),
  'Abort and roll back if the verified 64-policy inventory changes before application.'
);
check(
  'remaining optimization does not create/drop policies or alter grants',
  !/\b(?:create|drop)\s+policy\b/i.test(remainingMigration) &&
    !/\b(?:grant|revoke)\b/i.test(remainingMigration),
  'This pass is performance-only and must not change authorization structure or browser grants.'
);
check(
  'remaining optimization is transactional',
  /^\s*--[\s\S]*?\nbegin;/i.test(remainingMigration) && /\ncommit;\s*$/i.test(remainingMigration),
  'The drift guard must roll back all policy changes if inventory validation fails.'
);

if (failures.length) {
  console.error(`\n⛔ RLS performance guard failed with ${failures.length} blocker(s).`);
  process.exit(1);
}

console.log('\n✅ Relaunch RLS performance guard passed.');
