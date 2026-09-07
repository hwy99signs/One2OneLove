import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';

const authUrl = process.env.VITE_NEON_AUTH_URL;
const dataApiUrl = process.env.VITE_NEON_DATA_API_URL;
if (!authUrl || !dataApiUrl) throw new Error('Missing Neon migration URLs');

// Neon Auth expects the same Origin header a real browser sends. GitHub Actions
// is headless, so add the trusted O2OL Cloudflare preview origin only for Auth.
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || String(input);
  if (!url.startsWith(authUrl)) return nativeFetch(input, init);
  const headers = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
  if (!headers.has('Origin')) headers.set('Origin', 'https://one2onelove-preview-migration.hwy99signs.workers.dev');
  return nativeFetch(input, { ...init, headers });
};

const makeClient = () => createClient({
  auth: { adapter: SupabaseAuthAdapter(), url: authUrl, allowAnonymous: true },
  dataApi: { url: dataApiUrl },
});

const stamp = Date.now();
const password = `O2OL-Smoke-${stamp}!Aa9`;
const emailA = `o2ol-smoke-a-${stamp}@example.com`;
const emailB = `o2ol-smoke-b-${stamp}@example.com`;
const a = makeClient();
const b = makeClient();

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

async function signup(client, email, name) {
  const result = await client.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  const user = authUser(result);
  assert(user?.id, `Sign-up did not return a user id for ${email}`);
  return user;
}

