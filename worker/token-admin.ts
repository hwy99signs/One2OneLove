// @ts-nocheck
import {Client} from 'pg';
import {getVerifiedAdminMfaIdentity} from './admin-mfa';

const HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store',
  'x-content-type-options':'nosniff',
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:HEADERS});}
function fail(message,status=400,code='bad_request'){return json({ok:false,error:{code,message}},status);}

async function session(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie||!env.NEON_AUTH_BASE_URL)return null;
  const endpoint=env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session';
  for(let attempt=0;attempt<3;attempt+=1){
    const response=await fetch(endpoint,{headers:{cookie,accept:'application/json'}});
    if(response.ok){
      const payload=await response.json().catch(()=>null);
      const user=payload?.user??payload?.data?.user??null;
      const active=payload?.session??payload?.data?.session??null;
      return user?.id&&user?.emailVerified===true&&active?{user,session:active}:null;
    }
    if(![429,500,502,503,504].includes(response.status)||attempt===2)return null;
    await new Promise(resolve=>setTimeout(resolve,200*(attempt+1)));
  }
  return null;
}

async function withDb(env,fn){
  if(!env.HYPERDRIVE?.connectionString)throw Object.assign(new Error('Token dashboard database connection is not configured.'),{status:503,code:'database_not_configured'});
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try{return await fn(db);}finally{await db.end();}
}

