import { sendO2OLTelemetry } from './epscie-telemetry';

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

function configured(env: any) {
  return String(env?.O2OL_EPSCIE_ENABLED || '').toLowerCase() === 'true'
    && Boolean(String(env?.O2OL_EPSCIE_KEY_ID || '').trim())
    && Boolean(String(env?.O2OL_EPSCIE_SECRET || '').trim());
}

export default {
  async fetch(_request: Request, env: any): Promise<Response> {
    try {
      return json({
        ok: true,
        app: 'one2onelove',
        mode: 'epscie-prelaunch-connectivity',
        configured: configured(env),
        telemetry_enabled: String(env?.O2OL_EPSCIE_ENABLED || '').toLowerCase() === 'true',
        production_touched: false,
      });
    } catch (error) {
      return json({
        ok: false,
        app: 'one2onelove',
        production_touched: false,
        error: error instanceof Error ? error.message : String(error),
      }, 500);
    }
  },

  async scheduled(_controller: any, env: any, ctx: any): Promise<void> {
    ctx.waitUntil((async () => {
      try {
        await sendO2OLTelemetry(env);
      } catch (error) {
        console.error('O2OL EPSCIE prelaunch telemetry error:', error instanceof Error ? error.message : String(error));
      }
    })());
  },
};
