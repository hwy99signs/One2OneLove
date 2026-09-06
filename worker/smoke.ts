export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "one2onelove",
        stage: "neon-cloudflare-migration-smoke",
      });
    }

    return new Response("One2OneLove Cloudflare migration smoke worker", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