async function main() {
  console.log(`SMOKE_EMAIL_A=${emailA}`);
  console.log(`SMOKE_EMAIL_B=${emailB}`);

  const userA = await signup(a, emailA, 'O2OL Smoke A');
  const userB = await signup(b, emailB, 'O2OL Smoke B');
  console.log(`SMOKE_USER_A=${userA.id}`);
  console.log(`SMOKE_USER_B=${userB.id}`);

  unwrap('profile A insert', await a.from('users').insert({
    id: userA.id,
    email: emailA,
    name: 'O2OL Smoke A',
    user_type: 'regular',
    relationship_status: 'in_relationship',
    partner_email: emailB,
  }).select('id,email,name,partner_email').single());

  unwrap('profile B insert', await b.from('users').insert({
    id: userB.id,
    email: emailB,
    name: 'O2OL Smoke B',
    user_type: 'regular',
    relationship_status: 'in_relationship',
    partner_email: emailA,
  }).select('id,email,name,partner_email').single());

  const discovered = unwrap('public profile discovery', await a
    .from('user_public_profiles').select('id,name,email').eq('id', userB.id).single());
  assert(discovered?.id === userB.id, 'A could not discover B through safe public profile view');

  const request = unwrap('buddy request insert', await a.from('buddy_requests').insert({
    sender_id: userA.id,
    receiver_id: userB.id,
    status: 'pending',
  }).select('*').single());
  assert(request?.id, 'Buddy request missing id');

  const incoming = unwrap('buddy request recipient read', await b.from('buddy_requests')
    .select('*').eq('id', request.id).single());
  assert(incoming?.receiver_id === userB.id, 'B could not read incoming buddy request');

  const accepted = unwrap('buddy request accept', await b.from('buddy_requests')
    .update({ status: 'accepted' }).eq('id', request.id).select('*').single());
  assert(accepted?.status === 'accepted', 'Buddy request did not become accepted');

  const convData = unwrap('get/create conversation', await a.rpc('get_or_create_conversation', {
    p_user1_id: userA.id,
    p_user2_id: userB.id,
  }));
  const conversationId = typeof convData === 'string' ? convData : convData?.[0]?.get_or_create_conversation || convData;
  assert(conversationId, 'Conversation RPC returned no id');

  const message = unwrap('message send', await a.from('messages').insert({
    conversation_id: conversationId,
    sender_id: userA.id,
    receiver_id: userB.id,
    content: 'O2OL migration smoke message',
    message_type: 'text',
  }).select('*').single());
  assert(message?.id, 'Message send returned no id');

  const received = unwrap('message receive', await b.from('messages')
    .select('*').eq('id', message.id).single());
  assert(received?.content === 'O2OL migration smoke message', 'B could not read A message');

  unwrap('message mark read', await b.from('messages').update({
    is_read: true,
    read_at: new Date().toISOString(),
    delivered_at: new Date().toISOString(),
  }).eq('id', message.id).eq('receiver_id', userB.id).select('id,is_read').single());

  const journal = unwrap('shared journal create', await a.from('shared_journals').insert({
    user_id: userA.id,
    title: 'Migration shared journal',
    content: 'Partner visibility smoke test',
    entry_date: new Date().toISOString().slice(0, 10),
    mood: 'loving',
    tags: ['smoke'],
    shared_with_partner: true,
  }).select('*').single());
  assert(journal?.id, 'Shared journal create failed');

  const partnerJournal = unwrap('partner shared journal read', await b.from('shared_journals')
    .select('id,title,user_id,shared_with_partner').eq('id', journal.id).single());
  assert(partnerJournal?.id === journal.id, 'Declared partner could not read shared journal');

  const goal = unwrap('goal create', await a.from('relationship_goals').insert({
    user_id: userA.id,
    title: 'Migration goal',
    description: 'Core feature smoke test',
    category: 'communication',
    status: 'in_progress',
    progress: 10,
    target_date: '2026-12-31',
    reminder_enabled: false,
  }).select('*').single());
  assert(goal?.id, 'Goal create failed');

  const step = unwrap('goal action step create', await a.from('goal_action_steps').insert({
    goal_id: goal.id,
    step_text: 'Talk for 10 minutes',
    step_order: 1,
    is_completed: false,
  }).select('*').single());
  assert(step?.id, 'Goal action step create failed');

  const updatedGoal = unwrap('goal update', await a.from('relationship_goals')
    .update({ progress: 55 }).eq('id', goal.id).select('id,progress').single());
  assert(updatedGoal?.progress === 55, 'Goal progress update failed');

  const event = unwrap('calendar create', await a.from('calendar_events').insert({
    user_id: userA.id,
    title: 'Migration date night',
    event_date: '2026-10-01',
    event_type: 'date',
    reminder_enabled: false,
    is_recurring: false,
  }).select('*').single());
  assert(event?.id, 'Calendar create failed');

  const updatedEvent = unwrap('calendar update', await a.from('calendar_events')
    .update({ location: 'Migration Test Cafe' }).eq('id', event.id).select('id,location').single());
  assert(updatedEvent?.location === 'Migration Test Cafe', 'Calendar update failed');

  const milestone = unwrap('milestone create', await a.from('relationship_milestones').insert({
    user_id: userA.id,
    title: 'Migration milestone',
    milestone_type: 'custom',
    date: '2026-08-01',
    is_recurring: true,
    reminder_enabled: false,
    media_urls: [],
    celebration_ideas: [],
  }).select('*').single());
  assert(milestone?.id, 'Milestone create failed');

  const updatedMilestone = unwrap('milestone update', await a.from('relationship_milestones')
    .update({ description: 'Updated successfully' }).eq('id', milestone.id)
    .select('id,description').single());
  assert(updatedMilestone?.description === 'Updated successfully', 'Milestone update failed');

  // Cleanup feature rows while authenticated. Profiles/auth users are cleaned by the
  // migration operator after the run so failure cases still leave ids in the logs.
  unwrap('milestone delete', await a.from('relationship_milestones').delete().eq('id', milestone.id));
  unwrap('calendar delete', await a.from('calendar_events').delete().eq('id', event.id));
  unwrap('goal delete', await a.from('relationship_goals').delete().eq('id', goal.id));
  unwrap('journal delete', await a.from('shared_journals').delete().eq('id', journal.id));
  unwrap('conversation delete', await a.from('conversations').delete().eq('id', conversationId));
  unwrap('buddy request delete', await a.from('buddy_requests').delete().eq('id', request.id));

  console.log('O2OL_FEATURE_SMOKE=PASS');
}

main().catch((error) => {
  console.error('O2OL_FEATURE_SMOKE=FAIL');
  console.error(error);
  process.exit(1);
});
