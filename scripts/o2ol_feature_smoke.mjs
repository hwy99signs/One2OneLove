import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

const authUrl = process.env.VITE_NEON_AUTH_URL;
const dataApiUrl = process.env.VITE_NEON_DATA_API_URL;
if (!authUrl || !dataApiUrl) throw new Error('Missing Neon migration URLs');

// GitHub Actions is headless. Emulate the small part of a browser Neon Auth
// needs for email/password tests: trusted Origin + persisted auth cookies.
const nativeFetch = globalThis.fetch;
const cookieJar = new Map();

const cookieHeader = () => [...cookieJar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
const rememberCookies = (response) => {
  const values = response.headers.getSetCookie?.() || [];
  const fallback = response.headers.get('set-cookie');
  const setCookies = values.length ? values : (fallback ? [fallback] : []);
  for (const raw of setCookies) {
    const first = raw.split(';', 1)[0];
    const eq = first.indexOf('=');
    if (eq <= 0) continue;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (value) cookieJar.set(name, value);
    else cookieJar.delete(name);
  }
};

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || String(input);
  if (!url.startsWith(authUrl)) return nativeFetch(input, init);

  const headers = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
  if (!headers.has('Origin')) headers.set('Origin', 'https://one2onelove-preview-migration.hwy99signs.workers.dev');
  const cookies = cookieHeader();
  if (cookies && !headers.has('Cookie')) headers.set('Cookie', cookies);

  const response = await nativeFetch(input, { ...init, headers });
  rememberCookies(response);
  return response;
};

const client = createClient({
  auth: { adapter: SupabaseAuthAdapter(), url: authUrl, allowAnonymous: true },
  dataApi: { url: dataApiUrl },
});

const stamp = Date.now();
const password = `O2OL-Smoke-${stamp}!Aa9`;
const email = `o2ol-smoke-${stamp}@example.com`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unwrap(label, result) {
  if (result?.error) throw new Error(`${label}: ${result.error.message || JSON.stringify(result.error)}`);
  return result?.data;
}

function authUser(result) {
  const data = unwrap('auth', result);
  return data?.user || data?.session?.user || result?.user || null;
}

async function main() {
  console.log(`SMOKE_EMAIL=${email}`);

  const signupResult = await client.auth.signUp({
    email,
    password,
    options: { data: { name: 'O2OL Migration Smoke' } },
  });
  const user = authUser(signupResult);
  assert(user?.id, 'Sign-up did not return a user id');
  console.log(`SMOKE_USER=${user.id}`);

  const sessionData = unwrap('session', await client.auth.getSession());
  assert(sessionData?.session || sessionData?.user || sessionData?.access_token || sessionData?.accessToken, 'Authenticated session was not retained');

  const profile = unwrap('profile insert', await client.from('users').insert({
    id: user.id,
    email,
    name: 'O2OL Migration Smoke',
    user_type: 'regular',
    relationship_status: 'in_relationship',
  }).select('id,email,name,subscription_plan,subscription_status').single());
  assert(profile?.id === user.id, 'Profile insert failed');
  assert(profile?.subscription_plan === 'Basic', 'Basic subscription default was not applied');
  assert(profile?.subscription_status === 'active', 'Active subscription default was not applied');

  const updatedProfile = unwrap('profile update', await client.from('users')
    .update({ bio: 'Migration smoke profile', location: 'Test City' })
    .eq('id', user.id).select('id,bio,location').single());
  assert(updatedProfile?.bio === 'Migration smoke profile', 'Profile update failed');

  const journal = unwrap('journal create', await client.from('shared_journals').insert({
    user_id: user.id,
    title: 'Migration journal',
    content: 'Journal CRUD smoke test',
    entry_date: new Date().toISOString().slice(0, 10),
    mood: 'loving',
    tags: ['smoke'],
    shared_with_partner: false,
  }).select('*').single());
  assert(journal?.id, 'Journal create failed');

  const updatedJournal = unwrap('journal update', await client.from('shared_journals')
    .update({ content: 'Journal update passed' }).eq('id', journal.id)
    .select('id,content').single());
  assert(updatedJournal?.content === 'Journal update passed', 'Journal update failed');

  const goal = unwrap('goal create', await client.from('relationship_goals').insert({
    user_id: user.id,
    title: 'Migration goal',
    description: 'Core feature smoke test',
    category: 'communication',
    status: 'in_progress',
    progress: 10,
    target_date: '2026-12-31',
    reminder_enabled: false,
  }).select('*').single());
  assert(goal?.id, 'Goal create failed');

  const step = unwrap('goal action step create', await client.from('goal_action_steps').insert({
    goal_id: goal.id,
    step_text: 'Talk for 10 minutes',
    step_order: 1,
    is_completed: false,
  }).select('*').single());
  assert(step?.id, 'Goal action step create failed');

  const updatedGoal = unwrap('goal update', await client.from('relationship_goals')
    .update({ progress: 55 }).eq('id', goal.id).select('id,progress').single());
  assert(updatedGoal?.progress === 55, 'Goal progress update failed');

  const event = unwrap('calendar create', await client.from('calendar_events').insert({
    user_id: user.id,
    title: 'Migration date night',
    event_date: '2026-10-01',
    event_type: 'date',
    reminder_enabled: false,
    is_recurring: false,
  }).select('*').single());
  assert(event?.id, 'Calendar create failed');

  const updatedEvent = unwrap('calendar update', await client.from('calendar_events')
    .update({ location: 'Migration Test Cafe' }).eq('id', event.id)
    .select('id,location').single());
  assert(updatedEvent?.location === 'Migration Test Cafe', 'Calendar update failed');

  const milestone = unwrap('milestone create', await client.from('relationship_milestones').insert({
    user_id: user.id,
    title: 'Migration milestone',
    milestone_type: 'custom',
    date: '2026-08-01',
    is_recurring: true,
    reminder_enabled: false,
    media_urls: [],
    celebration_ideas: [],
  }).select('*').single());
  assert(milestone?.id, 'Milestone create failed');

  const updatedMilestone = unwrap('milestone update', await client.from('relationship_milestones')
    .update({ description: 'Updated successfully' }).eq('id', milestone.id)
    .select('id,description').single());
  assert(updatedMilestone?.description === 'Updated successfully', 'Milestone update failed');

  // Clean feature rows while authenticated. The public profile and Neon Auth
  // identity are intentionally left long enough for the operator to clean them
  // with admin tools even if a future test fails midway.
  unwrap('milestone delete', await client.from('relationship_milestones').delete().eq('id', milestone.id));
  unwrap('calendar delete', await client.from('calendar_events').delete().eq('id', event.id));
  unwrap('goal delete', await client.from('relationship_goals').delete().eq('id', goal.id));
  unwrap('journal delete', await client.from('shared_journals').delete().eq('id', journal.id));

  console.log('O2OL_FEATURE_SMOKE=PASS');
}

main().catch((error) => {
  console.error('O2OL_FEATURE_SMOKE=FAIL');
  console.error(error);
  process.exit(1);
});
