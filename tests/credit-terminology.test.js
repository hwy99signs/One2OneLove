import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const legacy=/\b(?:token|tokens|jeton|jetons)\b/i;

test('Privacy Policy is Credit-only in all five languages',()=>{
 const s=source('src/pages/PrivacyPolicy.jsx');
 assert.equal(legacy.test(s),false,'Privacy Policy still mentions a retired unit');
 for(const word of ['Credit','Crédito','Crédit','Credito'])assert.ok(s.includes(word));
});
test('Terms of Service never describe the retired unit',()=>{
 for(const lang of ['en','es','fr','it','de']){
  const s=source('src/content/terms/'+lang+'.js');
  assert.equal(legacy.test(s),false,'Terms of Service: '+lang);
 }
});
test('Help Center no longer advises buying legacy units',()=>{
 const s=source('src/pages/HelpCenter.jsx');
 assert.equal(/\bjetons?\b/i.test(s),false);
});
test('Admin customer-facing strings and API failure messages are Credit-only',()=>{
 const admin=source('src/pages/TokenSystemDashboard.jsx');
 assert.equal(/\bTokens<\/option>| Tokens<\/option>| Token.*left/.test(admin),false);
 const a=source('worker/token-admin.ts');
 const b=source('worker/o2ol-tokens.ts');
 assert.equal(/new Error\(['"]Token |return fail\(['"]Token |'Unable to process token request\.'/i.test(a+b),false);
});
test('Legacy URLs safely forward to Credit-based pages',()=>{
 const src=source('src/pages/index.jsx');
 assert.ok(src.includes('path="/CreditSystemDashboard"'));
 assert.ok(src.includes('path="/TokenSystemDashboard" element={<Navigate to="/CreditSystemDashboard" replace />}'));
 assert.ok(src.includes('path="/Tokens" element={<Navigate to="/Credit" replace />}'));
});
