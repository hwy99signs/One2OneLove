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

/**
 * Both persona chats and their associated content features share this provider
 * adapter so an OpenAI HTTP 200 with reasoning-only output cannot silently
 * become a chargeable blank answer. Provider retries are capped at one.
 */
export async function requestProviderText(env,{instructions,input,maxOutputTokens=900},missingKeyMessage='AI service is not configured yet.') {
  if(!env.OPENAI_API_KEY)throw Object.assign(new Error(missingKeyMessage),{status:503,code:'ai_not_configured'});
  const model=env.OPENAI_MODEL||'gpt-5-mini';
  let tokenBudget=Math.min(5000,Math.max(256,Math.ceil(Number(maxOutputTokens)||900)));
  for(let attempt=0;attempt<2;attempt++){
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{authorization:`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},
      body:JSON.stringify({
        model,instructions,input,
        max_output_tokens:tokenBudget,
        store:false,
        ...providerReasoningOptions(model),
      }),
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok){
      // Retain the existing provider failure contract. No second paid model call
      // for errors such as invalid credentials, rate limits or invalid model.
      throw Object.assign(new Error(payload?.error?.message||'AI provider request failed.'),{status:502,code:'ai_provider_error'});
    }
    const text=extractProviderText(payload);
    if(text)return{text,model:payload?.model||model,payload};
    // Only provider metadata is logged. Never log messages, prompts, or secrets.
    console.warn('O2OL AI returned no visible text',{
      ...providerFailureMetadata(payload),attempt:attempt+1,maxOutputTokens:tokenBudget,
    });
    if(attempt===0&&shouldRetryEmptyProviderResponse(payload)){
      tokenBudget=Math.min(6000,Math.max(tokenBudget+600,tokenBudget*2));
      continue;
    }
    throw Object.assign(new Error('The AI could not complete that reply. Please try again.'),{
      status:502,code:'empty_ai_response',
    });
  }
  throw Object.assign(new Error('The AI could not complete that reply. Please try again.'),{
    status:502,code:'empty_ai_response',
  });
}
