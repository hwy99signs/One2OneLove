// @ts-nocheck
import { Client } from 'pg';

const RESET_PATH = '/api/internal/launch-zero-reset-20260925-c2a8f49e7d6b4a1f';

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

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

export async function handleLaunchZeroReset(request, env, url) {
  if (url.pathname !== RESET_PATH) return null;
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  return withDb(env, async (db) => {
    await db.query('BEGIN');
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.app_migrations (
          name text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const existing = await db.query(
        `SELECT 1 FROM public.app_migrations WHERE name='launch-zero-reset-20260925' LIMIT 1`,
      );
      if (existing.rows[0]) {
        await db.query('ROLLBACK');
        return json({ ok: true, alreadyReset: true });
      }

      const resetTables = [
        'therapist_profiles','professional_profiles','influencer_profiles',
        'success_stories','community_posts','post_comments','reviews',
        'payment_history','scheduled_love_notes','sent_love_notes',
        'subscription_changes','feature_usage_events','custom_date_ideas',
        'memories','relationship_goals','goal_action_steps','calendar_events',
        'shared_journals','relationship_milestones','community_members',
        'messages','buddy_requests','buddy_matches','ai_usage_events',
        'conversations','message_reactions','starred_messages','pinned_messages',
        'forwarded_messages','post_likes','comment_likes','post_shares',
        'chat_room_presence','chat_room_messages','adult_sensitive_consents',
        'contest_participants','gamification_points','contest_winners',
        'waitlist','love_note_send_entitlements','love_note_category_preferences',
        'story_likes','story_helpful','suggestions','heartbeat_user_presence'
      ];

      for (const table of resetTables) {
        const found = await db.query('SELECT to_regclass($1) AS relation', [`public.${table}`]);
        if (found.rows[0]?.relation) {
          await db.query(`TRUNCATE TABLE public."${table}" RESTART IDENTITY CASCADE`);
        }
      }

      await db.query(`
        DELETE FROM public.users u
        WHERE NOT EXISTS (
          SELECT 1
            FROM neon_auth."user" a
           WHERE a.id=u.id
             AND COALESCE(a.role,'')='admin'
        )
      `);

      const sessionExists = await db.query("SELECT to_regclass('neon_auth.session') AS relation");
      if (sessionExists.rows[0]?.relation) {
        await db.query('DELETE FROM neon_auth."session"');
      }

      const verificationExists = await db.query("SELECT to_regclass('neon_auth.verification') AS relation");
      if (verificationExists.rows[0]?.relation) {
        await db.query('DELETE FROM neon_auth."verification"');
      }

      await db.query(`
        DELETE FROM neon_auth."user"
         WHERE COALESCE(role,'') <> 'admin'
      `);

      await db.query(`
        INSERT INTO public.app_migrations(name,applied_at)
        VALUES('launch-zero-reset-20260925',now())
        ON CONFLICT(name) DO NOTHING
      `);

      const result = await db.query(`
        SELECT
          (SELECT count(*)::int FROM public.users WHERE EXISTS (
            SELECT 1 FROM neon_auth."user" a WHERE a.id=public.users.id AND COALESCE(a.role,'') <> 'admin'
          )) AS non_admin_users,
          (SELECT count(*)::int FROM public.feature_usage_events) AS feature_events,
          (SELECT count(*)::int FROM public.sent_love_notes) AS sent_love_notes,
          (SELECT count(*)::int FROM public.payment_history) AS payments
      `);

      await db.query('COMMIT');
      return json({ ok: true, reset: true, counts: result.rows[0] });
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Launch zero reset failed', error);
      return json({ ok: false, error: error?.message || 'reset_failed' }, 500);
    }
  });
}
