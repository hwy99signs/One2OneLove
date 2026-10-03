// @ts-nocheck
import { Client } from 'pg';

const TRACKABLE_FEATURES = new Set([
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
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.interaction_events (
      id bigserial PRIMARY KEY,
      user_id uuid NULL,
      visitor_id text NOT NULL,
      session_id text NOT NULL,
      actor_type text NOT NULL,
      access_type text NOT NULL,
      subscription_plan text NULL,
      subscription_status text NULL,
      event_type text NOT NULL,
      route text NOT NULL,
      feature text NULL,
      control_type text NULL,
      control_key text NULL,
      destination text NULL,
      language text NULL,
      traffic_source text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT interaction_events_actor_type_check CHECK (actor_type IN ('anonymous','registered')),
      CONSTRAINT interaction_events_access_type_check CHECK (access_type IN ('open_house','registered_free','subscribed')),
      CONSTRAINT interaction_events_event_type_check CHECK (event_type IN ('click','page_view','action'))
    )
  `);
  await db.query(`ALTER TABLE public.interaction_events ADD COLUMN IF NOT EXISTS language text NULL`);
  await db.query(`ALTER TABLE public.interaction_events ADD COLUMN IF NOT EXISTS traffic_source text NULL`);
  await db.query(`
    DO $
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname='interaction_events_event_type_check'
           AND conrelid='public.interaction_events'::regclass
           AND position('action' in pg_get_constraintdef(oid))=0
      ) THEN
        ALTER TABLE public.interaction_events DROP CONSTRAINT interaction_events_event_type_check;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname='interaction_events_event_type_check'
           AND conrelid='public.interaction_events'::regclass
      ) THEN
        ALTER TABLE public.interaction_events
          ADD CONSTRAINT interaction_events_event_type_check
          CHECK (event_type IN ('click','page_view','action'));
      END IF;
    END $;
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS interaction_events_created_at_idx ON public.interaction_events(created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS interaction_events_route_idx ON public.interaction_events(route,created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS interaction_events_user_idx ON public.interaction_events(user_id,created_at DESC) WHERE user_id IS NOT NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS interaction_events_visitor_idx ON public.interaction_events(visitor_id,created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS interaction_events_language_idx ON public.interaction_events(language,created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS interaction_events_traffic_source_idx ON public.interaction_events(traffic_source,created_at DESC)`);
  interactionSchemaReady = true;
}

async function handleInteractionEvent(request, env) {
  if (request.method !== 'POST') return json({ ok:false,error:{ message:'Method not allowed.' } },405);

  const body = await request.json().catch(() => null);
  const eventType = clean(body?.eventType, 30)?.toLowerCase();
  const visitorId = validClientId(body?.visitorId);
  const sessionId = validClientId(body?.sessionId);
  const route = cleanPath(body?.route);
  const destinationRaw = clean(body?.destination, 300);
  const destination = destinationRaw?.startsWith('external:')
    ? destinationRaw.slice(0, 300)
    : cleanPath(destinationRaw);
  const featureRaw = clean(body?.feature, 100);
  const feature = featureRaw && TRACKABLE_FEATURES.has(featureRaw) ? featureRaw : null;
  const controlType = clean(body?.controlType, 40);
  const controlKey = clean(body?.controlKey, 160);
  const language = cleanLanguage(body?.language);
  const trafficSource = cleanTrafficSource(body?.trafficSource);

  if (!INTERACTION_EVENT_TYPES.has(eventType)) return json({ ok:false,error:{ message:'Unknown event type.' } },400);
  if (!visitorId || !sessionId || !route) return json({ ok:false,error:{ message:'Invalid analytics event.' } },400);
  if (route.toLowerCase().startsWith('/admin') || route.toLowerCase().startsWith('/analytics')) {
    return new Response(null,{ status:204 });
  }

  const auth = await session(request, env, false);

  return withDb(env, async (db) => {
    await ensureInteractionSchema(db);

    if (route === '/__analytics-smoke' && request.headers.get('x-o2ol-analytics-smoke') === 'schema') {
      return json({ ok:true, smoke:true, storageReady:true });
    }

    let userId = null;
    let actorType = 'anonymous';
    let accessType = 'open_house';
    let subscriptionPlan = null;
    let subscriptionStatus = null;

    if (auth?.user?.id) {
      const identity = await db.query(
        `SELECT a.id,a.role,p.subscription_plan,p.subscription_status,p.stripe_subscription_id
           FROM neon_auth."user" a
           LEFT JOIN public.users p ON p.id=a.id
          WHERE a.id=$1::uuid
          LIMIT 1`,
        [auth.user.id],
      );
      const row = identity.rows[0] || null;

      // Admin testing/navigation must never contaminate visitor analytics.
      if (String(row?.role || auth.user?.role || '').toLowerCase() === 'admin') {
        return new Response(null,{ status:204 });
      }

      if (row?.id) {
        userId = row.id;
        actorType = 'registered';
        subscriptionPlan = row.subscription_plan || null;
        subscriptionStatus = row.subscription_status || null;
        const activeMembership = ['active','trial','trialing','past_due'].includes(String(row.subscription_status || '').toLowerCase());
        accessType = activeMembership ? 'subscribed' : 'registered_free';
      }
    }

    await db.query(
      `INSERT INTO public.interaction_events
        (user_id,visitor_id,session_id,actor_type,access_type,subscription_plan,subscription_status,event_type,route,feature,control_type,control_key,destination,language,traffic_source)
       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [userId,visitorId,sessionId,actorType,accessType,subscriptionPlan,subscriptionStatus,eventType,route,feature,controlType,controlKey,destination,language,trafficSource],
    );

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

export async function handleFeatureUsageRequest(request, env, url) {
  if (url.pathname === '/api/interaction-events') return handleInteractionEvent(request, env);
  if (url.pathname === '/api/feature-usage') return handleLegacyFeatureUsage(request, env);
  return null;
}
