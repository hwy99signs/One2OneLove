import { handleStudioMediaRequest } from './studio-media';

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher; MEDIA: R2Bucket }) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/studio-media/')) {
      const response = await handleStudioMediaRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json(
        { ok: false, preview: true, message: 'API access is disabled in this visual preview.' },
        { status: 503 },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
