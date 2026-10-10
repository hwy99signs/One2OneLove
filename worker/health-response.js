// Preserve O2OL's public health contract while relying on the real database check.
export async function withDatabaseHealth(request, env, baseFetch) {
  const prelaunch = String(env.PRELAUNCH_ENVIRONMENT || '').toLowerCase() === 'true';
  const metadata = {
    app: 'one2onelove',
    environment: prelaunch ? 'token-prelaunch' : 'production',
    production: !prelaunch,
    accessModel: 'free_tokens',
  };
  let ready = false;
  let source = {};
  try {
    const upstream = await baseFetch(request, env);
    if (upstream?.headers?.get('content-type')?.includes('application/json')) {
      const payload = await upstream.json();
      if (payload && typeof payload === 'object') {
        source = payload;
        ready = upstream.ok && payload.database_ready === true;
      }
    }
  } catch {
    // Fail closed without leaking database errors, credentials, or exception details.
  }
  return new Response(JSON.stringify({
    ...source,
    ...metadata,
    ok: ready,
    database_ready: ready,
  }), {
    status: ready ? 200 : 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
