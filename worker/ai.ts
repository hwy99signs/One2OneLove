// @ts-nocheck
import { Client } from 'pg';
import { reserveTokenCharge, consumeTokenReservation, releaseTokenReservation, maybeAutoReplenish } from './o2ol-tokens';
import { recordOpenAICostEvent } from './o2ol-cost-ledger';
import { retrieveCoachingKnowledge, formatCoachingGrounding, O2OL_COACHING_KB_VERSION } from './coaching-knowledge';
import { requireCurrentCoachingConsent } from './consents';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request', extra = {}) {
  return json({ ok: false, error: { code, message, ...extra } }, status);
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
async function entitlement(db,userId,feature){
  const wallet=(await db.query(
    'SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',
    [userId],
  )).rows[0];
  const featureCode=feature==='content_creator'?'ai_content_generation':'amora_response';
  const price=(await db.query(
    `SELECT token_cost FROM public.o2ol_token_feature_prices
      WHERE feature_code=$1 AND active=true LIMIT 1`,
    [featureCode],
  )).rows[0];
  return {
    allowed:true,
    accessModel:'free_tokens',
    token_mode:true,
    featureCode,
    token_cost:Number(price?.token_cost||0),
    token_balance:Number(wallet?.balance||0),
    limit:null,
  };
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
  return { text, model: payload?.model || model, payload };
}
async function requireConversation(db, conversationId, userId) {
  if (!UUID.test(String(conversationId || ''))) throw Object.assign(new Error('Invalid conversation ID.'), { status: 400, code: 'bad_request' });
  const result = await db.query(
    "SELECT * FROM public.ai_coach_conversations WHERE id=$1::uuid AND user_id=$2::uuid AND product='o2ol' AND mode='amora'",
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
      WHERE c.user_id=$1::uuid AND c.product='o2ol' AND c.mode='amora'
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
const COACH_RESPONSE_LEVELS={
  short:{words:'50-100',maxOutputTokens:180},
  medium:{words:'150-250',maxOutputTokens:420},
  long:{words:'300-400',maxOutputTokens:650},
};
async function sendCoachMessage(db, env, auth, conversationId, input) {
  const conversation = await requireConversation(db, conversationId, auth.user.id);
  const text = cleanText(input?.message, 6000, true);
  const requestId = String(input?.requestId || crypto.randomUUID()).slice(0,120);
  const responseLength=['short','medium','long'].includes(String(input?.responseLength||'').toLowerCase())?String(input.responseLength).toLowerCase():'medium';
  const responseLevel=COACH_RESPONSE_LEVELS[responseLength];
  const billingFeatureCode=`amora_response_${responseLength}`;
  const reservation = await reserveTokenCharge(db,auth.user.id,billingFeatureCode,{
    idempotencyKey:`amora:${conversationId}:${requestId}`,
    metadata:{conversation_id:conversationId,request_id:requestId,response_length:responseLength},
  });

  const historyResult = await db.query(
    `SELECT role,content FROM public.ai_coach_messages
      WHERE conversation_id=$1::uuid AND user_id=$2::uuid
      ORDER BY created_at DESC LIMIT 12`,
    [conversationId, auth.user.id],
  );
  const history = historyResult.rows.reverse();
  const transcript = history.map(item => `${item.role === 'assistant' ? 'Amora' : 'Member'}: ${item.content}`).join('\n\n');
  const knowledge=retrieveCoachingKnowledge(text,history,4);
  const grounding=formatCoachingGrounding(knowledge);
  const prompt = `${transcript ? `${transcript}\n\n` : ''}Member: ${text}\n\nAmora:`;
  const instructions = `You are Amora, the warm One2OneLove relationship coach. Speak naturally and conversationally. The member selected a ${responseLength} response. Keep this reply within ${responseLevel.words} words. Stay focused, contextual, and useful; do not pad the answer just to reach the word range. Prefer clear conversational paragraphs over essays, reports, numbered analyses, or drawn-out explanations. Formal/deeper analysis belongs in the separate report feature. Give practical relationship guidance and reflection, not diagnosis or therapy. You may laugh naturally when something is genuinely funny, apologize when appropriate, show empathy without inventing feelings, and ask useful follow-up questions. Encourage respectful communication, consent and healthy boundaries. If there is abuse, danger, self-harm, coercion or an emergency, prioritize immediate safety and appropriate local professional help even if safety requires departing from the selected word range. Never shame, manipulate, pressure, or encourage surveillance. Keep answers useful and human rather than formulaic.\n\nO2OL COACHING KNOWLEDGE BASE (${O2OL_COACHING_KB_VERSION})\nUse the following as grounding. Do not quote it mechanically. Do not invent facts beyond the member's message/history. If safety guidance conflicts with ordinary coaching, safety guidance wins.\n${grounding}`;
  let generated=null;
  try{
    generated=await openAiText(env,{instructions,input:prompt,maxOutputTokens:responseLevel.maxOutputTokens});
  }catch(error){
    await releaseTokenReservation(db,reservation.id,'ai_provider_failed').catch(()=>{});
    throw error;
  }

  let userMessage=null,assistantMessage=null;
  try {
    await db.query('BEGIN');
    userMessage = await db.query(
      `INSERT INTO public.ai_coach_messages(conversation_id,user_id,role,content)
       VALUES($1::uuid,$2::uuid,'user',$3) RETURNING id,role,content,created_at`,
      [conversationId, auth.user.id, text],
    );
    assistantMessage = await db.query(
      `INSERT INTO public.ai_coach_messages(conversation_id,user_id,role,content,model)
       VALUES($1::uuid,$2::uuid,'assistant',$3,$4) RETURNING id,role,content,model,created_at`,
      [conversationId, auth.user.id, generated.text, generated.model],
    );
    await db.query(
      `INSERT INTO public.ai_usage_events(user_id,feature) VALUES($1::uuid,'relationship_coach')`,
      [auth.user.id],
    );
    const nextTitle = ['Coaching Session','Chat with Amora'].includes(conversation.title) ? text.slice(0,72) : conversation.title;
    await db.query('UPDATE public.ai_coach_conversations SET title=$1,updated_at=now() WHERE id=$2::uuid',[nextTitle,conversationId]);
    await db.query('COMMIT');
  } catch (error) {
    try{await db.query('ROLLBACK');}catch(_){}
    await releaseTokenReservation(db,reservation.id,'message_persistence_failed').catch(()=>{});
    await recordOpenAICostEvent(db,env,{
      userId:auth.user.id,featureCode:billingFeatureCode,payload:generated.payload,model:generated.model,
      inputText:text,outputText:generated.text,contextText:instructions+'\n\n'+prompt,
      customerTokensCharged:0,metadata:{conversation_id:conversationId,request_id:requestId,response_length:responseLength,delivery_failed:true},
    }).catch(()=>{});
    throw error;
  }

  await consumeTokenReservation(db,reservation.id);
  await recordOpenAICostEvent(db,env,{
    userId:auth.user.id,featureCode:billingFeatureCode,payload:generated.payload,model:generated.model,
    inputText:text,outputText:generated.text,contextText:instructions+'\n\n'+prompt,
    walletTransactionId:reservation.transaction?.id||reservation.transaction_id||null,
    customerTokensCharged:Number(reservation.tokens||0),
    metadata:{conversation_id:conversationId,request_id:requestId,response_length:responseLength,history_messages:history.length,kb_version:O2OL_COACHING_KB_VERSION,kb_ids:knowledge.map(x=>x.id)},
  }).catch(error=>console.error('Amora cost telemetry failed',error));
  maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('Amora Auto-Replenish check failed',error));

  return json({
    ok:true,
    userMessage:{...userMessage.rows[0],text:userMessage.rows[0].content,is_user:true},
    message:{...assistantMessage.rows[0],text:assistantMessage.rows[0].content,is_user:false},
    tokens:{charged:Number(reservation.tokens||0),balance:Number(reservation.balance_after??0),responseLength},
  });
}
async function createContent(db, env, auth, input) {
  const contentType = cleanText(input?.contentType, 100, true);
  const tone = cleanText(input?.tone, 100, true);
  const length = cleanText(input?.length || 'medium', 30, true);
  const details = cleanText(input?.details, 5000, false);
  const partnerName = cleanText(input?.partnerName, 200, false);
  const language = cleanText(input?.language || 'en', 20, true);
  const requestId = String(input?.requestId || crypto.randomUUID()).slice(0,120);
  const isLoveNote = input?.purpose === 'love_note' && String(contentType).toLowerCase() === 'lovenote';
  const billingFeatureCode = isLoveNote ? 'love_note_ai' : 'ai_content_generation';
  const reservation = await reserveTokenCharge(db,auth.user.id,billingFeatureCode,{
    idempotencyKey:`ai_content:${auth.user.id}:${requestId}`,
    metadata:{request_id:requestId,content_type:contentType,purpose:isLoveNote?'love_note':'general'},
  });

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
  let generated=null;
  try{
    generated=await openAiText(env,{instructions,input:prompt,maxOutputTokens:1000});
  }catch(error){
    await releaseTokenReservation(db,reservation.id,'ai_provider_failed').catch(()=>{});
    throw error;
  }

  try{
    await db.query(`INSERT INTO public.ai_usage_events(user_id,feature) VALUES($1::uuid,'content_creator')`,[auth.user.id]);
    await consumeTokenReservation(db,reservation.id);
    await recordOpenAICostEvent(db,env,{
      userId:auth.user.id,
      featureCode:billingFeatureCode,
      payload:generated.payload,
      model:generated.model,
      inputText:details||'',
      outputText:generated.text,
      contextText:instructions+'\n\n'+prompt,
      walletTransactionId:reservation.transaction?.id||reservation.transaction_id||null,
      customerTokensCharged:Number(reservation.tokens||0),
      metadata:{request_id:requestId,content_type:contentType,tone,length,language},
    }).catch(error=>console.error('AI content cost telemetry failed',error));
    maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('AI content Auto-Replenish check failed',error));
    return json({
      ok:true,
      content:generated.text,
      model:generated.model,
      tokens:{charged:Number(reservation.tokens||0),balance:Number(reservation.balance_after??0)},
    });
  }catch(error){
    await releaseTokenReservation(db,reservation.id,'content_persistence_failed').catch(()=>{});
    await recordOpenAICostEvent(db,env,{
      userId:auth.user.id,featureCode:billingFeatureCode,payload:generated.payload,model:generated.model,
      inputText:details||'',outputText:generated.text,contextText:instructions+'\n\n'+prompt,
      customerTokensCharged:0,metadata:{request_id:requestId,content_type:contentType,delivery_failed:true},
    }).catch(()=>{});
    throw error;
  }
}

