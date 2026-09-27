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
  ['Subscription / Billing', 'Account'],
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
           COALESCE(u.is_verified,a."emailVerified",false) AS is_verified,
           CASE
             WHEN u.id IS NULL THEN 'Guest'
             WHEN u.stripe_subscription_id IS NULL
               AND lower(COALESCE(u.subscription_status,'inactive')) NOT IN ('active','trial','trialing','past_due')
               AND u.created_at + interval '24 hours' > now() THEN 'Guest'
             WHEN lower(COALESCE(u.subscription_plan,'premiere')) IN ('basic','premiere','premier') THEN 'Premiere'
             WHEN lower(COALESCE(u.subscription_plan,''))='exclusive' THEN 'Exclusive'
             ELSE 'Premiere'
           END AS subscription_plan,
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
    FROM public.feature_usage_events WHERE feature='Date Ideas' AND event_type='view'
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
    SELECT regexp_replace(title,'^__builtin__:', '') AS name,
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
    FROM public.feature_usage_events WHERE feature=$2 AND event_type='view'
  `,[feature]);

  const routedTop = async (feature,prefix) => {
    const result=await db.query(`
      SELECT substring(route from $3) AS name,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '7 days'))::int AS d7,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '14 days'))::int AS d14,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '21 days'))::int AS d21,
        count(*) FILTER (WHERE created_at>=GREATEST($1::timestamptz,now()-interval '30 days'))::int AS d30
      FROM public.feature_usage_events
      WHERE feature=$2 AND event_type='action' AND route LIKE $4
        AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
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
    FROM public.feature_usage_events
    WHERE event_type='view'
      AND feature IN ('Communication Practice','Meditation','Podcasts','Articles','LGBTQ+ Support','Couple Activities','Relationship Quizzes')
      AND created_at>=GREATEST($1::timestamptz,now()-interval '30 days')
    GROUP BY feature ORDER BY d30 DESC,name ASC LIMIT 5
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
  const [summary,userRows,applicationRows,moderationRows,billingData,loveNoteData,featureData,topFeatureData,systemData] = await Promise.all([
    overview(db),members(db),applications(db),moderation(db),billing(db),loveNotes(db),featureUsage(db),topFeatureActivity(db,env),system(db),
  ]);
  return { summary,members:userRows,applications:applicationRows,moderation:moderationRows,billing:billingData,loveNotes:loveNoteData,featureUsage:featureData,topFeatureActivity:topFeatureData,system:systemData };
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
        const data = await dashboard(db);
        return json({ ok:true,recovered:true,mode:'admin_management',admin:{ id:admin.id,email:admin.email,name:admin.name,role:admin.role },generatedAt:new Date().toISOString(),...data });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/members/bulk') {
        const body = await request.json().catch(() => ({}));
        const result = await manageMemberAccountsBulk(db, admin, body?.memberIds, String(body?.action || '').toLowerCase(), body?.reason || '');
        return json({ ok:true, ...result });
      }

      const tierMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/tier$/i);
      if (request.method === 'POST' && tierMatch) {
        const body = await request.json().catch(() => ({}));
        const result = await changeMemberTier(db, env, admin, tierMatch[1], body?.plan);
        return json({ ok:true, member:result });
      }

      const accessMatch = url.pathname.match(/^\/api\/admin\/members\/([0-9a-f-]{36})\/access$/i);
      if (request.method === 'POST' && accessMatch) {
        const body = await request.json().catch(() => ({}));
        const result = await grantMemberAccessTime(db, admin, accessMatch[1], body?.unit, body?.amount);
        return json({ ok:true, member:result });
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
