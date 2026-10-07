// @ts-nocheck
import { Client } from 'pg';

// Voting ballots — the write path for the standard O2OL voting-question
// feature. Ballots land in public.o2ol_show_vote_responses, the store the
// admin dashboard already aggregates (worker/admin.ts chatRoomAnalytics).
//
// Question registry mirror: QUESTIONS below mirrors src/lib/votingQuestions.js
// (slug, storage title, category keys, closesAt). Adding a question means
// adding one entry in BOTH places — config only, no new code paths.
//
// Access rule (owner decision, 2026-10-06): voting is a free feature.
// Guests may fill the card in the UI, but casting requires a verified
// signed-in member — the same session() pattern as worker/community-chat.ts
// (Neon Auth session with emailVerified + an active session). One ballot
// per member per topic: re-casting updates the member's existing ballot
// (upsert on the partial unique index below), so a vote stays revisable
// until the question's closesAt.

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const QUESTIONS = {
  'relationship-100': {
    slug: 'relationship-100',
    title: 'Relationship 100 — What Matters Most in Your Relationship?',
    roomSlug: 'relationship-100',
    closesAt: '2026-10-08T05:00:00.000Z', // Wed Oct 7 at midnight CT
    categories: [
      'money',
      'religion',
      'sex_intimacy',
      'politics',
      'family',
      'communication',
      'looks_physical_appearance',
      'therapy_when_needed',
      'help_around_home',
    ],
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}
function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}
function httpError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
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
async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new Error('Expected application/json body.');
  return request.json();
}

// Same canonical identity set the admin analytics uses
// (worker/admin.ts canonicalIdentity), so stored values group correctly
// in the dashboard's identity breakdowns.
function canonicalIdentity(value, allowNotPartnered = false) {
  const raw = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (raw === 'man' || raw === 'male') return 'Man';
  if (raw === 'woman' || raw === 'female') return 'Woman';
  if (raw === 'nonbinary' || raw === 'non_binary' || raw === 'non-binary') return 'Nonbinary';
  if (raw === 'prefer_not_to_say' || raw === 'prefer_not' || raw === 'private') return 'Prefer not to say';
  if (allowNotPartnered && ['not_currently_partnered', 'not_partnered', 'single', 'none'].includes(raw)) return 'Not currently partnered';
  return null;
}

async function ensureVotingSchema(db) {
  // Base table: identical DDL to worker/admin.ts ensureO2OLShowVotingSchema
  // so whichever module runs first creates the same store.
  await db.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_show_vote_responses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_slug text NOT NULL,
      topic_title text NOT NULL,
      respondent_identity text,
      partner_identity text,
      relationship_priorities jsonb NOT NULL DEFAULT '{}'::jsonb,
      expense_split jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_show_votes_topic_created
      ON public.o2ol_show_vote_responses(topic_slug,created_at DESC)
  `);
  // One ballot per member: the member column the original scaffold lacked,
  // plus a partial unique index (legacy/anonymous rows with no member stay
  // untouched and unconstrained).
  await db.query(`
    ALTER TABLE public.o2ol_show_vote_responses
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL
  `);
  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_o2ol_show_votes_topic_user
      ON public.o2ol_show_vote_responses(topic_slug, user_id)
      WHERE user_id IS NOT NULL
  `);
}

function wholePercent(value, message) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number) || !Number.isInteger(number) || number < 0 || number > 100) {
    throw httpError(message, 400, 'invalid_ballot');
  }
  return number;
}

function validateBallot(question, body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const rawPriorities = input.priorities;
  if (!rawPriorities || typeof rawPriorities !== 'object' || Array.isArray(rawPriorities)) {
    throw httpError('Answer every category so your total can reach 100%.', 400, 'invalid_ballot');
  }
  for (const key of Object.keys(rawPriorities)) {
    if (!question.categories.includes(key)) {
      throw httpError(`Unknown category in ballot: ${key}.`, 400, 'invalid_ballot');
    }
  }
  const priorities = {};
  let prioritiesTotal = 0;
  for (const key of question.categories) {
    if (!(key in rawPriorities)) {
      throw httpError('Answer every category so your total can reach 100%.', 400, 'invalid_ballot');
    }
    const value = wholePercent(rawPriorities[key], 'Each category must be a whole number between 0 and 100.');
    priorities[key] = value;
    prioritiesTotal += value;
  }
  if (prioritiesTotal !== 100) {
    throw httpError('Your category percentages must add up to exactly 100%.', 400, 'invalid_ballot');
  }

  const rawSplit = input.expenseSplit;
  if (!rawSplit || typeof rawSplit !== 'object' || Array.isArray(rawSplit) || !('you' in rawSplit) || !('partner' in rawSplit)) {
    throw httpError('Add the bills split so it can add up to 100%.', 400, 'invalid_ballot');
  }
  const you = wholePercent(rawSplit.you, 'Bills split values must be whole numbers between 0 and 100.');
  const partner = wholePercent(rawSplit.partner, 'Bills split values must be whole numbers between 0 and 100.');
  if (you + partner !== 100) {
    throw httpError('Your bills split must add up to exactly 100%.', 400, 'invalid_ballot');
  }

  const respondentIdentity = cleanIdentity(input.respondentIdentity);
  const partnerIdentity = cleanIdentity(input.partnerIdentity);
  return { priorities, you, partner, respondentIdentity, partnerIdentity };
}

