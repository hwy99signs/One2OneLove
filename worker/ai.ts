// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function cleanText(value, max = 10000, required = false) {
  if (value == null) {
    if (required) throw new Error('Required value is missing.');
    return null;
  }
  const text = String(value).trim();
  if (required && !text) throw new Error('Required value is empty.');
  if (text.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return text || null;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}
function canonicalPlan(value) {
  const plan = String(value || '').trim().toLowerCase();
  if (plan === 'basic') return 'Basic';
  if (plan === 'premiere') return 'Premiere';
  if (plan === 'exclusive') return 'Exclusive';
  return 'Basic';
}
async function entitlement(db, userId, feature) {
  const result = await db.query(
    'SELECT subscription_plan,subscription_status FROM public.users WHERE id=$1::uuid',
    [userId],
  );
  if (!result.rows[0]) return { allowed: false, reason: 'User profile not found.' };
  const plan = canonicalPlan(result.rows[0].subscription_plan);
  const status = String(result.rows[0].subscription_status || '').toLowerCase();
  const paidActive = ['active', 'trial', 'trialing'].includes(status);

  if (feature === 'content_creator') {
    return plan === 'Exclusive' && paidActive
      ? { allowed: true, plan, limit: null }
      : { allowed: false, plan, reason: 'AI Content Creator is available on the Exclusive plan.' };
  }

  if (feature === 'relationship_coach') {
    if (!paidActive || plan === 'Basic') {
      return { allowed: false, plan, reason: 'AI Relationship Coach is available on Premiere and Exclusive plans.' };
    }
    if (plan === 'Exclusive') return { allowed: true, plan, limit: null };

    const usage = await db.query(
      `SELECT count(*)::int AS count
         FROM public.ai_usage_events
        WHERE user_id=$1::uuid
          AND feature='relationship_coach'
          AND created_at >= date_trunc('month', now())`,
      [userId],
    );
    const used = usage.rows[0]?.count || 0;
    return used < 50
      ? { allowed: true, plan, limit: 50, used, remaining: 50 - used }
      : { allowed: false, plan, limit: 50, used, remaining: 0, reason: 'You have used your 50 AI Relationship Coach questions for this month.' };
  }

  return { allowed: false, reason: 'Unknown AI feature.' };
}
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
async function openAiText(env, { instructions, input, maxOutputTokens = 900 }) {
  if (!env.OPENAI_API_KEY) {
    throw Object.assign(new Error('AI service is not configured yet.'), { status: 503, code: 'ai_not_configured' });
  }
  const model = env.OPENAI_MODEL || 'gpt-5-mini';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      max_output_tokens: maxOutputTokens,
      store: false,
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || 'AI provider request failed.';
    throw Object.assign(new Error(message), { status: 502, code: 'ai_provider_error' });
  }
  const text = outputText(payload);
  if (!text) throw Object.assign(new Error('AI provider returned no text.'), { status: 502, code: 'empty_ai_response' });
  return { text, model: payload?.model || model };
}
async function requireConversation(db, conversationId, userId) {
  if (!UUID.test(String(conversationId || ''))) throw Object.assign(new Error('Invalid conversation ID.'), { status: 400, code: 'bad_request' });
  const result = await db.query(
    'SELECT * FROM public.ai_coach_conversations WHERE id=$1::uuid AND user_id=$2::uuid',
    [conversationId, userId],
  );
  if (!result.rows[0]) throw Object.assign(new Error('Coaching conversation not found.'), { status: 404, code: 'not_found' });
  return result.rows[0];
}
async function listConversations(db, userId) {
  const result = await db.query(
    `SELECT c.id,c.title,c.created_at,c.updated_at,
            (SELECT content FROM public.ai_coach_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
       FROM public.ai_coach_conversations c
      WHERE c.user_id=$1::uuid
      ORDER BY c.updated_at DESC,c.created_at DESC`,
    [userId],
  );
  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    metadata: { name: row.title },
    created_at: row.created_at,
    created_date: row.created_at,
    updated_at: row.updated_at,
    last_message: row.last_message,
  }));
}
async function listMessages(db, conversationId, userId) {
  await requireConversation(db, conversationId, userId);
  const result = await db.query(
    `SELECT id,role,content,model,created_at
       FROM public.ai_coach_messages
      WHERE conversation_id=$1::uuid AND user_id=$2::uuid
      ORDER BY created_at ASC,id ASC`,
    [conversationId, userId],
  );
  return result.rows.map(row => ({
    id: row.id,
    role: row.role,
    content: row.content,
    text: row.content,
    created_at: row.created_at,
    model: row.model,
    is_user: row.role === 'user',
  }));
}
async function sendCoachMessage(db, env, auth, conversationId, message) {
  const entitlementResult = await entitlement(db, auth.user.id, 'relationship_coach');
  if (!entitlementResult.allowed) return fail(entitlementResult.reason, 403, 'feature_not_available');

  const conversation = await requireConversation(db, conversationId, auth.user.id);
  const text = cleanText(message, 6000, true);
  const historyResult = await db.query(
    `SELECT role,content FROM public.ai_coach_messages
      WHERE conversation_id=$1::uuid AND user_id=$2::uuid
      ORDER BY created_at DESC LIMIT 12`,
    [conversationId, auth.user.id],
  );
  const history = historyResult.rows.reverse();
  const transcript = history.map(item => `${item.role === 'assistant' ? 'Coach' : 'Member'}: ${item.content}`).join('\n\n');
  const prompt = `${transcript ? `${transcript}\n\n` : ''}Member: ${text}\n\nCoach:`;
  const instructions = 'You are One2OneLove Relationship Coach. Give warm, practical relationship guidance, not diagnosis or therapy. Encourage respectful communication and boundaries. If there is abuse, danger, self-harm, or an emergency, prioritize immediate safety and appropriate local professional help. Keep answers concise and actionable.';
  const generated = await openAiText(env, { instructions, input: prompt, maxOutputTokens: 900 });

  await db.query('BEGIN');
  try {
    const userMessage = await db.query(
      `INSERT INTO public.ai_coach_messages(conversation_id,user_id,role,content)
       VALUES($1::uuid,$2::uuid,'user',$3) RETURNING id,role,content,created_at`,
      [conversationId, auth.user.id, text],
    );
    const assistantMessage = await db.query(
      `INSERT INTO public.ai_coach_messages(conversation_id,user_id,role,content,model)
       VALUES($1::uuid,$2::uuid,'assistant',$3,$4) RETURNING id,role,content,model,created_at`,
      [conversationId, auth.user.id, generated.text, generated.model],
    );
    await db.query(
      `INSERT INTO public.ai_usage_events(user_id,feature) VALUES($1::uuid,'relationship_coach')`,
      [auth.user.id],
    );
    const nextTitle = conversation.title === 'Coaching Session' ? text.slice(0, 72) : conversation.title;
    await db.query('UPDATE public.ai_coach_conversations SET title=$1,updated_at=now() WHERE id=$2::uuid', [nextTitle, conversationId]);
    await db.query('COMMIT');
    return json({
      ok: true,
      userMessage: { ...userMessage.rows[0], text: userMessage.rows[0].content, is_user: true },
      message: { ...assistantMessage.rows[0], text: assistantMessage.rows[0].content, is_user: false },
      entitlement: entitlementResult,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
async function createContent(db, env, auth, input) {
  const entitlementResult = await entitlement(db, auth.user.id, 'content_creator');
  if (!entitlementResult.allowed) return fail(entitlementResult.reason, 403, 'feature_not_available');

  const contentType = cleanText(input?.contentType, 100, true);
  const tone = cleanText(input?.tone, 100, true);
  const length = cleanText(input?.length || 'medium', 30, true);
  const details = cleanText(input?.details, 5000, false);
  const partnerName = cleanText(input?.partnerName, 200, false);
  const language = cleanText(input?.language || 'en', 20, true);
  const lengthGuide = { short: '50-100 words', medium: '150-250 words', long: '300-400 words' }[length] || '150-250 words';
  const prompt = [
    `Create a ${tone} ${contentType} for a romantic partner.`,
    partnerName ? `Partner name: ${partnerName}.` : '',
    `Length: ${lengthGuide}.`,
    `Language code: ${language}.`,
    details ? `Context: ${details}` : '',
    'Make it heartfelt, natural, respectful, and ready for the member to personalize. Return only the requested content.',
  ].filter(Boolean).join('\n');
  const instructions = 'You create personalized relationship messages for One2OneLove members. Follow the requested tone and language. Avoid manipulative, coercive, hateful, or sexually exploitative content. Do not claim to know facts the member did not provide.';
  const generated = await openAiText(env, { instructions, input: prompt, maxOutputTokens: 1000 });
  await db.query(`INSERT INTO public.ai_usage_events(user_id,feature) VALUES($1::uuid,'content_creator')`, [auth.user.id]);
  return json({ ok: true, content: generated.text, model: generated.model });
}

export async function handleAiRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/ai')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async db => {
      if (url.pathname === '/api/ai/config' && request.method === 'GET') {
        const coach = await entitlement(db, auth.user.id, 'relationship_coach');
        const creator = await entitlement(db, auth.user.id, 'content_creator');
        return json({ ok: true, configured: Boolean(env.OPENAI_API_KEY), model: env.OPENAI_MODEL || 'gpt-5-mini', coach, creator });
      }

      if (url.pathname === '/api/ai/coach/conversations') {
        if (request.method === 'GET') return json({ ok: true, conversations: await listConversations(db, auth.user.id) });
        if (request.method === 'POST') {
          const e = await entitlement(db, auth.user.id, 'relationship_coach');
          if (!e.allowed) return fail(e.reason, 403, 'feature_not_available');
          const result = await db.query(
            `INSERT INTO public.ai_coach_conversations(user_id) VALUES($1::uuid)
             RETURNING id,title,created_at,updated_at`,
            [auth.user.id],
          );
          return json({ ok: true, conversation: { ...result.rows[0], metadata: { name: result.rows[0].title }, created_date: result.rows[0].created_at } }, 201);
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      const conversationMatch = url.pathname.match(/^\/api\/ai\/coach\/conversations\/([0-9a-f-]{36})$/i);
      if (conversationMatch) {
        if (request.method !== 'DELETE') return fail('Method not allowed.', 405, 'method_not_allowed');
        const result = await db.query(
          'DELETE FROM public.ai_coach_conversations WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id',
          [conversationMatch[1], auth.user.id],
        );
        return result.rowCount ? json({ ok: true }) : fail('Conversation not found.', 404, 'not_found');
      }

      const messagesMatch = url.pathname.match(/^\/api\/ai\/coach\/conversations\/([0-9a-f-]{36})\/messages$/i);
      if (messagesMatch) {
        if (request.method === 'GET') return json({ ok: true, messages: await listMessages(db, messagesMatch[1], auth.user.id) });
        if (request.method === 'POST') {
          const input = await readJson(request);
          return sendCoachMessage(db, env, auth, messagesMatch[1], input?.message);
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/ai/content' && request.method === 'POST') {
        return createContent(db, env, auth, await readJson(request));
      }

      return fail('AI route not found.', 404, 'not_found');
    });
  } catch (error) {
    console.error('One2OneLove AI API error', error);
    return fail(error?.message || 'Unable to process AI request.', error?.status || 500, error?.code || 'ai_error');
  }
}
