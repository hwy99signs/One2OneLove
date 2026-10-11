// @ts-nocheck
import { Client } from 'pg';
import { deriveClickControlKey, deriveClickFeature, resolveClickIdentity } from './click-labels.js';

const TRACKABLE_FEATURES = new Set([
  'Home',
  'About Us',
  'Sign In',
  'Sign Up',
  'Forgot Password',
  'Help Center',
  'Contact Us',
  'Privacy Policy',
  'Terms of Service',
  'TikTok Post',
  'Credit Wallet',
  'Love Notes',
  'Love Note Scheduler',
  'Date Ideas',
  'Relationship Quizzes',
  'Love Language Quiz',
  'Anniversary Tracker',
  'Memory Lane',
  'Relationship Goals',
  'Couples Calendar',
  'Shared Journals',
  'Relationship Milestones',
  'Couples Profile',
  'Couples Dashboard',
  'Relationship Support',
  'Community',
  'Community Chat',
  'Chat',
  'Podcasts',
  'Articles',
  'LGBTQ+ Support',
  'Invite & Share',
  'Communication Practice',
  'Meditation',
  'Couple Activities',
  'Find Friends',
  'Friend Requests',
  'Member Profile',
  'Subscription / Billing',
  'Relationship Games',
  'What Should They Do?',
  'Scratch Game',
  'Like Minded?',
  'O2OL Studio',
  'MyMatchIQ',
  'Reviews',
  'Suggestions',
  'Professionals',
  'Professional Onboarding',
  'Account Verification',
  'Win A Cruise',
  'AI Content Creator',
  'Relationship Coach',
  'Gamification',
]);

const LEGACY_EVENT_TYPES = new Set(['view', 'action']);
const INTERACTION_EVENT_TYPES = new Set(['click', 'page_view', 'action']);
const INTERACTION_LANGUAGES = new Set(['en','es','fr','it','de']);
const TRAFFIC_SOURCES = new Set(['facebook','instagram','threads','tiktok','x','youtube','linkedin','pinterest','direct','other']);
let interactionSchemaReady = false;

async function session(request, env, requireVerified = true) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  if (!user?.id || !active) return null;
  if (requireVerified && user?.emailVerified !== true) return null;
  return { user, session: active };
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function clean(value, max) {
  const text = String(value || '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
}

function cleanPath(value, max = 300) {
  const text = clean(value, max);
  if (!text || !text.startsWith('/')) return null;
  return text.split('?')[0].split('#')[0].slice(0, max);
}

function validClientId(value) {
  const text = clean(value, 100);
  return text && /^[A-Za-z0-9._:-]{6,100}$/.test(text) ? text : null;
}

function validUuid(value) {
  const text = clean(value, 100);
  return text && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text) ? text : null;
}

function cleanLanguage(value) {
  const language = clean(value, 10)?.toLowerCase();
  return language && INTERACTION_LANGUAGES.has(language) ? language : null;
}

function cleanTrafficSource(value) {
  const source = clean(value, 20)?.toLowerCase();
  return source && TRAFFIC_SOURCES.has(source) ? source : 'other';
}

async function ensureInteractionSchema(db) {
  if (interactionSchemaReady) return;
  const readiness = await db.query(`
    SELECT
      to_regclass('public.interaction_events') IS NOT NULL AS table_ready,
      EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='interaction_events' AND column_name='language'
      ) AS language_ready,
      EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema='public' AND table_name='interaction_events' AND column_name='traffic_source'
      ) AS traffic_source_ready,
      EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname='interaction_events_event_type_check'
           AND conrelid=to_regclass('public.interaction_events')
           AND position('action' in pg_get_constraintdef(oid))>0
      ) AS action_ready
  `);
  const state = readiness.rows[0] || {};
  if (!state.table_ready || !state.language_ready || !state.traffic_source_ready || !state.action_ready) {
    throw new Error('Interaction analytics schema is not prepared.');
  }
  // Click identity (2026-10-10): interaction events carry the signed-in
  // member's username snapshot in a dedicated column. Additive and
  // idempotent, following the codebase's lazy ensure-schema convention
  // (see ensurePresenceSchema below); the same change is recorded in
  // neon-migrations/2026-10-10-interaction-events-username.sql.
  await db.query(`ALTER TABLE public.interaction_events ADD COLUMN IF NOT EXISTS username text`);
  interactionSchemaReady = true;
}

