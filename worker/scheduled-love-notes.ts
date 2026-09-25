// @ts-nocheck
import { Client } from 'pg';
import {
  LOVE_NOTE_SEND_PRICE_CENTS,
  billReservedLoveNoteSend,
  consumeLoveNoteReservation,
  releaseLoveNoteReservation,
} from './love-note-billing';

const MAX_BATCH = 20;
const MAX_ATTEMPTS = 3;
const SMS_PRICE_CENTS = LOVE_NOTE_SEND_PRICE_CENTS;

function cleanPhone(value) {
  const compact = String(value || '').trim().replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
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

export async function sendTwilioLoveNoteSms(env, note) {
  const to = cleanPhone(note.recipient_phone);
  if (!to) {
    const error = new Error('SMS recipient is not a valid E.164 phone number.');
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
    const error = new Error('SMS provider could not be reached.');
    error.retryable = true;
    error.cause = cause;
    throw error;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `SMS provider failed (${response.status}).`);
    error.retryable = response.status === 429 || response.status >= 500;
    error.providerStatus = response.status;
    throw error;
  }
  return { provider: 'twilio', messageId: payload?.sid || null };
}

async function cancelIneligibleDue(db) {
  const due = await db.query(
    `SELECT s.id,s.user_id
       FROM public.scheduled_love_notes s
       JOIN public.users u ON u.id=s.user_id
      WHERE s.status='scheduled'
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
      ORDER BY s.scheduled_date,s.scheduled_time,s.created_at
      LIMIT 100`,
  );

  let cancelled = 0;
  for (const note of due.rows) {
    await db.query('BEGIN');
    try {
      await releaseLoveNoteReservation(db, note.user_id, note.id);
      const result = await db.query(
        `UPDATE public.scheduled_love_notes
            SET status='cancelled',
                failure_reason='Membership no longer eligible for One2OneLove SMS delivery.',
                updated_at=now()
          WHERE id=$1::uuid AND status='scheduled'
          RETURNING id`,
        [note.id],
      );
      await db.query('COMMIT');
      cancelled += result.rowCount || 0;
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  return cancelled;
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

async function finalizeDeliveredBilling(db, env, note) {
  await db.query('BEGIN');
  try {
    await db.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`o2ol-love-note-billing:${note.user_id}`]);

    const entitlement = await db.query(
      `SELECT id,quota_source,status
         FROM public.love_note_send_entitlements
        WHERE user_id=$1::uuid
          AND source_id=$2::uuid
        LIMIT 1
        FOR UPDATE`,
      [note.user_id, note.id],
    );
    const row = entitlement.rows[0];
    if (!row) throw new Error('Love Note send reservation was not found.');
    if (row.status === 'consumed') {
      await db.query('COMMIT');
      return { alreadyRecorded: true, free: row.quota_source === 'included', amountCents: row.quota_source === 'included' ? 0 : SMS_PRICE_CENTS };
    }
    if (row.status !== 'reserved') throw new Error('Love Note send reservation is not billable.');

    const billing = await billReservedLoveNoteSend(env, db, note.user_id, note.id, note.attempts || 1);
    await consumeLoveNoteReservation(db, note.user_id, note.id);
    await db.query('COMMIT');

    return {
      alreadyRecorded: false,
      free: billing.free === true,
      invoiceItemId: billing.invoiceItemId || null,
      amountCents: billing.amountCents || 0,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function reconcileUnbilledSent(db, env) {
  const result = await db.query(
    `SELECT s.id,s.user_id,s.scheduled_date,s.attempts
       FROM public.scheduled_love_notes s
       JOIN public.love_note_send_entitlements e
         ON e.user_id=s.user_id
        AND e.source_type='scheduled'
        AND e.source_id=s.id
      WHERE s.status='sent'
        AND s.delivery_method='sms'
        AND e.status='reserved'
      ORDER BY s.sent_at NULLS LAST,s.created_at
      LIMIT 50`,
  );
  let reconciled = 0;
  let pending = 0;
  for (const note of result.rows) {
    try {
      await finalizeDeliveredBilling(db, env, note);
      reconciled += 1;
    } catch (error) {
      pending += 1;
      console.error('Love Note billing reconciliation pending', { id: note.id, message: error?.message });
    }
  }
  return { reconciled, pending };
}

async function reconcileUnbilledImmediate(db, env) {
  const result = await db.query(
    `SELECT n.id,n.user_id,1::int AS attempts
       FROM public.sent_love_notes n
       JOIN public.love_note_send_entitlements e
         ON e.user_id=n.user_id
        AND e.source_type='direct'
        AND e.source_id=n.id
      WHERE n.recipient_type='sms'
        AND e.status='reserved'
      ORDER BY n.created_at
      LIMIT 50`,
  );
  let reconciled = 0;
  let pending = 0;
  for (const note of result.rows) {
    try {
      await finalizeDeliveredBilling(db, env, note);
      reconciled += 1;
    } catch (error) {
      pending += 1;
      console.error('Immediate Love Note billing reconciliation pending', { id: note.id, message: error?.message });
    }
  }
  return { reconciled, pending };
}

async function markFailed(db, note, error) {
  const retryable = error?.retryable !== false;
  const retry = retryable && Number(note.attempts || 0) < MAX_ATTEMPTS;
  const reason = String(error?.message || 'Scheduled SMS delivery failed.').slice(0, 1000);

  await db.query('BEGIN');
  try {
    await db.query(
      `UPDATE public.scheduled_love_notes
          SET status=$1,failure_reason=$2,updated_at=now()
        WHERE id=$3::uuid AND status='processing'`,
      [retry ? 'scheduled' : 'failed', reason, note.id],
    );
    if (!retry) await releaseLoveNoteReservation(db, note.user_id, note.id);
    await db.query('COMMIT');
  } catch (dbError) {
    await db.query('ROLLBACK');
    throw dbError;
  }
  return { retry };
}

export async function dispatchDueScheduledLoveNotes(env) {
  if (!scheduledSmsReady(env)) {
    return { ready: false, claimed: 0, sent: 0, failed: 0, retried: 0, billingPending: 0 };
  }

  return withDb(env, async db => {
    const cancelled = await cancelIneligibleDue(db);
    const scheduledReconciliation = await reconcileUnbilledSent(db, env);
    const immediateReconciliation = await reconcileUnbilledImmediate(db, env);
    const claimed = await claimDue(db);

    let sent = 0;
    let failed = 0;
    let retried = 0;
    let billingPending = scheduledReconciliation.pending + immediateReconciliation.pending;

    for (const note of claimed) {
      try {
        await sendTwilioLoveNoteSms(env, note);
        await markSent(db, note);
        sent += 1;
      } catch (error) {
        console.error('Scheduled Love Note SMS failed', { id: note.id, message: error?.message });
        const outcome = await markFailed(db, note, error);
        if (outcome.retry) retried += 1;
        else failed += 1;
        continue;
      }

      try {
        await finalizeDeliveredBilling(db, env, note);
      } catch (billingError) {
        billingPending += 1;
        console.error('Delivered Love Note billing pending', { id: note.id, message: billingError?.message });
      }
    }

    return {
      ready: true,
      cancelled,
      claimed: claimed.length,
      sent,
      failed,
      retried,
      billingReconciled: scheduledReconciliation.reconciled + immediateReconciliation.reconciled,
      billingPending,
    };
  });
}