function cleanIdentity(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const canonical = canonicalIdentity(value, true);
  if (!canonical) throw httpError('Identity answer not recognized.', 400, 'invalid_ballot');
  return canonical;
}

// Storage shape for expense_split. The survey frames Question 10 as
// You/Partner, and { you, partner } is always stored as the source of
// truth. The existing admin aggregation, however, reads
// expense_split->>'man' / ->>'woman' (worker/admin.ts chatRoomAnalytics),
// so the man/woman keys are ALSO populated — derived only from each side's
// own optional identity answer (respondent Man -> man = you; partner
// Woman -> woman = partner; etc.). Nothing is ever guessed: if a side's
// identity is absent or not Man/Woman its derived key is simply not
// written (the aggregation's avg/NULLIF ignores missing keys), and if both
// sides would claim the same key with different values the key is dropped
// rather than misrepresent either person.
function expenseSplitForStorage(you, partner, respondentIdentity, partnerIdentity) {
  const stored = { you, partner };
  const derived = {};
  const derive = (key, value) => {
    if (derived[key] === undefined) derived[key] = value;
    else if (derived[key] !== value) derived[key] = null;
  };
  if (respondentIdentity === 'Man') derive('man', you);
  if (respondentIdentity === 'Woman') derive('woman', you);
  if (partnerIdentity === 'Man') derive('man', partner);
  if (partnerIdentity === 'Woman') derive('woman', partner);
  for (const key of ['man', 'woman']) {
    if (derived[key] !== undefined && derived[key] !== null) stored[key] = derived[key];
  }
  return stored;
}

function ballotFromRow(row) {
  if (!row) return null;
  const split = row.expense_split || {};
  return {
    topicSlug: row.topic_slug,
    priorities: row.relationship_priorities || {},
    expenseSplit: { you: split.you ?? null, partner: split.partner ?? null },
    respondentIdentity: row.respondent_identity || '',
    partnerIdentity: row.partner_identity || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function handleVotingRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/voting')) return null;

  try {
    if (url.pathname === '/api/voting/ballots' && request.method === 'POST') {
      const auth = await session(request, env);
      if (!auth) return fail('Sign in to cast your vote.', 401, 'unauthorized');

      const body = await readJson(request);
      const question = QUESTIONS[String(body?.topicSlug || body?.topic || '')];
      if (!question) return fail('Unknown voting question.', 404, 'not_found');
      if (question.closesAt && Date.parse(question.closesAt) <= Date.now()) {
        return fail('Voting for this question has closed.', 403, 'voting_closed');
      }

      const ballot = validateBallot(question, body);
      const expenseSplit = expenseSplitForStorage(ballot.you, ballot.partner, ballot.respondentIdentity, ballot.partnerIdentity);

      return await withDb(env, async (db) => {
        await ensureVotingSchema(db);
        const existing = await db.query(
          'SELECT id FROM public.o2ol_show_vote_responses WHERE topic_slug=$1 AND user_id=$2::uuid',
          [question.slug, auth.user.id],
        );
        const saved = await db.query(`
          INSERT INTO public.o2ol_show_vote_responses
            (topic_slug, topic_title, user_id, respondent_identity, partner_identity, relationship_priorities, expense_split)
          VALUES ($1,$2,$3::uuid,$4,$5,$6::jsonb,$7::jsonb)
          ON CONFLICT (topic_slug, user_id) WHERE user_id IS NOT NULL
          DO UPDATE SET
            topic_title=EXCLUDED.topic_title,
            respondent_identity=EXCLUDED.respondent_identity,
            partner_identity=EXCLUDED.partner_identity,
            relationship_priorities=EXCLUDED.relationship_priorities,
            expense_split=EXCLUDED.expense_split,
            updated_at=now()
          RETURNING *
        `, [
          question.slug,
          question.title,
          auth.user.id,
          ballot.respondentIdentity,
          ballot.partnerIdentity,
          JSON.stringify(ballot.priorities),
          JSON.stringify(expenseSplit),
        ]);
        return json({ ok: true, updated: existing.rowCount > 0, ballot: ballotFromRow(saved.rows[0]) });
      });
    }

    if (url.pathname === '/api/voting/ballots/me' && request.method === 'GET') {
      const auth = await session(request, env);
      if (!auth) return fail('Sign in to see your ballot.', 401, 'unauthorized');
      const question = QUESTIONS[String(url.searchParams.get('topic') || '')];
      if (!question) return fail('Unknown voting question.', 404, 'not_found');

      return await withDb(env, async (db) => {
        await ensureVotingSchema(db);
        const result = await db.query(
          'SELECT * FROM public.o2ol_show_vote_responses WHERE topic_slug=$1 AND user_id=$2::uuid',
          [question.slug, auth.user.id],
        );
        return json({ ok: true, ballot: ballotFromRow(result.rows[0] || null) });
      });
    }

    return fail('Voting route not found.', 404, 'not_found');
  } catch (error) {
    console.error('Voting error:', error);
    return fail(error?.message || 'Voting is temporarily unavailable.', error?.status || 500, error?.code || 'voting_error');
  }
}