async function handleInteractionEvent(request, env) {
  if (request.method !== 'POST') return json({ ok:false,error:{ message:'Method not allowed.' } },405);

  const body = await request.json().catch(() => null);
  const eventType = clean(body?.eventType, 30)?.toLowerCase();
  const visitorId = validClientId(body?.visitorId);
  const sessionId = validClientId(body?.sessionId);
  // Path casing is normalized at ingest (2026-10-10): the same page used
  // to be stored as /signin, /SignIn and /Signin, splitting its counts.
  // Future rows only — stored history is never rewritten.
  const route = cleanPath(body?.route)?.toLowerCase() || null;
  const destinationRaw = clean(body?.destination, 300);
  const destination = (destinationRaw?.startsWith('external:')
    ? destinationRaw.slice(0, 300)
    : cleanPath(destinationRaw))?.toLowerCase() || null;
  const featureRaw = clean(body?.feature, 100);
  const clientFeature = featureRaw && TRACKABLE_FEATURES.has(featureRaw) ? featureRaw : null;
  const controlType = clean(body?.controlType, 40);
  const controlKey = clean(body?.controlKey, 160);
  const language = cleanLanguage(body?.language);
  const trafficSource = cleanTrafficSource(body?.trafficSource);
  // Member identity claimed by the client (present only when a member is
  // signed in on that browser). A claim is never trusted on its own — see
  // the verified resolution inside withDb below.
  const memberId = validUuid(body?.memberId);
  const memberUsername = clean(body?.memberUsername, 40);

  if (!INTERACTION_EVENT_TYPES.has(eventType)) return json({ ok:false,error:{ message:'Unknown event type.' } },400);
  if (!visitorId || !sessionId || !route) return json({ ok:false,error:{ message:'Invalid analytics event.' } },400);
  if (route.toLowerCase().startsWith('/admin') || route.toLowerCase().startsWith('/analytics')) {
    return new Response(null,{ status:204 });
  }

  // Click-label completeness backstop: no click or feature action may be
  // stored nameless, even if the client sent no label (older clients,
  // icon-only controls). Derivation uses only facts stored with the event
  // (destination, route, control type) — see worker/click-labels.js.
  const derivedFeature = clientFeature
    || deriveClickFeature({ destination, route });
  const feature = derivedFeature && TRACKABLE_FEATURES.has(derivedFeature)
    ? derivedFeature
    : null;
  const storedControlKey = controlKey
    || ((eventType === 'click' || eventType === 'action')
      ? deriveClickControlKey({ destination, route, controlType })
      : null);

  const auth = await session(request, env, false);

  return withDb(env, async (db) => {
    await ensureInteractionSchema(db);

    if (route === '/__analytics-smoke' && request.headers.get('x-o2ol-analytics-smoke') === 'schema') {
      return json({ ok:true, smoke:true, storageReady:true });
    }

    // Identity resolution (owner rules, 2026-10-10): a signed-in member's
    // events carry their user id and username; "anonymous" is only for
    // true guests. Two server-verified sources, decided by
    // resolveClickIdentity in worker/click-labels.js:
    //   1. the caller's own auth session (resolved above via get-session);
    //   2. a member id claimed by the client, accepted ONLY when
    //      public.visitor_identity_links ties this event's visitor id to
    //      that account — the link written at signup (launch-auth.ts) or
    //      below at an earlier verified sign-in on this same browser.
    //      This names the activity a member generates around sign-in and
    //      on return visits, without ever trusting a bare client claim.
    const identityQuery = `SELECT a.id,a.role,p.username,p.subscription_plan,p.subscription_status,p.stripe_subscription_id
           FROM neon_auth."user" a
           LEFT JOIN public.users p ON p.id=a.id
          WHERE a.id=$1::uuid
          LIMIT 1`;
    const toIdentityRow = (row, fallbackRole = null) => (row?.id ? {
      userId: row.id,
      role: row.role || fallbackRole,
      username: row.username || null,
      subscriptionPlan: row.subscription_plan || null,
      subscriptionStatus: row.subscription_status || null,
    } : null);

    let sessionRow = null;
    if (auth?.user?.id) {
      const identity = await db.query(identityQuery, [auth.user.id]);
      sessionRow = toIdentityRow(identity.rows[0], auth.user?.role || null)
        || { userId: null, role: auth.user?.role || null, username: null, subscriptionPlan: null, subscriptionStatus: null };
    }

    let claimedRow = null;
    let linkVerified = false;
    if (!sessionRow?.userId && memberId) {
      const link = await db.query(
        `SELECT user_id FROM public.visitor_identity_links WHERE visitor_id=$1 AND user_id=$2::uuid LIMIT 1`,
        [visitorId, memberId],
      );
      linkVerified = link.rows.length > 0;
      if (linkVerified) {
        const claimed = await db.query(identityQuery, [memberId]);
        claimedRow = toIdentityRow(claimed.rows[0]);
      }
    }

    const resolved = resolveClickIdentity({
      sessionRow, claimedRow, linkVerified,
      claimedUserId: memberId, claimedUsername: memberUsername,
    });

    // Admin testing/navigation must never contaminate visitor analytics —
    // on either identity path, an admin's event is dropped, never stored.
    if (resolved.drop) return new Response(null,{ status:204 });

    let userId = null;
    let actorType = 'anonymous';
    let accessType = 'open_house';
    let subscriptionPlan = null;
    let subscriptionStatus = null;
    let username = null;

    if (resolved.userId) {
      const sourceRow = sessionRow?.userId ? sessionRow : claimedRow;
      userId = resolved.userId;
      actorType = 'registered';
      username = resolved.username;
      subscriptionPlan = sourceRow?.subscriptionPlan || null;
      subscriptionStatus = sourceRow?.subscriptionStatus || null;
      const activeMembership = ['active','trial','trialing','past_due'].includes(String(subscriptionStatus || '').toLowerCase());
      accessType = activeMembership ? 'subscribed' : 'registered_free';
    }

    await db.query(
      `INSERT INTO public.interaction_events
        (user_id,visitor_id,session_id,actor_type,access_type,subscription_plan,subscription_status,event_type,route,feature,control_type,control_key,destination,language,traffic_source,username)
       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [userId,visitorId,sessionId,actorType,accessType,subscriptionPlan,subscriptionStatus,eventType,route,feature,controlType,storedControlKey,destination,language,trafficSource,username],
    );

    // Visitor→member stitch (owner rule, 2026-10-10: "return users should
    // switch from their visitor number to the Username"): whenever a
    // verified sign-in is on record for this browser, link its visitor id
    // to the account — the same upsert registration performs in
    // launch-auth.ts, with the same last-sign-in-wins conflict rule. The
    // Visitor Registry resolves identity at read time from this link or
    // from signed-in activity, so the member's activity under this same
    // visitor id — earlier and future — shows under their @username.
    // Nothing is written for guests or unverified claims, and the update
    // is skipped when the link already points at this member, so steady
    // activity does not churn the row.
    if (userId) {
      await db.query(
        `INSERT INTO public.visitor_identity_links(visitor_id,user_id,link_source,linked_at,updated_at)
         VALUES($1,$2::uuid,'signed_in_activity',now(),now())
         ON CONFLICT(visitor_id) DO UPDATE SET
           user_id=EXCLUDED.user_id,
           link_source=EXCLUDED.link_source,
           updated_at=now()
         WHERE public.visitor_identity_links.user_id IS DISTINCT FROM EXCLUDED.user_id`,
        [visitorId, userId],
      );
    }

    return json({ ok:true });
  });
}

async function handleLegacyFeatureUsage(request, env) {
  if (request.method !== 'POST') return json({ ok:false,error:{ message:'Method not allowed.' } },405);

  const auth = await session(request, env, true);
  if (!auth) return json({ ok:false,error:{ message:'Authentication required.' } },401);

  if (String(auth.user?.role || '').toLowerCase() === 'admin') {
    return new Response(null,{ status:204 });
  }

  const body = await request.json().catch(() => null);
  const feature = clean(body?.feature, 100);
  const eventType = clean(body?.eventType || 'view', 30)?.toLowerCase();
  const route = cleanPath(body?.route) || clean(body?.route, 300);

  if (!TRACKABLE_FEATURES.has(feature)) return json({ ok:false,error:{ message:'Unknown feature.' } },400);
  if (!LEGACY_EVENT_TYPES.has(eventType)) return json({ ok:false,error:{ message:'Unknown event type.' } },400);

  return withDb(env, async (db) => {
    const role = await db.query(`SELECT role FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,[auth.user.id]);
    if (String(role.rows[0]?.role || '').toLowerCase() === 'admin') return new Response(null,{ status:204 });

    const exists = await db.query(`SELECT to_regclass('public.feature_usage_events') IS NOT NULL AS ready`);
    if (!exists.rows[0]?.ready) return new Response(null,{ status:204 });

    await db.query(
      `INSERT INTO public.feature_usage_events (user_id,feature,event_type,route)
       SELECT $1::uuid,$2,$3,$4
       WHERE NOT EXISTS (
         SELECT 1 FROM public.feature_usage_events
          WHERE user_id=$1::uuid AND feature=$2 AND event_type=$3
            AND route IS NOT DISTINCT FROM $4
            AND created_at >= now() - interval '30 seconds'
       )`,
      [auth.user.id,feature,eventType,route],
    );

    return json({ ok:true });
  });
}


