// Production-dark entrypoint for Approval #2.
// This file is intentionally the deployed entrypoint while Love Notes delivery remains disabled.
// Activating the real implementation requires a separate explicit production approval.

Deno.serve((_request: Request) =>
  new Response(
    JSON.stringify({ error: 'LOVE_NOTE_PRODUCTION_DISABLED', code: 'PRODUCTION_DARK' }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  )
)
