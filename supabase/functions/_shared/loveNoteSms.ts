// One2OneLove Love Notes SMS delivery helper.
// DEVELOPMENT ONLY — Approval #9A authorizes staging, not paid provider activation.
//
// Production activation remains fail-closed until:
//   1) One2OneLove has an approved/registered Twilio Messaging Service,
//   2) A2P 10DLC registration is complete for US application-to-person traffic,
//   3) recipient opt-in can be verified before the first SMS,
//   4) the required server-only Twilio credentials and consent pepper exist, and
//   5) a separate cost/legal activation approval has been granted.

export const LOVE_NOTE_SMS_LANGUAGES = ['en', 'es', 'fr', 'it', 'de'] as const
export type LoveNoteSmsLanguage = typeof LOVE_NOTE_SMS_LANGUAGES[number]

const E164_PATTERN = /^\+[1-9]\d{7,14}$/
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/

const clean = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

export const normalizeSmsLanguage = (value: unknown): LoveNoteSmsLanguage => {
  const requested = clean(value, 8).toLowerCase()
  return LOVE_NOTE_SMS_LANGUAGES.includes(requested as LoveNoteSmsLanguage)
    ? requested as LoveNoteSmsLanguage
    : 'en'
}

export const normalizeE164 = (value: unknown) => {
  const normalized = clean(value, 32).replace(/[\s().-]/g, '')
  if (!E164_PATTERN.test(normalized)) return null
  return normalized
}

const senderFallback: Record<LoveNoteSmsLanguage, string> = {
  en: 'A One2OneLove member',
  es: 'Un miembro de One2OneLove',
  fr: 'Un membre de One2OneLove',
  it: 'Un membro di One2OneLove',
  de: 'Ein One2OneLove-Mitglied',
}

const smsCopy: Record<LoveNoteSmsLanguage, (sender: string, revealUrl: string) => string> = {
  en: (sender, revealUrl) => `💕 ${sender} sent you a private Love Note on One2OneLove. Reveal: ${revealUrl} Reply STOP to opt out; HELP for help. Msg & data rates may apply.`,
  es: (sender, revealUrl) => `💕 ${sender} te envió una Nota de Amor privada en One2OneLove. Ver: ${revealUrl} Responde STOP para dejar de recibir SMS; HELP para ayuda. Pueden aplicarse tarifas.`,
  fr: (sender, revealUrl) => `💕 ${sender} vous a envoyé un Mot d’Amour privé sur One2OneLove. Voir : ${revealUrl} Répondez STOP pour arrêter les SMS ; HELP pour l’aide. Des frais peuvent s’appliquer.`,
  it: (sender, revealUrl) => `💕 ${sender} ti ha inviato una Nota d’Amore privata su One2OneLove. Apri: ${revealUrl} Rispondi STOP per non ricevere SMS; HELP per assistenza. Potrebbero applicarsi costi.`,
  de: (sender, revealUrl) => `💕 ${sender} hat dir eine private Liebesnotiz auf One2OneLove gesendet. Öffnen: ${revealUrl} Antworte STOP zum Abmelden; HELP für Hilfe. Gebühren können anfallen.`,
}

