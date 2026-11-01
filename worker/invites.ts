// @ts-nocheck
// Prelaunch invite API. No automatic messages and no reward transfers.
import { Client } from 'pg';
import { enforceAdminMfa } from './admin-mfa';
import { isExcludedAccountIdentity, accountCountableSql, isUncountableRequest } from './tracking-exclusion.js';
import { INVITE_REWARD_CONFIG, grantInviteReward } from './invite-config.js';

const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const fail=(code,status=400)=>json({ok:false,error:{code}},status);
const CODE=/^[A-HJ-NP-Z2-9]{6,8}$/;
const GAMES=new Set(['pests','pool_ping_pong','scrabluko','i_thought_so','what_should_they_do','scratch','like_minded']);
const SURFACES=new Set(['invite_center','game_button','game_end','like_minded_room','games_site','invite_landing']);
const CHANNELS=new Set(['sms','email','whatsapp','facebook','x','linkedin','copy','native_share']);
const EVENTS=new Set(['share_opened','share_channel','landing_view','play_click','signup_click']);
const clean=(v,max=120)=>String(v||'').trim().slice(0,max);
const gameKey=v=>GAMES.has(v)?v:null;
const normalCode=v=>clean(v,8).toUpperCase();
const sourceTag=v=>['invite_link','games_site','like_minded_room','member_signed_out'].includes(v)?v:'invite_link';
const firstName=v=>clean(v,120).split(/\s+/)[0].slice(0,50) || null;
const shareOrigin=request=>new URL(request.url).origin;
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function withDb(env,fn){const db=new Client({connectionString:env.HYPERDRIVE.connectionString});await db.connect();try{return await fn(db)}finally{await db.end()}}
async function memberSession(request,env){
 const cookie=request.headers.get('cookie');if(!cookie)return null;
 const r=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
 if(!r.ok)return null;
 const data=await r.json().catch(()=>null),user=data?.user||data?.data?.user,session=data?.session||data?.data?.session;
 return user?.id&&user?.emailVerified===true&&session?{user,session}:null;
}
async function ensureDdl(db,sql){await db.query(sql)}
export async function ensureInviteSchema(db){
 await ensureDdl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_invite_codes(
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK(code ~ '^[A-HJ-NP-Z2-9]{6,8}$'),
  created_at timestamptz NOT NULL DEFAULT now(),disabled_at timestamptz)`);
 await ensureDdl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_invite_events(
  id bigserial PRIMARY KEY,inviter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  code text,game text,surface text NOT NULL,channel text,event text NOT NULL
  CHECK(event IN ('share_opened','share_channel','landing_view','play_click','signup_click')),
  visitor_id text,created_at timestamptz NOT NULL DEFAULT now())`);
 await ensureDdl(db,`CREATE INDEX IF NOT EXISTS o2ol_invite_events_inviter_idx ON public.o2ol_invite_events(inviter_id,created_at DESC)`);
 await ensureDdl(db,`CREATE INDEX IF NOT EXISTS o2ol_invite_events_game_idx ON public.o2ol_invite_events(game,created_at DESC)`);
 await ensureDdl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_referrals(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),inviter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  invitee_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  code text,game text,source text NOT NULL,status text NOT NULL DEFAULT 'pending'
  CHECK(status IN ('pending','qualified','rejected')),reject_reason text,
  landed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz,reward_status text NOT NULL DEFAULT 'none'
  CHECK(reward_status IN ('none','granted','failed')))`);
 await ensureDdl(db,`CREATE INDEX IF NOT EXISTS o2ol_referrals_inviter_idx ON public.o2ol_referrals(inviter_id,created_at DESC)`);
 await ensureDdl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_invite_rate_windows(
  key_hash text NOT NULL,endpoint text NOT NULL,window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,PRIMARY KEY(key_hash,endpoint,window_start))`);
}
function generateCode(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(7);crypto.getRandomValues(bytes);
 return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
}
async function rateLimit(db,request,endpoint,max,visitorId=''){
 const ip=request.headers.get('cf-connecting-ip')||'0.0.0.0';
 const day=new Date().toISOString().slice(0,10);
 const hash=await digest('o2ol:invites:'+day+':'+ip+':'+visitorId.slice(0,75));
 const row=(await db.query(`INSERT INTO public.o2ol_invite_rate_windows(key_hash,endpoint,window_start,count)
  VALUES($1,$2,date_trunc('minute',now()),1)
  ON CONFLICT(key_hash,endpoint,window_start)
  DO UPDATE SET count=public.o2ol_invite_rate_windows.count+1 RETURNING count`,[hash,endpoint])).rows[0];
 if(Number(row?.count)>max)return false;
 return true;
}
async function codeRow(db,code){
 if(!CODE.test(code))return null;
 const r=await db.query(`SELECT c.user_id,c.code,c.disabled_at,u.name,u.username,u.email,a.role,
  a.email AS auth_email
  FROM public.o2ol_invite_codes c JOIN public.users u ON u.id=c.user_id
  LEFT JOIN neon_auth."user" a ON a.id=u.id WHERE c.code=$1 LIMIT 1`,[code]);
 return r.rows[0]||null;
}
async function personalCode(db,user){
 let found=(await db.query('SELECT code,disabled_at FROM public.o2ol_invite_codes WHERE user_id=$1::uuid',[user.id])).rows[0];
 if(found)return found.disabled_at?null:found.code;
 for(let tries=0;tries<12;tries++){
  const code=generateCode();
  try{
   const row=(await db.query(`INSERT INTO public.o2ol_invite_codes(user_id,code)
    VALUES($1::uuid,$2) ON CONFLICT(user_id) DO NOTHING RETURNING code`,[user.id,code])).rows[0];
   if(row)return row.code;
  }catch(e){if(e?.code!=='23505')throw e}
  found=(await db.query('SELECT code,disabled_at FROM public.o2ol_invite_codes WHERE user_id=$1::uuid',[user.id])).rows[0];
  if(found)return found.disabled_at?null:found.code;
 }
 throw Error('invite_code_unavailable');
}
function attribution(input){
 if(!input||typeof input!=='object')return null;
 const code=normalCode(input.code),game=gameKey(clean(input.game,35));
 const source=sourceTag(clean(input.source,32));
 if(code&&!CODE.test(code))return null;
 if(!code && source==='invite_link')return null;
 const rawDate=Date.parse(input.landedAt||'');
 const landedAt=Number.isFinite(rawDate)&&rawDate<=Date.now()&&rawDate>=Date.now()-30*86400000?new Date(rawDate).toISOString():null;
 return {code:code||null,game,source,landedAt};
}
export function validateInviteAttribution(input){return attribution(input)}
// Never block registration when an invite is invalid or unavailable.
export async function saveInviteReferral(db,user,raw){
 const a=attribution(raw);if(!a||!user?.id)return null;
 await ensureInviteSchema(db);
 let inviter=null,reason=null;
 if(a.code){
  const row=await codeRow(db,a.code);
  if(!row||row.disabled_at)reason='disabled_code';
  else if(isExcludedAccountIdentity({id:row.user_id,email:row.auth_email||row.email,role:row.role}))reason='excluded_identity';
  else if(row.user_id===user.id||String(row.auth_email||row.email).toLowerCase()===String(user.email).toLowerCase())reason='self_invite';
  else {
   const samePhone=(await db.query(`SELECT EXISTS(
    SELECT 1 FROM public.users inviter JOIN public.users invitee ON invitee.id=$2::uuid
    WHERE inviter.id=$1::uuid AND inviter.phone_number_verified=true
      AND invitee.phone_number_verified=true AND inviter.phone_number IS NOT NULL
      AND inviter.phone_number=invitee.phone_number) AS same`,[row.user_id,user.id])).rows[0]?.same;
   if(samePhone)reason='self_invite';else inviter=row.user_id;
  }
 }
 const inviteeAuth=(await db.query('SELECT id,email,role FROM neon_auth."user" WHERE id=$1::uuid',[user.id])).rows[0];
 if(isExcludedAccountIdentity(inviteeAuth||{id:user.id,email:user.email}))reason='excluded_identity';
 const inserted=await db.query(`INSERT INTO public.o2ol_referrals(inviter_id,invitee_id,code,game,source,status,reject_reason,landed_at)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8::timestamptz)
  ON CONFLICT(invitee_id) DO NOTHING RETURNING id,status`,[
    inviter,user.id,a.code,a.game,a.source,reason?'rejected':'pending',reason,a.landedAt
  ]);
 return inserted.rows[0]||null;
}
export async function qualifyInviteReferral(db,userId){
 await ensureInviteSchema(db);
 const row=(await db.query(`SELECT r.* FROM public.o2ol_referrals r
   JOIN neon_auth."user" a ON a.id=r.invitee_id
   WHERE r.invitee_id=$1::uuid AND r.status='pending' AND a."emailVerified"=true
   FOR UPDATE OF r`,[userId])).rows[0];
 if(!row)return null;
 // Excluded and self-referred identities are never qualified.
 const result=await db.query(`UPDATE public.o2ol_referrals SET status='qualified',qualified_at=now()
   WHERE id=$1 AND status='pending' RETURNING *`,[row.id]);
 const qualified=result.rows[0];
 if(qualified)await grantInviteReward(db,qualified,INVITE_REWARD_CONFIG);
 return qualified||null;
}
async function getMine(request,env,auth){
 return withDb(env,async db=>{
  await ensureInviteSchema(db);
  const code=await personalCode(db,auth.user);
  if(!code)return fail('invite_code_disabled',403);
  const excluded=isExcludedAccountIdentity(auth.user);
  const [events,referrals]=await Promise.all([
   excluded?{rows:[{shares_opened:0,landings:0}]}:db.query(`SELECT
      count(*) FILTER(WHERE event='share_opened')::int AS shares_opened,
      count(*) FILTER(WHERE event='landing_view')::int AS landings
      FROM public.o2ol_invite_events WHERE inviter_id=$1::uuid`,[auth.user.id]),
   excluded?{rows:[{signups:0,qualified:0,recent:[]}]}:db.query(`SELECT
      count(*)::int AS signups,count(*) FILTER(WHERE r.status='qualified')::int AS qualified
      FROM public.o2ol_referrals r WHERE r.inviter_id=$1::uuid AND r.status<>'rejected'`,[auth.user.id])
  ]);
  const recent=excluded?[]:(await db.query(`SELECT split_part(coalesce(nullif(u.name,''),'Member'),' ',1) AS first_name,r.created_at
    FROM public.o2ol_referrals r JOIN public.users u ON u.id=r.invitee_id
    WHERE r.inviter_id=$1::uuid AND r.status IN ('pending','qualified')
    ORDER BY r.created_at DESC LIMIT 10`,[auth.user.id])).rows;
  return json({ok:true,code,link:shareOrigin(request)+'/i/'+code,
    stats:{sharesOpened:Number(events.rows[0]?.shares_opened||0),landings:Number(events.rows[0]?.landings||0),
      signups:Number(referrals.rows[0]?.signups||0),qualified:Number(referrals.rows[0]?.qualified||0)},recent});
 });
}
async function resolvePublic(request,env,code){
 return withDb(env,async db=>{
  await ensureInviteSchema(db);
  if(!await rateLimit(db,request,'resolve',30))return fail('rate_limited',429);
  if(code==='PLAY')return json({ok:true,valid:true,inviterFirstName:null});
  const row=await codeRow(db,code);
  if(!row||row.disabled_at||isExcludedAccountIdentity({id:row.user_id,email:row.auth_email||row.email,role:row.role}))
    return json({ok:true,valid:false,inviterFirstName:null});
  return json({ok:true,valid:true,inviterFirstName:firstName(row.name||row.username)});
 });
}
async function eventPublic(request,env,auth){
 const b=await request.json().catch(()=>null);
 if(!b||typeof b!=='object')return fail('invalid_body');
 const event=clean(b.event,28),surface=clean(b.surface,40),channel=clean(b.channel,28);
 const code=normalCode(b.code),game=gameKey(clean(b.game,35)),visitor=clean(b.visitorId,120);
 if(typeof b.visitorId==='string'&&b.visitorId.length>120)return fail('invalid_event');
 if(!EVENTS.has(event)||!SURFACES.has(surface)||channel&&!CHANNELS.has(channel)||
  b.game&&!game||code&&!CODE.test(code)|| (b.visitorId&&visitor.length>120))return fail('invalid_event');
 if(event==='share_channel'&&!channel)return fail('channel_required');
 if(code&&['share_opened','share_channel'].includes(event)&&!auth?.user?.id)return fail('login_required',401);
 return withDb(env,async db=>{
  await ensureInviteSchema(db);
  if(!await rateLimit(db,request,'events',30,visitor))return fail('rate_limited',429);
  const row=code?await codeRow(db,code):null;
  if(code&&(!row||row.disabled_at))return fail('invalid_code',400);
  let inviter=row?.user_id||null;
  if(auth?.user?.id && row && auth.user.id!==row.user_id && ['share_opened','share_channel'].includes(event))return fail('not_your_code',403);
  if(auth?.user?.id&&row&&auth.user.id===row.user_id&&['landing_view','signup_click','play_click'].includes(event))return json({ok:true,tracked:false});
  if(auth?.user?.id&&isExcludedAccountIdentity(auth.user))return json({ok:true,tracked:false});
  if(row&&isExcludedAccountIdentity({id:row.user_id,email:row.auth_email||row.email,role:row.role}))
   return json({ok:true,tracked:false});
  if(isUncountableRequest(request,env))return json({ok:true,tracked:false});
  await db.query(`INSERT INTO public.o2ol_invite_events(inviter_id,code,game,surface,channel,event,visitor_id)
   VALUES($1,$2,$3,$4,$5,$6,$7)`,[inviter,code||null,game,surface,channel||null,event,visitor||null]);
  return json({ok:true,tracked:true},201);
 });
}
function dates(url){
 const to=new Date(url.searchParams.get('to')||Date.now());
 const from=new Date(url.searchParams.get('from')||Date.now()-30*86400000);
 if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||to<from||to.getTime()-from.getTime()>100*86400000)throw Error('invalid_date_range');
 return [from.toISOString(),to.toISOString()];
}
async function adminRoutes(request,env,url){
 const gate=await enforceAdminMfa(request,env);if(gate)return gate;
 return withDb(env,async db=>{
  await ensureInviteSchema(db);
  const pathname=url.pathname,limit=Math.min(50,Math.max(1,Number(url.searchParams.get('limit'))||20));
  if(pathname==='/api/admin/invites/codes/disable'||request.method==='PUT')return fail('not_found',404);
  if(request.method==='POST'&&/^\/api\/admin\/invites\/codes\/[0-9a-f-]{36}\/disable$/i.test(pathname)){
   const userId=pathname.split('/')[5];
   const res=await db.query('UPDATE public.o2ol_invite_codes SET disabled_at=COALESCE(disabled_at,now()) WHERE user_id=$1::uuid RETURNING code',[userId]);
   return json({ok:true,disabled:Boolean(res.rows[0])});
  }
  if(request.method!=='GET')return fail('method_not_allowed',405);
  const [from,to]=dates(url);
  const filterInviter=accountCountableSql('ia'),filterInvitee=accountCountableSql('ea');
  if(pathname==='/api/admin/invites/top-inviters'){
   const r=await db.query(`SELECT r.inviter_id::text AS user_id,split_part(coalesce(u.name,u.username,'Member'),' ',1) AS name,
    c.code,count(*) FILTER(WHERE r.status='qualified')::int AS qualified
    FROM public.o2ol_referrals r JOIN public.users u ON u.id=r.inviter_id
    JOIN neon_auth."user" ia ON ia.id=r.inviter_id JOIN neon_auth."user" ea ON ea.id=r.invitee_id
    LEFT JOIN public.o2ol_invite_codes c ON c.user_id=r.inviter_id
    WHERE r.created_at BETWEEN $1::timestamptz AND $2::timestamptz AND ${filterInviter} AND ${filterInvitee}
    GROUP BY r.inviter_id,u.name,u.username,c.code ORDER BY qualified DESC LIMIT $3`,[from,to,limit]);
   return json({ok:true,top:r.rows});
  }
  if(pathname!=='/api/admin/invites/summary')return fail('not_found',404);
  const eventFilter=`(e.inviter_id IS NULL OR ${accountCountableSql('ia')})`;
  const [events,refs,top,verified]=await Promise.all([
   db.query(`SELECT e.event,e.game,e.surface,e.channel,count(*)::int AS total FROM public.o2ol_invite_events e
      LEFT JOIN neon_auth."user" ia ON ia.id=e.inviter_id
      WHERE e.created_at BETWEEN $1::timestamptz AND $2::timestamptz AND ${eventFilter}
      GROUP BY e.event,e.game,e.surface,e.channel`,[from,to]),
   db.query(`SELECT r.status,r.reject_reason,r.game,r.source,count(*)::int AS total FROM public.o2ol_referrals r
      JOIN neon_auth."user" ea ON ea.id=r.invitee_id LEFT JOIN neon_auth."user" ia ON ia.id=r.inviter_id
      WHERE r.created_at BETWEEN $1::timestamptz AND $2::timestamptz AND ${filterInvitee}
      AND (r.inviter_id IS NULL OR ${filterInviter}) GROUP BY r.status,r.reject_reason,r.game,r.source`,[from,to]),
   db.query(`SELECT r.inviter_id::text AS user_id,split_part(coalesce(u.name,u.username,'Member'),' ',1) AS name,
      c.code,count(*) FILTER (WHERE r.status='qualified')::int AS qualified FROM public.o2ol_referrals r
      JOIN public.users u ON u.id=r.inviter_id JOIN neon_auth."user" ia ON ia.id=r.inviter_id
      JOIN neon_auth."user" ea ON ea.id=r.invitee_id
      LEFT JOIN public.o2ol_invite_codes c ON c.user_id=r.inviter_id
      WHERE r.created_at BETWEEN $1::timestamptz AND $2::timestamptz AND ${filterInviter} AND ${filterInvitee}
      GROUP BY r.inviter_id,u.name,u.username,c.code ORDER BY qualified DESC LIMIT 20`,[from,to]),
   db.query(`SELECT count(*)::int AS verified_members FROM public.users u
      JOIN neon_auth."user" a ON a.id=u.id
      WHERE a."emailVerified"=true AND coalesce(u.phone_number_verified,false)=true AND ${accountCountableSql('a')}`)
  ]);
  const sums=events.rows.reduce((acc,r)=>(acc[r.event]=(acc[r.event]||0)+Number(r.total),acc),{});
  const byStatus=refs.rows.reduce((acc,r)=>(acc[r.status]=(acc[r.status]||0)+Number(r.total),acc),{});
  return json({ok:true,from,to,events:events.rows,referrals:refs.rows,top:top.rows,
    totals:{sharesOpened:sums.share_opened||0,landings:sums.landing_view||0,signups:Object.values(byStatus).reduce((a,b)=>a+b,0),
      qualified:byStatus.qualified||0,rejected:byStatus.rejected||0},
    verifiedMembers:Number(verified.rows[0]?.verified_members||0),target:5000});
 });
}
export async function handleInviteRequest(request,env,url){
 if(!url.pathname.startsWith('/api/invites')&&!url.pathname.startsWith('/api/admin/invites'))return null;
 try{
  if(url.pathname.startsWith('/api/admin/invites'))return adminRoutes(request,env,url);
  if(request.method==='GET'&&url.pathname==='/api/invites/me'){
   const auth=await memberSession(request,env);return auth?getMine(request,env,auth):fail('unauthorized',401);
  }
  if(request.method==='GET'&&url.pathname.startsWith('/api/invites/resolve/')){
   return resolvePublic(request,env,normalCode(url.pathname.split('/').pop()));
  }
  if(request.method==='POST'&&url.pathname==='/api/invites/events'){
   const auth=await memberSession(request,env);return eventPublic(request,env,auth);
  }
  return fail('not_found',404);
 }catch(e){console.error('invite request failed',e?.code||e?.message);return fail(e?.message==='invalid_date_range'?'invalid_date_range':'invite_unavailable',e?.message==='invalid_date_range'?400:503)}
}
