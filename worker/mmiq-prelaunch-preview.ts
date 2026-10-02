import baseWorker from './index';
import { handleCommunityChatRequest } from './community-chat';
import { handleStudioMediaRequest } from './studio-media';

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher; MEDIA: R2Bucket; HYPERDRIVE: { connectionString: string }; NEON_AUTH_BASE_URL: string }) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/studio-media/')) {
      const response = await handleStudioMediaRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/community-chat')) {
      const response = await handleCommunityChatRequest(request, env, url);
      if (response) return response;
    }

    if (url.pathname.startsWith('/api/auth') || url.pathname === '/api/profile') {
      return baseWorker.fetch(request, env);
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
