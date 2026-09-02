import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationPath = 'supabase/migrations/20260902011000_one2onelove_rls_initplan_performance.sql';
const migration = fs.existsSync(path.join(root, migrationPath))
  ? fs.readFileSync(path.join(root, migrationPath), 'utf8')
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
  'Every live policy targeted by the final advisor pass must remain explicitly named.'
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

if (failures.length) {
  console.error(`\n⛔ RLS performance guard failed with ${failures.length} blocker(s).`);
  process.exit(1);
}

console.log('\n✅ Relaunch RLS performance guard passed.');
