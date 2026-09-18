// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const MODES = new Set(['licensed', 'coach', 'contributor', 'organization']);

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
function clean(value, max = 1000, required = false) {
  if (value == null) { if (required) throw new Error('Required value is missing.'); return null; }
  const out = String(value).trim();
  if (required && !out) throw new Error('Required value is empty.');
  if (out.length > max) throw new Error(`Value exceeds ${max} characters.`);
  return out || null;
}
function array(value, max = 50) { return Array.isArray(value) ? value.slice(0, max).map(v => String(v).trim()).filter(Boolean) : []; }
function int(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback; }
function number(value) { const n = Number(String(value ?? '').replace(/[^0-9.-]/g, '')); return Number.isFinite(n) ? n : null; }
function parseLinks(value) {
  return String(value || '').split(/\n+/).map(v => v.trim()).filter(Boolean).reduce((out, line, index) => {
    const sep = line.indexOf(':');
    if (sep > 0 && !line.startsWith('http')) {
      const key = line.slice(0, sep).trim() || `platform_${index + 1}`;
      const url = line.slice(sep + 1).trim(); if (url) out[key] = url;
    } else out[`platform_${index + 1}`] = line;
    return out;
  }, {});
}
function callbackFor(request) {
  const allowed = new Set(['https://one2onelove.com','https://www.one2onelove.com','https://one2onelove-launch.hwy99signs.workers.dev','https://one2onelove-prelaunch.hwy99signs.workers.dev','https://one2onelove-preview-migration.hwy99signs.workers.dev']);
  const origin = request.headers.get('origin');
  const base = origin && allowed.has(origin) ? origin : 'https://one2onelove.com';
  return `${base}/SignIn?verified=1`;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}
async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect(); try { return await fn(db); } finally { await db.end(); }
}
async function signUp(request, env, email, password, name) {
  const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' });
  const origin = request.headers.get('origin'); if (origin) headers.set('origin', origin);
  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/sign-up/email', {
    method: 'POST', headers, redirect: 'manual', body: JSON.stringify({ email, password, name, callbackURL: callbackFor(request) }),
  });
  const text = await response.text(); let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || 'Account creation failed.';
    throw Object.assign(new Error(message), { status: response.status, code: payload?.code || payload?.error?.code || 'signup_failed' });
  }
  const user = payload?.user || payload?.data?.user || null;
  if (!user?.id) throw Object.assign(new Error('Account creation did not return a user record.'), { status: 502, code: 'invalid_auth_response' });
  return user;
}
function locationLabel(application = {}) {
  return [application.city, application.region, application.country].map(v => String(v || '').trim()).filter(Boolean).join(', ') || null;
}
function serviceDescription(application = {}) {
  const parts = [];
  if (array(application.specialties).length) parts.push(`Specialties: ${array(application.specialties).join(', ')}`);
  if (array(application.serviceFormats).length) parts.push(`Formats: ${array(application.serviceFormats).join(', ')}`);
  if (application.serviceDescription) parts.push(String(application.serviceDescription));
  if (array(application.partnershipInterests).length) parts.push(`Partnership interests: ${array(application.partnershipInterests).join(', ')}`);
  return parts.join(' | ').slice(0, 500) || null;
}

