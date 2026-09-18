// @ts-nocheck
import { Client } from 'pg';

const MAX_BATCH = 20;
const MAX_ATTEMPTS = 3;

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
  if (env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    params.set('From', env.TWILIO_FROM_NUMBER);
  }

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

async function claimDue(db) {
  await db.query('BEGIN');
  try {
    const due = await db.query(
      `SELECT id
         FROM public.scheduled_love_notes
        WHERE status='scheduled'
          AND delivery_method='sms'
          AND ((scheduled_date + scheduled_time) AT TIME ZONE scheduled_timezone) <= now()
        ORDER BY scheduled_date,scheduled_time,created_at
        FOR UPDATE SKIP LOCKED
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
        RETURNING id,user_id,note_title,note_content,recipient_phone,delivery_method,attempts`,
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
  await db.query('BEGIN');
  try {
    await db.query(
      `UPDATE public.scheduled_love_notes
          SET status='sent',sent_at=now(),failure_reason=NULL,updated_at=now()
        WHERE id=$1::uuid AND status='processing'`,
      [note.id],
    );
    await db.query(
      `UPDATE public.love_note_send_entitlements
          SET status='consumed',updated_at=now()
        WHERE source_type='scheduled' AND source_id=$1::uuid AND user_id=$2::uuid AND status='reserved'`,
      [note.id, note.user_id],
    );
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function releaseReservedEntitlement(db, note) {
  const ent = await db.query(
    `SELECT id,quota_source,status
       FROM public.love_note_send_entitlements
      WHERE source_type='scheduled' AND source_id=$1::uuid AND user_id=$2::uuid
      FOR UPDATE`,
    [note.id, note.user_id],
  );
  const row = ent.rows[0];
  if (!row || row.status !== 'reserved') return;

  if (row.quota_source === 'purchased') {
    await db.query(
      `INSERT INTO public.sms_send_credit_wallets(user_id,available_sends,lifetime_purchased_sends,updated_at)
       VALUES($1::uuid,1,0,now())
       ON CONFLICT (user_id) DO UPDATE
         SET available_sends=public.sms_send_credit_wallets.available_sends+1,updated_at=now()`,
      [note.user_id],
    );
  }
  await db.query(
    `UPDATE public.love_note_send_entitlements SET status='released',updated_at=now() WHERE id=$1::uuid`,
    [row.id],
  );
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
    if (!retry) await releaseReservedEntitlement(db, note);
    await db.query('COMMIT');
  } catch (dbError) {
    await db.query('ROLLBACK');
    throw dbError;
  }
  return { retry };
}

export async function dispatchDueScheduledLoveNotes(env) {
  if (!scheduledSmsReady(env)) {
    return { ready: false, claimed: 0, sent: 0, failed: 0, retried: 0 };
  }

  return withDb(env, async db => {
    const claimed = await claimDue(db);
    let sent = 0;
    let failed = 0;
    let retried = 0;

    for (const note of claimed) {
      try {
        await sendTwilioSms(env, note);
        await markSent(db, note);
        sent += 1;
      } catch (error) {
        console.error('Scheduled Love Note SMS failed', { id: note.id, message: error?.message });
        const outcome = await markFailed(db, note, error);
        if (outcome.retry) retried += 1;
        else failed += 1;
      }
    }

    return { ready: true, claimed: claimed.length, sent, failed, retried };
  });
}
