// @ts-nocheck
import { Client } from 'pg';
import { SWEEP_CTES, SWEEP_EVENT_FILTER } from './sweep-exclusion.js';
import { getVerifiedAdminMfaIdentity } from './admin-mfa';

// Registered Free (unified 2026-10-10, owner scrub): a member is Registered
// Free exactly when they hold no active paid subscription status. This one
// predicate is used identically by the overview counts, the plan breakdown,
// the member list, and the visitor-funnel count — the four places that
// previously carried three conflicting definitions.
const REGISTERED_FREE_SQL = (alias) => `lower(COALESCE(${alias}.subscription_status,'inactive')) NOT IN ('active','trial','trialing','past_due')`;

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const FEATURE_CATALOG = [
  ['Love Notes', 'Love Notes'],
  ['Love Note Scheduler', 'Love Notes'],
  ['Date Ideas', 'Relationship Tools'],
  ['Relationship Quizzes', 'Relationship Tools'],
  ['Love Language Quiz', 'Relationship Tools'],
  ['Anniversary Tracker', 'Relationship Tools'],
  ['Memory Lane', 'Relationship Tools'],
  ['Relationship Goals', 'Relationship Tools'],
  ['Couples Calendar', 'Relationship Tools'],
  ['Shared Journals', 'Relationship Tools'],
  ['Relationship Milestones', 'Relationship Tools'],
  ['Couples Profile', 'Relationship Tools'],
  ['Couples Dashboard', 'Relationship Tools'],
  ['Relationship Games', 'Relationship Tools'],
  ['What Should They Do?', 'Relationship Games'],
  ['Scratch Game', 'Relationship Games'],
  ['Like Minded?', 'Relationship Games'],
  ['Relationship Support', 'Support & Content'],
  ['Communication Practice', 'Support & Content'],
  ['Podcasts', 'Support & Content'],
  ['Articles', 'Support & Content'],
  ['LGBTQ+ Support', 'Support & Content'],
  ['Couple Activities', 'Support & Content'],
  ['Community Chat', 'Community'],
  ['Invite & Share', 'Growth'],
  ['Member Profile', 'Account'],
  ['Subscription / Billing', 'Account'],
  ['O2OL Studio', 'Media'],
  ['MyMatchIQ', 'MyMatchIQ'],
  ['Reviews', 'Growth'],
  ['Suggestions', 'Growth'],
  ['Professionals', 'Professional'],
  ['Professional Onboarding', 'Professional'],
  ['Account Verification', 'Account'],
  ['Win A Cruise', 'Growth'],
  ['AI Content Creator', 'AI'],
  ['Relationship Coach', 'AI'],
  ['Gamification', 'Engagement'],
  ['Find Friends', 'Community'],
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

function canonicalAdminPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'premier' || raw === 'premiere' || raw === 'basic') return 'Premiere';
  if (raw === 'exclusive') return 'Exclusive';
  return null;
}

function adminPlanPrice(plan) {
  return plan === 'Exclusive' ? 19.99 : 9.99;
}

function adminPlanRank(plan) {
  return plan === 'Exclusive' ? 2 : 1;
}

function adminPriceId(env, plan) {
  return plan === 'Exclusive' ? (env.STRIPE_PRICE_EXCLUSIVE || null) : (env.STRIPE_PRICE_PREMIERE || null);
}

async function stripeRequest(env, method, path, params = null) {
  if (!env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Payment processing is not configured.'), { status: 503, code: 'billing_not_configured' });
  const headers = { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, accept: 'application/json' };
  let body;
  if (params) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    body = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  }
  const response = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(payload?.error?.message || 'Stripe request failed.'), { status: 502, code: payload?.error?.code || 'stripe_error' });
  return payload;
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const endpoint = env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(endpoint, { headers: { cookie, accept: 'application/json' } });
    if (response.ok) {
      const payload = await response.json().catch(() => null);
      const user = payload?.user ?? payload?.data?.user ?? null;
      const active = payload?.session ?? payload?.data?.session ?? null;
      return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
    }
    if (![429,500,502,503,504].includes(response.status) || attempt === 2) return null;
    await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
  }
  return null;
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function adminIdentity(db, userId) {
  const result = await db.query(
    `SELECT id,email,name,role,COALESCE(banned,false) AS banned
       FROM neon_auth."user"
      WHERE id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0] || null;
  if (!row || row.role !== 'admin' || row.banned) return null;
  return row;
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

async function ensureChatModerationSchema(db) {
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.chat_room_topics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
      creator_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      title text NOT NULL,
      is_locked boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await ensureDdl(db, `
    ALTER TABLE public.chat_room_messages
    ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.chat_room_topics(id) ON DELETE SET NULL
  `);
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.chat_room_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
      message_id uuid NOT NULL REFERENCES public.chat_room_messages(id) ON DELETE CASCADE,
      reporter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      reported_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
      reason text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      reviewed_at timestamptz,
      reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
      UNIQUE(message_id, reporter_id)
    )
  `);
}


const RELATIONSHIP_100_QUESTIONS = [
  ['money','Money'],
  ['religion','Religion'],
  ['sex_intimacy','Sex / Intimacy'],
  ['politics','Politics'],
  ['family','Family'],
  ['communication','Communication'],
  ['looks_physical_appearance','Looks / Physical appearance'],
  ['therapy_when_needed','Therapy when needed'],
  ['help_around_home','Help around the home'],
];

const O2OL_SHOW_TOPIC = {
  slug:'relationship-100',
  title:'Relationship 100 — What Matters Most in Your Relationship?',
};

