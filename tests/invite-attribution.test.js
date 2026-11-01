import test from 'node:test';import assert from 'node:assert/strict';
import { chooseInviteAttribution } from '../src/lib/inviteRules.js';
const source={code:null,game:'pests',source:'games_site'},personal={code:'ABCDEFG',game:'scrabluko',source:'invite_link'};
test('first personal code wins subsequent personal code',()=>assert.equal(chooseInviteAttribution(personal,{...personal,code:'HIJKLMN'}),personal));
test('personal invite overrides source-only attribution',()=>assert.equal(chooseInviteAttribution(source,personal),personal));
test('games site cannot replace a personal code',()=>assert.equal(chooseInviteAttribution(personal,source),personal));
test('first games-site source wins when no personal code',()=>assert.equal(chooseInviteAttribution(source,{...source,game:'scratch'}),source));
