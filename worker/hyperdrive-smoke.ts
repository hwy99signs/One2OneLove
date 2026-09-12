import { Client } from "pg";

type Env = {
  HYPERDRIVE: {
    connectionString: string;
  };
};

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });

    try {
      await client.connect();
      const result = await client.query(`
        select
          current_database() as database_name,
          current_user as database_user,
          exists (
            select 1
            from information_schema.tables
            where table_schema = 'public' and table_name = 'users'
          ) as users_table_present,
          exists (
            select 1
            from information_schema.tables
            where table_schema = 'public' and table_name = 'scheduled_love_notes'
          ) as scheduled_love_notes_present
      `);

      return Response.json({
        ok: true,
        service: "One2OneLove Hyperdrive smoke test",
        ...result.rows[0],
      });
    } catch (error) {
      return Response.json(
        {
          ok: false,
          service: "One2OneLove Hyperdrive smoke test",
          error: error instanceof Error ? error.message : "Unknown database error",
        },
        { status: 500 },
      );
    } finally {
      await client.end().catch(() => undefined);
    }
  },
};
