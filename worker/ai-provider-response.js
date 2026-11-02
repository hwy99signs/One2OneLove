// GPT reasoning models spend max_output_tokens on internal reasoning AND visible text.
// A complete provider call can therefore have no usable assistant message.
export const COACH_OUTPUT_TOKEN_BUDGETS = Object.freeze({
  short: 1100,
  medium: 1700,
  long: 2600,
});
export function extractProviderText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const pieces = [];
  for (const item of Array.isArray(payload?.output) ? payload.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if ((content?.type === 'output_text' || content?.type === 'text') && typeof content.text === 'string' && content.text.trim()) pieces.push(content.text.trim());
    }
  }
  return pieces.join('\n').trim();
}
export function providerReasoningOptions(model) {
  // Keep compatibility with non-reasoning models if OPENAI_MODEL changes.
  return /^gpt-5(?:-|$)/i.test(String(model || '')) ? { reasoning: { effort: 'low' } } : {};
}
export function shouldRetryEmptyProviderResponse(payload) {
  if (payload?.status === 'incomplete') return payload?.incomplete_details?.reason === 'max_output_tokens';
  if (payload?.status !== 'completed') return false;
  // Do not retry intentional refusals.
  return !payload?.output?.some(item => (item?.content || []).some(c => c?.type === 'refusal'));
}
export function providerFailureMetadata(payload) {
  return {
    status: String(payload?.status || 'unknown').slice(0,30),
    reason: String(payload?.incomplete_details?.reason || 'none').slice(0,60),
    model: String(payload?.model || 'unknown').slice(0,80),
    outputTokens: Number(payload?.usage?.output_tokens || 0),
    reasoningTokens: Number(payload?.usage?.output_tokens_details?.reasoning_tokens || 0),
  };
}
