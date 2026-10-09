// @ts-nocheck

export function countCharacters(value){
  return Array.from(String(value||'')).length;
}
export function openAiUsage(payload){
  const usage=payload?.usage||{};
  return {
    inputUnits:Number(usage.input_tokens||0),
    outputUnits:Number(usage.output_tokens||0),
    cachedInputUnits:Number(usage.input_tokens_details?.cached_tokens||usage.input_tokens_details?.cached_input_tokens||0),
  };
}
function numericEnv(env,key,fallback){
  const n=Number(env?.[key]);
  return Number.isFinite(n)&&n>=0?n:fallback;
}
export function estimateOpenAICostMicros(env,model,usage){
  const m=String(model||'').toLowerCase();
  let inputPerMillion=0,outputPerMillion=0,cachedPerMillion=0;
  if(m.includes('gpt-5-mini')){
    inputPerMillion=numericEnv(env,'OPENAI_GPT5_MINI_INPUT_USD_PER_MILLION',0.25);
    cachedPerMillion=numericEnv(env,'OPENAI_GPT5_MINI_CACHED_INPUT_USD_PER_MILLION',0.025);
    outputPerMillion=numericEnv(env,'OPENAI_GPT5_MINI_OUTPUT_USD_PER_MILLION',2.0);
  }else{
    inputPerMillion=numericEnv(env,'OPENAI_DEFAULT_INPUT_USD_PER_MILLION',0);
    cachedPerMillion=numericEnv(env,'OPENAI_DEFAULT_CACHED_INPUT_USD_PER_MILLION',0);
    outputPerMillion=numericEnv(env,'OPENAI_DEFAULT_OUTPUT_USD_PER_MILLION',0);
  }
  const input=Math.max(0,Number(usage?.inputUnits||0));
  const cached=Math.min(input,Math.max(0,Number(usage?.cachedInputUnits||0)));
  const uncached=Math.max(0,input-cached);
  const output=Math.max(0,Number(usage?.outputUnits||0));
  // USD per million tokens converts numerically to microdollars per token.
  return Math.round(uncached*inputPerMillion+cached*cachedPerMillion+output*outputPerMillion);
}
async function activeCalibrationSession(db,userId,featureCode){
  if(!userId)return null;
  const row=(await db.query(
    `SELECT id,feature_code FROM public.o2ol_calibration_sessions
      WHERE user_id=$1::uuid AND ended_at IS NULL
        AND (feature_code=$2 OR feature_code='all')
      ORDER BY started_at DESC LIMIT 1`,
    [userId,String(featureCode||'')],
  )).rows[0];
  return row||null;
}
export async function recordCostEvent(db,env,{
  userId=null,
  featureCode,
  provider,
  providerProduct=null,
  providerRequestId=null,
  walletTransactionId=null,
  inputCharacters=0,
  outputCharacters=0,
  contextCharacters=0,
  providerInputUnits=0,
  providerOutputUnits=0,
  providerCachedInputUnits=0,
  providerCostMicros=null,
  customerTokensCharged=0,
  customerValueCents=null,
  calibrationSessionId=null,
  metadata={},
}){
  let sessionId=calibrationSessionId;
  if(!sessionId&&userId){
    const active=await activeCalibrationSession(db,userId,featureCode);
    sessionId=active?.id||null;
  }
  return (await db.query(
    `INSERT INTO public.o2ol_cost_events
      (user_id,calibration_session_id,feature_code,provider,provider_product,provider_request_id,
       wallet_transaction_id,input_characters,output_characters,context_characters,
       provider_input_units,provider_output_units,provider_cached_input_units,provider_cost_micros,
       customer_tokens_charged,customer_value_cents,metadata)
     VALUES($1::uuid,$2::uuid,$3,$4,$5,$6,$7::uuid,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb)
     RETURNING *`,
    [
      userId,sessionId,featureCode,provider,providerProduct,providerRequestId,walletTransactionId,
      Math.max(0,Number(inputCharacters)||0),Math.max(0,Number(outputCharacters)||0),Math.max(0,Number(contextCharacters)||0),
      Math.max(0,Number(providerInputUnits)||0),Math.max(0,Number(providerOutputUnits)||0),Math.max(0,Number(providerCachedInputUnits)||0),
      providerCostMicros==null?null:Math.max(0,Math.round(Number(providerCostMicros)||0)),
      Math.max(0,Number(customerTokensCharged)||0),customerValueCents==null?null:Number(customerValueCents),
      JSON.stringify(metadata||{}),
    ],
  )).rows[0];
}

export async function recordOpenAICostEvent(db,env,{
  userId,featureCode,payload,model,inputText='',outputText='',contextText='',
  walletTransactionId=null,customerTokensCharged=0,metadata={},
}){
  const usage=openAiUsage(payload);
  const resolvedModel=payload?.model||model||'unknown';
  const costMicros=estimateOpenAICostMicros(env,resolvedModel,usage);
  return recordCostEvent(db,env,{
    userId,featureCode,provider:'openai',providerProduct:resolvedModel,
    providerRequestId:payload?.id||null,walletTransactionId,
    inputCharacters:countCharacters(inputText),outputCharacters:countCharacters(outputText),
    contextCharacters:countCharacters(contextText),
    providerInputUnits:usage.inputUnits,providerOutputUnits:usage.outputUnits,
    providerCachedInputUnits:usage.cachedInputUnits,providerCostMicros:costMicros,
    customerTokensCharged,
    metadata:{...metadata,cost_basis:'provider_usage_x_configured_rate'},
  });
}
