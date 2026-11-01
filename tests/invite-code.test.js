import test from 'node:test';import assert from 'node:assert/strict';
import { generateInviteCode,INVITE_CODE_PATTERN } from '../src/lib/inviteRules.js';
test('codes are 7 characters with no ambiguous symbols',()=>{
 for(let i=0;i<200;i++){const bytes=Uint8Array.from({length:7},(_,j)=>(i+j*17)%256);
  const code=generateInviteCode(bytes);assert.match(code,INVITE_CODE_PATTERN);
  assert.doesNotMatch(code,/[01IO]/);
 }
});
test('code maker rejects insufficient entropy input',()=>assert.throws(()=>generateInviteCode(new Uint8Array(2))));
test('retry strategy can find a unique code after collisions',()=>{
 const used=new Set(['AAAAAAA','BBBBBBB']),candidates=[new Uint8Array(7).fill(0),new Uint8Array(7).fill(1),new Uint8Array(7).fill(2)];
 const chosen=candidates.map(generateInviteCode).find(code=>!used.has(code));
 assert.match(chosen,INVITE_CODE_PATTERN);assert.notEqual(chosen,'AAAAAAA');assert.notEqual(chosen,'BBBBBBB');
});
