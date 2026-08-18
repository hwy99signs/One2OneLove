import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const files = {
  migration: 'supabase/migrations/20260818_premium_ai_tools.sql',
  coachFunction: 'supabase/functions/relationship-coach/index.ts',
  coachService: 'src/lib/relationshipCoachService.js',
  coachPage: 'src/pages/RelationshipCoach.jsx',
  creatorFunction: 'supabase/functions/generate-relationship-content/index.ts',
  creatorService: 'src/lib/aiContentCreatorService.js',
  creatorPage: 'src/pages/AIContentCreator.jsx',
  membership: 'src/lib/membershipConfig.js',
};

for (const file of Object.values(files)) {
  check(`required: ${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const migration = exists(files.migration) ? read(files.migration) : '';
const coachFunction = exists(files.coachFunction) ? read(files.coachFunction) : '';
const coachService = exists(files.coachService) ? read(files.coachService) : '';
const coachPage = exists(files.coachPage) ? read(files.coachPage) : '';
const creatorFunction = exists(files.creatorFunction) ? read(files.creatorFunction) : '';
const creatorService = exists(files.creatorService) ? read(files.creatorService) : '';
const creatorPage = exists(files.creatorPage) ? read(files.creatorPage) : '';
const membership = exists(files.membership) ? read(files.membership) : '';

check(
  'premium AI entitlements require membership',
  membership.includes("relationship_coach: 'membership'") && membership.includes("ai_content_creator: 'membership'"),
  'Both premium AI surfaces must remain on the approved paid entitlement.'
);
check(
  'premium AI raw tables are browser-private',
  migration.includes('revoke all on table public.ai_coach_conversations from anon, authenticated')
    && migration.includes('revoke all on table public.ai_coach_messages from anon, authenticated')
    && migration.includes('revoke all on table public.premium_ai_usage from anon, authenticated'),
  'Raw Coach history and usage/idempotency records stay server-owned.'
);
check(
  'premium AI usage ledger can privately replay results',
  migration.includes('result_text text') && migration.includes('unique (user_id, feature, request_id)'),
  'A logical request needs a unique request ID and private stored result for retry safety.'
);

for (const [label, source] of [['Relationship Coach', coachFunction], ['AI Content Creator', creatorFunction]]) {
  check(
    `${label} has independent spend and membership gates`,
    source.includes("Deno.env.get('PREMIUM_AI_ENABLED') !== 'true'")
      && source.includes("Deno.env.get('MEMBERSHIP_GATING_ENABLED') !== 'true'"),
    'Deploying the function must not automatically enable AI spend or premium access.'
  );
  check(
    `${label} verifies confirmed Auth before AI`,
    source.includes('userClient.auth.getUser()') && source.includes('EMAIL_NOT_CONFIRMED'),
    'An unconfirmed or anonymous caller must not reach model generation.'
  );
  check(
    `${label} verifies membership server-side`,
    source.includes(".from('member_subscriptions')") && source.includes('MEMBERSHIP_REQUIRED'),
    'Frontend gating alone is not sufficient for a paid AI feature.'
  );
  check(
    `${label} disables Responses API application-state storage`,
    source.includes('store: false'),
    'Prepared model requests should not use OpenAI Responses application-state storage.'
  );
}

check(
  'Coach context stays inside the member own limited Coach history',
  coachFunction.includes(".from('ai_coach_messages')")
    && coachFunction.includes(".eq('user_id', user.id)")
    && coachFunction.includes('.limit(20)')
    && !coachFunction.includes(".from('love_note_invitations')")
    && !coachFunction.includes(".from('messages')"),
  'Do not silently feed Love Notes, pairwise Chat, or unrelated account history to the Coach.'
);
check(
  'Coach lost-response retry can replay completed result',
  coachFunction.includes("existing?.status === 'succeeded'")
    && coachFunction.includes('existing.result_text')
    && coachFunction.includes('idempotent: true')
    && coachService.includes('request_id: requestId || createRequestId()'),
  'A retry of the same deliberate Coach submission should not create another model call.'
);
check(
  'Coach page is real service UI rather than legacy TODO simulation',
  coachPage.includes("useFeatureAccess('relationship_coach')")
    && !coachPage.includes('AI Coach feature requires implementation')
    && !coachPage.includes('TODO: Implement conversation'),
  'Relaunch UI must not claim an AI action happened when it did not.'
);

check(
  'AI Content Creator does not receive unrelated private product history',
  !creatorFunction.includes(".from('love_note_invitations')")
    && !creatorFunction.includes(".from('messages')")
    && !creatorFunction.includes(".from('users')"),
  'Creator input should be only the member-provided generation fields plus server entitlement state.'
);
check(
  'AI Content Creator replays completed duplicate request',
  creatorFunction.includes("existing?.status === 'succeeded'")
    && creatorFunction.includes('existing.result_text')
    && creatorFunction.includes('idempotent: true')
    && creatorFunction.includes('result_text: content'),
  'Lost HTTP responses must be recoverable without a second model generation.'
);
check(
  'AI Content Creator checks idempotency before usage cap',
  creatorFunction.indexOf(".select('id, status, result_text')") > -1
    && creatorFunction.indexOf(".select('id, status, result_text')") < creatorFunction.indexOf('const limit = await rateLimit'),
  'A completed retry should recover its paid-for result even if the member later reaches the cap.'
);
check(
  'AI Content Creator client sends a stable explicit request ID',
  creatorService.includes('request_id: requestId || createRequestId()')
    && creatorPage.includes('const requestId = retrySameRequest && lastRequestId')
    && creatorPage.includes('newAiContentRequestId()'),
  'Ambiguous retries and deliberate regenerations need distinct semantics.'
);
check(
  'AI Content Creator page is wired to secure service',
  creatorPage.includes("useFeatureAccess('ai_content_creator')")
    && creatorPage.includes('generateRelationshipContent({')
    && !creatorPage.includes('AI Content Creator feature requires implementation')
    && !creatorPage.includes("from '@/lib/supabase'")
    && !creatorPage.includes('supabase.functions.invoke'),
  'Page should use the reviewed service instead of mock or direct ad-hoc backend calls.'
);
check(
  'localized tone labels cannot become invalid server values',
  creatorPage.includes("<SelectItem key={key} value={key}>{label}</SelectItem>")
    && !creatorPage.includes('value={label.toLowerCase()}'),
  'Spanish/French/etc. labels must not be sent as server enum values.'
);
check(
  'AI Content Creator tells member nothing is auto-sent',
  creatorPage.includes('Nothing is automatically sent to anyone.'),
  'Generated relationship text remains a draft under member control.'
);

console.log('\nOne2OneLove premium AI relaunch check\n');
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const failures = checks.filter((item) => !item.pass);
console.log(`\n${checks.length} checks · ${failures.length} blocker(s)\n`);
process.exitCode = failures.length ? 1 : 0;