async function saveProfile(db, mode, user, account, application) {
  const firstName = clean(account.firstName, 120, true);
  const lastName = clean(account.lastName, 120, true);
  const fullName = `${firstName} ${lastName}`.trim();
  const type = mode === 'licensed' ? 'therapist' : mode === 'contributor' ? 'influencer' : 'professional';
  await db.query(
    `INSERT INTO public.users(id,email,name,user_type,location,is_active,subscription_plan,subscription_status,subscription_price)
     VALUES($1::uuid,$2,$3,$4,$5,true,'Basis','inactive',4.99)
     ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,user_type=EXCLUDED.user_type,location=EXCLUDED.location,updated_at=now()`,
    [user.id, account.email, fullName, type, locationLabel(application)],
  );

  if (mode === 'licensed') {
    const r = await db.query(
      `INSERT INTO public.therapist_profiles
       (user_id,first_name,last_name,phone,profile_photo_url,licensed_countries,licensed_states,therapy_types,specializations,certifications,years_experience,consultation_fee,professional_bio,license_number,social_media_platforms,email_verified,phone_verified,status)
       VALUES($1::uuid,$2,$3,$4,$5,$6::text[],$7::text[],$8::text[],$9::text[],$10::text[],$11,$12,$13,$14,$15::jsonb,false,false,'pending')
       ON CONFLICT(user_id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,profile_photo_url=EXCLUDED.profile_photo_url,licensed_countries=EXCLUDED.licensed_countries,licensed_states=EXCLUDED.licensed_states,therapy_types=EXCLUDED.therapy_types,specializations=EXCLUDED.specializations,certifications=EXCLUDED.certifications,years_experience=EXCLUDED.years_experience,consultation_fee=EXCLUDED.consultation_fee,professional_bio=EXCLUDED.professional_bio,license_number=EXCLUDED.license_number,social_media_platforms=EXCLUDED.social_media_platforms,status='pending',updated_at=now() RETURNING *`,
      [user.id, firstName, lastName, clean(application.phone,100), clean(application.profilePhotoUrl,1000), application.licenseCountry ? [application.licenseCountry] : [], application.licenseRegion ? [application.licenseRegion] : [], array(application.serviceFormats), array(application.specialties), array(application.certifications), int(application.yearsExperience), number(application.consultationFee), clean(application.bio,10000), clean(application.licenseNumber,200), JSON.stringify(parseLinks(application.platformLinksText))],
    );
    return r.rows[0];
  }

  if (mode === 'contributor') {
    const r = await db.query(
      `INSERT INTO public.influencer_profiles
       (user_id,first_name,last_name,phone,profile_photo_url,total_follower_count,platform_links,content_categories,collaboration_types,bio,media_kit_url,email_verified,phone_verified,status)
       VALUES($1::uuid,$2,$3,$4,$5,$6,$7::jsonb,$8::text[],$9::text[],$10,$11,false,false,'pending')
       ON CONFLICT(user_id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,profile_photo_url=EXCLUDED.profile_photo_url,total_follower_count=EXCLUDED.total_follower_count,platform_links=EXCLUDED.platform_links,content_categories=EXCLUDED.content_categories,collaboration_types=EXCLUDED.collaboration_types,bio=EXCLUDED.bio,media_kit_url=EXCLUDED.media_kit_url,status='pending',updated_at=now() RETURNING *`,
      [user.id, firstName, lastName, clean(application.phone,100), clean(application.profilePhotoUrl,1000), int(application.followerCount || application.totalFollowerCount), JSON.stringify(parseLinks(application.platformLinksText)), array(application.contentCategories), array(application.collaborationTypes), clean(application.bio,10000), clean(application.mediaKitUrl,1000)],
    );
    return r.rows[0];
  }

  const organizationName = mode === 'organization' ? application.organizationName : (application.businessName || application.professionalDisplayName || fullName);
  const practiceType = mode === 'organization' ? (application.organizationType || 'organization_partner') : (application.professionalTitle || 'relationship_coach_educator');
  const r = await db.query(
    `INSERT INTO public.professional_profiles
     (user_id,first_name,last_name,phone,profile_photo_url,organization_name,practice_type,service_description,professional_bio,website_url,email_verified,phone_verified,status)
     VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,false,'pending')
     ON CONFLICT(user_id) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,profile_photo_url=EXCLUDED.profile_photo_url,organization_name=EXCLUDED.organization_name,practice_type=EXCLUDED.practice_type,service_description=EXCLUDED.service_description,professional_bio=EXCLUDED.professional_bio,website_url=EXCLUDED.website_url,status='pending',updated_at=now() RETURNING *`,
    [user.id, firstName, lastName, clean(application.phone,100), clean(application.profilePhotoUrl,1000), clean(organizationName,300), clean(practiceType,200), serviceDescription(application), clean(application.bio,10000), clean(application.websiteUrl,1000)],
  );
  return r.rows[0];
}

export async function handleProfessionalSignup(request, env, url) {
  if (url.pathname !== '/api/professional-signup') return null;
  if (request.method !== 'POST') return fail('Method not allowed.', 405, 'method_not_allowed');
  try {
    const input = await readJson(request);
    const mode = String(input?.mode || '');
    if (!MODES.has(mode)) return fail('Invalid professional application type.');
    const account = input?.account || {};
    const application = input?.application || {};
    const firstName = clean(account.firstName, 120, true);
    const lastName = clean(account.lastName, 120, true);
    const email = clean(account.email, 320, true)?.toLowerCase();
    const password = String(account.password || '');
    if (!/^\S+@\S+\.\S+$/.test(email || '')) return fail('Please enter a valid email address.');
    if (password.length < 8) return fail('Password must contain at least 8 characters.');
    const user = await signUp(request, env, email, password, `${firstName} ${lastName}`.trim());
    const profile = await withDb(env, async db => {
      await db.query('BEGIN');
      try {
        const saved = await saveProfile(db, mode, user, { ...account, firstName, lastName, email }, application);
        await db.query('COMMIT');
        return saved;
      } catch (error) {
        await db.query('ROLLBACK'); throw error;
      }
    });
    return json({ ok: true, success: true, user: { id: user.id, email }, profile, requiresEmailVerification: true, status: 'pending' }, 201);
  } catch (error) {
    console.error('Professional signup error:', error);
    return fail(error?.message || 'Professional registration failed.', error?.status || 400, error?.code || 'professional_signup_failed');
  }
}
