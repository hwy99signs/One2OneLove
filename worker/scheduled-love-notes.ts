// @ts-nocheck
import { Client } from 'pg';

const MAX_BATCH = 20;
const MAX_ATTEMPTS = 3;
const SMS_PRICE_CENTS = 29;

function cleanPhone(value) {
  const compact = String(value || '').trim().replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}
function dateText(value) {
  const text = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
}
function monthStart(value) {
  return `${dateText(value).slice(0, 7)}-01`;
}

export function scheduledSmsReady(env) {
  const enabled = String(env.SCHEDULED_SMS_ENABLED || '').toLowerCase() === 'true';
  const providerReady = Boolean(
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    (env.TWILIO_MESSAGING_SERVICE_SID || env.TWILIO_FROM_NUMBER)
  );
  return enabled && providerReady;
}

export function scheduledSmsReadiness(env) {
  return {
    enabled: String(env.SCHEDULED_SMS_ENABLED || '').toLowerCase() === 'true',
    provider: 'twilio',
    providerConfigured: Boolean(
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      (env.TWILIO_MESSAGING_SERVICE_SID || env.TWILIO_FROM_NUMBER)
    ),
    scheduledSmsReady: scheduledSmsReady(env),
    billingMode: 'first_paid_send_free_then_usage',
    smsPriceCents: SMS_PRICE_CENTS,
  };
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

async function sendTwilioSms(env, note) {
  const to = cleanPhone(note.recipient_phone);
  if (!to) {
    const error = new Error('Scheduled SMS recipient is not a valid E.164 phone number.');
    error.retryable = false;
    throw error;
  }

  const params = new URLSearchParams();
  params.set('To', to);
  params.set('Body', `${note.note_title}\n\n${note.note_content}\n\n❤️ One2OneLove`);
  if (env.TWILIO_MESSAGING_SERVICE_SID) params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
  else params.set('From', env.TWILIO_FROM_NUMBER);

  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  let response;
  try {
    response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_ACCOUNT_SID)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${auth}`,
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        body: params,
      },
    );
  } catch (cause) {
    const error = new Error('Scheduled SMS provider could not be reached.');
    error.retryable = true;
    error.cause = cause;
    throw error;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `Scheduled SMS provider failed (${response.status}).`);
    error.retryable = response.status === 429 || response.status >= 500;
    error.providerStatus = response.status;
    throw error;
  }
  return { provider: 'twilio', messageId: payload?.sid || null };
}

async function createStripeUsageItem(env, billing, note) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe billing is not configured.');
  const params = new URLSearchParams();
  params.set('customer', billing.stripe_customer_id);
  params.set('subscription', billing.stripe_subscription_id);
  params.set('amount', String(SMS_PRICE_CENTS));
  params.set('currency', 'usd');
  params.set('description', 'One2OneLove SMS Love Note');
  params.set('metadata[o2ol_type]', 'love_note_sms');
  params.set('metadata[user_id]', note.user_id);
  params.set('metadata[scheduled_note_id]', note.id);
  params.set('metadata[subscription_id]', billing.stripe_subscription_id);

  const response = await fetch('https://api.stripe.com/v1/invoiceitems', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `o2ol-love-note-${note.id}`,
    },
    body: params,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || 'Unable to add Love Note usage to the next Stripe invoice.');
  return payload;
}

async function billingUser(db, userId) {
  const result = await db.query(
    `SELECT u.stripe_customer_id,u.stripe_subscription_id,u.subscription_status,
            EXISTS(
              SELECT 1 FROM public.payment_history ph
               WHERE ph.user_id=u.id
                 AND ph.status='succeeded'
                 AND COALESCE(ph.amount,0) > 0
            ) AS paid_invoice_ready
       FROM public.users u
      WHERE u.id=$1::uuid`,
    [userId],
  );
  return result.rows[0] || null;
}

async function cancelIneligibleDue(db) {
  const result = await db.query(
    `UPDATE public.scheduled_love_notes s
        SET status='cancelled',
            failure_reason='Membership no longer eligible for One2OneLove SMS delivery.',
            updated_at=now()
       FROM public.users u
      WHERE s.user_id=u.id
        AND s.status='scheduled'
        AND s.delivery_method='sms'
        AND ((s.scheduled_date + s.scheduled_time) AT TIME ZONE s.scheduled_timezone) <= now()
        AND (
          lower(COALESCE(u.subscription_status,'')) <> 'active'
          OR u.stripe_subscription_id IS NULL
          OR u.stripe_customer_id IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM public.payment_history ph
             WHERE ph.user_id=u.id
               AND ph.status='succeeded'
               AND COALESCE(ph.amount,0) > 0
          )
        )
      RETURNING s.id`,
  );
  return result.rowCount || 0;
}

async function claimDue(db) {
  await db.query('BEGIN');
  try {
    const due = await db.query(
      `SELECT s.id
         FROM public.scheduled_love_notes s
         JOIN public.users u ON u.id=s.user_id
        WHERE s.status='scheduled'
          AND s.delivery_method='sms'
          AND lower(COALESCE(u.subscription_status,''))='active'
          AND u.stripe_subscription_id IS NOT NULL
          AND u.stripe_customer_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.payment_history ph
             WHERE ph.user_id=u.id
               AND ph.status='succeeded'
               AND COALESCE(ph.amount,0) > 0
          )
          AND ((s.scheduled_date + s.scheduled_time) AT TIME ZONE s.scheduled_timezone) <= now()
        ORDER BY s.scheduled_date,s.scheduled_time,s.created_at
        FOR UPDATE OF s SKIP LOCKED
        LIMIT $1`,
      [MAX_BATCH],
    );
    const ids = due.rows.map(row => row.id);
    if (!ids.length) {
      await db.query('COMMIT');
      return [];
    }

    const claimed = await db.query(
      `UPDATE public.scheduled_love_notes
          SET status='processing',attempts=attempts+1,last_attempt_at=now(),failure_reason=NULL,updated_at=now()
        WHERE id=ANY($1::uuid[])
        RETURNING id,user_id,note_title,note_content,recipient_phone,delivery_method,scheduled_date,attempts`,
      [ids],
    );
    await db.query('COMMIT');
    return claimed.rows;
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function markSent(db, note) {
  await db.query(
    `UPDATE public.scheduled_love_notes
        SET status='sent',sent_at=now(),failure_reason=NULL,updated_at=now()
      WHERE id=$1::uuid AND status='processing'`,
    [note.id],
  );
}

async function recordDeliveredBilling(db, env, note) {
  await db.query('BEGIN');
  try {
    await db.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`o2ol-love-note-billing:${note.user_id}`]);

    const existing = await db.query(
      `SELECT id,quota_source,status
         FROM public.love_note_send_entitlements
        WHERE source_type='scheduled' AND source_id=$1::uuid AND user_id=$2::uuid
        LIMIT 1`,
      [note.id, note.user_id],
    );
    if (existing.rows[0]?.status === 'consumed') {
      await db.query('COMMIT');
      return { alreadyRecorded: true, free: existing.rows[0].quota_source === 'included' };
    }

    const billing = await billingUser(db, note.user_id);
    if (!billing?.paid_invoice_ready || !billing?.stripe_customer_id || !billing?.stripe_subscription_id) {
      throw new Error('Paid subscription billing record is not ready for this delivered Love Note.');
    }

    const count = await db.query(
      `SELECT count(*)::int AS sent_count
         FROM public.love_note_send_entitlements
        WHERE user_id=$1::uuid
          AND source_type='scheduled'
          AND status='consumed'`,
      [note.user_id],
    );
    const firstPaidSendFree = Number(count.rows[0]?.sent_count || 0) === 0;

    let invoiceItem = null;
    if (!firstPaidSendFree) invoiceItem = await createStripeUsageItem(env, billing, note);

    const quotaDate = dateText(note.scheduled_date || new Date().toISOString());
    await db.query(
      `INSERT INTO public.love_note_send_entitlements
        (user_id,source_type,source_id,quota_month,quota_date,quota_source,status)
       SELECT $1::uuid,'scheduled',$2::uuid,$3::date,$4::date,$5,'consumed'
       WHERE NOT EXISTS (
         SELECT 1 FROM public.love_note_send_entitlements
          WHERE user_id=$1::uuid AND source_type='scheduled' AND source_id=$2::uuid
       )`,
      [note.user_id, note.id, monthStart(quotaDate), quotaDate, firstPaidSendFree ? 'included' : 'purchased'],
    );

    await db.query('COMMIT');
    return {
      alreadyRecorded: false,
      free: firstPaidSendFree,
      invoiceItemId: invoiceItem?.id || null,
      amountCents: firstPaidSendFree ? 0 : SMS_PRICE_CENTS,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function reconcileUnbilledSent(db, env) {
  const result = await db.query(
    `SELECT s.id,s.user_id,s.scheduled_date
       FROM public.scheduled_love_notes s
      WHERE s.status='sent'
        AND s.delivery_method='sms'
        AND NOT EXISTS (
          SELECT 1 FROM public.love_note_send_entitlements e
           WHERE e.user_id=s.user_id
             AND e.source_type='scheduled'
             AND e.source_id=s.id
             AND e.status='consumed'
        )
      ORDER BY s.sent_at NULLS LAST,s.created_at
      LIMIT 50`,
  );
  let reconciled = 0;
  let pending = 0;
  for (const note of result.rows) {
    try {
      await recordDeliveredBilling(db, env, note);
      reconciled += 1;
    } catch (error) {
      pending += 1;
      console.error('Love Note billing reconciliation pending', { id: note.id, message: error?.message });
    }
  }
  return { reconciled, pending };
}

async function markFailed(db, note, error) {
  const retryable = error?.retryable !== false;
  const retry = retryable && Number(note.attempts || 0) < MAX_ATTEMPTS;
  const reason = String(error?.message || 'Scheduled SMS delivery failed.').slice(0, 1000);
  await db.query(
    `UPDATE public.scheduled_love_notes
        SET status=$1,failure_reason=$2,updated_at=now()
      WHERE id=$3::uuid AND status='processing'`,
    [retry ? 'scheduled' : 'failed', reason, note.id],
  );
  return { retry };
}

export async function dispatchDueScheduledLoveNotes(env) {
  if (!scheduledSmsReady(env)) {
    return { ready: false, claimed: 0, sent: 0, failed: 0, retried: 0, billingPending: 0 };
  }

  return withDb(env, async db => {
    const cancelled = await cancelIneligibleDue(db);
    const reconciliation = await reconcileUnbilledSent(db, env);
    const claimed = await claimDue(db);

    let sent = 0;
    let failed = 0;
    let retried = 0;
    let billingPending = reconciliation.pending;

    for (const note of claimed) {
      try {
        await sendTwilioSms(env, note);
        await markSent(db, note);
        sent += 1;
        try {
          await recordDeliveredBilling(db, env, note);
        } catch (billingError) {
          billingPending += 1;
          console.error('Delivered Love Note billing pending', { id: note.id, message: billingError?.message });
        }
      } catch (error) {
        console.error('Scheduled Love Note SMS failed', { id: note.id, message: error?.message });
        const outcome = await markFailed(db, note, error);
        if (outcome.retry) retried += 1;
        else failed += 1;
      }
    }

    return {
      ready: true,
      cancelled,
      claimed: claimed.length,
      sent,
      failed,
      retried,
      billingReconciled: reconciliation.reconciled,
      billingPending,
    };
  });
}
