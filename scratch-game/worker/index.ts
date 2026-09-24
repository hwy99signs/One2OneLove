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
  "Deep Questions",
  "Digital Communication",
  "Electronic Devices",
  "Social Media",
  "AI Bot Relationships"
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
        ok: count === 4800,
        service: "one2onelove-scratch-game",
        stack: "cloudflare-worker-neon-hyperdrive",
        questionCount: count
      }, count === 4800 ? 200 : 503);
    });
  } catch (error) {
    console.error("health error", error);
    return json({ ok: false, service: "one2onelove-scratch-game" }, 503);
  }
}


async function expandDigitalAgeQuestions(env: Env) {
  const relationshipInfo: Record<string, any> = {
    "Dating": { code:"DAT", footer:"MyMatchIQ.com", stages:[
      "while we're dating","as we're getting to know each other","at this stage of dating",
      "as our relationship becomes more serious","while we decide what kind of relationship we want",
      "as we learn each other's habits","while we're building trust",
      "as we consider where this relationship could lead","while we're learning what feels compatible",
      "if this relationship keeps growing"
    ]},
    "Engaged": { code:"ENG", footer:"", stages:[
      "during our engagement","as we prepare for marriage","in this season before marriage",
      "as we get ready to become spouses","while we're building habits for married life",
      "before we make our marriage vows","as we plan the life we'll share",
      "while we prepare for the responsibilities of marriage",
      "as we decide what we want our marriage to feel like","for the marriage we're preparing to build"
    ]},
    "Married": { code:"MAR", footer:"", stages:[
      "in our marriage","as spouses","in our day-to-day married life",
      "as we protect our connection over time","while we balance marriage with everything else in life",
      "as our routines and responsibilities change","as we keep choosing each other",
      "when life gets busy or stressful","as we continue growing together",
      "for the long-term health of our marriage"
    ]},
    "Committed / Unmarried": { code:"CMU", footer:"", stages:[
      "in our committed relationship","as unmarried partners building a life together",
      "in our day-to-day life as committed partners",
      "as we protect our connection without relying on marriage as the definition of commitment",
      "while we balance our committed partnership with everything else in life",
      "as our routines and responsibilities change as committed partners",
      "as we keep choosing each other in our committed relationship",
      "when life gets busy or stressful in our partnership",
      "as we continue growing together as committed partners",
      "for the long-term health of our committed partnership"
    ]}
  };

  const categoryInfo: Record<string, any> = {
    "Digital Communication": { code:"DCM", topics:[
      "how often we text or message during the day",
      "how quickly we expect each other to reply",
      "how we read tone, punctuation, emojis, and short messages",
      "whether serious disagreements should happen by text",
      "which important conversations should wait for a call or face-to-face talk",
      "how we handle read receipts, last-seen indicators, and unanswered messages",
      "direct messages, group chats, and private conversations with other people",
      "digital affection, check-ins, and small messages of reassurance",
      "communication expectations when one of us is busy, traveling, or unavailable",
      "how we repair misunderstandings that start through texting or messaging"
    ]},
    "Electronic Devices": { code:"DEV", topics:[
      "phone use during meals, dates, and shared time",
      "devices in bed and screen habits before sleep",
      "notifications interrupting conversations or time together",
      "how much personal screen time feels healthy for us",
      "device-free times or places in our relationship",
      "passwords, device privacy, and access to each other's phones or accounts",
      "location sharing, tracking features, and digital visibility",
      "work devices and work messages spilling into personal time",
      "shared devices, borrowed devices, and respecting personal information",
      "how device habits affect attention, presence, and closeness between us"
    ]},
    "Social Media": { code:"SOC", topics:[
      "how much of our relationship we post publicly",
      "likes, comments, reactions, and behavior that could feel flirtatious",
      "following, messaging, or staying connected with former partners",
      "new direct messages and private social-media conversations with other people",
      "privacy settings and what parts of our relationship stay private",
      "comparing our relationship with couples, influencers, or curated posts online",
      "posting about disagreements, frustrations, or private relationship issues",
      "photos, tags, check-ins, and getting each other's consent before posting",
      "who we follow and what online boundaries help us feel respected",
      "social-media attention, validation, and how much time it takes from our relationship"
    ]},
    "AI Bot Relationships": { code:"AIB", topics:[
      "using AI bots for relationship advice or personal guidance",
      "sharing emotional struggles with an AI bot before talking with each other",
      "how much time we spend chatting with AI companions or assistants",
      "comparing a partner's responses with the way an AI bot responds",
      "whether AI conversations should be disclosed or kept private",
      "emotionally intimate or partner-like conversations with AI bots",
      "turning to an AI companion when feeling lonely, rejected, or disconnected",
      "using AI to write messages, apologies, or difficult conversations between us",
      "when AI companionship starts replacing time, attention, or emotional closeness between us",
      "what shared boundaries we want around AI companions, chatbots, and emotionally personal AI use"
    ]}
  };

  const templates: Array<[string,string]> = [
    ["Light","What feels most comfortable to you about {topic} {stage}?"],
    ["Light","What small habit around {topic} helps you feel connected to me {stage}?"],
    ["Light","What would make {topic} feel easier, calmer, or more enjoyable for us {stage}?"],
    ["Medium","What expectation do you think we should make explicit about {topic} {stage}?"],
    ["Medium","When our preferences differ around {topic}, what would feel fair and respectful to you {stage}?"],
    ["Medium","What boundary around {topic} would help protect our attention, privacy, and trust {stage}?"],
    ["Medium","What misunderstanding could we prevent by talking more openly about {topic} {stage}?"],
    ["Deep","What past experience most shapes how you feel about {topic} {stage}?"],
    ["Deep","What would make {topic} start to feel like a threat to closeness or trust for you {stage}?"],
    ["Deep","If we ignored problems around {topic}, what do you think it could cost our relationship {stage}?"]
  ];

  return withDb(env, async client => {
    await ensureSchema(client);
    const before = Number((await client.query("SELECT count(*)::int AS count FROM public.o2ol_scratch_questions")).rows[0]?.count || 0);
    if (before >= 4800) return json({ok:true,alreadyExpanded:true,count:before});

    const rows:any[] = [];
    for (const [relationship, r] of Object.entries(relationshipInfo)) {
      for (const [category, c] of Object.entries(categoryInfo)) {
        let order = 0;
        for (let topicIndex=0; topicIndex<c.topics.length; topicIndex++) {
          const topic = c.topics[topicIndex];
          for (let local=0; local<templates.length; local++) {
            order += 1;
            const [depth, tmpl] = templates[local];
            const stage = r.stages[(topicIndex + local) % 10];
            const question = tmpl.replace("{topic}", topic).replace("{stage}", stage);
            rows.push({
              id:`O2OL-${r.code}-${c.code}-${String(order).padStart(3,"0")}`,
              relationship_type:relationship,
              category, depth, question,
              footer:r.footer || ""
            });
          }
        }
      }
    }
    if (rows.length !== 1600) throw new Error("Expansion row count invalid");

    await client.query("BEGIN");
    try {
      for (let start=0; start<rows.length; start+=100) {
        const batch=rows.slice(start,start+100);
        const params:any[]=[];
        const values=batch.map((row:any,i:number)=>{
          const b=i*7;
          params.push(row.id,row.relationship_type,row.category,row.depth,row.question,row.footer,true);
          return `(${b+1},${b+2},${b+3},${b+4},${b+5},${b+6},${b+7})`;
        }).join(",");
        await client.query(
          `INSERT INTO public.o2ol_scratch_questions
            (id,relationship_type,category,depth,question,footer,active)
           VALUES ${values}
           ON CONFLICT (id) DO UPDATE SET
             relationship_type=EXCLUDED.relationship_type,
             category=EXCLUDED.category,
             depth=EXCLUDED.depth,
             question=EXCLUDED.question,
             footer=EXCLUDED.footer,
             active=EXCLUDED.active,
             updated_at=now()`,
          params
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const after = Number((await client.query("SELECT count(*)::int AS count FROM public.o2ol_scratch_questions")).rows[0]?.count || 0);
    return json({ok:after===4800,count:after,added:after-before});
  });
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
    if (url.pathname === "/api/internal-expand-digital-age") return expandDigitalAgeQuestions(env);
    if (url.pathname === "/api/draw-question") return drawQuestion(req, env);

    return env.ASSETS.fetch(req);
  }
};
