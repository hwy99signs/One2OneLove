import test from 'node:test';import assert from 'node:assert/strict';
import { reasonForRejectedInvite } from '../src/lib/inviteRules.js';
test('reject self-invite by verified account',()=>assert.equal(reasonForRejectedInvite({inviterId:'a',inviteeId:'a'}),'self_invite'));
test('reject self-invite by email irrespective of case',()=>assert.equal(reasonForRejectedInvite({inviterEmail:'Alice@example.com',inviteeEmail:'alice@EXAMPLE.com'}),'self_invite'));
test('reject shared verified phone',()=>assert.equal(reasonForRejectedInvite({samePhone:true}),'self_invite'));
test('reject disabled invite code',()=>assert.equal(reasonForRejectedInvite({disabled:true}),'disabled_code'));
test('exclude owner/test identity',()=>assert.equal(reasonForRejectedInvite({excluded:true}),'excluded_identity'));
test('accept independent valid invite',()=>assert.equal(reasonForRejectedInvite({inviterId:'a',inviteeId:'b'}),null));
test('qualified status requires pending and verified',()=>{
 const qualify=(status,emailVerified)=>status==='pending'&&emailVerified;
 assert.equal(qualify('pending',true),true);assert.equal(qualify('pending',false),false);assert.equal(qualify('qualified',true),false);
});
