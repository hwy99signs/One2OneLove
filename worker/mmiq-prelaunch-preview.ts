export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return Response.json(
        { ok: false, preview: true, message: 'API access is disabled in this visual preview.' },
        { status: 503 },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
