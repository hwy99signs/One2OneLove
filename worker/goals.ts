// @ts-nocheck
import { Client } from 'pg';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const GOAL_FIELDS = new Set([
  'title', 'description', 'category', 'status', 'progress', 'target_date',
  'partner_email', 'shared_with_partner', 'reminder_enabled', 'reminder_phone',
  'reminder_frequency', 'notes',
]);
const CATEGORIES = new Set([
  'communication', 'quality_time', 'intimacy', 'personal_growth', 'financial',
  'family', 'health', 'adventure', 'home', 'career',
]);
const STATUSES = new Set(['in_progress', 'completed', 'cancelled']);
const REMINDER_FREQUENCIES = new Set(['daily', 'weekly', 'biweekly']);
const SORT_FIELDS = new Set(['created_at', 'updated_at', 'target_date', 'progress', 'title', 'status']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function getSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    headers: { cookie, accept: 'application/json' },
  });
  if (!res.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && session ? { user, session } : null;
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

async function readJson(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Expected application/json body.');
  }
  return request.json();
}

function safeText(value, max = 5000, required = false) {
  if (value == null) {
    if (required) throw new Error('Required text value is missing.');
    return null;
  }
  const text = String(value).trim();
  if (required && !text) throw new Error('Required text value is empty.');
  if (text.length > max) throw new Error(`Text value exceeds ${max} characters.`);
  return text || null;
}

function normalizeGoalInput(body, partial = false) {
  const input = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (GOAL_FIELDS.has(key)) input[key] = value;
  }

  if (!partial) {
    input.title = safeText(input.title, 250, true);
    input.category = safeText(input.category, 50, true);
    input.target_date = safeText(input.target_date, 10, true);
  } else if ('title' in input) {
    input.title = safeText(input.title, 250, true);
  }

  if ('description' in input) input.description = safeText(input.description, 5000);
  if ('notes' in input) input.notes = safeText(input.notes, 10000);
  if ('partner_email' in input) input.partner_email = safeText(input.partner_email, 320);
  if ('reminder_phone' in input) input.reminder_phone = safeText(input.reminder_phone, 100);

  if ('category' in input && !CATEGORIES.has(input.category)) throw new Error('Invalid goal category.');
  if ('status' in input && !STATUSES.has(input.status)) throw new Error('Invalid goal status.');
  if ('reminder_frequency' in input && input.reminder_frequency != null && input.reminder_frequency !== '' && !REMINDER_FREQUENCIES.has(input.reminder_frequency)) {
    throw new Error('Invalid reminder frequency.');
  }
  if ('reminder_frequency' in input && input.reminder_frequency === '') input.reminder_frequency = null;
  if ('progress' in input) {
    const progress = Number(input.progress);
    if (!Number.isFinite(progress)) throw new Error('Invalid goal progress.');
    input.progress = Math.max(0, Math.min(100, Math.round(progress)));
    if (input.progress === 100 && !('status' in input)) input.status = 'completed';
  }
  if ('shared_with_partner' in input) input.shared_with_partner = Boolean(input.shared_with_partner);
  if ('reminder_enabled' in input) input.reminder_enabled = Boolean(input.reminder_enabled);
  return input;
}

function normalizeSteps(value) {
  if (value == null) return null;
  if (!Array.isArray(value)) throw new Error('action_steps must be an array.');
  return value.slice(0, 100).map((step) => safeText(step, 1000, true));
}

async function fetchGoal(db, userId, goalId) {
  const goalResult = await db.query(
    'SELECT * FROM public.relationship_goals WHERE id=$1::uuid AND user_id=$2::uuid',
    [goalId, userId],
  );
  const goal = goalResult.rows[0];
  if (!goal) return null;
  const stepsResult = await db.query(
    'SELECT * FROM public.goal_action_steps WHERE goal_id=$1::uuid ORDER BY step_order ASC',
    [goalId],
  );
  return {
    ...goal,
    action_steps: stepsResult.rows.map((step) => step.step_text),
    action_steps_details: stepsResult.rows,
  };
}

async function listGoals(db, userId, order) {
  const requested = String(order || '-created_at');
  const desc = requested.startsWith('-');
  const field = requested.replace(/^-/, '');
  const sortField = SORT_FIELDS.has(field) ? field : 'created_at';
  const goalsResult = await db.query(
    `SELECT * FROM public.relationship_goals WHERE user_id=$1::uuid ORDER BY ${sortField} ${desc ? 'DESC' : 'ASC'}, id ASC`,
    [userId],
  );
  if (!goalsResult.rows.length) return [];
  const ids = goalsResult.rows.map((goal) => goal.id);
  const stepsResult = await db.query(
    'SELECT * FROM public.goal_action_steps WHERE goal_id = ANY($1::uuid[]) ORDER BY goal_id, step_order ASC',
    [ids],
  );
  const byGoal = new Map();
  for (const step of stepsResult.rows) {
    if (!byGoal.has(step.goal_id)) byGoal.set(step.goal_id, []);
    byGoal.get(step.goal_id).push(step);
  }
  return goalsResult.rows.map((goal) => {
    const details = byGoal.get(goal.id) || [];
    return { ...goal, action_steps: details.map((step) => step.step_text), action_steps_details: details };
  });
}

