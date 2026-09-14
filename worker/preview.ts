interface Env {
  ASSETS: Fetcher;
}

const JSON_HEADERS = {
  'content-type': 'application/json;charset=UTF-8',
  'cache-control': 'no-store',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'preview_api_disabled',
          message: 'This O2OL preview is intentionally disconnected from production APIs and databases.',
        }),
        { status: 503, headers: JSON_HEADERS },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
