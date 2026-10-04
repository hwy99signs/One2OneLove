import { sendO2OLTelemetry, epscieTelemetryConfigured } from './epscie-telemetry';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(_request: Request, env: any): Promise<Response> {
    return json({
      ok: true,
      app: 'one2onelove',
      mode: 'epscie-prelaunch-connectivity',
      configured: epscieTelemetryConfigured(env),
      telemetry_enabled: String(env.O2OL_EPSCIE_ENABLED || '').toLowerCase() === 'true',
      production_touched: false,
    });
  },

  async scheduled(_controller: ScheduledController, env: any, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      try {
        await sendO2OLTelemetry(env);
      } catch (error) {
        console.error('O2OL EPSCIE prelaunch telemetry error:', error instanceof Error ? error.message : String(error));
      }
    })());
  },
};
