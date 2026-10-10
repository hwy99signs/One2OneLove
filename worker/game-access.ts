// @ts-nocheck
import { Client } from 'pg';
import { maybeAutoReplenish } from './o2ol-tokens';
import { recordCostEvent } from './o2ol-cost-ledger';
import {
  GAME_REGISTRY,gameDefinition,publicGameRegistry,ensureGameEconomySchema,setMemberTimezone,
  resolveGamePromotion,chargeGameAndCreatePass,gameLeaderboard,submitGameScore,gameCreditWallet
} from './game-economy';

const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request',extra={}){return json({ok:false,error:{code,message,...extra}},status);}
function randomToken(bytes=32){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');}
async function sha256Hex(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');}
async function authSession(request,env){
  const cookie=request.headers.get('cookie');if(!cookie)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null,session=payload?.session??payload?.data?.session??null;
  return user?.id&&user?.emailVerified===true&&session?{user,session}:null;
}
async function withDb(env,fn){const db=new Client({connectionString:env.HYPERDRIVE.connectionString});await db.connect();try{return await fn(db);}finally{await db.end();}}
const TOLERATED_DDL_CODES=new Set(['42501','42701','42P07']);
async function ensureDdl(db,sql){try{await db.query(sql);}catch(e){if(!TOLERATED_DDL_CODES.has(e?.code))throw e;}}
async function ensureScratchTable(db){
  await ensureDdl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_game_launch_tickets(
    token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game text NOT NULL,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);
  await ensureDdl(db,`CREATE INDEX IF NOT EXISTS idx_o2ol_game_launch_tickets_user ON public.o2ol_game_launch_tickets(user_id,expires_at DESC)`);
}
async function verifiedMember(db,userId){
  const row=(await db.query(`SELECT COALESCE(is_active,true) AS is_active,COALESCE(phone_number_verified,false) AS phone_verified FROM public.users WHERE id=$1::uuid LIMIT 1`,[userId])).rows[0];
  if(!row||row.is_active===false)throw Object.assign(new Error('This account is not active.'),{status:403,code:'account_inactive'});
  if(row.phone_verified!==true)throw Object.assign(new Error('Phone verification is required.'),{status:428,code:'phone_verification_required'});
}
async function activePass(db,userId,game){
  await ensureGameEconomySchema(db);
  await db.query(`UPDATE public.o2ol_game_access_passes SET status='expired' WHERE user_id=$1::uuid AND game=$2 AND status='active' AND expires_at<=now()`,[userId,game]);
  return (await db.query(`SELECT id,game,tokens_charged,started_at,expires_at,metadata,promotion_id,game_credit_cents,credit_cents,promo_free
    FROM public.o2ol_game_access_passes WHERE user_id=$1::uuid AND game=$2 AND status='active' AND expires_at>now()
    ORDER BY expires_at DESC LIMIT 1`,[userId,game])).rows[0]||null;
}
async function accessSnapshot(db,userId,game){
  const def=gameDefinition(game);if(!def)throw Object.assign(new Error('This paid game is not available.'),{status:400,code:'game_invalid'});
  const pass=await activePass(db,userId,game);
  const promotion=await resolveGamePromotion(db,userId,game);
  const gameCredit=await gameCreditWallet(db,userId);
  return {active:Boolean(pass),pass,promotion,gameCredit};
}
async function launchPassGame(db,env,auth,game,input){
  await verifiedMember(db,auth.user.id);
  const def=gameDefinition(game);if(!def)throw Object.assign(new Error('This paid game is not available.'),{status:400,code:'game_invalid'});
  const existing=await activePass(db,auth.user.id,game);
  if(existing)return json({ok:true,pass:existing,reused:true,promotion:await resolveGamePromotion(db,auth.user.id,game),gameCreditCents:0,creditCents:0,gameCredit:await gameCreditWallet(db,auth.user.id)});
  const requestId=String(input?.requestId||crypto.randomUUID()).slice(0,120);
  const result=await chargeGameAndCreatePass(db,auth.user.id,game,requestId);
  await recordCostEvent(db,env,{
    userId:auth.user.id,featureCode:def.chargeFeatureCode,provider:'internal',providerProduct:'o2ol_game_session',
    walletTransactionId:result.pass?.token_transaction_id||null,providerCostMicros:null,customerTokensCharged:Number(result.creditCents||0),
    metadata:{game,pass_id:result.pass?.id,promotion:result.promotion?.id||result.promotion?.name||null,promo_free:Boolean(result.promotion?.free),game_credit_cents:result.gameCreditCents,credit_cents:result.creditCents,internal_cost_unallocated:true},
  }).catch(e=>console.error('Game cost telemetry failed',e));
  if(Number(result.creditCents||0)>0)maybeAutoReplenish(db,env,auth.user.id).catch(e=>console.error('Game Auto-Replenish check failed',e));
  return json({ok:true,...result,gameCredit:await gameCreditWallet(db,auth.user.id)},201);
}
async function launchScratch(db,env,auth,input){
  await ensureScratchTable(db);await verifiedMember(db,auth.user.id);
  const existing=await activePass(db,auth.user.id,'scratch');
  const charged=existing
    ?{pass:existing,reused:true,promotion:await resolveGamePromotion(db,auth.user.id,'scratch'),gameCreditCents:0,creditCents:0}
    :await chargeGameAndCreatePass(db,auth.user.id,'scratch',String(input?.requestId||crypto.randomUUID()).slice(0,120));
  await db.query('DELETE FROM public.o2ol_game_launch_tickets WHERE expires_at<now()');
  const token=randomToken(32),tokenHash=await sha256Hex(token),expiresAt=new Date(Date.now()+5*60*1000);
  await db.query(`INSERT INTO public.o2ol_game_launch_tickets(token_hash,user_id,game,expires_at) VALUES($1,$2::uuid,'scratch',$3)`,[tokenHash,auth.user.id,expiresAt.toISOString()]);
  if(!existing)await recordCostEvent(db,env,{
    userId:auth.user.id,featureCode:'scratch_game_session',provider:'internal',providerProduct:'scratch_game_launch',
    walletTransactionId:charged.pass?.token_transaction_id||null,providerCostMicros:null,customerTokensCharged:Number(charged.creditCents||0),
    metadata:{game:'scratch',pass_id:charged.pass?.id,promotion:charged.promotion?.id||charged.promotion?.name||null,promo_free:Boolean(charged.promotion?.free),game_credit_cents:charged.gameCreditCents,credit_cents:charged.creditCents,internal_cost_unallocated:true},
  }).catch(e=>console.error('Scratch cost telemetry failed',e));
  if(Number(charged.creditCents||0)>0)maybeAutoReplenish(db,env,auth.user.id).catch(()=>{});
  return json({ok:true,token,expiresAt:expiresAt.toISOString(),...charged,gameCredit:await gameCreditWallet(db,auth.user.id)});
}

export async function handleGameAccessRequest(request,env,url){
  if(!url.pathname.startsWith('/api/games/'))return null;
  const auth=await authSession(request,env);
  if(!auth)return fail('Sign in with a verified One2OneLove account.',401,'unauthorized');
  try{
    return await withDb(env,async db=>{
      await ensureGameEconomySchema(db);
      if(url.pathname==='/api/games/catalog'&&request.method==='GET')return json({ok:true,games:publicGameRegistry()});
      if(url.pathname==='/api/games/timezone'&&request.method==='POST'){
        const input=await request.json().catch(()=>({}));const timeZone=await setMemberTimezone(db,auth.user.id,input?.timeZone);
        return json({ok:true,timeZone:timeZone||'America/Chicago'});
      }
      if(url.pathname==='/api/games/promotion'&&request.method==='GET'){
        const game=url.searchParams.get('game')||'what_should_they_do';
        if(!gameDefinition(game))return fail('Unknown game.',400,'game_invalid');
        return json({ok:true,promotion:await resolveGamePromotion(db,auth.user.id,game)});
      }
      if(url.pathname==='/api/games/leaderboard'&&request.method==='GET'){
        const game=url.searchParams.get('game')||'';return json({ok:true,...await gameLeaderboard(db,auth.user.id,game)});
      }
      if(url.pathname==='/api/games/scores'&&request.method==='POST'){
        const input=await request.json().catch(()=>({}));
        return json({ok:true,score:await submitGameScore(db,auth.user.id,input?.game,input?.score,input?.sessionRef)},201);
      }
      if(url.pathname==='/api/games/scratch/launch'){
        if(request.method!=='POST')return fail('Method not allowed.',405,'method_not_allowed');
        return launchScratch(db,env,auth,await request.json().catch(()=>({})));
      }
      if(url.pathname==='/api/games/standard/access'){
        const game=request.method==='GET'?(url.searchParams.get('game')||''):String((await request.clone().json().catch(()=>({})))?.game||'');
        const def=gameDefinition(game);
        if(!def||def.kind!=='standard')return fail('This paid game is not available.',400,'game_invalid');
        await verifiedMember(db,auth.user.id);
        if(request.method==='GET')return json({ok:true,...await accessSnapshot(db,auth.user.id,game)});
        if(request.method==='POST')return launchPassGame(db,env,auth,game,await request.json().catch(()=>({})));
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      if(url.pathname==='/api/games/like-minded/access'){
        await verifiedMember(db,auth.user.id);
        if(request.method==='GET')return json({ok:true,...await accessSnapshot(db,auth.user.id,'like_minded')});
        if(request.method==='POST')return launchPassGame(db,env,auth,'like_minded',await request.json().catch(()=>({})));
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      return fail('Game access route not found.',404,'not_found');
    });
  }catch(error){
    console.error('O2OL game access error',error);
    return fail(error?.message||'Unable to start game.',error?.status||500,error?.code||'game_access_error',{
      balance:error?.balance,required:error?.required,shortfall:error?.shortfall,gameCreditBalance:error?.gameCreditBalance,
      creditBalance:error?.creditBalance,featureCode:error?.featureCode,featureLabel:error?.featureLabel,
    });
  }
}

const GAME_FILES={pests:'/games-src/pests.html',scrabluko:'/games-src/scrabluko.html'};
export async function handleGameFileRequest(request,env,url){
  const game=Object.keys(GAME_FILES).find(g=>url.pathname===GAME_FILES[g]);
  if(!game)return new Response('Game not found.',{status:404});
  const auth=await authSession(request,env);
  if(!auth)return new Response('Sign in with a verified One2OneLove account to play.',{status:403});
  try{
    const allowed=await withDb(env,async db=>{
      const roleRow=(await db.query(`SELECT role FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,[auth.user.id])).rows[0];
      if(roleRow?.role==='admin')return true;
      return Boolean(await activePass(db,auth.user.id,game));
    });
    if(!allowed)return new Response('This game needs an active play pass. Open the game page to unlock it.',{status:403});
    const asset=await env.ASSETS.fetch(request),headers=new Headers(asset.headers);
    headers.set('cache-control','private, no-store');
    return new Response(asset.body,{status:asset.status,headers});
  }catch(error){
    console.error('O2OL game file error',error);
    return new Response('Unable to load the game.',{status:500});
  }
}
