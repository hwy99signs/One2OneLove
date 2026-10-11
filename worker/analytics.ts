// @ts-nocheck
import { Client } from 'pg';
import { getVerifiedAdminMfaIdentity } from './admin-mfa';
import { getEdgeCounts } from './cloudflare-edge.js';
import { SWEEP_CTES, SWEEP_EVENT_FILTER } from './sweep-exclusion.js';

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

async function requireAdmin(db, userId) {
  const result = await db.query(
    `SELECT id,email,name,role,COALESCE(banned,false) AS banned
       FROM neon_auth."user" WHERE id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0] || null;
  return row && row.role === 'admin' && !row.banned ? row : null;
}

function analyticsBaselineSql(env) {
  const parsed = Date.parse(String(env.ANALYTICS_BASELINE_AT || ''));
  const iso = Number.isNaN(parsed) ? '1970-01-01T00:00:00.000Z' : new Date(parsed).toISOString();
  return `'${iso}'::timestamptz`;
}

async function analytics(db, env) {
  const baselineSql = analyticsBaselineSql(env);
  // Day boundaries follow the owner's timezone (America/Chicago), not the
  // database session timezone (UTC): "today" on the dashboard must mean the
  // owner's today, and daily buckets must match the window filter exactly.
  const todaySql = `(now() AT TIME ZONE 'America/Chicago')::date`;
  const windowStartSql = `((${todaySql} - 29) AT TIME ZONE 'America/Chicago')`;
  const interactionSchema = await db.query(`
    SELECT
      to_regclass('public.interaction_events') IS NOT NULL AS ready,
      EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='interaction_events' AND column_name='language'
      ) AS language_ready,
      EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='interaction_events' AND column_name='traffic_source'
      ) AS traffic_source_ready
  `);
  const interactionReady = Boolean(interactionSchema.rows[0]?.ready);
  const languageReady = Boolean(interactionSchema.rows[0]?.language_ready);
  const trafficSourceReady = Boolean(interactionSchema.rows[0]?.traffic_source_ready);

  const zeroSiteUsage = () => db.query(`
    SELECT to_char(day,'YYYY-MM-DD') AS date,
           0::int AS page_views,0::int AS clicks,0::int AS visitors
      FROM generate_series(${todaySql}-29,${todaySql},interval '1 day') AS day
     ORDER BY day
  `);

  const siteUsagePromise = interactionReady ? db.query(`
    WITH ${SWEEP_CTES}, days AS (
      SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
    ), usage AS (
      SELECT (e.created_at AT TIME ZONE 'America/Chicago')::date AS day,
             count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
             count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
             count(*) FILTER (WHERE e.event_type='action')::int AS actions,
             count(DISTINCT CASE
               WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
               ELSE 'v:' || e.visitor_id
             END)::int AS visitors
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
         AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
       GROUP BY 1
    )
    SELECT to_char(days.day,'YYYY-MM-DD') AS date,
           COALESCE(usage.page_views,0)::int AS page_views,
           COALESCE(usage.clicks,0)::int AS clicks,
           COALESCE(usage.visitors,0)::int AS visitors
      FROM days LEFT JOIN usage USING(day)
     ORDER BY days.day
  `) : zeroSiteUsage();

  const siteUsageSummaryPromise = interactionReady ? db.query(`
    WITH ${SWEEP_CTES}
    SELECT
      count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
      count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
      count(DISTINCT CASE
        WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
        ELSE 'v:' || e.visitor_id
      END)::int AS unique_visitors,
      count(DISTINCT e.visitor_id) FILTER (WHERE e.actor_type='anonymous')::int AS anonymous_visitors,
      count(DISTINCT e.user_id) FILTER (WHERE e.actor_type='registered')::int AS registered_users
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
  `) : { rows:[{ page_views:0,clicks:0,unique_visitors:0,anonymous_visitors:0,registered_users:0 }] };

  const languageUsagePromise = interactionReady && languageReady ? db.query(`
    WITH ${SWEEP_CTES}, desired(language,label,sort_order) AS (
      VALUES
        ('en'::text,'English'::text,1),
        ('es'::text,'Spanish'::text,2),
        ('fr'::text,'French'::text,3),
        ('it'::text,'Italian'::text,4),
        ('de'::text,'German'::text,5)
    ), usage AS (
      SELECT e.language,
             count(*)::int AS total_events,
             count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
             count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
             count(*) FILTER (WHERE e.event_type='action')::int AS actions,
             count(DISTINCT CASE
               WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
               ELSE 'v:' || e.visitor_id
             END)::int AS unique_visitors,
             count(DISTINCT e.user_id) FILTER (WHERE e.actor_type='registered')::int AS registered_users,
             count(DISTINCT e.visitor_id) FILTER (WHERE e.actor_type='anonymous')::int AS anonymous_visitors
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
         AND e.language IN ('en','es','fr','it','de')
         AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
       GROUP BY e.language
    )
    SELECT desired.language,desired.label,
           COALESCE(usage.total_events,0)::int AS total_events,
           COALESCE(usage.page_views,0)::int AS page_views,
           COALESCE(usage.clicks,0)::int AS clicks,
           COALESCE(usage.actions,0)::int AS actions,
           COALESCE(usage.unique_visitors,0)::int AS unique_visitors,
           COALESCE(usage.registered_users,0)::int AS registered_users,
           COALESCE(usage.anonymous_visitors,0)::int AS anonymous_visitors
      FROM desired LEFT JOIN usage USING(language)
     ORDER BY desired.sort_order
  `) : { rows:[
    { language:'en',label:'English',total_events:0,page_views:0,clicks:0,actions:0,unique_visitors:0,registered_users:0,anonymous_visitors:0 },
    { language:'es',label:'Spanish',total_events:0,page_views:0,clicks:0,actions:0,unique_visitors:0,registered_users:0,anonymous_visitors:0 },
    { language:'fr',label:'French',total_events:0,page_views:0,clicks:0,actions:0,unique_visitors:0,registered_users:0,anonymous_visitors:0 },
    { language:'it',label:'Italian',total_events:0,page_views:0,clicks:0,actions:0,unique_visitors:0,registered_users:0,anonymous_visitors:0 },
    { language:'de',label:'German',total_events:0,page_views:0,clicks:0,actions:0,unique_visitors:0,registered_users:0,anonymous_visitors:0 },
  ] };

  const trafficSourcePromise = interactionReady && trafficSourceReady ? db.query(`
    WITH ${SWEEP_CTES}, desired(source,label,sort_order) AS (
      VALUES
        ('facebook'::text,'Facebook'::text,1),
        ('instagram'::text,'Instagram'::text,2),
        ('threads'::text,'Threads'::text,3),
        ('tiktok'::text,'TikTok'::text,4),
        ('x'::text,'X'::text,5),
        ('youtube'::text,'YouTube'::text,6),
        ('linkedin'::text,'LinkedIn'::text,7),
        ('pinterest'::text,'Pinterest'::text,8),
        ('direct'::text,'Direct'::text,9),
        ('other'::text,'Other'::text,10)
    ), usage AS (
      SELECT e.traffic_source AS source,
             count(DISTINCT e.session_id) FILTER (WHERE e.event_type='page_view')::int AS landings,
             count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
             count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
             count(DISTINCT CASE
               WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
               ELSE 'v:' || e.visitor_id
             END)::int AS unique_visitors,
             count(DISTINCT e.session_id) FILTER (WHERE e.event_type='click')::int AS engaged_sessions
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
         AND e.traffic_source IN ('facebook','instagram','threads','tiktok','x','youtube','linkedin','pinterest','direct','other')
         AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
       GROUP BY e.traffic_source
    )
    SELECT desired.source,desired.label,
           COALESCE(usage.landings,0)::int AS landings,
           COALESCE(usage.page_views,0)::int AS page_views,
           COALESCE(usage.clicks,0)::int AS clicks,
           COALESCE(usage.unique_visitors,0)::int AS unique_visitors,
           COALESCE(usage.engaged_sessions,0)::int AS engaged_sessions
      FROM desired LEFT JOIN usage USING(source)
     ORDER BY desired.sort_order
  `) : { rows:[
    {source:'facebook',label:'Facebook',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'instagram',label:'Instagram',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'threads',label:'Threads',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'tiktok',label:'TikTok',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'x',label:'X',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'youtube',label:'YouTube',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'linkedin',label:'LinkedIn',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'pinterest',label:'Pinterest',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'direct',label:'Direct',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
    {source:'other',label:'Other',landings:0,page_views:0,clicks:0,unique_visitors:0,engaged_sessions:0},
  ] };

  const trafficSourceUnknownPromise = interactionReady ? db.query(trafficSourceReady ? `
    SELECT count(*)::int AS events
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND e.traffic_source IS NULL
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')
  ` : `
    SELECT count(*)::int AS events
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')
  `) : { rows:[{ events:0 }] };

  const languageUnknownPromise = interactionReady ? db.query(languageReady ? `
    SELECT count(*)::int AS events
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND (e.language IS NULL OR e.language NOT IN ('en','es','fr','it','de'))
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')
  ` : `
    SELECT count(*)::int AS events
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')
  `) : { rows:[{ events:0 }] };

  const featureDailyAllPromise = interactionReady ? db.query(`
    WITH ${SWEEP_CTES}, days AS (
      SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
    ), activity AS (
      SELECT (e.created_at AT TIME ZONE 'America/Chicago')::date AS day,
             count(*)::int AS events,
             count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
             count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
             count(*) FILTER (WHERE e.event_type='action')::int AS actions,
             count(DISTINCT CASE
               WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
               ELSE 'v:' || e.visitor_id
             END)::int AS users
        FROM public.interaction_events e
        LEFT JOIN neon_auth."user" a ON a.id=e.user_id
       WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
         AND e.feature IS NOT NULL
         AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
       GROUP BY 1
    )
    SELECT to_char(days.day,'YYYY-MM-DD') AS date,
           COALESCE(activity.events,0)::int AS events,
           COALESCE(activity.page_views,0)::int AS page_views,
           COALESCE(activity.clicks,0)::int AS clicks,
           COALESCE(activity.actions,0)::int AS actions,
           COALESCE(activity.users,0)::int AS users
      FROM days LEFT JOIN activity USING(day)
     ORDER BY days.day
  `) : db.query(`
    SELECT to_char(day,'YYYY-MM-DD') AS date,
           0::int AS events,0::int AS page_views,0::int AS clicks,0::int AS actions,0::int AS users
      FROM generate_series(${todaySql}-29,${todaySql},interval '1 day') AS day
     ORDER BY day
  `);

  const featureRankAllPromise = interactionReady ? db.query(`
    WITH ${SWEEP_CTES}
    SELECT e.feature,
           count(*)::int AS activity,
           count(*) FILTER (WHERE e.event_type='page_view')::int AS page_views,
           count(*) FILTER (WHERE e.event_type='click')::int AS clicks,
           count(*) FILTER (WHERE e.event_type='action')::int AS actions,
           count(DISTINCT CASE
             WHEN e.user_id IS NOT NULL THEN 'u:' || e.user_id::text
             ELSE 'v:' || e.visitor_id
           END)::int AS users,
           count(DISTINCT e.visitor_id) FILTER (WHERE e.actor_type='anonymous')::int AS anonymous_visitors,
           count(DISTINCT e.user_id) FILTER (WHERE e.actor_type='registered')::int AS registered_users
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND e.feature IS NOT NULL
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
     GROUP BY e.feature
     ORDER BY activity DESC,e.feature ASC
     LIMIT 50
  `) : { rows:[] };

  const recentClicksPromise = interactionReady ? db.query(`
    WITH ${SWEEP_CTES}
    SELECT e.created_at,e.route,e.feature,e.actor_type,e.access_type,
           e.traffic_source,e.language,e.control_type,e.control_key,e.destination
      FROM public.interaction_events e
      LEFT JOIN neon_auth."user" a ON a.id=e.user_id
     WHERE e.event_type='click'
       AND e.created_at>=GREATEST(${windowStartSql}, ${baselineSql})
       AND (e.user_id IS NULL OR COALESCE(a.role,'user') <> 'admin')${SWEEP_EVENT_FILTER}
     ORDER BY e.created_at DESC
     LIMIT 50
  `) : { rows:[] };

  const [signups, loveNotes, scheduledHealth, featureDaily, featureRank, community, payments, directSummary, siteUsage, siteUsageSummary, languageUsage, languageUnknown, trafficSources, trafficSourceUnknown, featureDailyAll, featureRankAll, recentClicks] = await Promise.all([
    db.query(`
      WITH days AS (
        SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
      ), counts AS (
        SELECT (COALESCE(u.created_at,a."createdAt") AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS signups
          FROM neon_auth."user" a
          FULL OUTER JOIN public.users u ON u.id=a.id
         WHERE COALESCE(u.created_at,a."createdAt") >= GREATEST(${windowStartSql}, ${baselineSql})
           AND COALESCE(a.role,'user') <> 'admin'
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,COALESCE(counts.signups,0)::int AS signups
        FROM days LEFT JOIN counts USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH days AS (
        SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
      ), direct AS (
        SELECT (COALESCE(sent_date,created_at) AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS direct_sent
          FROM public.sent_love_notes
         WHERE COALESCE(sent_date,created_at) >= GREATEST(${windowStartSql}, ${baselineSql})
         GROUP BY 1
      ), scheduled AS (
        SELECT (created_at AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS scheduled
          FROM public.scheduled_love_notes
         WHERE created_at >= GREATEST(${windowStartSql}, ${baselineSql})
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
        SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
      ), health AS (
        SELECT (COALESCE(sent_at,last_attempt_at,updated_at,created_at) AT TIME ZONE 'America/Chicago')::date AS day,
               count(*) FILTER (WHERE lower(COALESCE(status,'')) IN ('sent','passed','delivered') OR sent_at IS NOT NULL)::int AS passed,
               count(*) FILTER (WHERE lower(COALESCE(status,''))='failed')::int AS failed,
               count(*) FILTER (WHERE lower(COALESCE(status,'')) IN ('scheduled','pending'))::int AS pending
          FROM public.scheduled_love_notes
         WHERE COALESCE(sent_at,last_attempt_at,updated_at,created_at) >= GREATEST(${windowStartSql}, ${baselineSql})
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
        SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
      ), activity AS (
        SELECT (created_at AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS events,count(DISTINCT user_id)::int AS users
          FROM public.feature_usage_events
         WHERE created_at >= GREATEST(${windowStartSql}, ${baselineSql})
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
       WHERE occurred_at >= GREATEST(${windowStartSql}, ${baselineSql}) AND user_id IS NOT NULL
       GROUP BY feature
       ORDER BY activity DESC,feature ASC
       LIMIT 12`),
    db.query(`
      WITH days AS (
        SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
      ), posts AS (
        SELECT (created_at AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS posts FROM public.community_posts
         WHERE created_at>=GREATEST(${windowStartSql}, ${baselineSql}) GROUP BY 1
      ), comments AS (
        SELECT (created_at AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS comments FROM public.post_comments
         WHERE created_at>=GREATEST(${windowStartSql}, ${baselineSql}) GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,
             COALESCE(posts.posts,0)::int AS posts,
             COALESCE(comments.comments,0)::int AS comments
        FROM days LEFT JOIN posts USING(day) LEFT JOIN comments USING(day)
       ORDER BY days.day`),
    db.query(`
      WITH days AS (
        SELECT generate_series(${todaySql}-29,${todaySql},interval '1 day')::date AS day
      ), counts AS (
        SELECT (created_at AT TIME ZONE 'America/Chicago')::date AS day,count(*)::int AS payments
          FROM public.payment_history
         WHERE created_at>=GREATEST(${windowStartSql}, ${baselineSql})
         GROUP BY 1
      )
      SELECT to_char(days.day,'YYYY-MM-DD') AS date,COALESCE(counts.payments,0)::int AS payments
        FROM days LEFT JOIN counts USING(day)
       ORDER BY days.day`),
    db.query(`
      SELECT count(*)::int AS sent,
             0::int AS passed,
             0::int AS failed,
             0::int AS pending
        FROM public.sent_love_notes
       WHERE COALESCE(sent_date,created_at) >= ${baselineSql}`),
    siteUsagePromise,
    siteUsageSummaryPromise,
    languageUsagePromise,
    languageUnknownPromise,
    trafficSourcePromise,
    trafficSourceUnknownPromise,
    featureDailyAllPromise,
    featureRankAllPromise,
    recentClicksPromise,
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
    siteUsage: siteUsage.rows,
    siteUsageSummary: siteUsageSummary.rows[0] || { page_views:0,clicks:0,unique_visitors:0,anonymous_visitors:0,registered_users:0 },
    languageUsage: languageUsage.rows,
    languageUnknownEvents: Number(languageUnknown.rows[0]?.events || 0),
    languageTrackingActive: interactionReady && languageReady,
    trafficSources: trafficSources.rows,
    trafficSourceUnknownEvents: Number(trafficSourceUnknown.rows[0]?.events || 0),
    trafficSourceTrackingActive: interactionReady && trafficSourceReady,
    featureDailyAll: featureDailyAll.rows,
    featureRankAll: featureRankAll.rows,
    recentClicks: recentClicks.rows,
    directDelivery: {
      ...(directSummary.rows[0] || { sent:0,passed:0,failed:0,pending:0 }),
      receiptTrackingActive: false,
      note: 'Direct-send delivery receipts will populate Passed, Failed and Pending after the SMS provider callback is connected.',
    },
  };
}


async function publicStats(db, env) {
  const baselineSql = analyticsBaselineSql(env);
  const [notes, week, month, year] = await Promise.all([
    db.query(`SELECT count(*)::int AS count FROM public.sent_love_notes WHERE COALESCE(sent_date,created_at) >= ${baselineSql}`),
    db.query(`SELECT COALESCE(max(note_count),0)::int AS count FROM (
      SELECT user_id,count(*)::int AS note_count
      FROM public.sent_love_notes
      WHERE user_id IS NOT NULL AND COALESCE(sent_date,created_at) >= GREATEST(${baselineSql}, now()-interval '7 days')
      GROUP BY user_id
    ) ranked`),
    db.query(`SELECT COALESCE(max(note_count),0)::int AS count FROM (
      SELECT user_id,count(*)::int AS note_count
      FROM public.sent_love_notes
      WHERE user_id IS NOT NULL AND COALESCE(sent_date,created_at) >= GREATEST(${baselineSql}, now()-interval '30 days')
      GROUP BY user_id
    ) ranked`),
    db.query(`SELECT COALESCE(max(note_count),0)::int AS count FROM (
      SELECT user_id,count(*)::int AS note_count
      FROM public.sent_love_notes
      WHERE user_id IS NOT NULL AND COALESCE(sent_date,created_at) >= GREATEST(${baselineSql}, now()-interval '365 days')
      GROUP BY user_id
    ) ranked`),
  ]);
  const result = {
    notesCreated: Number(notes.rows[0]?.count || 0),
    happyCouples: 0,
    mostNotesWeek: Number(week.rows[0]?.count || 0),
    mostNotesMonth: Number(month.rows[0]?.count || 0),
    mostNotesYear: Number(year.rows[0]?.count || 0),
  };
  return { ...result, hasDisplayableData: Object.values(result).some(value => Number(value) > 0) };
}

export async function handleAnalyticsRequest(request, env, url) {
  if (url.pathname === '/api/public-stats') {
    if (request.method !== 'GET') return fail('Method not allowed.',405,'method_not_allowed');
    try {
      return await withDb(env, async db => json({ ok:true, generatedAt:new Date().toISOString(), ...(await publicStats(db, env)) }));
    } catch (error) {
      console.error('One2OneLove public stats API error', error);
      return json({ ok:true, notesCreated:0, happyCouples:0, mostNotesWeek:0, mostNotesMonth:0, mostNotesYear:0, hasDisplayableData:false });
    }
  }
  if (url.pathname !== '/api/admin/analytics') return null;
  if (request.method !== 'GET') return fail('Method not allowed.',405,'method_not_allowed');

  const auth = await session(request, env);
  const mfaFallback = auth ? null : await getVerifiedAdminMfaIdentity(request, env);
  if (!auth && !mfaFallback) return fail('Authentication required.',401,'unauthorized');

  // Cloudflare edge counts ride along in the same payload. The fetch is
  // independent of the database, so it starts now and runs in parallel;
  // it is cached ~15 minutes inside cloudflare-edge.js and never throws.
  const edgeCountsPromise = getEdgeCounts(env).catch(() => ({ connected:false, reason:'unavailable' }));

  try {
    return await withDb(env, async (db) => {
      const admin = mfaFallback?.admin || await requireAdmin(db, auth.user.id);
      if (!admin) return fail('Administrator access required.',403,'forbidden');
      const data = await analytics(db, env);
      const edgeCounts = await edgeCountsPromise;
      return json({ ok:true,admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data,edgeCounts });
    });
  } catch (error) {
    console.error('One2OneLove analytics API error', error);
    return fail(error?.message || 'Unable to load analytics.',500,'analytics_error');
  }
}
