// @ts-nocheck
import { Client } from 'pg';

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: HEADERS }); }
function fail(message, status = 400, code = 'bad_request') { return json({ ok: false, error: { code, message } }, status); }
async function withDb(env, fn) { const db = new Client({ connectionString: env.HYPERDRIVE.connectionString }); await db.connect(); try { return await fn(db); } finally { await db.end(); } }
async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', { headers: { cookie, accept: 'application/json' } });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified === true && active ? { user, session: active } : null;
}
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

export const COACHING_CONSENT_VERSION='2026-10-10-v1';
export const COACHING_CONSENT_COPY={
  title:'Before you chat with Amora',
  paragraphs:[
    'Amora is an AI guide created by One2OneLove. She is not human, and she is not a therapist, doctor, lawyer, or licensed counselor.',
    'She offers relationship guidance, education, and reflection for everyday situations. Nothing she says is medical, mental-health, or legal advice, and it is not a substitute for a qualified professional.',
  ],
  crisis:'If you are in danger, thinking of harming yourself, or in crisis, stop and contact your local emergency number or a crisis line (in the U.S., call or text 988) right away. Amora is not a crisis service.',
  billing:'How billing works: conversation replies are charged to your Credit by the length you select — Short $0.10, Medium $0.15, Long $0.20 per reply. Formal reports are $2.99 each. You are charged when a reply is generated, and your balance is shown before you send.',
  privacy:'Your conversations are saved to your account so she can remember context and personalize replies. You must be 18 or older to use coaching.',
  agreement:'By tapping “I agree,” you accept this disclaimer and the One2OneLove Terms of Service.',
};

export async function requireCurrentCoachingConsent(db,userId){
  const r=await db.query(
    'SELECT coaching_consent_version,coaching_consent_accepted_at FROM public.users WHERE id=$1::uuid LIMIT 1',
    [userId],
  );
  const row=r.rows[0];
  if(!row || row.coaching_consent_version!==COACHING_CONSENT_VERSION || !row.coaching_consent_accepted_at){
    throw Object.assign(new Error('Please accept the current One2OneLove coaching disclaimer before using Amora.'),{
      status:428,
      code:'coaching_consent_required',
      consentVersion:COACHING_CONSENT_VERSION,
    });
  }
  return row;
}

// Save consent (owner, 2026-11-01): members must explicitly accept the Terms of
// Service AND the One2OneLove Disclaimer before anything they create is saved
// or sent. Stored as its own row in public.signup_consents (no schema change).
export const SAVE_CONSENT_VERSION='2026-11-01-terms-disclaimer-v1';
export const SAVE_CONSENT_SOURCE='save_terms_disclaimer';

export async function hasSaveConsent(db,userId){
  const r=await db.query(
    'SELECT 1 FROM public.signup_consents WHERE user_id=$1::uuid AND terms_version=$2 LIMIT 1',
    [userId,SAVE_CONSENT_VERSION],
  );
  return r.rowCount>0;
}

export async function recordSaveConsent(db,{userId,email,country=null,preferredLanguage=null,source=SAVE_CONSENT_SOURCE}){
  const prior=(await db.query(
    'SELECT country,preferred_language FROM public.signup_consents WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 1',
    [userId],
  )).rows[0]||{};
  const r=await db.query(
    `INSERT INTO public.signup_consents
      (user_id,email,country,preferred_language,terms_version,terms_accepted_at,
       privacy_policy_acknowledged,age_18_confirmed,signup_source)
     VALUES($1::uuid,$2,$3,$4,$5,now(),true,true,$6)
     ON CONFLICT (user_id, terms_version) DO UPDATE SET terms_accepted_at=public.signup_consents.terms_accepted_at
     RETURNING terms_version,terms_accepted_at`,
    [userId,String(email||'').toLowerCase(),String(country||prior.country||'ZZ').slice(0,2).toUpperCase(),
     String(preferredLanguage||prior.preferred_language||'en').slice(0,10).toLowerCase(),SAVE_CONSENT_VERSION,String(source).slice(0,100)],
  );
  return r.rows[0];
}

