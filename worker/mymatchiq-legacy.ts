// @ts-nocheck
import { Client } from 'pg';

const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request'){return json({ok:false,error:{code,message}},status);}
async function session(request,env){const cookie=request.headers.get('cookie');if(!cookie)return null;const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});if(!response.ok)return null;const payload=await response.json().catch(()=>null);const user=payload?.user??payload?.data?.user??null;const active=payload?.session??payload?.data?.session??null;return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null;}
async function withDb(env,fn){const db=new Client({connectionString:env.HYPERDRIVE.connectionString});await db.connect();try{return await fn(db);}finally{await db.end();}}
function tier(value){const v=String(value||'free').toLowerCase();return ['free','premier','elite'].includes(v)?v:'free';}
function language(value){const v=String(value||'en').toLowerCase();return ['en','es','fr','it','de'].includes(v)?v:'en';}
function transformAnswers(passport){
  const rows=Array.isArray(passport?.answers)?passport.answers:[];
  return rows.slice(0,225).map((a,index)=>({
    questionId:`legacy:${String(a?.question_id||index+1)}`,
    dimension:'legacy',
    facet:'legacy',
    choiceIndex:null,
    score:null,
    legacyAnswer:a?.answer_value??null,
    answeredAt:a?.answered_at||null,
  }));
}
async function migrationRow(db,email){
  return (await db.query(`SELECT * FROM public.mmiq_legacy_migration_queue WHERE normalized_email=lower($1) ORDER BY created_at DESC LIMIT 1`,[email])).rows[0]||null;
}
async function claim(db,auth,row){
  if(!row)return {eligible:false,claimed:false};
  if(row.claim_status==='claimed'){
    return {eligible:true,claimed:true,alreadyClaimed:true,sourceTier:row.source_tier,sourceLocale:row.source_locale};
  }
  if(row.claim_status!=='pending')throw Object.assign(new Error('Legacy MyMatchIQ record requires manual review.'),{status:409,code:'migration_review_required'});
  await db.query('BEGIN');
  try{
    const locked=(await db.query(`SELECT * FROM public.mmiq_legacy_migration_queue WHERE source_user_id=$1::uuid FOR UPDATE`,[row.source_user_id])).rows[0];
    if(!locked||locked.claim_status!=='pending')throw Object.assign(new Error('Legacy record is no longer claimable.'),{status:409,code:'migration_not_claimable'});
    if(String(locked.normalized_email).toLowerCase()!==String(auth.user.email||'').toLowerCase())throw Object.assign(new Error('Verified email does not match legacy MyMatchIQ record.'),{status:403,code:'email_mismatch'});

    const sourceTier=tier(locked.source_tier);
    await db.query(`INSERT INTO public.mmiq_access_entitlements(user_id,tier,source,grandfathered,effective_at,updated_at)
      VALUES($1::uuid,$2,'legacy_mymatchiq',true,now(),now())
      ON CONFLICT(user_id) DO UPDATE SET tier=$2,source='legacy_mymatchiq',grandfathered=true,effective_at=now(),updated_at=now()`,[auth.user.id,sourceTier]);

    const passports=Array.isArray(locked.passport_payload)?locked.passport_payload:[];
    let imported=0;
    for(const passport of passports){
      const answers=transformAnswers(passport);
      const completed=String(passport?.status||'').toLowerCase()==='complete';
      const version='legacy:'+String(passport?.assessment_version||'unknown').slice(0,100);
      await db.query(`INSERT INTO public.mmiq_assessment_sessions(user_id,assessment_version,language,status,question_count,answers,dimension_scores,started_at,completed_at,updated_at)
        VALUES($1::uuid,$2,$3,$4,$5,$6::jsonb,'{}'::jsonb,COALESCE($7::timestamptz,now()),$8::timestamptz,now())`,
        [auth.user.id,version,language(locked.source_locale),completed?'completed':'abandoned',answers.length,JSON.stringify(answers),passport?.created_at||null,completed?(passport?.completed_at||passport?.created_at||null):null]);
      imported++;
    }

    await db.query(`UPDATE public.mmiq_legacy_migration_queue SET claim_status='claimed',claimed_o2ol_user_id=$1::uuid,claimed_at=now(),updated_at=now() WHERE source_user_id=$2::uuid`,[auth.user.id,locked.source_user_id]);
    await db.query(`INSERT INTO public.mmiq_legacy_import_audit(source_user_id,o2ol_user_id,action,details)
      VALUES($1::uuid,$2::uuid,'claim', $3::jsonb)`,[locked.source_user_id,auth.user.id,JSON.stringify({
        sourceTier,
        sourceLocale:locked.source_locale,
        importedPassports:imported,
        compatibilityPayloadPreserved:Array.isArray(locked.compatibility_payload)?locked.compatibility_payload.length:0,
        invitationPayloadPreserved:Array.isArray(locked.invitation_payload)?locked.invitation_payload.length:0,
        note:'Legacy compatibility results and invitations are preserved in the migration archive only; they are not reactivated.'
      })]);
    await db.query('COMMIT');
    return {eligible:true,claimed:true,sourceTier,sourceLocale:locked.source_locale,importedPassports:imported};
  }catch(error){await db.query('ROLLBACK');throw error;}
}
export async function handleMyMatchIQLegacyRequest(request,env,url){
  if(!url.pathname.startsWith('/api/mymatchiq/legacy'))return null;
  const auth=await session(request,env);if(!auth)return fail('Verified MyMatchIQ sign-in is required.',401,'unauthorized');
  const email=String(auth.user.email||'').trim().toLowerCase();if(!email)return fail('Verified email is required.',400,'email_required');
  try{return await withDb(env,async db=>{
    const row=await migrationRow(db,email);
    if(url.pathname==='/api/mymatchiq/legacy/status'&&request.method==='GET')return json({ok:true,migration:row?{eligible:true,status:row.claim_status,sourceTier:row.source_tier,sourceLocale:row.source_locale,sourceVerificationStatus:row.source_verification_status,passportCount:Array.isArray(row.passport_payload)?row.passport_payload.length:0}:{eligible:false,status:'none'}});
    if(url.pathname==='/api/mymatchiq/legacy/claim'&&request.method==='POST')return json({ok:true,migration:await claim(db,auth,row)});
    return fail('Legacy migration route not found.',404,'not_found');
  });}catch(error){console.error('MMIQ legacy migration error',error);return fail(error?.message||'Unable to process migration.',error?.status||500,error?.code||'migration_error');}
}
