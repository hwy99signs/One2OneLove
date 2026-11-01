import test from 'node:test';import assert from 'node:assert/strict';
import {INVITE_REWARD_CONFIG,grantInviteReward} from '../worker/invite-config.js';
test('default rewards are disabled and credit amounts zero',()=>{assert.equal(INVITE_REWARD_CONFIG.enabled,false);assert.equal(INVITE_REWARD_CONFIG.creditCents,0)});
test('disabled mode performs no database writes',async()=>{let writes=0;const db={query(){writes++}};assert.deepEqual(await grantInviteReward(db,{id:'ref1'}),{granted:false,reason:'disabled'});assert.equal(writes,0)});
test('enabled mode fails safely instead of granting unapproved credits',async()=>{await assert.rejects(()=>grantInviteReward({query(){}},{id:'ref1'},{enabled:true,kind:'credit_cents',creditCents:500}),/owner_approved_grant_service/)});