export async function handleConsentsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/consents')) return null;
  const auth = await session(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    if (url.pathname === '/api/consents/coaching') {
      if (request.method === 'GET') {
        return await withDb(env, async db => {
          const r=await db.query(
            'SELECT coaching_consent_version,coaching_consent_accepted_at FROM public.users WHERE id=$1::uuid LIMIT 1',
            [auth.user.id],
          );
          const row=r.rows[0]||{};
          return json({
            ok:true,
            version:COACHING_CONSENT_VERSION,
            accepted:row.coaching_consent_version===COACHING_CONSENT_VERSION && Boolean(row.coaching_consent_accepted_at),
            acceptedVersion:row.coaching_consent_version||null,
            acceptedAt:row.coaching_consent_accepted_at||null,
            copy:COACHING_CONSENT_COPY,
          });
        });
      }
      if (request.method === 'PUT') {
        const input=await readJson(request);
        if(input?.accepted!==true || String(input?.version||'')!==COACHING_CONSENT_VERSION){
          return fail('Current coaching disclaimer acceptance is required.',400,'coaching_consent_invalid');
        }
        const source=String(input?.source||'coaching_gate').slice(0,100);
        const userAgent=String(request.headers.get('user-agent')||'').slice(0,500)||null;
        return await withDb(env, async db => {
          await db.query('BEGIN');
          try{
            const r=await db.query(
              `UPDATE public.users
                  SET coaching_consent_version=$2,coaching_consent_accepted_at=now()
                WHERE id=$1::uuid
                RETURNING coaching_consent_version,coaching_consent_accepted_at`,
              [auth.user.id,COACHING_CONSENT_VERSION],
            );
            if(!r.rowCount) throw new Error('Member profile not found.');
            await db.query(
              `INSERT INTO public.coaching_consent_history(user_id,consent_version,accepted_at,source,user_agent)
               VALUES($1::uuid,$2,now(),$3,$4)
               ON CONFLICT(user_id,consent_version) DO NOTHING`,
              [auth.user.id,COACHING_CONSENT_VERSION,source,userAgent],
            );
            await db.query('COMMIT');
            return json({
              ok:true,
              accepted:true,
              version:COACHING_CONSENT_VERSION,
              acceptedAt:r.rows[0].coaching_consent_accepted_at,
            });
          }catch(error){
            try{await db.query('ROLLBACK');}catch(_){}
            throw error;
          }
        });
      }
      return fail('Method not allowed.',405,'method_not_allowed');
    }

    if (url.pathname === '/api/consents/terms') {
      if (request.method === 'GET') {
        return await withDb(env, async db => json({ ok:true, version:SAVE_CONSENT_VERSION, accepted:await hasSaveConsent(db,auth.user.id) }));
      }
      if (request.method === 'PUT') {
        const input=await readJson(request);
        if(input?.accepted!==true || input?.age18Confirmed!==true || String(input?.version||'')!==SAVE_CONSENT_VERSION){
          return fail('Please accept the current Terms of Service and Disclaimer and confirm you are 18 or older.',400,'terms_consent_invalid');
        }
        return await withDb(env, async db => {
          const row=await recordSaveConsent(db,{userId:auth.user.id,email:auth.user.email,preferredLanguage:input?.language,source:input?.source||SAVE_CONSENT_SOURCE});
          return json({ ok:true, accepted:true, version:SAVE_CONSENT_VERSION, acceptedAt:row?.terms_accepted_at||null });
        });
      }
      return fail('Method not allowed.',405,'method_not_allowed');
    }

    if (url.pathname !== '/api/consents/adult-sensitive') return fail('Consent route not found.', 404, 'not_found');
    if (request.method === 'GET') {
      return await withDb(env, async db => {
        const r = await db.query('SELECT user_id,consent_version,accepted_at,age_18_plus,sensitive_content_acknowledged,source,updated_at FROM public.adult_sensitive_consents WHERE user_id=$1::uuid', [auth.user.id]);
        return json({ ok: true, consent: r.rows[0] || null });
      });
    }
    if (request.method === 'PUT') {
      const input = await readJson(request);
      const version = String(input?.version || input?.consent_version || '').trim().slice(0, 100);
      if (!version || input?.age_18_plus !== true || input?.sensitive_content_acknowledged !== true) {
        return fail('Both adult-content confirmations are required.');
      }
      const source = String(input?.source || 'adult_sensitive_content_gate').slice(0, 100);
      return await withDb(env, async db => {
        const r = await db.query(
          `INSERT INTO public.adult_sensitive_consents(user_id,consent_version,accepted_at,age_18_plus,sensitive_content_acknowledged,source,updated_at)
           VALUES($1::uuid,$2,now(),true,true,$3,now())
           ON CONFLICT(user_id) DO UPDATE SET consent_version=EXCLUDED.consent_version,accepted_at=now(),age_18_plus=true,sensitive_content_acknowledged=true,source=EXCLUDED.source,updated_at=now()
           RETURNING user_id,consent_version,accepted_at,age_18_plus,sensitive_content_acknowledged,source,updated_at`,
          [auth.user.id, version, source],
        );
        return json({ ok: true, consent: r.rows[0] });
      });
    }
    return fail('Method not allowed.', 405, 'method_not_allowed');
  } catch (err) {
    console.error('One2OneLove consent API error', err);
    return fail(err?.message || 'Unable to process consent.', 400, 'consent_error');
  }
}
