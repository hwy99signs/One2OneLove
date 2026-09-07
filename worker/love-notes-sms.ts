// @ts-nocheck

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function error(message, status = 400, code = 'bad_request') {
  return json({ ok: false, error: { code, message } }, status);
}

async function getSession(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie || !env.NEON_AUTH_BASE_URL) return null;

  const headers = new Headers();
  headers.set('cookie', cookie);
  headers.set('accept', 'application/json');

  const response = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', {
    method: 'GET',
    headers,
  });
  if (!response.ok) return null;

  const payload = await response.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const session = payload?.session ?? payload?.data?.session ?? null;
  if (!user?.id || !session) return null;
  return { user, session };
}

function cleanText(value, max, required = false) {
  const text = value == null ? '' : String(value).trim();
  if (required && !text) throw new Error('A required value is missing.');
  if (text.length > max) throw new Error(`Text value exceeds ${max} characters.`);
  return text;
}

function normalizePhone(value) {
  const original = String(value || '').trim();
  if (!original) throw new Error('Recipient phone number is required.');

  const digits = original.replace(/\D/g, '');
  let normalized;

  if (original.startsWith('+')) {
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    // Current One2OneLove launch market defaults 10-digit numbers to US/Canada (+1).
    normalized = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    normalized = `+${digits}`;
  } else {
    throw new Error('Enter a valid phone number with country code.');
  }

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error('Enter a valid phone number with country code.');
  }
  return normalized;
}

async function sendViaTwilio(env, to, body) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    return {
      configured: false,
      response: error(
        'Live SMS delivery is not configured yet.',
        503,
        'sms_not_configured',
      ),
    };
  }

  const form = new URLSearchParams();
  form.set('To', to);
  form.set('Body', body);
  if (messagingServiceSid) form.set('MessagingServiceSid', messagingServiceSid);
  else form.set('From', fromNumber);

  const auth = btoa(`${accountSid}:${authToken}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${auth}`,
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: form.toString(),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('Twilio Love Note send failed', {
      status: response.status,
      code: payload?.code,
      message: payload?.message,
    });
    return {
      configured: true,
      response: error(
        'The love note could not be sent by text message. Please try again.',
        502,
        'sms_provider_error',
      ),
    };
  }

  return {
    configured: true,
    response: json({
      ok: true,
      message: {
        provider: 'twilio',
        sid: payload?.sid || null,
        status: payload?.status || 'queued',
        to,
      },
    }, 201),
  };
}

export async function handleLoveNotesSmsRequest(request, env, url) {
  if (url.pathname !== '/api/love-notes/send-sms') return null;
  if (request.method !== 'POST') return error('Method not allowed.', 405, 'method_not_allowed');

  const auth = await getSession(request, env);
  if (!auth) return error('Authentication required.', 401, 'unauthorized');

  let body;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return error('Expected application/json body.');
    }
    body = await request.json();
  } catch {
    return error('Invalid JSON request body.');
  }

  try {
    const title = cleanText(body?.note_title, 250, true);
    const content = cleanText(body?.note_content, 10000, true);
    const recipientPhone = normalizePhone(body?.recipient_phone);
    const messageText = `${title}\n\n${content}\n\n❤️ From One2One Love`;

    const result = await sendViaTwilio(env, recipientPhone, messageText);
    return result.response;
  } catch (err) {
    return error(err?.message || 'Unable to send love note by SMS.', 400, 'invalid_sms_request');
  }
}
