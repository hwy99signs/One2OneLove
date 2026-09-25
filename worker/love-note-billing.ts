// @ts-nocheck

export const LOVE_NOTE_SEND_PRICE_CENTS = 29;
export const CUSTOM_LOVE_NOTE_MAX_CHARACTERS = 171;

function canonicalPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'exclusive') return 'Exclusive';
  return 'Premiere';
}

async function stripeRequest(env, method, path, params = null, idempotencyKey = null) {
  if (!env.STRIPE_SECRET_KEY) {
    throw Object.assign(new Error('Love Note billing is not configured yet.'), {
      status: 503,
      code: 'billing_not_configured',
    });
  }
  const headers = {
    authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    accept: 'application/json',
  };
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  let body;
  if (params) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    body = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  }
  const response = await fetch(`https://api.stripe.com/v1${path}`, { method, headers, body });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(payload?.error?.message || 'Stripe Love Note billing request failed.'), {
      status: 502,
      code: payload?.error?.code || 'stripe_error',
    });
  }
  return payload;
}

export async function loveNoteSendAccess(db, userId) {
  const userResult = await db.query(
    `SELECT subscription_plan,subscription_status,stripe_customer_id,stripe_subscription_id
       FROM public.users
      WHERE id=$1::uuid`,
    [userId],
  );
  const user = userResult.rows[0] || {};
  const status = String(user.subscription_status || '').toLowerCase();
  const plan = canonicalPlan(user.subscription_plan);
  const trial = status === 'trial' || status === 'trialing';
  const active = status === 'active';

  const paidResult = await db.query(
    `SELECT EXISTS(
       SELECT 1
         FROM public.payment_history
        WHERE user_id=$1::uuid
          AND status='succeeded'
          AND COALESCE(amount,0) > 0
     ) AS has_paid_subscription_payment`,
    [userId],
  );
  const hasPaidSubscriptionPayment = paidResult.rows[0]?.has_paid_subscription_payment === true;

  const sendResult = await db.query(
    `SELECT
       count(*) FILTER (WHERE status IN ('reserved','consumed'))::int AS reserved_or_sent,
       count(*) FILTER (WHERE status='consumed')::int AS sent
       FROM public.love_note_send_entitlements
      WHERE user_id=$1::uuid`,
    [userId],
  );
  const reservedOrSent = Number(sendResult.rows[0]?.reserved_or_sent || 0);
  const sent = Number(sendResult.rows[0]?.sent || 0);

  let allowed = false;
  let code = null;
  let message = null;

  if (trial) {
    code = 'trial_sms_locked';
    message = 'Love Note SMS sending is not available during the 7-day trial.';
  } else if (!active || !user.stripe_subscription_id || !user.stripe_customer_id) {
    code = 'paid_membership_required';
    message = 'An active paid One2OneLove membership is required for Love Note SMS delivery.';
  } else if (!hasPaidSubscriptionPayment) {
    code = 'first_payment_required';
    message = 'Love Note SMS delivery unlocks after your first successful paid subscription payment.';
  } else {
    allowed = true;
  }

  return {
    allowed,
    code,
    message,
    plan,
    subscriptionStatus: status || 'inactive',
    hasPaidSubscriptionPayment,
    firstPaidSendFree: true,
    firstFreeAvailable: allowed && reservedOrSent === 0,
    sendPriceCents: LOVE_NOTE_SEND_PRICE_CENTS,
    reservedOrSent,
    sent,
    stripeCustomerId: user.stripe_customer_id || null,
    stripeSubscriptionId: user.stripe_subscription_id || null,
  };
}

export async function reserveLoveNoteSend(db, userId, sourceType, sourceId, quotaDate, status = 'reserved') {
  await db.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`o2ol-love-notes:${userId}`]);

  const existing = await db.query(
    `SELECT id,quota_source,status
       FROM public.love_note_send_entitlements
      WHERE user_id=$1::uuid AND source_type=$2 AND source_id=$3::uuid
      LIMIT 1
      FOR UPDATE`,
    [userId, sourceType, sourceId],
  );
  if (existing.rows[0]) {
    return {
      quotaSource: existing.rows[0].quota_source,
      amountCents: existing.rows[0].quota_source === 'included' ? 0 : LOVE_NOTE_SEND_PRICE_CENTS,
      free: existing.rows[0].quota_source === 'included',
      existing: true,
    };
  }

  const access = await loveNoteSendAccess(db, userId);
  if (!access.allowed) {
    throw Object.assign(new Error(access.message || 'Love Note SMS delivery is unavailable.'), {
      status: access.code === 'trial_sms_locked' ? 403 : 402,
      code: access.code || 'love_note_sms_unavailable',
      usage: access,
    });
  }

  const quotaSource = access.firstFreeAvailable ? 'included' : 'purchased';
  const quotaMonth = `${String(quotaDate).slice(0, 7)}-01`;

  await db.query(
    `INSERT INTO public.love_note_send_entitlements
      (user_id,source_type,source_id,quota_month,quota_date,quota_source,status)
     VALUES($1::uuid,$2,$3::uuid,$4::date,$5::date,$6,$7)`,
    [userId, sourceType, sourceId, quotaMonth, quotaDate, quotaSource, status],
  );

  return {
    quotaSource,
    amountCents: quotaSource === 'included' ? 0 : LOVE_NOTE_SEND_PRICE_CENTS,
    free: quotaSource === 'included',
    existing: false,
  };
}

