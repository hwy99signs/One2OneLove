// @ts-nocheck
import { Client } from 'pg';

const TOLERATED_DDL_CODES=new Set(['42501','42701','42P07','42710']);
async function ddl(db,sql){try{await db.query(sql);}catch(e){if(!TOLERATED_DDL_CODES.has(e?.code))throw e;}}

export const GAME_REGISTRY=Object.freeze({
  what_should_they_do:{id:'what_should_they_do',title:'What Should They Do?',category:'brain',chargeFeatureCode:'premium_game_session',route:'/WhatShouldTheyDo',leaderboard:false,scoreLabel:null,scoreCap:null,kind:'standard'},
  like_minded:{id:'like_minded',title:'Like Minded?',category:'brain',chargeFeatureCode:'like_minded_session',route:'/LikeMinded',leaderboard:true,scoreLabel:'matches',scoreCap:100,kind:'like_minded'},
  scratch:{id:'scratch',title:'LOVE SCRATCH GAME',category:'arcade',chargeFeatureCode:'scratch_game_session',route:'/ScratchGame',leaderboard:false,scoreLabel:null,scoreCap:null,kind:'scratch'},
  pests:{id:'pests',title:"PEST'S",category:'arcade',chargeFeatureCode:'premium_game_session',route:'/Pests',leaderboard:true,scoreLabel:'catches',scoreCap:100000,kind:'standard'},
  scrabluko:{id:'scrabluko',title:'Scrabluko',category:'brain',chargeFeatureCode:'premium_game_session',route:'/Scrabluko',leaderboard:true,scoreLabel:'points',scoreCap:1000000,kind:'standard'},
});
export function gameDefinition(id){return GAME_REGISTRY[String(id||'').trim()]||null;}
export function publicGameRegistry(){return Object.values(GAME_REGISTRY).map(({chargeFeatureCode,...row})=>row);}

