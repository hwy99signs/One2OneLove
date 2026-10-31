// @ts-nocheck
import { Client } from 'pg';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const COUNTRY_MIN_VOTES = 5;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

async function session(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? { user, session: active } : null;
}

async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}

function requestCountry(request) {
  const fromCf = String(request?.cf?.country || request.headers.get('cf-ipcountry') || '').toUpperCase();
  return /^[A-Z]{2}$/.test(fromCf) ? fromCf : 'ZZ';
}

function percentage(votes, total) {
  if (!total) return 0;
  return Math.round((Number(votes) / Number(total)) * 100);
}

async function buildResults(db, questionId) {
  const globalResult = await db.query(
    `SELECT o.id AS option_id, o.option_key, o.label, o.sort_order,
            COUNT(v.id)::int AS votes
       FROM public.wstd_options o
       LEFT JOIN public.wstd_votes v ON v.option_id=o.id AND v.question_id=o.question_id
      WHERE o.question_id=$1
      GROUP BY o.id, o.option_key, o.label, o.sort_order
      ORDER BY o.sort_order, o.id`,
    [questionId],
  );

  const totalVotes = globalResult.rows.reduce((sum, row) => sum + Number(row.votes || 0), 0);
  const global = globalResult.rows.map(row => ({
    optionId: Number(row.option_id),
    optionKey: row.option_key,
    label: row.label,
    votes: Number(row.votes || 0),
    percentage: percentage(row.votes, totalVotes),
  }));

  const countryResult = await db.query(
    `WITH eligible_countries AS (
       SELECT country_code, COUNT(*)::int AS total_votes
         FROM public.wstd_votes
        WHERE question_id=$1 AND country_code <> 'ZZ'
        GROUP BY country_code
       HAVING COUNT(*) >= $2
     )
     SELECT ec.country_code, ec.total_votes,
            o.id AS option_id, o.option_key, o.label, o.sort_order,
            COUNT(v.id)::int AS votes
       FROM eligible_countries ec
       CROSS JOIN public.wstd_options o
       LEFT JOIN public.wstd_votes v
         ON v.question_id=$1
        AND v.country_code=ec.country_code
        AND v.option_id=o.id
      WHERE o.question_id=$1
      GROUP BY ec.country_code, ec.total_votes, o.id, o.option_key, o.label, o.sort_order
      ORDER BY ec.total_votes DESC, ec.country_code, o.sort_order, o.id`,
    [questionId, COUNTRY_MIN_VOTES],
  );

  const byCountry = new Map();
  for (const row of countryResult.rows) {
    const code = String(row.country_code).trim();
    if (!byCountry.has(code)) {
      byCountry.set(code, {
        countryCode: code,
        totalVotes: Number(row.total_votes || 0),
        options: [],
      });
    }
    const country = byCountry.get(code);
    country.options.push({
      optionId: Number(row.option_id),
      optionKey: row.option_key,
      label: row.label,
      votes: Number(row.votes || 0),
      percentage: percentage(row.votes, country.totalVotes),
    });
  }

  return {
    totalVotes,
    global,
    countries: Array.from(byCountry.values()),
    countryMinimumVotes: COUNTRY_MIN_VOTES,
  };
}

export async function handleWhatShouldTheyDoRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/what-should-they-do')) return null;

  try {
    if (url.pathname === '/api/what-should-they-do/questions' && request.method === 'GET') {
      const limit = Math.max(1, Math.min(Number(url.searchParams.get('limit') || 20), 50));
      return await withDb(env, async db => {
        const result = await db.query(
          `SELECT q.id, q.slug, q.prompt, q.scenario, q.category, q.sort_order,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', o.id,
                        'optionKey', o.option_key,
                        'label', o.label,
                        'sortOrder', o.sort_order
                      ) ORDER BY o.sort_order, o.id
                    ) FILTER (WHERE o.id IS NOT NULL),
                    '[]'::json
                  ) AS options
             FROM public.wstd_questions q
             LEFT JOIN public.wstd_options o ON o.question_id=q.id
            WHERE q.status='active'
            GROUP BY q.id
            ORDER BY q.sort_order, q.id
            LIMIT $1`,
          [limit],
        );

        return json({
          ok: true,
          questions: result.rows.map(row => ({
            id: Number(row.id),
            slug: row.slug,
            prompt: row.prompt,
            scenario: row.scenario,
            category: row.category,
            options: (row.options || []).map(option => ({
              ...option,
              id: Number(option.id),
            })),
          })),
        });
      });
    }

    const resultMatch = url.pathname.match(/^\/api\/what-should-they-do\/results\/(\d+)$/);
    if (resultMatch && request.method === 'GET') {
      const questionId = Number(resultMatch[1]);
      return await withDb(env, async db => {
        const exists = await db.query(
          `SELECT 1 FROM public.wstd_questions WHERE id=$1 AND status='active' LIMIT 1`,
          [questionId],
        );
        if (!exists.rowCount) return fail('Question not found.', 404, 'not_found');
        return json({ ok: true, results: await buildResults(db, questionId) });
      });
    }

    if (url.pathname === '/api/what-should-they-do/votes' && request.method === 'POST') {
      const input = await readJson(request);
      const questionId = Number(input?.questionId);
      const optionId = Number(input?.optionId);
      if (!Number.isInteger(questionId) || !Number.isInteger(optionId)) {
        return fail('A valid question and option are required.');
      }

      const auth = await session(request, env);
      const visitorId = String(input?.visitorId || '');
      if (!auth && !/^[A-Za-z0-9-]{16,100}$/.test(visitorId)) {
        return fail('A valid visitor identifier is required.', 400, 'invalid_visitor');
      }

      const voterKey = auth?.user?.id ? `user:${auth.user.id}` : `guest:${visitorId}`;
      const userId = auth?.user?.id || null;
      const countryCode = requestCountry(request);

      return await withDb(env, async db => {
        const option = await db.query(
          `SELECT o.id
             FROM public.wstd_options o
             JOIN public.wstd_questions q ON q.id=o.question_id
            WHERE o.id=$1 AND o.question_id=$2 AND q.status='active'
            LIMIT 1`,
          [optionId, questionId],
        );
        if (!option.rowCount) return fail('That answer is not available for this question.', 404, 'option_not_found');

        const inserted = await db.query(
          `INSERT INTO public.wstd_votes(question_id, option_id, user_id, voter_key, country_code)
           VALUES($1,$2,$3,$4,$5)
           ON CONFLICT(question_id, voter_key) DO NOTHING
           RETURNING option_id`,
          [questionId, optionId, userId, voterKey, countryCode],
        );

        let selectedOptionId = optionId;
        let alreadyVoted = false;
        if (!inserted.rowCount) {
          alreadyVoted = true;
          const existing = await db.query(
            `SELECT option_id FROM public.wstd_votes WHERE question_id=$1 AND voter_key=$2 LIMIT 1`,
            [questionId, voterKey],
          );
          selectedOptionId = Number(existing.rows[0]?.option_id || optionId);
        }

        return json({
          ok: true,
          selectedOptionId,
          alreadyVoted,
          countryCode,
          results: await buildResults(db, questionId),
        }, inserted.rowCount ? 201 : 200);
      });
    }

    return fail('What Should They Do route not found.', 404, 'not_found');
  } catch (err) {
    console.error('One2OneLove What Should They Do API error', err);
    return fail(err?.message || 'Unable to process game request.', 400, 'wstd_error');
  }
}
