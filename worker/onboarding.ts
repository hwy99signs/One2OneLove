// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function error(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function withDb(env, fn) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function getSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    method: 'GET',
    headers: { cookie, accept: 'application/json' },
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  if (!user?.id || !session) return null;
  return { user, session };
}

async function requireAuth(request, env) {
  const auth = await getSession(request, env);
  if (!auth) return { response: error('Authentication required.', 401, 'unauthorized') };
  return { auth };
}

async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

function text(value, max = 5000, required = false) {
  if (value == null) {
    if (required) throw new Error('Required value is missing.');
    return null;
  }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}

function list(value, maxItems = 50) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(v => String(v).trim()).filter(Boolean);
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

async function ensureUser(db, auth, userType) {
  await db.query(
    `INSERT INTO public.users (id,email,name,user_type,is_active)
     VALUES ($1::uuid,$2,$3,$4,true)
     ON CONFLICT (id) DO UPDATE SET
       email=EXCLUDED.email,
       name=COALESCE(NULLIF(public.users.name,''),EXCLUDED.name),
       user_type=EXCLUDED.user_type,
       is_active=true,
       updated_at=now()`,
    [auth.user.id, auth.user.email, auth.user.name || auth.user.email?.split('@')[0] || 'Member', userType],
  );
}

async function therapistUpsert(db, auth, body) {
  await ensureUser(db, auth, 'therapist');
  const firstName = text(body.firstName ?? body.first_name, 120, true);
  const lastName = text(body.lastName ?? body.last_name, 120, true);
  const result = await db.query(
    `INSERT INTO public.therapist_profiles
      (user_id,first_name,last_name,phone,profile_photo_url,licensed_countries,licensed_states,
       therapy_types,specializations,certifications,years_experience,consultation_fee,
       professional_bio,license_number,social_media_platforms,email_verified,phone_verified,status)
     VALUES ($1::uuid,$2,$3,$4,$5,$6::text[],$7::text[],$8::text[],$9::text[],$10::text[],
             $11,$12,$13,$14,$15::jsonb,$16,$17,'pending')
     ON CONFLICT (user_id) DO UPDATE SET
       first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,
       profile_photo_url=EXCLUDED.profile_photo_url,licensed_countries=EXCLUDED.licensed_countries,
       licensed_states=EXCLUDED.licensed_states,therapy_types=EXCLUDED.therapy_types,
       specializations=EXCLUDED.specializations,certifications=EXCLUDED.certifications,
       years_experience=EXCLUDED.years_experience,consultation_fee=EXCLUDED.consultation_fee,
       professional_bio=EXCLUDED.professional_bio,license_number=EXCLUDED.license_number,
       social_media_platforms=EXCLUDED.social_media_platforms,email_verified=EXCLUDED.email_verified,
       phone_verified=EXCLUDED.phone_verified,updated_at=now()
     RETURNING *`,
    [
      auth.user.id, firstName, lastName, text(body.phone, 80), text(body.profilePhotoUrl ?? body.profile_photo_url, 2000),
      list(body.licensedCountries ?? body.licensed_countries), list(body.licensedStates ?? body.licensed_states),
      list(body.therapyTypes ?? body.therapy_types), list(body.specializations), list(body.certifications),
      body.yearsExperience ?? body.years_experience ? Number(body.yearsExperience ?? body.years_experience) : null,
      body.consultationFee ?? body.consultation_fee ? Number(body.consultationFee ?? body.consultation_fee) : null,
      text(body.professionalBio ?? body.professional_bio, 5000), text(body.licenseNumber ?? body.license_number, 250),
      JSON.stringify(object(body.socialMediaPlatforms ?? body.social_media_platforms)),
      Boolean(body.emailVerified ?? body.email_verified), Boolean(body.phoneVerified ?? body.phone_verified),
    ],
  );
  return result.rows[0];
}

