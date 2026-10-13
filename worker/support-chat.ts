// @ts-nocheck
// O2OL Support Chat — owner-directed (Eisenhower, 2026-10-12): "setup an ai
// support chat that goes to you." The chat is fronted by Musey (the owner's
// agent — his name and avatar on the panel, at his direction). It answers
// instantly from the support handbook (worker/support-knowledge.ts) using
// the site's AI plumbing, reads a signed-in member's OWN account snapshot
// (wallet balance + recent Credit activity + Game Credit) so balance
// questions are answered with real numbers, and escalates everything else
// into the existing admin support queue (public.suggestions — the same
// table the dashboard's Support & Reports panel reads). Open to members
// AND guests (owner's choice); guests get handbook answers only, never
// account data. Support is always free — no Credit is ever charged here.
import { Client } from 'pg';
import { SUPPORT_SYSTEM_PROMPT, SUPPORT_HANDBOOK_VERSION } from './support-knowledge';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const MAX_MESSAGE_CHARS = 2000;
const HISTORY_MESSAGES = 12;
const MAX_MESSAGES_PER_HOUR = 30;
const ESCALATE_MARKER = '[[ESCALATE]]';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function clean(value, max) {
  const out = String(value ?? '').trim();
  return out.length > max ? out.slice(0, max) : out;
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie || !env.NEON_AUTH_BASE_URL) return null;
  try {
    const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
      headers: { cookie, accept: 'application/json' },
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    const user = payload?.user ?? payload?.data?.user ?? null;
    const active = payload?.session ?? payload?.data?.session ?? null;
    return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
  } catch {
    return null;
  }
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function ensureSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.support_chat_conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid,
      visitor_id text,
      email text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.support_chat_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES public.support_chat_conversations(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('user','assistant')),
      content text NOT NULL,
      escalated boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_support_chat_messages_conversation ON public.support_chat_messages(conversation_id, created_at)`);
}

// Same provider plumbing as worker/ai.ts (OpenAI Responses API).
function outputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const pieces = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if ((content?.type === 'output_text' || content?.type === 'text') && content?.text) pieces.push(content.text);
    }
  }
  return pieces.join('\n').trim();
}

async function openAiText(env, { instructions, input, maxOutputTokens = 700 }) {
  if (!env.OPENAI_API_KEY) {
    throw Object.assign(new Error('AI service is not configured yet.'), { status: 503, code: 'ai_not_configured' });
  }
  const model = env.OPENAI_MODEL || 'gpt-5-mini';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, instructions, input, max_output_tokens: maxOutputTokens, store: false }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || 'AI provider request failed.';
    throw Object.assign(new Error(message), { status: 502, code: 'ai_provider_error' });
  }
  const text = outputText(payload);
  if (!text) throw Object.assign(new Error('AI provider returned no text.'), { status: 502, code: 'empty_ai_response' });
  return text;
}

function cents(value) {
  const n = Number(value || 0);
  return `$${(n / 100).toFixed(2)}`;
}

// The signed-in member's OWN data only — resolved from the session user id,
// never from anything the client sends.
async function memberSnapshot(db, userId) {
  const [profile, wallet, activity, gameCredit] = await Promise.all([
    db.query(`SELECT username, email, name FROM public.users WHERE id=$1::uuid`, [userId]),
    db.query(`SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid`, [userId]),
    db.query(
      `SELECT t.transaction_type, fp.label AS feature_label, t.feature_code, COALESCE(t.wallet_delta, t.amount_cents, 0) AS delta_cents, t.balance_after, t.created_at
         FROM public.o2ol_token_transactions t
         LEFT JOIN public.o2ol_token_feature_prices fp ON fp.feature_code=t.feature_code
        WHERE t.user_id=$1::uuid
        ORDER BY t.created_at DESC
        LIMIT 8`,
      [userId],
    ).catch(() => ({ rows: [] })),
    db.query(
      `SELECT COALESCE(sum(remaining_cents),0)::int AS balance_cents, min(expires_at) AS next_expiry
         FROM public.o2ol_game_credit_ledger
        WHERE user_id=$1::uuid AND remaining_cents>0 AND (expires_at IS NULL OR expires_at>now())`,
      [userId],
    ).catch(() => ({ rows: [] })),
  ]);
  const p = profile.rows[0] || {};
  const lines = [];
  lines.push(`Member: ${p.name || p.username || 'member'} (${p.email || 'email on file'})`);
  lines.push(`Paid Credit balance: ${cents(wallet.rows[0]?.balance)} (paid Credit never expires)`);
  const gc = gameCredit.rows[0];
  if (gc) lines.push(`Game Credit balance: ${cents(gc.balance_cents)}${gc.next_expiry ? ` (next expiry ${new Date(gc.next_expiry).toISOString()})` : ''} — games only`);
  if (activity.rows.length) {
    lines.push('Recent Credit activity (newest first):');
    for (const row of activity.rows) {
      const when = new Date(row.created_at).toISOString().slice(0, 10);
      const what = row.feature_label || row.feature_code || row.transaction_type;
      const delta = Number(row.delta_cents || 0);
      lines.push(`- ${when}: ${what} — ${delta >= 0 ? '+' : '−'}${cents(Math.abs(delta))}${row.balance_after != null ? `, balance after ${cents(row.balance_after)}` : ''} (${row.transaction_type})`);
    }
  } else {
    lines.push('Recent Credit activity: none on record.');
  }
  return { profile: p, text: lines.join('\n') };
}

async function fileEscalationTicket(db, { name, email, transcript, reason }) {
  const ready = (await db.query(`SELECT to_regclass('public.suggestions') IS NOT NULL AS ready`)).rows[0]?.ready === true;
  if (!ready) return false;
  const body = [
    '[Support chat escalation — filed by Musey for the team]',
    reason ? `Reason: ${reason}` : null,
    '',
    'Conversation:',
    transcript,
  ].filter(Boolean).join('\n').slice(0, 5000);
  await db.query(
    `INSERT INTO public.suggestions(name,email,suggestion_type,suggestion) VALUES($1,$2,'other',$3)`,
    [name || 'Support chat visitor', email || null, body],
  );
  return true;
}

export async function handleSupportChatRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/support-chat')) return null;
  if (url.pathname !== '/api/support-chat/message') return fail('Support chat route not found.', 404, 'not_found');
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Invalid request body.');
  const message = clean(body.message, MAX_MESSAGE_CHARS * 2);
  if (!message) return fail('Please type a message.');
  if (message.length > MAX_MESSAGE_CHARS) return fail(`Please keep messages under ${MAX_MESSAGE_CHARS} characters.`);
  const visitorId = clean(body.visitorId, 120);
  const contactEmail = clean(body.email, 320)?.toLowerCase() || null;
  if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) return fail('Enter a valid email address.');
  const requestedConversation = UUID.test(String(body.conversationId || '')) ? String(body.conversationId) : null;

  const auth = await session(request, env);
  const userId = auth?.user?.id || null;
  if (!userId && !visitorId) return fail('A visitor ID is required.');

  try {
    return await withDb(env, async (db) => {
      await ensureSchema(db);

      // Resolve or create the conversation. A conversation belongs to its
      // member (session) or its guest visitor id — never to a caller-supplied
      // id alone, so nobody can read or continue someone else's chat.
      let conversation = null;
      if (requestedConversation) {
        const found = await db.query(`SELECT * FROM public.support_chat_conversations WHERE id=$1::uuid`, [requestedConversation]);
        const row = found.rows[0];
        if (row && ((userId && row.user_id === userId) || (!userId && visitorId && row.visitor_id === visitorId))) conversation = row;
      }
      if (!conversation) {
        const created = await db.query(
          `INSERT INTO public.support_chat_conversations(user_id, visitor_id, email) VALUES($1::uuid,$2,$3) RETURNING *`,
          [userId, visitorId || null, contactEmail],
        );
        conversation = created.rows[0];
      } else if (contactEmail && !conversation.email) {
        await db.query(`UPDATE public.support_chat_conversations SET email=$2 WHERE id=$1::uuid`, [conversation.id, contactEmail]);
        conversation.email = contactEmail;
      }

      // Rate limit: messages in the last hour for this conversation.
      const recentCount = await db.query(
        `SELECT count(*)::int AS n FROM public.support_chat_messages WHERE conversation_id=$1::uuid AND role='user' AND created_at>now()-interval '1 hour'`,
        [conversation.id],
      );
      if (Number(recentCount.rows[0]?.n || 0) >= MAX_MESSAGES_PER_HOUR) {
        return fail('You have sent a lot of messages in the last hour — please give it a little time and try again. For anything urgent, email support@one2onelove.com.', 429, 'rate_limited');
      }

      const historyResult = await db.query(
        `SELECT role, content FROM public.support_chat_messages WHERE conversation_id=$1::uuid ORDER BY created_at DESC LIMIT $2`,
        [conversation.id, HISTORY_MESSAGES],
      );
      const history = historyResult.rows.reverse();

      await db.query(
        `INSERT INTO public.support_chat_messages(conversation_id, role, content) VALUES($1::uuid,'user',$2)`,
        [conversation.id, message],
      );

      let snapshot = null;
      if (userId) snapshot = await memberSnapshot(db, userId).catch(() => null);

      const instructions = snapshot
        ? `${SUPPORT_SYSTEM_PROMPT}\n\nPRIVATE ACCOUNT SNAPSHOT (this member's own data — use it only for this member's questions; never share it with anyone else):\n${snapshot.text}`
        : SUPPORT_SYSTEM_PROMPT;
      const input = [
        ...history.map((row) => `${row.role === 'user' ? 'Visitor' : 'Musey'}: ${row.content}`),
        `Visitor: ${message}`,
      ].join('\n\n');

      let reply = await openAiText(env, { instructions, input });
      let escalated = false;
      if (reply.includes(ESCALATE_MARKER)) {
        reply = reply.split(ESCALATE_MARKER).join('').trim();
        const transcript = [
          ...history.map((row) => `${row.role === 'user' ? 'Visitor' : 'Musey'}: ${row.content}`),
          `Visitor: ${message}`,
          `Musey: ${reply}`,
        ].join('\n');
        const name = snapshot?.profile?.name || snapshot?.profile?.username || (userId ? 'Signed-in member' : 'Support chat guest');
        const email = snapshot?.profile?.email || conversation.email || contactEmail;
        escalated = await fileEscalationTicket(db, {
          name,
          email,
          transcript,
          reason: `Support chat escalation (handbook v${SUPPORT_HANDBOOK_VERSION})`,
        }).catch(() => false);
        if (escalated) {
          reply += '\n\nI\'ve passed this to our team with the details of our conversation — they\'ll follow up using the contact details we have. For anything urgent, you can also reach us at support@one2onelove.com.';
        }
      }
      if (!reply) reply = 'Thank you — I\'ve noted that down. Could you tell me a little more about what you need help with?';

      await db.query(
        `INSERT INTO public.support_chat_messages(conversation_id, role, content, escalated) VALUES($1::uuid,'assistant',$2,$3)`,
        [conversation.id, reply, escalated],
      );
      await db.query(`UPDATE public.support_chat_conversations SET updated_at=now() WHERE id=$1::uuid`, [conversation.id]);

      return json({ ok: true, conversationId: conversation.id, reply, escalated });
    });
  } catch (error) {
    console.error('One2OneLove support chat error', error);
    return fail(error?.message || 'Support chat is unavailable right now. Please email support@one2onelove.com.', error?.status || 500, error?.code || 'support_chat_error');
  }
}
