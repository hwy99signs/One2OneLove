// @ts-nocheck
import { Client } from 'pg';
import { reserveTokenCharge, consumeTokenReservation, releaseTokenReservation, maybeAutoReplenish } from './o2ol-tokens';
import { recordCostEvent } from './o2ol-cost-ledger';

const FREE_GAMES_PROMOTION = Object.freeze({
  id:'all_games_free_2026_10_11',
  name:'ALL GAMES FREE',
  endsAt:'2026-10-12T04:59:59.999Z', // Sun Oct 11, 2026 11:59:59 PM America/Chicago (CDT)
});
function activeFreeGamesPromotion(){
  return Date.now()<=Date.parse(FREE_GAMES_PROMOTION.endsAt)
    ? {...FREE_GAMES_PROMOTION,active:true,free:true}
    : null;
}

const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request',extra={}){return json({ok:false,error:{code,message,...extra}},status);}
function randomToken(bytes=32){
  const a=new Uint8Array(bytes);crypto.getRandomValues(a);
  return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
}
async function sha256Hex(value){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function authSession(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null;
  const session=payload?.session??payload?.data?.session??null;
  return user?.id&&user?.emailVerified===true&&session?{user,session}:null;
}
async function withDb(env,fn){
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{return await fn(db);}finally{await db.end();}
}
// Lazy-ensure DDL tolerance (2026-10-08): on the preview database the
// connecting role does not own the pre-existing tables, so an ensure DDL
// statement against an object that is already in shape can fail with 42501
// (must be owner). The full DDL set is pre-applied by the table owner via
// preview-schema-preapply.sql; here, skip ONLY the benign already-in-shape
// codes (42501 insufficient_privilege, 42701 duplicate_column, 42P07
// duplicate_table) per statement and continue. Any other error still throws,
// and the DML that follows surfaces a genuinely missing object loudly.
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07']);
async function ensureDdl(db, sql) {
  try { await db.query(sql); }
  catch (err) { if (!TOLERATED_DDL_CODES.has(err?.code)) throw err; }
}

async function ensureScratchTable(db){
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.o2ol_game_launch_tickets (
      token_hash text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      game text NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
  await ensureDdl(db, `CREATE INDEX IF NOT EXISTS idx_o2ol_game_launch_tickets_user
    ON public.o2ol_game_launch_tickets(user_id,expires_at DESC)`);
}
async function verifiedMember(db,userId){
  const row=(await db.query(
    `SELECT COALESCE(is_active,true) AS is_active,COALESCE(phone_number_verified,false) AS phone_verified
       FROM public.users WHERE id=$1::uuid LIMIT 1`,
    [userId],
  )).rows[0];
  if(!row||row.is_active===false)throw Object.assign(new Error('This account is not active.'),{status:403,code:'account_inactive'});
  if(row.phone_verified!==true)throw Object.assign(new Error('Phone verification is required.'),{status:428,code:'phone_verification_required'});
}
async function activeLikeMindedPass(db,userId){
  await db.query(`UPDATE public.o2ol_game_access_passes SET status='expired'
    WHERE user_id=$1::uuid AND game='like_minded' AND status='active' AND expires_at<=now()`,[userId]);
  return (await db.query(
    `SELECT id,game,tokens_charged,started_at,expires_at,metadata
       FROM public.o2ol_game_access_passes
      WHERE user_id=$1::uuid AND game='like_minded' AND status='active' AND expires_at>now()
      ORDER BY expires_at DESC LIMIT 1`,
    [userId],
  )).rows[0]||null;
}
async function launchScratch(db,env,auth,input){
  await ensureScratchTable(db);
  await verifiedMember(db,auth.user.id);
  const requestId=String(input?.requestId||crypto.randomUUID()).slice(0,120);
  const promotion=activeFreeGamesPromotion();
  const reservation=promotion?null:await reserveTokenCharge(db,auth.user.id,'scratch_game_session',{
    idempotencyKey:`scratch:${auth.user.id}:${requestId}`,
    metadata:{game:'scratch',request_id:requestId},
  });
  try{
    await db.query('DELETE FROM public.o2ol_game_launch_tickets WHERE expires_at<now()');
    const token=randomToken(32);
    const tokenHash=await sha256Hex(token);
    const expiresAt=new Date(Date.now()+5*60*1000);
    await db.query(
      `INSERT INTO public.o2ol_game_launch_tickets(token_hash,user_id,game,expires_at)
       VALUES($1,$2::uuid,'scratch',$3)`,
      [tokenHash,auth.user.id,expiresAt.toISOString()],
    );
    if(reservation?.id)await consumeTokenReservation(db,reservation.id);
    await recordCostEvent(db,env,{
      userId:auth.user.id,featureCode:'scratch_game_session',provider:'internal',
      providerProduct:'scratch_game_launch',
      walletTransactionId:reservation?.transaction?.id||reservation?.transaction_id||null,
      providerCostMicros:null,customerTokensCharged:Number(reservation?.tokens||0),
      metadata:{game:'scratch',request_id:requestId,promotion:promotion?.id||null,promo_free:Boolean(promotion),internal_cost_unallocated:true},
    }).catch(error=>console.error('Scratch cost telemetry failed',error));
    if(!promotion)maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('Scratch Auto-Replenish check failed',error));
    return json({ok:true,token,expiresAt:expiresAt.toISOString(),access:promotion?'promotion_free':'paid_game',promotion,tokens:{charged:Number(reservation?.tokens||0),balance:reservation?.balance_after??null}});
  }catch(error){
    if(reservation?.id)await releaseTokenReservation(db,reservation.id,'scratch_launch_failed').catch(()=>{});
    throw error;
  }
}
async function activeStandardGamePass(db,userId,game){
  await db.query(`UPDATE public.o2ol_game_access_passes SET status='expired'
    WHERE user_id=$1::uuid AND game=$2 AND status='active' AND expires_at<=now()`,[userId,game]);
  return (await db.query(
    `SELECT id,game,tokens_charged,started_at,expires_at,metadata
       FROM public.o2ol_game_access_passes
      WHERE user_id=$1::uuid AND game=$2 AND status='active' AND expires_at>now()
      ORDER BY expires_at DESC LIMIT 1`,
    [userId,game],
  )).rows[0]||null;
}
async function launchStandardGame(db,env,auth,input){
  await verifiedMember(db,auth.user.id);
  const game=String(input?.game||'').trim();
  if(!['what_should_they_do','pests','scrabluko'].includes(game))throw Object.assign(new Error('This paid game is not available.'),{status:400,code:'game_invalid'});
  const existing=await activeStandardGamePass(db,auth.user.id,game);
  if(existing)return json({ok:true,pass:existing,reused:true,promotion:activeFreeGamesPromotion()});
  const requestId=String(input?.requestId||crypto.randomUUID()).slice(0,120);
  const promotion=activeFreeGamesPromotion();
  const reservation=promotion?null:await reserveTokenCharge(db,auth.user.id,'premium_game_session',{
    idempotencyKey:`premium_game:${game}:${auth.user.id}:${requestId}`,
    metadata:{game,request_id:requestId},
  });
  const expiresAt=new Date(Date.now()+120*60*1000);
  try{
    const pass=(await db.query(
      `INSERT INTO public.o2ol_game_access_passes
       (user_id,game,token_transaction_id,tokens_charged,status,expires_at,metadata)
       VALUES($1::uuid,$2,$3::uuid,$4,'active',$5,$6::jsonb)
       RETURNING id,game,tokens_charged,started_at,expires_at,metadata`,
      [auth.user.id,game,reservation?.transaction?.id||reservation?.transaction_id||null,Number(reservation?.tokens||0),expiresAt.toISOString(),JSON.stringify({request_id:requestId,access_minutes:120,promotion:promotion?.id||null,promo_free:Boolean(promotion)})],
    )).rows[0];
    if(reservation?.id)await consumeTokenReservation(db,reservation.id);
    await recordCostEvent(db,env,{
      userId:auth.user.id,featureCode:'premium_game_session',provider:'internal',
      providerProduct:'o2ol_standard_game_session',
      walletTransactionId:reservation?.transaction?.id||reservation?.transaction_id||null,
      providerCostMicros:null,customerTokensCharged:Number(reservation?.tokens||0),
      metadata:{game,pass_id:pass.id,access_minutes:120,promotion:promotion?.id||null,promo_free:Boolean(promotion),internal_cost_unallocated:true},
    }).catch(error=>console.error('Standard game cost telemetry failed',error));
    if(!promotion)maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('Game Auto-Replenish check failed',error));
    return json({ok:true,pass,promotion,tokens:{charged:Number(reservation?.tokens||0),balance:reservation?.balance_after??null}},201);
  }catch(error){
    if(reservation?.id)await releaseTokenReservation(db,reservation.id,'game_pass_creation_failed').catch(()=>{});
    throw error;
  }
}

