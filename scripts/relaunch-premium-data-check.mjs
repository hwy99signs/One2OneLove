import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  shim: 'src/pages/RelationshipGoals.jsx',
  page: 'src/pages/RelationshipGoalsRelaunch.jsx',
  service: 'src/lib/relationshipGoalsService.js',
  migration: 'supabase/migrations/20260818_relationship_goals_membership_hardening.sql',
  membership: 'src/lib/membershipConfig.js',
  router: 'src/pages/index.jsx',
};

for (const file of Object.values(files)) check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');

const shim = exists(files.shim) ? read(files.shim) : '';
const page = exists(files.page) ? read(files.page) : '';
const service = exists(files.service) ? read(files.service) : '';
const migration = exists(files.migration) ? read(files.migration) : '';
const membership = exists(files.membership) ? read(files.membership) : '';
const router = exists(files.router) ? read(files.router) : '';

check('Relationship Goals stays paid in entitlement map', membership.includes("relationship_goals: 'membership'") && router.includes('["/RelationshipGoals", RelationshipGoals, "relationship_goals"]'), 'The UI route must keep the approved paid entitlement.');
check('Relationship Goals route resolves to relaunch page', shim.includes("export { default } from './RelationshipGoalsRelaunch'"), 'Legacy reminder/share UI must not render.');
check('relaunch page does not advertise fake SMS or partner sharing', !page.includes('Enable SMS Reminders') && !page.includes('reminder_phone') && !page.includes('partner_email') && page.includes('SMS reminders and partner-sharing are not presented'), 'Only implemented persistence should be visible.');
check('signed-out users cannot operate private goals during open-gate preview', page.includes('if (!isAuthenticated)') && page.includes('/SignIn?returnTo=') && page.includes('/SignUp?returnTo='), 'Frontend paid gate may be intentionally off in beta, but private persistence still requires an account.');
check('relaunch goal service uses a narrow schema projection', service.includes('GOAL_COLUMNS') && !service.includes("select('*')") && !service.includes('partner_email') && !service.includes('reminder_phone'), 'Legacy unused sensitive/reminder fields should not be read or written by the relaunch service.');
check('relaunch goal service derives own user before mutations', service.includes('requireConfirmedUser') && service.includes('user_id: user.id') && service.includes(".eq('user_id', user.id)"), 'RLS is authoritative but client operations should remain own-row scoped.');
check('progress update writes only progress/status semantics', service.includes('updateRelationshipGoalProgress') && service.includes("status: value === 100 ? 'completed' : 'in_progress'") && !page.includes('notesPlaceholder'), 'Progress UI must not depend on an optional legacy notes column.');
check('paid goals migration explicitly waits for membership activation', migration.includes('do NOT apply this migration during the open/free controlled beta') && migration.includes("to_regclass('public.member_subscriptions')"), 'Database paid gate must not accidentally close the intentional beta.');
check('paid goals database boundary checks active/trialing membership', migration.includes('has_active_o2ol_membership') && migration.includes("ms.status in ('trialing', 'active')"), 'Paid persistence needs server/database membership enforcement, not only a React gate.');
check('paid goals and steps use restrictive owner+membership RLS', migration.includes('as restrictive') && migration.includes('O2OL paid goals select boundary') && migration.includes('O2OL paid goal steps select boundary') && migration.includes('public.has_active_o2ol_membership()'), 'Unknown permissive legacy policies must not bypass paid ownership.');
check('browser goal owner identity is immutable', migration.includes('new.user_id := auth.uid()') && migration.includes('new.user_id := old.user_id'), 'Members cannot transfer goal ownership by changing a column.');
check('new goal text and steps have bounded sizes', migration.includes('o2ol_goal_title_length') && migration.includes('o2ol_goal_description_length') && migration.includes('o2ol_goal_step_text_length') && migration.includes('not valid'), 'Protect new writes without making legacy cleanup an all-or-nothing migration blocker.');

console.log('\nOne2OneLove premium-data relaunch check\n');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