async function adminIdentity(db,userId){
  const row=(await db.query(
    `SELECT id,email,name,role,COALESCE(banned,false) AS banned
       FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,
    [userId],
  )).rows[0]||null;
  return row&&row.role==='admin'&&!row.banned?row:null;
}

async function tokenDashboard(db){
  const [
    summary,packages,featurePrices,featureEconomics,wallets,transactions,reservations,
    founders,founderSummary,calibrations,conversionQuotes,legacySummary,gameSummary,systemCounts
  ]=await Promise.all([
    db.query(`
      SELECT
        count(*) FILTER (WHERE COALESCE(a.role,'user')<>'admin')::int AS wallet_count,
        COALESCE(sum(w.balance) FILTER (WHERE COALESCE(a.role,'user')<>'admin'),0)::bigint AS outstanding_tokens,
        COALESCE(sum(w.lifetime_purchased) FILTER (WHERE COALESCE(a.role,'user')<>'admin'),0)::bigint AS lifetime_purchased,
        COALESCE(sum(w.lifetime_used) FILTER (WHERE COALESCE(a.role,'user')<>'admin'),0)::bigint AS lifetime_used,
        COALESCE(sum(w.lifetime_granted) FILTER (WHERE COALESCE(a.role,'user')<>'admin'),0)::bigint AS lifetime_granted,
        (SELECT count(*)::int FROM public.o2ol_auto_replenish_settings s LEFT JOIN neon_auth."user" au ON au.id=s.user_id WHERE s.enabled=true AND COALESCE(au.role,'user')<>'admin') AS auto_replenish_enabled,
        (SELECT count(*)::int FROM public.o2ol_token_transactions t LEFT JOIN neon_auth."user" au ON au.id=t.user_id WHERE t.created_at>=now()-interval '30 days' AND COALESCE(au.role,'user')<>'admin') AS transactions_30d,
        (SELECT COALESCE(sum(t.amount_cents),0)::bigint FROM public.o2ol_token_transactions t LEFT JOIN neon_auth."user" au ON au.id=t.user_id WHERE t.created_at>=now()-interval '30 days' AND t.transaction_type IN ('purchase','auto_replenish') AND COALESCE(au.role,'user')<>'admin') AS token_revenue_cents_30d,
        (SELECT COALESCE(sum(c.provider_cost_micros),0)::bigint FROM public.o2ol_cost_events c LEFT JOIN neon_auth."user" au ON au.id=c.user_id WHERE c.created_at>=now()-interval '30 days' AND COALESCE(au.role,'user')<>'admin') AS provider_cost_micros_30d,
        (SELECT COALESCE(sum(c.customer_tokens_charged),0)::bigint FROM public.o2ol_cost_events c LEFT JOIN neon_auth."user" au ON au.id=c.user_id WHERE c.created_at>=now()-interval '30 days' AND COALESCE(au.role,'user')<>'admin') AS tokens_charged_30d
      FROM public.o2ol_token_wallets w
      LEFT JOIN neon_auth."user" a ON a.id=w.user_id
    `),
    db.query(`SELECT code,label,tokens,amount_cents,active,calibration_only,display_order,updated_at FROM public.o2ol_token_packages ORDER BY display_order,amount_cents`),
    db.query(`SELECT feature_code,label,token_cost,pricing_unit,active,calibration_only,metadata,updated_at FROM public.o2ol_token_feature_prices ORDER BY feature_code`),
    db.query(`
      SELECT c.feature_code,c.provider,c.provider_product,
             count(*)::int AS events,count(DISTINCT c.user_id)::int AS users,
             COALESCE(sum(c.customer_tokens_charged),0)::bigint AS tokens_charged,
             COALESCE(sum(c.provider_cost_micros),0)::bigint AS provider_cost_micros,
             COALESCE(sum(c.input_characters),0)::bigint AS input_characters,
             COALESCE(sum(c.output_characters),0)::bigint AS output_characters,
             COALESCE(sum(c.provider_input_units),0)::bigint AS provider_input_units,
             COALESCE(sum(c.provider_output_units),0)::bigint AS provider_output_units,
             max(c.created_at) AS last_event
        FROM public.o2ol_cost_events c
        LEFT JOIN neon_auth."user" a ON a.id=c.user_id
       WHERE c.created_at>=now()-interval '30 days' AND COALESCE(a.role,'user')<>'admin'
       GROUP BY c.feature_code,c.provider,c.provider_product
       ORDER BY provider_cost_micros DESC NULLS LAST,c.feature_code
    `),
    db.query(`
      SELECT w.user_id,u.email,u.name,w.balance,w.lifetime_purchased,w.lifetime_used,w.lifetime_granted,w.created_at,w.updated_at,
             COALESCE(s.enabled,false) AS auto_replenish_enabled,s.package_code AS auto_package,s.trigger_balance,
             f.founding_number,f.cohort AS founding_cohort,f.status AS founding_status
        FROM public.o2ol_token_wallets w
        LEFT JOIN public.users u ON u.id=w.user_id
        LEFT JOIN neon_auth."user" a ON a.id=w.user_id
        LEFT JOIN public.o2ol_auto_replenish_settings s ON s.user_id=w.user_id
        LEFT JOIN public.founding_members f ON f.user_id=w.user_id
       WHERE COALESCE(a.role,'user')<>'admin'
       ORDER BY w.balance DESC,w.updated_at DESC LIMIT 200
    `),
    db.query(`
      SELECT t.id,t.user_id,u.email,t.wallet_delta,t.balance_after,t.transaction_type,t.feature_code,t.package_code,
             t.amount_cents,t.provider,t.provider_reference,t.metadata,t.created_at
        FROM public.o2ol_token_transactions t
        LEFT JOIN public.users u ON u.id=t.user_id
        LEFT JOIN neon_auth."user" a ON a.id=t.user_id
       WHERE COALESCE(a.role,'user')<>'admin'
       ORDER BY t.created_at DESC LIMIT 200
    `),
    db.query(`
      SELECT r.status,count(*)::int AS count,COALESCE(sum(r.tokens),0)::bigint AS tokens
        FROM public.o2ol_token_reservations r
        LEFT JOIN neon_auth."user" a ON a.id=r.user_id
       WHERE COALESCE(a.role,'user')<>'admin'
       GROUP BY r.status ORDER BY r.status
    `),
    db.query(`
      SELECT f.user_id,u.email,u.name,f.founding_number,f.cohort,f.status,f.badge_retained,f.reservation_expires_at,f.activated_at,
             b.monthly_tokens,b.months_total,b.months_granted,b.next_grant_at,b.status AS benefit_status,b.metadata AS benefit_metadata
        FROM public.founding_members f
        LEFT JOIN public.users u ON u.id=f.user_id
        LEFT JOIN public.o2ol_founding_token_benefits b ON b.user_id=f.user_id
       ORDER BY f.founding_number LIMIT 200
    `),
    db.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE status='reserved')::int AS reserved,
             count(*) FILTER (WHERE status='active')::int AS active,
             count(*) FILTER (WHERE status='cancelled')::int AS cancelled,
             count(*) FILTER (WHERE founding_number<=100)::int AS first100,
             count(*) FILTER (WHERE founding_number>100)::int AS second100
        FROM public.founding_members
    `),
    db.query(`
      SELECT s.id,s.user_id,COALESCE(u.email,a.email) AS email,s.feature_code,s.package_code,s.starting_balance,s.ending_balance,
             s.notes,s.started_at,s.ended_at,
             COALESCE(sum(c.provider_cost_micros),0)::bigint AS provider_cost_micros,
             COALESCE(sum(c.customer_tokens_charged),0)::bigint AS customer_tokens_charged,
             count(c.id)::int AS cost_events
        FROM public.o2ol_calibration_sessions s
        LEFT JOIN public.users u ON u.id=s.user_id
        LEFT JOIN neon_auth."user" a ON a.id=s.user_id
        LEFT JOIN public.o2ol_cost_events c ON c.calibration_session_id=s.id
       GROUP BY s.id,u.email,a.email
       ORDER BY s.started_at DESC LIMIT 100
    `),
    db.query(`
      SELECT q.id,q.user_id,u.email,q.stripe_subscription_id,q.old_plan,q.period_start,q.period_end,q.amount_paid_cents,
             q.unused_value_cents,q.token_value_micros,q.proposed_tokens,q.status,q.calculation,q.created_at,q.applied_at
        FROM public.o2ol_subscription_conversion_quotes q
        LEFT JOIN public.users u ON u.id=q.user_id
       ORDER BY q.created_at DESC LIMIT 200
    `),
    db.query(`
      SELECT
        count(*) FILTER (WHERE u.stripe_subscription_id IS NOT NULL)::int AS stripe_linked_accounts,
        count(*) FILTER (WHERE u.stripe_subscription_id IS NOT NULL AND lower(COALESCE(u.subscription_status,'')) IN ('active','trial','trialing','past_due'))::int AS legacy_active_records,
        count(*) FILTER (WHERE COALESCE(u.subscription_plan,'Free')='Free')::int AS free_account_records
      FROM public.users u
      LEFT JOIN neon_auth."user" a ON a.id=u.id
      WHERE COALESCE(a.role,'user')<>'admin'
    `),
    db.query(`
      SELECT game,status,count(*)::int AS passes,COALESCE(sum(tokens_charged),0)::bigint AS tokens_charged
        FROM public.o2ol_game_access_passes GROUP BY game,status ORDER BY game,status
    `),
    db.query(`
      SELECT
        (SELECT count(*) FROM public.o2ol_token_packages WHERE active)::int AS active_packages,
        (SELECT count(*) FROM public.o2ol_token_feature_prices WHERE active)::int AS active_metered_features,
        (SELECT count(*) FROM public.o2ol_cost_events)::int AS cost_events,
        (SELECT count(*) FROM public.o2ol_calibration_sessions)::int AS calibration_sessions,
        (SELECT count(*) FROM public.o2ol_subscription_conversion_quotes)::int AS conversion_quotes,
        (SELECT count(*) FROM public.o2ol_game_access_passes)::int AS game_passes
    `)
  ]);

  return {
    summary:summary.rows[0]||{},
    packages:packages.rows,
    featurePrices:featurePrices.rows,
    featureEconomics:featureEconomics.rows,
    wallets:wallets.rows,
    transactions:transactions.rows,
    reservations:reservations.rows,
    founders:founders.rows,
    founderSummary:founderSummary.rows[0]||{},
    calibrations:calibrations.rows,
    conversionQuotes:conversionQuotes.rows,
    legacySummary:legacySummary.rows[0]||{},
    gameSummary:gameSummary.rows,
    systemCounts:systemCounts.rows[0]||{},
  };
}

