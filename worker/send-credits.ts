// @ts-nocheck

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

export async function handleSendCreditWebhook() {
  return null;
}

export async function handleSendCreditsRequest(request, _env, url) {
  if (!url.pathname.startsWith('/api/send-credits')) return null;
  return json({
    ok: false,
    error: {
      code: 'send_credits_retired',
      message: 'Prepaid Love Note send credits have been retired. Paid members receive their first One2OneLove SMS Love Note send free; additional sends are $0.29 each and are billed with subscription usage.',
    },
  }, 410);
}