async function launchLikeMinded(db,env,auth,input){
  await verifiedMember(db,auth.user.id);
  const existing=await activeLikeMindedPass(db,auth.user.id);
  if(existing)return json({ok:true,pass:existing,reused:true});

  const requestId=String(input?.requestId||crypto.randomUUID()).slice(0,120);
  const promotion=activeFreeGamesPromotion();
  const reservation=promotion?null:await reserveTokenCharge(db,auth.user.id,'like_minded_session',{
    idempotencyKey:`like_minded:${auth.user.id}:${requestId}`,
    metadata:{game:'like_minded',request_id:requestId},
  });
  const accessMinutes=120;
  const expiresAt=new Date(Date.now()+accessMinutes*60*1000);
  try{
    const pass=(await db.query(
      `INSERT INTO public.o2ol_game_access_passes
       (user_id,game,token_transaction_id,tokens_charged,status,expires_at,metadata)
       VALUES($1::uuid,'like_minded',$2::uuid,$3,'active',$4,$5::jsonb)
       RETURNING id,game,tokens_charged,started_at,expires_at,metadata`,
      [
        auth.user.id,
        reservation?.transaction?.id||reservation?.transaction_id||null,
        Number(reservation?.tokens||0),
        expiresAt.toISOString(),
        JSON.stringify({request_id:requestId,access_minutes:accessMinutes,promotion:promotion?.id||null,promo_free:Boolean(promotion)}),
      ],
    )).rows[0];
    if(reservation?.id)await consumeTokenReservation(db,reservation.id);
    await recordCostEvent(db,env,{
      userId:auth.user.id,
      featureCode:'like_minded_session',
      provider:'internal',
      providerProduct:'neon_cloudflare_game_session',
      walletTransactionId:reservation?.transaction?.id||reservation?.transaction_id||null,
      providerCostMicros:null,
      customerTokensCharged:Number(reservation?.tokens||0),
      metadata:{game:'like_minded',pass_id:pass.id,access_minutes:accessMinutes,promotion:promotion?.id||null,promo_free:Boolean(promotion),internal_cost_unallocated:true},
    }).catch(error=>console.error('Like Minded cost telemetry failed',error));
    if(!promotion)maybeAutoReplenish(db,env,auth.user.id).catch(error=>console.error('Like Minded Auto-Replenish check failed',error));
    return json({ok:true,pass,promotion,tokens:{charged:Number(reservation?.tokens||0),balance:reservation?.balance_after??null}},201);
  }catch(error){
    if(reservation?.id)await releaseTokenReservation(db,reservation.id,'game_pass_creation_failed').catch(()=>{});
    throw error;
  }
}