export async function consumeLoveNoteReservation(db, userId, sourceId) {
  const result = await db.query(
    `UPDATE public.love_note_send_entitlements
        SET status='consumed',updated_at=now()
      WHERE user_id=$1::uuid
        AND source_id=$2::uuid
        AND status='reserved'
      RETURNING id,quota_source,status`,
    [userId, sourceId],
  );
  return result.rows[0] || null;
}

export async function releaseLoveNoteReservation(db, userId, sourceId) {
  await db.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`o2ol-love-notes:${userId}`]);

  const entitlement = await db.query(
    `SELECT id,quota_source,status
       FROM public.love_note_send_entitlements
      WHERE source_id=$1::uuid AND user_id=$2::uuid
      LIMIT 1
      FOR UPDATE`,
    [sourceId, userId],
  );
  const row = entitlement.rows[0];
  if (!row || row.status === 'released' || row.status === 'consumed') return { released: false };

  await db.query(
    `UPDATE public.love_note_send_entitlements
        SET status='released',updated_at=now()
      WHERE id=$1::uuid`,
    [row.id],
  );

  // If the cancelled reservation held the complimentary first paid-member send,
  // transfer that benefit to the next oldest still-reserved paid Love Note.
  if (row.quota_source === 'included') {
    const next = await db.query(
      `SELECT id
         FROM public.love_note_send_entitlements
        WHERE user_id=$1::uuid
          AND source_type='scheduled'
          AND status='reserved'
          AND quota_source='purchased'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE`,
      [userId],
    );
    if (next.rows[0]?.id) {
      await db.query(
        `UPDATE public.love_note_send_entitlements
            SET quota_source='included',updated_at=now()
          WHERE id=$1::uuid`,
        [next.rows[0].id],
      );
    }
  }

  return { released: true, quotaSource: row.quota_source };
}

export async function billReservedLoveNoteSend(env, db, userId, sourceId, attempt = 1) {
  const ent = await db.query(
    `SELECT id,source_type,quota_source,status
       FROM public.love_note_send_entitlements
      WHERE source_id=$1::uuid AND user_id=$2::uuid
      LIMIT 1`,
    [sourceId, userId],
  );
  const row = ent.rows[0];
  if (!row) {
    throw Object.assign(new Error('Love Note send reservation was not found.'), {
      status: 409,
      code: 'send_reservation_missing',
    });
  }
  if (row.quota_source === 'included') {
    return { billed: false, free: true, amountCents: 0, invoiceItemId: null };
  }

  const userResult = await db.query(
    `SELECT stripe_customer_id,stripe_subscription_id
       FROM public.users
      WHERE id=$1::uuid`,
    [userId],
  );
  const user = userResult.rows[0] || {};
  if (!user.stripe_customer_id || !user.stripe_subscription_id) {
    throw Object.assign(new Error('Stripe subscription billing is no longer connected to this account.'), {
      status: 409,
      code: 'billing_subscription_missing',
    });
  }

  const params = new URLSearchParams();
  params.set('customer', user.stripe_customer_id);
  params.set('subscription', user.stripe_subscription_id);
  params.set('amount', String(LOVE_NOTE_SEND_PRICE_CENTS));
  params.set('currency', 'usd');
  params.set('description', 'One2OneLove Love Note SMS');
  params.set('metadata[o2ol_type]', 'love_note_sms');
  params.set('metadata[user_id]', userId);
  params.set('metadata[love_note_source_id]', sourceId);
  params.set('metadata[source_type]', row.source_type || 'sms');
  params.set('metadata[unit_price_cents]', String(LOVE_NOTE_SEND_PRICE_CENTS));

  const invoiceItem = await stripeRequest(
    env,
    'POST',
    '/invoiceitems',
    params,
    `o2ol-love-note-${row.source_type || 'sms'}-${sourceId}-attempt-${attempt}`,
  );

  return {
    billed: true,
    free: false,
    amountCents: LOVE_NOTE_SEND_PRICE_CENTS,
    invoiceItemId: invoiceItem?.id || null,
  };
}

export async function loveNoteUsageSummary(db, userId) {
  const access = await loveNoteSendAccess(db, userId);
  return {
    plan: access.plan,
    subscriptionStatus: access.subscriptionStatus,
    smsSendingAllowed: access.allowed,
    smsSendingCode: access.code,
    smsSendingMessage: access.message,
    firstPaidSendFree: true,
    firstFreeAvailable: access.firstFreeAvailable,
    sendPriceCents: LOVE_NOTE_SEND_PRICE_CENTS,
    sentCount: access.sent,
    reservedOrSentCount: access.reservedOrSent,
    customNoteMaxCharacters: CUSTOM_LOVE_NOTE_MAX_CHARACTERS,
  };
}
