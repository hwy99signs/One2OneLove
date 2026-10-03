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
            message: 'This isolated Cloudflare preview is frontend-only. Like Minded multiplayer writes are disabled so preview testing cannot touch production Neon data.',
          },
        },
        503,
      );
    }

    return env.ASSETS.fetch(request);
  },
};
