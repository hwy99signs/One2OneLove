// @ts-nocheck
//
// Twilio inbound messaging webhook: recipient STOP / START handling.
// Twilio also enforces opt-outs at the platform level, but One2OneLove keeps
// its own record (public.o2ol_sms_optouts) so every send path — immediate and
// scheduled — can honor STOP before any send is attempted.
//
// Requests are authenticated with Twilio's signature scheme
// (X-Twilio-Signature = Base64(HMAC-SHA1(authToken, url + sorted params))).
// Unsigned or badly signed requests are rejected; nothing is stored.

import { Client } from 'pg';
import { setRecipientOptOut } from './love-note-credit';

const STOP_KEYWORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']);
const START_KEYWORDS = new Set(['START', 'UNSTOP', 'YES', 'SUBSCRIBE']);

async function twilioSignatureValid(env, url, params, signature) {
  if (!env.TWILIO_AUTH_TOKEN || !signature) return false;
  let data = url;
  for (const key of Object.keys(params).sort()) data += key + params[key];
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.TWILIO_AUTH_TOKEN),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function twiml(status = 200) {
  return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: { 'content-type': 'text/xml; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function handleTwilioMessagingWebhook(request, env) {
  if (request.method !== 'POST') return twiml(405);
  if (!env.TWILIO_AUTH_TOKEN || !env.HYPERDRIVE?.connectionString) return twiml(503);

  const form = await request.formData().catch(() => null);
  if (!form) return twiml(400);
  const params = {};
  for (const [key, value] of form.entries()) params[key] = String(value);

  const valid = await twilioSignatureValid(env, request.url, params, request.headers.get('x-twilio-signature'));
  if (!valid) return twiml(403);

  const from = String(params.From || '').trim();
  const keyword = String(params.Body || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(from) && keyword) {
    const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await db.connect();
    try {
      if (STOP_KEYWORDS.has(keyword)) await setRecipientOptOut(db, from, true, 'twilio_inbound');
      else if (START_KEYWORDS.has(keyword)) await setRecipientOptOut(db, from, false, 'twilio_inbound');
    } finally {
      await db.end();
    }
  }
  return twiml(200);
}