async function influencerUpsert(db, auth, body) {
  await ensureUser(db, auth, 'influencer');
  const firstName = text(body.firstName ?? body.first_name, 120, true);
  const lastName = text(body.lastName ?? body.last_name, 120, true);
  const bio = text(body.bio, 5000, true);
  if (bio.length < 100) throw new Error('Bio must be at least 100 characters.');
  const platformLinks = object(body.platformLinks ?? body.platform_links);
  if (!Object.values(platformLinks).some(v => String(v || '').trim())) throw new Error('At least one social media platform link is required.');
  const result = await db.query(
    `INSERT INTO public.influencer_profiles
      (user_id,first_name,last_name,phone,profile_photo_url,total_follower_count,platform_links,
       content_categories,collaboration_types,bio,media_kit_url,email_verified,phone_verified,status)
     VALUES ($1::uuid,$2,$3,$4,$5,$6,$7::jsonb,$8::text[],$9::text[],$10,$11,$12,$13,'pending')
     ON CONFLICT (user_id) DO UPDATE SET
       first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,
       profile_photo_url=EXCLUDED.profile_photo_url,total_follower_count=EXCLUDED.total_follower_count,
       platform_links=EXCLUDED.platform_links,content_categories=EXCLUDED.content_categories,
       collaboration_types=EXCLUDED.collaboration_types,bio=EXCLUDED.bio,media_kit_url=EXCLUDED.media_kit_url,
       email_verified=EXCLUDED.email_verified,phone_verified=EXCLUDED.phone_verified,updated_at=now()
     RETURNING *`,
    [
      auth.user.id, firstName, lastName, text(body.phone, 80), text(body.profilePhotoUrl ?? body.profile_photo_url, 2000),
      Number(body.totalFollowerCount ?? body.total_follower_count ?? 0), JSON.stringify(platformLinks),
      list(body.contentCategories ?? body.content_categories), list(body.collaborationTypes ?? body.collaboration_types),
      bio, text(body.mediaKitUrl ?? body.media_kit_url, 2000),
      Boolean(body.emailVerified ?? body.email_verified), Boolean(body.phoneVerified ?? body.phone_verified),
    ],
  );
  return result.rows[0];
}

async function professionalUpsert(db, auth, body) {
  await ensureUser(db, auth, 'professional');
  const firstName = text(body.firstName ?? body.first_name, 120, true);
  const lastName = text(body.lastName ?? body.last_name, 120, true);
  const professionalBio = text(body.professionalBio ?? body.professional_bio, 1000, true);
  if (professionalBio.length < 100) throw new Error('Professional bio must be at least 100 characters.');
  const serviceDescription = text(body.serviceDescription ?? body.service_description, 500);
  const result = await db.query(
    `INSERT INTO public.professional_profiles
      (user_id,first_name,last_name,phone,profile_photo_url,organization_name,practice_type,
       service_description,professional_bio,website_url,email_verified,phone_verified,status)
     VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')
     ON CONFLICT (user_id) DO UPDATE SET
       first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,
       profile_photo_url=EXCLUDED.profile_photo_url,organization_name=EXCLUDED.organization_name,
       practice_type=EXCLUDED.practice_type,service_description=EXCLUDED.service_description,
       professional_bio=EXCLUDED.professional_bio,website_url=EXCLUDED.website_url,
       email_verified=EXCLUDED.email_verified,phone_verified=EXCLUDED.phone_verified,updated_at=now()
     RETURNING *`,
    [
      auth.user.id, firstName, lastName, text(body.phone, 80), text(body.profilePhotoUrl ?? body.profile_photo_url, 2000),
      text(body.organizationName ?? body.organization_name, 250, true), text(body.practiceType ?? body.practice_type, 250, true),
      serviceDescription, professionalBio, text(body.websiteUrl ?? body.website_url, 2000),
      Boolean(body.emailVerified ?? body.email_verified), Boolean(body.phoneVerified ?? body.phone_verified),
    ],
  );
  return result.rows[0];
}

const TABLES = {
  therapist: 'therapist_profiles',
  influencer: 'influencer_profiles',
  professional: 'professional_profiles',
};

async function readExistingProfile(db, auth, type) {
  const table = TABLES[type];
  const result = await db.query(`SELECT * FROM public.${table} WHERE user_id=$1::uuid`, [auth.user.id]);
  return result.rows[0] || null;
}

export async function handleSpecialProfileRequest(request, env, url) {
  const match = url.pathname.match(/^\/api\/(?:onboarding|profiles)\/(therapist|influencer|professional)$/);
  if (!match) return null;
  const type = match[1];
  const required = await requireAuth(request, env);
  if (required.response) return required.response;
  const auth = required.auth;

  try {
    if (request.method === 'GET') {
      return withDb(env, async db => json({ ok: true, profile: await readExistingProfile(db, auth, type) }));
    }
    if (request.method !== 'POST' && request.method !== 'PATCH') {
      return error('Method not allowed.', 405, 'method_not_allowed');
    }
    const body = await readJson(request);
    return withDb(env, async db => {
      let profile;
      if (type === 'therapist') profile = await therapistUpsert(db, auth, body);
      if (type === 'influencer') profile = await influencerUpsert(db, auth, body);
      if (type === 'professional') profile = await professionalUpsert(db, auth, body);
      return json({ ok: true, profile }, request.method === 'POST' ? 201 : 200);
    });
  } catch (err) {
    console.error(`One2OneLove ${type} profile error`, err);
    return error(err?.message || 'Unable to save profile.', 400, 'profile_error');
  }
}