async function adjustTokens(db,admin,userId,rawDelta,reason=''){
  const delta=Number.parseInt(String(rawDelta),10);
  if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000000){
    throw Object.assign(new Error('Token adjustment must be a non-zero whole number between -1,000,000 and 1,000,000.'),{status:400,code:'invalid_token_adjustment'});
  }
  const safeReason=String(reason||'').trim().slice(0,500);
  if(!safeReason)throw Object.assign(new Error('A reason is required for every Token adjustment.'),{status:400,code:'reason_required'});

  await db.query('BEGIN');
  try{
    const target=(await db.query(`SELECT id,email,role FROM neon_auth."user" WHERE id=$1::uuid FOR UPDATE`,[userId])).rows[0]||null;
    if(!target)throw Object.assign(new Error('Member not found.'),{status:404,code:'member_not_found'});
    if(target.role==='admin'||target.id===admin.id)throw Object.assign(new Error('Administrator wallets cannot be adjusted.'),{status:403,code:'protected_admin_wallet'});
    await db.query(`INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO NOTHING`,[userId]);
    const wallet=(await db.query(`SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE`,[userId])).rows[0];
    const next=Number(wallet.balance||0)+delta;
    if(next<0)throw Object.assign(new Error('Adjustment would make the wallet balance negative.'),{status:409,code:'insufficient_wallet_balance'});

    await db.query(
      `UPDATE public.o2ol_token_wallets
          SET balance=$1,lifetime_granted=lifetime_granted+$2,updated_at=now()
        WHERE user_id=$3::uuid`,
      [next,delta>0?delta:0,userId],
    );
    const tx=(await db.query(
      `INSERT INTO public.o2ol_token_transactions
        (user_id,wallet_delta,balance_after,transaction_type,provider,metadata)
       VALUES($1::uuid,$2,$3,'admin_adjustment','token_admin',$4::jsonb)
       RETURNING id,wallet_delta,balance_after,transaction_type,created_at`,
      [userId,delta,next,JSON.stringify({admin_id:admin.id,admin_email:admin.email,reason:safeReason})],
    )).rows[0];
    await db.query('COMMIT');
    return {userId,email:target.email,balance:next,transaction:tx};
  }catch(error){
    await db.query('ROLLBACK').catch(()=>{});
    throw error;
  }
}

