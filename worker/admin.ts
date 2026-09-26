// @ts-nocheck
import { Client } from 'pg';

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
  ['Subscription / Billing', 'Account'],
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
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
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

async function overview(db) {
  const [users, plans, applications, moderation, payments, loveNotes, communities] = await Promise.all([
    db.query(`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE created_at >= now()-interval '7 days')::int AS new_7d,
             count(*) FILTER (WHERE COALESCE(is_active,true)=false)::int AS inactive,
             count(*) FILTER (WHERE COALESCE(is_verified,false)=true)::int AS verified
        FROM public.users`),
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
          FROM public.users
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
    SELECT u.id,u.email,u.name,u.user_type,u.relationship_status,u.location,
           COALESCE(u.is_active,true) AS is_active,
           COALESCE(u.is_verified,false) AS is_verified,
           CASE
             WHEN lower(COALESCE(u.subscription_plan,'premiere')) IN ('basic','premiere','premier') THEN 'Premiere'
             WHEN lower(COALESCE(u.subscription_plan,''))='exclusive' THEN 'Exclusive'
             ELSE 'Premiere'
           END AS subscription_plan,
           COALESCE(u.subscription_status,'active') AS subscription_status,
           u.subscription_price,u.created_at,u.updated_at,
           COALESCE(a.role,'user') AS auth_role,
           COALESCE(a.banned,false) AS banned,
           a."banReason" AS ban_reason
      FROM public.users u
      LEFT JOIN neon_auth."user" a ON a.id=u.id
     ORDER BY u.created_at DESC
     LIMIT 250`);
  return result.rows;
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
      UNION ALL SELECT feature,user_id,created_at FROM public.feature_usage_events
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

async function system(db) {
  const [migrations, ai, authRoles] = await Promise.all([
    db.query(`SELECT migration_key,applied_at,notes FROM public.app_migrations ORDER BY applied_at DESC LIMIT 50`),
    db.query(`SELECT feature,count(*)::int AS uses,count(DISTINCT user_id)::int AS users FROM public.ai_usage_events WHERE created_at>=now()-interval '30 days' GROUP BY feature ORDER BY uses DESC,feature ASC`),
    db.query(`SELECT COALESCE(role,'user') AS role,count(*)::int AS count FROM neon_auth."user" GROUP BY 1 ORDER BY 1`),
  ]);
  return { migrations: migrations.rows, aiUsage30d: ai.rows, authRoles: authRoles.rows };
}

async function dashboard(db) {
  await ensureChatModerationSchema(db);
  const [summary,userRows,applicationRows,moderationRows,billingData,loveNoteData,featureData,systemData] = await Promise.all([
    overview(db),members(db),applications(db),moderation(db),billing(db),loveNotes(db),featureUsage(db),system(db),
  ]);
  return { summary,members:userRows,applications:applicationRows,moderation:moderationRows,billing:billingData,loveNotes:loveNoteData,featureUsage:featureData,system:systemData };
}

export async function handleAdminRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/admin')) return null;
  if (request.method !== 'GET') return fail('Method not allowed.',405,'method_not_allowed');

  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.',401,'unauthorized');

  try {
    return await withDb(env, async (db) => {
      const admin = await adminIdentity(db, auth.user.id);
      if (!admin) return fail('Administrator access required.',403,'forbidden');

      if (url.pathname === '/api/admin/me') {
        return json({ ok:true, admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role } });
      }
      if (url.pathname === '/api/admin/dashboard') {
        const data = await dashboard(db);
        return json({ ok:true,recovered:true,mode:'read_only_recovery',admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data });
      }
      return fail('Admin route not found.',404,'not_found');
    });
  } catch (error) {
    console.error('One2OneLove admin API error', error);
    return fail(error?.message || 'Unable to load the admin dashboard.',500,'admin_error');
  }
}
