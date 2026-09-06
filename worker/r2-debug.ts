export default {
  async fetch(_request, env) {
    const result = await env.MEDIA.list({ prefix: 'brand/', limit: 20 });
    return Response.json({
      bucket_binding: true,
      keys: result.objects.map((object) => object.key),
      truncated: result.truncated,
    });
  },
};