export async function handleTokenAdminRequest(request,env,url){
  if(!url.pathname.startsWith('/api/token-admin'))return null;

  const auth=await session(request,env);
  const mfaFallback=auth?null:await getVerifiedAdminMfaIdentity(request,env);
  if(!auth&&!mfaFallback)return fail('Authentication required.',401,'unauthorized');

  try{
    return await withDb(env,async db=>{
      const admin=mfaFallback?.admin||await adminIdentity(db,auth.user.id);
      if(!admin)return fail('Administrator access required.',403,'forbidden');

      if(request.method==='GET'&&url.pathname==='/api/token-admin/dashboard'){
        const data=await tokenDashboard(db);
        return json({ok:true,mode:'token_system_dashboard',generatedAt:new Date().toISOString(),admin:{id:admin.id,email:admin.email,name:admin.name},...data});
      }

      const walletMatch=url.pathname.match(/^\/api\/token-admin\/wallets\/([0-9a-f-]{36})\/adjust$/i);
      if(request.method==='POST'&&walletMatch){
        const body=await request.json().catch(()=>({}));
        const result=await adjustTokens(db,admin,walletMatch[1],body?.delta,body?.reason);
        return json({ok:true,...result});
      }

      if(!['GET','POST'].includes(request.method))return fail('Method not allowed.',405,'method_not_allowed');
      return fail('Token Admin route not found.',404,'not_found');
    });
  }catch(error){
    console.error('O2OL Token Admin API error',error);
    return fail(error?.message||'Unable to process Token Admin request.',error?.status||500,error?.code||'token_admin_error');
  }
}
