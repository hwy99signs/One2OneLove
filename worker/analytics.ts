// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? { user, session: active } : null;
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function requireAdmin(db, userId) {
  const result = await db.query(
    `SELECT id,email,name,role,COALESCE(banned,false) AS banned
       FROM neon_auth."user" WHERE id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0] || null;
  return row && row.role === 'admin' && !row.banned ? row : null;
}

async function analytics(db) {
  const [signups, loveNotes, scheduledHealth, featureDaily, featureRank, community, payments, tiers, directSummary] = await Promise.all([
    db.query(`
      WITH days AS (
        SELECT generate_series(current_date-29,current_date,interval '1 day')::date AS day
      ), counts AS (
        SELECT created_at::date AS day,count(*)::int AS signups
          FROM public.users
         WHERE created_at >= current_date-29
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,COALESCE(counts.signups,0)::int AS signups
        FROM days LEFT JOIN counts USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH days AS (
        SELECT generate_series(current_date-29,current_date,interval '1 day')::date AS day
      ), direct AS (
        SELECT COALESCE(sent_date,created_at)::date AS day,count(*)::int AS direct_sent
          FROM public.sent_love_notes
         WHERE COALESCE(sent_date,created_at) >= current_date-29
         GROUP BY 1
      ), scheduled AS (
        SELECT created_at::date AS day,count(*)::int AS scheduled
          FROM public.scheduled_love_notes
         WHERE created_at >= current_date-29
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,
             COALESCE(direct.direct_sent,0)::int AS direct_sent,
             COALESCE(scheduled.scheduled,0)::int AS scheduled
        FROM days
        LEFT JOIN direct USING(day)
        LEFT JOIN scheduled USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH days AS (
        SELECT generate_series(current_date-29,current_date,interval '1 day')::date AS day
      ), health AS (
        SELECT COALESCE(sent_at,last_attempt_at,updated_at,created_at)::date AS day,
               count(*) FILTER (WHERE lower(COALESCE(status,'')) IN ('sent','passed','delivered') OR sent_at IS NOT NULL)::int AS passed,
               count(*) FILTER (WHERE lower(COALESCE(status,''))='failed')::int AS failed,
               count(*) FILTER (WHERE lower(COALESCE(status,'')) IN ('scheduled','pending'))::int AS pending
          FROM public.scheduled_love_notes
         WHERE COALESCE(sent_at,last_attempt_at,updated_at,created_at) >= current_date-29
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,
             COALESCE(health.passed,0)::int AS passed,
             COALESCE(health.failed,0)::int AS failed,
             COALESCE(health.pending,0)::int AS pending
        FROM days LEFT JOIN health USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH days AS (
        SELECT generate_series(current_date-29,current_date,interval '1 day')::date AS day
      ), activity AS (
        SELECT created_at::date AS day,count(*)::int AS events,count(DISTINCT user_id)::int AS users
          FROM public.feature_usage_events
         WHERE created_at >= current_date-29
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,
             COALESCE(activity.events,0)::int AS events,
             COALESCE(activity.users,0)::int AS users
        FROM days LEFT JOIN activity USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH activity(feature,user_id,occurred_at) AS (
        SELECT feature,user_id,created_at FROM public.feature_usage_events
        UNION ALL SELECT 'Love Note Scheduler',user_id,created_at FROM public.scheduled_love_notes
        UNION ALL SELECT 'Love Notes',user_id,COALESCE(sent_date,created_at) FROM public.sent_love_notes
        UNION ALL SELECT 'Date Ideas',user_id,created_at FROM public.custom_date_ideas
        UNION ALL SELECT 'Memory Lane',user_id,created_at FROM public.memories
        UNION ALL SELECT 'Relationship Goals',user_id,created_at FROM public.relationship_goals
        UNION ALL SELECT 'Couples Calendar',user_id,created_at FROM public.calendar_events
        UNION ALL SELECT 'Shared Journals',user_id,created_at FROM public.shared_journals
        UNION ALL SELECT 'Relationship Milestones',user_id,created_at FROM public.relationship_milestones
        UNION ALL SELECT 'Community',author_id,created_at FROM public.community_posts
        UNION ALL SELECT 'Community',author_id,created_at FROM public.post_comments
        UNION ALL SELECT 'Chat',sender_id,created_at FROM public.messages WHERE COALESCE(is_deleted,false)=false
      )
      SELECT feature,count(*)::int AS activity,count(DISTINCT user_id)::int AS users
        FROM activity
       WHERE occurred_at >= current_date-29 AND user_id IS NOT NULL
       GROUP BY feature
       ORDER BY activity DESC,feature ASC
       LIMIT 12`),
    db.query(`
      WITH days AS (
        SELECT generate_series(current_date-29,current_date,interval '1 day')::date AS day
      ), posts AS (
        SELECT created_at::date AS day,count(*)::int AS posts FROM public.community_posts
         WHERE created_at>=current_date-29 GROUP BY 1
      ), comments AS (
        SELECT created_at::date AS day,count(*)::int AS comments FROM public.post_comments
         WHERE created_at>=current_date-29 GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,
             COALESCE(posts.posts,0)::int AS posts,
             COALESCE(comments.comments,0)::int AS comments
        FROM days LEFT JOIN posts USING(day) LEFT JOIN comments USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH days AS (
        SELECT generate_series(current_date-29,current_date,interval '1 day')::date AS day
      ), counts AS (
        SELECT created_at::date AS day,count(*)::int AS payments
          FROM public.payment_history
         WHERE created_at>=current_date-29
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,COALESCE(counts.payments,0)::int AS payments
        FROM days LEFT JOIN counts USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH desired(plan,sort_order) AS (
        VALUES ('Basic'::text,1),('Premier'::text,2),('Exclusive'::text,3)
      ), counts AS (
        SELECT CASE
                 WHEN lower(COALESCE(subscription_plan,'Basis')) IN ('basis','basic') THEN 'Basic'
                 WHEN lower(COALESCE(subscription_plan,'')) IN ('premiere','premier') THEN 'Premier'
                 WHEN lower(COALESCE(subscription_plan,''))='exclusive' THEN 'Exclusive'
                 ELSE 'Basic'
               END AS plan,count(*)::int AS count
          FROM public.users GROUP BY 1
      )
      SELECT desired.plan,COALESCE(counts.count,0)::int AS count
        FROM desired LEFT JOIN counts USING(plan)
       ORDER BY desired.sort_order`),
    db.query(`
      SELECT count(*)::int AS sent,
             0::int AS passed,
             0::int AS failed,
             0::int AS pending
        FROM public.sent_love_notes`),
  ]);

  return {
    rangeDays: 30,
    signups: signups.rows,
    loveNotes: loveNotes.rows,
    scheduledHealth: scheduledHealth.rows,
    featureDaily: featureDaily.rows,
    featureRank: featureRank.rows,
    community: community.rows,
    payments: payments.rows,
    tiers: tiers.rows,
    directDelivery: {
      ...(directSummary.rows[0] || { sent:0,passed:0,failed:0,pending:0 }),
      receiptTrackingActive: false,
      note: 'Direct-send delivery receipts will populate Passed, Failed and Pending after the SMS provider callback is connected.',
    },
  };
}

export async function handleAnalyticsRequest(request, env, url) {
  if (url.pathname !== '/api/admin/analytics') return null;
  if (request.method !== 'GET') return fail('Method not allowed.',405,'method_not_allowed');

  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.',401,'unauthorized');

  try {
    return await withDb(env, async (db) => {
      const admin = await requireAdmin(db, auth.user.id);
      if (!admin) return fail('Administrator access required.',403,'forbidden');
      const data = await analytics(db);
      return json({ ok:true,admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data });
    });
  } catch (error) {
    console.error('One2OneLove analytics API error', error);
    return fail(error?.message || 'Unable to load analytics.',500,'analytics_error');
  }
}
