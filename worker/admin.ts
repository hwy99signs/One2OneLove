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

function cleanReason(value) {
  const reason = String(value || '').trim();
  if (reason.length < 5) throw Object.assign(new Error('A reason of at least 5 characters is required.'), { status: 400, code: 'reason_required' });
  if (reason.length > 1000) throw Object.assign(new Error('Reason must be 1000 characters or less.'), { status: 400, code: 'reason_too_long' });
  return reason;
}

function canonicalAdminPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'basic') return { stored: 'Basic', display: 'Basic', price: 4.99 };
  if (raw === 'premier' || raw === 'premiere') return { stored: 'Premiere', display: 'Premier', price: 9.99 };
  if (raw === 'exclusive') return { stored: 'Exclusive', display: 'Exclusive', price: 19.99 };
  return null;
}

function stripePriceId(env, storedPlan) {
  if (storedPlan === 'Basic') return env.STRIPE_PRICE_BASIC || null;
  if (storedPlan === 'Premiere') return env.STRIPE_PRICE_PREMIERE || null;
  if (storedPlan === 'Exclusive') return env.STRIPE_PRICE_EXCLUSIVE || null;
  return null;
}

async function stripeRequest(env, method, path, params = null) {
  if (!env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Stripe is not configured for admin tier changes.'), { status: 503, code: 'billing_not_configured' });
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

async function ensureAdminActionAudit(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.admin_account_actions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id uuid NOT NULL,
      target_user_id uuid NOT NULL,
      action text NOT NULL,
      reason text NOT NULL,
      from_value text,
      to_value text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`
  );
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
        VALUES ('Basic'::text,1),('Premier'::text,2),('Exclusive'::text,3)
      ), counts AS (
        SELECT CASE
                 WHEN lower(COALESCE(subscription_plan,'Basic')) IN ('basic') THEN 'Basic'
                 WHEN lower(COALESCE(subscription_plan,'')) IN ('premiere','premier') THEN 'Premier'
                 WHEN lower(COALESCE(subscription_plan,''))='exclusive' THEN 'Exclusive'
                 ELSE 'Basic'
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
        (SELECT count(*) FROM public.reviews WHERE COALESCE(is_published,false)=false)::int AS reviews_unpublished`),
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
    moderation: { ...mod, pending_total: Number(mod.stories_pending || 0) + Number(mod.posts_pending || 0) + Number(mod.comments_pending || 0) + Number(mod.reviews_unpublished || 0) },
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
             WHEN lower(COALESCE(u.subscription_plan,'Basic')) IN ('basic') THEN 'Basic'
             WHEN lower(COALESCE(u.subscription_plan,'')) IN ('premiere','premier') THEN 'Premier'
             WHEN lower(COALESCE(u.subscription_plan,''))='exclusive' THEN 'Exclusive'
             ELSE COALESCE(u.subscription_plan,'Basic')
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
  const [summary,userRows,applicationRows,moderationRows,billingData,loveNoteData,featureData,systemData] = await Promise.all([
    overview(db),members(db),applications(db),moderation(db),billing(db),loveNotes(db),featureUsage(db),system(db),
  ]);
  return { summary,members:userRows,applications:applicationRows,moderation:moderationRows,billing:billingData,loveNotes:loveNoteData,featureUsage:featureData,system:systemData };
}

export async function handleAdminRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/admin')) return null;

  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.',401,'unauthorized');

  try {
    return await withDb(env, async (db) => {
      const admin = await adminIdentity(db, auth.user.id);
      if (!admin) return fail('Administrator access required.',403,'forbidden');

      if (url.pathname === '/api/admin/me') {
        return json({ ok:true, admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role } });
      }
      if (url.pathname === '/api/admin/dashboard' && request.method === 'GET') {
        const data = await dashboard(db);
        return json({ ok:true,recovered:true,mode:'admin_control',admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data });
      }

      const memberActionMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/action$/i);
      if (memberActionMatch && request.method === 'POST') {
        const targetUserId = memberActionMatch[1];
        if (targetUserId === admin.id) return fail('You cannot change your own administrator account from this control.', 409, 'self_admin_change_blocked');

        const body = await request.json().catch(() => null);
        const action = String(body?.action || '').trim().toLowerCase();
        const reason = cleanReason(body?.reason);
        const allowed = new Set(['activate','deactivate','suspend','change_tier']);
        if (!allowed.has(action)) return fail('Choose Activate, Deactivate, Suspend, or Change Tier.', 400, 'invalid_action');

        await ensureAdminActionAudit(db);
        const targetResult = await db.query(
          `SELECT p.id,p.email,p.name,p.is_active,p.subscription_plan,p.subscription_price,p.subscription_status,p.stripe_subscription_id,
                  COALESCE(a.role,'user') AS auth_role,COALESCE(a.banned,false) AS banned
             FROM public.users p
             LEFT JOIN neon_auth."user" a ON a.id=p.id
            WHERE p.id=$1::uuid
            LIMIT 1`,
          [targetUserId],
        );
        const target = targetResult.rows[0];
        if (!target) return fail('Member account not found.', 404, 'member_not_found');
        if (target.auth_role === 'admin') return fail('Administrator accounts cannot be changed from Member controls.', 409, 'admin_target_blocked');

        if (action === 'change_tier') {
          const plan = canonicalAdminPlan(body?.tier);
          if (!plan) return fail('Choose Basic, Premier, or Exclusive.', 400, 'invalid_plan');
          const currentDisplay = canonicalAdminPlan(target.subscription_plan)?.display || String(target.subscription_plan || 'Basic');

          if (target.stripe_subscription_id) {
            const priceId = stripePriceId(env, plan.stored);
            if (!priceId) return fail(`Stripe price is not configured for ${plan.display}.`, 503, 'billing_not_configured');
            const subscription = await stripeRequest(env, 'GET', `/subscriptions/${encodeURIComponent(target.stripe_subscription_id)}`);
            const item = subscription?.items?.data?.[0];
            if (!item?.id) return fail('Stripe subscription item could not be found.', 502, 'stripe_subscription_item_missing');
            const params = new URLSearchParams();
            params.set('items[0][id]', item.id);
            params.set('items[0][price]', priceId);
            params.set('proration_behavior', 'none');
            params.set('metadata[user_id]', targetUserId);
            params.set('metadata[plan_name]', plan.stored);
            params.set('metadata[admin_change_reason]', reason.slice(0, 500));
            await stripeRequest(env, 'POST', `/subscriptions/${encodeURIComponent(target.stripe_subscription_id)}`, params);
          }

          await db.query('BEGIN');
          try {
            await db.query(
              `UPDATE public.users
                  SET subscription_plan=$1,subscription_price=$2,updated_at=now()
                WHERE id=$3::uuid`,
              [plan.stored, plan.price, targetUserId],
            );
            if (currentDisplay !== plan.display) {
              await db.query(
                `INSERT INTO public.subscription_changes(user_id,from_plan,to_plan,change_type,effective_date)
                 VALUES($1::uuid,$2,$3,'admin_change',now())`,
                [targetUserId, currentDisplay, plan.display],
              );
            }
            await db.query(
              `INSERT INTO public.admin_account_actions(admin_user_id,target_user_id,action,reason,from_value,to_value)
               VALUES($1::uuid,$2::uuid,'change_tier',$3,$4,$5)`,
              [admin.id, targetUserId, reason, currentDisplay, plan.display],
            );
            await db.query('COMMIT');
          } catch (error) {
            await db.query('ROLLBACK');
            throw error;
          }
          return json({ ok:true, action, memberId:targetUserId, tier:plan.display, stripeSynchronized:Boolean(target.stripe_subscription_id) });
        }

        const fromStatus = target.banned ? 'Suspended' : (target.is_active ? 'Active' : 'Deactivated');
        let toStatus = fromStatus;
        await db.query('BEGIN');
        try {
          if (action === 'activate') {
            await db.query(`UPDATE public.users SET is_active=true,updated_at=now() WHERE id=$1::uuid`, [targetUserId]);
            await db.query(`UPDATE neon_auth."user" SET banned=false,"banReason"=NULL WHERE id=$1::uuid`, [targetUserId]);
            toStatus = 'Active';
          } else if (action === 'deactivate') {
            await db.query(`UPDATE public.users SET is_active=false,updated_at=now() WHERE id=$1::uuid`, [targetUserId]);
            await db.query(`UPDATE neon_auth."user" SET banned=false,"banReason"=NULL WHERE id=$1::uuid`, [targetUserId]);
            toStatus = 'Deactivated';
          } else if (action === 'suspend') {
            await db.query(`UPDATE public.users SET is_active=false,updated_at=now() WHERE id=$1::uuid`, [targetUserId]);
            await db.query(`UPDATE neon_auth."user" SET banned=true,"banReason"=$2 WHERE id=$1::uuid`, [targetUserId, reason]);
            toStatus = 'Suspended';
          }
          await db.query(
            `INSERT INTO public.admin_account_actions(admin_user_id,target_user_id,action,reason,from_value,to_value)
             VALUES($1::uuid,$2::uuid,$3,$4,$5,$6)`,
            [admin.id, targetUserId, action, reason, fromStatus, toStatus],
          );
          await db.query('COMMIT');
        } catch (error) {
          await db.query('ROLLBACK');
          throw error;
        }
        return json({ ok:true, action, memberId:targetUserId, status:toStatus });
      }

      if (url.pathname.startsWith('/api/admin/') && request.method !== 'GET') return fail('Method not allowed.',405,'method_not_allowed');
      return fail('Admin route not found.',404,'not_found');
    });
  } catch (error) {
    console.error('One2OneLove admin API error', error);
    return fail(error?.message || 'Unable to load the admin dashboard.',500,'admin_error');
  }
}
