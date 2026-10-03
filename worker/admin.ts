// @ts-nocheck
import { Client } from 'pg';
import { getVerifiedAdminMfaIdentity } from './admin-mfa';

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
  ['Relationship Support', 'Support & Content'],
  ['Communication Practice', 'Support & Content'],
  ['Meditation', 'Support & Content'],
  ['Podcasts', 'Support & Content'],
  ['Articles', 'Support & Content'],
  ['LGBTQ+ Support', 'Support & Content'],
  ['Couple Activities', 'Support & Content'],
  ['Community', 'Community'],
  ['Chat', 'Community'],
  ['Find Friends', 'Community'],
  ['Friend Requests', 'Community'],
  ['Invite & Share', 'Growth'],
  ['Member Profile', 'Account'],
  ['Legacy Billing / Tokens', 'Account'],
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
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

async function ensureChatModerationSchema(db) {
  await db.query(`
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
  await db.query(`
    ALTER TABLE public.chat_room_messages
    ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.chat_room_topics(id) ON DELETE SET NULL
  `);
  await db.query(`
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
  slug:'studio-who-should-apologize-first',
  title:'Who Should Apologize First?',
};

async function ensureO2OLShowVotingSchema(db) {
  await db.query(`
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
  await db.query(`
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
    SELECT
      count(*)::int AS total_responses,
      max(topic_title) AS topic_title,
      max(created_at) AS last_response_at,
      round(avg(NULLIF(relationship_priorities->>'money','')::numeric),1) AS money,
      round(avg(NULLIF(relationship_priorities->>'religion','')::numeric),1) AS religion,
      round(avg(NULLIF(relationship_priorities->>'sex_intimacy','')::numeric),1) AS sex_intimacy,
      round(avg(NULLIF(relationship_priorities->>'politics','')::numeric),1) AS politics,
      round(avg(NULLIF(relationship_priorities->>'family','')::numeric),1) AS family,
      round(avg(NULLIF(relationship_priorities->>'communication','')::numeric),1) AS communication,
      round(avg(NULLIF(relationship_priorities->>'looks_physical_appearance','')::numeric),1) AS looks_physical_appearance,
      round(avg(NULLIF(relationship_priorities->>'therapy_when_needed','')::numeric),1) AS therapy_when_needed,
      round(avg(NULLIF(relationship_priorities->>'help_around_home','')::numeric),1) AS help_around_home,
      round(avg(NULLIF(expense_split->>'man','')::numeric),1) AS bills_man,
      round(avg(NULLIF(expense_split->>'woman','')::numeric),1) AS bills_woman,
      COALESCE(sum(NULLIF(relationship_priorities->>'money','')::numeric),0) AS sum_money,
      COALESCE(sum(NULLIF(relationship_priorities->>'religion','')::numeric),0) AS sum_religion,
      COALESCE(sum(NULLIF(relationship_priorities->>'sex_intimacy','')::numeric),0) AS sum_sex_intimacy,
      COALESCE(sum(NULLIF(relationship_priorities->>'politics','')::numeric),0) AS sum_politics,
      COALESCE(sum(NULLIF(relationship_priorities->>'family','')::numeric),0) AS sum_family,
      COALESCE(sum(NULLIF(relationship_priorities->>'communication','')::numeric),0) AS sum_communication,
      COALESCE(sum(NULLIF(relationship_priorities->>'looks_physical_appearance','')::numeric),0) AS sum_looks_physical_appearance,
      COALESCE(sum(NULLIF(relationship_priorities->>'therapy_when_needed','')::numeric),0) AS sum_therapy_when_needed,
      COALESCE(sum(NULLIF(relationship_priorities->>'help_around_home','')::numeric),0) AS sum_help_around_home,
      COALESCE(sum(NULLIF(expense_split->>'man','')::numeric),0) AS sum_bills_man,
      COALESCE(sum(NULLIF(expense_split->>'woman','')::numeric),0) AS sum_bills_woman
    FROM public.o2ol_show_vote_responses
    WHERE topic_slug=$1
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
    ['pinterest','Pinterest'],
    ['linkedin','LinkedIn'],
  ];
  const platforms=platformMeta.map(([id,label])=>{
    const isChat=id==='o2ol-chat-room';
    return {
      id,label,
      validResponses:isChat?Number(voteSummary.total_responses||0):0,
      excludedResponses:0,
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
             count(*) FILTER (WHERE COALESCE(p.is_verified,a."emailVerified",false)=true)::int AS verified
        FROM neon_auth."user" a
        FULL OUTER JOIN public.users p ON p.id=a.id
       WHERE COALESCE(a.role,'user') <> 'admin'`),
    db.query(`
      WITH desired(plan,sort_order) AS (
        VALUES ('Premiere'::text,1),('Exclusive'::text,2)
      ), counts AS (
        SELECT CASE
                 WHEN lower(COALESCE(subscription_plan,'premiere')) IN ('basic','premiere','premier') THEN 'Premiere'
                 WHEN lower(COALESCE(subscription_plan,''))='exclusive' THEN 'Exclusive'
                 ELSE 'Premiere'
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
        (SELECT count(*) FROM public.success_stories WHERE moderation_status='pending')::int AS stories_pending,
        (SELECT count(*) FROM public.community_posts WHERE moderation_status='pending')::int AS posts_pending,
        (SELECT count(*) FROM public.post_comments WHERE moderation_status='pending')::int AS comments_pending,
        (SELECT count(*) FROM public.reviews WHERE COALESCE(is_published,false)=false)::int AS reviews_unpublished,
        (SELECT count(*) FROM public.chat_room_reports WHERE status='pending')::int AS chat_reports_pending`),
    db.query(`
      SELECT count(*)::int AS recorded_payments,
             count(*) FILTER (WHERE created_at >= date_trunc('month',now()))::int AS payments_this_month,
             COALESCE(sum(amount) FILTER (WHERE lower(COALESCE(status,'')) IN ('paid','succeeded','success','active')),0)::numeric AS successful_amount
        FROM public.payment_history`),
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
           COALESCE(u.user_type,'regular') AS user_type,
           u.relationship_status,u.location,
           COALESCE(u.is_active,true) AS is_active,
           COALESCE(a."emailVerified",u.is_verified,false) AS is_verified,
           COALESCE((to_jsonb(u)->>'phone_number_verified')::boolean,false) AS phone_verified,
           COALESCE(NULLIF(u.subscription_plan,''),'Free') AS subscription_plan,
           COALESCE(w.balance,0)::int AS token_balance,
           COALESCE(w.lifetime_purchased,0)::int AS tokens_purchased,
           COALESCE(w.lifetime_used,0)::int AS tokens_used,
           COALESCE(w.lifetime_granted,0)::int AS tokens_granted,
           CASE
             WHEN u.id IS NULL THEN 'guest'
             WHEN u.stripe_subscription_id IS NULL
               AND lower(COALESCE(u.subscription_status,'inactive')) NOT IN ('active','trial','trialing','past_due')
               AND u.created_at + interval '24 hours' > now() THEN 'guest'
             WHEN u.stripe_subscription_id IS NULL
               AND lower(COALESCE(u.subscription_status,'inactive')) NOT IN ('active','trial','trialing','past_due')
               AND u.created_at + interval '24 hours' <= now() THEN 'guest_expired'
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
      LEFT JOIN public.o2ol_token_wallets w ON w.user_id=COALESCE(u.id,a.id)
     ORDER BY COALESCE(u.created_at,a."createdAt") DESC`);
  return result.rows;
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

async function grantMemberAccessTime() {
  throw Object.assign(
    new Error('Time-based membership grants are retired. Use an audited O2OL Token adjustment.'),
    {status:410,code:'legacy_access_time_retired'},
  );
}

async function changeMemberTier() {
  throw Object.assign(
    new Error('Recurring tier changes are retired. One2OneLove uses free verified accounts plus O2OL Tokens.'),
    {status:410,code:'legacy_tier_retired'},
  );
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
    db.query(`SELECT p.id,p.user_id,u.email,p.amount,p.currency,p.status,p.subscription_plan,p.payment_method,p.created_at FROM public.payment_history p LEFT JOIN public.users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100`),
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

async function featureUsage(db) {
  const tableCheck = await db.query(`SELECT to_regclass('public.feature_usage_events') IS NOT NULL AS ready`);
  const liveTracking = Boolean(tableCheck.rows[0]?.ready);
  const eventSql = liveTracking ? `
      UNION ALL
      SELECT e.feature,e.user_id,e.created_at
        FROM public.feature_usage_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE COALESCE(a.role,'user') <> 'admin'
  ` : '';

  const activity = await db.query(`
    WITH activity(feature,user_id,occurred_at) AS (
      SELECT 'Love Note Scheduler'::text,user_id,created_at FROM public.scheduled_love_notes
      UNION ALL SELECT 'Love Notes',user_id,COALESCE(sent_date,created_at) FROM public.sent_love_notes
      UNION ALL SELECT 'Date Ideas',user_id,created_at FROM public.custom_date_ideas
      UNION ALL SELECT 'Memory Lane',user_id,created_at FROM public.memories
      UNION ALL SELECT 'Relationship Goals',user_id,created_at FROM public.relationship_goals
      UNION ALL SELECT 'Couples Calendar',user_id,created_at FROM public.calendar_events
      UNION ALL SELECT 'Shared Journals',user_id,created_at FROM public.shared_journals
      UNION ALL SELECT 'Relationship Milestones',user_id,created_at FROM public.relationship_milestones
      UNION ALL SELECT 'Anniversary Tracker',id,updated_at FROM public.users WHERE anniversary_date IS NOT NULL
      UNION ALL SELECT 'Couples Profile',id,updated_at FROM public.users WHERE partner_email IS NOT NULL OR partner_name IS NOT NULL
      UNION ALL SELECT 'Community',author_id,created_at FROM public.community_posts
      UNION ALL SELECT 'Community',author_id,created_at FROM public.post_comments
      UNION ALL SELECT 'Community',user_id,joined_at FROM public.community_members
      UNION ALL SELECT 'Chat',sender_id,created_at FROM public.messages WHERE COALESCE(is_deleted,false)=false
      UNION ALL SELECT 'Find Friends',from_user_id,created_at FROM public.buddy_requests
      UNION ALL SELECT 'Find Friends',user_id,created_at FROM public.buddy_matches
      UNION ALL SELECT 'Subscription / Billing',user_id,created_at FROM public.payment_history
      UNION ALL SELECT 'Subscription / Billing',user_id,created_at FROM public.subscription_changes
      ${eventSql}
    )
    SELECT feature,
           count(DISTINCT user_id)::int AS unique_users,
           count(*)::int AS total_activity,
           count(*) FILTER (WHERE occurred_at>=now()-interval '7 days')::int AS activity_7d,
           count(*) FILTER (WHERE occurred_at>=now()-interval '30 days')::int AS activity_30d,
           CASE WHEN count(DISTINCT user_id)=0 THEN 0 ELSE round(count(*)::numeric/count(DISTINCT user_id),1) END AS avg_per_user,
           max(occurred_at) AS last_used
      FROM activity
     WHERE user_id IS NOT NULL
     GROUP BY feature`);

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
    liveTracking,
    trackingMessage: liveTracking
      ? 'Live page-view tracking is active. Stored feature actions are also included where One2OneLove already saves them.'
      : 'Stored feature actions are shown now. Live page-view tracking is prepared but has not yet been activated.',
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
    SELECT
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.feature_usage_events e
    LEFT JOIN neon_auth."user" a ON a.id=e.user_id
    WHERE e.feature='Date Ideas' AND e.event_type='view' AND COALESCE(a.role,'user') <> 'admin'
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
    SELECT
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.feature_usage_events e
    LEFT JOIN neon_auth."user" a ON a.id=e.user_id
    WHERE e.feature=$2 AND e.event_type='view' AND COALESCE(a.role,'user') <> 'admin'
  `,[feature]);

  const routedTop = async (feature,prefix) => {
    const result=await db.query(`
      SELECT substring(route from $3) AS name,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
      FROM public.feature_usage_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
      WHERE e.feature=$2 AND e.event_type='action' AND e.route LIKE $4
        AND COALESCE(a.role,'user') <> 'admin'
        AND e.created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
      GROUP BY 1 ORDER BY d30 DESC,name ASC LIMIT 5
    `,[baseline,feature,prefix.length+1,`${prefix}%`]);
    return result.rows;
  };

  const [lgbtqViews,lgbtqTop,relationshipViews,podcastViews,podcastTop,loveSent,loveScheduled,loveTop] = await Promise.all([
    pageViews('LGBTQ+ Support'),
    routedTop('LGBTQ+ Support','lgbtq:'),
    pageViews('Relationship Support'),
    pageViews('Podcasts'),
    routedTop('Podcasts','podcast:'),
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
    SELECT feature AS name,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
      count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
    FROM public.feature_usage_events e
    LEFT JOIN neon_auth."user" a ON a.id=e.user_id
    WHERE e.event_type='view'
      AND e.feature IN ('Communication Practice','Meditation','Podcasts','Articles','LGBTQ+ Support','Couple Activities','Relationship Quizzes')
      AND COALESCE(a.role,'user') <> 'admin'
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
      withCard:Object.fromEntries(windows.map(d=>[d,Number(s[`cc${d}`]||0)])),
      withoutCard:Object.fromEntries(windows.map(d=>[d,Number(s[`no${d}`]||0)])),
    },
    dateIdeas:{ used:dateUse, saved:dateSaved, top:mapTop(dateTop.rows) },
    lgbtq:{ accesses:lgbtqViews, top:mapTop(lgbtqTop) },
    loveNotes:{ sent:loveSent, scheduled:loveScheduled, top:mapTop(loveTop) },
    relationshipSupport:{ accesses:relationshipViews, top:mapTop(relationshipTopResult.rows) },
    podcasts:{ accesses:podcastViews, top:mapTop(podcastTop) },
  };
}

async function tokenEconomy(db) {
  const [summary,packages,prices,byFeature,recentTransactions,topWallets,calibrations,conversionQuotes,legacy] = await Promise.all([
    db.query(`
      SELECT
        count(*) FILTER (WHERE COALESCE(a.role,'user') <> 'admin')::int AS wallets,
        COALESCE(sum(w.balance) FILTER (WHERE COALESCE(a.role,'user') <> 'admin'),0)::bigint AS outstanding_tokens,
        COALESCE(sum(w.lifetime_purchased) FILTER (WHERE COALESCE(a.role,'user') <> 'admin'),0)::bigint AS lifetime_purchased,
        COALESCE(sum(w.lifetime_used) FILTER (WHERE COALESCE(a.role,'user') <> 'admin'),0)::bigint AS lifetime_used,
        COALESCE(sum(w.lifetime_granted) FILTER (WHERE COALESCE(a.role,'user') <> 'admin'),0)::bigint AS lifetime_granted,
        (SELECT count(*)::int FROM public.o2ol_token_transactions t LEFT JOIN neon_auth."user" ua ON ua.id=t.user_id
          WHERE t.created_at>=now()-interval '30 days' AND COALESCE(ua.role,'user')<>'admin') AS transactions_30d,
        (SELECT COALESCE(sum(t.amount_cents),0)::bigint FROM public.o2ol_token_transactions t LEFT JOIN neon_auth."user" ua ON ua.id=t.user_id
          WHERE t.created_at>=now()-interval '30 days' AND t.transaction_type IN ('purchase','auto_replenish') AND COALESCE(ua.role,'user')<>'admin') AS token_revenue_cents_30d,
        (SELECT COALESCE(sum(c.provider_cost_micros),0)::bigint FROM public.o2ol_cost_events c LEFT JOIN neon_auth."user" ua ON ua.id=c.user_id
          WHERE c.created_at>=now()-interval '30 days' AND COALESCE(ua.role,'user')<>'admin') AS provider_cost_micros_30d,
        (SELECT COALESCE(sum(c.customer_tokens_charged),0)::bigint FROM public.o2ol_cost_events c LEFT JOIN neon_auth."user" ua ON ua.id=c.user_id
          WHERE c.created_at>=now()-interval '30 days' AND COALESCE(ua.role,'user')<>'admin') AS tokens_charged_30d
      FROM public.o2ol_token_wallets w
      LEFT JOIN neon_auth."user" a ON a.id=w.user_id
    `),
    db.query(`SELECT code,label,tokens,amount_cents,active,calibration_only,display_order,updated_at
                FROM public.o2ol_token_packages ORDER BY display_order,amount_cents`),
    db.query(`SELECT feature_code,label,token_cost,pricing_unit,active,calibration_only,metadata,updated_at
                FROM public.o2ol_token_feature_prices ORDER BY feature_code`),
    db.query(`
      SELECT c.feature_code,c.provider,c.provider_product,
             count(*)::int AS events,
             count(DISTINCT c.user_id)::int AS users,
             COALESCE(sum(c.customer_tokens_charged),0)::bigint AS tokens_charged,
             COALESCE(sum(c.provider_cost_micros),0)::bigint AS provider_cost_micros,
             COALESCE(sum(c.input_characters),0)::bigint AS input_characters,
             COALESCE(sum(c.output_characters),0)::bigint AS output_characters,
             COALESCE(sum(c.provider_input_units),0)::bigint AS provider_input_units,
             COALESCE(sum(c.provider_output_units),0)::bigint AS provider_output_units,
             max(c.created_at) AS last_event
        FROM public.o2ol_cost_events c
        LEFT JOIN neon_auth."user" a ON a.id=c.user_id
       WHERE c.created_at>=now()-interval '30 days'
         AND COALESCE(a.role,'user')<>'admin'
       GROUP BY c.feature_code,c.provider,c.provider_product
       ORDER BY provider_cost_micros DESC NULLS LAST,c.feature_code
    `),
    db.query(`
      SELECT t.id,t.user_id,u.email,t.wallet_delta,t.balance_after,t.transaction_type,t.feature_code,
             t.package_code,t.amount_cents,t.provider,t.provider_reference,t.metadata,t.created_at
        FROM public.o2ol_token_transactions t
        LEFT JOIN public.users u ON u.id=t.user_id
        LEFT JOIN neon_auth."user" a ON a.id=t.user_id
       WHERE COALESCE(a.role,'user')<>'admin'
       ORDER BY t.created_at DESC LIMIT 100
    `),
    db.query(`
      SELECT w.user_id,u.email,u.name,w.balance,w.lifetime_purchased,w.lifetime_used,w.lifetime_granted,w.updated_at
        FROM public.o2ol_token_wallets w
        LEFT JOIN public.users u ON u.id=w.user_id
        LEFT JOIN neon_auth."user" a ON a.id=w.user_id
       WHERE COALESCE(a.role,'user')<>'admin'
       ORDER BY w.balance DESC,w.updated_at DESC LIMIT 50
    `),
    db.query(`
      SELECT s.id,s.user_id,COALESCE(u.email,a.email) AS email,s.feature_code,s.package_code,
             s.starting_balance,s.ending_balance,s.notes,s.started_at,s.ended_at,
             COALESCE(sum(c.provider_cost_micros),0)::bigint AS provider_cost_micros,
             COALESCE(sum(c.customer_tokens_charged),0)::bigint AS customer_tokens_charged,
             count(c.id)::int AS cost_events
        FROM public.o2ol_calibration_sessions s
        LEFT JOIN public.users u ON u.id=s.user_id
        LEFT JOIN neon_auth."user" a ON a.id=s.user_id
        LEFT JOIN public.o2ol_cost_events c ON c.calibration_session_id=s.id
       GROUP BY s.id,u.email,a.email
       ORDER BY s.started_at DESC LIMIT 50
    `),
    db.query(`
      SELECT q.id,q.user_id,u.email,q.stripe_subscription_id,q.old_plan,q.period_start,q.period_end,
             q.amount_paid_cents,q.unused_value_cents,q.token_value_micros,q.proposed_tokens,q.status,
             q.calculation,q.created_at,q.applied_at
        FROM public.o2ol_subscription_conversion_quotes q
        LEFT JOIN public.users u ON u.id=q.user_id
       ORDER BY q.created_at DESC LIMIT 100
    `),
    db.query(`
      SELECT
        count(*) FILTER (WHERE u.stripe_subscription_id IS NOT NULL)::int AS stripe_linked_accounts,
        count(*) FILTER (WHERE u.stripe_subscription_id IS NOT NULL AND lower(COALESCE(u.subscription_status,'')) IN ('active','trial','trialing','past_due'))::int AS legacy_active_accounts
      FROM public.users u
      LEFT JOIN neon_auth."user" a ON a.id=u.id
      WHERE COALESCE(a.role,'user')<>'admin'
    `)
  ]);
  return {
    summary:summary.rows[0]||{},
    packages:packages.rows,
    featurePrices:prices.rows,
    byFeature:byFeature.rows,
    recentTransactions:recentTransactions.rows,
    topWallets:topWallets.rows,
    calibrations:calibrations.rows,
    conversionQuotes:conversionQuotes.rows,
    legacySubscriptions:legacy.rows[0]||{},
  };
}

async function adjustMemberTokens(db,admin,memberId,rawDelta,reason='') {
  const delta=Number.parseInt(String(rawDelta),10);
  if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>1000000) {
    throw Object.assign(new Error('Token adjustment must be a non-zero whole number between -1,000,000 and 1,000,000.'),{status:400,code:'invalid_token_adjustment'});
  }
  const safeReason=String(reason||'').trim().slice(0,500);
  if(!safeReason) throw Object.assign(new Error('A reason is required for an Admin token adjustment.'),{status:400,code:'reason_required'});
  await db.query('BEGIN');
  try{
    const target=(await db.query(
      `SELECT a.id,a.email,a.role FROM neon_auth."user" a WHERE a.id=$1::uuid FOR UPDATE`,
      [memberId],
    )).rows[0];
    if(!target) throw Object.assign(new Error('Member account not found.'),{status:404,code:'member_not_found'});
    if(target.role==='admin'||target.id===admin.id) throw Object.assign(new Error('Administrator wallets cannot be adjusted from Member Management.'),{status:403,code:'protected_admin_account'});
    await db.query(`INSERT INTO public.o2ol_token_wallets(user_id) VALUES($1::uuid) ON CONFLICT(user_id) DO NOTHING`,[memberId]);
    const wallet=(await db.query(`SELECT * FROM public.o2ol_token_wallets WHERE user_id=$1::uuid FOR UPDATE`,[memberId])).rows[0];
    const next=Number(wallet.balance||0)+delta;
    if(next<0) throw Object.assign(new Error('This adjustment would make the wallet balance negative.'),{status:409,code:'insufficient_wallet_balance'});
    await db.query(
      `UPDATE public.o2ol_token_wallets
          SET balance=$1,lifetime_granted=lifetime_granted+$2,updated_at=now()
        WHERE user_id=$3::uuid`,
      [next,delta>0?delta:0,memberId],
    );
    const tx=(await db.query(
      `INSERT INTO public.o2ol_token_transactions
        (user_id,wallet_delta,balance_after,transaction_type,provider,metadata)
       VALUES($1::uuid,$2,$3,'admin_adjustment','admin',$4::jsonb)
       RETURNING *`,
      [memberId,delta,next,JSON.stringify({admin_id:admin.id,admin_email:admin.email,reason:safeReason})],
    )).rows[0];
    await db.query('COMMIT');
    return {user_id:memberId,email:target.email,balance:next,transaction:tx};
  }catch(error){
    await db.query('ROLLBACK').catch(()=>{});
    throw error;
  }
}

async function system(db) {
  const [migrations, ai, authRoles] = await Promise.all([
    db.query(`SELECT migration_key,applied_at,notes FROM public.app_migrations ORDER BY applied_at DESC LIMIT 50`),
    db.query(`SELECT feature,count(*)::int AS uses,count(DISTINCT user_id)::int AS users FROM public.ai_usage_events WHERE created_at>=now()-interval '30 days' GROUP BY feature ORDER BY uses DESC,feature ASC`),
    db.query(`SELECT COALESCE(role,'user') AS role,count(*)::int AS count FROM neon_auth."user" WHERE COALESCE(role,'user') <> 'admin' GROUP BY 1 ORDER BY 1`),
  ]);
  return { migrations: migrations.rows, aiUsage30d: ai.rows, authRoles: authRoles.rows };
}

async function dashboard(db, env) {
  await ensureChatModerationSchema(db);
  await ensureO2OLShowVotingSchema(db);
  const [summary,userRows,applicationRows,moderationRows,billingData,loveNoteData,featureData,topFeatureData,chatRoomData,tokenEconomyData,systemData] = await Promise.all([
    overview(db),members(db),applications(db),moderation(db),billing(db),loveNotes(db),featureUsage(db),topFeatureActivity(db,env),chatRoomAnalytics(db),tokenEconomy(db),system(db),
  ]);
  return { summary,members:userRows,applications:applicationRows,moderation:moderationRows,billing:billingData,loveNotes:loveNoteData,featureUsage:featureData,topFeatureActivity:topFeatureData,chatRoom:chatRoomData,tokenEconomy:tokenEconomyData,system:systemData };
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
        const data = await dashboard(db, env);
        return json({ ok:true,recovered:true,mode:'admin_management',admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/members/bulk') {
        const body = await request.json().catch(() => ({}));
        const result = await manageMemberAccountsBulk(db, admin, body?.memberIds, String(body?.action || '').toLowerCase(), body?.reason || '');
        return json({ ok:true, ...result });
      }

      const tokenMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/tokens$/i);
      if (request.method === 'POST' && tokenMatch) {
        const body=await request.json().catch(()=>({}));
        const result=await adjustMemberTokens(db,admin,tokenMatch[1],body?.delta,body?.reason);
        return json({ok:true,...result});
      }

      const tierMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/tier$/i);
      if (request.method === 'POST' && tierMatch) {
        return fail('Premiere/Exclusive tier changes are retired in the O2OL Token model. Use token adjustments or historical conversion reconciliation.',410,'legacy_tier_retired');
      }

      const accessMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/access$/i);
      if (request.method === 'POST' && accessMatch) {
        return fail('Time-based membership grants are retired in the O2OL Token model. Use a documented token adjustment instead.',410,'legacy_access_time_retired');
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