async function ensureO2OLShowVotingSchema(db) {
  await ensureDdl(db, `
    CREATE TABLE IF NOT EXISTS public.o2ol_show_vote_responses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_slug text NOT NULL,
      topic_title text NOT NULL,
      respondent_identity text,
      partner_identity text,
      relationship_priorities jsonb NOT NULL DEFAULT '{}'::jsonb,
      expense_split jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await ensureDdl(db, `
    CREATE INDEX IF NOT EXISTS idx_o2ol_show_votes_topic_created
      ON public.o2ol_show_vote_responses(topic_slug,created_at DESC)
  `);
}

function canonicalIdentity(value, allowNotPartnered=false) {
  const raw=String(value||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  if (raw==='man' || raw==='male') return 'Man';
  if (raw==='woman' || raw==='female') return 'Woman';
  if (raw==='nonbinary' || raw==='non_binary' || raw==='non-binary') return 'Nonbinary';
  if (raw==='prefer_not_to_say' || raw==='prefer_not' || raw==='private') return 'Prefer not to say';
  if (allowNotPartnered && ['not_currently_partnered','not_partnered','single','none'].includes(raw)) return 'Not currently partnered';
  return null;
}

function identityBreakdown(rows, allowNotPartnered=false) {
  const labels = allowNotPartnered
    ? ['Man','Woman','Nonbinary','Prefer not to say','Not currently partnered']
    : ['Man','Woman','Nonbinary','Prefer not to say'];
  const counts = Object.fromEntries(labels.map(label=>[label,0]));
  for (const row of rows || []) {
    const label=canonicalIdentity(row.value,allowNotPartnered);
    if (label) counts[label]+=Number(row.count||0);
  }
  const total=Object.values(counts).reduce((sum,value)=>sum+value,0);
  return labels.map(label=>({
    label,
    count:counts[label],
    percentage:total ? Math.round((counts[label]*1000)/total)/10 : 0,
  }));
}

async function chatRoomAnalytics(db) {
  const voteSummaryResult = await db.query(`
    WITH ballots AS (
      SELECT *,
        (COALESCE(NULLIF(relationship_priorities->>'money','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'religion','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'sex_intimacy','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'politics','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'family','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'communication','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'looks_physical_appearance','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'therapy_when_needed','')::numeric,0)
        + COALESCE(NULLIF(relationship_priorities->>'help_around_home','')::numeric,0)) AS ballot_total
      FROM public.o2ol_show_vote_responses
      WHERE topic_slug=$1
    )
    SELECT
      count(*) FILTER (WHERE ballot_total BETWEEN 99 AND 101)::int AS total_responses,
      count(*) FILTER (WHERE NOT (ballot_total BETWEEN 99 AND 101))::int AS excluded_responses,
      max(topic_title) AS topic_title,
      max(created_at) AS last_response_at,
      round(avg(NULLIF(relationship_priorities->>'money','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS money,
      round(avg(NULLIF(relationship_priorities->>'religion','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS religion,
      round(avg(NULLIF(relationship_priorities->>'sex_intimacy','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS sex_intimacy,
      round(avg(NULLIF(relationship_priorities->>'politics','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS politics,
      round(avg(NULLIF(relationship_priorities->>'family','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS family,
      round(avg(NULLIF(relationship_priorities->>'communication','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS communication,
      round(avg(NULLIF(relationship_priorities->>'looks_physical_appearance','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS looks_physical_appearance,
      round(avg(NULLIF(relationship_priorities->>'therapy_when_needed','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS therapy_when_needed,
      round(avg(NULLIF(relationship_priorities->>'help_around_home','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS help_around_home,
      round(avg(NULLIF(expense_split->>'man','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS bills_man,
      round(avg(NULLIF(expense_split->>'woman','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),1) AS bills_woman,
      COALESCE(sum(NULLIF(relationship_priorities->>'money','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_money,
      COALESCE(sum(NULLIF(relationship_priorities->>'religion','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_religion,
      COALESCE(sum(NULLIF(relationship_priorities->>'sex_intimacy','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_sex_intimacy,
      COALESCE(sum(NULLIF(relationship_priorities->>'politics','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_politics,
      COALESCE(sum(NULLIF(relationship_priorities->>'family','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_family,
      COALESCE(sum(NULLIF(relationship_priorities->>'communication','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_communication,
      COALESCE(sum(NULLIF(relationship_priorities->>'looks_physical_appearance','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_looks_physical_appearance,
      COALESCE(sum(NULLIF(relationship_priorities->>'therapy_when_needed','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_therapy_when_needed,
      COALESCE(sum(NULLIF(relationship_priorities->>'help_around_home','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_help_around_home,
      COALESCE(sum(NULLIF(expense_split->>'man','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_bills_man,
      COALESCE(sum(NULLIF(expense_split->>'woman','')::numeric) FILTER (WHERE ballot_total BETWEEN 99 AND 101),0) AS sum_bills_woman
    FROM ballots
  `,[O2OL_SHOW_TOPIC.slug]);
  const voteSummary=voteSummaryResult.rows[0]||{};

  const [respondentIdentityRows,partnerIdentityRows,conversationRows] = await Promise.all([
    db.query(`
      SELECT respondent_identity AS value,count(*)::int AS count
      FROM public.o2ol_show_vote_responses
      WHERE topic_slug=$1 AND respondent_identity IS NOT NULL
      GROUP BY respondent_identity
    `,[O2OL_SHOW_TOPIC.slug]),
    db.query(`
      SELECT partner_identity AS value,count(*)::int AS count
      FROM public.o2ol_show_vote_responses
      WHERE topic_slug=$1 AND partner_identity IS NOT NULL
      GROUP BY partner_identity
    `,[O2OL_SHOW_TOPIC.slug]),
    db.query(`
      WITH base_rooms AS (
        SELECT
          'room:'||r.slug AS line_key,
          r.name AS topic,
          'Room'::text AS kind,
          count(m.id) FILTER (
            WHERE m.is_deleted=false
              AND m.moderation_status='approved'
              AND m.topic_id IS NULL
          )::int AS comments,
          r.created_at
        FROM public.chat_rooms r
        LEFT JOIN public.chat_room_messages m ON m.room_id=r.id
        WHERE r.is_active=true
        GROUP BY r.id,r.slug,r.name,r.created_at
      ),
      topic_rows AS (
        SELECT
          'topic:'||t.id::text AS line_key,
          t.title AS topic,
          r.name AS kind,
          count(m.id) FILTER (
            WHERE m.is_deleted=false
              AND m.moderation_status='approved'
          )::int AS comments,
          t.created_at
        FROM public.chat_room_topics t
        JOIN public.chat_rooms r ON r.id=t.room_id
        LEFT JOIN public.chat_room_messages m ON m.topic_id=t.id
        WHERE r.is_active=true
        GROUP BY t.id,t.title,t.created_at,r.name
      )
      SELECT line_key,topic,kind,comments,created_at
      FROM (
        SELECT * FROM base_rooms
        UNION ALL
        SELECT * FROM topic_rows
      ) lines
      ORDER BY created_at DESC,topic ASC
    `),
  ]);

  const conversations=conversationRows.rows.map(row=>({
    key:row.line_key,
    topic:row.topic,
    source:row.kind,
    comments:Number(row.comments||0),
    createdAt:row.created_at||null,
  }));
  const relationship100=RELATIONSHIP_100_QUESTIONS.map(([key,label],index)=>({
    number:index+1,
    key,
    label,
    average:Number(voteSummary[key]||0),
  }));
  const demographics={
    respondentIdentity:identityBreakdown(respondentIdentityRows.rows,false),
    partnerIdentity:identityBreakdown(partnerIdentityRows.rows,true),
  };
  const rawRelationshipTotals=Object.fromEntries(
    RELATIONSHIP_100_QUESTIONS.map(([key])=>[key,Number(voteSummary['sum_'+key]||0)])
  );
  const chatComments=Number(conversations.find(row=>row.key==='room:'+O2OL_SHOW_TOPIC.slug)?.comments||0);
  const platformMeta=[
    ['o2ol-chat-room','O2OL Chat Room'],
    ['facebook','Facebook'],
    ['instagram','Instagram'],
    ['threads','Threads'],
    ['tiktok','TikTok'],
    ['x','X'],
    ['youtube','YouTube'],
    ['pinterest','Pinterest'],
    ['linkedin','LinkedIn'],
  ];
  const platforms=platformMeta.map(([id,label])=>{
    const isChat=id==='o2ol-chat-room';
    return {
      id,label,
      connected:isChat,
      validResponses:isChat?Number(voteSummary.total_responses||0):0,
      excludedResponses:isChat?Number(voteSummary.excluded_responses||0):0,
      excludedReasons:[],
      commentCount:isChat?chatComments:0,
      lastUpdated:isChat?(voteSummary.last_response_at||null):null,
      rawTotals:{
        relationship100:isChat?rawRelationshipTotals:Object.fromEntries(RELATIONSHIP_100_QUESTIONS.map(([key])=>[key,0])),
        expenseSplit:{
          man:isChat?Number(voteSummary.sum_bills_man||0):0,
          woman:isChat?Number(voteSummary.sum_bills_woman||0):0,
        },
      },
      relationship100:isChat?relationship100:RELATIONSHIP_100_QUESTIONS.map(([key,label],index)=>({number:index+1,key,label,average:0})),
      expenseSplit:{
        number:10,
        label:'Household bills / shared expenses',
        manAverage:isChat?Number(voteSummary.bills_man||0):0,
        womanAverage:isChat?Number(voteSummary.bills_woman||0):0,
      },
      demographics:isChat?demographics:{
        respondentIdentity:['Man','Woman','Nonbinary','Prefer not to say'].map(label=>({label,count:0,percentage:0})),
        partnerIdentity:['Man','Woman','Nonbinary','Prefer not to say','Not currently partnered'].map(label=>({label,count:0,percentage:0})),
      },
    };
  });

  return {
    showVoting:{
      topicSlug:O2OL_SHOW_TOPIC.slug,
      topicTitle:voteSummary.topic_title || O2OL_SHOW_TOPIC.title,
      responseCount:Number(voteSummary.total_responses||0),
      lastResponseAt:voteSummary.last_response_at||null,
      relationship100,
      expenseSplit:{
        number:10,
        label:'Household bills / shared expenses',
        manAverage:Number(voteSummary.bills_man||0),
        womanAverage:Number(voteSummary.bills_woman||0),
      },
      demographics,
      platforms,
    },
    conversations,
  };
}

async function overview(db) {
  const [users, plans, applications, moderation, payments, loveNotes, communities] = await Promise.all([
    db.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE COALESCE(p.created_at,a."createdAt") >= now()-interval '7 days')::int AS new_7d,
             count(*) FILTER (WHERE p.id IS NOT NULL AND COALESCE(p.is_active,true)=false)::int AS inactive,
             count(*) FILTER (WHERE (COALESCE(p.is_verified,false)=true OR COALESCE(a."emailVerified",false)=true))::int AS email_verified,
             count(*) FILTER (WHERE COALESCE(p.phone_number_verified,false)=true)::int AS phone_verified,
             count(*) FILTER (
               WHERE (COALESCE(p.is_verified,false)=true OR COALESCE(a."emailVerified",false)=true)
                 AND COALESCE(p.phone_number_verified,false)=true
             )::int AS verified,
             count(*) FILTER (
               WHERE p.id IS NOT NULL
                 AND ${REGISTERED_FREE_SQL('p')}
             )::int AS registered_free,
             count(*) FILTER (
               WHERE p.id IS NOT NULL
                 AND lower(COALESCE(p.subscription_status,'inactive')) IN ('active','trial','trialing','past_due')
             )::int AS subscribed,
             count(*) FILTER (WHERE p.id IS NULL)::int AS auth_only_no_profile,
             count(*) FILTER (
               WHERE COALESCE(p.created_at,a."createdAt") >=
                 (date_trunc('day', now() AT TIME ZONE 'America/Chicago') AT TIME ZONE 'America/Chicago')
             )::int AS signups_today,
             count(*) FILTER (WHERE COALESCE(p.created_at,a."createdAt") >= now()-interval '24 hours')::int AS signups_24h,
             count(*) FILTER (
               WHERE NOT (
                 (COALESCE(p.is_verified,false)=true OR COALESCE(a."emailVerified",false)=true)
                 AND COALESCE(p.phone_number_verified,false)=true
               )
             )::int AS pending_verification
        FROM neon_auth."user" a
        FULL OUTER JOIN public.users p ON p.id=a.id
       WHERE COALESCE(a.role,'user') <> 'admin'`),
    db.query(`
      WITH desired(plan,sort_order) AS (
        VALUES ('Registered Free'::text,1),('Premiere'::text,2),('Exclusive'::text,3)
      ), counts AS (
        SELECT CASE
                 WHEN ${REGISTERED_FREE_SQL('u')}
                   THEN 'Registered Free'
                 WHEN lower(COALESCE(u.subscription_plan,'premiere')) IN ('basic','premiere','premier') THEN 'Premiere'
                 WHEN lower(COALESCE(u.subscription_plan,''))='exclusive' THEN 'Exclusive'
                 ELSE 'Registered Free'
               END AS plan,
               count(*)::int AS count
          FROM public.users u
          LEFT JOIN neon_auth."user" a ON a.id=u.id
         WHERE COALESCE(a.role,'user') <> 'admin'
         GROUP BY 1
      )
      SELECT desired.plan,COALESCE(counts.count,0)::int AS count
        FROM desired LEFT JOIN counts USING(plan)
       ORDER BY desired.sort_order`),
    db.query(`
      SELECT
        (SELECT count(*) FROM public.therapist_profiles WHERE status='pending')::int AS licensed_pending,
        (SELECT count(*) FROM public.professional_profiles WHERE status='pending')::int AS professional_pending,
        (SELECT count(*) FROM public.influencer_profiles WHERE status='pending')::int AS contributor_pending`),
    db.query(`
      SELECT
        (SELECT count(*) FROM public.success_stories WHERE moderation_status <> 'approved')::int AS stories_pending,
        (SELECT count(*) FROM public.community_posts WHERE moderation_status <> 'approved')::int AS posts_pending,
        (SELECT count(*) FROM public.post_comments WHERE moderation_status <> 'approved')::int AS comments_pending,
        (SELECT count(*) FROM public.reviews WHERE COALESCE(is_published,false)=false)::int AS reviews_unpublished,
        (SELECT count(*) FROM public.chat_room_reports WHERE status <> 'resolved')::int AS chat_reports_pending`),
    db.query(`
      SELECT
        ((SELECT count(*) FROM public.payment_history)
         + (SELECT count(*) FROM public.o2ol_token_transactions WHERE transaction_type IN ('purchase','auto_replenish') AND COALESCE(amount_cents,0)>0))::int AS recorded_payments,
        ((SELECT count(*) FROM public.payment_history WHERE created_at >=
            (date_trunc('month', now() AT TIME ZONE 'America/Chicago') AT TIME ZONE 'America/Chicago'))
         + (SELECT count(*) FROM public.o2ol_token_transactions WHERE transaction_type IN ('purchase','auto_replenish') AND COALESCE(amount_cents,0)>0 AND created_at >=
            (date_trunc('month', now() AT TIME ZONE 'America/Chicago') AT TIME ZONE 'America/Chicago')))::int AS payments_this_month,
        ((SELECT COALESCE(sum(amount) FILTER (WHERE lower(COALESCE(status,'')) IN ('paid','succeeded','success','active')),0) FROM public.payment_history)
         + (SELECT COALESCE(sum(amount_cents),0)/100.0 FROM public.o2ol_token_transactions WHERE transaction_type IN ('purchase','auto_replenish') AND COALESCE(amount_cents,0)>0))::numeric AS successful_amount`),
    db.query(`
      SELECT
        (SELECT count(*) FROM public.scheduled_love_notes)::int AS scheduled_total,
        (SELECT count(*) FROM public.scheduled_love_notes WHERE lower(COALESCE(status,'')) IN ('scheduled','pending'))::int AS scheduled_pending,
        (SELECT count(*) FROM public.scheduled_love_notes WHERE lower(COALESCE(status,''))='failed')::int AS scheduled_failed,
        (SELECT count(*) FROM public.scheduled_love_notes WHERE lower(COALESCE(status,'')) IN ('sent','passed','delivered') OR sent_at IS NOT NULL)::int AS scheduled_passed,
        (SELECT count(DISTINCT user_id) FROM public.scheduled_love_notes)::int AS scheduler_users,
        (SELECT count(DISTINCT user_id) FROM public.scheduled_love_notes WHERE created_at >= now()-interval '30 days')::int AS scheduler_users_30d,
        (SELECT count(*) FROM public.scheduled_love_notes WHERE created_at >= now()-interval '30 days')::int AS scheduled_30d,
        (SELECT count(*) FROM public.sent_love_notes)::int AS sent_total,
        (SELECT count(*) FROM public.sent_love_notes WHERE sent_date >= now()-interval '30 days')::int AS sent_30d,
        (SELECT count(*) FROM public.due_scheduled_love_notes)::int AS due_now`),
    db.query(`
      SELECT
        (SELECT count(*) FROM public.communities)::int AS communities,
        (SELECT count(*) FROM public.community_posts)::int AS posts,
        (SELECT count(*) FROM public.post_comments)::int AS comments`),
  ]);

  const app = applications.rows[0] || {};
  const mod = moderation.rows[0] || {};
  return {
    users: users.rows[0] || {},
    plans: plans.rows,
    applications: { ...app, pending_total: Number(app.licensed_pending || 0) + Number(app.professional_pending || 0) + Number(app.contributor_pending || 0) },
    moderation: { ...mod, pending_total: Number(mod.stories_pending || 0) + Number(mod.posts_pending || 0) + Number(mod.comments_pending || 0) + Number(mod.reviews_unpublished || 0) + Number(mod.chat_reports_pending || 0) },
    payments: payments.rows[0] || {},
    loveNotes: loveNotes.rows[0] || {},
    community: communities.rows[0] || {},
  };
}

async function members(db) {
  const result = await db.query(`
    SELECT COALESCE(a.id,u.id) AS id,
           COALESCE(u.email,a.email) AS email,
           COALESCE(NULLIF(u.name,''),NULLIF(a.name,''),split_part(a.email,'@',1)) AS name,
           u.username,
           COALESCE(u.marketing_email_opt_in,false) AS marketing_email_opt_in,
           u.marketing_email_opt_in_at,
           u.signup_visitor_id,
           EXISTS (
             SELECT 1 FROM public.o2ol_token_transactions tt
              WHERE tt.user_id=COALESCE(a.id,u.id)
                AND tt.transaction_type IN ('purchase','auto_replenish')
                AND COALESCE(tt.amount_cents,0)>0
           ) AS token_buyer,
           COALESCE(u.user_type,'regular') AS user_type,
           u.relationship_status,u.location,
           COALESCE(u.is_active,true) AS is_active,
           (COALESCE(a."emailVerified",false)=true OR COALESCE(u.is_verified,false)=true) AS is_verified,
           COALESCE((to_jsonb(u)->>'phone_number_verified')::boolean,false) AS phone_verified,
           CASE
             WHEN u.id IS NULL THEN 'Signup Pending'
             WHEN ${REGISTERED_FREE_SQL('u')}
               THEN 'Registered Free'
             WHEN lower(COALESCE(u.subscription_plan,'premiere')) IN ('basic','premiere','premier') THEN 'Premiere'
             WHEN lower(COALESCE(u.subscription_plan,''))='exclusive' THEN 'Exclusive'
             ELSE 'Registered Free'
           END AS subscription_plan,
           CASE
             WHEN u.id IS NULL THEN 'signup_pending'
             WHEN ${REGISTERED_FREE_SQL('u')}
               THEN 'registered_free'
             ELSE COALESCE(u.subscription_status,'inactive')
           END AS subscription_status,
           u.subscription_price,
           u.subscription_end_date,
           COALESCE(u.created_at,a."createdAt") AS created_at,
           COALESCE(u.updated_at,a."updatedAt",a."createdAt") AS updated_at,
           COALESCE(a.role,'user') AS auth_role,
           COALESCE(a.banned,false) AS banned,
           a."banReason" AS ban_reason,
           CASE
             WHEN COALESCE(a."banReason",'') LIKE 'O2OL_DELETED:%' THEN 'deleted'
             WHEN COALESCE(a."banReason",'') LIKE 'O2OL_SUSPENDED:%' OR COALESCE(a.banned,false)=true OR COALESCE(u.is_active,true)=false THEN 'suspended'
             ELSE 'active'
           END AS account_state,
           (u.id IS NOT NULL) AS profile_ready,
           (a.id IS NOT NULL) AS auth_ready
      FROM neon_auth."user" a
      FULL OUTER JOIN public.users u ON u.id=a.id
     ORDER BY COALESCE(u.created_at,a."createdAt") DESC`);
  return result.rows;
}
async function visitorRegistry(db, rangeDays = 30) {
  const [visitorsResult,funnelResult,sweepExcludedResult] = await Promise.all([
    db.query(`
      WITH ${SWEEP_CTES}, visitor_rollup AS (
        SELECT
          e.visitor_id,
          min(e.created_at) AS first_seen,
          max(e.created_at) AS last_seen,
          count(DISTINCT e.session_id)::int AS visits,
          count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
          count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
          count(*) FILTER (WHERE e.event_type='action')::int AS actions,
          (array_agg(e.traffic_source ORDER BY e.created_at ASC) FILTER (WHERE e.traffic_source IS NOT NULL))[1] AS original_source,
          (array_agg(e.language ORDER BY e.created_at DESC) FILTER (WHERE e.language IS NOT NULL))[1] AS language,
          array_remove(array_agg(DISTINCT e.route),NULL) AS pages,
          array_remove(array_agg(DISTINCT e.feature),NULL) AS features,
          (array_agg(e.route ORDER BY e.created_at DESC) FILTER (WHERE e.route IS NOT NULL))[1] AS current_route,
          (array_agg(e.user_id ORDER BY e.created_at DESC) FILTER (WHERE e.user_id IS NOT NULL))[1] AS latest_event_user_id
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" event_auth ON event_auth.id=e.user_id
        WHERE (e.user_id IS NULL OR COALESCE(event_auth.role,'user') <> 'admin')
          AND ($1::int IS NULL OR e.created_at >= now() - make_interval(days => $1::int))${SWEEP_EVENT_FILTER}
        GROUP BY e.visitor_id
      ), resolved AS (
        SELECT vr.*,
               COALESCE(vil.user_id,vr.latest_event_user_id) AS resolved_user_id,
               vil.linked_at
          FROM visitor_rollup vr
          LEFT JOIN public.visitor_identity_links vil ON vil.visitor_id=vr.visitor_id
      ), purchases AS (
        SELECT user_id,
               sum(COALESCE(amount_cents,0)) FILTER (
                 WHERE transaction_type IN ('purchase','auto_replenish') AND COALESCE(amount_cents,0)>0
               )::bigint AS paid_cents,
               count(*) FILTER (
                 WHERE transaction_type IN ('purchase','auto_replenish') AND COALESCE(amount_cents,0)>0
               )::int AS purchase_count
          FROM public.o2ol_token_transactions
         GROUP BY user_id
      )
      SELECT
        r.visitor_id,r.first_seen,r.last_seen,r.visits,r.page_views,r.clicks,r.actions,r.current_route,
        (r.last_seen >= now()-interval '5 minutes') AS is_online,
        COALESCE(r.original_source,'direct') AS original_source,
        COALESCE(r.language,'en') AS language,
        r.pages,r.features,r.resolved_user_id AS user_id,r.linked_at,
        u.username,u.email,u.name,
        COALESCE(u.marketing_email_opt_in,false) AS marketing_email_opt_in,
        CASE WHEN r.resolved_user_id IS NULL THEN 'Anonymous Visitor'
             WHEN COALESCE(p.purchase_count,0)>0 THEN 'Credit Buyer'
             ELSE 'Registered Free' END AS audience_status,
        COALESCE(p.purchase_count,0)::int AS purchase_count,
        COALESCE(p.paid_cents,0)::bigint AS paid_cents
      FROM resolved r
      LEFT JOIN public.users u ON u.id=r.resolved_user_id
      LEFT JOIN neon_auth."user" a ON a.id=r.resolved_user_id
      LEFT JOIN purchases p ON p.user_id=r.resolved_user_id
      WHERE r.resolved_user_id IS NULL OR COALESCE(a.role,'user') <> 'admin'
      ORDER BY r.last_seen DESC
    `, [rangeDays]),
    db.query(`
      WITH ${SWEEP_CTES}, visitor_ids AS (
        SELECT DISTINCT e.visitor_id
          FROM public.interaction_events e
          LEFT JOIN public.visitor_identity_links vil ON vil.visitor_id=e.visitor_id
          LEFT JOIN neon_auth."user" a ON a.id=COALESCE(e.user_id,vil.user_id)
         WHERE (COALESCE(a.role,'user') <> 'admin' OR COALESCE(e.user_id,vil.user_id) IS NULL)${SWEEP_EVENT_FILTER}
      ), resolved_visitors AS (
        -- Same identity resolution as the registry list (owner-approved
        -- 2026-10-09): a visitor counts as signed up when EITHER a formal
        -- signup link exists OR their signed-in activity is on record.
        SELECT vi.visitor_id,
               COALESCE(vil.user_id, ev.user_id) AS user_id
          FROM visitor_ids vi
          LEFT JOIN public.visitor_identity_links vil ON vil.visitor_id=vi.visitor_id
          LEFT JOIN (SELECT visitor_id,
                            (array_agg(user_id ORDER BY created_at DESC) FILTER (WHERE user_id IS NOT NULL))[1] AS user_id
                       FROM public.interaction_events
                      GROUP BY visitor_id) ev ON ev.visitor_id=vi.visitor_id
      ), active_visitors AS (
        SELECT DISTINCT e.visitor_id
          FROM public.interaction_events e
          LEFT JOIN neon_auth."user" a ON a.id=e.user_id
         WHERE e.created_at >= now()-interval '5 minutes'
           AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
      ), buyers AS (
        SELECT DISTINCT tt.user_id
          FROM public.o2ol_token_transactions tt
          LEFT JOIN neon_auth."user" a ON a.id=tt.user_id
         WHERE tt.transaction_type IN ('purchase','auto_replenish')
           AND COALESCE(tt.amount_cents,0)>0
           AND COALESCE(a.role,'user') <> 'admin'
      )
      SELECT
        (SELECT count(*) FROM visitor_ids)::int AS total_visitors,
        (SELECT count(*) FROM active_visitors)::int AS online_now,
        (SELECT count(DISTINCT visitor_id) FROM resolved_visitors WHERE user_id IS NULL)::int AS anonymous_visitors,
        (SELECT count(*) FROM public.users u LEFT JOIN neon_auth."user" a ON a.id=u.id
          WHERE COALESCE(a.role,'user') <> 'admin'
            AND ${REGISTERED_FREE_SQL('u')})::int AS registered_free,
        (SELECT count(*) FROM buyers)::int AS token_buyers,
        (SELECT COALESCE(sum(COALESCE(tt.amount_cents,0)),0)
           FROM public.o2ol_token_transactions tt
           LEFT JOIN neon_auth."user" a ON a.id=tt.user_id
          WHERE tt.transaction_type IN ('purchase','auto_replenish')
            AND COALESCE(tt.amount_cents,0)>0
            AND COALESCE(a.role,'user') <> 'admin')::bigint AS paid_activity_cents,
        (SELECT count(*) FROM public.users u LEFT JOIN neon_auth."user" a ON a.id=u.id
          WHERE COALESCE(a.role,'user') <> 'admin' AND COALESCE(u.marketing_email_opt_in,false)=true)::int AS promo_opt_ins
    `),
    db.query(`
      WITH ${SWEEP_CTES}
      SELECT count(*)::int AS excluded FROM sweep_visitors
    `)
  ]);
  return {
    rangeDays,
    sweepExcludedVisitors: sweepExcludedResult.rows[0]?.excluded || 0,
    visitors: visitorsResult.rows,
    funnel: funnelResult.rows[0] || {
      total_visitors:0,online_now:0,anonymous_visitors:0,registered_free:0,token_buyers:0,paid_activity_cents:0,promo_opt_ins:0
    }
  };
}

async function manageMemberAccount(db, admin, memberId, action, reason = '') {
  if (!['suspend','delete','restore'].includes(action)) {
    throw Object.assign(new Error('Unsupported member action.'), { status: 400, code: 'invalid_member_action' });
  }

  await db.query('BEGIN');
  try {
    // Lock only the auth row. PostgreSQL cannot apply FOR UPDATE to the nullable
    // side of the LEFT JOIN used by the previous implementation.
    const targetResult = await db.query(
      `SELECT id,email,role,COALESCE(banned,false) AS banned,"banReason" AS ban_reason
         FROM neon_auth."user"
        WHERE id=$1::uuid
        FOR UPDATE`,
      [memberId],
    );
    const target = targetResult.rows[0];
    if (!target) throw Object.assign(new Error('Member account not found.'), { status: 404, code: 'member_not_found' });
    if (target.id === admin.id || target.role === 'admin') {
      throw Object.assign(new Error('Administrator accounts cannot be suspended or deleted from Member Management.'), { status: 403, code: 'protected_admin_account' });
    }

    if (action === 'restore') {
      await db.query(`UPDATE neon_auth."user" SET banned=false,"banReason"=NULL,"updatedAt"=now() WHERE id=$1::uuid`, [memberId]);
      await db.query(`UPDATE public.users SET is_active=true,updated_at=now() WHERE id=$1::uuid`, [memberId]);
    } else {
      const prefix = action === 'delete' ? 'O2OL_DELETED:' : 'O2OL_SUSPENDED:';
      const safeReason = String(reason || '').trim().slice(0,500) || (action === 'delete' ? 'Deleted by administrator' : 'Suspended by administrator');
      await db.query(
        `UPDATE neon_auth."user" SET banned=true,"banReason"=$2,"updatedAt"=now() WHERE id=$1::uuid`,
        [memberId, prefix + ' ' + safeReason],
      );
      await db.query(`UPDATE public.users SET is_active=false,updated_at=now() WHERE id=$1::uuid`, [memberId]);
    }

    await db.query('COMMIT');
    return { id: target.id, email: target.email, account_state: action === 'restore' ? 'active' : action };
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function grantMemberAccessTime(db, admin, memberId, unit, amount = 1) {
  const normalizedUnit = String(unit || '').toLowerCase();
  if (!['hours','days','weeks','unlimited'].includes(normalizedUnit)) {
    throw Object.assign(new Error('Access time must be Hours, Days, Weeks, or Unlimited.'), { status: 400, code: 'invalid_access_unit' });
  }

  const numericAmount = normalizedUnit === 'unlimited' ? 1 : Number.parseInt(String(amount), 10);
  if (normalizedUnit !== 'unlimited' && (!Number.isInteger(numericAmount) || numericAmount < 1 || numericAmount > 10000)) {
    throw Object.assign(new Error('Enter an amount between 1 and 10,000.'), { status: 400, code: 'invalid_access_amount' });
  }

  await db.query('BEGIN');
  try {
    const targetResult = await db.query(
      `SELECT a.id,a.email,a.name,a.role,u.subscription_end_date
         FROM neon_auth."user" a
         LEFT JOIN public.users u ON u.id=a.id
        WHERE a.id=$1::uuid
        FOR UPDATE OF a`,
      [memberId],
    );
    const target = targetResult.rows[0];
    if (!target) throw Object.assign(new Error('Member account not found.'), { status: 404, code: 'member_not_found' });
    if (target.id === admin.id || target.role === 'admin') {
      throw Object.assign(new Error('Administrator access is already unrestricted.'), { status: 403, code: 'protected_admin_account' });
    }

    await db.query(
      `INSERT INTO public.users
        (id,email,name,user_type,is_active,subscription_plan,subscription_price,subscription_status)
       VALUES ($1::uuid,$2,$3,'regular',true,'Premiere',9.99,'active')
       ON CONFLICT (id) DO NOTHING`,
      [target.id, target.email, target.name || target.email?.split('@')[0] || 'Member'],
    );

    let result;
    if (normalizedUnit === 'unlimited') {
      result = await db.query(
        `UPDATE public.users
            SET is_active=true,
                subscription_status='active',
                subscription_end_date='9999-12-31 23:59:59+00'::timestamptz,
                updated_at=now()
          WHERE id=$1::uuid
          RETURNING id,email,subscription_plan,subscription_status,subscription_end_date`,
        [memberId],
      );
    } else {
      const intervalUnit = normalizedUnit === 'hours' ? 'hour' : normalizedUnit === 'days' ? 'day' : 'week';
      result = await db.query(
        `UPDATE public.users
            SET is_active=true,
                subscription_status='active',
                subscription_end_date =
                  GREATEST(COALESCE(subscription_end_date, now()), now())
                  + ($2::int * ('1 ${intervalUnit}')::interval),
                updated_at=now()
          WHERE id=$1::uuid
          RETURNING id,email,subscription_plan,subscription_status,subscription_end_date`,
        [memberId, numericAmount],
      );
    }

    await db.query('COMMIT');
    return {
      ...result.rows[0],
      access_unit: normalizedUnit,
      access_amount: normalizedUnit === 'unlimited' ? null : numericAmount,
      unlimited: normalizedUnit === 'unlimited',
    };
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function changeMemberTier(db, env, admin, memberId, requestedPlan) {
  const targetPlan = canonicalAdminPlan(requestedPlan);
  if (!targetPlan) {
    throw Object.assign(new Error('Choose Premiere or Exclusive.'), { status: 400, code: 'invalid_plan' });
  }

  await db.query('BEGIN');
  try {
    const targetResult = await db.query(
      `SELECT a.id,a.email,a.role,
              u.subscription_plan,u.subscription_status,u.stripe_subscription_id
         FROM neon_auth."user" a
         LEFT JOIN public.users u ON u.id=a.id
        WHERE a.id=$1::uuid
        FOR UPDATE OF a`,
      [memberId],
    );
    const target = targetResult.rows[0];
    if (!target) throw Object.assign(new Error('Member account not found.'), { status: 404, code: 'member_not_found' });
    if (target.id === admin.id || target.role === 'admin') {
      throw Object.assign(new Error('Administrator tier cannot be changed from Member Management.'), { status: 403, code: 'protected_admin_account' });
    }
    if (!target.subscription_plan) {
      throw Object.assign(new Error('Member profile is not ready yet.'), { status: 409, code: 'profile_not_ready' });
    }

    const currentPlan = canonicalAdminPlan(target.subscription_plan) || 'Premiere';
    let stripeUpdated = false;

    if (target.stripe_subscription_id) {
      const targetPriceId = adminPriceId(env, targetPlan);
      if (!targetPriceId) throw Object.assign(new Error(`Stripe price is not configured for ${targetPlan}.`), { status: 503, code: 'billing_not_configured' });

      const subscription = await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(target.stripe_subscription_id)}`);
      const item = subscription?.items?.data?.[0];
      if (!item?.id) throw Object.assign(new Error('Stripe subscription item could not be found.'), { status: 502, code: 'stripe_subscription_item_missing' });

      const params = new URLSearchParams();
      params.set('items[0][id]', item.id);
      params.set('items[0][price]', targetPriceId);
      params.set('proration_behavior', 'none');
      params.set('metadata[user_id]', target.id);
      params.set('metadata[plan_name]', targetPlan);
      params.set('metadata[admin_changed]', 'true');
      await stripeRequest(env, 'POST', `/subscriptions/${encodeURIComponent(target.stripe_subscription_id)}`, params);
      stripeUpdated = true;
    }

    await db.query(
      `UPDATE public.users
          SET subscription_plan=$1,
              subscription_price=$2,
              updated_at=now()
        WHERE id=$3::uuid`,
      [targetPlan, adminPlanPrice(targetPlan), memberId],
    );

    if (currentPlan !== targetPlan) {
      await db.query(
        `INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type,effective_date)
         VALUES($1::uuid,$2,$3,$4,now())`,
        [memberId, currentPlan, targetPlan, adminPlanRank(targetPlan) > adminPlanRank(currentPlan) ? 'upgrade' : 'downgrade'],
      );
    }

    await db.query('COMMIT');
    return {
      id: target.id,
      email: target.email,
      from_plan: currentPlan,
      to_plan: targetPlan,
      change_type: currentPlan === targetPlan ? 'unchanged' : (adminPlanRank(targetPlan) > adminPlanRank(currentPlan) ? 'upgrade' : 'downgrade'),
      stripe_updated: stripeUpdated,
    };
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function manageMemberAccountsBulk(db, admin, memberIds, action, reason = '') {
  if (!['suspend','delete'].includes(action)) {
    throw Object.assign(new Error('Bulk action must be suspend or delete.'), { status: 400, code: 'invalid_bulk_member_action' });
  }
  const ids = [...new Set((Array.isArray(memberIds) ? memberIds : []).map(String))].filter(id => /^[0-9a-f-]{36}$/i.test(id));
  if (!ids.length) throw Object.assign(new Error('Select at least one member account.'), { status: 400, code: 'no_members_selected' });
  if (ids.length > 500) throw Object.assign(new Error('Select no more than 500 accounts at once.'), { status: 400, code: 'too_many_members_selected' });

  await db.query('BEGIN');
  try {
    const result = await db.query(
      `SELECT id,email,role
         FROM neon_auth."user"
        WHERE id = ANY($1::uuid[])
        ORDER BY id
        FOR UPDATE`,
      [ids],
    );
    if (result.rows.length !== ids.length) {
      throw Object.assign(new Error('One or more selected member accounts were not found.'), { status: 404, code: 'member_not_found' });
    }
    const protectedRows = result.rows.filter(row => row.id === admin.id || row.role === 'admin');
    if (protectedRows.length) {
      throw Object.assign(new Error('Administrator accounts cannot be suspended or deleted from Member Management.'), { status: 403, code: 'protected_admin_account' });
    }

    const prefix = action === 'delete' ? 'O2OL_DELETED:' : 'O2OL_SUSPENDED:';
    const safeReason = String(reason || '').trim().slice(0,500) || (action === 'delete' ? 'Deleted by administrator' : 'Suspended by administrator');
    await db.query(
      `UPDATE neon_auth."user"
          SET banned=true,"banReason"=$2,"updatedAt"=now()
        WHERE id = ANY($1::uuid[])`,
      [ids, prefix + ' ' + safeReason],
    );
    await db.query(
      `UPDATE public.users
          SET is_active=false,updated_at=now()
        WHERE id = ANY($1::uuid[])`,
      [ids],
    );

    await db.query('COMMIT');
    return { action, count: result.rows.length, members: result.rows.map(row => ({ id: row.id, email: row.email })) };
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function applications(db) {
  const result = await db.query(`
    SELECT * FROM (
      SELECT 'licensed_professional'::text AS application_type,
             p.id,p.user_id,p.status,p.rejection_reason,p.reviewed_at,p.reviewed_by,p.created_at,p.updated_at,
             concat_ws(' ',p.first_name,p.last_name) AS applicant_name,u.email,
             jsonb_build_object('license_number',p.license_number,'licensed_countries',p.licensed_countries,'licensed_states',p.licensed_states,'specializations',p.specializations,'years_experience',p.years_experience,'consultation_fee',p.consultation_fee) AS details
        FROM public.therapist_profiles p LEFT JOIN public.users u ON u.id=p.user_id
      UNION ALL
      SELECT 'professional'::text,p.id,p.user_id,p.status,p.rejection_reason,p.reviewed_at,p.reviewed_by,p.created_at,p.updated_at,
             concat_ws(' ',p.first_name,p.last_name),u.email,
             jsonb_build_object('organization_name',p.organization_name,'practice_type',p.practice_type,'website_url',p.website_url)
        FROM public.professional_profiles p LEFT JOIN public.users u ON u.id=p.user_id
      UNION ALL
      SELECT 'contributor'::text,p.id,p.user_id,p.status,p.rejection_reason,p.reviewed_at,p.reviewed_by,p.created_at,p.updated_at,
             concat_ws(' ',p.first_name,p.last_name),u.email,
             jsonb_build_object('total_follower_count',p.total_follower_count,'content_categories',p.content_categories,'collaboration_types',p.collaboration_types)
        FROM public.influencer_profiles p LEFT JOIN public.users u ON u.id=p.user_id
    ) applications
    ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 ELSE 3 END,created_at DESC
    LIMIT 250`);
  return result.rows;
}

async function moderation(db) {
  const result = await db.query(`
    SELECT * FROM (
      SELECT 'success_story'::text AS content_type,id,user_id AS author_id,title,left(content,500) AS excerpt,moderation_status AS status,moderation_notes AS notes,created_at,updated_at
        FROM public.success_stories WHERE moderation_status <> 'approved'
      UNION ALL
      SELECT 'community_post'::text,id,author_id,title,left(content,500),moderation_status,NULL::text,created_at,updated_at
        FROM public.community_posts WHERE moderation_status <> 'approved'
      UNION ALL
      SELECT 'comment'::text,id,author_id,NULL::text,left(content,500),moderation_status,NULL::text,created_at,updated_at
        FROM public.post_comments WHERE moderation_status <> 'approved'
      UNION ALL
      SELECT 'review'::text,id,user_id,NULL::text,left(review_text,500),CASE WHEN is_published THEN 'published' ELSE 'unpublished' END,NULL::text,created_at,updated_at
        FROM public.reviews WHERE COALESCE(is_published,false)=false
      UNION ALL
      SELECT 'chat_report'::text,r.id,r.reported_user_id,
             'Reported community chat message'::text,
             left(m.content,500),
             r.status,
             r.reason,
             r.created_at,
             COALESCE(r.reviewed_at,r.created_at)
        FROM public.chat_room_reports r
        JOIN public.chat_room_messages m ON m.id=r.message_id
       WHERE r.status <> 'resolved'
    ) queue
    ORDER BY created_at DESC
    LIMIT 250`);
  return result.rows;
}

async function billing(db) {
  const [payments, changes] = await Promise.all([
    db.query(`SELECT * FROM (
      SELECT p.id,p.user_id,u.email,p.amount,p.currency,p.status,p.subscription_plan,p.payment_method,p.created_at FROM public.payment_history p LEFT JOIN public.users u ON u.id=p.user_id
      UNION ALL
      SELECT tt.id,tt.user_id,u.email,(tt.amount_cents/100.0)::numeric(12,2) AS amount,'usd' AS currency,'completed' AS status,'Credit purchase' AS subscription_plan,tt.provider AS payment_method,tt.created_at FROM public.o2ol_token_transactions tt LEFT JOIN public.users u ON u.id=tt.user_id WHERE tt.transaction_type IN ('purchase','auto_replenish') AND COALESCE(tt.amount_cents,0)>0
    ) q ORDER BY created_at DESC LIMIT 100`),
    db.query(`SELECT c.id,c.user_id,u.email,c.from_plan,c.to_plan,c.change_type,c.effective_date,c.created_at FROM public.subscription_changes c LEFT JOIN public.users u ON u.id=c.user_id ORDER BY c.created_at DESC LIMIT 100`),
  ]);
  return { payments: payments.rows, changes: changes.rows };
}

async function loveNotes(db) {
  const [statusCounts, recent, sent, schedulers] = await Promise.all([
    db.query(`SELECT COALESCE(status,'unknown') AS status,count(*)::int AS count FROM public.scheduled_love_notes GROUP BY 1 ORDER BY count DESC,status ASC`),
    db.query(`
      SELECT n.id,n.user_id,u.email,n.note_title,n.scheduled_date,n.scheduled_time,n.scheduled_timezone,
             n.delivery_method,n.note_language,n.status,n.attempts,n.last_attempt_at,n.sent_at,n.failure_reason,
             CASE WHEN n.recipient_phone IS NULL THEN NULL WHEN length(n.recipient_phone)<=4 THEN '••••' ELSE '••••'||right(n.recipient_phone,4) END AS recipient_phone_masked,
             n.created_at,n.updated_at
        FROM public.scheduled_love_notes n LEFT JOIN public.users u ON u.id=n.user_id
       ORDER BY n.created_at DESC LIMIT 100`),
    db.query(`SELECT count(*)::int AS total,count(*) FILTER (WHERE sent_date>=now()-interval '7 days')::int AS sent_7d,count(*) FILTER (WHERE sent_date>=now()-interval '30 days')::int AS sent_30d FROM public.sent_love_notes`),
    db.query(`
      SELECT count(DISTINCT user_id)::int AS users_total,
             count(DISTINCT user_id) FILTER (WHERE created_at>=now()-interval '30 days')::int AS users_30d,
             count(*)::int AS schedules_total,
             count(*) FILTER (WHERE created_at>=now()-interval '30 days')::int AS schedules_30d,
             CASE WHEN count(DISTINCT user_id)=0 THEN 0 ELSE round(count(*)::numeric/count(DISTINCT user_id),1) END AS avg_schedules_per_user
        FROM public.scheduled_love_notes`),
  ]);
  return { statusCounts: statusCounts.rows, recent: recent.rows, sent: sent.rows[0] || {}, schedulers: schedulers.rows[0] || {} };
}

async function clickAnalytics(db, env) {
  const tableCheck = await db.query(`SELECT to_regclass('public.interaction_events') IS NOT NULL AS ready`);
  const liveTracking = Boolean(tableCheck.rows[0]?.ready);
  const empty = {
    total_clicks:0, clicks_30d:0, anonymous_30d:0, registered_free_30d:0,
    subscribed_30d:0, unique_anonymous_30d:0, unique_registered_free_30d:0,
    unique_subscribed_30d:0, unique_registered_30d:0, page_views_30d:0,
  };
  if (!liveTracking) {
    return {
      liveTracking:false,
      trackingMessage:'All-visitor click tracking is deployed but will activate when the first public interaction reaches Production.',
      summary:empty,
      topRoutes:[],
      topFeatures:[],
    };
  }

  const baseline = analyticsBaselineDate(env);
  const [summary, routes, features] = await Promise.all([
    db.query(`
      WITH ${SWEEP_CTES}
      SELECT
        count(*) FILTER (WHERE event_type='click')::int AS total_clicks,
        count(*) FILTER (WHERE event_type='click' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS clicks_30d,
        count(*) FILTER (WHERE event_type='click' AND actor_type='anonymous' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS anonymous_30d,
        count(*) FILTER (WHERE event_type='click' AND access_type='registered_free' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS registered_free_30d,
        count(*) FILTER (WHERE event_type='click' AND access_type='subscribed' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS subscribed_30d,
        count(DISTINCT visitor_id) FILTER (WHERE event_type='click' AND actor_type='anonymous' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS unique_anonymous_30d,
        count(DISTINCT user_id) FILTER (WHERE event_type='click' AND access_type='registered_free' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS unique_registered_free_30d,
        count(DISTINCT user_id) FILTER (WHERE event_type='click' AND access_type='subscribed' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS unique_subscribed_30d,
        count(DISTINCT user_id) FILTER (WHERE event_type='click' AND actor_type='registered' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS unique_registered_30d,
        count(*) FILTER (WHERE event_type='page_view' AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS page_views_30d
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
      WHERE e.created_at >= $1::timestamptz
        AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
    `,[baseline]),
    db.query(`
      WITH ${SWEEP_CTES}
      SELECT route,
             count(*)::int AS clicks,
             count(*) FILTER (WHERE actor_type='anonymous')::int AS anonymous,
             count(*) FILTER (WHERE access_type='registered_free')::int AS registered_free,
             count(*) FILTER (WHERE access_type='subscribed')::int AS subscribed
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE e.event_type='click'
         AND e.created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
         AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
       GROUP BY route
       ORDER BY clicks DESC,route ASC
       LIMIT 15
    `,[baseline]),
    db.query(`
      WITH ${SWEEP_CTES}
      SELECT COALESCE(feature,'Unclassified') AS feature,
             count(*)::int AS clicks,
             count(*) FILTER (WHERE actor_type='anonymous')::int AS anonymous,
             count(*) FILTER (WHERE access_type='registered_free')::int AS registered_free,
             count(*) FILTER (WHERE access_type='subscribed')::int AS subscribed
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE e.event_type='click'
         AND e.created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
         AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
       GROUP BY COALESCE(feature,'Unclassified')
       ORDER BY clicks DESC,feature ASC
       LIMIT 15
    `,[baseline]),
  ]);

  return {
    liveTracking:true,
    trackingMessage:'All normal UI clicks are recorded for anonymous Open House visitors, registered users without a paid subscription, and subscribed members. Administrator activity is excluded.',
    summary:{ ...empty,...(summary.rows[0] || {}) },
    topRoutes:routes.rows,
    topFeatures:features.rows,
  };
}

async function featureUsage(db, env) {
  const baseline = analyticsBaselineDate(env);
  const interactionReady = Boolean((await db.query(`SELECT to_regclass('public.interaction_events') IS NOT NULL AS ready`)).rows[0]?.ready);

  const publicInteractionSql = interactionReady ? `
      SELECT
        CASE
          WHEN e.feature IN ('Community','Chat') THEN 'Community Chat'
          WHEN e.feature='Meditation' THEN 'Relationship Support'
          ELSE e.feature
        END AS feature,
        CASE
          WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
          ELSE 'v:' || e.visitor_id
        END AS actor_key,
        e.created_at AS occurred_at
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
      WHERE e.feature IS NOT NULL
        AND e.event_type IN ('page_view','action')
        AND e.created_at >= $1::timestamptz
        AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
      UNION ALL
  ` : '';

  const activity = await db.query(`
    WITH ${interactionReady ? `${SWEEP_CTES}, ` : ''}activity(feature,actor_key,occurred_at) AS (
      ${publicInteractionSql}
      SELECT 'Love Note Scheduler'::text,'u:'||user_id::text,created_at FROM public.scheduled_love_notes WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Love Notes','u:'||user_id::text,COALESCE(sent_date,created_at) FROM public.sent_love_notes WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Date Ideas','u:'||user_id::text,created_at FROM public.custom_date_ideas WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Memory Lane','u:'||user_id::text,created_at FROM public.memories WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Relationship Goals','u:'||user_id::text,created_at FROM public.relationship_goals WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Couples Calendar','u:'||user_id::text,created_at FROM public.calendar_events WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Shared Journals','u:'||user_id::text,created_at FROM public.shared_journals WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Relationship Milestones','u:'||user_id::text,created_at FROM public.relationship_milestones WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Anniversary Tracker','u:'||id::text,updated_at FROM public.users WHERE anniversary_date IS NOT NULL
      UNION ALL SELECT 'Couples Profile','u:'||id::text,updated_at FROM public.users WHERE partner_email IS NOT NULL OR partner_name IS NOT NULL
      UNION ALL SELECT 'Community Chat','u:'||author_id::text,created_at FROM public.community_posts WHERE author_id IS NOT NULL
      UNION ALL SELECT 'Community Chat','u:'||author_id::text,created_at FROM public.post_comments WHERE author_id IS NOT NULL
      UNION ALL SELECT 'Community Chat','u:'||user_id::text,joined_at FROM public.community_members WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Community Chat','u:'||sender_id::text,created_at FROM public.messages WHERE sender_id IS NOT NULL AND COALESCE(is_deleted,false)=false
      UNION ALL SELECT 'Community Chat','u:'||from_user_id::text,created_at FROM public.buddy_requests WHERE from_user_id IS NOT NULL
      UNION ALL SELECT 'Community Chat','u:'||user_id::text,created_at FROM public.buddy_matches WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Subscription / Billing','u:'||user_id::text,created_at FROM public.payment_history WHERE user_id IS NOT NULL
      UNION ALL SELECT 'Subscription / Billing','u:'||user_id::text,created_at FROM public.subscription_changes WHERE user_id IS NOT NULL
    )
    SELECT feature,
           count(DISTINCT actor_key)::int AS unique_users,
           count(*)::int AS total_activity,
           count(*) FILTER (WHERE occurred_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS activity_7d,
           count(*) FILTER (WHERE occurred_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS activity_30d,
           CASE WHEN count(DISTINCT actor_key)=0 THEN 0 ELSE round(count(*)::numeric/count(DISTINCT actor_key),1) END AS avg_per_user,
           max(occurred_at) AS last_used
      FROM activity
     WHERE feature IS NOT NULL
     GROUP BY feature
  `,[baseline]);

  const byFeature = new Map(activity.rows.map(row => [row.feature, row]));
  const features = FEATURE_CATALOG.map(([feature, category]) => {
    const row = byFeature.get(feature) || {};
    return {
      feature,
      category,
      unique_users: Number(row.unique_users || 0),
      total_activity: Number(row.total_activity || 0),
      activity_7d: Number(row.activity_7d || 0),
      activity_30d: Number(row.activity_30d || 0),
      avg_per_user: Number(row.avg_per_user || 0),
      last_used: row.last_used || null,
    };
  });

  features.sort((a,b) => b.activity_30d - a.activity_30d || b.total_activity - a.total_activity || a.feature.localeCompare(b.feature));
  return {
    liveTracking:interactionReady,
    trackingMessage:interactionReady
      ? 'All-visitor feature activity is live. Feature opens and semantic actions include anonymous Open House visitors, registered-free users and subscribers; saved feature records are included where applicable. Administrator activity is excluded.'
      : 'Saved feature records are available, but all-visitor interaction tracking is not connected.',
    features,
  };
}

function analyticsBaselineDate(env) {
  const parsed = Date.parse(String(env?.ANALYTICS_BASELINE_AT || ''));
  return Number.isNaN(parsed) ? new Date(0).toISOString() : new Date(parsed).toISOString();
}

async function topFeatureActivity(db, env) {
  const baseline = analyticsBaselineDate(env);
  const windows = [7,14,21,30];

  const windowCounts = async (sql, params = []) => {
    const result = await db.query(sql, [baseline, ...params]);
    const row = result.rows[0] || {};
    return Object.fromEntries(windows.map(days => [days, Number(row[`d${days}`] || 0)]));
  };

  const subscriptionRows = await db.query(`
    SELECT
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '7 days') AND u.stripe_subscription_id IS NOT NULL)::int AS cc7,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '7 days') AND u.stripe_subscription_id IS NULL)::int AS no7,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '14 days') AND u.stripe_subscription_id IS NOT NULL)::int AS cc14,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '14 days') AND u.stripe_subscription_id IS NULL)::int AS no14,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '21 days') AND u.stripe_subscription_id IS NOT NULL)::int AS cc21,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '21 days') AND u.stripe_subscription_id IS NULL)::int AS no21,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '30 days') AND u.stripe_subscription_id IS NOT NULL)::int AS cc30,
      count(*) FILTER (WHERE u.created_at >= GREATEST($1::timestamptz,now()-interval '30 days') AND u.stripe_subscription_id IS NULL)::int AS no30
    FROM public.users u
    LEFT JOIN neon_auth."user" a ON a.id=u.id
    WHERE COALESCE(a.role,'user') <> 'admin'
  `, [baseline]);
  const s=subscriptionRows.rows[0]||{};

  const dateUse = await windowCounts(`
    WITH ${SWEEP_CTES}
    SELECT
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.interaction_events e
    LEFT JOIN neon_auth."user" a ON a.id=e.user_id
    WHERE e.feature='Date Ideas'
      AND e.event_type='page_view'
      AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
  `);
  const dateSaved = await windowCounts(`
    SELECT
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '7 days') AND is_favorite=true)::int AS d7,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '14 days') AND is_favorite=true)::int AS d14,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '21 days') AND is_favorite=true)::int AS d21,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '30 days') AND is_favorite=true)::int AS d30
    FROM public.custom_date_ideas
  `);
  const dateTop = await db.query(`
    SELECT CASE WHEN title LIKE '__builtin__:%' THEN COALESCE(NULLIF(description,''),regexp_replace(title,'^__builtin__:','')) ELSE title END AS name,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE updated_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.custom_date_ideas
    WHERE is_favorite=true AND updated_at>=GREATEST($1::timestamptz,now()-interval '30 days')
    GROUP BY 1 ORDER BY d30 DESC,name ASC LIMIT 5
  `,[baseline]);

  const pageViews = async feature => windowCounts(`
    WITH ${SWEEP_CTES}
    SELECT
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.interaction_events e
    LEFT JOIN neon_auth."user" a ON a.id=e.user_id
    WHERE e.feature=$2
      AND e.event_type='page_view'
      AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
  `,[feature]);

  const routedTop = async (feature,prefix) => {
    const result=await db.query(`
      WITH ${SWEEP_CTES}, actions(name,created_at) AS (
        SELECT substring(e.control_key from $3) AS name,e.created_at
          FROM public.interaction_events e
          LEFT JOIN neon_auth."user" a ON a.id=e.user_id
         WHERE e.feature=$2
           AND e.event_type='action'
           AND e.control_key LIKE $4
           AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
        UNION ALL
        SELECT substring(e.route from $3) AS name,e.created_at
          FROM public.feature_usage_events e
          LEFT JOIN neon_auth."user" a ON a.id=e.user_id
         WHERE e.feature=$2
           AND e.event_type='action'
           AND e.route LIKE $4
           AND COALESCE(a.role,'user') <> 'admin'
      )
      SELECT name,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
      FROM actions
      WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
      GROUP BY name ORDER BY d30 DESC,name ASC LIMIT 5
    `,[baseline,feature,prefix.length+1,`${prefix}%`]);
    return result.rows;
  };

  const [subscriptionViews,lgbtqViews,lgbtqTop,relationshipViews,podcastViews,podcastTop,loveViews,loveSent,loveScheduled,loveTop] = await Promise.all([
    pageViews('Subscription / Billing'),
    pageViews('LGBTQ+ Support'),
    routedTop('LGBTQ+ Support','lgbtq:'),
    pageViews('Relationship Support'),
    pageViews('Podcasts'),
    routedTop('Podcasts','podcast:'),
    pageViews('Love Notes'),
    windowCounts(`
      SELECT
        count(*) FILTER (WHERE COALESCE(sent_date,created_at)>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
        count(*) FILTER (WHERE COALESCE(sent_date,created_at)>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
        count(*) FILTER (WHERE COALESCE(sent_date,created_at)>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
        count(*) FILTER (WHERE COALESCE(sent_date,created_at)>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
      FROM public.sent_love_notes
    `),
    windowCounts(`
      SELECT
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
      FROM public.scheduled_love_notes
    `),
    routedTop('Love Notes','love-note-category:'),
  ]);

  const relationshipTopResult = await db.query(`
    WITH ${SWEEP_CTES}
    SELECT feature AS name,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.interaction_events e
    LEFT JOIN neon_auth."user" a ON a.id=e.user_id
    WHERE e.event_type='page_view'
      AND e.feature IN ('Communication Practice','Podcasts','Articles','LGBTQ+ Support','Couple Activities','Relationship Quizzes')
      AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
      AND e.created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
    GROUP BY e.feature ORDER BY d30 DESC,name ASC LIMIT 5
  `,[baseline]);

  const mapTop = rows => rows.map(row => ({
    name:row.name,
    counts:Object.fromEntries(windows.map(days=>[days,Number(row[`d${days}`]||0)])),
  }));

  return {
    windows,
    subscriptionBilling:{
      accesses:subscriptionViews,
      withCard:Object.fromEntries(windows.map(d=>[d,Number(s[`cc${d}`]||0)])),
      withoutCard:Object.fromEntries(windows.map(d=>[d,Number(s[`no${d}`]||0)])),
    },
    dateIdeas:{ used:dateUse, saved:dateSaved, top:mapTop(dateTop.rows) },
    lgbtq:{ accesses:lgbtqViews, top:mapTop(lgbtqTop) },
    loveNotes:{ accesses:loveViews, sent:loveSent, scheduled:loveScheduled, top:mapTop(loveTop) },
    relationshipSupport:{ accesses:relationshipViews, top:mapTop(relationshipTopResult.rows) },
    podcasts:{ accesses:podcastViews, top:mapTop(podcastTop) },
  };
}

async function system(db) {
  const [migrations, ai, authRoles] = await Promise.all([
    db.query(`SELECT migration_key,applied_at,notes FROM public.app_migrations ORDER BY applied_at DESC LIMIT 50`),
    db.query(`SELECT feature,count(*)::int AS uses,count(DISTINCT user_id)::int AS users FROM public.ai_usage_events WHERE created_at>=now()-interval '30 days' GROUP BY feature ORDER BY uses DESC,feature ASC`),
    db.query(`SELECT COALESCE(role,'user') AS role,count(*)::int AS count FROM neon_auth."user" WHERE COALESCE(role,'user') <> 'admin' GROUP BY 1 ORDER BY 1`),
  ]);
  return { migrations: migrations.rows, aiUsage30d: ai.rows, authRoles: authRoles.rows };
}

async function supportFeedback(db) {
  const exists=(await db.query(`SELECT to_regclass('public.suggestions') IS NOT NULL AS ready`)).rows[0]?.ready === true;
  if(!exists) return { summary:{ total:0,new_count:0,bug_count:0 }, recent:[] };
  const [summary,recent]=await Promise.all([
    db.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE status='new')::int AS new_count,
             count(*) FILTER (WHERE suggestion_type='bug' AND status<>'closed')::int AS bug_count
        FROM public.suggestions`),
    db.query(`
      SELECT id,name,email,suggestion_type,suggestion,status,created_at
        FROM public.suggestions
       ORDER BY created_at DESC
       LIMIT 100`)
  ]);
  return { summary:summary.rows[0]||{total:0,new_count:0,bug_count:0}, recent:recent.rows };
}

async function dashboard(db, env, registryRangeDays = 30) {
  await ensureChatModerationSchema(db);
  await ensureO2OLShowVotingSchema(db);
  const [summary,userRows,applicationRows,moderationRows,billingData,loveNoteData,featureData,clickData,topFeatureData,chatRoomData,systemData,visitorData,supportData] = await Promise.all([
    overview(db),members(db),applications(db),moderation(db),billing(db),loveNotes(db),featureUsage(db,env),clickAnalytics(db,env),topFeatureActivity(db,env),chatRoomAnalytics(db),system(db),visitorRegistry(db,registryRangeDays),supportFeedback(db),
  ]);
  return { summary,members:userRows,applications:applicationRows,moderation:moderationRows,billing:billingData,loveNotes:loveNoteData,featureUsage:featureData,clickAnalytics:clickData,topFeatureActivity:topFeatureData,chatRoom:chatRoomData,system:systemData,visitorRegistry:visitorData,supportFeedback:supportData };
}

export async function handleAdminRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/admin')) return null;

  const auth = await session(request, env);
  const mfaFallback = auth ? null : await getVerifiedAdminMfaIdentity(request, env);
  if (!auth && !mfaFallback) return fail('Authentication required.',401,'unauthorized');

  try {
    return await withDb(env, async (db) => {
      const admin = mfaFallback?.admin || await adminIdentity(db, auth.user.id);
      if (!admin) return fail('Administrator access required.',403,'forbidden');

      if (request.method === 'GET' && url.pathname === '/api/admin/me') {
        return json({ ok:true, admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role } });
      }
      if (request.method === 'GET' && url.pathname === '/api/admin/dashboard') {
        const rangeParam = String(url.searchParams.get('registryRange') || '30d').toLowerCase();
        const rangeDays = rangeParam === 'all' ? null : ({ '7d': 7, '30d': 30, '90d': 90 }[rangeParam] ?? 30);
        const data = await dashboard(db, env, rangeDays);
        return json({ ok:true,recovered:true,mode:'admin_management',admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data });
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/presence') {
        await db.query(`CREATE TABLE IF NOT EXISTS public.visitor_presence (visitor_id text PRIMARY KEY, user_id uuid, route text, last_ping_at timestamptz NOT NULL DEFAULT now())`);
        await db.query(`DELETE FROM public.visitor_presence WHERE last_ping_at < now() - interval '7 days'`);
        const result = await db.query(`SELECT count(*)::int AS online_now FROM public.visitor_presence WHERE last_ping_at >= now() - interval '90 seconds'`);
        return json({ ok:true, onlineNow: result.rows[0]?.online_now || 0, generatedAt: new Date().toISOString() });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/members/bulk') {
        const body = await request.json().catch(() => ({}));
        const result = await manageMemberAccountsBulk(db, admin, body?.memberIds, String(body?.action || '').toLowerCase(), body?.reason || '');
        return json({ ok:true, ...result });
      }

      const memberMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/(suspend|delete|restore)$/i);
      if (request.method === 'POST' && memberMatch) {
        const body = await request.json().catch(() => ({}));
        const result = await manageMemberAccount(db, admin, memberMatch[1], memberMatch[2].toLowerCase(), body?.reason || '');
        return json({ ok:true, member:result });
      }

      if (!['GET','POST'].includes(request.method)) return fail('Method not allowed.',405,'method_not_allowed');
      return fail('Admin route not found.',404,'not_found');
    });
  } catch (error) {
    console.error('One2OneLove admin API error', error);
    return fail(error?.message || 'Unable to process the admin request.',error?.status || 500,error?.code || 'admin_error');
  }
}