export async function ensureGameEconomySchema(db){
  await ddl(db,`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS timezone text`);
  await ddl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_game_credit_ledger(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK(kind IN ('signup_bonus','admin_grant','promo_grant','spend','expire')),
    amount_cents integer NOT NULL,
    remaining_cents integer,
    game text,
    idempotency_key text NOT NULL UNIQUE,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    actor text,
    note text
  )`);
  await ddl(db,`CREATE INDEX IF NOT EXISTS idx_o2ol_game_credit_user_expiry ON public.o2ol_game_credit_ledger(user_id,expires_at,created_at)`);
  await ddl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_game_promotions(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kind text NOT NULL CHECK(kind IN ('free_play','percent_off','credit_grant')),
    percent integer,
    grant_cents integer,
    grant_expiry_days integer,
    starts_at timestamptz,
    ends_at timestamptz,
    recurrence text NOT NULL DEFAULT 'none' CHECK(recurrence IN ('none','weekly')),
    recurrence_day integer CHECK(recurrence_day BETWEEN 0 AND 6),
    timezone_basis text NOT NULL DEFAULT 'member_local',
    games jsonb NOT NULL DEFAULT '"ALL"'::jsonb,
    audience text NOT NULL DEFAULT 'all' CHECK(audience IN ('all','new_members')),
    active boolean NOT NULL DEFAULT false,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await ddl(db,`CREATE TABLE IF NOT EXISTS public.o2ol_game_scores(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game text NOT NULL,
    score integer NOT NULL CHECK(score>=0),
    session_ref text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id,game,session_ref)
  )`);
  await ddl(db,`CREATE INDEX IF NOT EXISTS idx_o2ol_game_scores_board ON public.o2ol_game_scores(game,score DESC,created_at ASC)`);
  await ddl(db,`ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS promotion_id uuid`);
  await ddl(db,`ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS game_credit_cents integer NOT NULL DEFAULT 0`);
  await ddl(db,`ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS credit_cents integer NOT NULL DEFAULT 0`);
  await ddl(db,`ALTER TABLE public.o2ol_game_access_passes ADD COLUMN IF NOT EXISTS promo_free boolean NOT NULL DEFAULT false`);
  await ddl(db,`INSERT INTO public.o2ol_game_promotions(name,kind,recurrence,recurrence_day,timezone_basis,games,audience,active,created_by)
    SELECT 'Friday Free-Up','free_play','weekly',5,'member_local','"ALL"'::jsonb,'all',false,'system'
    WHERE NOT EXISTS (SELECT 1 FROM public.o2ol_game_promotions WHERE lower(name)=lower('Friday Free-Up'))`);
}

export async function setMemberTimezone(db,userId,timeZone){
  await ensureGameEconomySchema(db);
  const value=String(timeZone||'').trim();
  if(!value||value.length>80)return null;
  try{new Intl.DateTimeFormat('en-US',{timeZone:value}).format(new Date());}catch(_){return null;}
  await db.query('UPDATE public.users SET timezone=$2,updated_at=now() WHERE id=$1::uuid',[userId,value]);
  return value;
}

export async function grantSignupGameCreditInTx(db,userId){
  await ensureGameEconomySchema(db);
  const key=`signup_bonus:${userId}`;
  const row=(await db.query(`INSERT INTO public.o2ol_game_credit_ledger
    (user_id,kind,amount_cents,remaining_cents,idempotency_key,expires_at,actor,note)
    VALUES($1::uuid,'signup_bonus',500,500,$2,now()+interval '14 days','system','Verified-account welcome Game Credit')
    ON CONFLICT(idempotency_key) DO NOTHING RETURNING *`,[userId,key])).rows[0]||null;
  return row;
}

async function expireGameCreditsInTx(db,userId){
  const rows=(await db.query(`SELECT id,remaining_cents FROM public.o2ol_game_credit_ledger
    WHERE user_id=$1::uuid AND kind IN ('signup_bonus','admin_grant','promo_grant')
      AND COALESCE(remaining_cents,0)>0 AND expires_at IS NOT NULL AND expires_at<=now()
    ORDER BY expires_at ASC,created_at ASC FOR UPDATE`,[userId])).rows;
  for(const row of rows){
    const amount=Number(row.remaining_cents||0);
    if(amount<=0)continue;
    await db.query('UPDATE public.o2ol_game_credit_ledger SET remaining_cents=0 WHERE id=$1::uuid',[row.id]);
    await db.query(`INSERT INTO public.o2ol_game_credit_ledger
      (user_id,kind,amount_cents,remaining_cents,idempotency_key,actor,note)
      VALUES($1::uuid,'expire',$2,0,$3,'system',$4)
      ON CONFLICT(idempotency_key) DO NOTHING`,[userId,-amount,`expire:${row.id}`,`Expired Game Credit grant ${row.id}`]);
  }
}

export async function gameCreditWallet(db,userId){
  await ensureGameEconomySchema(db);
  await db.query('BEGIN');
  try{
    await expireGameCreditsInTx(db,userId);
    const row=(await db.query(`SELECT
      COALESCE(sum(remaining_cents),0)::int AS balance_cents,
      min(expires_at) FILTER (WHERE remaining_cents>0 AND expires_at IS NOT NULL) AS next_expiry_at
      FROM public.o2ol_game_credit_ledger
      WHERE user_id=$1::uuid AND kind IN ('signup_bonus','admin_grant','promo_grant')
        AND COALESCE(remaining_cents,0)>0 AND (expires_at IS NULL OR expires_at>now())`,[userId])).rows[0]||{};
    let nextExpiryCents=0;
    if(row.next_expiry_at){
      const n=(await db.query(`SELECT COALESCE(sum(remaining_cents),0)::int AS cents
        FROM public.o2ol_game_credit_ledger WHERE user_id=$1::uuid
        AND kind IN ('signup_bonus','admin_grant','promo_grant') AND remaining_cents>0 AND expires_at=$2`,
        [userId,row.next_expiry_at])).rows[0];
      nextExpiryCents=Number(n?.cents||0);
    }
    await db.query('COMMIT');
    return {balanceCents:Number(row.balance_cents||0),nextExpiryAt:row.next_expiry_at||null,nextExpiryCents};
  }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e;}
}

async function memberPromoContext(db,userId){
  const row=(await db.query(`SELECT COALESCE(timezone,'America/Chicago') AS timezone,created_at
    FROM public.users WHERE id=$1::uuid LIMIT 1`,[userId])).rows[0]||{};
  return {timezone:row.timezone||'America/Chicago',createdAt:row.created_at||null};
}
function localWeekday(now,timeZone){
  const short=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone}).format(now);
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(short);
}
function promoCoversGame(p,game){
  const g=p.games;
  if(g==='ALL')return true;
  if(Array.isArray(g))return g.includes(game);
  return false;
}
export async function resolveGamePromotion(db,userId,game,now=new Date()){
  await ensureGameEconomySchema(db);
  const ctx=await memberPromoContext(db,userId);
  let tz=ctx.timezone;
  try{new Intl.DateTimeFormat('en-US',{timeZone:tz}).format(now);}catch(_){tz='America/Chicago';}
  const promos=(await db.query(`SELECT * FROM public.o2ol_game_promotions WHERE active=true
    AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>=now())
    ORDER BY created_at ASC`)).rows;
  const eligible=promos.filter(p=>{
    if(!promoCoversGame(p.games,game))return false;
    if(p.audience==='new_members'&&ctx.createdAt&&p.starts_at&&new Date(ctx.createdAt)<new Date(p.starts_at))return false;
    if(p.recurrence==='weekly'&&Number(p.recurrence_day)!==localWeekday(now,tz))return false;
    return p.kind!=='credit_grant';
  });
  const free=eligible.find(p=>p.kind==='free_play'||(p.kind==='percent_off'&&Number(p.percent)>=100));
  if(free)return {id:free.id,name:free.name,kind:'free_play',free:true,percent:100,timezone:tz};
  const discounts=eligible.filter(p=>p.kind==='percent_off').sort((a,b)=>Number(b.percent||0)-Number(a.percent||0));
  if(discounts[0])return {id:discounts[0].id,name:discounts[0].name,kind:'percent_off',free:false,percent:Number(discounts[0].percent||0),timezone:tz};
  return null;
}

async function currentPrice(db,featureCode){
  const row=(await db.query(`SELECT token_cost FROM public.o2ol_token_feature_prices WHERE feature_code=$1 AND enabled=true LIMIT 1`,[featureCode])).rows[0];
  return Number(row?.token_cost||49);
}
async function allocateGameCreditInTx(db,userId,amount,game,idempotencyKey){
  let remaining=Math.max(0,Number(amount)||0),used=0;
  if(!remaining)return 0;
  await expireGameCreditsInTx(db,userId);
  const grants=(await db.query(`SELECT id,remaining_cents FROM public.o2ol_game_credit_ledger
    WHERE user_id=$1::uuid AND kind IN ('signup_bonus','admin_grant','promo_grant')
      AND COALESCE(remaining_cents,0)>0 AND (expires_at IS NULL OR expires_at>now())
    ORDER BY expires_at ASC NULLS LAST,created_at ASC FOR UPDATE`,[userId])).rows;
  for(const grant of grants){
    if(remaining<=0)break;
    const take=Math.min(remaining,Number(grant.remaining_cents||0));
    if(take<=0)continue;
    await db.query('UPDATE public.o2ol_game_credit_ledger SET remaining_cents=remaining_cents-$2 WHERE id=$1::uuid',[grant.id,take]);
    remaining-=take;used+=take;
  }
  if(used>0)await db.query(`INSERT INTO public.o2ol_game_credit_ledger
    (user_id,kind,amount_cents,remaining_cents,game,idempotency_key,actor,note)
    VALUES($1::uuid,'spend',$2,0,$3,$4,'system','Game session spend')
    ON CONFLICT(idempotency_key) DO NOTHING`,[userId,-used,game,`spend:${idempotencyKey}`]);
  return used;
}
async function paidBalanceInTx(db,userId){
  await db.query(`INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO NOTHING`,[userId]);
  const row=(await db.query('SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE',[userId])).rows[0];
  return Number(row?.balance||0);
}
async function debitPaidCreditInTx(db,userId,featureCode,amount,key,metadata){
  const cents=Math.max(0,Math.floor(Number(amount)||0));
  if(!cents)return {tokens:0,balance_after:await paidBalanceInTx(db,userId),transaction:null,id:null};
  const existing=(await db.query(`SELECT r.*,t.balance_after FROM public.o2ol_token_reservations r
    LEFT JOIN public.o2ol_token_transactions t ON t.id=r.transaction_id WHERE r.idempotency_key=$1 LIMIT 1`,[key])).rows[0];
  if(existing)return {...existing,tokens:Number(existing.tokens||0),reused:true};
  const balance=await paidBalanceInTx(db,userId);
  if(balance<cents)throw Object.assign(new Error('Add Credit To Access'),{status:402,code:'tokens_required',balance,required:cents,featureCode});
  const next=balance-cents;
  await db.query(`UPDATE public.o2ol_token_wallets SET balance=$1,lifetime_used=lifetime_used+$2,updated_at=now() WHERE user_id=$3::uuid`,[next,cents,userId]);
  const tx=(await db.query(`INSERT INTO public.o2ol_token_transactions
    (user_id,wallet_delta,balance_after,transaction_type,feature_code,idempotency_key,metadata)
    VALUES($1::uuid,$2,$3,'reserve',$4,$5,$6::jsonb) RETURNING *`,
    [userId,-cents,next,featureCode,key,JSON.stringify(metadata||{})])).rows[0];
  const reservation=(await db.query(`INSERT INTO public.o2ol_token_reservations
    (user_id,feature_code,tokens,idempotency_key,transaction_id,metadata,status,consumed_at)
    VALUES($1::uuid,$2,$3,$4,$5::uuid,$6::jsonb,'consumed',now()) RETURNING *`,
    [userId,featureCode,cents,key,tx.id,JSON.stringify(metadata||{})])).rows[0];
  return {...reservation,tokens:cents,balance_after:next,transaction:tx};
}

export async function chargeGameAndCreatePass(db,userId,game,requestId){
  await ensureGameEconomySchema(db);
  const def=gameDefinition(game);if(!def)throw Object.assign(new Error('This paid game is not available.'),{status:400,code:'game_invalid'});
  const key=`game:${game}:${userId}:${String(requestId||'').slice(0,120)}`;
  await db.query('BEGIN');
  try{
    const replay=(await db.query(`SELECT id,game,tokens_charged,started_at,expires_at,metadata,promotion_id,game_credit_cents,credit_cents,promo_free
      FROM public.o2ol_game_access_passes WHERE user_id=$1::uuid AND game=$2 AND metadata->>'charge_key'=$3 LIMIT 1`,
      [userId,game,key])).rows[0];
    if(replay){await db.query('COMMIT');return {pass:replay,reused:true,promotion:replay.promotion_id?{id:replay.promotion_id,free:replay.promo_free}:null,gameCreditCents:Number(replay.game_credit_cents||0),creditCents:Number(replay.credit_cents||0)};}
    const promo=await resolveGamePromotion(db,userId,game);
    const normal=await currentPrice(db,def.chargeFeatureCode);
    const price=promo?.free?0:promo?.kind==='percent_off'?Math.max(0,Math.round(normal*(100-Math.max(0,Math.min(100,promo.percent)))/100)):normal;
    let gameCreditCents=0,creditCents=0,paid=null;
    if(price>0){
      const gc=(await db.query(`SELECT COALESCE(sum(remaining_cents),0)::int AS cents FROM public.o2ol_game_credit_ledger
        WHERE user_id=$1::uuid AND kind IN ('signup_bonus','admin_grant','promo_grant') AND remaining_cents>0 AND (expires_at IS NULL OR expires_at>now())`,[userId])).rows[0];
      const gcAvail=Number(gc?.cents||0);
      const paidAvail=await paidBalanceInTx(db,userId);
      if(gcAvail+paidAvail<price)throw Object.assign(new Error('Add Credit To Access'),{status:402,code:'tokens_required',balance:gcAvail+paidAvail,required:price,shortfall:price-gcAvail-paidAvail,gameCreditBalance:gcAvail,creditBalance:paidAvail,featureCode:def.chargeFeatureCode});
      gameCreditCents=await allocateGameCreditInTx(db,userId,Math.min(price,gcAvail),game,key);
      creditCents=price-gameCreditCents;
      paid=await debitPaidCreditInTx(db,userId,def.chargeFeatureCode,creditCents,`paid:${key}`,{game,request_id:requestId,promotion_id:promo?.id||null});
    }
    const expiresAt=new Date(Date.now()+120*60*1000).toISOString();
    const pass=(await db.query(`INSERT INTO public.o2ol_game_access_passes
      (user_id,game,token_transaction_id,tokens_charged,status,expires_at,metadata,promotion_id,game_credit_cents,credit_cents,promo_free)
      VALUES($1::uuid,$2,$3::uuid,$4,'active',$5,$6::jsonb,$7::uuid,$8,$9,$10)
      RETURNING id,game,tokens_charged,started_at,expires_at,metadata,promotion_id,game_credit_cents,credit_cents,promo_free`,
      [userId,game,paid?.transaction?.id||paid?.transaction_id||null,creditCents,expiresAt,JSON.stringify({request_id:requestId,charge_key:key,normal_price_cents:normal,charged_price_cents:price}),promo?.id||null,gameCreditCents,creditCents,Boolean(promo?.free)])).rows[0];
    await db.query('COMMIT');
    return {pass,promotion:promo,gameCreditCents,creditCents,priceCents:price,normalPriceCents:normal};
  }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e;}
}

export async function gameLeaderboard(db,userId,game){
  await ensureGameEconomySchema(db);
  const def=gameDefinition(game);if(!def||!def.leaderboard)return {game,enabled:false,rows:[]};
  const rows=(await db.query(`WITH best AS (
      SELECT DISTINCT ON (s.user_id) s.user_id,s.score,s.created_at
      FROM public.o2ol_game_scores s WHERE s.game=$1
      ORDER BY s.user_id,s.score DESC,s.created_at ASC
    )
    SELECT b.user_id,b.score,b.created_at,split_part(COALESCE(NULLIF(u.name,''),NULLIF(u.username,''),'Member'),' ',1) AS first_name
    FROM best b JOIN public.users u ON u.id=b.user_id
    ORDER BY b.score DESC,b.created_at ASC LIMIT 5`,[game])).rows;
  return {game,enabled:true,scoreLabel:def.scoreLabel,rows:rows.map((r,i)=>({rank:i+1,firstName:r.first_name,score:Number(r.score),isViewer:String(r.user_id)===String(userId)}))};
}
export async function submitGameScore(db,userId,game,score,sessionRef){
  await ensureGameEconomySchema(db);
  const def=gameDefinition(game);if(!def||!def.leaderboard)throw Object.assign(new Error('Leaderboard is not enabled for this game.'),{status:400,code:'leaderboard_disabled'});
  const value=Math.floor(Number(score));if(!Number.isFinite(value)||value<0||value>Number(def.scoreCap))throw Object.assign(new Error('Score is outside the accepted range.'),{status:400,code:'score_invalid'});
  const ref=String(sessionRef||'').trim();if(!ref)throw Object.assign(new Error('A play session is required.'),{status:400,code:'session_required'});
  const session=(await db.query(`SELECT id FROM public.o2ol_game_access_passes WHERE id::text=$1 AND user_id=$2::uuid AND game=$3
    AND started_at>=now()-interval '6 hours' LIMIT 1`,[ref,userId,game])).rows[0];
  if(!session)throw Object.assign(new Error('Score is not bound to a valid recent play session.'),{status:409,code:'session_invalid'});
  const row=(await db.query(`INSERT INTO public.o2ol_game_scores(user_id,game,score,session_ref)
    VALUES($1::uuid,$2,$3,$4) ON CONFLICT(user_id,game,session_ref) DO NOTHING RETURNING *`,[userId,game,value,ref])).rows[0];
  if(!row)throw Object.assign(new Error('A score was already submitted for this play session.'),{status:409,code:'score_already_submitted'});
  return row;
}

export async function adminGrantGameCredit(db,adminId,input){
  await ensureGameEconomySchema(db);
  const userId=String(input?.userId||''),amount=Math.floor(Number(input?.amountCents||0)),days=Math.floor(Number(input?.expiryDays||0));
  if(amount<=0||amount>10000)throw Object.assign(new Error('Grant amount must be between 1 and 10000 cents.'),{status:400,code:'invalid_amount'});
  if(days<=0||days>3650)throw Object.assign(new Error('Expiry days must be between 1 and 3650.'),{status:400,code:'invalid_expiry'});
  const key=String(input?.idempotencyKey||`admin_grant:${adminId}:${userId}:${crypto.randomUUID()}`);
  await db.query(`INSERT INTO public.o2ol_game_credit_ledger(user_id,kind,amount_cents,remaining_cents,idempotency_key,expires_at,actor,note)
    VALUES($1::uuid,'admin_grant',$2,$2,$3,now()+($4||' days')::interval,$5,$6)`,[userId,amount,key,String(days),String(adminId),String(input?.note||'').slice(0,500)]);
  return gameCreditWallet(db,userId);
}
export async function gameEconomyAdminSummary(db){
  await ensureGameEconomySchema(db);
  const totals=(await db.query(`SELECT
    COALESCE(sum(amount_cents) FILTER (WHERE kind IN ('signup_bonus','admin_grant','promo_grant')),0)::int AS issued,
    COALESCE(-sum(amount_cents) FILTER (WHERE kind='spend'),0)::int AS used,
    COALESCE(-sum(amount_cents) FILTER (WHERE kind='expire'),0)::int AS expired,
    COALESCE(sum(remaining_cents) FILTER (WHERE kind IN ('signup_bonus','admin_grant','promo_grant') AND (expires_at IS NULL OR expires_at>now())),0)::int AS remaining
    FROM public.o2ol_game_credit_ledger`)).rows[0];
  const promotions=(await db.query(`SELECT p.*,
    count(DISTINCT a.user_id)::int AS players,count(a.id)::int AS plays
    FROM public.o2ol_game_promotions p LEFT JOIN public.o2ol_game_access_passes a ON a.promotion_id=p.id
    GROUP BY p.id ORDER BY p.created_at DESC`)).rows;
  const perGame=(await db.query(`SELECT promotion_id,game,count(*)::int AS plays FROM public.o2ol_game_access_passes
    WHERE promotion_id IS NOT NULL GROUP BY promotion_id,game`)).rows;
  return {totals:{issued:Number(totals?.issued||0),used:Number(totals?.used||0),expired:Number(totals?.expired||0),remaining:Number(totals?.remaining||0)},promotions:promotions.map(p=>({...p,players:Number(p.players||0),plays:Number(p.plays||0),perGame:perGame.filter(g=>String(g.promotion_id)===String(p.id)).map(g=>({game:g.game,plays:Number(g.plays||0)}))}))};
}