async function replaceSteps(db, goalId, steps) {
  await db.query('DELETE FROM public.goal_action_steps WHERE goal_id=$1::uuid', [goalId]);
  for (let index = 0; index < steps.length; index += 1) {
    await db.query(
      `INSERT INTO public.goal_action_steps (goal_id,step_text,step_order,is_completed)
       VALUES ($1::uuid,$2,$3,false)`,
      [goalId, steps[index], index + 1],
    );
  }
}

async function createGoal(db, userId, body) {
  const fields = normalizeGoalInput(body, false);
  const steps = normalizeSteps(body.action_steps) || [];
  const columns = ['user_id'];
  const values = [userId];
  const params = ['$1::uuid'];
  for (const [key, value] of Object.entries(fields)) {
    columns.push(key);
    values.push(value === '' ? null : value);
    params.push(`$${values.length}`);
  }

  await db.query('BEGIN');
  try {
    const result = await db.query(
      `INSERT INTO public.relationship_goals (${columns.join(',')}) VALUES (${params.join(',')}) RETURNING id`,
      values,
    );
    const goalId = result.rows[0].id;
    await replaceSteps(db, goalId, steps);
    await db.query('COMMIT');
    return fetchGoal(db, userId, goalId);
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

async function updateGoal(db, userId, goalId, body) {
  const fields = normalizeGoalInput(body, true);
  const steps = normalizeSteps(body.action_steps);
  if (!Object.keys(fields).length && steps == null) throw new Error('No goal updates were provided.');

  await db.query('BEGIN');
  try {
    if (Object.keys(fields).length) {
      const sets = [];
      const values = [];
      for (const [key, value] of Object.entries(fields)) {
        values.push(value === '' ? null : value);
        sets.push(`${key}=$${values.length}`);
      }
      values.push(goalId, userId);
      const result = await db.query(
        `UPDATE public.relationship_goals SET ${sets.join(',')},updated_at=now()
         WHERE id=$${values.length - 1}::uuid AND user_id=$${values.length}::uuid RETURNING id`,
        values,
      );
      if (!result.rowCount) throw new Error('Goal not found.');
    } else {
      const owned = await db.query('SELECT 1 FROM public.relationship_goals WHERE id=$1::uuid AND user_id=$2::uuid', [goalId, userId]);
      if (!owned.rowCount) throw new Error('Goal not found.');
    }
    if (steps != null) await replaceSteps(db, goalId, steps);
    await db.query('COMMIT');
    return fetchGoal(db, userId, goalId);
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}

async function stats(db, userId) {
  const result = await db.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status='completed')::int AS completed,
            count(*) FILTER (WHERE status='in_progress')::int AS in_progress,
            count(*) FILTER (WHERE status='cancelled')::int AS cancelled,
            COALESCE(round(avg(progress)),0)::int AS avg_progress
     FROM public.relationship_goals WHERE user_id=$1::uuid`,
    [userId],
  );
  const row = result.rows[0];
  return {
    total: row.total,
    completed: row.completed,
    in_progress: row.in_progress,
    cancelled: row.cancelled,
    avgProgress: row.avg_progress,
  };
}

export async function handleGoalsRequest(request, env, url) {
  if (!url.pathname.startsWith('/api/goals')) return null;
  const auth = await getSession(request, env);
  if (!auth) return fail('Authentication required.', 401, 'unauthorized');

  try {
    return await withDb(env, async (db) => {
      if (url.pathname === '/api/goals/stats') {
        if (request.method !== 'GET') return fail('Method not allowed.', 405, 'method_not_allowed');
        return json({ ok: true, stats: await stats(db, auth.user.id) });
      }

      const stepMatch = url.pathname.match(/^\/api\/goals\/steps\/([0-9a-f-]{36})$/i);
      if (stepMatch) {
        const stepId = stepMatch[1];
        if (request.method === 'PATCH') {
          const body = await readJson(request);
          const result = await db.query(
            `UPDATE public.goal_action_steps s SET is_completed=$1,completed_at=CASE WHEN $1 THEN now() ELSE NULL END,updated_at=now()
             FROM public.relationship_goals g
             WHERE s.id=$2::uuid AND s.goal_id=g.id AND g.user_id=$3::uuid RETURNING s.*`,
            [Boolean(body.is_completed), stepId, auth.user.id],
          );
          if (!result.rows[0]) return fail('Action step not found.', 404, 'not_found');
          return json({ ok: true, step: result.rows[0] });
        }
        if (request.method === 'DELETE') {
          const result = await db.query(
            `DELETE FROM public.goal_action_steps s USING public.relationship_goals g
             WHERE s.id=$1::uuid AND s.goal_id=g.id AND g.user_id=$2::uuid RETURNING s.id`,
            [stepId, auth.user.id],
          );
          if (!result.rowCount) return fail('Action step not found.', 404, 'not_found');
          return json({ ok: true });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      const completeMatch = url.pathname.match(/^\/api\/goals\/([0-9a-f-]{36})\/complete$/i);
      if (completeMatch) {
        if (request.method !== 'POST' && request.method !== 'PATCH') return fail('Method not allowed.', 405, 'method_not_allowed');
        const result = await db.query(
          `UPDATE public.relationship_goals SET status='completed',progress=100,updated_at=now()
           WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id`,
          [completeMatch[1], auth.user.id],
        );
        if (!result.rowCount) return fail('Goal not found.', 404, 'not_found');
        return json({ ok: true, goal: await fetchGoal(db, auth.user.id, completeMatch[1]) });
      }

      const progressMatch = url.pathname.match(/^\/api\/goals\/([0-9a-f-]{36})\/progress$/i);
      if (progressMatch) {
        if (request.method !== 'PATCH') return fail('Method not allowed.', 405, 'method_not_allowed');
        const body = await readJson(request);
        const progress = Math.max(0, Math.min(100, Math.round(Number(body.progress))));
        if (!Number.isFinite(progress)) return fail('Invalid progress value.');
        const result = await db.query(
          `UPDATE public.relationship_goals
           SET progress=$1,status=CASE WHEN $1=100 THEN 'completed' ELSE status END,updated_at=now()
           WHERE id=$2::uuid AND user_id=$3::uuid RETURNING id`,
          [progress, progressMatch[1], auth.user.id],
        );
        if (!result.rowCount) return fail('Goal not found.', 404, 'not_found');
        return json({ ok: true, goal: await fetchGoal(db, auth.user.id, progressMatch[1]) });
      }

      const stepsMatch = url.pathname.match(/^\/api\/goals\/([0-9a-f-]{36})\/steps$/i);
      if (stepsMatch) {
        const goalId = stepsMatch[1];
        const owned = await db.query('SELECT 1 FROM public.relationship_goals WHERE id=$1::uuid AND user_id=$2::uuid', [goalId, auth.user.id]);
        if (!owned.rowCount) return fail('Goal not found.', 404, 'not_found');
        if (request.method === 'GET') {
          const result = await db.query('SELECT * FROM public.goal_action_steps WHERE goal_id=$1::uuid ORDER BY step_order ASC', [goalId]);
          return json({ ok: true, steps: result.rows });
        }
        if (request.method === 'POST') {
          const body = await readJson(request);
          const stepText = safeText(body.step_text, 1000, true);
          const orderResult = await db.query('SELECT COALESCE(max(step_order),0)::int + 1 AS next_order FROM public.goal_action_steps WHERE goal_id=$1::uuid', [goalId]);
          const result = await db.query(
            `INSERT INTO public.goal_action_steps (goal_id,step_text,step_order,is_completed)
             VALUES ($1::uuid,$2,$3,false) RETURNING *`,
            [goalId, stepText, orderResult.rows[0].next_order],
          );
          return json({ ok: true, step: result.rows[0] }, 201);
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      const goalMatch = url.pathname.match(/^\/api\/goals\/([0-9a-f-]{36})$/i);
      if (goalMatch) {
        const goalId = goalMatch[1];
        if (request.method === 'GET') {
          const goal = await fetchGoal(db, auth.user.id, goalId);
          return goal ? json({ ok: true, goal }) : fail('Goal not found.', 404, 'not_found');
        }
        if (request.method === 'PATCH') {
          const body = await readJson(request);
          return json({ ok: true, goal: await updateGoal(db, auth.user.id, goalId, body) });
        }
        if (request.method === 'DELETE') {
          const result = await db.query('DELETE FROM public.relationship_goals WHERE id=$1::uuid AND user_id=$2::uuid RETURNING id', [goalId, auth.user.id]);
          if (!result.rowCount) return fail('Goal not found.', 404, 'not_found');
          return json({ ok: true });
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      if (url.pathname === '/api/goals') {
        if (request.method === 'GET') return json({ ok: true, goals: await listGoals(db, auth.user.id, url.searchParams.get('order')) });
        if (request.method === 'POST') {
          const body = await readJson(request);
          return json({ ok: true, goal: await createGoal(db, auth.user.id, body) }, 201);
        }
        return fail('Method not allowed.', 405, 'method_not_allowed');
      }

      return fail('Goal route not found.', 404, 'not_found');
    });
  } catch (err) {
    console.error('One2OneLove goals API error', err);
    const message = err?.message === 'Goal not found.' ? err.message : (err?.message || 'Unable to process goal request.');
    return fail(message, message === 'Goal not found.' ? 404 : 400, message === 'Goal not found.' ? 'not_found' : 'goal_error');
  }
}
