// EPSCIE Portfolio Telemetry v1 sender for One2OneLove.
// Security rules:
// - server-side only
// - fail-closed unless explicitly enabled
// - credentials come only from Worker secrets/env
// - aggregate operational telemetry only; never send PII, prompts, content, IDs, cookies, or database rows

const DEFAULT_ENDPOINT = 'https://epscie-core.hwy99signs.workers.dev/v1/telemetry';
const APP_KEY = 'one2onelove';

function enabled(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function environmentName(env) {
  return enabled(env.PRELAUNCH_ENVIRONMENT) ? 'prelaunch' : 'production';
}

export function epscieTelemetryConfigured(env) {
  return enabled(env.O2OL_EPSCIE_ENABLED)
    && Boolean(String(env.O2OL_EPSCIE_KEY_ID || '').trim())
    && Boolean(String(env.O2OL_EPSCIE_SECRET || '').trim());
}

export function buildO2OLTelemetry(env, responseMs = 0) {
  const now = new Date().toISOString();
  const environment = environmentName(env);
  return {
    schema_version: 1,
    health: {
      component: 'one2onelove',
      status: 'healthy',
      environment,
      version: String(env.O2OL_RELEASE_VERSION || 'unknown').slice(0, 80),
      response_ms: Math.max(0, Number(responseMs) || 0),
      details: {
        telemetry_mode: 'aggregate_non_pii',
        access_model: 'free_tokens',
      },
      observed_at: now,
    },
    metrics: [
      {
        metric_key: 'application.heartbeat',
        metric_value: 1,
        unit: 'count',
        dimensions: {
          environment,
          component: 'one2onelove',
        },
        observed_at: now,
      },
    ],
    faults: [],
  };
}

export async function sendO2OLTelemetry(env) {
  if (!epscieTelemetryConfigured(env)) {
    return { sent: false, reason: 'not_configured' };
  }

  const endpoint = String(env.O2OL_EPSCIE_ENDPOINT || DEFAULT_ENDPOINT).trim();
  const keyId = String(env.O2OL_EPSCIE_KEY_ID || '').trim();
  const secret = String(env.O2OL_EPSCIE_SECRET || '').trim();

  const started = Date.now();
  const payload = buildO2OLTelemetry(env, 0);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-epscie-app-key': APP_KEY,
      'x-epscie-key-id': keyId,
      'x-epscie-secret': secret,
    },
    body: JSON.stringify(payload),
  });

  const elapsed = Date.now() - started;
  if (!response.ok) {
    const safeBody = (await response.text()).slice(0, 300);
    throw new Error(`EPSCIE telemetry rejected (${response.status}): ${safeBody}`);
  }

  return {
    sent: true,
    status: response.status,
    response_ms: elapsed,
  };
}
