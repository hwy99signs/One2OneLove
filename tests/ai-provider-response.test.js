import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COACH_OUTPUT_TOKEN_BUDGETS,extractProviderText,providerReasoningOptions,
  shouldRetryEmptyProviderResponse,requestProviderText
} from '../worker/ai-provider-response.js';

const success=text=>({status:'completed',model:'gpt-5-mini',output:[{type:'message',content:[{type:'output_text',text}]}]});
const exhausted={status:'incomplete',incomplete_details:{reason:'max_output_tokens'},model:'gpt-5-mini',
  usage:{output_tokens:1100,output_tokens_details:{reasoning_tokens:1100}},output:[{type:'reasoning'}]};
function mockResponse(body,status=200){return{ok:status>=200&&status<300,status,async json(){return body}}}

test('all reply lengths leave visible-answer headroom',()=>{
  assert.ok(COACH_OUTPUT_TOKEN_BUDGETS.short>=1000);
  assert.ok(COACH_OUTPUT_TOKEN_BUDGETS.medium>COACH_OUTPUT_TOKEN_BUDGETS.short);
  assert.ok(COACH_OUTPUT_TOKEN_BUDGETS.long>COACH_OUTPUT_TOKEN_BUDGETS.medium);
});
test('Responses API raw output extraction accepts message content and shorthand',()=>{
  assert.equal(extractProviderText(success('A useful answer.')),'A useful answer.');
  assert.equal(extractProviderText({output_text:'  Hello  '}),'Hello');
  assert.equal(extractProviderText(exhausted),'');
  assert.equal(extractProviderText({output:null}),'');
});
test('reasoning effort low is only sent for supported GPT-5 models',()=>{
  assert.deepEqual(providerReasoningOptions('gpt-5-mini'),{reasoning:{effort:'low'}});
  assert.deepEqual(providerReasoningOptions('gpt-4o-mini'),{});
});
test('retry only on budget exhaustion or completed empty response, not refusals',()=>{
  assert.equal(shouldRetryEmptyProviderResponse(exhausted),true);
  assert.equal(shouldRetryEmptyProviderResponse({status:'completed',output:[]}),true);
  assert.equal(shouldRetryEmptyProviderResponse({status:'incomplete',incomplete_details:{reason:'content_filter'}}),false);
  assert.equal(shouldRetryEmptyProviderResponse({status:'completed',output:[{content:[{type:'refusal',refusal:'no'}]}]}),false);
});
test('reasoning-only response retries once and delivers visible answer with no duplicate delivery',async()=>{
  const oldFetch=globalThis.fetch,oldWarn=console.warn,calls=[];
  try{
    globalThis.fetch=async(url,options)=>{
      calls.push({url,headers:options.headers,body:JSON.parse(options.body)});
      return calls.length===1?mockResponse(exhausted):mockResponse(success('Here is the reply.'));
    };
    console.warn=()=>{};
    const result=await requestProviderText({OPENAI_API_KEY:'unit-test-secret'},{
      instructions:'test system',input:'test input',maxOutputTokens:COACH_OUTPUT_TOKEN_BUDGETS.short
    });
    assert.equal(result.text,'Here is the reply.');
    assert.equal(calls.length,2);
    assert.equal(calls[0].body.max_output_tokens,1100);
    assert.equal(calls[1].body.max_output_tokens,2200);
    assert.equal(calls[0].body.reasoning.effort,'low');
    assert.equal(calls[0].body.store,false);
    assert.equal(calls[1].body.input,'test input');
  }finally{globalThis.fetch=oldFetch;console.warn=oldWarn}
});
test('failed provider HTTP response is not retried or treated as a valid answer',async()=>{
  const original=globalThis.fetch;let calls=0;
  try{
    globalThis.fetch=async()=>{calls++;return mockResponse({error:{message:'Provider rejected request'}},429)};
    await assert.rejects(requestProviderText({OPENAI_API_KEY:'unit-test-secret'},
      {instructions:'system',input:'message',maxOutputTokens:1100}),e=>e.code==='ai_provider_error');
    assert.equal(calls,1);
  }finally{globalThis.fetch=original}
});
test('empty completed response is retried only once; never passes empty text to billing',async()=>{
  const original=globalThis.fetch,originalWarn=console.warn;let calls=0;
  try{
    globalThis.fetch=async()=>{calls++;return mockResponse({status:'completed',output:[]})};
    console.warn=()=>{};
    await assert.rejects(requestProviderText({OPENAI_API_KEY:'unit-test-secret'},
      {instructions:'system',input:'message',maxOutputTokens:1100}),e=>e.code==='empty_ai_response');
    assert.equal(calls,2);
  }finally{globalThis.fetch=original;console.warn=originalWarn}
});
test('missing AI key fails before external requests',async()=>{
  const oldFetch=globalThis.fetch;let calls=0;
  try{
    globalThis.fetch=async()=>{calls++;throw Error('must not call')};
    await assert.rejects(requestProviderText({},{instructions:'x',input:'y',maxOutputTokens:1100}),e=>e.code==='ai_not_configured');
    assert.equal(calls,0);
  }finally{globalThis.fetch=oldFetch}
});

// Regression guard: a persona must never bypass the reasoning-budget-aware adapter.
test('The coaching persona uses the shared response adapter',async()=>{
  const {readFileSync}=await import('node:fs');
  for(const path of ['../worker/ai.ts']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(source,/requestProviderText\(env,options,/);
    assert.match(source,/maxOutputTokens:COACH_OUTPUT_TOKEN_BUDGETS\.short/);
    assert.doesNotMatch(source,/new Error\('AI provider returned no text\.'\)/);
  }
});