export const buildLoveNoteSmsCopy = ({
  senderName,
  revealUrl,
  language,
}: {
  senderName: unknown
  revealUrl: unknown
  language: unknown
}) => {
  const safeLanguage = normalizeSmsLanguage(language)
  const sender = clean(senderName, 60) || senderFallback[safeLanguage]
  const url = clean(revealUrl, 600)
  if (!/^https:\/\//i.test(url)) throw new Error('O2OL_SMS_REVEAL_URL_INVALID')
  return smsCopy[safeLanguage](sender, url)
}

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const consentHashFor = async (e164: string) => {
  const pepper = Deno.env.get('LOVE_NOTE_SMS_CONSENT_PEPPER') || ''
  if (pepper.length < 32) throw new Error('O2OL_SMS_CONSENT_PEPPER_MISSING')
  return sha256Hex(`${pepper}:${e164}`)
}

/**
 * Fail-closed consent verification. The table is DEVELOPMENT-ONLY until the later
 * legal/cost activation approval. Browser roles receive no grants to the table.
 */
export const requireVerifiedSmsConsent = async (serviceClient: any, e164: string) => {
  if (Deno.env.get('LOVE_NOTE_SMS_COMPLIANCE_READY') !== 'true') {
    throw new Error('O2OL_SMS_COMPLIANCE_NOT_READY')
  }

  const phoneHash = await consentHashFor(e164)
  if (!SHA256_HEX_PATTERN.test(phoneHash)) throw new Error('O2OL_SMS_CONSENT_HASH_INVALID')

  const { data, error } = await serviceClient
    .from('love_note_sms_consents')
    .select('status, consented_at, revoked_at')
    .eq('phone_hash', phoneHash)
    .maybeSingle()

  if (error) throw new Error('O2OL_SMS_CONSENT_LOOKUP_FAILED')
  if (!data || data.status !== 'active' || !data.consented_at || data.revoked_at) {
    throw new Error('O2OL_SMS_RECIPIENT_CONSENT_REQUIRED')
  }

  return true
}

const twilioConfig = () => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
  const apiKeySid = Deno.env.get('TWILIO_API_KEY_SID') || ''
  const apiKeySecret = Deno.env.get('TWILIO_API_KEY_SECRET') || ''
  const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') || ''
  const statusCallback = Deno.env.get('TWILIO_SMS_STATUS_CALLBACK_URL') || ''

  if (!accountSid.startsWith('AC')) throw new Error('O2OL_SMS_TWILIO_ACCOUNT_NOT_CONFIGURED')
  if (!apiKeySid.startsWith('SK') || !apiKeySecret) throw new Error('O2OL_SMS_TWILIO_KEY_NOT_CONFIGURED')
  if (!messagingServiceSid.startsWith('MG')) throw new Error('O2OL_SMS_TWILIO_SERVICE_NOT_CONFIGURED')
  if (statusCallback && !/^https:\/\//i.test(statusCallback)) throw new Error('O2OL_SMS_STATUS_CALLBACK_INVALID')

  return { accountSid, apiKeySid, apiKeySecret, messagingServiceSid, statusCallback }
}

export const sendLoveNoteSmsWithTwilio = async ({
  to,
  body,
}: {
  to: string
  body: string
}) => {
  if (Deno.env.get('LOVE_NOTE_SMS_ENABLED') !== 'true') {
    throw new Error('O2OL_SMS_DISABLED')
  }

  const e164 = normalizeE164(to)
  if (!e164) throw new Error('O2OL_SMS_PHONE_INVALID')
  const text = clean(body, 1600)
  if (!text) throw new Error('O2OL_SMS_BODY_REQUIRED')

  const { accountSid, apiKeySid, apiKeySecret, messagingServiceSid, statusCallback } = twilioConfig()
  const form = new URLSearchParams()
  form.set('To', e164)
  form.set('MessagingServiceSid', messagingServiceSid)
  form.set('Body', text)
  if (statusCallback) form.set('StatusCallback', statusCallback)

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${apiKeySid}:${apiKeySecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'One2OneLove/1.0',
    },
    body: form.toString(),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const code = clean(payload?.code, 40)
    // Twilio 21610 means the destination has opted out. Do not mask that condition.
    if (code === '21610') throw new Error('O2OL_SMS_RECIPIENT_OPTED_OUT')
    throw new Error(`O2OL_SMS_TWILIO_${code || response.status}`)
  }

  const sid = clean(payload?.sid, 80)
  if (!sid.startsWith('SM') && !sid.startsWith('MM')) throw new Error('O2OL_SMS_PROVIDER_ID_INVALID')
  return sid
}
