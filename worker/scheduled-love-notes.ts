// @ts-nocheck
import { Client } from 'pg';
import { consumeTokenReservation, releaseTokenReservation } from './o2ol-tokens';
import { restoreFoundingFreeSendForReservation } from './founding-perks';
import { countCharacters, recordCostEvent } from './o2ol-cost-ledger';
import { smsBodyFor } from './credit-config';
import { isRecipientOptedOut } from './love-note-credit';

const MAX_BATCH = 20;
const MAX_ATTEMPTS = 3;

function cleanPhone(value) {
  const compact = String(value || '').trim().replace(/[\s().-]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

export function smsProviderReady(env) {
  return Boolean(
    env.TWILIO_ACCOUNT_SID &&
    env.TWILIO_AUTH_TOKEN &&
    (env.TWILIO_MESSAGING_SERVICE_SID || env.TWILIO_FROM_NUMBER)
  );
}
export function scheduledSmsReady(env) {
  const enabled=String(env.SCHEDULED_SMS_ENABLED||'').toLowerCase()==='true';
  return enabled&&smsProviderReady(env);
}
export function scheduledSmsReadiness(env) {
  return {
    enabled:String(env.SCHEDULED_SMS_ENABLED||'').toLowerCase()==='true',
    provider:'twilio',
    providerConfigured:smsProviderReady(env),
    scheduledSmsReady:scheduledSmsReady(env),
    billingMode:'o2ol_credit',
    tokenFeatureCode:'love_note_send',
  };
}

async function withDb(env, fn) {
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try { return await fn(db); } finally { await db.end(); }
}

// ---------------------------------------------------------------------------
// Signature columns on scheduled_love_notes (owner, 2026-10-08): a booked
// note persists how the sender chose to sign — sender_name + send_anonymous
// — so the dispatcher composes the same SMS body as an immediate send.
// Lazy-ensure DDL tolerance, same pattern as the other workers: on the
// preview database the connecting role does not own this pre-existing
// table, so an ensure DDL statement against an already-in-shape object can
// fail with 42501 (must be owner). The full DDL set is pre-applied by the
// table owner via preview-schema-preapply.sql; here, skip ONLY the benign
// already-in-shape codes (42501 insufficient_privilege, 42701
// duplicate_column, 42P07 duplicate_table) per statement and continue. Any
// other error still throws, and the DML that follows surfaces a genuinely
// missing column loudly.
// ---------------------------------------------------------------------------
const TOLERATED_DDL_CODES = new Set(['42501', '42701', '42P07']);
async function ensureDdl(db, sql) {
  try { await db.query(sql); }
  catch (err) { if (!TOLERATED_DDL_CODES.has(err?.code)) throw err; }
}

let signatureSchemaEnsured = false;
export async function ensureScheduledSignatureSchema(db) {
  if (signatureSchemaEnsured) return;
  await ensureDdl(db, `ALTER TABLE public.scheduled_love_notes ADD COLUMN IF NOT EXISTS sender_name text`);
  await ensureDdl(db, `ALTER TABLE public.scheduled_love_notes ADD COLUMN IF NOT EXISTS send_anonymous boolean NOT NULL DEFAULT false`);
  signatureSchemaEnsured = true;
}

// The name that prints at the foot of a note, or null when the note goes
// unsigned: Send Anonymous was chosen, or no name was stored (notes booked
// before the signature model have no name and keep today's unsigned body —
// a name is never invented for them).
function signatureNameFor(note) {
  if (note?.send_anonymous) return null;
  return String(note?.sender_name || '').replace(/\s+/g, ' ').trim() || null;
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
  params.set('Body', smsBodyFor(note.note_title, note.note_content, signatureNameFor(note)));
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
  return {
    provider:'twilio',
    messageId:payload?.sid||null,
    status:payload?.status||null,
    numSegments:Number(payload?.num_segments||0)||0,
    price:payload?.price==null?null:Number(payload.price),
    priceUnit:payload?.price_unit||'USD',
    to:payload?.to||to,
    body:payload?.body||params.get('Body')||'',
  };
}

async function tokenReservationForScheduledNote(db,noteId){
  return (await db.query(
    `SELECT r.*,t.balance_after
       FROM public.o2ol_token_reservations r
       LEFT JOIN public.o2ol_token_transactions t ON t.id=r.transaction_id
      WHERE r.idempotency_key=$1 LIMIT 1`,
    [`love_note_scheduled:${noteId}`],
  )).rows[0]||null;
}

async function cancelIneligibleDue(db) {
  const due=await db.query(
    `SELECT s.id,s.user_id
       FROM public.scheduled_love_notes s
       JOIN public.users u ON u.id=s.user_id
      WHERE s.status='scheduled'
        AND s.delivery_method='sms'
        AND ((s.scheduled_date+s.scheduled_time) AT TIME ZONE s.scheduled_timezone)<=now()
        AND (COALESCE(u.is_active,true)=false OR COALESCE(u.phone_number_verified,false)=false)
      ORDER BY s.scheduled_date,s.scheduled_time,s.created_at
      LIMIT 100`,
  );
  let cancelled=0;
  for(const note of due.rows){
    const reservation=await tokenReservationForScheduledNote(db,note.id);
    if(reservation?.id){
      await releaseTokenReservation(db,reservation.id,'member_no_longer_verified');
      await restoreFoundingFreeSendForReservation(db,reservation).catch(()=>{});
    }
    const result=await db.query(
      `UPDATE public.scheduled_love_notes
          SET status='cancelled',failure_reason='Account is no longer eligible for verified-member SMS delivery.',updated_at=now()
        WHERE id=$1::uuid AND status='scheduled' RETURNING id`,
      [note.id],
    );
    cancelled+=result.rowCount||0;
  }
  return cancelled;
}

async function claimDue(db) {
  await db.query('BEGIN');
  try{
    const due=await db.query(
      `SELECT s.id
         FROM public.scheduled_love_notes s
         JOIN public.users u ON u.id=s.user_id
        WHERE s.status='scheduled'
          AND s.delivery_method='sms'
          AND COALESCE(u.is_active,true)=true
          AND COALESCE(u.phone_number_verified,false)=true
          AND EXISTS (
            SELECT 1 FROM public.o2ol_token_reservations r
             WHERE r.idempotency_key=('love_note_scheduled:'||s.id::text)
               AND r.status='reserved'
          )
          AND ((s.scheduled_date+s.scheduled_time) AT TIME ZONE s.scheduled_timezone)<=now()
        ORDER BY s.scheduled_date,s.scheduled_time,s.created_at
        FOR UPDATE OF s SKIP LOCKED LIMIT $1`,
      [MAX_BATCH],
    );
    const ids=due.rows.map(row=>row.id);
    if(!ids.length){await db.query('COMMIT');return [];}
    const claimed=await db.query(
      `UPDATE public.scheduled_love_notes
          SET status='processing',attempts=attempts+1,last_attempt_at=now(),failure_reason=NULL,updated_at=now()
        WHERE id=ANY($1::uuid[])
        RETURNING id,user_id,note_title,note_content,recipient_phone,delivery_method,scheduled_date,attempts,sender_name,send_anonymous`,
      [ids],
    );
    await db.query('COMMIT');
    return claimed.rows;
  }catch(error){try{await db.query('ROLLBACK');}catch(_){}throw error;}
}

async function markSent(db,note){
  await db.query(
    `UPDATE public.scheduled_love_notes
        SET status='sent',sent_at=now(),failure_reason=NULL,updated_at=now()
      WHERE id=$1::uuid AND status='processing'`,
    [note.id],
  );
}

async function finalizeDeliveredTokens(db,env,note,delivery){
  const reservation=await tokenReservationForScheduledNote(db,note.id);
  if(!reservation)throw new Error('Scheduled Love Note token reservation was not found.');
  if(reservation.status==='released')throw new Error('Scheduled Love Note token reservation has already been released.');
  if(reservation.status==='reserved')await consumeTokenReservation(db,reservation.id);

  const providerCostMicros=delivery?.price==null?null:Math.round(Math.abs(Number(delivery.price))*1000000);
  await recordCostEvent(db,env,{
    userId:note.user_id,featureCode:'love_note_send',provider:'twilio',providerProduct:'programmable_sms',
    providerRequestId:delivery?.messageId||null,
    walletTransactionId:reservation.transaction_id||null,
    inputCharacters:countCharacters(note.note_content),
    outputCharacters:countCharacters(delivery?.body||smsBodyFor(note.note_title, note.note_content, signatureNameFor(note))),
    providerOutputUnits:Number(delivery?.numSegments||0),
    providerCostMicros,
    customerTokensCharged:Number(reservation.tokens||0),
    metadata:{scheduled_note_id:note.id,twilio_status:delivery?.status||null,twilio_price_unit:delivery?.priceUnit||'USD',cost_pending:providerCostMicros==null},
  }).catch(error=>console.error('Scheduled Love Note telemetry failed',error));
  return {tokens:Number(reservation.tokens||0)};
}

async function markFailed(db,note,error){
  const retryable=error?.retryable!==false;
  const retry=retryable&&Number(note.attempts||0)<MAX_ATTEMPTS;
  const reason=String(error?.message||'Scheduled SMS delivery failed.').slice(0,1000);
  await db.query(
    `UPDATE public.scheduled_love_notes SET status=$1,failure_reason=$2,updated_at=now()
      WHERE id=$3::uuid AND status='processing'`,
    [retry?'scheduled':'failed',reason,note.id],
  );
  if(!retry){
    const reservation=await tokenReservationForScheduledNote(db,note.id);
    if(reservation?.id){
      await releaseTokenReservation(db,reservation.id,'scheduled_sms_final_failure');
      await restoreFoundingFreeSendForReservation(db,reservation).catch(()=>{});
    }
  }
  return {retry};
}

export async function dispatchDueScheduledLoveNotes(env) {
  if(!scheduledSmsReady(env))return {ready:false,claimed:0,sent:0,failed:0,retried:0};

  return withDb(env,async db=>{
    await ensureScheduledSignatureSchema(db);
    const cancelled=await cancelIneligibleDue(db);
    const claimed=await claimDue(db);
    let sent=0,failed=0,retried=0,cancelledOptOut=0;
    for(const note of claimed){
      // Recipient STOP is honored before ANY send — including sends booked
      // before the opt-out arrived. The Credit reservation is released.
      if(await isRecipientOptedOut(db,note.recipient_phone).catch(()=>false)){
        const reservation=await tokenReservationForScheduledNote(db,note.id);
        if(reservation?.id){
          await releaseTokenReservation(db,reservation.id,'recipient_opted_out').catch(()=>{});
          await restoreFoundingFreeSendForReservation(db,reservation).catch(()=>{});
        }
        await db.query(
          `UPDATE public.scheduled_love_notes
              SET status='cancelled',failure_reason='Recipient opted out of text messages (STOP).',updated_at=now()
            WHERE id=$1::uuid AND status='processing'`,
          [note.id],
        );
        cancelledOptOut+=1;
        continue;
      }
      let delivery=null;
      try{
        delivery=await sendTwilioLoveNoteSms(env,note);
        await markSent(db,note);
        await finalizeDeliveredTokens(db,env,note,delivery);
        sent+=1;
      }catch(error){
        console.error('Scheduled Love Note SMS failed',{id:note.id,message:error?.message});
        const outcome=await markFailed(db,note,error);
        if(outcome.retry)retried+=1;else failed+=1;
      }
    }
    return {ready:true,cancelled,cancelledOptOut,claimed:claimed.length,sent,failed,retried};
  });
}
