import { Client } from "pg";

interface Env {
  ASSETS: Fetcher;
  HYPERDRIVE: Hyperdrive;
}

const RELATIONSHIPS = new Set([
  "Dating",
  "Engaged",
  "Married",
  "Committed / Unmarried"
]);

const CATEGORIES = new Set([
  "Communication",
  "Trust",
  "Fun",
  "Intimacy",
  "Money",
  "Future",
  "Conflict",
  "Deep Questions"
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}

async function withDb(env: Env, fn: (client: Client) => Promise<Response>) {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    try { await client.end(); } catch {}
  }
}

async function ensureSchema(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.o2ol_scratch_questions (
      id text PRIMARY KEY,
      relationship_type text NOT NULL,
      category text NOT NULL,
      depth text NOT NULL,
      question text NOT NULL,
      footer text NOT NULL DEFAULT '',
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_o2ol_scratch_questions_draw
      ON public.o2ol_scratch_questions (relationship_type, category, active)
  `);
}

async function health(env: Env) {
  try {
    return await withDb(env, async client => {
      await ensureSchema(client);
      const result = await client.query(
        "SELECT count(*)::int AS count FROM public.o2ol_scratch_questions WHERE active = TRUE"
      );
      const count = Number(result.rows[0]?.count || 0);
      return json({
        ok: count === 3200,
        service: "one2onelove-scratch-game",
        stack: "cloudflare-worker-neon-hyperdrive",
        questionCount: count
      }, count === 3200 ? 200 : 503);
    });
  } catch (error) {
    console.error("health error", error);
    return json({ ok: false, service: "one2onelove-scratch-game" }, 503);
  }
}

async function drawQuestion(req: Request, env: Env) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const relationship = String(body?.relationship || "");
  const category = String(body?.category || "");
  const exclude = Array.isArray(body?.exclude) ? body.exclude.slice(-800).map(String) : [];
  const avoidId = body?.avoidId ? String(body.avoidId) : null;

  if (!RELATIONSHIPS.has(relationship)) return json({ error: "Invalid relationship type" }, 400);
  if (!(CATEGORIES.has(category) || category === "Shuffle All")) return json({ error: "Invalid category" }, 400);

  try {
    return await withDb(env, async client => {
      await ensureSchema(client);

      const params: any[] = [relationship, exclude, avoidId];
      let categoryClause = "";
      if (category !== "Shuffle All") {
        params.push(category);
        categoryClause = "AND category = $4";
      }

      const result = await client.query(
        `
          SELECT id, category, depth, question, footer
          FROM public.o2ol_scratch_questions
          WHERE active = TRUE
            AND relationship_type = $1
            ${categoryClause}
            AND NOT (id = ANY($2::text[]))
            AND ($3::text IS NULL OR id <> $3)
          ORDER BY random()
          LIMIT 1
        `,
        params
      );

      if (!result.rows.length) return json({ deckComplete: true }, 409);

      const row = result.rows[0];
      return json({
        card: {
          id: row.id,
          question: row.question,
          category: row.category,
          depth: row.depth,
          footer: row.footer || ""
        }
      });
    });
  } catch (error) {
    console.error("draw error", error);
    return json({ error: "Card unavailable" }, 503);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/health") return health(env);
    if (url.pathname === "/api/draw-question") return drawQuestion(req, env);

    return env.ASSETS.fetch(req);
  }
};