export async function handleGameAccessRequest(request,env,url){
  if(!url.pathname.startsWith('/api/games/'))return null;
  const auth=await authSession(request,env);
  if(!auth)return fail('Sign in with a verified One2OneLove account.',401,'unauthorized');

  try{
    return await withDb(env,async db=>{
      if(url.pathname==='/api/games/promotion'&&request.method==='GET'){
        return json({ok:true,promotion:activeFreeGamesPromotion()});
      }
      if(url.pathname==='/api/games/scratch/launch'){
        if(request.method!=='POST')return fail('Method not allowed.',405,'method_not_allowed');
        const input=(request.headers.get('content-type')||'').includes('application/json')
          ? await request.json().catch(()=>({})):{};
        return launchScratch(db,env,auth,input);
      }
      if(url.pathname==='/api/games/standard/access'){
        const game=url.searchParams.get('game')||'';
        if(request.method==='GET'){
          await verifiedMember(db,auth.user.id);
          if(!['what_should_they_do','pests','scrabluko'].includes(game))return fail('This paid game is not available.',400,'game_invalid');
          const pass=await activeStandardGamePass(db,auth.user.id,game);
          return json({ok:true,active:Boolean(pass),pass,promotion:activeFreeGamesPromotion()});
        }
        if(request.method==='POST'){
          const input=(request.headers.get('content-type')||'').includes('application/json')
            ? await request.json().catch(()=>({})):{};
          return launchStandardGame(db,env,auth,input);
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      if(url.pathname==='/api/games/like-minded/access'){
        if(request.method==='GET'){
          await verifiedMember(db,auth.user.id);
          const pass=await activeLikeMindedPass(db,auth.user.id);
          return json({ok:true,active:Boolean(pass),pass,promotion:activeFreeGamesPromotion()});
        }
        if(request.method==='POST'){
          const input=(request.headers.get('content-type')||'').includes('application/json')
            ? await request.json().catch(()=>({})):{};
          return launchLikeMinded(db,env,auth,input);
        }
        return fail('Method not allowed.',405,'method_not_allowed');
      }
      return fail('Game access route not found.',404,'not_found');
    });
  }catch(error){
    console.error('O2OL game access error',error);
    return fail(error?.message||'Unable to start game.',error?.status||500,error?.code||'game_access_error',{
      balance:error?.balance,required:error?.required,featureCode:error?.featureCode,featureLabel:error?.featureLabel,
    });
  }
}

// Pass-gated delivery of the self-contained game files (PEST'S, Scrabluko).
// The files ship as static assets under /games-src/, but every request runs
// through the worker first (run_worker_first), so the file is only served to
// a signed-in member holding an active pass for that game, an admin, or any
// verified member while a free-games promotion is live.
const GAME_FILES = { pests: '/games-src/pests.html', scrabluko: '/games-src/scrabluko.html' };
export async function handleGameFileRequest(request, env, url) {
  const game = Object.keys(GAME_FILES).find(g => url.pathname === GAME_FILES[g]);
  if (!game) return new Response('Game not found.', { status: 404 });
  const auth = await authSession(request, env);
  if (!auth) return new Response('Sign in with a verified One2OneLove account to play.', { status: 403 });
  try {
    const allowed = await withDb(env, async db => {
      const roleRow = (await db.query(`SELECT role FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`, [auth.user.id])).rows[0];
      if (roleRow?.role === 'admin') return true;
      if (activeFreeGamesPromotion()) return true;
      const pass = await activeStandardGamePass(db, auth.user.id, game);
      return Boolean(pass);
    });
    if (!allowed) return new Response('This game needs an active play pass. Open the game page to unlock it.', { status: 403 });
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    headers.set('cache-control', 'private, no-store');
    return new Response(asset.body, { status: asset.status, headers });
  } catch (error) {
    console.error('O2OL game file error', error);
    return new Response('Unable to load the game.', { status: 500 });
  }
}
