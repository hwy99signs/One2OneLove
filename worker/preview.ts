function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return json(
        {
          ok: false,
          error: {
            code: 'preview_api_disabled',
            message: 'This staging Worker is frontend-only. Preview game voting uses sample data and never writes to production.',
          },
        },
        503,
      );
    }

    return env.ASSETS.fetch(request);
  },
};
