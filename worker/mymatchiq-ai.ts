// @ts-nocheck
import { Client } from 'pg';
import { reserveTokenCharge, consumeTokenReservation, releaseTokenReservation, maybeAutoReplenish } from './o2ol-tokens';
import { recordOpenAICostEvent } from './o2ol-cost-ledger';

const HEADERS={ 'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff' };
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LANGUAGE_NAMES={en:'English',es:'Spanish',fr:'French',it:'Italian',de:'German'};
const DIMENSIONS=['values and priorities','communication','conflict','emotional needs','expectations','commitment','lifestyle','finances','intimacy','family','boundaries','stress','time','life planning','safety red flags'];
const STOP=new Set(['the','and','that','this','with','from','have','just','really','very','what','when','where','would','could','should','about','your','youre','you','are','was','were','for','but','not','too','then','than','into','like','they','them','their','because','been','being','our','out','all','can','cant','dont','didnt','im','ive','its']);

function json(data,status=200){ return new Response(JSON.stringify(data),{status,headers:HEADERS}); }
function fail(message,status=400,code='bad_request',extra={}){ return json({ok:false,error:{code,message,...extra}},status); }
function clean(value,max=6000,required=false){ const text=String(value??'').trim(); if(required&&!text) throw new Error('Required value is missing.'); if(text.length>max) throw new Error('Value is too long.'); return text; }
async function readJson(request){ if(!(request.headers.get('content-type')||'').includes('application/json')) throw new Error('Expected application/json body.'); return request.json(); }
async function session(request,env){ const cookie=request.headers.get('cookie'); if(!cookie)return null; const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}}); if(!response.ok)return null; const payload=await response.json().catch(()=>null); const user=payload?.user??payload?.data?.user??null; const active=payload?.session??payload?.data?.session??null; return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null; }
async function withDb(env,fn){ const db=new Client({connectionString:env.HYPERDRIVE.connectionString}); await db.connect(); try{return await fn(db);}finally{await db.end();} }
function outputText(payload){ if(typeof payload?.output_text==='string'&&payload.output_text.trim())return payload.output_text.trim(); const pieces=[]; for(const item of payload?.output||[])for(const c of item?.content||[])if((c?.type==='output_text'||c?.type==='text')&&c?.text)pieces.push(c.text); return pieces.join('\n').trim(); }
async function openAiText(env,{instructions,input,maxOutputTokens=1000}){
  if(!env.OPENAI_API_KEY)throw Object.assign(new Error('Bianca AI is not configured yet.'),{status:503,code:'ai_not_configured'});
  const model=env.OPENAI_MODEL||'gpt-5-mini';
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},
    body:JSON.stringify({model,instructions,input,max_output_tokens:maxOutputTokens,store:false}),
  });
  const payload=await response.json().catch(()=>null);
  if(!response.ok)throw Object.assign(new Error(payload?.error?.message||'AI provider request failed.'),{status:502,code:'ai_provider_error'});
  const text=outputText(payload);
  if(!text)throw Object.assign(new Error('AI provider returned no text.'),{status:502,code:'empty_ai_response'});
  return {text,model:payload?.model||model,payload};
}
function contextDepth(interactions,conversations){ return Math.min(95,Math.max(10,18+Math.min(60,Number(interactions||0)*3)+Math.min(17,Number(conversations||0)*3))); }
function learnPhrases(text,current={}){ const counts={...(current||{})}; const words=(String(text||'').toLowerCase().match(/[\p{L}\p{N}'’-]+/gu)||[]).map(w=>w.replace(/^['’-]+|['’-]+$/g,'')).filter(w=>w.length>1); for(let n=2;n<=3;n++){ for(let i=0;i<=words.length-n;i++){ const slice=words.slice(i,i+n); if(slice.every(w=>STOP.has(w))||slice.some(w=>w.includes('@')||w.includes('http')))continue; const phrase=slice.join(' '); if(phrase.length<6||phrase.length>54)continue; counts[phrase]=(Number(counts[phrase])||0)+1; } } const trimmed=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,80); const compact=Object.fromEntries(trimmed); const common=trimmed.filter(([,count])=>count>=2).slice(0,8).map(([phrase])=>phrase); return {counts:compact,common}; }
async function profile(db,userId){ const r=await db.query('SELECT * FROM public.mmiq_bianca_profiles WHERE user_id=$1::uuid',[userId]); return r.rows[0]||{user_id:userId,interaction_count:0,conversation_count:0,phrase_counts:{},common_phrases:[],style_summary:null,context_depth_score:10}; }
async function resetProfile(db,userId){ const r=await db.query(`INSERT INTO public.mmiq_bianca_profiles(user_id,phrase_counts,common_phrases,style_summary,context_depth_score,updated_at) VALUES($1::uuid,'{}'::jsonb,'[]'::jsonb,NULL,10,now()) ON CONFLICT(user_id) DO UPDATE SET phrase_counts='{}'::jsonb,common_phrases='[]'::jsonb,style_summary=NULL,context_depth_score=GREATEST(10,LEAST(95,18+LEAST(60,public.mmiq_bianca_profiles.interaction_count*3)+LEAST(17,public.mmiq_bianca_profiles.conversation_count*3))),updated_at=now() RETURNING *`,[userId]); return r.rows[0]; }
async function requireConversation(db,id,userId){ if(!UUID.test(String(id||'')))throw Object.assign(new Error('Invalid conversation ID.'),{status:400,code:'bad_request'}); const r=await db.query(`SELECT * FROM public.ai_coach_conversations WHERE id=$1::uuid AND user_id=$2::uuid AND product='mymatchiq' AND mode='bianca_casual'`,[id,userId]); if(!r.rows[0])throw Object.assign(new Error('Bianca conversation not found.'),{status:404,code:'not_found'}); return r.rows[0]; }
async function listConversations(db,userId){ const r=await db.query(`SELECT c.id,c.title,c.created_at,c.updated_at,(SELECT content FROM public.ai_coach_messages m WHERE m.conversation_id=c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message FROM public.ai_coach_conversations c WHERE c.user_id=$1::uuid AND c.product='mymatchiq' AND c.mode='bianca_casual' ORDER BY c.updated_at DESC,c.created_at DESC`,[userId]); return r.rows; }
async function listMessages(db,id,userId){ await requireConversation(db,id,userId); const r=await db.query(`SELECT id,role,content,model,created_at FROM public.ai_coach_messages WHERE conversation_id=$1::uuid AND user_id=$2::uuid ORDER BY created_at ASC,id ASC`,[id,userId]); return r.rows.map(row=>({...row,text:row.content,is_user:row.role==='user'})); }
const RESPONSE_LEVELS={
  short:{words:'50-100',maxOutputTokens:180},
  medium:{words:'150-250',maxOutputTokens:420},
  long:{words:'300-400',maxOutputTokens:650},
};
function instructions(name,phrases,language,responseLength='medium'){ const lang=LANGUAGE_NAMES[language]||'English'; const level=RESPONSE_LEVELS[responseLength]||RESPONSE_LEVELS.medium; return `You are Bianca, the friendly MyMatchIQ relationship guide for ${name||'this member'}. Speak naturally in ${lang}. You are warm, perceptive, conversational and grounded—not clinical. The member selected a ${responseLength} response. Keep this reply within ${level.words} words. Stay focused, contextual, and useful; do not pad the answer just to reach the word range. Prefer clear conversational paragraphs over essays, reports, numbered analyses, or drawn-out explanations. Formal/deeper analysis belongs in the separate report feature. You may laugh naturally when something is genuinely funny, apologize when appropriate, acknowledge uncertainty, and empathize without pretending to know feelings the member has not expressed. Ask useful follow-up questions and offer practical relationship coaching and self-reflection, but do not diagnose, provide therapy, or guarantee compatibility. Never manipulate, shame, pressure, or encourage surveillance. When there is abuse, coercion, self-harm, immediate danger, or an emergency, prioritize immediate safety and appropriate local professional help even if safety requires departing from the selected word range. The member commonly uses these phrases: ${phrases?.length?phrases.join(' | '):'none learned yet'}. Reuse at most one familiar phrase occasionally when it genuinely fits; never mimic excessively and never tell the member you are tracking their wording. More conversation history may improve personalization, but never claim certainty beyond the evidence.`; }
async function sendMessage(db,env,auth,id,input){
  const conversation=await requireConversation(db,id,auth.user.id);
  const message=clean(input?.message,6000,true);
  const language=LANGUAGE_NAMES[input?.language]?input.language:'en';
  const requestId=String(input?.requestId||crypto.randomUUID()).slice(0,120);
  const responseLength=['short','medium','long'].includes(String(input?.responseLength||'').toLowerCase())?String(input.responseLength).toLowerCase():'medium';
  const billingFeatureCode=`bianca_response_${responseLength}`;
  const responseLevel=RESPONSE_LEVELS[responseLength];
  const reservation=await reserveTokenCharge(db,auth.user.id,billingFeatureCode,{
    idempotencyKey:`bianca:${id}:${requestId}`,
    metadata:{conversation_id:id,request_id:requestId,response_length:responseLength},
  });
  const p=await profile(db,auth.user.id);
  const history=(await db.query(
    `SELECT role,content FROM public.ai_coach_messages
      WHERE conversation_id=$1::uuid AND user_id=$2::uuid
      ORDER BY created_at DESC LIMIT 18`,
    [id,auth.user.id],
  )).rows.reverse();
  const member=(await db.query('SELECT name FROM public.users WHERE id=$1::uuid',[auth.user.id])).rows[0];
  const transcript=history.map(x=>`${x.role==='assistant'?'Bianca':'Member'}: ${x.content}`).join('\n\n');
  const instructionText=instructions(member?.name,p.common_phrases,language,responseLength);
  const aiInput=`${transcript?transcript+'\n\n':''}Member: ${message}\n\nBianca:`;
  let generated=null;
  try{
    generated=await openAiText(env,{instructions:instructionText,input:aiInput,maxOutputTokens:responseLevel.maxOutputTokens});
  }catch(error){
    await releaseTokenReservation(db,reservation.id,'ai_provider_failed').catch(()=>{});
    throw error;
  }

  const learned=learnPhrases(message,p.phrase_counts);
  const nextInteractions=Number(p.interaction_count||0)+1;
  const score=contextDepth(nextInteractions,p.conversation_count||1);
  let userMsg=null,assistant=null;
  try{
    await db.query('BEGIN');
    userMsg=(await db.query(
      `INSERT INTO public.ai_coach_messages(conversation_id,user_id,role,content)
       VALUES($1::uuid,$2::uuid,'user',$3) RETURNING id,role,content,created_at`,
      [id,auth.user.id,message],
    )).rows[0];
    assistant=(await db.query(
      `INSERT INTO public.ai_coach_messages(conversation_id,user_id,role,content,model)
       VALUES($1::uuid,$2::uuid,'assistant',$3,$4) RETURNING id,role,content,model,created_at`,
      [id,auth.user.id,generated.text,generated.model],
    )).rows[0];
    await db.query(
      `INSERT INTO public.mmiq_bianca_profiles
       (user_id,interaction_count,conversation_count,phrase_counts,common_phrases,context_depth_score,last_interaction_at,updated_at)
       VALUES($1::uuid,1,0,$2::jsonb,$3::jsonb,$4,now(),now())
       ON CONFLICT(user_id) DO UPDATE SET
         interaction_count=public.mmiq_bianca_profiles.interaction_count+1,
         phrase_counts=$2::jsonb,common_phrases=$3::jsonb,context_depth_score=$4,last_interaction_at=now(),updated_at=now()`,
      [auth.user.id,JSON.stringify(learned.counts),JSON.stringify(learned.common),score],
    );
    const nextTitle=conversation.title==='Casual Talk with Bianca'?message.slice(0,72):conversation.title;
    await db.query('UPDATE public.ai_coach_conversations SET title=$1,updated_at=now() WHERE id=$2::uuid',[nextTitle,id]);
    await db.query('COMMIT');
  }catch(error){
    try{await db.query('ROLLBACK');}catch(_){}
    await releaseTokenReservation(db,reservation.id,'message_persistence_failed').catch(()=>{});
    await recordOpenAICostEvent(db,env,{
      userId:auth.user.id,featureCode:billingFeatureCode,payload:generated.payload,model:generated.model,
      inputText:message,outputText:generated.text,contextText:instructionText+'\n\n'+aiInput,
      customerTokensCharged:0,metadata:{conversation_id:id,request_id:requestId,response_length:responseLength,delivery_failed:true},
    }).catch(()=>{});
    throw error;
  }

  await consumeTokenReservation(db,reservation.id);
  await recordOpenAICostEvent(db,env,{
    userId:auth.user.id,featureCode:billingFeatureCode,payload:generated.payload,model:generated.model,
    inputText:message,outputText:generated.text,contextText:instructionText+'\n\n'+aiInput,
    walletTransactionId:reservation.transaction?.id||reservation.transaction_id||null,
    customerTokensCharged:Number(reservation.tokens||0),
    metadata:{conversation_id:id,request_id:requestId,response_length:responseLength,history_messages:history.length},
  }).catch(error=>console.error('Bianca cost telemetry failed',error));
  maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('Bianca Auto-Replenish check failed',error));

  return json({
    ok:true,
    userMessage:{...userMsg,text:userMsg.content,is_user:true},
    message:{...assistant,text:assistant.content,is_user:false},
    profile:{interaction_count:nextInteractions,conversation_count:p.conversation_count||1,common_phrases:learned.common,context_depth_score:score},
    tokens:{charged:Number(reservation.tokens||0),balance:Number(reservation.balance_after??0),responseLength},
  });
}
function parseReport(text){ const cleaned=String(text||'').replace(/^\s*```(?:json)?/i,'').replace(/```\s*$/,'').trim(); try{return JSON.parse(cleaned);}catch{return {summary:cleaned,strengths:[],growthAreas:[],dimensions:{}};} }
async function latestReport(db,userId){ const r=await db.query('SELECT * FROM public.mmiq_personality_reports WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 1',[userId]); return r.rows[0]||null; }
async function listReports(db,userId){ const r=await db.query('SELECT * FROM public.mmiq_personality_reports WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 12',[userId]); return r.rows; }
function assessmentPayload(input){
  const answers=Array.isArray(input?.answers)?input.answers.slice(0,225):[];
  const dimensionScores=input?.dimensionScores&&typeof input.dimensionScores==='object'&&!Array.isArray(input.dimensionScores)?input.dimensionScores:{};
  const questionCount=Math.max(0,Math.min(225,Number(input?.questionCount||answers.length)||0));
  const encoded=JSON.stringify({answers,dimensionScores});
  if(encoded.length>180000)throw Object.assign(new Error('Assessment payload is too large.'),{status:413,code:'payload_too_large'});
  return {answers,dimensionScores,questionCount};
}
async function latestAssessment(db,userId){ const r=await db.query(`SELECT * FROM public.mmiq_assessment_sessions WHERE user_id=$1::uuid ORDER BY updated_at DESC LIMIT 1`,[userId]); return r.rows[0]||null; }
async function accessEntitlement(db,userId){
  const [walletResult,legacyResult]=await Promise.all([
    db.query('SELECT balance FROM public.o2ol_token_wallets WHERE user_id=$1::uuid',[userId]),
    db.query(`SELECT tier,source,grandfathered,effective_at,expires_at
                FROM public.mmiq_access_entitlements
               WHERE user_id=$1::uuid AND (expires_at IS NULL OR expires_at>now())
               LIMIT 1`,[userId]).catch(()=>({rows:[]})),
  ]);
  const wallet=walletResult.rows[0];
  const legacy=legacyResult.rows[0]||null;
  return {
    access_model:'free_tokens',
    verified_member:true,
    tier:'Free',
    source:'o2ol_token_model',
    assessment_question_count:225,
    assessment_dimension_count:15,
    token_mode:true,
    token_balance:Number(wallet?.balance||0),
    legacy_entitlement:legacy,
  };
}
async function createAssessment(db,userId,input){ const language=LANGUAGE_NAMES[input?.language]?input.language:'en'; const r=await db.query(`INSERT INTO public.mmiq_assessment_sessions(user_id,language,status,question_count,answers,dimension_scores) VALUES($1::uuid,$2,'in_progress',0,'[]'::jsonb,'{}'::jsonb) RETURNING *`,[userId,language]); return r.rows[0]; }
async function saveAssessment(db,userId,id,input,complete=false){ if(!UUID.test(String(id||'')))throw Object.assign(new Error('Invalid assessment session ID.'),{status:400,code:'bad_request'}); const data=assessmentPayload(input); const r=await db.query(`UPDATE public.mmiq_assessment_sessions SET answers=$1::jsonb,dimension_scores=$2::jsonb,question_count=$3,status=$4,completed_at=CASE WHEN $4='completed' THEN COALESCE(completed_at,now()) ELSE completed_at END,updated_at=now() WHERE id=$5::uuid AND user_id=$6::uuid RETURNING *`,[JSON.stringify(data.answers),JSON.stringify(data.dimensionScores),data.questionCount,complete?'completed':'in_progress',id,userId]); if(!r.rows[0])throw Object.assign(new Error('Assessment session not found.'),{status:404,code:'not_found'}); return r.rows[0]; }
async function generateReport(db,env,auth,input){
  const language=LANGUAGE_NAMES[input?.language]?input.language:'en';
  const requestId=String(input?.requestId||crypto.randomUUID()).slice(0,120);
  const p=await profile(db,auth.user.id);
  const messages=(await db.query(
    `SELECT m.content,m.created_at FROM public.ai_coach_messages m
      JOIN public.ai_coach_conversations c ON c.id=m.conversation_id
      WHERE m.user_id=$1::uuid AND m.role='user'
        AND c.product='mymatchiq' AND c.mode='bianca_casual'
      ORDER BY m.created_at DESC LIMIT 80`,
    [auth.user.id],
  )).rows.reverse();
  const assessment=(await db.query(
    `SELECT id,answers,dimension_scores,question_count FROM public.mmiq_assessment_sessions
      WHERE user_id=$1::uuid AND status='completed'
      ORDER BY completed_at DESC NULLS LAST,updated_at DESC LIMIT 1`,
    [auth.user.id],
  )).rows[0]||null;
  if(!messages.length&&!assessment)return fail('More MyMatchIQ context is needed before Bianca can create a report.',400,'insufficient_context');

  const reservation=await reserveTokenCharge(db,auth.user.id,'bianca_report',{
    idempotencyKey:`bianca_report:${auth.user.id}:${requestId}`,
    metadata:{request_id:requestId},
  });
  const evidenceCount=messages.length+Number(assessment?.question_count||0);
  const prompt=`Create a private Personality & Relationship Pattern Report in ${LANGUAGE_NAMES[language]||'English'}. Use only the evidence supplied. Do not diagnose or predict outcomes. Cover these dimensions where evidence exists: ${DIMENSIONS.join(', ')}. Return JSON only with keys: summary (string), strengths (array of 3-6 strings), growthAreas (array of 3-6 strings), dimensions (object whose keys are dimension names and values are concise evidence-grounded observations).\n\nAssessment: ${assessment?JSON.stringify({answers:assessment.answers,scores:assessment.dimension_scores}):'none'}\n\nBianca conversation excerpts:\n${messages.map((m,i)=>`${i+1}. ${m.content}`).join('\n')}`;
  const instructionText='You create cautious, evidence-grounded MyMatchIQ self-reflection reports. Avoid diagnosis, clinical labels, deterministic compatibility claims, and invented facts. Return valid JSON only.';
  let generated=null;
  try{
    generated=await openAiText(env,{instructions:instructionText,input:prompt,maxOutputTokens:1800});
  }catch(error){
    await releaseTokenReservation(db,reservation.id,'ai_provider_failed').catch(()=>{});
    throw error;
  }

  try{
    const parsed=parseReport(generated.text);
    const stored=(await db.query(
      `INSERT INTO public.mmiq_personality_reports
       (user_id,assessment_session_id,language,summary,strengths,growth_areas,dimensions,evidence_count,context_depth_score)
       VALUES($1::uuid,$2::uuid,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9) RETURNING *`,
      [
        auth.user.id,assessment?.id||null,language,clean(parsed.summary,12000,true),
        JSON.stringify(Array.isArray(parsed.strengths)?parsed.strengths:[]),
        JSON.stringify(Array.isArray(parsed.growthAreas)?parsed.growthAreas:[]),
        JSON.stringify(parsed.dimensions&&typeof parsed.dimensions==='object'?parsed.dimensions:{}),
        evidenceCount,p.context_depth_score||contextDepth(p.interaction_count,p.conversation_count),
      ],
    )).rows[0];
    await consumeTokenReservation(db,reservation.id);
    await recordOpenAICostEvent(db,env,{
      userId:auth.user.id,featureCode:'bianca_report',payload:generated.payload,model:generated.model,
      inputText:prompt,outputText:generated.text,contextText:instructionText+'\n\n'+prompt,
      walletTransactionId:reservation.transaction?.id||reservation.transaction_id||null,
      customerTokensCharged:Number(reservation.tokens||0),
      metadata:{request_id:requestId,evidence_count:evidenceCount},
    }).catch(error=>console.error('Bianca report cost telemetry failed',error));
    maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('Bianca report Auto-Replenish check failed',error));
    return json({ok:true,report:stored,tokens:{charged:Number(reservation.tokens||0),balance:Number(reservation.balance_after??0)}});
  }catch(error){
    await releaseTokenReservation(db,reservation.id,'report_persistence_failed').catch(()=>{});
    await recordOpenAICostEvent(db,env,{
      userId:auth.user.id,featureCode:'bianca_report',payload:generated.payload,model:generated.model,
      inputText:prompt,outputText:generated.text,contextText:instructionText+'\n\n'+prompt,
      customerTokensCharged:0,metadata:{request_id:requestId,evidence_count:evidenceCount,delivery_failed:true},
    }).catch(()=>{});
    throw error;
  }
}

export async function handleMyMatchIQAiRequest(request,env,url){
  if(!url.pathname.startsWith('/api/mymatchiq/'))return null;
  const auth=await session(request,env); if(!auth)return fail('Verified MyMatchIQ sign-in is required.',401,'unauthorized');
  try{
    return await withDb(env,async db=>{
      if(url.pathname==='/api/mymatchiq/access'&&request.method==='GET')return json({ok:true,access:await accessEntitlement(db,auth.user.id)});
      if(url.pathname==='/api/mymatchiq/assessment/sessions/latest'&&request.method==='GET')return json({ok:true,session:await latestAssessment(db,auth.user.id)});
      if(url.pathname==='/api/mymatchiq/assessment/sessions'){
        if(request.method==='POST'){
          return json({ok:true,session:await createAssessment(db,auth.user.id,await readJson(request))},201);
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      const assessmentComplete=url.pathname.match(/^\/api\/mymatchiq\/assessment\/sessions\/([0-9a-f-]{36})\/complete$/i);
      if(assessmentComplete){
        if(request.method!=='POST')return fail('Method not allowed.',405,'method_not_allowed');
        return json({ok:true,session:await saveAssessment(db,auth.user.id,assessmentComplete[1],await readJson(request),true)});
      }
      const assessmentOne=url.pathname.match(/^\/api\/mymatchiq\/assessment\/sessions\/([0-9a-f-]{36})$/i);
      if(assessmentOne){
        if(request.method!=='PATCH')return fail('Method not allowed.',405,'method_not_allowed');
        return json({ok:true,session:await saveAssessment(db,auth.user.id,assessmentOne[1],await readJson(request),false)});
      }
      if(url.pathname==='/api/mymatchiq/bianca/profile'&&request.method==='GET')return json({ok:true,profile:await profile(db,auth.user.id)});
      if(url.pathname==='/api/mymatchiq/bianca/reports'&&request.method==='GET')return json({ok:true,reports:await listReports(db,auth.user.id)});
      if(url.pathname==='/api/mymatchiq/bianca/profile/reset'&&request.method==='POST')return json({ok:true,profile:await resetProfile(db,auth.user.id)});
      if(url.pathname==='/api/mymatchiq/bianca/report'){
        if(request.method==='GET')return json({ok:true,report:await latestReport(db,auth.user.id)});
        if(request.method==='POST'){
          return generateReport(db,env,auth,await readJson(request));
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      if(url.pathname==='/api/mymatchiq/bianca/conversations'){
        if(request.method==='GET')return json({ok:true,conversations:await listConversations(db,auth.user.id)});
        if(request.method==='POST'){
          const r=await db.query(`INSERT INTO public.ai_coach_conversations(user_id,title,product,mode) VALUES($1::uuid,'Casual Talk with Bianca','mymatchiq','bianca_casual') RETURNING id,title,created_at,updated_at`,[auth.user.id]);
          await db.query(`INSERT INTO public.mmiq_bianca_profiles(user_id,conversation_count,context_depth_score,updated_at) VALUES($1::uuid,1,21,now()) ON CONFLICT(user_id) DO UPDATE SET conversation_count=public.mmiq_bianca_profiles.conversation_count+1,context_depth_score=LEAST(95,public.mmiq_bianca_profiles.context_depth_score+3),updated_at=now()`,[auth.user.id]);
          return json({ok:true,conversation:r.rows[0]},201);
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      const one=url.pathname.match(/^\/api\/mymatchiq\/bianca\/conversations\/([0-9a-f-]{36})$/i);
      if(one){ if(request.method!=='DELETE')return fail('Method not allowed.',405,'method_not_allowed'); const r=await db.query(`DELETE FROM public.ai_coach_conversations WHERE id=$1::uuid AND user_id=$2::uuid AND product='mymatchiq' AND mode='bianca_casual' RETURNING id`,[one[1],auth.user.id]); if(!r.rowCount)return fail('Conversation not found.',404,'not_found'); await db.query(`UPDATE public.mmiq_bianca_profiles SET conversation_count=GREATEST(0,conversation_count-1),updated_at=now() WHERE user_id=$1::uuid`,[auth.user.id]); return json({ok:true}); }
      const messages=url.pathname.match(/^\/api\/mymatchiq\/bianca\/conversations\/([0-9a-f-]{36})\/messages$/i);
      if(messages){
        if(request.method==='GET')return json({ok:true,messages:await listMessages(db,messages[1],auth.user.id)});
        if(request.method==='POST'){
          return sendMessage(db,env,auth,messages[1],await readJson(request));
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      return fail('Bianca route not found.',404,'not_found');
    });
  }catch(error){ console.error('MyMatchIQ Bianca API error',error); return fail(error?.message||'Unable to process Bianca request.',error?.status||500,error?.code||'bianca_error',{balance:error?.balance,required:error?.required,featureCode:error?.featureCode,featureLabel:error?.featureLabel}); }
}
