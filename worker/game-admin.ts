// @ts-nocheck
import { Client } from 'pg';
import { ensureGameEconomySchema,adminGrantGameCredit,gameEconomyAdminSummary,publicGameRegistry } from './game-economy';
import { foundingGiveawayAdminSummary } from './founding-perks';
import { getVerifiedAdminMfaIdentity } from './admin-mfa';

const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request'){return json({ok:false,error:{code,message}},status);}
async function withDb(env,fn){const db=new Client({connectionString:env.HYPERDRIVE.connectionString});await db.connect();try{return await fn(db);}finally{await db.end();}}
async function adminSession(request,env){
  const cookie=request.headers.get('cookie');if(!cookie)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null),user=payload?.user??payload?.data?.user??null,session=payload?.session??payload?.data?.session??null;
  return user?.id&&session&&String(user?.role||'').toLowerCase()==='admin'?{user,session}:null;
}
function normalizePromotion(input){
  const kind=String(input?.kind||'free_play');
  if(!['free_play','percent_off','credit_grant'].includes(kind))throw Object.assign(new Error('Invalid promotion kind.'),{status:400,code:'invalid_kind'});
  const recurrence=String(input?.recurrence||'none');
  if(!['none','weekly'].includes(recurrence))throw Object.assign(new Error('Invalid recurrence.'),{status:400,code:'invalid_recurrence'});
  const games=input?.games==='ALL'?'ALL':Array.isArray(input?.games)?input.games.map(String):'ALL';
  return {
    name:String(input?.name||'').trim().slice(0,120),kind,
    percent:input?.percent==null?null:Math.max(0,Math.min(100,Math.round(Number(input.percent)||0))),
    grantCents:input?.grantCents==null?null:Math.max(0,Math.round(Number(input.grantCents)||0)),
    grantExpiryDays:input?.grantExpiryDays==null?null:Math.max(1,Math.round(Number(input.grantExpiryDays)||1)),
    startsAt:input?.startsAt||null,endsAt:input?.endsAt||null,recurrence,
    recurrenceDay:recurrence==='weekly'?Math.max(0,Math.min(6,Math.round(Number(input?.recurrenceDay)||0))):null,
    games,audience:['all','new_members'].includes(String(input?.audience))?String(input.audience):'all',
    active:Boolean(input?.active),
  };
}

async function adminIdentity(db,userId){
  const result=await db.query(
    `SELECT id,email,name,role,COALESCE(banned,false) AS banned
       FROM neon_auth."user"
      WHERE id=$1::uuid`,[userId]);
  const row=result.rows[0]||null;
  if(!row||row.role!=='admin'||row.banned)return null;
  return row;
}

export async function handleGameAdminRequest(request,env,url){
  if(!url.pathname.startsWith('/api/admin/game-'))return null;
  const auth=await adminSession(request,env);
  const mfaFallback=auth?null:await getVerifiedAdminMfaIdentity(request,env);
  if(!auth&&!mfaFallback)return fail('Administrator access required.',403,'admin_required');
  try{
    return await withDb(env,async db=>{
      const admin=mfaFallback?.admin||await adminIdentity(db,auth.user.id);
      if(!admin)return fail('Administrator access required.',403,'admin_required');
      await ensureGameEconomySchema(db);
      if(url.pathname==='/api/admin/game-economy'&&request.method==='GET'){
        return json({ok:true,...await gameEconomyAdminSummary(db),registry:publicGameRegistry(),foundingGiveaway:await foundingGiveawayAdminSummary(db)});
      }
      if(url.pathname==='/api/admin/game-credits/grant'&&request.method==='POST'){
        const input=await request.json().catch(()=>({}));
        return json({ok:true,gameCredit:await adminGrantGameCredit(db,admin.id,input)},201);
      }
      if(url.pathname==='/api/admin/game-promotions'&&request.method==='GET'){
        const rows=(await db.query('SELECT * FROM public.o2ol_game_promotions ORDER BY created_at DESC')).rows;
        return json({ok:true,promotions:rows});
      }
      if(url.pathname==='/api/admin/game-promotions'&&request.method==='POST'){
        const p=normalizePromotion(await request.json().catch(()=>({})));
        if(!p.name)return fail('Promotion name is required.',400,'name_required');
        const row=(await db.query(`INSERT INTO public.o2ol_game_promotions
          (name,kind,percent,grant_cents,grant_expiry_days,starts_at,ends_at,recurrence,recurrence_day,timezone_basis,games,audience,active,created_by)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'member_local',$10::jsonb,$11,$12,$13)
          RETURNING *`,[p.name,p.kind,p.percent,p.grantCents,p.grantExpiryDays,p.startsAt,p.endsAt,p.recurrence,p.recurrenceDay,JSON.stringify(p.games),p.audience,p.active,String(admin.id)])).rows[0];
        return json({ok:true,promotion:row},201);
      }
      const match=url.pathname.match(/^\/api\/admin\/game-promotions\/([0-9a-f-]{36})$/i);
      if(match&&request.method==='PUT'){
        const p=normalizePromotion(await request.json().catch(()=>({})));
        if(!p.name)return fail('Promotion name is required.',400,'name_required');
        const row=(await db.query(`UPDATE public.o2ol_game_promotions SET
          name=$2,kind=$3,percent=$4,grant_cents=$5,grant_expiry_days=$6,starts_at=$7,ends_at=$8,
          recurrence=$9,recurrence_day=$10,timezone_basis='member_local',games=$11::jsonb,audience=$12,active=$13
          WHERE id=$1::uuid RETURNING *`,[match[1],p.name,p.kind,p.percent,p.grantCents,p.grantExpiryDays,p.startsAt,p.endsAt,p.recurrence,p.recurrenceDay,JSON.stringify(p.games),p.audience,p.active])).rows[0];
        if(!row)return fail('Promotion not found.',404,'not_found');
        return json({ok:true,promotion:row});
      }
      if(match&&request.method==='DELETE'){
        const row=(await db.query('DELETE FROM public.o2ol_game_promotions WHERE id=$1::uuid RETURNING id',[match[1]])).rows[0];
        if(!row)return fail('Promotion not found.',404,'not_found');
        return json({ok:true,deleted:true});
      }
      return fail('Game admin route not found.',404,'not_found');
    });
  }catch(error){
    console.error('O2OL game admin error',error);
    return fail(error?.message||'Game admin operation failed.',error?.status||500,error?.code||'game_admin_error');
  }
}
