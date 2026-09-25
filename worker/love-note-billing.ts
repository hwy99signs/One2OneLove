// @ts-nocheck

export const LOVE_NOTE_SEND_PRICE_CENTS = 29;
export const CUSTOM_LOVE_NOTE_MAX_CHARACTERS = 171;

function canonicalPlan(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'exclusive') return 'Exclusive';
  return 'Premiere';
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
    firstFreeAvailable: allowed && sent === 0,
    sendPriceCents: LOVE_NOTE_SEND_PRICE_CENTS,
    reservedOrSent,
    sent,
    stripeCustomerId: user.stripe_customer_id || null,
    stripeSubscriptionId: user.stripe_subscription_id || null,
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
