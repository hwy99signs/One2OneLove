import { supabase } from './supabase';

const clean = (value, max = 1200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const readFunctionErrorPayload = async (error, data) => {
  if (data && typeof data === 'object') return data;

  const response = error?.context;
  if (!response || typeof response.json !== 'function') return null;

  try {
    const readable = typeof response.clone === 'function' ? response.clone() : response;
    const payload = await readable.json();
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
};

export const newAiContentRequestId = createRequestId;

/**
 * Generate premium relationship content through the reviewed Edge Function.
 *
 * The request ID belongs to one deliberate generation attempt. Reuse it only when
 * recovering from an ambiguous network/server response; the server can replay a stored
 * successful result without a second model call.
 */
export async function generateRelationshipContent({
  contentType,
  tone,
  length = 'medium',
  partnerName = '',
  details = '',
  language = 'en',
  requestId = null,
}) {
  const body = {
    request_id: requestId || createRequestId(),
    content_type: clean(contentType, 40),
    tone: clean(tone, 30).toLowerCase(),
    length: clean(length, 20),
    partner_name: clean(partnerName, 80),
    details: clean(details, 1200),
    language: clean(language, 5).toLowerCase() || 'en',
  };

  if (!body.content_type || !body.tone) {
    const invalid = new Error('Choose a content type and tone first.');
    invalid.code = 'INVALID_GENERATION_OPTIONS';
    throw invalid;
  }

  const { data, error } = await supabase.functions.invoke('generate-relationship-content', { body });

  if (error || data?.error) {
    const payload = await readFunctionErrorPayload(error, data);
    const code = payload?.error || data?.error || null;
    const message = code || error?.message || 'AI Content Creator is unavailable right now.';
    const enriched = new Error(message);
    enriched.code = code;
    enriched.feature = payload?.feature || data?.feature || null;
    enriched.status = error?.context?.status || null;
    throw enriched;
  }

  if (!data?.content) {
    const missing = new Error('AI Content Creator returned no content.');
    missing.code = 'EMPTY_AI_RESULT';
    throw missing;
  }

  return {
    content: String(data.content).slice(0, 4000),
    idempotent: Boolean(data.idempotent),
    reconciliationRequired: Boolean(data.reconciliation_required),
    requestId: body.request_id,
  };
}