export async function handleAiRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/ai')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async db => {
      if (url.pathname.startsWith('/api/ai/coach')) await requireCurrentCoachingConsent(db,auth.user.id);
      if (url.pathname === '/api/ai/config' && request.method === 'GET') {
        const wallet=(await db.query('SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',[auth.user.id])).rows[0];
        const coach={allowed:true,token_mode:true,token_balance:Number(wallet?.balance||0)};
        const creator = await entitlement(db, auth.user.id, 'content_creator');
        return json({ ok: true, configured: Boolean(env.OPENAI_API_KEY), model: env.OPENAI_MODEL || 'gpt-5-mini', coach, creator });
      }

      if (url.pathname === '/api/ai/coach/conversations') {
        if (request.method === 'GET') return json({ ok: true, conversations: await listConversations(db, auth.user.id) });
        if (request.method === 'POST') {
          const result = await db.query(
            `INSERT INTO public.ai_coach_conversations(user_id,title,product,mode) VALUES($1::uuid,'Chat with Amora','o2ol','amora')
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
          "DELETE FROM public.ai_coach_conversations WHERE id=$1::uuid AND user_id=$2::uuid AND product='o2ol' AND mode='amora' RETURNING id",
          [conversationMatch[1], auth.user.id],
        );
        return result.rowCount ? json({ ok: true }) : fail('Conversation not found.', 404, 'not_found');
      }

      const messagesMatch = url.pathname.match(/^\/api\/ai\/coach\/conversations\/([0-9a-f-]{36})\/messages$/i);
      if (messagesMatch) {
        if (request.method === 'GET') return json({ ok: true, messages: await listMessages(db, messagesMatch[1], auth.user.id) });
        if (request.method === 'POST') {
          const input = await readJson(request);
          return sendCoachMessage(db, env, auth, messagesMatch[1], input);
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
    return fail(error?.message || 'Unable to process AI request.', error?.status || 500, error?.code || 'ai_error',{balance:error?.balance,required:error?.required,featureCode:error?.featureCode,featureLabel:error?.featureLabel,consentVersion:error?.consentVersion});
  }
}