async function ensurePresenceSchema(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.visitor_presence (
      visitor_id text PRIMARY KEY,
      user_id uuid,
      route text,
      last_ping_at timestamptz NOT NULL DEFAULT now()
    )`);
  await db.query(`CREATE INDEX IF NOT EXISTS visitor_presence_last_ping_idx ON public.visitor_presence (last_ping_at)`);
}

// Real-time presence heartbeat (owner-approved 2026-10-09): public pages
// check in every ~45s; the Admin "On Site Right Now" card counts rows seen
// in the last 90 seconds. Deliberately separate from interaction events
// and from the idle-stop polling rules — staying on a page counts, even
// when the visitor is only reading. Admin sessions never count, mirroring
// the ingest rule that admin activity must not contaminate visitor data.
export async function handlePresencePing(request, env) {
  if (request.method !== 'POST') return json({ ok:false, error:{ code:'method_not_allowed', message:'Method not allowed.' } }, 405);
  const body = await request.json().catch(() => null);
  const visitorId = String(body?.visitorId || '').trim().slice(0, 64);
  if (!visitorId) return json({ ok:false, error:{ code:'visitor_id_required', message:'A visitor ID is required.' } }, 400);
  const route = String(body?.route || '').trim().slice(0, 200) || null;
  const auth = await session(request, env, false);
  return withDb(env, async (db) => {
    await ensurePresenceSchema(db);
    let userId = null;
    if (auth?.user?.id) {
      const identity = await db.query(
        `SELECT id, role FROM neon_auth."user" WHERE id=$1::uuid LIMIT 1`,
        [auth.user.id],
      );
      const row = identity.rows[0] || null;
      if (String(row?.role || '').toLowerCase() === 'admin') return new Response(null, { status: 204 });
      if (row?.id) userId = row.id;
    }
    await db.query(
      `INSERT INTO public.visitor_presence (visitor_id, user_id, route, last_ping_at)
       VALUES ($1, $2::uuid, $3, now())
       ON CONFLICT (visitor_id) DO UPDATE
         SET user_id = EXCLUDED.user_id, route = EXCLUDED.route, last_ping_at = now()`,
      [visitorId, userId, route],
    );
    return new Response(null, { status: 204 });
  });
}

export async function handleFeatureUsageRequest(request, env, url) {
  if (url.pathname === '/api/interaction-events') return handleInteractionEvent(request, env);
  if (url.pathname === '/api/feature-usage') return handleLegacyFeatureUsage(request, env);
  return null;
}
